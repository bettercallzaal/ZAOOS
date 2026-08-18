# Design: ZAAL BOTZ Fleet Interface - Lane-to-Topic Routing + Flows

**Doc 2314** | **Status:** LOCKED (Zaal grill 2026-08-17) | **Owner:** Claude Code | **Phase:** 1a + 1b design, 1c build

---

## Doctrine (Zaal 2026-08-17)

**ZAAL BOTZ topics = THE fleet interaction surface. ZOE DM = pinned messages only.**

The fleet does not dispatch directives, ask permission, or poll status via DMs. All fleet-wide work flows through topics in the ZAAL BOTZ group. ZOE DM stays for one-off pins (a decision just made, a decision that changed, "read this new rule"). This boundary exists to prevent remote-control takeover of the fleet: a hacked topic is damage to one lane; a hacked DM is a compromised operator.

---

## Executive Summary

ZAAL BOTZ topics are the nervous system of the fleet. This design wires four message flows (lane handoffs, needs-you questions, PR-opened notices, morning fleet digest) through Telegram forum topics routed by lane + brand via a `topics.json` registry. Replies flow back through an existing qid-based answer mechanism (questions.ts), NOT a new remote-control bus. A thin `zao-tg <topic> "msg"` CLI on the terminal side makes topics reachable from scripts the same way `zao-ask` reaches the question bridge. Noise is controlled via per-flow caps and loud failures, never silent drops.

---

## Before vs. After

### Before

- Lane-to-fleet communication exists piecemeal: zao-ask (questions only), zao-relay (terminal-to-terminal), relay-bridge (TG bridge for relays), individual threads in chat. No unified surface.
- Morning briefing, handoff notifications, PR-opened alerts all post to ZOE DM, flooding it with fleet-wide work. ZOE DM reads as a command bus.
- Needs-you questions are all routed to "Claude Code" topic (a catch-all). No lane identity or per-topic workflow.
- No terminal CLI for posting to topics directly.

### After

- Four flows (handoffs, needs-you, PR-opened, morning digest) each route to a specific topic determined by lane + brand via `topics.json`.
- Replies route back through the qid bridge (questions.ts), maintaining context and lane identity.
- `zao-tg <topic> "msg"` CLI lets any script post to a topic, with the same SSH-wrapper pattern as zao-ask (git-tracked in zaal-dotfiles).
- ZOE DM clears to pinned messages only (decisions, rule changes, high-stakes interrupts).
- Per-flow rate discipline ensures a topic that fires constantly stops being read (noisy-signal-guard).

---

## Design Details

### 1. Lane-to-Topic Routing via topics.json

**Source of truth:** `bot/src/zoe/topics.ts` (file:line 1-50)

The `topics.json` registry lives at `~/.zao/zoe/topics.json` (private-instance config, doc 1025) and maps topic names to Telegram forum message_thread_ids. Standard topics are pre-seeded by `/inittopics` (bot/src/zoe/index.ts file:line 531-566).

Current STANDARD_TOPICS (bot/src/zoe/topics.ts file:line 16-28):
```
Research, ZOL, Handoffs, Claude Code, Farcaster, Coding, Ideas, Learn, Newsletter, WaveWarZ, ZABAL Games
```

**Lane-to-topic routing rule:** Each lane posts based on its BRAND context (e.g. a ZABAL Games lane posts to "ZABAL Games" topic, a WaveWarZ lane posts to "WaveWarZ"). Generic fleet-wide events (morning digest, stale-capture nudges) post to "General" (reserved, created on first inittopics run - see Phase 1a).

**Addition to topics.json:** 
```json
{
  "Research": 2,
  "ZOL": 3,
  "Handoffs": 4,
  "Claude Code": 5,
  "Farcaster": 6,
  "Coding": 7,
  "Ideas": 8,
  "Learn": 9,
  "Newsletter": 10,
  "WaveWarZ": 11,
  "ZABAL Games": 12,
  "General": 13
}
```

**Routing logic:** A flow determines the topic name from lane context (BRAND, or "General" for fleet-wide), then resolves the thread_id via `getTopicThread()` (bot/src/zoe/topics.ts file:line 47-49). Posts target that thread_id.

---

### 2. Four Core Flows

Each flow has an exact trigger, payload shape, and which existing ZOE module it extends.

#### 2a. Lane Handoffs → Handoffs Topic

**Trigger:** `surfaceNewHandoffs()` in bot/src/zoe/handoffs-surface.ts runs on scheduler tick (every 1h, or on explicit handoff entry).

