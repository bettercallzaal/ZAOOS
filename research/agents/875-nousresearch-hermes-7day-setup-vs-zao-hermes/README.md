---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-17
superseded-by:
related-docs: "734, 607"
original-query: "go back through /inbox and all of the agentmail (forwarded item: 'The 7-day Hermes setup' by @zaimiri, NousResearch hermes-agent)"
tier: STANDARD
---

# 875 - NousResearch Hermes 7-Day Setup: What ZAO's Hermes/ZOE Should Steal

> **Goal:** Zaal forwarded @zaimiri's "The 7-day Hermes setup (full guide)" - a teaching article on NousResearch's hermes-agent layering methodology: identity > memory > skills > tools > telegram > crons > profiles, built incrementally over 7 days to keep layers clean. This doc extracts what ZAO's Hermes orchestrator (`bot/src/hermes/`) and ZOE (`bot/src/zoe/`) should adopt. NOTE the name collision: this NousResearch "Hermes" is a DIFFERENT product from ZAO's own Hermes fix-PR bot.

## Key Decisions - Recommendations First

| # | Recommendation | Why | ZAO Action |
|---|---|---|---|
| 1 | **Adopt the 7-day layering ORDER as the onboarding spec for new agent profiles.** Sequence: identity -> memory -> skills -> tools -> channel (Telegram) -> crons -> profile splits. | @zaimiri's article (211 blocks) teaches that stacking layers in the wrong order produces a "noisy assistant with too much access and not enough judgment." Build slowly; keep layers clean. | Document the layering order in `bot/src/hermes/README.md`. Onboard new profiles via this sequence, not add-everything-at-once. |
| 2 | **Add an identity-first gate.** Before any skill or tool attaches to a profile, the agent must have a 1-2 sentence system prompt locking tone, risk boundaries, and when-to-push-back. | Day 2 of the setup. Without identity, advanced features are harder to debug - you cannot tell if the agent is misbehaving or just unclear on its role. | Add a `profile.identity` field; require it before attaching the first tool. |
| 3 | **Keep high-signal memory only - reject temporary task progress, stale status, one-day reminders.** | Day 3. Bad memory ("we are debugging issue #217 today") rots fast and pollutes context. Good memory ("user prefers short Telegram receipts") outlives a month. | Add a memory-quality check to ZOE's memory-add flow (`bot/src/zoe/`): "will this still matter in 1 month?" |
| 4 | **Delay crons until skills + tools are proven, and make every cron QUIET.** Only message if signal clears a bar. | Day 6. A noisy cron becomes background radiation; once you stop trusting it you stop reading it. | Audit `@zaodevz_bot` hourly learning tip. Reduce frequency or add a quiet-filter. |
| 5 | **Treat profile splits as a permission/memory/credential boundary, not a feature boundary.** | Day 7. A content agent and a research agent should not share memory; a coding agent should not carry your social voice. | Audit `bot/src/zoe/` memory blocks for split candidates (research vs task-exec vs output). |

## Findings - The 7-Day Layering

Source: @zaimiri X Article "The 7-day Hermes setup (full guide)" (tweet id 2066117404392890835, 211 draft-js blocks, pulled free via FxTwitter). The product is NousResearch's `hermes-agent` (github.com/NousResearch/hermes-agent, created 2025-07-22, ~196,000 stars verified 2026-06-17).

Problem statement (quoted): "Most people try to build their AI setup in one chaotic weekend. They install ten tools, connect five APIs, create a few automations, add a giant system prompt. Then wonder why the whole thing feels messy two days later." The fix: "The setup is not the hard part. The hard part is keeping the layers clean."

The 7-layer stack: Identity, Memory, Skills, Tools, Telegram, Crons, Profiles.

