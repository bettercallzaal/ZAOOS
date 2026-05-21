---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: "497, 498, 499, 501, 502"
tier: STANDARD
original-query: "Map DAO event coordination patterns (FWB, Nouns, Devconnect, Loomio) to ZAOstock 18-person team (reconstructed)"
---

# 500 — DAO Event Coordination Patterns - Real-World Mechanics

> **Goal:** Document proven patterns for non-hierarchical event coordination in DAOs (250+ FWB events, Nouns grants, Devconnect 14K attendees) and recommend tools for ZAOstock Sept-Oct push

## Key Decisions

1. **Loomio for fast consent voting** - "Safe to try" decisions over top-down approval. Best for ZAOstock because (a) non-web3 team members can understand it instantly, (b) it surfaces objections before they derail planning, (c) it's not blockchain-based (zero friction).

2. **Coordinape for monthly Respect-lite recognition** - Peer-gifted GIVE tokens tied to visible work. Complements formal Respect without competing. Only viable if epochs are ~4 weeks to track contributions coherently.

3. **FWB's "Event Keys" model as primary pattern** - Decentralized event funding + local stewardship. One coordinator per work stream, autonomy within budget, monthly check-ins. Proven at 250+ global meetups.

4. **DO NOT adopt Snapshot voting for logistics** - Designed for treasury/strategic decisions, kills decision velocity when applied to "which venue" or "when does setup start." Adds 3-5 days overhead per decision.

5. **Devconnect's "Community Hubs" as backup coordination** - Topic-specific sub-working-groups that own one pillar (sponsorships, music curation, volunteer ops). Only if team grows past 18.

---

## Pareto: 80/20 for ZAOstock Sept-Oct Push

**80% of coordination happens via:**

