/**
 * Hypersnap gRPC event stream subscriber (doc 761, Phase 2).
 *
 * Subscribes to the self-hosted Hypersnap node's gRPC stream (:3383), filtered to events that
 * mention the bot FID or match configured keywords, and hands each matching cast to a callback
 * (which enqueues a ZOE caster task). Reading the stream is free; this does NOT write.
 *
 * Env:
 *   FARCASTER_NODE_GRPC     host:port of the node gRPC (e.g. 1.2.3.4:3383)
 *   FARCASTER_NODE_GRPC_SSL '1' to use the SSL client (default insecure for a self-hosted box)
 *   FARCASTER_BOT_FID       bot FID - we react to casts mentioning it
 *   CASTER_KEYWORDS         comma list of keywords that also trigger (e.g. "zao,zabal,$zabal")
 *
 * Requires: npm i @farcaster/hub-nodejs
 */
import {
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubEventType,
  type HubRpcClient,
  type Message,
} from '@farcaster/hub-nodejs';

export interface IncomingCast {
  fid: number;
  hash: `0x${string}`;
  text: string;
  mentions: number[];
}

function keywords(): string[] {
  return (process.env.CASTER_KEYWORDS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Decide whether a cast should trigger the caster (mentions bot FID or matches a keyword). */
function matches(cast: IncomingCast, botFid: number): boolean {
  if (botFid && cast.mentions.includes(botFid)) return true;
  const kws = keywords();
  if (kws.length === 0) return false;
  const lower = cast.text.toLowerCase();
  return kws.some((k) => lower.includes(k));
}

function extractCast(message: Message): IncomingCast | null {
  const body = message.data?.castAddBody;
  if (!body) return null;
  return {
    fid: message.data?.fid ?? 0,
    hash: `0x${Buffer.from(message.hash).toString('hex')}`,
    text: body.text ?? '',
    mentions: body.mentions ?? [],
  };
}

function makeClient(): HubRpcClient {
  const addr = process.env.FARCASTER_NODE_GRPC;
  if (!addr) throw new Error('FARCASTER_NODE_GRPC not set (host:port of the node gRPC, :3383)');
  return process.env.FARCASTER_NODE_GRPC_SSL === '1'
    ? getSSLHubRpcClient(addr)
    : getInsecureHubRpcClient(addr);
}

/**
 * Subscribe to merge-message events and invoke onCast for each matching CastAdd. Returns a
 * stop() function. Reconnect/backoff is the caller's concern for v1 (the bot supervisor
 * restarts the process); we log disconnects.
 */
export async function subscribeToCasts(onCast: (c: IncomingCast) => void | Promise<void>): Promise<() => void> {
  const client = makeClient();
  const botFid = Number(process.env.FARCASTER_BOT_FID ?? 0);

  const sub = await client.subscribe({ eventTypes: [HubEventType.MERGE_MESSAGE] });
  if (sub.isErr()) {
    client.close();
    throw sub.error;
  }
  const stream = sub.value;

  stream.on('data', (event: { mergeMessageBody?: { message?: Message } }) => {
    const message = event.mergeMessageBody?.message;
    if (!message) return;
    const cast = extractCast(message);
    if (!cast) return;
    if (!matches(cast, botFid)) return;
    Promise.resolve(onCast(cast)).catch((e) =>
      console.error('[farcaster/event-stream] onCast handler failed:', (e as Error).message),
    );
  });
  stream.on('error', (e: Error) => console.error('[farcaster/event-stream] stream error:', e.message));
  stream.on('close', () => console.warn('[farcaster/event-stream] stream closed'));

  console.log(`[farcaster/event-stream] subscribed (botFid=${botFid}, keywords=[${keywords().join(',')}])`);

  return () => {
    try {
      stream.cancel();
    } catch {
      /* noop */
    }
    client.close();
  };
}
