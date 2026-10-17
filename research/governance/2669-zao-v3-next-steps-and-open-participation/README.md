---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-17
related-docs: "2656, 2657, 2642, 2562, 2419, 1200, 1202, 1233, 1207, 981, 696, 059"
original-query: "can we do deep research on next steps to build ZAO V3 and finish up what we need to get this to be friendly for everoyne to participate in"
tier: DEEP
lane: zao-core
---

# 2669 - ZAO V3: next steps, and what is left before anyone can take part

> **Goal:** Rank what must ship before Season 3 opens on 1 December 2026, and walk the path a newcomer takes from first hearing of The ZAO to earning and using Respect, naming where each step breaks today.

ZAO V3 here means the whole of The ZAO and the work of the past few months, taken as one system. In the papers it is Season 3, the move out of beta into a full production release, starting 1 December 2026 (per rulings by Zaal on 2026-09-26 and 2026-10-10).

**How this doc was made.** Three read-only agents on 2026-10-13: one read the ZAOOS library, the private decision record and `bettercallzaal/zao-papers`; one fetched the live public surfaces and read the zingfisher and `zao-fractal-bot` code; one did outside research. The parent re-ran eight load-bearing checks directly (marked "re-checked" below). Everything else is the agents' reading and is cited to its source so it can be re-run.

**Correction, 2026-10-17.** This doc blamed the `/member/join` 404 on Postgres and proposed pointing the Join button elsewhere. Both were wrong. The cause was the app's middleware: `apps/webapp/middleware.ts` rewrote any first path segment missing from `DOMAIN_BLACKLIST` to a space route, and `member` was not on that list. A second list, the route guard's public pages, also lacked `learn` and `member`. zingfisher PR #7 fixed both, without the database, and merged on 2026-10-13. Re-checked 2026-10-17 with curl: `/member/join` returns 200, `/learn` 200, and a made-up path 404. The rows below that this changes are marked "Corrected 2026-10-17". Later the same week: zingfisher PR #9 restored real wallet sign-in behind a switch (off in production), and PR #10 specified the database table for ZIDs and member profiles.

**Loud caveats, before anything else.**
- Reddit could not be read (the Reddit fetch script returned no credentials) and six Hacker News queries found no relevant thread. The community evidence here is governance forums and GitHub issues, not Reddit or HN.
- Four surfaces could not be rendered: `zao.frapps.xyz` (empty React shell to curl), the `luma.com/zao` event list, `zaoos.com` past its title, and the target of the "Join the ZAO!" button on `thezao.com`.
- No on-chain value was re-read for this doc. Holder counts are as of 2026-10-12 from the sources named.

## Key Decisions

