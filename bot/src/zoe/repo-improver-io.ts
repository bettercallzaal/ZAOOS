/**
 * Repo Improver Scout: I/O wiring (default deps + the tick).
 *
 * Keeps the orchestration in repo-improver.ts pure/injected; this file supplies
 * the real cheap-model call (callCapFallback - OpenRouter, off the Claude cap),
 * git clone context gathering, Supabase persistence, and the Hermes dispatch.
 */

import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { db } from '../supabase';
import { ZOE_PATHS } from './memory';
import { callCapFallback } from './models/router';
import { dispatchHermesRun } from '../hermes/runner';
import type { HermesRepoTarget } from '../hermes/types';
import {
  SCOUT_REPOS,
  nextRepoIndex,
  runRepoImproverScout,
  reviewProposedImprovements,
  type ScoutRepo,
  type ScoutDeps,
  type ReviewDeps,
  type ImprovementRow,
  type ImprovementStatus,
} from './repo-improver';

const execFile = promisify(execFileCb);
const CURSOR_PATH = join(ZOE_PATHS.home, 'repo-improver-cursor');

async function readCursor(): Promise<number> {
  try {
    const raw = await fs.readFile(CURSOR_PATH, 'utf8');
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? n : -1;
  } catch {
    return -1;
  }
}

async function writeCursor(index: number): Promise<void> {
  try {
    await fs.mkdir(ZOE_PATHS.home, { recursive: true });
    await fs.writeFile(CURSOR_PATH, String(index), 'utf8');
  } catch {
    // best-effort; a lost cursor just re-audits from the top next cycle
  }
}

/** Shallow-clone a repo and summarize it into an audit context string. */
async function gatherContext(repo: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'zoe-scout-'));
  try {
    await execFile('git', ['clone', '--depth', '1', `https://github.com/${repo}.git`, dir], {
      timeout: 60_000,
    });
    const parts: string[] = [];
    for (const name of ['README.md', 'package.json']) {
      try {
        const body = await fs.readFile(join(dir, name), 'utf8');
        parts.push(`=== ${name} ===\n${body.slice(0, 4000)}`);
      } catch {
        // file absent - fine
      }
    }
    try {
      const { stdout } = await execFile('git', ['-C', dir, 'ls-files'], { timeout: 20_000 });
      parts.push(`=== file tree (first 200) ===\n${stdout.split('\n').slice(0, 200).join('\n')}`);
    } catch {
      // ignore
    }
    return parts.join('\n\n');
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

function defaultScoutDeps(): ScoutDeps {
  return {
    pickNextRepo: async (): Promise<ScoutRepo> => {
      const idx = nextRepoIndex(SCOUT_REPOS.length, await readCursor());
      await writeCursor(idx);
      return SCOUT_REPOS[idx];
    },
    gatherContext,
    audit: async (systemPrompt, userPrompt) => {
      const { result } = await callCapFallback(systemPrompt, userPrompt);
      return { text: result.text, model: result.model };
    },
    saveProposed: async (r) => {
      const { error } = await db().from('repo_improvements').insert([
        {
          repo: r.repo,
          hermes_target: r.hermes_target,
          area: r.area,
          problem: r.problem,
          proposed_fix: r.proposed_fix,
          files: r.files,
          risk: r.risk,
          confidence: r.confidence,
          model: r.model,
          status: 'proposed' as ImprovementStatus,
        },
      ]);
      if (error) console.error('[repo-improver] saveProposed failed:', error.message);
    },
  };
}

function defaultReviewDeps(log: (m: string) => Promise<void>): ReviewDeps {
  return {
    fetchProposed: async (): Promise<ImprovementRow[]> => {
      const { data, error } = await db()
        .from('repo_improvements')
        .select('*')
        .eq('status', 'proposed')
        .order('created_at', { ascending: true })
        .limit(10);
      if (error) {
        console.error('[repo-improver] fetchProposed failed:', error.message);
        return [];
      }
      return (data ?? []) as ImprovementRow[];
    },
    judge: async (systemPrompt, userPrompt) => {
      const { result } = await callCapFallback(systemPrompt, userPrompt);
      return result.text;
    },
    markStatus: async (id, status, extra) => {
      await db()
        .from('repo_improvements')
        .update({
          status,
          ...(extra?.zoe_reasoning !== undefined ? { zoe_reasoning: extra.zoe_reasoning } : {}),
          ...(extra?.pr_url !== undefined ? { pr_url: extra.pr_url } : {}),
          ...(extra?.run_id !== undefined ? { run_id: extra.run_id } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    },
    dispatchFix: async ({ issueText, targetRepo }) => {
      const res = await dispatchHermesRun({
        triggered_by_telegram_id: 0,
        triggered_in_chat_id: 0,
        issue_text: issueText,
        target_repo: targetRepo as HermesRepoTarget,
      });
      if (res.kind === 'ready') {
        return { kind: 'ready', prUrl: res.run.pr_url, runId: res.run.id };
      }
      return { kind: res.kind, prUrl: null, runId: res.run.id, reason: res.reason };
    },
    log,
  };
}

/**
 * One repo-improver tick: scout the next repo (cheap), then have ZOE review all
 * proposed findings (its own gate) and route approved fixes. `log` posts status
 * to the group (not a question) and is the durable learning trail.
 */
export async function runRepoImproverTick(log: (m: string) => Promise<void>): Promise<void> {
  try {
    const scoutStatus = await runRepoImproverScout(defaultScoutDeps());
    console.log(`[repo-improver] scout: ${scoutStatus}`);
    const reviewStatus = await reviewProposedImprovements(defaultReviewDeps(log));
    console.log(`[repo-improver] review: ${reviewStatus}`);
  } catch (err) {
    console.error('[repo-improver] tick failed:', (err as Error)?.message ?? err);
  }
}
