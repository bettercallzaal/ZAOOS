---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-24
related-docs: "601, 670, 685, 696, 705, 712, 726, 727, 734, 737"
original-query: "Process /Users/zaalpanthaki/Downloads/5_24_26-May-24-2026-restream.m4a via /meeting skill. Restream livestream call between Vlad (singularity.diy, built Respect Game on Base) and Zaal about fractal governance + Singularity funding launchpad. Recovery from catastrophic whisper-large-v3-turbo loop via ffmpeg silence-remove pre-processing."
tier: STANDARD
---

# 738 - Vlad (singularity.diy) x Zaal - Fractal governance + Singularity funding launchpad

> **Goal:** Capture the 2026-05-24 Restream call between Vlad (founder, singularity.diy; built Respect Game DAO OF THE APES on Base; Eden Fractal lineage) and Zaal. Outcomes: (1) Singularity mission for ZAO offered with gas covered by Vlad, (2) Respect Game open-source codebase available for transition to ZAO, (3) Vlad's recommendation to add a liquid-token incentive layer on top of ZAO Fractal's existing illiquid/soul-bound Respect.

Full transcript: [transcript.md](transcript.md). **Transcription recovery caveat below in Verification Gaps.**

## Meeting metadata

| Field | Value |
|-------|-------|
| Date | 2026-05-24 (Sunday) |
| Platform | Restream livestream |
| Duration (raw audio) | 46.8 min |
| Duration (real conversation, post-loop-strip) | ~13 min |
| Attendees | Vlad (singularity.diy), Zaal Panthaki |
| Project routing | Networking / Fractal-adjacent (no external tracker; actions in this doc only) |

## Key Decisions

| # | Decision | Owner | Confidence |
|---|----------|-------|------------|
| 1 | Zaal will create a test ZAO mission on Singularity (singularity.diy). Vlad will fund Zaal's Solana account for gas (no subsidies yet). | Both | high |
| 2 | Vlad's Respect Game (DAO OF THE APES) open-source codebase is on offer for transition to ZAO use. Zaal to review the repo. | Vlad-side: high (offered twice on call + in TG). Zaal-side: medium (committed to "look into it"). |
| 3 | Zaal will consider adding a liquid-token incentive layer on top of ZAO Fractal's existing illiquid/soul-bound Respect token, per Vlad's EOS-era pattern. | Zaal | medium - logged for separate analysis, not committed |
| 4 | Comms going forward via Telegram. Vlad will send the GitHub repo link. | Both | high - last sentence of the call |
| 5 | Vlad's broader thesis - the Singularity Council is a v1 "funding hook" that will offer migration to fractal-contribution-based voting in the future. ZAO Fractal is the kind of community that would migrate. | Vlad | high - explicit stated direction |

## Actions

