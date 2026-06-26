// resume.ts - capture a resume/bio credential Zaal mentions (by voice or text),
// structure it, append to a growing resume file, and file it into the Bonfire
// graph so every agent + the website/bio work can recall it.
//
// Trigger: the /resume (or /cv) command, or a voice/text message that starts with
// "resume" / "add to my resume" (routed from the voice + text handlers).
import { callClaudeCli } from '../hermes/claude-cli';
import { remember } from './recall';
import { ZOE_PATHS } from './memory';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const RESUME_FILE = join(ZOE_PATHS.home, 'resume.md');

/** Strip a leading "resume:"/"add to my resume"/"/resume" trigger from free text. */
export function stripResumeTrigger(text: string): string {
  return text
    .replace(/^\/(resume|cv)(@\S+)?\s*/i, '')
    .replace(/^(add (this )?to (my )?resume|for my resume|resume)[:,\s-]+/i, '')
    .trim();
}

/** True if a free-text/voice message looks like a resume capture request. */
export function looksLikeResume(text: string): boolean {
  return /^(add (this )?to (my )?resume|for my resume|resume[:,])/i.test(text.trim());
}

export async function captureResume(rawText: string): Promise<string> {
  const text = stripResumeTrigger(rawText);
  if (!text) {
    return 'Tell me what to add, e.g. "/resume Eagle Scout, earned 2010" or a voice note: "add to my resume that I am a National Ski Patroller".';
  }

  const prompt = `Turn Zaal's note into ONE clean resume/bio credential line. Note: "${text}"

Output EXACTLY one markdown line, no preamble, no emojis, no em dashes:
- **<title>** (<type: award | membership | certification | role | achievement>, <year or "ongoing">) - <one factual line: what it is + why it matters>

Rules: stay factual, do not invent specifics not in the note. If the note only adds context to an existing credential, still output the single enriched line.`;

  let line = `- ${text}`;
  try {
    const r = await callClaudeCli({ model: 'haiku', prompt, outputFormat: 'text' });
    const t = (r.text || '').trim();
    if (t.startsWith('-')) line = t;
    else if (t) line = `- ${t}`;
  } catch {
    /* fall back to the raw note */
  }

  await fs.mkdir(ZOE_PATHS.home, { recursive: true });
  const exists = await fs
    .access(RESUME_FILE)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await fs.writeFile(RESUME_FILE, '# Zaal Panthaki - resume / credentials\n\n', 'utf8');
  }
  await fs.appendFile(RESUME_FILE, `${line}\n`, 'utf8');

  await remember({
    body: `Zaal resume credential: ${line.replace(/^- /, '')}`,
    name: `zaal-resume:${line.slice(0, 48).replace(/[^A-Za-z0-9]+/g, '-')}`,
    sourceTag: 'zaal-resume',
  }).catch(() => {});

  return `Added to your resume + the graph:\n${line}\n\nReply with more detail to enrich it.`;
}
