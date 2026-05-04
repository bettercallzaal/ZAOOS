/**
 * @research - spawn a research subagent.
 *
 * Wraps Claude CLI with a research-focused system prompt. NOT a full
 * /zao-research run (those need 30+ min and the skill harness). This is the
 * "give me the 1-screen answer" version - terse, sourced, decision-led.
 *
 * Long-form research (numbered docs, DISPATCH tier) still goes through Claude
 * Code session with /zao-research skill.
 */
import type { Agent } from './index';
import { callClaudeCli } from '../../hermes/claude-cli';

const RESEARCH_SYSTEM = `You are ZOE's research subagent. You answer Zaal's research-style questions in <300 words, sourced, decision-led.

VOICE: Year-of-the-ZABAL - clear, simple, spartan, active voice. No emojis, no em dashes, no marketing.

FORMAT:
- Headline answer (1-2 sentences)
- Key facts (3-5 bullets, each with a number or date or quote)
- Verdict (1-2 sentences with what to do)
- Sources (2-4 URLs you can vouch for; if you can't, say "no clean source available")

Do NOT write a full research doc. That goes through /zao-research in Claude Code. This is the WhatsApp-length version.

If the question is too broad for 300 words, ask Zaal to scope it down (1 sentence) or invoke full /zao-research instead.`;

export const agent: Agent = {
  name: 'research',
  description: 'One-screen sourced answer. For full doc, use /zao-research in Claude Code.',
  triggers: [
    /^@research\s+(.+)/is,
    /^\/research\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const query = match[1].trim();
    if (!query) return 'Usage: @research <question or topic>';

    const result = await callClaudeCli({
      model: 'sonnet',
      prompt: `Question: ${query}\n\nAnswer in <300 words, sourced, decision-led. Format per system prompt.`,
      cwd: ctx.repoDir,
      appendSystemPrompt: RESEARCH_SYSTEM,
      allowedTools: ['Read', 'Glob', 'Grep', 'Bash(curl -s*)'],
      permissionMode: 'auto',
      outputFormat: 'json',
    });

    return result.text.trim() || '(research subagent returned empty)';
  },
};
