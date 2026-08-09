/**
 * The ack and the reply-finder are two different modules that both write as
 * ZOE, so neither one alone can prove the #9246 thread is fixed. mention-answered.test.ts
 * covers the reader with a HAND-WRITTEN ack; this covers the seam, by building
 * the ack with the same function production uses and handing it to the same
 * reader production uses.
 */
import { describe, expect, it } from 'vitest';
import { buildNotedAck, type BoardTask as AckTask } from '../task-teammate-ack';
import {
  findUnansweredMentions,
  type BoardComment,
  type BoardTask,
} from '../task-comment-replies';

/** The verbatim thread from board task #9246, 2026-08-08. */
const IMAN = {
  id: 'c1',
  userId: 'iman',
  displayName: 'Iman',
  content: '@zaal https://github.com/ZAODEVZ/ZAOartizen/pull/19',
};
const ZAAL_COMMAND = {
  id: 'c2',
  userId: 'zaal',
  displayName: 'Zaal',
  content: '@iman done. @zoe make a new todo called zartizen ui cleanup and close this one',
};

const TASK: AckTask = { id: 't9246', legacy_id: '9246', title: 'ZAOartizen' };

describe('a ZOE ack does not swallow someone else\'s @zoe command', () => {
  it('the ack names the comment it acks', () => {
    const ack = buildNotedAck(TASK, IMAN);
    expect(ack.replyTo).toBe('c1');
    expect(ack.userId).toBe('zoe');
  });

  it('leaves Zaal\'s command pending, even though the ack landed after it', () => {
    // The exact live ordering: Iman comments, Zaal issues a command, then the
    // ack of IMAN lands last. Without replyTo the command reads as answered and
    // is dropped forever.
    const thread: BoardComment[] = [IMAN, ZAAL_COMMAND, buildNotedAck(TASK, IMAN)];
    const task = { id: 't9246', title: 'ZAOartizen', metadata: { comments: thread } } as BoardTask;

    expect(findUnansweredMentions([task]).map((m) => m.comment.id)).toEqual(['c2']);
  });

  it('still answers the comment it was actually acking', () => {
    // An ack of a teammate comment that itself tags @zoe does answer that one -
    // the ack is a real response to it, and re-answering would double-post.
    const mention = { ...IMAN, content: '@zoe can you look at PR/19' };
    const thread: BoardComment[] = [mention, buildNotedAck(TASK, mention)];
    const task = { id: 't9246', title: 'ZAOartizen', metadata: { comments: thread } } as BoardTask;

    expect(findUnansweredMentions([task])).toEqual([]);
  });
});
