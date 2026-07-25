/**
 * Coinbase spot-price Vacuum Spike - a REAL external feed (public, no auth).
 *
 *   GET https://api.coinbase.com/v2/prices/<PAIR>/spot
 *   -> { "data": { "amount": "3421.55", "base": "ETH", "currency": "USD" } }
 *
 * This is the organism's first live sensor: it pulls actual market data from
 * the outside world and emits it as the shared Observation contract. Read-only,
 * so it is a legitimate passive Vacuum Spike. The fetch is injectable so tests
 * run deterministically; left undefined it uses the real global fetch.
 */

import type { VacuumSpike } from '../types';
import { createHttpPollSpike, type MappedRecord } from './http-poll-spike';

interface CoinbaseSpotBody {
  data?: { amount?: string; base?: string; currency?: string };
}

export interface CoinbaseSpikeOptions {
  /** Injectable fetch for tests. Defaults to the real Coinbase API via global fetch. */
  fetchJson?: (endpoint: string, headers: Record<string, string>) => Promise<unknown>;
  /** Minimum ms between polls (Coinbase tolerates frequent reads; default 5s). */
  minIntervalMs?: number;
}

export function createCoinbaseSpotSpike(pair = 'ETH-USD', opts: CoinbaseSpikeOptions = {}): VacuumSpike {
  return createHttpPollSpike({
    spikeId: `coinbase-${pair.toLowerCase()}`,
    endpoint: `https://api.coinbase.com/v2/prices/${pair}/spot`,
    capabilities: ['market.price'],
    produces: ['market.price'],
    minIntervalMs: opts.minIntervalMs ?? 5_000,
    fetchJson: opts.fetchJson,
    map: (body: unknown): MappedRecord[] => {
      const data = (body as CoinbaseSpotBody)?.data;
      const amount = data?.amount;
      if (!amount) return [];
      const price = Number(amount);
      if (!Number.isFinite(price)) return [];
      const base = data?.base ?? pair.split('-')[0];
      const currency = data?.currency ?? pair.split('-')[1] ?? 'USD';
      return [
        {
          kind: 'market.price',
          subjectKey: `${base}-${currency}`.toLowerCase(),
          payload: { pair, base, currency, price },
          observedAt: null,
          confidence: 1,
        },
      ];
    },
  });
}
