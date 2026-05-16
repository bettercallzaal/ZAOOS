---
topic: governance
type: comparison
status: research-complete
last-validated: 2026-05-16
related-docs: 056, 058, 109, 111, 547, 656, 658
tier: DEEP
---

# 657 — Plural Events Deliberation Toolkit (Hubs Network meeting hub)

> **Goal:** From the May 12 2026 Hubs Network / RadicalxChange meeting Zaal attended, capture the five deliberation tools and pick which ones to use for (a) the Maine "Cosmo Localism" Plural Event Zaal is sponsoring, (b) ZAOstock Oct 3 community input, (c) ongoing ZAO governance experiments. Sub-docs cover each tool in depth.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Tool for Maine Plural Event Zaal sponsors | START WITH dembrane | Bastien (Berlin host) + Nicolene both name it as "easiest to onboard" — QR code + phone-on-table, no participant login, GDPR-clean. Lowest facilitator cognitive load for a first event. |
| Add Polis as 15-min "wrap-up" tool at end of session | YES | Jess Scully's exact recommendation: regular facilitated discussion, then 15 min Polis at the end to surface cross-cutting consensus. Polis needs no login, browser-only. |
| Use RadicalxChange Quadratic Voting for the event | NOT FOR PE1 | Jack Henderson's QV system requires unique per-participant links + 99 voice credits per voter. Too heavy for a kickoff event. Use Vokwal (Bastien's alternative) if QV needed for a session-cookie-based QR vote. |
| Adopt for ZAOstock Oct 3 community input | dembrane (sponsor seat) + Polis (post-event) | Same logic. Dembrane is sponsoring RadxChange's pilot events — likely free seat available. Polis is OSS, free forever. |
| Adopt for The ZAO Farcaster governance (188 members) | Polis embed only | Members are already gated + identified; QV-grade security is overkill; Polis seed-statement loop fits a Farcaster channel discussion. |
| Build any of these as ZAO-native? | NO new tools | All five are OSS or partner-available. Build nothing, integrate one. Zaal is funding a Plural Event, not a tooling startup. |

## The Five Tools (Sub-Docs)

| # | Tool | One-liner | Cost | License | Sub-doc |
|---|---|---|---|---|---|
| 1 | Polis | Voting + clustering. The original. Used in Taiwan 2015 (Uber consensus, 92% safety agreement). | Free, OSS | AGPL | [657a](./657a-polis/) |
| 2 | Context Engine | Polis math + passkey 1-step login + AI question generation from meeting audio. Charles Thompson SF, vibe-coded. | Free demo | Web3 rails, OSS-leaning | [657b](./657b-context-engine/) |
| 3 | Agora Citizen Network | Conversational Polis-style with ZK Proof of Passport for sybil resistance + AI cluster naming. By ZKorum. | Free, OSS | Open source | [657c](./657c-agora-citizen/) |
| 4 | dembrane | QR-code-on-table audio listen + multilingual transcribe + anonymize. Netherlands BV, GDPR + ISO 27001. | Paid (sponsor available) | Source-available, transitioning OSS | [657d](./657d-dembrane/) |
| 5 | RadxChange QV | Quadratic voting ballot. 99 voice credits, unique per-voter links. New "liquid funnel" UI in vibe-coded prototype. | Free, OSS | Open source | [657e](./657e-radxchange-quadratic-voting/) |

## The Plural Magic — What Connects All Five

The unifying claim (Jess Scully + Jack Henderson) is the **"plural majority"** — that the obvious A-vs-B political split is almost always sitting on top of an unobvious cross-cutting consensus. The tools exist to **surface that latent consensus** so deliberation produces a third synthesis rather than a winner.

Canonical example given on call: Taiwan 2015 Uber-vs-taxi conversation. Surface: two ~equal opinion clusters. Below the surface: 92% agreed on safety + insurance + liability outcomes regardless of which provider. Audrey Tang's digital ministry used Polis to find that hidden agreement, then policy was built on it.

