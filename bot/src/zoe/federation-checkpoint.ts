/**
 * federation-checkpoint.ts - durable state so a crash resumes instead of repeating.
 *
 * THE TEST THIS EXISTS TO PASS (Brandon's spec calls it mandatory):
 *
 *   Kill ZOE after TRANSPORT_ACK but before VERIFY_EFFECT. Restart. It must load
 *   the checkpoint, recognise the messageId, know which steps completed, NOT
 *   re-send the file, resume at verification, and finish with ONE terminal
 *   result.
 *
 *   "If it starts the whole loop over and duplicates the side effect, the canary
 *   fails."
 *
 * WHY A FILE AND NOT MEMORY. The failure mode is a process that dies. Anything
 * held in that process dies with it, which is how you get the same job executed
 * twice - once before the crash and once after. A second runtime must be able to
 * pick this up cold.
 *
 * WHAT IS DELIBERATELY NOT STORED, per the spec: private keys, bearer tokens,
 * raw secrets, hidden reasoning, unrestricted private memory. A checkpoint is a
 * resumption record, not a data store, and it sits on disk where anything in it
 * outlives the run.
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ReasonCode, Step, TerminalState } from './federation-states';

export interface Generation {
  generationId: string;
  parentGenerationId: string | null;
  loopId: 'federation-canary-v1';
  protocolVersion: string;
  messageId: string;
  nonce: string;
  contentSha256: string;
  direction: 'zoe-to-dreamnet' | 'dreamnet-to-zoe';
  currentStep: Step;
  completedSteps: Step[];
  pendingSteps: Step[];
  terminalState: TerminalState | null;
  reasonCode: ReasonCode | null;
  evidenceRefs: string[];
  receiptRefs: string[];
  createdAt: string;
  updatedAt: string;
}

const dir = () => join(homedir(), '.zao', 'zoe', 'federation');
const pathFor = (messageId: string) => join(dir(), `${safe(messageId)}.json`);

/** messageId reaches a filename, so it cannot be allowed to reach a directory. */
function safe(id: string): string {
  const s = id.replace(/[^A-Za-z0-9._-]/g, '_');
  if (!s || s === '.' || s === '..') throw new Error(`unusable messageId: ${id}`);
  return s;
}

/**
 * Write the checkpoint ATOMICALLY - temp file, then rename.
 *
 * A crash mid-write would otherwise leave truncated JSON, and the next start
 * would read a half-written checkpoint as authoritative state. rename() is
 * atomic on POSIX, so a reader sees either the old file or the new one and
 * never a partial. This is the same reason zao-status-refresh writes via a temp
 * file.
 */
export async function writeCheckpoint(g: Generation): Promise<void> {
  await fs.mkdir(dir(), { recursive: true });
  const target = pathFor(g.messageId);
  const tmp = `${target}.tmp.${process.pid}`;
  const body = JSON.stringify({ ...g, updatedAt: new Date().toISOString() }, null, 1);
  await fs.writeFile(tmp, body, { mode: 0o600 });
  await fs.rename(tmp, target);
}

/** The checkpoint for a messageId, or null if this run is genuinely new. */
export async function readCheckpoint(messageId: string): Promise<Generation | null> {
  try {
    const raw = await fs.readFile(pathFor(messageId), 'utf8');
    return JSON.parse(raw) as Generation;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') return null;
    // A checkpoint that exists but cannot be read is NOT the same as no
    // checkpoint. Returning null would restart the loop and duplicate the side
    // effect - precisely the failure the crash test checks for. Fail loudly.
    throw new Error(
      `checkpoint for ${messageId} exists but is unreadable (${code ?? 'unknown'}) - ` +
        'refusing to treat that as a fresh run, which would re-send the file',
    );
  }
}

export function newGeneration(input: {
  messageId: string;
  nonce: string;
  contentSha256: string;
  protocolVersion: string;
  direction: Generation['direction'];
  parentGenerationId?: string | null;
}): Generation {
  const now = new Date().toISOString();
  return {
    generationId: `gen_${input.messageId}`,
    parentGenerationId: input.parentGenerationId ?? null,
    loopId: 'federation-canary-v1',
    protocolVersion: input.protocolVersion,
    messageId: input.messageId,
    nonce: input.nonce,
    contentSha256: input.contentSha256,
    direction: input.direction,
    currentStep: 'RECEIVE',
    completedSteps: [],
    pendingSteps: [
      'VALIDATE', 'HASH', 'SEND', 'TRANSPORT_ACK',
      'APPLICATION_ACK', 'VERIFY_EFFECT', 'RECORD', 'CHECKPOINT', 'COMPLETE',
    ],
    terminalState: null,
    reasonCode: null,
    evidenceRefs: [],
    receiptRefs: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Mark a step done and move to the next. Pure - the caller persists.
 *
 * `next` STAYS PENDING. The first version dropped it, and the mandatory crash
 * test caught it immediately: after a crash following TRANSPORT_ACK, resumeAt
 * returned VERIFY_EFFECT instead of APPLICATION_ACK, so a resumed run would
 * have skipped the application ack entirely and gone straight to verifying an
 * effect nobody had accepted.
 *
 * That is the exact failure this whole file exists to prevent, written into the
 * file itself. Being "the current step" is not the same as being done.
 */
export function advance(g: Generation, done: Step, next: Step): Generation {
  return {
    ...g,
    completedSteps: g.completedSteps.includes(done) ? g.completedSteps : [...g.completedSteps, done],
    pendingSteps: g.pendingSteps.filter((s) => s !== done),
    currentStep: next,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Should the file be sent again on resume? Almost always NO.
 *
 * If SEND completed, the bytes are already across. Re-sending because we
 * crashed before verifying would execute the same logical job twice for the
 * sole reason that the SENDER did not see an ACK - which the spec names
 * explicitly as forbidden.
 */
export function shouldResend(g: Generation): boolean {
  return !g.completedSteps.includes('SEND');
}

/**
 * Where a resumed run picks up: the first step not yet completed.
 *
 * Returns null once COMPLETE is done, so a finished run can never be restarted
 * into a second side effect.
 */
export function resumeAt(g: Generation): Step | null {
  if (g.completedSteps.includes('COMPLETE')) return null;
  return g.pendingSteps[0] ?? g.currentStep;
}

/** Directory for tests to point elsewhere. Not used in production paths. */
export const CHECKPOINT_DIR = dir;
export const checkpointPath = pathFor;
export const checkpointParent = () => dirname(pathFor('x'));
