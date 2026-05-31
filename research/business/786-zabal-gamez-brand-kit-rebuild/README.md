---
topic: business
type: audit
status: research-complete
last-validated: 2026-05-31
related-docs: 701, 768, 769
original-query: "Audit + rebuild the ZABAL Gamez brand kit. Current BCZ brand folder is severely out of date - missing logo-mark, b-roll captures, prize cards, social templates, voiceover variations, motion graphics, fonts, link cards. ZAODEVZ/zabalgames repo has rich brand docs that have NOT been folded in. Goal: ship a definitive updated brand kit at bettercallzaal.com/assets/zabal-games-brand/ editors can lift from for any ZABAL Gamez creative work."
tier: STANDARD
---

# 786 - ZABAL Gamez brand kit rebuild

> **Goal:** Audit gap between the canonical ZABAL Gamez brand kit (lives at `github.com/ZAODEVZ/zabalgames/docs/`) and the BCZ working mirror (`bettercallzaal.com/assets/zabal-games-brand/`). Catalog what existed before, what shipped today, what is still TODO. Establish the sync protocol so the mirror never drifts again.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Canonical source** | USE `github.com/ZAODEVZ/zabalgames/docs/brand-kit-2026-05-28.md` + `docs/brand-context.md` as the brand spine. BCZ folder is a working MIRROR for editor convenience, not source-of-truth. If they disagree, the source wins. |
| **Sync cadence** | RE-SYNC weekly during the active campaign (June 1 - August 31). At minimum: every time canonical changes the logo, the palette, the phrase list, or the asset roster. |
| **Asset path convention** | Public URL pattern stays `https://bettercallzaal.com/assets/zabal-games-brand/<file>`. Editors lift via direct URL. CC-BY licensed. |
| **Logo: prefer hero raster over generic SVG** | KEEP `logo.png` (the 1024x1024 arcade hero, 1.17 MB) as the primary social-card asset. The prior `logo-wordmark.svg` was a generic system-font wordmark that did NOT match the arcade hero brand. Both stay in the folder but logo.png is the default for unfurl. |
| **Audio rule** | Drop binaural beat language entirely (R2 post-mortem evolution). Replace with: editors choose from sanctioned `zabal-gamez-promo.mp3` OR original source-episode audio OR one clear instrumental that does not compete with dialog. Layered melodic music over dialog = floor fail. |
| **Voice handle correction** | Kenny's correct X handle is `@kennyistyping` not `@kennyiscoding`. The R2 bounty description had the typo and it propagated. Fix in all future BCZ POIDH bounty descriptions. (Submitters tagged the correct handle anyway in R2 - the typo only existed in the bounty body.) |
| **Migration target** | When R3 closes, MIGRATE this kit from `bettercallzaal.com/assets/zabal-games-brand/` to `ZAODEVZ/zabalgames/assets/brand/` so the standalone repo owns its own kit. For now the BCZ path is the live one. |

---

## Part 1 - What was in the BCZ folder BEFORE this rebuild

State as of 2026-05-31 morning (before rebuild):

| File | Size | Status |
|------|------|--------|
| `README.md` | 4.2 KB | Stub with TODO-heavy asset roster, binaural rule (now stale), generic brand voice |
| `binaural-60s.mp3` | 939 KB | 60s synthesized binaural beat from R2 post-mortem (now DELETED per Zaal 2026-05-31) |
| `palette.svg` | 2.8 KB | 5-color swatch card (bg, text, text-muted, cyan, orange) - incomplete vs canonical 13-color palette |
| `logo-wordmark.svg` | 0.6 KB | Generic system-font wordmark - did NOT match the arcade hero in canonical |

**Total: 4 files, all thin or stale.** Editors had no real hero logo, no full palette, no phrase list, no glossary, no unfurl matrix.

---

## Part 2 - What canonical exists in ZAODEVZ/zabalgames

The ZAODEVZ standalone repo (per doc 769) has rich brand assets that were never copied:

### Docs (`docs/`)

| Doc | Size | Content |
|-----|------|---------|
| `brand-context.md` | 11 KB | 7-brand ecosystem spine: The ZAO, ZAO OS, $ZABAL + Empire Builder, WaveWarZ, ZAO Festivals + ZAOstock, ZAO Music, COC Concertz, Respect + Fractals. One-liner / mission / audience / voice / visual / build surface / status per brand. |
| `brand-kit-2026-05-28.md` | 7.6 KB | Season 1 spec: arcade-meets-builder visual direction, full site palette (13 tokens), arcade-logo palette (9 tokens), typography (Syne + Outfit + JetBrains Mono + arcade options Bungee/Russo One/Press Start 2P), voice rules, approved phrases, banned phrases, brand glossary (correct spellings), file inventory, Mini App splash sequence, social card unfurl matrix |
| `logo-brief-2026-05-26.md` | 8.9 KB | Logo design brief (not yet folded into mirror) |
| `media-kit-2026-05-26.md` | 7.4 KB | Press + media pull (not yet folded into mirror) |
| `magnetiq-mementos-zao-brands-2026-05-28.md` | 28 KB | Magnetiq mementos catalog (28KB, very specific - skip from mirror unless Magnetiq integration ships) |

