# Magnetiq brand-agent fit audit (2026-05-12)

## Brand reality (synthesized from research + transcripts)

Magnetiq is a **community engagement + analytics platform** founded July 2022 by Kaylan Sliney (CEO) + Tyler Stambaugh (COO). Operates 5 person team. Built on Flow blockchain (Dapper Wallet + NFT mementos). As of May 11, 2026, Tyler is **pivoting from "build your community" to "turn community vibes into data you can understand."** They are shipping a **batch-send feature** to reduce notification fatigue. Magnetiq's IRL proof-of-meet use case (QR scanning events, digital badges, living CRM) remains core; the pivot adds a data-insight layer on top. Team is now available for integration conversations with Zaal, hence the Telegram bot collaboration.

### Vision evolution: OLD positioning -> NEW positioning

- **OLD (generic, competitive dead-end):** "Build your community" — generic SaaS positioning that doesn't differentiate.
- **NEW (data-first, community organizer pain point):** "Turn community vibes into data you can understand" — frames Magnetiq as the analytics layer for events/engagement. Answers the question every organizer asks: "Am I wasting my time and money? Is this actually working?" (Doc 640)

### Stage

Pre-revenue or early-revenue (unconfirmed in transcripts). Zaal has access to Tyler but no contract/partnership finalized yet. Bot is exploratory dual-user research tool.

### Team

| Person | Role | Contact |
|--------|------|---------|
| Kaylan Sliney | Co-founder & CEO | (not on bot) |
| Tyler Stambaugh | Co-founder & COO | tyler@magnetiq.xyz (on Magnetiq group chat) |
| Caitlin | Tyler's collaborator | Not yet on group; noted in persona as "may join later" |

---

## Bot scope (what it ships TODAY per persona.md + commands.ts)

### Persona summary (5 bullets)

1. **Private collab tool only** — not a customer-support bot, not a community manager. Exists to help Zaal + Tyler figure out ZAO-Magnetiq integration in their shared scratch space.
2. **Terse, smart caveman voice** — no emojis, no em-dashes, quotes sources, asks clarifying questions one at a time. Speaks to both by first name.
3. **Magnetiq pivot-aware** — knows vibes-to-data positioning, batch-send feature in flight, notification fatigue problem, SAPS framework (from Doc 467).
4. **ZAO integration context** — understands Hermes pattern, ZOE agent, $ZABAL token, Empire Builder, Whop play (Doc 641), ZAOstock Oct 3.
5. **Refusal-hardened** — will not reveal env vars, push to git, deploy, run destructive commands, invent reward thresholds, or tag external people without approval. Boundary-aware for a dual-user bot.

### Commands available

| Command | Who | Effect | Budget |
|---------|-----|--------|--------|
| `/research <topic>` | allowlist (Zaal + Tyler) | Opus research pass, grep library, cite docs | $3.00 |
| `/idea <text>` | allowlist | Log idea to Supabase, persisted | Append-only |
| `/task <text>` | allowlist | Create closable task | Append-only |
| `/tasks` | anyone | List open tasks | Read-only |
| `/done <id>` | allowlist | Close a task | Append-only |
| `/clip <url> <note>` | allowlist | Log clip-worthy moment (URL + annotation) | Append-only |
| `/fact <statement>` | allowlist | Teach the bot a durable fact | Append-only |
| `/context` | anyone | Dump what bot knows (facts, tasks, allowlist, persona path) | Read-only |
| `/summary` | allowlist | Run daily summary now (also cron fires 06:00 ET) | $1.00 |
| `@mention` or reply | allowlist | Reactive chat reply, Sonnet 4.6 | $0.50 |
| `/help` | anyone | Show command list | Read-only |

### Cost guardrails

- **Chat mention reply:** Sonnet 4.6, $0.50/reply, soft cap on allowlist gated replies
- **`/research`:** Opus 4.7, $3.00/invocation, Sonnet too weak for research synthesis
- **Daily summary:** Opus 4.7, $1.00/cron, fires 06:00 America/New_York
- **Memory model:** Supabase `team_bot_*` tables (see `bot/migrations/team_bots.sql`)
  - `team_bot_messages`: every message logged 24h sliding window for context stitching
  - `team_bot_ideas`: append-only, never deleted
  - `team_bot_tasks`: open/closed state, tracked by UUID
  - `team_bot_clips`: URL + annotation pairs
  - `team_bot_facts`: durable statements that become part of system prompt

