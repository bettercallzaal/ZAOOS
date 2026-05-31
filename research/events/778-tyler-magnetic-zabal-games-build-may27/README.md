---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-27
related-docs: "714, 473, 776, 701"
tier: STANDARD
---

# 778 - Tyler / Magnetic x Zaal + team: ZABAL Games build on Magnetic

> **Goal:** Capture decisions + action items from the 2026-05-27 working session where Zaal, Tyler Stambaugh (Magnetic), Samantha, and Shawn architected how ZABAL Games actually gets built on Magnetic - a single magnet with an intro, videos hosted as cards, a GitHub-auth judging system, and a June 1 live demo + AMA.

Direct build-step follow-on to [doc 714](../714-tyler-zabal-zaostock-may22/) (the May 22 plan) and [doc 473](../473-road-to-zaostock-magnetic-portal/) (the April Magnetic-portal spec). Where 714 set the plan, this call turns it into a 4-day build sprint. Also see [doc 776](../776-duo-do-clementine-santiago-zabal-games-may23/) (the musician-talk format that feeds the same June session month).

## Attendees

- **Zaal** (host)
- **Tyler Stambaugh** - Magnetic founder (docs 473, 714)
- **Samantha** ("Sam", candytoybox) - WaveWarZ cofounder
- **Shawn** - collaborator joining to learn the Magnetic side

Phone-then-desktop call (Zaal started on mobile dropping his kid off, moved to computer). Tyler walked the group through the live Magnetic backend.

## How Magnetic works (the walkthrough)

- **Magnet = container, "mems" = the content pieces inside** (welcome video, a card linking out, a poll, UGC upload, social shares). Tyler initially said "mementos" then corrected to "mems."
- **Login is email / Google - no wallet** - but the backend mints on-chain, abstracted away. Authentication is on-chain; the front-end DB just makes it fast.
- **Analytics-first.** A member dashboard shows everyone who joined any Zabal program, what they engaged with (polls, content), which Fractal proof-of-meat they came in through, and who the high-participation members are. Claims have **expiration windows** (~4 weeks).
- The existing **Zabal Connector** magnet already has **67 people** joined - it becomes the channel to point people at the new games space.
- Data is **S3-hosted**; every card has an S3 link. EVM-queryable. On-chain = Magnetic is the platform of record (SaaS to mint), but the data stays portable to your own ecosystem - "not hold the data from you."

## Key Decisions

| # | Decision | Owner | Status | Confidence |
|---|----------|-------|--------|------------|
| 1 | **ZABAL Games is a single magnet on Magnetic** (not one per project), with an intro magnet under it | Zaal | TODO | high |
| 2 | **One combined list, include everybody, minimal segregation** - keep it simple, don't add complexity that needs explaining | Samantha | DECIDED | high |
| 3 | **Videos hosted on Magnetic cards link out to YouTube** to get around the storage limit | Both | TODO | high |
| 4 | **June 1 (Mon): live Magnetic demo (2:30 ready) + AMA with Zaal**, plus a ZABAL-Games-specific walkthrough - tentative, it is NY Tech Week | Both | TODO | medium |
| 5 | **Build a GitHub-auth judging system** - authenticate GitHub, July commits evaluated for Zao-ecosystem value, points weighted by contribution, rolling admission | Zaal | TODO | high |
| 6 | **Other brands (WaveWarZ, Zao Fractal, Zao Festivals, COC Concerts) become their own magnets later** with explainer intros | Zaal | TODO | medium |

## Thread 1 - The magnet structure

Zaal's analogy: Magnetic is like a "super interactive, content-heavy Discord." You need an intro/announcements program (the anchor = "this is the starting line, this is the ecosystem"), then a space per branch. Considered calling the hub "Zabal University," landed on just **Zabal Games**. The Zabal Connector behaves like Discord's "general" channel; other magnets are the side channels (consistent with doc 714 decision 5). Build the one Zabal Games magnet first as the way to figure out exactly what the ecosystem wants, then graduate the rest.

## Thread 2 - Road to ZAOstock

The **12-week Road to ZAOstock** series (3 months pre-event, doc 714 decision 3) gets a magnet hub: all 12 weeks sit as cards, each with content or a promotion behind it. The win over email: if you only caught week 3, weeks 1-2 are still there to catch up on - everything lives in one interactive place. Emails are still captured (same as the magnet flow).

## Thread 3 - API / widgets / portability (Zaal's ask)

Zaal wants more than an iframe - **widgets / an API** to drop a customizable Magnetic claim onto his own site (e.g. claim while already Google-logged-in), then deep-link to the full experience. Tyler: data is structured + S3-hosted + EVM-queryable, so it is doable - "put it on the list," talk it through from a design perspective. Zaal to research **Flow** (and EVM) to pull/query ownership into anything he builds - a "magnetic bridge" gating his ecosystem by magnet ownership. Also flagged **OAuth other socials** (X already OAuth'd and is the most expensive API; others cheaper) for a future chat.

## Thread 4 - The GitHub-auth judging build

Zaal's 4-day build: signup = wallet/Farcaster login + authenticate GitHub (multiple GitHub accounts allowed - personal + Web3 org). July commits get looked at and scored, weighted by value delivered to the Zao ecosystem - rolling admission. Built in public during the first month with help from the Farcaster-ecosystem people Zaal is recruiting ("all a hell yes"). Magnetic feature in dev that helps: rank-order / rearrangeable grid per mem + pinning for featured, so upload order does not matter.

## Action Items

| Title | Owner | Due | Category | Confidence |
|-------|-------|-----|----------|------------|
| Write up the ecosystem / magnet plan and send Tyler async | Zaal | this week | ZABAL Games | high |
| Build the GitHub-auth ZABAL Games judging system | Zaal | ~4 days | Site / Tech | high |
| Get the intro magnet up | Zaal | ~4 days | ZABAL Games | high |
| Make ZABAL Games logo on Canva (square + vertical + horizontal) | Samantha | - | Social | high |
| Send Tyler the real logo | Zaal | - | ZABAL Games | high |
| Set up the ZABAL Games magnet/space on Magnetic | Tyler | - | ZABAL Games | high |
| Add API/widget embedding + social OAuth to the Magnetic roadmap list | Tyler | - | Site / Tech | medium |
| Research Flow + API/widget embed (vs iframe) for own-site use | Zaal | - | Site / Tech | medium |
| June 1 live Magnetic demo + AMA (tentative, NY Tech Week) | Both | 2026-06-01 | ZABAL Games | medium |

## Quotes

- Tyler: "The whole point of putting it on chain is to not have the platform lock you in. We'd like to be the platform of record where you make it... but the whole point is to not hold the data from you."
- Zaal: "The goal of ZABAL Games ultimately is to create a prompt that, through GitHub and folders and markdown files, explains all of our different projects - what the Zao ultimately is."
- Zaal: "Instead of an email where you just get it and it sits in your box... this is the place where everything is. So you can catch up, get exposure to stuff in a more interactive way."
- Samantha: "I think we should include everybody, get them all on one list... I wouldn't add extra complexity to it if I didn't have to."
- Tyler: "Platforms are getting greedy now, man. They're starting to turn the crank on the monetization."

## Transcript

Full transcript: [transcript.md](transcript.md) (looping "Cheers" tail artifact trimmed).
