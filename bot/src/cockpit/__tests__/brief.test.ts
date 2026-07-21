// @vitest-environment node
// Tests for formatCockpitBrief() — the pure CockpitBrief → Telegram string formatter.
// No mocks needed: function takes a plain object and returns a string.
import { describe, expect, it } from 'vitest';
import { formatCockpitBrief, formatCockpitBriefCli } from '../brief';
import type { CockpitBrief, CockpitTask, Handoff, Capture, ReviewPR, WriteProposal } from '../types';

// ── builders ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<CockpitTask> = {}): CockpitTask {
  return {
    id: 'task-1',
    title: 'Ship ZAO v2',
    status: 'in_progress',
    priority: 'P1',
    due: null,
    project: 'ZAO',
    legacy_id: null,
    legacy_source: null,
    notes: null,
    next_owner: null,
    updated_at: '2026-07-16T10:00:00Z',
    created_at: '2026-07-16T10:00:00Z',
    ...overrides,
  };
}

function makeCapture(overrides: Partial<Capture> = {}): Capture {
  return {
    taskId: 'cap-1',
    slug: 'inbox:zao-idea',
    title: 'ZAO song-mint idea',
    createdAt: '2026-07-10T00:00:00Z',
    ageDays: 6,
    stale: false,
    ...overrides,
  };
}

function makeHandoff(overrides: Partial<Handoff> = {}): Handoff {
  return {
    taskId: 'ho-1',
    slug: 'zao-whitepapers',
    title: 'Review whitepaper draft',
    note: null,
    createdAt: '2026-07-16T10:00:00Z',
    ...overrides,
  };
}

function makePR(overrides: Partial<ReviewPR> = {}): ReviewPR {
  return {
    repo: 'bettercallzaal/ZAOOS',
    number: 42,
    title: 'feat: new analytics',
    url: 'https://github.com/bettercallzaal/ZAOOS/pull/42',
    draft: false,
    createdAt: '2026-07-16T10:00:00Z',
    ...overrides,
  };
}

function makeProposal(overrides: Partial<WriteProposal> = {}): WriteProposal {
  return {
    taskId: 'task-1',
    title: 'Archive stale task',
    kind: 'archive_stale',
    reason: 'No update in 30 days',
    ...overrides,
  };
}

const EMPTY_BRIEF: CockpitBrief = {
  date: '2026-07-17',
  top3: [],
  needsYou: [],
  needsReview: [],
  handoffs: [],
  captures: [],
  stale: [],
  blocked: [],
  counts: { open: 0, needsYou: 0, needsReview: 0, handoffs: 0, captures: 0, stale: 0, blocked: 0 },
  proposedWrites: [],
};

// ── header + summary line ─────────────────────────────────────────────────────

describe('formatCockpitBrief — header and summary', () => {
  it('starts with "Cockpit - <date>"', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out.split('\n')[0]).toBe('Cockpit - 2026-07-17');
  });

  it('includes all count fields in the summary line', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      counts: { open: 5, needsYou: 2, needsReview: 3, handoffs: 1, captures: 4, stale: 2, blocked: 0 },
    };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('5 open');
    expect(out).toContain('2 need you');
    expect(out).toContain('3 PRs to review');
    expect(out).toContain('1 handoffs');
    expect(out).toContain('4 captures');
    expect(out).toContain('2 stale');
    expect(out).toContain('0 blocked');
  });
});

// ── DO FIRST section ──────────────────────────────────────────────────────────

describe('formatCockpitBrief — DO FIRST section', () => {
  it('omits DO FIRST when top3 is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('DO FIRST');
  });

  it('includes DO FIRST with task title when top3 is non-empty', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, top3: [makeTask()] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('DO FIRST');
    expect(out).toContain('Ship ZAO v2');
  });

  it('formats task line as "- Title [priority]"', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, top3: [makeTask({ priority: 'P0' })] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('- Ship ZAO v2 [P0]');
  });

  it('appends " (due YYYY-MM-DD)" when task has a due date', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      top3: [makeTask({ due: '2026-07-20T00:00:00Z', priority: null })],
    };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('(due 2026-07-20)');
  });

  it('omits priority bracket when priority is null', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, top3: [makeTask({ priority: null })] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('- Ship ZAO v2');
    expect(out).not.toContain('[null]');
    expect(out).not.toContain('[]');
  });
});

// ── IDEA INBOX section ────────────────────────────────────────────────────────

