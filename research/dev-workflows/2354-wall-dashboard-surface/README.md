---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: "288, 2343, 2353"
original-query: "/zao-research how we can make this better maybe also a dashboard localhost page or a vercel site or something for it"
tier: STANDARD
---

# 2354 - The Wall needs a page, and it already has a home

> **Goal:** Decide where a visual view of The Wall lives - a localhost page, a new Vercel site, or somewhere that already exists.

## Key Decisions

Recommendations first.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **BUILD IT AS A ROUTE IN THE COWORK APP (`thezao.xyz`), not a new site and not localhost.** | The cowork app is already deployed, already reads the same Supabase `tasks` table, and is already the standing decision for where operational surfaces live. A separate site would be a second thing to keep in sync with the board. |
| 2 | **DO NOT build a localhost dashboard.** | It is invisible from the phone, which is the case Zaal actually named ("zjing to vps from mobile when laptop isnt available"). A localhost page solves the situation where he already has the terminal open. |
| 3 | **DO NOT adopt a tool from doc 288.** | That survey (2026-04-06) recommended Mission Control, Langfuse, disler/observability. **None was adopted in the four months since.** The gap was never a missing tool - it is that our state lives in tmux panes and a Supabase table nothing renders together. |
| 4 | **FIX the dead one first.** The Pi's "fleet dashboard on :8090" is **not running** - `http=000` from the Pi itself - while its tmux pane still advertises it. | Shipping a second dashboard beside a dead one that claims to be alive is how you get two things nobody trusts. |
| 5 | **The data layer is done.** `zao-wall --json`, `zj`, `zao-spend`, `zao-waiting`, and 52 state stamps all exist. | This is a rendering problem, not a collection problem. Everything below is a view over data already produced. |

## Findings

### 1. The architecture question was already answered

`feedback_cowork_app_main_interface` (2026-07-17), Zaal verbatim:

> "imma use the coworking chart to do things from now on... the best production place to talk to ZOE and more on the ZAO.xyz coworking app. We can build new integrations and develop over here in claude code but main convo / back and forth / agents should all be integrated to coworking."

The split it records: **the cowork app is the production home; Claude Code is the workshop.** New integrations get built here and land there. Its stated purpose is to *consolidate scattered surfaces into one production home* - so answering "a localhost page or a new Vercel site?" with a third surface would invert the decision that already exists.

The app is real and deployed: `ZAODEVZ/ZAOcowork`, Next.js, live at **thezao.xyz**, last commit 2026-08-17. It already has routes for `board`, `activity`, `bots`, `calendar`, `chat`, `crm`, `overview`, `shipped`, `summary`, `todo`, `my-work`, `repos`. **There is no `lanes` or `wall` route.** That is the gap, and it is one route in an app that already knows how to read the board.

### 2. There is already a dead dashboard, and it still advertises itself

The `fleet` lane on the Pi has printed **"fleet dashboard on :8090"** for 12 days, and `zj` faithfully renders that line. Measured today:

- From this Mac: `http=000`
- **From the Pi itself, `curl http://127.0.0.1:8090/`: `http=000`**

Nothing is listening. The pane text is the residue of a process that died, and both `zj` and any human reading the wall have been told a dashboard exists for nearly two weeks.

This is the same failure the wall itself had this morning - a stale line read as current state (doc 2343) - and it is the argument for fixing rather than adding. A dashboard that lies about being up is worse than no dashboard, because it stops anyone looking for the real one.

### 3. Doc 288 surveyed this and nothing shipped

Doc 288 (2026-04-06) surveyed agent-monitoring dashboards and produced a recommendation table: Mission Control for squad management, Langfuse for trace analysis, `disler/observability` for Claude Code hook monitoring, Pixel Agents for "see agents working."

**Four months on, none is running.** That is not a criticism of the survey - it is evidence about the shape of the problem. Adopting a general-purpose agent-observability tool means teaching it about tmux lanes, a Supabase board, vault briefs and per-lane card claims. By the time that mapping is written, it is our own view over our own data. Which we can now write directly, because the data layer got built today.

### 4. What the page should show - and the data already exists for all of it

Nothing here needs new collection:

| Panel | Source | Exists? |
|---|---|---|
| Lanes: blocked / working / need-work, per host | `zj` classification, or the same logic over `tmux` | yes, and correct as of today |
| Cards each lane owns | `zao-wall --json` (`metadata.lane`) | yes, built today |
| Unclaimed agent work (**131**) | `zao-wall --unclaimed` | yes |
| Needs-Zaal queue (**52**) | board `route=human` | yes |
| Spend + per-PR cost | `zao-spend` | yes |
| waiting% | `~/.claude/state/status-*.json`, 52 stamps | partial - see below |

