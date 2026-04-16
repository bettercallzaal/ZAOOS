/**
 * Threads publishing client.
 *
 * Uses Meta Graph API v1.0 with the shared ZAO Threads account.
 * Two-step publish: create container -> publish container.
 * Text-only shortcut available via auto_publish_text.
 * Admin-only — the calling route must enforce access control.
 *
 * Rate limit: 250 posts per 24 hours.
 * Token expiry: 60 days — use refreshThreadsToken() to extend.
 */

import { ENV } from '@/lib/env';
import type { NormalizedContent } from '@/lib/publish/normalize';

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

// ---------------------------------------------------------------------------
// Client check
// ---------------------------------------------------------------------------

export function isThreadsConfigured(): boolean {
  return !!(ENV.THREADS_ACCESS_TOKEN && ENV.THREADS_USER_ID);
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export interface ThreadsPublishResult {
  postId: string;
  postUrl: string;
}

/**
 * Publish a text post to Threads.
 *
 * For text-only posts, uses the two-step container flow:
 * 1. Create media container with media_type=TEXT
 * 2. Publish the container
 *
 * For posts with images, creates an IMAGE container first.
 */
export async function publishToThreads(
  content: NormalizedContent,
): Promise<ThreadsPublishResult> {
  const { THREADS_ACCESS_TOKEN, THREADS_USER_ID } = ENV;

  if (!THREADS_ACCESS_TOKEN || !THREADS_USER_ID) {
    throw new Error('Threads not configured — missing env vars');
  }

  // Step 1: Create media container
  const containerParams = new URLSearchParams({
    access_token: THREADS_ACCESS_TOKEN,
  });

  if (content.images.length > 0) {
    containerParams.set('media_type', 'IMAGE');
    containerParams.set('image_url', content.images[0]);
    containerParams.set('text', content.text);
  } else {
    containerParams.set('media_type', 'TEXT');
    containerParams.set('text', content.text);
  }

  const containerRes = await fetch(
    `${THREADS_API_BASE}/${THREADS_USER_ID}/threads`,
    {
      method: 'POST',
      body: containerParams,
    },
  );

  if (!containerRes.ok) {
    const err = await containerRes.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${containerRes.status}`;
    throw new Error(`Threads container creation failed: ${msg}`);
  }

  const { id: containerId } = (await containerRes.json()) as { id: string };

  // Step 2: Publish the container
  const publishParams = new URLSearchParams({
    creation_id: containerId,
    access_token: THREADS_ACCESS_TOKEN,
  });

  const publishRes = await fetch(
    `${THREADS_API_BASE}/${THREADS_USER_ID}/threads_publish`,
    {
      method: 'POST',
      body: publishParams,
    },
  );

  if (!publishRes.ok) {
    const err = await publishRes.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${publishRes.status}`;
    throw new Error(`Threads publish failed: ${msg}`);
  }

  const { id: postId } = (await publishRes.json()) as { id: string };
  const postUrl = `https://www.threads.net/@thezao/post/${postId}`;

  return { postId, postUrl };
}

// ---------------------------------------------------------------------------
// Token refresh
// ---------------------------------------------------------------------------

/**
 * Refresh a long-lived Threads access token.
 * Tokens expire after 60 days. Call this periodically to extend.
 * Returns the new token — caller is responsible for persisting it.
 */
export async function refreshThreadsToken(): Promise<string> {
  const { THREADS_ACCESS_TOKEN } = ENV;

  if (!THREADS_ACCESS_TOKEN) {
    throw new Error('No Threads access token to refresh');
  }

  const params = new URLSearchParams({
    grant_type: 'th_exchange_token',
    access_token: THREADS_ACCESS_TOKEN,
  });

  const res = await fetch(
    `${THREADS_API_BASE}/oauth/access_token?${params.toString()}`,
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Threads token refresh failed: ${msg}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}
