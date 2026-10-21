---
topic: business
type: decision
status: research-complete
last-validated: 2026-10-21
related-docs: "events/725-cannon-zabal-iman-hackathon-may23, events/630-zabal-games-claude-code-hackathon-v0, business/1144-loops-house-zabal-judging-integration"
original-query: "Hackathons as income and connections for Zaal, open or upcoming from late October 2026 onward. Card 10431. Zaal 13 Oct: 'Hackathons could bring some moneys d connections too'. DONE WHEN: shortlist of open or upcoming hackathons that fit what he already has (agent orchestration / Claude Code multi-lane estate, Farcaster/Base mini apps, WaveWarZ on Solana, music tools like ZAOMixZ), each with prize, deadline, remote or not, what he would submit from existing work, and effort; recommend at most one or two to pick. Zaal picks. Research only, no registration or outbound."
tier: STANDARD
---

# 2693 - Hackathons worth entering, late October 2026 to January 2027

> **Goal:** A shortlist of open, remote hackathons that pay cash and fit work Zaal already has, with one or two recommended picks. Zaal picks; nothing here registers, posts or contacts anyone.

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| **First pick** | **ENTER the Qloo Agentic Hackathon** (deadline Oct 30, 2026, 11:45pm EDT). $25,000 cash, first place $15,000. 2,059 entrants, the smallest field of the cash events found. The brief is an agent that uses Qloo's taste graph, which covers music, so a ZAO music-curation agent (the job ZOL already does on Farcaster) is a direct fit. Effort: 2 to 3 focused days, inside the 9 days left. |
| **Second pick** | **ENTER Vultr: Agent Rush** (online build Nov 3 to 8, 2026; remote allowed). $9,000 cash plus $5,000 credits, first place $5,000 plus $3,000 credits. Its "Blast Radius Zero" track asks for an agent that writes and runs code with every action sandboxed, which is what this estate's PR-only gates, evaluator verdicts and guard hooks already do. Effort: the 6-day build window. |
| **PayPal AI Hackathon** | SKIP unless a payments idea is already on the table. $67,500 cash and a Nov 12 deadline, but 17,917 entrants and a mandatory PayPal sandbox integration with no existing ZAO payments work on PayPal (ZAO payouts run through Stripe and Splits). |
| **Nebius x NVIDIA** | SKIP. It requires Nebius Token Factory or AI Cloud and at least one NVIDIA open model, so the Claude-based work cannot be the main model, and the field is 25,464. |
| **AWS Communication Developer Services** | SKIP. "Professionals/Post grads only" and built on AWS voice and SMS services, which none of the existing work uses. |
| **Base, Farcaster, Solana, music** | NOTHING OPEN. Every event found for these was past (Colosseum Crypto World's Fair closed Oct 12 and is in judging) or in person (ETHGlobal Mumbai, Nov 5 to 7). Re-check in December; see Next Actions. |

The money is expected value, not income: three cash places per event against fields of 2,000 to 25,000. The reliable return is the people (judges, sponsor engineers) and credits. Treat each entry as a few days' work for a small chance at the top prize, as a Hacker News thread on sponsored hackathons put it, "one weekend of work for a small chance at $10K".

## Findings: candidates (all fetched 2026-10-21)

| Event | Prize (top) | Deadline / window | Remote | Fits | What Zaal would submit | Effort | Gotchas |
|---|---|---|---|---|---|---|---|
| Qloo Agentic Hackathon (Devpost) | $25,000 cash ($15,000 / $6,000 / $4,000) | Oct 30, 2026, 11:45pm EDT | Online | Agents; music taste | A music-curation agent that picks tracks for a ZAO audience from Qloo's taste graph, the ZOL job with a real recommendation source | 2-3 days | Must be live and externally hosted, public repo, open-source licence visible in the repo; builds that work the same without Qloo do not qualify |
| Vultr: Agent Rush (lablab.ai) | $9,000 cash + $5,000 credits ($5,000 + $3,000 credits) | Online build Nov 3-8, 2026; optional on-site Nov 8, Salt Lake City | Hybrid, remote OK | Agents (sandboxed code-running) | A code-writing agent whose every action is gated the way this estate gates lanes: PR-only, evaluator verdict at an exact head, guard hooks | 6-day window | Teams of 1-6; must run on Vultr Serverless Inference or a Vultr VM; original work; no travel paid |
| PayPal AI Hackathon (Devpost) | $67,500 cash ($12,000 first; several $5,000 specials incl. agentic commerce) | Nov 12, 2026, 12:00pm PST | Online | Agents; payments | Only with a new payments idea | 3-5 days | PayPal sandbox mandatory; existing projects need "meaningful progress" in the window; public repo and a demo video under 3 minutes; 17,917 entrants |
| Nebius x NVIDIA Global AI Hackathon (Devpost) | $50,000 cash ($20,000 grand) | Oct 30, 2026, 10:00am PDT | Online | Agents | Not a fit | - | Nebius plus an NVIDIA open model required; a pre-existing project needs a written account of what changed in the window; 25,464 entrants |
| AWS Communication Developer Services Agentic AI Partner Hackathon (Devpost) | $40,000 cash ($18,000 first) | Oct 28, 2026, 1:00pm PDT | Online | Weak | Not a fit | - | Professionals and post-grads only; AWS voice and SMS services |

### What existing work maps to which event

- **Agent orchestration** (the Claude Code lane fleet, the evaluator, PR-only merge gates): Vultr "Blast Radius Zero". The ZOE bot side lives in this repo at `bot/src/zoe/` (for example `bot/src/zoe/backlog-grill.ts`).
- **Farcaster mini apps:** this repo serves one at `src/app/miniapp/` with its manifest at `public/.well-known/farcaster.json`. No open Farcaster or Base cash event was found to enter it in.
- **WaveWarZ on Solana:** the on-chain program is the WaveWarZ team's, not this estate's; what is Zaal's is the tracker and recon tooling. No open Solana event was found.
- **ZAOMixZ** (public repo `bettercallzaal/ZAOMixZ`, a two-deck DJ platform): no open music-tech event was found. Qloo is the closest, through music taste.

### Looked at and excluded

| Event | Why excluded | Fetch |
|---|---|---|
| Colosseum Crypto World's Fair | Ran Sep 14 to Oct 12, judging underway | FULL (colosseum.com); the event's own subpage returned 404 |
| ETHGlobal | Only Mumbai, Nov 5-7, in person, no prize listed | FULL |
| Anthropic "Built with Claude: Japan 2026" | Japan residents only, selection of 250 | Search snippet only, not fetched |
| Arbiter Hacks V1 | Students only | FULL |
| IceHacks | No cash prizes | FULL |
| Amazon Developer Hackathon | Deadline Oct 23, two days out, not enough time | Not fetched |
| Binance Agentic AI Challenge | Unverified details | Search snippet only |
| Devfolio open list | Indian college events or in person | FULL |
| DoraHacks listing | Blocked (HTTP 405 and an AWS WAF human check) | FAILED |

## Also See

- [events/630-zabal-games-claude-code-hackathon-v0](../../events/630-zabal-games-claude-code-hackathon-v0/) - ZABAL Games run as a Claude Code hackathon
- [events/725-cannon-zabal-iman-hackathon-may23](../../events/725-cannon-zabal-iman-hackathon-may23/) - the May hackathon recap
- [business/1144-loops-house-zabal-judging-integration](../1144-loops-house-zabal-judging-integration/) - agentic hackathon platforms, from the organiser side
- Tracker card 10431 (todo) - the card this doc answers

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick Qloo, Vultr, both or neither; done when the pick is written on card 10431 | @Zaal | Decision | 2026-10-23 |
| If Qloo: register on Devpost and get a Qloo API key yourself (both are sign-ups in your name); done when the key exists | @Zaal | Hand | 2026-10-24 |
| If Qloo: build the music-curation agent in a public repo with an open-source licence and a hosted demo; done when the Devpost submission page shows it submitted | board-burn or a lane the seat names | PR + submission | 2026-10-30 |
| If Vultr: register on lablab.ai before Nov 3 and set up the Vultr account; done when the team page exists | @Zaal | Hand | 2026-11-02 |
| Re-check Base, Farcaster, Solana and music hackathons for December and January dates (Colosseum's next online event, ETHGlobal online events, Base buildathons); done when this doc's last-validated moves and the table carries any new rows | research lane | Research | 2026-12-01 |

## Sources

- [Qloo Agentic Hackathon](https://qloo.devpost.com/) - [FULL] fetched with curl 2026-10-21: deadline, $25,000 cash, $15,000/$6,000/$4,000, 2,059 entrants, hosted-demo and licence rules
- [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/) - [FULL] fetched 2026-10-21: deadline Nov 12, $67,500 cash, 17,917 entrants
- [Nebius x NVIDIA Global AI Hackathon](https://nebiusglobalaihackathon.devpost.com/) - [FULL] fetched 2026-10-21: deadline Oct 30, $50,000 cash, 25,464 entrants, Nebius and NVIDIA model requirement
- [AWS CDS Agentic AI Partner Hackathon](https://aws-cds-partner.devpost.com/) - [FULL] fetched by the research subagent 2026-10-21
- [Vultr: Agent Rush Hackathon](https://lablab.ai/ai-hackathons/vultr-hackathon) - [FULL] fetched with curl 2026-10-21: Nov 3-8 online, Nov 8 Salt Lake City, $9,000 + $5,000 credits, track names
- [Colosseum](https://colosseum.com/) - [FULL] Crypto World's Fair closed, judging underway
- [ETHGlobal events](https://ethglobal.com/events) - [FULL] Mumbai only
- [Hacker News: sponsored hackathon discussion](https://news.ycombinator.com/item?id=5333589) - [FULL] community source; dated 2013, used only for the expected-value framing
- [Dice: time to rethink the hackathon](https://insights.dice.com/2018/02/21/time-rethink-hackathon/) - [FAILED] HTTP 410, not used
- [DoraHacks hackathon list](https://dorahacks.io/hackathon) - [FAILED] HTTP 405 and an AWS WAF human check; Wayback not tried, so DoraHacks events are not covered by this doc

Gap, stated: no current Reddit or X thread on hackathons as income was found. The Hacker News thread is 13 years old, so the expected-value framing rests on prize counts and field sizes measured here, not on that thread.
