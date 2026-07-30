import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  loadIdentities,
  parseIdentity,
  resolveEmail,
  defaultIdentity,
  DEFAULT_INBOX,
  DEFAULT_KEY_ENV,
} from '../identities';

test('no registry path -> the single default ZOE identity', () => {
  const ids = loadIdentities(
    () => {
      throw new Error('reader must not be called when path is undefined');
    },
    undefined,
  );
  assert.equal(ids.length, 1);
  assert.equal(ids[0].brand, 'The ZAO');
  assert.equal(ids[0].email.inbox, DEFAULT_INBOX);
  assert.equal(ids[0].email.keyEnv, DEFAULT_KEY_ENV);
});

test('unreadable / bad-JSON registry -> default, never throws', () => {
  const bad = loadIdentities(() => {
    throw new Error('ENOENT');
  }, '/nope/identities.json');
  assert.equal(bad.length, 1);
  assert.equal(bad[0].brand, 'The ZAO');

  const notJson = loadIdentities(() => 'this is not json', '/x.json');
  assert.equal(notJson[0].brand, 'The ZAO');
});

test('valid registry (object form) loads all well-formed identities', () => {
  const json = JSON.stringify({
    identities: [
      { brand: 'The ZAO', agent: 'ZOE', email: { inbox: 'zoe-zao@agentmail.to', keyEnv: 'AGENTMAIL_API_KEY' }, icmBox: 'thezao' },
      { brand: 'WaveWarZ', email: { inbox: 'wavewarz@agentmail.to', keyEnv: 'AGENTMAIL_KEY_WAVEWARZ' }, socials: { x: '@wavewarz' } },
    ],
  });
  const ids = loadIdentities(() => json, '/reg.json');
  assert.equal(ids.length, 2);
  assert.equal(ids[1].brand, 'WaveWarZ');
  assert.equal(ids[1].socials?.x, '@wavewarz');
});

test('array form is also accepted', () => {
  const json = JSON.stringify([
    { brand: 'Sparkz', email: { inbox: 'sparkz@agentmail.to', keyEnv: 'AGENTMAIL_KEY_SPARKZ' } },
  ]);
  const ids = loadIdentities(() => json, '/reg.json');
  assert.equal(ids.length, 1);
  assert.equal(ids[0].brand, 'Sparkz');
});

test('malformed entries are skipped; if none survive, falls back to default', () => {
  const json = JSON.stringify({
    identities: [
      { brand: 'no-email' },
      { email: { inbox: 'x@agentmail.to', keyEnv: 'K' } },
      { brand: 'bad-email', email: { inbox: '', keyEnv: 'K' } },
    ],
  });
  const ids = loadIdentities(() => json, '/reg.json');
  assert.equal(ids.length, 1);
  assert.equal(ids[0].brand, 'The ZAO', 'no valid entries -> default');
});

test('parseIdentity rejects missing required fields', () => {
  assert.equal(parseIdentity(null), null);
  assert.equal(parseIdentity({ brand: 'x' }), null, 'no email');
  assert.equal(parseIdentity({ email: { inbox: 'a', keyEnv: 'b' } }), null, 'no brand');
  assert.equal(parseIdentity({ brand: 'x', email: { inbox: 'a' } }), null, 'no keyEnv');
  const ok = parseIdentity({ brand: 'x', email: { inbox: 'a@b.to', keyEnv: 'K' } });
  assert.ok(ok);
  assert.equal(ok?.brand, 'x');
});

test('resolveEmail reads the key from the env at call time, never stores it', () => {
  const id = defaultIdentity();
  const withKey = resolveEmail(id, { AGENTMAIL_API_KEY: 'secret-value' } as NodeJS.ProcessEnv);
  assert.equal(withKey.inbox, DEFAULT_INBOX);
  assert.equal(withKey.apiKey, 'secret-value');

  const noKey = resolveEmail(id, {} as NodeJS.ProcessEnv);
  assert.equal(noKey.apiKey, undefined, 'unset env -> undefined key, not a throw');
});
