---
topic: infrastructure
type: market-research
status: research-complete
last-validated: 2026-08-23
superseded-by:
related-docs: 1659, 2360, 2154, 2155, 2284, 059, 942, 696
original-query: "cna we /zao-research on openmatter and then also research https://logos.co/ with it aswell please"
tier: DEEP
---

# 2399 - Logos: the private-by-default stack for parallel societies, and what it is worth to The ZAO

> **Goal:** Establish what Logos actually is in August 2026, separate its claims from its measurable state, and say plainly which parts (if any) The ZAO should touch, given that we already run a Farcaster community, a Hats tree, and an agent estate.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Adopt the Logos blockchain (LEZ / private PoS) for ZAO governance | **SKIP** | Testnet v0.2.3, launched June 2026. The Hats tree at 226 (walked to level 5, doc 059) and OREC on Optimism are live with real wearers and 311 transactions. Moving live governance to a two-month-old testnet trades working infrastructure for a thesis. |
| Adopt Logos Messaging (formerly Waku) to replace XMTP / Telegram | **SKIP for now, WATCH the rename** | The technology is the most mature piece here, but ZAO's messaging problem is not privacy, it is that ZOE lives on Telegram where members already are. No user is asking for metadata-resistant chat. |
| Install Basecamp on idle ZAO hardware and run a node | **INVESTIGATE - one machine, one member, one month** | This is the only cheap, reversible, genuinely-informative move. Dual MIT/Apache-2.0, runs on your own hardware, 226 node operators total so a ZAO node is a measurable fraction of the network. It also directly tests the idle-hardware thesis Zaal raised with OpenMatter on 2026-08-13. |
| Apply to the Lambda Prize with a ZAO application | **SKIP** | Funding is real but the applications Logos funds (private money, anonymous mutual aid, censorship-resistant archives) are not what ZAO ships. Applying would mean inventing a project to fit the grant, which is backwards. |
| Treat Logos as a competitor to OpenMatter | **NO - they solve different problems** | Logos is a sovereignty stack you run yourself, with no metered compute to sell. OpenMatter is metered confidential compute you rent. They overlap only in rhetoric. See the comparison below. |
| Read the Logos manifesto as strategic input | **YES** | Its diagnosis of exit-over-reform is the same argument The ZAO makes about the music industry, arrived at independently. That is worth something to doc 942 and the whitepaper regardless of whether we ever run the software. |

## What Logos is, in one paragraph

Logos is a modular, private-by-default technology stack for what it calls parallel societies: communities and institutions that operate outside the legacy system rather than trying to reform it. It is a portfolio project of the **Institute of Free Technology** (IFT), the startup studio that grew out of **Status**, the encrypted-messenger project Jarrad Hope and Carl Bennetts founded in 2017. The stack is four layers plus a runtime: storage, messaging, a privacy-preserving blockchain, and user-built modules, all loaded dynamically by a plugin runtime and reachable through a local launcher called **Basecamp**. Its own framing: "The right response to broken systems is not to reform them but to build alongside them, and eventually, beyond them."

## The rebrand almost every secondary source will get wrong

**Waku, Codex, and Nomos have been folded into Logos and renamed.** This is recent, it is not reflected in most writing about the ecosystem, and it is the single most useful current fact in this doc.

Measured 2026-08-23:

| Old identity | Where it points now | GitHub org state |
|---|---|---|
| `waku.org` | 302 to `logos.co/technology-stack` | `waku-org` renamed **"Logos Messaging - Legacy"**, 1 public repo, org record created 2025-12-01 |
| `codex.storage` | 302 to `logos.co/technology-stack` | `codex-storage` renamed **"Logos Storage - Legacy"**, 1 public repo, org record created 2025-12-01 |
| `nomos.tech` | 302 to `logos.co/technology-stack` | development consolidated into `logos-co` |

Logos' own stack page names the lineage explicitly: "Logos Messaging (formerly Waku) protocol implementations." So anyone citing Waku or Codex as independent projects in late 2026 is citing a structure that no longer exists. If a ZAO doc or pitch references them separately, it is stale.

## The stack, layer by layer

From `logos.co/technology-stack`, fetched raw 2026-08-23:

