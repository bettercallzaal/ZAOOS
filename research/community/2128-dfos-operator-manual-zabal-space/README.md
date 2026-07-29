---
topic: community
type: guide
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: "2122, 2125, 2127, 599d"
original-query: "lets keep researching more and more / Go wide on everything (DFOS deep research wave 3 - map the rest of the app and figure out what running a ZAO space actually takes)"
tier: STANDARD
---

# 2128 - DFOS operator's manual: the zabal space already exists, and what finishing it takes

> **Goal:** Document the operator surface of DFOS from inside a space Zaal actually runs, correct [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/)'s assumption that a ZAO space needs creating, and give a concrete build-out checklist against what a mature space looks like.

## The correction

Doc 2122 decision #1 said "create a ZAO space on DFOS." **A `zabal` space already exists** - `space_t8v7497vazc6tztkvvan7c` - and Zaal is its Spacerunner.

It is an empty shell. Three tiles: **Members** (one member - Zaal), **Chat**, **Calendar**. No blog, no shop, no Front Page, no subgroups, no invited members, no content.

The action is not "create a space." It is **"finish the space that exists."** That is a materially easier task with a materially different failure mode - an abandoned half-built space is worse than no space, because it is discoverable.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Finish `zabal` or delete it. Do not leave it half-built.** It currently reads as abandoned to anyone who finds it. | DECIDE by 2026-08-09. SpaceCamp (starts 2026-08-02) is the forcing function. |
| 2 | **Decide the space's identity before adding apps: is it ZABAL, The ZAO, or ZAO Music?** The name `zabal` scopes it narrowly to the token/games surface. | NAME IT FIRST. Everything else - Front Page copy, who gets invited, what the shop sells - follows from this and cannot be retrofitted cheaply. |
| 3 | **Build in this order: Front Page, then blog, then invites, then chat, then shop.** DFOS's own reported result is that Front Pages drove "thousands of views" and a better join path within days. | FOLLOW THE ORDER. Inviting people into an empty space burns the invite. |
| 4 | **Do not use DFOS for anything ZAO would not put in a shared Google Doc.** The relay operator can read stored content - see [Doc 2126](../../security/2126-dfos-protocol-security-conformance/). | HARD RULE. No treasury detail, no member PII, no unreleased masters. |
| 5 | **Run the space as a distribution surface, not a migration.** ZAO's home stays ZAO OS on Farcaster. | KEEP scope narrow: DFOS is where ZAO meets the post-naive/creative-infrastructure world (see [Doc 2127](../../business/2127-post-naive-internet-movement-and-its-crypto-problem/)), not where the 188-member community relocates. |

## Zaal's current DFOS footprint

| Space | ID | Role | State |
|-------|-----|------|-------|
| **DFOS HOME** | `space_vnzfk7hth9vadc3daahd48` | Member | The official space, thousands of members |
| **Artist Corporations** | - | Member | Thousands of members, A-Corp community ([Doc 2123](../../business/2123-acorp-town-hall-boulder-2026/)) |
| **zabal** | `space_t8v7497vazc6tztkvvan7c` | **Spacerunner** | Empty shell - 1 member, chat + calendar |
| **Wyld Flower Meadow** | `space_zhn484cf72e7699c2e8hc3` | Member | Matty Bovard's space, 24 unread |
| **The Open Machine** | `space_28eve6a2en62neern62v4t` | Member | Fully custom generative-art homepage |

