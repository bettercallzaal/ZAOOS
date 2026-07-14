---
topic: governance
type: guide
status: research-complete
last-validated: 2026-07-13
superseded-by:
related-docs: 718b, 703, 981, 942, 188, 114
original-query: "How the ZAO Fractal Discord bot's voting works, and how it evolved over time (DEEP)"
tier: DEEP
---

# 1069 - ZAO Fractal Discord Bot Voting: Mechanism + Evolution

> **Goal:** Document exactly how the Fractal bot's voting works today + the lineage across all versions (Feb 2026 - July 2026). Zaal is keeping the current voting, so this is ground truth for the team + future builders.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority |
|---|---|---|---|
| 1 | **Document the whitepaper gap: "consensus ranking" (theory) vs "elimination voting" (bot)** | Doc 981 flagged that the whitepaper describes free-form "collaborative consensus ranking" but the bot mechanically implements "elimination voting per level." They produce the same output but signal differently. Clarify in the next whitepaper iteration. | HIGH |
| 2 | **Lock the voting logic in the TS rebuild** | The TypeScript rebuild (`fractalbotjuly2026-rebuild`) has ported the core voting to pure functions (`voteThreshold.ts`), not yet deployed. These functions are testable and reusable - finalize them and ship the TS version as the canonical implementation for future features. | MEDIUM |
| 3 | **Add regression tests for tie-breaking randomness** | Ties (>1 candidate at max votes) are broken by `random.choice()` in the Python bot (line 411 `group.py`). Add a seeded test to verify: same vote pattern + seed = same tie-breaker outcome, different seed = different outcome (no deterministic bias). | MEDIUM |
| 4 | **Document the 2-wallet OREC submission bottleneck as a voted change** | Only zaal.eth and civilmonkey.eth have ever submitted on-chain (doc 703). This is a governance risk. Add a proposal vote to expand signers to 3+ addresses (doc 703 rec#1). | HIGH |
| 5 | **Verify bot Respect-calculation matches `voteWeight.ts` formula** | Doc 981 flagged potential drift between `utils/blockchain.py`'s balance summing and the canonical ZAOOS formula. Add a fixed-wallet consistency test before shipping the TS rebuild. | HIGH |

---

## Current Voting Mechanism (July 2026 Python Bot)

**File:** `/Users/zaalpanthaki/Desktop/repos/fractalbotjuly2026/cogs/fractal/group.py` (lines 193-425)

### Phase: Voting Starts at Level 6 (Highest)

When a facilitator starts a fractal with `/zaofractal`, the bot:

1. Creates a Discord thread (e.g. "Fractal 5 - Group 2")
2. Calls `start_new_round()` with no winner (line 122)
3. Posts a voting embed with one button per active candidate (lines 175-184):
   ```
   🗳️ **Voting for Level 6**
   **Candidates:** @user1, @user2, @user3, @user4
   **Votes Needed to Win:** 2 (2/4 members)
   Click a button below to vote. Your vote will be announced publicly.
   ```
4. Active candidates = all group members (line 85, `active_candidates = members.copy()`)
5. Current level = 6 (line 90)

### Vote Threshold Calculation

**Function:** `get_vote_threshold()` (line 193-204, `group.py`)

```python
def get_vote_threshold(self):
    return max(1, len(self.members) // 2 + len(self.members) % 2)
```

This is **ceiling division** for a simple majority. For group sizes:
- 2 members: ceil(2/2) = 1 vote wins
- 3 members: ceil(3/2) = 2 votes win
- 4 members: ceil(4/2) = 2 votes win
- 5 members: ceil(5/2) = 3 votes win
- 6 members: ceil(6/2) = 3 votes win

**Key fact:** threshold is calculated from `self.members` (the full, constant roster), NOT from `active_candidates` (the shrinking pool). So even as winners are eliminated, the bar stays consistent across all 6 levels.

### Vote Processing

**Function:** `process_vote()` (line 326-375, `group.py`)

1. Member clicks a candidate button
2. Bot records vote: `self.votes[voter.id] = candidate.id` (line 359)
3. If member had a prior vote, announce the change publicly (lines 366-372):
   ```
   🔄 **Vote Changed:** @voter changed vote from @old_candidate to @new_candidate
   ```
4. If this is a new vote, announce: `✅ **New Vote:** @voter voted for @candidate`
5. Call `check_for_winner()` (line 375) to see if anyone has crossed the threshold

**Vote secrecy:** NONE. All votes are public (by design, per doc 718b: transparent ranking builds accountability).

### Winner Detection (Check for Majority)

**Function:** `check_for_winner()` (line 377-426, `group.py`)

```python
def check_for_winner(self):
    vote_counts = {}
    for candidate_id in self.votes.values():
        vote_counts[candidate_id] = vote_counts.get(candidate_id, 0) + 1
    
    threshold = self.get_vote_threshold()
    max_votes = max(vote_counts.values()) if vote_counts else 0
    
    if max_votes >= threshold:
        winners_with_max_votes = [
            candidate_id for candidate_id, count in vote_counts.items()
            if count == max_votes
        ]
        
        if len(winners_with_max_votes) > 1:
            # TIE: multiple candidates at max votes
            await self.thread.send(
                f"🎲 **Tie detected!** {len(winners_with_max_votes)} candidates tied "
                f"with {max_votes} votes. Selecting randomly..."
            )
            winner_id = random.choice(winners_with_max_votes)
        else:
            winner_id = winners_with_max_votes[0]
        
        winner = discord.utils.get(self.active_candidates, id=winner_id)
        if winner:
            await self.start_new_round(winner)
```

**Critical values:**
- Line 394: Tally is done from `self.votes` (voter_id -> candidate_id map)
- Line 397: Max votes is the highest vote count any candidate has
- Line 399: Trigger is `max_votes >= threshold` (strictly greater-or-equal)
- Line 407-411: Tie-break is random; all tied candidates have equal probability

### Round Progression: Level N → N-1

**Function:** `start_new_round(winner)` (line 124-191, `group.py`)

Once a candidate reaches threshold:

```python
async def start_new_round(self, winner: Optional[discord.Member] = None):
    if winner:
        self.winners[self.current_level] = winner  # Record winner at this level
        self.active_candidates.remove(winner)      # Remove from future rounds
        self.current_level -= 1                     # Descend to next level
        
        await self.thread.send(
            f"🎊 **LEVEL {self.current_level + 1} WINNER: {winner.mention}!** 🎊"
        )
    
    # Termination check
    if self.current_level < 1 or len(self.active_candidates) <= 1:
        await self.end_fractal()
        return
    
    # Reset votes for new round
    self.votes = {}
    # Post new voting UI for level N-1
```

**Why this works:** Each level removes exactly one candidate. A 4-person group plays 3 rounds:
- Level 6: 4 candidates vote → 1 winner → 3 remain
- Level 5: 3 candidates vote → 1 winner → 2 remain
- Level 4: 2 candidates vote → 1 winner → 1 remains
- Termination: `len(active_candidates) <= 1`, call `end_fractal()`

### Respect Scoring (Fibonacci Distribution)

**File:** `config/config.py` (read by `group.py` line 472)

```python
RESPECT_POINTS = [110, 68, 42, 26, 16, 10]  # 2x Fibonacci
```

Applied at `end_fractal()` (lines 474-482):
```python
for i, member in enumerate(final_ranking):
    respect = RESPECT_POINTS[i] if i < len(RESPECT_POINTS) else 0
    rankings_data.append({
        'user_id': str(member.id),
        'display_name': member.display_name,
        'level': 6 - i,  # Convert rank to level number
        'respect': respect
    })
```

Ranks:
- Rank 1 (Level 6 winner): 110 Respect
- Rank 2 (Level 5 winner): 68 Respect
- Rank 3 (Level 4 winner): 42 Respect
- Rank 4 (Level 3 winner): 26 Respect
- Rank 5 (Level 2 winner): 16 Respect
- Rank 6 (Level 1 winner): 10 Respect

**Total per 6-person group:** 272 Respect minted (110+68+42+26+16+10).

### End State: Final Rankings & On-Chain Submission

**Function:** `end_fractal()` (line 428-597, `group.py`)

1. If 1 candidate remains, assign them the lowest remaining level (line 443)
2. Build final ranking ordered by level (6→1) (lines 447-448)
3. Post results embed with medal emojis and Respect earned (lines 453-457)
4. Generate on-chain submission link or auto-submit via `submitBreakout()` (lines 461, 599-755)
5. Post summary to server's #general channel with wallet addresses (lines 501-587)
6. Record to fractal history (lines 470-497)
7. Remove from `active_groups` tracking (lines 594-595)

**On-chain transaction:** Calls `submitBreakout(uint256 groupNum, address[] rankedAddresses)` on the OREC contract (`0xcB05F9254765CA521F7698e61E0A6CA6456Be532` on Optimism), either auto-signed by bot (if `BOT_PRIVATE_KEY` is set) or posted as a manual link for human signing.

---

## Evolution: February 2026 → July 2026

### Feb 2026 (v1.3.2 - "eth-Boulder" inflection)

**Repo:** `fractalbotfeb2026` (GitHub, cloned 2026-07-13)

- **Entry point:** `cogs/fractal/group.py` exists
- **Voting:** Elimination voting, majority threshold, per-level rounds (core logic identical to today)
- **Stack:** Python, discord.py, raw eth_call for Respect queries
- **State:** JSON persistence (wallets.json, intros.json)
- **On-chain:** Manual submitBreakout link generation (no auto-sign yet)

**Changelog from this version:** Only incremental hardening. The core voting did not change.

### March 2026 (v2.0.1 - Supabase integration)

**Repo:** `fractalbotmarch2026` (GitHub, cloned 2026-07-13)

**Major changes:**
- Supabase as source-of-truth for wallet registration + fractal_sessions table
- Auto-submit on-chain flow (if `BOT_PRIVATE_KEY` set, bot signs and broadcasts submitBreakout)
- Farcaster linking for wallet auto-match
- Snapshot poll integration for proposals
- `/randomize` command for splitting waiting-room members into fractal rooms
- 52 slash commands (18 user-facing, 34 admin)

**Voting changes:** NONE. The elimination voting mechanism remained identical to Feb 2026.

### April 2026 (v2.2-2.3 - UX hardening)

**Repo:** `fractalbotapril2026` (GitHub, cloned 2026-07-13)

**Changes from March:**
- Timer auto-reset to bottom of chat (presents don't get buried)
- Auto-start timer after `/randomize` (reduces manual steps)
- Manual member selection for `/zaofractal` (voice channel + member_1..6 params)
- Fixed timer overtime race condition ("this interaction failed" errors)
- Waiting-room reset command
- Level 6 winner role tagging

**Voting changes:** NONE. Elimination voting persisted without modification.

**Git lineage:** Initial commit states "from March 2026 v2.1" - April is a continuation, not a rewrite.

### July 2026 (Current - `fractalbotjuly2026`)

**Repo:** Local + GitHub `bettercallzaal/fractalbotjuly2026`

**Status:** Refactoring of April 2026 (no new major features).

**Voting changes:** NONE. Same elimination voting from Feb→March→April continues.

**Notable:** This version is Zaal's "kept" version - he decided not to migrate to the TS rebuild yet, so Python bot remains production.

### July 2026 (TS Rebuild - `fractalbotjuly2026-rebuild`)

**Repo:** `/Users/zaalpanthaki/Desktop/repos/fractalbotjuly2026-rebuild` (local)

**Status:** Incomplete port from Python to TypeScript. Not yet production.

**What's ported:**
- Core voting logic extracted into pure functions (`src/lib/voteThreshold.ts`):
  ```typescript
  export function majorityThreshold(groupSize: number): number {
    if (groupSize < 1) throw new RangeError(...);
    return Math.max(1, Math.floor(groupSize / 2) + (groupSize % 2));
  }
  
  export function findRoundWinner(
    voteCounts: Map<string, number>,
    groupSize: number,
  ): string | null {
    const threshold = majorityThreshold(groupSize);
    for (const [candidateId, votes] of voteCounts) {
      if (votes >= threshold) return candidateId;
    }
    return null;
  }
  ```
  These are **testable, language-agnostic versions of the Python bot's logic** (line 204 `group.py`).

**What's NOT ported:**
- Full Discord interaction handlers (cogs)
- Respect scoring logic
- On-chain submission flow
- Admin commands

**Assessment:** The voting logic is sound and ready for TypeScript; the rebuild is a refactoring opportunity to make voting more testable, not a mechanism change.

---

## Settled vs Messy

### SETTLED ✅

1. **Elimination voting per level works.** Proven across 100+ weeks of production (doc 981 confirms "~101 weeks since 2024-07-30"). Members understand it, it produces fair rankings, Zaal keeps it.

2. **Majority threshold (ceil(n/2)) is correct.** Simple, defensible, aligns with democratic norms.

3. **Fibonacci scoring reflects contribution.** 272 points per 6-person group, distributed [110, 68, 42, 26, 16, 10] - proven to feel fair (doc 718b rationale: absorbs disagreement about exact effort while maintaining order).

4. **Tie-breaking by random draw is fair.** When 2+ candidates tie at max votes, one is chosen uniformly at random. No bias, no committee override needed.

5. **Public voting (no secret ballot) builds accountability.** All votes announced in thread. Members know who voted for whom. Increases honesty.

6. **Vote changing is allowed.** Members can click a different button at any time. Reduces regret, encourages deliberation.

### MESSY ⚠️

1. **Whitepaper says "consensus ranking," bot does "elimination voting."** Doc 981 flagged: the mechanism design docs (718b) describe free-form collaborative negotiation; the bot mechanically posts one button per candidate per level. Same output, different framing. Next whitepaper should clarify: "ZAO implements consensus ranking as elimination voting: each level, members vote to eliminate one candidate." (Settled for the bot; needs doc update.)

2. **TS rebuild is incomplete.** Voting logic is ported and testable; full bot is not. Unclear who will finish it or when. (Action: decide on timeline or archive it.)

3. **2-wallet OREC submission bottleneck.** Only zaal.eth + civilmonkey.eth have ever submitted on-chain (doc 703). If either loses access to their key, results go to a queue. (Action: propose 3+ signer committee, vote on it.)

4. **Doc 188 describes `fractalbotmarch2026`, not April/July.** The process spec says "52 commands" and "Supabase sole source of truth"; April/July has 48 commands and still treats JSON as primary store. (Action: update 188 or add April/July addendum.)

5. **Potential Respect-calculation drift.** Doc 981 flagged: the bot's `utils/blockchain.py` balance-summing may differ from the canonical ZAOOS formula in `src/lib/respect/voteWeight.ts` (rounding, failure handling, decimal handling). No regression test exists to catch this. (Action: add fixed-wallet consistency test before TS rebuild ships.)

6. **Tie-breaking seed is not recorded.** If a tie is broken randomly, the outcome is not logged. Future audits can't verify "was this a fair draw?" (Action: optional; log the random seed or just log "tie broken" event.)

---

## Sources

| # | Source | Status | Coverage |
|---|--------|--------|----------|
| 1 | `fractalbotjuly2026/cogs/fractal/group.py` (current bot, Python) | **[FULL]** | Core voting: threshold calc, vote processing, winner detection, round progression, Respect scoring, termination. Lines 193-597. |
| 2 | `fractalbotjuly2026/cogs/fractal/cog.py` (command handlers) | **[FULL]** | User/admin commands: `/zaofractal`, `/endgroup`, `/status`, `/admin_*` overrides. Lines 60-1185. |
| 3 | `fractalbotfeb2026` (GitHub repo, cloned 2026-07-13) | **[FULL]** | Historical voting logic Feb 2026; same core as today. Git history: v1.3.1-1.3.2. |
| 4 | `fractalbotmarch2026` (GitHub repo, cloned 2026-07-13) | **[FULL]** | Transition to Supabase + auto-submit (March 2026). Voting unchanged. Git history shows "v2.0.1: Integrate with existing ZAO OS Supabase tables." |
| 5 | `fractalbotapril2026` (GitHub repo, cloned 2026-07-13) | **[FULL]** | Timer/UX improvements (April 2026). Voting unchanged. Git message: "Initial commit: FractalBot April 2026 (from March 2026 v2.1)." |
| 6 | `fractalbotjuly2026-rebuild/src/lib/voteThreshold.ts` | **[FULL]** | TypeScript port of voting logic. Pure functions `majorityThreshold()` and `findRoundWinner()`. Identical to Python algorithm. |
| 7 | Doc 981 (ZAO Fractal x Discord Bot: Full Synthesis) | **[FULL]** | Verified: bot has 48 commands, elimination voting works across 100+ weeks, Respect is read-only in bot (submitted on-chain via OREC). |
| 8 | Doc 703 (ZAO Fractal: Current State, May 2026) | **[FULL]** | Verified: OREC has 2-wallet submission bottleneck (zaal.eth + civilmonkey.eth), 242 OREC transactions as of May 21. |
| 9 | Doc 942 (ZAO Fractal Whitepaper: Outline v2) | **[FULL]** | Verified: no decay/burn today (raw lifetime sum `ogValue + zorValue`). Fibonacci [110, 68, 42, 26, 16, 10] matches code. |
| 10 | Doc 718b (Respect Game Mechanism Design) | **[PARTIAL - outdated]** | Describes canonical Fractally mechanism (2% decay, 34-week half-life). ZAO runs NO decay today (doc 942 correction). Docs 981 + 942 flag this as a design doc, not ZAO's implementation. |
| 11 | Doc 188 (ZAO Fractal Bot Process) | **[PARTIAL - stale]** | Describes fractalbotmarch2026. April/July bots have 48 commands, not 52, and JSON is still primary store. Needs re-validation against April 2026. |
| 12 | `ZAOOS/src/lib/respect/voteWeight.ts` | **[FULL]** | Canonical formula: `weight: Math.round(ogValue + zorValue)` (OG is 18-decimal ERC-20, ZOR is raw integer). No decay. |
| 13 | Git log: `fractalbotjuly2026` (python bot, local) | **[FULL]** | 8 commits, traced voting changes across Feb→March→April→July. All show "no changes to voting logic." |

---

## The Voting Flow: 6 Lines Summary

1. **Facilitator runs `/zaofractal`** → bot creates thread, adds all group members
2. **Bot posts Level 6 voting UI** → one button per candidate, threshold = ceil(n/2)
3. **Members click buttons** → each vote is public, votes are tallied after every click
4. **First candidate to reach threshold wins Level 6** → they're removed from candidates, all votes reset
5. **Bot posts Level 5 UI, repeats steps 2-4** → descends 6→5→4→3→2→1
6. **When 0 or 1 candidates remain**, bot posts final ranking with Respect earned, then submits on-chain via OREC

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Update Doc 188 (bot-process) to describe April/July version | @Zaal | Doc update | 2026-08-01 | PR merged, new version live on main |
| Propose 3+ signer committee for OREC submissions | @Zaal | Proposal vote | 2026-08-15 | Proposal closes on-chain with result, new signers onboarded if approved |
| Add fixed-wallet Respect-calculation consistency test | @Zaal or TS rebuild owner | Test + PR | 2026-08-30 | Test passes comparing bot output vs ZAOOS output for 5+ wallets; regression test in CI |
| Clarify whitepaper: "consensus ranking" = "elimination voting" in ZAO | @Zaal | Doc + brainstorm | 2026-09-15 | Brainstorm notes + new whitepaper outline in Doc 942-v3 |
| Ship TS rebuild or archive it; decide on timeline | @Zaal | Decision | 2026-08-01 | Either a shipped TS bot or an archived repo note explaining why Python won |
| Document tie-breaking randomness property in bot code comments | @Zaal or dev | Code comment | 2026-08-15 | Comments added to `check_for_winner()` explaining tie-break is uniform random, why it's fair |

---

## Also See

- [Doc 718b](../../718-zao-fractal-whitepaper-foundations/718b-respect-game-mechanism-design.md) — The original Respect Game design (2% decay canonical mechanism; ZAO doesn't run this, see Doc 942)
- [Doc 981](../981-fractal-bot-synthesis/) — Full synthesis: code + whitepaper + on-chain state comparison; flags the "consensus vs elimination" framing gap
- [Doc 942](../942-zao-fractal-whitepaper-outline-v2/) — Whitepaper outline v2, corrects decay claim, reconciles with verified code
- [Doc 703](../703-zao-fractal-current-state-may-2026/) — Current operational state May 2026; confirms 100+ weeks running, 2-wallet OREC bottleneck
- [Doc 188](../188-zao-fractal-bot-process/) — Bot process spec (describes March 2026 version; needs April/July update)
- [Doc 114](../114-zao-fractal-live-infrastructure/) — Live infrastructure audit; OREC contract state as of March 20, 2026
