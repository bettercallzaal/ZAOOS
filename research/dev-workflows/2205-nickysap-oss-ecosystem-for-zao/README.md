---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-08-06
superseded-by:
related-docs: 2204, 695, 710, 712
original-query: "loop building more research - more of what darwin (nickysap / 99darwin) has made; also we are working on Zuke, improve it for her too"
tier: STANDARD
---

# 2205 - nickysap's (99darwin) OSS ecosystem: what ZAO should adopt, and how it unblocks Zuke

> **Goal:** Survey nickysap's (nick / @nickysap / FID 269091 / github.com/99darwin) public repos beyond `orchestrator` (doc 2204) and name what ZAO adopts. Headline: his `farcaster-audio` is the full OSS Juke engine, which can unblock **Zuke** (ZAO's audio-spaces surface at zuke.thezao.com, built on Juke).

## Key Decisions (adopt-list, recommendations first)

| # | ADOPT from nickysap | What it is (FULL-read README) | ZAO fit + status | Grade |
|---|--------------------|-------------------------------|------------------|-------|
| 1 | **`farcaster-audio` (Juke engine, MIT)** to SELF-HOST for Zuke. | The complete OSS Juke: `backend/` (FastAPI + Postgres + Redis - SIWF/JWT auth, room lifecycle, LiveKit token issuance, Neynar feed proxy, miniapp webhooks, recording orchestration) + `farcaster-audio/` (Expo iOS client) + `landing/` (juke.audio Next.js). "A reference implementation other developers can fork." | The Zuke/Juke integration was **BLOCKED on nickysap issuing a `JUKE_API_KEY`** for the HOSTED api.juke.audio (doc 695/710/712). The OSS engine removes that dependency: ZAO can run its own Juke backend for Zuke and stop waiting on a hosted key. This is the single biggest unblock. | **HIGH** |
| 2 | **`juke-space-recap` (MIT)** - the recap-video pipeline. | Offline: audio recording -> 1920x1080 recap mp4. Deepgram Nova-3 (diarization + utterances) -> host-intro detection ("who are you?") -> human-in-the-loop `@username` fill -> Neynar PFP lookup -> Remotion render. Honestly documents its limits (missed guests, misheard names). | ZAO ALREADY has its own fork: `bettercallzaal/mp3-to-mp4-pipeline` (private) + `spacetovideo` (public). **Diff ZAO's fork against nickysap's** and pull his diarization/intro-detection + human-in-the-loop step if ours is thinner. Directly feeds Zuke -> recap -> ZM (zao-media) content-everywhere. | **HIGH (reconcile)** |
| 3 | **`geo` (MIT)** - GEO SaaS. | Next.js 16 app: scans a site, generates `llms.txt` + JSON-LD schema, monitors AI citations across ChatGPT/Perplexity/Gemini/Google AI, client dashboard. Stack: Prisma, NextAuth, Stripe, Firecrawl, OpenAI/Perplexity/Gemini/Claude. | Serves ZAO's TOP GEO priority ([[project_geo_zao_iconic]] - "own what is The ZAO"). The AI-citation-monitoring loop is exactly what ZAO wants to track for "what is The ZAO" across models. Mine his citation-monitor + llms.txt/JSON-LD generators; align with the ICM-box-as-upstream model (`icm-grounding.md`). | **MEDIUM** |
| 4 | **`obsidian-vault-scaffolder` (MIT, 4 stars)** - a Claude Skill. | Skill: a project spec (or a one-liner) -> a PARA-style Obsidian vault with Bases (DB views), atomized notes (one per risk/question/arch-section), wikilinks, `type:` frontmatter, an `AGENTS.md` briefing, and a self-verify pass. "47 atomized notes from a 286-line spec." | Serves Zaal's second brain ([[project_obsidian_second_brain]] - memory = `[[wikilinks]]` vault). Adopt as a `/vault` skill or fold its atomize+Bases pattern into ZAO's memory tooling. | **MEDIUM** |

Lower-fit but noted (FULL repo-list read): `nexus` (topological AI-landscape map, TS), `maple-sprite-forge` (chained-model 2.5D pixel-art sprite pipeline - relevant to WaveWarZ/game art), `telecast` (Farcaster micro-client in Telegram), `blimey`, `nouncaster`, `awesome-frames`. His stack signature: Farcaster + Neynar + LiveKit + chained-model pipelines + Claude-skills - the same primitives ZAO builds on.

