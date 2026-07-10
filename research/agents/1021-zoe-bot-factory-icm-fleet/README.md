---
topic: agents
type: design
status: design-approved
last-validated: 2026-07-10
superseded-by:
related-docs: 601, 997, 1015, 1019
original-query: "let's think through the bots we need and how they all connect and make a plan - brainstorm, one question at a time"
tier: DEEP
---

# 1021 - ZOE as Bot-Factory: One Engine, N ICM-Box Brains

> **Goal:** A clean architecture for the ZAO bot fleet that does NOT repeat the 10-bot sprawl. ZOE stops being mislabeled a "concierge" and returns to its real job - the conductor + the lab + the factory that makes the other bots and wires the connections between them. Each domain bot is the SAME engine wearing a different ICM box as its brain. Brainstormed with Zaal 2026-07-10; this doc is the "no new bots without a doc + approval" gate his own rule requires.

## The reframe (resolves the "don't change ZOE vs keep building ZOE" tension)

ZOE is three things at once:

1. **The conductor** - it routes work to the fleet and coordinates them. It does NOT do the work itself (that was the "concierge" drift). Conductor bones already exist: `bot/src/zoe/dispatch.ts` + `decompose.ts` already decompose a goal and dispatch to workers; `groups.ts` already juggles multiple contexts.
2. **The lab** - doer-features (cockpit, concierge, inbox-triage) prototype INSIDE ZOE, then GRADUATE to their own engine+ICM-box bot when proven. This is the monorepo-as-lab doctrine (CLAUDE.md) pointed at the bot fleet. So "don't change ZOE" and "keep building ZOE" reconcile: we keep building ZOE's conductor + factory role, and graduate the doer-features out.
3. **The factory** - ZOE's permanent job is to MAKE new bots (from ICM boxes) and wire the connections between them.

## The architecture (approved)

**One engine, N ICM-box brains, one process wearing many masks.**

- **The engine** = ZOE's own codebase. The one change: the "brain" becomes a parameter, not a hardcode. Today ZOE loads exactly one brain (`PERSONA_DEFAULT` in `memory.ts` + `~/.zao/zoe/persona.md`). We make the brain pluggable per bot.
- **ICM box = brain** = each bot's identity + knowledge + voice is an ICM box (`useicm.com/api/objects/<id>/llm.txt`). `memory.ts` gains the ability to load an ICM box as the persona/knowledge block. A new bot = mint a new ICM box + a config line. ZERO new code.
- **Fleet registry** = a small committed config listing each bot: `{ name, tokenEnvVar, icmBoxId, role, public|internal }`. ZOE reads it to know its fleet.
- **Process model = one process, many masks (decision A, 2026-07-10).** ZOE stays a SINGLE process. It polls multiple bot tokens and answers each incoming message AS the right bot, loading that bot's ICM-box brain per token. Cleanest "one engine", zero process sprawl, matches how `groups.ts` already multiplexes contexts. Tradeoff accepted: one process = one failure point (mitigated later by the existing one-instance-lock + boot-verify discipline). Rejected: separate systemd process per bot (that is the infra sprawl doc-601 killed).
- **The human step (only Zaal, a hard boundary)** = creating a Telegram bot in BotFather + getting its token is account creation - ZOE cannot and must not do it. Zaal mints the token and drops it in `.env` via the `setting-secrets` skill. The ICM box gives the bot a brain; ZOE wires + runs it.

## The three layers (build order: layer 1 first, do NOT spec 2+3 yet)

This is three separate systems. Trying to spec all three at once is how it becomes the 10-bot sprawl again. Build layer 1, prove it, then design layer 2.

### Layer 1 - the bot tree (THIS doc / the MVP)
Domains map to parts of the (consulting) business: finance, marketing, promotions, technical, skills, plus ecosystem brands (WaveWarZ, papers, POIDH). Each part gets a HEAD bot; some get SUB-bots. ZOE conducts the tree. Each bot's brain = its ICM box. Bots are both outward (public/GEO) and inward (ops) - the registry's `public|internal` flag decides per bot.

