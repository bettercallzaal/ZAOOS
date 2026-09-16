/**
 * agent-delegation.ts - Natural language task delegation and blocker resolution for ZOE.
 *
 * Allows Zaal to delegate work naturally in DM (e.g. "look into sound gear in Ellsworth",
 * "investigate lodging in Bangor", "draft a brief on festival sound engineers") without
 * needing explicit "queue:" or "plan:" prefixes.
 *
 * Rules: zero emojis, zero em dashes, house spelling, pure unit-testable predicates.
 */

import { enqueueWork, runWorkTick, type WorkItem, type WorkTickDeps } from "./work-loop";

/**
 * Who may delegate. Kept pure so index.ts cannot forget it and a test can
 * prove it. Measured 2026-09-15 before this existed: handlePrivateMessage is
 * reached from the brand group path too (index.ts, the brandContext call), so
 * without this a stranger in a brand chat typing "look into X" enqueued
 * autonomous work under Zaal's deps and kicked the work loop.
 */
export function delegationAllowed(a: { fromId?: number; zaalId: number; chatType?: string }): boolean {
  return a.fromId === a.zaalId && a.chatType === "private";
}

export interface DelegationIntent {
  isDelegated: boolean;
  cleanTask: string;
  kind: "research" | "brief" | "investigation" | "general";
  confidence: number;
}

const DELEGATION_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  kind: "research" | "brief" | "investigation" | "general";
}> = [
  {
    pattern: /^(?:please\s+)?(?:look\s+into|check\s+into|dig\s+into)\s+(.+)/i,
    kind: "investigation",
  },
  {
    pattern: /^(?:please\s+)?(?:investigate|audit|analyze|analyse)\s+(.+)/i,
    kind: "investigation",
  },
  {
    pattern: /^(?:please\s+)?(?:research|find\s+out|figure\s+out)\s+(.+)/i,
    kind: "research",
  },
  {
    pattern: /^(?:please\s+)?(?:draft|write)\s+(?:a\s+)?(?:brief|doc|note|memo|summary|report)\s+(?:on|about|for)\s+(.+)/i,
    kind: "brief",
  },
  {
    pattern: /^(?:delegate|assign|run\s+task):\s*(.+)/i,
    kind: "general",
  },
];

/**
 * Detect whether user text represents a task delegation to the autonomous agent.
 * Filters out slash commands, colon-prefixed commands, conversational greetings,
 * and short questions.
 */
export function detectDelegationIntent(text: string): DelegationIntent {
  const trimmed = text.trim();
  if (trimmed.length < 10) {
    return { isDelegated: false, cleanTask: "", kind: "general", confidence: 0 };
  }

  // Reject slash commands
  if (trimmed.startsWith("/")) {
    return { isDelegated: false, cleanTask: "", kind: "general", confidence: 0 };
  }

  // Reject standard prefixes handled by existing COMMAND_TABLE
  if (/^(?:note|cc|claude|queue|plan|decompose):/i.test(trimmed)) {
    return { isDelegated: false, cleanTask: "", kind: "general", confidence: 0 };
  }

  // Reject conversational questions that should stay in chat
  if (/^(?:what|when|where|who|why|how|is it|are we|can you tell me|do you know)\b/i.test(trimmed)) {
    return { isDelegated: false, cleanTask: "", kind: "general", confidence: 0 };
  }

  // Match delegation patterns
  for (const entry of DELEGATION_PATTERNS) {
    const match = entry.pattern.exec(trimmed);
    if (match && match[1]) {
      const cleanTask = match[1].trim();
      if (cleanTask.length >= 5) {
        return {
          isDelegated: true,
          cleanTask,
          kind: entry.kind,
          confidence: 0.9,
        };
      }
    }
  }

  return { isDelegated: false, cleanTask: "", kind: "general", confidence: 0 };
}

/**
 * Format confirmation acknowledgment for delegated task.
 * Zero emojis, zero em dashes.
 */
export function formatDelegationAck(item: WorkItem, kind: string): string {
  const kindLabel = kind === "brief" ? "Brief preparation" : kind === "investigation" ? "Investigation" : "Research";
  return (
    `${kindLabel} delegated to autonomous agent: "${item.input}" (ID: ${item.id}).\n` +
    `Enqueued in work-loop and executing now. Results will report back with verified artifacts.`
  );
}

/**
 * Dispatches delegated task to the autonomous work-loop.
 */
export async function dispatchDelegatedTask(
  cleanTask: string,
  kind: "research" | "brief" | "investigation" | "general",
  deps: {
    sendAck: (message: string) => Promise<unknown>;
    workDeps: WorkTickDeps;
  },
): Promise<WorkItem> {
  const prefix = kind === "brief" ? "Draft brief on " : kind === "investigation" ? "Investigate " : "";
  const fullTask = `${prefix}${cleanTask}`.trim();

  const item = await enqueueWork(fullTask);
  const ackMessage = formatDelegationAck(item, kind);
  await deps.sendAck(ackMessage);

  // Trigger background autonomous tick
  void Promise.resolve(runWorkTick(deps.workDeps)).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[zoe/agent-delegation] background work-loop tick error:", msg);
  });

  return item;
}
