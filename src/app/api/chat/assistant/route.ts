import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { ENV } from '@/lib/env';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';

const AssistantSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).min(1),
});

interface KnowledgeDoc {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  related: string[];
}

interface KnowledgeGraph {
  docs: KnowledgeDoc[];
}

// In-memory cache — avoids disk reads on every request
let knowledgeCache: KnowledgeGraph | null = null;

async function loadKnowledge(): Promise<KnowledgeGraph | null> {
  if (knowledgeCache) return knowledgeCache;
  try {
    const graphPath = path.join(process.cwd(), 'research', '_graph', 'KNOWLEDGE.json');
    const raw = await fs.readFile(graphPath, 'utf-8');
    knowledgeCache = JSON.parse(raw) as KnowledgeGraph;
    return knowledgeCache;
  } catch {
    return null;
  }
}

function findRelevantDocs(query: string, knowledge: KnowledgeGraph): string {
  if (!knowledge.docs?.length) return '';

  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return '';

  const scored = knowledge.docs
    .map(doc => {
      let score = 0;
      const searchable = `${doc.title} ${doc.tags.join(' ')} ${doc.summary}`.toLowerCase();
      for (const word of words) {
        if (searchable.includes(word)) score++;
      }
      // Boost canonical / important docs
      if (doc.tags.includes('canonical')) score += 2;
      return { doc, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  if (scored.length === 0) return '';

  return scored
    .map(s => `[Doc ${s.doc.id}: ${s.doc.title}] ${s.doc.summary} (Tags: ${s.doc.tags.join(', ')})`)
    .join('\n');
}

const SYSTEM_PROMPT = `You are the ZAO Assistant — the AI helper for THE ZAO, a decentralized music community built on Farcaster.

About THE ZAO:
- A gated Farcaster social client for ZTalent Artist Organization
- Built with Next.js 16 + React 19, Supabase, Neynar, XMTP
- 40+ members, focused on music artist sovereignty and community governance
- Features: audio rooms (Stream.io + 100ms), music player (9 platforms), DJ mode, multiplatform broadcast (YouTube/Twitch/Kick/Facebook), Respect-based governance, cross-platform publishing

You have access to 197 research documents covering every aspect of the project. When relevant docs are found, they'll be included in the context below.

Rules:
- Be concise and direct — no fluff
- Reference specific doc numbers when citing research (e.g., "Doc 043 covers...")
- If asked about code, reference file paths (e.g., src/components/spaces/)
- If you don't know something, say so — don't make things up
- Use the ZAO dark theme personality: helpful, knowledgeable, music-focused`;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AssistantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    if (!ENV.MINIMAX_API_KEY) {
      return NextResponse.json({ error: 'Minimax not configured' }, { status: 503 });
    }

    // Load knowledge graph and find relevant docs for last user message
    const knowledge = await loadKnowledge();
    const lastUserMessage = parsed.data.messages.filter(m => m.role === 'user').pop()?.content || '';
    const relevantDocs = knowledge ? findRelevantDocs(lastUserMessage, knowledge) : '';

    // Build system prompt, injecting relevant doc context when available
    let systemContent = SYSTEM_PROMPT;
    if (relevantDocs) {
      systemContent += `\n\nRelevant research docs for this question:\n${relevantDocs}`;
    }

    const apiUrl = ENV.MINIMAX_API_URL || 'https://api.minimax.io/v1/chat/completions';
    const model = ENV.MINIMAX_MODEL || 'MiniMax-M2.7';

    const messages = [
      { role: 'system', content: systemContent },
      ...parsed.data.messages,
    ];

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, max_tokens: 4000 }),
    });

    const text = await res.text();
    if (!res.ok) {
      logger.error('[assistant] Minimax error:', res.status, text);
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { reply: text };
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('[assistant] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
