---
topic: agents
type: design-proposal
status: decided-architecture-2026-06-06 (read/write split; both bots Bonfires-hosted; both system prompts drafted + paste-ready; remaining steps are Bonfires-dashboard actions for Zaal)
last-validated: 2026-06-06
related-docs: "601, 665, 669, 673, 734, 798"
original-query: "spec the DeepMeeting agent properly"
tier: STANDARD (proposal synthesizing live transcript + CLAUDE.md governance + bonfire architecture)
---

# 799 - DeepMeeting agent / shard architecture

> **This doc exists to satisfy a hard rule.** CLAUDE.md → Primary Surfaces:
> *"no new bots without doc. Before adding a new Telegram bot, agent process, or
> autonomous loop, write a numbered research doc + get explicit Zaal approval."*
> The 2026-06-06 transcript has Zaal mid-flight on a dedicated DeepMeeting agent
> (`@treemojo_bonfire` / `@deepmeeting_bot`, GCvlcnti as admin). Before that bot
> exists, this is the required gate. **No bot should be created until Zaal
> explicitly greenlights an option below.**

## What's being proposed (from the transcript)

A dedicated DeepMeeting agent, separate from the main `@zabal_bonfire_bot`:

- **Scope:** the TreeUnix / "gap filling axioma" / Kanzi work with GCvlcnti — a
  distinct vocabulary and protocol set that Zaal flagged as a *bad-data risk* when
  it bled into the main graph (the "TreeUnix Protocol" fabrication, doc 798
  Finding 1).
- **Admin:** GCvlcnti designated as ZABAL Bonfire admin for that shard.
- **Architecture (as discussed):** hybrid dispatcher — `@zabal_bonfire_bot` as
  `/root` orchestrator routing tasks to specialized shards, which sync results
  back atomically to one unified graph.
- **Suggested handles:** `@treemojo_bonfire` or `@deepmeeting_bot`.
- **Open item the bot is still waiting on:** confirmation to update the
  DeepMeeting agent's draft prompt to reflect its subordinate shard role.

## The tension this proposal has to resolve

CLAUDE.md just spent doc 601 *collapsing* the agent fleet from 12+ surfaces to 5,
and the decommission list is explicit:

> "10-bot branded fleet (Magnetiq/Research/WaveWarZ/POIDH as own bots) — folds
> into ZOE memory blocks ... New brand voices = persona block ... NOT a new bot."

A new `@deepmeeting_bot` runs directly against that grain. **But** DeepMeeting is
arguably not "a new brand voice" — it's a different *surface* (different group,
different admin/human, different protocol scope, an explicit data-isolation
requirement). The whole point in the transcript is to *keep TreeUnix vocabulary
OUT of the main graph until it's validated.* That's a real architectural need.
The question is whether a separate Telegram **bot** is the right unit to meet it,
or whether a namespace/shard *inside the existing bot* meets it more cheaply.

## DECISION (Zaal, 2026-06-06): read/write split, not topic-sharding

Zaal reframed the whole thing, and it's a better cut than the A/B/C options
below. **The split axis is capability, not topic:**

> "Harden the zabal bonfire bot to be just knowledge retrieval, and if it needs
> to build / add a node it uses a different bot starting with deep thinking."

- **Reader = `@zabal_bonfire`** → retrieval ONLY. No write capability. This is
  the bot everyone in the group talks to.
- **Writer = a new deep-thinking bot** → the SOLE thing that can add/supersede
  nodes. Leads with a reasoning pass (provenance tier, dedup, contradiction
  check, secret+PII scan) and only commits on approval.

**Why this beats topic-sharding (and dissolves the Option B sync problem):**

1. Fixes doc 798 Finding 1 at the root. Fabricated facts got stamped 1.0
   because the *same* agent that retrieves also improvises writes. Remove the
   write tool from the reader and it **structurally cannot** corrupt the graph.
2. **Single writer.** My Option-B worry was "two processes writing one graph
   need atomic sync." A read/write split has exactly one writer — no contention,
   no sync. The shared graph is safe by construction.
