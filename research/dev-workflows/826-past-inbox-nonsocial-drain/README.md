---
topic: dev-workflows
type: market-research
status: research-complete
last-validated: 2026-06-09
superseded-by:
related-docs: "825, 824, 822, 823, 778, 780"
original-query: "yes lets drain everything i'd like to rerun research on these - the ~23 non-social inbox items (newsletters, Spotify, substacks, GitHub, tool links)"
tier: STANDARD
---

# 826 - Past-Inbox Non-Social Drain (the tail)

> **Goal:** Finish the inbox drain. Doc 825 covered the 84 social items; this covers the remaining 25 non-social ones - forwarded newsletters, tool/skill links, GitHub repos, a podcast, and several of Zaal's own embedded ideas/requests. Content lived in the email bodies (key-gated AgentMail), so this was fetched inline, not via the workflow.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Adopt the `superpowers` skill + study the Anthropic "Claude Skills from scratch" build** | Two separate inbox items point here: Shann's post (808 likes) calls superpowers "the simplest way to level up any project in Claude, code or non-code, setup under 5 min"; Kirill's (5.3M views) is the Anthropic engineers' 16-min Claude Skills build. ZAO already uses superpowers - formalize a ZAO skill library (extends doc 825 Cluster 1). |
| 2 | **Empire Builder's `SKILL.md` is the reference pattern for any ZAO on-chain agent skill** | It's a clean ERC-4337 SmartVault treasury-orchestration skill (Base/Arbitrum: payouts, burns, airdrops, Clanker deploys) with the owner-signs-not-cosigners guard. Empire Builder is already a ZAO partner (docs 780/778). Copy its self-contained 4-file structure (SKILL + http-api + workflows + contracts) for ZAO treasury/bounty skills. |
| 3 | **Steal "signal diversity" from the clear retrospective as ZAO's vibe-code QA doctrine** | The retrospective's core lesson: LLMs write code that passes tests while not working; the fix is MULTIPLE independent verification streams (design doc + review + independent tests + fuzz + mutation + multi-LLM review), never one metric (Goodhart's Law). This IS ZAO's GAN/`/qa`/`/verify` pattern - name it explicitly in agent prompts. |
| 4 | **Two of Zaal's embedded ideas are worth real follow-up; the rest of the tail is personal reading** | The inbox tail carried Zaal's own notes: a Red Sox inspiration-account idea, a Crypto-Fam auto-caption photo tool, an Ellsworth-library Plural event, and a request to transcribe Kirill's 4hr->18min video. These become Next Actions. The daily briefings / substacks are reading, not research - logged, not deep-dived. |

## Findings

### Cluster A - Tools, skills, agent infra (the high-signal half)

| Item | What it is | ZAO relevance |
|------|-----------|---------------|
| **Empire Builder `SKILL.md`** (empirebuilder.world/skill) | CLI skill orchestrating ERC-4337 SmartVault treasuries on Base/Arbitrum - leaderboard payouts, token burns, airdrops, Clanker deploys via HTTP + wallet-signed tx. Guard: `distribute-prepare` signer must equal vault `owner()`. Production-only (no testnet). | Reference architecture for ZAO bounty/treasury skills. Partner already (docs 780, 778). |
| **intern-os** (github.com/fruteroclub, AGPL) | Human+AI coordination framework: workstream files = authoritative state, BRIEF.md/STATUS.md persistence, task claim/release. Ships adapters for Hermes Agent, OpenClaw, Claude Code. | Direct overlap with ZOE/Hermes coordination + cowork tracker. Worth a closer look for the agent-state layer. |
| **clear vibe-code retrospective** (github.com/cuzzo/clear) | "Signal diversity" doctrine: no single metric (coverage, complexity) survives Goodhart; stack independent verification streams. "You are the driver, LLMs are the car." | ZAO QA/GAN/verify doctrine, articulated. |
| **Stitch DESIGN.md** (Google, open-sourced May 2026) | Google open-sourced the DESIGN.md spec + design-system upgrades for Stitch (their AI design tool). | Pattern for a ZAO `DESIGN.md` to pin the navy/gold + brand-palette system (ties to the brand-palette memo). |
| **"Claude skill that replaces your morning planning"** (returnmytime.com) | A 20-min, 4-step build of a morning-planning Claude skill (exact prompt included). | Template for a ZAO `/morning` skill upgrade (one already exists). |
| **WaliGPT / OpenClaw Launcher** (app.waligpt.com) | Hosted "deploy AI agents" launcher built on OpenClaw. | Note only - ZAO decommissioned OpenClaw (doc 601); do NOT re-adopt. Tracking competitor surface. |
| **chat.z.ai** | Z.ai (GLM models) free chat - a research/inference surface. | Free alt-model surface; minor. |
| **Descript update** | Transitions, transcription, Underlord upgrades. | ZAO uses Descript for content; FYI. |

### Cluster B - Zaal's embedded ideas + requests (extracted from the bodies)

These items carried Zaal's own typed notes, not just a link:

- **Kirill 4hr->18min video** - note: "grab this 17 min video, get transcript and summarize, then do the same to the 4-hour quote-tweet video." The 16-min video is the Anthropic "Barry and Mahesh built Claude Skills from scratch" walkthrough (5.3M views). NEEDS video transcription (zao-ingest on the YouTube/X video) - flagged as a follow-up, not done here.
- **Red Sox account idea** - "make an inspiring Red Sox social account to get noticed by them and do media for them, based on past hype videos." A BCZ content-play idea.
- **Crypto Fam Radio** - "make something where I can take a photo and send it with an auto caption when I put a couple words together + pick parameters." An auto-caption tool idea.
- **Plural Events / Chapter leads** (lu.ma) - note: "this is important, let's think how we can do an event at the local Ellsworth library." Ties to ZAO Festivals / Ellsworth presence (Parklet, ZAOstock).
- **Monteux School and Music Festival** (monteuxmusic.org) - tagged "RESEARCH"; a classical music school/festival in Maine. Possible ZAO Festivals / Ellsworth-adjacent partner to scope.

### Cluster C - Reading / newsletters (logged, low research value)

Daily briefings + substacks - personal reading, not ZAO research: Beta Briefing "The Builder's Canvas" (3 daily digests, May 1-3), Emily Sundberg / Open Tab (media-business interview), Rian Doris / flowstate ("Keith Ferrazzi" network essay), Matty Bovard / Wyld Flower Meadow (ZAO-adjacent artist's DFOS post - worth a relationship note, not a doc), Adrienne "More coding than writing" (Word-A-Day vocab game launch).

### Skipped

- **Earl Nightingale podcast** (Spotify) - generic motivational speech ("Why Hard Working People End Up Broke"), no ZAO research value; not transcribed.
- **2 junk**: a Gmail delivery-failure bounce + a `visitoralerts.com` dashboard link.

## ZAO Application

- Cluster A feeds the doc-825 Cluster 1 decision (formalize a ZAO skill library) with concrete reference skills: Empire Builder (treasury), intern-os (coordination), the morning-planning template, and the Anthropic skills-build video.
- Cluster B items become tracked actions (below) so Zaal's own captured ideas don't evaporate in the inbox.
- `superpowers` is already installed in this environment - the decision is to lean in + document ZAO usage.

## Also See

- [Doc 825](../../agents/825-past-inbox-redrain/) - the social half of the inbox drain
- [Doc 824](../824-keyless-forkable-fetch-trio/) - the keyless fetch trio used here
- [Doc 780](../../events/780-adrian-empire-builder/) / [Doc 778](../../events/778-tyler-magnetic-zabal-games-build-may27/) - Empire Builder / ZABAL Games

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Transcribe + summarize Kirill's Anthropic "Claude Skills from scratch" video (16-min) + the 4hr source | @Zaal | Research follow-up | Next session |
| Formalize a ZAO skill library; copy Empire Builder's 4-file SKILL structure for a ZAO treasury/bounty skill | @Zaal | Build | Pre-June Games |
| Scope Monteux Music Festival (Maine) as a possible ZAO Festivals / Ellsworth partner | @Zaal | Research | Ad hoc |
| Decide on the Ellsworth-library Plural event idea | @Zaal | Decision | Ad hoc |
| Park the Red Sox inspiration-account + Crypto-Fam auto-caption tool ideas as BCZ content experiments | @Zaal | Idea backlog | When bandwidth |

## Sources

- 25 non-social inbox bodies pulled FULL from AgentMail 2026-06-09 `[FULL - per-message detail endpoint]`
- [Empire Builder SKILL.md](https://www.empirebuilder.world/skill/SKILL.md) `[FULL - WebFetch]`
- [intern-os](https://github.com/fruteroclub/intern-os) `[FULL - WebFetch README]`
- [clear vibe-code retrospective](https://github.com/cuzzo/clear/blob/master/docs/retrospective/how-to-vibe-code-something-that-actually-works.md) `[FULL - WebFetch]`
- [Shann post (superpowers)](https://x.com/shannholmberg/status/2047722364415459463) `[FULL - FxTwitter, 808 likes]`
- [Kirill post (Claude Skills video)](https://x.com/kirillk_web3/status/2043037616979759465) `[FULL - FxTwitter, 5.3M views; the embedded video itself NOT yet transcribed]`
- [r/redsox thread](https://www.reddit.com/r/redsox/s/RDkUspdh7f) `[FULL - Redlib]`
- Earl Nightingale Spotify episode `[PARTIAL - title/desc only; generic motivational content, intentionally not transcribed]`
- Newsletter bodies (Beta Briefing, Emily Sundberg, flowstate, Matty Bovard, Descript, Stitch, returnmytime, Adrienne) `[FULL - AgentMail bodies; tracking links not followed]`
