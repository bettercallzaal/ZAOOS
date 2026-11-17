/** Runtime storage for Zaal-approved worker and ZOE learnings. */
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function zoeHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}

function learningsDir(home = zoeHome()): string {
  return join(home, 'learnings');
}

function learningsPath(target: string, home = zoeHome()): string {
  // Restrict learning targets to safe filenames before using them in a path.
  const safe = target.replace(/[^a-z0-9_-]/gi, '_');
  return join(learningsDir(home), `${safe}.md`);
}

/**
 * Cap learnings before they are injected into a prompt. Keep the latest
 * approved bullets, remove duplicates, and bound total prompt growth.
 */
export const MAX_LEARNING_LINES = Math.max(1, Number(process.env.ZOE_MAX_LEARNING_LINES ?? 30));
export const MAX_LEARNING_CHARS = Math.max(200, Number(process.env.ZOE_MAX_LEARNING_CHARS ?? 4000));

export function capLearnings(
  raw: string,
  maxLines: number = MAX_LEARNING_LINES,
  maxChars: number = MAX_LEARNING_CHARS,
): string {
  if (!raw.trim()) return '';
  const header: string[] = [];
  const bullets: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.trimStart().startsWith('- ')) bullets.push(line);
    else if (bullets.length === 0) header.push(line);
  }
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const bullet of bullets) {
    const key = bullet.replace(/^\s*-\s*(\(\d{4}-\d{2}-\d{2}\))?\s*/, '').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(bullet);
    }
  }
  const kept = deduped.slice(-maxLines);
  let out = [...header, ...kept].join('\n').trim();
  if (out.length > maxChars) {
    out = out.slice(out.length - maxChars);
    const newline = out.indexOf('\n');
    if (newline >= 0) out = out.slice(newline + 1);
  }
  return out;
}

export async function readLearnings(target: string, home?: string): Promise<string> {
  try {
    return capLearnings(await fs.readFile(learningsPath(target, home), 'utf8'));
  } catch {
    return '';
  }
}

export async function appendApprovedLearning(target: string, learning: string, home?: string): Promise<string> {
  const directory = learningsDir(home);
  await fs.mkdir(directory, { recursive: true });
  const line = `- (${new Date().toISOString().slice(0, 10)}) ${learning}`;
  const path = learningsPath(target, home);
  const temp = `${path}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  let existing = '';
  try {
    existing = await fs.readFile(path, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    existing = `# Learnings for ${target}\n\nAppended by ZOE's learning loop after Zaal approval.\n`;
  }
  try {
    await fs.writeFile(temp, `${existing.trimEnd()}\n${line}\n`, { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temp, path);
  } catch (err) {
    await fs.unlink(temp).catch(() => {});
    throw err;
  }
  return line;
}
