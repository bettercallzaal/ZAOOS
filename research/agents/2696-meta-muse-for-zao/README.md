---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-21
superseded-by:
related-docs: agents/2587-hermes-muse-memory-dreaming, agents/2644-agent-landscape-oct-2026, identity/2683-npc-labs-verified-by-npc, agents/2659-new-eden-agent-world
original-query: "can u kepe researching more on all of these topics using the seat" (Zaal, 2026-10-21, zao-media pane). Topic 7 as routed by the seat: "Muse, Meta's agent app [0:55:17, 1:12:49]: training-data opt-out, wallets, app store availability."
tier: QUICK
---

# 2696 - Meta's Muse for ZAO members: who can get it, what it trains on, and what it can pay with

> **Goal:** Check the three things Ohnahji B raised about Muse on the 2026-10-21 B and Z Build stream (the training-data opt-out, wallets, and App Store availability) against Meta's own announcement and measured sources, and say what a ZAO member should know before using it.

Stream: B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo. Timestamps are from its mlx-whisper transcript.

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Tell ZAO members who use Muse to turn off model training first.** | Meta's announcement says people "can opt out of having their interactions used to train" its models, but does not say the default. Wikipedia says "Meta uses queries for model training by default, which users can disable". Ohnahji said the same on stream [1:12:14-1:12:40]. Treat the default as ON until Meta's own page says otherwise. |
| 2 | **Muse is US and Canada only on Apple's App Store as of 2026-10-21.** Members elsewhere cannot install it from there. | Apple's search API lists "Muse from Meta" (id 6760173601, rated 17+) in the US (released 2026-09-08) and Canada (2026-09-18), and not in the UK, Nigeria, India or Germany. Each of those searches returned 9 to 10 results, so the absence is not an empty search. This fits the stream: someone "couldn't get it in the app store" [1:12:04]. Meta's announcement names the web app at muse.ai too, which was not tested from outside the US. |
| 3 | **Do not give Muse a crypto wallet.** Its documented payments are a card-based agent wallet, not crypto. | Meta's announcement says Muse checks out with Link by Stripe, whose agent wallet "generates a one-time-use card". It mentions no crypto capability. Ohnahji's view that Muse "probably" can use a fresh crypto wallet [1:23:52-1:23:59] is UNVERIFIED. Any agent wallet carries the risks in doc 2659 (an agent sent a mainnet transaction after its owner said "wait"). |
| 4 | **Do not use Muse's share links for anything ZAO-internal.** | Ars Technica (Dan Goodin, 2026-10-20): researchers at Claroc "were able to enumerate 6,800 links Muse users created for sharing conversations", using passive DNS, and found loan applications, revenue reviews and staff calendars. Meta said "we've paused this functionality while we review this report". |
| 5 | **No ZAO integration.** Muse stays a personal tool for members who choose it. | ZAOOS has no Muse code: `git grep -i -E '\bmuse\b' origin/main -- src` returns 0 files, against 48 for the control term `xmtp`. Doc 2587 already decided not to adopt Muse for the lanes. |

## What Muse is, from the primary source