**The join nobody has done** is the valuable one: a lane row showing *the cards it owns*. `zj` answers "what are the lanes doing"; `zao-wall` answers "what work is claimed". Neither alone tells you whether an idle lane is starved or simply between tasks - which is exactly the ambiguity in today's "16 need work" figure.

**One honest gap:** the state stamps are **last-write-wins per session**, so they are a point-in-time snapshot, not a time series. `zao-waiting` reports this itself - "no transition data in the last 7d". A real waiting% needs the transition LOG that dotfiles #46 adds, not the stamps as they stand.

### 5. Why not localhost, concretely

Zaal's own next thread, stated today: *"work on zjing to vps from mobile when laptop isnt available."*

A localhost page is reachable only from the machine already running the terminal. It solves the case that is already solved. The cowork app is deployed, authenticated, and on his phone - and the three lanes that were unreachable from a phone this morning (`/rc failed` on `obsidian`, `meetings`, `zaoos-infra`) are the exact failure a hosted wall view would have surfaced.

### Honest limits

- **I did not read the cowork app's auth model.** A wall route exposes lane names, card titles and machine state; it needs whatever gate `board` already has, and that was not verified here.
- **`zao-wall` is not merged.** It lives in ZAOOS PR #3196. A cowork route reading `metadata.lane` depends on that convention landing.
- **Lane state is Mac-local.** `zj` reads tmux over ssh; a Vercel-hosted page cannot. Getting live lane state to a hosted page needs an agent pushing it (the state stamps, or a small writer to Supabase) - that is the one genuinely new piece of plumbing, and it is worth naming rather than discovering later.

### Correction 2026-08-20 (fleet-build lane, card 8e868a63): half the plumbing already exists and is live

The cowork Supabase (etwvzrmlxeobinrlytza) has a **`fleet_status` table** - `{session, state, last_line, updated_at}` - with 11 rows whose newest was minutes old when checked. The writer is the VPS `bin/loops-keepalive.sh` (per `scripts/fleet/README.md`, which also names a design-only "fleet + board page" over exactly this table). So the "one genuinely new piece of plumbing" above is HALF built: **VPS lane state already streams to Supabase live; only MAC lane state still needs a writer.** A `/lanes` route can render the VPS half on day one.

Card 8e868a63's attention triple maps onto this route rather than wanting a different surface: **needs-you** = board `route=human` + gated asks, **active** = picked-off (doc 2344's `zao-wall --pick` state), **looping** = wall lanes working. Recommend the `/lanes` route adopt that three-way grouping as its top-level split. No separate attention-board - that would be the third surface decision 1 exists to prevent.

- [Doc 288 - agent squad monitoring dashboards](../../agents/288-agent-squad-monitoring-dashboards/) - the survey whose recommendations were never adopted
- [Doc 2343 - zj cannot tell IDLE from BLOCKED](../2343-zj-wall-signal-quality/)
- [Doc 2353 - model tiering](../../agents/2353-model-tiering-and-escalation/)
- `feedback_cowork_app_main_interface` - the standing decision this doc defers to

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Diagnose and either restart or retire the Pi's `:8090` fleet dashboard - it has advertised itself while dead for 12 days | @Zaal | Fix | 2026-08-22 |
| Merge ZAOOS #3196 so `metadata.lane` is a landed convention a UI can read | @Zaal | PR | 2026-08-21 |
| Add a `/lanes` route to ZAOcowork rendering the lane-to-card join, reusing the `board` route's auth | @Zaal | PR (ZAOcowork) | 2026-08-27 |
| Write lane state to Supabase from the Mac so a hosted page can read it - the one new piece of plumbing | @Zaal | PR (zaal-dotfiles) | 2026-08-27 |
| Merge dotfiles #46 (transition log) so waiting% has a real time series rather than snapshots | @Zaal | PR | 2026-08-22 |

## Sources

All measured on this machine and the Pi, 2026-08-20. No external fetches were needed.

- [FULL - `curl` from this Mac and from ansuz] the Pi's `:8090` returns `http=000` both remotely and locally; the `fleet` tmux pane still prints "fleet dashboard on :8090".
- [FULL - read on disk] `~/Documents/ZAOcowork` - `ZAODEVZ/ZAOcowork`, Next.js, README states live at thezao.xyz, last commit 2026-08-17; route listing under `src/app/` showing no `lanes`/`wall` route.
- [FULL - read on disk] `feedback_cowork_app_main_interface`, quoted verbatim.
- [FULL - read on disk] `research/agents/288-agent-squad-monitoring-dashboards/README.md` recommendation table, last-validated 2026-05-21.
- [FULL - run] `zao-wall`, `zj -l`, `zao-spend --days 1`, `zao-waiting` - all execute; `zao-waiting` self-reports no transition data.
- [FULL - counted] 52 files matching `~/.claude/state/status-*.json`.
