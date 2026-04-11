import { autoCastToZao } from '@/lib/publish/auto-cast';
import type { AgentName, AgentAction } from './types';
import { logger } from '@/lib/logger';

export async function postTradeUpdate(params: {
  agentName: AgentName;
  action: AgentAction;
  details: string;
  txHash?: string;
}): Promise<string | null> {
  const actionLabel: Record<string, string> = {
    buy_zabal: 'bought ZABAL',
    buy_sang: 'bought SANG',
    buy_content: 'bought content',
    sell_zabal: 'sold ZABAL',
    report: 'weekly report',
    add_lp: 'added LP',
    list_content: 'listed content',
  };

  const text = `[${params.agentName}] ${actionLabel[params.action] || params.action}\n\n${params.details}`;
  const embedUrl = params.txHash ? `https://base.blockscout.com/tx/${params.txHash}` : undefined;

  try {
    const castHash = await autoCastToZao(text, embedUrl);
    if (castHash) logger.info(`[${params.agentName}] Posted to /zao: ${castHash}`);
    return castHash;
  } catch (err) {
    logger.error(`[${params.agentName}] Farcaster post failed:`, err);
    return null;
  }
}