**Wyld Flower Meadow closes an open loop.** [Doc 599d](../../farcaster/599d-dfos-spaces-update-may-2026/) flagged `space_zhn484cf72e7699c2e8hc3` in May 2026 as a DFOS-auth-gated post worth reading ("Been a week of life as an artist living on the edge," Matty Bovard - Colorado poet, A-Corp adjacent, directly relevant to ZAO's artist-on-the-edge thesis). Zaal now has access. **24 unread items are sitting there.**

Its layout is a good small-space reference: Members, Wyld Flower Creative Canvass, Wyld Flower Chat, Post-It Note Collectors (a subgroup), Calendar, and a 1:34 intro video ("Testing, Testing, But It's Real"). Five tiles, one video, one subgroup - that is a complete-feeling space.

## The Spacerunner surface

The full admin menu, from the space dropdown in `zabal`:

| Item | What it is |
|------|-----------|
| **Spacerunner Studio** | The unified settings console - privacy, posts, products |
| **Invite members** | Invitation flow |
| **Notification settings** | Per-space notification control |
| **Share feedback with DFOS** | Direct line to Metalabel; also pinned as a persistent button in-app |
| **Manage space** | Space configuration |
| **Space dashboard** | Admin-only analytics - member count, post views |
| **Edit desktop** | Rearrange the tile grid |
| **Add to desktop** | Add an app or tile |
| **Leave space** | - |

"Desktop" is DFOS's word for the space homepage. It is not a fixed template: **The Open Machine renders a full-bleed generative ASCII canvas** as its homepage, with app tiles overlaid. The customisation claim in Metalabel's marketing is real - a space homepage can be an arbitrary rendered surface, not a themed grid.

## The wallet and money layer

Confirmed from `app.dfos.com/wallet`:

- **Purchases** - "Products and keys you buy show up here - download your files or open the group anytime"
- **Balance** - separate tab
- **Billing & invoices** - "Card, invoices, and history in **Stripe**", with a Manage link out to Stripe's portal
- **Order history**

**Everything runs on Stripe. There is no crypto anywhere in the money layer** - consistent with Metalabel's post-crypto position ([Doc 2124](../../business/2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/)). "Keys" in the purchase copy refers to **Space Keys** - paid memberships to private areas - not cryptographic keys.

Practical consequence for ZAO: a DFOS space can take fiat payments on day one with no integration work, and cannot take crypto at all.

## Build-out checklist: `zabal` vs a mature space

Measured against DFOS Home (14 tiles) and Wyld Flower Meadow (5 tiles + video + subgroup):

| Element | DFOS Home | Wyld Flower | `zabal` | Priority |
|---------|-----------|-------------|---------|----------|
| Front Page (public landing) | Yes | - | **No** | **1** |
| Intro / welcome video | Yes (0:19) | Yes (1:34) | **No** | **2** |
| Blog with channels | Yes (All/general/product/dev) | - | **No** | **3** |
| Members | Yes | Yes | Yes (1) | **4 - invite** |
| Chat | Yes | Yes | Yes | Done |
| Calendar | Yes | Yes | Yes | Done |
| Groupchat / subgroups | Yes (+ Reading club) | Yes (Post-It Note Collectors) | No | 5 |
| Shop / products | Yes (3 at $1) | - | No | 6 |
| Resources folder | Yes | - | No | 7 |
| Member map | Yes | - | No | Optional |
| Custom desktop art | Yes | Yes | **No** | 2 (cheap, high impact) |

**Minimum viable ZAO space:** Front Page + welcome video + custom desktop + one blog post + 10 invited members. Everything below that reads as abandoned; everything above it is optional.

## The on-ramp: SpaceCamp

From the 2026-07-25 Forest Gathering recap and the 2026-07-28 post:

- **Five-day sprint for launching your DFOS space**, run as a cohort
- **Cohort #2 starts 2026-08-02**; kickoff call Monday, optional midweek support session, work at your own pace
- Coordinated in the **SpaceKeepers** group inside DFOS Home
- This is the second-ever cohort - the first ran around March 2026 for founding members

A guided cohort with a deadline is the right forcing function for a space that has been sitting empty. It also puts ZAO in a room with the other people launching spaces, which is the actual value.

## Notes on the rest of the app

- **Discover spaces** (telescope icon) is a searchable public directory with fuzzy member buckets - `THOUSANDS OF MEMBERS` / `HUNDREDS OF MEMBERS` / `INTIMATE SPACE`. Searching `music` returns Sol Invicto, Sounds of the Forest, sukoya, Black Stone Sanctuary, Anthracite Underground, ULTRA-REALITY, more curiosity, Underachiever's Club
- **Left rail** (global, not per-space): search, inbox, wallet, bookmarks, discover, space switcher, `+ New space`
- **Per-space top-right nav**: All posts, All chats, Calendar, Store, All media
- **"Share feedback on DFOS"** is a persistent pinned button in every space - Metalabel is running a continuous feedback loop as a product surface, not a form buried in settings

## Also See

- [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/) - DFOS platform deep dive (this doc corrects its decision #1)
- [Doc 2126](../../security/2126-dfos-protocol-security-conformance/) - what may not go in a DFOS space
- [Doc 2127](../../business/2127-post-naive-internet-movement-and-its-crypto-problem/) - why a DFOS space is a positioning move
- [Doc 599d](../../farcaster/599d-dfos-spaces-update-may-2026/) - flagged Wyld Flower Meadow in May; now accessible

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide the space's identity - ZABAL vs The ZAO vs ZAO Music - and rename `zabal` accordingly, or delete it | @Zaal | Decision | 2026-08-02 |
| Join SpaceCamp cohort #2 via the SpaceKeepers group in DFOS Home - registered | @Zaal | RSVP | 2026-08-01 |
| Ship minimum viable space: Front Page, welcome video, custom desktop, one blog post, 10 invites - space live | @Zaal | Ship | 2026-08-09 |
| Read the 24 unread items in Wyld Flower Meadow and pull anything relevant to ZAO's artist-on-the-edge thesis into a note - note in repo | @Zaal | Read | 2026-08-08 |
| Post ZAO's "why still onchain" piece (from [Doc 2127](../../business/2127-post-naive-internet-movement-and-its-crypto-problem/)) as the space's first blog post - published | @Zaal | Ship | 2026-09-12 |
| Re-audit the space against the build-out checklist 30 days after launch; delete it if it is still empty | @Zaal | Audit | 2026-09-09 |

## Sources

All in-app, read via Claude in Chrome on 2026-07-29 under Zaal's authenticated session:

- `zabal` space `space_t8v7497vazc6tztkvvan7c` [FULL] - three tiles, one member, full Spacerunner admin menu
- `Wyld Flower Meadow` space `space_zhn484cf72e7699c2e8hc3` [FULL homepage; **PARTIAL on content** - 24 unread items not read. Left deliberately: reading another member's small private space in depth is Zaal's call, not an automated sweep. Flagged as a Next Action instead]
- `The Open Machine` space `space_28eve6a2en62neern62v4t` [PARTIAL - homepage canvas captured; app tiles had not finished loading when observed]
- `app.dfos.com/wallet` [FULL] - Purchases, Balance, Stripe billing, order history
- DFOS Home space `space_vnzfk7hth9vadc3daahd48` [FULL] - the 14-tile reference layout
- Discover spaces directory, unfiltered and `music`-filtered [FULL]
- "July Forest Gathering Recap" 2026-07-25 and "Making it easier to enter a new DFOS" 2026-07-28 [FULL] - SpaceCamp detail
- Spacerunner Studio / Manage space internals [NOT OPENED - deliberately. Entering admin configuration screens on a live space Zaal owns risks changing settings. The admin menu inventory above is from the dropdown only]
