---
topic: governance
type: decision
status: research-complete
last-validated: 2026-10-05
superseded-by:
related-docs: "governance/2589-ellsworth-chapter-in-person-vote, governance/2590-ellsworth-zaostock-2027-assembly (PR #3718, not yet merged), governance/2562-zao-fractal-state-and-build-plan, governance/2563-per-project-respect-multi-ledger-design, governance/2558-dao-periodic-reactivation-precedent, governance/1783-bread-coop-primitives-into-zao, governance/056-ordao-respect-system, governance/1423-zao-optimism-fractal-governance-explainer, governance/1206-zao-comparative-dao-state-july2026, governance/1568-fractal-governance-proposal-template, governance/1617-zaostock-fractal-live-governance-guide, governance/1307-hats-protocol-zao-org-chart, business/1108-sparkz-legal-framing, events/986-ellsworth-local-intel-zaostock"
original-query: "[DEEP] DownEast ZAO: virtual capital formation with in-person, token-percentile-weighted governance (decile votes 1 to 10), weekly proposals, and a path from paper votes to fractal and onchain governance. Context (Zaal, 2026-10-05 17:57 EDT, verbatim, vault decisions/grill-2026-10-05-zao-ellsworth-idea.md item 2): \"perfect but its not just one proposal its weekly proposals ehre with capital forming from virutally but governance in person for the communityy so people can particiapte in the token part from anywherebut based on that token allocation to start and use that governacne to help decide how we will use fractal gvoernance to leverage onchain governacen other than a simple in person vote on paper to start and your governance is based on what percenttile you are in and up to 10 votes if top 10% and 1 vote if bottom 10% or just visiting in person as a guest of someone or soemthign that can be optional later that seems complicated lets tsart hingking about that also lets call it DownEast ZAO\""
tier: DEEP
---

# 2591 - DownEast ZAO: Virtual Money, In-Person Votes, and Decile Weights

> **Goal:** Test Zaal's 2026-10-05 redesign (name DownEast ZAO, weekly proposals, capital and token participation from anywhere, voting only in person, vote weight 1 to 10 by token-allocation decile, paper vote first) against securities and money-transmission law, voting-design precedent, small-town meeting practice and the ZAO fractal and onchain toolset, then give a phased plan with go/no-go gates and the questions only Zaal can answer.

**Not legal advice.** This is a research brief by a non-lawyer. Section 1 names where the design is most likely to trigger securities, money-transmission and Maine registration rules. A Maine securities lawyer must review before any money is raised or any token is sold or allocated for value.

**Ruling recorded after drafting (Zaal, 2026-10-05 18:26 EDT, vault `decisions/grill-2026-10-05-zao-ellsworth-idea.md` item 3):** the allocation is non-transferable DownEast points (earned, free or donated) with no financial return. Any tradable token is a later decision that needs a Maine securities lawyer first. This selects designs C, D, E and F in section 1.2 and removes designs A and B from the plan. Question 1 below is answered.

