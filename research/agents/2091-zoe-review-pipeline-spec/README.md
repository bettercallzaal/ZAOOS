---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-27
related-docs: 2079, 2089, 2090
original-query: "Design the ZOE review pipeline: ZOE auto-pulls Iman's board submissions, scores 0/10, flags edits/followups/flair, routes ZOE->Jose->ZOE->Zaal for quick polish reviews. (overnight system-improvement loop)"
tier: STANDARD
---

# 2091 - ZOE review pipeline (design spec)

> **Goal:** Spec the autonomous ZOE loop that reviews Iman's board submissions (0/10 + edit/followup/flair flags) and routes ZOE -> Jose -> ZOE -> Zaal for quick polish - a design for approval, not a build.

**Status:** Design only. No build approval yet. Flag schema unknowns explicitly.

**Rationale:** Tonight Zaal demoed ZOE scoring Iman's "Eliances brief" (8/10) and producing a v2 with ZAO-relevance column + top-3 connects lead. This spec formalizes that workflow as an autonomous loop: ZOE reviews, Jose reads for web3/ZAO fit, ZOE folds feedback, Zaal approves, then internal push to ZAALBOTS or the cowork board.

---

## 1. DISCOVERY: Schema + Trigger Unknowns

**What we know (from `bot/src/zoe/task-comment-replies.ts`):**
- Cowork board: Supabase project `etwvzrmlxeobinrlytza`, table `public.tasks`
- Task schema: `id` (UUID), `legacy_id`, `title`, `notes`, `status`, `owner_id`, `metadata` (JSONB)
- Comments live in `metadata.comments` array: `{ id, userId, displayName, content, createdAt, editedAt }`
- API: PostgREST at `COWORK_TRACKER_URL/rest/v1/tasks` with `COWORK_TRACKER_KEY` auth (PATCH access needed)
- Iman's team_members ID: `511dfe3d-be66-4ff0-b100-917a2d59ec68`

**What needs confirmation (flag head-on in first PR):**

1. **WHERE are Iman's submissions?**
   - Scenario A: New tasks with `owner_id = 511dfe3d-be66-4ff0-b100-917a2d59ec68` and `status = 'TODO'` or `'TRIAGE'`?
   - Scenario B: Comments she posts on parent date-container todos (e.g., legacy_id 1309 "Tue 21/07/2026")?
   - Scenario C: A separate `submissions` table or a `submitted_by` field in `metadata`?
   - **Action:** Before first PR, confirm with Zaal: is the "Eliances brief" a task row, a comment, or something else? Query live data to confirm schema.

2. **How to detect "new" submissions?**
   - Poll all Iman-owned tasks updated since last tick?
   - Subscribe to a webhook (cowork app supports GitHub-style webhooks)?
   - Poll tasks where `status = 'TRIAGE'` (a funnel flag)?
   - **Action:** Query the cowork app's API / webhook config to confirm if subscriptions exist; if not, default to 10-minute poll cadence on `updated_at`.

3. **What marks a submission as "ready for review"?**
   - Is it just `status = 'TODO'` or explicit?
   - Does Iman tag tasks with a `#review-request` label or flag in metadata?
   - **Action:** In first PR, default to `status IN ('TODO', 'TRIAGE')` AND `owner_id = Iman`; add a metadata flag `{ flagged_for_review: true }` if needed later.

---

## 2. TRIGGER MECHANISM

**Poller:** ZOE runs an autonomous `review-pipeline` loop on a 10-minute cadence (after cowork-comment-replies, same `COWORK_TRACKER_URL` + `COWORK_TRACKER_KEY`).

**Query (PostgREST):**
```
GET /rest/v1/tasks
  ?owner_id=eq.511dfe3d-be66-4ff0-b100-917a2d59ec68
  &status=in.('TODO','TRIAGE')
  &archived_at=is.null
  &updated_at=gt.{LAST_POLL_TIME}
  &select=id,legacy_id,title,notes,status,metadata,updated_at
  &order=updated_at.desc
  &limit=50
```

**State tracking:** ZOE memory at `~/.zao/zoe/review-pipeline.json`:
```json
{
  "lastPollAt": "2026-07-27T12:34:00Z",
  "inProgress": {
    "<task_id>": {
      "taskId": "<uuid>",
      "legacyId": "1355",
      "title": "Eliances brief",
      "zoeScore": 8,
      "stage": "jose-review",
      "zoeReviewText": "...",
      "joseReviewText": null,
      "zaalApprovalAt": null
    }
  },
  "completed": [
    // archived items for audit
  ]
}
```

