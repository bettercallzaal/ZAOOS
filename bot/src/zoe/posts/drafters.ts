// Post slate v1 - per-category Claude CLI drafter.
// Each drafter takes the source snapshot and returns one post draft string.
// Uses the Hermes pattern (claude CLI subprocess via Max plan auth).

import { callClaudeCli } from '../../hermes/claude-cli';
import type { PostCategory, PostDraft, PostSourceSnapshot } from './types';

const SHARED_VOICE = `You are ZOE drafting a social post in Zaal's voice.

VOICE RULES (non-negotiable):
- Year-of-the-ZABAL tone: clear, simple, spartan, active voice.
- No emojis, no em dashes, no marketing-speak ("game-changer", "unlock", etc).
- 1-3 short lines. Hard cap 280 chars (one X tweet).
- First person where natural. "I shipped X" beats "ZAO shipped X" for build posts.
- Brand spellings exact: WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Hurric4n3ike, candytoybox.
- Channel: Firefly (FC+X cross-post). No platform-specific syntax.

OUTPUT: only the post text. No surrounding quotes, no commentary, no labels.`;

const CATEGORY_PROMPT: Record<PostCategory, string> = {
  build: `Draft a build-in-public post about today's shipping.
Sources (last 24h commits + open PRs):
{SOURCE}
Pick the 1-2 most-interesting items. Lead with the verb. End with the URL or PR number if there is one. If sources are empty, output "(skip)".`,
  ecosystem: `Draft a ZAO ecosystem signal post about community activity in the last 7 days.
Sources (recent ZAOOS repo activity as proxy for ecosystem momentum):
{SOURCE}
Highlight one concrete signal: a new research doc landing, a community member's project, a brand shipping. Frame it as ZAO momentum, not personal momentum. If sources are empty, output "(skip)".`,
  event: `Draft a calendar/event promo post for today or tomorrow.
Sources:
{SOURCE}
Pick one event. Tell people what + when + how to join. Invite them in. If sources are empty, output "(skip)".`,
  personal: `Draft a personal/voice post in Zaal's voice from his recent voice memos.
Sources (recent voice memos, newest last):
{SOURCE}
Pull one thread, expand it to 1-3 lines. Keep his exact phrasings where possible. If sources are empty, output "(skip)".`,
};

export async function draftPost(
  category: PostCategory,
  snapshot: PostSourceSnapshot,
  opts: { cwd: string; model?: 'sonnet' | 'haiku' | 'opus' } = { cwd: process.cwd() },
): Promise<PostDraft> {
  const sourceBlock = formatSourceBlock(category, snapshot);
  const userPrompt = CATEGORY_PROMPT[category].replace('{SOURCE}', sourceBlock);

  const model = opts.model ?? 'haiku';
  const result = await callClaudeCli({
    model,
    prompt: userPrompt,
    cwd: opts.cwd,
    appendSystemPrompt: SHARED_VOICE,
    permissionMode: 'auto',
    bare: false,
  });

  return {
    category,
    text: result.text.trim(),
    meta: {
      sources: extractSourceLabels(category, snapshot),
      draftedAt: new Date().toISOString(),
      model,
    },
  };
}

function formatSourceBlock(category: PostCategory, s: PostSourceSnapshot): string {
  switch (category) {
    case 'build': {
      const commits = s.build.recentCommits.length
        ? s.build.recentCommits.map((c) => `- ${c}`).join('\n')
        : '(no commits in 24h)';
      const prs = s.build.openPrs.length
        ? s.build.openPrs.map((p) => `- #${p.number} ${p.title}`).join('\n')
        : '(no open PRs)';
      return `COMMITS (24h):\n${commits}\n\nOPEN PRS:\n${prs}`;
    }
    case 'ecosystem':
      return s.ecosystem.repoActivity.length
        ? s.ecosystem.repoActivity.map((c) => `- ${c}`).join('\n')
        : '(no repo activity in 7 days)';
    case 'event': {
      const today = s.event.todaysEvents.length
        ? s.event.todaysEvents.map((e) => `- TODAY: ${e}`).join('\n')
        : '';
      const tomorrow = s.event.tomorrowsEvents.length
        ? s.event.tomorrowsEvents.map((e) => `- TOMORROW: ${e}`).join('\n')
        : '';
      const combined = [today, tomorrow].filter(Boolean).join('\n');
      return combined || '(no events seeded)';
    }
    case 'personal':
      return s.personal.voiceMemos.length
        ? s.personal.voiceMemos.slice(-8).join('\n')
        : '(no voice memos)';
  }
}

function extractSourceLabels(category: PostCategory, s: PostSourceSnapshot): string[] {
  switch (category) {
    case 'build':
      return [`commits=${s.build.recentCommits.length}`, `prs=${s.build.openPrs.length}`];
    case 'ecosystem':
      return [`repo-activity=${s.ecosystem.repoActivity.length}`];
    case 'event':
      return [
        `today=${s.event.todaysEvents.length}`,
        `tomorrow=${s.event.tomorrowsEvents.length}`,
      ];
    case 'personal':
      return [`voice-memos=${s.personal.voiceMemos.length}`];
  }
}
