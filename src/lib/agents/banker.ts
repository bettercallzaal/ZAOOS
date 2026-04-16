/**
 * BANKER agent -- COC Concertz promoter economy.
 * Delegates to shared runner for standard buy/burn/stake cycle.
 */
import { runAgent, type AgentRunResult } from './runner';

export async function runBanker(): Promise<AgentRunResult> {
  return runAgent('BANKER');
}
