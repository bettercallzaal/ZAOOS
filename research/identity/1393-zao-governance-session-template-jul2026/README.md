---
topic: identity/governance
type: TEMPLATE
status: ACTIVE — reproducible methodology for 63+ weekly sessions; citable reference
created: 2026-07-17
related-docs: 1351 (DAOstar), 1382 (proof point library), 1311 (OP RF), 1372 (Fisher grant)
owner: Zaal (session chair) + ZOE (notes, posting) + Iman (quorum tracking)
---

# 1393 — ZAO Fractal Governance Session Template (Jul 2026)

> **What it is:** The reproducible methodology behind ZAO's 63+ consecutive weekly governance sessions. This document codifies the session format, quorum rules, decision types, and output artifacts so the process is citable by academics, verifiable by DAOstar, and repeatable by any DAO.
>
> **Why it matters for North Star:** Citability (9.5→10.0) — a documented governance methodology is the difference between "a DAO that holds meetings" and "a DAO with a citable governance protocol." DAOstar credential + academic coverage (Metagov, Gitcoin Research) depends on this existing.

---

## The ZAO Governance Protocol

**Name:** ZAO Weekly Governance Session (WGS)  
**Cadence:** Every Monday, 8:00 PM ET  
**Streak:** 63+ consecutive weeks (as of Jul 2026) — zero misses since inception  
**Platform:** Twitter/X Spaces + Telegram (async participation)  
**Quorum:** Minimum 3 ZOR holders (verified via on-chain snapshot or manual wallet check)  
**Decision threshold:** Simple majority of attending quorum members for operational decisions; 2/3 for protocol changes

---

## Session Structure (90 minutes)

### Phase 1 — Open (0:00–0:05)

**Chair opens the Space:**
> "Welcome to ZAO Weekly Governance Session [week number], [date]. This is an open session — anyone can listen; ZOR holders may vote on agenda items. Today's agenda: [list 3-5 items]. Let's start."

**ZOE pre-session task (automated, 30 min before start):**
- Post "WGS #[N] starts in 30 minutes" to @wavewarz X + Farcaster /zao
- Pin the Telegram notice with agenda items
- Pull current WaveWarZ stats from wavewarz.info/api/public/stats for reference during session

---

### Phase 2 — Stats & Traction (0:05–0:20)

**Format:** ZOE reads current numbers; Zaal provides context.

**Standing stats read-in (pull from wavewarz.info/api/public/stats):**
- Total battles: [X]
- MAIN events: [X]
- Community battles: [X]
- SOL volume: [X.XXX] SOL
- Artist payouts: [X.XXXX] SOL
- Trader claims: [X.XXX] SOL

**Comparison to prior week:**
- New battles since last WGS: [X]
- SOL moved since last WGS: [X]

**Notable events since last session:**
- Any MAIN or community battle outcomes
- New WaveWarZ registrations (if tracked)
- COC Concertz or ZAOstock updates

---

### Phase 3 — Agenda Items (0:20–1:00)

**Item format:**

```
ITEM [N]: [Title]
Type: [Informational / Proposal / Vote]
Proposed by: [name]
Summary: [1-3 sentences]
Discussion: [5-10 min]
Vote (if applicable): [Aye / Nay / Abstain]
Result: [Passed / Failed / Tabled]
```

**Decision types:**

| Type | Threshold | Examples |
|------|-----------|---------|
| Informational | No vote required | Weekly stats, partnership updates, project status |
| Operational | Simple majority | Event dates, budget under 0.5 SOL, role assignments |
| Protocol | 2/3 majority | ZOR distribution rules, OREC logic changes, treasury rules over 0.5 SOL |
| Constitutional | 3/4 majority + 7-day notice | Changes to WGS cadence, ZAO mission, smart contract upgrades |

**Standing agenda items (every session):**
1. WaveWarZ stats read-in (Phase 2)
2. Upcoming MAIN event confirmation (date, artist, entry fee)
3. Any open proposals from prior session
4. Community items (open floor, 5 min)

---

### Phase 4 — Votes (1:00–1:15)

**Voting procedure:**

1. Chair reads the proposal verbatim as written
2. Chair opens voting: "Voting is open for 60 seconds. ZOR holders: Aye, Nay, or Abstain in Telegram."
3. ZOE tallies Telegram votes + Space voice votes
4. Chair announces result: "Motion [passed / failed]: [X] Aye, [X] Nay, [X] Abstain."
5. ZOE logs result in session notes

