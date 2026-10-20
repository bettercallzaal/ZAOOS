// Pure aggregation for the WaveZ Station buyer snapshot (scripts/cards-buyer-snapshot.ts).
// Event shape and field meanings: research doc 2668 section 5. The buyer is topics[3],
// never tx.from, because buys arrive direct, through a router and through ERC-4337.

export const WAVEZ_CONTRACT = '0x6EEe0a8ebd1446a3a77a8F720bF37232fD88b255' as const;
export const ACCESS_PURCHASED_TOPIC =
  '0x91d2571f73e755f74c311033a226d71e90497226bcd164949105c22376d6d1ad' as const;
export const WAVEZ_DEPLOY_BLOCK = 49_105_370n;
export const USDC_DECIMALS = 6;

export interface PurchaseLog {
  buyer: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
}

export interface BuyerTotal {
  buyer: `0x${string}`;
  totalUsdc: string;
  totalRaw: bigint;
  buys: number;
  firstBlock: bigint;
  lastBlock: bigint;
}

export function usdcToRaw(usdc: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(usdc)) throw new Error(`not a USDC amount: ${usdc}`);
  const [whole, frac = ''] = usdc.split('.');
  return BigInt(whole) * 10n ** BigInt(USDC_DECIMALS) + BigInt(frac.padEnd(USDC_DECIMALS, '0'));
}

export function rawToUsdc(raw: bigint): string {
  const unit = 10n ** BigInt(USDC_DECIMALS);
  const frac = (raw % unit).toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return frac ? `${raw / unit}.${frac}` : `${raw / unit}`;
}

/**
 * Sums purchases per buyer and keeps buyers whose total is at least `minRaw`.
 * A purchase is unique by (transaction hash, log index), so a log seen twice
 * (overlapping block ranges) is counted once.
 */
export function aggregateBuyers(logs: PurchaseLog[], minRaw: bigint): BuyerTotal[] {
  const seen = new Set<string>();
  const byBuyer = new Map<string, BuyerTotal>();
  for (const log of logs) {
    const key = `${log.transactionHash}:${log.logIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const buyer = log.buyer.toLowerCase() as `0x${string}`;
    const prev = byBuyer.get(buyer);
    if (prev) {
      prev.totalRaw += log.amount;
      prev.buys += 1;
      if (log.blockNumber < prev.firstBlock) prev.firstBlock = log.blockNumber;
      if (log.blockNumber > prev.lastBlock) prev.lastBlock = log.blockNumber;
    } else {
      byBuyer.set(buyer, {
        buyer,
        totalUsdc: '',
        totalRaw: log.amount,
        buys: 1,
        firstBlock: log.blockNumber,
        lastBlock: log.blockNumber,
      });
    }
  }
  return [...byBuyer.values()]
    .filter((b) => b.totalRaw >= minRaw)
    .map((b) => ({ ...b, totalUsdc: rawToUsdc(b.totalRaw) }))
    .sort((a, b) =>
      a.firstBlock === b.firstBlock
        ? a.buyer.localeCompare(b.buyer)
        : a.firstBlock < b.firstBlock
          ? -1
          : 1,
    );
}

/** Block ranges of at most `size` blocks covering [from, to]. */
export function blockChunks(from: bigint, to: bigint, size: bigint): [bigint, bigint][] {
  if (size <= 0n) throw new Error('chunk size must be positive');
  const chunks: [bigint, bigint][] = [];
  for (let start = from; start <= to; start += size) {
    const end = start + size - 1n;
    chunks.push([start, end > to ? to : end]);
  }
  return chunks;
}

/** Base produces a block every 2 seconds. */
export const BASE_BLOCK_SECONDS = 2;

/**
 * The block to start scanning from for a song created at `createdAt` (ISO time),
 * with a 20 percent margin plus one hour, never before the contract's deploy block.
 * The margin stays small because free RPCs only serve recent blocks (about 10,000
 * on publicnode as of 2026-10-20), so a scan of a new song must fit that window.
 * Without a usable date it returns the deploy block, which is always safe.
 */
export function estimateStartBlock(
  latest: bigint,
  createdAt: string | undefined,
  nowMs: number,
): bigint {
  const created = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (Number.isNaN(created) || created > nowMs) return WAVEZ_DEPLOY_BLOCK;
  const ageSeconds = (nowMs - created) / 1000;
  const back = BigInt(Math.ceil((ageSeconds * 1.2 + 3_600) / BASE_BLOCK_SECONDS));
  const start = latest - back;
  return start < WAVEZ_DEPLOY_BLOCK ? WAVEZ_DEPLOY_BLOCK : start;
}
