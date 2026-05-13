---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-12
related-docs: [640, 642, 644, 645, 467, 641]
tier: DISPATCH
source: 2-parallel-brand-fit-subagents-2026-05-12
---

# 646 - Brand-fit audits: Magnetiq + AttaBotty bots

> Goal: pressure-test each team bot's persona, scope, commands, and memory model against the actual brand reality. Apply low-risk persona tightenings now, queue larger changes.

## Recommendation: APPLY persona edits in this PR. Defer new commands to a follow-up PR after token deploy.

Both bots are architecturally sound (per Doc 645). What was missing: brand-specific facts the bot can't infer + voice drift on kayfabe (AttaBotty) + scope rules (Magnetiq). Those land here.

## What changed in this PR

### `bot/src/teams/magnetiq/persona.md`

- Added SAPS framework awareness (Status/Access/Power/Stuff) to "What you care about" - core of Magnetiq's new positioning
- Added new "Reference facts" section locking 5 immovable facts:
  - Flow blockchain (Dapper Wallet) vs ZAO's EVM stack - no native cross-chain
  - No public API - bot proposes ideas + helps schedule, never executes
  - Team: Kaylan CEO (not here), Tyler COO (here with Zaal), Caitlin TBD
  - Zabal Connector = existing Magnet, template for future ZAO event Magnets
  - Batch-send addresses notification fatigue (Tyler's in-flight feature)
- Updated Whop fee: 3% -> 2.7% + $0.30 per transaction (Doc 641 actual figure)
- Added "ZAOville July (pre-stock test)" to event awareness
- Added hard rule: refuse Magnetiq sales/enterprise strategy outside ZAO integration scope (redirect to Kaylan via Zaal)

### `bot/src/teams/attabotty/persona.md`

- Tightened kayfabe boundary: "Never volunteer the real person's name. Let Zaal control that boundary." (was: would use real-name on correction, too loose)
- Added "Never invent new lore" rule - bot stays consistent with established /facts, asks Zaal if unsure
- Clarified "private planning space" - bot never speaks as AttaBotty addressing the public
- Added new "Reference facts" section:
  - William Stewart-Carreras (real human, never volunteer the name)
  - DaNici (wife, animation + design partner)
  - Music archive 2006 to present, current 3-song setlist
  - Cipher = first ZAO Music DBA release (DCoop/GodCloud/Iman)
  - Monday cadence: ONE stream/week, full week to iterate
  - YouTube primary archive (Twitch deletes VODs after 90 days)
  - ZAOstock Oct 3 2026 in Ellsworth - AttaBotty production lead, DaNici visual design
- Strengthened nounish match-fund warning: bumped to UNVERIFIED as of 2026-05-12, hard-rule refusal to quote $10:$50 ratio until Zaal confirms program + URL + administrator

## Key findings by brand (full audits as sub-files)

### Magnetiq - [magnetiq.md](./magnetiq.md)

- **Top fact bot didn't know:** Magnetiq runs on Flow blockchain. ZAO is EVM. No native cross-chain. Integration is link-based, not programmatic. (Doc 65 + Doc 467 Part 1)
- **Top missing capability:** `/saps <idea>` command - frames every idea through Magnetiq's Status/Access/Power/Stuff lens. Reflexive use makes bot immediately useful.
- **Top over-build:** Daily summary cron at 06:00 ET. Tyler may only be in chat 2-3x/week. Recommend default OFF; enable per env once cadence proven.
- **Other deferred commands:** `/feature <name> <status>` (track Tyler's batch-send progress), `/magnet <name>` (cache SAPS Magnet specs), `@magnetiq validate <idea>` (proactive SAPS breakdown).

### AttaBotty - [attabotty.md](./attabotty.md)

- **Top persona edit:** Line 14 kayfabe boundary - tightened from "use real-name if Zaal corrects" to "never volunteer real name. Let Zaal control that boundary." Applied this PR.
- **Top open clarification (ask AttaBotty FIRST):** "Who is Onagi? TG/X handle or real name? Are they definitely joining the stream collab chat?" Unblocks chat membership + stream ideation scope.
- **Top missing capability:** `/stream-prep` + `/vod <youtube-url>` + `/transcript <url-or-markdown>`. Monday stream workflow currently 30-45 min manual; these three commands save the cycle.
- **Top unverified claim:** $10:$50 nounish artisan match-fund. No published program found across Nouns DAO, Prop House, Builder DAO, Flows.wtf. Persona now hard-refuses to quote ratio until verified.
- **Out-of-scope (do NOT add):** `/fan-contest`, `/merch-design`, `/nft-mint`, `/auto-shorts`. Bot is private + planning-only.

## Open questions Zaal needs to resolve (this week)

| # | Question | Why blocking | Owner | By when |
|---|----------|--------------|-------|---------|
| 1 | Who is Onagi? TG handle, X, real name, role? | Can't add to allowlist without TG id; affects scope of AttaBotty bot membership | Zaal asks AttaBotty | Today |
| 2 | What is the "artisan meeting place" Zaal referenced? (TG / Farcaster / in-person?) | Affects where AttaBotty community lives + how Magnetiq Magnets might gate that group | Zaal asks AttaBotty | This week |
| 3 | attabotty.com live-embed URL: /live, /stream, or custom? | Affects stream distribution copy + where StreamYard embeds | Zaal asks AttaBotty | Before next Monday |
| 4 | Will AttaBotty share NotebookLM transcripts with the bot? | Unlocks /transcript command + research context | Zaal asks AttaBotty | Before /transcript ships |
| 5 | Nounish artisan match-fund: program name, URL, administrator, exact ratio | Bot currently refuses to quote ratio. Affects pitch to AttaBotty + any future artist | Zaal research | Before pitching funding to AttaBotty |
| 6 | Daily summary cadence per bot - keep 06:00 ET cron or disable until rhythm proven? | Affects whether bot feels useful or noisy in early days | Zaal | Before tokens land |

## Deferred follow-up PR (after token deploy)

| # | Change | Brand | File |
|---|--------|-------|------|
| 1 | Add `/saps <idea>` command (Sonnet, $0.20 cap) | Magnetiq | `bot/src/teams/commands.ts` + persona examples |
| 2 | Add `/stream-prep` command (reads playbook, outputs checklist) | AttaBotty | `commands.ts` |
| 3 | Add `/vod <youtube-url>` command (YouTube transcript fetch + Opus 5-clip suggest) | AttaBotty | `commands.ts` + YouTube API key in `.env` |
| 4 | Add `/transcript <url-or-markdown>` command (index NotebookLM into memory) | AttaBotty | `commands.ts` + new `team_bot_transcripts` table |
| 5 | Per-bot daily-summary cron override (env var to disable per bot) | Both | `shared.ts` already supports - just document |
| 6 | `team_bot_features` table for Tyler's shipped/in-flight feature tracking | Magnetiq | migration + `/feature` command |
| 7 | `team_bot_setlist` + `team_bot_stream_logs` tables | AttaBotty | migration + `/setlist` + `/stream-log` commands |

## Action bridge

| Action | Owner | Type | By when |
|--------|-------|------|---------|
| Apply persona.md edits to magnetiq + attabotty | Done in this PR | Code | Today |
| Zaal asks AttaBotty the 6 clarifications | Zaal | DM | This week |
| Zaal researches nounish match-fund program details | Zaal | Web | Before pitching funding |
| Decide daily-summary cadence per bot (keep / disable) | Zaal | Decision | Before tokens land on VPS |
| Ship follow-up PR: 7 deferred commands + new tables | Me | PR | Week after deploy validation |
| Update persona.md once 6 clarifications answered (Onagi role, artisan place, live URL, transcript permission, name spelling, match-fund details) | Me | Code | After Zaal collects answers |

## Sub-docs

- [magnetiq.md](./magnetiq.md) - full Magnetiq brand-fit audit (gaps, over-builds, voice drift, SAPS framework, schema suggestions, pre-launch checklist)
- [attabotty.md](./attabotty.md) - full AttaBotty brand-fit audit (kayfabe risk, stream production gaps, 6 open clarifications with defaults, schema suggestions, pre-launch checklist)

## Sources

- Doc 640 - Magnetiq vibes-to-data pivot + Tyler call transcript 2026-05-11
- Doc 641 - Whop integration play
- Doc 642 - AttaBotty livestream playbook + call recap
- Doc 644 - ZAO agent stack canon
- Doc 645 - team-bots code audit (PR #503)
- Doc 467 - earlier Magnetiq bot spec (Zaal + Tyler, SAPS framework)
- Doc 274 - ZAO Stock team profile (AttaBotty bio, William, DaNici)
- bot/src/teams/magnetiq/persona.md + attabotty/persona.md (before + after this PR)