**Detection:** Find tasks with `updated_at > lastPollAt` that are not already in `inProgress` or `completed`.

---

## 3. SCORING RUBRIC (0/10)

ZOE uses this rubric to score each new submission. Rubric is internal only; scores are consistent, not vibes.

| Criterion | Weight | 0 | 5 | 10 |
|-----------|--------|---|---|-----|
| **Completeness** | 2x | Missing core info, half-finished | 50-75% of sections present | All expected sections, comprehensive |
| **Actionability** | 2x | Vague, no clear next steps | Some unclear steps, partial structure | Clear tasks/owners/deadlines, ready to hand-off |
| **ZAO-relevance surfaced** | 1x | No ZAO angle mentioned | ZAO context vague | ZAO mission/fit/impact explicit |
| **Clarity & structure** | 1x | Rambling, hard to parse | Readable but clunky | Well-organized, scannable, professional tone |
| **Polish & voice** | 1x | Typos, inconsistent style | Minor grammar issues | Clean, on-brand, proofread |

**Scoring rule:** 
- Sum the criterion scores (weighted by 2x, 2x, 1x, 1x, 1x = total weight 7x)
- Normalize to 0-10: `raw_sum / 7`
- Round to nearest integer
- If score < 4: flag "needs editing"; if score >= 4 and < 7: flag "needs refinement"; if >= 7: "ready"

**Output format (Telegram):**
```
REVIEW SCORE: 8/10 [ready]

Strengths: comprehensive research, clear player positioning, strong ZAO angle (contributor/artist ecosystem fit).

Gaps: missing success metrics definition, no 30-day sprint breakdown.

Edits needed: 
- Add KPI table (engagement, signups, retention targets)
- Clarify Phase 1 scope vs backlog

Top 3 ZAO connects: 
1. Tom Fellenz (artist licensing)
2. Brandon (DreamNet trust layer)
3. Sparkz (creator coin launcher)

---
```

---

## 4. ROUTING STATE MACHINE (score-gated ladder - Zaal's model, 2026-07-28)

The score at each hop is a GATE: **pass (score > 5) advances one step; fail
(score <= 5) goes BACK to the author to revise.** Same shape at every hop. This
replaces the earlier "skip Jose if >=7" design - the point is a quick quality
ladder where weak work is bounced early, not pushed forward.

```
Iman submits to the ZAO board
  ↓
ZOE reviews -> scores 0/10
  • score > 5  -> ADVANCE to Jose
  • score <= 5 -> BACK TO IMAN (ZOE returns the gaps + suggested edits; Iman revises + resubmits)
  ↓
Jose reviews (web3/ZAO fit) -> scores 0/10
  • score > 5  -> ADVANCE to Zaal
  • score <= 5 -> BACK TO IMAN (with Jose's notes; revise + resubmit)
  ↓
Zaal reviews -> final call
  • approve -> publish (v2 to the board as a comment on the original task)
  • request changes -> BACK TO IMAN
```

Threshold: **> 5 advances, <= 5 returns.** No "skip a step" - every submission
that ships has been gated by ZOE, then Jose, then Zaal. Focus stays on polish +
flair, not gatekeeping; a bounce always carries the specific gaps so Iman knows
exactly what to fix.

**Delivery methods:**
- **ZOE-REVIEW (ZOE → Zaal):** DM in @zaoclaw_bot, no action buttons yet (read-only). TG message max 2 blocks.
- **JOSE-REVIEW (ZOE → Jose → Zaal):** Post to a private ZAALBOTS group thread tagged `#iman-reviews`. Jose replies directly in thread. ZOE re-fetches every 30s for 5 minutes; if no reply, timeout gracefully (report to Zaal).
- **ZOE-FINALIZE (ZOE):** Internal, no TG send.
- **ZAAL-APPROVAL (ZOE → Zaal):** DM with 2 buttons. Zaal's reply = next action.

**Verdicts & outcomes:**
- **Approve + Push:** Post v2 doc + review to cowork board comment; mark `status = 'DONE'`; Telegram confirmation "Review complete, posted to board."
- **Request Changes:** Reply in TG with change list; set item to `stage = 'awaiting-revisions'`; re-poll in next cycle for updates.
- **Archive:** Mark `status = 'DONE'` without posting; record in memory for audit.

