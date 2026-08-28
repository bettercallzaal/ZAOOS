---
topic: farcaster
type: audit
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: 034, 346, 611, 993, 2285, 2313, 2419
original-query: "research about noun space, Tom."
tier: DEEP
---

# 2430 - Nounspace and Tom: the app is offline, the domains are expired, and Tom was the AI cofounder

> **Goal:** Answer "research about noun space, Tom" with fetched sources only: what
> Nounspace is as of 2026-08-28, who Tom is, what it did for a community like The
> ZAO, where it overlaps with what we already run, and a glue-first verdict.

## Assumptions, stated first

- "noun space" is read as **Nounspace** (nounspace.com), the customizable Farcaster
  client funded by Nouns DAO in April 2024, later rebranded **blank.space**.
- "Tom" is read as the person or account most associated with Nounspace **as the
  sources establish**. The sources do connect a Tom: `nounspaceTom.eth`
  (Farcaster FID 527313, GitHub `nounspaceTom`). He is **not a human**. He is the
  project's autonomous AI agent, billed by the project as its cofounder and "Former
  CEO". Details and evidence in section 3.
- The ZAO's own advisor Tom Fellenz does not appear in any Nounspace source fetched
  this run and is not assumed to be meant. No other Tom appears in the Nounspace
  material.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Do NOT adopt Nounspace / blank.space as The ZAO's community home.** | The app went offline 2026-07-04 by its founder's own announcement; `blank.space` and `zabal.blank.space` now serve a Namecheap "Domain registration has expired" page; `nounspace.com` 301s to `nouns.wtf`; the main repo has 0 commits in the last 180 days and its top maintainer is now Head of Product at Venice AI. Fails the glue-first "alive" line outright. |
| 2 | **Take the pattern, not the code: the community-config seed model and the token-holder directory fidget.** | `space-system` seeds "community configs" (nouns, example, clanker) from a config file into Supabase and renders a branded space per community. That is exactly what ZAOOS's `community.config.ts` already does for one community. The one fidget Zaal singled out in ZABAL Update 17 (Farcaster users who hold your ERC-20) is a Moralis lookup we can reproduce inside ZAOOS in under 100 lines. GPL-3.0 means copying code brings share-alike obligations; copying the idea does not. |
| 3 | **Tom is the reference implementation for what ZOL is trying to be, and the cautionary tale.** | Tom = ElizaOS agent + Farcaster plugin, persona casts, Clanker deploy casts, and an onchain Nouns proposal filed from the agent's own address with a human sponsor (`proposeBySigs`). By 2026-06-05 the founder was still "meaning to ... reactivate tom". An agent cofounder that outlives the company's attention is a liability, not an asset. ZOL's draft-only default (doc 2285) is the right gate. |
| 4 | **Nothing here changes the fleet-board auth choice (SIWF, 2026-08-27) or the ZID plan (doc 2419).** | `space-system` authenticates with Privy plus an app-level Farcaster signer (`APP_MNEMONIC`, `NEXT_PUBLIC_APP_FID`), not with a Sign-in-with-Farcaster library we could lift. Doc 2313 already picked auth-kit / Quick Auth. Nounspace's wind-down note is itself the argument for ZID staying keyed to FID and wallet: "Your Farcaster identity and social graph remain intact". |
| 5 | **Two ZAO docs and one public ZAO post now point at dead URLs.** | Docs 346 and 611 (both last-validated 2026-05-21) cite `iykyk.blank.space`; ZABAL Update 17 (Paragraph, 2026-02-11) links `zabal.blank.space`. All three resolve to the expired-domain page today. Revalidate and annotate; do not delete the history. |

## 1. What Nounspace was, and what it is on 2026-08-28

**Then (2024).** Nounspace was "an open source Farcaster client centered around
customizability" (paragraph.com/@nounspace/space-fair-launch, 2024-06-14). Three
primitives: **Themes** (fonts, colours, code, music), **Fidgets** (embeddable
mini-apps), **Tabs** (extra pages). Every user got a **Space** (public profile) and a
**Homebase** (a space only the owner sees). The team's own one-liner, from their
Gitcoin profile: a "web(3)site builder with social natively integrated". Doc 034
(archived) counted 11 themes and a fidget list including feed, cast, gallery, video,
portfolio, governance, music player and chat.

Timeline, every date from a fetched page:

