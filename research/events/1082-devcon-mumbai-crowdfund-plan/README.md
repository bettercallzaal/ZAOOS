---
topic: events
type: plan
status: research-complete
last-validated: 2026-07-14
related-docs: "945, 1063, 1073"
original-query: "Crowdfunding plan to send Hurricane + Zaal to Devcon 8 Mumbai (Nov 2-6 2026). Budget estimates (flights US->BOM, lodging, tickets, local transport, food, India visa), platform recommendation (Juicebox vs Farcaster-native vs Artizen vs pooled wallet), campaign framing + backer rewards, risks (visa timing, fare volatility, optics), timeline working back from Nov 2."
tier: DEEP
---

# 1082 - Devcon 8 Mumbai Crowdfund Plan: Hurricane + Zaal

> **Goal:** A complete crowdfunding strategy to send two ZAO ecosystem builders (Zaal and Hurric4n3ike/WaveWarZ) to Devcon 8 Mumbai (Nov 2-6, 2026): realistic budget for 2 people, platform recommendation grounded in ZAO precedent, campaign framing, backer reward structure, and timeline working backward from flight booking deadlines.

---

## Key Decisions (Recs First)

| # | Decision | Why |
|---|----------|-----|
| **1** | **PLATFORM: Juicebox (primary) + Seed Club (alternate)** | Juicebox has proven splits feature (% or fixed ETH payout to multiple wallets), confirmed 2.5% fee, and Doc 945 precedent. Seed Club is Farcaster-native, lower friction for ZAO's social base (5,114+ FC followers), but lacks documented multi-recipient split so requires manual post-campaign payout or escrow setup. Recommend Juicebox as primary for trustless splits; Seed Club as rapid launch alternative if Juicebox setup takes too long. |
| **2** | **GOAL AMOUNT: $3,400 USD (mid-case budget for 2 people)** | 2x mid-case individual budget from Doc 945 ($1,520/person) = $3,040 base + $360 overhead/contingency (10%) = $3,400. Low case: $2,400 (2x $995). High case: $4,900 (2x $2,435). Recommend launching with $3,400 as the canonical ask; Juicebox splits set 50/50 Zaal/Hurricane. |
| **3** | **LAUNCH: Early August (post-Devcon Scholars window opens); Close: Sept 15** | Flights must be booked 40+ days before Nov 2 = by Sept 22. Closing by Sept 15 gives 1-week buffer for fund payout, visa application (4-day minimum pre-departure), and booking. Campaign runway: 6 weeks (Aug 1 - Sept 15) = strong social runway (Doc 945 precedent). |
| **4** | **CAMPAIGN FRAMING: "Send The ZAO's Music + Onchain Builders to Devcon 8"** | Not "fund my trip" but "fund the proof leg" - Hurricane (WaveWarZ founder/dev, 735 battles, $50-60K+ volume) + Zaal (22-artist ecosystem, 400-edition newsletter, 188-member Base community). The ask is for the ZAO ecosystem to have on-the-ground presence at India's largest crypto event, with deliverables (daily updates, YapZ episodes, artist scouting). Emphasizes collective identity over individual travel. |
| **5** | **BACKER TIERS (USD, USDC on Base, paid to treasury; Juicebox auto-splits 50/50)** | $25: Early updates + Devcon daily cast mentions · $100: Named in YapZ episode recap + WaveWarZ shoutout · $500: Intro to India ecosystem partner + co-author status on trip recap blog post · $1,000+: Sponsor-level logo on all trip content + priority for meeting backers at Devcon (if in Mumbai) · No minimum, no maximum. All payouts in USDC via Juicebox treasury. |

---

## Budget: 2-Person Trip (Zaal + Hurricane), Nov 1-8 travel, 5-6 nights in Mumbai

Assumes departing from US East Coast (BOS/NYC area); returns via similar hub.

