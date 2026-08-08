import { describe, expect, it, vi } from 'vitest';
import { parseBusReply } from '../bus-bridge';
import { busConfigured, replySubject, sendBusReply } from '../bus-send';

const CFG = { url: 'https://bus.example/bus', token: 't0k' };
const ok = (json: unknown = { id: 'abcdef123456' }) =>
  vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => json }) as unknown as typeof fetch;

describe('busConfigured', () => {
  it('needs BOTH url and token', () => {
    expect(busConfigured({ url: 'x', token: 'y' })).toBe(true);
    expect(busConfigured({ url: 'x' })).toBe(false);
    expect(busConfigured({ token: 'y' })).toBe(false);
    expect(busConfigured({})).toBe(false);
  });
});

describe('sendBusReply - unconfigured', () => {
  // The live host has no BUS_URL/BUS_TOKEN today, so this is the path that
  // actually runs. It must never claim success and never swallow the text.
  it('does not pretend it sent', async () => {
    const r = await sendBusReply({ to: 'coordinator', subject: 'Re: x', body: 'shipping today' }, {});
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('unconfigured');
    expect(r.reply).toContain('did not send');
  });

  it('shows what it WOULD have sent, so the thinking is not wasted', async () => {
    const r = await sendBusReply({ to: 'coordinator', subject: 'Re: x', body: 'the full reply text' }, {});
    expect(r.reply).toContain('the full reply text');
    expect(r.reply).toContain('coordinator');
  });

  it('names the exact missing thing', async () => {
    const r = await sendBusReply({ to: 'c', subject: 's', body: 'b' }, {});
    expect(r.reply).toContain('BUS_URL');
    expect(r.reply).toContain('BUS_TOKEN');
  });

  it('never calls fetch when unconfigured', async () => {
    const f = ok();
    await sendBusReply({ to: 'c', subject: 's', body: 'b' }, {}, f);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('sendBusReply - configured', () => {
  it('posts to /send with a bearer token', async () => {
    const f = ok();
    const r = await sendBusReply({ to: 'coordinator', subject: 'Re: bus', body: 'yes please' }, CFG, f);
    expect(r.ok).toBe(true);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://bus.example/bus/send');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t0k');
    expect(JSON.parse(init.body as string)).toMatchObject({ to: 'coordinator', body: 'yes please' });
  });

  it('tolerates a trailing slash on the url', async () => {
    const f = ok();
    await sendBusReply({ to: 'c', subject: 's', body: 'b' }, { ...CFG, url: 'https://bus.example/bus/' }, f);
    expect((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('https://bus.example/bus/send');
  });

  it('confirms with the id so the send is checkable', async () => {
    const r = await sendBusReply({ to: 'coordinator', subject: 's', body: 'b' }, CFG, ok());
    expect(r.reply).toContain('Sent to coordinator');
    expect(r.reply).toContain('abcdef12');
  });

  // A failure must keep his words. Losing a typed reply is the one unforgivable
  // outcome - he wrote it on a phone.
  it('reports an HTTP failure and reassures the text is safe', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const r = await sendBusReply({ to: 'c', subject: 's', body: 'b' }, CFG, f);
    expect(r.ok).toBe(false);
    expect(r.reply).toContain('503');
    expect(r.reply).toContain('safe');
  });

  it('reports a network failure without throwing', async () => {
    const f = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;
    const r = await sendBusReply({ to: 'c', subject: 's', body: 'b' }, CFG, f);
    expect(r.ok).toBe(false);
    expect(r.reply).toContain('ECONNREFUSED');
    expect(r.reply).toContain('safe');
  });

  it('refuses an empty body', async () => {
    const f = ok();
    const r = await sendBusReply({ to: 'c', subject: 's', body: '   ' }, CFG, f);
    expect(r.ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('replySubject', () => {
  it('prefixes Re: once and only once', () => {
    expect(replySubject('How we built the bus')).toBe('Re: How we built the bus');
    expect(replySubject('Re: How we built the bus')).toBe('Re: How we built the bus');
    expect(replySubject('RE: shouting')).toBe('RE: shouting');
  });

  it('handles a missing subject honestly', () => {
    expect(replySubject()).toBe('Re: (no subject)');
    expect(replySubject('   ')).toBe('Re: (no subject)');
  });
});

// The end-to-end shape: what the poller TELLS him to type must parse, and what
// parses must be sendable. These two modules were written weeks apart and never
// checked against each other.
describe('the instruction in every bus message actually works', () => {
  it('parses the exact syntax bus-poll prints', () => {
    const parsed = parseBusReply('reply eb8238 yes please, drop vps-bus.js on our lane');
    expect(parsed).not.toBeNull();
    expect(parsed?.shortId).toBe('eb8238');
    expect(parsed?.text).toBe('yes please, drop vps-bus.js on our lane');
  });

  it('feeds straight into a send', async () => {
    const parsed = parseBusReply('reply eb8238 shipping tonight');
    const f = ok();
    const r = await sendBusReply(
      { to: 'coordinator', subject: replySubject('How we built the bus'), body: parsed!.text },
      CFG,
      f,
    );
    expect(r.ok).toBe(true);
    expect(JSON.parse((f as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body).body)
      .toBe('shipping tonight');
  });

  it('ignores ordinary chat that merely starts with the word reply', () => {
    expect(parseBusReply('reply to jim when you get a sec')).toBeNull();
    expect(parseBusReply('replying now')).toBeNull();
  });
});
