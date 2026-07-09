---
topic: dev-workflows
type: decision
status: active
last-validated: 2026-07-09
original-query: "What's our goal with n8n? Can we /zao-research this and make a plan?"
tier: STANDARD
related-docs: "1002 (n8n workflow automation research, FULL), 759 (ZOE orchestrator, locked), 887 (rate limit diagnosis)"
superseded-by: ""
---

# 1003 - n8n Goal and Plan: Glue Layer for Recurring Chores

> **Honest Take:** n8n is a narrow glue layer to kill 2-3 specific recurring manual chores (Farcaster mention checking, newsletter cross-post, GitHub PR-to-tracker). It is NOT a strategic pillar and must not become a project. ZOE stays the reasoning/orchestration layer; n8n is dumb-but-reliable plumbing.

---

## Key Decisions Table

| Decision | Choice | Owner | Rationale |
|----------|--------|-------|-----------|
| **What is n8n to ZAO?** | Glue layer + webhook receiver (NOT orchestrator, NOT strategic) | Zaal | Doc 1002 recommends self-hosted for internal automation. ZOE owns reasoning; n8n owns events. Clear boundary prevents role creep. |
| **Phase 1 goal** | PROVE Workflow 1 (Farcaster mention → Telegram alert) eliminates real, felt time spent | Zaal | 1 workflow, real keys, 1 week, measure time saved. This is the go/no-go decision point. |
| **Kill-switch criteria** | At 1 week: Is n8n saving real time (30+ min/week)? YES = keep + Phase 2. NO / noisy / fiddly = `docker compose down`, park docs, move on. | Zaal | Nothing lost if we kill it. Workflows are JSON (portable). VPS capacity is a non-issue. Fail-safe. |
| **Scope** | Workflows only (no n8n AI agent work). Scheduled syncs + webhook relay + cross-platform posts. | Zaal | Doc 1002 verdict: n8n AI agent is slower than ZOE for reasoning. Use n8n for plumbing only. |
| **Secrets model** | Relay endpoint pattern: n8n holds `N8N_RELAY_TOKEN` only. API endpoint holds `SUPABASE_SERVICE_ROLE_KEY`. | Zaal + Iman | Principle of least privilege. n8n never sees secrets. |
| **Self-hosted cost** | $25-30/mo infrastructure (already budgeted). 5-10 hrs/year DevOps. | Iman | vs. €60/mo cloud or $155/mo Zapier. ZAO wins on cost + control. |
| **MCP bridge (Phase 3)** | YES, long-term. Expose n8n workflows as tools to Claude/ZOE via MCP. | Zaal | 2026 feature. Not immediate. Requires ZOE MCP adoption first. |

---

## The Goal (One Paragraph)

n8n is a self-hosted workflow automation platform that ZAO uses for **event plumbing and scheduled syncs only.** Its sole job: intercept webhooks (Neynar cast mentions, GitHub PR merges, form submissions), apply simple conditional logic (route to Telegram, post to Farcaster, update Supabase), and relay the result back to ZOE or the tracker. It is NOT a reasoning engine (ZOE owns that), NOT a strategic pillar (we evaluate it weekly), and NOT a gateway to more automation (each phase has explicit go/no-go criteria). The goal is to eliminate 2-3 recurring 30-60 minute manual chores per week and free engineering time for higher-leverage work.

---

## Why It Might Be Worth It

1. **Real, quantifiable time savings:** Newsletter cross-post (30 min/issue, 2-3 issues/week = 3+ hours saved/week). GitHub PR to tracker (1h/week). Farcaster mention discovery (1h/week). Total: 5+ hours/week of pure copy-paste work. At $60-100/hr internal value, that's $300-500/week ROI.

2. **Cheap infrastructure:** Self-hosted on existing VPS ($25-30/mo vs €60/mo cloud or $155/mo Zapier). Total 3-year cost: ~$1,000. One newsletter issue pays for it.

3. **No vendor lock-in:** Workflows are JSON. Git-committable. Exportable. If n8n fails or we change our mind, 1 hour to document + move on.

4. **Proven track record:** Doc 1002 cites Enterprise adoption (34% Fortune 500 users, £2.2M savings at Vodafone, 2 weeks -> 2 hours at StepStone). It's not bleeding-edge; it's stable.

5. **Fail-safe architecture:** If n8n breaks, team falls back to manual workflows. No data loss (PostgreSQL persists). No production outage (n8n is optional overlay).