| Day | Focus | Goal | Maps to ZAO |
|-----|-------|------|-------------|
| 1 | Install + verify basics | `hermes setup`, `hermes doctor`, `hermes chat` - prove the agent runs, calls tools, reads env, responds reliably before customizing anything. | ZAO Hermes runs via Claude CLI subprocess; equivalent is an API-key + health check. |
| 2 | Identity | Define tone, risk boundaries, when to push back, answer format, what it never does without approval. | ZAO Hermes/ZOE have no explicit identity gate; ZOE has persona blocks in `bot/src/zoe/` but not gated identity-first. |
| 3 | High-signal memory | Small, durable facts only. Reject temporary progress, stale status, every correction. | ZAO has FileMemory + Bonfire graph plans; no stale-signal pruning rule yet. |
| 4 | Telegram (channel you actually use) | Move the agent into the channel you touch daily; quick drops + receipts + scheduled outputs. | ZOE is Telegram-first (`@zaoclaw_bot`); ZAO Hermes runs in GitHub Actions, not Telegram-facing yet. |
| 5 | First skill from a real repeated task | Skill is procedural memory: when to use, which files, common errors, how to verify, expected receipt. Do not pre-build ten theoretical skills. | ZAO has pattern adapters (doc 734); skills not yet isolated as reusable workflows. |
| 6 | One quiet cron | One recurring job, quiet-filtered. "If there is no signal, it should say nothing." | `@zaodevz_bot` hourly tips violate the quiet rule; `@zaoclaw_bot` daily digest is fine. |
| 7 | Profile splits only if needed | Separate profile when work needs different memory/identity/tools/permissions/audience. | ZAO 5-surface split (CLAUDE.md) is permission-based; ZOE monolith may hide feature bloat. |

After 7 days the shape is a small operating chain: Telegram -> agent -> memory -> skill -> tool call -> verified output -> short receipt, plus one scheduled watcher: cron -> sources -> filter -> alert only if useful. The beginner mistake is making the agent impressive immediately; the better move is reliable: one clean memory, one clean skill, one useful Telegram lane, one quiet cron, one profile split, then repeat.

## Comparison: NousResearch Hermes 7-Day vs ZAO Hermes + ZOE

| Layer | NousResearch Hermes | ZAO Hermes (`bot/src/hermes/`) | ZAO ZOE (`bot/src/zoe/`) | Gap / Action |
|-------|---|---|---|---|
| Identity | Explicit operator system prompt | None (inherited from runner config) | Persona blocks, not identity-first gated | Add identity-first gate (Rec 2) |
| Memory | Small durable JSONL | FileMemory pending (doc 734) | Persona blocks + Bonfire graph | Add memory-quality gate (Rec 3) |
| Skills | Procedural memory per real task | No skill system; pattern adapters | Implicit via memory blocks | Formalize reusable skills |
| Telegram | `hermes gateway setup` | Not Telegram-facing (GitHub Actions) | Telegram-first | Hermes Telegram adapter (doc 734 future) |
| Crons | One quiet, filtered cron | None | `@zaodevz_bot` hourly (noisy) + `@zaoclaw_bot` daily (quiet) | Audit Devz cron (Rec 4) |
| Profiles | Permission/memory boundary | Single profile per bot | Monolith | Audit ZOE for split (Rec 5) |

## Also See

- [Doc 734 - hermes-orchestrator framework](../734-hermes-orchestrator-framework/) - ZAO's own Hermes orchestrator; the technical home for the identity/memory/pattern layers above.
- [Doc 607 - three bots one substrate](../607-three-bots-one-substrate/) - how ZAO's bots (ZOE, Hermes, Devz) share a substrate; informs the profile-split decision (Rec 5).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add the 7-day layering sequence + identity gate + memory checklist to `bot/src/hermes/README.md` | @Zaal | Docs/PR | Within 2 weeks |
| Audit `@zaodevz_bot` hourly cron; reduce to 1x daily or add a quiet-filter | @Zaal | Bot config | This week |
| Audit `bot/src/zoe/` memory blocks for profile-split candidates (research vs task vs output) | @Zaal | Todo | Before Devz phase-3 fold-in |

## Sources

- [@zaimiri X Article "The 7-day Hermes setup (full guide)"](https://x.com/zaimiri/status/2066117404392890835) [FULL - 211-block article pulled via api.fxtwitter.com, all 7 days + philosophy read]
- [NousResearch/hermes-agent GitHub repo](https://github.com/NousResearch/hermes-agent) [FULL - verified live via gh api 2026-06-17: created 2025-07-22, ~196,000 stars. README covers install + CLI; the 7-day layering is the article's teaching, not the README]
- [ZAO Doc 734 - hermes-orchestrator framework](../734-hermes-orchestrator-framework/) [FULL - internal, ZAO's autonomous bot architecture]
- HN/Reddit on local AI agent setup discipline [PARTIAL - general community sentiment that adding all tools day 1 produces noisy agents; no single canonical thread captured this run, flagged for a follow-up community pass]