### Assets (`assets/`)

| File | Size | Was missing from BCZ? |
|------|------|----------------------|
| `logo.png` (arcade hero, 1024x1024) | 1.17 MB | YES |
| `logo-gamez.png` (wider GAMEZ variant) | 1.04 MB | YES |
| `icon.png` (clean Z favicon) | 263 KB | YES |
| `og-card.svg` (SVG OG fallback) | 2.8 KB | YES |
| `embed-card.svg` (1200x630 vector) | 4.2 KB | YES |
| `embed-card-gamez.png` (1200x630 raster) | 671 KB | YES |
| `miniapp.js` | 8 KB | n/a - belongs in ZAODEVZ deploy, not editor kit |
| `presence.js` | 2.3 KB | n/a - same |
| `style.css` | 5.7 KB | n/a - site-specific |

---

## Part 3 - Gap analysis (what was missing vs. now shipped)

| Gap | Before | After (this PR) |
|-----|--------|-----------------|
| Real arcade hero logo | Missing - had generic wordmark only | SHIPPED (`logo.png` + `logo-gamez.png`) |
| Clean Z icon for favicons / avatars | Missing | SHIPPED (`icon.png`) |
| OG / embed card unfurl assets | Missing | SHIPPED (`og-card.svg` + `embed-card.svg` + `embed-card-gamez.png`) |
| Full site palette spec | 5 tokens only | 13 tokens documented in README |
| Arcade-logo palette spec | Missing entirely | SHIPPED (`palette-arcade.svg` + 9-token spec in README) |
| Typography spec (web + arcade asset layer) | Single font-family line | Full Syne / Outfit / JetBrains Mono web stack + arcade-asset options (Press Start 2P, VT323, Bungee, Russo One) |
| Approved phrases (rotate sparingly) | Missing | SHIPPED (`phrases.md` - 10 phrases) |
| Banned phrases (hard NO) | Missing | SHIPPED (`phrases.md` - 8 banned + reasoning) |
| Brand glossary (correct spellings) | Missing | SHIPPED (`phrases.md` - 20 terms with correct vs common-wrong) |
| Social card unfurl matrix | Missing | SHIPPED (`asset-inventory.md`) |
| Asset use guide (when to use which file) | Missing | SHIPPED (`asset-inventory.md`) |
| Sanctioned promo audio | Binaural beat (R2 post-mortem) | REPLACED with `zabal-gamez-promo.mp3` (11s VO bumper per Zaal 2026-05-31) |
| Pending TODO transparency | Vague | Explicit table with blockers + owners |

### What's still TODO (real gaps, not yet shipped)

| File | Why we need it | Blocker |
|------|----------------|---------|
| `b-roll-channel-walkthrough.mp4` | 10-15s screen capture of /zabal Farcaster channel | Self-record |
| `b-roll-magnetiq-portal.mp4` | 10-15s screen capture of Magnetiq portal | Coordinate with Tyler Stambaugh |
| `b-roll-workshop-1.mp4` | 10-15s workshop screen capture | After first workshop drops on Lu.ma |
| `prize-card-eth.png` | "0.0125 ETH wins" social card 1080x1080 | Design pass |
| `prize-card-tracks.png` | "Artist / Builder / Creator" 1080x1080 | Design pass |
| `og-card.png` | 1200x630 raster of OG card | TODO W11 in ZAODEVZ/zabalgames |

---

## Part 4 - Mirror sync protocol

To prevent the BCZ folder from drifting stale again:

1. **Source of truth:** `github.com/ZAODEVZ/zabalgames` (docs/ + assets/). Always.
2. **Mirror path:** `bettercallzaal.com/assets/zabal-games-brand/` (public CC-BY for editors).
3. **Sync triggers:**
   - Canonical logo changes (logo.png replaced)
   - Canonical palette changes (any hex shifts)
   - Phrase list changes (approved or banned)
   - Glossary changes (new term or spelling correction)
   - Asset roster changes (new file added or deprecated)
4. **Sync method:** Copy assets from `~/Documents/zabalgames/assets/` to `~/Documents/BetterCallZaal/assets/zabal-games-brand/`. Update README mirror section. Commit + push BCZ PR.
5. **Cadence during active campaign (June-August):** weekly minimum.
6. **Post-campaign migration:** when R3 closes, move kit OUT of BCZ assets and INTO `ZAODEVZ/zabalgames/assets/brand/` per doc 769 recommendation. BCZ keeps a stub README pointing at the canonical URL.

---

## Part 5 - Specific numbers

