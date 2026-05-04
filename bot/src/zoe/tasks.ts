/**
 * Task queue read/write for ZOE.
 *
 * Stored at ~/.zao/zoe/tasks.json. Operations applied via TaskOp[] returned
 * from concierge replies. ZOE updates its own task state — Zaal can also
 * issue commands via DM patterns ("/done X", "/add task: Y", "/status").
 *
 * Future: mirror to Bonfire as Task nodes when SDK lands.
 */
import type { ZoeTask, TaskOp, TaskStatus } from './types';
import { readTasks, writeTasks } from './memory';

function newTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function applyTaskOps(ops: TaskOp[]): Promise<{ added: ZoeTask[]; updated: ZoeTask[]; completed: string[]; deferred: string[] }> {
  const tasks = await readTasks();
  const byId = new Map(tasks.map((t) => [t.id, t] as [string, ZoeTask]));
  const added: ZoeTask[] = [];
  const updated: ZoeTask[] = [];
  const completed: string[] = [];
  const deferred: string[] = [];

  for (const op of ops) {
    switch (op.op) {
      case 'add': {
        const id = newTaskId();
        const ts = nowIso();
        const task: ZoeTask = { id, created_at: ts, updated_at: ts, ...op.task };
        byId.set(id, task);
        added.push(task);
        break;
      }
      case 'update': {
        const t = byId.get(op.id);
        if (!t) {
          console.warn(`[zoe/tasks] update skipped — id not found: ${op.id}`);
          break;
        }
        const merged = {
          ...t,
          ...op.patch,
          notes: op.patch.notes ? [...t.notes, ...op.patch.notes] : t.notes,
          updated_at: nowIso(),
        } as ZoeTask;
        byId.set(t.id, merged);
        updated.push(merged);
        break;
      }
      case 'complete': {
        const t = byId.get(op.id);
        if (!t) {
          console.warn(`[zoe/tasks] complete skipped — id not found: ${op.id}`);
          break;
        }
        const note = op.outcome ? `outcome: ${op.outcome}` : 'completed';
        const merged: ZoeTask = {
          ...t,
          status: 'completed',
          notes: [...t.notes, `[${nowIso()}] ${note}`],
          updated_at: nowIso(),
        };
        byId.set(t.id, merged);
        completed.push(t.id);
        break;
      }
      case 'defer': {
        const t = byId.get(op.id);
        if (!t) break;
        const merged: ZoeTask = {
          ...t,
          status: 'deferred',
          notes: [...t.notes, `[${nowIso()}] deferred${op.reason ? ` — ${op.reason}` : ''}`],
          updated_at: nowIso(),
        };
        byId.set(t.id, merged);
        deferred.push(t.id);
        break;
      }
    }
  }

  await writeTasks(Array.from(byId.values()));
  return { added, updated, completed, deferred };
}

export async function listOpenTasks(): Promise<ZoeTask[]> {
  const tasks = await readTasks();
  return tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
}

export async function listByStatus(status: TaskStatus): Promise<ZoeTask[]> {
  const tasks = await readTasks();
  return tasks.filter((t) => t.status === status);
}

/**
 * Seed the task queue with the existing pending todos when ZOE first boots.
 * Idempotent — only seeds if queue is empty.
 */
export async function seedInitialTasks(): Promise<{ seeded: number }> {
  const existing = await readTasks();
  if (existing.length > 0) return { seeded: 0 };

  const seed: Array<Omit<ZoeTask, 'id' | 'created_at' | 'updated_at'>> = [
    {
      title: 'Nexus QA + NexusV2 Supabase migration',
      description: 'Per doc 601 task 14 — PR #149 already merged shipping NEXUS admin + 3D portal hub. Issue #150 has the test checklist; ~7 unchecked items. Most critical: NexusV2 zaonexus.vercel.app still uses 200+ hardcoded links. Migrate to Supabase. Plus QA mobile + admin CRUD + API filters + landing page link.',
      status: 'pending',
      priority: 'high',
      source: 'doc-601',
      notes: [],
    },
    {
      title: 'ZAO Protocol Whitepaper rebuild — Chapter 2 onward',
      description: 'Brief at docs/specs/2026-05-04-protocol-whitepaper-rebuild-spec.md. Existing draft 4.5 at research/community/051. 7 chapters: Why ZAO (reuse) + Protocol Architecture + Token Mechanics + Governance + Onchain Music Rails + Build on ZAO + Roadmap. Each chapter sources from Bonfire RECALL.',
      status: 'pending',
      priority: 'high',
      source: 'doc-601',
      notes: [],
    },
    {
      title: 'ZabalSocials site rebuild',
      description: 'Per doc 601 task 16. Personal-socials hub for BetterCallZaal (X, Farcaster, Lens, GitHub, YouTube, Twitch). Distinct from nexus.thezao.com (which is ZAO ecosystem). Spec needed before build.',
      status: 'pending',
      priority: 'med',
      source: 'doc-601',
      notes: [],
    },
    {
      title: 'Farcaster + X ingest pipeline',
      description: 'Per doc 601 task 17. Pull Zaal Farcaster casts via Neynar API + X posts via X archive export. Apply same heuristic filter as ChatGPT triage (keep ZAO-tagged + decisions + threads + writing, throw memes/replies). Generate ingest .md per platform.',
      status: 'pending',
      priority: 'med',
      source: 'doc-601',
      notes: [],
    },
    {
      title: 'Doc 601 Phase 2 — token cutover to bot/src/zoe',
      description: 'After Phase 1 (this scaffold) complete: stop openclaw container (DONE 2026-05-04), move TELEGRAM_BOT_TOKEN to bot/.env, add bot/src/zoe to systemd unit. Test via DM @zaoclaw_bot. Keep openclaw image 30d as backup.',
      status: 'pending',
      priority: 'high',
      source: 'doc-601-phase-2',
      notes: [],
    },
    {
      title: 'Doc 601 Phase 3 — fold Devz bot into Hermes webhook',
      description: 'Replace ZAO Devz bot module with Hermes one-way notifier (PR webhook → Hermes → Devz channel post). Stop running ZAO Devz bot module on VPS.',
      status: 'pending',
      priority: 'low',
      source: 'doc-601-phase-3',
      notes: [],
    },
    {
      title: 'Doc 601 Phase 4 — bot/src/zoe/scheduler replaces zoe-learning-pings cron',
      description: 'Scheduler module on bot/src/zoe handles hourly Devz tip + 5am brief + 9pm reflection. Stop python cron at ~/zoe-learning-pings/run.sh.',
      status: 'pending',
      priority: 'low',
      source: 'doc-601-phase-4',
      notes: [],
    },
    {
      title: 'Email Joshua.eth re Bonfire SDK key + MCP roadmap',
      description: '8 questions parked in doc 581 + 590. Critical: BONFIRE_API_KEY + BONFIRE_ID + BONFIRE_AGENT_ID. MCP server timeline. Genesis tier post-trial pricing. ERC-8004 alignment. OWL export completeness. Programmatic graph wipe. Idempotency on kengrams.batch. Dry-run mode.',
      status: 'pending',
      priority: 'high',
      source: 'doc-581',
      notes: [],
    },
  ];

  const tasks: ZoeTask[] = seed.map((s) => ({
    id: newTaskId(),
    created_at: nowIso(),
    updated_at: nowIso(),
    ...s,
  }));

  await writeTasks(tasks);
  return { seeded: tasks.length };
}
