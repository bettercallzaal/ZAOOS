---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-09
related-docs: 625, 626, 627, 468
tier: STANDARD
---

# 628 - POIDH x Empire Builder x Bounty-Writing: Learning Capture (multi-hour session 2026-05-09)

> **Goal:** Capture the meta-lessons from a single multi-hour session that produced docs 625, 626, 627 plus the live `bettercallzaal.com/poidh.html` integration. The corrections, the gotchas, the framework picked up from Kenny's pro-tip cast, the ownership reveals, the architecture flips. Future-Zaal opens this doc instead of re-running the same investigations.

> **Source episode:** Zaal asked /zao-research on POIDH (-> doc 625), then expanded scope into Empire Builder integration (-> doc 626), then $ZABAL Empire ground truth + v3 capability survey (-> doc 627), then asked to capture the whole process. Docs 625-627 are the artifacts; this doc 628 is the heuristics distilled out of building them.

## Key Decisions / Recommendations

| Lesson | Recommendation |
|--------|----------------|
| **OG meta lies; tRPC tells the truth.** | When a POIDH bounty page's `<meta property="og:image">` includes `participants=0x...,0x...`, those are FUNDERS / VOTERS in open bounties, NOT claim submitters. Always pull real submitters via `https://poidh.xyz/api/trpc/claims.fetchBountyClaims`. The OG list almost cost us a 2-wallet leaderboard when the truth was 10 unique submitters. |
| **Album names live in the database, not the URL.** | `poidh.xyz/a/<album>` URLs work for any string but only one canonical name maps to the `BountiesExtra.album` row. ZAO's bounties live under `wethemmedia` (verified via `bounties.fetch(1151).extra.album`). The `/a/thezao` URL renders an empty page. Always confirm via the bounty's `extra.album` field on a known bounty before scraping the album. |
| **Ownership > popularity in Empire Builder.** | We assumed "Adam owns ZABAL Empire" because Adam runs SongJam and SANG. Wrong. Zaal IS the ZABAL Empire owner (`empires.owner = 0x7234...e9af` matches Zaal's POIDH issuer wallet exactly). Co-emperors can't bypass owner-only writes via EOA. Always pull `GET /api/empires/<empire_id>` to read `owner` + `co_emperors` before assuming who needs to sign. |
| **Empire ID != SmartVault address.** | THE failure mode in v3. Empire ID is identity (token address, `fid12345`, or slug). SmartVault address is the on-chain treasury contract. Some endpoints take both as separate fields. Always match the field name (`tokenAddress` / `baseToken` = identity; `empireAddress` / `treasuryAddress` = vault). |
| **Re-fetch SKILL.md every session.** | `https://www.empirebuilder.world/skill/SKILL.md` is versioned `latest`. yerbearserker shipped v3 mid-session 2026-05-09 - we caught the new schema only because we re-fetched. Cached copies older than `lastUpdated` describe stale routes. |
| **Mainnet-only, real funds, dry-run via reads.** | Empire Builder + POIDH have no testnet. Every write hits Base / Arbitrum mainnet with real ETH / ZABAL. ALWAYS dry-run via `GET` endpoints before signing. Read first: `/api/empires/<id>`, `/api/leaderboards/<uuid>`, `/api/boosters/<id>`. |
| **The integration direction was reversed.** | First instinct: BCZ calls Empire Builder API to push leaderboard data. Wrong. Empire Builder PULLS from BCZ via API-Sourced leaderboards. BCZ exposes `[{address,score}]` JSON; the Empire owner configures one apiLeaderboard pointing at it. Saves API key handling on BCZ side and matches EB's cron-refresh model. |
| **Use Kenny's POIDH framework for every bounty.** | Precise / Observable / Impactful / Doable / Horizoned. Round 1 (BCZ YapZ Ep 17) was vague-good; Round 2 (BCZ YapZ Ep 19 w/ Kenny) applies the framework explicitly in the body and improves discoverability + judging quality. The framework header doubles as a tutorial for first-time submitters. |
| **One-offs go in /clipboard, state lives on poidh.html.** | Operational paste-targets (winner cast, bounty drafts, EB submission package) are short-lived; render them in `/tmp/clipboard.html` for the session. Persistent state (live leaderboard, current bounty status, JSON feed URL, framework explanation) lives on the public `bettercallzaal.com/poidh.html` page. Mixing the two bloats the public page and ages it badly. |
| **Refresh script > Cloudflare Worker until traffic warrants it.** | `python3 scripts/refresh-poidh-leaderboard.py` is a 100-line stdlib-only script. Cloudflare Worker + cron is correct LONG-term but unnecessary at 10 unique submitters. Don't over-engineer. Migrate to CF Worker when refresh cadence > daily OR when leaderboard has > 100 entries. |
| **Score model = unique wallets per bounty by default.** | First pass counted claims (one wallet got score 2 for two submissions). Zaal vetoed - reward unique wallets, not submission spam. Now `seen.add(addr)` per claim, score=1 across the board. Switch back to claim-count scoring only when the bounty REWARDS volume (e.g. "post 5 different clips"). |
| **Run the meta-bounty pattern.** | Kenny demonstrates it with the May best-bounty meta-bounty (BCZ YapZ Ep 19, chapter 17:35). Replicate: Round 3 = "best new POIDH bounty written for ZAO using the POIDH framework, judged by yerbearserker / Zaal". Ties bounty culture to bounty-writing skill. |

---

## Part 1 - POIDH Platform Learnings

### Contract addresses (memorize)

| Chain | Chain ID | PoidhV3 contract | Min bounty | Min contribution |
|-------|----------|------------------|-----------|------------------|
| Base | 8453 | `0x5555Fa783936C260f77385b4E153B9725feF1719` | 0.001 ETH | 0.00001 ETH |
| Arbitrum | 42161 | `0x5555Fa783936C260f77385b4E153B9725feF1719` (same logical) | 0.001 ETH | 0.00001 ETH |
| Degen | 666666666 | `0x18E5585ca7cE31b90Bc8BB7aAf84152857cE243f` | 1000 DEGEN | 10 DEGEN |

PoidhV3 enforces `msg.sender == tx.origin` -> EOA-only creation (Safe / Coinbase Smart Wallet revert with `ContractsCannotCreateBounties`). Issuer cannot claim own bounty (`IssuerCannotClaim`). 2.5% protocol fee on accepted payouts. 5% suggested NFT royalty.

### tRPC scrape pattern (no API key needed)

```python
import json, urllib.parse, urllib.request

def trpc(proc, payload):
    inp = urllib.parse.quote(json.dumps({"0": {"json": payload}}))
    url = f"https://poidh.xyz/api/trpc/{proc}?batch=1&input={inp}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())[0]["result"]["data"]["json"]
```

Useful procedures:

| Procedure | Input | Returns |
|-----------|-------|---------|
| `bounties.fetch` | `{id, chainId}` | Bounty with `title`, `issuer`, `amount` (wei), `extra.album` |
| `bounties.fetchByAlbum` | `{album, status, limit}` | List by album, status in `open` / `progress` / `past` |
| `claims.fetchBountyClaims` | `{bountyId, chainId, limit}` | Real submitter list with `id`, `issuer`, `title`, `isAccepted`, `url` |
| `claims.fetchAcceptedClaimByBountyId` | `{bountyId, chainId}` | The accepted (winning) claim, or `null` |
| `albums.trending` | `{limit}` | Top trending albums |

Refresh script lives at `scripts/refresh-poidh-leaderboard.py` in BCZ repo. Defaults to bounty 1151, supports `--bounty <id> --chain <id>` flags.

### Gotchas confirmed live

| Gotcha | What we hit | What it actually was |
|--------|------------|---------------------|
| OG meta `participants` | Saw 2 wallets, assumed = submitters | They're funders/voters in joined-bounty open mode. Real claim count = 11 from 10 unique wallets (one submitted 2x) |
| `/a/thezao` URL | Tried scraping ZAO album by that name | Album row in DB is `wethemmedia`, not `thezao`. The URL renders empty |
| `participants` includes issuer | Assumed both 0x7234 + 0x4200 were submitters | 0x7234 is Zaal (issuer); protocol forbids issuer claims |

---

## Part 2 - Kenny's POIDH Goal Framework (extracted from his pro-tip cast image)

Source: `https://farcaster.xyz/kenny/0xbb5f295f` - cast text "poidh pro tip 🕹️ write good bounty descriptions" with attached image OCR'd 2026-05-09.

### The acronym

| Letter | Property | Mantra |
|--------|----------|--------|
| **P** | Precise | Clear, specific outcome. Everyone knows what "done" looks like. |
| **O** | Observable | You can track or verify it. No guesswork. |
| **I** | Impactful | Actually moves the needle. Creates real value. |
| **D** | Doable | Realistic given resources. Challenging, but possible. |
| **H** | Horizoned | Has a deadline. A goal without a deadline is just a wish. |

### How to use POIDH (per the image)

1. Start with the outcome you want.
2. Run it through POIDH (check each letter).
3. Tweak anything that's weak or vague.
4. Post with confidence.
5. Attract better builders, get better outcomes.

### Before/after example from the image

- BEFORE (vague): "Write some content about poidh." (X too vague, X hard to measure, X hard to know if it's successful, X easy to procrastinate)
- AFTER (POIDH-shaped): "Write and publish 3 SEO-friendly blog posts about poidh with target keywords and featured images by May 31, 2024." (clear and specific, observable + trackable, high impact, realistic + doable, has a deadline)

Closer: "Better goals = Better bounties = Better outcomes. POIDH is better when we build it together."

### Round 1 vs Round 2 - applying the framework

| Aspect | Round 1 (BCZ YapZ Ep 17) | Round 2 (BCZ YapZ Ep 19 - drafted) |
|--------|--------------------------|-------------------------------------|
| Precise | "find a clip" - any length, any platform | "45-60s edited clip, hook in 3s, single takeaway" |
| Observable | "tag @bettercallzaal" - one platform implied | "X AND Farcaster URLs both, three tags, caption stating angle" |
| Impactful | "honest reflection wins" - judging is subjective | Winning clip becomes POIDH's pinned ad - reuse promise |
| Doable | "watch + post" - 28-min ep, no guidance | Episode chapters called out: 5:05 / 8:40 / 17:35 / 22:30 |
| Horizoned | "one week" deadline | "7 days from posting, deadline TBD at create time" - same shape, more explicit |

The framework shift: Round 1 was a vibe brief; Round 2 is a craft brief.

---

## Part 3 - ZABAL Empire Builder v3 Learnings (recap of doc 627 distilled)

### What you actually own (verified)

| Field | Value | Implication |
|-------|-------|-------------|
| Empire ID | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | Pass this everywhere `tokenAddress` / `baseToken` is asked |
| SmartVault | `0xe0faa499d6711870211505bd9ae2105206af1462` | Treasury contract on Base; pass as `empireAddress` |
| Owner | `0x7234c36a71ec237c2ae7698e8916e0735001e9af` (Zaal) | You can sign every guardian-only endpoint |
| Co-emperors | 1 (`0xb79c...7932`) | Can sign most guardian writes via EOA, EXCEPT `distribute-prepare` (owner-only) |
| Token type | clanker_v4 | Fresh deploys go through Clanker SDK |
| Chain | Base 8453 | Mainnet only |

### What v3 unlocks (six things)

1. **Native staking** via immutable StakingLocker (lock 0-10y, +5x cap multiplier).
2. **Owner-signed direct distributions** (`distribute-prepare` -> owner sends `executeBatch` -> `store-distribution`).
3. **Three Farcaster-native leaderboard types** (cast / channel / interaction) - no scrape, EB pulls Hub data.
4. **Quotient (reputation) leaderboards** - pairs with the existing Quotient booster.
5. **Multi-chain mirroring** to Arbitrum without redeploying everything.
6. **Tracked burns** via `store-burn` - audited burn history on top of the 178M ZABAL already gone.

### What you can't do (constraints)

- Distribute via EOA from a co-emperor wallet - must be from `owner()`. Co-emperors go through the website's UserOp paymaster flow.
- Run on testnet - there is no `/sepolia/...` host. Always real funds.
- Mix Empire ID with SmartVault address - separate fields, never interchange.
- Skip API key on writes - even when guardian-signed.

---

## Part 4 - Integration Architecture Learnings

### The reversed pull pattern

```
POIDH submitters -> claims on Base
                            |
                            v
                  poidh.xyz tRPC
                            |
                            v
            scripts/refresh-poidh-leaderboard.py
                            |
                            v
       bettercallzaal.com/poidh-leaderboard.json  <-- public, no auth
           [ {address, score}, ... ]                  
                            |
                            v
           Empire Builder apiLeaderboards
           (configured ONCE by Zaal as owner)
                            |
                            v
                $ZABAL Empire on Base
                            |
                            v   apply boosters, refresh
                            v   distribute (owner signs)
                            |
                            v
                       Submitter wallets
```

Key property: **the BCZ side has zero auth burden.** No API keys exposed in static HTML, no CF Worker proxy needed for the read path. EB does the polling.

### When to upgrade out of static JSON

| Trigger | Action |
|---------|--------|
| Refresh cadence > daily | Move JSON gen to a CF Worker on cron |
| Leaderboard > 100 entries | Pre-resolve Farcaster handles via Neynar at gen time, not at render |
| Multiple POIDH bounties feeding one leaderboard | Aggregate in the worker, not in the page JS |
| Real-time on-chain accuracy required | Index PoidhV3 events directly via Base RPC, skip tRPC |

For the BCZ YapZ Ep 17 use case (one bounty, 10 submitters, refresh = ad-hoc when Zaal accepts a winner) the static script is correct.

### Refresh script defaults that worked

- Stdlib only (urllib + json) - no `pip install` needed
- One file at `scripts/refresh-poidh-leaderboard.py`
- `--bounty <id> --chain <id>` flags so the same script handles album-wide later
- Writes both `poidh-leaderboard.json` (the EB feed) AND `poidh-audit.json` (full claim trail for verification)
- Excludes the issuer wallet defensively (protocol enforces but worth restating)
- One wallet = score 1, no claim count double-up

---

## Part 5 - Personnel / Ownership Learnings

| Person | Role | Wallet / FID | Notes |
|--------|------|--------------|-------|
| Zaal | $ZABAL Empire owner, BCZ founder, POIDH bounty issuer | `0x7234...e9af` / FID 19640 | Same wallet across all surfaces |
| yerbearserker (Jordan Oram) | Empire Builder co-founder | FID via warpcast lookup; LinkedIn linkedin.com/in/yerbearserker | Co-founded EB, Chief Ecosystem Architect |
| Adrian | Empire Builder lead engineer | Handle "divifly" per Zaal - did not resolve via warpcast username lookup | Verify FID with yerbearserker if needed |
| Adam | SongJam founder, $SANG owner | Separate from ZABAL ownership | Stakeholder in ZABAL; NOT the empire owner |
| Kenny | POIDH founder | FID 2210 / `kenny` | Episode 19 of BCZ YapZ; pro-tip cast at 0xbb5f295f |
| cryptfi-mariano (J'Mariano) | Round 1 winner | FID 872568 / wallets [`0x70485...d621`, `0xa34514...5355`, `0xd8ec8...148b`] | Claim 6368 won; YouTube: @creator-mariano |

Lesson: **ALWAYS resolve a wallet to a Farcaster handle before assuming identity.** Warpcast `GET /v2/user-by-username?username=<handle>` returns `extras.ethWallets[]` for cross-checking.

---

## Part 6 - Workflow Discipline Learnings

### What goes where

| Surface | Lifecycle | Examples |
|---------|-----------|----------|
| **`bettercallzaal.com/poidh.html`** | Persistent public state | Live leaderboard, JSON feed URL, EB submission package, framework explainer, current bounty status |
| **`/tmp/clipboard.html` (clipboard skill)** | Session-scoped paste-targets | Winner cast templates, draft bounty descriptions, DM templates |
| **`scripts/`** | Re-runnable automation | Refresh leaderboard, batch ops, future CF Worker source |
| **`docs/research/<topic>/<NNN>-<slug>/`** | Permanent research artifacts | Doc 625 (playbook), 626 (integration), 627 (capability map), 628 (this) |
| **`.git` history + PRs** | Auditable change log | Every edit attributed and reversible |

### Avoid these traps (next session)

1. **Don't bake one-offs into the public page.** Round 1 wrap-up + Round 2 draft sat on poidh.html for ~2 hours before we moved them to clipboard. They were paste-targets, not display content. Got crowded fast.
2. **Don't call out yerbearserker / Adrian for things you can do yourself.** Zaal owns the empire. Saved a DM round-trip once we verified ownership.
3. **Don't trust OG meta as ground truth.** Always pull tRPC / contract reads.
4. **Don't write album/bounty data into config files.** Pull live, cache short, refresh on demand.
5. **Don't skip the `/zao-research` workflow** when an investigation produces > 200 lines of intel. The 4 docs (625-628) collectively are ~1500 lines; this would have been lost as conversation context otherwise.

### What worked

1. **Question the premise.** Caught the OG-meta misdirect, the album-name mismatch, the ownership confusion - all by going back and reading the source instead of the cached interpretation.
2. **Multiple parallel API calls.** trpc + warpcast + EB API + youtube metadata in one bash block saved ~5 round-trips.
3. **Frontmatter-first doc structure.** Each /zao-research doc starts with topic/type/status/last-validated/related-docs/tier - makes the library searchable for future self.
4. **Cross-link aggressively.** Doc 627 references 626 references 625; every doc has "Also See" + "Sources" sections.
5. **Refresh scripts > one-shot scrapes.** The Python script means the next bounty refresh is one command, not another 30-minute investigation.

---

## Part 7 - Decision Rubric for Next Bounties

Apply in this order to every new POIDH bounty for ZAO/BCZ:

1. **Episode / artifact identified?** What's the source content the bounty pulls from?
2. **Run the title through POIDH letters.** If any letter is weak, rewrite the title.
3. **Three observable inclusions named?** Platforms (X / Farcaster / IG), tags (3 minimum), proof-format (URL + caption + clip).
4. **Reuse promise stated?** What does the WINNING submission unlock for them beyond ETH (pinned promo, channel feature, token allocation)?
5. **Timecodes + beats called out?** Reduce "where do I start" friction.
6. **Deadline absolute, not relative?** "Due 11:59pm PT 2026-05-25" beats "one week from now".
7. **Tier matches doc 625 prize curve?** Tier A 0.005-0.01 / Tier B 0.015-0.03 / Tier C 0.03-0.1 / Tier D 0.1+.
8. **Cross-post plan?** /poidh + /zao + topic channel + X. Three minimum surfaces.
9. **Album = `wethemmedia` (or new sub-album).** Don't drift to vanity album names.
10. **Refresh script run after claims close + before announce.** JSON stays current.

---

## Specific Numbers (session totals 2026-05-09)

| Metric | Value |
|--------|-------|
| Docs written | 4 (625, 626, 627, 628) |
| BCZ commits | 7 (poidh.html + JSON + script + nexus link) |
| ZAOOS PRs | 2 (#494 = doc 625, #495 = docs 626/627/628) |
| Live URLs shipped | 3 (poidh.html, poidh-leaderboard.json, scripts/refresh-poidh-leaderboard.py) |
| Architectural corrections mid-session | 3 (BCZ-pulls -> EB-pulls, "Adam owns" -> Zaal owns, OG-meta -> tRPC) |
| Identity resolutions | 6 (yerbearserker, Adrian, Kenny, J'Mariano, Adam, Zaal himself) |
| External APIs hit (no key) | 4 (poidh tRPC, warpcast user lookup, empirebuilder GETs, EB GitBook ?ask=) |
| Round 1 unique submitters | 10 |
| Round 1 winner | cryptfi-mariano (claim 6368) |
| Round 2 status | Drafted, awaiting funding |
| Empire Builder leaderboard types | 11 (was thought to be 5) |
| ZABAL Empire boosters active | 3 (zaal Zora, ZAAL newsletter, Quotient) |
| ZABAL Empire treasury | $1,547.44 |
| ZABAL burned to date | 178,213,603 |

---

## Sources

- Doc 625 (POIDH x ZAO bounty playbook)
- Doc 626 (Empire Builder + ZABAL POIDH airdrop architecture)
- Doc 627 (ZABAL Empire ground truth + EB v3 capabilities)
- [Kenny's POIDH framework cast](https://farcaster.xyz/kenny/0xbb5f295f) - pro-tip image with full POIDH acronym
- [Kenny's winner-template thread](https://farcaster.xyz/kenny/0xbd415099) - "confirm on app, screenshot, announce on social"
- [BCZ YapZ Ep 19 w/ Kenny YouTube](https://www.youtube.com/watch?v=IFG_34K7Vig) - 28-min episode, chapters cover SMART -> POID brainstorm + agent-built bounty writers
- [Empire Builder SKILL.md](https://www.empirebuilder.world/skill/SKILL.md)
- [Empire Builder skill/references/{http-api,workflows,contracts}.md]
- [poidh-app repo](https://github.com/picsoritdidnthappen/poidh-app) (prod branch)
- BCZ live: bettercallzaal.com/poidh.html, poidh-leaderboard.json, poidh-audit.json, scripts/refresh-poidh-leaderboard.py

---

## Also See

- Doc 625 - operational bounty playbook (18 templates, prize curves, judging rules)
- Doc 626 - Empire Builder integration architecture (BCZ feed -> apiLeaderboard)
- Doc 627 - $ZABAL Empire state + v3 capabilities (the empire-state survey)
- Doc 468 - POIDH Farcaster bot architecture (the bot/automation layer)
- Doc 584 - ZABAL Nexus link inventory (where /poidh.html sits in the BCZ nav)

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Accept @cryptfi-mariano's claim 6368 on POIDH from issuer wallet 0x7234...e9af | @Zaal | POIDH app tap | Today |
| Cast Round 1 winner using template in /tmp/clipboard.html, attach screenshot | @Zaal | Farcaster + X | Today |
| Re-run `python3 scripts/refresh-poidh-leaderboard.py` so JSON shows `accepted: true` for claim 6368 | @Zaal | One command | After acceptance |
| Create Round 2 bounty on POIDH using paste-ready title + description from clipboard | @Zaal | POIDH app | This week |
| Create "BCZ YapZ Submitters" apiLeaderboard on $ZABAL Empire (slot 5) using EB submission package from clipboard | @Zaal | Empire dashboard | Today |
| Plan Round 3 meta-bounty: "best POIDH-framework bounty written for ZAO" judged by Zaal + yerbearserker | @Zaal | Strategy | Month 1 |
| Schedule Kenny follow-up cast on agent-built bounty writers (BCZ YapZ Ep 19 chapter 24:20) once POIDH ships agent tooling | @Zaal | Calendar | Q3 |
| Re-validate this doc + doc 627 in 30 days (EB v3 is fresh, expected to evolve) | @Zaal | Doc update | 2026-06-09 |
| Apply the decision rubric (Part 7) to every new ZAO POIDH bounty going forward | @Zaal | Habit | Ongoing |