- Loomio (one consent thread per decision category: venue, budget, timeline, line-up)
- Discord (async #announcements, #decisions, #sos for last-minute escalations)
- Weekly 30-min all-hands (status, blockers, next week's decisions to Loomio)
- RACI matrix in Notion (who decides / who advises / who executes / who's informed per stream)

**20% needs tooling:**

- Coordinape circles if Zaal wants monthly peer-recognition (skip if complexity not worth it)
- Guild.xyz to gate role-specific channels (e.g., sponsorship team only sees sponsor comms)
- Simple shared calendar for deadlines + go/no-go gates

---

## Tool Comparison Matrix

| Tool | Use Case | Team Size | Web3 Literacy | Friction | Cost |
|------|----------|-----------|--------------|----------|------|
| **Loomio** | Fast consent + objection surface | 6-50 | None required | Very low - Discord-like UX | Free tier OK |
| **Coordinape** | Peer recognition + compensation | 5-20 per circle | Medium - wallet req'd | Medium - learning curve | Free |
| **Guild.xyz** | Role-based channel access | Any | Low | Low - one-click gating | Free |
| **Charmverse** | Proposals + docs + kanban | 5-30 | Low | Medium - Notion alternative | Free tier OK |
| **Snapshot** | Treasury / strategic votes | Any | Low | High - 3-5 day delay | Free |
| **Sobol** | Org charts + skill mapping | 10-50 | Low | Medium - UI dense | Freemium |
| **Luma/Eventbrite** | Event ticketing | Any | None | Low | 1-3% fees |

**Recommendation:** Loomio + Discord + Notion calendar. Skip Coordinape unless monthly peer comp is core to ZAO culture.

---

## How Nouns DAO Funds Events Then Lets Organizers Go

Nouns operates a "layered funding" model:
1. On-chain proposal for $N ETH to event class (e.g., "ETHDenver activation")
2. Designated event coordinator ("Events Residency") gets NFT + budget
3. Coordinator operates autonomously - books venue, partners, production - with monthly check-ins
4. Post-event report submitted; remaining funds returned or rolled to next event

Key insight: **Prop House competitive grants** (5-10 teams pitch, community votes on proposals, one wins) = faster, higher quality organizing. For ZAOstock: one "festival ops" proposal, Zaal approves lead, they build the team.

Nouns Builder docs show this explicitly: "Assign a lead or team for coordination. Use shared docs or Notion for logistics. Publicize events across Discord, Warpcast, and Twitter."

Applies to ZAOstock: Zaal's role = approve strategy + final sign-off. Working leads own execution.

---

## FWB Event Keys Pattern (250+ Global Events Proof)

FWB's breakthrough: **event teams apply for $budget**, get approved, execute autonomously.

**Structure:**
- City-level org team nominates lead
- Lead writes 1-page proposal (what, where, when, budget, expected attendance)
- FWB governance votes (usually Snapshot, <48hr)
- If approved: lead gets budget, assets (graphics, brand), promotion boost
- Lead runs event; submits post-event photo + attendance count
- DAO recognizes participation via POAP (proof of attendance NFT)

**Why this scales:**
- Removes "ask permission for every detail" friction
- Budget cap keeps risk bounded ($500-$2K per local event)
- POAP creates accountability (if you ran it, you get one; builds reputation)
- Decentralized execution but coherent branding

**For ZAOstock:** 3-4 sub-event tracks (music curation, sponsorship ops, volunteer coordination). Each gets ~$5K budget, lead, monthly FWB-style standup. Works for 18-person team across 6-month timeline.

---

## Devconnect's Scaled Coordination (14K+ attendees)

Devconnect 2025 (Buenos Aires) involved:
- 1 centralized "World's Fair" hub (EF-run)
- 40+ independent deep-dive events (community-run)
- 500+ side events across city (informal)
- 200+ volunteers

**Coordination mechanics:**
- Decentralized Event Hosts own their track (staking summit, defi, privacy, etc.)
- Shared Devconnect Telegram (Zupass-gated, no spam)
- Single shared calendar + community-curated alternate calendars (Luma, CryptoNomads)
- "Discussion Corners" - bookable 30-min slots for emergent sessions

**Friction point:** Overlapping events forced attendees to choose; no integrated logistics. Lesson: ZAOstock should block time for each pillar (music day 1, artist talks day 2, cyphers evening, etc.) to avoid this.

**For ZAOstock:** If you grow past 18, adopt "Community Hubs" = breakout working groups per stream (music curation, ops, comms, web3). Each owns their piece, weekly sync on the main call.

---

## EthTurin / SpaghettETH Model (Matteo Tambussi)

SpaghettETH (5-10 core team, 1-2 founders) runs:
- Annual ETHTurin hackathon (IRL, Ethereum-focused)
- Quarterly SpaghettETH educational events
- "On-chain music copyright management" R&D
- Crypto Open Mic (regular events)

**Structure:**
- Matteo + Maria = co-founders; both wear multiple hats
- Small team (sub-10) means high trust, low process overhead
- No formal governance votes; decisions by consensus in small Discord
- GitHub + HackMD for docs; Airtable/Typeform for registration

**Key pattern:** Flat orgs <10 people CAN skip Loomio/Snapshot. Just need:
- 1-2 decision-makers (Matteo + Maria)
- Weekly Telegram sync (15 min)
- GitHub issues for todos
- Verbal consent = sufficient

**For ZAOstock:** If Zaal + 1-2 co-leads make final calls, you can run more autocratically. But 18 people = you'll hit "who decides?" friction at week 3. Loomio acts as a pressure relief: "let's vote on this" signals respect for the team.

---

## Metagov's Recommendation: Deliberative Arc

Metagov (governance research collective) maps all tools to a decision cycle:

```
Evaluating -> Agenda Setting -> Eliciting -> Learning -> Deliberating -> Proposing -> Deciding -> Actuating
```

For **event ops**, you need:
- **Evaluating:** "What's working this week?" (standup)
- **Proposing:** "Should we move the venue?" (Loomio thread)
- **Deciding:** "Consent to Hilton if parking is free?" (Loomio consent vote)
- **Actuating:** "Zaal books it" (execution by assigned lead)

Don't over-invest in learning/deliberating unless the decision is strategic (e.g., "What's the vibe of ZAOstock?"). For logistics, keep it tight.

---

## The Single Biggest DAO-Native Trap: Blockchain Theater

**Do not do this:**
- Voting on event details via Snapshot (adds 5-day latency)
- Requiring POAP/NFT attendance gates for team meetings (creates access friction for non-crypto folks)
- Using a multisig to approve budget spend (kills agility when you need $500 fast for a prop mishap)
- DAO-level discussions of "should we hire a photographer?" (that's ops, not governance)

**Why it fails:** Crypto-native teams often conflate governance (who decides strategy) with operations (how do we execute). Voting on operations via blockchain = killing velocity. Operations need fast local calls. Governance needs deliberation.

**ZAOstock rule:** Governance decisions (budget, dates, brand) go to Loomio. Ops decisions (which photographer, when load-in happens) stay in Discord/Notion. Zaal + 1-2 co-leads have veto on either layer if things get weird.

---

## Coordinape Viability for ZAO Respect Ecosystem

**Could Coordinape work as "Respect-lite for ZAOstock contributors?"**

Possibly, but narrow fit:

**YES if:**
- ZAO wants monthly peer-recognition separate from official Respect (e.g., "ZAOstock team gives GIVE to each other for sweat equity")
- Epochs align with ZAO's monthly governance rhythm
- Non-financial (GIVE -> recognition, not -> USD payout; optional USD reward later)
- Team size stays 15-25 (Coordinape friction spikes past 30)

**NO if:**
- "We'll just use Respect tokens directly" (official system is simpler)
- "We want to pay people monthly from festival budget" (use simple Notion tracker + Zaal pays via bank)
- Team has non-crypto members who find wallet setup annoying

**Recommendation:** Trial Coordinape for Sept-Oct only if Zaal believes peer recognition will improve team cohesion. Otherwise, recognize wins in all-hands + thank-you thread in Discord.

---

## Comparison: Loomio vs. Snapshot vs. Telegram Poll

| Scenario | Tool | Reason |
|----------|------|--------|
| "OK to move sponsorship deadline from Aug 20 to Sept 5?" | Loomio consent | Fast (24hr), surfaces objections, no blockchain |
| "Should ZAOstock be music-first or community-first?" | Loomio sense-check | Multiple rounds possible, builds agreement |
| "Do we vote to mint ZABAL for attendees?" | Snapshot | On-chain + governance token = needs formal vote |
| "Quick gut check: venue A or B?" | Telegram poll | Informal, fast, not binding |
| "Who will lead sponsorship outreach?" | Loomio or async Notion | Nominate, then consent |

---

## Next Actions

### Immediate (Week 1)
- [ ] Set up Loomio community for ZAOstock (free tier)
- [ ] Draft RACI matrix in Notion: who decides/advises/executes per stream
- [ ] Share this doc with 18-person team
- [ ] Schedule weekly 30-min all-hands (Zaal, 2 co-leads, working leads only)

### Short-term (Weeks 2-4)
- [ ] Post first Loomio decision: "Consent to Oct 3 date + Franklin St Parklet venue?"
- [ ] Trial Discord role-based channels (via Guild.xyz if needed)
- [ ] List all Sept-Oct decisions that need consensus; queue them for Loomio

### Medium-term (Weeks 5-16)
- [ ] Monthly check-ins with each work stream lead (5-min sync)
- [ ] Post-event: record lessons in Notion for next ZAO event

### Skip for Now
- Snapshot voting on logistics
- Coordinape circles (unless Zaal requests peer recognition)
- Charmverse or any "project management" tool (too much overhead pre-event)

---

## Sources

- [Nouns DAO Discourse - Event Coordination](https://discourse.nouns.wtf/t/discussion-proposal-to-decentralize-and-delegate-treasury-management-execution-for-nouns-dao/5440) [PARTIAL] — Prop House competitive grants pattern, "Events Residency" model documented. Verified 2026-05-20.
- [ETHDenver / SporkDAO - Patronage Model](https://www.dlnews.com/research/internal/ethdenver-returns-for-its-ninth-edition-driving-web3s-global-agenda-for-2026/) [PARTIAL] — Community profit-share model. Verified 2026-05-20.
- [Devconnect Argentina 2025 - Decentralized Event Week](https://blog.ethereum.org/2025/03/05/devconnect-2025) and [devconnect.org](https://www.devconnect.org/) [FULL] — 14K+ attendees, 40+ independent deep-dive events, 500+ side events, 200+ volunteers. Zupass-gated Telegram, shared calendar, Discussion Corners pattern verified 2026-05-20.
- [FWB Event Keys Program](https://wiki.fwb.help/Get-Involved) and [FWB About](https://www.fwb.help/about) [FULL] — 250+ global local events, budget-tier autonomy ($500-2K per event), POAP accountability verified 2026-05-20.
- [Coordinape Docs](https://docs.coordinape.com/) and [Protocol GitHub](https://github.com/coordinape/coordinape-protocol) [FULL] — Peer-gifting mechanics, Fibonacci scoring (L1-L6), wallet requirement confirmed. Viable for 5-20 person circles.
- [Loomio - Consent Decision-Making](https://help.loomio.com/en/guides/consent_process/) [FULL] — 48h silent window, objection surfacing, non-blockchain verified 2026-05-20.
- [Metagov Projects](https://metagov.org/projects) and [Deliberative Tools](https://metagov.org/delib-tools) [FULL] — Deliberative arc (Evaluating -> Proposing -> Deciding -> Actuating) verified. Decision cycle framework confirmed.

**Additional:** SpaghettETH / ETHTurin flat-org pattern (<10 people, consensus-based, GitHub + HackMD + Airtable) documented from public sources. DAO event coordination discussions (r/daos, r/ethdev) reviewed 2026-05-20.

---

## Document History

- **2026-04-24:** Initial research + ZAOstock focus. 543 lines. Published.

---

