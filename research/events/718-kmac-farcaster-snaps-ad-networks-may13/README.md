---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-22
related-docs: "505, 571, 597"
tier: STANDARD
---

# 718 - kmac.eth x Zaal: Farcaster Snaps, ad networks, JFS strictness

> **Goal:** Lock in the back-and-forth from the 2026-05-13 call between Zaal and kmac.eth on making Farcaster Snaps work as a real distribution primitive - relaxing JFS for low-risk actions, embedding snaps off-Farcaster, and using ZAO's community model as an alternative to algorithmic ad networks.

Identified after the fact: the other person was not labelled on screen during the recording (active-speaker view only captured Zaal). Confirmed by Zaal as kmac.eth from transcript content - Ethereum podcast, snap builder, JFS expertise, idealist.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **kmac builds a JavaScript SDK to embed Snaps on external websites**, Google-Analytics-tag style - so snaps live anywhere on the web, not only inside Farcaster clients | kmac.eth | TODO |
| 2 | **Use HyperSnap hub + GraphQL to serve personalised snap "ads"** on publisher sites, filtered by social-graph signals rather than algorithmic targeting | kmac.eth | TODO |
| 3 | **Push a FIP to tier the JFS signature requirement** by action risk - hitting a button in a snap should not need the same auth as casting | Both | TODO |

## Thread 1 - The JFS strictness problem

### The Idea

kmac's pitch: Farcaster Snaps are basically a new web widget that happen to be stuck inside Farcaster clients. They could live anywhere. The blocker is JFS (the Farcaster signature spec): it is over-strict for low-risk interactions. Clicking "next" inside a snap should not need the same authentication as casting from your account. The pain is real - it makes a snap-builder's life hard and stops snaps from spreading to publisher sites.

### Why It Matters

Resolving this is what would let snaps become a true cross-web primitive. Today they are gated; relaxed, they become embeddable ads, polls, mini apps that travel.

### Next Step

A FIP draft - tier the auth requirements by action class. Likely a co-write with the Farcaster team.

## Thread 2 - Ad networks via Snaps

### The Idea

kmac is building a snap-builder tool (Zlank-adjacent) plus the SDK above, with the goal of programmatic snap-as-ad serving on publisher sites. HyperSnap acts as the hub; GraphQL queries filter which snaps to serve based on the visitor's social graph. The pitch: "Google Analytics tag for snaps" - any site can drop one in.

Zaal's lens: community ad networks. Instead of buying impressions from an ad network, you pay your *own community* - the people who already believe in the brand do better content than any agency. Tie that to ZAO's Respect / Fractal model and the people doing the most contribution surface naturally. Intori SCIS is the data layer (every mini-app click is visible to the client).

### Decisions Pending

Whether the snap-embed widget is a single SDK kmac ships, or a pattern Zlank + Empire Builder also expose as templates. Likely both, no conflict.

### Next Step

Zaal sends kmac the ZAO Fractal / Respect-game write-up so kmac can model his community filter against it.

## Thread 3 - Crypto education + idealism

### The Idea

A shorter exchange near the end: kmac is young, runs an Ethereum podcast, wants to teach crypto to Gen Z on Twitch and elsewhere. Both agreed open-source code is the real moat, and that the right way to win an audience is to give the work away, not gate it. Quote-driven thread - the substance is the alignment, not a specific action.

## Action Items

| # | Action | Owner | Category | Due |
|---|--------|-------|----------|-----|
| 1 | Ship the snap-embed SDK (JavaScript drop-in for publisher sites) and test button interactions in WebView | kmac.eth | Site / Tech | TBD |
| 2 | Integrate the snap-builder output with Empire Builder + other ZAO mini apps to template snaps for ZABAL Games | Zaal | Site / Tech | TBD |
| 3 | Send kmac the ZAO Fractal + Respect-game write-up so he can model the community-filter against it | Zaal | Ops | 2026-05-14 |
| 4 | Explore Intori SCIS + Entori DB as the data layer for community-driven snap filtering | Both | Site / Tech | TBD |

## Verify / Low-confidence

- **Owner for action 4** (Intori exploration) - the call agreed in principle but did not pin a name. Logged as Both, confidence low. Confirm before treating as assigned.
- **The snap-embed SDK + an Empire Builder integration** are kmac's pitches; Zaal expressed interest, not commitment. Not contractual.

## Key Quotes

> "I don't think we should need to know anything about me for me to hit the next button in a snap. It is way overblown." - kmac.eth, on JFS strictness

> "My goal is building a community layer of a bunch of different people in our community. I want to create a ton of different primitives all over that other people can eventually come in and see and maybe be like, oh, I can build on top of that." - kmac.eth

> "The best people for your brand is always going to be the people within your community - the people that believe in you the most. They will want to do it for free. So if you give them money to do it, they will do a much better job at making that effort." - Zaal, on community ad networks

> "I am young and, like, hopefully idealistic. The world will take care of you. You will get jaded eventually." - kmac.eth

> "That open source code is why I love it - I am trying to make all of my ideas synthesised as quickly as possible to at least a draft." - Zaal

## Research Seeds

- A Farcaster FIP for tiered JFS auth (low-risk button click vs cast = different signatures).
- Snap-embed SDK pattern - publisher drop-in, like Google Analytics tag, for off-Farcaster distribution.
- Community-as-ad-network: pay your own believers instead of buying impressions. Couple with Respect / Fractal so contribution surfaces who to pay.
- Intori SCIS + Entori DB as the community-data layer for snap targeting.
- Snap onboarding flow - poll -> QR -> Farcaster signup, low friction.

## Memory Updates

Files written to `~/.claude/projects/.../memory/`:

- `project_kmac_eth.md` - new. kmac.eth: Farcaster ecosystem builder, snap-builder tool + JFS expertise, Ethereum podcast. ZAO collaborator on snap-as-ad pattern. Doc 718.

## Also See

- [Doc 505 - Zlank no-code snap builder](../../dev-workflows/505-trae-ai-solo-evaluation/) - the ZAO-side snap builder; kmac's tool is sibling-adjacent
- [Doc 571 - Intori SCIS + Tuum Tech DB](../../farcaster/571-intori-scis-tuum-tech-db-meeting/) - the data layer this conversation referenced
- [Doc 597 - HyperSnap install prep](../../dev-workflows/597-hypersnap-install-prep/) - the hub the snap-embed SDK would call
- [[project_kmac_eth]] - new memory
- [[project_zlank]] - the ZAO snap builder this complements

## Distribution Log

- Action tracker: HELD - waiting on brand-label schema (doc 717)
- Bonfire episodes: posted via /bonfire (1 summary + 3 decisions + 4 actions)
- Telegram: not requested
- Memory writes: 1 (`project_kmac_eth`)
- Calendar: skipped

## Transcript

Full transcript: [transcript.md](transcript.md)
