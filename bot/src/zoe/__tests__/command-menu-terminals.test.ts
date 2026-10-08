import { afterEach, describe, expect, it } from 'vitest';
import { PRIVATE_COMMANDS, privateCommandMenu } from '../button-bar';

// Zaal, 2026-10-08: "doesnt show up as acommadn can we update the bot for that".
// /terminals answered when typed but was missing from the "/" menu.
afterEach(() => {
  delete process.env.ZOE_TERMINALS_DIGEST;
});

describe('private "/" menu and /terminals', () => {
  it('ZOE_TERMINALS_DIGEST=1: /terminals is in the menu, right after cockpit', () => {
    process.env.ZOE_TERMINALS_DIGEST = '1';
    const menu = privateCommandMenu();
    expect(menu[1]).toEqual({ command: 'terminals', description: 'How every terminal is doing' });
    expect(menu).toHaveLength(PRIVATE_COMMANDS.length + 1);
  });

  it('flag off: the menu is exactly the static list, so it never offers a command that falls through', () => {
    expect(privateCommandMenu()).toEqual(PRIVATE_COMMANDS);
  });

  it('every entry fits Telegram limits: 1-32 lowercase chars, description 1-256', () => {
    process.env.ZOE_TERMINALS_DIGEST = '1';
    for (const c of privateCommandMenu()) {
      expect(c.command).toMatch(/^[a-z0-9_]{1,32}$/);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.description.length).toBeLessThanOrEqual(256);
    }
  });
});