Second example: "What does it take to build a thriving multiracial community?" Three clusters formed (pro-deliberation / anti-capitalist / anti-woke). All three clusters 100% agreed: third spaces / hubs / non-work-non-home gathering places matter. That 100%-shared answer is what Polis surfaces.

**ZAO mapping:** The same mechanic applies to "what should ZAOstock 2027 do?" or "what next for The ZAO?" — surface assumptions are loud, the cross-cutting consensus is quiet, and the OG/ZOR fractal-respect split (doc 056, 058) is the same shape of problem.

## Meeting Attendees + Plural Event Hosts

From the May 12 2026 call (5am SF, midnight Sydney, normal hours EU + East Africa):

| Person | Role | City | Plural Event |
|---|---|---|---|
| Nicolene / Sonja | Hubs Network host | (org) | Coordinator |
| Jess Scully | Exec Director, RadicalxChange | Sydney | First Sydney RxC event in 1 month |
| Jack Henderson | Director of Operations, RxC | Brooklyn NYC | Community Week embed |
| Charles Thompson (Charlie) | Builder, Context Engine | San Francisco | Tool author |
| Alain Vereecke | Host | Brussels | Renewing democracy + public cleanliness |
| Bastien (Bas tin) | Host | Berlin (Medula hub) | Contest entry framing, 3 speakers (Sam Vance-Law, Caroline / Politics for Tomorrow, Vlad / DarkMetaLabs) |
| Justina Svitraite | Host w/ Niccoli | Barcelona | ~25 signups; breakout-room format planned |
| Ian Njuguna | Host | Kenya | Green-space / playground / Web3 advocacy |
| Joshua Ovie | Host | Ibadan (Nigeria) | Logos community |
| Mariia Makivnychuk + Anna Vytvytska + Sofia | NGO + youth hackathon org | Ukraine | Youth hackathon project, ages 12-15 |
| Timothy, Takmalah | (attended, did not present) | — | — |
| **Zaal Panthaki** | **Sponsor + host** | **Maine (Ellsworth area)** | **"Cosmo Localism" — funded from own pocket** |

## Action Bridge — What Zaal Said On The Call

Zaal's own words (timestamp 9:07):

> "My name is Zaal, also known as Better Call Zaal. I'm out here in Maine, starting to create the Cosmo Localism here. I'm really excited to get more involved with you guys and just figure out what tools we can use to help other communities like this that are international communities with different hubs."

This frames the Maine event explicitly as **Cosmo-Localism in Ellsworth**. The toolkit decision should be evaluated against that goal: bridging Maine-local concerns (Thursday concert series, parklet venue, ZAOstock Oct 3) to the global Hubs Network of plural-event organizers.

## Action Items Logged During The Call

These were captured live in the transcript and should be tracked outside this doc:

