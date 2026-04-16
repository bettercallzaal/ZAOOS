/**
 * Lens Protocol V3 publishing.
 * Uploads metadata to Grove (Lens's decentralized storage),
 * then posts via the V3 GraphQL API.
 */

import type { NormalizedContent } from '@/lib/publish/normalize';

const LENS_API = 'https://api.lens.xyz/graphql';

export interface LensPublishResult {
  postId: string;
  postUrl: string;
}

/**
 * Publish content to Lens V3.
 * 1. Build metadata JSON per Lens Metadata Standards
 * 2. Upload to Grove via @lens-chain/storage-client → gets lens:// URI
 * 3. Call post mutation with the lens:// URI
 */
export async function publishToLens(
  accessToken: string,
  refreshToken: string,
  content: NormalizedContent,
  handle?: string,
): Promise<LensPublishResult> {
  let token = accessToken;

  // Build metadata per Lens V3 spec
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

  // Upload to Grove (Lens's decentralized storage)
  const { StorageClient } = await import('@lens-chain/storage-client');
  const storageClient = StorageClient.create();
  const { uri: contentURI } = await storageClient.uploadAsJson(metadata);

  console.info('[lens] Uploaded to Grove:', contentURI);

  // Post with the lens:// URI
  const postResult = await lensPost(token, contentURI);

  // If token expired, refresh and retry
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

  // Override the URL to use the user's profile (more reliable than tx hash)
  if (handle && postResult.result) {
    const cleanHandle = handle.replace('.lens', '');
    postResult.result.postUrl = `https://hey.xyz/u/${cleanHandle}`;
  }

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
      console.info('[lens] Post transaction hash:', post.hash);
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

    return { error: 'Unknown Lens response: ' + JSON.stringify(post) };
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
