---
topic: infrastructure
type: design
status: design-approved
last-validated: 2026-07-10
superseded-by:
related-docs: 998, 836, 601, 1021
original-query: "the ZAO OS should be just a library of docs and research on ai and agentic coding - take everything else out and move to a new repo"
tier: DEEP
---

# 1025 - ZAOOS Estate Split: Docs-Library + Code-Out

> **Goal:** Turn ZAOOS from a monorepo-lab into a pure docs/research library, and give the code proper homes - reusing existing repos where they fit instead of minting new ones. Approved by Zaal in the 2026-07-10 brainstorm. This is the target architecture; the actual migration is a separate staged plan (high-risk: a live Vercel app + the VPS bot clone + years of history all relocate).

## The decision (approved 2026-07-10)

ZAOOS stops being the monorepo-as-lab. It becomes **the ZAO knowledge base: all ~820 research docs, docs-only**. Every piece of code moves out to a proper home. Where an existing repo already fits, code moves INTO it rather than into a brand-new repo (Zaal: "see if there's a repo already created for something similar it can be added into").

## Target estate

| Home | Repo | Visibility | Contents | New or existing |
|------|------|-----------|----------|-----------------|
| **Knowledge base** | `ZAOOS` | private | All ~820 research docs (every topic - AI/agentic-coding, music, governance, festivals, business). NO code. | existing, narrowed |
| **The ZAO Farcaster client** | new app repo | (match current) | The `src/` Next.js app (302 API routes, 295 components, the gated client for The ZAO's 188 members). Still a live product - migrated properly. | NEW |
| **Bot framework / engine** | `hermes-orchestrator` | PUBLIC | The reusable engine: the doc-1021 "one engine, many masks" code, the hermes coder/critic/PR pipeline, the conductor. Build-in-public - this is the hermes-canonical vision (the ZAO agent framework, open). | existing |
| **Bot fleet instance (private)** | `zaoos-workspace` | private | Zaal's fleet config: which tokens, which ICM boxes per bot, ops/allowlists/chat-ids, memory. The private brains + wiring on top of the public engine. | existing |

The engine-vs-instance split mirrors doc 1021's engine-vs-brains line: the public framework carries the capability; the private instance carries the identity (ICM boxes) + secrets + ops.

## Why reuse, not mint

- `hermes-orchestrator` already IS "Supervisor framework for AI agents - classify, spawn, watch, intervene" - exactly ZOE's conductor/factory job, and ZOE already reuses its `hermes` code. The fleet engine belongs there, not in a new repo.
- `zaoos-workspace` already exists private and is literally "ZOE workspace: agent configs, memory, daily logs" - the natural home for the private fleet instance.
- Only the Farcaster app has no existing home (channelz + zaalcaster are DIFFERENT clients - private / personal), so it is the one genuinely new repo.

## Migration is staged + separate (NOT part of this doc)

This doc is the target, not the move. The migration is high-risk and gets its own plan:
- The app is live on Vercel; the bot runs live on the VPS (`~/zao-os` clone) - both must keep running through the move.
- `git filter-repo` / subtree splits to preserve history where it matters; secret-scan every extraction (secret-hygiene rules).
- Redirect/rename discipline so nothing 404s or double-deploys.
- Stage it: framework-out first (lowest coupling), then the app, then narrow ZAOOS last. Verify each stage boots before the next.

## Open follow-ups (raised same session, sequenced after this)
- ICM boxes: make more + a skill to organize/manage them (feeds the private-instance brains; can proceed independently of the migration).
- Broader brand audit / agentic-coding-repo cleanup across all projects (supersedes the doc-998 57-repo archive triage, which is paused).
- The doc-1021 bot-factory work is paused pending Zaal's bot questions; note its code now lands in `hermes-orchestrator` (engine) + `zaoos-workspace` (instance), not `ZAOOS/bot/`.

## Also See
- [Doc 998](../998-github-repo-estate-audit/) - the 129-repo estate audit (the archive list, now paused in favor of the broader audit).
- [Doc 1021](../../agents/1021-zoe-bot-factory-icm-fleet/) - the bot-factory design (engine vs brains); this doc places its outputs in real repos.
- [Doc 836](../836-zaoos-repo-estate-census/) - the ZAOOS-internal census.
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the prior consolidation.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Approve this target estate (done in-session 2026-07-10) | @Zaal | Decision | 2026-07-10 |
| Write the staged migration plan (framework-out -> app-out -> narrow ZAOOS), high-risk, reversible, secret-scanned | @Zaal | Doc/plan | 2026-07-13 |
| Confirm the new app repo name + visibility before any code moves | @Zaal | Decision | 2026-07-13 |
| Decide sequencing vs the ICM skill + brand audit (this session's other threads) | @Zaal | Decision | 2026-07-11 |

## Sources
- Brainstorm with Zaal, 2026-07-10 (this session) `[FULL]` - the four-question sequence (docs-only ZAOOS keeps all docs; code splits by type; reuse existing repos; app gets a new repo).
- `gh repo list bettercallzaal/ZAODEVZ` + `gh repo view` for candidate repos + visibility `[FULL]`, fetched 2026-07-10.
- Doc 998 estate audit; CLAUDE.md monorepo-as-lab doctrine (now superseded for NEW structure by this split) `[FULL]`.
