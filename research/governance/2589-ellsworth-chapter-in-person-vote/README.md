---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-05
superseded-by:
related-docs: "governance/1617-zaostock-fractal-live-governance-guide, governance/1568-fractal-governance-proposal-template, governance/1540-governance-session-archive-template, governance/1307-hats-protocol-zao-org-chart, governance/2562-zao-fractal-state-and-build-plan, governance/2558-dao-periodic-reactivation-precedent, events/986-ellsworth-local-intel-zaostock, business/1031-zaostock-why-ellsworth-why-this-model"
original-query: "[STANDARD] ZAO Ellsworth: a local ZAO chapter in Ellsworth, Maine where anyone can participate and propose online, but only people physically present at the meeting can vote. Precedents, mechanisms (proof of presence), risks, and a one-page spec. (Zaal, 2026-10-05, verbatim idea: \"i wanna make zao ellsworth its this idea with the ability for anyone to particiapte and suggest governance but you ahve to phyisically be ther ein the meeting to make a vote so online people can not participate in voting\")"
tier: STANDARD
---

# 2589 - ZAO Ellsworth: A Chapter Where Anyone Proposes and Only People in the Room Vote

> **Goal:** Test Zaal's 2026-10-05 idea against precedent, name the proof-of-presence mechanism that actually resists proxy and remote voting, list the risks, and give a one-page spec plus a pilot plan, with every unknown marked as a question for Zaal.

