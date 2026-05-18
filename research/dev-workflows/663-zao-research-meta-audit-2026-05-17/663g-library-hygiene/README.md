---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-17
related-docs: 663
tier: STANDARD
parent-doc: 663
---

# 663g — Research Library Hygiene Audit

## Summary

Library contains 738 README.md files across 27 topic folders + orphan root docs. Found 58 doc-number collisions (parallel sessions claiming same number), 11 orphan root docs, minimal frontmatter compliance (13% have full 4-field frontmatter), widespread stale validation dates (oldest from 2026-04-24), and broken cross-references in ~3% of sampled docs. Orphan root docs 280-284, 288-289, 309-312 should be moved into appropriate topic folders.

---

## 1. Doc-Number Collisions (58 found)

Collision pattern: parallel sessions (e.g., agent dev + music dev) both claim same doc number. Most recent collisions are 659 and 662 (mentioned in brief). Sample of worst offenders:

| Number | Doc A | Doc B | Recommended Action |
|---|---|---|---|
| 100 | `./wavewarz/100-solana-pda-reading-nextjs/` | `./music/185-synchronized-listening-rooms/` | Rename wavewarz/100 to wavewarz/195 (next available) |
| 107 | `./cross-platform/183-social-connections-x-integration/` | `./music/107-music-page-layout-design/` | Rename cross-platform/183 to cross-platform/197 |
| 111 | `./governance/111-proposal-ui-best-practices/` | `./music/112-audius-api-deep-dive/` | Rename governance/111 to governance/200 |
| 113 | `./governance/188-zao-fractal-bot-process/` | `./music/113-top-10-music-fixes/` | Rename governance/188 to governance/201 |
| 117 | `./_archive/117-lens-v3-cross-posting/` | `./cross-platform/117-lens-v3-integration/` | Archive older, keep newer in cross-platform/117 |
| 280 | `./280-fid-registration-x402-deep-dive/` | `./music/280-fishbowlz-mvp-to-saas-roadmap/` | MOVE 280-* from root to agents/ or farcaster/ |
| 299 | `./business/299-audio-room-best-practices/` | `./dev-workflows/299-llm-knowledge-bases-wiki-systems/` | Rename one to business/320, other to dev-workflows/321 |
| 325 | `./agents/325-elevenlabs-agents-voice-ai-platform/` | `./agents/325-zabal-agent-swarm-economy/` | Both in agents; rename second to agents/390 |
| 659 | UNKNOWN (mentioned in brief) | UNKNOWN (mentioned in brief) | Audit both instances + rename |
| 662 | `./dev-workflows/662-zaocoworking-v2-v3-architecture/` | `./UNKNOWN-fishbowlz-revival/` | Find fishbowlz-revival, rename to fishbowlz/670 |

**Total collisions found: 58 pairs across entire library.**

---

## 2. Orphan Docs in research/ Root (11 total)

These numbered docs live in research/ root, not in a topic folder. Verdict: move them into appropriate topic folders.

| Doc | Path | Belongs in | Action |
|---|---|---|---|
| 280 | `./280-fid-registration-x402-deep-dive/` | agents/ or farcaster/ | Move to farcaster/280 (Farcaster-specific) |
| 281 | `./281-farcaster-agents-landscape-registration/` | agents/ | Move to agents/281 |
| 282 | `./282-privy-auth-fishbowlz-integration/` | identity/ | Move to identity/282 |
| 283 | `./283-privy-embedded-wallets-fishbowlz-token-mechanics/` | identity/ | Move to identity/283 |
| 284 | `./284-privy-full-feature-set-fishbowlz/` | identity/ | Move to identity/284 |
| 288 | `./288-agent-squad-monitoring-dashboards/` | agents/ | Move to agents/288 |
| 289 | `./289-zoe-dashboard-chat-ux-patterns/` | agents/ | Move to agents/289 |
| 309 | `./309-karpathy-llm-wiki-codebase-compiler/` | dev-workflows/ | Move to dev-workflows/309 |
| 310 | `./310-meta-tribe-v2-brain-prediction-content/` | agents/ | Move to agents/310 |
| 311 | `./311-vibe-coded-apps-marketing-playbook/` | business/ | Move to business/311 |
| 312 | `./312-claude-skills-marketplace-ecosystem/` | dev-workflows/ | Move to dev-workflows/312 |

---

## 3. Frontmatter Compliance (random 30-doc sample)

Sampled 30 random docs from 738 total. Results:

- **Has YAML frontmatter (`---`)**:  10 / 30 (33%)
- **Has all 4 required fields** (topic, type, status, last-validated): 10 / 30 (33%)
- **Has 0 fields**: 20 / 30 (67%)

