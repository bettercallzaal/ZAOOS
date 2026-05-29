/**
 * Klearu safety/classification wrapper (doc 761, Phase 2/4).
 *
 * Klearu is Quilibrium's CLI/socket-only classifier - there is NO HTTP endpoint, so we wrap
 * the local CLI as a subprocess. It is used ONLY for classification (never for reasoning):
 *   - text:  SLIDE / LLaMA classifier
 *   - image: davit-infer
 *
 * IMPORTANT (anti-fabrication): the exact Klearu CLI invocation + flags are not publicly
 * documented (login-walled). Rather than invent a command string, this wrapper runs an
 * operator-configured command template from env. The operator fills in the real command once
 * Klearu is installed; the wrapper handles spawn, timeout, parsing, and fail-mode.
 *
 * Env:
 *   KLEARU_TEXT_CMD    command template for text classification. Placeholders: {TEXT} is passed
 *                      via stdin (preferred) - the template is run with the text on stdin.
 *                      e.g. "klearu classify --model slide --json"
 *   KLEARU_IMAGE_CMD   command template for image classification. {IMAGE_PATH} is substituted.
 *                      e.g. "davit-infer --image {IMAGE_PATH} --json"
 *   KLEARU_TIMEOUT_MS  per-call timeout (default 8000)
 *   KLEARU_FAIL_MODE   'closed' (default - block on any error/missing config) | 'open' (allow)
 *   KLEARU_BLOCK_LABELS comma list of labels that mean "unsafe" (default: "unsafe,toxic,nsfw,spam")
 *
 * The CLI is expected to print a JSON object on stdout. We accept either:
 *   { "label": "...", "score": 0.0..1.0, "safe": true|false }   (any subset)
 * If only a bare label is printed, we fall back to KLEARU_BLOCK_LABELS matching.
 */
import { spawn } from 'node:child_process';

export interface SafetyVerdict {
  safe: boolean;
  label: string;
  score: number | null;
  /** how the verdict was reached - useful for the Telegram approval message + audit */
  reason: string;
  raw: string;
}

type FailMode = 'closed' | 'open';

function failMode(): FailMode {
  return (process.env.KLEARU_FAIL_MODE ?? 'closed').toLowerCase() === 'open' ? 'open' : 'closed';
}

function blockLabels(): string[] {
  return (process.env.KLEARU_BLOCK_LABELS ?? 'unsafe,toxic,nsfw,spam')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Verdict used when Klearu cannot run. Fail-closed = unsafe (block); fail-open = safe (allow). */
function failVerdict(reason: string): SafetyVerdict {
  const open = failMode() === 'open';
  return {
    safe: open,
    label: open ? 'unverified-allow' : 'unverified-block',
    score: null,
    reason: `${reason} (fail-${open ? 'open' : 'closed'})`,
    raw: '',
  };
}

function parseVerdict(stdout: string): SafetyVerdict {
  const raw = stdout.trim();
  // Try JSON first.
  try {
    const obj = JSON.parse(raw) as { label?: string; score?: number; safe?: boolean };
    const label = (obj.label ?? '').toLowerCase();
    const score = typeof obj.score === 'number' ? obj.score : null;
    let safe: boolean;
    if (typeof obj.safe === 'boolean') {
      safe = obj.safe;
    } else {
      safe = !blockLabels().includes(label);
    }
    return { safe, label: label || (safe ? 'safe' : 'unsafe'), score, reason: 'klearu-json', raw };
  } catch {
    // Bare-label fallback.
    const label = raw.toLowerCase();
    const safe = !blockLabels().some((b) => label.includes(b));
    return { safe, label: label.slice(0, 40), score: null, reason: 'klearu-bare-label', raw };
  }
}

/**
 * Run a command template, feeding `stdinText` on stdin if provided. Resolves with stdout, or
 * rejects on non-zero exit / timeout.
 */
function run(cmdTemplate: string, stdinText: string | null, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // Split the template into argv; the operator's template is trusted config, not user input.
    const parts = cmdTemplate.split(/\s+/).filter(Boolean);
    const [cmd, ...args] = parts;
    if (!cmd) return reject(new Error('empty command template'));

    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`klearu timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`klearu exited ${code}: ${err.slice(0, 200)}`));
    });

    if (stdinText !== null) {
      child.stdin.write(stdinText);
    }
    child.stdin.end();
  });
}

/** Classify text via the SLIDE/LLaMA classifier. Text is passed on stdin. */
export async function checkText(text: string): Promise<SafetyVerdict> {
  const cmd = process.env.KLEARU_TEXT_CMD;
  if (!cmd) return failVerdict('KLEARU_TEXT_CMD not set');
  const timeoutMs = Number(process.env.KLEARU_TIMEOUT_MS ?? 8000);
  try {
    const out = await run(cmd, text, timeoutMs);
    return parseVerdict(out);
  } catch (e) {
    return failVerdict(`klearu text check failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** Classify an image file via davit-infer. {IMAGE_PATH} is substituted into the template. */
export async function checkImage(imagePath: string): Promise<SafetyVerdict> {
  const tmpl = process.env.KLEARU_IMAGE_CMD;
  if (!tmpl) return failVerdict('KLEARU_IMAGE_CMD not set');
  const timeoutMs = Number(process.env.KLEARU_TIMEOUT_MS ?? 8000);
  const cmd = tmpl.replace('{IMAGE_PATH}', imagePath);
  try {
    const out = await run(cmd, null, timeoutMs);
    return parseVerdict(out);
  } catch (e) {
    return failVerdict(`klearu image check failed: ${e instanceof Error ? e.message : e}`);
  }
}

/**
 * Combined gate for a draft cast: check the text and any image attachments. Returns the first
 * unsafe verdict, or a safe verdict if all pass. Used as the caster PRE/POST safety gate.
 */
export async function checkCast(opts: { text: string; imagePaths?: string[] }): Promise<SafetyVerdict> {
  const textVerdict = await checkText(opts.text);
  if (!textVerdict.safe) return textVerdict;
  for (const p of opts.imagePaths ?? []) {
    const v = await checkImage(p);
    if (!v.safe) return v;
  }
  return textVerdict;
}