---

## Brand-fit deltas (gaps + over-builds + wrong notes)

### Gaps (brand has need, bot misses it)

| # | Brand need | Why bot misses it | Fix | Priority |
|---|-----------|-------------------|-----|----------|
| 1 | **Magnetiq's SAPS framework visibility.** Tyler frames ALL ideas through Status/Access/Power/Stuff (Doc 467 Part 2). Bot persona knows SAPS exists but has zero teaching/feedback on it. Bot should help Tyler + Zaal evaluate ideas through SAPS lens. | No `/saps <idea>` command. No SAPS framework in system prompt during chat replies. Bot can reference it but doesn't actively use it to structure analysis. | Add `/saps <idea>` command that returns a 4-part breakdown (Status: how does this idea increase collector rarity / visibility?; Access: new gating opportunity?; Power: reputation surface?; Stuff: digital or physical item). Feed into daily summary. Add SAPS-aware examples to persona.md. | P1 (core to new positioning) |
| 2 | **Batch-send feature tracking.** Tyler is shipping batch-send (UI + scheduling) to reduce notification fatigue. Zero mention of this feature's status, blockers, or cross-ZAO impact in bot persona. | Persona mentions it in "What you care about" but bot has no way to track progress, blockers, or propose validation paths. | Add `/feature batch-send <status>` command to log progress updates. Store in a new `team_bot_features` table. Nightly summary should surface feature blockers + ask for help. | P2 (useful for collaboration, not blockers) |
| 3 | **Whop integration spec is mentioned but not traced.** Doc 641 exists; Whop fee is 3% creator fee. Magnetiq bot should understand how Claude Code community on Whop + Magnetiq could sync. | Persona mentions Whop exists but bot has no understanding of Whop fees, API capabilities, or how a "Whop purchase -> Magnetiq badge" flow would work. | Add reference to Doc 641 Whop pricing + API capabilities in persona.md. When /research is called on Whop integration, bot should pull together how Magnetiq batch-send + Whop Discord role integration + $ZABAL token-gating could work together. | P2 (strategic, not immediate) |
| 4 | **Magnetiq's "am I wasting time/money?" question is not anchored.** The pivot hinges on answering this for organizers. Bot never asks clarifying questions that surface ROI, event attendance metrics, or engagement ratios. | Bot is reactive-only. No proactive question like "What metrics would prove batch-send works?" or "How will you measure whether the data-insight feature is moving the needle?" | No direct fix in current command set, but the daily summary should ask open questions about measurement. Persona should include 2-3 examples of how bot asks about ROI/metrics when Zaal mentions an event or campaign. Add to context-stitching prompt: "When Tyler or Zaal mention an event/campaign, ask one follow-up about how they'll measure success." | P2 (deepens collaboration) |

### Over-builds (bot does X, brand doesn't need it yet)

