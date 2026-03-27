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
