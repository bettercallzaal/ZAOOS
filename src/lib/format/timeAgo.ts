/**
 * Format a timestamp as a human-readable relative time string.
 * Used across chat messages, sidebar, notifications, etc.
 *
 * Accepts a date string, Date object, or undefined.
 * Returns "just now", "2m ago", "3h ago", or a formatted date for older messages.
 */
export function timeAgo(timestamp: string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
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
 * Compact variant: returns short labels without "ago" suffix.
 * Used in conversation lists, sidebars, and notification badges.
 *
 * Returns '', 'now', '2m', '3h', '5d'.
 */
export function timeAgoCompact(timestamp: string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Simple variant: returns "just now", "Xm ago", "Xh ago", "Xd ago".
 * Unlike timeAgo(), always uses "Xd ago" for older messages instead of a full date.
 */
export function timeAgoSimple(timestamp: string | Date | undefined): string {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format a future deadline as a countdown string.
 * Returns "Voting closed" if the date has passed, or a human-readable
 * remaining time like "2d 5h remaining", "3h remaining", "12m remaining".
 */
export function formatTimeRemaining(closesAt: string | Date): string {
  const deadline = typeof closesAt === 'string' ? new Date(closesAt) : closesAt;
  const timeLeft = deadline.getTime() - Date.now();

  if (timeLeft <= 0) return 'Voting closed';

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) return `${days}d ${remainingHours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.max(1, minutes)}m remaining`;
}

/**
 * Check if a deadline has passed.
 */
export function isDeadlinePassed(closesAt: string | Date | null | undefined): boolean {
  if (!closesAt) return false;
  const deadline = typeof closesAt === 'string' ? new Date(closesAt) : closesAt;
  return deadline.getTime() < Date.now();
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