| # | Bot feature | Why premature | Recommendation |
|---|-------------|---------------|----------------|
| 1 | **Daily summary cron (06:00 ET every morning).** Bot fires a daily digest automatically. Tyler + Zaal might not have daily cadence yet; they're early exploratory conversations. | Premature automation. If Tyler is only in the group 2-3x per week, a nightly summary feels like noise. | Keep the feature but default to DISABLED via env var (`MAGNETIQ_SUMMARY_CRON=""` or comment out). Manual `/summary` invocation only until Zaal confirms daily cadence desired. No forced summary until sprint rhythm is locked. | Change default in bot/src/teams/README.md: "Daily summary defaults OFF for new bots. Enable via MAGNETIQ_SUMMARY_CRON=0 6 * * * once cadence confirmed." |
| 2 | **`/research` Opus budgeting at $3/invocation.** Opus is expensive. For early exploration, Sonnet might suffice. `/research magnetiq batch-send`` might only need Sonnet-level synthesis. | Over-provisioning early. As the bot matures, Opus makes sense. Today it's overkill. | Downgrade `/research` to Sonnet 4.6 for Magnetiq bot only. Pass `TEAMS_RESEARCH_MODEL=sonnet` in env for magnetiq. Raises `/research` budget ceiling to $1.50 (Sonnet cost), leaves $3 for eventual promotion to Opus when research scope expands. | Add per-bot model override capability in brain.ts + shared.ts (already supports `TEAMS_RESEARCH_MODEL` env but could be more granular). Document in README. |
| 3 | **Memory persistence for 7+ open tasks.** Bot can track arbitrary tasks. Tyler might only care about 1-2 Magnetiq-specific tasks (batch-send launch, Whop API review). Storing 7+ tasks pollutes the space. | Cognitive load. If bot suggests `/tasks` lists 12 items, only 1-2 are Magnetiq-specific; the rest are ZAO noise (ZAOstock, Hermes stuff). | Keep `/tasks` but add `/tasks filter:magnetiq` to surface only Magnetiq-related ones. Store a `domain` or `project` tag in the `team_bot_tasks` schema. Default filter = `*` but allow scoping. | Update `saveTask()` in memory.ts to accept optional `project` param. Add parsing to `/task Magnetiq: batch-send deadline` (colon syntax extracts project tag). Doc in persona. |

### Voice / persona drift

| # | Persona claim | Reality | Edit needed |
|---|---------------|---------|-------------|
| 1 | "Talk to both of them by first name (Zaal, Tyler)." | Persona correct. Commands are allowlist-gated. No issue. | NONE — voice is aligned. |
| 2 | "Tyler's batch-send feature in flight" (under "What you care about"). | TRUE per Doc 640, but zero detail on spec/deadline/blockers. Persona says bot KNOWS but bot has no /feature command to track it. | Add example in persona: `Tyler: batch-send blocking on Dapper API rate limits next Tues. @magnetiq /task Batch-send: wait on Dapper API response` -> bot confirms task logged. Adds specificity to persona. |
| 3 | "Magnetiq's new positioning: vibes-as-data, breadcrumbs, the 'am I wasting time/money?' question." | TRUE per Doc 640 call transcript. But persona never explicitly teaches the bot HOW to evaluate ideas through this lens. | Expand "Voice" section with 1 paragraph: "When Zaal or Tyler propose an event/activation, you frame it through vibes-as-data: 'How will we capture the vibe? What data surfaces from this? What question does it answer?' Always connect ideas back to ROI." Add 2 example replies to persona showing this framing. |
| 4 | "Whop integration (Greg Gonzales contact, 3% creator fee, Explorer distribution)". | TRUE per Doc 641. But bot's persona.md doesn't acknowledge Whop creator fees, doesn't mention Greg Gonzales by name, doesn't explain the Explorer algo weakness. | Update persona.md facts section to cite Doc 641 specifics: "Whop creator fee is 2.7% + $0.30 per transaction (domestic), Explorer discovery weak (req 30+ days social proof). Greg Gonzales is the Whop contact. ZAO-Magnetiq-Whop triangle: Whop Claude Code course -> onboard creators to ZAO, Magnetiq batch-send reduces fatigue, SongJam leaderboard tracks it all." |
| 5 | "You replace ad-hoc messaging. You are NOT a customer-support bot, NOT a community manager." | TRUE but bot's behavior doesn't actively enforce this boundary. If Tyler DMs `/idea how do we sell Magnetiq to enterprise accounts?` bot replies normally; it doesn't redirect to "that's sales strategy, outside this collab scope." | Add hard rule to persona: "If asked about sales process, enterprise pitch, competitor analysis, or anything outside ZAO+Magnetiq integration, say: 'That's outside the integration scope. Escalate to Kaylan or ping Zaal to re-scope the conversation.' Never invent sales strategy." |

### Missing brand facts the bot should know

| # | Fact | Source | Add to persona.md or seed in /fact |
|---|------|--------|-------------------------------------|
| 1 | Magnetiq is built on Flow blockchain (Dapper Wallet, NFT mementos). Mementos live on Flow, not Ethereum/Optimism/Base. Cross-chain bridge gap exists. | Doc 65 (MAGNETIQ section), Doc 467 Part 1 (No API section). | Add to persona.md facts section: "Magnetiq runs on Flow blockchain (Dapper Wallet, NFT mementos). ZAO OS lives on Ethereum/Optimism/Base. Cross-chain natively impossible until Magnetiq adds EVM support. Integration is currently link-based, not programmatic." |
| 2 | Magnetiq is pre-revenue or early-revenue. No public API (confirmed Zaal 2026-04-21, Doc 467). Bot cannot programmatically create Magnets, launch drops, or read analytics. Bot is idea-generator + reminder engine only. | Doc 467 Part 1 (No API section), Doc 640 (action items). | Add to persona.md boundaries: "Magnetiq has no public API. You cannot create Magnets, launch drops, or read analytics. You propose ideas + help Zaal schedule/announce drops he pre-creates in the Magnetiq admin. You are a thought partner, not an automation engine." |
| 3 | Kaylan Sliney is CEO/co-founder. Tyler is COO/co-founder. Caitlin is Tyler's collaborator (may join group later). But Tyler is the 1:1 with Zaal on this bot. | Doc 65 (Magnetiq Team table), bot/src/teams/index.ts (comment: "may be joined later by Caitlin"). | Add to persona.md: "This group = Zaal + Tyler. Kaylan (CEO) is not present. Caitlin (Tyler's collaborator) may join later. This is a COO-level product/integration conversation, not a board-level strategic one." |
| 4 | The "Zabal Connector" is the existing MAGNETIQ Magnet Zaal already created (at ETH Boulder). It tracks Proof-of-Meet for ZAO events. This is the TEMPLATE for future ZAO Magnets. | Doc 65 (Proof of Meet section), Doc 467 Part 2 (5 Magnet programs to launch, Magnet 1 is "The ZABAL Connector"). | Add to persona.md: "The Zabal Connector is Zaal's existing MAGNETIQ Magnet + template. It captures QR-scanned event attendance, badges, selfies. The bot's job is to help design 4-5 new Magnets using SAPS framework (Status, Access, Power, Stuff) + event lifecycle (announcement, reminder, QR, drop, analytics)." |
| 5 | Tyler's batch-send feature is specifically designed to reduce notification fatigue. Problem: organizers bombard attendees with announcements, fatigue kills retention. Solution: batch scheduler + "send email?" toggle. This is shipping. | Doc 640 (New features section). | Add to persona.md: "Batch-send is Tyler's in-flight feature to solve notification fatigue. Organizers want to fire multiple announcements at once, but not via email. UI: 'Send to everybody? Yes/No. Email? Yes/No.' This addresses a core pain point for community managers." |

---

## Recommended persona.md diff

**Current persona.md is solid but needs 3 key additions:**

### Edit 1: Expand "What you care about" (add SAPS + batch-send + Whop clarity)

```markdown
OLD:
- Magnetiq's new positioning: vibes-as-data, breadcrumbs, the "am I wasting time/money?" question
- ZAO's autonomous-agent stack (Hermes pattern, ZOE, $ZABAL token, Empire Builder)
- Whop integration (Greg Gonzales contact, 3% creator fee, Explorer distribution)
- ZAOstock Oct 3 2026 festival (flagship event)
- Tyler's batch-send feature in flight
- Cross-platform distribution patterns

