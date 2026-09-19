/**
 * needs-zaal-digest.ts - scheduled "Needs Zaal" digest to Telegram (08:00 and 20:00 ET).
 *
 * Built from:
 * 1. Open tracker cards needing human decision / next_owner = 'me'
 * 2. Lane `## for the grill` sections in `handoffs/status/*.md`
 * 3. Cards due in < 48 hours
 *
 * All interactive decision cards place the RECOMMENDED option as the first inline button.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { fetchCockpitTasks } from '../cockpit/adapters';
import type { CockpitTask } from '../cockpit/types';
import { VERDICTS, type VerdictKey, verdictButtons } from './backlog-grill';
import { refreshVault, vaultFreshnessLine, type VaultFreshness } from './vault-freshness';

export interface LaneGrillItem {
  lane: string;
  text: string;
  recommended?: string;
  cardId?: string;
  sourceFile: string;
}

export interface NeedsZaalTask {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  due?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  recommended?: string;
}

export interface FilteredNeedsZaal {
  dueSoon: NeedsZaalTask[];
  decisions: NeedsZaalTask[];
}

const STRUCK_RE = /^(?:\*\*)?(?:~~|\*\(struck)/;
const ITEM_RE = /^(?:- |\d{1,3}\. )/;
const RECOMMENDATION_RE = /(?:\(|\*\*)?(?:recommended|recommendation|recommends?):\s*([^\n.;()]+?)(?:\)|\*\*)?(?:\.|$)/i;
const CARD_REF_RE = /\b(?:card|task)\s*#?\s*([0-9a-f-]{4,36})\b/i;

/**
 * Parse open items from lane `## for the grill` sections across handoffs/status/*.md.
 */
export function parseLaneGrillSections(
  vaultDir: string,
  readFileFn: (path: string) => string | null = (p) => {
    try {
      return readFileSync(p, 'utf8');
    } catch {
      return null;
    }
  },
  fileListFn?: string[],
): LaneGrillItem[] {
  const statusDir = join(vaultDir, 'handoffs', 'status');
  let files: string[] = [];

  if (fileListFn) {
    files = fileListFn;
  } else {
    try {
      if (!existsSync(statusDir)) return [];
      files = readdirSync(statusDir).filter((f) => f.endsWith('.md'));
    } catch {
      return [];
    }
  }

  const items: LaneGrillItem[] = [];

  for (const file of files) {
    const fullPath = file.startsWith('/') ? file : join(statusDir, file);
    const content = readFileFn(fullPath);
    if (!content) continue;

    const lane = basename(file, '.md');
    const lines = content.split(/\r?\n/);

    let inGrill = false;
    const grillLines: string[] = [];

    for (const ln of lines) {
      if (/^#{1,6}\s/.test(ln)) {
        if (inGrill) break; // Next section ends the grill section
        if (/^##\s+for the grill\b/i.test(ln.trim())) {
          inGrill = true;
          continue;
        }
      }
      if (inGrill) {
        grillLines.push(ln);
      }
    }

    // Parse bullets / numbered items
    for (let i = 0; i < grillLines.length; i++) {
      const line = grillLines[i].trim();
      if (!ITEM_RE.test(line)) continue;

      const rawBullet = line.replace(ITEM_RE, '').trim();
      if (STRUCK_RE.test(rawBullet)) continue;
      if (/^nothing\b/i.test(rawBullet)) continue;

      // Check recommendation
      let recommended: string | undefined;
      const recMatch = RECOMMENDATION_RE.exec(rawBullet);
      if (recMatch && recMatch[1]) {
        recommended = recMatch[1].trim();
      }

      // Check card ID
      let cardId: string | undefined;
      const cardMatch = CARD_REF_RE.exec(rawBullet);
      if (cardMatch && cardMatch[1]) {
        cardId = cardMatch[1].trim();
      }

      items.push({
        lane,
        text: rawBullet,
        recommended,
        cardId,
        sourceFile: `handoffs/status/${lane}.md`,
      });
    }
  }

  return items;
}

function extractRecommendation(notes?: string | null, metadata?: Record<string, unknown> | null, title?: string): string | undefined {
  if (metadata && typeof metadata.recommended === 'string' && metadata.recommended.trim()) {
    return metadata.recommended.trim();
  }
  if (notes) {
    const m = RECOMMENDATION_RE.exec(notes);
    if (m && m[1]) return m[1].trim();
  }
  if (title) {
    const m = RECOMMENDATION_RE.exec(title);
    if (m && m[1]) return m[1].trim();
  }
  return undefined;
}

