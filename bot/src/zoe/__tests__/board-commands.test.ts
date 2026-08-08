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
  it('Zaal may command', () => {
    expect(isAuthorizedCommander('Zaal')).toBe(true);
    expect(isAuthorizedCommander('zaal')).toBe(true);
    expect(isAuthorizedCommander('  ZAAL  ')).toBe(true);
  });

  // Iman can still ASK @zoe anything - the reply path is untouched. He just
  // cannot mutate the board through a comment.
  it('a teammate may not command', () => {
    expect(isAuthorizedCommander('Iman')).toBe(false);
    expect(isAuthorizedCommander('Samantha')).toBe(false);
  });

  it('an unknown or missing name is never a commander', () => {
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
    expect(shouldExecute({ content: '@zoe close this', displayName: 'Zaal' }).execute).toBe(true);
  });

  it('does not run when zoe is not tagged', () => {
    const r = shouldExecute({ content: 'close this please', displayName: 'Zaal' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('does not tag');
  });

  it('does not run for an unauthorized commenter, and says who', () => {
    const r = shouldExecute({ content: '@zoe close this task', displayName: 'Iman' });
    expect(r.execute).toBe(false);
    expect(r.reason).toContain('Iman');
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
