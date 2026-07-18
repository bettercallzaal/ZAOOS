---
topic: africa-battle-week, events, operations
type: countdown-checklist
status: URGENT — Jul 19 is the start date. Items marked OVERDUE if missed. This doc consolidates all Africa Battle Week pre-event tasks from Jul 19 through Sep 21 (eve of Africa Battle Week). Sep 22 = Day 1.
last-validated: 2026-07-18
related-docs: 1373-zao-ram-africa-battle-week-playbook-sep2026, 1415-wavewarz-africa-battle-week-sep2026, 1643-africa-battle-week-vote-results-protocol, 1680-africa-battle-week-artist-onboarding-guide, 1661-africa-battle-week-artist-recruitment, 1675-farcaster-content-calendar-sep2026
action-owner: Zaal (decisions), ZOE (posts + tracking), Hurricane (WaveWarZ battle creation), RAM Africa partner (artist recruitment)
---

# 1712 — Africa Battle Week Pre-Launch Countdown (Jul 19 – Sep 21, 2026)

> **What this is:** The consolidated pre-event operations checklist for Africa Battle Week (Sep 22-26, 2026). Docs 1373, 1415, 1643, 1661, and 1680 each cover a piece. This doc is the single countdown checklist: who does what, by when, and what happens if they don't.
>
> **Africa Battle Week:** 5 WaveWarZ Quick Battles, Sep 22-26. Each day: one US-based artist vs one West African artist. Sep 26 = charity battle (100% of SOL to community-voted charity). Organized by ZAO + RAM Africa (doc 1373).
>
> **Zero-day:** Sep 22 at 9:00 AM ET. Everything here must be complete by Sep 21 EOD.

---

## Phase 1: Governance + Charity (Jul 19 – Jul 31)

### Jul 19 (TODAY)
**Action: Launch charity vote nominations**
- Owner: Zaal
- What: Open the Africa Battle Week charity vote per doc 1643 (vote protocol) and doc 1631 (vote campaign)
- ZOE action: Post nomination announcement to ZAO Telegram, Farcaster /zao, X
- If not done by Jul 21: ZOE sends Zaal escalation DM

**Action: Start ZOR holder engagement for vote**
- Owner: ZOE
- What: Post to /zao Farcaster reminding ZOR holders that charity vote opens Jul 24-25 (nominations phase now)
- Template:
```
Africa Battle Week charity vote opens in 5 days.

Jul 24-25: ZOR holders vote for the charity that receives all SOL from the Sep 26 charity battle.

Who should receive it? Nominate in ZAO Telegram by Jul 23.
```

### Jul 23 (Thursday)
**Deadline: Charity nominations close**
- Owner: ZOE collects from Telegram; Zaal reviews
- Expected: 3-7 nomination submissions

**ZOE action: Compile nomination list for Zaal review**
ZOE summarizes nominations in a Telegram message to Zaal:
```
Africa Battle Week charity nominations:
1. [Org name] — [brief description, country, nominator]
2. ...

Vote opens tomorrow (Jul 24). Confirm these are the options before I post the vote.
```

### Jul 24-25 (Thursday–Friday) 
**Action: ZOR holder charity vote**
- Owner: Zaal (sets up Snapshot vote per doc 1575)
- ZOE action: Post vote announcement to /zao, Telegram, /wavewarz (doc 1643 template)
- Vote closes: Jul 25 at 8PM ET

### Jul 25 (Friday Evening)
**Deadline: Charity vote result**
- Owner: ZOE (posts result within 1 hour of vote close)
- ZOE posts to /zao + Telegram + /wavewarz:
```
ZOR holders voted.

Africa Battle Week charity: [CHARITY NAME].
Sep 26 charity battle: all SOL wagered goes to [charity wallet].
Automatic. On-chain.

[ZOR holder turnout: N holders voted]
```
- ZOE records charity name + wallet address to `~/.zao/africa-battle-week-config.json`
- ZOE updates doc 1643 (vote results protocol) with fill-in fields

**GATED item: Charity wallet address**
Zaal must confirm the charity's Solana wallet address by Jul 31. Hurricane needs it for Day 5 battle setup.

---

## Phase 2: Artist Recruitment (Jul 21 – Aug 15)

### Jul 21
**Action: Africa Battle Week artist recruitment starts** (doc 1661)
- Owner: Zaal + RAM Africa partner
- What: Warm outreach to West African artists — Phase 1 from doc 1661 (existing ZABAL applicants, RAM Africa contacts)