### Layer 2 - Respect-weighted contribution (LATER, its own doc)
It is not only Zaal's memory. Community members - gated or weighted by Respect (the on-chain contribution token) - can feed a bot their perspective/answers, and the bot follows that input, so it reflects the collective, not only Zaal. Open design questions: how a contribution is captured, how Respect gates/weights it, how it merges with the ICM-box brain, moderation. Deferred.

### Layer 3 - the consensus / council (LATER, its own doc)
The payoff: Zaal asks a question, the fleet each answers from its domain + the perspectives it has been fed, and ZOE synthesizes a read. A council of Zaal's own bots advising him. Depends on layers 1 + 2. Deferred.

## The MVP (Layer 1, smallest end-to-end proof)

**"ZOE mints a bot from an ICM box."**

Build:
1. `memory.ts`: brain-loading takes an optional ICM-box source; fetch its `llm.txt`, load as the persona/knowledge block (cache it, best-effort fallback to a static brain on fetch failure).
2. A `fleet.ts` registry (committed config) + loader.
3. The multi-token poll: ZOE polls each registered bot's token and answers with that bot's brain (extends the existing single-token poll in `index.ts`; reuse the `groups.ts` context-multiplexing pattern).
4. First bot minted: **ZAO Devz bot** - brain = the thezao / a new zaodevz ICM box. For the MVP proof its first job is simply to answer AS ZAO Devz from its box. (Inbox triage of info@thezao.com is the NEXT job on top, not part of the MVP proof.)

**The proof test:** ask bot #1 something only its ICM box knows; confirm it answers in-brand AND differently than ZOE answers the same question. That single result proves "different box = different bot, one engine."

## Non-goals (YAGNI)
- No separate process per bot (decision A).
- No Respect-contribution or council in the MVP (layers 2/3).
- No public-facing / outward posting in the MVP - bot #1 is internal, drafts only, until proven.
- ZOE does NOT create bot accounts/tokens (hard human boundary).

## Also See
- [Doc 601](../601-agent-stack-cleanup-decision/) - the decommission that killed the 10-bot fleet; this doc is the disciplined way back to multiple bots.
- [Doc 997](../997-agent-harness-design-zaalcaster/) - operator harness / cockpit (a doer-feature that graduates out of ZOE per this doc).
- [Doc 1015](../1015-proactive-assistant-surfacing-patterns/) - proactive surfacing (ZOE conductor behavior).
- ICM boxes: `research/identity/icm-boxes/` (thezao/wavewarz/zabalgamez/zaal `.llm.txt`) - the ready-made brains.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve this spec (or request changes) before implementation planning | @Zaal | Decision | 2026-07-11 |
| Zaal creates the ZAO Devz bot token in BotFather + sets it via setting-secrets (human boundary) | @Zaal | Manual | 2026-07-12 |
| Mint/confirm the zaodevz ICM box (or reuse thezao box) as bot #1's brain | @Zaal | Manual | 2026-07-12 |
| Implement the MVP: pluggable brain in memory.ts + fleet.ts registry + multi-token poll (PR-only, boot-verified) | @Zaal (via loop/ZOE) | PR | 2026-07-14 |
| Run the proof test (bot #1 answers in-brand + differently than ZOE) and report | @Zaal | Verify | 2026-07-14 |
| Open Layer 2 (Respect-weighted contribution) as its own design doc once MVP proven | @Zaal | Doc | wontfix until MVP proven |

## Sources
- Brainstorm session with Zaal, 2026-07-10 (this session) `[FULL]` - the six-question grill that produced this design (conductor vs doer; capability vs domain; ICM-box-as-brain; audience; layers; MVP + process model).
- Live code inspection `[FULL]`: `bot/src/zoe/` (dispatch.ts, decompose.ts, memory.ts, groups.ts, index.ts, concierge.ts) - confirmed conductor + brain-loading bones exist, child-bot bones (teams/, bootloader-template) were removed with zao-team-bots.
- CLAUDE.md Primary Surfaces + "no new bots without doc" rule; doc 601 decommission `[FULL]`.
