// Post slate v2 - per-category Claude CLI drafter.
// Voice rules ported from ~/.claude/skills/socials/skill.md + Doc 610 ZABAL
// tightening + Doc 558 Anbeeld AI-prose toolkit. Few-shot examples per
// category to teach tone from examples, not rules alone (see Doc 659).

import { callClaudeCli } from '../../hermes/claude-cli';
import type { PostCategory, PostDraft, PostSourceSnapshot } from './types';

const SHARED_VOICE = `You draft a single social post in Zaal's Year-of-the-ZABAL voice. Output channel: Firefly (cross-posts to Farcaster + X simultaneously, so the post must work on both).

ABSOLUTE RULES (any violation = re-write):
- Lead with "ZM." (ZAO Morning - the daily greeting across the ZAO ecosystem). Exception: event-promo posts may skip ZM when it would read awkwardly.
- No emojis. No hashtags. No em dashes. Hyphens only.
- Hard cap 280 characters total.
- Brand spellings exact: WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Hurric4n3ike, candytoybox, Huottoja, Joseph Goats. PR/issue numbers: "PR 533" not "#533".
- NEVER reference work-day times. Zaal has a day job at Jackson Labs. Do not publish "lunch stream at 11:30", "this morning", "today at 10am". Use timeless framing: "had a lunch stream" or drop the time entirely.
- Lowercase casual when it fits the rhythm. "shipped X" beats "Shipped X."
- Contribution over celebration. Name the artifact, the number, the person. Not the vibe.
- One specific number, name, or place per post minimum.

ANTI-PATTERNS (these are LLM tells - strip them):
- No "is coming together", "small pieces clicking into place", "the rhythm is set", "puzzle pieces", "in motion".
- No "the machine", "the work", "the system", "the multi-agent coordination layer" as brand-coded singulars. Name the actual thing.
- No "There is a thing that happens when..." constructions.
- No aphoristic closes. Closing line is a concrete fact or next step, not a koan.
- No parallel-structure 3-beat closes ("X. Y. Then Z.").
- No universal-second-person preachy ("You do not become ready"). Reserve "you" for direct reader address.
- No "loop is clean", "rooms worth being in", "decide you are", "show up" as abstractions.
- No "thrilled to", "humbled to", "excited to", "grateful for" - just say what happened.

EMPTY-SOURCE RULE:
If the source data block is genuinely empty (no commits, no events, no voice memos, no ecosystem activity), output the literal string "(skip)" and nothing else. Better to send nothing than fluff.

OUTPUT: only the post text. No surrounding quotes, no commentary, no labels, no markdown.`;

const BUILD_EXAMPLES = `Examples of good build posts:

"ZM. shipped /voicememo + /vm telegram commands. one-liner thoughts now feed ZOE's personal post drafter. PR 533."

"ZM. dropped paperclipai from VPS - the service had crash-looped 107k times. one less fire."

"ZM. zoe post slate v2 ships persistent confirm flow. every draft sits until you tap POST or SKIP. no more fire-and-forget."`;

const ECOSYSTEM_EXAMPLES = `Examples of good ecosystem posts:

"ZM. cassie validated 4/28 - the ZAOstock infrastructure is the product, the festival is proof. building the rest in public."

"ZM. iman owns cowork-zaodevz now - one tracker across ZAO + WaveWarZ + COC Concertz + BCZ Strategies. 4 brands, one audit log."

"ZM. jadyn violet UVR producer brief locked. iman builds the song next."`;

const EVENT_EXAMPLES = `Examples of good event posts:

"ZAOstock Oct 3 in Ellsworth - franklin st parklet. sign up at zaostock.com."

"monday cobuilds at meet.baserooms.io/zaal - open jam, anyone can drop in."

"POIDH bounty 1151 closes friday - WTM audition format. $25 USDC."`;

const PERSONAL_EXAMPLES = `Examples of good personal posts:

"ZM. realized this week that the ZAO is not the music, the music is the proof of the ZAO. the org is the artifact."

"ZM. iman watching me build imanagent on a video call was the cleanest dev-handoff i've ever done."

"ZM. JANGOUU FOREVER. every project i build now traces back to him."`;

