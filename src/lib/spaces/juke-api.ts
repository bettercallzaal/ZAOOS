/**
 * Juke developer API client — SERVER ONLY (Path B of doc 695).
 *
 * Creates branded Juke spaces for recurring ZAO events via the Juke developer
 * API (`api.juke.audio`). Path A (the iframe embed in `juke.ts`) needs no
 * keys; Path B does — `POST /v1/developer/spaces` takes TWO credentials:
 * `X-Juke-Api-Key` authorises the app, and `Authorization: Bearer <jwt>`
 * identifies the Juke account that will host the new space.
 *
 * IMPORTANT: never import this module from a client component. Both secrets
 * are passed in by the caller (the API route reads them from the
 * environment), so this file holds no secret literal — but the Juke developer
 * API surface is server-only regardless.
 *
 * The Juke developer API is in beta; its create-space *response* shape is not
 * publicly documented. `createJukeSpace` parses the response defensively and
 * only trusts a space id that passes `isValidJukeSpaceId`. See research doc
 * 695 and juke.audio/llms.txt for the verified request contract.
 */
import { isValidJukeSpaceId, jukeEmbedUrl } from './juke';

/** Base origin of the Juke REST API (distinct from the juke.audio web app). */
export const JUKE_API_ORIGIN = 'https://api.juke.audio';

/** Path of the developer create-space endpoint. */
const CREATE_SPACE_PATH = '/v1/developer/spaces';

/** Abort the Juke request if it has not responded within this many ms. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Input for creating a Juke space — the ZAO-facing, camelCase shape. */
export interface CreateJukeSpaceInput {
  /** Human-readable space title, e.g. "ZAOstock Tuesday Standup". */
  title: string;
  /**
   * ISO-8601 start time for a scheduled space, or null/omitted to open the
   * space immediately.
   */
  scheduledAt?: string | null;
  /** When true, Juke posts an announcement cast for the space. */
  announceCast?: boolean;
  /** When true, AI agents are permitted to join the room. */
  allowAgents?: boolean;
}

/** A Juke space created through the developer API. */
export interface JukeSpace {
  /** Juke space id — validated, safe to interpolate into URLs. */
  id: string;
  /** Embed URL for the space; `/live/{id}` renders this iframe. */
  embedUrl: string;
  /** The raw, undocumented Juke response, for callers that need more. */
  raw: unknown;
}

/** Result of {@link createJukeSpace} — a discriminated union; never throws. */
export type CreateJukeSpaceResult =
  | { ok: true; space: JukeSpace }
  | { ok: false; status: number; error: string };

/**
 * Credentials for a Juke developer API call. BOTH are required: Juke's
 * `POST /v1/developer/spaces` authorises the *app* with `X-Juke-Api-Key` and
 * identifies the *host* of the new space with a user JWT.
 */
export interface JukeCredentials {
  /** `JUKE_API_KEY` — the app's static developer secret (juke.audio/developers). */
  apiKey: string;
  /**
   * `JUKE_USER_TOKEN` — a Juke JWT for the account that will host the space,
   * obtained via Sign In With Farcaster. Juke JWTs expire; refreshing this
   * server-side is an open question for nickysap — see research doc 695.
   */
  userToken: string;
}

/** Id fields the Juke response is most likely to use, in priority order. */
const ID_KEYS = ['id', 'space_id', 'spaceId', 'room_id', 'roomId'] as const;
/** Nested objects the space id may live under one level deep. */
const NESTED_KEYS = ['space', 'room', 'data'] as const;

/**
 * Pull a Juke space id out of the (undocumented) create-space response.
 * Checks the id fields Juke is most likely to use, at the top level and one
 * level deep, and returns the first that is a structurally valid space id.
 *
 * Exported for unit testing — the defensive parsing is the part most likely
 * to break when Juke finalises its response shape.
 */
export function extractSpaceId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;

  for (const key of ID_KEYS) {
    if (isValidJukeSpaceId(record[key])) return record[key];
  }

  for (const nestedKey of NESTED_KEYS) {
    const nested = record[nestedKey];
    if (typeof nested === 'object' && nested !== null) {
      const nestedRecord = nested as Record<string, unknown>;
      for (const key of ID_KEYS) {
        if (isValidJukeSpaceId(nestedRecord[key])) return nestedRecord[key];
      }
    }
  }

  return null;
}

/**
 * Create a Juke space through the developer API.
 *
 * @param input       The space to create.
 * @param credentials The `JUKE_API_KEY` + `JUKE_USER_TOKEN` pair, passed in by
 *                    the caller — this module never reads them from the
 *                    environment itself.
 * @returns A {@link CreateJukeSpaceResult}. This function does not throw:
 *          network, timeout, and parse failures are returned as
 *          `{ ok: false }` so callers handle one shape.
 */
export async function createJukeSpace(
  input: CreateJukeSpaceInput,
  credentials: JukeCredentials,
): Promise<CreateJukeSpaceResult> {
  // Translate the camelCase ZAO shape into Juke's documented snake_case body.
  const body = JSON.stringify({
    title: input.title,
    scheduled_at: input.scheduledAt ?? null,
    announce_cast: input.announceCast ?? false,
    allow_agents: input.allowAgents ?? false,
  });

  let response: Response;
  try {
    response = await fetch(`${JUKE_API_ORIGIN}${CREATE_SPACE_PATH}`, {
      method: 'POST',
      headers: {
        // App credential + host-identifying user JWT — Juke requires both.
        Authorization: `Bearer ${credentials.userToken}`,
        'X-Juke-Api-Key': credentials.apiKey,
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return {
      ok: false,
      status: 502,
      error: timedOut ? 'Juke API timed out' : 'Could not reach the Juke API',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: `Juke API returned ${response.status}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, status: 502, error: 'Juke API returned invalid JSON' };
  }

  const spaceId = extractSpaceId(payload);
  if (!spaceId) {
    return {
      ok: false,
      status: 502,
      error: 'Juke API response did not include a usable space id',
    };
  }

  return {
    ok: true,
    space: { id: spaceId, embedUrl: jukeEmbedUrl(spaceId), raw: payload },
  };
}
