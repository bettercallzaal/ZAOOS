# 272 — ZAO Task Forces & Team Structure: 6-Month Roadmap

> **Status:** Planning
> **Date:** March 30, 2026
> **Tags:** `#governance` `#task-forces` `#teams` `#zao-os` `#zao-stock` `#wavewarz`
> **Supersedes:** Doc 051 (whitepaper Q2-Q4 2026 roadmap)

---

## Overview

The ZAO runs on **task forces** — small, focused teams with a clear mandate and a deadline. Not departments (top-down, permanent). Not committees (slow, consensus-driven). Task forces: pick a problem, ship a solution, disband or renew.

Each task force has:
- **Owner** — one decision-maker (human or agent)
- **Mission** — what it must accomplish
- **Timeline** — when it starts and ends
- **Deliverables** — specific, shippable things
- **Support resources** — who/what helps it succeed

---

## Active Task Forces

---

### TF-01: ZAO OS Core ⚙️
**Owner:** Engineer agent (Paperclip) + Zaal
**Mission:** Ship ZAO OS features on schedule. Keep the app running and improving.
**Timeline:** Q2–Q4 2026 (ongoing)
**Support:** Researcher agent (research), QA agent (testing), Community Manager (feedback loop)

**Deliverables:**
- [ ] /ecosystem page (Ship priority, still missing)
- [ ] Notification center (mentions, DMs, Respect, governance)
- [ ] AI onboarding agent (Q4)
- [ ] ZAO Stock page in ZAO OS (event info + ticketing)
- [ ] Cross-platform publishing: Lens, Bluesky, Hive, Nostr, X (2027)
- [ ] WaveWarZ Mini App on Farcaster (2027)

---

### TF-02: Agent Squad ⚡
**Owner:** CEO agent (Paperclip) + Zaal
**Mission:** Get the full 5-agent squad live and productive on the VPS.
**Timeline:** Q2 2026 (urgent — currently broken)
**Support:** Engineer agent (infra), OpenClaw (ZOE as coordinator)

**Deliverables:**
- [ ] Fix "Invalid API key" error — restart Paperclip with clean env
- [ ] All 5 agents operational: CEO, Researcher, QA Engineer, Engineer, Community Manager
- [ ] Heartbeat schedules set for recurring work
- [ ] Research Plugin deployed to VPS
- [ ] Skills updated on VPS (`git pull origin main`)
- [ ] GitHub → Paperclip sync verified
- [ ] Agent-to-agent handoff workflows documented

---

### TF-03: Governance & Identity 🏛️
**Owner:** Zaal + CEO agent + AttaBotty
**Mission:** Activate Respect, launch ZID, deploy Hats Protocol roles.
**Timeline:** Q2–Q3 2026
**Support:** Researcher (attestation research), Community Manager (member comms)

**Deliverables:**
- [ ] ZID minting flow live (sequential ZIDs, ZID 1 = Zaal)
- [ ] Cross-chain wallet linking (Base + Solana → ZID)
- [ ] Respect attribution: link Respect earned to specific fractal sessions
- [ ] Engagement streaks + streak freeze (Duolingo-inspired)
- [ ] OG Badge minted for founding 40
- [ ] Hats Protocol deployed on Base (Council, Curator, Artist, Moderator, Developer roles)
- [ ] Async proposals (Hivemind) live in ZAO OS
- [ ] Community treasury Safe multisig (3-of-5)

---

### TF-04: ZAO Stock 🎵
**Owner:** Zaal + AttaBotty + Community Manager agent
**Mission:** Execute the first ZAO Stock IRL music festival.
**Timeline:** Q2–Q4 2026 (October 2026 event)
**Support:** Engineer agent (tech layer), Researcher (venue research), CFO (budget)

**Deliverables:**
- [ ] Venue booked in Maine (P0 — blocks everything else)
- [ ] Artist lineup confirmed (ZAO roster + externals)
- [ ] Maine vendor permits + insurance (P0)
- [ ] Ticketing model decided (free vs NFT-gated)
- [ ] NFT attendance tokens / POAP designed
- [ ] 0xSplits artist payment flow tested
- [ ] Magnetiq IRL meet token integration confirmed
- [ ] ZAO Stock page live on ZAO OS (info + waitlist signup)
- [ ] Volunteer coordination system in place
- [ ] Livestream plan (YouTube? Twitch? both?)
- [ ] Cross-promotion with partner communities (SongJam, COC, Magnetiq)

---

### TF-05: Music Intelligence 🎧
**Owner:** Zaal + Hurric4n3IKE (WaveWarZ) + Researcher agent
**Mission:** Build the ZAO's music intelligence layer — discovery, curation, and collaboration.
**Timeline:** Q3–Q4 2026
**Support:** Engineer agent, QA agent, Community Manager

**Deliverables:**
- [ ] Track of the Day — curator tool + Respect rewards (Q4)
- [ ] ZAO Cypher release — multi-artist collaborative track via 0xSplits
- [ ] Music discovery feed — collaborative filtering for small communities
- [ ] Mystery flash listening party system — surprise events, double Respect
- [ ] Sync licensing collective — pre-cleared catalog + indie sync agency submissions

