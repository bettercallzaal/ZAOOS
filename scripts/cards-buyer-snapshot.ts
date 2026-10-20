/**
 * Read-only snapshot of who bought one song on WaveZ Station (Base), for the first
 * Zaal Digital Card. It reads AccessPurchased events from the WaveZ Station contract
 * and lists buyers whose total for the song is at least --min-usdc.
 *
 * It sends no transaction, holds no key and posts nothing. The wallet list is written
 * to ~/.zao/private/ (never into a repo); stdout carries counts only. Minting or
 * airdropping to the list is Zaal's.
 *
 *   npx tsx scripts/cards-buyer-snapshot.ts --song-uuid <wavezstation uuid> [--min-usdc 1]
 *   npx tsx scripts/cards-buyer-snapshot.ts --song-id 0x<64 hex> [--from-block N] [--to-block N]
 *
 * Env: BASE_RPC_URL (optional; default publicnode, which only serves recent blocks).
 * With --song-uuid the scan starts a margin before the song's created_at; with
 * --song-id and no --from-block it starts at the contract's deploy block.
 * Exit: 0 snapshot written (the count may be 0, and is printed), 1 the cross-check
 * failed, 2 bad input or the chain/API could not be read.
 */
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createPublicClient, decodeEventLog, http, parseAbi, parseAbiItem } from 'viem';
import { base } from 'viem/chains';
import {
  ACCESS_PURCHASED_TOPIC,
  aggregateBuyers,
  blockChunks,
  estimateStartBlock,
  type PurchaseLog,
  usdcToRaw,
  WAVEZ_CONTRACT,
} from './lib/wavez-buyers';

const EVENT = parseAbiItem(
  'event AccessPurchased(bytes32 indexed songId, address indexed payer, address indexed buyer, uint256 amount, uint256 fanAmount, uint256 creatorAmount, uint256 platformAmount)',
);
const READS = parseAbi(['function hasAccess(bytes32, address) view returns (bool)']);
// mainnet.base.org answered "request limit reached" to a single 5,000-block getLogs on
// 2026-10-20; publicnode answered, but only for roughly the last 10,000 blocks
// ("Archive requests require a personal token"). Older or rolling snapshots need a
// keyed RPC in BASE_RPC_URL.
const DEFAULT_RPC = 'https://base-rpc.publicnode.com';
const CHUNK = 5_000n;
const RETRIES = 4;

/** Retries a read with backoff; the public Base RPC rate-limits long scans. */
async function withRetry<T>(read: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await read();
    } catch (error: unknown) {
      if (attempt >= RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(message: string, code = 2): never {
  console.error(`cards-buyer-snapshot: ${message}`);
  process.exit(code);
}

async function songFromUuid(
  uuid: string,
): Promise<{ songId: `0x${string}`; title: string; createdAt?: string }> {
  const res = await fetch(`https://www.wavezstation.com/api/songs/${encodeURIComponent(uuid)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (ZAO cards snapshot)' },
  });
  if (!res.ok) fail(`song API returned HTTP ${res.status} for ${uuid}`);
  const body: unknown = await res.json();
  const song = (
    body && typeof body === 'object' && 'song' in body ? (body as { song: unknown }).song : body
  ) as Record<string, unknown>;
  const id = song?.wavestation_song_id;
  if (typeof id !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(id)) {
    fail(`song ${uuid} has no wavestation_song_id; is it on chain yet?`);
  }
  return {
    songId: id as `0x${string}`,
    title: typeof song.title === 'string' ? song.title : uuid,
    createdAt: typeof song.created_at === 'string' ? song.created_at : undefined,
  };
}

async function main(): Promise<void> {
  const uuid = arg('song-uuid');
  const rawId = arg('song-id');
  if (!uuid && !rawId) fail('pass --song-uuid or --song-id');
  if (rawId && !/^0x[0-9a-fA-F]{64}$/.test(rawId))
    fail('--song-id must be 0x plus 64 hex characters');
  const minUsdc = arg('min-usdc') ?? '1';
  let minRaw: bigint;
  try {
    minRaw = usdcToRaw(minUsdc);
  } catch (error: unknown) {
    fail(error instanceof Error ? error.message : 'bad --min-usdc');
  }

  const song = uuid
    ? await songFromUuid(uuid)
    : { songId: rawId as `0x${string}`, title: rawId as string };
  const client = createPublicClient({
    chain: base,
    transport: http(process.env.BASE_RPC_URL || DEFAULT_RPC),
  });

  const latest = await client.getBlockNumber();
  const toBlock = arg('to-block') ? BigInt(arg('to-block') as string) : latest;
  const fromBlock = arg('from-block')
    ? BigInt(arg('from-block') as string)
    : estimateStartBlock(latest, song.createdAt, Date.now());
  if (fromBlock > toBlock) fail(`--from-block ${fromBlock} is after --to-block ${toBlock}`);

  const logs: PurchaseLog[] = [];
  for (const [from, to] of blockChunks(fromBlock, toBlock, CHUNK)) {
    const page = await withRetry(() =>
      client.getLogs({
        address: WAVEZ_CONTRACT,
        event: EVENT,
        args: { songId: song.songId },
        fromBlock: from,
        toBlock: to,
      }),
    );
    for (const log of page) {
      if (log.topics[0] !== ACCESS_PURCHASED_TOPIC) continue;
      const decoded = decodeEventLog({ abi: [EVENT], data: log.data, topics: log.topics });
      logs.push({
        buyer: decoded.args.buyer,
        amount: decoded.args.amount,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
      });
    }
  }

  const buyers = aggregateBuyers(logs, minRaw);

  // Cross-check: every listed buyer must also read true from hasAccess on chain.
  // It runs BEFORE anything is written, so a failed run leaves no list behind.
  const access = await Promise.all(
    buyers.map((b) =>
      withRetry(() =>
        client.readContract({
          address: WAVEZ_CONTRACT,
          abi: READS,
          functionName: 'hasAccess',
          args: [song.songId, b.buyer],
          blockNumber: toBlock,
        }),
      ),
    ),
  );
  const mismatched = buyers.filter((_, i) => access[i] !== true).length;

  console.log(`song ${song.title} (${song.songId})`);
  console.log(`blocks ${fromBlock} to ${toBlock}: ${logs.length} purchase events`);
  console.log(`buyers with at least ${minUsdc} USDC: ${buyers.length}`);
  if (mismatched > 0) {
    fail(`${mismatched} listed buyers read false from hasAccess; no list written`, 1);
  }

  // The list only ever goes to ~/.zao/private (pii-hygiene.md rule 1); there is no
  // flag to send it anywhere else, so it cannot land in a repo.
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const dir = join(homedir(), '.zao', 'private');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const outPath = join(dir, `wavez-buyers-${song.songId.slice(2, 10)}-${date}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        contract: WAVEZ_CONTRACT,
        chainId: base.id,
        songId: song.songId,
        title: song.title,
        minUsdc,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        purchaseEvents: logs.length,
        hasAccessCrossCheck: 'passed',
        buyers: buyers.map((b) => ({
          buyer: b.buyer,
          totalUsdc: b.totalUsdc,
          buys: b.buys,
          firstBlock: b.firstBlock.toString(),
          lastBlock: b.lastBlock.toString(),
        })),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  chmodSync(outPath, 0o600);
  console.log(`written to ${outPath}`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