| Metric | Value |
|--------|-------|
| Files in BCZ folder BEFORE | 4 |
| Files in BCZ folder AFTER | 12 |
| Net additions | 8 new files + 1 deletion (binaural-60s.mp3) + 1 rewrite (README) |
| Total folder size before | ~952 KB |
| Total folder size after | ~3.6 MB |
| Site palette tokens documented | 13 (was 5) |
| Arcade palette tokens documented | 9 (was 0) |
| Approved phrases | 10 |
| Banned phrases | 8 |
| Brand glossary terms | 20 |
| Logo files | 4 (`logo.png` + `logo-gamez.png` + `logo-wordmark.svg` + `icon.png`) |
| Unfurl card files | 3 (`og-card.svg` + `embed-card.svg` + `embed-card-gamez.png`) |
| Audio assets | 1 (`zabal-gamez-promo.mp3`, 11s, 183 KB, Samantha en_US VO) |
| Canonical brand docs available to pull from | 5 in `ZAODEVZ/zabalgames/docs/` |
| Brand docs folded into mirror | 2 of 5 (brand-context.md spine + brand-kit-2026-05-28.md Season 1 spec); 3 remain external (logo-brief, media-kit, magnetiq-mementos) |
| Sync cadence target | Weekly during campaign (June-August) |
| File total budget | < 5 MB folder (good - currently 3.6 MB) |

---

## Sources

- [FULL] [ZAODEVZ/zabalgames brand-context.md](https://github.com/ZAODEVZ/zabalgames/blob/main/docs/brand-context.md) - 7-brand ZAO ecosystem spine, voice + visual per brand, full breakdown
- [FULL] [ZAODEVZ/zabalgames brand-kit-2026-05-28.md](https://github.com/ZAODEVZ/zabalgames/blob/main/docs/brand-kit-2026-05-28.md) - Season 1 spec, arcade-meets-builder, full palette, phrase lists, glossary
- [FULL] [ZAODEVZ/zabalgames assets folder](https://github.com/ZAODEVZ/zabalgames/tree/main/assets) - real arcade hero PNG + icon + embed cards + SVG variants
- [FULL] [zabalgamez.com](https://zabalgamez.com) - live site (Season 1, "3 Months of Building With The ZAO" tagline)
- [FULL] BCZ brand folder pre-rebuild state via filesystem - 4 files, stub README
- [FULL] Doc 701 - ZABAL Games canonical state (decisions, calendar, prize tiers)
- [FULL] Doc 768 - POIDH bounty best practices + R3 zabalgames ad draft (the consumer of this kit)
- [FULL] Doc 769 - ZAODEVZ/zabalgames repo state audit (catalogs every doc + asset in the standalone repo)
- [FULL] R2 bounty 1166 tRPC description - confirmed @kennyiscoding typo (correct is @kennyistyping; R2 submitters tagged the correct handle in their X posts)
- [PARTIAL] ZAODEVZ logo-brief-2026-05-26.md, media-kit-2026-05-26.md, magnetiq-mementos-zao-brands-2026-05-28.md - exist in canonical but not folded into mirror (intentional - too specific OR too large for editor-lift use case)

Cross-repo: skipped (single-repo audit per request).

Verified URLs 2026-05-31: zabalgamez.com HTTP 200, ZAODEVZ/zabalgames repo public + reachable via gh CLI.

---

## Also See

- [Doc 701 - ZABAL Games canonical state](../../events/701-zabal-games-canonical-state/)
- [Doc 768 - POIDH bounty best practices + R3 zabalgames ad draft](../768-poidh-bounty-best-practices-zabalgames-r3/)
- [Doc 769 - ZAODEVZ/zabalgames repo state audit](../769-zaodevz-zabalgames-repo-state/)
- BCZ PR shipping this rebuild: bundled into ws/zabal-gamez-promo-mp3 (the same branch that swapped binaural -> promo MP3)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge BCZ PR (ws/zabal-gamez-promo-mp3 branch - bundles brand kit rebuild + promo MP3) | @Zaal | PR merge | Before R3 cast |
| Fix @kennyiscoding -> @kennyistyping in R3 bounty description draft (v4 has the typo inherited from R2; v5 fixes) | @ClaudeBot | Description edit | Before R3 cast (DONE inline in v5) |
| Fix Sunday June 14 (not Saturday) in R3 bounty description per Kenny's catch 2026-05-31 | @ClaudeBot | Description edit | Before R3 cast (v5 fixes) |
| Audit R3 bounty description for any other date / handle / spelling errors before casting | @Zaal | Pre-cast review | Before R3 cast |
| Build prize-card-eth.png + prize-card-tracks.png 1080x1080 social cards | @Zaal | Design | Pre-launch June 1 |
| Coordinate with Tyler Stambaugh for Magnetiq portal walkthrough capture | @Zaal | Tyler DM | Pre-launch June 1 |
| Record /zabal channel walkthrough b-roll | @Zaal or @Iman | 10-15s screen capture | Pre-launch June 1 |
| Re-sync brand kit weekly during active campaign | @Zaal | Recurring | June 1 - August 31 |
| Migrate kit from BCZ to ZAODEVZ/zabalgames/assets/brand/ after R3 closes | @Zaal | PR to ZAODEVZ | Post-R3 winner cast |
| Re-validate this doc in 30 days | @Zaal | Doc update | 2026-06-30 |