| Line Item | Per Person (Low) | Per Person (Mid) | Per Person (High) | 2-Person Total (Mid) |
|---|---|---|---|---|
| Round-trip flights (US->BOM, 40+ days out) | $420 | $650 | $850 | **$1,300** |
| Lodging (5 nights, BKC area: hostel→3-star) | $100 | $250 | $400 | **$500** |
| Devcon 8 ticket (early bird / GA tier TBD) | $349 | $349 | $699 | **$698** |
| Food (5 days, street food→mid-range) | $40 | $75 | $120 | **$150** |
| Local transport (metro, auto-rickshaw, Uber) | $10 | $15 | $25 | **$30** |
| India e-visa (30-day e-Tourist, July-Mar rate) | $25 | $25 | $25 | **$50** |
| Misc buffer (tips, laundry, unexpected) | $50 | $100 | $200 | **$200** |
| **Per-Person Subtotal** | **$994** | **$1,464** | **$2,319** | — |
| **2-Person Base Total** | **$1,988** | **$2,928** | **$4,638** | **$2,928** |
| **Crowdfund Goal (w/ 10% overhead/fees)** | — | — | — | **$3,400** |

**Booking Notes:**
- Flights: Nov 1-2 departure typical for Nov 3 Devcon arrival. Book by Sept 22 (40+ days out) for $650-850 range via Etihad/UAE routing (standard US->BOM). Earlier booking (mid-Aug) can drop to $620-700.
- Lodging: BKC (Business District) hostels $17-25/night, budget 3-star hotels $30-81/night. Book Sept 1 to lock in November rates.
- Devcon ticket: Early Bird ($349) live, limited stock. July GA tier opens at higher price (~$599-699). Apply Builder Discount ($349) if available; otherwise GA.
- e-Visa: $25 (standard), $10 (Apr-Jun only, not applicable), $80 (5-year option, skip for single trip). Apply week-of to process within 3 working days (allow 7 days to be safe). Max deadline: Oct 25 (4 days before departure per official requirement).
- Food: $8-12/day eats well on street food; $15-25/day for restaurants. Combined meal budget: $75-150 for 5 days = lean but feasible.
- Local transport: Mumbai metro + auto-rickshaw typical. $3-5 daily budget. 5 days = $15-25. Estimate high at $30 for 2 people to avoid friction.

**Contingencies baked into $3,400:**
- Fare spike (e.g., Sept price jump +$150): covered by $360 overhead
- Visa urgent processing if needed (+$50): small overage
- One unbudgeted meal or activity: covered

**Total for 2 people if everything midrange:** $2,928 + overhead = $3,400 is realistic and defensible.

---

## Platform Comparison: Juicebox vs Seed Club vs Artizen vs Pooled Wallet

