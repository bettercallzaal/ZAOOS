---
topic: music
type: market-research
status: research-complete
last-validated: 2026-05-03
related-docs: 148, 261, 314, 475, 599
tier: STANDARD
---

# 599a - Believe + TuneCore Auto-Block Unlicensed AI Music (Suno)

> **Goal:** What changed in music distribution policy 2026-04-30, what it means for ZAO Music, and how to keep the "Cipher" release pipeline unblocked.

## Recommendations First

| Decision | Reasoning |
|----------|-----------|
| AUDIT every track in ZAO Music pipeline for AI-generation provenance before submitting to TuneCore/Believe | Believe deploys AI detection claiming "99% reliable"; trips = full upload block. |
| FAVOR ElevenLabs Music + Udio over Suno for AI-assisted production | Both signed major-label + Believe licensing. Suno is the explicit named target. |
| CONSIDER self-distribute via Recoupable / direct-to-DSP for AI-heavy releases | Believe is one of multiple distributors; ZAO Music doc 475 already lists DistroKid + 0xSplits. Re-evaluate DistroKid stance. |
| ADD provenance metadata field to ZAO Music release checklist (which AI tool, which licensing tier) | Required if any distributor asks. |

## What Happened

| Detail | Value |
|--------|-------|
| Date | 2026-04-30 |
| Source | Music Business Worldwide |
| Distributors | Believe + TuneCore (Believe-owned) |
| Targeted | Suno (named explicitly), other "unlicensed" AI generators |
| Permitted | ElevenLabs Music, Udio (both have major-label + Believe deals) |
| Detection | Believe's "99% reliable" AI tool; identifies generating platform |
| CEO quote | Denis Ladegaillerie: *"the Gen-AI content made on those models is illegal, and is going to stay illegal, for the foreseeable future."* |
| Reasoning | Copyright liability + UX pollution + fraud prevention |

## Major-Label AI Music Deals (as of 2026-04-30)

| Platform | Universal | Warner | Merlin | Kobalt | Believe |
|----------|-----------|--------|--------|--------|---------|
| Suno | NO | NO | NO | NO | NO (BLOCKED) |
| Udio | YES | YES | YES | YES | YES (LICENSED) |
| ElevenLabs Music | YES | YES | YES | YES | YES (LICENSED) |

## ZAO Music Implications

ZAO Music (doc 475) currently uses BMI + DistroKid + 0xSplits as distribution path. Believe block does NOT directly affect ZAO if DistroKid is the upload point - BUT:

1. DistroKid is independent of Believe. Verify DistroKid stance on AI-generated tracks (research follow-up).
2. If/when ZAO Music expands distributor surface (Believe is huge for global EU markets), the block applies.
3. The "Cipher" release: if any AI-assisted production was done via Suno specifically, swap to Udio/ElevenLabs OR human-only stems before Believe submission.
4. Provenance field: ZAO Music release checklist should record which AI tool produced any AI portion, which licensing tier that tool sits in. Future distributors will ask.

## Open Questions

- Does DistroKid have a parallel block? (Check DistroKid's 2026 AI policy.)
- Can ZAO use Suno tracks if vocal/melody is human-original and Suno only handled production? (Detection tool may still flag.)
- Recoupable + direct-to-DSP path: cost and reach vs Believe? (Doc 475 has team pieces.)

## Also See

- [Doc 148](../148-master-integration-plan-onchain-distribution/) - Onchain distribution plan
- [Doc 261](../261-ai-agent-music-pipeline/) - AI music pipeline
- [Doc 314](../314-music-metadata-isrc-ai-distribution/) - ISRC + AI distribution metadata
- [Doc 475 (project memory)](https://github.com/bettercallzaal/ZAOOS) - ZAO Music entity setup
- [Doc 599](../../events/599-inbox-digest-2026-05-03/) - parent inbox digest

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Audit current ZAO Music catalog for Suno-generated portions | @Zaal | Pre-release check | Before Cipher submission |
| Verify DistroKid 2026 AI policy | @Zaal | Research | This week |
| Add AI-provenance field to ZAO Music release template | @Zaal | Doc 475 update | This week |
| Decide: Udio vs ElevenLabs Music as default ZAO AI tool | @Zaal | Decision | This month |

## Sources

- [Music Business Worldwide - Believe and TuneCore blocking Suno, ElevenLabs, Udio (2026-04-30)](https://www.musicbusinessworldwide.com/believe-and-tunecore-blocking-suno-elevenlabs-and-udio/)
- [PYMNTS - ElevenLabs music store + Taylor Swift](https://www.pymnts.com/artificial-intelligence-2/2026/elevenlabs-opened-a-music-store-while-taylor-swift-lawyered-up/)
