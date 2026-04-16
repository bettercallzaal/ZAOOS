import { AtpAgent, RichText } from '@atproto/api';
import type { AppBskyEmbedImages, AppBskyEmbedExternal, $Typed } from '@atproto/api';
import type { NormalizedContent } from './normalize';

let agentCache: AtpAgent | null = null;

export function isBlueskyConfigured(): boolean {
  return !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD);
}

async function getAgent(): Promise<AtpAgent> {
  if (agentCache) return agentCache;

  const agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({
    identifier: process.env.BLUESKY_HANDLE!,
    password: process.env.BLUESKY_APP_PASSWORD!,
  });

  agentCache = agent;
  return agent;
}

export interface BlueskyPublishResult {
  uri: string;
  cid: string;
  postUrl: string;
}

export async function publishToBluesky(content: NormalizedContent): Promise<BlueskyPublishResult> {
  const agent = await getAgent();

  // Build rich text with auto-detected facets (mentions, links)
  const rt = new RichText({ text: content.text });
  await rt.detectFacets(agent);

  // Upload images (max 4)
  const images: AppBskyEmbedImages.Image[] = [];
  for (const imageUrl of content.images.slice(0, 4)) {
    try {
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
      if (!imgRes.ok) continue;
      const buffer = await imgRes.arrayBuffer();
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const { data } = await agent.uploadBlob(new Uint8Array(buffer), { encoding: contentType });
      images.push({ alt: '', image: data.blob });
    } catch (err) {
      console.error('[bluesky] Image upload failed:', err);
    }
  }

  // Build embed
  let embed: $Typed<AppBskyEmbedImages.Main> | $Typed<AppBskyEmbedExternal.Main> | undefined;
  if (images.length > 0) {
    embed = {
      $type: 'app.bsky.embed.images' as const,
      images,
    };
  } else if (content.embeds.length > 0) {
    embed = {
      $type: 'app.bsky.embed.external' as const,
      external: {
        uri: content.embeds[0],
        title: '',
        description: '',
      },
    };
  }

  const result = await agent.post({
    text: rt.text,
    facets: rt.facets,
    embed,
    createdAt: new Date().toISOString(),
  });

  const handle = process.env.BLUESKY_HANDLE!;
  const rkey = result.uri.split('/').pop();

  return {
    uri: result.uri,
    cid: result.cid,
    postUrl: `https://bsky.app/profile/${handle}/post/${rkey}`,
  };
}
