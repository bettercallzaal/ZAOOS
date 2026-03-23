import { AtpAgent, RichText } from '@atproto/api';

let communityAgent: AtpAgent | null = null;
let communitySessionExpiry = 0;

/**
 * Get the community Bluesky agent using env var App Password.
 * Returns null if not configured (with warning log).
 */
async function getCommunityAgent(): Promise<AtpAgent | null> {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!handle || !password) {
    console.warn('[bluesky] Community account not configured — set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD');
    return null;
  }

  if (communityAgent && Date.now() < communitySessionExpiry) return communityAgent;

  try {
    communityAgent = new AtpAgent({ service: 'https://bsky.social' });
    await communityAgent.login({ identifier: handle, password });
    communitySessionExpiry = Date.now() + 30 * 60 * 1000;
    return communityAgent;
  } catch (err) {
    console.error('[bluesky] Community agent login failed:', err);
    communityAgent = null;
    return null;
  }
}

/**
 * Get an agent for a specific user's Bluesky account.
 */
async function getUserAgent(handle: string, appPassword: string): Promise<AtpAgent | null> {
  try {
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    await agent.login({ identifier: handle, password: appPassword });
    return agent;
  } catch (err) {
    console.error(`[bluesky] User agent login failed for ${handle}:`, err);
    return null;
  }
}

/**
 * Format and truncate text for Bluesky's 300-char limit.
 */
function formatBlueskyText(text: string, linkUrl?: string): string {
  const maxLen = linkUrl ? 270 : 300;
  const truncated = text.length > maxLen
    ? text.slice(0, maxLen - 3) + '...'
    : text;
  return linkUrl ? `${truncated}\n\n${linkUrl}` : truncated;
}

/**
 * Split long text into thread-sized chunks (max 300 chars each).
 * Tries to break on sentence boundaries, then word boundaries.
 */
export function splitIntoThread(text: string, maxLen = 300): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split on sentence boundary
    let splitAt = remaining.lastIndexOf('. ', maxLen - 1);
    if (splitAt < maxLen / 2) splitAt = remaining.lastIndexOf(' ', maxLen - 1);
    if (splitAt < maxLen / 2) splitAt = maxLen - 1;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  return chunks;
}

/**
 * Post a thread (multiple linked posts) to Bluesky.
 * Each reply references the root (first post) and its immediate parent.
 * Returns an array of post URIs.
 */
export async function postBlueskyThread(
  texts: string[],
  agent: AtpAgent,
): Promise<string[]> {
  const uris: string[] = [];
  let parentRef: { uri: string; cid: string } | undefined;
  let rootRef: { uri: string; cid: string } | undefined;

  for (const text of texts) {
    const rt = new RichText({ text });
    await rt.detectFacets(agent);

    const post: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    };

    if (parentRef && rootRef) {
      post.reply = {
        root: rootRef,
        parent: parentRef,
      };
    }

    const result = await agent.post(post);
    uris.push(result.uri);
    parentRef = { uri: result.uri, cid: result.cid };
    if (!rootRef) rootRef = { uri: result.uri, cid: result.cid };
  }
  return uris;
}

/**
 * Upload an image from a URL to Bluesky's blob store.
 * Returns the blob reference and mime type, or null on failure.
 */
export async function uploadBlueskyImage(
  agent: AtpAgent,
  imageUrl: string,
): Promise<{ blob: unknown; mimeType: string } | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const { data } = await agent.uploadBlob(buffer, { encoding: mimeType });
    return { blob: data.blob, mimeType };
  } catch {
    return null;
  }
}

/**
 * Post to Bluesky with support for threads, images, and embed cards.
 *
 * - Long text (>300 chars) is automatically split into a threaded reply chain.
 * - Provide `imageUrls` to upload and attach images (max 4 per Bluesky spec).
 * - Provide `embedUrl` to attach a link card embed.
 * - If userCredentials are provided, posts from that account; otherwise community account.
 *
 * Returns the first post URI (thread root) or null if posting failed.
 */
export async function postToBluesky(
  text: string,
  linkUrl?: string,
  userCredentials?: { handle: string; appPassword: string } | null,
  options?: {
    imageUrls?: string[];
    embedUrl?: { url: string; title: string; description: string; thumbUrl?: string };
  },
): Promise<string | null> {
  try {
    let agent: AtpAgent | null = null;

    if (userCredentials?.handle && userCredentials?.appPassword) {
      agent = await getUserAgent(userCredentials.handle, userCredentials.appPassword);
    } else {
      agent = await getCommunityAgent();
    }

    if (!agent) return null;

    // Build embed (images take priority over link card per Bluesky spec)
    let embed: Record<string, unknown> | undefined;

    if (options?.imageUrls?.length) {
      const imageResults = await Promise.allSettled(
        options.imageUrls.slice(0, 4).map((url) => uploadBlueskyImage(agent!, url)),
      );
      const images = imageResults
        .filter((r): r is PromiseFulfilledResult<{ blob: unknown; mimeType: string } | null> =>
          r.status === 'fulfilled' && r.value !== null,
        )
        .map((r) => ({
          alt: '',
          image: r.value!.blob,
        }));

      if (images.length > 0) {
        embed = {
          $type: 'app.bsky.embed.images',
          images,
        };
      }
    } else if (options?.embedUrl) {
      let thumb: unknown | undefined;
      if (options.embedUrl.thumbUrl) {
        const thumbResult = await uploadBlueskyImage(agent, options.embedUrl.thumbUrl);
        if (thumbResult) thumb = thumbResult.blob;
      }

      embed = {
        $type: 'app.bsky.embed.external',
        external: {
          uri: options.embedUrl.url,
          title: options.embedUrl.title,
          description: options.embedUrl.description,
          ...(thumb ? { thumb } : {}),
        },
      };
    }

    // Thread splitting for long text
    const fullText = linkUrl && !options?.embedUrl
      ? `${text}\n\n${linkUrl}`
      : text;

    if (fullText.length > 300) {
      const chunks = splitIntoThread(fullText);

      // Attach embed only to the first post in the thread
      const rt = new RichText({ text: chunks[0] });
      await rt.detectFacets(agent);

      const firstPost: Record<string, unknown> = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      };
      if (embed) firstPost.embed = embed;

      const firstResult = await agent.post(firstPost);
      const rootRef = { uri: firstResult.uri, cid: firstResult.cid };
      let parentRef = rootRef;

      // Post remaining chunks as replies
      for (let i = 1; i < chunks.length; i++) {
        const chunkRt = new RichText({ text: chunks[i] });
        await chunkRt.detectFacets(agent);

        const replyPost: Record<string, unknown> = {
          $type: 'app.bsky.feed.post',
          text: chunkRt.text,
          facets: chunkRt.facets,
          createdAt: new Date().toISOString(),
          reply: { root: rootRef, parent: parentRef },
        };

        const replyResult = await agent.post(replyPost);
        parentRef = { uri: replyResult.uri, cid: replyResult.cid };
      }

      return firstResult.uri;
    }

    // Single post (short text)
    const formattedText = linkUrl && !options?.embedUrl
      ? formatBlueskyText(text, linkUrl)
      : text;
    const rt = new RichText({ text: formattedText });
    await rt.detectFacets(agent);

    const post: Record<string, unknown> = {
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    };
    if (embed) post.embed = embed;

    const response = await agent.post(post);
    return response.uri;
  } catch (err) {
    console.error('[bluesky] Post failed:', err);
    return null;
  }
}
