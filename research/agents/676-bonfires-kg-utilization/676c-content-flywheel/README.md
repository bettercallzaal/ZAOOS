---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 533, 620, 665, 669, 673, 676
tier: STANDARD
parent-doc: 676
---

# 676c — Content Flywheel: ZABAL Bonfire KG to Published Content

> **Goal:** Specify how team work (captured in ZABAL Bonfire as 780 episodes) becomes published content—HyperBlogs, newsletters, and social posts—with minimal human editorial overhead. The flywheel: **team works > bonfire captures it > synthesis turns it into HyperBlog > that seeds newsletter > newsletter drives community > community does more work.**

---

## Key Decisions (no preamble)

| Decision | Action | Why |
|---|---|---|
| **Bonfire synthesis happens on-demand, not auto-scheduled** | ON-DEMAND via `bonfire kengram batch --canvas --sync` after completion | Weekly (Monday 11:30am cobuild) or after major ship (PR merged, ZAOstock milestone). No silent publishing to maintain editorial voice integrity. Scheduled auto-synthesis deferred to Q3 once Zaal locks content-quality bar. |
| **Newsletter pulls "this week" data from bonfire query** | YES, semi-automatic | Replace hand-recall in `/newsletter` skill with structured bonfire query: `completed_tasks[date > 7d-ago] + decisions[date > 7d-ago] + shipped_prs[date > 7d-ago]`. Query run pre-draft; Zaal reviews draft before publish. |
| **HyperBlog as single source of truth for "what ZAO shipped"** | YES | synthesis-frontend already polls every 60s + renders HyperBlogs per-bonfire (source: doc 673b). Once generated, the HyperBlog IS the digests. Social posts + newsletter can link to / quote it. No duplicate work. |
| **Social posts draft from weekly digest, not auto-generate** | DRAFT from digest, review by Zaal, then publish via socials skill | Zaal currently delays social publishing (per feedback_social_pipeline_priorities_may6). Bonfire digest feeds the draft queue. `@zabal_bonfire` Telegram bot can relay digest headlines daily; Zaal decides what threads to expand. |
| **Voice guard: /newsletter skill governs all auto-drafted content** | YES | Newsletter skill already has 11 voice rules (no emojis, no em-dashes, lowercase casual, first-person). Any bot that drafts bonfire-sourced content (social posts, digests) must run through voice-reference.md or get Zaal's sign-off. |
| **HyperBlog metadata: track by $KNOW incentive tier** | DEFER TOKENOMICS | Bonfires SDK supports `$KNOW earnings` per HyperBlog if bonfire owner enables knowledge-network tier. Zaal has Genesis tier access but hasn't opted in. Defer incentive-wiring until Bonfires revenue model clarifies (Doc 620 cost model = $50/mo baseline). |
| **Privacy gate: only Zaal's captures + team @mentions cross-publish** | YES, mandatory redaction layer | ZOE writes `episode` nodes with `source: 'dm'`. Filter: `source IN (dm, bridge)` + `author IN (Zaal, ZAOcoworkingBot, ZAOstockTeamBot)` before synthesizing. DM-only captures = personal, redact on push (doc 620c pattern). |
| **Failure mode: if bonfire API is down, newsletter falls back to hand-crafted agenda** | GRACEFUL DEGRADE | Newsletter agent calls bonfire query with 3s timeout + Promise.race(). If timeout, output: "Bonfire unreachable; Zaal provided agenda below:" + Zaal's typed input. No blocking. |

---

## Architecture: 4-Stage Flywheel

