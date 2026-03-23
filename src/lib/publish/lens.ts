/**
 * Lens Protocol V3 publishing.
 * Posts via the Lens V3 GraphQL API with access tokens.
 * Tokens are obtained during wallet auth in settings (useLensAuth hook).
 */

import type { NormalizedContent } from '@/lib/publish/normalize';

const LENS_API = 'https://api.lens.xyz/graphql';

export interface LensPublishResult {
  postId: string;
  postUrl: string;
}

/**
 * Publish content to Lens V3 via GraphQL.
 * Requires a valid access token from the connect flow.
 */
export async function publishToLens(
  accessToken: string,
  refreshToken: string,
  content: NormalizedContent,
): Promise<LensPublishResult> {
  let token = accessToken;

  // Build metadata JSON
  const metadata = {
    $schema: 'https://json-schemas.lens.dev/publications/text/3.0.0.json',
    lens: {
      id: crypto.randomUUID(),
      locale: 'en',
      mainContentFocus: 'TEXT_ONLY',
      content: content.text,
      appId: 'zao-os',
    },
  };

  // Upload metadata to a data URI (works for V3 post mutation)
  const contentURI = `data:application/json;base64,${Buffer.from(
    JSON.stringify(metadata),
  ).toString('base64')}`;

  // Try to post
  const postResult = await lensPost(token, contentURI);

  // If token expired, refresh and retry once
  if (postResult.error?.includes('UNAUTHENTICATED') || postResult.error?.includes('expired')) {
    const refreshed = await refreshLensToken(refreshToken);
    if (refreshed) {
      token = refreshed.accessToken;
      const retryResult = await lensPost(token, contentURI);
      if (retryResult.error) throw new Error(retryResult.error);
      return retryResult.result!;
    }
    throw new Error('Lens token expired and refresh failed — reconnect in Settings');
  }

  if (postResult.error) throw new Error(postResult.error);
  return postResult.result!;
}

async function lensPost(token: string, contentURI: string): Promise<{ result?: LensPublishResult; error?: string }> {
  try {
    const res = await fetch(LENS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `mutation { post(request: { contentUri: "${contentURI}" }) { ... on PostResponse { hash } ... on SponsoredTransactionRequest { reason } ... on SelfFundedTransactionRequest { reason } ... on TransactionWillFail { reason } } }`,
      }),
    });

    const data = await res.json();

    if (data?.errors?.length) {
      return { error: data.errors.map((e: { message: string }) => e.message).join('; ') };
    }

    const post = data?.data?.post;
    if (post?.hash) {
      return {
        result: {
          postId: post.hash,
          postUrl: `https://hey.xyz/posts/${post.hash}`,
        },
      };
    }

    if (post?.reason) {
      return { error: `Lens post failed: ${post.reason}` };
    }

    return { error: 'Unknown Lens post response: ' + JSON.stringify(post) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Lens post failed' };
  }
}

async function refreshLensToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(LENS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { refresh(request: { refreshToken: "${refreshToken}" }) { accessToken refreshToken } }`,
      }),
    });
    const data = await res.json();
    return data?.data?.refresh || null;
  } catch {
    return null;
  }
}
