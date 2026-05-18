---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-04
related-docs: 547, 568, 569, 570, 581, 599, 600, 601, 604, 605, 606
tier: STANDARD
---

# 607 - Three bots, one substrate: ZOE + ZAOstock + Bonfire operating model (May 2026)

> **Goal:** Define how the three named bots (ZOE for Zaal, ZAOstock bot for festival team, Bonfire bot for public ZAO) share data, route messages, and stay coherent without dual-write or trust-tier leakage. Builds on doc 547 (now stale - written Apr 28 before ZOE/openclaw cutover) and locks the operating model for the next quarter.

## Key Decisions

| Decision | Action | Reason |
|----------|--------|--------|
| Architecture pattern | Bonfire is the SUBSTRATE. ZOE, ZAOstock bot, Bonfire bot are SURFACES. | Substrate = single source of truth + 3 trust tiers. Surfaces = different audiences, voice, write permissions. |
| Trust tiers in Bonfire | Three namespaces: `PUBLIC`, `ZAOSTOCK_TEAM`, `ZAAL_PRIVATE`. Bonfire enforces visibility per wallet. | Today most ZAO data is implicitly mixed; explicit tiers prevent accidental "Roddy budget" leak to public Q&A. |
| Cross-surface relay | ZOE acts as Zaal's DISPATCHER. From his ZOE DM he can `@zaostock <cmd>` or `@bonfire <query>` and ZOE relays. Independent bots stay independent for their direct users. | One-relationship-with-Zaal preserved. Team members still talk to ZAOstock bot directly; ecosystem talks to Bonfire bot directly. |
| Write authority | Each bot writes to its own scope only. ZOE writes ZAAL_PRIVATE + PUBLIC (with explicit promote-to-public tap). ZAOstock writes ZAOSTOCK_TEAM + PUBLIC (with team-vote promote). Bonfire bot only reads PUBLIC. | Prevents the doc-581 "bot fabricated deletion" class of state-truthfulness bugs from spreading across surfaces. |
| Brand-assistant slash commands | Live in ZOE (and ZAOstock for team-scope outputs). Route by audience: `/firefly`/`/youtube`/`/cast` to Zaal voice, `/announcement`/`/standup-recap` to team voice. | Single mental model for content type, automatic destination + voice resolution. |
| ZAOstock spinout (this week) | When ZAOstock graduates: bot code moves to its own repo, but writes to the SAME Bonfire substrate via the same SDK. No data migration. ZAO OS lab keeps research; ZAOstock takes its bot code + its own DB. | Aligns with the "monorepo as lab" graduation pattern (CLAUDE.md). Bonfire is cross-product, not per-repo. |

## The three bots

| Bot | Username | Audience | Trust scope (read) | Trust scope (write) | Hosting today |
|-----|----------|----------|--------------------|--------------------|---------------|
| **ZOE** | `@zaoclaw_bot` | 1 user (Zaal) | ALL three tiers | `ZAAL_PRIVATE` + (with tap) `PUBLIC` | `bot/src/zoe/` in ZAOOS, systemd `zoe-bot.service` on VPS 1 |
| **ZAOstock bot** | `@ZAOstockTeamBot` | N team users (Cassie, Steve Peer, Roddy contacts, ZAOstock volunteers) | `ZAOSTOCK_TEAM` + `PUBLIC` | `ZAOSTOCK_TEAM` + (with team-vote) `PUBLIC` | `bot/` (root) in ZAOOS today, graduates this week to own repo + own systemd |
| **Bonfire bot** | `@zabal_bonfire` | N public users (any wallet-gated ecosystem member) | `PUBLIC` only | `PUBLIC` only | bonfires.ai SaaS (Genesis tier, wallet-gated, Joshua.eth provisions) |

Hermes (`@zoe_hermes_bot`) and ZAO Devz (`@zaodevz_bot`) sit alongside but are NOT in this design's scope - they are dev-pipeline surfaces. They DO read from Bonfire (PUBLIC scope) when planning fixes, per doc 547's stale-read fix.

## The substrate (Bonfire trust tiers)

Bonfire today supports namespacing via wallet gating. We extend that to three explicit tiers:

| Tier | Visible to | Write surfaces | Examples |
|------|-----------|----------------|----------|
| `PUBLIC` | any wallet in ZAO ecosystem | ZOE (with tap), ZAOstock (with vote), Bonfire bot | "ZAOstock 2026 is Oct 3 in Ellsworth", "doc 605 ships Playwright MCP unlock", "Joseph Goats rebrand from Jose" |
| `ZAOSTOCK_TEAM` | wallets in `ZAOstock-team` Bonfire group | ZOE (Zaal-write), ZAOstock bot | "Roddy Aug 28 city council vote", vendor budget caps, artist submission status, sponsor outreach state |
| `ZAAL_PRIVATE` | Zaal wallet only | ZOE (default tier) | journal entries, half-formed thoughts, decision-log with reversibility flag, relationships beyond what's been promoted |