```
STAGE 1: CAPTURE          STAGE 2: SYNTHESIS      STAGE 3: PUBLISH       STAGE 4: AMPLIFY
                          (on-demand, Mon 11:30)  (draft → Zaal → ship)  (social threads)
                          
Team work ------\
(PRs, tasks,    |
 decisions)     |----> Bonfire KG           HyperBlog              Newsletter draft
                |       780 episodes        (synthesis-         + 3-4 social post
ZOE captures    |       (indexed by date,   frontend renders)     variants in /socials
(daily)         |        author, topic)                          skill queue
                |
Cowork bot    --/        Filter:            Link:
(team actions)           completed_tasks    "This week in ZAO"
                         + decisions        [hyperblogs.bonfire
GitHub PRs                + shipped_prs     s.ai/track]
(via webhook,   (future)
doc 620)

                                                                   Community sees
                                                                   digest > feels
                                                                   momentum > ships
                                                                   next task
```

---

## Concrete Implementation Spec

### Stage 1: Capture (Status: LIVE)

**Current inflow (daily):**

| Source | Frequency | Node type | Volume | Location |
|--------|-----------|-----------|--------|----------|
| ZOE concierge (Telegram DM) | ~5-10/day | `episode` (type: decision, reflection, task_outcome) | 50-100/week | `bot/src/zoe/recall.ts` line 27: `mirrorTurn()` writes captures after each turn |
| ZAOcoworkingBot (team actions) | ~3-8/day | `episode` (type: task_outcome) | 30-50/week | `bot/src/zoe-coworking-bot/index.ts` (VPS 1): logs `/add` + `/done` events |
| GitHub PRs + commits | 0 (deferred) | `episode` (type: shipped) | TBD | Hook in doc 620a, deferred |

**Capture anatomy (ZOE example):**

```typescript
// From concierge.ts line 40
interface ZoeCaptureNote {
  id: string;                          // uuid4
  text: string;                        // "Jadyn Violet biography brainstorm locked. Open call angle.", topic-specific
  topic: string;                       // "decision", "reflection", "learning", "task_outcome", "relationship", "captured_fact"
  source: 'dm' | 'cron' | 'bridge';   // "dm"
  created_at: string;                  // ISO 8601
}

// ZOE writes these to bonfire via:
// mirrorTurn(captures) -> bonfire POST /ingest_content -> creates "episode" node
```

**Target: 100-150 captures/week across all sources by June 2026.** (Today: ~50/week, ZOE only.)

---

### Stage 2: Synthesis (Status: MANUAL, Scheduled Mon 11:30 EST)

**Trigger:** Zaal's cobuild window (Monday 11:30am EST). Alternative: post-ship events (ZAOstock open call launched, Cipher released).

**Process:**

1. **Query bonfire for "this week":**
   ```bash
   # Run at Mon 11:30am EST from VPS 1 cron or Claude CLI
   bonfire delve "completed_tasks date: [7-days-ago, today] + decisions date: [7-days-ago, today]"
   ```
   Returns: JSON array of 15-30 nodes (task completions, decisions, shipped PRs once GitHub webhook lands).

2. **Generate HyperBlog via synthesis-frontend:**
   ```bash
   # synthesis-frontend repo polls bonfires every 60s
   # Zaal manually triggers on dashboard or via CLI:
   bonfire kengram batch --canvas --sync < weekly-digest-changeset.json
   ```
   
   The `weekly-digest-changeset.json` is Zaal's hand-authored top-level summary:
   ```json
   {
     "nodes": [
       {
         "uuid": "auto",
         "name": "Week of May 19: Bonfires Integration Sprint",
         "summary": "ZOE recall bridge finalized, KG synthesis patterns locked, HyperBlog pipeline live.",
         "labels": ["Weekly Digest", "ZAO"]
       }
     ],
     "edges": [
       {
         "source": "Week of May 19: ...",
         "target": "completed_tasks[7]",  // Links to the 7 completed tasks this week
         "name": "INCLUDES"
       }
     ]
   }
   ```

3. **synthesis-frontend renders + publishes:**
   - `synthesis-frontend` detects new kEngram
   - Auto-renders to hyperblogs.bonfires.ai/zabal
   - Generates canonical URL: `hyperblogs.bonfires.ai/zabal/week-of-may-19`
   - Public, linkable, trackable.

