/**
 * Juke partner-SSO bridge — server-side mint of a short-lived Juke JWT for a
 * visitor already authenticated by ZAO OS (SIWN via Neynar). The token gets
 * passed on the embed URL as `?token=...`; the iframe adopts the session and
 * skips the SIWF QR. See juke.audio/llms.txt section "Partner SSO Bridge".
 *
 * Trust model: Juke trusts ZAO because we possess the developer API key. The
 * minted JWT carries `source="partner"` + `partner_app_id` claims, has a TTL
 * ≤ 10 min, and is walled off from sensitive endpoints (dashboard ops, room
 * create, key reveal, recording start/stop) so a leaked token cannot be
 * weaponized against a visitor's Juke account.
 */

const ENDPOINT = 'https://api.juke.audio/v1/developer/partner-tokens';
const MIN_TTL = 60;
const MAX_TTL = 600;
const DEFAULT_TTL = 300;

export interface PartnerTokenInput {
  /** The Farcaster ID of the visitor ZAO has already verified (SIWN session). */
  fid: number;
  /** Seconds. Clamped to [60, 600]. Defaults to 300. */
  ttlSeconds?: number;
}

export interface PartnerTokenResponse {
  token: string;
  fid: number;
  expires_at: string;
  partner_app_id: string;
}

export type MintPartnerTokenResult =
  | { ok: true; data: PartnerTokenResponse }
  | { ok: false; status: number; error: string };

export async function mintPartnerToken(
  apiKey: string,
  input: PartnerTokenInput,
): Promise<MintPartnerTokenResult> {
  if (!Number.isFinite(input.fid) || input.fid <= 0) {
    return { ok: false, status: 400, error: 'fid must be a positive integer' };
  }
  const ttl = Math.min(MAX_TTL, Math.max(MIN_TTL, input.ttlSeconds ?? DEFAULT_TTL));

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Juke-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fid: input.fid, ttl_seconds: ttl }),
      signal: AbortSignal.timeout(8_000),
    });
  } catch (err: unknown) {
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : 'Juke partner-token API unreachable',
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      error: `Juke returned ${res.status}: ${text.slice(0, 200)}`,
    };
  }
  let payload: PartnerTokenResponse;
  try {
    payload = (await res.json()) as PartnerTokenResponse;
  } catch {
    return { ok: false, status: 502, error: 'Juke returned invalid JSON' };
  }
  if (!payload?.token || !payload?.expires_at) {
    return { ok: false, status: 502, error: 'Juke response missing token / expires_at' };
  }
  return { ok: true, data: payload };
}