/**
 * Filter tasks into dueSoon (< 48h) and board decisions.
 */
export function filterNeedsZaalTasks(
  tasks: NeedsZaalTask[],
  now: Date = new Date(),
): FilteredNeedsZaal {
  const nowMs = now.getTime();
  const cutoff48h = nowMs + 48 * 3600 * 1000;
  const overdueGrace = nowMs - 24 * 3600 * 1000; // include recently overdue items

  const dueSoon: NeedsZaalTask[] = [];
  const decisions: NeedsZaalTask[] = [];

  for (const t of tasks) {
    if (t.status === 'done') continue;

    const rec = extractRecommendation(t.notes, t.metadata, t.title);
    const taskWithRec: NeedsZaalTask = rec ? { ...t, recommended: rec } : t;

    // Due soon check (<48h)
    if (t.due) {
      const dueMs = Date.parse(t.due);
      if (Number.isFinite(dueMs) && dueMs <= cutoff48h && dueMs >= overdueGrace) {
        dueSoon.push(taskWithRec);
      }
    }

    // Decisions / needs human check
    const isHumanRoute = t.metadata?.route === 'human';
    const isDecision = t.metadata?.decision === true;
    const isMeOwner = t.metadata?.next_owner === 'me';
    const isDecisionTitle = /\[decision\]|\bgrill\b/i.test(t.title);

    if (isHumanRoute || isDecision || isMeOwner || isDecisionTitle) {
      decisions.push(taskWithRec);
    }
  }

  return { dueSoon, decisions };
}

/**
 * Builds verdict buttons with the RECOMMENDED option as the very first button.
 */
export function buildNeedsZaalButtons(
  taskId: string,
  recommended?: string,
): { text: string; data: string }[][] {
  const d = (key: VerdictKey) => `bg:${key}:${taskId}`;

  if (!recommended) {
    return verdictButtons(taskId);
  }

  const rec = recommended.toLowerCase().trim();
  let recKey: VerdictKey = 'work';
  let recLabel = `★ Work`;

  if (/\b(done|close|closed|approve|yes)\b/i.test(rec)) {
    recKey = 'done';
    recLabel = `★ Done`;
  } else if (/\b(keep|stay|hold)\b/i.test(rec)) {
    recKey = 'keep';
    recLabel = `★ Keep`;
  } else if (/\b(park|defer|shelve|snooze)\b/i.test(rec)) {
    recKey = 'park';
    recLabel = `★ Park`;
  } else {
    recKey = 'work';
    recLabel = `★ ${recommended.slice(0, 16)}`;
  }

  // Row 1: Recommended option first
  const firstRow = [{ text: recLabel, data: d(recKey) }];

  // Row 2 & 3: The other remaining standard verdicts
  const otherVerdicts = VERDICTS.filter((v) => v.key !== recKey);
  const row2 = otherVerdicts.slice(0, 2).map((v) => ({ text: `${v.n} ${v.key[0].toUpperCase() + v.key.slice(1)}`, data: d(v.key) }));
  const row3 = otherVerdicts.slice(2).map((v) => ({ text: `${v.n} ${v.key[0].toUpperCase() + v.key.slice(1)}`, data: d(v.key) }));

  return [firstRow, row2, row3].filter((r) => r.length > 0);
}

/**
 * Format the Needs Zaal Telegram digest.
 */