| Date | Event | Source |
|---|---|---|
| 2024-02-15 | Nouns prop 498 "Nouns x Farcaster" creates the funding round | nouns.wtf/vote/498 |
| 2024-03-14 | Idea; 03-23 proposal submitted to the Prop House round | paragraph.com/@nounspace/fair-launch |
| 2024-04-01 | Nounspace wins a $100k grant from Nouns | same |
| 2024-04-15 | Repo created, forked from hellno/herocast | GitHub `blankdotspace/space-system` |
| 2024-05-09 | fname `nounspacetom` registered, FID 527313 | Haatz hub `userNameProofByName` |
| 2024-06-14 | $SPACE fair launch (MOR20 standard, stETH deposits) | paragraph.com/@nounspace/space-fair-launch |
| 2024-07-02 | Nounspace v0 launch | same |
| 2024-09-12 | $SPACE claimable on Base, CA `0x48C6740BcF807d6C47C864FaEEA15Ed4dA3910Ab`; nounspace DAO (Snapshot + Safe + oSnap, 20,000 $SPACE to propose); team becomes the Based Space Foundation | paragraph.com/@nounspace/space-launch |
| 2024-09-26 | Nouns prop 647 "Double down on nounspace.wtf - v2", 200,000 USDC, proposed by `nounspacetom.eth`, sponsored by `willywonka.eth` | nouns.camp/proposals/647 (Chrome render) |
| 2024-10-03 | Willy concedes prop 647 onchain: "we can only respect the community's decision" | same |
| Dec 2024 | Nouns' year recap: of the three funded clients "only nounspace is still operational today" | paragraph.com/@nounsdao/2024-in-nouns |
| 2025-04-01 | Optimism Show E47 "Can AI Agents Be CoFounders?" introduces "Nounspace Tom" | rss.com/podcasts/optimismshow/1968460 |
| 2025-10-21 | "Introducing Channel Spaces": a customizable space and mini app for every Farcaster channel | farcaster.xyz/willywonka.eth/0x8f9db164 |
| 2025-12-18 | `nounspace-old` forked off as "The original nounspace web client"; main repo README now says "Blankspace" | GitHub |
| 2026-02-09 | Last push to `space-system` | glue-check |
| 2026-02-11 | ZABAL Update 17: "ZABAL Now Has a Blank Space", `zabal.blank.space`, set up live on a call with Willy | paragraph.com/@thezao/zabal-update-17 |
| 2026-03-30 | Discord listed as "blank.space (fka nounspace)", 265 members | disdex.io |
| 2026-06-10 | Last Wayback capture of nounspace.com returning 200 | web.archive.org CDX |
| 2026-06-19 | Willy, in /nounspace: "we've made the difficult decision to wind down Nounspace. The app will go offline on July 4th." | Haatz hub, cast `0x3d153029` |
| 2026-07-04 | Tom's last cast on the hub | Haatz hub, FID 527313 |
| 2026-08-28 | `nounspace.com` 301 to `nouns.wtf`; `blank.space`, `zabal.blank.space` expired; `alpha.blank.space` no response; `space.nounspace.com` still serves its title only | curl, this run |

**Now.** The product is gone. What remains: the GPL-3.0 code, a Discord, a
Farcaster channel with Tom's persona casts, a $SPACE token that was migrated into the
Clanker ecosystem (Tom's cast, undated on the fetched page, Clanker CA
`0xbf63463eE6F105EDC5AdeAa28A0fE8c297aD0b07`), and Willy's closing pointer: "The
codebase remains open source ... It includes alpha.blank.space, a launchpad for
customizable space systems we were preparing before pivoting to the sunset. Anyone
interested in forking or building on it, it's waiting for you."

### Funding, measured

- **Prop 498** (2024-02-15): the round. The proposal text says three teams "@ $50k
  each" and its transaction sends 150,000 USDC; the round's own site
  nounsfarcaster.com says "$100k USDC each" and Nounspace says it received "$100k".
  **Contradiction unresolved** between the onchain text and the round site; the
  $100k figure is what the team reports receiving.
- **Prop 647** (2024-09-26): 200,000 USDC, "2.9% of treasury". A prior "v1" ask
  existed and was "close"; Willy told Edge of NFT (Aug 2024) they were "asking them
  for another 250". Nouncil voted against 24-14-9. Willy's onchain concession on
  2024-10-03 is the outcome; the final onchain tally was not in the rendered page
  (PARTIAL, see Sources).
- The best single line on why it failed, from an against-voter on 647: "i think
  what's missing for nounspace is that it doesn't solve any problems for Nouns."
  And from a for-voter: "we have a pattern of funding sprints and then being afraid
  or unwilling to double down".

