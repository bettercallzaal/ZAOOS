/**
 * SIDEQUESTZ — ZOE's goal-alignment layer (spec 2026-05-14, doc 648).
 *
 * Standalone module. Does NOT import from memory.ts (avoids a circular dep:
 * memory.ts imports buildQuestsBlock from here). Computes its own ZOE_HOME.
 *
 * Storage under ~/.zao/zoe/:
 *   main-quest.md     — the worthy ideal, freeform prose
 *   sidequests.json   — the side-quest pool
 */
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SideQuest, QuestOp, QuestOpResult } from './types';

const ACTIVE_LIMIT = 3;

function questHome(): string {
  return process.env.ZOE_HOME ?? join(homedir(), '.zao', 'zoe');
}
function mainQuestPath(): string {
  return join(questHome(), 'main-quest.md');
}
function sideQuestsPath(): string {
  return join(questHome(), 'sidequests.json');
}
function newQuestId(): string {
  return `sq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}

export async function readMainQuest(): Promise<string> {
  try {
    return (await fs.readFile(mainQuestPath(), 'utf8')).trim();
  } catch {
    return '';
  }
}

export async function writeMainQuest(text: string): Promise<void> {
  await fs.mkdir(questHome(), { recursive: true });
  await fs.writeFile(mainQuestPath(), text.trim() + '\n', 'utf8');
}

export async function readSideQuests(): Promise<SideQuest[]> {
  try {
    const raw = await fs.readFile(sideQuestsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeSideQuests(quests: SideQuest[]): Promise<void> {
  await fs.mkdir(questHome(), { recursive: true });
  await fs.writeFile(sideQuestsPath(), JSON.stringify(quests, null, 2), 'utf8');
}

/**
 * Recompute the active set. Pure — returns a new array, mutates nothing.
 *
 * - done/dropped quests are terminal: status untouched, never active.
 * - pinned quests are always active, but never more than ACTIVE_LIMIT total.
 * - remaining slots (ACTIVE_LIMIT minus pinned count) fill from the
 *   highest-alignment SCORED quests.
 * - every other rankable quest (scored-but-bumped, or unscored) -> parked.
 */
export function recomputeActive(quests: SideQuest[]): SideQuest[] {
  const result = quests.map((q) => ({ ...q }));
  const rankable = result.filter((q) => q.status !== 'done' && q.status !== 'dropped');

  // Pinned quests are always active, but never more than ACTIVE_LIMIT total.
  const pinned = rankable.filter((q) => q.pinned).slice(0, ACTIVE_LIMIT);
  const unpinned = rankable.filter((q) => !q.pinned);
  // highest alignment first; unscored (null) sinks to the bottom
  unpinned.sort((a, b) => (b.alignment ?? -1) - (a.alignment ?? -1));

  const slots = Math.max(0, ACTIVE_LIMIT - pinned.length);
  const activeUnpinned = unpinned.filter((q) => q.alignment !== null).slice(0, slots);
  const activeIds = new Set([...pinned, ...activeUnpinned].map((q) => q.id));

  for (const q of rankable) {
    q.status = activeIds.has(q.id) ? 'active' : 'parked';
  }
  return result;
}

/**
 * Apply a batch of QuestOps. set_main writes main-quest.md; the rest mutate
 * the side-quest pool. After every batch the active set is recomputed and the
 * pool is persisted. Unknown ids are skipped with a console.warn (mirrors
 * applyTaskOps in tasks.ts) - never throws on a bad id.
 */
export async function applyQuestOps(ops: QuestOp[]): Promise<QuestOpResult> {
  const existing = await readSideQuests();
  const byId = new Map(existing.map((q) => [q.id, q]));
  const res: QuestOpResult = {
    main_quest_set: false,
    added: [],
    scored: [],
    completed: [],
    dropped: [],
    pinned: [],
    active: [],
  };

  for (const op of ops) {
    switch (op.op) {
      case 'set_main': {
        await writeMainQuest(op.text);
        res.main_quest_set = true;
        break;
      }
      case 'add': {
        const ts = nowIso();
        const scored = op.quest.alignment != null;
        const q: SideQuest = {
          id: newQuestId(),
          title: op.quest.title,
          description: op.quest.description,
          alignment: op.quest.alignment ?? null,
          alignment_reason: op.quest.alignment_reason ?? '',
          status: 'parked',
          pinned: false,
          created_at: ts,
          updated_at: ts,
          scored_at: scored ? ts : null,
        };
        byId.set(q.id, q);
        res.added.push(q);
        break;
      }
      case 'score': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] score skipped - id not found: ${op.id}`);
          break;
        }
        q.alignment = op.alignment;
        q.alignment_reason = op.reason;
        q.scored_at = nowIso();
        q.updated_at = nowIso();
        res.scored.push(q.id);
        break;
      }
      case 'complete': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] complete skipped - id not found: ${op.id}`);
          break;
        }
        q.status = 'done';
        q.pinned = false;
        q.updated_at = nowIso();
        res.completed.push(q.id);
        break;
      }
      case 'drop': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] drop skipped - id not found: ${op.id}`);
          break;
        }
        q.status = 'dropped';
        q.pinned = false;
        q.updated_at = nowIso();
        res.dropped.push(q.id);
        break;
      }
      case 'pin': {
        const q = byId.get(op.id);
        if (!q) {
          console.warn(`[zoe/sidequests] pin skipped - id not found: ${op.id}`);
          break;
        }
        q.pinned = true;
        q.updated_at = nowIso();
        res.pinned.push(q.id);
        break;
      }
    }
  }

  const recomputed = recomputeActive(Array.from(byId.values()));
  await writeSideQuests(recomputed);
  res.active = recomputed.filter((q) => q.status === 'active');
  return res;
}