| Action | Owner | Source timestamp |
|---|---|---|
| Share meeting recording with Zaal + attendees | Hubs Network | 18:21 |
| Send PE4 Context Engine link with seed statements to attendees | Charles Thompson | 31:13 |
| Add QR / low-security option to RadxChange QV roadmap | Jack Henderson | 59:28 |
| DM Jess re: 12-15 youth voting interface (Anna's hackathon) | Jess Scully | 67:50 |

## The Other Linked Tweet — M4K070 (Takemiya)

Zaal also sent `https://x.com/M4K070/status/2053960779825852422` in the same /zao-research prompt. This is Makoto Takemiya / Soramitsu's article "BLOCKCHAIN AS THE GEOPOLITICAL MONETARY SUBSTRATE" — covered separately in [Doc 658](../../business/658-takemiya-blockchain-geopolitical-monetary-substrate/). It's adjacent but a different topic (sovereign monetary infra vs deliberation infra). Both pieces share the deeper theme: **public infrastructure for collective decisions** — one for talking, one for transacting.

## Where ZAO Already Has Comparable Surfaces

| ZAO surface | Comparable tool | File / Doc |
|---|---|---|
| Snapshot voting for The ZAO governance | RadxChange QV (more expressive) | `community.config.ts` |
| Farcaster channel discussion in /thezao | Polis / Agora Citizen | `src/lib/farcaster/` |
| ORDAO + Respect fractal weekly | Quadratic Voting (Jack's exact example case) | Doc 056, 058 |
| ZOE captures (`bot/src/zoe/`) | dembrane (audio-to-structure) | Hermes-brain pattern |

The "fractal" Mondays 6pm EST already use Respect distribution which IS a kind of quadratic-shaped allocation (you can't just dump all your respect on yourself). The conversation tooling layer (Polis-style) is the missing piece — fractal does the ratification, but the pre-ratification conversation is unstructured.

## Hard Numbers

- May 12 2026 call, 71 minutes, 13+ attendees across 8+ countries.
- 5 deliberation tools demonstrated.
- Polis Taiwan 2015 Uber case: 92% latent consensus on safety/liability.
- RadxChange QV default: 99 voice credits per voter (not 100 — deliberate, prevents going all-in on one option with 10 votes).
- Bastien Berlin event: 3 invited speakers + contest-entry workflow.
- Barcelona event: ~25 signups, breakout-room format with 1 extra dembrane phone per room.
- Bakong (Cambodia CBDC built on Hyperledger Iroha) pilot 2019: 10,000+ users — referenced because Takemiya/SORA shares this lineage (see Doc 658).

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick ONE tool for Maine Plural Event (recommend dembrane + Polis wrap-up) | @Zaal | Decision | Before event date confirmed |
| DM Nicolene on Hubs Network Telegram, claim a dembrane sponsor seat | @Zaal | DM | This week |
| Decide if Maine Plural Event date should align with Roddy Parklet Thursday concert series (Doc on Ellsworth Thursday series exists) | @Zaal | Decision | Roddy 4/28 follow-up meeting |
| Cross-link from `project_zao_master_context.md` to this hub | @Zaal | Memory | This session |
| Test dembrane + Polis at small internal session (ZAOstock standup Tue 10am or Mon 11:30 cobuild) before public event | @Zaal | Trial run | Next 2 weeks |
| For ZAOstock Oct 3 community brief: pre-bake 5-8 seed statements for a post-event Polis to capture "what did Ellsworth think" | @Zaal | Festival prep | Sept 2026 |

## Sources

- [Hubs Network](https://www.hubsnetwork.org/hubs) — host org
- [RadicalxChange](https://www.radicalxchange.org/) — co-org
- [RadxChange / Plural Voting tool page](https://www.radicalxchange.org/tools/plural-voting/)
- [RadxChange / Quadratic Voting wiki](https://www.radicalxchange.org/wiki/quadratic-voting/)
- [Polis (compdemocracy)](https://compdemocracy.org/polis/)
- [Polis on Wikipedia](https://en.wikipedia.org/wiki/Pol.is)
- [dembrane](https://www.dembrane.com/)
- [Agora Citizen Network](https://www.agoracitizen.network/) — by ZKorum
- [Context Engine](https://x.com/RadxChange/status/1995554770770120726) — RxC tweet announcing PE4 deployment
- [Polis: Scaling Deliberation by Mapping High-Dimensional Opinion Space — academic paper](https://www.proquest.com/scholarly-journals/polis-scaling-deliberation-mapping-high/docview/2610037205/se-2)
- [LLMs + Polis (arxiv)](https://arxiv.org/abs/2306.11932)
- [Plural Voting brief — New America](https://newamerica.org/political-reform/briefs/exploring-plural-voting-as-a-method-for-citizen-engagement)
- Meeting transcript (Fathom recording: https://fathom.video/calls/670891723) — primary source

**Recording note:** Hubs Network promised to share the Fathom recording with attendees including Zaal (action logged at 18:21 in the call). Re-validate this doc once Zaal receives + reviews the recording.
