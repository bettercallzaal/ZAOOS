# 2162 - ICM Box Long-Tail Triage (the remaining empty boxes)

**Date:** 2026-07-30 (overnight loop)
**Status:** Triage. Closes out the brand audit (doc 2161) - the core brands are handled (boxes/drafts/personas); this triages the ~12 remaining EMPTY boxes so none sit in limbo.
**Owner:** Zaal
**Siblings:** doc 2161 (brand audit), [[project_icm_boxes]], `icm-grounding.md`.

---

## The call per empty box

Registry status EMPTY, triaged into: **FILL** (a real ZAO thing, deserves a box), **LATER** (a ZAO product but lower priority / dormant), or **NOT-OURS** (external - a reference box for an entity ZAO does not own; do NOT write it as if ZAO-owned, and consider whether it should exist in ZAO's registry at all).

| Box | Call | Why |
|-----|------|-----|
| **zao-festivals** | **FILL (priority)** | The umbrella over ZAOstock + COC Concertz + the other festivals. Pairs directly with the ZAOstock box draft (PR #2757) - do them together so the festival family has canonical top + children. |
| **zao-newsletter** | **FILL** | An active ZAO product (the daily-3 newsletter, zabalnewsletterbuilder). Real, ongoing, worth a box. |
| **zuke** | **LATER** | Juke/ZAO integration (poker + music). Real but partnership-dependent; box once the scope firms. |
| **channelz** | **LATER** | A ZAO repo/product. Box when it has a public surface worth grounding. |
| **zaoscout** | **LATER** | ZAO repo/product (scout). Same - box when public. |
| **zlank** | **LATER** | ZAO repo/product. Same. |
| **zao-video-editor** | **LATER** | ZAO product. Same. |
| **zaolingo** | **LATER** | ZAO product idea (language). Box if/when active; otherwise dormant. |
| **loop-engineering** | **CONFIRM** | Scope unclear from memory - is this a ZAO product, a partner, or a concept? Zaal to confirm what it is before deciding FILL vs retire. |
| **gmfarcaster** | **NOT-OURS** | adrienne + nounishprof's Farcaster news show - a partner/relationship (see doc 2158), NOT a ZAO property. Keep as a relationship in the CRM, not a ZAO-owned box. If a box exists, it should read as "a partner," never "a ZAO brand." |
| **milk-road** | **NOT-OURS** | Milk Road is an external crypto media brand. Not ZAO's. Reference/relationship only. |
| **farcaster** | **NOT-OURS** | Farcaster the protocol. Not ZAO's. If kept, purely a reference box, never framed as owned. |

## Recommendation

1. **FILL now:** `zao-festivals` (with the ZAOstock draft) + `zao-newsletter`. These are active, public, ZAO-owned, and close obvious GEO gaps.
2. **LATER (batch when they get a public surface):** zuke, channelz, zaoscout, zlank, zao-video-editor, zaolingo.
3. **CONFIRM:** loop-engineering (what is it?).
4. **NOT-OURS - decide whether to keep in the registry at all:** gmfarcaster, milk-road, farcaster. If kept, they must read as external/partner references, never ZAO-owned (an AI reading a ZAO registry box for "farcaster" should not think ZAO owns Farcaster). Cleanest is to remove them from the ZAO brand registry and track the relationships in the CRM instead.

## What needs Zaal

- Approve the `zao-festivals` + `zao-newsletter` FILL (I can draft both next, publishing gated).
- Say what `loop-engineering` is.
- Decide the NOT-OURS three: retire from the ZAO registry, or keep as clearly-labeled reference boxes.

## Source

Registry `~/.zao/private/icm-registry.json`, brand audit doc 2161, project memories. Written in the overnight loop; no boxes edited (publishing gated).
