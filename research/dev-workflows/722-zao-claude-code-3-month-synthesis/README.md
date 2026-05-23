---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-23
related-docs: "591, 601, 644, 663, 676, 683, 694, 699, 717"
original-query: "Everything in Claude Code and GitHub we have done in the past few months - synthesize the 2162 commits, 500 PRs, 851 research docs, 75 skills, and 45 new repos shipped 2026-02-23 to 2026-05-23 into a hub doc plus 5 sub-docs."
tier: DISPATCH
---

# 722 - ZAO Claude Code + GitHub: 3-Month Synthesis (2026-02-23 to 2026-05-23)

> **Goal:** One read that maps everything built across Claude Code skills, ZAOOS PRs, the research library, the repo fleet, and the patterns + lessons over 73 days. Pulls 2,162 commits, ~569 PRs, 851 research docs, 75 skills, and 45 new repos into one view.

## Headline Numbers

| Surface | Count | Window |
|---------|-------|--------|
| ZAOOS commits | **2,162** | 2026-02-23 to 2026-05-23 |
| ZAOOS PRs | **569** total (552 merged, 14 closed, 2-3 open) - 97% merge rate | same |
| Research README files touched | **851** | same |
| Skills installed | **75** total (47 user + 28 project) | as of 2026-05-23 |
| New repos under bettercallzaal | **45** | same |
| Updated repos (bettercallzaal) | **52** | same |
| Span | **73 days** | ~43.8 PRs/week average, peak 47/wk |

