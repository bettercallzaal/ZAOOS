/**
 * Live GradeFn for the ZOE final reviewer: fetch the diff of the EXACT head
 * SHA from GitHub (read-only compare API, no checkout of the PR) and score it
 * with the existing Hermes critic (runCriticOnDiff), then map the result onto
 * the ZOE critique contract (CritiqueOutput, threshold 70).
 *
 * The Hermes critic returns only score + feedback, so `issues` is empty and
 * the critical-issue gate in gradeOutcome cannot fire for this adapter; the
 * score threshold and the critic's injection rule (score 0) are what gate.
 * reviewerFamily is 'same' (Claude reviewing Claude; item 194 keeps routing on
 * the Claude plan). Nothing here writes: the claude CLI runs in an empty temp
 * dir that this function created and removes by its own captured path.
 *
 * The compare API is pinned to the snapshot's full head SHA, so the diff is that
 * head's, not whatever the branch is now. An unreadable or empty diff, a critic
 * failure or a missing score throws, and the flow raises no card.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCriticOnDiff } from '../../hermes/critic';
import type { CritiqueInput } from '../../hermes/types';
import { CRITIQUE_PASS_THRESHOLD, type CritiqueOutput } from '../critics/types';
import type { GradeFn } from './grade';
import { isFullSha } from './merge-line';
import type { GhRunner } from './snapshot';

type CriticOnDiff = (input: CritiqueInput, diff: string) => Promise<{
  score: number;
  feedback: string;
  inputTokens: number;
  outputTokens: number;
  modelUsed?: string;
}>;

export interface GradeAdapterDeps {
  gh: GhRunner;
  critic?: CriticOnDiff;
  /** Test seam for the temp dir; production uses a fresh mkdtemp. */
  makeTempDir?: () => string;
  removeTempDir?: (path: string) => void;
  now?: () => number;
}

export function makeHermesGrade(deps: GradeAdapterDeps): GradeFn {
  const critic = deps.critic ?? runCriticOnDiff;
  const makeDir = deps.makeTempDir ?? (() => mkdtempSync(join(tmpdir(), 'zoe-final-review-')));
  const removeDir = deps.removeTempDir ?? ((p: string) => rmSync(p, { recursive: true, force: true }));
  const now = deps.now ?? Date.now;

  return async (snap) => {
    if (!isFullSha(snap.headSha)) throw new Error('grade: head is not a full sha');
    const started = now();
    const res = await deps.gh([
      'api', '-H', 'Accept: application/vnd.github.v3.diff',
      `repos/${snap.repo}/compare/${snap.baseRef}...${snap.headSha}`,
    ]);
    if (res.code !== 0 || !res.stdout.trim()) throw new Error('grade: could not fetch the diff at the exact head');

    const dir = makeDir();
    try {
      const out = await critic(
        {
          workTreePath: dir,
          branchName: snap.headSha,
          filesChanged: snap.files,
          issueText: `PR ${snap.repo}#${snap.number} at ${snap.headSha}. Final review before an owner merge decision.`,
        },
        res.stdout,
      );
      if (typeof out.score !== 'number' || !Number.isFinite(out.score)) throw new Error('grade: critic returned no score');
      const mapped: CritiqueOutput = {
        score: out.score,
        summary: out.feedback,
        issues: [],
        ships_as_is: out.score >= CRITIQUE_PASS_THRESHOLD,
        model: out.modelUsed ?? 'unknown',
        inputTokens: out.inputTokens,
        outputTokens: out.outputTokens,
        costUsd: 0,
        durationMs: now() - started,
        reviewerFamily: 'same',
      };
      return mapped;
    } finally {
      removeDir(dir);
    }
  };
}
