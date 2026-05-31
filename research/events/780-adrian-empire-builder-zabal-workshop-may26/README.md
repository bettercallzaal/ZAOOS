---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-26
related-docs: "719, 654, 778, 714"
tier: STANDARD
---

# 780 - Adrian (Empire Builder) x Zaal: Empire Builder workshop for ZABAL Games

> **Goal:** Capture decisions + action items from the 2026-05-26 call between Zaal and Adrian (Empire Builder cofounder) lining up Adrian's June ZABAL Games workshop on the Empire Builder API - using V3 endpoints for an existing empire, integrating a leaderboard, and deploying a new tokenless empire - plus Zaal building a tokenless-empire-deployer button on his own site.

Pairs with [doc 719](../719-jordan-empire-builder-zabal-games-may15/) (Jordan Oram - the "why an empire" front-of-house) and [doc 654](../654-zabal-games-empire-v3-yerbearzerker-meeting/) (where Adrian is identified as Empire Builder co + Jordan's Melbourne neighbor). This call is the API/technical complement: Adrian covers the endpoints, Jordan covers the pitch. Same June workshop month as [doc 778](../778-tyler-magnetic-zabal-games-build-may27/) (Magnetic) and [doc 776](../776-duo-do-clementine-santiago-zabal-games-may23/) (Duo Do).

## Attendees

- **Zaal** (host)
- **Adrian** - Empire Builder cofounder, the API/technical side of Empire Builder (docs 654, 719). Leaving for Poland on Friday for a month with his wife (she's Polish), so he'll be in Europe through June. Recently took a second software job, transitioning to full-time.

## Key Decisions

| # | Decision | Owner | Status | Confidence |
|---|----------|-------|--------|------------|
| 1 | **Adrian presents an Empire Builder workshop at ZABAL Games in June** - #1: use V3 endpoints for an existing empire + integrate a leaderboard and surface it in an app; #2 (optional): deploy a new tokenless empire | Adrian | TODO | high |
| 2 | **Workshop is recorded** (Adrian travelling/with family), under 30 min - even a tight 5-min demo works; ZAO team clips/edits it. July fallback = "extra episode" | Both | TODO | high |
| 3 | **Zaal builds a tokenless-empire-deployer button on his small-games website** using the Empire deploy endpoint | Zaal | TODO | high |
| 4 | **Adrian's Europe timezone is actually better** for the second-half-of-June conversation/space sessions | Both | DECIDED | medium |

## Thread 1 - Adrian's workshop content

Two pieces Adrian wants to demo:
- **Existing empire:** how to use the endpoints for an empire you already have - integrate a leaderboard, surface it through your app/bot.
- **New empire (deeper):** how to use the endpoints to *deploy* a new empire - "people don't realize you can just deploy."

Zaal's framing back to Adrian: Jordan (June 1) covers "why you should have an empire"; Adrian covers "what's possible with the API now" - which is the angle for people who already have empires and want to tap deeper. Push that content piece toward those individuals. Watch Jordan's first so they do not overlap.

## Thread 2 - The Empire API (technical)

Adrian walked the deploy model:
- **`deploy tokenless empire` is its own endpoint** - no wallet, no private key. You call the endpoint and it creates it for you.
- **Two types:** pass a **FID** and it deploys for that Farcaster user (if they do not already have one); or a **pure blank/custom tokenless empire** ("you can make a million of those").
- **create2 + 0xSplits:** the treasury address is *predicted* via create2 - a predictable address - but the contract is **not actually deployed on-chain yet**. Nothing on-chain happens until you start interacting with the contract; that first interaction is when funds initiation happens.
- After that, treasury read/write: to interact with the contracts through your own interface you interact with the contracts directly.
- Best way to learn it: chuck the docs into an LLM / point an agent at it. Adrian will send the exact docs link.

## Thread 3 - Zaal's build

Zaal wants a **tokenless empire deployer** on his small-games site - "just go to the website, that can start your submission." He already has an Empire **API key** (Adrian issued it, it is in Adrian's database); since Zaal will now create + deploy, Adrian may refresh it. Adrian offered to **jump in and help** Zaal build (start a repo, the nuts and bolts) given Zaal's load. Zaal's modality: build it live while streaming, turn the build into shareable content.

## Action Items

| Title | Owner | Due | Category | Confidence |
|-------|-------|-----|----------|------------|
| Record the Empire Builder workshop (existing-empire endpoints + leaderboard), <30 min, send to Zaal | Adrian | next week / week after / July | ZABAL Games | high |
| Send Zaal the docs link for the tokenless-empire deploy endpoint (Empire Builder site, docs button at bottom) | Adrian | - | ZABAL Games | high |
| Double-check / refresh Zaal's Empire API key if needed | Adrian | - | Site / Tech | medium |
| Build the tokenless-empire-deployer button on the small-games site | Zaal | - | Site / Tech | high |
| Write a semi-agenda/script for own workshop pieces, optionally share with Adrian | Zaal | - | ZABAL Games | medium |
| Watch Jordan's June 1 workshop to avoid content overlap | Zaal | 2026-06-01 | ZABAL Games | medium |

## Quotes

- Zaal: "Keep the first month as low-friction as possible, and the second month as high and super curated, and then stream the whole last part of it - building in public with all the eight or 16 remaining people."
- Adrian: "Deploy tokenless empire is its own endpoint... you don't need a wallet, it's just an endpoint, we create it for you. We predict through create2 what the treasury address will be, but we don't actually deploy the contract - so there's no on-chain thing happening yet."
- Zaal: "A lot of people built cool open-source things but people just don't know how to use them... actually getting a demo and seeing how it's used, given examples of how they can use it immediately - that's very powerful."
- Adrian: "People don't realize you can just deploy. So I could create the tokenless empire deployer on my small games website - your site, yeah, absolutely."

## Transcript

Full transcript: [transcript.md](transcript.md).