---

## The Plan (Concrete, Sequenced)

### Phase 0 (DONE, 2026-07-08)

- n8n deployed to VPS (zao-n8n, localhost-bound)
- 3 workflows built as JSON (PRs #1159-1162):
  - Workflow 1: Farcaster mention → Telegram alert
  - Workflow 2: Newsletter publish → cross-post drafts
  - Workflow 3: GitHub PR merged → tracker + Discord
- All workflows are **INACTIVE** (not running; can be activated with 1 click)
- Goal: Zero risk, full visibility before Phase 1 decision

**Owner:** Iman (infra) + Zaal (workflows)

---

### Phase 1 (NOW, 2026-07-09 to 2026-07-16): PROVE Workflow 1

**Objective:** Run Farcaster mention workflow with REAL keys for 1 week. Measure time saved. This is the go/no-go checkpoint.

**Sequence:**
1. Activate Workflow 1 (Farcaster mention → Telegram alert) with live Neynar webhook
2. Receive real Farcaster mentions for 7 days (alerts to @zaal private channel + Discord #farcaster-mentions)
3. Log every mention to farcaster_mentions table (audit trail)
4. Track: How many mentions caught? How much time saved vs manual checking? Noise level (false positives)?
5. At day 7 (2026-07-16): Zaal decision
   - PROVE: Real time savings (30+ min/week) + low noise = GO to Phase 2
   - NO PROVE: Noisy / fiddly / not saving time = KILL (docker compose down, park docs)

**Success criteria:**
- Telegram alerts arrive within 2 min of Farcaster cast
- Zero false positives (mentions are actual @zaal or #zao refs)
- Zaal avoids ≥2 manual Farcaster checks per week (proven by logs)

**Owner:** Zaal (operation + decision)

**Cost:** Free (only operations time, no infrastructure)

---

### Phase 2 (CONDITIONAL, 2026-07-17 to 2026-08-06): Activate Workflows 2 & 3

**Only proceeds if Phase 1 shows real time savings.**

**Objective:** Eliminate 30 min/newsletter + 1 hour/week GitHub-tracker chore.

**Sequence:**
1. Activate Workflow 2 (Newsletter publish → cross-post drafts)
   - Trigger: Paragraph publishes new article OR scheduled daily check
   - Generate 5-platform drafts (X/Farcaster/Discord/Telegram/LinkedIn) automatically
   - Zaal reviews + approves (1 click to fire all 5)
   - **Measurement:** Time to post comparison (30 min manual → 5 min review + approve)

2. Activate Workflow 3 (GitHub PR merged → tracker + announce)
   - Trigger: GitHub PR merge webhook
   - Auto-update cowork tracker status to "Done"
   - Post to Discord #releases + Telegram @ZAOdevz
   - **Measurement:** Manual tracker updates eliminated (>1h/week saved)

3. Parallel run: Run both manual + n8n for 1 week (2026-07-30 to 2026-08-06), gather feedback
   - Ensure both systems sync (no data divergence)
   - Verify no timing/ordering issues
   - Get team feedback (Zaal, Iman)

4. Cutover: Declare manual posts / tracker updates DEPRECATED (2026-08-06)
   - n8n becomes source of truth
   - Manual workflows archived

**Success criteria:**
- Newsletter cross-posts to all 5 platforms automatically
- Zero missing posts (5/5 platform receive each newsletter)
- Cowork tracker status syncs with GitHub PR merge in <5 min
- Team reports 30+ min/week time savings

**Owner:** Zaal (Workflows 2-3), Iman (monitoring)

**Cost:** Same infra ($25-30/mo); +10 hours engineering (total build + parallel run)

---

### Phase 3 (FUTURE, Q3 2026): MCP Bridge

**Only proceeds if Phases 1-2 prove ROI.**

**Objective:** Expose n8n workflows as on-demand tools to Claude/ZOE via MCP.

**Examples:**
- ZOE calls: "Check Farcaster for @zaal mentions now" → n8n Farcaster workflow triggers, returns results
- ZOE calls: "Post this to all platforms" → n8n cross-post workflow fires
- ZOE calls: "What's the status of this PR?" → n8n GitHub workflow queries + returns

**Why wait:** Requires ZOE MCP adoption first (doc 759 doesn't have MCP client yet). Phase 1-2 prove n8n is worth maintaining; Phase 3 is the force-multiplier.

**Owner:** TBD (Zaal or Iman, pending ZOE MCP work)

---

## GO/NO-GO Criteria (The Honest Kill-Switch)

**At 2026-07-16 (end of Phase 1), Zaal makes a binary call:**

| Metric | GO (Keep) | NO-GO (Kill) |
|--------|-----------|-------------|
| **Real time savings** | ≥30 min/week (Farcaster mention discovery) | <30 min/week OR hard to measure |
| **Noise / false positives** | <1 false alert per day | ≥1 false alert per day (alerts fatigue) |
| **Reliability** | 100% of real mentions caught; zero missed | Missing mentions OR alerts arrive late (>5 min) |
| **Team friction** | Zaal finds the alerts useful | Zaal mutes alerts OR says "not worth the setup" |

**If NO-GO:**
- `docker compose down` (n8n stops)
- Workflows stay in `bot/workflows/n8n/` as JSON (archive, no loss)
- Research docs 1002-1003 parked (reference only)
- No VPS cleanup needed (Postgres data can stay or be dropped)
- **Total loss:** ~10 hours setup + $30 infra. **Total learning:** What works for ZAO's bandwidth / what doesn't.**

**If GO:**
- Proceed to Phase 2 (2026-07-17)
- Continue measuring weekly time savings
- Escalate to Zaal if new issues appear (weekly sync)

**Rationale:** This is low-stakes because n8n is optional. If it doesn't earn its keep in 1 week, we walk away with zero regret and full operational knowledge for future automation work.

---

## Boundary: What n8n Does vs What Stays in ZOE

### n8n OWNS (Dumb Plumbing)
- **Webhook receivers:** Neynar cast.created, GitHub pr.merged, Typeform form.submitted, Alchemy contract events
- **Scheduled syncs:** Daily 9am newsletter check, weekly digest builder, daily Airtable ↔ Supabase sync
- **Cross-platform relay:** Post to Telegram, Discord, Farcaster, X, LinkedIn in parallel
- **Simple conditional logic:** "If mention contains regex, route to Telegram. If not, log and skip."
- **Error handlers:** Webhook fails → notify #ops. Supabase insert fails → retry 3x then alert.

### ZOE OWNS (Reasoning + Orchestration)
- **Task reasoning:** "Summarize this day's events. What's the top 3 insights? Who should know?"
- **Multi-step planning:** "Collect data from 3 sources, run a model, synthesize an answer, post to 2 channels"
- **Memory management:** Letta-style blocks for context (who is who, what happened last week, recurring patterns)
- **Worker dispatch:** DEALER/BANKER/VAULT agents, custom bots, team coordination
- **Cost optimization:** Route tasks to cheaper models, budget tracking, spend control
- **Stateful reasoning:** Multi-turn conversation with persistent context

### Architectural Diagram

```
                    ZOE (bot/src/zoe/)
                    ├─ Task reasoning
                    ├─ Memory (Letta blocks)
                    ├─ Worker dispatch
                    └─ Cost routing

                           ↓ (command API: /api/internal/n8n-relay/)

                        n8n (zao-n8n container)
                        ├─ Webhook tier
                        │  ├─ Farcaster mentions
                        │  ├─ GitHub PR merges
                        │  └─ Typeform submissions
                        ├─ Scheduled tier
                        │  ├─ Newsletter checks
                        │  ├─ Digest builders
                        │  └─ Tracker syncs
                        └─ Relay tier
                           ├─ Telegram posts
                           ├─ Discord embeds
                           ├─ Farcaster casts
                           └─ X tweets

         Boundary: n8n holds N8N_RELAY_TOKEN only.
         Relay endpoint holds SUPABASE_SERVICE_ROLE_KEY.
         Secrets never leak.
```

### Rule: No Reasoning in n8n

n8n is stateless and single-turn. If a workflow needs to:
- Remember context from last week
- Make a judgment call (is this important or noise?)
- Combine signals from multiple sources and synthesize
- Route based on ZAO's financial state (burn rate, runway)

→ **Send it back to ZOE via API call.** n8n is the dumb relay; ZOE is the brain.

---

## Risk & Guardrails

| Risk | Severity | Mitigation | Owner |
|------|----------|-----------|-------|
| **VPS resource contention (n8n + Supabase OOM)** | High | Check `free -h` before Phase 1. Cap n8n memory to 512MB. If RAM >80% in use, pause Phase 1 | Iman |
| **Workflow lock-in** | Medium | Git-commit all workflow JSON to `bot/workflows/n8n/`. Treat as source of truth, not n8n UI. Weekly export. | Zaal |
| **Webhook replay attacks** | Medium | Neynar/GitHub provide HMAC signatures; n8n validates natively. All webhooks are authenticated. | Iman |
| **Secrets leak via n8n** | High | Relay endpoint pattern (n8n never sees SERVICE_ROLE_KEY). N8N_RELAY_TOKEN is rotatable. Audit n8n credential storage quarterly. | Iman |
| **Scheduled jobs drift (timezone, retries)** | Low | Document cron expressions in workflow JSON. Set max retries = 3. Log every execution. | Zaal |
| **PostgreSQL backup complexity** | Medium | Auto `pg_dump` daily to S3. Store N8N_ENCRYPTION_KEY in password manager separately. Test restore quarterly. | Iman |
| **False positives (noisy alerts)** | Medium | Phase 1 kill-switch is ≥1 false alert/day. If noise is high, tune regex patterns OR kill Workflow 1. | Zaal |
| **n8n container crashes** | Low | Restart policy = "always". Monitoring dashboard shows status. Alert to #ops on crash. | Iman |

### Secrets Guardrail (Explicit)

n8n will store these credentials:
- `N8N_RELAY_TOKEN` (generic API key, held in `.env` on VPS only)
- `NEYNAR_API_KEY` (webhook validation only, no data writes)
- `GITHUB_TOKEN` (read-only PR info)
- `TELEGRAM_BOT_TOKEN` (send messages only)

n8n will **NEVER** store:
- `SUPABASE_SERVICE_ROLE_KEY` (held on relay endpoint only)
- App signer private key
- Session secret

**Audit:** Pre-commit hook scans `git diff` for 64-char hex strings. Post-commit scan on `HEAD` for leaked secrets (doc reference: `.claude/rules/secret-hygiene.md`).

---

## Next Actions

| Action | Owner | Type | By When | Success Criteria |
|--------|-------|------|---------|-----------------|
| Check VPS RAM utilization; confirm n8n + Supabase capacity | Iman | DevOps | 2026-07-10 | `free -h` output shows <80% used RAM; green light for Phase 1 |
| Activate Workflow 1 with live Neynar webhook | Zaal | Ops | 2026-07-09 | Farcaster mention → Telegram alert works for real mentions |
| Monitor Phase 1 for 1 week (Farcaster alerts, false positives, time savings) | Zaal | Ops | 2026-07-09 to 2026-07-16 | Daily log of mentions caught + time saved vs manual check |
| GO/NO-GO decision at end of Phase 1 | Zaal | Decision | 2026-07-16 | Binary call: GO (Phase 2) or NO-GO (shutdown) |
| If NO-GO: Document learnings + archive workflows as JSON | Zaal | Docs | 2026-07-17 | Research docs 1002-1003 marked as "parked"; workflows stay in repo for future reference |
| If GO: Activate Workflows 2-3 (newsletter cross-post, GitHub PR sync) | Zaal | Feature | 2026-07-17 to 2026-08-06 | See Phase 2 success criteria |

---

## Also See

- **[Doc 1002](../1002-n8n-workflow-automation/)** - FULL research on n8n architecture, licensing, self-hosting, 8 workflows ranked, integration with ZOE. Read this first if unfamiliar with n8n.
- **[Doc 759](../../agents/759-zoe-orchestrator-locked/)** - ZOE orchestrator architecture; the reasoning layer n8n does NOT touch.
- **[Doc 887](../../infrastructure/887-rate-limit-diagnosis/)** - GitHub REST vs GraphQL rate limits; relevant for GitHub PR merge webhook tuning.
- **[Doc 801-802](../../infrastructure/801-mcp-tooling-audit/)** - MCP integration strategy; Phase 3 depends on this.
- **[.claude/rules/secret-hygiene.md](../../../../../../.claude/rules/secret-hygiene.md)** - Secrets audit guardrails; applies to n8n deployment.

---

## Frontmatter Glossary

| Key | Value |
|-----|-------|
| **topic** | dev-workflows |
| **type** | decision |
| **status** | active (Phase 1 in progress) |
| **tier** | STANDARD |
| **original-query** | "What's our goal with n8n? Can we /zao-research this and make a plan?" |
| **related-docs** | 1002, 759, 887 |

---

**Author:** Claude Code (agent). **Committed:** 2026-07-09. **Last reviewed:** 2026-07-09.