describe('formatCockpitBrief — IDEA INBOX (captures)', () => {
  it('omits IDEA INBOX when captures is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('IDEA INBOX');
  });

  it('includes IDEA INBOX header when captures is non-empty', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, captures: [makeCapture()] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('IDEA INBOX (captures)');
    expect(out).toContain('ZAO song-mint idea');
  });

  it('includes stale count in header when at least one capture is stale', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      captures: [makeCapture({ stale: true, ageDays: 10 }), makeCapture({ stale: false })],
    };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('1 stale, ship or drop');
  });

  it('appends "(STALE Xd)" for stale captures', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      captures: [makeCapture({ stale: true, ageDays: 10 })],
    };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('(STALE 10d)');
  });

  it('omits stale suffix for non-stale captures', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, captures: [makeCapture({ stale: false })] };
    const out = formatCockpitBrief(brief);
    expect(out).not.toContain('STALE');
  });

  it('caps capture list at 10 items', () => {
    const caps = Array.from({ length: 12 }, (_, i) =>
      makeCapture({ taskId: `cap-${i}`, title: `Idea ${i}` }),
    );
    const brief: CockpitBrief = { ...EMPTY_BRIEF, captures: caps };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('Idea 9');
    expect(out).not.toContain('Idea 10');
    expect(out).not.toContain('Idea 11');
  });
});

// ── HANDOFFS section ──────────────────────────────────────────────────────────

describe('formatCockpitBrief — HANDOFFS section', () => {
  it('omits HANDOFFS when handoffs is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('HANDOFFS');
  });

  it('includes handoff slug and title', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, handoffs: [makeHandoff()] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('HANDOFFS (from other terminals)');
    expect(out).toContain('zao-whitepapers: Review whitepaper draft');
  });

  it('includes first line of note when note is present', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      handoffs: [makeHandoff({ note: 'First note line\nSecond line' })],
    };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('First note line');
    expect(out).not.toContain('Second line');
  });

  it('caps handoffs at 8 items', () => {
    const handoffs = Array.from({ length: 10 }, (_, i) =>
      makeHandoff({ taskId: `ho-${i}`, slug: `slug-${i}`, title: `Handoff ${i}` }),
    );
    const brief: CockpitBrief = { ...EMPTY_BRIEF, handoffs };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('Handoff 7');
    expect(out).not.toContain('Handoff 8');
  });
});

// ── NEEDS YOUR REVIEW section ─────────────────────────────────────────────────

describe('formatCockpitBrief — NEEDS YOUR REVIEW section', () => {
  it('omits NEEDS YOUR REVIEW when needsReview is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('NEEDS YOUR REVIEW');
  });

  it('includes PR repo, number, title, and URL', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsReview: [makePR()] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('NEEDS YOUR REVIEW (open PRs)');
    expect(out).toContain('bettercallzaal/ZAOOS #42: feat: new analytics');
    expect(out).toContain('https://github.com/bettercallzaal/ZAOOS/pull/42');
  });

  it('caps review PRs at 10', () => {
    const prs = Array.from({ length: 12 }, (_, i) => makePR({ number: i + 1, title: `PR ${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsReview: prs };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('PR 9');
    expect(out).not.toContain('PR 10');
  });
});

// ── NEEDS YOU section ─────────────────────────────────────────────────────────

describe('formatCockpitBrief — NEEDS YOU section', () => {
  it('omits NEEDS YOU when needsYou is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('NEEDS YOU');
  });

  it('includes task title in NEEDS YOU', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsYou: [makeTask({ title: 'Urgent decision' })] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('NEEDS YOU');
    expect(out).toContain('Urgent decision');
  });

  it('caps NEEDS YOU at 8 tasks', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => makeTask({ id: `t-${i}`, title: `Task ${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsYou: tasks };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('Task 7');
    expect(out).not.toContain('Task 8');
  });
});

// ── STALE and BLOCKED sections ────────────────────────────────────────────────

describe('formatCockpitBrief — STALE section', () => {
  it('omits STALE when stale is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('STALE (review)');
  });

  it('includes stale task title', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, stale: [makeTask({ title: 'Old task' })] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('STALE (review)');
    expect(out).toContain('Old task');
  });

  it('caps stale tasks at 8', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => makeTask({ id: `s-${i}`, title: `Stale ${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, stale: tasks };
    expect(formatCockpitBrief(brief)).not.toContain('Stale 8');
  });
});

describe('formatCockpitBrief — BLOCKED section', () => {
  it('omits BLOCKED when blocked is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('BLOCKED');
  });

  it('includes blocked task title', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, blocked: [makeTask({ title: 'Waiting on legal' })] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('BLOCKED');
    expect(out).toContain('Waiting on legal');
  });

  it('caps blocked tasks at 6', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => makeTask({ id: `b-${i}`, title: `Blocked ${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, blocked: tasks };
    expect(formatCockpitBrief(brief)).not.toContain('Blocked 6');
  });
});

