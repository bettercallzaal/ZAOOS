/**
 * VAULT agent -- ZAO OS treasury management.
 * Delegates to shared runner for standard buy/burn/stake cycle.
 */
import { runAgent, type AgentRunResult } from './runner';

export async function runVault(): Promise<AgentRunResult> {
  return runAgent('VAULT');
}
