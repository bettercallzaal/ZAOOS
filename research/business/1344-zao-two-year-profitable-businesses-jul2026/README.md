# ZAO: 2 Profitable Businesses in 2 Years — Mentor Framework (July 2026)

**Status:** WORKING DRAFT — not a locked north-star, thinking frame for mentor conversation  
**Goal shape:** By July 2028, 2 ZAO projects where monthly revenue > monthly cost  
**Doc number:** 1344  
**Board task:** ae0a9fe1  
**Related docs:** 1315 (IP licensing), 1320 (grant strategy), 1334 (ZAOstock sponsors), 1338 (Boardwalk fee splits)

---

## The Question

A mentor asked: "What are your 2 profitable businesses in 2 years?"

Not "What are you building?" — specifically, "Where does money in exceed money out — on a recurring monthly basis?"

This doc works through the answer honestly: current costs, actual revenue levers, which 2 bets have the clearest path.

---

## Current Monthly Cost Baseline (July 2026)

| Line Item | Monthly Cost (est.) | Notes |
|-----------|---------------------|-------|
| Vercel (cocconcertz.com, thezao.xyz) | ~$40 | Hobby/Pro tiers |
| VPS (187.77.3.104) | ~$25 | Bot fleet + Bonfire bridge |
| OpenRouter (AI calls) | ~$20 | ZOE + agents |
| Neynar (Farcaster API) | ~$50 | Rate limits for bot fleet |
| Cloudinary (COC media) | ~$0-30 | Scales with uploads |
| Domain registrations | ~$5/mo amortized | ~5 domains |
| **Total infrastructure** | **~$140-170/mo** | Excludes Zaal time |

Key insight: **The full ZAO infrastructure runs for ~$150/mo.** Revenue>cost doesn't require a lot of revenue — it requires $150/mo from each of 2 businesses, or $300/mo total across both, to cover overhead.

---

## ZAO Project Revenue Audit

### WaveWarZ

| | |
|--|--|
| What it is | Onchain music battle protocol, 1,250+ battles logged |
| Revenue lever | Boardwalk token transfer fees (0.23-0.25% fee split) |
| Token graduation target | 10K volume at 10 ETH price |
| Current fee split design | 50% treasury / 50% active volunteer pool (doc 1338) |
| Monthly cost | ~$5 (VPS slice + Vercel) — WWtracker is static |
| Comparable | Zora: millions in protocol fees from creator tokens |
| Path to profit | Token graduates → transfer fees → treasury gets 50% → monthly surplus at even modest volume |

**24-month math:** If WaveWarZ Boardwalk token does $10K/day in volume at graduation, daily treasury fee ≈ $12.50 → $375/mo. At $50K/day: $1,875/mo. The WWtracker operational cost is near zero — any token volume above token launch costs puts this in profit.

**Honest risk:** Graduation from 10K/10E is an open market event, not a guaranteed outcome. The token needs to attract buyers. COC #7 is the first real live test of whether that community builds value.

---

### ZAO Newsletter (Paragraph @thezao)