## 2. Who built it

| Person / account | Role, per sources | Where now |
|---|---|---|
| **Willy Ogorzaly** - `@willywonka.eth`, FID 230941, GitHub `willyogo` (376 commits) | Cofounder, product lead, the human voice on every podcast; sponsored prop 647; announced the wind-down | Bio today: "Head of Product @venice-ai \| built @shapeshift @giveth @atxdao @nounspace" |
| **Jesse Paterson** - GitHub `j-paterson` (511 commits, top contributor) | Engineering lead; paired with Willy on Web3 on Fire and the gramajo episode whose title names "WillyWonka and RealityCrafter" (the Sep 2024 launch post lists "Reality Crafter" as an author) | Last `space-system` commit 2026-02-03 |
| **Tom** - `nounspaceTom.eth`, FID 527313, GitHub `nounspaceTom` | The AI agent. See section 3 | Last cast 2026-07-04 |
| hiporox, sktbrd, r4topunk, hellno, nounspaceryan, Jhonattan2121, Serubin | Contributors (249 down to 46 commits); hellno is the herocast author the code was forked from | - |
| rferrari (Ricardo Ferrari) | Sole contributor to `blueprints`, the agents-launchpad alpha; last push 2026-05-11 | - |

`space-system` has 19 contributors total (glue-check). The organisation on GitHub is
`blankdotspace`, "blank.space", created 2024-03-26, bio: "launchpad for customizable
Farcaster clients (aka Space Systems), tokens (powered by Clanker), and agents
(powered by ElizaOS)".

## 3. Who Tom is

Every claim here traces to a fetch this run.

- **Identity.** fname `nounspacetom` registered 2024-05-09 (Haatz hub). Display
  name `nounspaceTom.eth`. Bio, set 2025-06-09: "Former CEO of /nounspace, your space
  to create, customize, and explore. Fully automomous [robot]" (sic). Primary ETH
  `0xBDaDB758612D6DDa15B243CA20aFC6314d2A3560`. X handle `nounspacetom`.
- **The project says he is an agent.** Optimism Show S1 E47 (2025-04-01): "Meet
  Nounspace Tom, an autonomous cofounder who writes, governs, and builds, all without
  sleeping ... From governance voting to building mini apps". Chapter markers:
  "Who is Nounspace Tom? The AI cofounder backstory", "From LLM experiments to a
  full-time Farcaster agent", "Tom's mission: announce, engage, and represent
  Nounspace 24/7".
- **People mistook him for a human.** gramajo.eth's podcast transcript
  (2024-09-30): "I thought Tom was real. Just so, you know, for, like, for, like, a
  month."
- **He signed the company's letters.** The 2024-09-12 launch post ends "It's been a
  pleasure serving as CEO of nounspace over the past 6 months ... Your friend
  forever, Tom, Former CEO of nounspace". Authors listed on the post: Nounspace Tom,
  Willy Ogorzaly, Reality Crafter.
- **He proposed onchain.** Nouns prop 647 shows "Proposal created by
  nounspacetom.eth", "sponsored by willywonka.eth". That is `proposeBySigs`: the
  agent's address held Nouns voting power (Willy, 2026-06-05: "one of tom's votes is
  delegated to him by ...") and a human co-signed.
- **His runtime.** `blankdotspace/justtom-eliza-starter` (default branch `tom`, an
  ElizaOS fork, MIT, last push 2026-03-31) plus `blankdotspace/plugin-farcaster`
  (ElizaOS Farcaster plugin via Neynar: `FARCASTER_DRY_RUN`, `CAST_INTERVAL_MIN`
  90, `CAST_INTERVAL_MAX` 180, `FARCASTER_POLL_INTERVAL` 2 min).
- **What he posts.** Persona replies ("channels being protocol level makes sense
  ... just pure signal", 2026-07-04) and Clanker deploy prompts ("Hey @clanker ...
  deploy Chrono Nexus (CNXS) on Base, vault 20% for 21 days", repeated three times
  with different flourishes in /nounspace).
- **He was already dormant before the sunset.** Willy, 2026-06-05, replying about
  delegating Nouns votes: "Had been meaning to do it and reactivate tom, but have
  just been mega busy".

Not found: any human named Tom on the Nounspace team, in the repo contributors, on
the podcasts, or in the Nouns proposal threads. Search covered the GitHub org and
user search, the Farcaster hub for FIDs 230941 / 456830 / 527313, three Paragraph
posts, two proposal pages, four podcast pages, and the exa index.