// ── PROPOSED section ──────────────────────────────────────────────────────────

describe('formatCockpitBrief — PROPOSED section', () => {
  it('omits PROPOSED when proposedWrites is empty', () => {
    const out = formatCockpitBrief(EMPTY_BRIEF);
    expect(out).not.toContain('PROPOSED');
  });

  it('includes proposal kind, title, and reason', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, proposedWrites: [makeProposal()] };
    const out = formatCockpitBrief(brief);
    expect(out).toContain('PROPOSED (approve to apply)');
    expect(out).toContain('[archive_stale] Archive stale task - No update in 30 days');
  });

  it('caps proposals at 10', () => {
    const proposals = Array.from({ length: 12 }, (_, i) =>
      makeProposal({ taskId: `t-${i}`, title: `Proposal ${i}` }),
    );
    const brief: CockpitBrief = { ...EMPTY_BRIEF, proposedWrites: proposals };
    expect(formatCockpitBrief(brief)).not.toContain('Proposal 10');
  });
});

// ── formatCockpitBriefCli ─────────────────────────────────────────────────────

describe('formatCockpitBriefCli — concise CLI form', () => {
  it('includes the header and summary counts', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      counts: { open: 148, needsYou: 12, needsReview: 15, handoffs: 4, captures: 2, stale: 8, blocked: 3 },
    };
    const out = formatCockpitBriefCli(brief);
    expect(out.split('\n')[0]).toBe('Cockpit - 2026-07-17');
    expect(out).toContain('148 open');
    expect(out).toContain('15 PRs to review');
  });

  it('includes DO FIRST items', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, top3: [makeTask({ title: 'Merge the PRs' })] };
    const out = formatCockpitBriefCli(brief);
    expect(out).toContain('DO FIRST');
    expect(out).toContain('Merge the PRs');
  });

  it('caps DO FIRST at 3', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask({ id: `t-${i}`, title: `T${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, top3: tasks };
    const out = formatCockpitBriefCli(brief);
    expect(out).toContain('T2');
    expect(out).not.toContain('T3');
  });

  it('shows top-3 review PRs with (+N more) suffix when truncated', () => {
    const prs = Array.from({ length: 5 }, (_, i) => makePR({ number: i + 1, title: `PR ${i}` }));
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsReview: prs, counts: { ...EMPTY_BRIEF.counts, needsReview: 5 } };
    const out = formatCockpitBriefCli(brief);
    expect(out).toContain('PR 0');
    expect(out).toContain('PR 2');
    expect(out).not.toContain('PR 3');
    expect(out).toContain('(+2 more)');
  });

  it('shows top-3 handoffs with (+N more) suffix when truncated', () => {
    const handoffs = Array.from({ length: 5 }, (_, i) =>
      makeHandoff({ taskId: `h-${i}`, slug: `slug-${i}`, title: `Handoff ${i}` }),
    );
    const brief: CockpitBrief = { ...EMPTY_BRIEF, handoffs, counts: { ...EMPTY_BRIEF.counts, handoffs: 5 } };
    const out = formatCockpitBriefCli(brief);
    expect(out).toContain('Handoff 2');
    expect(out).not.toContain('Handoff 3');
    expect(out).toContain('(+2 more)');
  });

  it('omits review URL lines (keeps CLI brief short)', () => {
    const brief: CockpitBrief = { ...EMPTY_BRIEF, needsReview: [makePR()] };
    const out = formatCockpitBriefCli(brief);
    expect(out).not.toContain('https://github.com');
  });

  it('omits handoff note line (keeps CLI brief short)', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      handoffs: [makeHandoff({ note: 'Sensitive note content' })],
    };
    const out = formatCockpitBriefCli(brief);
    expect(out).not.toContain('Sensitive note content');
  });

  it('omits IDEA INBOX, STALE, and PROPOSED sections', () => {
    const brief: CockpitBrief = {
      ...EMPTY_BRIEF,
      captures: [makeCapture()],
      stale: [makeTask({ title: 'Old task' })],
      proposedWrites: [makeProposal()],
    };
    const out = formatCockpitBriefCli(brief);
    expect(out).not.toContain('IDEA INBOX');
    expect(out).not.toContain('STALE');
    expect(out).not.toContain('PROPOSED');
  });
});
