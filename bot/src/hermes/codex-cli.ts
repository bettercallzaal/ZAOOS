/**
 * Codex CLI wrapper - a headless call to OpenAI's `codex exec`, used as ZOE's
 * cross-FAMILY reviewer (doc 2204): a different model family than the Claude
 * builder, on the flat-rate Codex subscription (no per-call credits, no
 * OpenRouter). Mirrors `claude-cli.ts` but shells to `codex exec`.
 *
 * Design notes:
 *   - `-s read-only` sandbox: the reviewer READS + responds, never edits.
 *   - `-o <file>` writes ONLY the agent's final message, so we parse the
 *     critique JSON cleanly instead of scraping the whole transcript.
 *   - Codex is periodically usage-capped; a cap / auth / spawn failure throws
 *     CodexUnavailableError so the caller (runCritiqueModel) falls back to
 *     same-family Claude - loud, never silent.
 *   - Credited per .claude/rules/credit-attribution.md: cross-family review
 *     pattern from 99darwin/orchestrator (MIT) + the Claude<->Codex pairing in
 *     arxiv 2607.21656.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface CodexCliResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  durationMs: number;
}

/** Codex is unavailable (not installed, usage-capped, not logged in, timed out). */
export class CodexUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodexUnavailableError';
  }
}

function codexBin(): string {
  return process.env.CODEX_BIN || join(process.env.HOME || '/home/zaal', '.local', 'bin', 'codex');
}

/** True if the codex binary is present. Does NOT prove it has capacity (that is
 *  only known at call time - a capped codex still exists on disk). */
export function hasCodexCli(): boolean {
  return existsSync(codexBin());
}

const CAP_OR_AUTH = /usage limit|hit your usage limit|not logged in|please run .*login|quota|insufficient|\b401\b|\b403\b|\b429\b/i;

/**
 * Run one headless Codex critique. Returns the agent's final message text.
 * Throws CodexUnavailableError on cap / auth / spawn / timeout so the caller
 * can fall back to same-family review.
 */
export async function callCodexCli(opts: {
  system: string;
  user: string;
  cwd: string;
  timeoutMs?: number;
  model?: string;
}): Promise<CodexCliResult> {
  const bin = codexBin();
  if (!existsSync(bin)) {
    throw new CodexUnavailableError(`codex CLI not found at ${bin}`);
  }
  const startMs = Date.now();
  const dir = await mkdtemp(join(tmpdir(), 'zoe-codex-'));
  const outFile = join(dir, 'last.txt');
  const prompt = `${opts.system}\n\n${opts.user}`;
  const args = ['exec', '--skip-git-repo-check', '-s', 'read-only', '-o', outFile];
  if (opts.model) args.push('-m', opts.model);
  args.push('-'); // read the prompt from stdin

  return new Promise<CodexCliResult>((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const cleanup = (): void => {
      void rm(dir, { recursive: true, force: true });
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      cleanup();
      reject(new CodexUnavailableError(`codex timed out after ${opts.timeoutMs ?? 120000}ms`));
    }, opts.timeoutMs ?? 120000);

    child.stdout.on('data', (d) => {
      stdout += String(d);
    });
    child.stderr.on('data', (d) => {
      stderr += String(d);
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      cleanup();
      reject(new CodexUnavailableError(`codex spawn failed: ${e.message}`));
    });
    // A capped / not-logged-in codex exits BEFORE it consumes the prompt, so the
    // pending stdin write below fails (EPIPE on Linux, EOF on Windows). Without a
    // listener that is an unhandled stream 'error' event -> uncaughtException ->
    // the whole bot process dies, instead of the same-family fallback this module
    // exists to provide. `child.on('error')` does NOT cover stdin stream errors.
    child.stdin.on('error', (e: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      cleanup();
      reject(
        new CodexUnavailableError(
          `codex closed stdin before reading the prompt (${e.code ?? e.message})`,
        ),
      );
    });
    child.on('close', async (code) => {
      clearTimeout(timer);
      const combined = `${stdout}\n${stderr}`;
      if (CAP_OR_AUTH.test(combined)) {
        cleanup();
        const hit = combined.match(CAP_OR_AUTH)?.[0] ?? 'cap/auth';
        reject(new CodexUnavailableError(`codex unavailable (${hit})`));
        return;
      }
      let last = '';
      try {
        last = await readFile(outFile, 'utf8');
      } catch {
        /* no last-message file written */
      }
      cleanup();
      const text = last.trim() || stdout.trim();
      if (!text) {
        reject(new CodexUnavailableError(`codex produced no output (exit ${code})`));
        return;
      }
      resolve({
        text,
        model: opts.model ? `codex/${opts.model}` : 'codex',
        inputTokens: 0,
        outputTokens: 0,
        totalCostUsd: 0, // flat-rate subscription - not metered per call
        durationMs: Date.now() - startMs,
      });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}
