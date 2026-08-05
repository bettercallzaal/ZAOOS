/**
 * research-dedupe.ts — URL deduplication for research dispatch.
 *
 * Before enqueueing a research task, extract the URL and check if that link
 * has already been researched. If found in any research doc, return true;
 * if not found or on any IO error, return false (fail-open).
 *
 * Pure functions with injected fs for testability.
 */

/**
 * Extract the first URL from text. Returns null if no URL found.
 * Matches http:// or https://, stopping at whitespace.
 */
export function extractFirstUrl(text: string): string | null {
  const match = /https?:\/\/\S+/.exec(text);
  return match ? match[0] : null;
}

/**
 * Decide whether a message dropped in the Research topic is a conversational
 * follow-up / command TO ZOE ("can u share it with me", "thanks", "send it")
 * rather than an actual research subject. The Research topic auto-enqueues every
 * plain message as a research task (topic = intent), so without this guard a
 * reply like "can u share it with me" gets queued as a research goal and ZOE
 * spins up a worker to "research" that phrase (audit afaa850, 2026-08-04).
 *
 * Bias: a URL or an explicit research verb is ALWAYS a research subject. Only the
 * obvious command/reply family is rerouted; a genuine multi-word topic with no
 * command markers still researches. A false skip just makes ZOE answer in chat
 * (recoverable); a false research produces a junk doc (the bug we're fixing).
 *
 * Returns true when the message should be treated as chat, not research.
 */
export function isFollowUpNotResearch(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true; // empty is not a research subject
  if (/https?:\/\//.test(t)) return false; // a URL is always a research subject
  // Explicit research intent always wins over the command heuristics below.
  if (/^(research|look into|deep dive|dig into|find out|study|investigate|explore|analyz|analys|compare|summari)/.test(t)) {
    return false;
  }
  // Conversational command/question aimed at ZOE about prior work, not a topic.
  if (/^(can|could|would|will)\s+(you|u|ya)\b/.test(t)) return true; // "can u share it with me"
  if (/^(pls|plz|please|share|send|show|give|resend|forward|link|thanks|thank|ty|ok|okay|cool|nice|great|yes|yep|no|nope|sure|nvm)\b/.test(t)) {
    return true;
  }
  if (/\b(share it|send it|show me|link me|with me|to me|that doc|the doc|resend it)\b/.test(t)) return true;
  // Very short with no research verb: a reply/aside ("thanks!", "yes please").
  if (t.split(/\s+/).filter(Boolean).length <= 2) return true;
  return false;
}

/**
 * Normalize a URL for robust matching: lowercase host, strip protocol,
 * trailing slash, query, and fragment.
 *
 * E.g. "https://example.com/path?q=1#section" -> "example.com/path"
 *      "http://EXAMPLE.COM/path/" -> "example.com/path"
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname?.toLowerCase() || '';
    const path = parsed.pathname.toLowerCase().replace(/\/$/, ''); // strip trailing /, lowercase
    return host + path;
  } catch {
    // If URL parsing fails, do basic cleanup: lowercase and remove protocol
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

/**
 * Check if a URL has been researched by scanning research docs for README.md files.
 * Normalizes both the target URL and any URLs found in the docs for robust matching.
 *
 * @param url - The URL to check
 * @param researchDir - The root directory containing research/<category>/<num>-<slug>/README.md files
 * @param readFileImpl - Optional fs.readFile override for testing (default: node:fs/promises)
 * @param readdirImpl - Optional fs.readdir override for testing (default: node:fs/promises)
 * @returns Promise<true> if URL found in any research doc, false otherwise (including on any error)
 */
export async function wasResearched(
  url: string,
  researchDir: string,
  readFileImpl?: (path: string, encoding: string) => Promise<string>,
  readdirImpl?: (path: string) => Promise<string[]>,
): Promise<boolean> {
  try {
    const normalized = normalizeUrl(url);
    if (!normalized) return false; // Empty normalized URL can't match

    // Use injected or default fs functions
    const readFile = readFileImpl || (async (p: string) => {
      const { promises: fs } = await import('node:fs');
      return fs.readFile(p, 'utf8');
    });
    const readdir = readdirImpl || (async (p: string) => {
      const { promises: fs } = await import('node:fs');
      return fs.readdir(p);
    });

    // List all category directories in research/
    let categories: string[] = [];
    try {
      categories = await readdir(researchDir);
    } catch {
      return false; // research dir doesn't exist or can't be read
    }

    // Scan each category for numbered doc directories
    for (const category of categories) {
      if (category.startsWith('_') || category.startsWith('.')) continue; // Skip archive/meta dirs

      let entries: string[] = [];
      try {
        entries = await readdir(`${researchDir}/${category}`);
      } catch {
        continue; // Skip if category can't be read
      }

      // Check each numbered doc directory
      for (const entry of entries) {
        if (!/^\d+-/.test(entry)) continue; // Skip non-numbered entries

        const readmePath = `${researchDir}/${category}/${entry}/README.md`;
        try {
          const content = await readFile(readmePath, 'utf8');

          // Search for any URL in the README that matches our normalized URL
          const urlMatches = content.match(/https?:\/\/\S+/g) || [];
          for (const foundUrl of urlMatches) {
            if (normalizeUrl(foundUrl) === normalized) {
              return true; // URL found in this doc
            }
          }

          // Also check the frontmatter `original-query` field for the URL
          const originalQueryMatch = /original-query:\s*"([^"]+)"/.exec(content);
          if (originalQueryMatch) {
            const originalQuery = originalQueryMatch[1];
            if (normalizeUrl(originalQuery) === normalized) {
              return true;
            }
          }
        } catch {
          // If we can't read this specific doc, continue to the next
          continue;
        }
      }
    }

    return false; // URL not found in any doc
  } catch {
    // Fail-open: any unexpected error means we don't block research
    return false;
  }
}
