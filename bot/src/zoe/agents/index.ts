/**
 * Agent-registration interface for ZOE's command agents (e.g. newsletter.ts).
 *
 * This is the small, pre-existing "command agent" contract: a name/description, regex triggers,
 * and a handle(match, ctx) that returns the reply text. It is distinct from the Farcaster
 * multi-agent registry in ./registry.ts (AgentSpec) - that one ranks autonomous casters; this
 * one routes Telegram command messages.
 *
 * (Restored: newsletter.ts imported `Agent` from './index' but the module was missing, leaving
 * the bot typecheck red. This declares exactly what newsletter.ts uses. Type-only - no runtime.)
 */
import type { Context } from 'grammy';

/** grammy Context augmented with the bot's repo dir (used by command agents like newsletter). */
export interface AgentContext extends Context {
  repoDir: string;
}

export interface Agent {
  name: string;
  description: string;
  /** regex patterns that trigger this agent on an inbound message */
  triggers: RegExp[];
  /** handle a matched message; returns the reply text */
  handle: (match: RegExpMatchArray, ctx: AgentContext) => Promise<string>;
}