**Supersedes** the one-person-one-vote and "do not weight by Respect or ZOLs" lines in `governance/2589-ellsworth-chapter-in-person-vote` (Key Decisions rows 2 and 6) and the equivalent line in doc 2590 (PR #3718, open). The in-person rule, the sign-in as proof of presence, and the clerk-witnessed paper record in 2589 are kept.

## Key Decisions / Recommendations

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Can DownEast ZAO sell or allocate a token for money to anyone online, with holdings driving vote weight? | **DO NOT, until a Maine securities lawyer signs off on a named exemption.** Treat "buy a token online, get more votes, treasury run by the organizers" as the HIGH-risk design. | A buyer who pays money into a pooled treasury run by others, and is told or reasonably expects value to grow from the organizers' work, is the core Howey fact pattern. The SEC's 17 March 2026 interpretation (Release 33-11412) keeps Howey in force and says a non-security token becomes part of an investment contract when the issuer induces investment through representations or promises of managerial efforts. |
| 2 | What goes in the "token" bucket in Phase 1? | **START WITH A NON-TRANSFERABLE, NO-FINANCIAL-RIGHTS ALLOCATION: earned (Respect style), free (airdrop with no consideration) or donation-recorded points.** Add paid, tradable tokens only after a written legal opinion. | The same SEC release puts memberships, tickets, credentials and identity badges, "often non-transferable or soul-bound", in the Digital Tools category (not securities) and says an airdrop for no consideration involves no investment of money. Lower risk, still facts-and-circumstances. |
| 3 | Where the 1-to-10 weights come from | **COMPUTE DECILES OVER ALL ELIGIBLE REGISTERED PEOPLE (not wallets, not who is in the room), frozen at agenda lock 72 hours before the meeting, using the LOWER of the balance at lock and the balance 30 days earlier.** | Stops flash-buying and wallet-splitting. In a toy model, one 16 percent holder split into 60 wallets goes from 10 votes to 420 when weights are per wallet (Finding 2.4). Aggregating wallets per person at the door closes that hole. |
| 4 | Small-group collapse | **USE FLAT 1 VOTE EACH below 30 eligible people, QUINTILES (weights 2,4,6,8,10) from 30 to 99, DECILES from 100.** | With 12 holders, "deciles" produce 12 different weights (1,2,3,3,4,5,6,7,8,8,9,10) set by rank noise. With 30 they are 3 people per weight. |
| 5 | Plutocracy cap | **PASS ONLY IF IT WINS BOTH THE WEIGHTED TALLY AND THE HEADCOUNT for anything that spends treasury money or changes the charter.** Routine items need the weighted tally only. | A 10:1 spread already limits whales. A headcount key stops a top-decile bloc that flew in together from overriding the locals. Optimism runs the same idea as two houses (Token House coin vote, Citizens House one-person-one-vote). |
| 6 | Weekly cadence | **ONE 45-minute meeting per week, agenda locked 72 hours ahead, at most 3 binding items, quorum counted in PEOPLE PRESENT (default 7), a missed week rolls items forward and does not void them.** | Weighted quorum against a global holder list is unreachable when most holders are online. Headcount quorum matches town-meeting practice (doc 2589). |
| 7 | Online holders | **LET THEM PROPOSE, COMMENT, WATCH THE STREAM AND FUND. Do not give them any vote, including a binding straw poll.** Show straw-poll results only as a labelled advisory number. | Keeps Zaal's rule. Their power is agenda and money, the room's power is the decision. |
| 8 | The bridge | **PAPER FIRST (Phase 0, no token), THEN WEIGHTS ON PAPER (Phase 1), THEN FRACTAL AND ONCHAIN (Phase 2): weekly Respect game as agenda ranker, EAS attestation of the clerk's tally on Base, Safe for treasury execution, Hats for roles. Do not put the vote itself onchain.** | Each piece can fail without stopping the meeting. The legal record stays the signed paper tally until a lawyer says the onchain record can replace it. |
| 9 | Name | **USE "DownEast ZAO" everywhere.** | Zaal, 2026-10-05 17:57 EDT. Docs 2589 and 2590 still say "ZAO Ellsworth"; leave them and update on merge. |

## 1. Legal first (US federal, Maine, money transmission)

Surfaces read: the SEC interpretation as summarized by two law firms (Gibson Dunn, DWT), the SEC Regulation Crowdfunding page, Maine statutes 32 MRSA 16202, 16304 and 6074/6100-QQ pages, a Maine crowdfunding rule memo, FinCEN guidance FIN-2019-G001, and the Greenberg Traurig alert on the SEC's August 2026 proposal. Not read in full: the SEC release text itself (sec.gov refuses scripted fetches), the Maine definitions section for "virtual currency business activity", Rule 506(c) and Regulation A pages on sec.gov (taken from search highlights).

### 1.1 What changed in 2026 (current as of 2026-10-05)

| Date | Event | Effect on DownEast ZAO |
|------|-------|------------------------|
| 2026-03-17 (effective 2026-03-23) | SEC and CFTC Release 33-11412 (File S7-2026-09): five-category token taxonomy (digital commodities, collectibles, tools, payment stablecoins, digital securities); supersedes the SEC staff's April 2019 Framework for investment-contract analysis | Howey still decides. The release narrows the "efforts of others" inquiry to the issuer's representations or promises of essential managerial efforts. What DownEast ZAO says in posts, a website and a pitch is the legal fact. |
| 2026-08-18 | SEC proposes "Regulation Crypto Assets" (402 pages): a startup exemption (up to $5M, up to 4 years, retail allowed, general solicitation allowed, no per-investor cap, issuer need not be a US entity), a fundraising exemption (Tier 1 up to $20M, Tier 2 up to $75M per 12 months, Form 1-CRYPTO, non-accredited limit 10 percent of income or net worth), an investment-contract safe harbor (Rule 400) and preemption of state registration | PROPOSED ONLY. 60-day comment period runs from Federal Register publication; the closing date was not found. Cannot be relied on. If adopted, the startup exemption is the closest fit to a small virtual raise, with disclosure duties (Rule 103) and a filing (Form NOR) attached. |
| 2026-09-15 | Senate cloture vote on the CLARITY Act (market structure) failed to reach 60; Thune entered a motion to reconsider | No statute yet. The taxonomy and the proposal are agency positions that a later SEC or a court can change. |

### 1.2 Design-by-design risk table

| # | Design | Securities risk | Money transmission and state risk | Verdict |
|---|--------|-----------------|-----------------------------------|---------|
| A | Sell a transferable DownEast token to anyone online, votes by holdings, treasury run by the organizers for local projects | HIGH. Investment of money, pooled treasury, buyers look to organizers' efforts, secondary trading invites a profit expectation. A "governance token" label does not decide it. | Medium to high: taking and moving other people's funds and crypto at scale; Maine licenses "virtual currency business activity" as money transmission (32 MRSA 6100-QQ). Every buyer's home state also has blue-sky rules unless a federal exemption preempts them. | AVOID. |
| B | Design A plus any promise of revenue share, buyback, price support, "the town will grow and token will too" | VERY HIGH. The release says a security is a security "regardless of whether it is issued, or otherwise represented, offchain or onchain". | As A. | NEVER. |
| C | Sell NON-transferable governance points as membership dues, no financial rights, no resale, funds spent on events, written "no profit" terms | LOWER but not zero. Matches the Digital Tools description; weak point is marketing language and any later move to make points tradable. | LOWER: dues for a membership, not transmission for others. Still ask counsel about card processing and any crypto receipt. | CANDIDATE after counsel. |
| D | Donation-based: online funders give money to a treasury, a ledger (off chain) records donations, donation percentile feeds the in-room weight, no token issued | LOWER. No security issued, gift intent. Risk rises if funders are told the weight will pay back or if the weight is tradable. Tax treatment of the donation is a separate question for counsel. | LOWER if funds go to the entity's own bank account. | CANDIDATE after counsel. |
| E | Earned, not bought (Respect-style, ZOLs): allocations come from showing up, weekly fractal sessions and contributions | LOWEST. Nothing is invested. Respect is soulbound by contract (doc 056). | LOWEST. | SAFEST. Does not by itself raise capital. |
| F | Free airdrop of a token to registered participants with no consideration | LOW for the airdrop itself per the release; becomes part of an investment contract if the issuer also sells the token for cash (the release says so). | LOW. | OK if never paired with a cash sale. |
| G | Maine LLC or co-op sells equity or debt under Maine's Fund-ME short-form seed capital registration ($1,000,000 per 12 months; $5,000 per non-accredited investor per 12 months; Rule 504 compliant; escrow of funds; statute 32 MRSA 16304 subsection 6-A) | It IS a securities offering, done legally. Blue Hill Co-op (Hancock County) was the first Fund-ME business; reporting at the time said sales are restricted to state residents in most cases. | Normal bank rails. | LEGAL BUT FAILS "anyone from anywhere". Good for the local base only. |
| H | Federal Regulation Crowdfunding: up to $5M per 12 months, through an SEC-registered portal, per-investor limits, resale locked one year | A securities offering through a licensed intermediary. | Portal handles funds. | LEGAL, global-ish, costly (Form C, portal fees). |
| I | Rule 506(c): general solicitation allowed but accredited investors only, with reasonable steps to verify | A securities offering to wealthy investors only. | Normal rails. | Excludes the community. SKIP for a grassroots chapter. |
| J | Regulation A Tier 2: up to $75M per 12 months, audited financials, non-accredited limit 10 percent, state registration preempted | A securities offering with heavy cost. | Normal rails. | Too heavy for a local chapter. |
| K | Maine limited private offering exemption (32 MRSA 16202 subsection 15): Maine issuer, 25 or fewer Maine purchasers in 12 months, no general solicitation, notice filed | A small private placement. | Normal rails. | Fits a few local backers; does not fit a public online raise. |
| L | Direct public offering or community investment fund (cooperative and slow-money style) | A securities offering; the "local only, no SEC filing" idea works only inside an exemption such as Fund-ME or an intrastate rule. | Normal rails. | Same limits as G. |

### 1.3 Plain statements

1. **Highest risk:** any design where outsiders pay money, receive a transferable asset, and that asset controls a treasury the organizers run (A, B). That is Zaal's sentence read literally: "capital forming from virtually ... token participation from anywhere ... based on that token allocation."
2. **Lowers risk:** make the allocation non-transferable (C, E), free (F), or a recorded donation (D); give buyers no financial right; never advertise appreciation; keep a single, written, accurate description of what the money buys; keep voting rights only for people physically present (this also removes remote vote-buying).
3. **Voting weight tied to money paid** is a design choice an association can legally make, but it makes the "pay" half look like buying governance and, in design A, adds a profit-expectation signal. Weights from earned or time-locked allocation (E, F) are cleaner than weights from payment (A, C, D).
4. **Where Fund-ME and the federal exemptions fit:** they let a Maine entity take real investment from the public, but the Maine route is for Maine residents, Regulation Crowdfunding needs a portal, and 506(c) needs accredited investors. None gives an open global virtual raise without cost. The proposed SEC startup exemption would, but it is not law.
5. **Money transmission:** FinCEN's 2019 guidance says whether someone is a money transmitter is facts and circumstances, that a developer or seller of a new CVC platform can be exempt from creating or selling it yet still be a transmitter if it uses the platform to accept and transmit value as a business. Maine's Money Transmitters Act treats a licensed virtual currency business as a money transmitter and requires a licence unless an exemption in 32 MRSA 6074 applies. The 16 exemptions listed there do not name a small association collecting dues. Ask counsel whether DownEast ZAO ever holds or moves funds for others (for example, a treasury that converts donated crypto for third parties).
6. **UNKNOWN until Zaal answers:** what the token is, what a payer gets, who holds the treasury and the keys, whether payers can be outside the US. See Questions.

## 2. Decile-weighted voting

Surfaces read: Vitalik Buterin "Moving beyond coin voting governance" (full text, curl), Optimism Operating Manual v0.3.8 (curl), the arXiv paper on Optimism RetroPGF voting vulnerabilities (abstract only), Wikipedia "Quadratic funding" (curl), two Hacker News threads on quadratic voting (Algolia API), Nouns governance search results and the Dialectic "A Nouns Governance Attack" post (page needs JavaScript, not read), doc 1783, doc 056, doc 2563. Not searched: academic literature on rank-based vote weights, the Snapshot forum, Gitcoin's own docs (search returned Wikipedia summaries only).

### 2.1 Precedents

| System | Weight rule | What it teaches DownEast ZAO | Source status |
|--------|-------------|------------------------------|---------------|
| Optimism Token House | Coin vote by OP held or delegated | Pure coin voting is the plutocracy baseline. | FULL (manual) |
| Optimism Citizens' House | One person, one vote among badgeholders turned Citizens; citizenship "currently temporary" | Two houses with different weighting rules is the working precedent for a headcount key beside a weighted key. | FULL (manual, a v0.3.8 page marked OLD) |
| Optimism RetroPGF voting research | Quadratic, mean and median schemes analysed for manipulation, simulated | Weighted and aggregated schemes each have an attack; test yours before use. | PARTIAL (abstract only) |
| Gitcoin quadratic funding | Matching proportional to the square of the sum of square roots of contributions; needs sybil resistance | Strong against whales only if identities are real; Vitalik: splitting across identities requires proof of personhood. | PARTIAL (Wikipedia plus Vitalik) |
| Nouns | One Noun, one vote; proposal threshold 1 percent of supply; objection-only period when a vote swings late; a founders' veto early on | Late swings and capture are real enough that Nouns added a time buffer. | PARTIAL (search highlights; Dialectic attack post not read) |
| Respect fractals (ZAO, Optimism Fractal) | Soulbound score earned in weekly rooms; canonical 55/34/21/13/8/5, ZAO's own curve 110/68/42/26/16/10 | A weight nobody can buy. Active pool 6 to 30 weekly (doc 056); OG Respect has Gini 0.73 over 122 addresses and top 10 hold 53 percent (doc 2562). | FULL (internal docs) |
| bread.coop 50/50 flat floor | Half of voting power flat, half weighted, plus time-weighting | Closest existing idea to "keep the 1 floor, add a tilt"; adopt time-weighting. | FULL (internal doc 1783) |
| Town meeting, co-op general assembly | One person, one vote in the room | The origin of Zaal's in-person rule (doc 2589). | FULL (doc 2589) |
| Percentile or decile weights | NONE FOUND in the places searched | This is a new rule. Treat the pilot as the experiment. | UNKNOWN beyond 4 surfaces searched |

Vitalik's post is the useful frame: "proof of participation" and "proof of personhood" can stand in for coin weight, and both "require some form of anti-collusion ... to ensure that the non-money resource being used to measure voting power remains non-financial, and does not itself end up inside of smart contracts that sell the governance power to the highest bidder." In person, the person is the proof of personhood.

### 2.2 What decile weights do (toy model, labelled)

Model: 150 holders, lognormal balances (sigma 1.9, seed 7, Gini 0.83, so more concentrated than the 0.73 measured for ZAO OG Respect), midrank deciles, weights 1 to 10. Script is in this session's scratchpad and not shipped; the numbers are illustrative, not a forecast.

| Measurement | Result |
|-------------|--------|
| Biggest holder's share of tokens | 16.3 percent |
| Biggest holder's decile weight | 10 of 825 total weight (1.2 percent) |
| Top decile (15 people) share of total weight | 18.2 percent |
| 90th-percentile balance, share of supply | 1.81 percent (median 0.09 percent) |
| Largest single weight as share of room votes, random room of 7, 15, 30 | 24.5, 12.0, 6.1 percent |
| Weights with only 12 holders | 1,2,3,3,4,5,6,7,8,8,9,10 |
| Weights with 30 holders | three people at each of 1 to 10 |

Reading: a 1-to-10 decile rule is closer to "everyone votes, rich get a tilt" than to coin voting. It flattens a 16 percent holder to 1.2 percent of weight. The capture risk is not one whale but a bloc, and not wallet balance but wallet count.

### 2.3 Fair computation rules (adopt as bylaw text)

| Rule | Spec | Why |
|------|------|-----|
| Unit | One registered PERSON. A person links wallets before the snapshot by signed message, and shows ID or is known to the clerk at sign-in. Weight is computed on the SUM across that person's linked wallets. | Kills wallet splitting (2.4). |
| Population | Deciles over ALL eligible registered people, not over people present. | Room size changes every week; deciles over the room would make the top-ranked person present always get 10. |
| Snapshot | Frozen at agenda lock, 72 hours before the meeting, published as a table. Use the lower of balance at lock and balance 30 days earlier. | Flash buys do not count; people can check their weight before they travel. |
| Ties | Midrank: tied people share the average rank; if a tie straddles a boundary, all get the lower decile. | No tie-breaking by wallet age or coin flips that can be gamed. |
| Floor | Anyone registered who holds any positive allocation has at least 1. Decile 1 is the bottom 10 percent, not "everyone below the median". | Keeps the 1-vote floor Zaal asked for. |
| Small groups | Fewer than 30 eligible people: flat 1 vote. 30 to 99: quintile weights 2,4,6,8,10. 100 or more: deciles 1 to 10. | Deciles do not mean anything below about 100. |
| Guests | A guest of a registered member who is present: 1 vote, one guest per member per meeting, off in Phase 1, optional later (Zaal: "optional later"). | Guests are the easiest sybil door; leave it shut until the clerk process is proven. |
| Cap | No person above 10. No sponsor-linked group above 25 percent of the room's total weighted votes (clip the excess). Money and charter items also need the headcount key (Decision 5). | Keeps the 1-to-10 spirit under a coordinated flight-in. |
| Cooling | A new allocation counts after 30 days. Weight above 3 also needs one prior in-person attendance. | Stops "buy into the top decile online then fly in" the same week. |
| Recompute | Monthly, not weekly, once the group passes 100 people; weekly while small. | Stability; one fewer thing for the clerk to do each week. |

### 2.4 Capture and plutocracy risks

| Attack | How it works | Closed by |
|--------|--------------|-----------|
| Buy into the top decile online, then fly in | In the toy model the 90th-percentile balance is 1.81 percent of supply. The dollar cost is UNKNOWN until the token and price are chosen: cost = (90th-percentile balance minus what you hold) x price. | 30-day lookback, 30-day cooling, headcount key, flat 1 below 30 people. |
| Wallet splitting | A 16.3 percent holder split into 1, 5, 20, 60 wallets of equal size scores 10, 50, 180, 420 votes when weight is per wallet. | Weight per person on summed wallets, ID at the door. |
| Proxy attendance | Someone brings a friend's wallet signature. | Clerk sees the person; EAS attestation issued after, not before (doc 2589). |
| Bloc flight-in | Ten top-decile holders arrive together. | Headcount key plus 25 percent sponsor-group clip. |
| Dust voters | Anyone gets one dust allocation for 1 vote. | Weight 1 is small by design; require registration and one prior attendance for any vote on money items. |
| Late swing | A swing at the last minute decides a close item. | Nouns-style objection window: a 24-hour, against-only window after a weighted result that flips an earlier straw reading (optional, Phase 2). |
| Sponsor-bought attendance | A rich sponsor pays travel for 20 low-decile guests. | Guests off in Phase 1; any guest cap per sponsor. |

## 3. Weekly in-person proposal meetings in a small town

Surfaces read: doc 2589 (city structure, remote-participation precedent), doc 986 (local venues), doc 1617 and doc 056 (the weekly fractal session format, 6 to 30 active participants, rooms of 4 to 6). No outside study of small-town meeting turnout was read; cadence numbers below are judgment and are marked as defaults.

| Item | Default | Reason |
|------|---------|--------|
| Day and length | One fixed weekday evening or Saturday morning, 45 minutes, same room | A moving date kills turnout; the fractal sessions already run on a fixed weekly slot. Zaal picks the slot (Question 5). |
| Proposal intake | Anyone, any place, through a form; proposals due 72 hours before; the clerk publishes the agenda and the weight table at lock | Online holders propose and prepare; presenters read before travelling. |
| Binding items per meeting | Maximum 3 | Weekly proposals will outrun a small room. Overflow is a numbered queue, oldest first. |
| Quorum | 7 people present (default), counted on the sign-in sheet; weighted quorum is not used | Most holders will be online, so a token quorum cannot be met. |
| Missed weeks | A week with no quorum does not void anything; its items roll forward | Avoids a death spiral after one rainy Tuesday. |
| Watching | Livestream of the vote count and the tally sheet photographed and posted | Online people see everything, vote nothing. |
| Roles | Clerk (sign-in, ID, tally), moderator (time), observer (recounts); rotate every 8 weeks | Three roles keep the count honest. Maps to three Hats later. |
| Treasury spend | Phase 0 and 1: none. Phase 2: per-week cap set by the room, Safe signers execute only a recorded passed item | No spend before there is a lawful treasury. |
| Fractal alongside | The weekly Respect game can run before or after the vote night in a different room. It ranks which proposals reach the paper vote first | Same people, same evening, no new meeting. |

## 4. The bridge: paper, then fractal, then onchain

| Layer | What it does | Add when | Source |
|-------|--------------|----------|--------|
| Paper vote, clerk-witnessed, signed tally | The legal record | Phase 0 | doc 2589 |
| Weight slips printed from the frozen weight table | Phase 1 weights without any chain | Phase 1 | this doc |
| Respect (soulbound, earned in weekly fractal rooms; ORDAO/OREC to mint and run optimistic execution) | Agenda ranker, gate to become clerk or moderator, a non-purchasable second axis | Phase 2 | docs 056, 1423, 2563 |
| EAS attestation of the signed tally and the sign-in on Base | Public, tamper-evident copy | Phase 2 | EAS contract 0x4200000000000000000000000000000000000021 and schema registry 0x4200000000000000000000000000000000000020 on Base (docs.base.org, FULL) |
| Safe multisig as the only wallet that spends treasury funds | Execution of a passed item | Phase 2, after counsel | Safe docs (PARTIAL) |
| Hats roles for clerk, moderator, observer, signer; ZAO Hats tree id 226 (`src/lib/hats/constants.ts`) | Role gating and revocation | Phase 2 | doc 1307, Hats docs (PARTIAL) |
| Snapshot for the online advisory poll and the weight table | Off-chain, free voting with a whitelist strategy carrying predefined scores (the decile table) | Optional, Phase 1 for advisory only | Snapshot strategy docs (PARTIAL, search highlights) |

How to combine Respect and token deciles (Phase 2 decision for the room, not now):

| Option | Description | Verdict |
|--------|-------------|---------|
| 1 | Token decile only; Respect is a gate (can be clerk, can propose spends over a limit) | RECOMMENDED first. Same "gate, not weight" model doc 2563 recommends. |
| 2 | Weight = max of token decile and Respect decile | Possible later; one number to explain. |
| 3 | Two houses: money items need the weighted token key and a Respect key | Heaviest; use only if the group passes 100 people. |

## 5. Phased plan with gates

| Phase | Scope | Gate to leave (go / no-go) |
|-------|-------|----------------------------|
| 0: Paper, weekly, no token (target start week of 9 Nov 2026, after the 1 Nov Season 3 launch, per doc 2589) | One person, one vote. Weekly 45-minute meeting, paper ballots, clerk-signed tally, online proposals through a form, livestream. No money, no token. | GO when: 6 of the first 8 weeks were held; average attendance at least 7 and at least 12 distinct people; at least 10 proposals decided; zero disputed counts; a Maine securities lawyer's memo is on file; Zaal has answered the Questions. NO-GO and stay in Phase 0 otherwise. |
| 1: Allocation and decile weights, still paper | Non-transferable allocation (earned, free, or recorded donation). Registration of people and wallets, frozen weight table, weight slips, flat 1 below 30 people, headcount key on money items. Optional online advisory poll. No cash sale of any token. | GO when: two people independently reproduce the weight table from raw data; 4 dry-run weeks with weighted result and headcount result compared and every difference explained; counsel approves the allocation and any dues or donation wording in writing; the group has at least 30 eligible people. NO-GO if counsel says a sale is needed first: then pick one exemption from section 1.2 (G, H or the SEC startup exemption if adopted) and form the entity before anything else. |
| 2: Fractal plus onchain | Weekly Respect game as agenda ranker, EAS attestations on Base, Safe for execution with a per-week cap, Hats for roles. Any paid raise under a named exemption. | GO to live money when: Respect rooms run with at least 6 people in 8 of 12 weeks; EAS schema live with 12 consecutive weekly tally attestations; Safe tested with zero value then a small test amount; one outside review of the Safe and signer setup; counsel signs off on the exact raise; the room votes to adopt. |

## 6. Questions for Zaal (UNKNOWN today)

| # | Question | Default if not answered by 2026-10-12 |
|---|----------|----------------------------------------|
| 1 | ANSWERED 2026-10-05 (item 3): non-transferable DownEast points, no financial return. Original question: what is "the token" and what does a payer get: a new DownEast token, the existing ZABAL token, ZOR or Respect, or non-transferable points? Does the money buy any financial right or promise? | Non-transferable points, no financial rights (design C or E). |
| 2 | What is the capital for, who controls the treasury, and which legal entity (Maine nonprofit, LLC, co-op) holds the bank account and any keys? | No treasury and no spend in Phase 0 and 1. |
| 3 | May people outside the US and outside Maine pay or be allocated anything? Are you willing to run light identity checks (registered person, ID at the door)? | US and Maine open, others watch and propose only; registration required for any weight above 1. |
| 4 | Is the weight unit the person (all linked wallets summed) or the wallet? Are you willing to publish the weight table 72 hours before each meeting? | Person, table published. |
| 5 | Weekly day, time, venue, who is clerk and moderator, and is the 7-person quorum right for Ellsworth? | Saturday morning at the venue in doc 986, Zaal clerk first 4 weeks, quorum 7. |
| 6 | Guests: leave them off until Phase 2 or allow them at 1 vote earlier? | Off until Phase 2. |
| 7 | Should DownEast ZAO's weights ever count ZAO-wide Respect, or only DownEast activity (doc 2563's gate model)? | Gate only. |
| 8 | Is DownEast ZAO a ZAO chapter bound by ZAO governance or a separate organization using ZAO tools? This decides whose lawyer, whose entity and whose treasury. | Separate entity using ZAO tools until counsel advises. |

