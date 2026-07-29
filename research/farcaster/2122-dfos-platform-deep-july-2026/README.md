---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: "123, 599d, 804, 876, 2123, 2124, 2125, 2126, 2127, 2128, 308"
original-query: "https://app.dfos.com/spaces/space_vnzfk7hth9vadc3daahd48 use claude in chrome and /zao-research dfos - keep researching on this until we understand the platform fully"
tier: DEEP
---

# 2122 - DFOS Platform Deep Dive (July 2026): public beta, pricing, protocol, and the ZAO move

> **Goal:** Understand DFOS (Dark Forest Operating System) completely as of 2026-07-29 - product surface, pricing, protocol, network state - and decide what The ZAO does about it now that the platform is publicly open. Researched from inside a live authenticated DFOS space (DFOS Home) plus the protocol spec and Metalabel's public record.

**This doc supersedes the operative recommendations in [Doc 123](../123-dfos-dark-forest-protocol/) and [Doc 599d](../599d-dfos-spaces-update-may-2026/).** Both were written while DFOS was a private alpha and both said "not yet." DFOS shipped public beta on 2026-05-21. The gate they were waiting on is open.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Finish the ZAO space on DFOS.** *(Corrected 2026-07-29 - a `zabal` space already exists at `space_t8v7497vazc6tztkvvan7c` with Zaal as Spacerunner. It is an empty shell: 1 member, chat + calendar only.)* Public beta is open and SpaceCamp (a 5-day guided cohort) kicks off 2026-08-02. | FINISH OR DELETE IT. Join the 2026-08-02 SpaceCamp cohort and build out the existing space with a public Front Page - see [Doc 2128](../../community/2128-dfos-operator-manual-zabal-space/) for the checklist. This reverses Doc 123 decision #4 ("MAYBE - when DFOS opens public beta"). The condition is met. |
| 2 | **Start on DFOS Free (10% transaction fee), not DFOS Pro.** Pro is $30/mo ($360/yr) + 5% fee, shipping "later this year." | STAY FREE until the ZAO space clears **$7,200/yr of GMV** - the exact breakeven where `$360 + 0.05G` beats `0.10G`. Below that, Pro costs more. Re-evaluate when Pro actually ships (not announced yet). |
| 3 | **Do NOT implement Sign In With DFOS (SIWD) yet.** It exists and is specified, but is v0.1, explicitly outside the frozen v1 protocol surface, and **no reference implementation of the third-party verifier exists**. | WAIT. Revisit when Metalabel ships a verifier. ZAO would be writing the first third-party implementation against a 0.x spec with no test partner. |
| 4 | **Do NOT move ZAO identity to `did:dfos`.** Doc 123's call stands and is reinforced: DFOS explicitly is "not a social protocol" - no feeds, no graph, no federation. | HOLD on Farcaster FIDs + Neynar (`src/lib/farcaster/neynar.ts`). DFOS identity is complementary, not a replacement. |
| 5 | **Run a `dfos` CLI spike.** The protocol ships a real binary (brew/docker/curl), a relay you can self-host (`dfos serve`), and an **official agent skill for Claude Code**. | SPIKE IT on the Pi. Cheapest possible test of "can ZOE publish cryptographically-signed content chains" - one binary, no chain, no gas. |
| 6 | **Steal the Front Page pattern for ZAO OS.** DFOS spaces are private by default but now get a public landing page; Metalabel reports "thousands of views" and a better join path within days of shipping it. | PORT IT. ZAO OS is a gated 188-member community with no public front door. This is the single highest-leverage borrow in this doc. |
| 7 | **Steal fuzzy member counts.** DFOS shows "THOUSANDS OF MEMBERS / HUNDREDS OF MEMBERS / INTIMATE SPACE" - never an exact number. | ADOPT for ZAO public surfaces. Removes the vanity-metric race without hiding scale. |

## What Changed Since Doc 123 (2026-03) and Doc 599d (2026-05)

