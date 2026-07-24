/**
 * user-errors - keep raw error internals out of what a human sees.
 *
 * ZOE handlers repeatedly did `ctx.reply(`X failed - ${(err as Error).message.slice(0, N)}`)`,
 * which forwards raw error text (and arbitrary mid-word truncation) straight to
 * Zaal. That leaks absolute filesystem paths, tokens, and stack fragments, and
 * reads as noise. `sanitizeErrorForUser` gives a short, safe, still-useful gist
 * while the FULL raw error is logged internally for debugging.
 *
 * Boundary: pure string handling. The caller is responsible for logging the raw
 * error (or pass `log: true` to have this do it).
 */

/** Redact things a human should never see in a chat message. */
function redact(text: string): string {
  return (
    text
      // absolute filesystem paths (unix + windows + file://)
      .replace(/\b(?:file:\/\/)?(?:\/[\w.\-@]+){2,}\/?/g, '<path>')
      .replace(/\b[A-Za-z]:\\[\\\w.\-@]+/g, '<path>')
      // bearer tokens / long hex (keys, hashes) / common key prefixes
      .replace(/\b(?:sk-ant-|sk-|ghp_|xox[baprs]-)[A-Za-z0-9_-]{10,}/g, '<redacted>')
      .replace(/\b[0-9a-fA-F]{32,}\b/g, '<redacted>')
      .replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, 'Bearer <redacted>')
      // collapse whitespace/newlines the redaction may leave
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** Truncate to <= max chars on a word boundary, adding an ellipsis marker. */
function clip(text: string, max = 140): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}

export interface SanitizeOptions {
  /** Prefix like "Transcription" -> "Transcription failed - ...". */
  action?: string;
  /** Also console.error the raw error internally. Default false (caller logs). */
  log?: boolean;
  /** Max length of the returned gist. */
  max?: number;
}

/**
 * Turn any caught value into a short, path/token-free message safe to send to a
 * human. The full raw error should be logged separately (or pass `log: true`).
 */
export function sanitizeErrorForUser(err: unknown, opts: SanitizeOptions = {}): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'unknown error');
  if (opts.log) console.error(`[zoe] ${opts.action ?? 'operation'} failed:`, err);
  const gist = clip(redact(raw), opts.max ?? 140) || 'unknown error';
  return opts.action ? `${opts.action} failed - ${gist}` : gist;
}
