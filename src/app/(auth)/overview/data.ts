// Structured content for the /overview project dashboard.
// Hand-maintained snapshot — update as the repo evolves. Sources: CLAUDE.md
// Project Map, bot/REGISTRY.md, the .claude/skills catalog, and the bot audit.
// Last refreshed: 2026-06-08.

export interface RepoArea {
  area: string;
  path: string;
  desc: string;
  count?: string;
}

export const repoMap: { group: string; areas: RepoArea[] }[] = [
  {
    group: 'App & API',
    areas: [
      { area: 'API routes', path: 'src/app/api/', desc: 'Route handlers across 56 domains', count: '336 files' },
      { area: 'Gated pages', path: 'src/app/(auth)/', desc: 'Logged-in surfaces — home, chat, music, governance, admin, this page', count: '28 pages' },
      { area: 'Public pages', path: 'src/app/', desc: 'Landing, research, members, network, spaces, live, juke, stake', count: '18 pages' },
    ],
  },
  {
    group: 'UI',
    areas: [
      { area: 'Components', path: 'src/components/', desc: 'React components by feature', count: '304 files / 37 domains' },
      { area: 'Hooks', path: 'src/hooks/', desc: 'useAuth, useChat, useRadio, …', count: '19 hooks' },
      { area: 'Providers', path: 'src/providers/', desc: 'Audio player + context providers' },
    ],
  },
  {
    group: 'Business logic — src/lib (42 domains)',
    areas: [
      { area: 'auth / db', path: 'src/lib/{auth,db}', desc: 'iron-session (FID + wallet + admin) + Supabase RLS (service-role server-only)' },
      { area: 'social', path: 'src/lib/{farcaster,bluesky,social,publish}', desc: 'Neynar, Bluesky, cross-platform posting (Farcaster / X / Bluesky)' },
      { area: 'on-chain', path: 'src/lib/{respect,hats,zounz,staking,wagmi,solana,ens}', desc: 'Respect tokens, Hats roles, Nouns DAO, staking, wallets' },
      { area: 'media', path: 'src/lib/{music,livepeer,jina}', desc: 'Audius radio, video streaming, content extraction' },
      { area: 'governance', path: 'src/lib/{snapshot,ordao}', desc: 'Snapshot gasless voting, DAO governance' },
      { area: 'agents', path: 'src/lib/agents/', desc: 'VAULT / BANKER / DEALER autonomous trading bots' },
    ],
  },
  {
    group: 'Bot fleet — bot/',
    areas: [
      { area: 'ZOE', path: 'bot/src/zoe/', desc: 'Concierge — tasks, captures, brief/reflect, recall' },
      { area: 'Hermes', path: 'bot/src/hermes/', desc: 'Autonomous fix-PR pipeline (coder Opus + critic Sonnet)' },
      { area: 'ZAO Devz', path: 'bot/src/devz/', desc: 'Group /fix dispatch + dual-bot narration' },
      { area: 'Control plane', path: 'bot/src/lib/cowork.ts · bot/src/fleet-agent/', desc: 'Heartbeats, activity events, command queue, host supervisor' },
      { area: 'ZAOstock', path: 'bot/src/index.ts', desc: 'Festival team coordination (graduating spinout)' },
    ],
  },
  {
    group: 'Knowledge & infra',
    areas: [
      { area: 'Research', path: 'research/', desc: 'Institutional memory across every product', count: '1,183 docs / 30 categories' },
      { area: 'Skills', path: '.claude/skills/', desc: 'Custom Claude Code tooling (see Tooling tab)', count: '28 skills' },
      { area: 'Scripts', path: 'scripts/', desc: 'SQL migrations, wallet generation, webhooks, bonfire ingest' },
      { area: 'Config', path: 'community.config.ts', desc: 'Branding, channels, contracts, admin FIDs, theme' },
    ],
  },
];

// --- Bots --------------------------------------------------------------------

export type BotStatus = 'live' | 'pending' | 'dormant' | 'decommissioned' | 'external';

export interface BotRow {
  name: string;
  handle: string;
  source: string;
  status: BotStatus;
  board: string;
}

export const botFleet: BotRow[] = [
  { name: 'ZOE', handle: '@zaoclaw_bot', source: 'bot/src/zoe/', status: 'live', board: 'On board — full ask / run_task / lifecycle' },
  { name: 'ZAO Devz', handle: '@zaodevz_bot', source: 'bot/src/devz/', status: 'live', board: 'On board — lifecycle' },
  { name: 'Hermes', handle: '@zoe_hermes_bot', source: 'bot/src/hermes/ (in zao-devz-stack)', status: 'pending', board: 'Wired — needs token + Vercel redeploy' },
  { name: 'ZAOstock', handle: '@ZAOstockTeamBot', source: 'bot/src/index.ts', status: 'live', board: 'On board — lifecycle (graduating)' },
  { name: 'Magnetiq', handle: '@zao_magnetiq_bot', source: 'bot/src/teams/', status: 'decommissioned', board: 'Off — doc 601, fold into ZOE' },
  { name: 'AttaBotty', handle: '@z_attabotty_bot', source: 'bot/src/teams/', status: 'decommissioned', board: 'Off — doc 601, fold into ZOE' },
  { name: 'Bonfire', handle: '@zabal_bonfire', source: 'bonfires.ai', status: 'external', board: 'Off-VPS (Bonfires platform)' },
  { name: 'DeepMeeting', handle: '@zdeepmeeting_bot', source: 'bonfires.ai', status: 'external', board: 'Off-VPS — group routing broken' },
];

