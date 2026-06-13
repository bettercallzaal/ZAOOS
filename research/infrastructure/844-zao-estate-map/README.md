---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-06-11
related-docs: 836, 841, 843
original-query: "Align documentation across the ZAO estate - build a canonical map of every live project, repo, and DB so the next 'what do we even have' question doesn't cost another census."
tier: STANDARD
---

# Doc 844 - ZAO Estate Map

> **Goal:** The single canonical inventory of every live ZAO surface - project, repo, domain, database, status. Built from the 2026-06-11 census ([Doc 836](../836-zaoos-repo-estate-census/)). When something graduates, is born, or dies, update THIS doc.

## Why this exists

The estate sprawls across 86 Vercel projects, 4 Supabase projects (under Zaal's
account), and a dozen+ git repos. Before this doc there was no map - answering
"what's live" cost a token-census. This is the connective tissue every other doc
references. Pair it with [Doc 843](../../dev-workflows/843-claude-md-alignment-standard/)
(CLAUDE.md standard) so each repo's local context stays consistent with the map.

## Live surfaces (32 Vercel projects deployed in last 90 days)

### Core ZAO products
| Project | Repo | What | DB |
|---------|------|------|-----|
| zaoos | bettercallzaal/ZAOOS | The lab - gated Farcaster client + monorepo | Supabase ZAOOS |
| zaonexus | bettercallzaal/ZAONEXUS | ZAO link hub (141 canonical links) | static/JSON |
| zaofractal | (v0) | Fractal governance surface | - |
| zuke | (no repo linked) | Juke audio partner surface | - |
| co-c-concert-z | bettercallzaal/CoCConcertZ | COC Concertz (graduated) | own |
| fishbowlz | bettercallzaal/fishbowlz | FISHBOWLZ (paused, Juke partnership) | own |
| wavewarzapp | bettercallzaal/wavewarzapp | WaveWarZ app | own |

### Graduated / standalone products
| Project | Repo | What |
|---------|------|------|
| bcz-yapz | bettercallzaal/bcz-yapz | BCZ YapZ (graduated 2026-05-06, bczyapz.com) |
| zpoidh | bettercallzaal/zpoidh | POIDH bounty home |
| zlank | bettercallzaal/zlank | Zlank OSS+managed service |
| zaostock | bettercallzaal/zaostock | ZAOstock festival (spinning out of ZAOOS) |
| zao-video-editor | bettercallzaal/ZAOVideoEditor | Livestream-to-clips editor (local FastAPI+React) |
| (local) | bettercallzaal/ZAOscout | Keyless social-fetch toolkit (graduated 2026-06-10) |

### Client / personal
| Project | Repo | What |
|---------|------|------|
| riverside-group-demo | bettercallzaal/riverside-group-demo | Riverside Group (Cameron) client work |
| bettercallzaalwebsite | bettercallzaal/bettercallzaalwebsite | BCZ personal site |
| zaal-donate-button | bettercallzaal/Zaal-s-Birthday | Donation widget |
| imanprojects | bettercallzaal/imanprojects | Iman's project surface |

### Experiments / snaps / scratch (keep-or-prune as they age)
duodo-snap, nouns-snap, zabalsnap1, ltaesnap (Farcaster snaps), crownvics,
aurdour, farmdrop, textsplitter, b-zbuild-2, zabalart, plus 6 `v0-*` scratch
deploys (v-worker-63, v0-thirdweb-emebed, za-ocowork, v0-mint-widget-for-zao,
v0-zoundz-mini-app-design, v0-bidding-war-z).

## Databases (Supabase, Zaal's account)

| Project | Status | Used by |
|---------|--------|---------|
| ZAOOS | ACTIVE | the monorepo |
| ZAO STOCK | ACTIVE | ZAOstock spinout |
| zaalp99's Project | INACTIVE | (paused - deletable) |
| supabase-chestnut-pebble | INACTIVE | (paused - deletable) |

Note: the cowork tracker DB (`etwvzrmlxeobinrlytza`) lives under **Iman's**
account, not Zaal's - it is not in the list above.

## Dead (the kill-list)

54 dead Vercel projects (no deploy in 90+ days) - full list + delete URLs in
[Doc 836](../836-zaoos-repo-estate-census/) section 7. Headline: 12 old NEXUS
iterations + ~5 duplicate projects lead the cleanup.

## Graduation ledger (the lab rule)

Per the Monorepo-as-Lab model, a thing graduates -> own repo, own DB, own
domain, and **code is deleted from ZAOOS**. Confirmed graduates: COC Concertz,
BCZ YapZ, ZAOscout, ZAOVideoEditor. In progress: ZAOstock. **Open hygiene debt**
(from [Doc 841](../../security/841-zaoos-over-audit-2026-06/)): decommissioned
Magnetiq/AttaBotty code, half-built Arweave mint, and duplicate miniapp auth
routes still linger in ZAOOS and should be deleted or finished.

## Recommendations (ecosystem-level)

1. **Treat this doc as a registry, not prose** - update on every graduate/birth/
   death. Re-run `scripts/estate-audit/audit.sh` quarterly and reconcile.
2. **Prune the 54 dead Vercel projects** - clutter, and each is an attack/confusion
   surface. Start with the 12 NEXUS dupes.
3. **Adopt the CLAUDE.md standard** ([Doc 843](../../dev-workflows/843-claude-md-alignment-standard/))
   in every graduated repo so agent context is consistent estate-wide.
4. **One brand-glossary source of truth** - the glossary lives in the global
   `~/.claude/CLAUDE.md`; graduated repos should reference it, not re-copy (drift risk).
5. **Finish the graduation deletes** - close the lab-rule hygiene debt above.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Keep this map current on every graduate/birth/death | @Zaal | Doc | Ongoing |
| Quarterly re-run of estate-audit + reconcile | @Zaal | Manual | Quarterly |
| Delete decommissioned/graduated code still in ZAOOS | @Zaal | PR | Next cleanup |
| Roll CLAUDE.md standard into graduated repos | @Zaal | PRs | Backlog |

## Also See

- [Doc 836](../836-zaoos-repo-estate-census/) - the census this is built from
- [Doc 843](../../dev-workflows/843-claude-md-alignment-standard/) - CLAUDE.md standard
- [Doc 841](../../security/841-zaoos-over-audit-2026-06/) - over-audit (graduation hygiene debt)

## Sources

- [FULL] Vercel + Supabase census 2026-06-11 (`~/.zao/private/*-estate-*.json`), Doc 836
- [FULL] Local repo survey + git remotes, 2026-06-11
