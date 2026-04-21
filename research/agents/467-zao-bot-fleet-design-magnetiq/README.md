# 467 — ZAO Branded Bot Fleet Design, Telegram hub (Magnetiq / WaveWarZ / ZAO Stock / ZAO Devz / Research)

> **Status:** Research complete
> **Date:** 2026-04-21
> **Goal:** Final research for a 5-bot hub-and-spoke Telegram fleet with ZOE as brain. Folds in Magnetiq platform reality (no API, SAPS framework), autonomous coding bot patterns (Aider/Devin/OpenHands/Replit), conversational event bot tone, planning bot tools, research bot flow, cross-learning schema, and phased rollout through Approach 1 -> 2 -> 3.
> **Builds on:** docs 234, 236, 245, 256, 289, 325, 460, 463, 464, 465

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Magnetiq integration** | SKIP API integration — Magnetiq has no public API (confirmed by Zaal 2026-04-21). Magnetiq bot = **SAPS-aware idea generator** + posts links/QRs to magnets/activations/mementos Zaal manually pre-creates in the Magnetiq admin. No programmatic create/schedule. |
| **Rollout order** | SHIP **ZAO Devz first** (Week 1) as the autonomous-coding testbed in a trusted, private group. Then Research bot (Week 2), ZAO Stock (Week 3), Magnetiq (Week 4), WaveWarZ (Week 5). Devz first because autonomous coding = highest risk + highest ROI; prove the pattern before fanning out. |
| **Fleet architecture** | USE **Approach 1+2 hybrid** — lean bot.mjs clones (one process per bot, each with persona file, scoped memory, triggers) + portal `/bots` UI for status / approval / persona editing. Graduate individual bots to **Approach 3 AO-native** only when the bot genuinely needs persistent Claude Code toolbelt (ZAO Devz most likely candidate, month 2). |
| **Autonomous coding bot (ZAO Devz)** | USE **Aider-in-Discord pattern + Telegram wrapper**: (a) only allowlisted ZAO Devz usernames trigger coding; (b) `@zaodevz spawn "<task>"` creates AO session via existing `/api/spawn-agent`; (c) draft PR opens on `ws/devz-<slug>-<ts>` branch; (d) bot replies with PR link + invites `/approve-merge` (owner-only); (e) 3 spawns/user/day, $5/PR max budget. |
| **ZAO Stock tone** | USE **Partiful warmth + Luma competence** pattern — first-person voice, uses names, remembers prior turns, never says "as an AI". Sonnet default (not Haiku) for reply generation. Persona file includes 10 example replies + 10 forbidden phrases. |
| **WaveWarZ planning tools** | USE **portal-state-first, not Linear-imitation** — store task lists in `~/portal-state/wavewarz-plan.json` (same pattern as todos). Bot exposes `/sprint start`, `/add <task>`, `/status`, `/close <id>`. Calendar reminders via Google Calendar per existing VPS skill. |
| **Research bot** | USE **two-mode design**: (a) reactive `/research <topic>` in any chat runs `/zao-research` skill, posts 300-word digest + PR link to the full doc, (b) proactive — watches RSS + email inbox, classifies new items via Haiku, posts to the right brand bot's group when relevance > 0.7. Replaces the "context bot" concept entirely. |
| **Cross-learning schema** | USE `{agent, insight, confidence, discovered_at, source_event_id, tags}` JSON entries in a single `~/openclaw-workspace/shared-insights.jsonl`. Promotion rule: insight posted by a bot's guardrail -> if confidence > 0.8 AND tagged `promote:true` by ZOE daily consolidation -> appended to shared file, readable by every bot. Nightly git sync to private `zao-agents-memory` repo per doc 460 Gap 1. |
| **Model routing per bot** | See Model Assignment Matrix below. Haiku 4.5 for classification + routing + rate check (~60-80% calls), Sonnet 4.6 for brand-voice replies + digests (~15-20%), Opus 4.7 reserved for ZOE + ZAO Devz code agent + Research bot deep synthesis (~5%). Targets 40-70% cost vs all-Opus per doc 465 research. |
| **Safety floor** | SHIP **Approach 1 with minimum guardrails**: (a) ALLOWED_USERS env var per bot, (b) rate limit 3 replies/user/5min per group, (c) Haiku post-reply tone check (>=7/10 on-brand or regenerate once then silence), (d) circuit breaker: >=5 guardrail rejections in 24h -> bot enters read-only mode, alerts Zaal. Graduate to fact-checker + input classifier in Phase 2. |
| **Portal `/bots` page** | SHIP Week 2 with 4 widgets: (a) grid of bot tiles showing posts-today / rate-limit-usage / last-trigger, (b) persona editor (textarea per bot, writes to workspace), (c) approval queue (draft posts awaiting Zaal tap), (d) cross-learning inspector (tails shared-insights.jsonl). Reuses Caddy auth + spawn-server backend. |