### Aug 1
**Deadline: Artist lineup target — confirm ≥3 West African artists**
- Owner: Zaal + RAM Africa
- What: Each of 5 battle days needs one West African artist confirmed
- ZOE reminder to Zaal (Jul 31): "Tomorrow (Aug 1) is the Africa artist lineup target. How many confirmed?"
- If <3 confirmed: ZOE DMs Zaal "Fewer than 3 artists confirmed. Do you need me to expand outreach per doc 1661 Phase 2?"

### Aug 1 (same day)
**Action: Public lineup announcement prep**
- Owner: ZOE (staging; doc 1675 Sep 8 post is the public reveal)
- What: ZOE drafts the Sep 8 lineup reveal post (doc 1675 "Africa Battle Week Calendar Reveal") with real artist names, holds for Sep 8 send
- Inputs needed: artist bios from RAM Africa, battle slot assignments (which artist fights which day)

### Aug 15
**Hard deadline: All 5 West African artists confirmed and artist setup complete**
- Owner: Zaal (confirmed), RAM Africa (sourced)
- What: Wallets set up, WaveWarZ accounts created, tracks uploaded (doc 1680)
- ZOE action: Send Template B from doc 1680 to any artist who hasn't confirmed wallet + account
- If any artist still not set up: ZOE DMs Zaal with the list

**Action: Send accepted artists the Aug 1 → Sep 1 prep DM sequence (doc 1680 Template A if not already sent)**
- Owner: ZOE

---

## Phase 3: ZAO Farcaster Promotion (Aug 1 – Sep 21)

### Aug 8 (First /wavewarz artist spotlight post)
**ZOE action: Artist Spotlight #1**
Post to /wavewarz (doc 1675 template):
```
Africa Battle Week is coming Sep 22.

Who's [Artist 1 West Africa]?
[Bio from artist submission]

They battle [Artist 1 US] on Sep 22.
Prediction market opens that morning.
```

### Sep 1
**ZOE action: Newsletter Issue 2 includes Africa Battle Week preview** (doc 1693)
The Sep 1 newsletter has a "What's Coming" section previewing Africa Battle Week and confirming charity name.

### Sep 8 (Monday)
**ZOE action: Public lineup reveal post** (doc 1675)
```
Africa Battle Week arrives Sep 22.

5 days. 5 battles. US artists vs West African artists.
All on WaveWarZ.

Day 1 (Sep 22): [Artist 1 US] vs [Artist 1 Africa]
...
Day 5 (Sep 26): Charity battle — 100% of SOL to [Charity Name]

14 days.
```

### Sep 10 (Wednesday)
**ZOE action: Artist Spotlight #2** (doc 1675 template)

### Sep 15 (Monday)
**ZOE action: Artist Spotlight #3** (doc 1675 template — 1 week countdown frame)

### Sep 17 (Wednesday)
**ZOE action: ZOR Holder Callout** (doc 1675)
Remind ZOR holders that battle voting opens Sep 22 — they can vote each day.

### Sep 19 (Friday)
**ZOE action: ZAOstock + Africa combo CTA** (doc 1675)
"Africa Battle Week in 3 days. ZAOstock in 14 days."

### Sep 21 (Sunday, eve of Day 1)
**ZOE action: Eve hype post to /wavewarz + /zao** (doc 1675)
```
Africa Battle Week starts TOMORROW.

5 battles. 5 days.
[N] artists confirmed.

Day 1 drops at 9 AM ET.
```

---

## Phase 4: Technical Readiness (Aug 1 – Sep 21)

### Aug 15
**Deadline: All artist WaveWarZ accounts verified**
- Owner: Hurricane (verification)
- What: Hurricane confirms all 5 West African artists have accounts + tracks uploaded
- ZOE reminder to Zaal Aug 14: "Tomorrow (Aug 15) is artist setup deadline. Hurricane confirming?"

### Sep 1
**Deadline: Hurricane has all artist wallet addresses for payout routing**
- Owner: Hurricane (collect from Zaal)
- What: Days 1-4 artist wallets for loser-earns payout, Day 5 charity wallet
- ZOE reminder to Zaal Aug 31: "Sep 1: Hurricane needs all 5 artist wallet addresses + charity wallet for battle setup"

