import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'feedback']),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  page: z.string().max(200),
  browser: z.string().max(200).optional(),
  screenshot: z.string().max(5_000_000).optional(),
});

const LABEL_MAP: Record<string, string> = {
  bug: 'bug',
  feature: 'enhancement',
  feedback: 'feedback',
};

// Simple in-memory rate limit (per FID, 1 per 5 min)
const rateLimitMap = new Map<number, number>();

function getPageLabel(path: string): string {
  const segment = path.split('/').filter(Boolean)[0] || 'general';
  const known = ['fishbowlz', 'music', 'spaces', 'governance', 'social', 'chat', 'messages', 'settings', 'members'];
  return known.includes(segment) ? segment : 'general';
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionData();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const lastSubmit = rateLimitMap.get(session.fid);
    if (lastSubmit && Date.now() - lastSubmit < 5 * 60 * 1000) {
      const waitSec = Math.ceil((5 * 60 * 1000 - (Date.now() - lastSubmit)) / 1000);
      return NextResponse.json({ error: `Please wait ${waitSec}s before submitting again` }, { status: 429 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const { type, title, description, page, browser, screenshot } = parsed.data;

    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_FEEDBACK_REPO || 'zaalpanthaki/zao-os';
    if (!githubToken) {
      console.error('GITHUB_TOKEN not configured');
      return NextResponse.json({ error: 'Feedback system not configured' }, { status: 503 });
    }

    const [owner, repoName] = repo.split('/');
    const octokit = new Octokit({ auth: githubToken });

    const pageLabel = getPageLabel(page);
    const contextBlock = [
      '---',
      `**Page:** \`${page}\``,
      `**Browser:** ${browser || 'Unknown'}`,
      `**User:** @${session.username || 'fid:' + session.fid}`,
      `**Timestamp:** ${new Date().toISOString()}`,
      '---',
    ].join('\n');

    let issueBody = `${description}\n\n${contextBlock}`;

    if (screenshot) {
      issueBody += `\n\n**Screenshot:**\n![screenshot](${screenshot})`;
    }

    issueBody += '\n\n*Submitted via ZAO OS in-app feedback*';

    const labels = ['feedback', LABEL_MAP[type], pageLabel].filter(Boolean);

    const { data: issue } = await octokit.issues.create({
      owner,
      repo: repoName,
      title: `[${type.charAt(0).toUpperCase() + type.slice(1)}] ${title}`,
      body: issueBody,
      labels,
    });

    rateLimitMap.set(session.fid, Date.now());

    return NextResponse.json({ success: true, issueUrl: issue.html_url, issueNumber: issue.number });
  } catch (err) {
    console.error('Feedback submission error:', err);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