| # | Decision | Why | Evidence |
|---|----------|-----|----------|
| 1 | DONE: the join dead end is fixed. `/learn` and the member gate both send people to `/member/join`, which was HTTP 404 on the live preview. Corrected 2026-10-17: the cause was middleware, not Postgres; zingfisher PR #7 fixed it and the page now serves, so the button stays where it is. | It is the main call to action, and it led nowhere until 2026-10-13. | Re-checked 2026-10-13: `curl https://zingfisher-webapp.vercel.app/member/join` returns 404; `/learn` returns 200. Code: `apps/webapp/components/zao/ZaoMemberGate.tsx:35-50`, `apps/webapp/pages/member/join.tsx`. |
| 2 | TREAT three items as the Season 3 launch blockers, in this order: the manifesto capture session, the reviewer ask for the OG + ZOR wrapper, and applying the drafted amendment to `zips/zip-0000-season-3.md`. | The ZIP itself says the manifesto gates launch and that the season moves if no reviewer commits. Neither has started. The amendment is drafted and its blockers (zao-papers #14 and #15) merged on 2026-10-13. | `zao-papers` `zips/zip-0000-season-3.md` Open Items 1, 2, 5 and section 9. The amendment is drafted privately and not yet opened as a PR. |
| 3 | USE the existing Snapshot space `zaal.eth` for ZIP votes, and SET its voting period and quorum. Do not build a vote in zingfisher. | The space already sums OG (18 decimals) and ZOR (token id 0, 0 decimals) on Optimism, which is the vote weight Zaal ruled on 2026-10-10. Its period, delay and quorum are all null. zingfisher's native vote weights by one ERC-20 and cannot add ZOR. | Re-checked 2026-10-13 via `hub.snapshot.org/graphql` for space `zaal.eth`. Code: `packages/lib/src/votes/getVotingPowerForVotes.ts:35`. Snapshot for ZIP votes is per a ruling by Zaal on 2026-10-10. |
| 4 | TREAT CharmVerse upstream as unmaintained and keep the fork small: `/learn`, the member gate, ZID join, ZIP drafting and discussion. SKIP porting more of CharmVerse's proposal machinery. | `app.charmverse.io` no longer resolves and the repo's last commit is 2025-10-18. Nobody upstream will fix what we inherit. | Re-checked 2026-10-13: `dig app.charmverse.io @1.1.1.1` returns NXDOMAIN (control `snapshot.box` resolves). No shutdown announcement was found; the agent searched one web query and the repo's issues, not CharmVerse's X or Discord. |
| 5 | STOP relying on the v1 bot's "Submit Onchain" message today, and DECIDE the submit path for v2. Recommended: the v2 bot creates the OREC proposal through `orclient` from a dedicated key and posts the link; humans vote. | v1 prints success and sends nothing. v2 does not submit at all. Since 2026-03-23 every OREC proposal came from one wallet, and 18 awards are recorded as missed. | `zao-fractal-bot` `docs/deploy/v2-safe-deploy-plan.md:16`, `src/discord/gameCommands.ts:313`; the proposals review of 2026-10-12 (private note). On-chain, so this is Zaal's decision. |
| 6 | MINT a first-timer's Respect in a separate proposal from the room's. | An open ORDAO issue shows one account that rejects a mint can abort the whole distribution transaction, and it has already happened at Eden Fractal. | `sim31/ordao` issue #27, "Denial of respect distribution through ERC-7702", open, filed 2026-02-23 (re-checked). |
| 7 | ADD a host rota and a minimum-room rule, and publish the session times in one place. | Optimism Fractal went on indefinite hiatus after an event where only the host showed up. The ZAO's 13 Oct noon session did not run for want of 4 people. | Snapshot proposal "Indefinite Hiatus for Optimism Fractal", created 2026-01-21, 2 votes, 3938 to 0 (re-checked); private session record for 2026-10-13. |
| 8 | TELL one public story. Pick `thezao.com` or `test.thezao.com` as the front door, link `/learn` from it, and correct "Built on Farcaster and Base" (Respect is on Optimism). | Two live sites pitch different things and neither links the only page with a step-by-step join path. | Agent fetch of both sites 2026-10-13. Site work belongs to the thezao lane. |
| 9 | INVESTIGATE wallet-free sign-in after 1 December, not before: ORDAO ships `@ordao/privy-react-orclient`. | It is the largest single barrier for musicians, and it is too large to land safely before the season opens. | `sim31/ordao` README; Water and Music survey figure of 30.6 percent of fans owning no crypto (undated). |

## Findings

### 1. What is decided for V3

| Rule | Source |
|------|--------|
| Season 3 starts 1 December 2026 | Per a ruling by Zaal on 2026-09-26, reconfirmed 2026-10-10 |
| Vote weight is whole OG plus ZOR, summed, through one `IRespect` wrapper installed by one `setRespectContract` proposal; an outside Solidity reviewer is required | Per a ruling by Zaal on 2026-10-10; `governance/2657-respect-binding-token-design` |
| Hats confer no vote weight | Per a ruling by Zaal on 2026-09-22, cited in `governance/2657-respect-binding-token-design` |
| ZIPs are approved by a holder vote in Snapshot `zaal.eth`; on-chain actions go to OREC; the zingfisher vote is advisory | Per a ruling by Zaal on 2026-10-10 |
| A merge alone does not accept a ZIP; the ZIP-system ZIP goes first as the test vote | Per rulings by Zaal on 2026-10-08 |
| No burn and no 2 percent weekly decay; activation is a rolling 90 days | Per rulings by Zaal on 2026-09-26 |
| OG becomes the one-time achievements ledger; Respect splits by org (ZAO Fractal, ZAO Festivals, WaveWarZ later) | Per rulings by Zaal on 2026-09-26 |
| Membership layers: provisional, full, active pool; one free, gasless, soulbound Manifesto Hat on tree 226 | `zips/zip-0000-season-3.md` sections 1 to 5 |
| OREC windows: 72 hours to vote, 72 hours to veto | `sim31/orfrapps` `fractals/zaof/frapp.json` (re-checked: `votePeriod` and `vetoPeriod` 259200) |

### 2. Built and unbuilt

| Component | State on 2026-10-13 | Evidence |
|-----------|---------------------|----------|
| Weekly Respect Game and ZOR mints | Runs, by hand | Proposals review of 2026-10-12 (private note) |
| Bot v1 "Submit Onchain" | Broken: reports success, sends nothing | `zao-fractal-bot` `docs/deploy/v2-safe-deploy-plan.md:16` |
| Bot v2 | Never deployed; one slash command (`/start`); no OREC write path | `src/discord/gameCommands.ts:30-45`, `:313`; `docs/deploy/bot-hosting-runbook.md` |
| Newcomer detection | A CLI report a person must run (`npm run newcomers`); no welcome is sent | `package.json:23`, `src/lib/newcomers.ts` |
| OREC | Live; reads OG only | `governance/2562-zao-fractal-state-and-build-plan` |
| OG + ZOR wrapper | Specified, not written, no reviewer | `zip-0000-season-3.md` Open Item 2 |
| Snapshot `zaal.eth` | Configured for OG + ZOR; dormant: 16 proposals, 11 followers, last one created 2025-12-21, none a ZIP | hub GraphQL, re-checked |
| Manifesto text | Does not exist | `zip-0000-season-3.md` Open Item 1 |
| Manifesto Hat, self-claimed roles | Unbuilt; tree 226 eligibility is manual | `governance/059-hats-tree-integration` via 2656 |
| zingfisher token gates, member page, `/learn` | Merged; the chain-read gate answers live without a database | `GET /api/zao/membership?address=0x...01` returned 200 with `member:false` |
| zingfisher login, ZID storage, proposals | Need Postgres; the database is being set up, per a ruling by Zaal on 2026-10-11 | zao-core lane status (private) |
| Technical whitepaper | Draft merged (`papers/technical-whitepaper.md`), not published, not ratified | zao-papers #15 |
| Season 3 ZIP | On main, stale against rulings: abstract still says monthly activation, Open Item 5 still says the ledger is unruled | `zips/zip-0000-season-3.md` |

### 3. The numbers, and where they disagree

| Measure | Value | As of | Source | Conflict |
|---------|-------|-------|--------|----------|
| Unique Respect holders | 165 (122 OG, 64 ZOR, 21 both) | 2026-10-12 | `context.thezao.com/thezao`; technical whitepaper section 2 | 156 on 2026-07-05 and 157 in `governance/1200-respect-onchain-facts-verified`; the earlier figures are older, not wrong |
| ZOR-only wallets with no OREC weight | 43 | 2026-10-12 | technical whitepaper | - |
| OG mints | None since 2025-12-20 | - | `context.thezao.com/thezao` | - |
| Session of 12 Oct | 11 people in two rooms; 8 ranked | 2026-10-12 | Proposals review of 2026-10-12 (private note) | "~40 active members" on `zaofractal.vercel.app`; "6 to 30" in the Season 3 ZIP |
| OREC proposals | 171: 139 executed, 12 failed, 20 not executed | 2026-10-12 | same note | 130 in `governance/981-fractal-bot-synthesis` (July) |
| Wallets that ever proposed | 4; one wallet only since 2026-03-23 | 2026-10-12 | same note | "two wallets" in `governance/696-respect-fractal-lineage-summary` |
| Weeks settled on-chain | 72 distinct weeks; no mints for periods 71, 72, 103 | 2026-10-12 | `context.thezao.com/thezao` | "100+ weekly sessions" and "unbroken" on `zaofractal.vercel.app`; 63 weeks in `governance/1202-fractal-onchain-settlement-history` (July) |
| OREC vote threshold | 500 | 2026-10-13 | `frapp.json` `voteThreshold` (re-checked) | 1,000 "minWeight" in doc 2562. Unresolved: one is the config file, neither is a read of the deployed contract |
| Snapshot turnout | Median 1 vote across 16 proposals | 2026-10-10 | `governance/2642-zao-holder-approval-systems-inventory` | - |
| ZAO OS accounts | 60 rows, 2 created after 2026-04-07 | 2026-08-25 | `identity/2419-zid-state-and-signup-spec` | Not re-measured |

Attendance over time is UNKNOWN. Doc 2562 says so, and no source here supplies a weekly series. The streak claim should be stated as weeks held and weeks settled on-chain, separately, until the per-week ledger from the fractal audit lane exists.

### 4. Participation-friction audit: the newcomer's path

Break types: MISSING (nothing exists), BROKEN (exists, fails), UNCLEAR (exists, not explained), GATED (needs something a newcomer cannot have yet), HUMAN-DEPENDENT (works only when one person does it).

| # | Step | Surface | Break | What happens today |
|---|------|---------|-------|--------------------|
| 1 | Hears of The ZAO | `thezao.com`, `test.thezao.com` | UNCLEAR | Two live sites, two pitches. `test.thezao.com` says "Built on Farcaster and Base". |
| 2 | Looks for how to join | same | UNCLEAR | `thezao.com` names no first action. `test.thezao.com` offers only "Join on Farcaster". Neither links `/learn`; `test.thezao.com/learn` and `/join` are 404 (re-checked). |
| 3 | Learns what Respect is | `zaofractal.vercel.app` | UNCLEAR | A research library with v0.1 draft chapters. No beginner page, no meeting link. |
| 4 | Finds the next session | `luma.com/zao` | UNKNOWN | The event list could not be read. Monday 18:00 Eastern is stated on two sites with no call link; Tuesday noon sessions now also run. |
| 5 | Registers a ZID | `/member/join` | BROKEN | HTTP 404 live when this doc was written. Corrected 2026-10-17: the page serves (200) since zingfisher PR #7; claiming a ZID still needs real sign-in and the database. In code it also needs a signed-in wallet, a handle, goals and a peer voucher (`pages/member/join.tsx:22-81`). |
| 6 | Attends and is ranked | Discord, v1 bot | HUMAN-DEPENDENT | A facilitator runs it. A session needs 4 people. Late joiners need an admin command. 3 of 11 people on 12 Oct were in no ranking. |
| 7 | Is recognised as new | v2 CLI | HUMAN-DEPENDENT | Someone must run the newcomers script. Nothing greets the person. |
| 8 | Respect is minted | OREC | BROKEN, HUMAN-DEPENDENT | v1's button lies; a person submits each room from one key; then 72 hours plus 72 hours; then a person executes. 18 awards recorded as missed. |
| 9 | Uses Respect for access | zingfisher `/learn` | GATED, UNCLEAR | The gate shows no wallet-connect button; a zero-Respect wallet is sent to the 404. Login needs Postgres. Corrected 2026-10-17: the join page now serves, and PR #9 adds a "Sign in with your wallet" button behind a switch that is off in production. |
| 10 | Votes on a ZIP | Snapshot `zaal.eth` | MISSING | No ZIP has ever been put there. No period or quorum is set. |
| 11 | Votes in OREC | `zao.frapps.xyz` | GATED | A ZOR-only holder (43 wallets) has no weight until the wrapper ships. |
| 12 | Proposes | zingfisher, OREC | GATED | Drafting needs Respect above 0. Publishing needs endorsements from peers whose Respect sums to 1,000 (`packages/config/src/zao.ts:148`, "1000 peer Respect endorsements"). Whether that bar is easy or hard to reach is UNKNOWN: this doc did not read the distribution of Respect across holders. |
| 13 | Cannot make the session time | - | MISSING | The async contribution path in `governance/1233-fractal-values-axis-design` is a July draft, never adopted. |

Read as a whole: a newcomer can read and comment, and can be ranked if they find the call and a facilitator is present. Every step after that runs through one person's wallet.

### 5. How a newcomer earns a first Respect: the options

| Option | Who does it | Evidence | Trade-off |
|--------|-------------|----------|-----------|
| Attend and be ranked | Optimism Fractal, Eden Fractal, The ZAO today | `optimismfractal.com/welcome`: groups of 3 to 6, every member of a consensus room earns at least 5 | Simplest and hardest to game. Needs a live host and a fixed hour. |
| One-time achievement mints (intro, socials, ZAO 101) | The ZAO, already ruled by Zaal on 2026-09-26 and already happening as intro mints of 110 | Proposals review of 2026-10-12 (private note) | Gives a first-day win. Needs the sybil guard of a real introduction, and a separate proposal per issue #27. |
| Sponsor or nomination by a holder | Hats allowlist eligibility; doc 1233 proposed 3 co-signers | Hats docs; `governance/1233-fractal-values-axis-design` | Strong sybil control. Puts load on existing members; not "anyone can join". |
| Async contribution submission | Planned at Optimism Fractal, Respect.Games "in testing" (2024, stale) | `gov.optimism.io/t/9617` | Fits musicians' hours. No published results anywhere found. |
| Observer tier with no token | Recordings, a Discord role | Optimism Fractal videos | Zero friction, a funnel into rooms. No voice. |

Recommendation: keep attend-and-rank as the core, and make the ruled achievements ledger the newcomer's first Respect. It is already decided, it is already being done by hand, and it gives someone who cannot attend on Monday a way in.

### 6. How a ZIP gets voted on: the options

| Option | Cost | Effort | Failure mode |
|--------|------|--------|--------------|
| Snapshot `zaal.eth`, OG + ZOR | Free on the networks not listed as premium; Optimism was not on Snapshot's premium list read 2026-10-13. Pro is 6,000 dollars a year if ever needed. | Low: the strategies are already set | Low turnout (Optimism Fractal's last 7 proposals drew 1 to 4 votes; The ZAO's median is 1). Signals only, executes nothing. |
| OREC proposal | Gas to propose, vote and execute | Medium | Wallet friction; 6 days end to end; ZOR-only holders excluded until the wrapper. |
| zingfisher native vote | Self-hosting | High | One ERC-20 only; unmaintained upstream. |
| Discord poll | Free | Trivial | Not weighted by Respect; no record. |

Snapshot stays the answer, as ruled. The risk it carries is turnout, not mechanics: a quorum set as a share of the active pool (the Season 3 ZIP's own rationale) is the open piece. Snapshot's strategies repository was archived on 2025-07-28 in favour of its Score API; the two strategies the space uses still serve, but a strategy change would go through the new API.

### 7. What comparable communities show

- **Facilitator dependence ends fractals.** Optimism Fractal ran 72 events with over 100 participants by its own count, then paused indefinitely on 2026-01-21 after an event with only the host present.
- **Published attendance is small and self-reported.** Genesis Fractal: 30 weeks, 138 unique people, an average reported variously as 32, 37 or 40. Eden Fractal: an average of 15 weekly over 78 weeks. The ZAO's 11 on 12 Oct is in range.
- **The on-chain submit step is a known bottleneck.** ORDAO's author writes that Optimism Fractal's council "quite regularly" had to pass proposals to pay rooms that lacked enough submissions (`sim31/ordao` `docs/OF_ORDAO_UPGRADE.md`).
- **Low turnout is normal, and not universal.** A study of 342 DAOs reports average participation near 6.3 percent (secondary read of SSRN 5168660 via arXiv 2511.09263). Contrary evidence: SNS DAOs on ICP show sustained or rising engagement over 20 months (arXiv 2507.20234, abstract only).
- **Onboarding programs convert about one in five.** An Arbitrum onboarding pilot had 86 participants over 16 calls and 17 contributed meaningfully (2024-08-02, more than 6 months old).
- **Self-claimed roles exist.** Hats Multi Claims Hatter lets an eligible wallet claim a hat with no admin call; the ERC-1155 eligibility module is third-party code and would need review.

### 8. Stale or contradicted in our own library

- Two ZIP numbering schemes: ZIP-001 to 006 in `governance/1207-zao-improvement-proposals-framework` and `governance/1233-fractal-values-axis-design`, against ZIP-1, ZIP-2 and zip-0000 in zao-papers.
- Two season counts: "Season 3" in the papers, "Season 9" and "Season 10" in `governance/1481-zao-fractal-season-plan` and `governance/1691-fractal-contribution-request-protocol`.
- `governance/696-respect-fractal-lineage-summary` and doc 981 still describe the 2 percent weekly decay that was ruled out on 2026-09-26.
- `zingfisher/research/006-project-status.md` (last validated 2026-06-15) still describes a $ZABAL gate; the code says $ZABAL confers nothing.
- `zao-fractal-bot/README.md` says subsystem 1 is "LIVE ... Active in production"; its own runbook says nothing has run outside a laptop.
- One private lane brief was last seen still giving 1 November as the start date.

## Also See

- [Doc 2656 - The ZAO as one system](../2656-zao-core-system-map/)
- [Doc 2657 - Respect as the binding token](../2657-respect-binding-token-design/)
- [Doc 2642 - How ZAO holders can approve a ZIP](../2642-zao-holder-approval-systems-inventory/)
- [Doc 2562 - ZAO Fractal state and build plan](../2562-zao-fractal-state-and-build-plan/)
- [Doc 2419 - ZID state and signup spec](../../identity/2419-zid-state-and-signup-spec/)
- [Doc 1233 - Fractal values axis design](../1233-fractal-values-axis-design/)
- Tracker task research-doc-2656 (todo, due 2026-10-13) - Review research doc 2656

## Next Actions

Ranked. "Lane" rows ship as ready PRs with no tap from Zaal beyond the merge. "Zaal" rows need his hand.

### A lane can ship by PR

| # | Action (done when) | Owner | Type | By When |
|---|--------------------|-------|------|---------|
| 1 | DONE 2026-10-13, differently: `/member/join` itself was fixed (zingfisher PR #7), so the button was not repointed. Done when the button on the live `/learn` no longer reaches a 404: re-checked 2026-10-17, 200. | zao-core lane | PR to zingfisher | 2026-10-15 |
| 2 | Apply the drafted amendment to `zips/zip-0000-season-3.md`: rolling 90 days in the abstract, Open Item 5 closed by the 2026-10-10 vote-weight ruling, 1 December stated (done when the PR is merged) | zao-core lane | PR to zao-papers | 2026-10-16 |
| 3 | Write the ZIP path as one page: draft and discuss in zingfisher, vote in Snapshot `zaal.eth`, on-chain actions to OREC, with the proposed period and quorum (done when the PR is merged) | zao-core lane | PR to ZAOOS research | 2026-10-20 |
| 4 | Measure how many holders it takes to reach 1,000 Respect of endorsements, from the current holder balances, and refresh `research/006`; propose a change to `packages/config/src/zao.ts:148` only if the measurement shows the bar is out of reach (done when the measurement is in a merged PR) | zao-core lane | PR to zingfisher | 2026-10-22 |
| 5 | Correct the bot README's "LIVE in production" line and fold the v1 button warning into the facilitator run-sheet (done when the PR is merged) | fractal bot v2 lane | PR to zao-fractal-bot | 2026-10-17 |
| 6 | Send the thezao lane the three site fixes: one front door, a link to `/learn`, "Optimism" for Respect (done when that lane's PR is open) | zao-core lane to thezao lane | Handoff | 2026-10-15 |
| 7 | Write "start here in five minutes": what Respect is, when the sessions are, what to bring, what happens after (done when it is live on `/learn`) | zao-core lane | PR to zingfisher | 2026-10-24 |
| 8 | Per-week ledger of meeting, proposal, execution and mint, so the streak claim has one number (done when the ledger note exists) | fractal audit lane | Note | 2026-10-20 |
| 9 | Mark the stale library docs: decay in 696 and 981, the two numbering schemes, the season count (done when the PR is merged) | zao-core lane | PR to ZAOOS research | 2026-10-27 |
| 10 | Spec a welcome message and first-timer mint as a separate proposal, on top of `npm run newcomers` (done when the spec PR is merged; no deploy) | fractal bot v2 lane | PR to zao-fractal-bot | 2026-10-29 |

### Needs Zaal's hand

| # | Action (done when) | Owner | Type | By When |
|---|--------------------|-------|------|---------|
| 1 | Finish the zingfisher Postgres sitting, steps A0 to B3 of the schema page (done when `zingfisher_tables` reads about 195 and `public_tables` is unchanged) | Zaal, with the zao-core lane | SQL editor | 2026-10-14 |
| 2 | Hold the manifesto capture session (done when a recording or transcript exists for the meeting skill to turn into text) | Zaal | Calendar | 2026-10-24 |
| 3 | Get an outside Solidity reviewer committed for the OG + ZOR wrapper (done when a reviewer has agreed; the Season 3 ZIP says the season moves if none does) | Zaal | Outreach | 2026-10-17 |
| 4 | Rule the bot submit path: v2 creates the OREC proposal from a dedicated key, or the human path stays (done when recorded in decisions) | Zaal | Grill | 2026-10-17 |
| 5 | Set the voting period and quorum on Snapshot `zaal.eth`, then open the ZIP-system ZIP as the test vote (done when one ZIP proposal is live in the space) | Zaal | Snapshot settings | 2026-10-31 |
| 6 | Re-propose the 18 missed awards (done when the proposals are on ornode) | Zaal | OREC | 2026-10-20 |
| 7 | Name a host rota for Monday and Tuesday and the minimum room size (done when the rota is posted in Discord) | Zaal | Message | 2026-10-24 |
| 8 | Go or no-go on 1 December, given rows 2 and 3 (done when recorded in decisions) | Zaal | Grill | 2026-11-10 |
| 9 | Wallet-free sign-in through Privy: decide whether to scope it for after launch (done when recorded in decisions) | Zaal | Grill | 2026-12-08 |

## Sources

Status is FULL (content read), PARTIAL (what is missing) or FAILED (what was tried). Method is how it was read. "Re-checked" means the parent ran it again on 2026-10-13.

**Live surfaces of The ZAO**
- [zingfisher /learn](https://zingfisher-webapp.vercel.app/learn) - FULL, curl + HTML strip; status re-checked (200)
- [zingfisher /member/join](https://zingfisher-webapp.vercel.app/member/join) - FULL, curl; re-checked (404 on 2026-10-13, 200 on 2026-10-17)
- [thezao.com](https://www.thezao.com/) - PARTIAL, curl; button targets not extracted
- [test.thezao.com](https://test.thezao.com) - FULL, curl; `/learn` and `/join` re-checked (404)
- [zaofractal.vercel.app](https://zaofractal.vercel.app) and [/whitepaper](https://zaofractal.vercel.app/whitepaper) - FULL for the index, chapter bodies not read
- [context.thezao.com/thezao](https://context.thezao.com/thezao) and [/fractal](https://context.thezao.com/fractal) - FULL, curl
- [Snapshot space zaal.eth](https://snapshot.org/#/zaal.eth) - FULL via `hub.snapshot.org/graphql`; re-checked
- [zao.frapps.xyz](https://zao.frapps.xyz) - FAILED: curl returned an empty React shell, exa fetch errored, Playwright timed out
- [luma.com/zao](https://luma.com/zao) - PARTIAL: frame only, event list renders client-side
- [zaoos.com](https://zaoos.com) - PARTIAL: title only

**Repositories**
- [sim31/orfrapps frapp.json for The ZAO](https://github.com/sim31/orfrapps/blob/main/fractals/zaof/frapp.json) - FULL, `gh api`; re-checked
- [sim31/ordao](https://github.com/sim31/ordao) - FULL, `gh api`: README, LICENSE file (GPL-3.0), last commit 2026-04-02, 17 open issues
- [sim31/ordao issue #27](https://github.com/sim31/ordao/issues/27) - FULL, `gh api`; re-checked (open, 2026-02-23)
- [sim31/ordao OF_ORDAO_UPGRADE.md](https://github.com/sim31/ordao/blob/main/docs/OF_ORDAO_UPGRADE.md) - FULL, `gh api`
- [charmverse/app.charmverse.io](https://github.com/charmverse/app.charmverse.io) - FULL, `gh api`: LICENSE file (AGPL-3.0 or commercial, trademark clause), last commit 2025-10-18, 28 forks
- [snapshot-labs/snapshot-strategies](https://github.com/snapshot-labs/snapshot-strategies) - FULL, `gh api`: archived, README notice dated 2025-07-28, MIT
- [Hats-Protocol/multi-claims-hatter](https://github.com/Hats-Protocol/multi-claims-hatter) - FULL, `gh api`: MIT, last push 2025-01-30
- [Hats-Protocol/hats-protocol](https://github.com/Hats-Protocol/hats-protocol) - FULL, `gh api`: AGPL-3.0, last push 2024-07-23, older than 6 months
- `bettercallzaal/zao-papers`, `bettercallzaal/zingfisher`, `bettercallzaal/zao-fractal-bot` - FULL, `gh api` and local read at the paths cited

**Documentation**
- [Snapshot voting strategies](https://docs.snapshot.box/user-guides/voting-strategies.md) - FULL, curl. Contradiction: this page says up to 8 strategies free, the [create page](https://docs.snapshot.box/user-guides/create) says 4
- [Snapshot networks FAQ](https://docs.snapshot.box/faq/networks.md) - FULL, curl; Optimism not on the premium list read 2026-10-13
- [Hats docs](https://docs.hatsprotocol.xyz) - FULL for ERC-1155 eligibility, claimable hats, Snapshot, Guild and Collab.Land pages; the ERC-20 eligibility page was not read
- [Optimism Fractal welcome guide](https://optimismfractal.com/welcome) - FULL, curl

**Community and forums**
- [Optimism Fractal, Respect Game research thread](https://gov.optimism.io/t/optimism-fractal-respect-game-research-into-democratic-fund-distribution/9617) - FULL, Discourse JSON
- [gov.optimism.io topic 9924](https://gov.optimism.io/t/9924) - FULL, Discourse JSON (2025-05-15)
- [gov.optimism.io topic 10208](https://gov.optimism.io/t/10208) - FULL, Discourse JSON (2025-08-08)
- [Arbitrum onboarding pilot](https://forum.arbitrum.foundation/t/26046) - FULL, Discourse JSON (2024-08-02, stale)
- [Parallel PGP-32 on Snapshot pricing](https://gov.parallel.best/t/pgp-32-parallel-snapshot-subscription/485) - FULL, Discourse JSON (2025-07-23)
- Snapshot proposal "Indefinite Hiatus for Optimism Fractal", space `optimismfractal.eth` - FULL via hub GraphQL; re-checked
- Reddit - FAILED: the Reddit fetch script had no credentials; the browser fallback was not tried
- Hacker News - FAILED to find anything: 6 queries on `hn.algolia.com`, control query worked, no relevant thread

**Papers and reports**
- [arXiv 2511.09263](https://arxiv.org/pdf/2511.09263) - FULL (PDF); source of the 6.3 percent figure as a secondary read of SSRN 5168660, which was not opened
- [arXiv 2407.10945](https://arxiv.org/abs/2407.10945) - PARTIAL, abstract only
- [arXiv 2507.20234](https://arxiv.org/abs/2507.20234) - PARTIAL, abstract only
- [Genesis Fractal history](https://edencreators.com/genesisfractal) and [Optimystics fractal history](https://optimystics.io/blog/fractalhistory) - PARTIAL: pages loaded, the averages quoted come from search highlights
- [Water and Music on web3 onboarding for music fans](https://www.waterandmusic.com/behind-the-headlines-analyzing-web3-onboarding-strategies-for-music-fans/) - PARTIAL: snippet read, undated

**Not searched:** X threads, CharmVerse's own X or Discord, RnDAO, Other Internet, Metagov, Google Drive, Notion, The ZAO's Discord, and any live on-chain read.
