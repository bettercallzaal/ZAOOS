import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A repo invariant, not a unit test.
 *
 * `callClaudeCliCapAware` exists so a JUDGMENT/TEXT call survives Claude's
 * weekly cap by running on a non-Claude provider. Its docstring names the
 * callers it is for - critic, recap, reflect, brief, learn, extractors,
 * reflexion - and on 2026-09-11 four of those (learn, decompose, reflexion,
 * task-teammate-ack) plus both post drafters were still calling the raw CLI, so
 * a cap killed the turn outright. The wrapper existed, was tested, and was not
 * wired: a fallback that had only ever agreed with us.
 *
 * The rule this pins: a call that disables tools (`allowedTools: []`) is a text
 * call, a non-Claude model can serve it, and it MUST go through the wrapper.
 * An AGENTIC call (the Hermes coder, workers with Edit/Write) is exempt on
 * purpose - a text provider cannot edit files, so those must defer until the
 * cap resets rather than fall back to a model that cannot do the work.
 */
const SRC = join(__dirname, '..', '..', '..');

// Agentic callers: they hand Claude real tools, so a text fallback cannot serve
// them. Each one is listed deliberately, with why, rather than pattern-matched.
const AGENTIC_EXEMPT = new Set([
  'hermes/coder.ts',        // edits files in a worktree and opens a PR
  'zoe/workers.ts',         // subagent workers with a full tool surface
  'zoe/work-loop.ts',       // drives workers, same reason
  'zoe/concierge.ts',       // has its own inline cap fallback (callModelWithCliRouting)
  'zoe/critics/types.ts',   // routes its own cross-model panel through callCapFallback
  'zoe/resume.ts',          // resumes an agentic session by id
  'zoe/agents/newsletter.ts', // reads the repo to assemble the issue
  'cockpit/cockpit.ts',     // reads the repo for the morning brief
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '__tests__' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

describe('cap-aware coverage', () => {
  it('every tool-disabled Claude caller goes through callClaudeCliCapAware', () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (rel === 'zoe/models/cli-cap-aware.ts' || rel === 'hermes/claude-cli.ts') continue;
      const text = readFileSync(file, 'utf8');
      const raw = text.replace(/callClaudeCliCapAware\(/g, '');
      if (!raw.includes('callClaudeCli(')) continue;
      const toolsDisabled = /allowedTools:\s*\[\s*\]/.test(text);
      if (toolsDisabled && !AGENTIC_EXEMPT.has(rel)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });

  it('the exempt list names only files that still exist and still call the CLI', () => {
    const stale: string[] = [];
    for (const rel of AGENTIC_EXEMPT) {
      let text = '';
      try {
        text = readFileSync(join(SRC, rel), 'utf8');
      } catch {
        stale.push(`${rel} (gone)`);
        continue;
      }
      if (!text.includes('callClaudeCli')) stale.push(`${rel} (no longer calls the CLI)`);
    }
    // An exemption for a file that no longer needs one is an exemption nobody
    // re-read - the defect this whole rail exists to remove.
    expect(stale).toEqual([]);
  });
});