## Key Decisions (cross-cutting takeaways)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Hermes is THE agent framework** - apply it consistently to every new agent build | Locked 2026-05-05 ([[project_hermes_canonical]]). Openclaw, Composio AO, Agent Zero, the 10-bot fleet all killed for it. ZAOscribe (doc 674) + ZAO Devz coordinator + future bots all use the Hermes pattern. |
| 2 | **Monorepo-as-lab is proven** - graduate the next 5 candidates on the same pattern as BCZ YapZ (PR #480, 2026-05-06) | The graduate flow works: own repo + own DB + own domain + code DELETED from ZAOOS. Five clear next graduates: Zlank, wwbase, zao-101, zaoos-workspace, wavewarzapp (see 722d). ZAOstock + ZAONEXUS + CoCConcertZ already mid-spinout. |
| 3 | **The `/meeting` + `/bonfire` + `/zao-research` triplet is the durable skill stack** - everything else is supporting | 851 research docs, ~12 meeting recaps in 30 days, 52 Bonfire episodes posted in 2 days, /meeting upgraded twice this month (mlx + diarization). Triplet, not standalone. Other skills consolidate around them. |
| 4 | **Split `agents/` + `dev-workflows/` research folders** - both overflowing | 312 docs total = 36% of the entire library in two folders (158 + 154). Sub-folders: agents -> core/zoe-hermes/tooling/archive; dev-workflows -> skills/research/claude-code/automation. See 722c. |
| 5 | **Branch thrash is the #1 unfixed dev friction** - enforce worktrees per parallel session | This session alone had 4 commits land on wrong branches due to shared workdir being switched. The feedback memory `feedback_workspace_worktrees` is right; not actually enforced. Fix: `worksession` skill becomes mandatory at session start, hook blocks edits without it. |
| 6 | **The tracker brand-label schema is the gate for everything action-related** | Doc 717 holds all action-tracker writes (~30+ items from 3+ recent meetings) until the schema lands. Decide: new `brand` field, `labels` array, or expand the category enum. Without this, every `/meeting` ends with HELD actions. |
| 7 | **Bonfire read returning `[]` is the bottleneck for the recall side** | Episodes flow IN (52 posted in 2 days). Reads return [] until an admin runs labeling (`/labeling/hybrid` is 403 for the non-admin key). Until then, Bonfire is write-only. Critical-path unblock - escalate to Joshua / Ryan. |

## What this hub contains

This is a DISPATCH doc - the 5 dimensions live in sub-docs. Read each for depth; this hub is the orientation.

| Sub-doc | What it covers | Key finding |
|---------|---------------|-------------|
| [722a Skills inventory](722a-skills-inventory/) | All 75 skills - 47 user + 28 project - grouped by purpose, with status + origin doc | `/meeting`, `/bonfire`, `/zao-research` are the load-bearing triplet. 5 consolidation opportunities (research routing 3->1, VPS management 2->1, design skills 3->1). `/fishbowlz` is the only cold skill. |
| [722b PR timeline](722b-pr-timeline/) | The 569 PRs mapped by theme, with watershed-decision PRs | Research / docs alone = 258 PRs (45%). 7 watershed PRs lock major decisions (#467 agent-stack collapse, #480 YapZ graduation, #533 ZOE post slate, #544 ZAOstock code delete, #571 Bonfire bridge, #604 festival-name spelling, #627 `/bonfire` skill). |
| [722c Research corpus map](722c-research-corpus-map/) | 851 docs by topic folder + doc-number cluster, hub docs anchoring the corpus | 660s = Bonfire foundation, 670s = `/meeting` skill, 680s = bridges, 700s = ops + games, 710s = recent recaps, 720s = this synthesis. 5 canonical hubs: 591, 663, 676, 695, 699 (+ this one = 722). |
| [722d Repos created + state](722d-repos-created/) | 45 new + ~52 updated repos across bettercallzaal + CandyToyBox + songchaindao-dot + hurric4n3ike, with graduation path | 5 graduation-ready: Zlank, wwbase, zao-101, zaoos-workspace, wavewarzapp. 3 mid-spinout. 9+7 dormant to archive (fractal-bot variants, ww private, zaomusicbot, etc). 14 unresolved-purpose repos need Zaal triage. |
| [722e Patterns + lessons](722e-patterns-lessons/) | What was canonicalized, killed, shifted, worked, recurred-as-friction | The synthesis sub-doc - read this one if you only read one. Hermes locked. openclaw / Composio AO / ZOE v2 / FISHBOWLZ killed. ZOE pivoted 3x. /meeting + Bonfire episodes + subagent dispatch are the durable wins. Branch thrash + skill drift + secret-hygiene incidents recur. |
| [722f People network](722f-people-network/) | The collaborator + advisor + named-person map, 7 tiers, role + active project + last-touched date | 31 named collaborators + Zaal across 7 tiers. 4 net-new in May (Arthur, kmac.eth, Onaji, Sisla). 81% active or in regular cadence. Critical gaps: Hermes vs Bonfires reconciliation BLOCKED, ZAO-PALOOZA retrospective NOT STARTED, no dedicated DevOps beyond Iman. |
| [722g Memory state](722g-memory-state/) | Audit of the persistent memory dir - ~80 project + ~30 feedback + user memories - drift, contradictions, supersession | 173 files on disk vs 159 indexed (14 drift = 8%). 2 contradictions (FISHBOWLZ sync rules clash, git-workflow memories duplicate). 8 superseded entries to retire (ZOE v2 / Agent Zero pivots, openclaw historicals, FISHBOWLZ). ZAOstock over-documented (10 memories - consolidate to 2). |
| [722h Runtime + bot deployment](722h-runtime-bot-deployment/) | Live runtime state - 5 surfaces, VPS topology, scheduled jobs, external deps, observability | All 5 canonical surfaces (ZOE, Hermes, ZAO Devz, Bonfire, ZAOstock bot) LIVE. VPS 1 (31.97.148.88) + Iman's VPS (187.77.3.104) - no VPS 2. All 7 killed components confirmed dead. ZOE node-cron: 6am brief, 9pm reflect, hourly nudge. New team bots Magnetiq + AttaBotty scaffolded, pending approval. |

## Cross-cutting findings

A few things only become obvious when you look across all five dimensions at once:

- **Research output dominates code output by volume.** 258 PRs of 569 are research docs (45%). 851 README files touched in 73 days = ~11/day. The library is the moat. Skills like `/zao-research` + the DISPATCH pattern are the multiplier.
- **The "kill list" is as important as the "build list."** Killing openclaw + Composio AO + Agent Zero + FISHBOWLZ freed the bandwidth to lock Hermes + ship the 5-surface stack (ZOE / Hermes / ZAO Devz / Bonfire / ZAOstock bot). The decision-doc pattern (601, 644) is what made this auditable.
- **Skills + research + meetings are one loop.** Recordings -> `/meeting` skill -> recap docs (events/) -> related-docs cross-links -> Bonfire episodes -> KG. Every meeting feeds the corpus, every research doc cites prior meetings. The loop closed this session with the `/bonfire` skill (PR #627) and the backlink step added to `/meeting`.
- **The "graduate when ready" pattern is the right unit of consolidation, not "delete eagerly."** Repos sit dormant for months before they graduate or get archived. Trying to clean too early kills options; trying to keep everything bloats the lab. BCZ YapZ proved the pattern on 2026-05-06.
- **Parallel sessions are the most under-managed surface.** This session had 4 commit-misroute incidents from a shared workdir. The `worksession` skill exists but is opt-in. Making it enforced (a hook that blocks edits on a non-`ws/` branch) closes the gap.

## Also See

- [Doc 601 - Agent stack cleanup decision](../../agents/601-agent-stack-cleanup-decision/) - the kill-list lock
- [Doc 644 - ZAO agent stack canon + team bot template](../../agents/644-zao-agent-stack-canon-and-team-bot-template/) - the build-list lock
- [Doc 663 - ZAO research meta-audit](../663-zao-research-meta-audit-2026-05-17/) - the prior corpus audit
- [Doc 694 - Research library audit](../694-research-library-audit/) - the metadata-debt audit
- [Doc 699 - State of agentic 2026](../../agents/699-agentic-study/) - the contemporary state-of-art reference
- [Doc 717 - Bonfire posting via VPS](../../agents/717-meeting-bonfire-posting-via-vps/) - the gate this doc references for action-tracker writes

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Lock the tracker brand-label schema and unblock the HELD actions across docs 711, 714, 718-721 | @Zaal | Decision | This week |
| Enforce `/worksession` at session start via a hook that blocks edits on main / non-`ws` branches | @Zaal | PR / hook | Before next multi-session day |
| Split `agents/` + `dev-workflows/` research folders per the 722c proposal | @Zaal | Repo refactor | Within 2 weeks |
| Escalate the Bonfire read-side unblock (admin labeling) to Joshua / Ryan | @Zaal | Comms | This week |
| Graduate the next monorepo-as-lab spinout from the 5 candidates (Zlank, wwbase, zao-101, zaoos-workspace, wavewarzapp) | @Zaal | Spinout PR | Next 30 days |
| Build `sherpa-onnx` diarization on `/meeting` (doc 717 next-action) | @Zaal | PR | Before next 3+ person meeting recording |
| Archive the 9+7 dormant repos per 722d | @Zaal | Cleanup | Within 30 days |
| Add `/meeting` Phase-4 backlink step + run a one-time pass on existing recap docs to backfill backlinks | @Zaal | PR / script | Next `/meeting` skill iteration |
| Re-validate this hub doc + its 5 sub-docs every 30 days; supersede when the corpus has materially shifted | @Zaal | Cadence | 2026-06-23 |

## Sources

All internal - this is a corpus audit over the ZAO ecosystem's own output. Each sub-doc carries its specific source paths.

- `/Users/zaalpanthaki/Documents/ZAO OS V1/` repo (gh CLI + git log + find research/) - [FULL]
- `~/.claude/skills/` + `.claude/skills/` (skill SKILL.md files read per skill) - [FULL]
- bettercallzaal org repo metadata via `gh repo list` - [FULL]
- CandyToyBox + songchaindao-dot + hurric4n3ike orgs (for the WaveWarZ family) - [FULL where public]
- `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/MEMORY.md` and the feedback memories - [FULL]
- Prior synthesis docs: 591 (miniapp), 601 (agent cleanup), 663 (research audit), 644 (agent canon), 676 (bonfire utilization), 694 (research metadata), 699 (state of agentic) - [FULL]

Research conducted via 5 parallel DISPATCH subagents, 2026-05-23.