Meta newsroom, "Introducing Muse", published 2026-09-08 and updated 2026-09-30 (https://about.fb.com/news/2026/09/introducing-muse):

| Point | Meta's words |
|---|---|
| Availability | "rolling out in the US on iOS, Android, and muse.ai", "coming soon to AI glasses" |
| Price | "free for most of what people need, with subscription plans for people who want to do more". Wikipedia gives $20 and $100 a month; Meta's page states no prices |
| Model | "powered by Muse Spark, Meta's most capable model to date" |
| Isolation | Each user's agent runs on a dedicated VM, and a separate "Sentinel" agent must approve anything that reaches the internet. It asks for confirmation before sending email or making a purchase |
| Ads | "Muse doesn't share a person's conversations or the data in their VM with Meta's ad systems" |
| Training | Users can opt out of having their interactions used for training. **The default is not stated on this page** |
| Payments | Link by Stripe agent wallet with one-time cards; Shop Pay and 1Password "coming soon" |
| Planned | "Muse Confidential VM", where the VM "is encrypted with a key only they hold", later in 2026 |

TechCrunch (Kirsten Korosec and Lucas Ropek, 2026-09-23), from Meta Connect: Zuckerberg said "We're standing behind this by making Muse free for a huge number of tokens, with the expectation that over time we will profit by taking a small fee from transactions." Meta has partnerships with Stripe and Shopify for shopping.

## What was said on stream

| Claim | Who, when | Status |
|---|---|---|
| "you have to turn off... use my data to help train the model" | Ohnahji, 1:12:14-1:12:40 | Supported: an opt-out exists (Meta) and the default is on (Wikipedia). Meta's own page does not state the default |
| Someone "couldn't get it in the app store" | Ohnahji, 1:12:04 | Consistent with Apple's listing: US and Canada only |
| "the free tier that it has right now is... well built" | Ohnahji, 1:13:07 | Supported: Meta says it is free for most use |
| It has its own model, plus Meta's open models | Ohnahji, 0:55:56-0:56:07 | Partly: Meta names Muse Spark. Use of other open models is not stated by Meta. UNVERIFIED |
| Muse can probably use a fresh crypto wallet | Ohnahji, 1:23:52-1:23:59 | UNVERIFIED. Only card payments through Link are documented |
| Zaal emailed a Muse plan to himself to run it through Claude instead of approving it | Zaal, 0:55:33-0:55:43 | His own practice. It matches decision 3 |

## What this means for The ZAO

Muse is a capable free agent for members in the US and Canada, but it trains on what you tell it unless you switch that off, it pays with cards rather than crypto, and its share links leaked. Use it for personal tasks, switch training off, and keep ZAO business out of it.

## Also See

- [Doc 2587 - Hermes and Muse's memory layout](../2587-hermes-muse-memory-dreaming/)
- [Doc 2644 - agent landscape, October 2026](../2644-agent-landscape-oct-2026/) - lists the Muse launch
- [Doc 2683 - NPC Labs verification](../../identity/2683-npc-labs-verified-by-npc/) - "Unable to verify" Muse because signup needs a card
- [Doc 2659 - New Eden](../2659-new-eden-agent-world/) - agent wallets and the risk of an agent signing

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide whether to post a short "if you use Muse" note to members (switch training off, no crypto wallet, no share links). Shipped when the note is posted or declined on the board | Zaal | Decision | 2026-10-28 |
| Re-check the training default on Meta's own help pages and the App Store countries after a month. Shipped when last-validated moves and both rows are re-measured | bandzbuilds lane | Re-research | 2026-11-21 |

## Sources

- B and Z Build, 2026-10-21, https://www.youtube.com/watch?v=uEIT4rvgsNo, local mlx-whisper transcript, windows 0:55:00 to 0:57:30, 1:10:50 to 1:14:30 and 1:23:40 to 1:24:06 [FULL]
- https://about.fb.com/news/2026/09/introducing-muse [FULL - WebFetch; quotes above]
- https://techcrunch.com/2026/09/23/everything-new-coming-to-metas-ai-agent-muse/ [FULL - curl with a browser user agent, tags stripped]
- https://arstechnica.com/security/2026/10/meta-muse-exposes-users-personal-and-business-secrets-when-they-share-conversations/ [FULL - curl with a browser user agent, tags stripped]
- https://en.wikipedia.org/wiki/Muse_(AI_agent) [FULL - WebFetch; the source for "training by default"]
- https://www.axios.com/2026/09/08/meta-debuts-muse-personal-ai-agent [FAILED - HTTP 403 to WebFetch and to curl with a browser user agent]
- https://ai.meta.com/muse/ [FAILED - an app shell with only a title]
- Apple iTunes Search API, `https://itunes.apple.com/search?term=Meta%20Muse&country=<cc>&entity=software` for us, ca, gb, ng, in, de [FULL - raw JSON]
- ZAOOS `src/` at origin/main, `git grep` for Muse with the `xmtp` control [FULL]