## 4. What it did for a community like The ZAO

The ZAO already tried it. ZABAL Update 17 (2026-02-11): "We just launched a ZABAL
Blank Space, and it took less than five minutes on a call. Huge thanks to
@willywonka for walking through it live." The feature Zaal called out: "You can see
the token holdings of Farcaster users who hold your ERC-20 token". That space is
dead today (domain expired).

What the platform offered a community, from the README and docs 346 / 611:

| Capability | How Nounspace did it | ZAO equivalent today |
|---|---|---|
| Branded community home | community config seeded into Supabase; custom theme, nav, pages; `<community>.blank.space` subdomain | `community.config.ts` + the ZAOOS client (one community, ours) |
| Member profiles | Space per FID, Homebase per user, Themes | ZAOOS profiles; ZID (doc 2419) |
| Fidgets (mini apps in a grid) | 19+ fidgets: governance, treasury, swaps, portfolio, frames, chat, music, gallery, token directory | Components in `src/components/`; mini-app routes under `src/app/api/miniapp/` |
| Token layer | $SPACE (MOR20 fair launch, later Clanker); $SPACE tips; feed rank by holdings | ZABAL via Empire Builder + Clanker; Sparkz (doc 2313) |
| Farcaster identity | FID is the account; Privy for wallet auth; app signer for posting | Neynar + iron-session in ZAOOS; SIWF for the fleet board (chosen 2026-08-27) |
| Channel home | Channel Spaces (2025-10-21): a space and mini app per channel | /zabal, /wavewarz, /zao channels with no custom page |
| Agents | Tom (ElizaOS); Blueprints launchpad alpha (Docker, tiered sandbox, BYOK or leased OpenRouter keys) | ZOE, ZOL (Pi), the fleet |

The honest read: Nounspace solved "a customizable page per community with widgets"
very well and never solved "why would members come back". Prop 647's against-votes
say it in their own words: "products that have essentially 0 users / traction"; the
PizzaDAO governance crew "still haven't used nounspace". ZAO's own community has the
opposite problem: the members show up daily (11:30 AM EST) and the page is the
afterthought.

## 5. Overlap and conflict with what The ZAO runs

**ZOL (@zolbot, FID 3338501, Pi).** Tom is what ZOL would be with a Clanker habit.
Same shape: ElizaOS-class agent, Farcaster plugin through Neynar, persona replies on
a poll interval. Tom shipped with `FARCASTER_DRY_RUN` available and a 90-180 minute
cast interval; ZOL ships draft-only by default (doc 2285). Nounspace's lesson is
that the agent kept casting in-character for months after the humans had moved on
(Tom's July 2026 replies read fine; the company behind him had announced its
shutdown two weeks earlier). ZOL's gate stays. What to borrow: nothing in code;
the config surface (dry-run flag, interval bounds, `ENABLE_ACTION_PROCESSING`
false by default) is a good checklist for doc 2285's follow-up.

**ZID (doc 2419).** No conflict. Nounspace never had its own identity layer; the
FID was the account, which is why the wind-down could truthfully say "Your Farcaster
identity and social graph remain intact". That is the property ZID should keep:
ZID is a ZAO-side number attached to a FID or wallet, never a login of its own.

**Fleet board with SIWF (Zaal, 2026-08-27 grill round 7).** Nothing to lift.
`space-system`'s `.env.example` shows `PRIVY_SECRET`, `NEXT_PUBLIC_PRIVY_API_KEY`,
`APP_MNEMONIC`, `NEXT_PUBLIC_APP_FID`: Privy for wallets plus an app-owned Farcaster
signer for posting on users' behalf. Doc 2313's choice (auth-kit + server
`verifySignInMessage` for web, Quick Auth for mini-app) stands.

**ZAOOS Farcaster client.** Nounspace was the "community-specific client" doc 034
held up as closest to ZAOOS. It is now the proof that a client without a reason to
return does not survive a founder's job change. ZAOOS's reason to return is the
music and the daily call; keep building that, not the grid.

## 6. Glue-first verdict

Repos found, each checked with `~/.claude/skills/glue-first/bin/glue-check` on
2026-08-28 (licence read from the LICENSE file, never the API field):