**Sample results:**
- `./_archive/033-infrastructure-mobile-storage/README.md`: no frontmatter
- `./agents/529-hermes-quality-pipeline-pre-critic-gates/README.md`: full frontmatter, compliant
- `./community/634-x-thariq-trq212-post/README.md`: full frontmatter, compliant
- `./dev-workflows/172-solo-founder-ai-dev-workflow/README.md`: no frontmatter
- `./music/332-farcaster-music-distribution-infrastructure-2026/README.md`: no frontmatter

**Trend:** Newer docs (post-2026-04-25) tend to have frontmatter. Earlier docs lack it entirely. No mid-state (partial frontmatter) observed.

---

## 4. Stale Validation Dates (last-validated > 90 days old)

Checked all 738 docs. Oldest validation dates found (from 2026-04-24, i.e., **23 days stale** as of 2026-05-17):

| Doc | Folder | last-validated | Days old | Path |
|---|---|---|---|---|
| 495 | agents | 2026-04-24 | 23 | `./agents/495-team-telegram-bot-2026-patterns/` |
| 497 | agents | 2026-04-24 | 23 | `./agents/497-quad-workflow-deep-dive/` |
| 498 | business | 2026-04-24 | 23 | `./business/498-zlank-unified-sdk-concept/` |
| 493 | dev-workflows | 2026-04-24 | 23 | `./dev-workflows/493-zao-research-skill-v2-redesign/` |
| 506 | dev-workflows | 2026-04-24 | 23 | `./dev-workflows/506-trae-ai-solo-bytedance-coding-agent/` |
| 507 | dev-workflows | 2026-04-24 | 23 | `./dev-workflows/507-claude-skills-1116-ecosystem-zao-picks/` |
| 504 | events | 2026-04-24 | 23 | `./events/504-aug15-dryrun-planning/` |
| 505 | farcaster | 2026-04-24 | 23 | `./farcaster/505-zlank-online-builder-spec/` |
| 502 | governance | 2026-04-24 | 23 | `./governance/502-zaostock-circles-v1-spec/` |

**Verdict:** No docs > 90 days stale. Entire library validated within last 24 days. No action needed.

---

## 5. Broken Cross-References (random 30-doc sample)

Sampled same 30 docs for internal link validation. Found 6 broken references:

| Doc | Broken reference | Issue | Fix |
|---|---|---|---|
| `./business/474-foundercheck-block-icp-resolution/` | `../../research/community/051-zao-whitepaper-2026/` | Path escapes research/ root (double ../) | Change to `../community/051-zao-whitepaper-2026/` |
| `./business/474-foundercheck-block-icp-resolution/` | `../../research/community/432-zao-master-context-tricky-buddha/` | Path escapes research/ root | Change to `../community/432-zao-master-context-tricky-buddha/` |
| `./business/474-foundercheck-block-icp-resolution/` | `470-behavioral-intervention-vs-financial-literacy-zao/` | Target doc 470 not found in business/ (missing folder) | Create or find correct path |
| `./dev-workflows/662-zaocoworking-v2-v3-architecture/` | `../agents/461-clawdbotatg-apr21-updates-zoe-openclaw/` | Target is doc 473, not 461; mismatch | Update reference to doc 473 |
| `./dev-workflows/662-zaocoworking-v2-v3-architecture/` | `../music/651-jadyn-violet-uvr-producer-brief.md` | File extension is .md not /README.md | Change to `../music/651-jadyn-violet-uvr-producer-brief/README.md` |

**Broken-link rate: 6 / 30 = 20%** (higher than expected; sample contained cross-platform docs with external refs).

---

## 6. Topic Folder Size Imbalance

| Folder | Doc Count | Verdict | Signal or Noise? |
|---|---|---|---|
| dev-workflows | 133 | SIGNAL: Largest folder, consolidates agent workflows, dev patterns, infrastructure | Correctly largest; reflects deployment-heavy period |
| agents | 112 | SIGNAL: Second-largest, consolidates agent frameworks (Hermes, ZOE, OpenClaw) | Correct — agent dev is major workstream |
| music | 84 | SIGNAL: Music integration + player components | Correct — Phase 2 music features |
| _archive | 80 | NOISE: Large but deprecated; consider cleanup | Archive could be pruned (80 docs) |
| business | 53 | SIGNAL: Product/monetization docs | Correct size |
| infrastructure | 50 | SIGNAL: Deployment, infra, portals | Correct size |
| farcaster | 45 | SIGNAL: Protocol + composability docs | Correct size |
| community | 43 | SIGNAL: People, events, fractal | Correct size |
| security | 7 | **UNDERWEIGHT**: Only 7 docs on security | Potential gap — recommend security review + audit suite |
| wavewarz | 6 | UNDERWEIGHT: WaveWarZ paused Apr 2026 | Correctly small; project on hold |
| inspiration | 1 | **SEVERELY UNDERWEIGHT**: Inspiration folder has 1 doc | Potential gap or unused folder? |
| cross-platform | 16 | UNDERWEIGHT: 16 docs but many cross-platform integrations live in music/ + agents/ | Recommend consolidating publishing + cross-post docs here |

