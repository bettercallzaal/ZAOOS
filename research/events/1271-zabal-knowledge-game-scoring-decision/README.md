---
topic: events/zabal-games
type: decision-brief
status: needs-zaal-approval
created: 2026-07-17
board-task: c5d4856a
related-docs: 1255, 1224
deadline: 2026-07-20 (before knowledge game ends July 31)
owner: Zaal (to approve or modify)
github-issue: ZAODEVZ/zabalgames#505
---

# 1271 -- ZABAL Games July Knowledge Game: 3 Scoring TBDs (Decision Brief)

> **How to use:** This doc proposes answers to the 3 open scoring questions in `docs/july-knowledge-game-2026-07-01.md` (issue #505). Zaal reviews + approves/modifies → loop implements the scoring display and closes issue #505. Mid-July, so ~2 weeks of the knowledge game remain; locking now still lets builders optimize.

---

## Context

July is ZABAL Games' open build + knowledge-game month. Builders submit reports (Markdown to GitHub) that get ingested into the Bonfire knowledge graph. The daily ZAO agent summary cites the best reports. Citations = score. Three scoring questions remain unresolved (issue #505, filed Jul 4).

---

## TBD 1: Citation Weighting

**The question:** How much does each type of citation count?
- Agent-summary citation (the daily ZAO agent cited your report)
- Self-citation (builder cites their own report in a new report)
- Cross-author citation (another builder cites your report)

**Recommendation:**

| Citation type | Points | Rationale |
|---------------|--------|-----------|
| Agent-summary cite | 3 | Highest signal — the agent found your report genuinely useful for the community summary |
| Cross-author cite | 1 | Another builder found your report useful — valid social signal |
| Self-cite | 0 | No reward for citing yourself — prevents gaming |

**Why this works:** Builders quickly learn to write reports the agent actually draws from (authoritative, sourced, non-redundant). This is the right optimization signal.

**Alternative (simpler):** All non-self cites = 1 point. Less signal but easier to explain.

**Zaal call:** Approve 3/1/0, approve 1/1/0 (simpler), or modify.

---

## TBD 2: Report-File Ingestion in the Cron

**The question:** Does the existing commit-to-Bonfire cron handle reports, or do we need a new ingestion path?

**Current state (from issue #504 context + doc 1255):** The ZABAL_JUDGE_FIDS Vercel env var is unset — the finals judge is closed. But the July cron (separate from finals) handles commit-to-Bonfire ingestion.

**Recommendation:**

Add a `reports/` subdirectory convention to the registered project format. When the cron ingests a commit, it checks for `.md` files in `/reports/`. Any file with this YAML frontmatter is treated as a knowledge-game report:

```yaml
---
kind: report
author-fid: [BUILDER_FID]
topic: [report topic]
cites: [optional list of other report file paths]
---
```

The cron posts these to Bonfire with the `source_tag: knowledge-game-report`. The daily summary agent already reads from Bonfire — no agent change needed, just a cron change.

**Implementation:** ~30 lines added to the ingestion cron. Creates a `reports` table in Supabase with `file_path`, `author_fid`, `cites[]`, `bonfire_episode_id`. Citations tracked as inserts to `report_citations` table.

**Zaal call:** Approve the `reports/` convention + frontmatter spec, or propose alternative location/format.

---

## TBD 3: Rewards Structure

**The question:** Does the report game feed Respect, the $500 prize pool, collectibles, or its own tier?

**The constraints:**
- $500 USDC prize pool is the declared total (sponsors: ZAO Festivals team)
- Finals participation earns USDC + collectible
- WaveWarZ-Base contracts are the Finals settlement mechanism (TBD from issue #506)
- Collectibles = "commemorative collectible for every finisher (July + August)"

**Recommendation:**

Keep the $500 for Finals code winners. Give the knowledge game its own track with lower-cost rewards:

| Reward | Threshold | Source |
|--------|-----------|--------|
| Top-cited report all of July | 1st place: name in the Finals announcement cast + ZAO Telegram shoutout | Zero cost |
| 3+ agent citations earned | Eligible for the July finisher commemorative collectible (on-chain, free mint) | ~$0-$5/person (gas) |
| Report featured in ZAO Newsletter / next COC show | Editor's pick, Zaal selects | Zero cost |

**Why this doesn't dilute the $500 pool:** The $500 goes to the builders who ship working code products. The knowledge game is complementary — writers and researchers can participate meaningfully without competing directly with coders for USDC.

**Respect consideration:** Builders earn Respect through ZABAL participation, but the weighting is locked in the fractal system. Do not add a separate Respect multiplier for citations — it creates a second governance channel that the ZABAL scope doesn't need.

**Zaal call:** Approve the non-USDC track (name/collectible/newsletter), or assign some USDC budget to reports ($50-$100 "best report" prize from the pool), or add to Respect weighting (complex, recommend against).

---

## Recommended Next Steps (once Zaal approves)

1. Loop updates `docs/july-knowledge-game-2026-07-01.md` with the locked mechanics (TBDs filled in).
2. Loop opens PR to zabalgames cron to add `reports/` ingestion path.
3. Loop opens issue #505 comment with the locked scoring rules + builder announcement cast draft.
4. Zaal posts the announcement to /zabal Farcaster channel (outbound-gated).

---

## Timeline

| Date | Event |
|------|-------|
| 2026-07-17 (today) | This decision brief written |
| 2026-07-20 (target) | Zaal approves/modifies TBDs (issue #505 deadline) |
| 2026-07-21 | Loop implements cron + scoring display, announcement cast posted |
| 2026-07-31 | July knowledge game closes, citations tallied, winners announced |
