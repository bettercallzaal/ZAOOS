/**
 * ZOE agent registry — pluggable handlers for @target / /command shortcuts.
 *
 * Each agent file in this folder exports an Agent. tryRouteAgent walks the
 * registry, first regex match wins, returns reply text. If no agent matches,
 * caller falls back to free-form concierge.
 *
 * Drop a new file, register it, get a new @target. That's it.
 */

import type { Bot } from 'grammy';
import { agent as recallAgent } from './recall';
import { agent as researchAgent } from './research';
import { agent as newsletterAgent } from './newsletter';
import { agent as zaostockAgent } from './zaostock';

export interface AgentContext {
  bot: Bot;
  zaalTgId: number;
  repoDir: string;
  rawText: string;
}

export interface Agent {
  name: string;
  description: string;
  triggers: RegExp[];
  handle: (match: RegExpExecArray, ctx: AgentContext) => Promise<string>;
}

export interface AgentRouteResult {
  agentName: string;
  reply: string;
}

export const AGENTS: Agent[] = [recallAgent, researchAgent, newsletterAgent, zaostockAgent];

export async function tryRouteAgent(text: string, ctx: AgentContext): Promise<AgentRouteResult | null> {
  for (const a of AGENTS) {
    for (const trigger of a.triggers) {
      const match = trigger.exec(text);
      if (match) {
        try {
          const reply = await a.handle(match, ctx);
          return { agentName: a.name, reply };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[zoe/agents/${a.name}] handle failed:`, msg);
          return { agentName: a.name, reply: `(${a.name} agent error - ${msg.slice(0, 200)})` };
        }
      }
    }
  }
  return null;
}

export function listAgents(): string {
  return AGENTS.map((a) => `- @${a.name} - ${a.description}`).join('\n');
}