**Promotion rule:** new facts default to the most-restrictive tier their writer can use. ZOE captures default to `ZAAL_PRIVATE`. ZAOstock bot captures default to `ZAOSTOCK_TEAM`. Promotion to `PUBLIC` requires an explicit user gesture (Zaal taps "share to public" on a fact in his ZOE DM; ZAOstock team posts vote `/promote <fact>` in team chat with 3+ approvals).

**No demotion.** Once a fact is `PUBLIC` it stays public. Removal needs a separate `retract` action that adds a `superseded_by` edge but keeps the original for audit (doc 581 lesson).

## The dispatcher pattern (ZOE as Zaal's single entry)

Zaal interacts with three bots today, but he wants ONE relationship. Solution: from his ZOE DM, he can prefix a message:

| Prefix | Behavior |
|--------|----------|
| (none) | normal ZOE concierge turn |
| `@zaostock <cmd>` | ZOE relays to ZAOstock bot in-process (shared VPS, no IPC), ZAOstock-bot replies inline back to ZOE DM, formatted as if ZAOstock said it |
| `@bonfire <query>` | ZOE calls Bonfire SDK with ZAAL_PRIVATE + ZAOSTOCK_TEAM + PUBLIC visibility, returns synthesized answer |
| `@hermes <task>` | ZOE relays to Hermes coder/critic loop, returns PR link |

Direct users of ZAOstock bot and Bonfire bot still talk to those bots in their own DMs. The dispatcher is for Zaal's convenience only.

Implementation lives in `bot/src/zoe/index.ts` - extend the message handler with a regex `/^@(zaostock|bonfire|hermes)\s+(.+)/` that routes to a per-target adapter.

## Brand-assistant slash commands across surfaces

The slash-command idea from the May 4 chat extends naturally:

| Command | Lives in | Voice source | Default destination | Notes |
|---------|----------|--------------|--------------------|-------|
| `/firefly <url> [ctx]` | ZOE | `~/.zao/zoe/brand.md` (Zaal voice) | clipboard or copy buttons in Telegram | personal posts |
| `/youtube <url> [transcript]` | ZOE | `~/.zao/zoe/brand.md` | clipboard | personal video descriptions |
| `/cast <url> [ctx]` | ZOE | `~/.zao/zoe/brand.md` | Farcaster long-form | personal casts |
| `/thread <topic>` | ZOE | `~/.zao/zoe/brand.md` | X thread (multi-post) | personal threads |
| `/onepager <topic>` | ZOE | template + Bonfire facts | PDF / email body | pitches |
| `/announcement <topic>` (festival) | ZAOstock bot | `~/.zao/zaostock-bot/brand.md` (team voice) | team chat preview, then Zaal/Cassie post | NOT auto-posted |
| `/standup-recap` | ZAOstock bot | team voice | team chat | from today's Granola transcript |
| `/recall <query>` | ZOE or Bonfire bot | substrate | DM reply | scoped to caller's tier |
| `/ingest <url-or-paste>` | ZOE or ZAOstock | substrate writer | confirmation | promotes to next tier on tap |

Each command in ZOE reads brand voice from `~/.zao/zoe/brand.md`. Each command in ZAOstock reads from `~/.zao/zaostock-bot/brand.md` (separate file, separate voice - team-broadcast tone vs Zaal-personal-spartan). New brand voices = new files in those directories, NOT new bots (CLAUDE.md "no new bots without doc" rule).

## Capture flow (where info lands first)

| Source | Lands in | Auto-promotion path |
|--------|----------|---------------------|
| Granola meeting transcript | `ZAOSTOCK_TEAM` if from team standup, else `ZAAL_PRIVATE` | team standup auto-summarized to `PUBLIC` snippet (3-bullet weekly memo) on Friday with team-vote |
| Telegram voice DM to ZOE | `ZAAL_PRIVATE` | tap-to-promote in 9pm reflection |
| Telegram message to ZAOstock team chat | `ZAOSTOCK_TEAM` (auto-ingested by ZAOstock bot) | team-vote `/promote` |
| Limitless Pendant ambient capture (Phase 2 doc 606) | `ZAAL_PRIVATE` | tap-to-promote in 9pm reflection |
| Research doc PR merged | `PUBLIC` (auto-ingest cron, doc 570 plan) | already public on merge |
| Farcaster cast on Zaal's account | `PUBLIC` snapshot (auto-ingest) | already public |
| `/firefly` output once posted | `PUBLIC` (auto-snapshot once Zaal taps "I posted this") | auto |
| ZAOstock budget update | `ZAOSTOCK_TEAM` | locked to team unless Cassie + Zaal co-sign promote |