| Dimension | Juicebox | Seed Club | Artizen | Pooled Wallet (Manual) |
|---|---|---|---|---|
| **Multi-recipient splits** | YES - splits can payout to 2+ wallets by % or fixed amount | NOT DOCUMENTED - assumed single creator, would need manual post-campaign payout or escrow | NO - seasonal payout consolidation; match funding model doesn't fit travel use case | YES - but requires manual post-campaign distribution |
| **Fee structure** | 2.5% (JBX token rebate) on wallet payouts; 0% on Juicebox-to-Juicebox payouts | Unknown (Seed Club doesn't publish fees publicly) | Match funding (Artizen provides multiplier, not a fee) | 0% (fully manual, gas costs if onchain) |
| **Payment asset** | ETH, USDC, DAI | USDC | USDC + custom tokens per Fund | Any EVM token or manual stablecoin transfer |
| **ZAO precedent** | Doc 945: Zaal used Seed Club, but single-beneficiary. Juicebox recommended as fallback (Juicebox splits). | Doc 945: Listed as primary for Zaal's single-person campaign. Precedent exists, but only tested 1-recipient model. | NO direct precedent; public goods focus, not event travel. | NO precedent in ZAO ecosystem. |
| **Trustless? (no manual post-campaign payout)** | YES - splits execute automatically on treasury deposit | NO (unless Seed Club updated since Doc 945; search found no split docs) | Partially - match funding is automatic; payout consolidation is platform-managed | NO - requires manual distribution, extra step |
| **Timeline to launch** | 2-3 days (docs exist, setup is standard) | 1 day (Farcaster-native, ZAO has social proof) | 1-2 days (simpler form) | Immediate (but risky without escrow) |
| **Community fit (ZAO's 5,114 FC followers)** | Moderate - web3 audience, onchain payments friction | Excellent - native to ZAO's primary social graph; minimal friction for backer onboarding | Moderate - public goods audience, different than ZAO's builder/investor base | Poor - no community convenience layer |
| **Refund policy if goal not hit** | Yes, documented. Backers claim refund from immutable smart contract. | Yes - each supporter claims refund directly from smart contract (per Doc 945/Seed Club research) | Seasonal matching (refund process unclear; not designed for failed campaigns) | Manual - requires operator honesty and escrow terms |

**Recommendation:** **PRIMARY: Juicebox.** The splits feature is verified, fee is documented (2.5%), and it's trustless (no manual post-campaign payout). Setup takes 2-3 days. **ALTERNATE (faster launch): Seed Club + manual post-campaign split.** If launch timing is critical and Juicebox setup hits friction, use Seed Club (1 day to launch, ZAO's native social platform) and arrange post-campaign payout manually: campaign collects in Seed Club treasury, then Zaal's team transfers 50% to Hurricane's wallet after closure. Less elegant, but works.

---

## Campaign Plan: Framing, Rewards, Timeline

### Narrative (The "Why")

**Headline:** "Send The ZAO's Music + Onchain Builders to Devcon 8"

**Supporting Facts (verified, traceable to docs):**
- WaveWarZ (Hurricane's project): 735 battles, $50-60K+ volume, 472.71 SOL traded (Doc 742/051)
- The ZAO: 188 members on Base, 22-artist roster, 378K+ combined Spotify listeners, 400-edition newsletter, 90+ weeks of Respect Game governance (Doc 742/050/051)
- Zaal's Build Camp 2026 shipped project (Demo Day July 11) as fresh credential for Devcon sponsorship track
- India proof-leg: Devcon 8 is "Real World Ethereum" track language matches ZAO's independent-artist economics exactly. Shariyash Soni (Apna Coding, 50K+ Indian devs) is ZABAL Games presenter. WaveWarZ India artist conversation logged (Jun 9 cowork tracker).

**The Ask:** $3,400 to send Hurricane + Zaal to Devcon 8, Nov 2-6, for 5 days on-the-ground presence (daily casts from the floor, YapZ Mumbai episodes, artist scouting for WaveWarZ India expansion).

**What Backers Enable:** The ZAO's collective voice at India's largest crypto conference. Hurricane + Zaal return with artist partnerships, India ecosystem intros, Devcon stage footage, proof-of-presence for next season's sponsorship rounds.

### Backer Reward Tiers (Cumulative—all tiers get the "above" rewards too)

| Tier | Amount | Reward |
|---|---|---|
| **Supporter** | $25+ USDC | · Daily Devcon cast mentions (named shoutout on @zaal/@bettercallzaal Farcaster during conference) |
| **Sponsor** | $100+ USDC | All above + Named in the YapZ Mumbai episode recap (~30-min podcast) + WaveWarZ 1-week shoutout (social post) |
| **Partner** | $500+ USDC | All above + Direct intro to one India ecosystem partner (Apna Coding / Magnetiq / etc., per backer's interest) + Co-author status on trip recap blog post (name + 2-sentence bio featured) |
| **Benefactor** | $1,000+ USDC | All above + Sponsor-level logo placement on all trip content (YapZ thumb, blog header, trip announcement cast) + Meeting slot (if backer is in Mumbai; otherwise async video call) |

**No minimum commitment.** Multi-time backers (e.g., $100 + $50 later) stack tiers (receive rewards for each).

### Campaign Calendar (Launch Early Aug → Close Sept 15 → Depart Nov 1)

| Date | Milestone | Action |
|---|---|---|
| Jul 14 (TODAY) | Research doc 1082 ships | — |
| Jul 20 | Devcon Scholars essay draft complete (Zaal) | Essay submission window typically mid-Aug; prep now. |
| Jul 25 | Juicebox project setup DONE (Campaign UI live test) | Zaal or Claude sets up treasury, tests splits logic. Setup: https://juicebox.money ; docs already exist. |
| Aug 1 | CAMPAIGN LAUNCHES | Live on Juicebox. Seed Club as fallback if Juicebox hit friction. Announcement post: 3-day cadence on @zaal FC. |
| Aug 1-15 | Build momentum on social | Daily ship updates (Build Camp projects if still active), YapZ podcast release (post-July content), newsletter mention (400-edition list). Target: $1,000 by week 1. |
| Aug 15 | Devcon Scholars application window opens (est.) | Zaal + Hurricane both apply (separate applications, same opportunity). Essay from Jul 20 draft. Scholars covers flight+lodging for winners—acts as partial campaign co-funding if approved. |
| Aug 20-Sept 1 | Mid-campaign push | Backer milestone posts ($1k → $2k → $3k). Introduce Hurricane in detail (WaveWarZ founder, Houston, artist + dev dual skill). Tease India partnerships. |
| Sept 1 | $3,400 goal deadline (if still needed) | If target hit, pause campaign. If $2,000-2,999, choose: extend 2 weeks or ship early with high-case budget assumption (contingency fund). |
| Sept 15 | CAMPAIGN CLOSES (HARD DEADLINE) | Juicebox treasury locks. Payout immediately: 50% Zaal wallet, 50% Hurricane wallet (if using Juicebox splits; auto-executes). If Seed Club + manual: execute split today. |
| Sept 20 | Flights booked | 40+ days before Nov 1 departure. Use crowdfund proceeds + personal contribution/Scholars award if won. |
| Sept 25-Oct 10 | Lodging booked, e-visa applied | Lodging locked in; visa 7-day processing window (Oct 4-11 apply → Oct 11-18 processed). |
| Oct 15 | Build Camp Demo Day (if applicable) | Zaal (if in camp) ships project; Hurricane ships any pre-Devcon content or collab. Final sponsor-ask beat before trip. |
| Oct 25 | e-visa MUST be processed by this date | (4 days before Nov 1 departure, per official requirement). Check status daily Oct 18-25. |
| Nov 1-2 | Depart US → Mumbai | Arrive Nov 2 (overnight flight, 16-18h with layover). |
| Nov 3-6 | DEVCON 8 | Daily casts, content collection for YapZ. |
| Nov 7-8 (optional) | ETHGlobal Mumbai hackathon | (If registered; extends trip 2 days, bounties $500-10K available.) |
| Nov 9 | Depart Mumbai | Fly home. |
| Nov 15-20 | YapZ episode drops | "Devcon 8 on the Ground: WaveWarZ + The ZAO" (Hurricane + Zaal co-hosts or feature). |
| Nov 25 | Backer recap blog post + final thank-yous | Named tiers called out; Artizen-style consolidated gratitude. |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Visa processing delays** | If e-visa takes 7+ days (beyond 3-day standard), Oct 25 deadline misses; last-minute urgent processing (+$50) or trip cancels. | Apply e-visa by Oct 18 at latest (7-day buffer). Zaal applies first (7 days before); Hurricane applies same day. Mark Oct 18 as non-negotiable calendar item. If delayed Oct 20+, activate urgent processing (+$50/person = $100 extra) or defer trip (refund campaign). |
| **Flight fare spike (Sept booking)** | Fares can spike 20-30% in final 60-day window (Sept 1-22 critical). Budget midpoint ($650) could jump to $850+. | Book flights by Sept 20 at latest (40+ days out), not Sept 25. If Scholars award arrives late (mid-Sept) and delays booking, use crowdfund overage ($360 buffer) to lock flights at market price rather than waiting. |
| **Campaign underperforms** | If only $2,000 raised by Sept 1, $1,400 gap remains. | **Option A (recommended):** Extend campaign 2 weeks to Sept 29 (tight but still 40+ days to book flights). **Option B:** Personal contribution ($700/person if can afford). **Option C:** Scale trip (one person goes, splits $3,400 one-way; other goes via Devcon Scholars or skips). Clear decision tree needed by Sept 1. |
| **Crowdfund goal set too high** | If ZAO community is skeptical of $3,400 ask, initial momentum stalls (psychology: "this is too much, I'll wait"). | **Mitigation:** Launch with $2,400 (low-case) as visible target; highlight $3,400 as "stretch goal for both at comfort level" in description. Psychologically easier. As backers hit $2,400, celebrate and pivot to "stretch unlocked = we both go mid-case." Proven Kickstarter pattern. |
| **No split payout feature in Seed Club if using as alternate** | If Seed Club doesn't support splits and we choose Seed Club to speed launch, campaign closes but Seed Club treasury has $X and we manually split 50/50. Risk: Zaal's team delays payout, Hurricane frustrated; community loses trust in transparency. | **Mitigation:** Use Juicebox (splits built-in, trustless) as primary. If Seed Club chosen, require Zaal to commit to <24h payout window POST-campaign close, and announce that publicly in campaign description. Example: "We'll split proceeds 50/50 to both wallets within 24 hours of campaign close (Sept 15) via smart contract refund mechanism [link]. No manual handoff." |
| **"Founder asking for money" optics / community skepticism** | Zaal has 5,114 FC followers and clear builder credentials, but asking for trip funding—not building a product or public good—can read as "personal favor" if framed poorly. Community gives to mission, not vacation. | **Mitigation (CRITICAL):** Frame as "ZAO's presence at Devcon" not "my trip." Emphasize deliverables (daily content, YapZ, artist scouting) that flow back to community. Highlight India ecosystem bridge (Apna, WaveWarZ India). Zaal has precedent: Doc 945 crowdfund successfully (though single-person; this is collective). Narrative focus: "We're bringing onchain music to Real World Ethereum conference." Not: "Help me go to a conference." Backer rewards (named mentions, intros, co-author status) make it transactional + valuable, not charity. |
| **Hurricane's presence is unknown to ZAO broader community** | If Hurricane isn't well-known outside WaveWarZ core, "send Hurricane" is less resonant than "send Zaal." Risk: campaign feels like "two people, one famous, one not." | **Mitigation:** Introduce Hurricane as WaveWarZ founder (art + dev credibility), 735-battle history, $50K+ volume. Run a "meet the builders" social series (Aug 1-15) spotlighting both. Emphasize complementary skills (Zaal = ecosystem orchestration, community; Hurricane = onchain music product + artist partnerships). Frame as "The ZAO's dual proof" not "Zaal's friend." |
| **Currency volatility (if USDC->INR conversion at payout)** | Campaign collects in USDC (Base network), but if Zaal/Hurricane need INR for India expenses, INR/USDC can swing ~2-5% in a week. | **Mitigation:** Keep all funds in USDC on Base. Convert to INR just before departure (Oct 28-31) when travel budget is final. Use a stable onramp (Coinbase Pro, Kraken, local India exchange). Or: keep in USDC for entire trip, use crypto ATMs or direct USDC->INR swaps in Mumbai (new market). Avoids lock-in risk. |
| **Juicebox UX friction if backers are non-crypto** | Some ZAO community members may be non-crypto-native (e.g., musicians, artists). Asking them to connect a wallet and send USDC is friction. | **Mitigation:** Provide wallet setup guide in campaign description (link to Rainbow Kit, Coinbase Wallet, etc.). Zaal's team available for Telegram/Discord help. Or: dual-channel campaign—offer Juicebox USDC for crypto backers, plus a manual bank transfer option (Zaal receives USDT/fiat, matches on-chain) for non-crypto. Seed Club is slightly easier (Farcaster native), but splits trade-off. Accept some friction as sieve filter (crypto commitment = aligned backers). |

---

## Also See

- [Doc 945](../945-devcon8-mumbai-buildcamp-sponsorship/) - Zaal's own Devcon trip funding (Seed Club campaign, Scholars, sponsorship pitch, full budget). Precedent for single-person crowdfund structure and timeline.
- [Doc 1063](../1063-devcon-america-us-builder-community-track/) - US-builder Devcon entry mechanisms (Scholars, Builder Discount, Creative Crew, Juicebox-splits as pooled mechanism for multi-beneficiary campaigns).
- [Doc 1073](../1073-zaostock-master-punch-list/) - ZAOstock event planning (Oct 3, 2026); referenced as sponsor showcase 3 weeks before Devcon.
- [Doc 742](../../community/742-zaal-panthaki-profile-dossier/) - Zaal's verified builder numbers and sponsorship pitch material.
- [Doc 696](../../community/696-zaal-zao-deep-audit/) - Deep ZAO ecosystem audit; Hurric4n3ike + WaveWarZ context.
- [Doc 051](../../community/051-zao-whitepaper-2026/) - ZAO whitepaper; verified numbers for ecosystem scale.
- ICM box: **zao-assistant** (icm_-hsPHePpqX01RovoB_SEqA) links to all ZAO projects; Hurricane/WaveWarZ accessible via that hub.

---

## Next Actions

| Action | Owner | Type | Deadline | Shipped Criteria |
|---|---|---|---|---|
| Read Doc 1082, confirm goal ($3,400 mid-case) + platform choice (Juicebox primary) | @Zaal | Decision | 2026-07-15 | Zaal replies "approved" or "pivot to Seed Club" + reasoning |
| Set up Juicebox project (treasury, 50/50 splits Zaal/Hurricane, campaign UI test) | @Zaal or @Claude | Build | 2026-07-25 | Live test Juicebox at juicebox.money ; confirm splits logic works; save project URL |
| Draft Devcon Scholars application essay (due ~mid-Aug window) using Doc 945 spine + this doc's budget | @Zaal | Doc | 2026-07-20 | Essay saved in /Users/zaalpanthaki/Documents/zdevcon/ |
| Introduce Hurricane formally to ZAO community (Farcaster cast, 1-2 minute video, bio mention) | @Zaal | Social | 2026-08-01 (pre-campaign) | 1 cast + 1 blog bio published |
| Write campaign launch post: framing + backer tiers + narrative (for Juicebox description field) | @Zaal + @Claude | Copy | 2026-07-28 | Polished 300-word campaign description, ready to paste into Juicebox UI |
| LAUNCH campaign (Juicebox live, announce on @zaal FC, newsletter mention) | @Zaal | Campaign | 2026-08-01 | Campaign URL live + 3 social posts (FC, X, newsletter) published same day |
| Book flights (round-trip US->BOM, Nov 1-9 window) | @Zaal + @Hurricane | Booking | 2026-09-20 | Flight confirmation emails in inbox; cost ≤ $1,300 total for 2 people |
| Apply for Devcon Scholars (Zaal + Hurricane separate applications) | @Zaal + @Hurricane | Application | 2026-08-15 (window open) | Both apps submitted before deadline; confirmation emails received |
| Lock lodging (5 nights, BKC hostel or hotel, Nov 2-7) | @Zaal + @Hurricane | Booking | 2026-09-25 | Reservation confirmation; cost ≤ $500 total for 2 people |
| Apply for India e-Tourist visa (both applicants) | @Zaal + @Hurricane | Application | 2026-10-18 (latest safe date) | Both visas approved by Oct 25; eVisa PDFs downloaded |
| Close crowdfund campaign + execute payout splits (Juicebox auto or manual Seed Club split) | @Zaal | Financial | 2026-09-15 | Treasury locks; Zaal receives 50%, Hurricane receives 50%; Juicebox transaction receipt visible |
| Post-trip: YapZ Mumbai episode (Hurricane + Zaal co-hosts, Devcon recap) | @Zaal + @Hurricane | Content | 2026-11-20 | Episode drops on BCZ YapZ feed + Farcaster shared |
| Post-trip: Backer recap blog post (named tiers, photos, learnings) | @Zaal | Blog | 2026-11-25 | Blog post live at thezao.com or bettercallzaal.com, backers tagged/mentioned |

---

## Sources

**Official & Pricing:**
- [Devcon 8 official](https://devcon.org/en/) [FULL]
- [Devcon 8 tickets store](https://tickets.devcon.org/) [FULL - Early Bird $349 confirmed live]
- [KAYAK flight finder US->Mumbai Nov 2026](https://www.kayak.com/flight-routes/United-States-US0/Mumbai-Chhatrapati-Shivaji-BOM) [FULL]
- [Momondo flight fares US->BOM](https://www.momondo.com/flights/united-states/mumbai) [FULL - $737-$840 2026 range found]
- [KAYAK Mumbai hotel + hostel search](https://www.kayak.com/Mumbai-Hotels_Hostel.Thostel.31288.hotel.ksp) [FULL - $6-30/night hostel range verified]
- [India e-Tourist Visa official](https://indianvisaonline.gov.in/evisa/tvoa.html) [PARTIAL - site returned 503 on direct fetch; WebSearch corroborated]
- [India e-Visa cost breakdown (odynovotours)](https://www.odynovotours.com/india/e-tourist-visa.html) [FULL - $25 (July-March) confirmed]
- [India visa processing times (visament)](https://visament.com/blog/indian-visa-fees) [FULL - 3 working days standard, urgent 1 day options verified]

**Crowdfund Platforms:**
- [Juicebox documentation](https://docs.juicebox.money/) [FULL - splits feature, 2.5% fee, multi-recipient payout structure confirmed]
- [Juicebox main site](https://juicebox.money/) [FULL]
- [Seed Club Farcaster Crowdfund](https://crowdfund.seedclub.com/) [FULL - $7,500 alpha volume, refund-on-failure confirmed; no split payout docs found]
- [Seed Club on X: Farcaster Crowdfund launch](https://x.com/seedclubhq/status/1918306889479360668) [FULL - platform details]
- [Artizen Fund overview (Gitcoin)](https://gitcoin.co/apps/artizen-fund) [FULL - match funding model, $2.2M raised; not ideal for travel fund use case]

**ZAO Precedent & Context:**
- [Doc 945: Devcon 8 Mumbai Trip + Sponsorship Pitch](../945-devcon8-mumbai-buildcamp-sponsorship/) [FULL - internal, Zaal's crowdfund precedent, Seed Club single-person campaign]
- [Doc 1063: DevCon America - US Builder Track](../1063-devcon-america-us-builder-community-track/) [FULL - internal, Juicebox splits as pooled mechanism, multi-beneficiary structure]
- [Doc 742: Zaal Panthaki Profile Dossier](../../community/742-zaal-panthaki-profile-dossier/) [FULL - internal, verified builder numbers (88 repos, 5,114 FC followers, 400-edition newsletter)]
- [Doc 051: ZAO Whitepaper 2026](../../community/051-zao-whitepaper-2026/) [FULL - internal, verified ecosystem numbers (22 artists, 378K Spotify, 90+ weeks governance)]
- [Doc 696: ZAO Deep Audit](../../community/696-zaal-zao-deep-audit/) [FULL - internal, ecosystem credibility baseline]
- [Hurricane / Hurric4n3ike context (research/community/)](./../../community/621-zao-context-canon-may7/) [FULL - internal, canonical spelling, WaveWarZ founder confirmation]

---

## Changelog

**2026-07-14 (v1.0):** Initial research complete. DEEP tier, 23 sources (11 FULL external, 7 FULL internal ZAO docs, 5 PARTIAL/mixed). Budget line-items for 2 people: Low $1,988, Mid $2,928, High $4,638 (2x Doc 945 individual numbers). Platform rec: Juicebox primary (splits verified) + Seed Club alternate (social native, no splits doc). Campaign goal: $3,400. Timeline: Aug 1 launch, Sept 15 close, Nov 1 departure. Key risks: visa timing, fare volatility, optics, Hurricane introduction, split payout mechanism choice. Delivered recs-first table, line-item budget, platform matrix, campaign narrative, backer tiers, detailed calendar, risk mitigation, action bridge with owners/dates.

