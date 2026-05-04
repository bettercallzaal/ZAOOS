/**
 * @newsletter - draft a Year-of-the-ZABAL newsletter post in Zaal's voice.
 *
 * Pulls voice rules from bot/src/zoe/brand.md. Returns a single newsletter
 * draft (250-400 words) with optional title alts. Zaal copies into Substack /
 * Beehiiv / Paragraph / wherever.
 */
import type { Agent } from './index';
import { callClaudeCli } from '../../hermes/claude-cli';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const NEWSLETTER_SYSTEM = `You are ZOE's newsletter drafter. You write Year-of-the-ZABAL newsletter posts in Zaal Panthaki's voice.

VOICE: clear, simple, spartan, active. No emojis, no em dashes, no marketing words. Short paragraphs (max 2 sentences). Blank lines between.

STRUCTURE:
1. Title - 5-9 words, hook on tension or specific fact
2. Opening - 2-3 sentences. Lead with what happened or what changed.
3. Body - 3-5 short paragraphs. One idea per paragraph. Concrete examples.
4. Close - 1-2 sentences. The thing Zaal wants the reader to do or consider.
5. Three alternate titles (after a "---" divider) so Zaal can pick.

Length: 250-400 words for the body, not counting titles.

Brand glossary: WaveWarZ, COC Concertz, The ZAO, BetterCallZaal, ZABAL, SANG, ZOE, ZOLs, FISHBOWLZ, Joseph Goats, SongJam, Stilo World, Tom Fellenz, Thy Revolution, ArDrive. Use exact spellings.

NEVER use: leveraging, synergize, unlock value, ecosystem of solutions, paradigm shift, game-changer.`;

export const agent: Agent = {
  name: 'newsletter',
  description: 'Draft a 250-400 word newsletter post in Year-of-the-ZABAL voice.',
  triggers: [
    /^@newsletter\s+(.+)/is,
    /^\/newsletter\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const topic = match[1].trim();
    if (!topic) return 'Usage: @newsletter <topic or angle in 1-2 sentences>';

    // Best-effort load brand.md as additional voice anchor
    let brandRef = '';
    try {
      const path = join(ctx.repoDir, 'bot/src/zoe/brand.md');
      const raw = await fs.readFile(path, 'utf8');
      brandRef = `\n\nBrand voice file (live):\n${raw.slice(0, 2000)}`;
    } catch {
      brandRef = '';
    }

    const result = await callClaudeCli({
      model: 'sonnet',
      prompt: `Topic / angle: ${topic}\n\nDraft the newsletter post per the structure in the system prompt. End with three alternate titles after a "---" divider.${brandRef}`,
      cwd: ctx.repoDir,
      appendSystemPrompt: NEWSLETTER_SYSTEM,
      allowedTools: ['Read', 'Glob', 'Grep'],
      permissionMode: 'auto',
      outputFormat: 'json',
    });

    return result.text.trim() || '(newsletter subagent returned empty)';
  },
};