## Also See

- [Doc 2589](../2589-ellsworth-chapter-in-person-vote/) - the original in-person chapter spec; this doc supersedes its one-person-one-vote rule.
- Doc 2590 (PR #3718, not merged) - ZAOstock 2027 as the annual assembly.
- [Doc 2563](../2563-per-project-respect-multi-ledger-design/) - gate-not-weight model for local Respect.
- [Doc 2562](../2562-zao-fractal-state-and-build-plan/) - OG versus ZOR weight and the Gini 0.73 finding.
- [Doc 2558](../2558-dao-periodic-reactivation-precedent/) - re-activation precedent.
- [Doc 1783](../1783-bread-coop-primitives-into-zao/) - flat floor and time-weighted voting.
- [Doc 056](../056-ordao-respect-system/) and [Doc 1423](../1423-zao-optimism-fractal-governance-explainer/) - ORDAO, Respect, weekly sessions.
- [Doc 1206](../1206-zao-comparative-dao-state-july2026/) - comparative governance field.
- [Doc 1568](../1568-fractal-governance-proposal-template/) and [Doc 1617](../1617-zaostock-fractal-live-governance-guide/) - proposal form and a live in-person fractal session.
- [Doc 1307](../1307-hats-protocol-zao-org-chart/) - Hats org chart.
- [Doc 1108](../../business/1108-sparkz-legal-framing/) - earlier ZAO securities framing for creator coins (its SEC claims were not re-verified here; this doc relies on the 2026 sources listed below).
- [Doc 986](../../events/986-ellsworth-local-intel-zaostock/) - Ellsworth venues.
- Tracker pre-check (`zao-tracker search`) not run in this session; no tracker rows cited.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Answer Questions 1 to 8 in a grill; shipped when a decision file is on vault origin/main | Zaal | Decision | 2026-10-12 |
| Hire or consult a Maine securities lawyer, one hour on designs C, D, E, F and Maine 32 MRSA 16202 and 16304 plus money transmission; shipped when a one-page memo is filed in the vault | Zaal | Legal | 2026-10-26 |
| Update docs 2589 and 2590 (name to DownEast ZAO; vote rule per this doc); shipped when a PR with both edits merges | Zaal | PR | 2026-10-19 |
| Write Phase 0 bylaws page (sign-in, paper ballot, quorum 7, agenda lock, three roles) from this doc; shipped when the page is in the repo and read aloud once | Zaal | PR | 2026-10-31 |
| Prototype the weight table calculator with the 12-person, 30-person and 150-person cases in section 2.2 and reproduce it independently; shipped when a script and two matching outputs are committed | Zaal | Build | 2026-11-21 |
| Create the EAS schema on Base Sepolia and issue 3 test attestations; shipped when 3 attestation UIDs are recorded | Zaal | Build | 2026-11-14 |
| Check the Federal Register date and comment deadline for Regulation Crypto Assets and re-read the SEC startup exemption; shipped when the date is in the vault | Zaal | Research | 2026-10-19 |

## Sources

Method key: curl = raw HTML or PDF text stripped locally; API = official JSON API; exa = exa web_fetch; search = web search highlights only.

- [FULL, method: exa] [Davis Wright Tremaine, SEC Issues Interpretation Applying Federal Securities Laws to Crypto Assets, 2026-03-18](https://www.dwt.com/blogs/financial-services-law-advisor/2026/03/sec-interpretation-on-crypto-and-securities-laws)
- [FULL, method: curl] [Gibson Dunn, SEC Issues Interpretive Guidance on Application of Federal Securities Laws to Crypto Assets, March 2026](https://www.gibsondunn.com/sec-issues-interpretive-guidance-on-application-of-federal-securities-laws-to-crypto-assets-and-related-activities/)
- [PARTIAL - release text itself not read; sec.gov blocks scripted fetch, release number and effective date taken from search results] [SEC Release 33-11412 / 34-105020, File S7-2026-09](https://www.sec.gov/rules-regulations/2026/03/s7-2026-09)
- [FULL, method: exa] [Greenberg Traurig, SEC Proposes Regulation Crypto Assets, 2026-08-20](https://www.gtlaw.com/en/insights/2026/8/sec-proposes-regulation-crypto-assets-creating-tailored-crypto-offering-exemptions-and-investment-contract-safe-harbor) - read through the Rule 400 heading; the rest of the alert was cut off at the character limit.
- [PARTIAL - search highlights] [White & Case, SEC Proposes Regulation Crypto Assets](https://www.whitecase.com/insight-alert/sec-proposes-regulation-crypto-assets-rulemaking) - fetch failed (CRAWL_UNKNOWN_ERROR).
- [PARTIAL - search highlights, coinpedia and cryptotimes headlines] [CLARITY Act Senate cloture vote, 2026-09-15](https://coinpedia.org/news/clarity-act-vote-today-live-updates-can-democrats-deliver-60-votes/) - outcome (failed at 60, motion to reconsider entered) read from search summary only.
- [FULL, method: exa] [SEC, Regulation Crowdfunding page](https://www.sec.gov/resources-small-businesses/exempt-offerings/regulation-crowdfunding) - $5M per 12 months, registered intermediary, one-year resale lock.
- [PARTIAL - search highlights] [SEC Regulation A: Guidance for Issuers](https://www.sec.gov/resources-small-businesses/regulation-guidance-issuers) and [SEC Rule 506(c)](https://sec.gov/education/smallbusiness/exemptofferings/rule506c) - Tier 1 $20M, Tier 2 $75M, 10 percent limit, accredited-only with verification. Direct fetch returned 404 or rate limit.
- [FULL, method: curl] [Maine 32 MRSA 16202, Exemptions (subsection 15 Maine issuer, 25 purchasers; subsection 26 Rule 4(2) with Form D)](https://legislature.maine.gov/statutes/32/title32sec16202.html), data extracted 2025-10-20.
- [FULL, method: curl] [Maine 32 MRSA 16304 subsection 6-A, short-form registration, $1,000,000 and $5,000 limits](https://legislature.maine.gov/statutes/32/title32sec16304.html), data extracted 2025-10-20.
- [FULL, method: curl] [Maine 32 MRSA 6100-QQ, license required for virtual currency business activity](https://legislature.maine.gov/statutes/32/title32sec6100-QQ.html) and [6074 exemptions](https://legislature.maine.gov/statutes/32/title32sec6074.html) (via exa).
- [FULL, method: curl, dated 2015] [Bernstein Shur, Maine Adopts Final Crowdfunding Rule (Rule 523, Fund-ME)](https://www.bernsteinshur.com/wp-content/uploads/2015/01/Maine-Adopts-Final-Crowdfunding-Rule.pdf) - superseded in places by the 2023 amendment (Rule 504 ceiling now $10,000,000 in 16304 subsection 6-A paragraph D; the memo's $1,000,000 cap still matches the statute).
- [FULL, method: curl, dated 2015] [Mainebiz, Blue Hill Co-op first Fund-ME business](https://mainebiz.biz/article/blue-hill-co-op-steps-up-to-the-plate-as-first-fund-me-business/) - Hancock County precedent; sales restricted to state residents in most cases.
- [PARTIAL - search highlights] [Maine Chapter 523 rule text (Justia mirror)](https://regulations.justia.com/states/maine/02/032/chapter-523) - Cloudflare block on fetch; rule maintained through 2024-38 per search.
- [FULL, method: exa, first part] [FinCEN FIN-2019-G001, 2019-05-09](https://www.fincen.gov/system/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf) - read through section 1.2; the per-business-model sections were cut off.
- [PARTIAL - search highlights] Community investment and direct public offering references: [Slow Money](https://slowmoney.org/about), [Real Pickles deal structure](https://project-equity.org/?p=241518).
- [FULL, method: curl] [Vitalik Buterin, Moving beyond coin voting governance, 2021-08-16](https://vitalik.eth.limo/general/2021/08/16/voting3.html)
- [FULL, method: curl] [Optimism Operating Manual v0.3.8: The Token House and Citizens' House](https://gov.optimism.io/t/old-operating-manual-v0-3-8-the-token-house-and-citizens-house/7668) (marked OLD)
- [PARTIAL - abstract only] [Yu et al., Evaluating Voting Design Vulnerabilities for Retroactive Funding, arXiv 2505.16068](https://arxiv.org/abs/2505.16068)
- [FULL, method: curl] [Quadratic funding - Wikipedia](https://en.wikipedia.org/wiki/Quadratic_funding)
- [FULL, method: API] [Hacker News: Quadratic Voting (2014), 210 points](https://news.ycombinator.com/item?id=9477747) and [The user experience problems of quadratic voting, 144 points](https://news.ycombinator.com/item?id=30822489) - top comments read; the thread notes the QV efficiency claim needs more than about 50 participants.
- [PARTIAL - search highlights] Nouns governance parameters: [Nouns Builder governance docs](https://docs.zora.co/docs/smart-contracts/nouns-builder/governance) and [A Nouns Governance Attack, Dialectic](https://dialecticgroup.substack.com/p/a-nouns-governance-attack) (page requires JavaScript; body not read).
- [FULL, method: curl] [Base contract addresses](https://docs.base.org/chain/base-contracts) - EAS and EASSchemaRegistry predeploys confirmed.
- [PARTIAL - search highlights] Snapshot strategies (whitelist/merkleWhitelist, weighted voting): [Snapshot SX strategies](https://www.mintlify.com/snapshot-labs/sx-monorepo/concepts/strategies); [Hats Protocol docs](https://docs.hatsprotocol.xyz/for-developers/hats-protocol-overview) (page read, overview only); [Safe docs](https://docs.safe.global/home/what-is-safe) (overview only). EAS docs fetch (docs.attest.org) returned 34 bytes.
- [FAILED - route tried] Reddit: `zao-fetch-reddit.sh --selftest` reported public .json walled, 0 of 3 redlib instances up, OAuth creds missing; no Reddit thread read. Not retried through a headless browser in this session.
- [FAILED - empty result, not trusted as absence] Hacker News Algolia query "token governance plutocracy" returned zero stories; the query may be wrong. "proof of attendance vote in person DAO" also returned zero.
- Internal: docs 2589 and 2590 (read in full via git, 2590 on branch `ws/research-2590-ellsworth-zaostock-2027-assembly`), 2562, 2563, 056, 1783, 1108 (1108 SEC claims not re-verified), vault `decisions/grill-2026-10-05-zao-ellsworth-idea.md` (read in full), ZAOOS `src/lib/hats/constants.ts` (TREE_ID = 226).
- Not searched: Maine Office of Securities staff guidance on token offerings; any state AG statement on DAOs; Wyoming DUNA or other entity wrappers; academic literature on rank-based vote weights; tax treatment of donations; current ZABAL token holder data.
