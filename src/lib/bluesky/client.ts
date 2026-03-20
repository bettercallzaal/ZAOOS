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
 * Post to Bluesky. If userCredentials are provided, posts from that account.
 * Otherwise posts from the community account (env vars).
 * Returns the post URI or null if posting failed.
 */
export async function postToBluesky(
  text: string,
  linkUrl?: string,
  userCredentials?: { handle: string; appPassword: string } | null,
): Promise<string | null> {
  try {
    let agent: AtpAgent | null = null;

    if (userCredentials?.handle && userCredentials?.appPassword) {
      agent = await getUserAgent(userCredentials.handle, userCredentials.appPassword);
    } else {
      agent = await getCommunityAgent();
    }

    if (!agent) return null;

    const fullText = formatBlueskyText(text, linkUrl);
    const rt = new RichText({ text: fullText });
    await rt.detectFacets(agent);

    const response = await agent.post({
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    });

    return response.uri;
  } catch (err) {
    console.error('[bluesky] Post failed:', err);
    return null;
  }
}