| Layer | What it does | Former name |
|---|---|---|
| **Basecamp** | "The local-first launcher for the Logos stack, running all modules on your hardware from a unified interface" | new |
| **Storage** | "Privacy-preserving file sharing and retrieval using content-addressed (CID-based) data" | Codex |
| **Messaging** | "Private, censorship-resistant communication between parties" | Waku |
| **Blockchain** | Two named parts: the **Logos Execution Zone (LEZ)** - "deploy programmes, run AMMs, transfer tokens, and build financial primitives with built-in privacy" - and **private proof-of-stake consensus**, "where validator identities and stake amounts remain hidden" | Nomos |
| **Networking** | "Discovery, peering, and mixnet" | - |
| **Logos runtime** | Loads modules, manages lifecycles, lets them talk to each other securely | - |
| **User Modules** | "Anyone can build pluggable modules that can communicate with each other over the same infrastructure" | - |

Their own positioning against the obvious comparisons, verbatim: "Networks such as Zcash might focus on private transactions, but they fall short of the full privacy-preserving platform needed to create sovereign applications. Logos is a complete, integrated stack that does not stop at just making transactions private."

## The numbers, and the gap between two of them

Logos publishes four headline figures on its homepage. Measured against GitHub the same day, one comparison is worth naming.

| Claimed on logos.co (2026-08-23) | Value |
|---|---|
| Contributors | 151 |
| Node Operators | 226 |
| Circles (local chapters) | 47 |
| Winnable Issues | 19 |

| Measured on GitHub (2026-08-23) | Value |
|---|---|
| `logos-co` public repos | 170 |
| `logos-basecamp` stars | 29 |
| `logos-basecamp` forks / open issues | 14 / 37 |
| `logos-basecamp` created | 2025-10-08 |
| `status-im` public repos (the parent lineage) | 740, org created 2015-04-02 |
| IFT contributors, self-reported | 220+ |

**The flagship repo has 29 stars.** That is not a criticism of the code, and star count is a weak proxy - but it is the honest scale signal, and it sits oddly beside a homepage that leads with movement language. Compare Nous Research's `hermes-agent` at 234,260 stars (doc 1659 addendum v4, measured 2026-08-22). Logos is an early project with a large manifesto, and both halves of that sentence are true.

What *is* impressive is cadence: `logos-logoscore-cli`, `logos-logoscore-py`, `logos-basecamp`, and `logos-package-manager-ui` were all pushed on 2026-08-23, the day of this research. This is actively built, not abandoned.

**Testnet status:** v0.2 launched June 2026, currently v0.2.3, and their own page says it "is focused on the developer experience and the usability of the stack." That is a pre-production self-description, stated by them, not inferred by us.

## Licence - read the file, not the API field

`logos-basecamp` carries **both** `LICENSE-APACHE-v2` and `LICENSE-MIT` at the repo root - the standard Rust-ecosystem dual licence. The GitHub API `license.spdx_id` field reports only `Apache-2.0`.

This is a live instance of `zao-research` Hard Requirement 13: the API field is a classifier and it undersold the actual grant here. Dual MIT/Apache is *more* permissive than Apache alone, so in this case the error was harmless - but the same class of error is what turns a PolyForm Noncommercial repo into an assumed-adoptable one. Read the file.

Adoption-wise this means Logos code is genuinely usable by ZAO under either licence, with attribution (`.claude/rules/credit-attribution.md`).

## The manifesto, and why it is the most useful part for ZAO

`logos.co/manifesto` is "Logos: A Declaration of Independence in Cyberspace," authored by **Jarrad Hope**. Its abstract:

> "A fully decentralised, privacy-preserving, and politically neutral tech stack would provide the necessary support for self-sovereign virtual territories... By using these technologies to build solutions for communications, storage, and smart contracts, we can incentivise the formation of borderless public institutions based on voluntary consent. This opens the possibility for a culture of resilient parallel societies that maximise the costs of surveillance and coercion, while minimising the costs of exit, voice, and loyalty."

That last clause is Albert Hirschman's *Exit, Voice, and Loyalty* used as a design target, and it is the same move The ZAO makes in a different domain. Strip the cyberspace framing and the argument is: the incumbent system captures the value produced by the people inside it, reform from within has been tried, so build the parallel and make leaving cheap. Substitute "the music industry" for "the Westphalian state" and that is doc 696 and doc 942.

