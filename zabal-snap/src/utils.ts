/**
 * Format a bigint token amount to human-readable string.
 * e.g. 1_200_000_000n with decimals=18 -> "1.2B"
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const num = Number(amount) / 10 ** decimals;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(2);
}

/**
 * Format USD price. Handles very small numbers.
 * e.g. 0.000000141 -> "$0.000000141"
 */
export function formatUsd(price: number): string {
  if (price < 0.01) {
    const str = price.toFixed(20);
    const match = str.match(/^0\.(0*[1-9]\d{0,2})/);
    if (match) return `$0.${match[1]}`;
    return `$${price.toExponential(2)}`;
  }
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(1)}K`;
  return `$${price.toFixed(2)}`;
}

/**
 * Shorten an Ethereum address: 0x1234...abcd
 */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
