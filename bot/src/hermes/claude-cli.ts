import { spawn } from 'node:child_process';

export interface ClaudeCliResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
  model: string;
  durationMs: number;
  numTurns: number;
  isError: boolean;
  sessionId: string;
}

export interface ClaudeCliOptions {
  model: string;                                  // 'opus' | 'sonnet' | 'haiku' | full id
  prompt: string;
  cwd: string;                                    // working dir Claude operates in
  appendSystemPrompt?: string;
  allowedTools?: string[];                        // e.g. ['Read','Edit','Write','Glob','Grep','Bash(git diff*)']
  disallowedTools?: string[];                     // e.g. ['Bash(git push*)','Bash(git commit*)']
  outputFormat?: 'text' | 'json';                 // default 'json'
  permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'default' | 'dontAsk' | 'plan' | 'auto';
  jsonSchema?: object;                            // for structured output validation
  maxBudgetUsd?: number;                          // hard cap per invocation
  timeoutMs?: number;                             // wall clock kill
  bare?: boolean;                                 // skip hooks/CLAUDE.md auto-discovery
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

/**
 * Spawn Claude Code CLI in headless mode using Max-plan auth (~/.claude/auth.json).
 * No ANTHROPIC_API_KEY required - inherits user OAuth from CLAUDE_CODE state.
 *
 * Returns the assistant's final text result + usage stats (parsed from --output-format json).
 */
export type ClaudeErrorKind = 'auth' | 'usage_limit' | 'rate_limit' | 'timeout' | 'unknown';

/**
 * Typed error for Claude CLI authentication failures. Callers can catch and
 * surface an honest message like "research engine logged out - Zaal's been
 * alerted" instead of passing off old recalled results as fresh research.
 */
export class CliAuthError extends Error {
  constructor(message: string, public hint: string = 'claude login/OAuth expired - run `claude` then /login on the host') {
    super(message);
    this.name = 'CliAuthError';
  }
}

/**
 * Generic Claude CLI error (non-auth). Callers can handle differently from
 * auth failures (which need immediate Zaal notification, while rate-limits
 * might just need a retry).
 */
export class CliError extends Error {
  constructor(message: string, public kind: ClaudeErrorKind = 'unknown', public hint: string = '') {
    super(message);
    this.name = 'CliError';
  }
}

/**
 * Classify a claude CLI failure from its combined stderr+stdout so callers can
 * surface an actionable message (e.g. "auth expired -> /login") instead of a
 * generic blob. The auth case is the one that silently broke the whole fleet
 * (2026-06-23): the Max-plan OAuth token expired and every failure looked the
 * same. Pure + exported for unit testing.
 */
export function classifyClaudeError(text: string): { kind: ClaudeErrorKind; hint: string } {
  const t = (text || '').toLowerCase();
  if (/\b401\b|invalid authentication|unauthorized|not logged in|please run.*\/login|oauth token (expired|revoked)|authentication_error/.test(t)) {
    return { kind: 'auth', hint: 'claude login/OAuth expired - run `claude` then /login on the host' };
  }
  if (/usage limit|quota exceeded|out of credit|insufficient.*credit|plan limit reached/.test(t)) {
    return { kind: 'usage_limit', hint: 'plan usage/quota reached - check the Claude plan' };
  }
  if (/\b429\b|\b529\b|rate.?limit|too many requests|overloaded/.test(t)) {
    return { kind: 'rate_limit', hint: 'rate-limited/overloaded - retry shortly' };
  }
  if (/timed out|timeout|etimedout/.test(t)) {
    return { kind: 'timeout', hint: 'model call timed out' };
  }
  return { kind: 'unknown', hint: 'unclassified claude CLI failure - check logs' };
}

export function callClaudeCli(opts: ClaudeCliOptions): Promise<ClaudeCliResult> {
  return new Promise((resolve, reject) => {
    const outputFormat = opts.outputFormat ?? 'json';
    const args: string[] = [
      '-p',
      opts.prompt,
      '--model',
      opts.model,
      '--output-format',
      outputFormat,
      '--no-session-persistence',
    ];

    if (opts.appendSystemPrompt) {
      args.push('--append-system-prompt', opts.appendSystemPrompt);
    }
    if (opts.allowedTools && opts.allowedTools.length > 0) {
      args.push('--allowedTools', ...opts.allowedTools);
    }
    if (opts.disallowedTools && opts.disallowedTools.length > 0) {
      args.push('--disallowedTools', ...opts.disallowedTools);
    }
    if (opts.permissionMode) {
      args.push('--permission-mode', opts.permissionMode);
    }
    // NOTE: intentionally NOT forwarding `opts.jsonSchema` to the CLI.
    // `--json-schema` enforces strict structured output, which prevents the
    // model from running tool calls (Read/Edit/Write/etc) before producing
    // the final JSON. We need both. The system prompt asks for JSON in the
    // final assistant message; the orchestrator parses it. Schema is kept on
    // the type only as a contract reference.
    void opts.jsonSchema;  
    if (opts.maxBudgetUsd !== undefined) {
      args.push('--max-budget-usd', String(opts.maxBudgetUsd));
    }
    if (opts.bare) {
      args.push('--bare');
    }
    args.push('--add-dir', opts.cwd);

    // Augment PATH so claude resolves under systemd (strips user PATH).
    const augmentedEnv: NodeJS.ProcessEnv = { ...process.env };
    const home = augmentedEnv.HOME ?? '/home/zaal';
    const localBin = `${home}/.local/bin`;
    if (!augmentedEnv.PATH || !augmentedEnv.PATH.split(':').includes(localBin)) {
      augmentedEnv.PATH = `${localBin}:${augmentedEnv.PATH ?? '/usr/local/bin:/usr/bin:/bin'}`;
    }

    const child = spawn(process.env.HERMES_CLAUDE_BIN || 'claude', args, {
      cwd: opts.cwd,
      env: augmentedEnv,
      // CRITICAL: claude CLI waits 3s for stdin if not explicitly closed,
      // then exits 1 with "no stdin data received in 3s" warning when running
      // under systemd. Prompt is passed via -p flag; stdin is unused.
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2000);
      reject(new CliError(`claude CLI timed out after ${opts.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`, 'timeout', 'model call timed out'));
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[hermes/claude-cli] spawn error:', msg);
      reject(new CliError(`Failed to spawn claude CLI: ${msg}. Is 'claude' in PATH? args=${JSON.stringify(args).slice(0, 200)}`, 'unknown'));
    });

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        // Echo BOTH streams. claude CLI frequently exits non-zero with an
        // EMPTY stderr (the actual diagnostic — auth window expired, bad
        // flag, JSON error payload — lands on stdout). Logging stderr alone
        // made every such failure mute ("claude CLI exited 1. stderr: ").
        const combined = `${stderr} ${stdout}`;
        console.error(
          '[hermes/claude-cli] non-zero exit. exit_code=', code,
          '\n  stderr=', stderr.slice(0, 800) || '(empty)',
          '\n  stdout=', stdout.slice(0, 800) || '(empty)',
          '\n  args=', JSON.stringify(args).slice(0, 400),
        );
        const cls = classifyClaudeError(combined);
        const err = cls.kind === 'auth'
          ? new CliAuthError(`claude CLI exited ${code}: ${combined.slice(0, 400)}`, cls.hint)
          : new CliError(`claude CLI exited ${code} [${cls.kind}: ${cls.hint}]. stderr: ${stderr.slice(0, 400) || '(empty)'} | stdout: ${stdout.slice(0, 400) || '(empty)'}`, cls.kind, cls.hint);
        reject(err);
        return;
      }

      // Empty stdout means Claude exited silently - log everything we have.
      if (!stdout.trim()) {
        console.error('[hermes/claude-cli] empty stdout. exit_code=', code, 'stderr=', stderr.slice(0, 800), 'args=', JSON.stringify(args).slice(0, 800));
        const clsEmpty = classifyClaudeError(stderr);
        const err = clsEmpty.kind === 'auth'
          ? new CliAuthError(`claude CLI returned empty stdout`, clsEmpty.hint)
          : new CliError(`claude CLI returned empty stdout [${clsEmpty.kind}: ${clsEmpty.hint}]. exit=${code}. stderr: ${stderr.slice(0, 400) || '(empty)'}`, clsEmpty.kind, clsEmpty.hint);
        reject(err);
        return;
      }

      try {
        if (outputFormat === 'json') {
          const parsed = JSON.parse(stdout) as {
            type?: string;
            subtype?: string;
            is_error?: boolean;
            duration_ms?: number;
            num_turns?: number;
            result?: string;
            session_id?: string;
            total_cost_usd?: number;
            usage?: { input_tokens?: number; output_tokens?: number };
            modelUsage?: Record<string, { inputTokens: number; outputTokens: number; costUSD: number }>;
          };
          if (parsed.is_error) {
            console.error('[hermes/claude-cli] is_error=true full payload:', JSON.stringify(parsed).slice(0, 1200));
            const clsErr = classifyClaudeError(parsed.result ?? '');
            const err = clsErr.kind === 'auth'
              ? new CliAuthError(`claude CLI reported is_error=true: ${(parsed.result ?? '').slice(0, 400) || '(no result body)'}`, clsErr.hint)
              : new CliError(`claude CLI reported is_error=true [${clsErr.kind}: ${clsErr.hint}]: ${(parsed.result ?? '').slice(0, 400) || '(no result body)'}`, clsErr.kind, clsErr.hint);
            reject(err);
            return;
          }
          if (!parsed.result || !parsed.result.trim()) {
            console.error('[hermes/claude-cli] empty result. full payload:', JSON.stringify(parsed).slice(0, 1200));
            reject(new CliError(`claude CLI returned empty result. duration=${parsed.duration_ms}ms turns=${parsed.num_turns}. session=${parsed.session_id}`, 'unknown'));
            return;
          }
          const usage = parsed.usage ?? { input_tokens: 0, output_tokens: 0 };
          resolve({
            text: parsed.result ?? '',
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            totalCostUsd: parsed.total_cost_usd ?? 0,
            model: opts.model,
            durationMs: parsed.duration_ms ?? 0,
            numTurns: parsed.num_turns ?? 0,
            isError: Boolean(parsed.is_error),
            sessionId: parsed.session_id ?? '',
          });
        } else {
          resolve({
            text: stdout.trim(),
            inputTokens: 0,
            outputTokens: 0,
            totalCostUsd: 0,
            model: opts.model,
            durationMs: 0,
            numTurns: 0,
            isError: false,
            sessionId: '',
          });
        }
      } catch (err) {
        reject(
          new CliError(
            `Failed to parse claude CLI output. First 400 chars: ${stdout.slice(0, 400)}. Parse error: ${err instanceof Error ? err.message : String(err)}`,
            'unknown',
          ),
        );
      }
    });
  });
}

