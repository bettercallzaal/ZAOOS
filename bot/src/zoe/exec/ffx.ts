/**
 * FFX serverless exec wrapper (doc 761 Phase 4) - MARKED STUB.
 *
 * FFX is Quilibrium's serverless exec layer, in PRIVATE BETA. Its function-authoring +
 * invocation API is login-walled and UNVERIFIED. Per the anti-fabrication rule (doc 761) we do
 * NOT invent the FFX API surface and present it as real. This module:
 *   - throws a descriptive "not verified" error by default;
 *   - offers a generic HTTP invocation path gated behind FFX_VERIFY_OK=1, for once the operator
 *     has the real endpoint + payload shape from the FFX beta docs (FFX-BETA-REQUEST.md);
 *   - provides fallbacks (run locally) so Phase 4 degrades gracefully to the Phase 2/3 behavior
 *     until FFX access lands.
 *
 * Phase 4 intent (per doc 761):
 *   - run each ranked per-agent action as one FFX invocation (executeActionOnFfx)
 *   - wrap Klearu as an FFX function for the pre/post safety gate (checkTextViaFfx)
 *
 * Env:
 *   FFX_ENDPOINT     base URL for FFX invocations (from the beta docs) - UNVERIFIED shape
 *   FFX_TOKEN        auth token
 *   FFX_VERIFY_OK=1  set ONLY after confirming the FFX invocation contract; unblocks the
 *                    generic HTTP path. Until then invokeFfx throws.
 */
import { checkText, type SafetyVerdict } from '../safety/klearu';

export interface FfxInvocation {
  /** FFX function name/ref to invoke */
  fn: string;
  /** JSON payload for the function */
  payload: unknown;
}

function notVerified(): never {
  throw new Error(
    'FFX exec is not yet wired: FFX is a private beta with a login-walled, UNVERIFIED API ' +
      '(see FFX-BETA-REQUEST.md / doc 761). Obtain the invocation contract from Cassie, set ' +
      'FFX_ENDPOINT + FFX_TOKEN, confirm the payload shape, then set FFX_VERIFY_OK=1.',
  );
}

/**
 * Invoke an FFX function. Throws unless FFX_VERIFY_OK=1 (gate against running on a fabricated
 * API). When unblocked, performs a generic JSON POST to FFX_ENDPOINT/{fn} - VERIFY this matches
 * the real FFX contract before trusting it.
 */
export async function invokeFfx<T = unknown>(inv: FfxInvocation): Promise<T> {
  if (process.env.FFX_VERIFY_OK !== '1') notVerified();
  const endpoint = process.env.FFX_ENDPOINT?.replace(/\/$/, '');
  if (!endpoint) throw new Error('FFX_ENDPOINT not set');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.FFX_TOKEN) headers['Authorization'] = `Bearer ${process.env.FFX_TOKEN}`;

  // VERIFY: path + body shape are assumptions until confirmed against FFX beta docs.
  const res = await fetch(`${endpoint}/${inv.fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(inv.payload),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`FFX invoke ${inv.fn} failed: ${res.status} ${body.slice(0, 200)}`);
  try {
    return JSON.parse(body) as T;
  } catch {
    return body as unknown as T;
  }
}

/** True when FFX is configured + verified; lets callers fall back to local exec otherwise. */
export function ffxAvailable(): boolean {
  return process.env.FFX_VERIFY_OK === '1' && !!process.env.FFX_ENDPOINT;
}

export interface RankedActionPayload {
  agentId: string;
  kind: 'cast' | 'reply' | 'like';
  text?: string;
  parent?: { fid: number; hash: string };
}

/**
 * Phase 4: run one ranked agent action as an FFX invocation. If FFX is unavailable, the caller
 * should fall back to the in-process caster pipeline (Phase 2/3). We return the FFX result or
 * throw notVerified - the orchestrator decides the fallback.
 */
export async function executeActionOnFfx(action: RankedActionPayload): Promise<unknown> {
  return invokeFfx({ fn: process.env.FFX_ACTION_FN ?? 'zao-caster-action', payload: action });
}

/**
 * Phase 4: Klearu safety check routed through FFX. Falls back to the local Klearu CLI wrapper
 * when FFX is unavailable, so the safety gate always runs.
 */
export async function checkTextViaFfx(text: string): Promise<SafetyVerdict> {
  if (!ffxAvailable()) {
    return checkText(text); // local Klearu CLI fallback (fail-closed by default)
  }
  try {
    return await invokeFfx<SafetyVerdict>({ fn: process.env.FFX_KLEARU_FN ?? 'klearu-classify-text', payload: { text } });
  } catch (e) {
    // If the FFX-hosted Klearu errors, fall back to local rather than failing the gate open.
    console.warn('[exec/ffx] FFX Klearu failed, falling back to local:', (e as Error).message);
    return checkText(text);
  }
}