**Payload shape:**
```
[Lane Handoff]
lane: <lane-name>
owner: <user>
deadline: <due-date>
next: <the actual next step, 1-2 lines>
blocked-on: <what stops it, if any>
```

**Module extended:** bot/src/zoe/handoffs-surface.ts (existing module, no change needed - already posts handoffs; this design adds topic routing)

**Topic target:** "Handoffs" (thread_id from topics.json)

**Cap:** Max 1 per lane per day. Handoffs older than 2 days re-surface once. Enforcement: a handoff id maps to a message_id in the Handoffs topic; re-surface only if no message_id exists for today's lane.

---

#### 2b. Needs-You Questions with Buttons → Per-Topic

**Trigger:** Questions from zao-ask CLI (bot/src/zoe/questions.ts file:line 1-68) are posted to topics instead of to Claude Code topic hardcoded. Or from any internal flow that calls `sendQuestionToTopic()` (new helper).

**Payload shape:** Same as existing question keyboard (bot/src/zoe/questions.ts file:line 40-50), now routed by topic:
```
callback_data = "q:<qid>:<base64url(value)>"
```

**Module extended:** bot/src/zoe/questions.ts (existing question encoding/parsing unchanged), + new router in bot/src/zoe/telegram-routing.ts to resolve topic by lane/context before posting.

**Topic target:** Lane-specific brand topic (e.g. ZABAL Games lane → "ZABAL Games" topic), or "Claude Code" for neutral/unbranded questions.

**Reply route:** Answer captured via `parseQuestionCallback()` (bot/src/zoe/questions.ts file:line 53-67), qid logged to recent/ → inbox-bridge picks it up → session reads it. No change to reply mechanism.

