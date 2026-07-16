/**
 * brief-veto.ts - AI-ranked morning brief with tap-to-veto inline buttons.
 *
 * Contract: ZOE ranks tasks and surfaces veto buttons for top items.
 * Zaal taps a veto button -> ZOE records metadata.morning_veto = <ISO date>.
 * The veto is MINIMAL, REVERSIBLE: just a metadata flag, no status change or delete.
 *
 * Pure module — no network calls, no side effects beyond what's injected.
 * Testable seams: buildVetoKeyboard, parseVetoCallback, applyVeto (injected patchImpl).
 */

/**
 * Task shape for veto keyboard building.
 * Minimal — only id + title needed for the button labels.
 */
export interface VetoTask {
  id: string;
  title: string;
}

/**
 * Build an inline keyboard for veto buttons.
 * One button per task (capped at max), callback_data = "veto:<taskId>".
 * Label: "🚫 <truncated title>" (keep it short so it fits on mobile).
 * Returns empty keyboard if tasks is empty or max <= 0.
 */
export function buildVetoKeyboard(
  tasks: VetoTask[],
  max = 5,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  const rows: Array<Array<{ text: string; callback_data: string }>> = [];

  for (let i = 0; i < Math.min(tasks.length, max); i++) {
    const task = tasks[i];
    // Truncate title to ~30 chars so the button + emoji fit on mobile
    const truncated = task.title.length > 30 ? task.title.slice(0, 27) + '...' : task.title;
    const label = `🚫 ${truncated}`;
    const callbackData = `veto:${task.id}`;

    rows.push([{ text: label, callback_data: callbackData }]);
  }

  return { inline_keyboard: rows };
}

/**
 * Parse a veto callback_data string.
 * Returns the taskId for "veto:<id>" data, else null.
 * Example: "veto:task-123" -> "task-123"
 */
export function parseVetoCallback(data: string): string | null {
  if (!data.startsWith('veto:')) return null;
  const taskId = data.slice(5); // skip "veto:"
  return taskId && taskId.length > 0 ? taskId : null;
}

/**
 * Apply a veto to a task.
 * Calls patchImpl to PATCH the task's metadata.morning_veto = nowIso.
 * Injected patchImpl for testability (no real network in tests).
 *
 * Pattern: read-modify-write the metadata object (jsonb) to set morning_veto.
 * On error, returns false (fail-safe, never throws).
 *
 * @param taskId - the task to veto
 * @param patchImpl - async fn that performs the PATCH to cowork tracker
 * @param nowIso - ISO timestamp of the veto (e.g., new Date().toISOString())
 * @returns true if veto applied, false on error
 */
export async function applyVeto(
  taskId: string,
  patchImpl: (taskId: string, metadata: Record<string, unknown>) => Promise<void>,
  nowIso: string,
): Promise<boolean> {
  try {
    // Metadata update: set morning_veto = nowIso
    // The patchImpl receives the full metadata object to upsert.
    const metadata = {
      morning_veto: nowIso,
    };
    await patchImpl(taskId, metadata);
    return true;
  } catch (err) {
    console.error('[zoe/brief-veto] applyVeto failed:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