export const controlPlane = {
  url: 'https://www.thezao.xyz/bots',
  summary:
    'Pull-based: bots poll the cowork server, the board never reaches into the VPS. Observe = any teammate; control / task / converse = admins. The fleet-agent (host start/stop) is staged but disabled.',
  capabilities: [
    'Observe — heartbeats + activity feed, per-bot task & last error',
    'Control — start / stop / restart / pause',
    'Task — assign a cowork todo to a bot; it works it & posts back',
    'Converse — ask a bot a question from the board',
  ],
};

// --- Tooling -----------------------------------------------------------------

export interface SkillItem {
  name: string;
  desc: string;
}

export const tooling: { group: string; skills: SkillItem[] }[] = [
  {
    group: 'Session & dev',
    skills: [
      { name: '/worksession', desc: 'Start a session in an isolated git worktree (parallel-safe)' },
      { name: '/z', desc: 'Quick status dashboard — what needs attention' },
      { name: '/catchup', desc: 'Restore session context (changes, commits, branches)' },
      { name: '/new-route', desc: 'Scaffold an API route (Zod + session + NextResponse)' },
      { name: '/new-component', desc: 'Scaffold a React component (dark theme, mobile-first)' },
    ],
  },
  {
    group: 'Research & knowledge',
    skills: [
      { name: '/zao-research', desc: 'Search 1,183 research docs + code + web, save a numbered doc' },
      { name: '/autoresearch', desc: 'Autonomous modify→verify→keep/discard loop on any metric' },
      { name: '/deep-research', desc: 'Fan-out web search, verify claims, cited report' },
      { name: '/bonfire', desc: 'Post episodes to the ZABAL knowledge graph (via VPS)' },
    ],
  },
  {
    group: 'Ops & bots',
    skills: [
      { name: '/vps', desc: 'Manage the Telegram bot fleet on the VPS via SSH' },
      { name: '/meeting', desc: 'Process a transcript → cowork, bonfire, calendar, memory' },
      { name: '/inbox', desc: "Process ZOE's email inbox (zoe-zao@agentmail.to)" },
      { name: '/morning', desc: 'Morning kickoff — status, brief, top priorities' },
      { name: '/reflect', desc: 'End-of-day reflection → running journal' },
    ],
  },
  {
    group: 'Content & product',
    skills: [
      { name: '/onepager', desc: 'Draft a ZAOstock one-pager → Supabase' },
      { name: '/design-steal', desc: "Adapt 55 companies' design language to navy/gold" },
      { name: '/big-win', desc: 'Document a Big Win → quarterly docs + index' },
      { name: '/lean', desc: 'Lean waste audit on a process (7 wastes)' },
    ],
  },
  {
    group: 'Quality, ship & safety',
    skills: [
      { name: '/code-review', desc: 'Review the diff for bugs + cleanups' },
      { name: '/qa', desc: 'Full test-fix-verify loop for UI features' },
      { name: '/verify', desc: 'Run the app and confirm a change actually works' },
      { name: '/security-review', desc: 'STRIDE + OWASP audit of pending changes' },
      { name: '/ship', desc: 'Detect → test → review → version → PR' },
    ],
  },
];

export const toolingNote =
  'Plus the full built-in superpowers set (brainstorming, writing-plans, TDD, parallel agents, git worktrees) and the Claude API reference. Invoke any with a leading slash.';

// --- Improvements / tech-debt ------------------------------------------------

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Improvement {
  priority: Priority;
  title: string;
  detail: string;
  effort?: string;
}

export const improvements: Improvement[] = [
  {
    priority: 'P0',
    title: 'Untracked VPS snapshot',
    detail:
      'zaostock-bot and zao-devz-stack/hermes run from ~/zaostock-bot, which is NOT a git repo. Control-plane code there was hand-patched — it can drift from main and is not reproducible. Reconcile to a real git checkout.',
    effort: '~2h',
  },
  {
    priority: 'P1',
    title: 'VPS runs a feature branch',
    detail:
      "zoe-bot's ~/zao-os clone tracks claude/gifted-euler-bYhl7 instead of main, even though the PRs are merged. Point it at main so prod isn't on a dev branch.",
    effort: '~5min',
  },
  {
    priority: 'P1',
    title: 'Hermes not yet on the board',
    detail:
      'Hermes heartbeat code is wired (separate identity) but its token isn’t in the cowork COWORK_BOT_TOKENS env. Add hermes= token + redeploy + restart zao-devz-stack. Blocked on the Vercel daily-deploy cap.',
    effort: '~10min',
  },
  {
    priority: 'P2',
    title: 'Decommissioned code lingering',
    detail:
      'Magnetiq/AttaBotty (bot/src/teams/) and FISHBOWLZ (src/components/fishbowlz, src/lib/fishbowlz, src/app/api/fishbowlz, skills/fishbowlz) are decommissioned per doc 601 but still in the tree. Archive or delete.',
    effort: '1–2h',
  },
  {
    priority: 'P2',
    title: 'Un-wired cowork callsites',
    detail:
      'pushItem (ZOE capture → cowork todo) and Hermes markDone (non-merge close) are exported in bot/src/lib/cowork.ts but have no callsites yet. Wire when the capture / Hermes flows need them.',
    effort: '~3h',
  },
  {
    priority: 'P3',
    title: 'Defense-in-depth + reach',
    detail:
      "Hermes' /hermes-dispatch secret check isn't constant-time (loopback-only, low sev) — use crypto.timingSafeEqual. And the Bonfires-platform bots (@zabal_bonfire, @zdeepmeeting_bot) need a separate heartbeat path to appear on the board.",
  },
];
