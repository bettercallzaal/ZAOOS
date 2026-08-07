import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetAllBuilds,
  beginBuild,
  describeActive,
  endBuild,
  getActiveBuild,
  isCancelRequested,
  isStopRequest,
  queueFollowUp,
  requestCancel,
  setPhase,
  setRunId,
  takeFollowUp,
} from '../dm-build-session';

const CHAT = 12345;

beforeEach(() => __resetAllBuilds());

describe('isStopRequest', () => {
  it.each(['stop', 'Stop', 'cancel', 'abort', 'nevermind', 'never mind', 'stop it', 'cancel please', 'kill it', 'stop.'])(
    '"%s" stops',
    (msg) => expect(isStopRequest(msg)).toBe(true),
  );

  // The dangerous direction: a CORRECTION misread as a stop silently drops the
  // thing Zaal actually wanted built.
  it.each([
    'stop using the members table, use profiles instead',
    'do not stop at the first error, retry',
    'cancel the subscription flow instead of deleting it',
    'add a stop button to the player',
  ])('"%s" is a correction, not a stop', (msg) => expect(isStopRequest(msg)).toBe(false));

  it('ignores empty and whitespace', () => {
    expect(isStopRequest('')).toBe(false);
    expect(isStopRequest('   ')).toBe(false);
  });
});

describe('active build lifecycle', () => {
  it('has nothing active until a build begins', () => {
    expect(getActiveBuild(CHAT)).toBeUndefined();
  });

  it('tracks the task, phase and run id', () => {
    beginBuild(CHAT, 'add a /health route');
    setRunId(CHAT, 'run-abc');
    setPhase(CHAT, 'critic reviewing');
    const b = getActiveBuild(CHAT);
    expect(b?.task).toBe('add a /health route');
    expect(b?.runId).toBe('run-abc');
    expect(b?.phase).toBe('critic reviewing');
  });

  it('is scoped per chat - one chat cannot cancel another', () => {
    beginBuild(CHAT, 'a');
    beginBuild(999, 'b');
    requestCancel(CHAT);
    expect(isCancelRequested(CHAT)).toBe(true);
    expect(isCancelRequested(999)).toBe(false);
  });

  it('clears on end, so the next message behaves normally', () => {
    beginBuild(CHAT, 'a');
    endBuild(CHAT);
    expect(getActiveBuild(CHAT)).toBeUndefined();
    expect(isCancelRequested(CHAT)).toBe(false);
  });
});

describe('cancel', () => {
  it('reports false when there is nothing to cancel', () => {
    expect(requestCancel(CHAT)).toBe(false);
  });

  it('is sticky once requested - the runner may poll well after the ask', () => {
    beginBuild(CHAT, 'a');
    requestCancel(CHAT);
    expect(isCancelRequested(CHAT)).toBe(true);
    expect(isCancelRequested(CHAT)).toBe(true);
  });

  it('never reports a cancel for a chat with no build', () => {
    expect(isCancelRequested(CHAT)).toBe(false);
  });
});

describe('follow-up queue', () => {
  it('does not queue when nothing is running', () => {
    expect(queueFollowUp(CHAT, 'x').replaced).toBe(false);
    expect(takeFollowUp(CHAT)).toBeUndefined();
  });

  it('holds one correction', () => {
    beginBuild(CHAT, 'a');
    expect(queueFollowUp(CHAT, 'use profiles instead').replaced).toBe(false);
    expect(takeFollowUp(CHAT)).toBe('use profiles instead');
  });

  // Three corrections must not become three PRs.
  it('keeps only the latest correction and says it replaced one', () => {
    beginBuild(CHAT, 'a');
    queueFollowUp(CHAT, 'first');
    expect(queueFollowUp(CHAT, 'second').replaced).toBe(true);
    expect(queueFollowUp(CHAT, 'third').replaced).toBe(true);
    expect(takeFollowUp(CHAT)).toBe('third');
  });

  it('can only be taken once, so a follow-up cannot run twice', () => {
    beginBuild(CHAT, 'a');
    queueFollowUp(CHAT, 'x');
    expect(takeFollowUp(CHAT)).toBe('x');
    expect(takeFollowUp(CHAT)).toBeUndefined();
  });
});

describe('describeActive', () => {
  it('names the phase and the task so a status reply is specific', () => {
    const b = beginBuild(CHAT, 'add a /health route to zaalcaster');
    setPhase(CHAT, 'coding (attempt 2/3)');
    const out = describeActive(getActiveBuild(CHAT) ?? b);
    expect(out).toContain('coding (attempt 2/3)');
    expect(out).toContain('add a /health route');
  });

  it('shows seconds early and minutes later', () => {
    const b = beginBuild(CHAT, 'x');
    expect(describeActive(b)).toMatch(/\d+s in/);
    b.startedAt = Date.now() - 5 * 60 * 1000;
    expect(describeActive(b)).toMatch(/\d+m in/);
  });
});
