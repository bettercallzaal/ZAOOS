---
topic: wavewarz/explainer
type: REFERENCE
status: CANONICAL — link to this doc in press pitches, grant applications, Wikipedia citations
created: 2026-07-17
related-docs: 1302, 1339, 1341, 1342, 1348
owner: Zaal + ZOE (keep stats current from API)
---

# 1350 — WaveWarZ: The Platform Explainer (101)

> **Purpose:** A single, canonical plain-language explanation of WaveWarZ for three audiences: (1) press and journalists who've never seen the platform, (2) grant reviewers who don't use crypto, (3) music fans who've heard the name but don't know how it works.
>
> **How to use this doc:** Link to it in press pitches (doc 1340), grant applications (doc 1349), and any Wikipedia drafts (doc 1330). Do not explain WaveWarZ in every doc — just link here.
>
> **Stats:** Pulled from wavewarz.info/api/public/stats (last updated 2026-07-17). ZOE should refresh these when they cross round numbers.

---

## What Is WaveWarZ?

WaveWarZ is a music battle platform built on Solana. Two songs go head-to-head. Community members listen to both and bet on which one wins. The winner's artist is recognized publicly. The losing artist still gets paid.

That last part — **the loser earns** — is what makes WaveWarZ unlike anything else in music.

---

## How a Battle Works

**Step 1: Songs are submitted**  
Artists upload their tracks to Audius (a decentralized music streaming platform) and submit them to a WaveWarZ battle through the platform at wavewarz.info.

**Step 2: The battle opens**  
Two tracks go head-to-head for a set window (usually 24-48 hours for MAIN events). Both songs are playable directly in the battle interface.