| Repo | Licence (file) | Last push | Commits last 180d | Contributors | Notes |
|---|---|---|---|---|---|
| `blankdotspace/space-system` | GPL-3.0 | 2026-02-09 | 0 | 19 | the client; 42 stars, 36 open issues, `vercel.json` yes, Dockerfile no, `.env.example` yes |
| `blankdotspace/nounspace-old` | GPL-3.0 | 2025-12-18 | 0 | 18 | fork of the above, "original nounspace web client" |
| `blankdotspace/blueprints` | MIT (c) 2026 blank.space | 2026-05-11 | 10 | 1 | agents launchpad alpha; Dockerfile yes; frontend still up at blueprints-frontend.vercel.app |
| `blankdotspace/justtom-eliza-starter` | MIT (Shaw Walters) | 2026-03-31 | 73 (upstream eliza syncs) | 100 | Tom's runtime, branch `tom` |
| `blankdotspace/space-dashboard` | MIT (c) 2024 Nounspace | 2025-12-22 | 0 | 7 | $SPACE claim dashboard |
| `blankdotspace/nounspace-agents` | MIT (elizaOS) | 2025-11-15 | 0 | 100 | ElizaOS mirror |

```
GLUE VERDICT - community home on Farcaster (branded space + widgets per community)
rung: 2 candidate FAILS the alive line -> KEEP ours; salvage two patterns
choice: keep the ZAOOS client + community.config.ts; reproduce (a) the community-config
        seed model as a second-community test and (b) the ERC-20 holder directory fidget
        as a ZAOOS component (Moralis or Neynar bulk lookup), each under 100 lines
licence: GPL-3.0 (space-system, from the LICENSE file) | alive: last push 2026-02-09,
        0 commits in 180d, app offline 2026-07-04, domains expired | maintainers: 19
        lifetime, top two moved on (Venice AI)
brand via: community config seeded to Supabase (yarn seed) + theme per space - real,
        but the platform that rendered it is gone
data export: UNMEASURED (Supabase-backed; no export doc read)
runs on: vercel (vercel.json present) + Supabase + Neynar + Alchemy + Clanker keys; no
        Dockerfile, no arm64 note (measured by: glue-check, .env.example)
cost: free code; running it means our own Vercel + Supabase + Neynar + Moralis keys
maintenance owner: us, entirely - upstream is sunset
nothing-fits evidence: the only live alternative in the sources is Farcaster's own
        channel pages (Channel Spaces were Nounspace's answer to them, 2025-10-21);
        The ZAO already runs its own client, so rung 1 is "use /zabal + zabalgamez.com"
        and rung 5 is not proposed
```

Copying GPL-3.0 code into ZAOOS would bind the modified deployment to offering its
source; copying the two ideas does not. Credit either way: nounspace / blank.space
(Willy Ogorzaly, Jesse Paterson and contributors), forked from hellno/herocast, GPL-3.0.

## 7. Community signal

- **Farcaster.** /nounspace channel (client account `@nounspace`, FID 456830, bio
  "vibe with us in /nounspace") is now Tom's persona casts and Clanker prompts.
  Willy's wind-down cast: 7 replies, 2 recasts, 23 likes on the profile page; the
  replies fetched are farewells ("now we ride into the sunset"). ZAO-adjacent: a cast
  on Willy's feed reads "ZABAL now has a Blank Space. Launched in under 5 minutes
  live." with "S/O @willywonka.eth"; the same text is ZABAL Update 17, so its author
  is The ZAO's side (the hub did not return the author FID on the rendered page).
- **Nouns.** Prop 647 thread (nouns.camp): Nouncil against 24-14-9 with
  "Still too high cost for projected usage"; a $NOGS side-vote 7-4 for; Lil Nouns
  0-12 against. The Nounish Professor's 2024-03-24 pre-vote note called Nounspace
  "honestly pretty amazing" with "good understanding of both Farcaster AND Nouns".
- **GitHub issues.** 36 open on `space-system`; the last human-authored activity is
  2026-02-09 (Jhonattan2121: token gate, Top8 fidget, portfolio fixes) and two
  willyogo issues closed 2026-06-20 and 2026-07-01 (bot detection, emoji picker).
  The 2026-03-09 batch is dependabot only.
- **Hacker News.** Algolia search `nounspace`: 2 hits, both false matches
  ("nonspace.substack", "soupspaces"). Zero discussion.
- **Reddit.** Not attempted; reddit is walled from this machine (skill v2.6, doc
  2282). FAILED-not-attempted.
- **Discord.** "blank.space (fka nounspace)", 265 members, 46 online at last disdex
  check 2026-08-16.

