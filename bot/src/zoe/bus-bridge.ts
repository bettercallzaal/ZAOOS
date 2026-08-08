/**
 * bus-bridge.ts - see a partner-bus message and reply WELL, from the phone.
 *
 * Zaal, looking at the tasern-bus ping on his phone (2026-08-07): "How can we
 * improve me seeing this to me replying with the best info?" Three concrete
 * failures in the current `tasern-bus-poll.sh`:
 *   1. the body is TRUNCATED at 120 chars - he cannot read what was actually said
 *   2. the only reply path is `ssh vps tasern-bus send "subj" "body"` - unusable
 *      from a phone
 *   3. no grounding - even if he could reply, the facts (what ZAO shipped, what
 *      the partner asked for) live in the repo, not in his head at 9am
 *
 * This module fixes all three as PURE functions (no Telegram/network calls - the
 * live wiring is a small reviewed step, same discipline as mission-control):
 *   renderBusMessage()  - the FULL body, phone-readable, chunked, never truncated
 *   buildReplyContext() - the grounding a drafted reply must cite (asks + our state)
 *   renderReplyPreview()- what Zaal taps Approve on
 *   parseBusReply()     - "reply <id> <text>" typed in TG -> a bus send
 * Reuses ZOE's existing draft-approval pattern (drafts.ts Post/Skip/Edit keyboard)
 * and tg-chunk for the 4096 limit.
 */
import { chunkForTelegram } from './tg-chunk';
import { featureRan } from './feature-ran';

/** The tasern wire contract (identical to infra/bus/bus.js - one shape, both ends). */
export interface BusMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: 'new' | 'read';
  created: string;
}

/** A short id Zaal can type on a phone instead of a uuid. */
export function shortId(id: string): string {
  return id.replace(/-/g, '').slice(0, 6);
}

/**
 * FIX 1 - the full message, phone-readable, never truncated. Returns chunks so a
 * long partner message survives Telegram's 4096 limit instead of being cut to 120.
 */
export function renderBusMessage(msg: BusMessage): string[] {
  featureRan('bus-bridge');
  const header = [
    `BUS ${msg.from} -> ${msg.to}`,
    msg.subject ? `Subject: ${msg.subject}` : '',
    `${msg.created.slice(0, 16).replace('T', ' ')}  id ${shortId(msg.id)}`,
    '',
  ].filter(Boolean).join('\n');
  return chunkForTelegram(`${header}\n${msg.body}`);
}

/** What the partner actually asked for - the lines a reply must answer. */
export function extractAsks(body: string): string[] {
  const asks: string[] = [];
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    // a question, or an explicit offer/request idiom
    if (line.endsWith('?') || /\b(yell if|let me know|want (me|us) to|happy to|if you want|shall we|do you want)\b/i.test(line)) {
      asks.push(line.length > 200 ? `${line.slice(0, 197)}...` : line);
    }
  }
  return asks.slice(0, 5);
}

/** Repo-side facts a drafted reply is allowed to cite (caller supplies, never invented). */
export interface ReplyGrounding {
  /** e.g. "#2940 zao-bus server (11/11 tests)" - things we actually shipped. */
  shipped?: string[];
  /** e.g. "VPS deploy + tokens" - what is still gated/pending on our side. */
  pending?: string[];
  /** Anything we want to ask them back. */
  openQuestions?: string[];
}

/**
 * FIX 3 - the grounding block for a drafted reply. This is what makes the reply
 * carry "the best info": their asks paired with OUR verified state, so the draft
 * cites shipped PRs instead of vibes. Nothing here is generated - the caller
 * passes facts read from the repo (anti-fabrication: no invented status).
 */
export function buildReplyContext(msg: BusMessage, grounding: ReplyGrounding = {}): string {
  const asks = extractAsks(msg.body);
  const lines = [`Replying to ${msg.from}${msg.subject ? ` re: ${msg.subject}` : ''}.`];
  if (asks.length) {
    lines.push('', 'They asked:', ...asks.map((a) => `- ${a}`));
  }
  if (grounding.shipped?.length) {
    lines.push('', 'Our state (verified, cite these):', ...grounding.shipped.map((s) => `- ${s}`));
  }
  if (grounding.pending?.length) {
    lines.push('', 'Still pending on our side:', ...grounding.pending.map((s) => `- ${s}`));
  }
  if (grounding.openQuestions?.length) {
    lines.push('', 'Ask them:', ...grounding.openQuestions.map((s) => `- ${s}`));
  }
  return lines.join('\n');
}

/**
 * FIX 2 - the approve-from-the-phone preview. Pairs with drafts.ts's existing
 * Post/Skip/Edit keyboard (putDraft + draftKeyboard) - no new UI concept.
 */
export function renderReplyPreview(msg: BusMessage, draftText: string): string {
  return [
    `Draft reply to ${msg.from} (id ${shortId(msg.id)}):`,
    '',
    draftText,
    '',
    'Tap Post to send on the bus, Edit to change, Skip to hold.',
    `Or type: reply ${shortId(msg.id)} <your own words>`,
  ].join('\n');
}

export interface ParsedBusReply {
  shortId: string;
  text: string;
}

/**
 * FIX 2 (typed path) - "reply ab12cd thanks, shipping today" typed in Telegram
 * becomes a bus send. No ssh, no uuid, no quoting rules.
 */
export function parseBusReply(input: string): ParsedBusReply | null {
  const m = /^\s*reply\s+([a-z0-9]{4,12})\s+([\s\S]+)$/i.exec(input);
  if (!m) return null;
  const text = m[2].trim();
  if (!text) return null;
  return { shortId: m[1].toLowerCase(), text };
}

/** Resolve a phone-typed short id back to the real message (exact, unambiguous). */
export function resolveByShortId(messages: BusMessage[], sid: string): BusMessage | null {
  const target = sid.toLowerCase();
  const hits = messages.filter((m) => shortId(m.id) === target);
  return hits.length === 1 ? hits[0] : null; // ambiguous = null, never guess
}