// Models for the legacy single-model path (HERMES_ROUTING != 'on').
// Defaults match the pre-Sprint-1 behavior so this change is a no-op when
// routing is disabled.
export const HERMES_FIXER_MODEL = process.env.HERMES_FIXER_MODEL ?? 'opus';
export const HERMES_CRITIC_MODEL = process.env.HERMES_CRITIC_MODEL ?? 'sonnet';

// Sprint 1 cost-routing models (per doc 541). Used only when HERMES_ROUTING=on.
//
//   Coder: attempt 1 uses FIXER_FAST_MODEL (sonnet, ~5x cheaper than opus).
//          Attempts 2+ escalate to FIXER_MODEL (opus) since the Critic
//          rejected the cheap model and we now have specific feedback to
//          act on, which usually needs the bigger model.
//
//   Critic: simple diffs (docs-only, formatting, single-file imports, < 30
//           added LOC) use CRITIC_FAST_MODEL (haiku). Complex diffs stay
//           on CRITIC_MODEL (sonnet). See classifyDiffComplexity in types.ts.
//
// Default off until validated for ~24h in production.
export const HERMES_FIXER_FAST_MODEL = process.env.HERMES_FIXER_FAST_MODEL ?? 'sonnet';
export const HERMES_CRITIC_FAST_MODEL = process.env.HERMES_CRITIC_FAST_MODEL ?? 'haiku';
export const HERMES_ROUTING_ENABLED = process.env.HERMES_ROUTING === 'on';
/**
 * Lightweight auth healthcheck: attempt a trivial CLI invocation to verify
 * the Max-plan OAuth is valid. Returns true if OK, false if auth failed.
 * Non-auth failures (timeout, rate limit, etc) also return false but with
 * a different log flavor.
 *
 * Call on bot startup and periodically (e.g., hourly) to catch expiry early.
 * Used by: bot/src/zoe/index.ts onBotStart hook.
 */
export async function checkClaudeAuth(cwd: string = '/home/zaal/zao-os'): Promise<{
  ok: boolean;
  kind?: ClaudeErrorKind;
  hint?: string;
}> {
  try {
    const result = await callClaudeCli({
      model: 'haiku',
      prompt: 'Respond with OK.',
      cwd,
      allowedTools: [],
      disallowedTools: [],
      timeoutMs: 10_000,
      bare: true,
      outputFormat: 'text',
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof CliAuthError) {
      console.warn('[hermes/claude-cli] auth healthcheck failed:', (err as Error).message);
      return { ok: false, kind: 'auth', hint: err.hint };
    }
    if (err instanceof CliError) {
      console.warn('[hermes/claude-cli] healthcheck non-auth failure:', (err as Error).message);
      return { ok: false, kind: (err as CliError).kind, hint: (err as CliError).hint };
    }
    console.error('[hermes/claude-cli] healthcheck unexpected error:', err);
    return { ok: false, kind: 'unknown' };
  }
}