## Output flow (one bot's output becomes another's input)

The doc-606 closing-the-loop habit applies across surfaces:

- ZOE drafts `/firefly` post -> Zaal posts on Firefly -> Zaal taps "posted" -> ZOE writes a `PUBLIC` fact "posted X about Y" to Bonfire -> Bonfire bot can now answer "what has Zaal posted about ZAOstock recently?"
- ZAOstock bot generates Friday standup-recap -> Cassie taps "approve+publish" -> ZAOstock bot writes `PUBLIC` fact "ZAOstock W19 standup: artist apps at 47, budget at 64% raised" -> Zaal's morning brief next day surfaces it -> Zaal can ask Bonfire bot in public DM and ecosystem sees the same data
- Hermes ships PR -> auto-snapshots `PUBLIC` fact "doc 605 Phase 1 PR merged" -> ZOE 9pm reflection includes it as "what shipped today" anchor

## Failure isolation

| Failure | Blast radius | Mitigation |
|---------|--------------|-----------|
| Bonfire SaaS down | ZOE/ZAOstock recall returns nothing, posts still draftable from local memory blocks | ZOE/ZAOstock fall back to `~/.zao/zoe/recent.json` + research doc grep when Bonfire 5xx |
| ZOE service crashes | ZAOstock bot keeps running for team; Bonfire bot for ecosystem unaffected | systemd restart-on-failure already wired |
| ZAOstock bot crashes | team falls back to manual Telegram chat; ZOE unaffected | systemd restart, separate process |
| Bonfire bot DM down | public can't query; ZOE/ZAOstock still write to substrate | substrate write decoupled from public bot's availability |
| Token leak / one bot's auth compromised | only that surface affected; substrate tier model contains scope | rotate token, restart that bot only |

## ZAOstock spinout (this week)

When ZAOstock graduates from ZAOOS lab to its own repo:

1. Code: `bot/` (root) -> own repo `zaostock-bot` (or whatever name)
2. systemd unit on VPS 1 stays separate; both bots run side-by-side
3. Bonfire substrate stays SHARED. ZAOstock bot writes to `ZAOSTOCK_TEAM` namespace; ZOE reads from same namespace
4. Brand voice file (`brand.md`) graduates with the bot
5. ZAO OS lab retains the research/ docs that birthed the festival; future ZAOstock-specific research lands in the new repo
6. ZAOstock dashboard graduates to own DB (per CLAUDE.md graduation rule); bot still cross-writes to Bonfire substrate

This means: graduation is a code/DB split, NOT a substrate split. The substrate is cross-product.

## Codebase + skill touchpoints

- `bot/src/zoe/index.ts` (line ~70 message handler) - add `@<target> <cmd>` dispatcher regex
- `bot/src/zoe/recall.ts` - extend to call Bonfire SDK with namespace param `{visibility: ['ZAAL_PRIVATE','ZAOSTOCK_TEAM','PUBLIC']}` once `BONFIRE_API_KEY` arrives
- `bot/src/zoe/brand.ts` (new) - drafter for `/firefly`/`/youtube`/`/cast` etc. Reads `~/.zao/zoe/brand.md` voice rules + per-command template
- `bot/src/zoe/dispatch.ts` (new) - in-process relay to ZAOstock/Hermes
- `bot/src/zoe/templates/` (new) - per-content-type templates (firefly.md, youtube.md, cast.md, thread.md, onepager.md)
- `~/.zao/zoe/brand.md` (new) - Zaal voice rules + 5 example posts
- `~/.zao/zaostock-bot/brand.md` (new, after spinout) - team-broadcast voice + 5 example announcements
- `bot/src/zoe/concierge.ts` - already builds memory blocks; extend persona to know Bonfire trust tiers + dispatcher syntax
- `research/agents/547-multi-agent-coordination-bonfire-zoe-hermes/` - mark this doc as Apr-28 baseline, link forward to 607
- `research/agents/606-...` (doc 606 second-brain) - this doc + 606 together define Zaal personal layer; 607 extends to team + public layers

## Recent (Apr-May 2026) signals supporting the model

- Doc 601 collapsed 12+ systems to 5 surfaces; this doc is the multi-surface design that follows that consolidation.
- Doc 605 picked Langfuse + Playwright as Phase 1 unlocks; Langfuse traces will span all three bots once wired (single observability layer across surfaces).
- Doc 606 settled the personal-layer second-brain pattern; this doc extends it to team + public.
- ZAOstock spinout this week is the natural test case - first surface to graduate while still sharing the substrate.
- Brand-assistant slash-command pitch from Zaal May 4 -> already shaped this doc's content router.

## What this doc is NOT

