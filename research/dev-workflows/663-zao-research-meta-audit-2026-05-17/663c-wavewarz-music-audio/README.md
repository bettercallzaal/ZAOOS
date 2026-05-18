# 663c: WaveWarZ + Music/Audio Repos Audit

**Sub-agent dimension of meta-audit 663.** Covers bettercallzaal org repos across WaveWarZ family + music/audio tooling.

**Date:** 2026-05-17  
**Auditor:** Claude Agent (sub-agent 663c)

---

## Repo Cards

### 1. wwbase (WaveWarz Base)

**Purpose:** Agentic music battle platform on Base L2, evolved from Solana production version.

**Stack:** Solidity (contracts), Node/TypeScript (backend + executors), React (frontend)

**Health:**
- Disk: 5 MB
- Last commit: 2026-05-15 (2 days ago, "initial brief")
- Issues: 0
- PRs: 0
- README: Yes
- LICENSE: No

**Status:** ACTIVE (production-ready spec, seeking co-founder)

**Share-readiness:** 8/10

**Dependencies:** None on other repos in this set. Standalone contract + agent stack.

**Key fact:** Solana version live in production - 735 battles, 472 SOL volume, artist payouts proven. Base contracts deployed on Sepolia testnet, ready for mainnet. "Looking for the right technical co-founder" explicitly stated.

---

### 2. wavewarzapp (WaveWarZ Live)

**Purpose:** Fan-facing mobile notification + spectator app for Solana battles. Companion to wavewarz.com trading surface.

**Stack:** Expo SDK 52, React Native 0.76, TypeScript, Tamagui, Zustand, React Query, Firebase (async, not yet wired)

**Health:**
- Disk: 377 MB
- Last commit: 2026-05-07 (10 days ago, "docs: rewrite README")
- Issues: 0
- PRs: 0
- README: Yes (detailed, v1 feature list)
- LICENSE: No

**Status:** DEMO-ONLY

**Share-readiness:** 6/10 (well-documented but explicitly in "demo phase," no real auth/FCM/Cloud Functions)

**Dependencies:** Links to wavewarz.com (trade surface), wavewarz-intelligence.vercel.app (analytics), analytics-wave-warz.vercel.app (charts). Does NOT duplicate them.

**Key fact:** "In-memory mock data. No real auth, no FCM, no Cloud Functions yet." Live web build at wavewarzapp.vercel.app.

---

### 3. Aurdour

**Purpose:** Browser-based two-deck DJ platform with Flow Mode (auto-DJ for non-DJs) and pro-level controls.

**Stack:** Web (React/TypeScript assumed, exact stack not fully visible in API), WaveSurfer.js (waveform), Pillow/MoviePy (rendering)

**Health:**
- Disk: 412 MB
- Last commit: 2026-04-04 (43 days ago, "Add visual polish, pro mix tools")
- Issues: 0
- PRs: 0
- README: Yes + LICENSE
- LICENSE: Apache 2.0 or equivalent

**Status:** DORMANT (last real work early April, polish phase completed)

**Share-readiness:** 7/10 (feature-complete, licensed, but no activity)

**Dependencies:** None explicit in audit set. Standalone DJ toolkit.

**Key fact:** Designed for dual UX - Simple Mode (newcomers) + Pro Mode (advanced DJs). Features: 3-band EQ, FX rack, stem separation, hot cues, pitch faders, phase meter, MIDI mapping. WaveSurfer + jog wheels primary interaction.

---

### 4. mixer

**Purpose:** Unknown (likely audio mixer toolkit or utility)

**Stack:** Unknown

**Health:**
- Disk: 0 MB (empty repository)
- Last commit: 2026-03-31 (47 days ago)
- Issues: 0
- PRs: 0
- README: No
- LICENSE: No
- **Repository is empty.** No commits to analyze, no code.

**Status:** DEMO-ONLY / STUB

**Share-readiness:** 0/10 (empty)

**Dependencies:** Unknown

**Key fact:** Appears to be a placeholder or abandoned stub. No content to evaluate.

---

### 5. fishbowlz

**Purpose:** Persistent audio rooms with hot-seat rotation, live transcripts, Farcaster-native identity.

**Stack:** Web (Next.js assumed), 100ms for audio, Farcaster SDK, React, TypeScript

**Health:**
- Disk: 835 MB
- Last commit: 2026-04-10 (37 days ago, "fix: restore all features lost by sync overwrite")
- Issues: 0
- PRs: 0
- README: Yes (detailed feature list + brand voice)
- LICENSE: No

**Status:** PAUSED (active maintenance ended Apr 10, Juke partnership pivot per CLAUDE.md)

**Share-readiness:** 6/10 (well-documented, feature-complete, but paused as of 2026-04-16 per project memory)

