/**
 * Knowledge extraction fan-out (doc 862).
 *
 * After a substantive Zaal turn, fan out 4 cheap Haiku readers that each comb
 * the message for ONE category of fact (people / projects / decisions /
 * commitments) and emit graph-ready episodes. Only high-confidence, de-duped,
 * secret/PII-clean episodes are written to the ZABAL Bonfire via remember().
 *
 * Silent + fire-and-forget: never blocks the reply, never reports to Zaal,
 * never throws. No-op if Bonfire is unconfigured.
 *
 * This is NOT a new bot or a new dispatch path. It is a background extraction
 * layer that turns conversation into durable graph memory. See doc 862.
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { callClaudeCli } from '../hermes/claude-cli';
import { remember, bonfireConfigured } from './recall';

const ZOE_HOME = process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
const SEEN_PATH = join(ZOE_HOME, 'seen-episodes.json');

/** Minimum message length to bother extracting. Short acks carry no facts. */
export const EXTRACT_MIN_LEN = 40;
/** Only write episodes the extractor is at least this sure are literally stated. */
const CONFIDENCE_MIN = 0.7;
/** Cap the rolling dedup store so it never grows unbounded. */
const SEEN_MAX = 2000;
/** Per-extractor wall-clock cap. Extraction is span-tagging, not research. */
const EXTRACT_TIMEOUT_MS = 60_000;
/** Hard cost cap per extractor call. */
const EXTRACT_BUDGET_USD = 0.05;

interface ExtractorSpec {
  key: 'people' | 'projects' | 'decisions' | 'commitments';
  /** What this reader pulls. Injected into its system prompt. */
  target: string;
}

const EXTRACTORS: ExtractorSpec[] = [
  {
    key: 'people',
    target:
      'new humans mentioned, their role, their affiliation, and their relationship to Zaal or the ZAO ecosystem',
  },
  {
    key: 'projects',
    target:
      'products, repos, or initiatives named, with their status or purpose (only what is stated)',
  },
  {
    key: 'decisions',
    target: 'choices Zaal made or locked, together with the stated reason',
  },
  {
    key: 'commitments',
    target:
      'things Zaal said he will do, follow-ups he owes, or due dates he set',
  },
];

interface Candidate {
  name: string;
  body: string;
  confidence: number;
}

/** PII the extractor must never put in a graph episode (third-party leakage). */
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /\+?\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
/** Public ZAO/BCZ emails that are allowed to appear (see pii-hygiene.md). */
const EMAIL_ALLOW = [
  'zaal@thezao.com',
  'zaalp99@gmail.com',
  'zaal@bettercallzaal.com',
  'zoe-zao@agentmail.to',
  'hello@thezao.com',
  'support@thezao.com',
  'info@thezao.com',
];

export function containsPii(body: string): boolean {
  const m = body.match(EMAIL_RE);
  if (m && !EMAIL_ALLOW.includes(m[0].toLowerCase())) return true;
  if (PHONE_RE.test(body)) return true;
  return false;
}

/** Stable 12-char content hash. Same fact -> same hash -> idempotent + dedup. */
export function bodyHash(body: string): string {
  return createHash('sha256')
    .update(body.trim().toLowerCase().replace(/\s+/g, ' '))
    .digest('hex')
    .slice(0, 12);
}

function buildSystemPrompt(spec: ExtractorSpec, today: string): string {
  return [
    `You read a message Zaal sent to his assistant and extract ${spec.target}.`,
    '',
    'Output ONLY a raw JSON array. No prose, no markdown, no code fences.',
    'Each array item is an object:',
    '  {"body": string, "confidence": number}',
    '',
    'Rules:',
    '- Extract ONLY facts literally stated in the message. Never infer, guess, or invent.',
    `- "body" is one self-contained sentence that stands alone: name the who/what, and anchor it with "as of ${today}". A reader with no other context must understand it.`,
    '- "confidence" is 0 to 1: how certain you are the fact is literally stated.',
    '- If the message states no such fact, output exactly [].',
    '- No emojis. No em dashes. No marketing language.',
    '- Do NOT include anyone\'s personal email, phone number, or home address.',
    '',
    'Output the JSON array and nothing else.',
  ].join('\n');
}

/** Defensively pull the first JSON array out of a model response. */
export function parseCandidates(text: string, key: string): Candidate[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: Candidate[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const body = (item as Record<string, unknown>).body;
    const confidence = (item as Record<string, unknown>).confidence;
    if (typeof body !== 'string' || typeof confidence !== 'number') continue;
    const clean = body.trim();
    if (clean.length < 12) continue;
    out.push({
      name: `extract:${key}:${bodyHash(clean)}`,
      body: clean,
      confidence,
    });
  }
  return out;
}

async function loadSeen(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(SEEN_PATH, 'utf8');
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

async function saveSeen(seen: Set<string>): Promise<void> {
  // Keep the most recent SEEN_MAX hashes (insertion order = Set iteration order).
  const arr = [...seen].slice(-SEEN_MAX);
  try {
    await fs.mkdir(ZOE_HOME, { recursive: true });
    await fs.writeFile(SEEN_PATH, JSON.stringify(arr), 'utf8');
  } catch (err) {
    console.warn('[zoe/extractors] could not persist seen-episodes:', (err as Error).message);
  }
}

async function runExtractor(
  spec: ExtractorSpec,
  message: string,
  today: string,
  cwd: string,
): Promise<Candidate[]> {
  const res = await callClaudeCli({
    model: 'haiku',
    prompt: message,
    cwd,
    appendSystemPrompt: buildSystemPrompt(spec, today),
    permissionMode: 'default',
    outputFormat: 'json',
    bare: true,
    timeoutMs: EXTRACT_TIMEOUT_MS,
    maxBudgetUsd: EXTRACT_BUDGET_USD,
  });
  if (res.isError) return [];
  return parseCandidates(res.text, spec.key);
}

export interface FanOutResult {
  written: number;
  skipped: number;
}

/**
 * Fan out the 4 extractors over a Zaal message, write the clean high-confidence
 * facts to the graph. Best-effort: never throws.
 *
 * Caller should gate on scope === 'private' && message.length >= EXTRACT_MIN_LEN
 * before calling, but this function re-checks the length defensively.
 */
export async function fanOutKnowledgeExtractors(
  message: string,
  opts: { cwd: string; today?: string },
): Promise<FanOutResult> {
  if (!bonfireConfigured()) return { written: 0, skipped: 0 };
  const trimmed = message.trim();
  if (trimmed.length < EXTRACT_MIN_LEN) return { written: 0, skipped: 0 };

  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  const settled = await Promise.allSettled(
    EXTRACTORS.map((spec) => runExtractor(spec, trimmed, today, opts.cwd)),
  );

  const candidates: Candidate[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') candidates.push(...s.value);
  }

  const seen = await loadSeen();
  let written = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (c.confidence < CONFIDENCE_MIN) {
      skipped++;
      continue;
    }
    const hash = bodyHash(c.body);
    if (seen.has(hash)) {
      skipped++;
      continue;
    }
    if (containsPii(c.body)) {
      console.warn('[zoe/extractors] skipped episode with PII-shaped content');
      skipped++;
      continue;
    }
    // remember() runs its own secret scan and the actual POST.
    const r = await remember({
      body: c.body,
      name: c.name,
      sourceTag: 'zoe:extract',
    });
    if (r.ok) {
      seen.add(hash);
      written++;
    } else {
      skipped++;
    }
  }

  if (written > 0) await saveSeen(seen);
  return { written, skipped };
}
