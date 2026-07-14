/**
 * Morning brief — runs daily at 5am EST (09:00 UTC).
 *
 * Replaces ~/bin/morning-brief.sh on VPS. Generates a contextual briefing
 * via Claude CLI using current task queue + recent captures + git activity
 * + open PRs. Posts to Zaal's DM.
 *
 * Output format (matches the existing morning brief screenshot Zaal liked):
 *   Morning brief - Mon May 04 5am
 *   TOP PRIORITIES (N P0, M P1)
 *   - P0/P1 list
 *   LAST 24H COMMITS
 *   - list
 *   OPEN PRS
 *   - list
 *   portal.zaoos.com/todos - brain dump
 */
import { callClaudeCli } from '../hermes/claude-cli';
import { listOpenTasks } from './tasks';
import { getOpenTeamTasks, summarizeTeamForBrief, zaalFocusForBrief } from './team-tracker';
import { fleetConsensus } from './fleet-health';
import { graphTopicAgeDays } from './recall';
import { getCalendarEvents, formatEventForBrief, formatTodayTomorrowEvents } from './calendar';
import { gatherPendingDecisions } from './pending-decisions';
import { execSync } from 'node:child_process';

const BRIEF_SYSTEM_PROMPT = `You are ZOE writing Zaal's daily morning brief at 5am EST.

VOICE: Year-of-the-ZABAL — clear, simple, spartan, active voice. No emojis, no em dashes, no marketing. Match the existing brief format exactly.

OUTPUT FORMAT (exact structure):

Morning brief - {Day} {Mon DD} 5am

PENDING DECISIONS
- PRs awaiting merge, tasks in review/blocked, ranked by urgency. Critical (due/overdue) first. Skip entirely if none.

CALENDAR
- Today and Tomorrow events. Skip entire section if no events in next 2 days.

TOP PRIORITIES ({P0 count} P0, {P1 count} P1)
- P0/P1 priority items, one per line. Group by priority.

LAST 24H COMMITS
- List of commit subjects from last 24h. (none) if nothing.

OPEN PRS
- List of open PRs by number + title.

FOCUS
- Lead with this. The top 3 tasks by deadline and how many need Zaal's call. This is the "what needs me today" answer. Skip entirely if focus is (none dated).

TEAM
- One line: the team board summary (open count, overdue, top items). Skip this section entirely if team is unavailable.

FLEET
- One line: fleet consensus (count of active units, names of any down). Also include ZOL status (last cast freshness). Skip this section entirely if fleet is unavailable.

INBOX
- {N} unread in zoe-zao@agentmail.to. First 3 subjects: ... (skip line entirely if inbox=null)
- Reminder: run /inbox in any Claude session to research the queue.

portal.zaoos.com/todos - brain dump

Output the brief in plaintext. NO markdown headers, NO emojis, NO pleasantries.`;

interface BriefContext {
  today_iso: string;
  open_tasks: Array<{ priority: string; title: string }>;
  commits_24h: string[];
  cross_repo_24h: string[];
  open_prs: Array<{ number: number; title: string }>;
  inbox: { unreadCount: number; recentSubjects: string[] } | null;
  team: string | null;
  focus: string | null;
  fleet: string | null;
  zol: string | null;
  upcomingEvents: Array<{ title: string; start: string; location?: string }>;
  pendingDecisions: string | null;
  todayTomorrowEvents: string | null;
}

const AGENTMAIL_INBOX = 'zoe-zao@agentmail.to';

interface AgentMailMessage {
  from?: string;
  subject?: string;
  labels?: string[];
}

interface AgentMailFetchResult {
  unreadCount: number;
  recentSubjects: string[];
}

/**
 * Check ZOL's liveness by querying Bonfire for recent "zol-cast" episodes.
 * Returns a one-line status like "ZOL: last cast 2h ago" or "ZOL: no recent cast (check it)".
 * Best-effort; returns null if Bonfire is unconfigured or query fails gracefully.
 */
async function checkZOLStatus(): Promise<string | null> {
  try {
    const ageDays = await graphTopicAgeDays('zol-cast', Date.now());
    if (ageDays === null) {
      // Unconfigured or no hits
      return 'ZOL: (out of band - check separately)';
    }
    if (ageDays === 0) {
      return 'ZOL: cast today';
    }
    if (ageDays < 1) {
      const hours = Math.round(ageDays * 24);
      return `ZOL: last cast ${hours}h ago`;
    }
    if (ageDays === 1) {
      return 'ZOL: last cast 1 day ago';
    }
    // More than 1 day stale - flag it
    return `ZOL: no cast in ${ageDays} days (check it)`;
  } catch {
    // Silent failure - Bonfire query errors don't break the brief
    return null;
  }
}