| Dimension | Doc 123 / 599d said | Reality on 2026-07-29 |
|-----------|---------------------|------------------------|
| Access | Private alpha, invite-only, ~2,000 users | **Public beta since 2026-05-21** ("R.01: Hacienda"). 50+ public founding spaces, "hundreds more" private by choice |
| Space creation | Founding members only | Self-serve `+ New space`, plus a recurring guided cohort (SpaceCamp) |
| Pricing | "No pricing disclosed" | Free + 10% fee today; **DFOS Pro $30/mo + 5% fee** previewed 2026-07-23 |
| Public links | "Currently DFOS-auth-gated" (599d item #4) | **Front Page** ships public landing pages; per-space subdomains live (`nce.dfos.com`, `clear.dfos.com`, `acorp.dfos.com`) |
| Developer access | "No public API for posting" | Protocol v1 **frozen**, MIT CLI shipping binaries, self-hostable relay, SIWD spec, official Claude Code agent skill |
| Commerce | "Paid subscriptions, space gating, treasury" (announced) | Shipped and iterated: **DFOS Shop 1.1** with free / pay-what-you-want digital releases and **Space Keys** (paid membership to private areas) sold in the space shop |

## Timeline (verified dates)

| Date | Event |
|------|-------|
| 2019 | Yancey Strickler publishes "The Dark Forest Theory of the Internet" |
| 2026-01-28 | Metalabel abandons Slack, moves all internal operations into DFOS |
| 2026-02 (early) | Private alpha opens |
| 2026-03-11 | 2,000 members / 28 countries / 600+ posts / 12,000+ chat messages in 5 weeks. Founding members get space creation. Money layer (paid subs, gating, treasury) + subgroups announced |
| **2026-05-21** | **R.01 "Hacienda" - first public beta.** 50+ public founding spaces. Seven years to the week after the essay |
| 2026-06-10 | Hacienda 1.1 - money features fleshed out, granular posting permissions |
| 2026-06-17 | Hacienda 1.2 |
| 2026-06-24 | Yancey talk at Sonar Festival, Barcelona |
| 2026-07-08 (approx) | Calendar app + in-space navigation bar ship |
| 2026-07-13 | Spacerunner dashboard, email tools, Shop improvements. **New Creative Era space rebranded to "DFOS Home."** 250+ item community reading list published behind-the-fold |
| 2026-07-15 | Spacerunner Dashboard, Spacerunner Studio, Media explorer, Shop 1.1 |
| 2026-07-23 | **Second Forest Gathering: "Where DFOS is going"** - four pillars + pricing preview + Ana Roman tours her cyberfeminist space "The Digital Body" |
| 2026-07-27 | A-Corp Boulder town hall recap mailed to members (see [Doc 2123](../../business/2123-acorp-town-hall-boulder-2026/)) |
| 2026-07-28 | "Making it easier to enter a new DFOS" - new member-onboarding experience launching 2026-07-29 |
| 2026-08-02 | SpaceCamp cohort #2 begins (5-day sprint to launch a space) |
| 2026-08-12 | A-Corp online info session, 3pm EST |
| 2026-08-20 | Next monthly Forest Gathering |

## The Four Pillars (Yancey, Forest Gathering 2026-07-23)

Quoted from the recap post inside DFOS Home:

1. **Our own internets.** "The shared web has gotten spoiled, we've all pulled back from it for good reason, DFOS is a way back into something we actually control."
2. **Full stack.** "Metalabel used to run on Slack, Notion, Discord, and Mailchimp, adding up to roughly $3,300/yr for a 10 person team. DFOS collapses all of that into one thing. Free right now with a 10% transaction fee, DFOS Pro coming later this year at $30/mo with a 5% fee instead."
3. **Creative network.** "Not just what's happening inside your own space, but shared connective tissue across DFOS. Think a global calendar, open studio weekends, that kind of thing."
4. **Built for good.** "The DFOS protocol cryptographically verifies your data as yours. Yancey's own local backup tool (**DFOSBox**) already syncs his posts into markdown files on his hard drive, and a public version is on the roadmap."

Pillar 4 is the one to watch: DFOSBox is local markdown export of your own posts. If it ships publicly, a ZAO space on DFOS is not a lock-in risk - the content leaves as files.

## Pricing (as presented 2026-07-23)

The comparison slide DFOS uses against the incumbent stack:

| Stack | Fixed cost | Revenue fee |
|-------|-----------|-------------|
| Notion (10 seats) | $120/mo | - |
| Mailchimp (1K subs) | $26.50/mo | - |
| Shopify Basic | $39/mo | - |
| Substack | - | 10% |
| Patreon | - | 10% |
| **Status quo total** | **$270+/mo, $3,200+/yr** | plus fees |
| **DFOS Free (today)** | **$0** | **10% transaction fee** |
| **DFOS Pro (coming 2026)** | **$30/mo ($360/yr)** | **5%** |

Their worked example for a creator earning **$5,000/yr**:

| | Incumbent stack | DFOS Pro | DFOS Free |
|---|---|---|---|
| Fixed costs | $3,500 | $360 | FREE |
| Revenue fees | $450 | $450 (5% processing) | $700 (10% processing) |
| **Total** | **$4,000** | **$720** | **$700** |

**ZAO decision math:** Free costs `0.10G`; Pro costs `360 + 0.05G`. They cross at **G = $7,200/yr**. Below $7,200 of annual space GMV, Free is strictly cheaper. DFOS's own $5K example confirms it - Free ($700) beats Pro ($720) at that revenue.

## Product Surface (mapped from inside DFOS Home, 2026-07-29)

### Space homepage
A grid of draggable tiles, each an app or a link. DFOS Home runs 14 tiles: a folder ("START HERE"), a welcome video, a live calendar tile, a blog, a chat, a resources folder, a community blog, a link tile (Member Map), a groupchat, a member group (SpaceKeepers), a podcast folder, three shop products at $1 each, and a Members tile. Each space's homepage is arranged by its admins - "Spacerunners."

### App types observed
- **Blog** - long-form posts with channel filters (`All / general / product / dev`), upvotes, comments, bookmarks, read-time estimates, video and slide embeds, and a **behind-the-fold** cut (shipped early July) for long posts
- **Chat / Groupchat** - real-time, with named subgroups (e.g. a Reading Club lives at `DFOS Home > Groupchat > Reading club`)
- **Calendar** - shipped ~2026-07-08; Metalabel reports it "already changed how people use DFOS... more opportunities to come together IRL"
- **Shop** - digital releases, now free or pay-what-you-want, plus **Space Keys** (paid access to private areas of the space) sold in the same storefront
- **Folder** - nested tile groups
- **Member map** and **member group** tiles
- **Broadcast/email** - posts mail out from `newsletter.dfos.com` with per-post read tokens

### Global navigation
- Top-right per space: All posts, All chats, Calendar, Store, **All media** (the Media explorer - every video, audio file, and image in a space)
- Left rail: search, inbox, wallet, bookmarks, **Discover spaces**, space switcher, `+ New space`

### Admin surface
- **Spacerunner Dashboard** - admin-only analytics: member count, post views
- **Spacerunner Studio** - unified settings navigation (privacy, posts, products)
- **Front Page** - public landing page for an otherwise private space. Metalabel: "Front Pages have racked up thousands of views while creating a better path for becoming part of a DFOS space in just the first few days."
- **Subgroups** - groups within a space with own feeds, chats, permissions, paid or free

### Discovery and the anti-vanity-metric choice
"Discover spaces" is a searchable public directory. Member counts are shown as **buckets, never numbers**: `THOUSANDS OF MEMBERS`, `HUNDREDS OF MEMBERS`, `INTIMATE SPACE`. This is a deliberate product stance consistent with the dark forest thesis - scale is legible, leaderboards are not.

### Public spaces sampled from the directory (2026-07-29)

| Space | Size bucket | Note |
|-------|-------------|------|
| DFOS HOME | Thousands | The official space (formerly New Creative Era) |
| clear.txt | Thousands | Community-run space for technologists |
| Artist Corporations | Thousands | A-Corp community - see Doc 2123 |
| Tech Itch Recordings | Hundreds | Drum & bass label - **music vertical proof point** |
| Sol Invicto | Hundreds | Music project |
| Sounds of the Forest | Hundreds | Music |
| Release Day | Hundreds | Release-cycle community |
| Press Play | Hundreds | Media |
| Elysian Collective, Yancey Strickler, Otherwise, Matrixed-Systems, critical theory, ARTSHOW, ULTRA-REALITY, Dark Forest Film Club | Hundreds | Mixed art/theory/film |
| more curiosity, Underachiever's Club, sukoya, Black Stone Sanctuary, Anthracite Underground | Intimate | Small spaces |

Music communities are already on DFOS. ZAO would not be the first, which lowers the "will this work for a music community" risk.

## Protocol Layer (protocol.dfos.com, as of 2026-07-29)

**Status: Protocol v1 is feature-complete and FROZEN.** Chain mechanics, canonical DAG-CBOR encoding, identifier derivation, and validity bounds "are settled and will not change in shape." v1 is frozen but not yet declared final - it becomes final once independent implementations verify byte-for-byte from the prose alone. Reference packages stay on their own `0.x` semver line: **freezing v1 commits the wire, not a library API.**

Repo: [github.com/metalabel/dfos](https://github.com/metalabel/dfos) - MIT, **29 stars, 2 forks, last push 2026-07-21**.

### What it is, in their own words
- **Not a social protocol.** "No federation model, no feeds, no application semantics."
- **Not a blockchain.** "No consensus layer, no gas fees, no chain state to sync. Forks are valid."
- **Not an encryption system.** "Privacy comes from separation, not obscurity... This is undisclosed-by-default, not end-to-end encrypted." A relay operator can read what it stores.
- **Not coupled to the DFOS platform.** "DFOS is one implementation."

### The core claim vs Farcaster
> "The major social protocols - AT Protocol, nostr, Farcaster - are public-by-default: to verify a piece of content you generally have to be able to read it. DFOS separates proof from content."

The proof world is public (signed chains anyone can verify); the content world is private. The protocol commits to content *hashes*, never documents.

### Toolchain (all real, all shipping)

```
curl -sSL https://protocol.dfos.com/install.sh | sh
brew install metalabel/tap/dfos
docker pull ghcr.io/metalabel/dfos

dfos identity create --name myname          # create your identity
echo '{"body":"gm"}' | dfos content create - # publish
dfos content list                            # read
dfos serve                                   # run a relay
```

- Cross-language verification in **TypeScript, Go, Python, Rust, Swift**, all against the same deterministic test vectors
- Web relay with three peering behaviors (gossip, read-through, sync); `/proof/v1/*` frozen; document gateway on its own 0.x clock; DIF Universal Resolver binding at `/1.0/identifiers/:did`
- Credentials with delegated authorization, attenuation, and revocation
- **Official agent skill**: "Drive the CLI from your AI coding agent - Claude Code, or any agent via npx skills"
- Full spec published as machine-readable `llms-full.txt` (356,645 bytes)

### Sign In With DFOS (SIWD) v0.1 - the interesting one, and why to wait

SIWD lets a third-party app verify a user's DFOS identity via Ed25519 challenge-response against a single `/authorize` endpoint:

```
https://dfos.com/authorize?
  challenge=<base64url challenge JSON>
  &redirect_uri=https://3p.com/callback
  &scope=identity
```

- Scopes: `identity` (prove DID ownership) and `read:<contentId>` (prove DID + return a read credential for a content chain)
- Challenge object: `{domain, nonce, timestamp, statement?, did?}`, signed as JWS with `alg: EdDSA` and `typ: "did:dfos:siwd"`
- Two signing paths behind one endpoint - **Managed** (platform signs with a KMS-held key) and **Sovereign** (user's local CLI signs). The third party cannot tell which was used; both verify identically
- **Verification is pure crypto - no DFOS server in the loop after issuance**

The blocker, stated in their own spec: SIWD is "an optional authentication seam on its own `0.x` clock, independent of the Protocol v1 freeze" and **"No reference implementation of the third-party verifier exists yet in this repository - published here for review and to inform implementors."**

ZAO already runs multi-identity auth - Farcaster AuthKit/Neynar (`src/components/providers/AuthKitWrapper.tsx`, `src/lib/farcaster/neynar.ts`) alongside Lens (`src/hooks/useLensAuth.ts`), sessions in `src/lib/auth/session.ts`. Architecturally SIWD would be a third adapter, not a rewrite. But being the first external verifier implementation against a 0.x spec is unpaid protocol QA. Wait for the reference verifier.

## Community Signal (and the notable absence of it)

| Source | Finding |
|--------|---------|
| Hacker News (Algolia API) | **2 total hits** for "dfos metalabel" across all of HN. One is a passing comment (2026-02-14) mentioning "They even have a Dark Forest OS." Zero submissions, zero discussion threads |
| GitHub | 29 stars / 2 forks on the protocol repo, actively pushed (2026-07-21) |
| Reddit | No DFOS presence found; Reddit's JSON search returned 403 to this session (see Sources) |
| Inside DFOS | The Jul 25 Forest Gathering recap has 8 upvotes and 1 comment; the Jul 13 reading-list post has 33 upvotes and 13 comments in a "thousands of members" space |

**This is a finding, not a gap.** A platform built on the thesis that meaningful activity has left the public internet has, consistently, almost no public-internet footprint. Growth runs through Metalabel's email list, the podcast, and invitations - not forums. Two consequences for ZAO: (a) do not expect to learn about DFOS problems from public postmortems, and (b) engagement numbers inside spaces are modest relative to the "thousands of members" bucket, so treat DFOS as a distribution channel for depth, not reach.

## ZAO Positioning: what actually differentiates now

Doc 599d's differentiation still holds, but two of its four legs weakened as DFOS shipped:

| Leg | 599d (May) | Now (July) |
|-----|-----------|-----------|
| Onchain | ZAO has it, DFOS has none | **Still true.** DFOS has no token, no governance primitive, no chain. ZAO has ZABAL, Respect, ZOLs |
| Agents | ZAO has ZOE/Hermes/ZOEY; DFOS spaces "static" | **Weakened.** DFOS ships an official agent skill and an identity designed for "AI agents and devices." Their agent story is protocol-level, not in-space - still a real gap, but no longer empty |
| Music-first | ZAO music-first, DFOS multi-vertical | **Weakened.** Tech Itch Recordings, Sol Invicto, Sounds of the Forest, Release Day are all live music spaces |
| Open source | ZAOOS open, DFOS closed alpha | **Inverted for the protocol.** DFOS protocol is MIT with five language implementations. The *platform* remains closed |

The durable ZAO edge is the combination DFOS explicitly declines to build: **onchain governance and economics** (they are "not a blockchain" by design) plus **Farcaster-native public distribution** (they are "not a social protocol" by design). Those are not gaps in DFOS - they are refusals. That makes them stable ground to build on.

## Also See

- [Doc 123](../123-dfos-dark-forest-protocol/) - original DFOS protocol reference (mark superseded by this doc)
- [Doc 599d](../599d-dfos-spaces-update-may-2026/) - May 2026 DFOS state (superseded by this doc)
- [Doc 2123](../../business/2123-acorp-town-hall-boulder-2026/) - A-Corp Boulder town hall, July 2026
- [Doc 2124](../../business/2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/) - why Metalabel removed blockchains, and what it means for ZAO's onchain thesis
- [Doc 2125](../../business/2125-dfos-vs-community-platform-market/) - DFOS pricing vs Circle / Skool / Mighty / Patreon, with crossover math
- [Doc 2126](../../security/2126-dfos-protocol-security-conformance/) - protocol threat model, credentials, conformance tiers
- [Doc 2127](../../business/2127-post-naive-internet-movement-and-its-crypto-problem/) - the post-naive internet movement and its rejection of crypto
- [Doc 2128](../../community/2128-dfos-operator-manual-zabal-space/) - operator manual and the existing zabal space
- [Doc 804](../../business/804-colorado-artist-corporation-acorp/) - Colorado Artist Company Act (SB 26-133)
- [Doc 876](../../business/876-artist-corporations-acorp-model-zao/) - A-Corp model mapped to ZAO
- [Doc 308](../308-farcaster-ecosystem-spring-2026/) - Farcaster ecosystem context

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Join SpaceCamp cohort kickoff (5-day sprint, starts Aug 2) via SpaceKeepers group in DFOS Home - registered and kickoff call attended | @Zaal | Calendar + RSVP | 2026-08-01 |
| Create The ZAO space on DFOS with a public Front Page - space live and Front Page URL shareable | @Zaal | Ship | 2026-08-09 |
| Update Doc 123 and Doc 599d frontmatter to `superseded-by: 2122` - PR merged | @Zaal | PR | 2026-07-31 |
| Run `dfos` CLI spike on the Pi: install binary, create an identity, publish one content chain, run `dfos serve` - findings appended to this doc | @Zaal | Spike | 2026-08-31 |
| Port the Front Page pattern into ZAO OS: public landing page for the gated community with a join path - PR merged | @Zaal | PR | 2026-09-15 |
| Add fuzzy member-count buckets to ZAO OS public surfaces (replace exact counts) - PR merged | @Zaal | PR | 2026-09-15 |
| RSVP the 2026-08-20 Forest Gathering (DFOS roadmap updates land there first) | @Zaal | Calendar | 2026-08-19 |
| Re-check whether DFOS Pro shipped and whether a SIWD reference verifier exists; update this doc's `last-validated` | @Zaal | Research | 2026-09-30 |

## Sources

Authenticated in-product sources (read inside DFOS Home, space `space_vnzfk7hth9vadc3daahd48`, via Claude in Chrome on 2026-07-29):

- DFOS Home space homepage, 14 tiles [FULL]
- "July Forest Gathering Recap" - danielle, 2026-07-25, post `post_8r36cdtrvk3z6e2zrdkc8n` [FULL] - four pillars, pricing, DFOSBox, SpaceCamp Aug 2, next gathering Aug 20
- "Making it easier to enter a new DFOS" - Yancey, 2026-07-28, post `post_8fv3c4fv77r33ek3ec3r68` [FULL] - pricing slides, A-Corp town hall, Front Page results, SpaceCamp detail
- "200+ recommended books and articles from all of us" - Yancey, 2026-07-13 [FULL] - NCE to DFOS Home rebrand, behind-the-fold, Spacerunner dashboard
- "Discover spaces" directory, unfiltered and `music`-filtered [FULL] - space inventory and member-count bucketing
- Forest Gathering video recordings (11:52 Yancey, 7:28 Ana Roman) [PARTIAL - listed and dated from the post; video not transcribed. Escalation would require downloading DFOS-hosted media behind auth; the written recap covers the same four pillars]

Public sources:

- [DFOS R.01: Hacienda](https://blog.metalabel.com/dfos-r-01-hacienda/) - 2026-05-21 [FULL] - public beta announcement, 50+ founding spaces
- [Maintaining an online presence is work](https://blog.metalabel.com/maintaining-an-online-presence-is-work/) - 2026-07-15 [FULL] - Spacerunner Dashboard/Studio, Media explorer, Shop 1.1, calendar
- [Why we need the dark forest](https://blog.metalabel.com/why-we-need-the-dark-forest/) - 2026-03-11 [FULL] - 2,000 members / 28 countries / 600+ posts / 12,000+ messages
- [Life in the forest](https://blog.metalabel.com/life-in-the-forest/) - 2026-06-10 [FULL] - Hacienda 1.1
- [Building in the dark forest](https://blog.metalabel.com/building-in-the-dark-forest/) - 2026-01-28 [FULL] - Metalabel leaves Slack
- [protocol.dfos.com](https://protocol.dfos.com/) [FULL via `llms-full.txt`] - the site itself is a JS SPA whose sub-routes return the shell to fetchers; escalated to their published `llms-full.txt` (356,645 bytes), which contains the complete spec including SIWD, credentials, relay, DID method, threat model, and conformance
- [github.com/metalabel/dfos](https://github.com/metalabel/dfos) [FULL via GitHub API] - MIT, 29 stars, 2 forks, pushed 2026-07-21
- [artistcorporations.com](https://www.artistcorporations.com/) [FULL] - A-Corp status (detail in Doc 2123)
- [dfos.com](https://www.dfos.com/) [PARTIAL - marketing shell only, video-driven landing page with no substantive text; all product detail came from the app and blog]
- Hacker News via Algolia API [FULL] - 2 total hits, one passing comment 2026-02-14
- Reddit [FAILED - `zao-fetch-reddit.sh` and direct curl with browser UA both returned non-JSON/403 on 2026-07-29. Independently, exa and WebSearch surfaced zero Reddit threads about DFOS, so the absence of Reddit signal is corroborated even though the direct search failed]
