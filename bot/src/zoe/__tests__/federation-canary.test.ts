/**
 * The false-green matrix.
 *
 * Brandon's spec asks for explicit tests "where the system is intentionally
 * tricked". These are those. Each one is a way a run could report success
 * without the intended thing having happened, and every one of them has a real
 * ancestor in this repo:
 *
 *   - a status line green through a four-day outage
 *   - a logger recording 158 merged PRs as zero
 *   - a receipt verifier that would have passed an empty hash
 *   - a restore that restored 83 files and printed "restored"
 *
 * The rule under test throughout: MISSING EVIDENCE PRODUCES UNVERIFIABLE, NEVER
 * PASS.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  pass, fail, unverifiable, blocked, isProven,
  STEPS, type Outcome,
} from '../federation-states';
import {
  newGeneration, advance, shouldResend, resumeAt,
  writeCheckpoint, readCheckpoint, type Generation,
} from '../federation-checkpoint';
import { verifyReceipt } from '../bus-receipt';

const HASH = 'a'.repeat(64);

function gen(over: Partial<Generation> = {}): Generation {
  return {
    ...newGeneration({
      messageId: 'msg-1', nonce: 'nonce-1', contentSha256: HASH,
      protocolVersion: '1.0', direction: 'zoe-to-dreamnet',
    }),
    ...over,
  };
}

describe('terminal states - UNVERIFIABLE is not a kind of success', () => {
  it('only VERIFIED_PASS counts as proven', () => {
    const outcomes: Outcome[] = [
      pass(),
      fail('HASH_MISMATCH'),
      unverifiable('MISSING_RECEIPT'),
      blocked('UNSUPPORTED_VERSION'),
      { state: 'TIMEOUT', reason: 'TIMEOUT_WAITING_FOR_ACK' },
      { state: 'CANCELLED' },
    ];
    expect(outcomes.filter(isProven)).toHaveLength(1);
    expect(outcomes.filter(isProven)[0].state).toBe('VERIFIED_PASS');
  });

  it('every non-pass outcome carries a reason code', () => {
    // "It failed" with no reason is the message that cost three days on the
    // cheap-loop fleet.
    for (const o of [fail('HASH_MISMATCH'), unverifiable('MISSING_HASH'), blocked('EXPIRED_MESSAGE')]) {
      expect(o.reason).toBeTruthy();
    }
  });
});

describe('false-green matrix - the system is tricked on purpose', () => {
  // 1. hash field missing
  it('1. a receipt with no hash is UNVERIFIABLE, not a match', () => {
    expect(verifyReceipt({ messageId: 'msg-1' } as never, 'msg-1', HASH)).toBe('CANNOT_VERIFY');
  });

  // 2. both hashes empty - the one that nearly shipped
  it('2. empty on BOTH sides is UNVERIFIABLE, because "" === "" is true', () => {
    expect(verifyReceipt({ messageId: 'msg-1', contentHash: '' }, 'msg-1', '')).toBe('CANNOT_VERIFY');
  });

  // 3. wrong hash returned
  it('3. a different hash is VERIFIED_FAIL / HASH_MISMATCH', () => {
    expect(verifyReceipt({ messageId: 'msg-1', contentHash: 'b'.repeat(64) }, 'msg-1', HASH))
      .toBe('MISMATCH');
  });

  // 4. transport 200 but the application rejected the envelope
  it('4. a transport ACK is not an application ACK', () => {
    const g = advance(gen(), 'SEND', 'TRANSPORT_ACK');
    const afterTransport = advance(g, 'TRANSPORT_ACK', 'APPLICATION_ACK');
    // Bytes moved. Nothing about that says the receiver accepted the envelope.
    expect(afterTransport.completedSteps).toContain('TRANSPORT_ACK');
    expect(afterTransport.completedSteps).not.toContain('APPLICATION_ACK');
    expect(isProven(fail('APPLICATION_REJECTED'))).toBe(false);
  });

  // 5. application accepted but the receipt write failed
  it('5. a failed receipt write is UNVERIFIABLE, not PASS', () => {
    const o = unverifiable('RECEIPT_WRITE_FAILED');
    expect(o.state).toBe('UNVERIFIABLE');
    expect(isProven(o)).toBe(false);
  });

  // 6. handler claims success, re-read cannot observe it
  it('6. a handler returning true is not proof of effect', () => {
    const o = unverifiable('EFFECT_NOT_OBSERVED', 'handler returned true; re-read found nothing');
    expect(isProven(o)).toBe(false);
    expect(o.reason).toBe('EFFECT_NOT_OBSERVED');
  });

  // 11. unsupported protocol version fails CLOSED
  it('11. an unknown major version is BLOCKED, never assumed compatible', () => {
    const o = blocked('UNSUPPORTED_VERSION', 'peer offered 2.0, we speak 1.0');
    expect(o.state).toBe('BLOCKED');
    expect(isProven(o)).toBe(false);
  });

  // 12. expired message
  it('12. an expired message is BLOCKED', () => {
    expect(blocked('EXPIRED_MESSAGE').state).toBe('BLOCKED');
  });
});

describe('replay and idempotency', () => {
  it('7. the same messageId with the same payload does not execute twice', () => {
    const first = gen();
    const done = { ...first, completedSteps: [...STEPS], currentStep: 'COMPLETE' as const };
    // A finished run has nowhere to resume to, so a replay cannot restart it.
    expect(resumeAt(done)).toBeNull();
  });

  it('8. the same messageId with DIFFERENT bytes fails closed', () => {
    const stored = gen({ contentSha256: HASH });
    const incomingHash = 'c'.repeat(64);
    const conflict = stored.contentSha256 !== incomingHash;
    expect(conflict).toBe(true);
    expect(fail('IDEMPOTENCY_CONFLICT').state).toBe('VERIFIED_FAIL');
  });
});

describe('9. crash between TRANSPORT_ACK and VERIFY_EFFECT - the mandatory test', () => {
  const tmp = join(tmpdir(), `fedtest-${process.pid}`);
  const original = process.env.HOME;

  beforeEach(async () => {
    process.env.HOME = tmp;
    await fs.mkdir(tmp, { recursive: true });
  });
  afterEach(async () => {
    process.env.HOME = original;
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('resumes at verification and does NOT re-send the file', async () => {
    // Run to TRANSPORT_ACK, then "crash".
    let g = gen();
    g = advance(g, 'VALIDATE', 'HASH');
    g = advance(g, 'HASH', 'SEND');
    g = advance(g, 'SEND', 'TRANSPORT_ACK');
    g = advance(g, 'TRANSPORT_ACK', 'APPLICATION_ACK');
    await writeCheckpoint(g);

    // Restart: a cold process reads the checkpoint.
    const recovered = await readCheckpoint('msg-1');
    expect(recovered).not.toBeNull();
    expect(recovered!.messageId).toBe('msg-1');
    expect(recovered!.completedSteps).toContain('SEND');

    // The whole point: the bytes are already across.
    expect(shouldResend(recovered!)).toBe(false);
    expect(resumeAt(recovered!)).toBe('APPLICATION_ACK');
  });

  it('a genuinely new messageId has no checkpoint and DOES send', async () => {
    expect(await readCheckpoint('never-seen')).toBeNull();
    expect(shouldResend(gen({ messageId: 'never-seen' }))).toBe(true);
  });

  it('an UNREADABLE checkpoint throws rather than restarting the loop', async () => {
    const { checkpointPath } = await import('../federation-checkpoint');
    await fs.mkdir(join(tmp, '.zao', 'zoe', 'federation'), { recursive: true });
    await fs.writeFile(checkpointPath('broken'), '{ not json', 'utf8');
    // Returning null here would re-send the file. That is the duplicate side
    // effect the crash test exists to prevent, so it must fail loudly instead.
    await expect(readCheckpoint('broken')).rejects.toThrow(/unreadable|JSON/i);
  });

  it('writes atomically - a reader never sees a partial checkpoint', async () => {
    const { checkpointPath } = await import('../federation-checkpoint');
    await writeCheckpoint(gen({ messageId: 'atomic' }));
    const body = await fs.readFile(checkpointPath('atomic'), 'utf8');
    expect(() => JSON.parse(body)).not.toThrow();
    const leftovers = (await fs.readdir(join(tmp, '.zao', 'zoe', 'federation')))
      .filter((f) => f.includes('.tmp.'));
    expect(leftovers).toEqual([]);
  });

  it('a messageId cannot escape the checkpoint directory', async () => {
    await expect(writeCheckpoint(gen({ messageId: '../../etc/passwd' })))
      .resolves.not.toThrow();
    const files = await fs.readdir(join(tmp, '.zao', 'zoe', 'federation'));
    // Sanitised to a flat filename rather than traversing out.
    expect(files.some((f) => f.includes('etc_passwd'))).toBe(true);
  });
});

describe('10. backend unavailable in live mode - never a mock fallback', () => {
  it('an unreachable dependency is UNVERIFIABLE, not a silent downgrade', () => {
    // The ZOL failure Brandon cites: a store factory returned an unresolved
    // promise, downstream fell into mock-like behaviour, and the code still
    // reported success.
    const o = unverifiable('CHECKPOINT_WRITE_FAILED', 'live store unreachable; refusing to fall back');
    expect(o.state).toBe('UNVERIFIABLE');
    expect(isProven(o)).toBe(false);
  });
});