The homepage makes the debt case with figures worth checking before reuse (they are Logos' claims, not ours): global government debt at a record $111 trillion in 2025 rising $8.3 trillion in a year; 3.4 billion people in countries spending more on interest than on health or education; 27% of Gen Z and 55% of millennials owning a home versus 80% of Baby Boomers; the average US millennial holding 30% less wealth than the average Boomer at 35.

**Recommendation for the whitepaper lane:** doc 942 locked an academic voice and an argument-first structure. Logos is prior art for exactly that shape - a manifesto that argues from first principles before it describes any mechanism. Read it as craft reference. Do not borrow its rhetoric; ZAO's register is warmer and its enemy is an industry, not a civilisation.

## The organising layer, which is the genuinely novel bit

Most infrastructure projects stop at "build" and "run a node." Logos adds a third path:

> "**Circles.** Local chapters of activists and change seekers solving real world issues." - 47 of them.
> "**Winnable Issues.** Local issues that Circles identify and solve, from privacy tech to community funding." - 19 of them.

A protocol project running local chapters with a named, bounded, winnable-issue framing is unusual, and it is structurally close to what The ZAO does with weekly meetings and Respect. The mechanism worth stealing is not the software, it is **"winnable issues"** as a framing device: a bounded thing a small group can actually finish, named as such, rather than an open-ended mission. That maps cleanly onto ZAO's fractal groups and onto the `feedback_max_three_goals_per_day` discipline.

That is a free idea. It requires installing nothing.

## Logos versus OpenMatter - not competitors, and here is why it matters

Both showed up in the same research request, both talk about privacy and decentralisation, and they are answers to different questions. Getting this wrong would waste real time.

| | **Logos** | **OpenMatter Network** |
|---|---|---|
| What you get | A stack you run on **your own** hardware | Compute you **rent** on **their** network |
| Business model | No metered product. IFT is a studio funding public goods | Credits, billed per compute-hour |
| Maturity | Testnet v0.2.3, June 2026 | Mainnet, June 2026 |
| Team | IFT 220+ contributors; Logos 151 claimed | ~12 people (vendor's own figure, 2026-08-13) |
| Buyer | Individuals and communities exiting institutions | Enterprises, healthcare, finance |
| Privacy mechanism | Mixnet, ZK, private PoS, local-first | MPC, FHE, ZK proofs, runtime-decrypted keys |
| Licence | Dual MIT / Apache-2.0, verified from file | Proprietary platform; `matter-sdk` public |
| What ZAO would do with it | Run a node, borrow the organising ideas | Deploy an agent for the newsletter |

The one place they genuinely converge is **idle hardware**. Logos wants node operators; OpenMatter is a DePIN network where "people will be able to add their resources and earn compute credits" (Chris Biele, 2026-08-13). Zaal raised exactly this on that call - a community of members with idle machines. If ZAO ever runs an idle-hardware programme, these two are the candidate networks to point it at, and that is a single decision, not two.

## What ZAO should actually do

**Do this:** put Basecamp on one idle machine, run it for a month, and write down what broke. Cost is electricity and one member's attention. It answers three questions at once - is the stack real, is node operation something ZAO members could do, and is idle-hardware contribution a programme worth building. Reversible, cheap, and it produces a fact instead of an opinion.

**Do not do this:** migrate any live ZAO governance, identity, or messaging. The Hats tree at 226 is walked and working (doc 059, re-validated 2026-08-21), OREC has 311 transactions of history on Optimism, and members are on Farcaster and Telegram. A June-2026 testnet does not get to hold any of that.

**Take for free:** the "winnable issues" framing, and the manifesto as craft reference for doc 942.

## Also See

- [Doc 1659](../../agents/1659-openmatter-network-agent-platform-eval.md) - OpenMatter Network, evaluated and re-evaluated four times; addendum v5 in this same PR carries the 2026-08-13 meeting record
- [Doc 2360](../../identity/2360-which-agent-gets-the-legal-body/) - which agent gets the legal body (ZOL)
- [Doc 2154](../../identity/2154-zoe-digital-identity-legal-body/) and [Doc 2155](../../identity/2155-per-brand-identity-kit/) - the identity ladder
- [Doc 2284](../2284-oracle-always-free-vps-capacity/) - Oracle Always Free, the free-forever comparison for any compute decision
- [Doc 059](../../governance/059-hats-tree-integration/) - the Hats tree, walked to level 5 on 2026-08-21
- [Doc 942](../../governance/942-zao-fractal-whitepaper-outline-v2/) and [Doc 696](../../governance/696-respect-fractal-lineage-summary/) - the Fractal whitepaper and the Respect lineage, where the manifesto is craft input. NOTE: doc number 696 resolves to two directories (also `community/696-zaal-zao-deep-audit`); the governance one is meant here.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide yes/no on the one-machine Basecamp trial; if yes, name the machine and the member | @Zaal | Decision | 2026-08-31 |
| If approved: install Basecamp on the named machine, run 30 days, write findings as an addendum to this doc (shipped-criteria: addendum merged) | @Zaal (assign a lane) | Research doc | 2026-09-30 |
| Hand the manifesto to the whitepaper lane as craft reference for doc 942 (shipped-criteria: cited in doc 942's sources or explicitly rejected) | @Zaal | Handoff | 2026-08-31 |
| Correct any ZAO doc or pitch that cites Waku, Codex, or Nomos as independent projects (shipped-criteria: grep returns no stale references, or a PR fixing them is merged) | @Zaal (assign a lane) | PR | 2026-09-07 |
| Fold "winnable issues" into the fractal-group framing, or reject it with a reason | @Zaal | Decision | 2026-09-07 |

## Sources

Method stated per `.claude/rules/research-grounding.md`. **No WebFetch was used.** Everything below is raw `curl` plus an HTML strip, or an official API. Every quotation is from bytes actually received.

- `https://logos.co/` - **[FULL]**, raw curl + strip, 2026-08-23. The four headline numbers, the three paths, the debt figures, the Basecamp description, use cases.
- `https://logos.co/manifesto` - **[FULL]**, raw curl + strip, 2026-08-23. Title, authorship (Jarrad Hope), abstract, keywords, the exit/voice/loyalty framing.
- `https://logos.co/technology-stack` - **[FULL]**, raw curl + strip, 2026-08-23. Layer-by-layer stack, LEZ, private PoS, testnet v0.2.3, the "formerly Waku" lineage line, the Zcash comparison.
- `https://free.technology/` - **[FULL]**, raw curl + strip, 2026-08-23. IFT portfolio (Logos, Status, Keycard, Nimbus), 220+ contributors, founding lineage from Status 2017, named leadership.
- `https://nomos.tech/`, `https://waku.org/`, `https://codex.storage/` - **[FULL as redirect evidence]**, raw curl following redirects, 2026-08-23. All three resolve to `logos.co/technology-stack`. This is the primary evidence for the consolidation finding.
- GitHub REST API via `gh` - **[FULL]**, 2026-08-23. Org records for `logos-co`, `status-im`, `waku-org` ("Logos Messaging - Legacy"), `codex-storage` ("Logos Storage - Legacy"); repo list and stars/forks/issues for `logos-basecamp`; root file listing showing `LICENSE-MIT` + `LICENSE-APACHE-v2` against an API field reporting Apache-2.0 alone.
- `https://logos.co/network-state` - **[FAILED - 404]**, raw curl, 2026-08-23. Guessed path, does not exist. Recorded rather than quietly dropped.
- Hacker News, Algolia API (keyless) - **[FULL, negative result]**, 2026-08-23. Query "logos network state" returns one 2022 submission at **1 point, 0 comments**. There is no substantive HN discussion of Logos. Reported because an absent community signal is a finding, not a gap to paper over.

**Community-source honesty note.** Hard Requirement 7 asks for a community source. The HN result above is the community source, and it is close to empty. Reddit was not attempted: `.claude/rules/research-grounding.md` and doc 2282 (`business/2282-reddit-as-oss-outreach-channel`) records that reddit is fully walled from this machine and the durable fix is a credential Zaal has not yet created. Rather than substitute search snippets, this doc leans on primary sources and on-chain/GitHub measurement, and says so.

**Contradiction left open, not resolved.** Logos claims 151 contributors and 226 node operators; the flagship repo has 29 stars and 14 forks. These are not the same metric and both can be true. This doc reports both and does not synthesise a false consensus about the project's real size.
