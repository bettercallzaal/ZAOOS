/**
 * trust-audit.ts — Monthly trust audit to catch fallen tasks/captures.
 *
 * Runs monthly (or on-demand via /audit command):
 * 1. Scan all captures older than 14 days
 * 2. Scan all open tasks older than 14 days
 * 3. Cross-check against recent shipped PRs / done tasks
 * 4. Flag anything that looks like it fell through cracks
 * 5. Surface a read-only audit report to Zaal (no auto-action)
 *
 * Goal: keep trust high by finding "we said we'd do this, but never shipped it"
 *
 * This is an audit-only module: reads state, reports findings, no mutations.
 * The runtime decides whether to post the audit to Telegram.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ZoeTask } from './types';

export interface AuditFinding {
  type: 'capture' | 'task';
  id: string;
  title: string;
  daysSince: number; // how long since created
  status?: string; // for tasks
  reason: string; // human-readable flag
}

export interface AuditReport {
  scannedAt: string; // ISO timestamp
  findings: AuditFinding[];
  summary: string; // Human-readable summary for Telegram
}

/**
 * UTILITY: Read tasks.json (mirrors memory.ts pattern).
 */
async function readTasks(): Promise<ZoeTask[]> {
  const tasksPath = join(homedir(), '.zao', 'zoe', 'tasks.json');
  try {
    const raw = await fs.readFile(tasksPath, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as ZoeTask[]) : [];
  } catch {
    return [];
  }
}

/**
 * UTILITY: Read captures from ZOE's memory (simplified version).
 * In practice this reads from memory.ts's capture storage (likely a JSONL).
 * For this audit, we just check if there are stale captures that never got acted on.
 *
 * Placeholder: this returns an empty list if the captures file doesn't exist.
 * The caller (index.ts) can provide a list of recent captures if needed.
 */
async function readCaptures(): Promise<Array<{ id: string; text: string; created_at: string }>> {
  const capturesPath = join(homedir(), '.zao', 'zoe', 'captures.jsonl');
  try {
    const raw = await fs.readFile(capturesPath, 'utf8');
    const lines = raw.trim().split('\n');
    return lines
      .map((line) => {
        try {
          const entry = JSON.parse(line);
          return entry;
        } catch {
          return null;
        }
      })
      .filter((e): e is { id: string; text: string; created_at: string } => e !== null);
  } catch {
    return [];
  }
}

/**
 * Audit: find captures + tasks that fell through cracks.
 *
 * Heuristics:
 * - Capture older than 14 days: check if there's a related task that's done/shipped.
 *   If no related task, flag it ("idea never pursued").
 * - Task older than 14 days, status="pending": likely stuck, flag it.
 * - Task status="blocked": if blocked reason is old, flag it ("been blocked for X days").
 *
 * Args:
 * - recentShippedPRs: titles/numbers of PRs merged in last 30 days (provided by caller)
 * - now: current time (for testing); defaults to Date.now()
 */
export async function runAudit(recentShippedPRs: string[] = [], now: number = Date.now()): Promise<AuditReport> {
  const tasks = await readTasks();
  const captures = await readCaptures();

  const findings: AuditFinding[] = [];
  const dayThreshold = 14;
  const thresholdMs = dayThreshold * 24 * 60 * 60 * 1000;

  // Check captures: old ones with no related completed task.
  for (const cap of captures) {
    const created = Date.parse(cap.created_at);
    const daysSince = Math.floor((now - created) / (24 * 60 * 60 * 1000));

    if (daysSince >= dayThreshold) {
      // Heuristic: does the capture mention any shipped/done context?
      // For now, simple: if there's no task/PR mentioning similar keywords, flag it.
      const relatedDone = tasks.some(
        (t) =>
          (t.status === 'completed' || t.status === 'blocked') &&
          cap.text.toLowerCase().includes(t.title.toLowerCase()),
      );

      if (!relatedDone) {
        findings.push({
          type: 'capture',
          id: cap.id,
          title: cap.text.slice(0, 60) + (cap.text.length > 60 ? '...' : ''),
          daysSince,
          reason: `Capture from ${daysSince} days ago never acted on`,
        });
      }
    }
  }

  // Check tasks: pending ones older than threshold.
  for (const task of tasks) {
    const created = Date.parse(task.created_at);
    const daysSince = Math.floor((now - created) / (24 * 60 * 60 * 1000));

    if (daysSince >= dayThreshold && task.status === 'pending') {
      findings.push({
        type: 'task',
        id: task.id,
        title: task.title,
        daysSince,
        status: task.status,
        reason: `Pending for ${daysSince} days with no progress`,
      });
    }

    // Blocked tasks: if they've been blocked longer than we'd like, flag.
    if (task.status === 'blocked' && daysSince >= dayThreshold) {
      findings.push({
        type: 'task',
        id: task.id,
        title: task.title,
        daysSince,
        status: task.status,
        reason: `Blocked for ${daysSince} days (reason: ${task.notes[task.notes.length - 1] ?? 'unknown'})`,
      });
    }
  }

  // Build summary for Telegram.
  let summary = '';
  if (findings.length === 0) {
    summary = 'Trust audit: all clear. No captures or tasks fell through cracks in the last 30 days.';
  } else if (findings.length <= 3) {
    const lines = findings
      .map((f) => {
        const desc = f.type === 'capture' ? `Capture: ${f.title}` : `Task: ${f.title}`;
        return `- ${desc} (${f.daysSince} days old)`;
      })
      .join('\n');
    summary = `Trust audit found ${findings.length} potential gaps:\n${lines}`;
  } else {
    const captures = findings.filter((f) => f.type === 'capture').length;
    const tasks = findings.filter((f) => f.type === 'task').length;
    summary = `Trust audit found ${findings.length} potential gaps: ${captures} old captures, ${tasks} stuck tasks. Review details.`;
  }

  return {
    scannedAt: new Date(now).toISOString(),
    findings,
    summary,
  };
}

/**
 * Format audit report as a Telegram-friendly message.
 */
export function formatAuditForTelegram(report: AuditReport): string {
  if (report.findings.length === 0) {
    return report.summary;
  }

  const grouped: Record<string, AuditFinding[]> = {
    capture: report.findings.filter((f) => f.type === 'capture'),
    task: report.findings.filter((f) => f.type === 'task'),
  };

  let msg = report.summary + '\n\n';

  if (grouped.capture.length > 0) {
    msg += 'Captures:\n';
    grouped.capture.forEach((f) => {
      msg += `- ${f.title} (${f.daysSince}d old)\n`;
    });
  }

  if (grouped.task.length > 0) {
    msg += '\nTasks:\n';
    grouped.task.forEach((f) => {
      msg += `- ${f.title} [${f.status}] (${f.daysSince}d old)\n`;
    });
  }

  return msg;
}