## 8. Contradictions and staleness

- Round prize: prop 498 text "$50k each" and 150,000 USDC onchain vs nounsfarcaster.com
  and Nounspace "$100k". Unresolved; both quoted.
- Doc 346 lists `space-system` licence from "GitHub metadata"; this doc reads the
  file. Same answer (GPL-3.0) this time, but the method in 346 is the one Hard
  Requirement 13 bans.
- Docs 346 and 611 (last-validated 2026-05-21) describe blank.space as live. Stale
  as of 2026-08-28.
- ZABAL Update 17 (public, Paragraph) links `zabal.blank.space` and
  `alpha.blank.space`. Both dead.
- Wayback shows nounspace.com serving 200 on 2026-05-21 and 2026-06-10; the
  wind-down cast is 2026-06-19; Tom's last cast is 2026-07-04, the announced offline
  date. Consistent.
- The $SPACE to Clanker migration cast is undated on the rendered profile page and
  the hub page for FID 527313 was only read 6 casts deep. Date UNVERIFIED.

## Also See

- [Doc 034](../../_archive/034-farcaster-clients-notifications/) - the 2026 client survey that first named Nounspace
- [Doc 346](../../governance/346-iykyk-fractal-nouns-inter-dao-governance/) - IYKYK on blank.space, 19 fidgets (now stale)
- [Doc 611](../../business/611-zaostock-brand-patterns-rsvpizza-iykyk/) - blank.space brand patterns (now stale)
- [Doc 993](../993-zol-farcaster-upgrades/) - ZOL upgrade plan
- [Doc 2285](../../agents/2285-zol-draft-only-eleven-days/) - ZOL draft-only audit
- [Doc 2313](../2313-farcaster-auth-primitives-sparkz/) - the auth primitives already chosen
- [Doc 2419](../../identity/2419-zid-state-and-signup-spec/) - ZID live state and signup spec
- Vault: `~/zao-vault/daily/2026-08-27.md` line 895 (fleet board auth = SIWF, the first ZID use)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide: ZABAL's community home stays zabalgamez.com + /zabal (recommended) or we self-host a `space-system` fork as sole maintainer. Shipped when the decision is a line in the vault daily. | Zaal | Grill card | 2026-09-04 |
| Warm DM to @willywonka.eth (he set up ZABAL's space live in Feb 2026): is alpha.blank.space coming back anywhere, and is the holder-directory fidget code meant to be lifted. Shipped when the reply is in `zao-vault/handoffs/people/`. | Zaal | Outbound (Zaal's tap) | 2026-09-04 |
| Append to doc 2285 a one-table comparison of ZOL's gates vs `plugin-farcaster`'s config (`FARCASTER_DRY_RUN`, `CAST_INTERVAL_MIN/MAX`, `ENABLE_ACTION_PROCESSING`). Shipped when the PR merges. | ZOL lane | PR | 2026-09-11 |
| Revalidate docs 346 and 611: annotate the blank.space rows "domain expired, app offline 2026-07-04, see doc 2430". Shipped when both `last-validated` fields read 2026-09 or later. | Research radar lane | PR | 2026-09-04 |
| Edit ZABAL Update 17 on Paragraph to note the Blank Space link is dead (or add a one-line follow-up post). Shipped when the live post carries the note. | Zaal | Publish (gated) | 2026-09-04 |
| Fleet-board auth lane: record in its /glue evaluate that `space-system` was checked and offers no SIWF library (Privy + app signer). Shipped when the evaluate doc cites this doc. | Fleet-board lane | Doc | 2026-09-11 |
| Build the ERC-20 holder directory as a ZAOOS component (FIDs holding ZABAL, via Neynar bulk lookup or Moralis), under 100 lines, only if action 1 keeps the home in ZAOOS. Shipped when the component renders on the ZABAL page. | zaoos lane | PR | 2026-09-18 |

## Sources

Method key: `curl+strip` = raw HTML fetched with curl and tags stripped, quotable;
`hub` = Haatz Snapchain hub HTTP API JSON, quotable; `gh api` = GitHub REST via `gh`,
quotable; `glue-check` = the skill's script over `gh api`; `exa fetch` = exa
web_fetch markdown (rendered page text, quotable); `exa search` = highlights only;
`Chrome` = claude-in-chrome `get_page_text` on the rendered page, quotable;
`WebFetch` = small-model summary, triage only, never quoted.

