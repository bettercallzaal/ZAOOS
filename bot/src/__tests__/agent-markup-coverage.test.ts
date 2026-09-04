import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// agent-markup.ts says, in its own header: "INSTALL IT ON EVERY BOT IN THIS
// PROCESS TREE... The installer exists so adding a bot cannot miss it." The
// installer alone does not enforce that - it still has to be CALLED, and the
// two bots in src/devz/index.ts were missed for exactly that reason, twice in
// a row (src/index.ts first, then src/zoe/index.ts, then devz).
//
// This is the enforcement. It reads the source rather than importing it,
// because every one of these files is a poller entrypoint: importing it starts
// a live getUpdates loop and collides with the deployed instance
// (.claude/rules/agent-loops.md rule 21).
//
// It is deliberately a structural check on `new Bot(...)`, not a list of known
// files, so the bot somebody adds next month fails this test rather than
// quietly shipping raw <think> to a human.

const SRC = dirname(fileURLToPath(new URL('.', import.meta.url)));

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/** Files that construct a grammy Bot. `new Bot(` and `new Bot<Context>(`. */
function botConstructingFiles(): string[] {
  return tsFiles(SRC).filter((f) => /\bnew\s+Bot\s*(<[^>]*>)?\s*\(/.test(readFileSync(f, 'utf8')));
}

describe('agent markup guard coverage', () => {
  it('finds the bot entrypoints at all - a zero-file scan would pass vacuously', () => {
    expect(botConstructingFiles().length).toBeGreaterThan(0);
  });

  it('installs the guard in every file that constructs a grammy Bot', () => {
    const missing = botConstructingFiles()
      .filter((f) => !readFileSync(f, 'utf8').includes('installAgentMarkupGuard('))
      .map((f) => relative(SRC, f).replace(/\\/g, '/'));

    expect(missing).toEqual([]);
  });

  it('installs it once per Bot constructed in that file', () => {
    for (const file of botConstructingFiles()) {
      const src = readFileSync(file, 'utf8');
      const bots = src.match(/\bnew\s+Bot\s*(<[^>]*>)?\s*\(/g) ?? [];
      // The import names the symbol without a `(`, so it does not count here.
      const installs = (src.match(/installAgentMarkupGuard\(/g) ?? []).length;
      expect(
        installs,
        `${relative(SRC, file).replace(/\\/g, '/')} constructs ${bots.length} bot(s)`,
      ).toBeGreaterThanOrEqual(bots.length);
    }
  });
});
