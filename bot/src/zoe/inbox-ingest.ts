/**
 * inbox-ingest.ts — pull new mail Zaal forwarded to zoe-zao@agentmail.to and
 * fold a PII-scrubbed one-line summary of each into ZOE's standing context.
 *
 * Flow (per the "add my inbox to ZOE's context" ask, 2026-07-13):
 *   1. Fetch recent messages from the AgentMail inbox (Zaal-private by design -
 *      only he forwards to it).
 *   2. Skip any message already ingested (dedup by AgentMail message id, tracked
 *      in inbox_context.jsonl via readIngestedSourceIds()).
 *   3. Build a synthesized one-liner (from + subject + short snippet), then run
 *      it through pii.ts `redactPii` so no third-party email / phone / address
 *      lands in ZOE's memory (.claude/rules/pii-hygiene.md Rule 3). Raw bodies
 *      are NEVER persisted - only the scrubbed summary.
 *   4. Append via appendInboxContext(). buildMemoryBlocks() then injects the
 *      last N as an <inbox_context> block on every concierge turn.
 *
 * Best-effort: a missing AGENTMAIL_API_KEY, a fetch error, or a bad payload
 * yields { ingested: 0 } and never throws into the scheduler tick.
 */

import { redactPii } from './pii';
import { appendInboxContext, readIngestedSourceIds, appendTriageContext } from './memory';
import {
  classifyBucket,
  connectToProject,
  suggestNextStep,
  buildTriageSummary,
} from './inbox-triage';

const AGENTMAIL_INBOX = 'zoe-zao@agentmail.to';
const FETCH_LIMIT = 50;
/** Never process more than this many new messages in one tick (cost + log-bloat guard). */
const MAX_PER_TICK = 15;
/** Snippet length pulled from the body before redaction. */
const SNIPPET_LEN = 220;

/** Loose shape - AgentMail v0 fields vary; every field is optional + defended. */
export interface RawAgentMailMessage {
  id?: string;
  message_id?: string;
  from?: string;
  subject?: string;
  preview?: string;
  text?: string;
  snippet?: string;
  timestamp?: string;
  created_at?: string;
  date?: string;
}

export interface IngestResult {
  ingested: number;
  skipped: number;
  scanned: number;
}

/** Stable dedup key for a message. Falls back to from+subject when no id. */
function sourceId(m: RawAgentMailMessage): string {
  return (
    m.id ??
    m.message_id ??
    `${(m.from ?? '').toLowerCase()}|${(m.subject ?? '').toLowerCase()}`
  );
}

/** First non-empty body-ish field, trimmed + collapsed to one line. */
function snippetOf(m: RawAgentMailMessage): string {
  const raw = m.preview ?? m.snippet ?? m.text ?? '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_LEN);
}

/**
 * Build the synthesized summary line, then redact PII. `from` is kept because
 * senders are often the whole point of a forward, but redactPii still strips a
 * non-allowlisted email address inside it - so a personal address becomes
 * `<redacted-email>` while a public ZAO address survives (pii.ts allowlist).
 */
export function synthesizeSummary(m: RawAgentMailMessage): string {
  const from = (m.from ?? 'unknown sender').replace(/\s+/g, ' ').trim().slice(0, 80);
  const subject = (m.subject ?? '(no subject)').replace(/\s+/g, ' ').trim().slice(0, 120);
  const snippet = snippetOf(m);
  const base = snippet ? `${from} — ${subject} — ${snippet}` : `${from} — ${subject}`;
  return redactPii(base);
}

/**
 * Fetch + ingest new forwarded mail. Returns counts; never throws.
 * @param fetchImpl injectable for tests (defaults to global fetch).
 */
export async function ingestInbox(
  fetchImpl: typeof fetch = fetch,
): Promise<IngestResult> {
  const empty: IngestResult = { ingested: 0, skipped: 0, scanned: 0 };
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) return empty;

  let messages: RawAgentMailMessage[];
  try {
    const res = await fetchImpl(
      `https://api.agentmail.to/v0/inboxes/${AGENTMAIL_INBOX}/messages?limit=${FETCH_LIMIT}`,
      { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      console.error('[zoe/inbox-ingest] agentmail fetch non-ok', res.status);
      return empty;
    }
    const body = (await res.json()) as { messages?: RawAgentMailMessage[] } | RawAgentMailMessage[];
    messages = Array.isArray(body) ? body : (body.messages ?? []);
  } catch (err) {
    console.error('[zoe/inbox-ingest] agentmail fetch failed:', (err as Error).message);
    return empty;
  }

  const seen = await readIngestedSourceIds();
  let ingested = 0;
  let skipped = 0;

  // Oldest-first so the append log stays chronological; cap per tick.
  const fresh = messages.filter((m) => !seen.has(sourceId(m)));
  const batch = fresh.slice(-MAX_PER_TICK).reverse();

  for (const m of batch) {
    const summary = synthesizeSummary(m).trim();
    if (!summary) {
      skipped++;
      continue;
    }
    try {
      const sourceId_ = sourceId(m);
      await appendInboxContext({
        source_id: sourceId_,
        summary,
        received_at: m.timestamp ?? m.created_at ?? m.date,
      });

      // Triage the item
      const bucket = classifyBucket(m, summary);
      const connectedProject = connectToProject(m, summary);
      const nextStep = suggestNextStep(bucket, m, connectedProject);
      const triageSummary = buildTriageSummary(m, summary);

      await appendTriageContext({
        source_id: sourceId_,
        summary: triageSummary,
        bucket,
        connected_project: connectedProject,
        next_step: nextStep,
      });

      ingested++;
    } catch (err) {
      console.warn('[zoe/inbox-ingest] append failed (nbd):', (err as Error).message);
      skipped++;
    }
  }

  if (ingested > 0) {
    console.log(`[zoe/inbox-ingest] folded ${ingested} forwarded message(s) into ZOE context`);
  }
  return { ingested, skipped, scanned: messages.length };
}