## The Zuke connection (why threads 1 + 2 are one)

nickysap builds the audio tech (`farcaster-audio` = Juke); **Zuke = ZAO's branded audio-spaces product on top** (zuke.thezao.com, `ZUKE_ADMIN_PASSWORD` + `JUKE_WEBHOOK_SECRET`, built in the "Nicky test phase" - [[project_zuke_dev_secrets_no_rotate]], [[project_juke_integration]]). So "improve Zuke" and "more of what darwin made" are the same arc:

- **Unblock:** Zuke depended on Juke's hosted API + a key nickysap had to issue (doc 695/710/712 all end "BLOCKED on nickysap"). The MIT `farcaster-audio` engine lets ZAO self-host and own the stack.
- **Enrich:** `juke-space-recap` turns every Zuke space into a recap video for ZM (zao-media).
- **Discover:** `geo` makes Zuke (and The ZAO) findable to AI search.

## What ZAO already has (don't rebuild)

- Juke integration Path A (iframe embed, `/live/[spaceId]`, `src/lib/spaces/juke.ts`, `JukeEmbed.tsx`) + Path B (`POST /api/juke/space`, `src/lib/spaces/juke-api.ts`) - shipped, PRs #598/#608/#613. These target the HOSTED api.juke.audio; self-hosting (#1) would point them at ZAO's own backend instead.
- Recap pipeline forks: `mp3-to-mp4-pipeline`, `spacetovideo`, `zaoscribe` (Discord audio -> Whisper -> action tracker).
- The ZAOcoworking bot `/juke <title>` command (ZAODEVZ/ZAOcowork PR #3).

## Also See

- [Doc 2204](../../agents/2204-cross-family-verification-99darwin-orchestrator/) - the first darwin-arc doc (his `orchestrator` skill -> ZOE cross-family verify, shipped)
- [Doc 695](../../music/695-juke-integration-zao/), [Doc 710](../../music/710-juke-path-b-architecture/), [Doc 712](../../music/712-juke-integration-remaining-gaps/) - the Juke integration + the nickysap-blocked gaps
- `.claude/rules/credit-attribution.md` - all adoption credits nickysap + the repo license

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide Zuke direction: self-host `farcaster-audio` (own the stack) vs stay on hosted Juke (wait on nickysap's key) - a fork-vs-partner call | Zaal | Decision | 2026-08-13 |
| Diff `bettercallzaal/mp3-to-mp4-pipeline` against nickysap's `juke-space-recap`; PR the delta (diarization / intro-detection / human-in-the-loop) if ours is thinner | Zaal | PR | 2026-08-13 |
| Mine `99darwin/geo`'s AI-citation-monitor + llms.txt/JSON-LD generators for the ZAO GEO priority; align to ICM-box-upstream | Zaal | PR/spec | 2026-08-20 |
| Evaluate `obsidian-vault-scaffolder` as a `/vault` skill for the second brain | Zaal | Spike | 2026-08-20 |
| CLARIFY (blocks any Zuke build): where Zuke's code lives (not in ZAOOS/ visible repos), who "her" is, and the specific improvement | Zaal | Answer | 2026-08-07 |

## Sources

- [github.com/99darwin?tab=repositories](https://github.com/99darwin) - full repo list read via `gh api users/99darwin/repos` (30 repos, sorted by pushed) **[FULL]**
- READMEs read FULL via `gh api .../readme`: [farcaster-audio](https://github.com/99darwin/farcaster-audio), [juke-space-recap](https://github.com/99darwin/juke-space-recap), [geo](https://github.com/99darwin/geo), [obsidian-vault-scaffolder](https://github.com/99darwin/obsidian-vault-scaffolder) **[FULL]** (other repos' descriptions read from the repo-list, not each README - **[PARTIAL - top 4 read fully]**)
- ZAO memory (FULL): [[project_juke_integration]], [[project_zuke_dev_secrets_no_rotate]], [[project_geo_zao_iconic]], [[project_obsidian_second_brain]] **[FULL]**
- `gh repo list bettercallzaal` - confirmed ZAO's own recap forks + no visible `zuke` repo **[FULL]**
