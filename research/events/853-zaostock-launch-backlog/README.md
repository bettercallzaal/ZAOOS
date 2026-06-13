---
topic: events
type: decision
status: research-complete
last-validated: 2026-06-13
superseded-by:
related-docs: 224, 364, 369, 839
original-query: "whats next to do on the zao-stock event site - prioritized backlog of remaining work to make it launch-ready for the Oct 3 Ellsworth event (musician submission flow, volunteer signup, RSVP, lineup, schedule, content gaps)"
tier: STANDARD
---

# 853 - ZAOstock Event Site: Launch-Ready Backlog

> **Goal:** Prioritized backlog to take the public ZAOstock site from "brand-correct skeleton" to launch-ready for October 3, 2026 (Franklin Street Parklet, Ellsworth Maine). Grounded in the actual current state of the `bettercallzaal/zao-stock` repo after the Fellenz brand cleanup (PR #1).

## Key Decisions (read first)

| # | Decision | Why |
|---|----------|-----|
| D1 | **RESOLVE the two-surface fork before building anything else.** There are two live public surfaces: the standalone `zao-stock` repo (minimal, just brand-cleaned) and `zaoos.com/stock` inside the main ZAO OS app (already has team dashboard, RSVP, countdown, partners per MASTER-PLAN). Pick ONE canonical public site; make the other redirect or retire. | Building the backlog twice is waste. Two public URLs for one event splits SEO, RSVP data, and confuses the Ellsworth audience. This is the gating decision - everything below depends on it. |
| D2 | If the standalone repo stays canonical: **port the existing `SubmitForm` + `/api/library/submit` pattern** from the main app (Farcaster-auth-gated, zod-validated, Supabase-backed, moderated) for the musician intake. Do NOT hand-roll a new form. | A battle-tested intake pattern already exists at `src/components/library/SubmitForm.tsx`. Reuse beats reinvention. |
| D3 | **Ship the passive `/submit` intake, not outreach.** Musician path = a passive submission form. No outreach campaigns, no target lists (standing rule). | Active musician outreach is months away; the site's job is to catch inbound, not push. |
| D4 | **Lineup is the highest-value content gap.** Repo shows 5 names (Hurric4n3ike, DJANGO UU, CLEJAN, ATTABOTTY, Mr. Darius) all marked "TBA"; MASTER-PLAN calls for 10 artists noon-6pm. Fill confirmed slots, mark the rest "more TBA". | The lineup is what a music audience comes to see. Half-empty + "TBA" reads as unfinished. |
| D5 | **Wire the dead RSVP + Farcaster buttons or remove them.** `stock/page.tsx` has a non-functional "Sign in with Farcaster & RSVP" button. A button that does nothing is worse than no button. | Either make it real or cut it until it is. |

## Current State (ground truth, post-PR #1)

Repo: `bettercallzaal/zao-stock`, Next.js 16 + React 19 + Tailwind, build now green.

Routes that exist (all static):
- `/` - hero, now "ZAO Festivals presents ZAOstock / by The ZAO", Oct 3 + Ellsworth, two CTA cards (musicians / volunteers) pointing at `mailto:info@thezao.com` with `TODO: confirm submission link`.
- `/stock` - event detail: date/location/capacity/ticket cards, dead RSVP button, 5-name lineup, "Schedule (TBD)", "Community Feed" placeholder.
- `/talks` - Schelling Point roundtables (2 entries), Archive placeholder.
- `/past` - ZAO-PALOOZA + ZAO-CHELLA stats, "Help us gather media" mailto.

What is missing or fake:
- No real submission flow (mailto placeholder only).
- No volunteer signup flow (mailto placeholder only).
- RSVP button has no handler.
- Schedule is "TBD"; Community Feed is "coming soon"; lineup details are "TBA".
- No navigation between pages (no header/nav component - homepage does not link to `/stock`, `/talks`, `/past`).
- No OG image / share preview; `farcaster.json` accountAssociation signature is empty.
- Ticket shows "$10"; donate/sponsor path absent.

## Findings (prioritized backlog)

### P0 - Gating (do before anything)
| Item | Detail |
|------|--------|
| Resolve two-surface fork (D1) | Decide canonical public site: standalone `zao-stock` repo vs `zaoos.com/stock`. The main-app page already has RSVP + team dashboard + countdown + partners. If `zaoos.com/stock` wins, the standalone repo becomes a redirect and most of this backlog moves there. |

### P1 - Core launch (musician + helper entry, the brief)
| Item | Detail |
|------|--------|
| Musician submission flow | Replace homepage `mailto` with a real `/submit` page. Port `SubmitForm` + `/api/library/submit` pattern. Fields: act name, links (Farcaster/music), short bio, building-with-tech note. Honor Sep 3 deliverable cutoff messaging. |
| Volunteer signup flow | Same pattern, lighter form: name, contact, what they can help with (ops/design/music/livestream). Routes to info@thezao.com inbox or Supabase table. |
| Add site navigation | Header linking `/` `/stock` `/talks` `/past` (+ `/submit`). Homepage is currently a dead end. |
| Fill the lineup (D4) | Confirm which of the 5 are locked; target 10 per MASTER-PLAN; mark unconfirmed as "more artists TBA". Confirmed-only on the public grid (standing rule). |
| Wire or cut RSVP (D5) | Either implement Farcaster sign-in RSVP (Neynar) or remove the button until backend exists. |

### P2 - Content completeness
| Item | Detail |
|------|--------|
| Schedule / run-of-show | MASTER-PLAN has `planning/run-of-show.md` (10 artists, DJ transitions, livestream, noon-6pm + Black Moon after-party). Publish a public-safe version. |
| Event context | Add "Part of the 9th Annual Art of Ellsworth / Maine Craft Weekend", gateway to Acadia. Lead with music, zero web3 jargon (Ellsworth audience framing). |
| Partners / sponsors grid | Confirmed partners only. Add a sponsor CTA (tax-deductible via Fractured Atlas 501(c)(3) - use approved fiscal-sponsor phrasing). |
| Donate path | Two paths only: PayPal (fiat) + Giveth (crypto). |
| Past festivals polish | Galleries are "Coming Soon"; wire real media or drop the buttons. |

### P3 - Polish / distribution
| Item | Detail |
|------|--------|
| OG image + share preview | Needed for Farcaster/social shares. No OG currently. |
| Farcaster Mini App / frame | `farcaster.json` exists but signature is empty; decide if this ships as a Mini App. Livestream group (Mickey/Rev lead) + COC Concertz partnership framing if surfaced. |
| Countdown timer | MASTER-PLAN lists a countdown on `zaoos.com/stock`; port if standalone wins. |
| Remove section emojis | Per house style, strip remaining 🎵 / 💬 / 🎸 from `/stock` sections (left out of brand PR scope). |

## Reusable assets already in the ecosystem

- `src/components/library/SubmitForm.tsx` - Farcaster-gated submission UI (zod tags, optimistic feedback). Copy for musician/volunteer intake.
- `src/app/api/library/submit/route.ts` - POST handler: session auth, fid gate, zod validation, Supabase insert, moderation. Template for the intake backend.
- `ZAO-STOCK/MASTER-PLAN.md` + `planning/*` - the full event plan (run-of-show, venue, budget, staffing, contingency). The public site should surface the public-safe slices of these.
- `zaoos.com/stock` + `zaoos.com/stock/team` - existing built-out festival page + team dashboard (the D1 fork candidate).

## Also See

- [Doc 224 - ZAO Stock multi-year vision](../../_archive/224-zao-stock-multi-year-vision/) (archived)
- [Doc 364 - ZAO Festivals deep research](../364-zao-festivals-deep-research/) (Ellsworth context, sponsor framework, Fractured Atlas wording)
- [Doc 369 - DreamEvent gap analysis](../369-dreamevent-framework-gap-analysis/)
- [Doc 839 - Fellenz brand + org strategy](../839-fellenz-brand-org-strategy/) (the critique that drove PR #1)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide canonical public site: standalone `zao-stock` vs `zaoos.com/stock` (D1) | @Zaal | Decision | Before further site work |
| If standalone canonical: build `/submit` from SubmitForm pattern (D2) | @Zaal | PR | Next sprint |
| Add site nav + fill confirmed lineup slots | @Zaal | PR | Before public push |
| Wire or remove dead RSVP button | @Zaal | PR | Next sprint |
| Confirm musician submission link to replace `TODO` in `page.tsx` | @Zaal | PR | After D1 |
| Publish public-safe schedule + Art of Ellsworth context | @Team | PR | After lineup locked |

## Sources

- [FULL] `bettercallzaal/zao-stock` repo - full audit of all routes/components, post-PR #1 (cloned + read every user-facing file this session).
- [FULL] `ZAO OS V1/ZAO-STOCK/MASTER-PLAN.md` - event master plan (venue, teams, pitch, run-of-show index, live page URLs).
- [FULL] `ZAO OS V1/src/components/library/SubmitForm.tsx` - reusable submission form pattern.
- [FULL] `ZAO OS V1/src/app/api/library/submit/route.ts` - submission backend pattern.
- Note: this is an internal product backlog grounded in primary repo sources; no external community source applies. All citations are first-read of working-tree files (FULL), not snippets.
