---
topic: business
type: audit
status: research-complete
last-validated: 2026-08-07
superseded-by:
related-docs: ""
original-query: "https://www.reddit.com/r/Superstonk/s/iEq5v7s8qr deep research this and let's test it with that"
tier: DEEP
---

# 2248 - DGCL 251(g): testing a Superstonk thesis against the statute and the filings

> **Goal:** Take a specific claim - that Ryan Cohen has spent the year setting up a
> § 251(g) holding-company reorganization - and check it against the actual Delaware
> statute and GameStop's actual SEC record.

**This is a mechanism audit, not investment advice, and nothing here is a
recommendation to buy, sell, or hold anything.** It checks whether a claimed legal
manoeuvre is real, available, and does what the post says it does.

## The claim

From r/Superstonk, 2026 (score 1, 1 comment - a fresh post, not a consensus view):

> "A 251(g) is the key - and it's seemingly exactly what Ryan Cohen has been setting
> up this entire year ... Quite literally if he wanted to do a Berkshire Hathaway but
> quick it would be doing a 251(g) to become a holding company overnight. And the 2.0b
> buyback and the 2.5 b share auth would make a lot more sense in that situation. As to
> why cohen sandbagged so hard? He has to prove he's not just doing the reorg for a
> specific transaction to go through."

## Verdict, in three lines

1. **The mechanism is real and GameStop can use it.** § 251(g) exists, does what the
   post says, and GameStop is a Delaware corporation - confirmed from EDGAR, not
   assumed.
2. **The post's biggest omission is the actual news.** GameStop has filed ~28 Form
   425s since May 2026. The subject company is **eBay**.
3. **The post's implied payoff does not follow from the statute.** § 251(g)
   subsection (7) expressly preserves every shareholder vote that existed before the
   reorganization. It cannot be used to push a transaction past shareholders.

## What § 251(g) actually says

Delaware General Corporation Law, Title 8, § 251(g) - fetched in full from
delcode.delaware.gov. No stockholder vote is needed to merge a corporation into its
own wholly-owned subsidiary to create a holding company, **if all seven conditions
hold**. The load-bearing ones:

- **(2)** every share converts into a holding-company share with "the same
  designations, rights, powers and preferences" - identical.
- **(3)** the holding company and the constituent corporation must both be
  **Delaware** corporations.
- **(4)** the holding company's certificate of incorporation and bylaws must contain
  "provisions identical to" the constituent's.
- **(6)** the same directors carry over.
- **(7)** the surviving entity's organizational documents must require that any act
  which *would have* required a stockholder vote before the merger "shall, by specific
  reference to this subsection, require, in addition to approval of the stockholders
  or members of the surviving entity, the approval of the stockholders of" the holding
  company.

**Why no vote is required is the whole point: nothing substantive changes.** Same
charter, same bylaws, same board, same share rights, and - condition (7) - the same
voting rights on everything afterwards. The vote is waived precisely because the
reorganization is designed to be neutral.

That is also why the post's framing is half right. "Become a holding company
overnight" - yes, genuinely, and that IS how a Berkshire-style structure can be
created fast. But a holding company is a *container*, not an acquisition. § 251(g)
restructures GameStop; it acquires nobody.

## What the filings actually show

Confirmed from primary sources, not commentary:

- **GameStop Corp., CIK 0001326380, stateOfIncorporation: DE**, NYSE, tickers `GME`
  and `GME-WT` (EDGAR submissions API). So condition (3) is satisfied - the statute is
  available to it. This is the one factual precondition the thesis needs, and it holds.
- **~28 Form 425 filings since 2026-05-04.** A Form 425 is a merger-communication
  filing. The **subject company on the 2026-07-20 filing is eBay, Inc.** (Commission
  File No. 001-37713).
- From that filing, which reproduces a Financial Times interview of 2026-07-19:
  Cohen is "pressing ahead with a long-shot pursuit of eBay despite Wall Street
  scepticism, quietly amassing a nearly 10 per cent stake"; eBay **rejected** a
  "$56bn cash-and-stock takeover offer in May", criticising "the deal's financing,
  leverage levels of the combined group and Cohen's own economic incentives";
  GameStop "has almost doubled its eBay stake and Cohen withdrew a bonus plan ... that
  could have paid him as much as $35bn"; and the manoeuvres "could be a prelude to
  Cohen taking his offer directly to shareholders." Cohen, quoted: **"We're keeping
  all our options on the table."**

