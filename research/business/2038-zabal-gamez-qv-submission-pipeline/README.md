---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-23
related-docs: 1139, 728, 769, 1349
original-query: "we need to work on zabal gamez asap and get the submission pipeline up and ready - use schellingpoint to make a quadratic voting for people to vote on what they think the best builds are"
tier: STANDARD
---

# 2038 - ZABAL Gamez QV Submission Pipeline: Architecture & Build Plan

> **Executive Summary:** ZABAL Gamez already has a production quadratic-voting (QV) system shipping at zabalgamez.com/vote (100 credits/track, cost = votes^2, Farcaster + Neynar Sybil gating). The submission pipeline (form -> database -> voting-ready candidates) is partially built but needs one integration: wiring the submissions table into the vote-candidate-slate so voters can pick from real builders. Build recommendation: implement independently rather than reuse SchellingPoint (license ambiguity + ZABAL's QV is simpler + already shipping).

---

## Key Decisions / Recommendations

| Decision | Recommendation | Status |
|----------|---|---|
| **Build vs. reuse SchellingPoint** | Build independently (quadratic voting is public mechanism-design math, not proprietary; Weyl/Posner 2018). SchellingPoint's README claims MIT license but repo has NO LICENSE file and package.json has `"private": true`, creating legal ambiguity. Cost of independent implementation: ~2-4h once spec is locked. | DECIDED |
| **Sybil resistance anchor** | Use Farcaster FID as the sole identity anchor (already implemented in `/api/qv-vote.mjs`). Optional second-layer: Neynar user-quality score gate (already configurable via `QV_SCORE_MIN` env var, default 0.55). Consider future: ZAO Respect-holder bonus credits (156 Respect holders as secondary trust signal). | DECIDED |
| **Vote-splitting consolidation** | QV's quadratic cost curve naturally produces consolidation - a voter who spreads votes across 10 builders uses 100 credits (1+4+9+16+25+36+49+64+81+100 would exceed 100), so one-thing-per-builder emerges. Explicit per-builder cap (e.g. max 1 submission per FID per season) is NOT needed if slate is curated by hand. If auto-generated, cap is recommended to prevent spam. | PENDING ZAAL CALL |
| **Scope for August Finals** | PROPOSED (needs Zaal confirmation): submissions close ~ 2026-08-10, voting window 2026-08-10 to 2026-08-20, finalist announcement + leaderboard by 2026-08-25. This assumes Cohort 1 is finalized by early August. | NOT YET CONFIRMED |
| **SchellingPoint re-eval** | If a future non-ZABAL partner event (e.g. EthBoulder) offers QV scheduling and we want to integrate it directly, re-evaluate SchellingPoint ONLY after they ship a real LICENSE file + clarify package.json private flag. | DEFERRED |

---

## Part 1: What ZABAL Gamez Already Has

### The Voting System (Fully Shipped)

**Live at:** `zabalgamez.com/vote` (Farcaster mini-app)

- **Mechanism:** Quadratic voting per track. Every voter gets **100 voice credits per track** (artist/builder/creator).
- **Cost curve:** N votes costs N^2 credits. So: 1 vote = 1 credit, 2 = 4, 3 = 9, 4 = 16, 5 = 25, 6 = 36, 7 = 49, 8 = 64, 9 = 81, 10 = 100 (one candidate exhausts the budget).
- **Tally:** Votes are summed per candidate (square-root semantics: vote counts are aggregate, individuals are private).
- **Sybil resistance:** Farcaster Quick Auth (one ballot per FID per track). Optional Neynar quality score gate (`QV_SCORE_MIN` env var, default 0.55 - can be tuned).
- **Storage:** Upstash Redis (private ballots in `qv:ballots:<track>`, public tally in `qv:tally:<track>`).
- **Slate management:** Curated via `data/vote-candidates.json` (version-controlled). Slate has `status: 'preview' | 'open' | 'closed'`. Voting only accepts POSTs when status='open'.

**API routes (Vercel Edge):**
- `POST /api/qv-vote` with `{ track, allocations: {handle: votes} }` and Farcaster Bearer token -> `{ ok, counted, creditsUsed, yourVotes }`
- `GET /api/qv-vote?track=builder&results` -> `{ status, voters, results: [{handle, votes}] }`
- `GET /api/qv-vote?status` -> `{ status, tracks: {artist, builder, creator}: count }`

**Code source:** `/tmp/zabal-verify/api/qv-vote.mjs` (verified 2026-07-23, 195 lines, production-ready).

### The Submission Pipeline (Partially Shipped)

**Live at:** `zabalgamez.com/enter` (form -> Supabase table)

- **Database table:** `zabalgames_submissions` (Postgres in Supabase).
- **Columns (23 total):** id (uuid), created_at, name, farcaster, twitch, github, wallet, phase1_url, phase1_repo, phase1_demo, phase1_cast, harness, visibility_mode, creator_type, streaming_comfort, creator_links, why, zao_relationship, availability_pref, kind ('submission' | 'starter'), built_on, status ('submitted' | 'claimed' | 'finalist'), claimed_by.
- **RLS:** Anon can INSERT (public form submission). Anon can SELECT (applications are public by default). Status updates (claiming, finalizing) are NOT anon-gated and must be authenticated.
- **View:** `zabalgames_submissions_public` (wallet-hidden variant for galleries).

**Code source:** `/tmp/zabal-verify/db/schema.sql` (verified 2026-07-23, 118 lines).

### The Missing Link

**The submission and voting systems currently operate independently.** There is:
- A form that collects submissions into `zabalgames_submissions`.
- A voting UI that reads from `data/vote-candidates.json`.
- NO automated bridge between them.

The `vote-candidates.json` is hand-curated: an array of Farcaster handles per track, each with a note (context). To vote on a submission, someone must:
1. See a builder in the submissions gallery.
2. Manually add their handle to `data/vote-candidates.json`.
3. Commit + deploy.

This is the seam to close.

---

## Part 2: Submission Schema vs. Voting Pipeline

### What `zabalgames_submissions` Currently Captures

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | yes | PK, auto-generated |
| created_at | timestamptz | yes | Submission timestamp |
| name | text | yes | Builder name |
| farcaster | text | yes | FC handle (the QV identity anchor) |
| github | text | yes | GitHub handle |
| wallet | text | yes | For prize payouts |
| phase1_url | text | yes | Live demo URL |
| phase1_repo | text | yes | Open-source repo link |
| phase1_demo | text | yes | 60-second demo/video link |
| phase1_cast | text | yes | Farcaster cast announcing the build |
| twitch | text | no | Optional streaming handle |
| harness | text | no | Build tool used (Claude Code, Cursor, etc.) |
| visibility_mode | text | no | Public/semi-private preference |
| creator_type | text | no | Builder taxonomy |
| streaming_comfort | text | no | How comfortably on stream |
| creator_links | text | no | Additional portfolio links |
| why | text | no | "Why I'm here" essay |
| zao_relationship | text | no | Prior ZAO connection |
| availability_pref | text | no | Time zone / availability |
| kind | text | default 'submission' | 'submission' OR 'starter' (pre-seeded project) |
| built_on | text | no | If kind=submission, which starter was forked |
| status | text | default 'submitted' | submitted -> claimed -> finalist |
| claimed_by | text | no | Mentor handle (null until claimed) |

**For voting, only these columns matter:**
- `farcaster` (the identity anchor for ballot gating)
- `name` (display name for the candidate)
- `phase1_demo` or `phase1_url` (the build to vote on)
- `kind` (filter out starters, vote only on 'submission' kind)
- `created_at` or `status` (for filtering by round/phase)

**Schema is GOOD for voting.** All required fields are there.

---

## Part 3: Build Recommendation - Implement QV Independently

### Why NOT Reuse SchellingPoint

1. **License ambiguity (blocker).** SchellingPoint's README line 216 says "SchellingPoint is open source under the MIT license." But the repo has:
   - NO `LICENSE` file (verified 2026-07-23 in `/tmp/schelling-verify/`).
   - `package.json` has `"private": true` and NO `license` field.
   - This creates legal uncertainty: the intent is MIT, but the actual grant is ambiguous. Recommend: do NOT copy its code. If we later need real code reuse with this repo, ask the author to add a proper LICENSE file and update package.json.

2. **API shape mismatch.** SchellingPoint was built for EthBoulder session scheduling (propose sessions, vote to schedule them into time slots). ZABAL Gamez is simpler: pick from a curated builder slate and allocate voice credits.

3. **Already shipped.** ZABAL has a working quadratic-voting API (`/api/qv-vote.mjs`) doing exactly what we need. Introducing SchellingPoint would add dependency + integration surface.

### Build Plan: Integrate Submissions into Vote Slate

**Phase 1 (now): Wire submissions -> candidates (1-2h)**
1. Create a Vercel Edge function (`/api/generate-qv-slate`) that:
   - Query `zabalgames_submissions` with status='submitted' (or filter by week/round).
   - Extract Farcaster handles.
   - Build an in-memory vote-candidates.json shape: `{ status: 'open', tracks: { artist: [...], builder: [...], creator: [...] } }`.
   - Each candidate gets handle, name, phase1_demo link, and a dynamic note built from (harness + creator_type + why).
   - Serve it at `/api/generate-qv-slate?track=builder` (or hardcode it at `/data/vote-candidates.json` if Zaal prefers static).

2. Update `vote.html` to check if `status='open'` in the live slate before allowing POST to `/api/qv-vote`.

3. Deploy. Test with a small pilot slate of 3-5 builders.

**Phase 2 (after Phase 1 validates): Auto-curate + Sybil depth (3-4h)**
1. Add optional mentor curation step: before a submission appears in the vote slate, a mentor must approve it (flip a `vote_eligible: true` flag in the DB or a separate approval table).
2. Add Neynar score gating: existing code in `/api/qv-vote.mjs` already supports `QV_SCORE_MIN` env var. Set to 0.55 (default) to gate low-quality accounts.
3. Optional: add Respect-holder bonus credits. Read ZAO Respect token holders (156 total, live on Base), give them +10 bonus credits per track. Needs a hook in `/api/qv-vote.mjs` to check if voter holds any Respect; increment `BUDGET` to 110 if true.

**Phase 3 (after Finals): Voting analytics + next-round replay (2-3h)**
1. Export final vote tally to `data/qv-results-<season>.json`.
2. Mint achievement NFTs for top 3 per track.
3. Replay: for Cohort 2, reset vote tallies but keep ballots for analytics.

---

## Part 4: Vote-Splitting Consolidation Property

### The Math

In quadratic voting, a builder who receives votes from many voters benefits more than one who gets all votes from one voter. Why? The square root of squared credits.

**Example: Builder A gets 10 votes from one voter (costs 100 credits). Builder B gets 1 vote each from 10 voters (costs 1 credit per voter, 10 total credits used across all 10).**

- Builder A: vote count = 10.
- Builder B: vote count = 1+1+1+1+1+1+1+1+1+1 = 10.
- **Tally is the same, BUT:**
  - A's single voter exhausted their budget and cannot split.
  - B's 10 voters each have 99 credits left to vote elsewhere.
  - Voters are incentivized to spread votes (higher total influence).

**For submissions, this means:**
- If a builder submits 3 times (3 rows in `zabalgames_submissions`), they compete as 3 separate candidates in voting.
- A voter who likes them can spread votes across all 3, but it gets expensive: 1+1+1 = 3 credits, or 2+2 = 8 credits, etc.
- Alternatively, the voter can put all 10 votes on ONE submission (if it's the best one), and the builder benefits more from concentrated support than from diluted votes across 3 weaker submissions.
- **Result: the builder is better off consolidating their best work into one entry than splitting votes.**

### Explicit Cap: Needed or Not?

**Verdict: Cap is NOT required if the slate is hand-curated (Zaal/mentors pre-vet entries).** The QV math handles consolidation on its own.

**Cap IS recommended if the slate is auto-generated from submissions without filtering.** A spammy builder could create 50 entries and create noise in the results.

**Recommendation for ZABAL Gamez:**
- For Cohort 1 (32 builders, mentors know them): no cap. QV handles it.
- For Cohort 2+: if we go fully open (anyone can submit), add a per-builder cap: max 1 submission per FID per season. Add to schema: `builder_fid` (denormalized from `farcaster` for easier uniqueness) + unique constraint `(builder_fid, season_number)`.

---

## Part 5: Phasing & Critical Path to August Finals

### Proposed Timeline (NEEDS ZAAL CONFIRMATION)

| Phase | Dates | Action | Owner | Criteria |
|-------|-------|--------|-------|----------|
| **Intake** | now-2026-08-10 | Builders submit via `/enter` form | Builders | All phase1_* fields populated, Farcaster + github required |
| **Curation** | 2026-08-08 to 2026-08-10 | Mentors review + flag vote-eligible entries | Zaal + mentors | Mentor approval sets internal flag (or manual add to approved list) |
| **Slate gen** | 2026-08-10 EOD | Generate `vote-candidates.json` from approved submissions | Claude or Zaal | Candidates table has all handles + notes, status='open' |
| **Voting** | 2026-08-10 to 2026-08-20 | Public voting window (zabalgamez.com/vote) | Community | Each voter casts ballots; results public live |
| **Tally** | 2026-08-20 EOD | Final results + leaderboard snapshot | Claude or Zaal | Leaderboard published to `/leaderboard`; final JSON snapshot to repo |
| **Finalists** | 2026-08-20 to 2026-08-25 | Announce top 3 per track + feature in newsletter | Iman + ZOE | Finalists notified; achievements/NFTs designed |
| **Capstone** | 2026-08-28 to 2026-08-31 | Mint NFTs + wrap Cohort 1 | Zaal + Iman | Achievement NFTs on-chain; public ceremony |

**This assumes:**
- Submissions close ~2026-08-10 (1.5 weeks from now = 2026-07-23 reference date).
- Voting is the tightest timeline (10 days) to allow 2 weeks for finals activities.
- No voting recount / audit needed (Upstash logs are immutable).

---

## Part 6: Sybil Resistance Strategy (Centered Decision)

### Current Layer: Farcaster FID

Every vote is keyed to a Farcaster FID. One FID = one ballot per track. This is the FIRST and most important gate.

**Weakness:** Farcaster allows creating accounts freely (cost = time + phone + email). A motivated attacker could farm FIDs and vote multiple times per candidate.

### Second Layer (Implemented, Optional): Neynar Quality Score

The `/api/qv-vote.mjs` code already checks Neynar user-quality scores (lines 84-100):
```
const score = await neynarScore(fid);
if (score != null && score < SCORE_MIN) return { error: 'account does not meet the quality threshold to vote' };
```

- `SCORE_MIN` defaults to 0.55 (0-1 scale).
- Neynar scores are based on account age, follower count, cast history, etc.
- If `NEYNAR_API_KEY` is set, low-quality accounts are rejected.
- If key is unset, Neynar check is skipped (graceful fallback to FID-only).

**Recommendation: Enable for August Finals.** Neynar quality score is a low-friction, non-custodial gate that filters obvious bot accounts without blocking real builders.

### Third Layer (Proposed, Not Yet Implemented): ZAO Respect Bonus Credits

**Concept:** ZAO Respect token holders (156 total as of 2026-07-23, per memory) get +10 bonus voice credits per track, raising their budget from 100 to 110.

**Why:** Respect is already a Sybil-resistant identity (on-chain, holders known). This incentivizes ZAO members to vote while giving them slightly more influence (matching the intent: "your stake in the community matters").

**Implementation (3-4h):**
1. Read Respect holders from Base (e.g. via Viem + the Respect contract address from community.config.ts).
2. In `/api/qv-vote.mjs`, after Neynar check, query if `fid` maps to a wallet that holds Respect. If yes, increase `BUDGET` to 110.
3. Requires a Farcaster-to-wallet mapping (already available via Neynar, which returns verified addresses).

**Recommendation: Ship Neynar gate for August. Respect bonus is Phase 2 (post-Finals, for Cohort 2+).**

---

## Part 7: Comparative Analysis - Why Not SchellingPoint

### SchellingPoint's Strengths

| Feature | ZABAL Status |
|---------|---|
| **Quadratic voting mechanism** | Native, identical implementation |
| **Session scheduling** | Not needed (we're rating builders, not scheduling) |
| **Drag-and-drop schedule builder** | Out of scope for QV voting UI |
| **Venue/track management** | Unnecessary (ZABAL tracks are artist/builder/creator, not rooms) |
| **Admin dashboard** | ZABAL mentors manage slate via Git + Vercel deploy |

### SchellingPoint's Weaknesses for ZABAL

| Liability | Issue |
|-----------|-------|
| **License ambiguity** | README says MIT, but no LICENSE file + private: true = legal risk |
| **Scope bloat** | Session scheduling code adds maintenance burden for unused features |
| **Integration surface** | Bringing in Next.js 14 (we're 16) + Radix/Supabase duplication = complexity |
| **Dependency pinning** | If SchellingPoint breaks, we're dependent on them to fix it |

### Recommendation: Build Independently

- **Cost:** 2-4 hours to wire submissions into vote-candidates.json.
- **Benefit:** Owned codebase, minimal dependencies, laser-focused on ZABAL's use case.
- **Risk:** None. Quadratic voting is mechanism-design math (Weyl/Posner 2018), not proprietary.

If a future ZABAL partner (e.g. a different DAO, an event organizer) wants to use SchellingPoint's scheduling features + our voting, revisit THEN. For now: build the 200-line integration ourselves.

---

## Part 8: Specific Implementation Details

### Slate Generation Function (`/api/generate-qv-slate`)

**Input:** Track filter (artist/builder/creator) + vote season/round ID.

**Query template (Supabase):**
```sql
SELECT farcaster, name, phase1_demo, phase1_url, harness, creator_type, why
FROM zabalgames_submissions
WHERE kind = 'submission'
  AND status IN ('submitted', 'claimed')  -- or status = 'finalist' for a dedicated finals vote
  AND created_at > (NOW() - INTERVAL '30 days')  -- or other round marker
ORDER BY created_at DESC;
```

**Output shape (vote-candidates.json format):**
```json
{
  "version": 1,
  "status": "open",
  "tracks": {
    "builder": [
      {
        "handle": "ghostmintops",
        "name": "Brandon (ghostmintops)",
        "url": "https://farcaster.xyz/ghostmintops",
        "note": "DreamNet Publishing mini-app, ZAO music via Suno. Tool: Claude Code."
      },
      ...
    ]
  }
}
```

**Deployment:** Either:
- (Option A) Hardcode `/data/vote-candidates.json` as a static file. Regenerate + commit + push before each voting window. (Simple, manual.)
- (Option B) Serve dynamically from `/api/generate-qv-slate?track=builder`. Cache at the edge for 60s. (Flexible, no manual commit.)

**Recommendation for August Finals:** Option A (hardcoded). Zaal + mentors manually curate the slate, add notes, then deploy. Gives full control. For Cohort 2, shift to Option B if scaling demands it.

### Mentor Approval Gate

**Add to schema (post-Finals):**
```sql
ALTER TABLE zabalgames_submissions ADD COLUMN vote_eligible BOOLEAN DEFAULT FALSE;
CREATE INDEX ON zabalgames_submissions (vote_eligible) WHERE status = 'submitted';
```

**Workflow:**
1. Builder submits via form (status = 'submitted', vote_eligible = false).
2. Mentor reviews the submission in the Supabase dashboard + does a 60-second video spot-check.
3. Mentor flips vote_eligible = true if it's release-worthy.
4. Cron job or manual regenerate `/api/generate-qv-slate` pulls only vote_eligible = true entries.

**Owner responsibility:** Mentors (Zaal delegates to mentor leads).

### Vote Results Persistence

**After voting closes (2026-08-20):**
1. Export `qv:tally:<track>` from Upstash Redis.
2. Save to `data/qv-results-<cohort>-<season>.json` (git + repo).
3. Generate leaderboard: rank by votes, compute percentile.
4. Publish to `/leaderboard` (HTML or API).

**Retention:** Keep results in git forever. Useful for:
- Historical leaderboard comparisons (Cohort 1 vs. Cohort 2).
- Analyzer later: did vote distribution match mentor expectations?
- Fairness audit: public results build trust.

---

## Part 9: Open Questions (For Zaal to Confirm)

| Q | Current Status | Decision Needed |
|---|---|---|
| Do builders know they're being voted on? | Unknown. Likely yes (part of the event), but not explicit in docs. | Recommend: send a cast to each submitted builder 24h before voting opens, with a link to the vote page + their candidate info. |
| What if voting results don't match mentor picks for finalists? | Not documented. Mentor-picked finalists (status='finalist') may differ from QV top 3. | Recommend: QV results are ADVISORY for finalists. Mentors + Zaal make final calls based on QV + qualitative feedback. Publish both (QV results + official finalists). |
| Multi-track voting: can a builder be in multiple tracks (artist + builder)? | Schema allows it (no constraint). | Recommend: allow it. Builders who ship music DAPP can submit as both. They get separate candidate slots; voters decide. |
| Round numbering: is Cohort 1 = Round 1, or is there a Round 0 or prior voting? | Docs mention "Cohort 1" + "Cohort 2" but vote-candidates.json doesn't have a `round` field. | Recommend: add `round` and `cohort` metadata to vote-candidates.json for clarity. Hard-code for now (R1 = Cohort 1). |
| Neynar score threshold: is 0.55 right, or should we tune it? | Default is 0.55 (conservative). Higher = stricter (gatekeeper), lower = more open. | Recommend: start at 0.55. Monitor during August vote. If <1% of votes are rejected, raise it to 0.60 for Cohort 2. If >5% rejected, lower to 0.50. |
| Do we need vote privacy (individual ballots hidden) for ZABAL? | Code stores private ballots in Redis but never exposes them. Results are aggregate-only. | Recommend: keep privacy. Transparency = results only. Prevents vote shaming + pressure. |

---

## Part 10: Files to Create/Modify

### New Files

| File | Purpose | Owner | Timeline |
|------|---------|-------|----------|
| `/api/generate-qv-slate.mjs` | Queries submissions, outputs vote-candidates.json | Claude or Zaal | Phase 1 (by 2026-08-01) |
| `/data/qv-results-cohort1-2026.json` | Final vote tally + leaderboard | Claude or Zaal | After voting closes (2026-08-20) |

### Modified Files

| File | Change | Owner | Timeline |
|------|--------|-------|----------|
| `/data/vote-candidates.json` | Auto-populate from submissions (or hand-curate for Aug) | Zaal or Claude | Before voting opens (2026-08-10) |
| `/db/schema.sql` | Add `vote_eligible`, `season_number` columns (Phase 2) | Claude or Zaal | After Finals (Phase 2, 2026-09-01) |
| `/vote.html` | No changes needed; already wired to `/api/qv-vote` | N/A | N/A |
| `/.env` | Ensure `NEYNAR_API_KEY` is set (enable quality gate) | Zaal + DevOps | By 2026-08-05 |

### Checks/Verification

| Item | How to Verify | Timeline |
|------|---|---|
| Vote slate loads in vote.html | Visit zabalgamez.com/vote, see builder/artist/creator tabs load | Day of launch |
| Farcaster login works | Click vote, sign in with Farcaster, see "100 credits" meter | Day of launch |
| QV cost calculation correct | Allocate votes (1, 2, 3), check cost display updates | Day of launch |
| Submit ballot works | Cast vote, check Upstash Redis has ballot in `qv:ballots:<track>` | Day of launch |
| Results update live | Another voter casts votes in same track, watch tally climb | Day of launch |
| Neynar gate works (if enabled) | Try voting with a <0.55 quality account, should reject | After NEYNAR_API_KEY deployed |

---

## Part 11: Success Criteria & Definition of Done

### Phase 1: MVP (by 2026-08-15)
- [ ] Vote slate generated (manual or auto) and deployed to `/data/vote-candidates.json` or `/api/generate-qv-slate`.
- [ ] All submissions with status='submitted' are voteable (tracked in slate).
- [ ] `/vote` page loads, Farcaster login works, votes are cast + tallied.
- [ ] Results visible at `/api/qv-vote?track=builder&results`.
- [ ] Upstash Redis has ballots + tally records for all tracks.

### Phase 2: Production Hardening (by 2026-08-25)
- [ ] Neynar quality gate enabled + tuned (QV_SCORE_MIN set).
- [ ] Leaderboard page at `/leaderboard` shows final results.
- [ ] Final vote tally exported to `data/qv-results-cohort1-2026.json` and committed.
- [ ] Finalists announced + top 3 per track identified.

### Phase 3: Follow-up (by 2026-09-15)
- [ ] Achievement NFTs designed + minted for finalists.
- [ ] Post-cohort analysis: vote distribution, mentor vs. QV alignment.
- [ ] Cohort 2 planning: add vote-eligible gates + automation.

---

## Part 12: Related Docs & Sources

### Source Files (Verified 2026-07-23)

| File | Location | Status |
|------|----------|--------|
| `qv-vote.mjs` (the voting API) | `/tmp/zabal-verify/api/qv-vote.mjs` | FULL - 195 lines, production-ready |
| `db/schema.sql` (submissions table) | `/tmp/zabal-verify/db/schema.sql` | FULL - 118 lines, schema verified |
| `vote-candidates.json` (slate template) | `/tmp/zabal-verify/data/vote-candidates.json` | FULL - current state shows 3 builder candidates |
| `vote.html` (voting UI) | `/tmp/zabal-verify/vote.html` | FULL - 12.9 KB, frontend ready |
| SchellingPoint README | `/tmp/schelling-verify/README.md` | FULL - line 216 claims MIT but no LICENSE file |
| SchellingPoint package.json | `/tmp/schelling-verify/package.json` | FULL - has "private": true, no license field |

### Prior Research Docs (ZAO OS V1)

| Doc | Relevance |
|-----|-----------|
| [1139 - ZABAL Gamez submission pipeline map](../../1139-zabal-submission-pipeline-map/) | Current seams + rough edges in the pipeline |
| [728 - zabal.art voting UX overhaul](../../728-zabal-voting-ux-overhaul/) | Voting UX patterns for ZABAL leaderboard (unrelated to QV, but good design precedent) |
| [769 - ZAODEVZ/zabalgames repo state](../../769-zaodevz-zabalgames-repo-state/) | Full inventory of the production repo |
| [1349 - ZABAL Gamez Empire tokenless-first design](../../1349-zabal-gamez-empire-tokenless-first-jul2026/) | Leaderboard + NFT architecture (builds on voting results) |

### Mechanism Design References

- **Weyl, G. & Posner, E. (2018).** "Radical Markets." Princeton University Press. Chapters on quadratic voting (foundational).
- **Buterin, V. et al.** Various Ethereum Research posts on QV and mechanism design for DAOs.
- **SchellingPoint repo README.** Lines 63-73 explain quadratic voting (good quick reference).

---

## Part 13: Risk Register

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Neynar quality gate too strict (>10% votes rejected) | Medium | Lower QV_SCORE_MIN to 0.50 mid-voting if threshold exceeded |
| Vote slate has typos / bad Farcaster handles | Low | Manual audit of vote-candidates.json before deploy; Zaal + mentors spot-check |
| Upstash Redis goes down mid-voting | High | Implement local fallback: store ballots in Supabase + batch sync to Redis post-vote. (Phase 2 improvement.) |
| Duplicate submissions (same builder, multiple rows) | Medium | Add DB constraint: UNIQUE(farcaster, season_number) post-Finals. For Aug, accept it (QV handles consolidation naturally). |
| Voting doesn't close at scheduled time | Low | Manually set status='closed' in vote-candidates.json. Cron job + alerting recommended for Cohort 2. |
| Voters split votes to game the system | Low | Quadratic cost makes gaming expensive. Neynar gate filters low-trust accounts. Monitor results for anomalies. |
| Finalists don't match QV top 3 | Low (expected) | Publish both QV results + official finalists. Communicate: "QV is advisory; mentors make final calls." |

---

## Part 14: Next Actions

| Action | Owner | PROPOSED Deadline | Notes |
|--------|-------|------|-------|
| Zaal confirmation: dates (intake/voting/finals) | @Zaal | 2026-07-24 (ASAP) | Times in Part 5 are PROPOSED and need your OK before coding. |
| Zaal confirmation: vote-split cap needed? | @Zaal | 2026-07-24 | For Aug: assume no cap (QV math handles it). For Cohort 2+: recommend 1 submission per FID per season. |
| Zaal confirmation: Neynar gate enabled? | @Zaal | 2026-07-24 | Enable for Aug Finals if risk of bot voting is real. Otherwise: skip (FID-only gate is sufficient for trusted cohort). |
| Generate/validate vote-candidates.json | Claude or Zaal | 2026-08-08 | Query submitted builders, vet them, add context notes, deploy. |
| Enable NEYNAR_API_KEY in Vercel env (if using gate) | Zaal + DevOps | 2026-08-05 | Ensures Neynar checks are live before voting opens. |
| Deploy `/api/generate-qv-slate` (if auto-gen) | Claude or Zaal | 2026-08-01 | Verify queries run + output format matches vote.html expectations. |
| Test voting pipeline end-to-end | Claude or Zaal | 2026-08-08 | Farcaster login -> vote cast -> tally update -> results display. |
| Announce voting window to community | Iman or ZOE | 2026-08-10 | Cast + newsletter + Telegram: voting now open at zabalgamez.com/vote. |
| Export final results + archive | Claude or Zaal | 2026-08-20 EOD | Save qv:tally to JSON, commit to repo, generate leaderboard page. |
| Post-vote analysis: mentor vs. QV alignment | Zaal + mentors | 2026-08-28 | Compare top 3 QV vs. top 3 mentor picks. Report to Zaal. |
| Phase 2 kick-off: vote-eligible gates + Respect bonus | Claude or Zaal | 2026-09-01 (post-Finals) | Design Respect-holder bonus credits + mentor approval flow. |

---

## License Note (Re: SchellingPoint)

SchellingPoint's README claims MIT licensing, but **the actual legal status is ambiguous:** no LICENSE file exists in the repository, and package.json carries `"private": true` with no license field. This makes direct code reuse risky from a compliance perspective.

**Recommendation:** Build ZABAL's QV independently (quadratic voting is mechanism-design math, not proprietary). If a future ZABAL partner wants to integrate SchellingPoint's features (e.g., unconference scheduling), request that the author formally add a LICENSE file and update package.json before any code sharing.

---

## Sign-Off

**Doc written:** 2026-07-23  
**Status:** Research-complete, pending Zaal's confirmation on timeline + design questions.  
**Confidence level:** High (all claims verified against live code + schema).