| Title | Owner | Due | Category | Confidence |
|-------|-------|-----|----------|------------|
| Visit singularity.diy + click "Create Mission"; capture screenshot | Zaal | 2026-05-31 | Ops | high |
| Ping Vlad on Telegram when ready to create the mission so he can fund Solana gas | Zaal | 2026-05-31 | Ops | high |
| Review github.com/n0umen0n/base-respect-game (Respect Game / DAO OF THE APES) for ZAO use | Zaal | 2026-06-07 | Tech | high |
| Decide on Respect Game integration vs current ZAO Fractal Discord bot ("Zoll's bot") | Zaal | 2026-06-15 | Tech | medium - depends on (3) |
| Spec liquid-token incentive layer for ZAO Fractal contributions (Vlad's EOS pattern) | Zaal | 2026-06-15 | Strategy | medium - separate analysis |
| Send Vlad the ZOZAOOS / ZAO Fractal GitHub link he asked for | Zaal | 2026-05-25 | Ops | high |
| Send Vlad to existing project_fractal_process + project_fractal_vision context | Zaal | 2026-05-25 | Ops | medium |

## Quotes (load-bearing)

| Speaker | Quote |
|---------|-------|
| Vlad | "I still think the fractal system is the best government system there is, like a decentralized one." |
| Vlad | "If you give them this funding source and then on top of that you give them the governance system, this is something powerful." |
| Vlad | "I'm now focusing more on fundraising part in order for that to be a hook into this governance thing." |
| Vlad | "I've been part of fractals where there was a, like, a normal budget... It was on EOS... we had a budget and we were able to distribute it to build, like, apps. And people just came constantly in because they knew that every meeting we distribute actual liquid valuable token. Have you thought about that, to incentivize with liquid token?" |
| Vlad | "I don't like still the token weighted voting and I don't like the idea that somebody with just money can control the community, can control the project. That's why I like the fractal process. And that's why in the future I would offer those communities a way to switch, a way to switch from this council to this contribution based system." |
| Zaal | "We do the fractal governance system. We kind of adapted it just slightly. We have a soul bound and liquid, non liquid, illiquid and soul bound token as the governance token... basically do the same like the Eden fractals kind of break within the groups and then we do the level six vote." |
| Vlad | "If you plan to create [a mission], I would need to fund your Solana account a little bit because I haven't implemented the gas subsidies yet. So I just cover your costs to deploy the token." |
| Zaal | "Yeah, sounds good. Let's keep in touch then. I will send you the GitHub." |

## Vlad / Singularity / Respect Game profile

Synthesized from on-call content + Telegram thread (`~/.zao/private/vlad-singularity-telegram-2026-05-24.json`).

**Vlad** - founder, singularity.diy. Eden Fractal lineage (built fractal-based governance on EOS previously). Currently focused on Singularity as the fundraising layer; sees fractal voting as v2.

**Singularity** ([singularity.diy](https://www.singularity.diy/))
- On Solana, abstracted away from the user
- Mission-based: project at any stage creates a "mission"
- PUMP.FUN-like launchpad mechanic + Treasury Council mechanic
- Bonding curve graduates to AMM at 15,000 [USDC/SOL, denomination on-call not clearly stated]
- Top 6 token holders form the Treasury Council; 20% of token supply locked in Treasury
- 4-of-6 council vote required to release Treasury funds for a funding request
- "Zero risk" to mission creator: no equity given up, doesn't oblige to anything
- Currently onboarding ~20 projects before pushing to investors
- Vlad will fund Solana gas for mission creators until gas-subsidies feature ships

**Respect Game (DAO OF THE APES)** ([respectgame.app](https://www.respectgame.app/) | [github.com/n0umen0n/base-respect-game](https://github.com/n0umen0n/base-respect-game))
- On-chain Respect Game on Base
- Eden-Fractal-pattern implementation
- Open-source; Vlad offered to facilitate transition of the codebase to ZAO use
- "DAO OF THE APES" branding for current deployment

**Vlad's broader thesis (from call)**
1. Token-weighted voting is bad (centralizes power in whoever has money)
2. Fractal contribution-based voting is the right long-term answer
3. BUT communities need a funding hook to adopt new governance
4. SO Singularity v1 ships token-weighted Council (because that's what gets traction with the launchpad/investor crowd), v2 will offer migration to fractal-based contribution voting
5. ZAO Fractal is the kind of community that would migrate

## How it grounds ZAO context

| Topic | Connection |
|-------|------------|
| ZAO Fractal ([[project_fractal_process]], [[project_fractal_vision]]) | Vlad is in the same lineage (Eden Fractal). ZAO Fractal hit 100 events; Vlad asked specifically about it. Vlad's liquid-token-incentive observation from his EOS-era fractal is a real input to the ZAO Fractal whitepaper ([[project_zao_fractal_whitepaper]]). |
| Doc 696 ZAO Fractal Whitepaper | Vlad's "Council = funding hook, fractal = endgame" framing is a useful intellectual ally for the whitepaper. Cite it. |
| Respect Game on Base | ZAO already runs Respect ledger work (doc 212 Airtable import, OG vs ZOR Respect per [[project_fractal_process]]). Vlad's Base implementation is a candidate refactor target if/when Respect needs to go on-chain on Base. |
| Singularity as a funding rail | Could be a sister rail to Apna Coding's stake-to-list (doc 736/737) - one for opportunity submission, one for project fundraising. Different stage, complementary. |
| ZABAL Games | Singularity "create a mission, get Treasury Council" could power a post-build-a-thon launch path for the 8 finalists. Possible v2 ZABAL Games mechanic. |
| Hermes / orchestrator (docs 727, 734) | Not directly relevant. Different scope. |

## Verification gaps + low-confidence items

- **Transcription failed for ~33 of 46 minutes of audio.** Whisper-large-v3-turbo locked into "So yeah." / "I'm not sure." / "Thank you." loops on long silences. ffmpeg silence-remove (-40dB threshold, >2sec) pre-process dropped audio to 13 min and recovered ~6.5 min of unique real content vs ~2 min from the first run. The live screen-share demo of Singularity (~minute 5-9 by Vlad's "Was I sharing it right now?") is LOST.
- **Singularity bonding curve graduation threshold "15,000"** - denomination not clearly stated on call. Could be USDC, SOL, or some app-internal unit. Need to confirm on the platform UI.
- **"This is just the ball or it actually executes the transaction?"** Vlad asked Zaal something about ZAO's bot - "ball" is likely a transcription error for a specific term (Q-ball / snowball / vote-ball / etc). Mark confidence:low.
- **Council quorum specifics** - "4-of-6 councilors approve" was clearly stated; threshold count was not (could be configurable or just 4).
- **15K threshold currency** - the 15,000 number is real; what unit is unclear.
- **Diarization not run.** All speaker attributions are content-based inference (Vlad pitching Singularity, Zaal describing ZAO Fractal). Mostly unambiguous; a couple of brief exchanges (the "ball" question) are best-guess.

## Also See

- [Doc 696 - ZAO Fractal Whitepaper grounding](../../) - Vlad's Council->Fractal migration thesis is intellectually allied
- [project_fractal_process / project_fractal_vision](../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/) - existing ZAO Fractal state Vlad asked about
- [Doc 685 - code-on-incus sandbox](../../dev-workflows/685-code-on-incus-agent-sandbox/) - prior art on isolating agent runs; tangential
- [Doc 712 / 713 - ZAO CRM design](../../business/712-zao-crm-coworking-app/) - Folk-style CRM; Vlad becomes a "partner-org" contact
- [Doc 737 - Airtable agentic CRM v3](../../business/737-airtable-agentic-crm-v3/) - Vlad's contact + this activity row land here (Flow E auto-write)
- [Doc 726 - Bonfires teaching another bot](../../identity/726-bonfires-teaching-another-bot/) - this meeting's episodes write to the same Bonfire
- `~/.zao/private/vlad-singularity-telegram-2026-05-24.json` - chmod 600, Telegram thread context

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send Vlad the ZAO Fractal GitHub link (he asked for it on call's last sentence) | @Zaal | TG message | 2026-05-25 |
| Visit singularity.diy + create test ZAO mission | @Zaal | Web | 2026-05-31 |
| Ping Vlad on TG when creating the mission so he can fund Solana gas | @Zaal | TG | 2026-05-31 |
| Review base-respect-game repo for ZAO use | @Zaal | Code | 2026-06-07 |
| Decide on Respect Game integration vs current ZAO Fractal Discord bot | @Zaal | Decision | 2026-06-15 |
| Add Vlad's "Council->Fractal migration" thesis to ZAO Fractal Whitepaper (doc 696) | @Zaal | Doc | Next whitepaper session |
| Spec liquid-token incentive layer for ZAO Fractal (EOS-era pattern Vlad described) | @Zaal | Spec | 2026-06-15 |
| Write `project_vlad_singularity` memory (after this doc commits) | @Claude | Memory | Same session |

## Sources

- Source media: `/Users/zaalpanthaki/Downloads/5_24_26-May-24-2026-restream.m4a` [PARTIAL - 46.8min raw, ~33min unrecoverable due to whisper turbo loop on silent periods; ~6.5min of unique real content extracted post silence-remove pre-process]
- Cleaned audio (silence-removed): `/tmp/restream-may24-silence-removed.wav` [FULL - 13min mono WAV, used as transcribe input]
- Re-transcription post-cleanup: `/tmp/meeting-20260524-124120.txt` + `.json` sidecar [FULL - 453 segments, 103 unique texts, 49% real-content ratio after stripping loop tokens]
- First-attempt transcription: `/tmp/meeting-20260524-121229.txt` [PARTIAL - kept for diff/audit, the heavily-looped run]
- Telegram thread context: `~/.zao/private/vlad-singularity-telegram-2026-05-24.json` [FULL - chmod 600 off-repo per PR #666; 8 messages between Vlad + Zaal around the call; provided URLs + GH handle + Calendly]
- [Vlad's Singularity platform](https://www.singularity.diy/) [PARTIAL - URL on call + in TG; UI not browsed this session]
- [Vlad's Respect Game live](https://www.respectgame.app/) [PARTIAL - URL on call + in TG; not browsed this session]
- [github.com/n0umen0n/base-respect-game](https://github.com/n0umen0n/base-respect-game) [PARTIAL - URL only, repo metadata not fetched this session; do at review-time per Next Action #4]
- [calendly.com/vlad-singularity/30min](https://calendly.com/vlad-singularity/30min) [FULL - URL only, scheduling page is the data]
- ZAO existing fractal context: `project_fractal_process` / `project_fractal_vision` / `project_zao_fractal_whitepaper` memories [FULL - read prior to writing this doc]
- ZAOOS codebase dedup audit: zero existing references to "vlad" / "singularity.diy" / "respectgame" / "n0umen0n" / "DAO OF THE APES" in research/ or memory/ - NEW entity confirmed