**Output: 1 HyperBlog per week (Wed morning EST) ~400-600 words.**

---

### Stage 3: Newsletter Sourcing from Bonfire

**Current state:** `/newsletter` skill (at ~/.claude/skills/newsletter/skill.md) asks Zaal to hand-recall the week's events.

**Proposed enhancement:** Bot-friendly query shape.

```typescript
// New function in ~/.claude/skills/newsletter/bonfire-queries.ts
interface WeeklyDigestQuery {
  week_start: string;        // ISO date, default 7 days ago
  include_types: string[];   // ['task_outcome', 'decision', 'shipped']
  author_filter: string[];   // ['Zaal', 'ZAOcoworkingBot', 'ZAOstockTeamBot']
  max_results: number;       // 8-12 for newsletter focus
}

// Zaal runs before newsletter draft:
// 1. (Auto or manual) query bonfire with above params
// 2. Get structured reply: [ { text, topic, date, author }, ... ]
// 3. Inject into newsletter skill as @context:
//    "This week's work from Bonfire: [formatted digest]"
// 4. Newsletter agent weaves it into narrative (not bullet points; per voice rules)
```

**Newsletter workflow (NEW):**

```
Mon 11:30am:   Zaal attends cobuild
               ZOE completes/relays week's tasks to bonfire
               
Mon 2pm (async): Claude newsletter skill polls bonfire
                 Generates draft with bonfire context injected
                 Outputs to ~/tmp/newsletter-day-[N].html
                 
Mon 5pm (Zaal): Reviews draft
                Edits freely (voice rules apply)
                Publishes to paragraph.com/@thezao
```

**Risk:** If bonfire is down at draft time, newsletter still ships (graceful degrade).

---

### Stage 4: Social Post Queue from Digest

**Current state:** `/socials` skill generates platform-specific posts but Zaal decides what to post manually.

**Proposed pattern:**

1. **Weekly digest as seed:**
   - HyperBlog lands Wed morning
   - Zaal or Claude extracts 2-3 "social-worthy" threads from digest
   - Example threads: "This week we shipped 3 PRs on Hermes", "ZAOstock open call opened", "Bonfire integration is live"

2. **Draft via /socials skill:**
   ```
   /socials topic="This week we shipped 3 PRs on Hermes" 
            context="[link to HyperBlog]"
            platforms=["farcaster", "x"]
   ```
   
   Outputs:
   - Farcaster cast (280 chars, embeds HyperBlog link)
   - X thread (4 tweets, 1st has link)
   - Optional: GC thread, Discord announcement

3. **Zaal reviews + publishes via Firefly** (existing workflow, no change).

**Implementation path:**

| What | Where | Status | Owner |
|------|-------|--------|-------|
| Bonfire query API for weekly digest | `bot/src/zoe/bonfire-queries.ts` | NEW | Claude |
| Integration into `/newsletter` skill | `~/.claude/skills/newsletter/` | EDIT | Claude |
| Thread-extraction prompt for /socials seed | `~/.claude/skills/socials/` | EDIT | Claude |
| Cron for Mon 11:30am bonfire query | `bot/cron.yml` (VPS 1) or systemd user unit | NEW | Claude/Ops |
| Testing + UAT | Zaal's next 4 newsletter drafts | NEW | Zaal |

---

## Industry Research: Build-in-Public Automation

