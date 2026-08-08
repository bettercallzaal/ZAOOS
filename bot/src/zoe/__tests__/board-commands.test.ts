import { describe, expect, it } from 'vitest';
import {
  isAuthorizedCommander,
  MAX_COMMANDS_PER_COMMENT,
  parseCommands,
  renderReceipt,
  shouldExecute,
  tagsZoe,
  type BoardCommand,
} from '../board-commands';

describe('authorization - a comment box must not become a write API', () => {
  // The board stamps Zaal's comments { userId: 'zaal', displayName: 'Zaal' }
  // (task-teammate-ack.ts:601, :671), and userId is what every sibling module
  // in this directory uses as identity. This gate reads the same field.
  it('Zaal may command, matched on the account id', () => {
    expect(isAuthorizedCommander('zaal')).toBe(true);
    expect(isAuthorizedCommander('Zaal')).toBe(true);
    expect(isAuthorizedCommander('  ZAAL  ')).toBe(true);
  });

  // Iman can still ASK @zoe anything - the reply path is untouched. He just
  // cannot mutate the board through a comment.
  it('a teammate may not command', () => {
    expect(isAuthorizedCommander('iman')).toBe(false);
    expect(isAuthorizedCommander('samantha')).toBe(false);
  });

  it('an unknown or missing id is never a commander', () => {
    expect(isAuthorizedCommander(undefined)).toBe(false);
    expect(isAuthorizedCommander(null)).toBe(false);
    expect(isAuthorizedCommander('')).toBe(false);
    expect(isAuthorizedCommander('zaal@evil')).toBe(false);
  });
});

describe('tagsZoe', () => {
  it.each([
    ['@zoe close this', true],
    ['hey @zoe can you help', true],
    ['@ZOE CLOSE THIS', true],
    ['@zaal look at this', false],
    ['zoe close this', false],
    ['email zoe@thezao.com', false],
  ])('%s -> %s', (text, want) => {
    expect(tagsZoe(text)).toBe(want);
  });
});

describe('shouldExecute - all three gates', () => {
  it('runs for an authorized commander tagging zoe', () => {
    const r = shouldExecute({ content: '@zoe close this', userId: 'zaal', displayName: 'Zaal' });
    expect(r.execute).toBe(true);
  });

  it('does not run when zoe is not tagged', () => {
    const r = shouldExecute({ content: 'close this please', userId: 'zaal', displayName: 'Zaal' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('does not tag');
  });

  it('does not run for an unauthorized commenter, and says who', () => {
    const r = shouldExecute({ content: '@zoe close this task', userId: 'iman', displayName: 'Iman' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('Iman');
  });

  // The reason this gate moved off displayName. A display name is a profile
  // field the user picks; the account id is not. Before this, the comment below
  // executed - anyone who renamed themselves "Zaal" could create, reassign and
  // close board tasks.
  it('a teammate whose display name says Zaal still may not command', () => {
    const r = shouldExecute({ content: '@zoe close this task', userId: 'iman', displayName: 'Zaal' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('not an authorized commander');
  });

  it('refuses, rather than trusting the label, when there is no account behind the comment', () => {
    const r = shouldExecute({ content: '@zoe close this task', displayName: 'Zaal' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('no userId');
  });

  // And the inverse failure: a fuller display name must not stop the real Zaal
  // from commanding, which is what keying on the label would have done.
  it('a longer display name does not block the real commander', () => {
    const r = shouldExecute({
      content: '@zoe close this task',
      userId: 'zaal',
      displayName: 'Zaal Panthaki',
    });
    expect(r.execute).toBe(true);
  });
});

describe('parseCommands - validate, never coerce', () => {
  // The real comment from task #9246 that motivated this whole module.
  it('accepts the three commands from the comment that started this', () => {
    const r = parseCommands([
      { action: 'create_task', title: 'zartizen ui cleanup', assignee: 'iman' },
      { action: 'close_task', taskRef: 'this' },
    ]);
    expect(r.commands).toHaveLength(2);
    expect(r.rejected).toEqual([]);
    const create = r.commands[0] as Extract<BoardCommand, { action: 'create_task' }>;
    expect(create.title).toBe('zartizen ui cleanup');
    expect(create.assignee).toBe('iman');
  });

  it('defaults taskRef to "this"', () => {
    const r = parseCommands([{ action: 'close_task' }]);
    expect(r.commands).toHaveLength(1);
    expect((r.commands[0] as { taskRef: string }).taskRef).toBe('this');
  });

  it('an empty list is the normal case - most comments are conversation', () => {
    expect(parseCommands([]).commands).toEqual([]);
  });

  // A half-understood command is one we do not run.
  it.each([
    [{ action: 'delete_task' }, 'an action outside the allowlist'],
    [{ action: 'create_task' }, 'create with no title'],
    [{ action: 'create_task', title: 'ab' }, 'a title under the minimum'],
    [{ action: 'assign_task' }, 'assign with no assignee'],
    [{ action: 'close_task', taskRef: 'all' }, 'a taskRef other than "this"'],
    ['close this', 'a bare string'],
  ])('rejects %o - %s', (entry, _why) => {
    const r = parseCommands([entry]);
    expect(r.commands).toEqual([]);
    expect(r.rejected).toHaveLength(1);
  });

  it('keeps the good ones and rejects the bad in the same batch', () => {
    const r = parseCommands([
      { action: 'close_task', taskRef: 'this' },
      { action: 'nuke_everything' },
      { action: 'assign_task', assignee: 'iman', taskRef: 'this' },
    ]);
    expect(r.commands).toHaveLength(2);
    expect(r.rejected).toHaveLength(1);
  });

  it('handles a non-list without throwing', () => {
    expect(parseCommands('close this').commands).toEqual([]);
    expect(parseCommands(null).commands).toEqual([]);
    expect(parseCommands(undefined).rejected).toEqual([]);
  });

  it('caps the blast radius and reports what it dropped', () => {
    const many = Array.from({ length: 9 }, () => ({ action: 'close_task', taskRef: 'this' }));
    const r = parseCommands(many);
    expect(r.commands).toHaveLength(MAX_COMMANDS_PER_COMMENT);
    expect(r.dropped).toBe(9 - MAX_COMMANDS_PER_COMMENT);
    expect(r.commands.length + r.dropped).toBe(9);
  });
});

describe('renderReceipt - a board action is never silent', () => {
  it('says what it did', () => {
    const out = renderReceipt(
      [
        { command: { action: 'create_task', title: 'zartizen ui cleanup', assignee: 'iman' }, ok: true, detail: '#9251' },
        { command: { action: 'close_task', taskRef: 'this' }, ok: true, detail: '' },
      ],
      [],
      0,
    );
    expect(out).toContain('zartizen ui cleanup');
    expect(out).toContain('iman');
    expect(out).toContain('#9251');
    expect(out).toContain('closed this task');
  });

  it('reports a failure as FAILED, not as done', () => {
    const out = renderReceipt(
      [{ command: { action: 'close_task', taskRef: 'this' }, ok: false, detail: '400 from the board' }],
      [],
      0,
    );
    expect(out).toContain('FAILED');
    expect(out).not.toMatch(/^done/m);
  });

  it('surfaces rejected entries and the cap rather than hiding them', () => {
    const out = renderReceipt([], ['{"action":"delete_task"}'], 3);
    expect(out).toContain('skipped');
    expect(out).toContain('3 more');
  });

  it('says so plainly when there was nothing to do', () => {
    expect(renderReceipt([], [], 0)).toBe('nothing to do');
  });
});
