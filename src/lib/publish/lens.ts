/**
 * Lens Protocol publishing client.
 *
 * Uses the Lens API v2 GraphQL endpoint directly rather than the
 * @lens-protocol/client SDK, which has an unstable API surface.
 * This keeps the integration dependency-free and easy to maintain.
 *
 * Docs: https://docs.lens.xyz/docs/publication
 */

import type { NormalizedContent } from '@/lib/publish/normalize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LENS_API = 'https://api-v2.lens.dev';

// ---------------------------------------------------------------------------
// GraphQL helpers
// ---------------------------------------------------------------------------

interface LensGqlResponse<T = unknown> {
  data?: T;
  errors?: { message: string }[];
}

async function lensGql<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['x-access-token'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(LENS_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Lens API HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as LensGqlResponse<T>;

  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Lens API error: ${msg}`);
  }

  if (!json.data) {
    throw new Error('Lens API returned no data');
  }

  return json.data;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const CREATE_ONCHAIN_POST = `
  mutation CreateOnchainPostTypedData($request: OnchainPostRequest!) {
    createOnchainPostTypedData(request: $request) {
      id
      typedData {
        domain {
          name
          chainId
          version
          verifyingContract
        }
        types {
          Post {
            name
            type
          }
        }
        value {
          nonce
          deadline
          profileId
          contentURI
          actionModules
          actionModulesInitDatas
          referenceModule
          referenceModuleInitData
        }
      }
    }
  }
`;

const POST_ON_MOMOKA = `
  mutation PostOnMomoka($request: MomokaPostRequest!) {
    postOnMomoka(request: $request) {
      ... on CreateMomokaPublicationResult {
        id
        proof
        momokaId
      }
      ... on LensProfileManagerRelayError {
        reason
      }
    }
  }
`;

const REFRESH_MUTATION = `
  mutation Refresh($request: RefreshRequest!) {
    refresh(request: $request) {
      accessToken
      refreshToken
    }
  }
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LensPublishResult {
  postId: string;
  postUrl: string;
}

/**
 * Publish a text post to Lens Protocol via the Momoka (gasless) pathway.
 *
 * If Momoka fails (e.g. profile manager not enabled), falls back to logging
 * a placeholder result so the calling code can still proceed. The caller
 * should handle this gracefully.
 *
 * @param accessToken - A valid Lens v2 access token for the user
 * @param content     - NormalizedContent produced by normalizeForLens()
 */
export async function publishToLens(
  accessToken: string,
  content: NormalizedContent,
): Promise<LensPublishResult> {
  // Build metadata JSON per Lens Metadata Standards v2
  // In production this should be uploaded to IPFS/Arweave; for now we
  // create a data URI so the mutation has a valid contentURI.
  const metadata = {
    $schema: 'https://json-schemas.lens.dev/publications/text/3.0.0.json',
    lens: {
      id: crypto.randomUUID(),
      locale: 'en',
      mainContentFocus: 'TEXT_ONLY',
      content: content.text,
      ...(content.images.length > 0 && {
        image: {
          item: content.images[0],
          type: 'image/jpeg',
        },
        attachments: content.images.map((url) => ({
          item: url,
          type: 'image/jpeg',
          altTag: '',
        })),
      }),
      appId: 'zao-os',
    },
  };

  // Encode metadata as a data URI for the contentURI field.
  // In production, upload to IPFS and use the resulting CID URL instead.
  const contentURI = `data:application/json;base64,${Buffer.from(
    JSON.stringify(metadata),
  ).toString('base64')}`;

  try {
    // Attempt gasless post via Momoka (requires Lens Profile Manager enabled)
    const result = await lensGql<{
      postOnMomoka:
        | { id: string; momokaId: string }
        | { reason: string };
    }>(POST_ON_MOMOKA, { request: { contentURI } }, accessToken);

    const momoka = result.postOnMomoka;

    if ('reason' in momoka) {
      throw new Error(`Momoka relay error: ${momoka.reason}`);
    }

    const postId = momoka.id;
    // Lens post URLs follow the pattern: https://hey.xyz/posts/<id>
    const postUrl = `https://hey.xyz/posts/${postId}`;

    return { postId, postUrl };
  } catch (momokaErr) {
    // Momoka failed — try onchain typed-data path as fallback.
    // This requires the frontend to sign the typed data, which we can't do
    // server-side without the user's wallet. Log and rethrow.
    console.error('[lens] Momoka post failed, onchain path requires client-side signing:', momokaErr);
    throw momokaErr;
  }
}

/**
 * Refresh an expired Lens access token using a refresh token.
 *
 * @returns New access + refresh token pair
 */
export async function refreshLensToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const result = await lensGql<{
    refresh: { accessToken: string; refreshToken: string };
  }>(REFRESH_MUTATION, { request: { refreshToken } });

  return result.refresh;
}
