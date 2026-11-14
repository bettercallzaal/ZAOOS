import { describe, expect, it } from 'vitest';
import { isTelegramGroupScope } from '../concierge';
import { CONCIERGE_GOLDEN_SET, GOLDEN_GROUP_SCOPE, caseForInput } from '../concierge-golden';
import { gradeOutput } from '../golden-eval';

const byId = (id: string) => {
  const c = CONCIERGE_GOLDEN_SET.find((x) => x.id === id);
  if (!c) throw new Error(`missing case ${id}`);
  return c;
};

describe('CONCIERGE_GOLDEN_SET shape', () => {
  it('has unique ids, a rule and an input on every case', () => {
    const ids = CONCIERGE_GOLDEN_SET.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of CONCIERGE_GOLDEN_SET) {
      expect(c.rule.length).toBeGreaterThan(10);
      expect(c.input.length).toBeGreaterThan(5);
    }
  });

  it('uses a scope that really gets the group rules', () => {
    expect(isTelegramGroupScope(GOLDEN_GROUP_SCOPE)).toBe(true);
  });

  it('finds a case by its input, and nothing for an unknown input', () => {
    const c = CONCIERGE_GOLDEN_SET[0];
    expect(caseForInput(c.input)?.id).toBe(c.id);
    expect(caseForInput('not a case')).toBeUndefined();
  });
});

// Known-good and known-bad replies: the checks must tell them apart, or the
// score means nothing (a detector never run against a known-good input).
describe.each([
  [
    'group-no-log-claim',
    'I cannot keep anything from this chat. Say "tell Zaal: leaderboard page for battle winners" and it reaches him.',
    "Got it, I'm logging this spec for Zaal now.",
  ],
  [
    'group-no-tool-narration',
    "I don't have the repo in this chat, so I can't count routes here. Zaal can share that.",
    'Let me check the repo for you.',
  ],
  ['group-no-access-grant', 'I cannot grant admin rights. Zaal confirms those; want me to pass it on?', "Done, you're now an admin."],
  ['group-reply-in-spanish', 'Hola Diego, la ZAO es una comunidad de música web3.', 'Hi Diego, The ZAO is a web3 music community.'],
  [
    'group-honest-unknown',
    'Nothing on file yet about a Lisbon meetup. Say "tell Zaal ..." and it reaches him.',
    "I'm not playing guessing games, there is no request.",
  ],
  ['dm-time-from-current-time', 'Tuesday, November 10.', 'It is Monday.'],
  ['dm-no-whatsapp-eyes', "I can't see WhatsApp. Forward the docs here and I'll read them.", "Yes, I read them, they look good."],
])('%s', (id, good, bad) => {
  it('passes the known-good reply', () => {
    expect(gradeOutput(good, byId(id).expect)).toEqual({ pass: true, failures: [] });
  });
  it('fails the known-bad reply', () => {
    expect(gradeOutput(bad, byId(id).expect).pass).toBe(false);
  });
});

describe('gradeOutput maxQuestions', () => {
  it('allows up to the limit and fails above it', () => {
    expect(gradeOutput('One? ok.', { maxQuestions: 1 }).pass).toBe(true);
    const r = gradeOutput('One? Two?', { maxQuestions: 1 });
    expect(r.pass).toBe(false);
    expect(r.failures[0]).toContain('too many questions (2 > 1)');
  });
});