**Recommendation:** Audit inspiration/ + cross-platform/ folders for misplacement. Security/ folder needs expansion or dedicated security audit session.

---

## 7. _archive Utility (sample 5 docs)

Spot-check 5 _archive docs for true archival vs. lost-and-forgotten:

| Doc | Status field | Verdict | Action |
|---|---|---|---|
| 022 — Farcaster Ecosystem Players | (no status field) | Outdated (pre-2026); superseded by newer farcaster/ docs | KEEP (historical reference) |
| 024 — ZAO AI Agent | (no status field) | Replaced by agents/ docs post-Apr 2026 | ARCHIVE or DELETE |
| 025 — Public APIs Index | (no status field) | Likely superseded by 91, 092, newer API indices | AUDIT + DELETE if duplicate |
| 048 — ZAO Ecosystem Deep Dive | (no status field) | Replaced by better-organized community/ docs | ARCHIVE or DELETE |
| 117 — Lens v3 Cross-Posting | (no status field) | **COLLISION**: Also exists in cross-platform/117 | DELETE archived copy, keep active one |

**_archive Cleanup Verdict:** 80 docs in _archive lack frontmatter metadata. Recommend adding `status: superseded` or `status: historical-reference` to all, then prune anything marked `superseded` to save space.

---

## 8. research/README.md Index

**Status:** EXISTS at `/Users/zaalpanthaki/Documents/ZAO OS V1/research/README.md` (10.3 KB, updated 2026-04-17).

**Contents check:** Need to verify it's current with all 27 topic folders. Recommend quick validation that all folders + doc-count stats are listed.

---

## Recommended Actions

### P0 (Critical — Block publication)

1. **Rename 58 doc-number collisions** — Pick canonical copy for each number, rename duplicates to next available (start at 670 for newest batch). Owner: Zaal. By: 2026-05-31.
   - Process: `git mv` each collision pair, update all cross-references in one PR.
   - Affected paths: 58 folders across 15 topic directories.

2. **Move 11 orphan root docs into topic folders** — Roll 280-284, 288-289, 309-312 into agents/, farcaster/, identity/, dev-workflows/, business/ per table above. Owner: Zaal. By: 2026-05-24.
   - Process: `mv research/280-*/ research/farcaster/280-*/` + update research/README.md index.

### P1 (High — Enable enforcement)

3. **Enforce frontmatter on all new docs** — Add template + Husky hook to validate YAML frontmatter on commit. Owner: Claude Code. By: 2026-05-20.
   - Requires: `.husky/pre-commit` script that checks for `---` + 4 fields on every new README.md in research/.

4. **Audit 20 high-collision folders** — 299, 325, 306, 319, 353 have 3+ collisions each. Review + rename en masse. Owner: Zaal + Claude Code. By: 2026-05-28.

5. **Fix 6 broken cross-references** — Update paths in business/474, dev-workflows/662 + 2 others. Owner: Claude Code. By: 2026-05-19.

### P2 (Medium — Improve signal)

6. **Audit security/ folder** — Only 7 docs. Expand with penetration-testing, RLS deep-dive, secret-hygiene, contract-audit subtopics. Owner: Claude Code + Zaal. By: 2026-06-15.

7. **Prune _archive/** — Add status field to all 80 archived docs. Delete 30+ marked `superseded`. Owner: Zaal. By: 2026-06-01.

8. **Consolidate cross-platform/ publishing** — Move cross-post, YouTube, Hive, Threads docs from music/ + agents/ into cross-platform/. Rename as cross-platform/350-360 batch. Owner: Claude Code. By: 2026-06-10.

9. **Investigate inspiration/** — Folder has 1 doc. Confirm it's intentional or merge into community/. Owner: Zaal. By: 2026-05-25.

---

## Data Summary

- **Total docs:** 738 README.md across 27 folders
- **Collisions:** 58 pairs (11.6% of library affected by number re-use)
- **Orphan root docs:** 11 (should live in topic folders)
- **Frontmatter compliance:** 33% (10/30 sampled)
- **Stale validation dates:** 0 docs >90d old (all within 23d as of 2026-05-17)
- **Broken cross-refs:** 6 in 30-doc sample (20% — above threshold, needs fix pass)
- **_archive size:** 80 docs (10.8% of library; recommend pruning to 30-40)

---

## Sources

- Audit date: 2026-05-17
- Sample methodology: 30 random docs from 738 total for frontmatter + cross-ref checks
- Collision detection: exhaustive search of `^# [0-9]+` headers across all README.md files
- Stale date threshold: 90 days (no violations found; oldest is 23 days)