3. Prompt-injection resistance: anyone can message the reader; with no write
   tool, "ingest this: …" from a group member can't land. Writes funnel through
   one deliberate, gated path.

### Both bots are Bonfires-hosted (Zaal, 2026-06-06)

Per doc 673d, `@zabal_bonfire` is an LLM agent **hosted inside Bonfires.ai**
(app.bonfires.ai dashboard, ERC-8004 #32009), configured by a system prompt +
personality traits on Josh's platform. Zaal's call: **the writer is the same
kind of thing** — a second Bonfires-hosted Telegram agent (own handle, optional
API key), NOT a process in our `bot/src/` fleet. So:

- **Both bots are configured on the Bonfires dashboard**, not in this repo. The
  deliverable is two system prompts (below). The audit findings (provenance
  tiers, dedup/supersede, PII/secret discipline) have to be expressed as
  *prompt instructions* — the hosted agent can't import our Python gates.
- **Our `scripts/bonfire-ingest/` pipeline stays** for *programmatic bulk*
  ingest (research library, GitHub READMEs, brand kit) where the Python
  `pii_scan` + `secret_scan` + provenance tiers do run. The conversational
  writer is the dashboard agent; the pipeline is the batch path. Same graph.
- **No-new-bots burden is light:** Bonfires hosts it, so it adds no systemd unit
  / no ops to our VPS fleet. The doc requirement is honored by this file.
- **One token per agent** still holds — the writer gets its own Bonfires agent
  identity, never shares `@zabal_bonfire`'s.

This makes the institutional memory live in ZAOOS even though the bots run on
Bonfires — per CLAUDE.md, "research stays in ZAOOS forever."

---

## The two system prompts (paste into the Bonfires dashboard)

### PROMPT 1 — Reader: `@zabal_bonfire` (hardened, retrieval-only)

```
You are the ZABAL Bonfire retrieval agent. You answer questions from the
knowledge graph and cite your sources. You are READ-ONLY.

HARD CONSTRAINTS — you have NO write capability:
- No ingest. No node creation. No edge creation. No supersede. No "new fact
  proposal." No "Approve all?" manifest flow. These are removed entirely.
- If a user asks you to add / ingest / commit / correct / build / update a
  fact, DO NOT propose a manifest and DO NOT claim you updated anything.
  Reply: "Writes go through the deep-thinking writer — tag @<WRITER_HANDLE>
  to add or correct a fact." If useful, summarize in 1-2 lines what they'd
  want captured so they can hand it off cleanly.

ANSWER DISCIPLINE:
- Cite sources for every claim. Lead with the PROVENANCE TIER of your top
  source(s): [canonical] verifiable repo/doc/URL · [reported] one human said
  it, unverified · [inferred] connected by an agent. If an episode carries a
  "[provenance: ...]" tag, surface it. Prefer citing the tier over the raw
  Confidence number.
- The server's "Confidence" is a RETRIEVAL score, not a truth probability.
  Never present 1.0 as "this is definitely true."
- If the graph does not contain the answer, SAY SO: "That's not in the graph."
  Do NOT improvise an answer by stitching together adjacent nodes. An explicit
  gap is more useful than a confident guess. (This is how three wrong facts
  entered the graph — see the audit.)
- Distinguish "here's what the graph says" from "here's me reasoning past the
  graph" and label the second clearly when you do it.
- Be concise. Normalize entity titles to their canonical form. Flag when two
  results look like duplicates of the same entity.
```

### PROMPT 2 — Writer: `@<WRITER_HANDLE>` (deep-thinking, sole graph-writer)

```
You are the ZABAL Bonfire WRITER — the single agent permitted to add or change
facts in the knowledge graph. You are deliberate by design. You THINK before
you write, and you never auto-commit.

DEEP-THINKING PROTOCOL — run every step BEFORE proposing a write:
1. RESTATE the candidate fact in one line, in the speaker's ACTUAL words. Do
   not coin a new term and attribute it to someone. (e.g. use "gap filling
   axioma" — the term its author used — never invent "TreeUnix Protocol.")
2. TRIAGE: is this a durable fact worth persisting, or chatter / a question /
   your own output? Only persist real facts about the world. Drop the rest.
3. TIER it honestly — the provenance you can DEFEND:
     [canonical] a verifiable source exists (repo path, doc, URL you checked)
     [reported]  one human asserted it; unverified
     [inferred]  you connected two facts yourself
   Default to the LOWEST tier you can't rule up from. NEVER stamp [inferred]
   as [canonical] — that is the exact failure this role exists to prevent.
4. DEDUP + CONTRADICTION: search the graph for an existing or conflicting node
   first. If it exists, propose a SUPERSEDE (explicit supersedes edge + downgrade
   the old node), never a duplicate. If it contradicts, surface the conflict to
   the human instead of silently overwriting.
5. SOURCE CHECK: if you cite a URL or path, you must have actually verified it
   resolves. Never invent a path. An unverifiable claim is [reported] at best.
6. SECRET + PII DISCIPLINE (you have no automated scanner — this is on you):
   - NEVER write an API key, token, private key, seed phrase, or connection
     string. Use [REDACTED] if you must reference one.
   - NEVER write a third party's personal email, phone, home address, or a
     sensitive personal/health disclosure about a real person without their
     explicit in-thread consent. Redact to <redacted-email> / <redacted-phone>.
     Names of ZAO ecosystem people are fine; sensitive attributes are not.

OUTPUT: a structured manifest — nodes, edges, each with its [provenance: tier]
and source — then ask "Approve?". COMMIT ONLY on explicit human approval.
Corrections use SUPERSEDE, never append. If you cannot tier it, source it, or
clear the PII bar, DO NOT WRITE IT — say what's missing instead.
```

> Replace `@<WRITER_HANDLE>` in both prompts with the writer's real handle once
> Zaal creates the Bonfires agent.

---

## (superseded) Three topic-sharding options

### Option A — Namespace/shard inside `@zabal_bonfire_bot` (no new bot) ✅ recommended
One bot, one token, one process. DeepMeeting is a **partition/context tag** on the
existing pipeline: episodes from the DeepMeeting group get `source_description:
deepmeeting:<topic>` and a `scope:deepmeeting` marker, and recall can be filtered
to include/exclude that scope. GCvlcnti gets admin on the *group*, not a new bot.

- **Pros:** zero new infra, no token/process to manage, satisfies the
  data-isolation need (scope filter), aligns with the doc-601 collapse, nothing
  new to decommission later. The "keep TreeUnix out of the main graph" goal is met
  by *scope*, not by a separate bot.
- **Cons:** isolation is logical, not physical — a bug in the scope filter could
  leak DeepMeeting vocab into general recall (the exact failure that started this).
  Mitigation: make `scope` a hard filter on both ingest labeling and recall.

### Option B — Separate bot, shared graph (the transcript's "hybrid dispatcher")
A real `@deepmeeting_bot` process, its own token, writing to the *same* Bonfire
graph with a shard tag; `@zabal_bonfire_bot` orchestrates.

- **Pros:** physical process isolation; GCvlcnti can fully own his surface;
  matches the mental model in the transcript.
- **Cons:** a new bot + token + systemd unit + monitoring; **directly trips the
  no-new-bots collapse**; two processes writing one graph need careful atomic
  sync (the transcript hand-waved "sync back atomically" — that's non-trivial).
  Requires explicit Zaal sign-off against his own consolidation rule.

### Option C — Separate bot, separate graph (true shard)
`@deepmeeting_bot` writes to its *own* Bonfire (a separate `BONFIRE_ID`), promoted
into the main graph only on explicit approval.

- **Pros:** strongest isolation — TreeUnix data physically cannot contaminate the
  main graph until promoted; best fit for "facts at a time / situational
  prototypes" (DvlsMojo's own framing of the v0.01–v0.05 work).
- **Cons:** most infra; a promotion pipeline to build; two graphs to keep coherent.

## Recommendation (superseded by the read/write split above)

Original recommendation was Option A (scope inside the existing bot). The
read/write split supersedes the topic-sharding framing entirely: it isolates by
*capability* (who can write) rather than by *topic* (what's written), which is
the stronger guarantee. Topic isolation (keeping TreeUnix vocab quarantined) can
still ride on top — as a `provenance: inferred` tier + a scope tag on the
writer's path — without needing a separate bot per topic.

## Hard constraints (regardless of option)

1. **One token per agent — never shared.** The transcript raised "same Telegram
   bot token for manus + bonfires agent." Zaal's "prob not best" is correct: two
   pollers on one token fight over `getUpdates` and silently drop each other's
   updates. If any new bot is created, it gets its own token from `@BotFather`.
2. **Scope isolation is the requirement, not the bot.** Whatever option, the
   testable goal is: TreeUnix/"gap filling axioma" vocabulary must not surface in
   general `@zabal_bonfire_bot` recall unless explicitly promoted.
3. **GCvlcnti admin scope must be bounded.** Admin on the DeepMeeting
   surface/group ≠ owner of the main graph. The transcript shows confusion about
   view-vs-edit/config permissions — define this explicitly before granting.
4. **Correct vocabulary at the source.** Per doc 798, seed the DeepMeeting scope
   with "gap filling axioma" as canonical and the bot-minted "TreeUnix Protocol"
   as a downgraded/superseded alias, so the shard doesn't re-import the error.

## If Zaal greenlights a new bot (B or C): prompt scope checklist

The draft system prompt the bot is waiting to finalize should cover:

- Core protocol definitions in GCvlcnti's *actual* terms (not bot-coined ones).
- Explicit scope exclusions (e.g. Stigmergy excluded from this shard, per transcript).
- Subordinate-shard role: how it reports up to `/root`, atomic sync semantics.
- Data-isolation guarantee: what it may and may not write to the main graph.
- The `pii_scan` + `secret_scan` gates (doc 798) apply to its ingest too.
- Governance: who approves promotion of shard facts into the main graph.

## Decision needed from Zaal

Architecture decided (read/write split); both bots Bonfires-hosted; both
prompts drafted above. Remaining — all on the Bonfires dashboard, not this repo:

- [x] **Split axis** — capability (read vs write), not topic. ✅ Zaal 2026-06-06
- [x] **Where the writer lives** — Bonfires-hosted agent, like the reader. ✅
- [ ] **Apply Prompt 1** to `@zabal_bonfire` (hardens it to read-only).
- [ ] **Create the writer agent** on Bonfires (own identity, optional API key),
      paste Prompt 2, set its real handle into both prompts.
- [ ] **GCvlcnti scope** — admin on the writer/DeepMeeting surface, not the main
      graph. Define view-vs-edit explicitly (transcript showed confusion).
- [ ] **Vocabulary seed** — via the writer: "gap filling axioma" as canonical,
      bot-minted "TreeUnix Protocol" as a superseded alias (doc 798 Finding 1).

Both prompts are paste-ready; the steps above are dashboard actions for Zaal.

## Bonfires (Delve) agent-config schema — observed 2026-06-06

Captured from Zaal's dashboard screenshots so the platform's parameters live in
ZAOOS even though the agents run on Bonfires. Tabs on each agent:

| Tab | Fields |
|---|---|
| General | Agent Name · Username (IMMUTABLE after creation) · System Prompt · Timezone |
| Platform | Telegram bot token · Chat ID · Topic ID · "don't ignore reporting group" |
| Chat | Group Policy · DM Policy · Silent Mode · Disable Storing Group/DM Messages · Allowed Users · Scheduling Allowed Users · DMs Store Allowed Users · Server Configs |
| Features | Image/Audio/Document Input · Image Generation · Task Scheduling · Default Image Model · (admin) Max Tool Iterations, Max Parallel Tool Calls |
| Tools | MCP tool checkboxes — see below |
| Skills | Judging skills (hackathon/synthesis/celebrity/dev3pack) — all writer-irrelevant |
| Personality | Discrete editable traits, injected into every response (the 12 constraints live here as 15 traits) |
| LLM Config | **Internal Model** (think/decide/label flow) · Default Response Model · Allowed Response Models |

**Tools available** (current `@zabal_bonfire` has 9 enabled): Firecrawl Web
Scraper, Fireflies Meeting Transcripts, **Bonfires Delve** (KG tools + insights),
Cross-Bonfire Search, Twitter Get Tweets, Message Search, User Lookup, Scheduling
Tools, Trimtab Tools — enabled. Off: Hackathon Review, **Agent Personality**
(self-edits traits — keep OFF), Document Store, **REST API** (arbitrary
http_request), Error Reporting, ClickUp, Moltbook, Surf AI, Schelling Point,
sheeets, **Delve Knowledge Graph (Write episodes)**, judging tools, HubSpot.

**Open crux:** does "Bonfires Delve" write, or only read? "Delve Knowledge Graph
(Write episodes)" is a separate, currently-unchecked tool, yet the bot writes
today — so "Bonfires Delve" likely bundles read+write. This decides whether the
READER can be hardened structurally (uncheck write tools) or only by prompt. The
bot can answer this itself (it has the tools) — see generation prompt below.

**`@zabal_bonfire` current 15 personality traits:** extraction_discipline,
dedupe_policy, edge_direction, title_normalization, scope_constraint,
bot_self_reference, state_truthfulness, verbatim_preservation, provenance,
identity_facets, speaker_routing, temporal_evolution, batch_paraphrase_gate,
voice, recall_format. (provenance already mandates confidence 0.6-1.0 — the
always-1.0 problem in doc 798 is adherence, not a missing rule.)

## Writer build kit — `@zabal_deepthink`

- **General:** name `ZABAL Deep Think`; username `zabal_deepthink` (immutable);
  system prompt = the deliberate-writer prompt (Prompt 2, deep-think protocol).
- **Platform:** own @BotFather token; same Chat ID `1003940147360` (shared room).
- **Chat:** Allowed Users = bettercallzaal + GCvlcnti.
- **Features:** Document Input on; Image Gen + Task Scheduling off.
- **Tools:** Bonfires Delve + Delve Knowledge Graph (Write episodes) + Firecrawl
  + Fireflies + Cross-Bonfire Search + Message Search + User Lookup + Twitter +
  Trimtab. OFF: Agent Personality, REST API, Scheduling.
- **Skills:** none.
- **Personality:** copy the 15, add 4 — `deep_think_gate`,
  `confidence_calibration` (default 0.7; 0.9+ only with retrieved source; 1.0 only
  on-chain/official; inference 0.6), `pii_guard`, `vocabulary_fidelity` ("gap
  filling axioma" canonical, "TreeUnix Protocol" superseded alias).
- **LLM Config:** Internal Model = most capable reasoning preset (the deep-think
  lever). Confirm available presets with the bot.

## Generation prompt — paste to `@zabal_bonfire` (Zaal's dogfood idea)

Have the bot generate the writer config using its live platform knowledge,
WITHOUT writing any of it to the graph (respects `bot_self_reference`):

```
Context, do NOT ingest any of this to the graph (this is operational
configuration, not graph content - your bot_self_reference rule applies):

I'm creating a sibling agent on Bonfires: @zabal_deepthink, the deliberate
WRITER for our knowledge graph. You will become RETRIEVAL-ONLY; it becomes the
only agent that writes facts. It must "think before it writes."

Using your knowledge of THIS Bonfires platform, generate its full config:
1. Which exact Tools must be enabled for it to WRITE episodes/nodes, and which
   tool you currently use to write - does "Bonfires Delve" write, or is it
   "Delve Knowledge Graph (Write episodes)"? Tell me the truth about your own
   write path.
2. The Internal Model presets available in LLM Config, and which is the most
   capable for a think/decide/label flow.
3. A full system prompt for it that adds a deep-think protocol on top of our 12
   constraints: restate facts in the speaker's own words (never coin a term and
   attribute it), triage chatter, dedupe + contradiction-check, verify any
   source_url resolves, calibrate confidence honestly (default 0.7, 1.0 only for
   on-chain/official), and a PII guard (no third-party personal/health data
   without consent). Commit only on "approve all".
4. Which of your 15 personality traits it should inherit, plus any new traits.

Output as a config spec I can paste tab-by-tab. Do not write anything to the graph.
```

The bot's answers to #1 and #2 close the gaps in the build kit above (the write
tool + the model presets). Reconcile its output with the kit; they should agree.

## Reconciled final writer config (2026-06-06)

`@zabal_bonfire` generated a config spec (Zaal's dogfood). Reconciled with the
build kit. What the bot added, what it got wrong, and the final answer:

**Adopted from the bot (good):**
- **Confidence ladder refinement** — "conversational claims max 0.85" caps a
  single human assertion below a sourced fact. Merged into the final ladder:
  0.6 = inference / no verifiable source · ≤0.85 = single conversational claim
  (reported, unverified) · 0.9 = verified secondary source_url you retrieved ·
  1.0 = on-chain or official primary data only.
- Crux **hypothesis**: bot claims "Bonfires Delve = read; writes go via
  `POST /knowledge_graph/episode/create`" (the "Delve Knowledge Graph (Write
  episodes)" tool — same endpoint `scripts/bonfire-ingest/` posts to).

**Corrected (bot was wrong / unreliable narrator — cf. its own state_truthfulness):**
1. **Crux is CONTRADICTORY, treat as unverified.** The bot says Bonfires Delve is
   read-only, but the live bot *writes today with "Delve KG (Write episodes)"
   unchecked* — so either Bonfires Delve writes, or there's another path. Don't
   trust the bot's self-report. Writer: enable BOTH tools (covers it either way).
   Reader: empirical test — after hardening, try to make it write; if it still
   can with only Bonfires Delve on, that tool writes and the reader needs
   prompt-enforcement, not just tool-unchecking.
2. **Keep Firecrawl ON.** The bot wanted to disable web search, but its own
   protocol step 4 (verify source_url resolves) REQUIRES it. Disabling its
   verification tool guts the verification step. Keep it.
3. **Keep `batch_paraphrase_gate` + `voice` traits.** The bot dropped 3 of 15;
   `recall_format` is fine to drop (writer doesn't recall), but
   `batch_paraphrase_gate` IS the writer's manifest/preview/batch-approval commit
   discipline — core. `voice` stays for register consistency.
4. **Keep `vocabulary_fidelity` as a named trait** with the seed ("gap filling
   axioma" canonical / "TreeUnix Protocol" superseded). The bot folded it into a
   vague "no new terminology" and lost the seed — the exact fix doc 798 needs.

**Final tools:** Delve Knowledge Graph (Write episodes) + Bonfires Delve +
Firecrawl + Fireflies + Cross-Bonfire Search + Message Search + User Lookup +
Twitter + Trimtab. OFF: Agent Personality, REST API, Scheduling, autonomous triggers.

**Final personality:** inherit 14 of 15 (drop only `recall_format`), add 4 —
`deep_think_gate`, `confidence_calibration` (the ladder above),
`pii_guard` (consent-based; ZAO names ok, sensitive attributes not),
`vocabulary_fidelity` (with seed).

**LLM Config:** Internal Model = highest-capability reasoning preset (bot
recommends "Claude Opus tier"). Still need the actual dropdown preset names.

**RESOLVED — intake (Zaal, 2026-06-06):** direct, gated to two. The writer
processes messages only from `bettercallzaal` + GCvlcnti (Allowed Users);
everyone else is ignored. Less friction than hand-off-only, but not open to the
group — the two trusted writers can DM or tag it directly to add facts.

## Source

- Live `@zabal_bonfire_bot` / DeepMeeting transcript, 2026-06-06 (Zaal-supplied).
- CLAUDE.md → Primary Surfaces (the no-new-bots rule + doc-601 collapse).
- Doc 798 (graph quality audit — the bad-data risk that motivates isolation).
- Docs 601 (agent-stack cleanup), 665/669/673 (Bonfire architecture), 734 (BonfireMemory adapter).
