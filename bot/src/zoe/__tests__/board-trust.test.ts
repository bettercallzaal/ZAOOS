// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  BOARD_APPROVAL_TTL_MS,
  BOARD_RUN_CALLBACK,
  BOARD_UNTRUSTED_SCOPE,
  isTrustedBoardCommand,
  newRunTaskApprovals,
  runTaskApprovalCard,
  trustedBoardAuthors,
} from '../board-trust';
import { toolPolicyForScope } from '../scope-lock';

const INDEX = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');

describe('who is trusted', () => {
  it('defaults to zaal only', () => {
    expect(trustedBoardAuthors({})).toEqual(['zaal']);
    expect(trustedBoardAuthors({ ZOE_BOARD_TRUSTED_AUTHORS: ' , ' })).toEqual(['zaal']);
    expect(trustedBoardAuthors({ ZOE_BOARD_TRUSTED_AUTHORS: 'Zaal, Iman' })).toEqual(['zaal', 'iman']);
  });

  it.each([
    ['zaal', true],
    ['ZAAL', true],
    [' zaal ', true],
    ['iman', false],
    ['thyrev', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('created_by %j -> %s', (who, trusted) => {
    expect(isTrustedBoardCommand(who, {})).toBe(trusted);
  });

  it('a command with no author is never trusted, whatever the list holds', () => {
    expect(isTrustedBoardCommand(null, { ZOE_BOARD_TRUSTED_AUTHORS: 'zaal,iman' })).toBe(false);
  });

  it('the untrusted scope is not private, so it is talk-only', () => {
    expect(BOARD_UNTRUSTED_SCOPE).not.toBe('private');
    expect(toolPolicyForScope(BOARD_UNTRUSTED_SCOPE)).toBe('none');
  });
});

describe('held run_task approvals', () => {
  const task = { commandId: 55, instructions: 'update the README', todoId: '9', createdBy: 'iman' };

  it('a held task is taken once; a second tap gets nothing', () => {
    const a = newRunTaskApprovals();
    const key = a.hold(task, 1_000);
    expect(a.take(key, 2_000)).toMatchObject(task);
    expect(a.take(key, 2_000)).toBeNull();
  });

  it('expires after the TTL', () => {
    const a = newRunTaskApprovals();
    const key = a.hold(task, 1_000);
    expect(a.take(key, 1_000 + BOARD_APPROVAL_TTL_MS)).toBeNull();
  });

  it('the card buttons match the callback pattern and nothing else does', () => {
    const a = newRunTaskApprovals();
    const key = a.hold(task, 1_000);
    const card = runTaskApprovalCard(task, key);
    expect(card.text).toContain('iman');
    expect(card.text).toContain('update the README');
    const [run, no] = card.keyboard.inline_keyboard[0];
    expect(BOARD_RUN_CALLBACK.exec(run.callback_data)?.[1]).toBe('run');
    expect(BOARD_RUN_CALLBACK.exec(no.callback_data)?.[1]).toBe('no');
    expect(BOARD_RUN_CALLBACK.test('bct:run:../x')).toBe(false);
    expect(BOARD_RUN_CALLBACK.test('bct:yes:1-a')).toBe(false);
  });
});

describe('index.ts wiring (read as source; index.ts is never imported)', () => {
  const block = (marker: string) => {
    const at = INDEX.indexOf(marker);
    expect(at, marker).toBeGreaterThan(0);
    return INDEX.slice(at, INDEX.indexOf('\n    },\n', at));
  };

  it('ask: the scope and tools come from the author check', () => {
    const ask = block('    onAsk: async (args, meta) => {');
    const check = ask.indexOf('isTrustedBoardCommand(meta.createdBy)');
    expect(check).toBeGreaterThan(0);
    expect(ask).toContain("trusted ? 'private' : BOARD_UNTRUSTED_SCOPE");
    expect(ask).toContain('toolPolicy: toolPolicyForScope(scope)');
    expect(check).toBeLessThan(ask.indexOf('runConciergeTurn('));
    expect(ask).not.toContain("toolPolicyForScope('private')");
  });

  it('run_task: untrusted is held for a tap and returns before anything runs', () => {
    const run = block('    onRunTask: async (args, meta) => {');
    const gate = run.indexOf('if (!isTrustedBoardCommand(meta.createdBy)) {');
    const held = run.indexOf('return { held: true');
    const runs = run.indexOf('runBoardTask(');
    expect(gate).toBeGreaterThan(0);
    expect(held).toBeGreaterThan(gate);
    expect(runs).toBeGreaterThan(held);
    expect(run).not.toContain('runConciergeTurn(');
  });

  it('the Run button is registered before the catch-all that would swallow it, and checks it is Zaal', () => {
    const handler = INDEX.indexOf('bot.callbackQuery(BOARD_RUN_CALLBACK');
    const lastCatchAll = INDEX.lastIndexOf("bot.on('callback_query:data', async (ctx) => {");
    expect(handler).toBeGreaterThan(0);
    expect(handler).toBeLessThan(lastCatchAll);
    const body = INDEX.slice(handler, INDEX.indexOf('\n});', handler));
    expect(body.indexOf('isFromZaal(ctx)')).toBeGreaterThan(0);
    expect(body.indexOf('isFromZaal(ctx)')).toBeLessThan(body.indexOf('runBoardTask('));
  });
});
