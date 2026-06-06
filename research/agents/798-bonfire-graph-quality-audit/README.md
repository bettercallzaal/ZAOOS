---
topic: agents
type: audit
status: drafted-2026-06-06 (audit + 1 fix shipped: PII gate; calibration + provenance recommendations pending Zaal greenlight)
last-validated: 2026-06-06
related-docs: "665, 669, 673, 734, 796"
original-query: "look thru bonfire stuff — graph quality audit"
tier: STANDARD (codebase audit of scripts/bonfire-ingest + bot/src/zoe Bonfire path + live-transcript evidence)
---

# 798 - ZABAL Bonfire: graph data-quality audit

> **Trigger (Zaal, 2026-06-06):** a long live transcript from the `@zabal_bonfire_bot`
> group. Inside one session the bot surfaced **three** factual errors — all
> previously stamped `Confidence: 1.0` — and ingested a third party's full legal
> name + a health diagnosis as foundational nodes. This audit asks: how trustworthy
> is the graph, and what's the cheapest path to making confidence mean something?

## What this audit covers

The ingest + recall surface that ZAOOS actually controls:

- `scripts/bonfire-ingest/` — `bonfire_client.py` (the POST pipeline), `secret_scan.py`,
  `pii_scan.py` (new, this doc), the four `ingest_*.py` sources, `verify_manifest.py`.
- `bot/src/zoe/thread-memory.ts` + `bonfire-queue.ts` — ZOE's emit path into the graph.
- The live transcript as ground-truth evidence of failure modes.

What it does **not** cover: the Bonfires.ai server internals (entity-resolution,
the `/labeling/hybrid` vector store, how `Confidence` is computed server-side).
Those live in Josh's infra; we can only observe behavior, not source.

## Finding 1 — Confidence is decorative (highest priority)

Every recall answer in the transcript carried `Confidence: 1.0`, **including the
three that were wrong**:

