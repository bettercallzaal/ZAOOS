#!/usr/bin/env node
// Auto-fixer for mechanically-correctable drift: rewrites stale counts in the
// docs to match live repo reality. Only touches count claims (phantom paths and
// stale docs are NOT auto-fixed - those need human judgement). Used by the weekly
// sweep to open a count-fix PR.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EstateConfig } from './types';
import { measureLiveCounts } from './checks/drift';

const __dirname = dirname(fileURLToPath(import.meta.url));
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');

export interface FixResult {
  changed: { file: string; key: string; from: number; to: number }[];
}

/** Rewrite every stale count claim in the configured docs to the live value. */
export async function applyCountFixes(cfg: EstateConfig): Promise<FixResult> {
  const live = await measureLiveCounts(cfg);
  const changed: FixResult['changed'] = [];

  for (const ptr of cfg.docPointers) {
    const full = join(cfg.repoRoot, ptr.file);
    let text: string;
    try {
      text = await readFile(full, 'utf8');
    } catch {
      continue;
    }
    let next = text;
    for (const [key, regex] of Object.entries(ptr.claims)) {
      const actual = live[key];
      if (actual == null) continue;
      next = next.replace(new RegExp(regex, 'g'), (match, num: string) => {
        if (Number(num) !== actual) {
          changed.push({ file: ptr.file, key, from: Number(num), to: actual });
          return match.replace(num, String(actual));
        }
        return match;
      });
    }
    if (next !== text) await writeFile(full, next);
  }
  return { changed };
}

async function loadConfig(): Promise<EstateConfig> {
  const path = arg('config') ?? join(__dirname, 'config.json');
  const cfg = JSON.parse(await readFile(path, 'utf8')) as EstateConfig;
  const raw = arg('repo') ?? process.env.ESTATE_REPO_ROOT ?? cfg.repoRoot;
  cfg.repoRoot = raw === '.' ? resolve(__dirname, '../..') : isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  return cfg;
}

// Run directly (not when imported by tests)
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  loadConfig()
    .then(applyCountFixes)
    .then((res) => {
      if (res.changed.length === 0) {
        console.log('no count drift to fix');
      } else {
        for (const c of res.changed) console.log(`fixed ${c.file}: ${c.key} ${c.from} -> ${c.to}`);
      }
    })
    .catch((e) => {
      console.error('fix-drift fatal:', e);
      process.exit(2);
    });
}