---

## 5. ARCHITECTURE: Reused vs New

**REUSED:**
- ZOE bot infra: `bot/src/zoe/index.ts`, Telegram polling, grammy middleware
- Cowork client: `bot/src/lib/cowork.ts` for task status updates
- Cowork tracker API: `COWORK_TRACKER_URL` + `COWORK_TRACKER_KEY` (same as task-comment-replies)
- Memory layer: `bot/src/zoe/memory.ts` (read/write JSON files under `~/.zao/zoe/`)
- Claude calling: `bot/src/hermes/claude-cli.ts` for ZOE scoring + finalization
- State machine: ZOE's existing DM/TG message handling for buttons + threading

**NEW:**
- `bot/src/zoe/review-pipeline.ts`: The poller loop, rubric logic, state machine orchestration (~300-400 LOC)
- `bot/src/zoe/review-rubric.ts`: The 5-criterion rubric + scoring logic (~80-100 LOC)
- Memory file: `~/.zao/zoe/review-pipeline.json` to track in-flight reviews
- Scheduler hook: Register `review-pipeline` loop in `bot/src/zoe/scheduler.ts` (10-minute cadence)
- TG routing: New Telegram message handler for Jose feedback in ZAALBOTS group (add to concierge if-tree)

**No database schema changes needed** if submissions are tasks or comments (use existing `metadata.comments`). If a separate `submissions` table exists, flag that for Zaal approval before PR 1.

---

## 6. FIRST PR: Minimal Slice

**Goal:** ZOE detects a new Iman submission, scores it 0/10 per rubric, and posts the score + gaps to Zaal's DM. NO routing or state machine yet.

**Files:**
- `bot/src/zoe/review-rubric.ts` (NEW): Export `scoreSubmission(text: string, title: string): { score: number; reasoning: string }`
- `bot/src/zoe/review-pipeline.ts` (NEW): Export `runReviewPass()` - fetches new tasks, scores each, posts to Zaal DM
- `bot/src/zoe/memory.ts` (EDIT): Add `readReviewMemory()` + `writeReviewMemory()` helpers
- `bot/src/zoe/scheduler.ts` (EDIT): Register `review-pipeline` loop at 10min cadence
- `.env.example` (EDIT): Document `COWORK_TRACKER_URL`, `COWORK_TRACKER_KEY`, `ZAAL_TELEGRAM_ID` (already present)

**Test:** Manual: create a test task with Iman's ID, verify ZOE scores it and sends to @zaoclaw_bot DM.

**Schema confirmation:** PR 1 must include a comment with the exact PostgREST query used to fetch Iman's tasks, and Zaal signs off that the data shape is correct.

---

## 7. CONSENT & SAFETY BOUNDARY

- **Internal only:** Reviews do NOT auto-post to Iman's task or external channels. ZOE collects them for Zaal/Jose to vet.
- **Zaal gate:** Nothing leaves ZOE's DM → Jose → ZOE → Zaal without Zaal's explicit [Approve + Push] button press.
- **No feedback loop:** Iman is NOT notified of reviews until Zaal approves. (Future: option to CC Iman on approved reviews.)
- **Logging:** All reviews logged to `~/.zao/zoe/review-pipeline.json` for audit; no Bonfire or shared knowledge-graph posting.
- **Rate limiting:** Max 5 reviews per tick (10-minute poll), max 1 per Iman per day to avoid spam during feedback cycles.

---

## 8. NEXT STEPS (AFTER PR 1)

1. **PR 2:** Jose-review routing + ZAALBOTS group thread. Test with a real Jose review.
2. **PR 3:** ZOE-finalize + Zaal approval buttons. Test end-to-end with Zaal.
3. **PR 4:** Cowork board comment posting + status updates.
4. **Documentation:** Add to `AGENTS.md` "Boundaries" section once stable.

---

## QUESTIONS FOR ZAAL

1. Where does the "Eliances brief" live in the cowork schema? (Task row? Comment? Separate table?)
2. Should ZOE also score comments that Iman posts on parent todos, or only top-level tasks?
3. When Zaal approves a review, should the v2 document be a separate task or a comment on the original?
4. Should Jose's feedback be live-threaded in Telegram, or async (Jose replies when available)?
5. Is there a "research flag" or metadata tag that marks submissions for review, or should ZOE assume all Iman-owned TODO/TRIAGE tasks?

