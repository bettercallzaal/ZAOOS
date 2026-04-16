/**
 * DEALER agent -- FISHBOWLZ room economy.
 * Delegates to shared runner for standard buy/burn/stake cycle.
 */
import { runAgent, type AgentRunResult } from './runner';

export async function runDealer(): Promise<AgentRunResult> {
  return runAgent('DEALER');
}
