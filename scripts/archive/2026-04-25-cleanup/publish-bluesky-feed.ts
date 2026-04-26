/**
 * One-time script to publish the "ZAO Music" feed on Bluesky.
 * Run with: npx tsx scripts/publish-bluesky-feed.ts
 *
 * Requirements:
 * - BLUESKY_HANDLE and BLUESKY_APP_PASSWORD env vars set
 * - BLUESKY_FEED_URL env var set to your deployed feed endpoint
 *   (e.g., https://zaoos.com/api/bluesky/feed)
 */

import { AtpAgent } from '@atproto/api';
import 'dotenv/config';

const FEED_URL = process.env.BLUESKY_FEED_URL || 'https://zaoos.com/api/bluesky/feed';
const HANDLE = process.env.BLUESKY_HANDLE;
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;

async function main() {
  if (!HANDLE || !PASSWORD) {
    console.error('Set BLUESKY_HANDLE and BLUESKY_APP_PASSWORD env vars');
    process.exit(1);
  }

  const agent = new AtpAgent({ service: 'https://bsky.social' });
  await agent.login({ identifier: HANDLE, password: PASSWORD });
  console.log(`Logged in as ${agent.session?.handle} (${agent.session?.did})`);

  const feedDid = `did:web:${new URL(FEED_URL).hostname}`;

  // Check if feed already exists
  try {
    const existing = await agent.api.app.bsky.feed.getFeedGenerator({
      feed: `at://${agent.session!.did}/app.bsky.feed.generator/zao-music`,
    });
    if (existing.data) {
      console.log('Feed already published! Updating...');
    }
  } catch {
    console.log('Feed not found, creating new...');
  }

  // Publish the feed generator record
  await agent.api.com.atproto.repo.putRecord({
    repo: agent.session!.did,
    collection: 'app.bsky.feed.generator',
    rkey: 'zao-music',
    record: {
      did: feedDid,
      displayName: 'ZAO Music',
      description: 'Posts from ZAO community members — music artists building onchain. Curated by The ZAO.',
      createdAt: new Date().toISOString(),
    },
  });

  console.log('\nFeed published successfully!');
  console.log(`View at: https://bsky.app/profile/${HANDLE}/feed/zao-music`);
  console.log(`Feed DID: ${feedDid}`);
  console.log(`Feed URL: ${FEED_URL}`);
  console.log('\nNext steps:');
  console.log('1. Run the SQL migration: scripts/create-bluesky-tables.sql');
  console.log('2. Add ZAO members via /admin or let them connect in Settings');
  console.log('3. Sync posts: POST /api/bluesky/sync (admin)');
  console.log('4. Pin the feed on the @thezao Bluesky profile');
}

main().catch((err) => {
  console.error('Failed to publish feed:', err);
  process.exit(1);
});
