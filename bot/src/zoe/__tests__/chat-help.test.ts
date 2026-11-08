import { describe, expect, it } from 'vitest';
import { type ChatHelpInput, groupHelpText, PRIVATE_NON_OWNER_HELP } from '../chat-help';
import type { GroupConfig } from '../groups';

// iman-desk #168 item 5: /help renders what ZOE does in THIS chat.

function cfg(over: Partial<GroupConfig> = {}): GroupConfig {
  return {
    chat_id: -100,
    chat_title: 't',
    mode: 'mention',
    member_allowlist: [-1],
    created_at: '',
    updated_at: '',
    ...over,
  };
}

function help(over: Partial<ChatHelpInput> = {}): string {
  return groupHelpText({ config: cfg(), untagged: false, devzFold: false, botUsername: 'zaoclaw_bot', ...over });
}

// Commands that only work in Zaal's DMs: a group /help must never list them.
const PRIVATE_ONLY = ['/cockpit', '/needsme', '/grill', '/board', '/working', '/status', '/pulse', '/zg', '/menu', '/focus'];

describe('groupHelpText', () => {
  it.each([
    ['never set up', null],
    ['silent', cfg({ mode: 'silent' })],
  ])('says ZOE is off and lists no way to reach her when the chat is %s', (_label, config) => {
    const t = help({ config, devzFold: true });
    expect(t).toContain('switched off');
    expect(t).not.toContain('/ask');
    expect(t).not.toContain('/fix');
  });

  it('a mention-mode chat open to everyone: tag, reply or /ask; untagged messages are not answered', () => {
    const t = help();
    expect(t).toContain('answers anyone');
    expect(t).toContain('tag @zaoclaw_bot, reply to one of her messages, or use /ask');
    expect(t).toContain('does not answer messages that do not tag her');
  });

  it('a restricted chat says so and never prints a member id', () => {
    const t = help({ config: cfg({ member_allowlist: [424242, 777] }) });
    expect(t).toContain('only the members Zaal added');
    expect(t).not.toMatch(/424242|777/);
  });

  it('mode=all mentions untagged answers only when the untagged flag is on', () => {
    expect(help({ config: cfg({ mode: 'all' }), untagged: true })).toContain('may also answer messages here that do not tag her');
    expect(help({ config: cfg({ mode: 'all' }), untagged: false })).toContain('does not answer messages that do not tag her');
    expect(help({ config: cfg({ mode: 'mention' }), untagged: true })).toContain('does not answer messages that do not tag her');
  });

  it('lists /fix and /fix_status only in the Devz chat with the fold on', () => {
    expect(help({ devzFold: true })).toContain('/fix <issue>');
    expect(help({ devzFold: true })).toContain('/fix_status');
    expect(help({ devzFold: false })).not.toContain('/fix');
  });

  it('uses the live bot username, with the old fallback before boot knows it', () => {
    expect(help({ botUsername: 'zaodevz_bot' })).toContain('@zaodevz_bot');
    expect(help({ botUsername: null })).toContain('@zaoclaw_bot');
  });

  it('never names a private-only command, in any variant', () => {
    const variants = [
      help(),
      help({ devzFold: true }),
      help({ config: cfg({ mode: 'all' }), untagged: true }),
      help({ config: null }),
      PRIVATE_NON_OWNER_HELP,
    ];
    for (const t of variants) for (const c of PRIVATE_ONLY) expect(t.split(/\s/)).not.toContain(c);
  });
});