| Approach | Tool | Automation Level | Notes |
|----------|------|-------------------|-------|
| **Eliza OS social loop** | Eliza agents + Twitter API | Auto-tweet daily | No KG backing; posts are context-free. |
| **Roam Research + web3** | Roam private graphs exported to Twitter | Semi-auto (export → schedule) | Roam is personal notes; no team-capture layer. |
| **Obsidian publish + Zapier** | Obsidian + Zapier webhook | Auto-post on vault change | Single-author, no team activity capture. |
| **Farcaster + Bonfires** | This spec (Zaal's approach) | On-demand synthesis + social queue | Team-captured KG → human-curated digest → multi-platform. Most transparent. |
| **Substack Pro + AI** | ChatGPT / Claude via email | Semi-auto newsletter | No KG; depends on external prompting. |

**ZAO's advantage:** Team activity is auto-captured into a queryable KG. Synthesis is triggered by human rhythm (Mon 11:30am), not algorithmic guessing.

---

## Next Actions (Phased Rollout)

| Phase | Action | Owner | Est. Effort | By When |
|-------|--------|-------|-------------|---------|
| **Phase 1: Validate bonfire query shape** | Write test queries against ZABAL bonfire; verify the JSON result shape matches newsletter-agent expectations. | Claude | 2h | 2026-05-20 |
| **Phase 2: Wire newsletter skill to bonfire** | Update `/newsletter` to call bonfire query before draft. Test with 2 newsletter drafts. | Claude | 4h | 2026-05-24 |
| **Phase 3: Validate HyperBlog rendering** | Confirm synthesis-frontend renders weekly digest correctly. Check hyperblogs.bonfires.ai/zabal. | Zaal | 30m | 2026-05-28 |
| **Phase 4: Cron for Mon 11:30 bonfire sync** | Wire systemd timer on VPS 1 to run `bonfire delve` + write weekly summary JSON. | Claude/Ops | 1h | 2026-05-27 |
| **Phase 5: Social post thread extraction** | Edit `/socials` skill to accept bonfire digest link as context. Draft 3 example threads. | Claude | 3h | 2026-05-28 |
| **Phase 6: UAT + cadence lock** | Run 4 full flywheels (4 weeks). Lock Mon 11:30 cobuild + Wed 2pm newsletter + Thu 5pm social publish. | Zaal | 30m/week | Jun 16 |

**Go/No-Go:** Week 1 (May 27): Can we reliably query bonfire + generate newsletter draft? If yes, proceed Phase 2-3.

---

## Cost Model (Monthly)

| Component | Baseline | Bonfire Queries | Total |
|-----------|----------|-----------------|-------|
| VPS 1 (hosting ZOE + cron) | $20 | $0 (included) | $20 |
| Bonfire API (bonfire-sdk operations) | $0.50-4.50/day (doc 620) | +$0.20/query (~2 queries/week) | $0.50-5.50/day |
| Claude API for newsletter draft | $0.10/draft * 4/month | Already budgeted | $0.40 |
| **Monthly total** | **$50-165** | **+$0.60-15** | **$51-180** |

Feasible. Within ZAO operational budget (doc 620c approved).

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| **Bonfire down when newsletter drafts** | Timeout 3s + fallback to manual agenda input |
| **Stale KG data** | Weekly cadence = always fresh. Data age < 7 days. |
| **Voice inconsistency (auto-generated content drifts from Zaal's voice)** | All auto-drafted posts run through voice-reference.md. Zaal final-checks all 4 newsletter drafts in UAT phase. |
| **Over-publishing (flywheel speeds up too much)** | Zaal gates social publishing (not auto). Newsletter = 1x/week, social = 2-3 threads/week. Cadence locked until Oct 1. |
| **Bonfire queries don't capture the nuance Zaal wants** | Iterative refinement. After week 1, adjust query filters + kEngram naming conventions. |

---

## Sources

- Doc 620 — Bonfire push-everything: auto-ingest pipeline
- Doc 620d — Recall feedback loop: grounding + sources footer
- Doc 665 — Bonfires deep dive + ZAO integration plan
- Doc 669 — Bonfires everything we know
- Doc 673b — synthesis-frontend rendering + HyperBlog aggregator
- `/newsletter` skill — Year of the ZABAL daily posts, voice rules
- `bot/src/zoe/recall.ts` — Current bonfire bridge (manual relay pattern)
- `bot/src/zoe/concierge.ts` — Capture extraction + mirrorTurn()
- NERDDAO/synthesis-frontend — HyperBlog public publishing surface
