/**
 * done-work-detector.ts - decide which open board tasks describe work that has
 * VERIFIABLY concluded, so ZOE's hourly pass can close them.
 *
 * THE PROBLEM (measured 2026-08-08)
 * --------------------------------
 * The cowork board had 474 open / 122 overdue. The cause is structural: EIGHT
 * writers can create a task (inbox 112, escalated 93, meeting 56, handoff 28,
 * research-doc 25, cowork-actions 17, zaal-master 13) and NOTHING can close one.
 * Closing meant opening a browser and clicking, so closing cost more than
 * ignoring, and ignoring won.
 *
 * THE MISTAKE THIS MODULE ALREADY MADE, KEPT HERE SO IT IS NOT REMADE
 * ------------------------------------------------------------------
 * The first version closed a task when the research doc it named was merged into
 * research/ on main. A dry run against the live board proposed closing 40 tasks -
 * and the proposal was wrong.
 *
 * Two separate defects, both worth naming:
 *
 * 1. THE DOC RULE WAS VACUOUS. The research-doc writer creates "Review research
 *    doc NNNN" the moment the doc ships, so the doc is ALREADY merged when the
 *    task is born. Measured: 25 of 25 open doc-review tasks pointed at a merged
 *    doc. A condition true for 100% of the set discriminates nothing - it is not
 *    evidence of completion, it is a restatement of the task's own existence.
 *    Closing on it is not detection, it is deleting the queue while producing a
 *    sentence that sounds like proof.
 *
 * 2. A NUMBER IN THE TITLE IS NOT THE TASK\'S SUBJECT. "Build zao-claude-kit via
 *    opensource-pipeline (doc 946)" and "Name Site Lead for ZAOstock (doc 1032)"
 *    merely CITE a doc. The doc is where the ask is written down; the ask is
 *    building a repo and naming a person. Closing those because the doc exists
 *    would have destroyed live work and reported it as an accomplishment.
 *
 * The corrected rule follows from both: a task may be closed only when its
 * legacy_source proves the task exists SOLELY to track one artefact, AND that
 * artefact has reached a state that makes the task moot. Title text never
 * qualifies, and "the artefact exists" never qualifies.
 *
 * WHAT SURVIVES
 * -------------
 * pr-auto:NNNN - created by the PR-test-plan writer for exactly one PR. When
 * that PR is merged or closed-without-merge, it has reached a terminal state and
 * the reminder is moot. That is a genuine state CHANGE after the task was born,
 * which is what evidence has to be.
 *
 * Doc-review tasks are deliberately NOT closed here. They are surfaced by
 * `findVacuousReviewReminders` so a human can make one bulk decision about a
 * queue that was never actionable, rather than have a machine quietly delete it.
 *
 * This module is PURE - facts in, verdicts out - so the rules are unit-testable
 * without a board, a repo, or a network (the convention task-classifier.ts and
 * topic-router.ts already follow).
 */

export interface OpenTask {
  id: string;
  title: string;
  /** legacy_source, e.g. "research-doc:2207" or "pr-auto:2867". */
  legacySource?: string | null;
}

/** What the caller must look up for us, gathered once for the whole batch. */
export interface RepoFacts {
  /** PR numbers whose squash commit is on main, i.e. "(#NNNN)" in the log. */
  mergedPrNums: Set<string>;
  /** PR numbers CLOSED WITHOUT merge - abandoned, so the task is equally dead.
   *  Kept separate so the reason we write is honest about which happened. */
  closedUnmergedPrNums: Set<string>;
  /** Doc numbers merged on main. Used ONLY for reporting vacuous reminders -
   *  never as a close condition, for the reason documented above. */
  mergedDocNums: Set<string>;
}

export interface CloseVerdict {
  id: string;
  title: string;
  /** Human-readable justification, written into the task\'s notes. Never a bare
   *  "auto-closed" - a close nobody can explain is one nobody can trust. */
  reason: string;
}

/**
 * The PR number this task exists to track, or null.
 *
 * legacy_source ONLY. A "#2867" in a title can be a citation, a cross-reference,
 * or a mention in passing; legacy_source is the writer\'s own record that this
 * task was created FOR that PR and tracks nothing else.
 */
export function trackedPrNum(task: OpenTask): string | null {
  const m = /^pr-auto:(\d{1,6})$/.exec(task.legacySource || '');
  return m ? m[1] : null;
}

/** The doc number this task exists to track, or null. Same legacy_source-only rule. */
export function trackedDocNum(task: OpenTask): string | null {
  const m = /^research-doc:(\d{3,4})$/.exec(task.legacySource || '');
  return m ? m[1] : null;
}

/**
 * Which of these tasks can be closed, and why.
 *
 * Closes ONLY on a state change that happened AFTER the task was created. A
 * condition that was already true at birth (see the doc-rule postmortem above)
 * is not evidence. Absence of evidence closes nothing - every branch defaults to
 * leaving the task open, so a stale repo or an unreachable API costs us a missed
 * close, never a wrong one.
 */
export function planAutoCloses(tasks: OpenTask[], facts: RepoFacts): CloseVerdict[] {
  const out: CloseVerdict[] = [];
  for (const t of tasks) {
    const pr = trackedPrNum(t);
    if (!pr) continue;

    if (facts.mergedPrNums.has(pr)) {
      out.push({
        id: t.id,
        title: t.title,
        reason: `PR #${pr} is merged into main - this task tracked only that PR, which has concluded`,
      });
      continue;
    }
    if (facts.closedUnmergedPrNums.has(pr)) {
      out.push({
        id: t.id,
        title: t.title,
        reason: `PR #${pr} was closed without merging - this task tracked only that PR, which was abandoned`,
      });
    }
    // PR still open, or its state is unknown. Leave the task alone.
  }
  return out;
}

/**
 * Doc-review reminders whose doc was already merged when the reminder was born.
 *
 * NOT a close list. These are reported so Zaal can make ONE decision about a
 * queue that was never actionable ("close all 25" / "keep, I do read these"),
 * instead of a machine deleting them under a proof that does not hold.
 */
export function findVacuousReviewReminders(tasks: OpenTask[], facts: RepoFacts): OpenTask[] {
  return tasks.filter((t) => {
    const doc = trackedDocNum(t);
    return doc !== null && facts.mergedDocNums.has(doc);
  });
}

/**
 * Cap how many get closed per run.
 *
 * Not a performance limit - a blast-radius one. If a bug ever makes this
 * over-match (it already did once), a bad run costs a reviewable handful rather
 * than the whole board, and the cap gives a human a chance to see it in the log
 * before the rest follow.
 */
export const MAX_CLOSES_PER_RUN = 25;

export function capCloses(verdicts: CloseVerdict[]): {
  toClose: CloseVerdict[];
  deferred: number;
} {
  if (verdicts.length <= MAX_CLOSES_PER_RUN) return { toClose: verdicts, deferred: 0 };
  return {
    toClose: verdicts.slice(0, MAX_CLOSES_PER_RUN),
    deferred: verdicts.length - MAX_CLOSES_PER_RUN,
  };
}
