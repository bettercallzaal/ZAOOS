/**
 * /help per Telegram chat (iman-desk #168 item 5; vault decisions 2026-11-08
 * item 4). Renders what ZOE does in THIS chat from its groups.ts GroupConfig,
 * the untagged flag (ruling 300) and the Devz fold (ruling 304), instead of one
 * static text for every group. Group-safe: it names no private surface, no
 * member, and no command that only works in Zaal's DMs.
 *
 * Twin: discord-admin.ts ADMIN_HELP is the Discord side's help text.
 */
import type { GroupConfig } from './groups';

export interface ChatHelpInput {
  /** This chat's config, or null when ZOE was never set up here. */
  config: GroupConfig | null;
  /** groupUntaggedAllowed(): untagged replies in mode=all. */
  untagged: boolean;
  /** True only when the Devz fold is on AND this is the Devz chat. */
  devzFold: boolean;
  botUsername: string | null;
}

/** The /help text for a group or channel. */
export function groupHelpText(input: ChatHelpInput): string {
  const at = `@${input.botUsername || 'zaoclaw_bot'}`;
  const { config } = input;
  if (!config || config.mode === 'silent') {
    return ['ZOE in this chat:', '', 'ZOE is switched off here and stays quiet. Zaal can switch her on for this chat.'].join('\n');
  }
  const restricted = config.member_allowlist.length > 0 && !config.member_allowlist.includes(-1);
  const lines = [
    'ZOE in this chat:',
    '',
    restricted ? '- She answers only the members Zaal added for this chat.' : '- She answers anyone in this chat.',
    `- Reach her: tag ${at}, reply to one of her messages, or use /ask <question>.`,
    input.untagged && config.mode === 'all'
      ? '- She may also answer messages here that do not tag her.'
      : '- She does not answer messages that do not tag her or reply to her.',
  ];
  if (input.devzFold) {
    lines.push(
      `- Coding, admins only: /fix <issue> or "${at} fix: <issue>" runs the coder and critic; /fix_status shows open runs.`,
    );
  }
  lines.push(
    '- She can answer questions about The ZAO, COC Concertz, music collaborations and the roadmap.',
    '- To leave a message for Zaal, say "Please let Zaal know..." and she passes it on.',
  );
  return lines.join('\n');
}

/** The /help text for a private chat with anyone but Zaal. */
export const PRIVATE_NON_OWNER_HELP = [
  'ZOE here:',
  '',
  'Private chats with ZOE are for Zaal. In a ZAO group, tag her or use /ask <question>, and /help there shows what she does in that chat.',
].join('\n');