**Cap:** Warn (don't block) if >3 open questions in a topic. Alert operator if a topic has >5 unanswered questions from >2 lanes (sign of a jammed flow).

---

#### 2c. PR-Opened Notices → Code-Relevant Topics

**Trigger:** GitHub webhook on PR creation (future; currently no GitHub integration to topics). First implementation: manual `/propen <pr#> <topic>` or auto-detect topic from PR branch name.

**Payload shape:**
```
[PR #NNN] <title>
branch: <branch>
changes: X files, +Y/-Z lines
reviewer: <assignee, if any>
linked-task: <task #, if PR body has "Fixes #NNN">
```

**Module extended:** New module bot/src/zoe/pr-router.ts (or wire into existing git hook if available).

**Topic target:** Inferred from PR branch name. If branch is `ws/zabal-*`, route to "ZABAL Games". If branch is `ws/research-*`, route to "Research". Fallback to "Claude Code".

**Cap:** Max 1 per lane per 2h. Dedup by PR #.

---

#### 2d. Morning Fleet Digest → General Topic

**Trigger:** 05:00 EST (09:00 UTC daily) - existing scheduler.ts cron (file:line 8).

**Payload shape:** Summary digest of:
- Open handoffs due today (Handoffs topic)
- Lanes waiting on you (from zj --needs-me equivalent over Supabase)
- PRs merged in the last 24h by lane
- New research docs published

**Module extended:** bot/src/zoe/brief.ts already generates morning briefing for DM; this design adds a "fleet digest" variant that posts to General topic instead.

**Topic target:** "General" (fleet-wide, no lane routing)

**Cap:** 1 per day, at 05:00 EST. Silent if no updates.

---

### 3. Reply Route: qid Bridge, NOT Remote-Control Bus

**Why not a remote-control bus (Zaal explicit 2026-08-17):** A directive-executing bus means "post `/zoe build foo` to a topic and ZOE fetches the message and runs it as a command." One URL injection into a topic = one command injection into the fleet. One hacked topic = fleet takeover. The qid bridge is safer: it answers a specific question that was asked, in a specific conversation, with a specific set of valid responses. Out-of-band commands cannot run.

**Reply mechanism (existing, no change needed):**
1. Question posted to topic with qid in callback_data (bot/src/zoe/questions.ts).
2. Zaal taps or types answer.
3. Telegram sends callback query (if button) or message (if freetext).
4. `parseQuestionCallback()` decodes qid + value (bot/src/zoe/questions.ts file:line 53-67).
5. Answer logged to recent/ with qid as key.
6. Inbox-bridge or orchestrator reads recent/ and posts next action to that lane/topic.

**For relay-reply specifically (internal fleet messages, not covered by this design but noted for completeness):** Relay-reply uses `relayReplyQid()` (bot/src/zoe/relay-bridge.ts file:line 68-72) to encode the target lane, then appends reply via `appendReply()` (file:line 64-66). Replies flow back through relay hub (tasks.legacy_id = 9000).

**Boundary:** Topics are READ by ZOE (for questions), not EXECUTED. ZOE posts to topics; it does not fetch and run commands from them.

---

### 4. Terminal Side: zao-tg CLI + Unread Indicator

#### 4a. zao-tg CLI

**Purpose:** Let any shell script post to a topic without SSH-round-tripping to the VPS. Thin wrapper, same pattern as zao-ask.

**Signature:**
```bash
zao-tg <topic-name> "<message>"
zao-tg --topic <topic-name> <message-file>   # post file contents
zao-tg --list                                  # list all topics + thread_ids
zao-tg --watch <topic>                         # tail a topic in real time
```

**Implementation:** Git-tracked bash script in zaal-dotfiles/bin/zao-tg (file to commit), wraps an SSH call to VPS ~/bin/zao-tg (the true implementation). VPS script resolves topic name → thread_id from ~/.zao/zoe/topics.json, calls grammy bot API to post.

**Error handling (loud, never silent):**
- Topic not found: exit 2, stderr "unknown topic: X"
- Message too long (Telegram 4096 char limit): exit 3, stderr "message > 4096 chars, truncating to last 4090"
- API rate limit: exit 1, stderr "Telegram rate limit, retry in Ns", sleep then retry once
- Network timeout: exit 1, stderr "connection timeout posting to X"

**Deployment:** zao-tg joins zao-ask in zaal-dotfiles/bin at commit time. VPS version installed by hand or CI deployment (same pattern as existing ~/bin scripts).

#### 4b. zj Unread-Reply Indicator

**Purpose:** Show which lanes have unanswered questions waiting on them in the morning wall.

**Implementation:** A small state file `~/.zao/zoe/unread-replies.jsonl` (append-only log, rotated daily) tracks:
```json
{"lane": "zaal-voice", "topic": "Claude Code", "qid": "foobar", "asked_at": "2026-08-17T05:00:00Z", "answered": false}
{"lane": "zabal-games", "topic": "ZABAL Games", "qid": "team-dig", "asked_at": "2026-08-17T09:30:00Z", "answered": true}
```

When `zj` runs, it reads this log and marks any lane with `answered: false` as needing-you. When an answer is logged (in recent/), the orchestrator marks the qid answered in unread-replies.jsonl.

**Alternative (if log file is overkill):** Ask ZOE to expose an endpoint `/api/zoe/pending-questions` that returns open qids per lane, and `zj` fetches it. This is simpler but adds a live API call; the file approach is offline-friendly.

**Phase 1 (this design):** Implement the file approach. Phase 2 (future): consider API endpoint if the file grows unwieldy.

---

### 5. Rate + Noise Discipline

**Rule (noisy-signal-guard.md):** A check that fires constantly stops being read. Apply per flow.

#### Caps by Flow

| Flow | Cap | Rationale |
|------|-----|-----------|
| Handoffs | 1 per lane per day | Same lane can't spam the same handoff |
| Needs-You Questions | Warn at 3 open, alert at 5+ unanswered | Prevents question pile-up in one topic |
| PR-Opened | 1 per lane per 2h | Dedup; most lanes don't open PRs that fast |
| Morning Digest | 1 per day at 05:00 EST | Single daily slot, silent if no updates |

#### Failure Discipline

Every send MUST report:
- On success: silent (no output), exit 0
- On rate limit: stderr "rate-limited; retry in Ns", exit 1, auto-retry once after N seconds
- On topic not found: stderr "topic <name> not in topics.json; run /inittopics", exit 2, DO NOT RETRY
- On API error (5xx): stderr "Telegram 5xx, manual check required", exit 1, no retry (operator intervention)
- On message too long: truncate to 4090 chars (leaving 6 for "..." suffix), post with "[...truncated]" suffix, exit 0 (soft fail, logged to operator dashboard)

**No silent drops.** If a post fails, it appears in ZOE's error log (~/.zao/zoe/error.log) and triggers a cost-governance alert (shouldFireAlert in scheduler.ts). Operator sees it within the hour.

---

## Existing Code Grounding

**questions.ts** (bot/src/zoe/questions.ts):
- `encodeQuestion()` (file:line 30-36): callback_data encoder, 64-byte cap
- `questionKeyboard()` (file:line 40-50): inline keyboard builder
- `parseQuestionCallback()` (file:line 53-67): decoder for tapped answers

**topics.ts** (bot/src/zoe/topics.ts):
- `STANDARD_TOPICS` (file:line 16-28): hardcoded topic list
- `readTopics()` / `writeTopics()` (file:line 33-44): file I/O for topics.json
- `getTopicThread()` (file:line 47-49): lookup thread_id by name

**scheduler.ts** (bot/src/zoe/scheduler.ts):
- Cron triggers: 05:00 EST morning brief (file:line 8)
- `claimFire()` (file:line 97-100+): idempotent trigger claiming (sentinel files)
- `runCockpit()` (file:line 24): existing cockpit runner
- `sendChunkedToTelegram()` (file:line 39): existing chunk sender

**relay-bridge.ts** (bot/src/zoe/relay-bridge.ts):
- `relayReplyQid()` / `laneFromReplyQid()` (file:line 68-79): qid encoding for relay replies (reference only; not used by topic flow)
- `markPushed()` (file:line 59-61): idempotent marking pattern (reference)

**handoffs-surface.ts** (bot/src/zoe/handoffs-surface.ts):
- Existing handoff surface generator; will be wired to post to "Handoffs" topic instead of DM

**index.ts** (bot/src/zoe/index.ts):
- `/inittopics` command (file:line 531-566): creates topics, stores in topics.json

---

## Architecture Decisions

### Decisions Made (Locked, Zaal 2026-08-17)

1. **Topics, not a bus.** Async, fire-and-forget, one-way. A topic can be read offline, forwarded, archived. A bus cannot. Topics scale to multiple readers (human, ZOE, future agents) without coordination.

2. **Lane routing by brand, not by assignment.** Who owns a lane? The lane itself declares its context (ZABAL Games, WaveWarZ, research). Routing follows that declaration. No ownership table to sync; no lane assigned to the wrong topic.

3. **qid bridge, not remote-control.** Replies route back through the existing question mechanism. No new command bus. Safer, simpler, proven.

4. **General topic for fleet-wide, reserved.** Some messages belong to all lanes (morning digest, fleet-wide nudge). One place, not a broadcast to every lane's topic.

5. **"Pinned messages only" in DM (future).** ZOE's DM is for one-off decisions ("decision: build X", "rule change: no silent fails"). Not a command bus. Not a briefing channel. This is Phase 2 enforcement (UI/UX work).

### Open Questions (Future Phases)

- **GitHub webhook routing:** Should PR-opened flow integrate with GitHub Actions / Vercel webhooks, or start with manual `/propen`? Phase 1 starts manual. Phase 2 explores webhook.
- **Reactions-API for approvals:** The board task mentions "thumbs-up=approve, checkmark=done" (Phase 1b). Scope: buttons (existing) vs. reactions (new). Phase 1b uses reactions.
- **Mini-app rendering:** "Telegram mini-app rendering the cowork board + cockpit via web_app buttons" (Phase 2). Needs separate UX design.

---

## Implementation Phases

### Phase 1a: Topics Foundation + General Topic (1 PR, ~4-6 days)

**Scope:** Add "General" topic to STANDARD_TOPICS. Update `/inittopics` to create it. Write integration tests for topics.json read/write.

**Owner:** Claude Code

**Deliverables:**
- `topics.ts`: STANDARD_TOPICS += "General"
- `index.ts` /inittopics: auto-create "General" on first run
- Tests: `topics.test.ts` with roundtrip (read, write, read)
- Commit: "feat: add General topic to ZAAL BOTZ"

**Entry criteria:** Design doc approved.
**Exit criteria:** `npm run test -- topics.test.ts` passes, /inittopics runs in test group.

---

### Phase 1b: Needs-You Questions Router + Reactions (2 PRs, ~5-7 days)

**Scope:** Wire questions to per-topic routing. Extend question keyboard to support reactions API (thumbs-up=approve, checkmark=done) in addition to buttons.

**Owner:** Claude Code

**Deliverables:**
- `telegram-routing.ts`: new module, `routeQuestionToTopic(lane, brand, qid, text, options)` resolves topic_name → thread_id, posts keyboard
- `questions.ts`: add `parseReactionCallback()` alongside existing `parseQuestionCallback()` (same qid, reaction type in value)
- Update scheduler / orchestrator to route Needs-You to topic instead of hardcoded "Claude Code"
- Tests: `question-routing.test.ts` with mock topics, button + reaction paths
- Commit: "feat: route needs-you questions to per-topic threads"

**Entry criteria:** Phase 1a merged.
**Exit criteria:** Tests pass. Manual test: ask question in ZABAL Games topic, verify thread_id resolves, buttons appear, reaction handling works.

---

### Phase 1c: zao-tg CLI + Terminal Integration (1 PR, ~3-4 days)

**Scope:** Write zao-tg script (Mac wrapper + VPS impl). Integrate with scheduler so handoffs, PR-opened notices route through it. Update zj to read unread-replies.jsonl.

**Owner:** Claude Code (or zao-builder if delegated)

**Deliverables:**
- `zaal-dotfiles/bin/zao-tg`: git-tracked bash wrapper (SSH to VPS)
- `~/bin/zao-tg` (VPS): resolves topic name, posts to thread_id, error handling loud + exit codes
- `bot/src/zoe/handoffs-surface.ts`: update to post to "Handoffs" topic via zao-tg (or via bot API directly if on same VPS)
- `zj` enhancement: read `~/.zao/zoe/unread-replies.jsonl`, mark lanes with open qids as needs-you
- Tests: script invocation with mock Telegram API
- Commits: "feat: add zao-tg CLI" + "feat: route handoffs to topic"

**Entry criteria:** Phase 1b merged.
**Exit criteria:** `zao-tg --list` works. `zao-tg Research "test message"` posts to Research thread. zj shows unread-reply indicator for lanes.

---

### Phase 2: Morning Digest + PR-Opened Flow (2 PRs, ~5-7 days)

**Scope:** Wire morning digest to post to General topic instead of DM. Add PR-opened flow (manual or webhook).

**Owner:** Claude Code

**Deliverables:**
- `bot/src/zoe/brief.ts`: add `generateFleetDigest()` alongside morning brief, posts to General topic at 05:00 EST
- `bot/src/zoe/pr-router.ts` (new): resolves branch name → topic, posts PR-opened notice
- GitHub Actions webhook handler (if available) or manual `/propen <#> <topic>` command
- Commit: "feat: morning digest to General topic" + "feat: PR-opened notices"

**Entry criteria:** Phase 1c merged.
**Exit criteria:** Morning digest posts to General at 05:00 EST. PR-opened notices appear in topic matching branch.

---

## Testing Strategy

**Unit tests:** questions.ts, topics.ts (pure functions, no network)
**Integration tests:** scheduler + topics (cron claim, idempotent posting)
**Manual tests:** `/inittopics` in test group, zao-tg --list, question keyboard in topic, morning digest at 05:00 EST

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Topic message limit (Telegram 4096 char) | Chunked sender exists; handoffs/notices already use it. PR-opened and digest may exceed; chunk in phase 2. |
| Message_thread_id changes if topic is deleted | topics.json becomes stale. Recovery: rerun `/inittopics` to regenerate. Document in runbook. |
| Rate limit on topic posts (Telegram ~30 msg/s per chat) | Unlikely for fleet ops (handful of posts/day per topic). If we hit it: add backoff in zao-tg, log to operator. |
| Lane routing ambiguity (a lane works on multiple brands) | Not a phase 1 problem. Phase 2 design: allow a lane to override default topic via `.zao/lane-topic.json` override. |
| Reactions API availability (Telegram API version) | Fallback to buttons only in phase 1b if reactions unavailable. Deprecate reactions in phase 2 if they become unreliable. |

---

## Doctrine (Restated)

> **"ZAAL BOTZ topics = the fleet interaction surface. ZOE DM = pinned messages only."**

The boundary matters:
- **Topics:** async, broadcast, searchable, forwwardable, archivable. Designed for work coordination.
- **DM:** synchronous, private, ephemeral. Designed for one-off decisions and pins.
- **No commands in topics.** Questions yes, directives no. A compromised topic is isolated damage; a compromised DM is fleet takeover.
- **No silent failures.** Every flow fails loud. Rate caps alert, not hide. Noise discipline prevents alert fatigue.

---

## Next Actions

| Action | Owner | Due | Notes |
|--------|-------|-----|-------|
| Approve design doc | Zaal | 2026-08-17 (locked) | — |
| Phase 1a PR | Claude Code | 2026-08-21 | Topics foundation, General topic, tests |
| Phase 1b PR | Claude Code | 2026-08-28 | Routing, reactions, questions |
| Phase 1c PR | Claude Code | 2026-09-01 | zao-tg CLI, handoffs, zj integration |
| Phase 2 PRs | Claude Code | 2026-09-15 | Digest + PR-opened |
| Runbook | Claude Code | 2026-09-15 | /inittopics, zao-tg, troubleshooting |

---

## Sources

**Board task:** ZAAL BOTZ fleet interface (Supabase cowork tracker, locked 2026-08-17)
**Code audit:** bot/src/zoe/{questions.ts, topics.ts, scheduler.ts, relay-bridge.ts, index.ts, handoffs-surface.ts}
**Scripts audit:** zaal-dotfiles/bin/{zao-ask, zj, lane-send}
**Rules:** agent-loops.md (rule 36: message = transport), noisy-signal-guard.md (signal must reach zero), vanishing-dependencies.md (scripts git-tracked)
