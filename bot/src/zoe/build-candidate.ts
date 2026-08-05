/**
 * build-candidate.ts - tap-to-approve inline buttons for fleet BUILD candidates.
 *
 * The fleet escalates build candidates (a loop draft -> `zao-escalate` -> a
 * project=BUILD row + a Telegram ping). The ping used to carry a COMMAND
 * ("approve: ssh vps build-approve <id>"), not something Zaal could tap. This
 * module gives it [Approve] / [Skip] buttons instead.
 *
 * Why a metadata flag and not status='approved': the tasks.status CHECK
 * constraint only allows todo/in_progress/blocked/done. The old `build-approve`
 * PATCHed status='approved' and silently 400'd every time (93 candidates stuck
 * in todo, "1 done ever"). So approval is recorded as metadata.build_approved =
 * <iso> (valid jsonb, no enum fight) - the same minimal/reversible pattern as
 * brief-veto's metadata.morning_veto. build-queue reads the flag.
 *
 * Pure module - no network. Testable seams: buildCandidateKeyboard,
 * parseBuildCandidateCallback, applyBuildCandidate (injected read + patch).
 */

export type BuildCandidateAction = 'approve' | 'skip';

export interface BuildCandidateCallback {
  action: BuildCandidateAction;
  id: string;
}

/**
 * Inline keyboard for a single build candidate: [Approve - build it] [Skip].
 * callback_data: "bc:approve:<id>" / "bc:skip:<id>".
 */
export function buildCandidateKeyboard(
  buildId: string,
): { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> } {
  return {
    inline_keyboard: [
      [
        { text: 'Approve - build it', callback_data: `bc:approve:${buildId}` },
        { text: 'Skip', callback_data: `bc:skip:${buildId}` },
      ],
    ],
  };
}

/**
 * Parse a build-candidate callback. Returns null if `data` is not a `bc:` tap
 * (so the shared callback router can fall through to other handlers).
 * "bc:approve:1234" -> { action: 'approve', id: '1234' }
 */
export function parseBuildCandidateCallback(data: string): BuildCandidateCallback | null {
  const m = /^bc:(approve|skip):(.+)$/.exec(data);
  if (!m) return null;
  return { action: m[1] as BuildCandidateAction, id: m[2] };
}

export interface ApplyBuildCandidateResult {
  ok: boolean;
  /** true when the candidate was already in the requested state (idempotent no-op). */
  already?: boolean;
  error?: string;
}

/**
 * Record an approve/skip decision on a BUILD-queue candidate as a metadata flag,
 * MERGING into the existing metadata (never overwriting `why`/`tier` that
 * build-queue displays).
 *
 * - approve: set metadata.build_approved = nowIso, clear any build_skipped.
 * - skip:    set metadata.build_skipped  = nowIso, clear any build_approved.
 *
 * Idempotent: a double-tap of the same action is a no-op (returns already=true).
 * Only sets a flag - it does NOT dispatch a build (build-queue polls the flag),
 * so a double-tap can never double-dispatch.
 *
 * @param readMetadata  reads the row's current metadata (null if the row is gone)
 * @param patchMetadata writes the merged metadata back
 * @param nowIso        ISO timestamp of the decision
 */
export async function applyBuildCandidate(
  action: BuildCandidateAction,
  id: string,
  readMetadata: (id: string) => Promise<Record<string, unknown> | null>,
  patchMetadata: (id: string, metadata: Record<string, unknown>) => Promise<void>,
  nowIso: string,
): Promise<ApplyBuildCandidateResult> {
  try {
    const current = await readMetadata(id);
    if (current === null) {
      return { ok: false, error: 'candidate not found' };
    }

    const alreadyFlag = action === 'approve' ? 'build_approved' : 'build_skipped';
    if (current[alreadyFlag]) {
      return { ok: true, already: true };
    }

    const merged: Record<string, unknown> = { ...current };
    if (action === 'approve') {
      merged.build_approved = nowIso;
      delete merged.build_skipped;
    } else {
      merged.build_skipped = nowIso;
      delete merged.build_approved;
    }

    await patchMetadata(id, merged);
    return { ok: true };
  } catch (err) {
    console.error(
      '[zoe/build-candidate] applyBuildCandidate failed:',
      err instanceof Error ? err.message : String(err),
    );
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
