export interface LivepeerStream {
  id: string;
  streamKey: string;
  rtmpIngestUrl: string;
  playbackId: string;
}

export async function createLivepeerStream(
  name: string,
  targets: Array<{ platform: string; rtmpUrl: string; streamKey: string }>
): Promise<LivepeerStream> {
  const res = await fetch('/api/livepeer/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, targets }),
  });
  if (!res.ok) throw new Error('Failed to create Livepeer stream');
  const data = await res.json();
  return data.stream;
}

export async function getLivepeerStreamStatus(id: string) {
  const res = await fetch(`/api/livepeer/stream/${id}`);
  if (!res.ok) throw new Error('Failed to get stream status');
  return res.json();
}

export async function deleteLivepeerStream(id: string) {
  const res = await fetch(`/api/livepeer/stream/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete stream');
  return res.json();
}

export async function createClip(
  playbackId: string,
  startTime: number,
  endTime: number,
  name?: string
) {
  const res = await fetch('/api/livepeer/clip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playbackId, startTime, endTime, name }),
  });
  if (!res.ok) throw new Error('Failed to create clip');
  return res.json();
}
