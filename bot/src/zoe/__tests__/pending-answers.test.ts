import { describe, it, expect } from 'vitest';
import {
  armPendingAnswer,
  takePendingAnswer,
  peekPendingAnswer,
  clearPendingAnswer,
} from '../pending-answers';

describe('pending-answers', () => {
  it('arms then takes once (consumed on take)', () => {
    armPendingAnswer(1001, 'rl-cowork');
    expect(peekPendingAnswer(1001)).toBe('rl-cowork');
    expect(takePendingAnswer(1001)).toBe('rl-cowork');
    expect(takePendingAnswer(1001)).toBeUndefined(); // consumed
  });

  it('last-write-wins (answer the most recent thing)', () => {
    armPendingAnswer(1002, 'rl-zoostr');
    armPendingAnswer(1002, 'rl-cowork');
    expect(takePendingAnswer(1002)).toBe('rl-cowork');
  });

  it('is scoped per chat id', () => {
    armPendingAnswer(2001, 'q1');
    armPendingAnswer(2002, 'q2');
    expect(takePendingAnswer(2002)).toBe('q2');
    expect(takePendingAnswer(2001)).toBe('q1');
  });

  it('clear drops the arm without consuming a message', () => {
    armPendingAnswer(3001, 'rl-ww');
    clearPendingAnswer(3001);
    expect(takePendingAnswer(3001)).toBeUndefined();
  });

  it('take on an unarmed chat is undefined', () => {
    expect(takePendingAnswer(9999)).toBeUndefined();
  });
});
