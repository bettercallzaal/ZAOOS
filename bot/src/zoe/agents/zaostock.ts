/**
 * @zaostock - relay a task or message to the ZAOstock team via @ZAOstockTeamBot.
 *
 * Today: posts as @ZAOstockTeamBot to Zaal's DM (so Zaal sees it AS ZAOstock
 * bot, demonstrates cross-bot relay). Later: swap destination to ZAOstock team
 * group chat once ZAOSTOCK_TEAM_CHAT_ID is set in env.
 *
 * Pattern (per doc 607): ZOE never writes to ZAOSTOCK_TEAM tier directly. It
 * sends through the ZAOstock bot's identity so audit + persona stay clean.
 */
import type { Agent } from './index';

const ZAOSTOCK_BOT_API = 'https://api.telegram.org';

export const agent: Agent = {
  name: 'zaostock',
  description: 'Relay task or message to ZAOstock team via @ZAOstockTeamBot.',
  triggers: [
    /^@(?:zaostock|stock)\s+(.+)/is,
    /^\/zaostock\s+(.+)/is,
  ],
  handle: async (match, ctx): Promise<string> => {
    const body = match[1].trim();
    if (!body) return 'Usage: @zaostock <task or message for the team>';

    const token = process.env.ZAOSTOCK_BOT_TOKEN;
    const destChatId = process.env.ZAOSTOCK_TEAM_CHAT_ID
      ? Number(process.env.ZAOSTOCK_TEAM_CHAT_ID)
      : ctx.zaalTgId;
    if (!token) {
      return '(@zaostock not wired - ZAOSTOCK_BOT_TOKEN missing in bot/.env on VPS)';
    }

    const text = `[ZAOstock relay from ZOE]\n\n${body}\n\n- forwarded by Zaal via @zaoclaw_bot`;
    const url = `${ZAOSTOCK_BOT_API}/bot${token}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: destChatId, text }),
    });

    interface TgResp {
      ok: boolean;
      result?: { message_id?: number };
      description?: string;
    }
    const json = (await res.json()) as TgResp;
    if (!json.ok) {
      return `(@zaostock send failed: ${json.description ?? 'unknown'})`;
    }

    const dest = process.env.ZAOSTOCK_TEAM_CHAT_ID ? 'ZAOstock team chat' : 'your DM (no team chat ID set yet)';
    return `Relayed to ${dest} via @ZAOstockTeamBot (msg ${json.result?.message_id ?? '?'}).`;
  },
};