Note on the source: the request cites a vault file `decisions/grill-2026-10-05-zao-ellsworth-idea.md`. It was not present under `~/zao-vault/decisions/` on this machine when this doc was written (searched `decisions/` and a 4-level `find ~` by name; neither returned it). The quote above is taken from the research request.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | What is the thing | **BUILD ZAO Ellsworth as a private chapter (a members' association), not a government.** It binds only the chapter's own money, events and charter. It never claims authority over the City of Ellsworth. | Ellsworth is a city with a 7-member council elected to 3-year terms and a city manager, not a town-meeting municipality. A chapter cannot sit beside that structure; it can only be a civic-minded club. |
| 2 | The vote rule | **ADOPT "present at the roll call, in person, one person one vote, paper or hand count." Make the sign-in the only gate.** | Town meeting, coop general assemblies and Quaker business meetings all share one property: the decision is made by people in one room at one time. That is the oldest working version of Zaal's rule. |
| 3 | Proof of presence | **USE a clerk-witnessed paper sign-in (name plus ID glance) as the legal record, then let the clerk issue an onchain presence attestation (EAS on Base) after the meeting as a convenience record.** Do NOT use a POAP, a door QR, or a wallet balance as the gate. | A QR code or claim link can be photographed and sent to someone at home; a POAP held at snapshot time proves someone attended earlier, not that they are in the room now. A human who sees the person cannot be forwarded a link. |
| 4 | Online people | **LET anyone, anywhere, propose, comment, watch the livestream, and cast a clearly labeled non-binding straw poll.** Only the in-room tally counts. | Gives online people a real voice without breaking the rule. Straw poll is a question for Zaal (Q3) because it can blur the rule. |
| 5 | Legal shell | **ASK a Maine attorney before the first binding vote, and write bylaws that ban proxies.** | Maine's nonprofit act (13-B) lets members vote by proxy unless the bylaws say otherwise, and lets a board authorize remote voting. A chapter that does nothing inherits proxy voting by default. |
| 6 | Respect and ZOLs | **KEEP chapter votes one person one vote. Do not weight by Respect or ZOLs.** Do not mint ZOLs for attendance in the pilot. | Weighting by a token invites the capture the in-person rule is meant to prevent, and Season 3's OG-versus-ZOR vote-weight question is still open (doc 2562). |
| 7 | Pilot | **RUN one low-stakes meeting in the week of 9 Nov 2026 (default Sat 14 Nov) after the 1 Nov Season 3 launch.** Three motions only: adopt the charter, elect a clerk and a moderator, set the next meeting. | Proves the sign-in, the tally and the livestream before any money is on the table. |

## Findings

### 1. Is Ellsworth a town meeting? No.

| Fact | Evidence |
|---|---|
| Ellsworth has 7 City Council members elected to 3-year terms; the council runs municipal affairs except as the Charter provides | City of Ellsworth council page (fetched 2026-10-05) |
| Ellsworth has a City Manager and its Wikipedia infobox lists the city-manager office | City site nav and Wikipedia (fetched 2026-10-05) |
| Maine's town-meeting system dates from when Maine was part of Massachusetts; "most cities and towns" use town meeting or a modified form | Wikipedia "Town meeting", Maine section |
| Under 30-A MRSA 2524(1), "every voter in the town may vote ... in all town affairs"; ballots are uniform paper with yes/no squares and the moderator makes sure each voter gets one ballot per vote | Maine Revised Statutes 30-A 2524 (fetched 2026-10-05) |
| Voters can force a meeting: if the select board unreasonably refuses, a notary may call it on petition of 10% of the last gubernatorial vote count, never fewer than 10 voters | 30-A MRSA 2521(4) |

So "town meeting" is a precedent to borrow from, not a model Ellsworth itself uses. Two differences matter. Town meeting limits the vote to registered local voters; ZAO Ellsworth's rule is presence, not residence. And town meeting has legal force; the chapter has none over the City.

**Contrast worth designing around:** the City of Ellsworth's own council adopted a Remote Participation Policy on 2022-08-15 under 1 MRSA 403-B. Council members are "expected to be physically present," but remote members may take part, are counted for quorum, and vote by roll call that the public can see and hear. Remote participation is never text-only. So the City allows remote votes in emergencies, and the chapter is stricter on purpose. The public-facing consequence: some Ellsworth residents will assume remote voting is normal because their own council permits it. Explain the difference up front (Q8).

### 2. Precedents, what each one gives the chapter

| Precedent | What it does | What ZAO Ellsworth should steal | What to leave behind |
|---|---|---|---|
| New England and Maine town meeting | Voters decide in one room; a moderator elected by written ballot presides; the clerk records votes; a warrant (notice) calls the meeting | The moderator plus clerk split, a posted warrant, uniform paper ballots, a petition path (10% or a floor of 10) to force an item onto the agenda | Residence test for voting; once-a-year cadence |
| Cooperatives, general assembly | One member, one vote has been the rule since the friendly societies; boards are held to account at an annual general meeting | One member one vote regardless of stake; a yearly accountability meeting | Proxy and mail ballots, which are standard in large coops and are exactly what the chapter bans |
| Quaker business meeting | Clerk prepares the agenda and records the "sense of the meeting"; silence before business; non-members must ask the clerk's permission to attend a business meeting | A clerk who serves the meeting, a stated rule for visitors, a quiet start | Unity/consensus rule: too slow for a chapter that wants a clear yes/no count |
| Sociocracy | Decisions by consent (no reasoned objection), organized in circles with double-linking between them | Consent for low-stakes items (venue, date); a link between the chapter and the main ZAO fractal | Full circle structure; overkill at pilot size |
| Participatory budgeting | Residents decide a slice of a public budget; practiced in Porto Alegre since 1989; later added online voting in Paris, New York City, Lisbon, Madrid and Mexico City | The pattern of a small, real budget decided by people who show up | Online voting; the literature on it is thin (Wikipedia notes effects "have not been widely researched") |
| The ZAO's own fractal | Weekly Respect Game on Telegram voice or Juke; ZAOstock 3 Oct 2026 planned a hybrid IRL plus remote session where IRL presence carried the highest weight | A facilitator, a posted agenda, a pre-session log, an archive template (docs 1475, 1561, 1540) | Weighting by presence; Ellsworth makes presence binary |

### 3. DAO and onchain experiments with in-person voting

| Experiment | What happened | Lesson for the chapter |
|---|---|---|
| AlloIRL at GFELxBoulder (Feb 2025 post) | 6 grantees each got an NFC plus QR card; attendees scanned to allocate a $5,000 pool; 208 vote allocations from 75 users over about 2 hours; web2 sign-in by email with Ethereum attestations on the backend | NFC cards "worked better than expected." Failures: attendees who were not on the Luma list had no path in, and an ad hoc reset corrupted the database. Plan the non-allowlisted walk-in and a tested reset. |
| POAP Vote (ETHGlobal, 200+ attendees) | Open framework: one POAP, one vote, signed message, no gas | Sybil resistance is only as strong as how the POAP was issued; GPS and QR claims can be gamed (POAP glossary). |
| Snapshot POAP strategy | Counts POAPs held by an address as voting power; POAPs are ERC-721 tokens minted on Gnosis chain | A snapshot reads wallet state, not the room. It cannot enforce "present now." |
| Birdbrain referendum 665 on Kusama (a proposal, outcome not checked) | Attendance witnessed by the others in the session; a Merkle root of attendees is anchored onchain; a checker refuses one person with two accounts; the authors call it "falsifiable, not trustless" | Witnessing by people in the room is the real control; the chain only preserves the record. One human, two wallets is the failure to design against. |
| EAS "empowering communities" post | Attestations can record membership, authorization and votes; the authors warn not everyone has a wallet | Keep a paper path so a person without a wallet can still vote. |

Community source (Hacker News, "Ask HN: How to run a remote election for a society?", 2021-01-06, 1 point, 1 comment): a volunteer running a binding charity-society election for 30 to 70 non-technical voters listed the same needs the chapter has (one vote each, results in minutes, two people sharing a device). The poster's own candidate fixes were a Zoom breakout poll and a hand-checked voter list. Thin evidence, but it matches the pilot scale.

### 4. Proof-of-presence mechanisms against proxy and remote voting

Rated for how well each stops (a) a proxy voting for an absent person, (b) a remote person voting live, (c) one person voting twice.

| Mechanism | Stops proxy | Stops remote | Stops double vote | Cost and friction | Verdict |
|---|---|---|---|---|---|
| Clerk sign-in sheet with an ID glance | Strong (a human sees the person) | Strong | Strong (one name, one ballot) | Paper, 1 to 2 volunteers | USE as the legal record |
| Paper ballot handed out at the sign-in desk | Strong | Strong | Strong (one ballot per name, as in 30-A MRSA 2524(5)) | Hand count, 10 to 20 minutes | USE for binding votes |
| Door QR code | Weak | Weak (photo can be forwarded) | Medium | Phones | Skip as a gate; fine as a convenience check-in |
| Rotating QR shown only in the room | Medium | Medium (a friend in the room can relay it) | Medium | Phones, screen | Optional layer |
| NFC card or wristband, one per signed-in person | Medium | Strong | Strong | Cards to buy; AlloIRL says it worked well | OPTIONAL for year 2 |
| POAP claimed at the door | Weak | Weak | Medium | Wallet needed | Use only as a souvenir record |
| EAS attestation on Base issued by the clerk after the roll call | Strong if the clerk witnesses | Strong | Strong if one attestation per person per meeting | Wallet plus gas; Base EAS contract per the MissionEnrollment repo is `0x4200000000000000000000000000000000000021` | USE as the portable record, not the gate |
| Hats role | Not a presence proof | n/a | n/a | Hats tree 226 already exists (`src/lib/hats/constants.ts`) | USE for roles: Clerk, Moderator, Member |

Two rules follow from the table. First, tie presence to the vote moment, not to a past event. Second, a person who can see the voter beats any code the voter can forward.

### 5. How online people propose, discuss and watch without voting

| Surface | Job | Detail |
|---|---|---|
| Farcaster channel (name to confirm; ZAO already posts governance archives to the /zao channel per doc 1617) | Propose and discuss | A proposal is a cast using the doc 1568 template; thread stays open until 24 hours before the meeting |
| Posted warrant (agenda) | Notice | Post at least 10 days ahead. If the chapter incorporates, Maine 13-B 603 sets default notice at 10 to 50 days, so 10 days is the safe floor |
| Livestream | Watch | Restream is the ZAO workshop default; parklet upload speed is still unmeasured per the vault blackboard, so test on the venue's wifi first |
| Online straw poll | Voice, non-binding | Closes 1 hour before the gavel, shown to the room, labeled ADVISORY, never added to the tally |
| Written comment read aloud | Voice | Moderator reads the top 3 online comments per motion |

### 6. Risks and mitigations

| Risk | Detail | Mitigation |
|---|---|---|
| Exclusion: disability | A strict in-person rule excludes people who cannot travel or enter the venue | Accessible venue is a hard requirement; allow an assistant to carry a ballot in person; ADA and Maine Human Rights Act review by counsel (Q6); designate a satellite "polling room" with its own clerk as a later option |
| Exclusion: work schedules | Hospitality and fishing-season shifts clash with fixed times | Rotate weekday and weekend slots; run the vote in a 2-hour window; evaluate a one-week early-vote desk (Q7) |
| Capture by whoever shows up | A bus of 30 outsiders can outvote 12 locals; the chapter's rule counts presence, not residence | Quorum floor; two-thirds for money or charter changes; second-meeting rule for those motions (a voter must have signed in at one earlier meeting); clerk may log ZIP for transparency, not for eligibility |
| Quorum | Too low invites capture; too high stalls | Pilot default: 9 voting members present. Maine 13-B 605 defaults to 1/10 of votes if bylaws are silent, so write a number in |
| Proxy by default | 13-B 604(2) allows proxy voting unless articles or bylaws otherwise provide | Bylaw: "No proxy, no mail, no electronic vote on binding motions" |
| Legal status | Unincorporated, a Maine nonprofit corporation, or a project of an existing ZAO entity; each changes liability and records exposure | Counsel review before first binding vote (Q5). Not legal advice |
| Minors | Venue may be a bar (Black Moon) | Voting age 18; minors can attend where the venue allows, propose, and join the straw poll; pick an all-ages venue for the pilot |
| Privacy of attendee lists | A paper sign-in names real people; an onchain attestation is public by default | Collect name only; store the sheet with the clerk; post counts, not names; use pseudonymous or offchain attestations; ask counsel whether public-record rules reach the chapter if it partners with the City (Q6) |
| Wallet-less members | Not everyone has a wallet (EAS post) | Wallet optional; paper sign-in is the record of truth |
| Confusion with City government | Residents may think this is official | Name it "ZAO Ellsworth chapter," state in every notice that it does not act for the City |
| Spoofed remote attendance | A person streaming themselves "in the room" | Roll call by the clerk, who sees faces |

### 7. Venue candidates in the ZAOstock network

| Venue | Evidence | Fit | Open question |
|---|---|---|---|
| Franklin Street Parklet | ZAOstock venue; run by City Parks, Recreation and Facilities, director Roddy Ehrlenbach (doc 986) | Outdoor and seasonal; City page says seasonal park facilities close 2026-10-18 | Is the parklet covered by that date? Weather in November: likely poor |
| Black Moon Public House | ZAOstock after-party venue next door; curates the Thursday series (doc 986; zaostock `content/pitch-pack/README.md`) | Strong partner; a bar, so minors are an issue | Private room, daytime hours, wifi (the Black Moon wifi test card is still open on the blackboard) |
| State Street Makerspace (Heart of Ellsworth) | Run by Heart of Ellsworth; in its "advancement phase" and seeking partners (doc 986) | Indoor, community-owned, fits an all-ages meeting | Capacity, accessibility, rental terms: not yet asked |
| The Grand | Across the street from the parklet; ZAOstock has a cross-promo relationship (zaostock outreach) | Large hall; likely too big and costly for a pilot | Terms unknown |
| Moore Community Center, Ellsworth Public Library | Listed in the City site navigation only; no ZAO contact on file | Free civic rooms are the town-meeting norm | Never contacted: treat as untested |

### 8. One-page spec (defaults, all changeable)

| Item | Default |
|---|---|
| Name and scope | ZAO Ellsworth chapter. Binds chapter funds, events, charter and its own roles only. No authority over the City. |
| Participants (anyone) | May propose, comment, watch, join the advisory straw poll. No sign-up beyond a Farcaster or email handle. |
| Voting members | Age 18 or older, signed in by the clerk, in the room at the roll call. One person, one vote. No proxies, no mail, no remote, no weighting by Respect or ZOLs. |
| Proposal flow | Submit online with the doc 1568 template; needs 3 endorsements from any participants; deadline 14 days before the meeting; warrant posted 10 days before; discussion thread closes 24 hours before; floor amendments by present members only. |
| Meeting cadence | Monthly after the pilot, rotating weekday and weekend slots; one annual meeting for officers and budget. Pilot: Sat 14 Nov 2026, 2 pm, 90 minutes. |
| Roles | Moderator (elected at the start of each meeting, as in 30-A MRSA 2524), Clerk, Tally Teller. Held as Hats under tree 226 for the term. |
| Quorum | 9 voting members present. |
| Vote rule | Simple majority of those present; two-thirds for charter changes or spending chapter funds; motions that spend money or change the charter need voters who signed in at one earlier meeting. Hand count, paper ballot on request of 3 members. |
| Recording | Paper sign-in and tally signed by moderator and clerk; minutes posted within 48 hours; clerk issues one EAS attestation per attendee on Base and a minutes-hash attestation (schema: meetingId, motionId, yes, no, abstain, presentCount, minutesHash); archive using the doc 1540 template. |
| Ties to ZAO | Chapter sends a summary to the weekly fractal; ZOL awards for chapter work are proposed as motions like any other. No automatic Respect or ZOL from attendance in the pilot. |
| Pilot | See section 9. |

### 9. Pilot plan for the first meeting

| Step | Date | Done when |
|---|---|---|
| Decide the open questions below | by 2026-10-12 | Zaal answers in a grill; decision file in vault |
| Book a venue; confirm accessibility | by 2026-10-19 | Written yes from the venue |
| Counsel call: proxy ban, quorum text, records exposure, minors | by 2026-10-26 | One-page memo filed |
| Draft charter and warrant; open the Farcaster channel | by 2026-10-31 | Channel live; warrant draft in the doc repo |
| Post the warrant (10 days ahead) | 2026-11-04 | Public post with proposal deadline and livestream link |
| Dry run of sign-in, tally and livestream | 2026-11-11 | 3 volunteers complete a mock vote in under 15 minutes; stream uptime tested on venue wifi |
| Meeting: 3 motions (charter, officers, next meeting) | 2026-11-14 | Signed tally; minutes posted within 48 hours; attestations issued |
| Retro | 2026-11-21 | Short note with headcount, minutes per vote, complaints, whether online comment was used |

Measure at the pilot: headcount signed in, how many were first-timers, how many online comments were read, time per vote, anyone turned away.

## Questions for Zaal (every unknown)

| # | Question | Default if no answer | Why it matters |
|---|---|---|---|
| Q1 | What does the chapter vote on: only its own money and events, or also positions it will tell the City? | Own money, events and charter only | Sets legal risk and capture stakes |
| Q2 | Presence not residence: may non-residents vote, or must voters live in Hancock County? | Presence only, residence logged for transparency | Largest capture risk |
| Q3 | Is a non-binding online straw poll allowed, or does it blur "online people cannot vote"? | Allowed, labeled ADVISORY | Keeps online people engaged |
| Q4 | Who is the legal entity: new Maine nonprofit, unincorporated, or a project of an existing ZAO entity? | Unincorporated for the pilot, nonprofit after | Liability and records |
| Q5 | Can a Maine attorney be paid for one hour before the pilot? | Yes | 13-B defaults allow proxies |
| Q6 | Who answers the disability, minors and public-records questions? | Counsel, same call | Exclusion risk |
| Q7 | Add an early-vote desk (any of several sessions in one week) for shift workers? | No for pilot; revisit after retro | Breaks "one room, one time" |
| Q8 | How to explain to residents why the chapter bans remote votes when the City council allows them? | One-line notice on every warrant | Avoids confusion |
| Q9 | Which venue and has anyone asked Heart of Ellsworth, Black Moon or the Makerspace? | the State Street Makerspace first, Black Moon fallback | None has been asked for this |
| Q10 | What is a realistic turnout? The outcome and attendance of the 3 Oct ZAOstock governance session was not searched here | Quorum of 9 | Quorum may be too high or low |
| Q11 | Does the chapter touch Respect or ZOLs at all in year one? | No | Season 3 vote-weight question is open |
| Q12 | Who is clerk and who is moderator, and are they Ellsworth residents? | Two local volunteers | The rule rests on them |

## Also See

- [Doc 1617 (governance/1617-zaostock-fractal-live-governance-guide)](../1617-zaostock-fractal-live-governance-guide/) - hybrid IRL plus remote session plan for 3 Oct
- [Doc 1568](../1568-fractal-governance-proposal-template/) - proposal template reused here
- [Doc 1540](../1540-governance-session-archive-template/) - archive template
- [Doc 1307 (governance/1307-hats-protocol-zao-org-chart)](../1307-hats-protocol-zao-org-chart/) - Hats roles
- [Doc 2562](../2562-zao-fractal-state-and-build-plan/) - Season 3 and the OG-versus-ZOR vote-weight issue
- [Doc 2558](../2558-dao-periodic-reactivation-precedent/) - outside precedent for re-activating voting rights
- [Doc 986 (events/986-ellsworth-local-intel-zaostock)](../../events/986-ellsworth-local-intel-zaostock/) - Ellsworth venues and Heart of Ellsworth
- Tracker pre-check (zao-tracker search) was not run; no tracker rows are cited.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer Q1 to Q4 and Q9 in a grill; shipped when a decision file exists in the vault | Zaal | Decision | 2026-10-12 |
| Ask Heart of Ellsworth for State Street Makerspace availability and accessibility details for 14 Nov; shipped when a written reply is in the vault | Zaal | Outreach | 2026-10-19 |
| Book one hour with a Maine attorney on proxy ban, quorum, minors and records; shipped when a one-page memo is filed | Zaal | Legal | 2026-10-26 |
| Draft charter, warrant and doc 1568 proposal form; shipped when a PR with the three files merges | Zaal | PR | 2026-10-31 |
| Create the EAS schema on Base Sepolia and issue 3 test attestations; shipped when 3 attestation UIDs are recorded | Zaal | Build | 2026-11-07 |
| Run the 11 Nov dry run; shipped when a timing note is in the vault | Zaal | Test | 2026-11-11 |

## Sources

- [FULL, method: curl plus HTML strip] [Ellsworth City Council - City of Ellsworth](https://www.ellsworthmaine.gov/city-council/) (fetched 2026-10-05) - 7 members, 3-year terms.
- [FULL, method: curl then pdftotext] [Remote Participation Policy, City of Ellsworth Council, adopted 2022-08-15](https://www.ellsworthmaine.gov/government/city-council/remote-policy-for-ellsworth-council/) - roll-call rule for remote members.
- [PARTIAL - the Charter text itself is not on the page; only the page chrome was read] [Ellsworth City Charter](https://www.ellsworthmaine.gov/government/city-charter/)
- [FULL, method: curl] [Maine 30-A MRSA 2524, General town meeting provisions](https://legislature.maine.gov/statutes/30-A/title30-Asec2524.html), [2521 Call of town meeting](https://legislature.maine.gov/statutes/30-A/title30-Asec2521.html)
- [FULL, method: curl] [Maine 13-B MRSA 602 Meetings of members](https://legislature.maine.gov/statutes/13-B/title13-Bsec602.html), [603 Notice](https://legislature.maine.gov/statutes/13-B/title13-Bsec603.html), [604 Voting](https://legislature.maine.gov/statutes/13-B/title13-Bsec604.html), [605 Quorum](https://legislature.maine.gov/statutes/13-B/title13-Bsec605.html) (statute pages extracted 2025-10-20 per the page footer)
- [FULL, method: curl] [Town meeting - Wikipedia](https://en.wikipedia.org/wiki/Town_meeting), [Quaker decision-making](https://en.wikipedia.org/wiki/Quaker_decision-making), [Sociocracy](https://en.wikipedia.org/wiki/Sociocracy), [Participatory budgeting](https://en.wikipedia.org/wiki/Participatory_budgeting), [Cooperative](https://en.wikipedia.org/wiki/Cooperative)
- [PARTIAL - search highlights only, full page not read] [AlloIRL: Experiments in IRL Democratic Capital Allocation](https://research.allo.capital/t/alloirl-experiments-in-irl-democratic-capital-allocation/221)
- [PARTIAL - search highlights only] [poapxyz/poap-vote](https://github.com/poapxyz/poap-vote)
- [PARTIAL - search highlights only] [Snapshot docs: POAP proof of attendance](https://github.com/snapshot-labs/snapshot-docs/blob/master/user-guides/spaces/space-handbook/nft-voting/poap-proof-of-attendance.md)
- [PARTIAL - search highlights only] [Polkassembly Kusama referendum 665 (Birdbrain)](https://kusama.polkassembly.io/referenda/665) - a proposal; outcome not checked
- [PARTIAL - search highlights only] [EAS: Empowering decentralized communities with attestations](https://paragraph.com/@ethereum-attestation-service/empowering-decentralized-communities-with-attestations)
- [PARTIAL - search highlights only] [daqhris/MissionEnrollment](https://github.com/daqhris/MissionEnrollment) - source of the Base EAS contract address; confirm against the official EAS docs before use
- [PARTIAL - search highlights only] [POAP glossary (ChainScore)](https://chainscorelabs.com/glossary/nft-technologies-and-metadata/dynamic-nft-architectures/proof-of-attendance-protocol-poap)
- [FULL, method: Algolia API] [Ask HN: How to run a remote election for a society?](https://news.ycombinator.com/item?id=25660034)
- [FAILED - not attempted] Reddit: no thread read; reddit is walled for headless fetches per the skill, and no selftest was run.
- Internal: ZAOOS `src/lib/hats/constants.ts` (TREE_ID = 226); vault `BLACKBOARD.md`; zaostock `content/pitch-pack/README.md`; docs 986, 1617, 2562.
- Not searched: attendance and outcome of the 3 Oct ZAOstock governance session; EAS official docs (the docs.attest.org fetch returned 30 bytes); Reddit.
