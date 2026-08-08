import { describe, expect, it } from 'vitest';
import { findUnansweredMentions, type BoardComment, type BoardTask } from '../task-comment-replies';

const ZOE = '00000000-0000-4000-8000-00000000z0e0'.replace('z0e', 'a0e');

function task(comments: BoardComment[]): BoardTask {
  return { id: 't1', title: 'Todo 08/08/26', metadata: { comments } } as BoardTask;
}
const c = (id: string, content: string, userId?: string, replyTo?: string): BoardComment => ({
  id, content, userId, displayName: userId ? 'ZOE' : 'Zaal', replyTo,
});

describe('findUnansweredMentions - the #9246 bug', () => {
  // The exact thread that failed live on 2026-08-08. ZOE's ack of IMAN landed
  // after Zaal's command and marked it answered, so the command never ran.
  it('a ZOE ack of someone ELSE does not answer Zaal\'s command', () => {
    const zoeUserId = findZoeId();
    const t = task([
      c('c1', '@zaal https://github.com/ZAODEVZ/ZAOartizen/pull/19'),
      c('c2', '@iman done. @zoe make a new todo called zartizen ui cleanup and close this one'),
      c('c3', 'Noted - flagged to Zaal: "@zaal ...PR/19"', zoeUserId, 'c1'),
    ]);
    const out = findUnansweredMentions([t]);
    expect(out.map((x) => x.comment.id)).toEqual(['c2']);
  });

  it('a tagged reply DOES answer the comment it names', () => {
    const z = findZoeId();
    const t = task([
      c('c1', '@zoe what is the status'),
      c('c2', 'Here is the status', z, 'c1'),
    ]);
    expect(findUnansweredMentions([t])).toEqual([]);
  });

  // Without this, every historical @zoe mention would read as unanswered and
  // ZOE would flood old threads re-answering all of them.
  it('a legacy untagged ZOE reply still counts, so old threads stay quiet', () => {
    const z = findZoeId();
    const t = task([
      c('c1', '@zoe what is the status'),
      c('c2', 'Here is the status', z),
    ]);
    expect(findUnansweredMentions([t])).toEqual([]);
  });

  it('an unanswered mention is still found', () => {
    const t = task([c('c1', '@zoe please close this')]);
    expect(findUnansweredMentions([t]).map((x) => x.comment.id)).toEqual(['c1']);
  });

  it('a comment that does not tag zoe is never queued', () => {
    const t = task([c('c1', '@zaal look at this')]);
    expect(findUnansweredMentions([t])).toEqual([]);
  });

  it('handles several mentions in one thread independently', () => {
    const z = findZoeId();
    const t = task([
      c('c1', '@zoe first question'),
      c('c2', 'answer to first', z, 'c1'),
      c('c3', '@zoe second question'),
    ]);
    expect(findUnansweredMentions([t]).map((x) => x.comment.id)).toEqual(['c3']);
  });

  it('survives a task with no comments', () => {
    expect(findUnansweredMentions([{ id: 't', title: 'x', metadata: {} } as BoardTask])).toEqual([]);
  });
});

/** ZOE_USER_ID is module-private; recover it from observed behaviour. */
function findZoeId(): string {
  // A reply from this id must satisfy the legacy branch (answers everything).
  for (const candidate of [ZOE, 'zoe', 'ZOE']) {
    const t = task([c('c1', '@zoe q'), c('c2', 'a', candidate)]);
    if (findUnansweredMentions([t]).length === 0) return candidate;
  }
  throw new Error('could not determine ZOE_USER_ID from behaviour');
}
