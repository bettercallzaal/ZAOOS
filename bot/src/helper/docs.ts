/**
 * docs.ts - the only text the helper knows: the handoff files, read from a
 * plain directory on the host (HELPER_DOCS_DIR). It never fetches them, so the
 * process needs no GitHub credential and survives the files moving repos.
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/** AGENT.md is the brief; the other two are what it answers from. */
export const DOC_FILES = ['AGENT.md', 'README.md', 'WALKTHROUGH.md'] as const;

export interface LoadedDoc {
  name: string;
  text: string;
  sha256: string;
}

/**
 * Read every handoff file or throw. A missing or empty file is a refusal to
 * start, not a helper that answers from less than it was given.
 */
export async function loadDocs(dir: string): Promise<LoadedDoc[]> {
  const docs: LoadedDoc[] = [];
  for (const name of DOC_FILES) {
    const text = await fs.readFile(join(dir, name), 'utf8');
    if (!text.trim()) throw new Error(`${name} in ${dir} is empty`);
    docs.push({ name, text, sha256: createHash('sha256').update(text).digest('hex') });
  }
  return docs;
}

/** The system prompt: the brief first, then each file under its own name. */
export function buildSystemPrompt(docs: readonly LoadedDoc[]): string {
  const brief = docs.find((d) => d.name === 'AGENT.md');
  const rest = docs.filter((d) => d.name !== 'AGENT.md');
  const parts = [
    brief ? brief.text.trim() : '',
    'You have no tools. You cannot open links, read the repository or change anything. ' +
      'Answer only from the files below and from what he tells you in this chat.',
    ...rest.map((d) => `<file name="handoff/${d.name}">\n${d.text.trim()}\n</file>`),
  ];
  return parts.filter(Boolean).join('\n\n');
}