const CATEGORY_PROMPT: Record<PostCategory, string> = {
  build: `Draft a build-in-public post about today's shipping work.

SOURCE DATA (last 24h commits + open PRs):
{SOURCE}

${BUILD_EXAMPLES}

INSTRUCTIONS:
- Pick the SINGLE most-interesting shipping item from sources. Do not list 3 things.
- Lead with the verb + the artifact. "shipped X" not "X is now live".
- If a PR number is relevant, append "PR 123" (no hashtag, no "#") at the end.
- If sources show no real shipping (just docs, just chores), output "(skip)".`,
  ecosystem: `Draft a ZAO ecosystem signal post about community activity.

SOURCE DATA (last 7 days repo activity as proxy for ecosystem momentum):
{SOURCE}

${ECOSYSTEM_EXAMPLES}

INSTRUCTIONS:
- Pick ONE specific signal: a named person, project, doc, or move.
- Frame as ZAO momentum, not personal momentum.
- Never generalize to "the ecosystem" or "the multi-agent layer". Name the thing.
- If sources are thin or all internal-only, output "(skip)".`,
  event: `Draft a calendar/event promo post.

SOURCE DATA:
{SOURCE}

${EVENT_EXAMPLES}

INSTRUCTIONS:
- Pick ONE event from today or tomorrow.
- Lead with the event name + place/link. Skip the work-day time entirely.
- End with how to join.
- If sources are empty, output "(skip)".`,
  personal: `Draft a personal/voice post pulled from Zaal's recent cross-repo GitHub activity (his actual builder narrative across all brands - ZAOOS, songchainnxyz, cowork-zaodevz, bcz-yapz, and 80+ other repos).

SOURCE DATA (last 7 days commits across ALL repos, plus any recent /vm voice memos as override channel):
{SOURCE}

${PERSONAL_EXAMPLES}

INSTRUCTIONS:
- Pick ONE thread that shows what Zaal is actually building this week. Cross-brand patterns are gold ("shipped X on ZAOOS + Y on songchainnxyz = same playbook landing in 2 places").
- Lead with the verb. First person. "I built X" beats "X was built".
- If voice memos exist, prefer them (they are direct Zaal phrasing). Use github commits as backup when memos are empty.
- Frame as builder narrative, not feature changelog. "spent the week wiring zoe to know what i shipped" beats "added GitHub activity source to drafters".
- If BOTH github activity AND voice memos are empty, output "(skip)".`,
};

export async function draftPost(
  category: PostCategory,
  snapshot: PostSourceSnapshot,
  opts: { cwd: string; model?: 'sonnet' | 'haiku' | 'opus' } = { cwd: process.cwd() },
): Promise<PostDraft> {
  const sourceBlock = formatSourceBlock(category, snapshot);
  const userPrompt = CATEGORY_PROMPT[category].replace('{SOURCE}', sourceBlock);

  // Sonnet default (was haiku in v1 - haiku could not internalize 19 voice rules
  // + few-shot examples without losing the actual content). Sonnet handles the
  // prompt budget at ~$0.005 per draft = ~$0.04/day at 7 pings.
  const model = opts.model ?? 'sonnet';
  const result = await callClaudeCli({
    model,
    prompt: userPrompt,
    cwd: opts.cwd,
    appendSystemPrompt: SHARED_VOICE,
    permissionMode: 'default',
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
        ? s.build.openPrs.map((p) => `- PR ${p.number} ${p.title}`).join('\n')
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
    case 'personal': {
      const gh = s.personal.githubActivity.length
        ? `GITHUB ACTIVITY (last 7d, all repos):\n${s.personal.githubActivity.map((c) => `- ${c}`).join('\n')}`
        : '(no github activity in 7 days)';
      const memos = s.personal.voiceMemos.length
        ? `\n\nVOICE MEMOS (newest last):\n${s.personal.voiceMemos.slice(-8).join('\n')}`
        : '';
      return gh + memos;
    }
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
      return [
        `gh-activity=${s.personal.githubActivity.length}`,
        `voice-memos=${s.personal.voiceMemos.length}`,
      ];
  }
}