### Sep 15
**Hard deadline: All 5 battles created in WaveWarZ admin**
- Owner: Hurricane (doc 1680 Section 3)
- What: 5 battles scheduled Sep 22-26, charity flag on Day 5, wallet addresses loaded
- ZOE reminder to Zaal Sep 14: "Tomorrow (Sep 15) is Hurricane's battle creation deadline. Confirmed?"

### Sep 20-21
**Hurricane pre-launch verification** (doc 1680 Section 3)
- Hurricane tests each battle URL
- Hurricane sends all 5 battle URLs to ZOE by Sep 20
- ZOE confirms receipt and stages the Sep 22 launch posts with real URLs

---

## Go / No-Go Decision Points

| Date | Decision | Owner | If NO: |
|------|---------|-------|--------|
| Jul 31 | Charity wallet address confirmed | Zaal/charity contact | Delay charity battle announcement; alert Hurricane |
| Aug 15 | ≥3 West African artists confirmed | Zaal + RAM Africa | Reduce to 3-battle week or postpone |
| Sep 1 | All 5 artists confirmed with WaveWarZ accounts | Zaal + Hurricane | Drop unconfirmed battles (minimum 3 to keep "ABW" framing) |
| Sep 15 | All battles created in WaveWarZ | Hurricane | ZOE escalates to Zaal; Hurricane sprint needed |
| Sep 20 | Battle URLs received by ZOE | Hurricane | Delay Day 1 post until URL confirmed; don't launch blind |

**Absolute minimum for "Africa Battle Week" branding:** 3+ battles featuring West African artists. If fewer than 3 are set up by Sep 15, ZOE sends Zaal: "We may need to rebrand to 'Africa Battle Days' — fewer than 5 battles confirmed. Minimum 3 needed for ABW branding. Decision needed."

---

## ZOE Automated Reminders Schedule

| Date | ZOE Telegram Reminder to Zaal |
|------|------------------------------|
| Jul 23 | "Charity nominations close today. Ready for me to compile the list?" |
| Jul 31 | "Charity wallet address needed for Hurricane (Day 5 setup). Confirmed?" |
| Aug 1 | "Africa artist lineup target: how many West African artists confirmed?" |
| Aug 14 | "Tomorrow (Aug 15) is artist setup deadline. Hurricane verifying accounts?" |
| Aug 31 | "Hurricane needs all wallet addresses by Sep 1 for battle setup." |
| Sep 7 | "Sep 8 lineup reveal post staged — confirm it's ready to send." |
| Sep 14 | "Tomorrow (Sep 15) Hurricane's battle creation deadline. Confirmed?" |
| Sep 20 | "Sep 22 is in 2 days. Battle URLs from Hurricane received?" |
| Sep 21 | "Tomorrow: Africa Battle Week Day 1. All launch posts staged. Anything to update?" |

---

## Summary: What Must Be True by Sep 22, 9:00 AM ET

- [ ] 5 West African artists confirmed, WaveWarZ accounts active, tracks uploaded
- [ ] 5 US artists confirmed, WaveWarZ accounts active
- [ ] Charity name and wallet address confirmed (from Jul 25 vote)
- [ ] All 5 battles created in WaveWarZ admin by Hurricane
- [ ] Battle URLs sent to ZOE by Sep 20
- [ ] ZOE launch posts staged (daily templates from doc 1675)
- [ ] Artist spotlight posts complete (Sep 8, 10, 15 already sent)
- [ ] ZOR holder callout sent (Sep 17)
- [ ] Eve post sent (Sep 21 PM)

---

## Sources

- `research/events/1373-zao-ram-africa-battle-week-playbook-sep2026/` — RAM Africa partnership plan + timeline
- `research/events/1415-wavewarz-africa-battle-week-sep2026/` — Africa Battle Week strategy + wager structure
- `research/governance/1643-africa-battle-week-vote-results-protocol/` — charity vote result + wallet ops
- `research/events/1661-africa-battle-week-artist-recruitment/` — Phase 1/2/3 artist recruitment timeline
- `research/events/1680-africa-battle-week-artist-onboarding-guide/` — artist setup + Hurricane battle creation checklist
- `research/farcaster/1675-farcaster-content-calendar-sep2026/` — Sep content calendar (artist spotlight + daily battle posts)
- `research/governance/1631-africa-battle-week-charity-vote-campaign/` — charity vote campaign + nomination collection
