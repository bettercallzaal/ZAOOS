# 842 - The ZAO Org Chart + Brand Hierarchy

The shareable org chart Fellenz asked for (doc 839, challenge 5: "give me the org chart... share it with people"). Built to his structure and to resolve the brand-eclipse problem: **The ZAO is the parent brand; ZABAL is an internal builder identity, not the marquee.**

This doc is meant to be shared with the team + partners. It is the single answer to "how does all of this fit together?"

---

## The one-line model

**The ZAO is the umbrella (an incubator + impact network). Everything else is either a project incubated under it, a community partnership beside it, or an internal toolstack that builds it.**

- The ZAO leads in all external communication.
- ZABAL is the internal builder/toolstack identity - it powers things, it is not the front brand.
- Partner orgs (like the COC) are **community partnerships**, presented side-by-side with The ZAO, never as sub-brands owned by it.

---

## Org chart

```
                          THE ZAO
                (umbrella - incubator + impact network,
                 community-focused; the lead brand everywhere)
                              |
   ---------------------------+----------------------------------
   |                |                  |                        |
INCUBATED        COMMUNITY          INTERNAL                 COMMUNITY
PROJECTS         PARTNERSHIPS       TOOLSTACK                COLLABS
(ZAO-owned,      (beside The ZAO,   (builds The ZAO,         (co-created,
 cofounders)      equal billing)     not the marquee)         unnamed set)
   |                |                  |                        |
- WaveWarZ       - COC Concertz     - ZABAL / ZABAL Games    - misc community
  (-> sub-DAO      (Thy Revolution   (builder engagement       collaborations
   spinout)        leads; partner    for OUTSIDERS +           (no need to
- ZAO Festivals    of The ZAO,       the toolstack that        name each)
  -> ZAOstock      not owned by it)  runs ZAO projects)
```

### How to read it

- **The ZAO** sits on top. Community-focused. It is the brand you say out loud first, every time.
- **Incubated projects** are ZAO-owned, built with community cofounders, and can graduate into their own sub-DAO/company (e.g. WaveWarZ is on the path to spin off into a company + a sub-DAO under The ZAO; ZAO Festivals runs ZAOstock).
- **Community partnerships** are top-level orgs that partner WITH The ZAO. The COC is one: **COC Concertz is led by Thy Revolution** (COC's founder) and is a partnership, not a ZAO-owned sub-brand. Present it side-by-side ("ZAO Festivals + COC Concertz"), never "The ZAO's COC."
- **Internal toolstack = ZABAL / ZABAL Games.** This is the builder identity. Two distinct uses that must stay delineated (Fellenz challenges 2 + 3):
  - **ZABAL Games (outward):** an outsider-facing dev/builder engagement program - the "micro-ETH Global" where people come IN to build apps and learn from mentors. This funnels new people into The ZAO.
  - **ZABAL toolstack (inward):** the tools/methods the ZAO team uses to run ZAO projects. Internal ops - keep this OUT of the outsider-facing Games surface so it does not consume the space meant for new participants.
- **Community collabs** are the misc co-created things; per Fellenz, no need to name each individually on the chart.

---

## Naming rules (so The ZAO stops getting eclipsed)

1. **Say "The ZAO" first.** In any external comm - to the COC, to partners, on decks, on event pamphlets, in Telegram group names - The ZAO is the lead brand. ZABAL is not the headline.
2. **ZABAL = internal builder identity.** Use it for the toolstack and the Games (outsider builder engagement). Do not let it stand in for The ZAO as the umbrella.
3. **$ZABAL the token is fine as-is.** It is a deployed on-chain token literally named ZABAL - `$ZABAL on Base`, Empire Builder stats, Clanker origin all stay. The token is a sub-element, not the umbrella. (This is why the brand fix is about *framing*, not renaming anything on-chain.)
4. **Partners get "community partnership," not "project under The ZAO."** COC Concertz, and similar, are partnerships with equal billing. Respect their ownership.
5. **Incubated vs partnership is the key distinction.** Incubated = ZAO-owned with cofounders (WaveWarZ, ZAO Festivals). Partnership = beside The ZAO (COC). Do not blur them.

---

## What changed in the ZAOOS app from this (first pass)

Surgical copy edits in `src/app/(auth)/ecosystem/page.tsx` so the in-app ecosystem framing leads with The ZAO, not ZABAL:

| Was | Now |
|-----|-----|
| Tab label "ZABAL Partners" | "ZAO Ecosystem" |
| "stake and earn in the ZABAL ecosystem" (Empire Builder) | "stake and earn in The ZAO ecosystem" |
| "ZABAL Nouns DAO ... funding the community treasury" (ZOUNZ) | "...funding The ZAO community treasury" |

Kept (factual on-chain token, not brand drift): `$ZABAL` token references, Empire Builder $ZABAL stats, `#zabal` channel, `@zabal_bonfire`, SongJam "$ZABAL mention leaderboard."

---

## Open items (depend on partners, not unilateral)

- **COC Concertz framing** - sent Thy Revolution the branding + ownership questions (per doc 839 challenge 4). His answers decide the final external framing ("ZAO Festivals + COC Concertz" side-by-side is the proposed default). Update this chart once he replies.
- **Per-brand cleanup** - the other ZAO brand repos (ZABAL Games / Magnetic, COC Concertz, ZAOstock, WaveWarZ) each get their own copy audit per the doc 839 prompt set, one at a time.

## Source

- Doc 839 - Fellenz brand + org-structure call (the critique this chart answers)
- [[project_zao_vs_zabal_projects]] - the incubated-vs-partnership taxonomy
- [[project_zao_incubator_model]] - The ZAO as incubator
- [[project_zao_brand_legal_architecture]] - BCZ Strategies LLC / ZABAL umbrella / The ZAO (no legal entity yet)
- [[project_zao_festivals_umbrella]] - "ZAO Festivals presents" framing