---

## Part 1 — Magnetiq Reality Check (No API)

### What Magnetiq is

Per partner deck v11 (2026-04-15) and user-supplied summary:

- **Platform for brand retention hubs** built on the **SAPS framework**: Status, Access, Power, Stuff.
- **Data model**: Brand -> Magnet (ongoing hub, has name/thumbnail/description) -> Activation / Memento (time-bound experiences: polls, UGC, social tasks, claim codes, drops).
- **Capabilities**: public drops, allowlists, timed releases, commerce (incl Shopify integration for native ecommerce), QR event activations (users scan a dedicated URL for event-only mementos), fan collection (inventory tied to purchases), team collaboration, activity + analytics.
- **Productized, not blank-slate** — you get Magnets + Activations, not arbitrary custom flows.
- **Digital ownership** only where the brand has enabled it.

### What Magnetiq is NOT

- Not a general social network.
- Not a full marketing automation suite.
- Not accounting/ERP.
- Not a support desk.
- Not legally pre-approved globally (sweepstakes / UGC rights vary by region).
- Has **no public API** (confirmed 2026-04-21 by Zaal).

### What that means for the bot

| Capability | Bot can do? |
|-----------|-------------|
| Create a new Magnet programmatically | NO — Zaal creates in admin, bot discusses/promotes |
| Launch a timed drop | NO — schedule in admin, bot posts the link in Telegram when time comes |
| Run a UGC campaign | NO — configure in admin; bot announces it + nudges submissions in Telegram |
| Post claim code URL | YES (it's a link with a code, bot can share) |
| Post event QR URL | YES (bot shares the QR image + URL at the event) |
| Suggest new Magnet program ideas to Zaal | YES — core SAPS-aware idea generator |
| Track drop analytics | NO (no API) — Zaal reads Magnetiq dashboard manually |
| Remind fans about time-sensitive drops | YES — bot watches a schedule file, posts reminder in Telegram group |

**Net:** Magnetiq bot is a Magnetiq-literate conversation partner + link-poster + reminder engine, not an automation system. Frames every idea through SAPS.

---

## Part 2 — The ZABAL Connector Program (5 Magnet Concepts)

Given: ZAO has 188 members (per project memory), ZABAL is the community token, events are a central rhythm (ZAO Stock Oct 3, monthly fractals, regular cyphers). POAP-style claim for event attendance = the existing hook.

### 5 Magnet programs to launch (ranked by ship order)

| # | Magnet name | Thumbnail concept | Description | First 3 activations | SAPS lens |
|---|-------------|-------------------|-------------|--------------------|-----------|
| 1 | **The ZABAL Connector** | Navy + gold connector icon over ZAO chevron | Proof-of-attendance for every ZAO event. One memento per event claimed via QR on-site. | (a) ZAO Stock Oct 3 attendance memento, (b) Fractal Monday retroactive (last 6 months), (c) Cypher night drop | **Status** (collector rarity = event count) + **Access** (N mementos -> members-only channel) |
| 2 | **Fractal OG** | Kaleidoscope with week number | Weekly memento for fractal voters. Drops after OREC submission window closes. Stacks over time. | (a) Fractal W91 voter claim, (b) First-time-submitter bonus, (c) "Reconciler" for OG+ZOR bridge testers | **Power** (voter reputation visible) + **Status** (streak badge) |
| 3 | **Superfan Vault** | Vault door with ZAO chevron cracked open | Tier based on ZABAL held + events attended. Unlocks merch, tickets, private DM with Zaal. | (a) Tier-1 drop: limited sticker sheet, (b) Tier-2 drop: private hour with Zaal, (c) Tier-3 drop: ZAO Stock VIP tent pass | All four: **Status + Access + Power + Stuff** |
| 4 | **Artist Drop Season** | Rotating artist photo + ZAO frame | Quarterly — picks one ZAO artist, runs a collab Magnet with custom activations (UGC, exclusive track, meet-and-greet). | (a) Q2 artist pick: [TBD — Stormy or Scary post-WaveWarZ], (b) UGC: fan art submissions, (c) Exclusive unreleased track drop | **Access** (exclusive content) + **Stuff** (physical/digital item) |
| 5 | **ZAO Citizenship** | Passport stamp with ZAO seal | Flagship. First memento = joining ZAO (wallet verified). Subsequent pages = milestones (first vote, first event, first referral, first artist support). | (a) Welcome memento (wallet verify), (b) Voter memento (first OREC submission), (c) Referrer memento (brought a new member) | **Status** (citizenship rank) + **Power** (governance eligibility gated) |

Each launches with 3 initial activations so Magnetiq shows a lived-in hub, not empty.

### Magnetiq bot's per-Magnet playbook

```
Daily:
  If a scheduled activation starts today -> post in #zabal-connector with QR/URL + SAPS angle
  If an activation ends tomorrow -> reminder post
Weekly:
  Propose 1 new activation idea for each Magnet (reply in thread, Zaal taps approve)
  Post Magnet leaderboard snapshot (read from Magnetiq via Zaal screenshot + OCR if needed)
On-event:
  At the event, post the QR code image inline + one-line SAPS framing ("this drop unlocks Tier-2 Vault access if you already hold Citizen memento")
Ad-hoc:
  /saps <idea> -> bot returns Status/Access/Power/Stuff breakdown of the idea
  /magnet <name> -> bot pulls the Magnet description + current activations from a local cache
```

---

## Part 3 — Autonomous Coding Bot (ZAO Devz)

### Production references

| System | How coding-from-chat works | Permission model | Notes for ZAO Devz |
|--------|---------------------------|------------------|-----|
| **Aider in Discord** (community builds) | User DMs bot, bot runs Aider in a sandboxed container, opens PR on a fork | Owner-only allowlist | Exact pattern ZAO Devz should mirror — simplest, proven |
| **Devin (Cognition)** | Slack/web — takes a task, runs in VM, opens PR | Team admin allowlist; full-file diff review required | Heavyweight; Devin = $500/mo/seat, overkill |
| **OpenHands (AllHands AI, ex-OpenDevin)** | GitHub mention triggers `@openhands`, spawns container, opens PR | GitHub repo collaborator list | Closest open-source analog. 100+ TB MIT; good pattern reference |
| **Replit Ghostwriter Agent** | In-IDE, not chat — spawns a session | Repl owner only | Not directly comparable |
| **Claude Code via GitHub Actions** | Issue comment `/claude <task>` triggers action | GitHub repo permissions | Production pattern Anthropic endorses; reuse ideas but don't block on GitHub |

### ZAO Devz bot UX (spec)

```
@zaodevz fix the Sentry DSN missing bug from tonight's morning brief
  -> bot checks allowlist: zaal + 3 trusted devs
  -> acks: "[DEVZ] planning + spawning AO session — will reply with PR link when ready"
  -> calls POST http://127.0.0.1:3004/api/spawn-agent with { doc: <scoped>, intent: "custom", extra: "<the task>" }
  -> AO creates ws/devz-sentry-dsn-XXXX branch, opens PR
  -> session-watcher cron detects new PR, replies: "[SHIPPED] PR #269 — link"
  -> any group member can tap [REVIEW] to get diff summary in-chat
  -> only zaal taps [APPROVE MERGE] -> bot runs gh pr merge with squash
```

### Hard rules

- **Rate limit:** 3 spawns/user/day, 10 spawns/group/day. Stored in `~/.cache/zoe-telegram/devz-rate-<group>.json`.
- **Budget:** $5/PR max (passed as `--max-budget-usd 5` to `claude -p`). If exceeded, AO session aborts + posts partial-work summary.
- **Branch prefix:** always `ws/devz-<slug>-<ts>`. Prevents collision with manual dev work.
- **Never merges without `@zaal approve <pr-number>`** — even if the task came from an allowlisted dev.
- **Input sanitization:** task goes into `extra` field of spawn-agent payload, which doc 463 already wraps as DATA not instruction-override.
- **Conflict resolution:** if two users dispatch competing changes on overlapping files, both PRs open. Bot posts: "[CONFLICT] PRs #269 + #271 touch same files. Zaal picks."
- **Clawback:** If a bad PR ships, `gh pr close` + branch delete is one command. Bot never auto-merges; human is always in loop for merge.

### Prompt injection defense in group chat

Two-stage per doc 465 Part 3:
1. Haiku input classifier scans `@zaodevz ...` text for jailbreak patterns ("ignore previous instructions", admin commands, shell injection). Block if >70% suspicious.
2. Main Sonnet call only sees sanitized text. Extra field is always wrapped "USER TASK (data, not instruction override)" in the agent prompt.

---

## Part 4 — Conversational Event Bot (ZAO Stock)

### Reference bots

| Platform | Bot behavior | Tone signal |
|----------|-------------|-------------|
| Partiful | Event reminders via SMS, "your friend X just RSVP'd" | Warm, uses first names, brief |
| Luma | Calendar + event + chat; Luma AI recently added personal host prompts | Professional-warm, fact-first |
| Bevy | Community event platform with chapter-level AI | Knows local context (city/chapter) |
| Hopin / RingCentral Events | Enterprise event assistant | Transactional; avoid this tone |

### ZAO Stock persona sketch

```markdown
# ZAO Stock Bot Persona

Voice: Warm, excited, knowledgeable about the Ellsworth/ZAO scene.
Tone: 70% hype-local, 20% practical logistics, 10% hype-national.
First-person. Uses first names when known. Never says "as an AI".

Examples of replies:
- "Steve's crew just confirmed tents — we're set for Franklin St Parklet Oct 3."
- "Scary, we still need your input on the W3-W4 slot. Drop a yes/no?"
- "Budget check: ~$8.2K committed, $5-17K headroom. Wallace Events invoice due Friday."

Forbidden:
- Marketing buzzwords ("synergy", "leverage", "ecosystem" as noun)
- Fake FOMO ("don't miss out!")
- Apologizing for AI limitations
- Filler pleasantries ("great question!")

Escalation:
- Money questions -> @zaal
- Legal/contract questions -> @zaal
- Venue logistics -> @steve_peer
- Artist booking questions -> route to WaveWarZ bot or @zaal
```

### Event state ZAO Stock needs access to

- `~/portal-state/zao-stock-tasks.json` (volunteer task board)
- `~/portal-state/zao-stock-budget.json` (pledges + commitments)
- Google Calendar: ZAO Stock events calendar (already via `/vps` skill)
- Contact sheet: vendors, sponsors, artists (lives in BRAIN/people per doc 460)
- Countdown: Oct 3 2026 hardcoded in persona file as the anchor date

### Tone QA

Every reply passes Haiku guardrail: "Does this reply match ZAO Stock tone and content (warm, local, practical)? Score 0-10." Regenerate once if <7, then silence.

---

## Part 5 — Planning Bot (WaveWarZ)

### Reference tools

| Tool | Planning primitive | Useful for WaveWarZ |
|------|-------------------|--------------------|
| Linear | Issues + cycles | Sprint concept for battle prep |
| Motion | AI calendar | Auto-reschedule when battles move |
| Reclaim | Personal priorities | Less useful (personal, not team) |
| Tweet planners (Buffer AI) | Content calendar | Useful for pre-battle hype schedule |
| Airtable | Kanban with views | Overkill; local JSON suffices |

### WaveWarZ bot scope

Planning-first means the bot doesn't just hype — it **organizes**:

- **Battle calendar** — when's the next battle, who's in it, what stage (announcement / voting / finale)
- **Artist pipeline** — which artists are in queue, contracts status, readiness
- **Sprint board** — what ships this week (rules change, bracket UI, prediction market fix)
- **Hype schedule** — auto-proposed 3-post arc leading into each battle (T-5d announce, T-2d teaser, T-0 go-live)

### Tools the bot needs

- `~/portal-state/wavewarz-plan.json` — sprint tasks, owner, status
- `~/portal-state/wavewarz-battles.json` — calendar of upcoming battles with metadata
- Read access to `src/lib/wavewarz/` (repo) — latest rules, bracket state
- `gh pr list --label wavewarz` — what's shipping
- Farcaster: post hype via Neynar (shared with Magnetiq bot — both use app FID 19640)

### Slash commands

```
/battle next            -> "Sun Apr 27 — Scary vs Stormy, 8pm ET"
/battle announce <id>   -> drafts announcement post (warm tone), Zaal taps send
/sprint new <name>      -> creates a new 1-week sprint
/sprint add <task>      -> adds to current sprint
/artist queue           -> lists artist pipeline status
/hype schedule <battle> -> proposes 3-post schedule + inline approve buttons
```

---

## Part 6 — Research Bot (replaces Context bot)

### Two modes

**Mode A: Reactive (on-demand)**
```
In any group: /research zora protocol music royalties
  -> bot acks "[RESEARCH] running /zao-research — back in ~3 min"
  -> spawns AO session with /zao-research skill + topic
  -> session writes doc N+1 to research/ dir + opens PR
  -> bot posts "[RESEARCH] doc 467 ready — <300 word abstract> — PR: <url>"
```

**Mode B: Proactive (ingestion)**
```
Cron every 1h:
  - Fetch configured RSS feeds (per /.cache/zoe-telegram/rss-feeds.yaml)
  - Fetch new emails labeled @zaoclaw_action via Composio Gmail
  - For each item: Haiku classifies (relevance_score per brand bot, summary 3 sentences)
  - If score > 0.7 for a brand -> post to that brand's group: "[HEADS UP] <title> — <summary> — <link>"
  - If score > 0.9 AND topic matches a past research doc -> propose an UPDATE via /zao-research
  - Every item appended to ~/.cache/zoe-telegram/research-intake.jsonl for later review
```

### Reference tools

| Tool | Pattern borrowed |
|------|-----------------|
| Perplexity Spaces | Scoped knowledge spaces per topic |
| Exa neural search | Pre-index sources Zaal trusts; query by vibe not keyword |
| Consensus | Extract structured claims with confidence |
| Elicit | Auto-summarize with cited evidence |
| Undermind | Multi-step research agent that plans + searches + synthesizes |

### Dedupe

- RSS: store `last_seen_guid` per feed in `~/.cache/zoe-telegram/rss-state.json`
- Email: track by `Message-ID` header
- Research doc collisions: before creating a new doc, check if existing doc number in the index has title similarity > 0.8 via Haiku — if yes, propose update not create

### Budget

- `/research` is bounded by AO spawn budget ($5/PR default, can raise to $10 for long reports)
- Ingestion cron: Haiku-only classification, ~$0.01 per 100 items. Negligible.

---

## Part 7 — Cross-Learning Schema

### The file

`~/openclaw-workspace/shared-insights.jsonl` — append-only, synced nightly to private `zao-agents-memory` repo.

### Entry schema

```json
{
  "id": "ab12cd",
  "discovered_at": "2026-04-21T14:22:00Z",
  "agent": "zao-stock",
  "confidence": 0.87,
  "insight": "Steve Peer prefers 7am ET check-in calls, not afternoon. Noted across 3 separate events.",
  "tags": ["person:steve_peer", "event:zao_stock", "preference"],
  "source_events": ["conv-123:turn-45", "conv-124:turn-12", "conv-131:turn-3"],
  "promoted_by": "zoe-nightly-consolidation",
  "promoted_at": "2026-04-22T03:05:00Z"
}
```

### Promotion rules

1. Each bot writes candidate insights to its OWN `~/.cache/zoe-telegram/<bot>/candidates.jsonl` during normal operation (whenever its guardrail detects a "learnable" pattern — e.g. "user corrected me on X 2x in a row").
2. ZOE runs a **nightly consolidation** cron (2am ET, Claude Haiku): reads all bots' candidates, clusters by tag + content similarity, scores confidence, writes approved insights to `shared-insights.jsonl`.
3. Each bot reads the **tail 200 lines** of `shared-insights.jsonl` as part of its system prompt. So insight from Magnetiq bot about SAPS-fit ideas becomes available to ZAO Stock bot tomorrow.
4. Conflicts (two insights contradict) are flagged to Zaal for resolution via Telegram — not auto-resolved.

### Thresholds

- `confidence >= 0.8` AND `source_events >= 2` -> promote.
- `confidence >= 0.95` AND `source_events >= 1` -> promote (high-signal single occurrence, e.g. Zaal explicitly corrects).
- Insights decay: any insight not re-referenced in 90 days flagged `stale`, demoted from system prompt but retained in archive.

---

## Part 8 — Model Assignment Matrix

| Bot | Default reply model | Heavy-task model | Classification / guardrail | Reasoning |
|-----|--------------------|-----------------|----------------------------|-----------|
| ZOE (private DM concierge) | Opus 4.7 | Opus 4.7 | Haiku 4.5 | High-judgment work, Zaal-only audience, worth the premium |
| Magnetiq bot | Sonnet 4.6 | Opus 4.7 (new magnet design session only) | Haiku 4.5 | Tone + SAPS nuance needs Sonnet; Opus only when co-designing new Magnet with Zaal |
| WaveWarZ bot | Sonnet 4.6 | Sonnet 4.6 | Haiku 4.5 | Planning needs structure, not deep reasoning; Sonnet covers it |
| ZAO Stock bot | Sonnet 4.6 | Sonnet 4.6 | Haiku 4.5 | Conversational warmth is Sonnet sweet spot; Haiku too terse |
| ZAO Devz bot | Haiku 4.5 (chat acks) | Opus 4.7 (inside AO session) | Haiku 4.5 | Chat is just acks; the real work is in AO's Claude Code session |
| Research bot | Sonnet 4.6 (post-to-chat digest) | Opus 4.7 (via /zao-research skill) | Haiku 4.5 | Digest writing = Sonnet; full research = Opus via skill |

Projected daily cost at steady state (10 replies/bot + occasional heavy):
- Haiku classifications: ~$0.05/bot/day
- Sonnet replies: ~$0.15/bot/day
- Opus heavy tasks: ~$1-3/day across whole fleet
- **Total: ~$5-8/day at steady state.** Well under $300/mo. Compare all-Opus: ~$30-50/day.

---

## Part 9 — Safety Floor (minimum to ship)

Before ANY branded bot posts in a group Zaal doesn't fully control:

| Control | File | Difficulty |
|---------|------|------------|
| `ALLOWED_USERS` + `ALLOWED_GROUPS` env vars per bot | `bots/<name>/.env` | 1/10 |
| Rate limit 3 replies/user/5min per group | `bots/<name>/rate-limit.js` (shared module) | 2/10 |
| Haiku post-reply tone check (>=7/10 or regenerate once then silence) | `bots/<name>/guardrail.js` | 3/10 |
| Circuit breaker: >=5 guardrail rejections in 24h -> read-only mode + Telegram alert to Zaal | `bots/<name>/circuit.js` | 3/10 |
| Input sanitization: Haiku pre-screen for jailbreak patterns | `bots/<name>/pre-screen.js` | 3/10 |
| Fact-check high-stakes claims (numbers, addresses, dates) against local data | optional Phase 2 | 5/10 |
| `editMessageText` clawback within 48h window | needed if fact-check catches after-post | 4/10 |

**Phase 1 ships items 1-5. Items 6-7 in Phase 2 once real failures surface.**

---

## Part 10 — Rollout Plan (Approach 1 -> 2 -> 3)

### Week 1 — ZAO Devz first (testbed)
- `bots/zao-devz/` directory: persona.md, triggers.yaml, bot.mjs, guardrail.js, rate-limit.js
- Ship to ONE trusted private group first (not public).
- Rate limits tuned low, budget capped at $5/PR, 3 PRs/day fleet-wide cap.
- Zaal is only approver; PRs don't auto-merge.
- Learn failure modes.

### Week 2 — Research bot + portal `/bots` status page
- Ship Research bot. Reactive `/research` first, add proactive RSS/email in Week 3.
- Portal `/bots` status tiles (posts today / rate limit / last trigger).
- Use events.jsonl from doc 465 Part 2 as data source.

### Week 3 — ZAO Stock bot
- Most conversational — needs most persona tuning + tone guardrail iteration.
- Ships to the private volunteer group first.
- Hook to Google Calendar for event reminders.

### Week 4 — Magnetiq bot
- Persona file includes full SAPS framework + 5 Magnet concepts from Part 2.
- Ships to `#zabal-connector` (new Telegram group Zaal creates).
- No API = pure idea-generator + reminder engine. Post Magnet links Zaal pre-created in admin.

### Week 5 — WaveWarZ bot
- Planning tools: wavewarz-plan.json + battle calendar.
- Ships to WaveWarZ team private group.

### Week 6 — Portal Approach 2 upgrade
- Persona editor in portal (textarea per bot)
- Approval queue (draft posts awaiting tap)
- Cross-learning inspector (tail shared-insights.jsonl)

### Month 2 — Promote ZAO Devz to Approach 3 (AO-native)
- ZAO Devz becomes an AO-session-backed bot: persistent worktree, full Claude Code toolbelt, visible at ao.zaoos.com.
- Eliminates the spawn-per-task overhead; keeps context across many tasks from the same user.
- Other bots stay on Approach 1+2 until usage proves they'd benefit.

### Month 3 — cross-learning activation
- Nightly consolidation cron (ZOE) runs, promotes insights, syncs to zao-agents-memory repo.
- Sharing starts small — just tags like `person:`, `event:`, `preference:`.

### Quarter — graduate other bots to AO-native as needed
- If ZAO Stock starts needing tools beyond Telegram I/O (calendar write, contact-sheet write, image gen), promote to Approach 3.
- Magnetiq/WaveWarZ likely stay on Approach 1+2 indefinitely — they're simpler.

---

## Part 11 — Infra Surface Already Built vs Needed

### Built (tonight's PRs + prior)
- bot.mjs template with sent-tips + conv buffer + inline keyboards + callback handling + setMyCommands (PRs #253/#254)
- spawn-server.js `/api/spawn-agent` with allowlist + security hardening (doc 463)
- session-watcher.mjs to correlate AO sessions with PRs (PR #254)
- Caddy auth for `*.zaoos.com` (existing)
- ao.zaoos.com with Next.js UI at port 3000 + WS mux at port 14801
- portal.zaoos.com/todos with spawn-from-todo button
- Portal cookie auth (shared across subdomains)

### Need to add
- Bot fleet orchestrator: script that starts N bot.mjs processes in separate tmux sessions, each with its own token + persona
- Per-bot persona.md + triggers.yaml files under `bots/<name>/`
- Shared modules: `rate-limit.js`, `guardrail.js`, `circuit.js`, `pre-screen.js`, `model-router.js`
- `shared-insights.jsonl` + nightly consolidation cron
- Portal `/bots` page (HTML + backend in spawn-server.js)
- Approval queue backend (JSON file with pending drafts, bot polls for approved items)
- RSS feed poller + email Composio wrapper for Research bot proactive mode
- `zao-agents-memory` private GitHub repo for shared-insights sync

---

## Comparison: Branded bot substrate

| Option | Process model | Persistence | Cost/bot/month | Speed to ship | When to pick |
|--------|---------------|-------------|----------------|---------------|--------------|
| **A — bot.mjs clone** (Approach 1) | One Node process per bot via tmux + watchdog | Stateless LLM calls, state in files | ~$2-5 | 3-5 days | Default for all bots initially |
| **B — AO session per bot** (Approach 3) | One Claude Code session per bot in worktree | Persistent Claude Code context (long-running) | ~$50-200 (persistent Opus sessions) | 5-7 days/bot | Only when bot genuinely needs toolbelt (ZAO Devz month 2) |
| **C — Single orchestrator routing N personas** | One bot.mjs, persona switched by group_id | Shared conv buffer keyed by group_id | ~$2 | 2-3 days | SKIP — couples failure modes, kills per-bot observability |
| **D — Telegram webhook + serverless function** | Vercel/Cloudflare function fires per message | Stateless, state in Supabase/KV | $0-5 | 3-5 days | SKIP — VPS already runs; serverless adds complexity for no gain |

Verdict: **A for Phase 1, B only for ZAO Devz in Month 2+**.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Bots planned | 5 (Magnetiq, WaveWarZ, ZAO Stock, ZAO Devz, Research) |
| ZAO OS active members | 188 (per project memory) |
| ZAO Stock event date | 2026-10-03 (Oct 3, Franklin St Parklet, Ellsworth) |
| ZAO Stock budget range | $5-25K (Wallace Events tents committed ~$8.2K approx) |
| Fleet daily projected cost (Haiku+Sonnet mix) | $5-8/day steady state |
| Fleet daily cost if all Opus | $30-50/day (avoided) |
| All-Opus savings via tiered routing | 40-70% |
| Telegram `editMessageText` window | 48h hard cap |
| Telegram `callback_data` max bytes | 64 |
| AO spawn default budget | $2/task (raise to $5 for Devz coding, $10 for long research) |
| Rate limit per user per group | 3 replies / 5 min |
| Circuit breaker threshold | 5 guardrail rejections / 24h |
| Cross-learning promotion confidence | >=0.8 with >=2 sources, or >=0.95 with 1 |
| Insight decay window | 90 days |
| Magnetiq deck version checked | v11, 2026-04-15 |
| Magnetiq API availability | NONE (bot is link-poster + idea-generator only) |
| Magnetiq SAPS pillars | 4 (Status, Access, Power, Stuff) |
| Magnet programs proposed (Part 2) | 5 |

---

## ZAO Ecosystem Integration

New directory structure:
- `bots/<name>/persona.md` — tone, boundaries, examples, forbidden
- `bots/<name>/triggers.yaml` — enabled trigger types + thresholds + rate limits
- `bots/<name>/bot.mjs` — Node entry, thin wrapper around shared `bot-core.mjs`
- `bots/<name>/.env` — bot-specific token, ALLOWED_USERS/GROUPS, model overrides
- `bots/_shared/bot-core.mjs` — shared bot.mjs core extracted from `infra/portal/bin/bot.mjs`
- `bots/_shared/rate-limit.js`, `guardrail.js`, `circuit.js`, `pre-screen.js`, `model-router.js`
- `bots/_shared/events.mjs` — emit() helper (doc 465 Part 2)
- `infra/portal/bin/fleet-supervisor.sh` — starts all bots in tmux
- `infra/portal/caddy/portal/bots.html` — portal `/bots` page
- `~/openclaw-workspace/shared-insights.jsonl` — cross-learning store
- `~/.cache/zoe-telegram/<bot>/` — per-bot runtime cache

Related docs in library:
- Doc 229 — ZAO member profiles (data source for persona context)
- Doc 234 — OpenClaw guide
- Doc 236 — autonomous consolidation pattern (Part 7 cross-learning inherits this)
- Doc 256 — ZOE agent factory vision (branded bots = factory V1)
- Doc 289 — chat UX patterns (inline keyboards, quick-reply chips)
- Doc 325 — ZABAL agent swarm (the in-app VAULT/BANKER/DEALER trio — separate stack)
- Doc 460 — agentic stack master (this doc implements Layer 3b Specialists + new "Branded Bots" sublayer)
- Doc 463 — portal security audit (allowlists already in place)
- Doc 464 — reply-context + ship-PR loop (shipped, foundation)
- Doc 465 — observability + dispatch hardening (this doc builds on model routing + events)

---

## Sources

- [Magnetiq Partner Deck v11 (2026-04-15)](https://www.canva.com/design/DAHG-he-Zpc/liytqMfA5jfBHK2vXavEKw/view) — body content blocked, title + user-pasted summary only
- [Aider (code editor AI)](https://aider.chat/)
- [OpenHands / AllHands AI](https://github.com/All-Hands-AI/OpenHands)
- [Devin by Cognition AI](https://www.cognition.ai/)
- [Partiful](https://partiful.com/)
- [Luma AI events](https://lu.ma/)
- [ElizaOS — character / Rooms / Worlds model](https://docs.elizaos.ai/)
- [Virtuals Protocol](https://app.virtuals.io/)
- [Mem0 multi-agent memory](https://mem0.ai/blog/multi-agent-memory-systems)
- [OWASP Prompt Injection cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
- [Anthropic Claude Code GitHub Actions guide](https://docs.claude.com/en/docs/claude-code/github-actions)
- [Telegram Bot API 8.3](https://core.telegram.org/bots/api)
- [Linear method (planning cadence)](https://linear.app/method)
- [Undermind / Exa / Consensus research agents](https://undermind.ai/) (pattern references)
- ZAO internal: `infra/portal/bin/bot.mjs`, `infra/portal/bin/spawn-server.js`, `scripts/zoe-learning-pings/random_tip.py`

---

## Next Action

1. Confirm **ZAO Devz first, private testbed group** as Week-1 target.
2. Create `bots/` directory scaffold + extract `bot-core.mjs` from current `infra/portal/bin/bot.mjs` so clones share ~80% of code (DRY).
3. Write ZAO Devz persona.md + triggers.yaml + rate/guardrail/circuit shared modules.
4. Ship to testbed Telegram group, dogfood 3-5 days.
5. Iterate, then fan out per the Rollout Plan.

Design spec (from brainstorming session) will go at `docs/superpowers/specs/2026-04-21-zao-bot-fleet-design.md` per skill instructions. This research doc (466) is the input to that spec.
