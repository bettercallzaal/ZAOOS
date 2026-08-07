/**
 * bus-bridge.test.ts - see the full partner message, reply from the phone with grounded info.
 */
import { describe, expect, it } from 'vitest';
import {
  buildReplyContext,
  extractAsks,
  parseBusReply,
  renderBusMessage,
  renderReplyPreview,
  resolveByShortId,
  shortId,
  type BusMessage,
} from '../bus-bridge';

const msg: BusMessage = {
  id: 'eb823873-f02a-4898-b8c1-f99614c83c3c',
  from: 'coordinator',
  to: 'zao',
  subject: 'How we built the bus - full shape for interop',
  body: [
    'Happy to help - sovereign-but-interoperable is the right call.',
    'The wire contract is {id,from,to,subject,body,status,created}.',
    'Think your stack could plug into this?',
    'Yell if you want the actual vps-bus.js as a reference file dropped on your lane - happy to.',
  ].join('\n'),
  status: 'new',
  created: '2026-08-06T20:24:03.564Z',
};

describe('renderBusMessage (fix 1: never truncate)', () => {
  it('includes the FULL body, not a 120-char preview', () => {
    const out = renderBusMessage(msg).join('\n');
    expect(out).toContain('Yell if you want the actual vps-bus.js');
    expect(out).toContain(msg.body.slice(0, 120));
    expect(out).toContain('coordinator -> zao');
    expect(out).toContain('How we built the bus');
  });

  it('chunks a very long body under the Telegram limit instead of cutting it', () => {
    const long: BusMessage = { ...msg, body: 'x'.repeat(9000) };
    const chunks = renderBusMessage(long);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(4096);
    expect(chunks.join('').length).toBeGreaterThan(9000 - 50); // nothing dropped
  });
});

describe('extractAsks (what a reply must answer)', () => {
  it('pulls questions and offer idioms', () => {
    const asks = extractAsks(msg.body);
    expect(asks.some((a) => a.includes('Think your stack could plug into this?'))).toBe(true);
    expect(asks.some((a) => a.startsWith('Yell if you want'))).toBe(true);
  });

  it('returns nothing for a body with no asks', () => {
    expect(extractAsks('Just a status update. All green.')).toEqual([]);
  });
});

describe('buildReplyContext (fix 3: grounded, never invented)', () => {
  it('pairs their asks with OUR verified state', () => {
    const ctx = buildReplyContext(msg, {
      shipped: ['#2940 zao-bus server to your wire contract (11/11 tests)', '#2943 bus-cli'],
      pending: ['VPS deploy + tokens (Zaal-gated)'],
      openQuestions: ['Drop vps-bus.js on our lane?'],
    });
    expect(ctx).toContain('They asked:');
    expect(ctx).toContain('Think your stack could plug into this?');
    expect(ctx).toContain('Our state (verified, cite these):');
    expect(ctx).toContain('#2940 zao-bus server');
    expect(ctx).toContain('Still pending on our side:');
    expect(ctx).toContain('Ask them:');
  });

  it('omits sections with no facts - never fabricates state', () => {
    const ctx = buildReplyContext(msg);
    expect(ctx).not.toContain('Our state');
    expect(ctx).not.toContain('Still pending');
  });
});

describe('parseBusReply + resolveByShortId (fix 2: phone-typed reply, no ssh)', () => {
  it('parses "reply <shortid> <text>"', () => {
    const p = parseBusReply('reply eb8238 yes please, drop the file');
    expect(p).toEqual({ shortId: 'eb8238', text: 'yes please, drop the file' });
  });

  it('is case-insensitive and keeps multi-line text', () => {
    const p = parseBusReply('REPLY EB8238 line one\nline two');
    expect(p?.shortId).toBe('eb8238');
    expect(p?.text).toBe('line one\nline two');
  });

  it('rejects non-replies and empty bodies', () => {
    expect(parseBusReply('hello there')).toBeNull();
    expect(parseBusReply('reply eb8238   ')).toBeNull();
  });

  it('resolves a short id back to the exact message', () => {
    expect(shortId(msg.id)).toBe('eb8238');
    expect(resolveByShortId([msg], 'eb8238')?.id).toBe(msg.id);
    expect(resolveByShortId([msg], 'zzzzzz')).toBeNull();
  });

  it('returns null when a short id is ambiguous - never guesses', () => {
    const twin: BusMessage = { ...msg, id: 'eb823873-0000-0000-0000-000000000000' };
    expect(resolveByShortId([msg, twin], 'eb8238')).toBeNull();
  });
});

describe('renderReplyPreview', () => {
  it('shows the draft plus both reply paths', () => {
    const out = renderReplyPreview(msg, 'Building to your contract now - yes, drop vps-bus.js.');
    expect(out).toContain('Draft reply to coordinator');
    expect(out).toContain('Building to your contract now');
    expect(out).toContain('Tap Post to send');
    expect(out).toContain('reply eb8238');
  });
});
