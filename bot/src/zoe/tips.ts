/**
 * Hourly tips - rotating reminders teaching Zaal how to use ZOE.
 *
 * Pool drawn from bot/src/zoe/USERGUIDE.md. Pulled by scheduler.ts every hour.
 * Idempotent inside the same hour (sentinel keyed on YYYY-MM-DDTHH).
 *
 * Selection: round-robin via a pointer file at ~/.zao/zoe/tip-pointer.txt
 * so Zaal eventually sees every tip rather than RNG repeating one.
 */
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ZOE_PATHS } from './memory';

const POINTER_FILE = join(ZOE_PATHS.home, 'tip-pointer.txt');

export const TIPS: string[] = [
  'Tip: drop "note: <feedback>" any time - lands in a file Claude Code reads next session. No concierge turn, just capture.',
  'Tip: /notes shows your pending Claude Code feedback (last 5). Useful before opening Claude Code.',
  'Tip: free-form questions auto-route by intent. "summarize my open PRs" goes to Sonnet. "should I X or Y" escalates to Opus.',
  'Tip: short factual questions ("what is doc 605") route to Haiku - cheapest, fastest.',
  'Tip: 5am EST you get a morning brief. Commits last 24h + open PRs + top 5 tasks. Idempotent (no double-fire on restart).',
  'Tip: 9pm EST is the evening reflection. 3 questions + captures-from-today gate (per doc 606).',
  'Tip: /tasks shows the open queue. /seed re-seeds the 8 starter tasks if it ever clears.',
  'Tip: I will not send empty pings. The dot pings ("·") are dead - reply guard blocks anything under 5 chars.',
  'Tip: there are no quiet hours. You said "rather get pinged than ignored." Briefs and reflections always fire.',
  'Tip: I never claim memory changes that did not happen (doc 581 lesson). If I say "saved task X" the JSON did change.',
  'Tip: I will never say "would you like me to..." - I just do it. If I asked, file a note: so it gets fixed.',
  'Tip: voice notes coming Phase 2 (LiveKit + Cartesia, post-ZAOstock spinout). Today: type only.',
  'Tip: brand assistant slash commands coming this week: /firefly /youtube /cast /thread /onepager. Drafts in 3 voices.',
  'Tip: dispatcher coming Phase 2: @zaostock <cmd> or @bonfire <query> from this DM and I relay.',
  'Tip: Bonfire trust tiers will be PUBLIC, ZAOSTOCK_TEAM, ZAAL_PRIVATE. I write your DMs to ZAAL_PRIVATE by default.',
  'Tip: stuck? ssh zaal@31.97.148.88 "systemctl --user restart zoe-bot.service" to restart me.',
  'Tip: my source of truth is ~/.zao/zoe/ on VPS 1: persona.md + human.md + recent.json + tasks.json + captures/.',
  'Tip: Granola free tier captures meeting transcripts. Once wired, they auto-appear in the 9pm captures gate.',
  'Tip: Limitless Pendant ($199 + 20h/mo free) is queued for after ZAOstock spinout. Ambient capture without the phone.',
  'Tip: every output you ship - PR, cast, pitch - end with "note: posted X about Y" so I can index it for Bonfire.',
  'Tip: Sunday 10am is your weekly memory review (per doc 606). 10 minutes. Re-validate one stale memory file.',
  'Tip: research docs ship via PR to /research. If you want a doc on something, type "/zao-research <topic>" in Claude Code.',
  'Tip: doc 607 says I am your single dispatcher. ZAOstock team uses @ZAOstockTeamBot directly; ecosystem uses @zabal_bonfire.',
  'Tip: hourly tip cron self-disables once you DM "stop tips". Just send that exact phrase.',
  'Tip: the more you DM me with note: feedback, the better I get next session. There is no token cost on note: capture.',
];

export async function nextTip(): Promise<string> {
  let idx = 0;
  try {
    const raw = await fs.readFile(POINTER_FILE, 'utf8');
    idx = (parseInt(raw.trim(), 10) || 0) % TIPS.length;
  } catch {
    idx = 0;
  }
  const tip = TIPS[idx];
  const next = (idx + 1) % TIPS.length;
  try {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.writeFile(POINTER_FILE, String(next), 'utf8');
  } catch {
    // pointer write failed; tip still goes out
  }
  return tip;
}

const TIPS_DISABLED_FILE = join(ZOE_PATHS.home, 'tips-disabled.flag');

export async function tipsEnabled(): Promise<boolean> {
  try {
    await fs.access(TIPS_DISABLED_FILE);
    return false;
  } catch {
    return true;
  }
}

export async function disableTips(): Promise<void> {
  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  await fs.writeFile(TIPS_DISABLED_FILE, new Date().toISOString(), 'utf8');
}

export async function enableTips(): Promise<void> {
  try {
    await fs.unlink(TIPS_DISABLED_FILE);
  } catch {
    // already enabled
  }
}