| Claimed at 1.0 | Reality | How it was caught |
|---|---|---|
| "TreeUnix Protocol" is GCvlcnti's term | He never used it — his term is "gap filling axioma." The bot minted the phrase | Gustavo happened to be in the room |
| joshua.eth and Ryan are the same person | Two distinct people | Zaal corrected by hand |
| ZAO Music Entity doc at `research/business/475` | Real path is `research/music/475` (other 404'd) | Zaal clicked the link |

The pattern: **confidence is not calibrated to correctness.** A 1.0 stamp is
applied to fabricated relations as readily as to sourced facts. Every catch came
from a human who already knew the answer — meaning the graph is currently only as
reliable as the person reading it, which defeats the point of a memory layer.

This is the same failure class as the persona/seed drift fixed in doc 796 and the
hallucinated-source 404: **the system asserts provenance it hasn't earned.**

**Recommendations (cheapest first):**

1. **Stop trusting server `Confidence` as correctness.** Treat it as "retrieval
   score," not "truth probability." Document this so nobody downstream gates on it.
2. **Source-class confidence floor at ingest.** Our pipeline already has the right
   signal — `source_description` — but doesn't use it to bound confidence. Stamp
   ingested episodes with a *provenance tier* in the body so recall can cite it:
   - `tier:canonical` — ZAOOS research README, repo code, a doc Zaal authored
   - `tier:reported` — meeting summary, chat assertion (single human, unverified)
   - `tier:inferred` — the bot connected two facts itself (lowest trust)
   The transcript's three errors were all `inferred` masquerading as `canonical`.
3. **Human-correction episodes should *supersede*, not append.** The transcript
   shows the bot doing this well for the 475 path (explicit `supersedes` edge,
   old node downgraded to 0.1). Make that the *required* shape for every
   correction, and surface "this was corrected by <human> on <date>" in recall.

## Finding 2 — No PII gate at ingest (FIXED in this doc)

The transcript commits a real person's **full legal name + Hyper-IgE Syndrome
diagnosis** into the graph as foundational nodes. `.claude/rules/pii-hygiene.md`
already flagged this exact gap as an open follow-up:

> "The `BonfireMemory` adapter ... does NOT currently scan for PII. **Open
> follow-up:** add PII regex to the adapter's pre-POST scan."

**Shipped here:** `scripts/bonfire-ingest/pii_scan.py` — a second gate alongside
`secret_scan.py`, wired into `IngestPipeline.ingest()`. Severity is asymmetric on
purpose (the graph legitimately holds people, so over-blocking the 670-doc bulk
ingest is the failure mode to avoid):

- **HIGH → block:** formatted phone, US SSN, Luhn-valid credit card, labeled DOB.
- **MED → log + post:** non-allowlisted email, personal Telegram handle, address.
- **skip:** allowlisted emails + `*_bot` handles.

**The honest limitation — and why this is a floor, not a fix:** regex catches
*structured* PII only. The transcript's actual leak — a name and a free-text
health disclosure — is **just words**; no regex detects it. Catching that needs
one of:

- **(a) Human-in-the-loop** — the bot *already* asks "Approve all?" before
  committing manifests. Today that's the only real backstop for names/health
  data. It works only when a vigilant human reviews each manifest. *Recommend:
  make the approval prompt explicitly call out person-nodes and any
  health/biographical free-text so the reviewer's eye is drawn to them.*
- **(b) LLM classifier** at ingest — a cheap pass ("does this episode contain a
  third party's name + sensitive personal attribute they didn't consent to
  share?") gated to MED/HIGH. This is the real fix; tracked as a follow-up,
  not built here (needs Zaal's call on cost + which model).

Per pii-hygiene.md, none of the name/diagnosis content is reproduced in this doc.

## Finding 3 — Ingest provenance is thin and unverifiable

- `verify_manifest.py` notes GET-by-UUID returns 404 even for confirmed episodes
  (Bonfires stores under internal UUIDs ≠ the supplied one). **We cannot verify
  what we ingested.** The manifest is a record of *attempts*, not *graph state*.
  Until the API exposes a stable read-back, we're ingesting blind.
- `ingest_research_library.py` pipes ~670 docs with `source_description` =
  `zaoos-research:<path>`. Good — but the 475 error shows even canonical paths
  drift. **Recommend:** the ingester should `HEAD`-check each `source_url` it
  emits and refuse to stamp a 404 path as canonical.

## Finding 4 — Recall has no "I don't know" floor

The "meaning of life" exchange shows the bot improvising a plausible answer from
adjacent nodes (Proof of Meaningful Work, Contribution Circles) rather than
saying "not in the graph." Confident improvisation is exactly how the three
Finding-1 errors entered. **Recommend:** a recall instruction to distinguish
"here's what the graph says" from "here's me reasoning past the graph," and to
prefer an explicit gap over a synthesized answer.

## Priority / effort

| # | Fix | Effort | Status |
|---|---|---|---|
| 2 | PII gate at ingest (structured) | done | ✅ shipped this doc |
| 1a | Stop gating on server `Confidence`; document it | doc-only | recommend |
| 1b | Provenance tier (`canonical`/`reported`/`inferred`) in episode body | S | recommend |
| 3b | `HEAD`-check `source_url` before stamping canonical | S | recommend |
| 1c | Require `supersedes` shape for corrections | S | recommend |
| 4 | Recall "I don't know" floor (prompt) | S | recommend — bot-prompt, lives on VPS |
| 2b | LLM PII classifier (names + health free-text) | M | needs Zaal greenlight (cost/model) |

## Open questions for Zaal

1. **Provenance tiers** — adopt the 3-tier (`canonical`/`reported`/`inferred`)
   stamp in episode bodies? It's the highest-leverage, lowest-cost calibration fix.
2. **LLM PII classifier** — worth a cheap per-ingest classification pass for
   names + sensitive free-text? Which model (Minimax local vs hosted)?
3. The recall-prompt fixes (Findings 1a, 4) live in the bot's system prompt on
   the VPS, not in this repo. Want those folded into the doc-799 DeepMeeting
   prompt work, or patched into the main `@zabal_bonfire_bot` prompt separately?

## Source

- Live `@zabal_bonfire_bot` transcript, 2026-06-06 (Zaal-supplied).
- `scripts/bonfire-ingest/` — pipeline code (audited + extended).
- `.claude/rules/pii-hygiene.md`, `.claude/rules/secret-hygiene.md`.
- Docs 665 / 669 / 673 (Bonfire integration), 734 (BonfireMemory adapter), 796 (drift precedent).
