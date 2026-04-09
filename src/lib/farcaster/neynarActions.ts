export async function publishCast(text: string, embeds: string[] = []) {
  const res = await fetch('/api/neynar/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, embeds }),
  });
  if (!res.ok) throw new Error('Failed to publish cast');
  return res.json();
}

export async function likeCast(castHash: string) {
  const res = await fetch('/api/neynar/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to like cast');
  return res.json();
}

export async function recastCast(castHash: string) {
  const res = await fetch('/api/neynar/recast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to recast');
  return res.json();
}

export async function followUser(targetFid: number) {
  const res = await fetch('/api/neynar/follow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to follow user');
  return res.json();
}

export async function muteUserAction(targetFid: number) {
  const res = await fetch('/api/users/mute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to mute user');
  return res.json();
}

export async function unmuteUserAction(targetFid: number) {
  const res = await fetch('/api/users/mute', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to unmute user');
  return res.json();
}

export async function blockUserAction(targetFid: number) {
  const res = await fetch('/api/users/block', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to block user');
  return res.json();
}

export async function unblockUserAction(targetFid: number) {
  const res = await fetch('/api/users/block', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetFid }),
  });
  if (!res.ok) throw new Error('Failed to unblock user');
  return res.json();
}

export async function deleteCastAction(castHash: string) {
  const res = await fetch('/api/casts/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to delete cast');
  return res.json();
}

export async function getCastSummary(castHash: string) {
  const res = await fetch('/api/casts/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ castHash }),
  });
  if (!res.ok) throw new Error('Failed to get summary');
  return res.json();
}
