import { ENV } from '@/lib/env';

const NEYNAR_BASE = 'https://api.neynar.com/v2/farcaster';

function headers() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': ENV.NEYNAR_API_KEY,
  };
}

export async function getChannelFeed(channelId: string, cursor?: string, limit = 20) {
  const params = new URLSearchParams({
    channel_ids: channelId,
    limit: String(limit),
    with_recasts: 'false',
  });
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`${NEYNAR_BASE}/feed/channels?${params}`, {
    headers: headers(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar feed error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function postCast(
  signerUuid: string,
  text: string,
  channelId: string,
  parentHash?: string,
  embedHash?: string,
  embedUrls?: string[],
  embedFid?: number,
  apiKey?: string,
) {
  const body: Record<string, unknown> = {
    signer_uuid: signerUuid,
    text,
    channel_id: channelId,
  };
  if (parentHash) body.parent = parentHash;

  const embeds: Record<string, unknown>[] = [];
  if (embedHash) {
    // Neynar requires both hash and fid for cast embeds
    if (embedFid) {
      embeds.push({ cast_id: { hash: embedHash, fid: embedFid } });
    } else {
      // Fallback: embed as URL which Farcaster will unfurl
      embeds.push({ url: `https://farcaster.xyz/~/conversations/${embedHash}` });
    }
  }
  if (embedUrls) {
    for (const url of embedUrls) {
      embeds.push({ url });
    }
  }
  if (embeds.length > 0) body.embeds = embeds;

  const res = await fetch(`${NEYNAR_BASE}/cast`, {
    method: 'POST',
    headers: apiKey ? { 'Content-Type': 'application/json', 'x-api-key': apiKey } : headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar post error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getCastThread(hash: string) {
  const params = new URLSearchParams({
    identifier: hash,
    type: 'hash',
    reply_depth: '1',
    include_chronological_parent_casts: 'false',
  });
  const res = await fetch(`${NEYNAR_BASE}/cast/conversation?${params}`, {
    headers: headers(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar thread error ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export async function getUserByFid(fid: number, viewerFid?: number) {
  const params = new URLSearchParams({ fids: String(fid) });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  const res = await fetch(`${NEYNAR_BASE}/user/bulk?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar user error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.users?.[0] || null;
}

export async function getUsersByFids(fids: number[]) {
  if (!fids.length) return [];
  const params = new URLSearchParams({ fids: fids.join(',') });
  const res = await fetch(`${NEYNAR_BASE}/user/bulk?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar bulk user error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.users || [];
}

export async function getUserByAddress(address: string) {
  const res = await fetch(`${NEYNAR_BASE}/user/bulk-by-address?addresses=${address}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neynar address lookup error ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const users = data[address.toLowerCase()];
  return users?.[0] || null;
}

export async function createSigner() {
  const res = await fetch(`${NEYNAR_BASE}/signer`, {
    method: 'POST',
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar signer error: ${res.status}`);
  return res.json();
}

export async function registerSignedKey(
  signerUuid: string,
  appFid: number,
  deadline: number,
  signature: string
) {
  const res = await fetch(`${NEYNAR_BASE}/signer/signed_key`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      app_fid: appFid,
      deadline,
      signature,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar register key error: ${res.status}`);
  return res.json();
}

export async function getSignerStatus(signerUuid: string) {
  const res = await fetch(`${NEYNAR_BASE}/signer?signer_uuid=${signerUuid}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar signer status error: ${res.status}`);
  return res.json();
}

export async function searchUsers(query: string, limit = 5) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  const res = await fetch(`${NEYNAR_BASE}/user/search?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar search error: ${res.status}`);
  return res.json();
}

export async function getFollowers(fid: number, viewerFid?: number, sortType: 'desc_chron' | 'algorithmic' = 'desc_chron', cursor?: string, limit = 100) {
  const params = new URLSearchParams({
    fid: String(fid),
    sort_type: sortType,
    limit: String(limit),
  });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`${NEYNAR_BASE}/followers?${params}`, {
    headers: headers(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar followers error: ${res.status}`);
  return res.json();
}

export async function getFollowing(fid: number, viewerFid?: number, sortType: 'desc_chron' | 'algorithmic' = 'desc_chron', cursor?: string, limit = 100) {
  const params = new URLSearchParams({
    fid: String(fid),
    sort_type: sortType,
    limit: String(limit),
  });
  if (viewerFid) params.set('viewer_fid', String(viewerFid));
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`${NEYNAR_BASE}/following?${params}`, {
    headers: headers(),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar following error: ${res.status}`);
  return res.json();
}

export async function getRelevantFollowers(targetFid: number, viewerFid: number) {
  const params = new URLSearchParams({
    target_fid: String(targetFid),
    viewer_fid: String(viewerFid),
  });
  const res = await fetch(`${NEYNAR_BASE}/followers/relevant?${params}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar relevant followers error: ${res.status}`);
  return res.json();
}

export async function followUser(signerUuid: string, targetFids: number[]) {
  const res = await fetch(`${NEYNAR_BASE}/user/follow`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      target_fids: targetFids,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar follow error: ${res.status}`);
  return res.json();
}

export async function unfollowUser(signerUuid: string, targetFids: number[]) {
  const res = await fetch(`${NEYNAR_BASE}/user/follow`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({
      signer_uuid: signerUuid,
      target_fids: targetFids,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar unfollow error: ${res.status}`);
  return res.json();
}

export async function registerUser(
  signature: string,
  custodyAddress: string,
  deadline: number,
  fname?: string
) {
  const body: Record<string, unknown> = {
    signature,
    custody_address: custodyAddress,
    deadline,
  };
  if (fname) body.fname = fname;

  const res = await fetch(`${NEYNAR_BASE}/user`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Neynar register error: ${res.status}`);
  return res.json();
}