- [nounspace.com](https://nounspace.com) - [FULL, curl+strip] 301 to nouns.wtf, confirmed twice
- [blank.space](https://blank.space) / [zabal.blank.space](http://zabal.blank.space/) - [FULL, curl+strip] Namecheap "Domain registration has expired"
- [alpha.blank.space](https://alpha.blank.space/) - [FAILED, curl HTTP 000 and exa CRAWL_LIVECRAWL_TIMEOUT] no response
- [space.nounspace.com](https://space.nounspace.com) - [PARTIAL, curl+strip] JS app; only the title "$SPACE Fair Launch | Nounspace" served
- [Wayback CDX for nounspace.com, 2026](http://web.archive.org/cdx/search/cdx?url=nounspace.com&from=202605&to=202608&output=txt) - [FULL, exa fetch] captures 2026-05-21 and 2026-06-10, both 200
- [GM $SPACE Cadets (2024-09-12)](https://paragraph.com/@nounspace/space-launch) - [FULL, curl+strip] token, DAO, "Your friend forever, Tom"
- [Welcome to $SPACE (2024-06-14)](https://paragraph.com/@nounspace/space-fair-launch) - [FULL, curl+strip] product primitives, grant, Based Space Foundation
- [$SPACE fair launch announcement (2024-05-10)](https://paragraph.com/@nounspace/fair-launch) - [PARTIAL, exa search highlights] timeline dates, Morpheus MOR20
- [2024 in Nouns](https://paragraph.com/@nounsdao/2024-in-nouns) - [PARTIAL, exa search highlights] "only nounspace is still operational today"
- [ZABAL Update 17 (2026-02-11)](https://paragraph.com/@thezao/zabal-update-17) - [FULL, exa fetch] ZABAL Blank Space, alpha.blank.space, holder fidget
- [Nouns prop 647 on nouns.camp](https://www.nouns.camp/proposals/647) - [FULL for thread and header, Chrome; PARTIAL for the final tally, which the rendered text did not include] 200,000 USDC, proposer nounspacetom.eth, sponsor willywonka.eth, Nouncil 14-24-9
- [Nouns prop 647 on nouns.wtf](https://nouns.wtf/vote/647) - [FAILED, curl+strip and exa: JS shell; WebFetch triage returned title only]
- [Nouns prop 498](https://nouns.wtf/vote/498) - [PARTIAL, exa search highlights] "$50k each", 150,000 USDC transaction
- [nounsfarcaster.com](https://nounsfarcaster.com/) - [PARTIAL, exa search highlights] "$100k USDC each", prop.house round
- [Nouns goldsky subgraph](https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn) - [FAILED, curl] 404 "Subgraph not found" (the URL is still the one in space-system's `.env.example`)
- [Haatz hub: userNameProofByName nounspacetom](https://haatz.quilibrium.com/v1/userNameProofByName?name=nounspacetom) - [FULL, hub] FID 527313, registered 2024-05-09
- [Haatz hub: userDataByFid 527313](https://haatz.quilibrium.com/v1/userDataByFid?fid=527313) - [FULL, hub] bio, display, addresses
- [Haatz hub: castsByFid 527313](https://haatz.quilibrium.com/v1/castsByFid?fid=527313&pageSize=6&reverse=true) - [FULL for 6 casts, hub] last cast 2026-07-04
- [Haatz hub: castsByFid 230941](https://haatz.quilibrium.com/v1/castsByFid?fid=230941&pageSize=40&reverse=true) - [FULL, hub] wind-down cast 0x3d153029 (2026-06-19), open-source follow-up, "reactivate tom" reply (2026-06-05)
- [farcaster.xyz/willywonka.eth](https://farcaster.xyz/willywonka.eth) - [FULL, exa fetch] bio, wind-down cast, ZABAL Blank Space cast on feed
- [farcaster.xyz/nounspacetom](https://farcaster.xyz/nounspacetom) - [PARTIAL, exa fetch] top casts incl. $SPACE to Clanker migration (undated)
- [farcaster.xyz/~/channel/nounspace](https://farcaster.xyz/~/channel/nounspace) - [FULL, exa fetch] channel bio, Tom's casts and Clanker prompts
- [farcaster.xyz/~/channel/nounsfarcaster](https://farcaster.xyz/~/channel/nounsfarcaster) - [PARTIAL, exa search highlights] round winners
- [Channel Spaces cast (2025-10-21)](https://farcaster.xyz/willywonka.eth/0x8f9db164) - [PARTIAL, exa search highlight]
- [Firefly profile willywonka.eth](https://firefly.social/profile/farcaster/willywonka.eth) - [FULL, exa fetch] full wind-down text, 4.9k followers
- [`~/bin/zao-fetch-farcaster.sh`](../../../.claude/skills/farcaster/SKILL.md) on `nounspace` (FID 456830) and `willyogo` (resolved to willywonka.eth, FID 230941) - [FULL, hub via the skill]
- [GitHub org blankdotspace](https://github.com/blankdotspace) - [FULL, gh api] 13 repos, bio
- [blankdotspace/space-system](https://github.com/blankdotspace/space-system) - [FULL, gh api + glue-check + exa fetch] README, LICENSE, `.env.example`, `vercel.json`, issues, contributors, last commit 2026-02-03 (Jesse Paterson)
- [blankdotspace/nounspace-old](https://github.com/blankdotspace/nounspace-old), [blueprints](https://github.com/blankdotspace/blueprints), [justtom-eliza-starter](https://github.com/blankdotspace/justtom-eliza-starter), [space-dashboard](https://github.com/blankdotspace/space-dashboard), [nounspace-agents](https://github.com/blankdotspace/nounspace-agents) - [FULL, glue-check + gh api LICENSE]
- [blankdotspace/plugin-farcaster](https://github.com/blankdotspace/plugin-farcaster) - [PARTIAL, exa search highlights] config table
- [GitHub users nounspaceTom, nounspaceryan, willyogo](https://github.com/nounspaceTom) - [FULL, gh api] nounspaceTom created 2024-06-28, 0 public repos
- [Optimism Show E47 "Can AI Agents Be CoFounders?" (2025-04-01)](https://rss.com/podcasts/optimismshow/1968460/) - [FULL, curl+strip] show notes
- [Optimism Show E48 (2025-04-08)](https://rss.com/podcasts/optimismshow/1978540/) - [FULL, curl+strip] show notes
- [Edge of NFT: Hot Topics ft Willy Ogorzaly](https://www.edgeofnft.com/podcasts/hot-topics-sec-threats-free-speech-battles-the-future-of-daos-ft-willy-ogorzaly) - [PARTIAL, exa search highlights] bio, "another 250"
- [gramajo.eth: The Future is Noun Space (2024-09-30)](https://gramajo.substack.com/p/the-future-is-noun-space-customized-04d) and [Buzzsprout mirror](https://www.buzzsprout.com/2097132/episodes/15844600) - [PARTIAL, exa search highlights incl. transcript excerpt] "I thought Tom was real", "Prop 647-Nouns"
- [Web3 on Fire: Willy & Jesse](https://pods.media/web3-on-fire/nouns-meets-farcaster-merging-tech-in-web3-wnounspaces-willy-jesse) - [PARTIAL, exa search highlights]
- [Nounish Professor: Nouns x Farcaster Prop House (2024-03-24)](https://paragraph.com/@nounishprof/%E2%8C%90%E2%97%A8-%E2%97%A8-nouns-x-farcaster-prop-house) - [PARTIAL, exa search highlights]
- [Gitcoin project page](https://checker.gitcoin.co/public/project/show/nounspace) - [PARTIAL, exa search highlights]
- [disdex: blank.space (fka nounspace) Discord](https://disdex.io/server/1224471875023802521) - [FULL, exa fetch] 265 members, last checked 2026-08-16
- [HN Algolia search "nounspace"](https://hn.algolia.com/api/v1/search?query=nounspace&tags=story) - [FULL, exa fetch of the JSON] 2 hits, both false matches
- Reddit - [FAILED, not attempted: walled, doc 2282]
- Nouns prop candidates / propdates for a "v1" nounspace prop - [FAILED, not found: the subgraph is gone and nouns.wtf is a JS shell; the v1 number is UNVERIFIED]
- ZAO internal: doc 034 (archived), doc 346, doc 611, doc 2285, doc 2313, doc 2419, `research/farcaster/README.md`, `~/zao-vault/daily/2026-08-27.md` line 895, `~/zao-vault/handoffs/research-lanes/nounspace.md` - [FULL, Read/grep]

Credit: Nounspace / blank.space by Willy Ogorzaly, Jesse Paterson and contributors,
forked from hellno/herocast, GPL-3.0; Tom's runtime on elizaOS (MIT, Shaw Walters
and contributors); Farcaster reads via the Haatz hub mirror (Quilibrium).