NEW:
- Magnetiq's new positioning: vibes-as-data, breadcrumbs, the "am I wasting time/money?" question. Help Tyler + Zaal evaluate ideas through the SAPS lens (Status = collector rarity, Access = gating opportunity, Power = reputation, Stuff = items).
- Tyler's batch-send feature (in flight): scheduler to reduce notification fatigue. Ask about deadlines + blockers + rollout timeline.
- ZAO's autonomous-agent stack (Hermes pattern, ZOE, $ZABAL token, Empire Builder) + the Zabal Connector (existing MAGNETIQ Magnet template for event POA).
- Whop integration (Doc 641): Greg Gonzales contact, 2.7% + $0.30 per transaction creator fee, Explorer discovery weak (30+ day seeding), Claude Code course funnel to onboard creators to ZAO.
- ZAOstock Oct 3 2026 (flagship) + ZAOville July (pre-stock test). How will batch-send + SAPS Magnets amplify both?
- Cross-platform distribution: Magnetiq (IRL engagement) + Whop (digital creator funnel) + SongJam (leaderboard) + Empire Builder ($ZABAL rewards).
```

### Edit 2: Add hard rule about boundaries

```markdown
ADD after "Hard rules (refuse if asked)":

- Never propose sales/enterprise strategy beyond ZAO-Magnetiq integration scope. If asked "How do we sell Magnetiq to enterprises?" escalate: "That's outside the integration scope. Escalate to Kaylan or ping Zaal to re-scope the conversation."
```

### Edit 3: Add reference facts section

```markdown
ADD new section after "Reference docs":

## Reference facts (teach the bot via /fact or add here)