| | |
|--|--|
| What it is | Daily "ZM" newsletter, 500+ free subscribers, 400+ editions |
| Revenue lever | Paragraph paid subscriptions ($5-10/mo) |
| Conversion baseline | 2% of free → paid is industry standard for newsletters |
| Monthly cost | ~$0 (Paragraph is free for newsletters; Zaal's time is the input) |
| 2% of 500 at $5/mo | $50/mo |
| 5% of 500 at $5/mo | $125/mo |
| 10% at $8/mo | $400/mo |

**24-month math:** The newsletter already exists and ships daily. Turning on Paragraph paid tiers requires one Zaal action (zero dev work). Growing to 1,000 free subscribers at 5% paid = $250-400/mo with zero infrastructure cost.

**Why this is cleaner than it looks:** The newsletter is the primary daily signal for the ZAO community — it's already the most-read thing in the ecosystem. Monetizing it doesn't change the product; it just adds a "support the ZM" tier. Paragraph handles billing. Zaal does nothing different.

**Honest risk:** The current community is builders who might resist paying for something they already get free. The pitch has to be framed as "sustaining the thing you rely on," not "paywalling content."

---

### COC Concertz

| | |
|--|--|
| What it is | Open music competition, 8 shows, WaveWarZ battles live from COC #7 |
| Revenue levers | Donations during stream, future ticket gating, sponsorships |
| Current cost | ~$40/mo (Vercel + Cloudinary) |
| Show frequency | Monthly or bimonthly |
| Grant potential | NEA, Maine Arts Commission — see doc 1320 |

**24-month path:** The show is currently free and ungated (COC #7 pilot dropped wallet gate entirely). Monthly cost is low. Revenue path requires: (a) adding a "tip jar" / donation model for live streams, or (b) a small show ticket (e.g., $5 USDC) for replay access. Even 20 paying viewers at $5 = $100/show. Two shows/month = $200.

**The honest bottleneck:** The COC audience isn't large enough yet to reliably convert. Monthly show revenue is uncertain until COC scales from 50 viewers to 500+. This is a 2027 bet, not 2026.

---

### ZAOstock (Annual Festival)

| | |
|--|--|
| What it is | Annual outdoor festival, Ellsworth ME, Oct 3 2026 |
| Revenue levers | Ticket sales + sponsorships (doc 1334: $4,750 conservative / $16K optimistic) |
| Annual cost | Venue + equipment + artist travel grants + logistics (~$3,000-5,000) |
| Break-even | $5,000 in ticket+sponsor revenue covers all costs |

**ZAOstock as a "business":** It's an annual event, not a monthly recurring revenue stream. It can be profitable per-event (revenue > cost for that one event) but doesn't produce monthly income. For the mentor framework, it's "break-even or surplus on an annual basis" not monthly.

If ZAOstock 2026 nets a $2,000 surplus, ZAOstock becomes a sustainable annual ZAO event. That's worth building toward but it's not the monthly-revenue answer.

---

## The 2-Year Answer

**Business 1: WaveWarZ / Boardwalk token**

Highest ceiling, clearest token-economics rationale. Low ongoing cost. The 24-month bet is: launch Boardwalk token (Q3 2026), grow to graduation volume (10K/10E), collect monthly treasury fees from transfer volume. If WaveWarZ has 1,250+ battles and a live community, the token has a narrative. This is the "moonshot that becomes a reliable fee machine" path.

Target: $200-2,000/mo in treasury transfer fees by July 2028, depending on token volume.

**Business 2: ZAO Newsletter (Paragraph paid tiers)**

Lowest-risk, fastest path to technical profitability. Zero dev work. One Zaal action to enable paid tiers. The community is already reading daily. Growing to $150-300/mo in paid subscriptions requires:
- 30-60 paid subscribers at $5/mo
- Or 20 subscribers at $8/mo "supporter" tier
- Current free list of 500+ makes this achievable through a single well-written "support the ZM" note.

Target: $150-300/mo by Q1 2027 (6 months to activate + grow).

---

## Why These 2 (and Not Others)

| Project | Monthly cost | Revenue ceiling | Path clarity | Verdict |
|---------|-------------|-----------------|--------------|---------|
| WaveWarZ/Boardwalk | ~$5/mo | Very high (token fees) | Token launch in Q3 2026 | **Top pick** |
| Newsletter | ~$0/mo | $200-500/mo at scale | One action to start | **Top pick** |
| COC Concertz | ~$40/mo | Moderate (donations/tickets) | Needs audience scale | Year 2 maybe |
| ZAOstock | ~$4K/year | $4K-16K/year | Annual, not monthly | Parallel bet |
| ZAO IP licensing | varies | $2.6K-5.5K/yr (doc 1315) | Depends on Greg/trademark | Year 2 maybe |

---

## What the Mentor Will Ask Next

**"What's the unit economics for WaveWarZ?"** → Transfer fee × daily volume. At $100K/day sustained volume: 0.125% treasury share = $125/day = $3,750/mo. That's the number to anchor on.

**"How many paid newsletter subscribers do you need to break even?"** → 30 at $5/mo = $150/mo = covers the entire ZAO infrastructure. Frame it as: "30 people sustaining everything."

**"What's blocking both from being profitable today?"** → WaveWarZ: token hasn't launched yet (Deez call week Jul 21). Newsletter: paid tiers not activated (one Zaal action).

**"What's your 2028 scenario if both work?"** → WaveWarZ token doing modest volume ($20K/day) + 100 paid newsletter subscribers = $600-1,000/mo total. The $150/mo infrastructure is covered 4-6x over. That's a sustainable base to grow ZAOstock + COC from.

---

## Open Questions for Zaal

1. Is the mentor looking for "revenue > Zaal's time cost" (much higher bar) or just "revenue > infrastructure cost" ($150/mo)?
2. Should Paragraph paid tiers go live before or after COC #7 (while the community is most engaged)?
3. Should this framework be turned into a 1-page "ZAO business case" for the mentor meeting?

---

## Next Steps

| Action | Owner | When |
|--------|-------|------|
| Activate Paragraph paid subscription tiers | Zaal | This week (one action) |
| Boardwalk token launch call with Deez | Zaal + Deez | Week of Jul 21 |
| Apply for Maine Arts Commission grant (supports COC/ZAOstock) | Zaal | Aug 2026 |
| Share this framework with mentor | Zaal | Next mentor call |
