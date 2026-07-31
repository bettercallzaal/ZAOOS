import { test } from 'vitest';
import assert from 'node:assert/strict';
import { ingestAllIdentities, loadPersona } from '../fleet';
import type { BrandIdentity } from '../identities';

/** Fake fetch returning the given messages (shape ingestInbox expects). */
function fakeFetch(messages: unknown[]): typeof fetch {
  return (async () =>
    ({ ok: true, status: 200, json: async () => ({ messages }) }) as unknown as Response) as unknown as typeof fetch;
}

const ID = (brand: string, keyEnv: string, personaRef?: string): BrandIdentity => ({
  brand,
  email: { inbox: `${brand.toLowerCase()}@agentmail.to`, keyEnv },
  personaRef,
});

test('ingestAllIdentities skips brands whose key env var is unset', async () => {
  const ids = [ID('WaveWarZ', 'AGENTMAIL_KEY_WAVEWARZ'), ID('Sparkz', 'AGENTMAIL_KEY_SPARKZ')];
  const res = await ingestAllIdentities(fakeFetch([]), ids, {} as NodeJS.ProcessEnv);
  assert.equal(res.length, 2);
  assert.ok(res.every((r) => r.result === null && r.skipped?.includes('no key')));
});

test('ingestAllIdentities ingests a brand whose key IS set, using its inbox', async () => {
  const ids = [ID('WaveWarZ', 'AGENTMAIL_KEY_WAVEWARZ')];
  const env = { AGENTMAIL_KEY_WAVEWARZ: 'a-key', ZOE_HOME: '/tmp/zoe-fleet-test' } as NodeJS.ProcessEnv;
  const res = await ingestAllIdentities(fakeFetch([]), ids, env);
  assert.equal(res.length, 1);
  assert.equal(res[0].brand, 'WaveWarZ');
  assert.equal(res[0].inbox, 'wavewarz@agentmail.to');
  assert.ok(res[0].result !== null, 'ingest ran (result not null)');
});

test('ingestAllIdentities never throws; a per-brand error is captured as skipped', async () => {
  const throwingFetch = (async () => {
    throw new Error('network down');
  }) as unknown as typeof fetch;
  const ids = [ID('WaveWarZ', 'AGENTMAIL_KEY_WAVEWARZ')];
  const env = { AGENTMAIL_KEY_WAVEWARZ: 'a-key' } as NodeJS.ProcessEnv;
  const res = await ingestAllIdentities(throwingFetch, ids, env);
  // ingestInbox itself swallows fetch errors -> result with 0 counts, not a throw.
  assert.equal(res.length, 1);
  assert.ok(res[0].result !== null || res[0].skipped);
});

test('loadPersona returns the file text for a personaRef', () => {
  const id = ID('WaveWarZ', 'K', 'research/identity/personas/wavewarz.persona.md');
  const text = loadPersona(id, () => '# Persona: WaveWarZ\nvoice stuff');
  assert.ok(text.includes('Persona: WaveWarZ'));
});

test('loadPersona returns empty string when no personaRef or file unreadable', () => {
  assert.equal(loadPersona(ID('X', 'K')), '');
  const withRef = ID('X', 'K', '/nope/persona.md');
  assert.equal(
    loadPersona(withRef, () => {
      throw new Error('ENOENT');
    }),
    '',
  );
});