- Magnetiq is built on Flow blockchain (Dapper Wallet). ZAO OS is Ethereum/Optimism/Base. No native cross-chain bridge yet; integration is link-based, not programmatic.
- Magnetiq has no public API. Bot cannot create Magnets or launch drops programmatically. Bot proposes ideas + schedules/announces drops Zaal pre-creates in the admin.
- Kaylan Sliney = CEO (not on this group). Tyler Stambaugh = COO (1:1 with Zaal here). Caitlin = Tyler's collaborator (may join later).
- The Zabal Connector = Zaal's existing MAGNETIQ Magnet + template for future ZAO events (QR scanning, badge claims, selfie uploads, analytics).
- Batch-send is Tyler's feature to solve notification fatigue: multiple announcements, email toggle, fire all at once.
```

---

## Recommended new commands or command tweaks

| Command | Why | Spec |
|---------|-----|------|
| `/saps <idea>` | SAPS framework is core to Magnetiq's new positioning. Bot should structure every major idea through this lens. | **Usage:** `/saps Tyler wants to create a "Superfan Vault" tier drop for 100+ $ZABAL holders` **Reply (Sonnet):** `Status: collector rarity visible in leaderboard | Access: Tier-locked content only | Power: leadership signaling (top 100) | Stuff: exclusive drop (limited sticker sheet, private hour with Zaal) | Follow-up: who gets access first, token holders or attendees?` Sonnet cost, $0.20 budget, fast. |
| `/feature <name> <status>` | Tyler is shipping batch-send. Bot should track feature progress, blockers, validation. | **Usage:** `/feature batch-send Blocked on Dapper API rate limit increase, waiting Tue response` **Reply:** `Logged. Blocking other: (none logged). Unblock plan: if no response by Wed, escalate to Kaylan?` Stores in new `team_bot_features` table with UUID, status, blocker notes, updated_at. |
| `/magnet <name>` | Zaal will create 5+ SAPS Magnets (Doc 467 Part 2). Bot should cache + display their spec on demand. | **Usage:** `/magnet Fractal OG` **Reply:** `Magnet: Fractal OG | SAPS: Power + Status | Activations: (a) W91 voter claim, (b) first-time submitter bonus, (c) reconciler bridge | Next drop: TBD | Edit: /fact Fractal OG magnet is...` Requires manual seed via `/fact` or a reference file. Read-only. |
| `@magnetiq validate <idea>` | Proactive question + SAPS breakdown when Zaal or Tyler propose something. Shortcut for `/saps`. | **Usage:** `@magnetiq validate a live QR drop during ZAOstock Oct 3` **Reply:** `Status: attendee badge scans on-site | Access: event QR only, day-of | Power: "I was there" digital proof | Stuff: memento NFT + email list | Risk: QR code printing, on-site scanner setup. Validate plan?` Sonnet, $0.30 budget. |

---

## Memory schema suggestions

Current schema (team_bot_*) is solid. Three additions for Magnetiq-specific tracking:

### New table: `team_bot_features`

```sql
CREATE TABLE team_bot_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot TEXT NOT NULL, -- 'magnetiq' | 'attabotty'
  feature_name TEXT NOT NULL, -- "batch-send", "Proof of Meet v2"
  status TEXT NOT NULL, -- "in-flight" | "blocked" | "shipped"
  blocker_notes TEXT, -- free text, e.g., "Dapper API rate limit"
  validated_by TEXT, -- "zaal" | "tyler" | null
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Rationale:** Tracks Tyler's shipped/in-flight features so the bot can surface status + ask about validation. Daily summary highlights blocked features.

### New table: `team_bot_magnets` (optional, if Zaal creates many)

