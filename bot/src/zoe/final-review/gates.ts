/**
 * Pure gates for the ZOE final reviewer: eligibility, seat verdict at the
 * exact head, CI at the exact head, reserved classes. Everything it cannot
 * prove is a block; there is no "assume clean". Design note section 3.
 *
 * Reserved PRs are not blocked here. They stay Zaal's own merge, so the flow
 * still grades them and the card says so; the merge line is never emitted.
 */

import { reservedClasses } from '../pr-reserved';
import type { PrSnapshot } from './snapshot';
import { latestVerdictFor, type SeatVerdict } from './verdict';

export interface GateResult {
  /** True only when every gate passed. Reserved PRs can be ready; see `reserved`. */
  ready: boolean;
  blocks: string[];
  reserved: string[];
  verdict: SeatVerdict | null;
}

export function evaluateGates(snap: PrSnapshot, allowedLogins: readonly string[]): GateResult {
  const blocks: string[] = [];
  const reserved = reservedClasses(snap.files, snap.repo, snap.labels);

  if (snap.state !== 'OPEN') blocks.push(`PR is ${snap.state || 'in an unknown state'}, not open`);
  if (snap.isDraft) blocks.push('PR is a draft');
  if (snap.labels.some((l) => l.toLowerCase() === 'hold')) blocks.push('PR carries the hold label');
  if (snap.baseRef !== 'main') blocks.push(`base is ${snap.baseRef || 'unknown'}, not main`);

  const verdict = latestVerdictFor(snap.comments, snap.headSha, allowedLogins);
  if (!verdict) {
    blocks.push('no seat verdict for this exact head');
  } else {
    if (verdict.state !== 'CLEAN') blocks.push(`latest seat verdict at this head is ${verdict.state}`);
    if (reserved.length === 0 && !verdict.reservedNone) blocks.push('seat verdict has no "Reserved: none" line');
  }

  if (snap.checks.length === 0) {
    blocks.push('no CI check runs found for this exact head');
  } else {
    const pending = snap.checks.filter((c) => c.status !== 'completed');
    if (pending.length > 0) blocks.push(`CI not finished: ${pending.map((c) => c.name).join(', ')}`);
    const notGreen = snap.checks.filter((c) => c.status === 'completed' && c.conclusion !== 'success');
    if (notGreen.length > 0) {
      blocks.push(`CI not green: ${notGreen.map((c) => `${c.name}=${c.conclusion ?? 'none'}`).join(', ')}`);
    }
  }

  return { ready: blocks.length === 0, blocks, reserved, verdict };
}