async function fetchInboxSnapshot(): Promise<AgentMailFetchResult | null> {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.agentmail.to/v0/inboxes/${AGENTMAIL_INBOX}/messages?limit=50`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[zoe/brief] agentmail fetch non-ok', res.status);
      return null;
    }
    const body = (await res.json()) as { messages?: AgentMailMessage[] } | AgentMailMessage[];
    const messages = Array.isArray(body) ? body : (body.messages ?? []);
    // Whitelist: only count messages that trace back to Zaal (direct or forwarded).
    const fromZaal = messages.filter((m) => {
      const f = (m.from ?? '').toLowerCase();
      // Direct or forwarded - the inbox skill checks Resent-From / X-Forwarded-For at the
      // full-message endpoint, but for the count we approximate with the displayed From.
      return f.includes('zaalp99@gmail.com') || f.includes('zaal panthaki');
    });
    const unread = fromZaal.filter((m) => (m.labels ?? []).includes('unread'));
    return {
      unreadCount: unread.length,
      recentSubjects: unread
        .slice(0, 3)
        .map((m) => (m.subject ?? '(no subject)').slice(0, 70)),
    };
  } catch (err) {
    console.error('[zoe/brief] agentmail fetch failed:', (err as Error).message);
    return null;
  }
}

function todayLabel(): { day: string; date: string } {
  const d = new Date();
  const tz = 'America/New_York'; // Zaal is EST/EDT; VPS runs UTC
  const day = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz });
  return { day, date };
}

async function loadBriefContext(repoDir: string): Promise<BriefContext> {
  const tasks = await listOpenTasks();
  let commits24h: string[] = [];
  try {
    const log = execSync(`git -C ${JSON.stringify(repoDir)} log --since="24 hours ago" --no-merges --pretty=format:"%s" 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    commits24h = log.split('\n').filter((l) => l.trim()).slice(0, 15);
  } catch {
    commits24h = [];
  }

  let prs: Array<{ number: number; title: string }> = [];
  try {
    const json = execSync('gh pr list --repo bettercallzaal/ZAOOS --state open --limit 10 --json number,title', {
      encoding: 'utf8',
      timeout: 8000,
    });
    prs = JSON.parse(json) as Array<{ number: number; title: string }>;
  } catch (err) {
    console.error('[zoe/brief] gh pr list failed:', (err as Error).message);
    prs = [];
  }

  // Cross-repo activity: what Zaal shipped across ALL his repos in the last day,
  // not just the ZAOOS clone on this box. gh is authed as bettercallzaal.
  let crossRepo24h: string[] = [];
  try {
    const json = execSync(
      'gh search commits --author=bettercallzaal --sort=committer-date --order=desc --limit 20 --json repository,commit',
      { encoding: 'utf8', timeout: 12000 },
    );
    const rows = JSON.parse(json) as Array<{
      repository?: { name?: string; nameWithOwner?: string };
      commit?: { message?: string };
    }>;
    crossRepo24h = rows
      .map((r) => {
        const repo = r.repository?.name ?? r.repository?.nameWithOwner ?? 'repo';
        const msg = (r.commit?.message ?? '').split('\n')[0];
        return msg ? `${repo}: ${msg}` : '';
      })
      .filter(Boolean)
      .slice(0, 15);
  } catch (err) {
    console.error('[zoe/brief] gh search commits failed:', (err as Error).message);
    crossRepo24h = [];
  }

  const inbox = await fetchInboxSnapshot();

  // Team board state (cowork tracker). Best-effort; null if unconfigured/unreachable.
  // Doc 983: also compute the judgment-routing focus (top-3 by deadline + how many
  // tasks are waiting on Zaal's call) from the same fetch.
  let team: string | null = null;
  let focus: string | null = null;
  try {
    const teamTasks = await getOpenTeamTasks();
    team = summarizeTeamForBrief(teamTasks);
    focus = zaalFocusForBrief(teamTasks);
  } catch {
    team = null;
    focus = null;
  }

  // Fleet health — proactive consensus + ZOL liveness. Best-effort; gracefully degrade.
  let fleet: string | null = null;
  let zol: string | null = null;
  try {
    fleet = await fleetConsensus();
  } catch {
    fleet = null;
  }
  try {
    zol = await checkZOLStatus();
  } catch {
    zol = null;
  }

  // Upcoming calendar events — next 7 days. Best-effort; gracefully degrade.
  let upcomingEvents: Array<{ title: string; start: string; location?: string }> = [];
  let todayTomorrowEvents: string | null = null;
  try {
    const events = await getCalendarEvents(7); // 7-day lookahead for the brief
    upcomingEvents = events.map((e) => ({
      title: e.title,
      start: e.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      location: e.location,
    }));
    // Format Today/Tomorrow separately for the brief
    todayTomorrowEvents = formatTodayTomorrowEvents(events);
  } catch {
    upcomingEvents = [];
    todayTomorrowEvents = null;
  }

  // Pending decisions — PRs awaiting merge, tasks in review/blocked. Best-effort.
  let pendingDecisions: string | null = null;
  try {
    const teamTasks = await getOpenTeamTasks();
    // Convert team tasks to the shape expected by gatherPendingDecisions
    const taskData = teamTasks.map((t) => ({
      title: t.title,
      status: t.status,
      due: t.due,
      metadata: t.metadata,
    }));
    pendingDecisions = gatherPendingDecisions({
      openPrs: prs,
      teamTasks: taskData,
    });
  } catch {
    pendingDecisions = null;
  }

  return {
    today_iso: new Date().toISOString().slice(0, 10),
    open_tasks: tasks.map((t) => ({ priority: t.priority, title: t.title })),
    commits_24h: commits24h,
    cross_repo_24h: crossRepo24h,
    open_prs: prs,
    inbox,
    team,
    focus,
    fleet,
    zol,
    upcomingEvents,
    pendingDecisions,
    todayTomorrowEvents,
  };
}

