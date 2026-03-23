/**
 * Lens Protocol V3 publishing.
 *
 * Uses the official SDK for posting via Grove storage.
 * Requires signless mode enabled (done during connect in useLensAuth).
 *
 * Server-side session resume is tricky because the SDK uses localStorage
 * by default. We attempt SDK-based posting first, then fall back to a
 * direct GraphQL mutation with the access token in the Authorization header.
 */

import type { NormalizedContent } from '@/lib/publish/normalize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LENS_GQL = 'https://api.lens.xyz/graphql';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LensPublishResult {
  postId: string;
  postUrl: string;
}

interface LensGqlResponse<T = unknown> {
  data?: T;
  errors?: { message: string }[];
}

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------

async function lensGql<T = unknown>(
  query: string,
  variables: Record<string, unknown>,
  accessToken: string,
): Promise<T> {
  const res = await fetch(LENS_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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
// GraphQL mutations (V3)
// ---------------------------------------------------------------------------

const CREATE_POST_MUTATION = `
  mutation CreatePost($request: CreatePostRequest!) {
    post(request: $request) {
      ... on PostResponse {
        hash
      }
      ... on SponsoredTransactionRequest {
        reason
      }
      ... on SelfFundedTransactionRequest {
        reason
      }
      ... on TransactionWillFail {
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
// SDK-based posting (preferred path)
// ---------------------------------------------------------------------------

async function tryPostWithSdk(
  accessToken: string,
  refreshToken: string,
  contentUri: string,
): Promise<LensPublishResult | null> {
  try {
    const { PublicClient, mainnet } = await import('@lens-protocol/client');
    const { post } = await import('@lens-protocol/client/actions');

    const client = PublicClient.create({
      environment: mainnet,
      origin: 'https://zaoos.com',
      storage: {
        // Custom in-memory storage so the SDK doesn't try localStorage
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as unknown as Storage,
    });

    // Attempt to resume session from stored credentials
    // This may fail server-side since the SDK expects localStorage
    const resumed = await client.resumeSession();
    if (resumed.isErr()) {
      return null; // Fall back to GraphQL
    }

    const sessionClient = resumed.value;

    const result = await post(sessionClient, {
      contentUri: contentUri as `lens://` & string,
    });

    if (result.isErr()) {
      return null; // Fall back to GraphQL
    }

    const postHash =
      (result.value as { hash?: string })?.hash || 'unknown';
    return {
      postId: postHash,
      postUrl: `https://hey.xyz/posts/${postHash}`,
    };
  } catch {
    // SDK not available or failed — fall back to GraphQL
    return null;
  }
}

// ---------------------------------------------------------------------------
// GraphQL-based posting (fallback)
// ---------------------------------------------------------------------------

async function postViaGraphQL(
  accessToken: string,
  contentUri: string,
): Promise<LensPublishResult> {
  const result = await lensGql<{
    post:
      | { hash: string }
      | { reason: string };
  }>(CREATE_POST_MUTATION, { request: { contentUri } }, accessToken);

  if ('reason' in result.post) {
    throw new Error(`Lens post failed: ${result.post.reason}`);
  }

  const postHash = result.post.hash;
  return {
    postId: postHash,
    postUrl: `https://hey.xyz/posts/${postHash}`,
  };
}

// ---------------------------------------------------------------------------
// Metadata upload to Grove
// ---------------------------------------------------------------------------

async function uploadMetadataToGrove(
  content: NormalizedContent,
): Promise<string> {
  try {
    const { textOnly } = await import('@lens-protocol/metadata');
    const { StorageClient } = await import(
      '@lens-protocol/storage-node-client'
    );

    const metadata = textOnly({ content: content.text });
    const storageClient = (StorageClient as any).create();
    const { uri } = await storageClient.uploadAsJson(metadata);
    return uri;
  } catch (err) {
    // If Grove upload fails, fall back to a data URI
    console.warn('[lens] Grove upload failed, using data URI fallback:', err);
    const metadata = {
      $schema:
        'https://json-schemas.lens.dev/publications/text/3.0.0.json',
      lens: {
        id: crypto.randomUUID(),
        locale: 'en',
        mainContentFocus: 'TEXT_ONLY',
        content: content.text,
        appId: 'zao-os',
      },
    };
    return `data:application/json;base64,${Buffer.from(
      JSON.stringify(metadata),
    ).toString('base64')}`;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Publish content to Lens V3.
 *
 * Strategy:
 * 1. Build metadata using @lens-protocol/metadata textOnly()
 * 2. Upload to Grove via @lens-protocol/storage-node-client
 * 3. Try SDK post() action (needs session resume — may not work server-side)
 * 4. Fall back to direct GraphQL mutation with access token
 *
 * @param accessToken  - Lens V3 access token (from users table)
 * @param refreshToken - Lens V3 refresh token (for auto-refresh)
 * @param content      - NormalizedContent from normalizeForLens()
 */
export async function publishToLens(
  accessToken: string,
  refreshToken: string,
  content: NormalizedContent,
): Promise<LensPublishResult> {
  // Step 1+2: Build metadata and upload to Grove
  const contentUri = await uploadMetadataToGrove(content);

  // Step 3: Try SDK-based posting (preferred — handles signless properly)
  const sdkResult = await tryPostWithSdk(accessToken, refreshToken, contentUri);
  if (sdkResult) {
    return sdkResult;
  }

  // Step 4: Fall back to GraphQL with access token
  try {
    return await postViaGraphQL(accessToken, contentUri);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);

    // If the error looks like an auth issue, try refreshing the token
    if (
      errMsg.includes('UNAUTHENTICATED') ||
      errMsg.includes('expired') ||
      errMsg.includes('unauthorized')
    ) {
      throw new Error(`TOKEN_EXPIRED:${refreshToken}`);
    }

    throw err;
  }
}

/**
 * Refresh an expired Lens V3 access token using a refresh token.
 *
 * @returns New access + refresh token pair
 */
export async function refreshLensToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const result = await lensGql<{
    refresh: { accessToken: string; refreshToken: string };
  }>(
    REFRESH_MUTATION,
    { request: { refreshToken } },
    '', // No auth header needed for refresh
  );

  return result.refresh;
}