```sql
CREATE TABLE team_bot_magnets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot TEXT NOT NULL, -- 'magnetiq'
  magnet_name TEXT NOT NULL, -- "The ZABAL Connector", "Fractal OG"
  saps_status TEXT, -- "Status" | "Access" | "Power" | "Stuff" (comma-separated pillars)
  description TEXT, -- "Proof-of-attendance for ZAO events"
  first_activation TEXT, -- e.g., "ZAO Stock Oct 3"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Rationale:** Cache Magnetiq Magnet specs so `/magnet <name>` can reply instantly. Avoids re-typing.

### Extend `team_bot_tasks`

Add optional `project` field to filter tasks by domain:

```sql
ALTER TABLE team_bot_tasks ADD COLUMN project TEXT DEFAULT 'general';
-- Usage: /tasks filter:batch-send -> lists only project='batch-send' tasks
```

---

## Pre-launch checklist (Magnetiq-specific, before tokens land)

- [ ] Persona.md edits committed (SAPS, batch-send, Whop clarity, hard rule about scope).
- [ ] `/fact` seed Magnetiq-specific facts (Flow blockchain gap, no API, Tyler=COO, Zabal Connector template, batch-send goal).
- [ ] Tyler's allowlist ID confirmed (Zaal to run `/whoami` in the group + get Tyler's Telegram user_id).
- [ ] Caitlin's allowlist ID obtained OR placeholder (if she joins later, Zaal adds her via env var reload).
- [ ] Daily summary DISABLED by default (`MAGNETIQ_SUMMARY_CRON=""` in .env). Manual `/summary` invocation only until Zaal confirms cadence.
- [ ] Test `/research magnetiq batch-send` in local dev, confirm Sonnet cost is acceptable (<$1.50).
- [ ] Test `/saps <idea>` mock reply, ensure SAPS breakdown is clear (Status, Access, Power, Stuff, follow-up).
- [ ] Verify Supabase migration (`bot/migrations/team_bots.sql`) applied to prod (Zaal to confirm in Supabase console).
- [ ] Dry-run in Telegram group: Zaal sends `/whoami` -> bot replies with chat_id + his user_id. Tyler sends `/whoami` -> same.
- [ ] Read persona.md aloud to Zaal + Tyler in a 5-min async Telegram message review. Any corrections?
- [ ] Document in bot/src/teams/README.md that Magnetiq bot is **experimental / dual-user research mode**, not production yet.

---

## 3 highest-value next moves (ranked)

1. **Add `/saps <idea>` command + teach SAPS examples in persona.** This is THE core of Magnetiq's pivot. Bot should reflexively frame all ideas through Status/Access/Power/Stuff. This makes the bot useful immediately. Sonnet cost, $0.20 each, fast. Deliverable: 10 lines of commands.ts + 2 SAPS examples in persona.md. Time: 1 hour.

2. **Seed `/fact` base with Magnetiq realities (Flow blockchain, no API, batch-send goal, Zabal Connector template).** Right now the bot knows these via persona.md system prompt, but facts are the lever for Zaal + Tyler to CORRECT the bot later ("No, actually the Zabal Connector is deprecated"). Seeding facts makes the bot teachable. Zaal can run: `/fact Zabal Connector is the MAGNETIQ Magnet Zaal created at ETH Boulder, tracks POA for ZAO events, is the template for future Magnets` and the bot will never contradict. Deliverable: 5-6 /fact statements Zaal pastes into the group on day 1. Time: 15 min.

3. **Lock daily summary cadence with Zaal + enable/disable in env.** Right now summary fires every morning (06:00 ET). If Tyler is only in the group 2x/week, this is spam. Confirm: do they want daily summary, or manual `/summary` only? If daily, keep it. If not, set `MAGNETIQ_SUMMARY_CRON=""` in prod .env so it's DISABLED by default. This avoids noise while the collab is finding rhythm. Deliverable: 1 conversation + 1 env var tweak. Time: 10 min.

---

## Appendix: Magnetiq brand context for future reference

**Canonical positioning (May 2026):** "Turn community vibes into data you can understand."

**Problem:** Organizers (like Zaal) run events, reward people, engage them deeply. They ask: "Am I wasting my time and money? Is this actually working?" Magnetiq's answer = quantify the vibes.

**Core product:** Flow blockchain NFT badges (Dapper Wallet) + QR event scanning + analytics dashboard. In-flight: batch-send feature to reduce notification fatigue.

**ZAO integration thesis:** Zaal runs 188 members + monthly fractals + ZAOstock Oct 3. Magnetiq can wrap each event/milestone in a SAPS Magnet (proof-of-meet badge, power signal, gating opportunity, exclusive drop). Batch-send coordinates announcement flow across all 5 Magnets. Data anchor = Magnetiq dashboard shows event attendance + engagement + retention.

**Blockers:** Magnetiq has no public API (Flow blockchain NFTs are not EVM-native). Integration is link-based today. ZAO-Magnetiq funnel = Zaal admin-creates Magnets, bot announces QRs, attendees scan on-site.

**Whop synergy:** Zaal is building Claude Code community on Whop (for digital creators). Magnetiq batch-send + Whop Discord role assignment = creator gets badge on Magnetiq after Whop purchase. SongJam leaderboard tracks both (Whop sales + Magnetiq badge claims). Cross-platform awareness loop.