- Not a Bonfire SDK spec (waiting on Joshua.eth's API key + namespace API)
- Not a UI design for the dispatcher (that lands in the Phase 2 ZOE PR with the regex handler)
- Not a code rewrite plan - all three bots already exist; this doc names the operating contract between them

## Failure modes to watch (cross-surface specific)

| Mode | Symptom | Mitigation |
|------|---------|-----------|
| Tier leak | a `ZAAL_PRIVATE` fact shows up in a public Bonfire-bot answer | Bonfire SDK enforces visibility on every query; add unit test that reads as anonymous wallet and asserts no private fields appear |
| Cross-bot voice contamination | ZAOstock bot accidentally posts in Zaal's spartan-personal voice (or vice versa) | per-bot `brand.md` + per-command template; default-on enforcement = if no voice file matches, refuse to draft |
| Stale dispatcher | ZOE relays to ZAOstock with a 5-min-old context | dispatch is in-process, fresh per-call; document that the dispatcher does NOT cache |
| Conflicting writes | ZOE writes "ZAOstock budget = $20K" while ZAOstock-bot writes "$22K" | tier scopes prevent direct collision (Zaal writes via `ZAAL_PRIVATE`, team via `ZAOSTOCK_TEAM`); promotion to `PUBLIC` requires explicit gesture |
| ZAOstock spinout misses substrate ref | new repo bot writes to a fresh Bonfire that nobody else reads | spinout checklist: confirm `BONFIRE_BONFIRE_ID` env var is the SAME UUID as ZAO OS lab |

## Also see

- [Doc 547 - Multi-agent coordination Bonfire + ZOE + Hermes (Apr 28 baseline)](../547-multi-agent-coordination-bonfire-zoe-hermes/)
- [Doc 568 - Aware brain local memory backup](../568-aware-brain-local-memory-knowledge-graph/)
- [Doc 569 - YapZ Bonfire ingestion strategy](../../identity/569-yapz-bonfire-ingestion-strategy/)
- [Doc 570 - Zaal personal KG agentic memory (16-corpus plan)](../../identity/570-zaal-personal-kg-agentic-memory/)
- [Doc 581 - Bonfire graph wipe + bot hygiene](../../identity/581-bonfire-graph-wipe-bot-hygiene/) (state-truthfulness anti-pattern)
- [Doc 600 - Agent stack v1 inventory](../600-agentic-stack-coordination-v1/)
- [Doc 601 - Agent stack cleanup decision (5-surface collapse)](../601-agent-stack-cleanup-decision/)
- [Doc 605 - Agentic tooling May 2026 survey](../605-agentic-tooling-may-2026/)
- [Doc 606 - Zaal second-brain operating system](../../identity/606-zaal-second-brain-system/)

## Next Actions

| # | Action | Owner | Type | Trigger |
|---|--------|-------|------|---------|
| 1 | Wire `@<target> <cmd>` dispatcher regex in `bot/src/zoe/index.ts` (relay to ZAOstock + Hermes in-process) | Claude | PR | Same week as ZOE Phase 1 from doc 605 |
| 2 | Create `bot/src/zoe/brand.ts` + `~/.zao/zoe/brand.md` + per-content-type templates (firefly/youtube/cast/thread/onepager) | Claude | PR | Same week, parallel to #1 |
| 3 | Extend `bot/src/zoe/recall.ts` with `visibility` param routing across the 3 tiers | Claude | PR | After Joshua.eth ships Bonfire SDK key |
| 4 | Define Bonfire namespace UUIDs for `PUBLIC`, `ZAOSTOCK_TEAM`, `ZAAL_PRIVATE` | @Zaal | Bonfire admin | After Joshua.eth ships namespace API |
| 5 | Write `~/.zao/zaostock-bot/brand.md` with team-broadcast voice + 5 examples | @Zaal + Cassie | Doc | Before ZAOstock graduation merge |
| 6 | ZAOstock spinout PR: confirm same `BONFIRE_BONFIRE_ID` env var so substrate stays shared | Claude | PR | This week |
| 7 | Add Langfuse trace tags `surface=zoe|zaostock|bonfire` so Phase-1 observability spans all three | Claude | PR | After Langfuse ships from doc 605 |
| 8 | Update `bot/src/zoe/persona.md` with dispatcher syntax + tier-aware capture defaults | Claude | Doc | Same PR as #1 |
| 9 | Re-validate this doc 30 days from now (2026-06-03) | Claude | Doc update | 2026-06-03 |

## Sources

- Internal: docs 547, 568, 569, 570, 581, 600, 601, 604, 605, 606
- Bonfire genesis tier docs: bonfires.ai (wallet-gated, no public URL)
- Live system: VPS 1 systemd units (`zoe-bot.service`, `zaostock-bot.service`, `zao-devz-stack.service`) verified 2026-05-04 11:22 UTC

URLs to ZAO repo paths verified live as of commit `e9903912` on `main`.