export function formatNeedsZaalDigest(opts: {
  timeSlot: 'morning' | 'evening';
  dueSoon: NeedsZaalTask[];
  laneAsks: LaneGrillItem[];
  decisions: NeedsZaalTask[];
}): string {
  const slotLabel = opts.timeSlot === 'morning' ? '08:00 ET (Morning)' : '20:00 ET (Evening)';
  const total = opts.dueSoon.length + opts.laneAsks.length + opts.decisions.length;

  if (total === 0) {
    return `📋 **Needs Zaal Digest — ${slotLabel}**\n\n✨ All clear! No items due <48h, no lane grill questions, and no open board decisions.`;
  }

  const lines: string[] = [
    `📋 **Needs Zaal Digest — ${slotLabel}**`,
    `*${total} item${total === 1 ? '' : 's'} needing your eyes or tap:*`,
    '',
  ];

  if (opts.dueSoon.length > 0) {
    lines.push(`🚨 **DUE < 48 HOURS (${opts.dueSoon.length}):**`);
    for (const t of opts.dueSoon) {
      const dueStr = t.due ? new Date(t.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Soon';
      lines.push(`• **${t.title}** (Due: ${dueStr})`);
      if (t.recommended) {
        lines.push(`  👉 Recommended: ${t.recommended}`);
      }
    }
    lines.push('');
  }

  if (opts.laneAsks.length > 0) {
    lines.push(`🏛️ **LANE GRILL QUESTIONS (${opts.laneAsks.length}):**`);
    for (const item of opts.laneAsks) {
      lines.push(`• [**${item.lane}**] ${item.text}`);
      if (item.recommended) {
        lines.push(`  👉 Recommended: ${item.recommended}`);
      }
    }
    lines.push('');
  }

  if (opts.decisions.length > 0) {
    lines.push(`⚡️ **BOARD DECISIONS (${opts.decisions.length}):**`);
    for (const d of opts.decisions) {
      lines.push(`• [card ${d.id.slice(0, 8)}] **${d.title}**`);
      if (d.recommended) {
        lines.push(`  👉 Recommended: ${d.recommended}`);
      }
    }
    lines.push('');
  }

  lines.push(`_Tap inline buttons on the cards below to rule instantly._`);
  return lines.join('\n');
}

/**
 * Execute a scheduled Needs Zaal digest send.
 */
export async function runNeedsZaalDigest(opts: {
  botApi: {
    sendMessage: (chatId: number, text: string, other?: any) => Promise<any>;
  };
  zaalTgId: number;
  timeSlot: 'morning' | 'evening';
  vaultDir?: string;
  now?: Date;
  /** Injectable so tests do not shell out to git. Defaults to the real refresh. */
  refresh?: (dir: string) => Promise<VaultFreshness>;
}): Promise<{ delivered: boolean; dueCount: number; laneCount: number; decisionCount: number; vault: VaultFreshness }> {
  const now = opts.now ?? new Date();
  const vaultDir = opts.vaultDir ?? process.env.VAULT_DIR ?? join(homedir(), 'zao-vault');

  // Pull BEFORE the read. This digest is built from a copy of the vault, and on
  // 2026-09-17 that copy was 64 commits behind with nothing refreshing it. A refresh
  // that fails must not stop the digest; it changes the first line instead.
  let vault: VaultFreshness;
  try {
    vault = await (opts.refresh ?? refreshVault)(vaultDir);
  } catch (err) {
    vault = {
      state: 'UNKNOWN', behind: null, ahead: null, dirty: null, pulled: 0, headCommittedAt: null,
      reason: `the freshness check itself failed (${(err as Error).message})`,
    };
  }

  const laneAsks = parseLaneGrillSections(vaultDir);

  let cockpitTasks: CockpitTask[] = [];
  try {
    cockpitTasks = await fetchCockpitTasks();
  } catch (err) {
    console.error('[zoe/needs-zaal-digest] fetchCockpitTasks failed:', (err as Error).message);
  }

  const adaptedTasks: NeedsZaalTask[] = cockpitTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due: t.due,
    notes: t.notes,
    metadata: t.next_owner ? { next_owner: t.next_owner } : null,
  }));

  const { dueSoon, decisions } = filterNeedsZaalTasks(adaptedTasks, now);

  const digestText = formatNeedsZaalDigest({
    timeSlot: opts.timeSlot,
    dueSoon,
    laneAsks,
    decisions,
  });

  // First line, always: how old is the copy this was built from. Plain text, so it
  // cannot break the Markdown parse below.
  const withAge = `${vaultFreshnessLine(vault)}\n\n${digestText}`;
  await opts.botApi.sendMessage(opts.zaalTgId, withAge, { parse_mode: 'Markdown' });

  const interactiveCandidates = [...decisions, ...dueSoon.filter((t) => !decisions.some((d) => d.id === t.id))].slice(0, 3);

  for (const card of interactiveCandidates) {
    const cardText = `⚡️ **${card.title}**\n${card.notes ? card.notes.slice(0, 140) + '\n' : ''}${card.recommended ? `👉 *Recommended:* ${card.recommended}\n` : ''}Rule with one tap:`;
    const buttons = buildNeedsZaalButtons(card.id, card.recommended);

    await opts.botApi.sendMessage(opts.zaalTgId, cardText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons.map((row) =>
          row.map((btn) => ({ text: btn.text, callback_data: btn.data })),
        ),
      },
    });
  }

  return {
    delivered: true,
    dueCount: dueSoon.length,
    laneCount: laneAsks.length,
    decisionCount: decisions.length,
    vault,
  };
}
