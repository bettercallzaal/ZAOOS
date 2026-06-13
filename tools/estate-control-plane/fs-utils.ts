import { readdir, stat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out', 'coverage']);

/** Recursively walk `root`, returning absolute paths of files matching `predicate`. */
export async function walk(
  root: string,
  predicate: (relPath: string, name: string) => boolean,
  base = root,
): Promise<string[]> {
  // Infer the Dirent type from the call rather than hand-writing it — the
  // `Awaited<ReturnType<typeof readdir>>` form breaks across @types/node versions
  // (the Buffer/NonSharedBuffer overload split). Missing dir -> empty, not a throw.
  const entries = await readdir(root, { withFileTypes: true }).catch(() => null);
  if (entries === null) return [];
  const out: string[] = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      out.push(...(await walk(join(root, e.name), predicate, base)));
    } else if (e.isFile()) {
      const rel = relative(base, join(root, e.name));
      if (predicate(rel, e.name)) out.push(join(root, e.name));
    }
  }
  return out;
}

/** Count files under `dir` whose name matches `name` (exact) - e.g. route.ts. */
export async function countFilesNamed(dir: string, name: string): Promise<number> {
  return (await walk(dir, (_rel, n) => n === name)).length;
}

/** Count files under `dir` with one of the given extensions. */
export async function countFilesExt(dir: string, exts: string[]): Promise<number> {
  return (await walk(dir, (_rel, n) => exts.some((x) => n.endsWith(x)))).length;
}

/** List immediate subdirectory names of `dir` (non-recursive). */
export async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function readFileSafe(p: string): Promise<string | null> {
  try {
    return await readFile(p, 'utf8');
  } catch {
    return null;
  }
}

/** Count NNN-slug research doc folders (e.g. 836-foo) under researchDir, excluding _archive. */
export async function countResearchDocs(researchDir: string): Promise<number> {
  const categories = await listDirs(researchDir);
  let total = 0;
  for (const cat of categories) {
    if (cat.startsWith('_')) continue; // skip _archive, _graph, _handoffs
    const docs = await listDirs(join(researchDir, cat));
    total += docs.filter((d) => /^\d+-/.test(d)).length;
  }
  return total;
}