The post argues from inference about a reorganization. The filings describe an
openly-contested acquisition attempt. Both can be true, but the second is documented
and the first is not.

## Where the thesis holds up, and where it breaks

**Holds up:**

- A holding-company structure is a normal acquisition vehicle. A HoldCo can issue
  stock for deals without the operating company's balance sheet in the way, and a
  cash-and-stock offer of the size described needs authorized shares and cash.
- Cohen's own words ("all our options on the table", a possible move direct to
  shareholders) are consistent with keeping structural flexibility.
- The post's instinct that boilerplate is deliberate is sound corporate-law reasoning:
  a reorganization visibly done *for* a particular transaction invites the argument
  that it was a device, so keeping it generic is exactly what counsel would advise.

**Breaks:**

- **§ 251(g) cannot bypass a shareholder vote on an acquisition.** Condition (7)
  carries every pre-existing vote forward. If a transaction needed shareholder
  approval before the reorganization, it needs holding-company shareholder approval
  after it. The statute is explicitly not a workaround.
- **The mechanism does not require a year of setup.** Conditions (2), (4) and (6)
  demand that everything stay identical, which is why 251(g) reorganizations are
  routine and quick. Reading a year of unrelated corporate actions as "setting up a
  251(g)" is not supported by anything in the statute.
- **UNVERIFIED:** the "$2.0b buyback" and "2.5b share auth". Both are plausible and
  checkable in GameStop's 8-Ks and proxy statements, and neither was confirmed for
  this doc. They are the post's supporting evidence, so anyone leaning on the argument
  should verify them directly before repeating them.

## Why this one was worth doing properly

Superstonk is where Zaal's own thesis about markets started, and the reflex to
dismiss a 1-upvote post would have been wrong here: the poster correctly identified a
real, obscure, genuinely powerful statute. The post is better than its score.

It is also a clean case of the pattern this repo keeps re-learning - **a claim is not
a fact until it is checked against the primary source.** The statute took one fetch.
GameStop's state of incorporation took one fetch. The eBay pursuit was sitting in
EDGAR the whole time and no amount of reading the post would have surfaced it.

## Also See

- `.claude/rules/anti-fabrication.md` - the standard applied here (evidence or UNVERIFIED)
- `.claude/rules/research-grounding.md` - real fetches or it does not count

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify the "$2.0b buyback" and "2.5b share authorization" against GameStop's 8-Ks and proxy, or strike them from any repost. Shipped when both are confirmed or marked false in this doc. | @Zaal | Research | 2026-08-14 |
| If the eBay situation is worth tracking, watch for an S-4 or a tender offer (SC TO-T) on CIK 0001326380 - those would mark a move from communication to a live transaction. Shipped when a watch is set or the thread is dropped. | @Zaal | Decision | 2026-08-21 |

## Sources

- [r/Superstonk post 1vidhp2](https://www.reddit.com/r/Superstonk/comments/1vidhp2/a_251g_is_the_key_and_its_seemingly_exactly_what/) - **FULL**. Fetched 2026-08-07 via `~/bin/zao-fetch-reddit.sh` (arctic_shift); direct `.json` returns 403 from this IP. Title, body, and all comments retrieved.
- [DGCL Title 8 § 251](https://delcode.delaware.gov/title8/c001/sc09/index.html) - **FULL**. Subsection (g) conditions (1)-(7) fetched and quoted verbatim 2026-08-07.
- [SEC EDGAR submissions, CIK 0001326380](https://data.sec.gov/submissions/CIK0001326380.json) - **FULL**. `stateOfIncorporation: DE`; the full 2026 filing index including ~28 Form 425s.
- [GameStop Form 425, filed 2026-07-20](https://www.sec.gov/Archives/edgar/data/1326380/000119312526308408/d120615d425.htm) - **FULL**. Subject Company: eBay, Inc.; reproduces the FT interview of 2026-07-19. All quotations above are verbatim from it.
- WebSearch was unavailable (session budget exhausted), so every source here is a direct fetch of a primary document rather than a search result. For this question that is the stronger position.
