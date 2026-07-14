/**
 * Pending decisions classifier for the morning brief.
 *
 * Surfaces things waiting on Zaal's decision/action:
 * - PRs awaiting his merge/approval
 * - Tasks in review queue / assigned to him
 * - Blocked tasks
 * - Items with open questions
 *
 * Returns a ranked list (urgency first): deadlined PRs, blocked tasks, review-queue tasks.
 * Used by brief.ts to populate the PENDING DECISIONS section.
 */

export interface PendingDecision {
  title: string;
  kind: 'pr-review' | 'task-blocked' | 'task-review' | 'question';
  urgency: 'critical' | 'high' | 'medium'; // critical=dated/overdue, high=unreviewed PR/blocked, medium=queued
  dueDate?: string;
  context?: string; // one-liner context
}

/**
 * Extract PRs awaiting Zaal's action (review/merge) and rank by deadline.
 * Heuristic: PRs without "ready-to-merge" or "approved" labels are waiting.
 * If we can infer a deadline from the PR title/body, include it.
 */
export function extractPRDecisions(
  prs: Array<{ number: number; title: string; labels?: string[] }>,
): PendingDecision[] {
  return prs
    .filter((pr) => {
      const labels = (pr.labels ?? []).map((l) => l.toLowerCase());
      // Skip if already merged/closed/approved
      return !labels.some((l) => l.includes('approved') || l.includes('ready-to-merge'));
    })
    .map((pr) => {
      // Try to infer urgency from title patterns: [URGENT], #<number>, dated labels
      const isUrgent = /\[URGENT\]|\[CRITICAL\]|#\d+/.test(pr.title);
      return {
        title: `PR #${pr.number}: ${pr.title}`,
        kind: 'pr-review' as const,
        urgency: isUrgent ? 'high' : 'medium',
        context: `awaiting merge`,
      };
    });
}

/**
 * Extract team tasks that need Zaal's decision/action.
 * Categories:
 * - Blocked: status === 'blocked' or 'waiting'
 * - Review queue: status === 'in_review' or next_owner === 'me'
 * - Overdue: due date < today
 */
export function extractTaskDecisions(
  tasks: Array<{
    title: string;
    status: string;
    due?: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
): PendingDecision[] {
  const decisions: PendingDecision[] = [];

  for (const task of tasks) {
    const status = (task.status ?? '').toLowerCase();
    const due = task.due;
    const metadata = task.metadata ?? {};
    const nextOwner = (metadata.next_owner ?? '') as string;

    // Blocked tasks = critical
    if (status === 'blocked' || status === 'waiting') {
      const isOverdue = due && due < new Date().toISOString().slice(0, 10);
      decisions.push({
        title: task.title,
        kind: 'task-blocked',
        urgency: isOverdue ? 'critical' : 'high',
        dueDate: due ?? undefined,
        context: `blocked`,
      });
    }
    // Tasks in review or assigned to Zaal
    else if (status === 'in_review' || nextOwner === 'me') {
      const isOverdue = due && due < new Date().toISOString().slice(0, 10);
      decisions.push({
        title: task.title,
        kind: nextOwner === 'me' ? 'task-review' : 'task-review',
        urgency: isOverdue ? 'critical' : 'high',
        dueDate: due ?? undefined,
        context: `needs your decision`,
      });
    }
  }

  return decisions;
}

/**
 * Format pending decisions as a brief section string.
 * Rank by: critical > high > medium. Within each tier, by date.
 * Limit to top 5 for the brief (keep it tight).
 */
export function formatPendingDecisions(
  decisions: PendingDecision[],
): string | null {
  if (decisions.length === 0) return null;

  const urgencyRank = (u: string): number => {
    switch (u) {
      case 'critical': return 0;
      case 'high': return 1;
      case 'medium': return 2;
      default: return 3;
    }
  };

  const sorted = [...decisions]
    .sort((a, b) => {
      const ua = urgencyRank(a.urgency);
      const ub = urgencyRank(b.urgency);
      if (ua !== ub) return ua - ub;
      // Within same urgency, dated items first
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDate - bDate;
    })
    .slice(0, 5); // Top 5 only for the brief

  const lines = sorted.map((d) => {
    const urg = d.urgency === 'critical' ? '[!] ' : '';
    const due = d.dueDate ? ` (due ${d.dueDate})` : '';
    const ctx = d.context ? ` - ${d.context}` : '';
    return `- ${urg}${d.title}${due}${ctx}`;
  });

  return lines.join('\n');
}

/**
 * Gather all pending decisions from PRs and tasks. Returns null if no decisions.
 * Used by brief.ts to populate the PENDING DECISIONS section.
 */
export function gatherPendingDecisions(opts: {
  openPrs: Array<{ number: number; title: string; labels?: string[] }>;
  teamTasks: Array<{
    title: string;
    status: string;
    due?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
}): string | null {
  const prDecisions = extractPRDecisions(opts.openPrs);
  const taskDecisions = extractTaskDecisions(opts.teamTasks);
  const allDecisions = [...prDecisions, ...taskDecisions];

  return formatPendingDecisions(allDecisions);
}