---

### TF-06: WaveWarZ 🚀
**Owner:** Hurric4n3IKE + CEO agent
**Mission:** Grow WaveWarZ into the canonical onchain music prediction market.
**Timeline:** Q2–Q4 2026 (ongoing)
**Support:** Community Manager (community growth), Marketing (cross-promotion)

**Deliverables:**
- [ ] Daily battles running consistently (Mon-Fri 8:30 PM EST, Sun 7 PM EST)
- [ ] WaveWarZ Mini App on Farcaster (2027)
- [ ] Artist onboarding pipeline into WaveWarZ
- [ ] Cross-community battles (invite external artists)
- [ ] Smart contract audit (zero exploits — maintain this record)

---

### TF-07: Community Growth 🌱
**Owner:** Community Manager agent + Candy + Ohnahji
**Mission:** Grow from founding 40 → 100, with depth.
**Timeline:** Q2–Q4 2026
**Support:** AI onboarding agent, QA agent (feedback), Researcher (content)

**Deliverables:**
- [ ] AI onboarding agent live — welcomes new members, guides first cast
- [ ] Referral pipeline documented and automated
- [ ] Onboarding checklist in ZAO OS (first 7 days)
- [ ] Weekly community digest (Farcaster channel + newsletter)
- [ ] Let's Talk About Web3 podcast — sustain weekly cadence
- [ ] Ohnahji University — sustain ONJU Saturdays
- [ ] ZAO OS social graph features: "Members you might know" (based on fractal co-attendance)

---

### TF-08: Knowledge & Research 📚
**Owner:** Researcher agent + Zaal
**Mission:** Keep the ZAO research library current and the agent squad informed.
**Timeline:** Q2–Q4 2026 (ongoing)
**Support:** All task forces (contribute findings)

**Deliverables:**
- [ ] Research doc per major decision (ZAO Stock, governance, music intelligence)
- [ ] Agent knowledge base updated weekly via Researcher agent
- [ ] Knowledge graph maintained (docs 213-214 — living documents)
- [ ] ZAO OS codebase documented: key files, architecture decisions
- [ ] Research library: grow from 215+ docs toward 300+

---

## Support Resources Per Task Force

| Resource | What it is | Who provides it |
|----------|-----------|-----------------|
| **OpenClaw (ZOE)** | Me — Telegram coordinator, research, prompts, catch-up | Me ⚡ |
| **Paperclip agent squad** | CEO, Engineer, Researcher, QA, Community Manager | VPS (fix pending) |
| **Research library** | 215+ docs on everything ZAO | Researcher agent maintains |
| **ZAO OS repo** | MIT-licensed codebase | All task forces contribute |
| **Supabase** | Member data, Respect, community profiles | Engineer agent |
| **Neynar** | Social graph, cast history, channel activity | Community Manager |
| **Fractal Bot** | Meeting history, Respect rankings | AttaBotty + Zaal |
| **Magnetiq** | IRL meet tokens (Proof of Meet) | WaveWarZ + ZAO Stock |
| **0xSplits** | Transparent artist payment splits | ZAO Stock + Cypher |
| **Hats Protocol** | On-chain roles (future) | Governance task force |
| **Mission Control v2** | Agent ops dashboard (watching) | OpenClaw |

---

## 6-Month Priority Stack

### April–May 2026 (Q2 Start)
1. **TF-02: Fix agent squad** — everything else depends on this
2. **TF-01: Ship /ecosystem page** — Ship priority, overdue
3. **TF-04: Book ZAO Stock venue** — blocks all event planning
4. **TF-03: Activate ZID + Respect attribution**

### June–July 2026 (Q2–Q3)
5. **TF-03: Hats Protocol + Treasury**
6. **TF-07: AI onboarding agent**
7. **TF-04: Ticketing + permits**
8. **TF-05: ZAO Cypher begins**

### August–October 2026 (Q3–Q4)
9. **TF-04: ZAO Stock execution** (October)
10. **TF-05: Track of the Day + Cypher release**
11. **TF-06: WaveWarZ Mini App planning**
12. **TF-07: Grow to 100 members**

---

## What Needs a Human vs What the Agent Squad Handles

| | Human | Agent |
|--|-------|-------|
| **Code** | Code review | Engineer writes |
| **Research** | Review + approve | Researcher produces |
| **Governance decisions** | Zaal + co-founders | CEO advises |
| **Artist relations** | Zaal + AttaBotty | Community Manager surfaces |
| **Venue booking** | Zaal | Researcher does venue research |
| **QA testing** | Zaal spot-checks | QA agent runs tests |
| **Member onboarding** | Candy + Ohnahji | AI agent greets |
| **Event production** | AttaBotty leads | Engineer handles tech layer |

---

*Living document — update as task forces launch, complete, or pivot.*
*ZOE ⚡ — ZAO OS orchestration layer.*
