/**
 * Merge-request card state: ONE open card per PR, idempotent per repo#n@sha,
 * TTL expiry, supersede on a new head. State lives server side; callback data
 * carries only the card id (`fr:<8 hex>`), well inside Telegram's 64 bytes.
 *
 * Persistence is injected (approvals.ts-style JSON file in production wiring,
 * an in-memory array in tests). The store never touches the network.
 */

import { randomBytes } from 'node:crypto';

export type CardState = 'open' | 'resolved' | 'superseded' | 'expired';

export interface Card {
  id: string;
  key: string; // repo#n@sha
  repo: string;
  number: number;
  sha: string;
  reserved: string[];
  createdAt: number;
  expiresAt: number;
  state: CardState;
}

export interface CardPersistence {
  load(): Card[];
  save(cards: Card[]): void;
}

export const CARD_PREFIX = 'fr:';
const CARD_ID_RE = /^fr:([0-9a-f]{8})$/;
export const DEFAULT_CARD_TTL_MS = 6 * 60 * 60 * 1000;
const MIN_TTL_MS = 15 * 60 * 1000;
const MAX_TTL_MS = 24 * 60 * 60 * 1000;
const KEEP_CARDS = 200;

/** ZOE_FINAL_REVIEW_TTL_MIN, clamped to 15 min .. 24 h. Unset or junk gives the default. */
export function cardTtlMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = Number(env.ZOE_FINAL_REVIEW_TTL_MIN);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_CARD_TTL_MS;
  return Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, raw * 60_000));
}

export function cardKey(repo: string, number: number, sha: string): string {
  return `${repo}#${number}@${sha}`;
}

export function cardCallback(id: string): string {
  return `${CARD_PREFIX}${id}`;
}

export function parseCardCallback(data: string): string | null {
  const m = CARD_ID_RE.exec(data);
  return m ? m[1] : null;
}

export type IssueResult =
  | { kind: 'created'; card: Card; superseded: Card[] }
  | { kind: 'duplicate'; card: Card };

export type TapLookup =
  | { kind: 'unknown' }
  | { kind: 'expired'; card: Card }
  | { kind: 'handled'; card: Card }
  | { kind: 'open'; card: Card };

export class CardStore {
  private cards: Card[];

  constructor(
    private readonly persist: CardPersistence,
    private readonly newId: () => string = () => randomBytes(4).toString('hex'),
  ) {
    this.cards = persist.load();
  }

  private save(): void {
    this.cards = this.cards.slice(-KEEP_CARDS);
    this.persist.save(this.cards);
  }

  private expireDue(now: number): void {
    for (const c of this.cards) if (c.state === 'open' && now >= c.expiresAt) c.state = 'expired';
  }

  /** A live (open and unexpired) or resolved card for this exact key, if any. */
  findLive(key: string, now: number): Card | undefined {
    this.expireDue(now);
    return this.cards.find((c) => c.key === key && (c.state === 'open' || c.state === 'resolved'));
  }

  issue(repo: string, number: number, sha: string, reserved: string[], now: number, ttlMs: number): IssueResult {
    const key = cardKey(repo, number, sha);
    const dup = this.findLive(key, now);
    if (dup) return { kind: 'duplicate', card: dup };
    const superseded: Card[] = [];
    for (const c of this.cards) {
      if (c.state === 'open' && c.repo === repo && c.number === number && c.sha !== sha) {
        c.state = 'superseded';
        superseded.push(c);
      }
    }
    let id = this.newId();
    while (this.cards.some((c) => c.id === id)) id = this.newId();
    const card: Card = { id, key, repo, number, sha, reserved, createdAt: now, expiresAt: now + ttlMs, state: 'open' };
    this.cards.push(card);
    this.save();
    return { kind: 'created', card, superseded };
  }

  lookup(id: string, now: number): TapLookup {
    this.expireDue(now);
    const card = this.cards.find((c) => c.id === id);
    if (!card) return { kind: 'unknown' };
    if (card.state === 'expired') return { kind: 'expired', card };
    if (card.state !== 'open') return { kind: 'handled', card };
    return { kind: 'open', card };
  }

  resolve(id: string): void {
    const c = this.cards.find((x) => x.id === id);
    if (c && c.state === 'open') {
      c.state = 'resolved';
      this.save();
    }
  }

  supersede(id: string): void {
    const c = this.cards.find((x) => x.id === id);
    if (c && c.state === 'open') {
      c.state = 'superseded';
      this.save();
    }
  }

  /** Open cards, for tests and the superseded-edit pass. */
  all(): Card[] {
    return this.cards.map((c) => ({ ...c }));
  }
}

export function memoryPersistence(initial: Card[] = []): CardPersistence & { saved: Card[] } {
  const p = {
    saved: initial,
    load: () => p.saved.map((c) => ({ ...c })),
    save: (cards: Card[]) => {
      p.saved = cards.map((c) => ({ ...c }));
    },
  };
  return p;
}
