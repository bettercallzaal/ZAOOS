/**
 * Format a timestamp as a human-readable relative time string.
 * Used across chat messages, sidebar, notifications, etc.
 */
export function timeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isThisYear) return `${month} ${day}, ${time}`;
  return `${month} ${day}, ${date.getFullYear()}`;
}

/**
 * Format a wallet address as shortened form: 0x1234...5678
 */
export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Format a number with K/M suffixes for display.
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