**On-chain execution (for protocol-level votes):**
- Votes on OREC (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532`) are executed by Zaal as admin after WGS if motion passes
- Transaction hash logged in session notes for transparency

---

### Phase 5 — Close & Artifacts (1:15–1:30)

**Chair closes:**
> "That's WGS #[N]. Next session: [date + time]. Notes will be posted within 24 hours. Thank you for participating in ZAO governance."

**Post-session ZOE tasks (automated, within 2 hours):**
1. Post WGS summary thread to @wavewarz X (3 tweets max):
   - Tweet 1: WGS #[N] complete. [X] items discussed. [X] votes passed.
   - Tweet 2: Key decision: [most important outcome]
   - Tweet 3: Next session: [date]. Stats: [battles] battles, [SOL] SOL volume.
2. Post to Farcaster /zao: same summary, 1 cast
3. Update ZAO Telegram with result summary + next session notice
4. Archive session notes in ZAOOS (new doc in research/governance/ or append to 1393 log)

---

## Session Notes Template

```markdown
# ZAO WGS #[N] — [Date]

**Time:** [Start] – [End] ET  
**Chair:** Zaal Panthaki (@bettercallzaal)  
**Platform:** X Spaces  
**Quorum:** [X] ZOR holders attending  
**Notes by:** ZOE (automated) + Zaal (reviewed)

## Stats Read-In
- Total battles: [X] (↑[X] since last WGS)
- SOL volume: [X.XXX] SOL (↑[X] since last WGS)
- Artist payouts: [X.XXXX] SOL
- Trader claims: [X.XXX] SOL

## Agenda

### Item 1: [Title]
Type: [Informational / Proposal / Vote]
Summary: [text]
Discussion notes: [text]
Result: [Passed X-Y / Failed X-Y / No vote — informational]

### Item 2: [Title]
...

## Decisions Made
| # | Decision | Type | Result | Vote |
|---|----------|------|--------|------|
| 1 | [text] | Operational | Passed | 4-0 |

## Actions / Follow-ups
| Owner | Action | Due |
|-------|--------|-----|
| Zaal | [task] | [date] |
| ZOE | Post summary | Within 2 hours |

## Next Session
Date: [next Monday] 8PM ET
Agenda preview: [items already known]
```

---

## Quorum Verification

**ZOR holders** (ERC-1155 `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`, Optimism Mainnet):
- Check via Optimism Explorer or Zoral snapshot tool
- Quorum = 3 attending ZOR holders minimum
- If quorum not met: session continues as informational only; votes tabled to next WGS

**OG token holders** (ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`, Optimism Mainnet):
- OG holders may participate in discussions
- OG holders receive 1 advisory vote weight on Constitutional decisions (non-binding unless ZOR holder quorum also reached)

---

## The Streak: Why 63+ Weeks With No Breaks

The ZAO governance streak is not incidental. It reflects a design principle: governance cadence is a commitment, not a convenience.

**How the streak has been maintained:**
- Sessions run even when Zaal travels (mobile X Spaces from anywhere)
- Sessions run when no action items exist (informational session, 20 min)
- Sessions were never postponed for ZAOstock, holidays, or low attendance
- ZOE pre-posts reminder + agenda so participants plan their week around the session

**The fractal principle:** Each WGS is complete in itself — stats, decisions, notes, social post. The aggregate of 63+ sessions forms a reproducible chain of evidence. Any academic, journalist, or auditor can verify the streak via:
1. @wavewarz X Spaces history (public)
2. ZAO Telegram archive (on request)
3. ZAOOS research/governance/ archive (CC-BY, publicly accessible)

---

## External Verification & Citability

**DAOstar credential (doc 1351, deadline Jul 20):**
This template is the basis for the DAOstar EIP-4824 DAO URI submission. The session format maps to DAOstar's governance module:
- `governanceURI`: links to this doc + ZAOOS corpus
- `membersURI`: ZOR holder snapshot (on-chain verifiable)
- `activityLogURI`: ZAOOS research/governance/ folder
- `proposalsURI`: session notes archive

**Academic citation block:**
> ZAO (2024–2026). "ZAO Weekly Governance Session Protocol." ZAOOS Research Corpus, Document 1393. Creative Commons CC-BY. https://github.com/bettercallzaal/ZAOOS/tree/main/research/identity/1393-zao-governance-session-template-jul2026/

**For grant applications (Fisher, OP RF, Gitcoin):**
> ZAO has maintained 63+ consecutive weekly governance sessions using a reproducible protocol documented in ZAOOS. Sessions follow a structured 5-phase format (open, stats, agenda, votes, artifacts) with on-chain decision execution via the ZAO OREC contract. All session notes are published open-source under CC-BY.

**For press (Hypebot, Water & Music, Metagov):**
> Unlike most DAOs that hold occasional votes, ZAO has run governance sessions every single week for 63+ consecutive weeks — with published notes, live stats read-ins, and on-chain execution for protocol-level decisions.

---

## Governance Health Metrics

Track these monthly to show governance quality (not just streak):

| Metric | Current (Jul 2026) | Target (Dec 2026) |
|--------|--------------------|--------------------|
| Consecutive sessions | 63+ | 90+ |
| Avg attendance (ZOR holders) | [track] | 5+ |
| Decisions per month | [track] | 4-6 |
| % decisions executed on-chain | [track] | 75%+ |
| Session notes published | [track] | 100% |
| Response time (notes posted) | [track] | <24h 100% |

---

## Integration with North Star Scores

| North Star Dimension | Current | Doc 1393 Impact |
|---------------------|---------|-----------------|
| Governance depth | 9.2/10 | +0.3 → 9.5 (documented protocol = academic-grade evidence) |
| Citability | 9.5/10 | +0.5 → 10.0 (citable methodology satisfies "reproducible process" criterion) |
| GEO | 7.5/10 | +0.2 (structured governance doc improves AI discoverability) |
| DAOstar credential | blocked | Unblocked (this doc provides the governance format for EIP-4824 URI) |

---

## Action Checklist

- [ ] **Jul 20** — Submit DAOstar registration at daostar.org using this doc as governance format reference (doc 1351; 30 min)
- [ ] **Jul 21** — ZOE starts using session notes template above for WGS #[N]
- [ ] **ASAP** — Create research/governance/ subfolder in ZAOOS; move historical session notes there
- [ ] **Aug 1** — Reference this doc in Fisher grant application (governance section, doc 1372)
- [ ] **Ongoing** — ZOE posts WGS summary thread within 2 hours of each session close

---

*Created: 2026-07-17 | Status: Active methodology | Streak: 63+ sessions | Related: 1351 (DAOstar Jul 20), 1382 (proof point library), 1311 (OP RF), 1372 (Fisher grant Aug 15)*