**Step 3: Community members bet**  
Listeners — called "traders" on the platform — bet on which track they think will win. Bets are placed in SOL (Solana's native currency). Traders don't need to be music experts; they just need to listen and make a call.

**Step 4: The battle closes, winner is declared**  
At the end of the betting window, the track with more support wins. The winner's artist is declared and featured on the platform.

**Step 5: Everyone gets paid**  
- **Winning traders** split the losing side's bets (like a prediction market)
- **The losing artist gets paid** — a percentage of total battle volume goes to the losing track's creator
- **Charity** receives a percentage of each battle's volume

This means: in every WaveWarZ battle, someone wins, but nobody is left with nothing. The losing artist still earns more from losing a battle than they would from most streaming plays.

---

## Why Does the Loser Earn?

Traditional music competitions work like this: you compete, you either win and get everything or lose and get nothing. Most losing artists never submit again.

WaveWarZ flips this:

| Model | Losing artist earns |
|-------|-------------------|
| Traditional battle rap | $0 |
| TV talent shows | $0 (+ exposure) |
| SoundCloud play | $0.003-$0.005 per stream |
| Spotify play | $0.003-$0.005 per stream |
| WaveWarZ (losing) | SOL payout based on battle volume |

The result: artists keep submitting, because even a loss has economic value. This creates a sustainable supply of battles — the platform doesn't run out of willing artists.

---

## By the Numbers (Jul 2026)

*Source: wavewarz.info/api/public/stats*

| Metric | Value |
|--------|-------|
| Total battles completed | 1,245 |
| MAIN events (premium battles) | 50 events / 162 battles |
| Quick battles | 1,047 |
| Community battles | 36 |
| Total SOL volume | 523.991 SOL (~$4,760 USD at Jul 2026 prices) |
| Artist payouts (losing artist earnings) | 9.0988 SOL (~$82 USD) |
| Trader claims (bettor winnings) | 127.343 SOL (~$1,155 USD) |
| Charity raised | See wavewarz.info for current total |

**What "523.991 SOL in volume" means in plain English:**
The WaveWarZ community has bet the equivalent of ~$4,760 USD on music battles since the platform launched — that money has flowed to winning traders, losing artists, and charity. No label. No middleman. All automatic.

---

## Who Are the People on WaveWarZ?

**Artists:** Independent music producers, primarily hip-hop and electronic, who want feedback from a real audience — and a payout. Most find WaveWarZ through Audius or the ZAO community. They don't need a record deal or a manager. They need a good track.

**Traders:** Music fans who bet on battles. Some are ZAO community members who know the artists personally. Others are crypto-native users who treat WaveWarZ like a prediction market for music. The best traders develop genuine musical taste — because that's the edge that makes money.

**The ZAO community:** The ZAO (ZTalent Artist Organization) is the governance layer behind WaveWarZ. ZAO members vote on governance decisions, host MAIN events, and have used WaveWarZ battle history to select the 8 artists performing at ZAOstock, an outdoor festival in Ellsworth, Maine on October 3, 2026.

---

## What Is a MAIN Event?

WaveWarZ has three battle types:

| Type | Format | Stakes |
|------|--------|--------|
| Quick Battle | 2 songs, short window | Lower stakes, higher volume |
| Community Battle | Organized by community members | Themed, social |
| MAIN Event | Premium, curated, longer window | Highest stakes, most SOL volume |

MAIN events are the flagship product. The ZAO co-hosts at least one monthly MAIN event. MAIN events represent ~13% of total battles but an estimated 65-75% of total SOL volume. They're where serious traders and artists compete.

As of July 2026: 50 MAIN events completed, averaging 5.6 per month.

---

## How Does This Connect to Blockchain?

WaveWarZ is built on **Solana**, a fast and low-fee blockchain. Here's what that means in practice:

- **Artist submissions** reference tracks hosted on Audius (decentralized music platform)
- **Bets** are placed in SOL and recorded on-chain automatically
- **Payouts** (to artists and traders) execute automatically when a battle closes — no waiting for a label to cut a check, no payment processor delays
- **Charity donations** are automatic percentages of each battle's volume

You don't need to understand blockchain to use WaveWarZ. Privy (an onboarding tool) lets new users create a wallet in seconds. Coinflow lets users add funds with a credit card. The blockchain handles the payments behind the scenes.

---

## How Does WaveWarZ Compare to Other Music Platforms?

| Platform | Artist earns from | Fan earns | Charity component | Governance |
|----------|------------------|-----------|--------------------|-----------|
| Spotify | Stream count | Nothing | No | Centralized |
| SoundCloud | Streams (if Partner) | Nothing | No | Centralized |
| Audius | Streams + tips | Nothing | No | Token holders |
| Battle rap events | Winning only | Nothing | Sometimes | Promoter |
| **WaveWarZ** | **Win AND loss** | **Yes (trading winnings)** | **Yes (automatic)** | **DAO (ZAO)** |

The closest analogue is prediction markets (like Polymarket) for music outcomes — but with an explicit artist payout mechanism and community governance that no pure prediction market has.

---

## Who Built WaveWarZ?

WaveWarZ was built by a small team in the ZAO community. The platform is live at wavewarz.info with a public API (no authentication required, CORS open) for anyone to build on.

**Key contacts:**
- Platform: Hurricane (WaveWarZ team lead)
- ZAO community: Zaal Panthaki (@bettercallzaal on X and Farcaster)

---

## Frequently Asked Questions (for Non-Crypto Audiences)

**"Do I need crypto to use WaveWarZ?"**  
New users can create a wallet in seconds with Privy — no prior crypto experience needed. Coinflow lets you add funds with a credit card. The platform handles everything else.

**"How do artists get paid?"**  
Automatically, when the battle closes. The payout goes to their Solana wallet. No waiting, no invoices.

**"Is this gambling?"**  
Skill is a major factor — traders who understand music consistently outperform random guessing. Most regulators classify prediction markets as a distinct category from gambling because of the skill component. (WaveWarZ operates under the legal framework reviewed by the platform's team.)

**"What prevents cheating?"**  
Bets are recorded on Solana's blockchain — a public record that can't be modified retroactively. The outcome is determined by total bet weight, not by any individual or organization.

**"Where does the charity money go?"**  
A percentage of each battle's volume is reserved for charity. The specific charity recipients are decided by the ZAO community and announced per event.

**"How is the lineup for ZAOstock selected?"**  
The 8 ZAOstock artists (October 3, Ellsworth ME) were selected by their WaveWarZ battle history — the artists with the strongest battle records earned their slot. No committee. No labels. Just results.

---

## Where to Learn More

| Resource | URL |
|----------|-----|
| Platform (live) | wavewarz.info |
| Public stats API | wavewarz.info/api/public/stats |
| ZAO governance research | github.com/bettercallzaal/ZAOOS |
| Battle analytics | wwtracker (open source) |
| ZAOstock event | thezao.xyz (Oct 3, 2026, Ellsworth ME) |

---

## For Press and Grant Reviewers

If you're writing about WaveWarZ or reviewing a ZAO grant application, the following one-paragraph summary is designed for non-specialist readers:

> WaveWarZ (wavewarz.info) is a music battle platform built on Solana where independent artists submit tracks to head-to-head competitions, community members bet on outcomes, and — crucially — the losing artist still earns a payout. Since launch, the platform has facilitated 1,245 battles, 523.991 SOL (~$4,760 USD) in total volume, and paid $82+ USD to losing artists automatically on-chain. It is governed by The ZAO (ZTalent Artist Organization), a decentralized community that has maintained 63+ consecutive weeks of on-chain governance sessions on Optimism Mainnet.

---

*Created: 2026-07-17 | CANONICAL — link to this doc instead of re-explaining WaveWarZ in every doc | Related: 1302 (onboarding), 1339 (proof-points), 1341 (MAIN event strategy), 1342 (artist recruitment), 1348 (trader growth) | ZOE: update stats when API crosses round numbers*
