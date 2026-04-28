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
    void opts.jsonSchema; // eslint-disable-line @typescript-eslint/no-unused-vars
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
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2000);
      reject(new Error(`claude CLI timed out after ${opts.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`));
    }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[hermes/claude-cli] spawn error:', msg);
      reject(new Error(`Failed to spawn claude CLI: ${msg}. Is 'claude' in PATH? args=${JSON.stringify(args).slice(0, 200)}`));
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
        reject(new Error(`claude CLI exited ${code}. stderr: ${stderr.slice(0, 800)}`));
        return;
      }

      // Empty stdout means Claude exited silently - log everything we have.
      if (!stdout.trim()) {
        console.error('[hermes/claude-cli] empty stdout. exit_code=', code, 'stderr=', stderr.slice(0, 800), 'args=', JSON.stringify(args).slice(0, 800));
        reject(new Error(`claude CLI returned empty stdout. exit=${code}. stderr: ${stderr.slice(0, 400) || '(empty)'}`));
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
            reject(new Error(`claude CLI reported is_error=true: ${(parsed.result ?? '').slice(0, 400) || '(no result body)'}`));
            return;
          }
          if (!parsed.result || !parsed.result.trim()) {
            console.error('[hermes/claude-cli] empty result. full payload:', JSON.stringify(parsed).slice(0, 1200));
            reject(new Error(`claude CLI returned empty result. duration=${parsed.duration_ms}ms turns=${parsed.num_turns}. session=${parsed.session_id}`));
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
          new Error(
            `Failed to parse claude CLI output. First 400 chars: ${stdout.slice(0, 400)}. Parse error: ${err instanceof Error ? err.message : String(err)}`,
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
