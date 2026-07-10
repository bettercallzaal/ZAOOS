/**
 * Personal Operator Cockpit - shared types.
 *
 * The cockpit is a Claude Agent SDK harness (built in slices) that wraps ZOE's
 * existing tracker adapters and adds: a structured cockpit brief, a weekly
 * stale-task review, gated writes (owner-axis / tags / archive), and an
 * artifact store. Design: research/agents/997 + 999, gaps from doc 983.
 *
 * This file is the fixed OUTPUT SCHEMA (per the How I AI episode: specify the
 * exact shape inside the harness, not in the prompt).
 */

import type { NextOwner } from '../zoe/task-classifier';

/** A tracker task as the cockpit needs it (superset of TeamTask - carries id + timestamps for stale-detection + writes). */
export interface CockpitTask {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due: string | null;
  project: string | null;
  legacy_id: string | null;
  next_owner: NextOwner | null;
  updated_at: string | null;
  created_at: string | null;
}

/** Cockpit run modes = the constraint flags (episode: "investigate-only" enforced by the harness, not the prompt). */
export type CockpitMode =
  | 'brief' // read-only: assemble + emit the cockpit brief, no writes
  | 'triage' // read + PROPOSE writes (tags/owner-axis/archive), still no apply
  | 'apply'; // execute an already-approved set of write proposals

/** A single gated write the cockpit wants to make - never applied until approved. */
export interface WriteProposal {
  taskId: string;
  title: string;
  kind: 'set_owner' | 'add_tags' | 'archive_stale';
  /** For set_owner. */
  nextOwner?: NextOwner;
  /** For add_tags. */
  tags?: string[];
  /** Why the cockpit proposes this - shown to Zaal at approval time. */
  reason: string;
}

/** An open PR across Zaal's repos that is waiting on his review/merge. */
export interface ReviewPR {
  repo: string; // "owner/name"
  number: number;
  title: string;
  url: string;
  draft: boolean;
  createdAt: string | null;
}

/** The fixed cockpit brief shape. */
export interface CockpitBrief {
  date: string; // ISO date the brief was built for
  /** Top 3 by due-date then priority - "what to do first". */
  top3: CockpitTask[];
  /** Tasks routed to Zaal (next_owner = 'me', or undated P0/P1) - "what needs YOU". */
  needsYou: CockpitTask[];
  /** Open PRs across Zaal's repos awaiting his review/merge - "this stuff to see". */
  needsReview: ReviewPR[];
  /** Stale: undated P0/P1s, or no update in >= STALE_DAYS. */
  stale: CockpitTask[];
  /** Blocked (next_owner = 'blocked'). */
  blocked: CockpitTask[];
  /** Counts for the one-line summary. */
  counts: { open: number; needsYou: number; needsReview: number; stale: number; blocked: number };
  /** Gated write proposals (empty in 'brief' mode; populated in 'triage'). */
  proposedWrites: WriteProposal[];
}