**Dependencies:** None on other repos in this set. Requires 100ms account + Farcaster setup.

**Key fact:** FISHBOWLZ paused 2026-04-16, pivoting to Juke partnership (Farcaster audio client). Decommissioned from bot fleet 2026-05-04. Live at fishbowlz.com. Features: hot-seat rotation, live transcripts, hand-raise, emoji reactions, tipping, Farcaster auto-cast.

---

### 6. ZAOVideoEditor

**Purpose:** Local-first video processing app for conversation-based content (podcasts, livestreams, Spaces, Zoom). Transcribe, caption, burn, export.

**Stack:** Python 3.10+ (ffmpeg, faster-whisper, WhisperX, pyannote, stable-ts, MoviePy, Pillow), Node.js 18+ (frontend), TypeScript

**Health:**
- Disk: 295 MB
- Last commit: 2026-03-28 (50 days ago, "Polish phase: Quick Process pipeline, bug fixes")
- Issues: 0
- PRs: 0
- README: Yes (detailed 18-step workflow, quickstart)
- LICENSE: No

**Status:** DORMANT (polish phase complete, no activity since late March)

**Share-readiness:** 7/10 (production-ready workflow, fully documented, but unmaintained)

**Dependencies:** None on other repos in this set. Fully self-contained.

**Key fact:** Supports 18 distinct processing steps: upload, assembly, silence removal, transcription, speaker detection, filler-word removal, caption generation (6 styles), highlight detection, clip export (landscape/vertical), YouTube metadata + SEO checklist. No cloud, no API keys. Re-runable at any stage.

---

## Cross-Repo Findings

### WaveWarZ Family Tree

| Repo | Platform | Stage | Relationship |
|------|----------|-------|--------------|
| **wwbase** | Base L2 | Production-ready spec | Next-gen canonical |
| **wavewarzapp** | Solana (spectator) | Demo phase | Legacy fan app |
| **Solana main** | Solana (trading) | Live 735 battles | Production proof |

**NOT a progression.** wwbase and wavewarzapp target different chains AND different roles (agentive vs fan-facing). Solana main (wavewarz.com) is the canonical production reference; wwbase is the agentic sibling proving concept on Base testnet.

### Music/Audio Portfolio

| Repo | Use | Status | Share-Ready |
|------|-----|--------|-------------|
| Aurdour | Pro DJ platform | Dormant (polish done) | 7/10 |
| ZAOVideoEditor | Video processing | Dormant (complete) | 7/10 |
| fishbowlz | Audio rooms | Paused (Juke pivot) | 6/10 |

No shared dependencies or APIs. Each is standalone. Aurdour and ZAOVideoEditor are complete + dormant, fit for archival or OSS release. fishbowlz is intentionally paused.

### Key Gaps

1. **mixer:** Empty placeholder. Either delete or clarify intent.
2. **Aurdour & ZAOVideoEditor:** Last commits 43-50 days old. No active dev, no issues/PRs. Candidates for OSS release (MIT/Apache) to invite community maintenance.
3. **fishbowlz:** Actively paused, intentional per doc 305 decommission. No issues/PRs to resolve.
4. **wwbase:** Seeking co-founder. One active commit (brief) but no open issues to onboard with. Consider adding: architecture ADR, setup guide, open questions in issues.

---

## Recommended Actions

### Immediate (This Week)

1. **Delete mixer repo** or rename/issue with "under development" notice. Current empty state confuses audit.
2. **Document WaveWarZ family tree** in wwbase README: clarify Solana vs Base vs wavewarzapp roles. Link to wavewarz.info for live proof.

### Short-term (Next Sprint)

3. **Aurdour + ZAOVideoEditor:** Evaluate for OSS release. Add MIT or Apache 2.0 license, add CONTRIBUTION.md, tag as "seeking community maintainers." Both are feature-complete and well-documented.
4. **wavewarzapp:** Lock as "demo for documentation only" or sunset to docs-only branch if Solana main is the real product.

### Medium-term (Next Month)

5. **wwbase:** Add to-do issue list for co-founder onboarding. Architecture ADRs, contract audit checklist, agent framework docs. Currently underspecified for someone joining.
6. **fishbowlz:** Keep as-is (paused intentionally). Archive README in research/ if it becomes a reference pattern later.

---

## Sources

- `gh api repos/bettercallzaal/<repo>` (repo metadata)
- Raw GitHub README/package.json fetches (stack detection)
- CLAUDE.md project memory: FISHBOWLZ decommission doc 305, Juke partnership note, agent-stack-cleanup doc 601
- Prior audit work: 663f-brand-misc-utility README

**Audit conducted without cloning, via gh CLI + HTTP reads only.**