export async function generateMorningBrief(opts: { repoDir: string; model?: string }): Promise<string> {
  const ctx = await loadBriefContext(opts.repoDir);
  const { day, date } = todayLabel();

  const inboxLine = ctx.inbox
    ? ctx.inbox.unreadCount === 0
      ? 'INBOX: zero unread - skip the INBOX section'
      : `INBOX: ${ctx.inbox.unreadCount} unread. Recent subjects: ${ctx.inbox.recentSubjects.join(' | ')}`
    : 'INBOX: (api unavailable - skip the INBOX section)';

  const pendingDecisionsLine = ctx.pendingDecisions
    ? `PENDING DECISIONS:\n${ctx.pendingDecisions}`
    : 'PENDING DECISIONS: (none - skip the PENDING DECISIONS section)';

  const calendarLine = ctx.todayTomorrowEvents
    ? `CALENDAR:\n${ctx.todayTomorrowEvents}`
    : 'CALENDAR: (no events today/tomorrow - skip the CALENDAR section)';

  const userPrompt = `Generate the morning brief for ${day} ${date}.

CONTEXT:
- Pending decisions (PRs, blocked/review tasks): ${pendingDecisionsLine}
- Calendar (today + tomorrow): ${calendarLine}
- Open tasks: ${JSON.stringify(ctx.open_tasks, null, 2)}
- Last 24h commits (ZAOOS): ${ctx.commits_24h.length === 0 ? '(none)' : ctx.commits_24h.join(' | ')}
- Recent activity across ALL Zaal's repos: ${ctx.cross_repo_24h.length === 0 ? '(none)' : ctx.cross_repo_24h.join(' | ')}
- Open PRs: ${ctx.open_prs.length === 0 ? '(none)' : ctx.open_prs.map((p) => `#${p.number} ${p.title}`).join(' | ')}
- Team board: ${ctx.team ?? '(tracker unavailable - skip the TEAM section)'}
- Focus (top-3 by deadline + what needs your call): ${ctx.focus ?? '(none dated)'}
- Fleet health: ${ctx.fleet ?? '(unavailable - skip the FLEET section)'}
- ZOL status: ${ctx.zol ?? '(unavailable)'}
- ${inboxLine}

Output the brief now in the exact format from your system prompt.`;

  const result = await callClaudeCli({
    model: opts.model ?? 'sonnet',
    prompt: userPrompt,
    cwd: opts.repoDir,
    appendSystemPrompt: BRIEF_SYSTEM_PROMPT,
    permissionMode: 'default',
    bare: false,
  });

  return guardEmpty(result.text);
}

const EMPTY_GUARD_MIN = 50;

function guardEmpty(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < EMPTY_GUARD_MIN) {
    console.error('[zoe/brief] empty/short brief output, length=', trimmed.length, 'raw=', trimmed.slice(0, 200));
    const { day, date } = todayLabel();
    return `Morning brief - ${day} ${date} 5am\n\n(brief generation degraded — see logs)\n\nportal.zaoos.com/todos - brain dump`;
  }
  return trimmed;
}
