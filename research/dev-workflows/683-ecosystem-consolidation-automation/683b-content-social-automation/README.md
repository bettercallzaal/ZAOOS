---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-05-20
related-docs: 661, 663, 676, 676c, 533, 620, 673
tier: STANDARD
---

# 683b - Content + Social Automation: Manual Step Audit

> **Goal:** Map the end-to-end content workflow from capture through publish - social posts, newsletters, meeting recaps - and identify where manual steps can be consolidated or automated while respecting Zaal's review gate (deferred auto-publish until content quality is locked per feedback_social_pipeline_priorities_may6).

---

## Current Workflow State

**The pipeline today:**

1. **Capture** - ZOE drafts 4-category posts daily (build/ecosystem/event/personal), pings Zaal 7 times/day via Telegram DM with raw post text
2. **Review** - Zaal reads and copy-pastes keepers into Firefly app (cross-posts to Farcaster + X)
3. **Expand** - `/socials` skill generates 7-platform variants (X GC, FC GC, Telegram, Discord, LinkedIn, Facebook) on explicit request
4. **Clipboard UX** - `/clipboard` skill opens browser page with copy buttons per platform
5. **Multi-paste** - Zaal manually copies and pastes to each platform's app/GC in sequence
6. **Newsletter** - Separate hand-crafted process (no skill yet), requires agenda input
7. **Meeting recaps** - `/meeting` skill extracts + distributes, but final publish + social amplification are manual
8. **Analytics** - No feedback loop; posts don't inform future drafts

**Key constraints (per feedback memories):**
- No auto-publish until content quality is locked (feedback_social_pipeline_priorities_may6)
- Firefly-only default mode for casual posts (feedback_firefly_only)
- Copyable content in own bubble (feedback_copyable_content_own_bubble)
- No work-day time references (feedback_social_posting)
- Meeting recaps ALWAYS to ZAOOS `research/events/` (never scatter)

---

## Opportunities: Ranked by Value + Difficulty

| Opportunity | Current state | Proposed consolidation/automation | Difficulty (1-10) | Value | Cheap win? |
|---|---|---|---|---|---|
| **1. Bonfire → Newsletter semi-automation** | Hand-crafted agenda needed for every `/newsletter` draft | Newsletter skill queries bonfire for "completed_tasks + decisions + shipped_prs from past 7d", shows structured digest, Zaal edits then publishes | 5 | HIGH | YES |
| **2. Post-draft → link-inclusion check** | Drafts never ask "any links to include?" (POIDH bounty, Lu.ma, GitHub repos, docs go missing) | Newsletter + social drafters call bonfire recall(topic) + ask for extra links before outputting | 3 | HIGH | YES |
| **3. Per-platform caption tailoring** | All 7 platforms get same/similar post text (X algo prefers punchy short, LinkedIn prefers 3-5 sentences, Discord favors conversational) | Socials skill branches captions: X gets 1-2 punchy sent, FC/GC gets more context, LinkedIn gets 4-5 professional sentences, custom templates | 6 | HIGH | NO |
| **4. Newsletter → Bonfire → Social post chain** | Three separate workflows; newsletter content doesn't feed social drafts; social posts don't inform future newsletters | One "publish newsletter" action triggers: 1) bonfire episode for newsletter, 2) social post variants queued in `/socials`, 3) clipboard page auto-opens | 5 | HIGH | YES |
| **5. Meeting recap → social amplification** | Meetings get captured + recapped, but no "share this decision/action on socials" automation. Key decisions buried in research docs | After meeting recap in research/events/, offer one-click "thread this on Farcaster" + "blast the main 3 decisions to X GC" | 4 | MEDIUM | YES |
| **6. Bonfire analytics → Neynar webhook** | No feedback from cast performance back into Bonfire. Drafts don't see what landed | Wire Neynar webhook for cast likes/recasts + X API for impressions, ingest into Bonfire so ZOE/newsletter agents see "what resonated" | 6 | MEDIUM | NO |
| **7. Voice consistency guard across drafters** | ZOE posts, socials skill, newsletter skill, meeting recaps all draft content separately (no shared voice ruleset) | Create `bot/src/zoe/voice/index.ts` with 11 voice rules (no emojis, active verbs, lead with shipped, no em-dashes, etc), import in all 4 drafters, add pre-flight lint check | 3 | HIGH | YES |
| **8. Auto-tag meeting attendees in recap** | Meeting recaps don't link to Bonfire nodes for attendees, so knowledge graph doesn't know "who was there" or "what they own next" | Extract attendee names from transcript, cross-check Bonfire for existing nodes, add backlinks in recap doc | 4 | MEDIUM | YES |
| **9. Unified /clipboard for multi-step workflows** | Clipboard skill is one-off per invocation; no persistent queue of "things ready to copy" | Add `/clipboard-queue` state file (~/.zao/clipboard-queue.json) so /socials + /newsletter + /meeting can add items without immediately opening browser | 5 | MEDIUM | NO |
| **10. Newsletter skill (missing entirely)** | No `/newsletter` skill; hand-craft every time or use `/socials` in reverse (backwards workflow) | Build `/newsletter` skill: bonfire query for digest, recall() on key topics, template + Zaal edit, publish to Paragraph + bonfire episode | 7 | HIGH | NO |

---

## Top 3 Consolidations (Reduce Manual Steps)

### 1. Bonfire → Newsletter Semi-Automation (Difficulty 3, Value HIGH)

**Current:** Zaal manually curates what went into the newsletter agenda each week.

**Path:** 
- Newsletter skill (to be built) opens with: `const digest = await bonfire.query('completed_tasks + decisions + shipped_prs from past 7d')`
- Returns structured list of ~15-25 items (tasks, decisions, shipped PRs from Bonfire episodes)
- Skill shows digest to Zaal with "Edit agenda below:" prompt
- Zaal adds/removes/reorders
- On publish: writes to Paragraph + posts bonfire episode

**Files:**
- Create `~/.claude/skills/newsletter/SKILL.md` (pattern from `/socials`)
- Create `bot/src/zoe/newsletter-agent.ts` (bonfire query + template)
- Reference: `bot/src/zoe/posts/drafters.ts` (existing drafter pattern)

**Why:** Zaal says "should definitely stand on analytics" + "when we make the context better and confirm it's doing the right things on first try we will step back." This is first-try automation - it surfaces bonfire signal, lets Zaal filter, then publishes.

---

### 2. Post-Draft Link-Inclusion Check (Difficulty 2, Value HIGH)

**Current:** Social posts and newsletter drafts ship without prompting for supplementary links (Lu.ma event RSVPs, POIDH bounty URLs, GitHub repos, research docs).

**Path:**
- Every drafter (ZOE posts, socials, newsletter) calls: `await bonfire.recall(topic)` before outputting
- If topic returns context, ask: "Any extra links? POIDH bounty live? Lu.ma link? GitHub? Docs?"
- Zaal types links or ⏎ to skip
- Links get embedded in post before clipboard opens

**Files:**
- Add `bonfire.recall()` call in `bot/src/zoe/posts/drafters.ts` line 40 (build/ecosystem/event categories already have topics)
- Add link-prompt before `fireOneDraft()` in `bot/src/zoe/posts/scheduler.ts`
- Socials skill: add recall phase to `socials/SKILL.md` Mode 2 (Standalone Posts)

**Why:** Feedback 2026-05-06: "should definitely ask for links if needed and include other links if so." Quick win - adds 30 seconds of friction but catches the 80% of missed links.

---

### 3. Newsletter → Bonfire → Social Post Chain (Difficulty 4, Value HIGH)

**Current:** Newsletter publish is separate from social post drafting. No automation between them.

**Path:**
- Newsletter skill: on publish to Paragraph, fire three async tasks
  1. Create bonfire episode for newsletter (title, date, body preview)
  2. Queue social post variants in `/socials` clipboard (Firefly main, X GC, FC GC, etc)
  3. Auto-open `/clipboard` with variants
- Socials skill already handles multi-platform generation; just needs to be triggered by newsletter publish

**Files:**
- Newsletter skill: `bot/src/zoe/newsletter-agent.ts` (existing pattern from ZOE post slate)
- Socials skill: add `newsletter_published` event handler or optional `--from-newsletter <url>` flag
- State: `~/.zao/newsletter-drafts/` (track what got sent)

**Why:** Feedback 2026-05-06 ship order #3: "per-platform caption tailoring (real prompt work; 4-6hr per platform mode)" is blocked until content quality locks. But newsletter → social variants is already done (socials skill exists). Just wire the trigger.

---

## Top 3 Automations (Reduce Manual Effort)

### 1. Voice Consistency Guard Across All Drafters

**Current:** ZOE posts, socials skill, newsletter skill (to-be-built), and `/meeting` skill each have their own voice rules embedded in prompts.

**Path:**
- Extract 11 voice rules from socials/SKILL.md into `bot/src/zoe/voice/index.ts`:
  ```typescript
  export const ZAO_VOICE_RULES = {
    emoji: 'NEVER use emojis or decorative Unicode',
    em_dash: 'Use hyphens, not em-dashes',
    lead_with: 'Lead with what shipped, not feelings',
    no_work_time: 'Avoid work-day time references',
    active_verbs: 'Use active verbs (shipped, spun out, graduated)',
    // ... 6 more
  };
  ```
- All drafters import + reference
- Add `npm run lint:voice` that scans output against rules

**Files:**
- Create `bot/src/zoe/voice/index.ts` (rules + helper)
- Import in: `bot/src/zoe/posts/drafters.ts`, `bot/src/zoe/newsletter-agent.ts`, `/socials/SKILL.md`, `/meeting/skill.md`
- Add pre-flight check in each drafter before output

**Why:** Consistency = brand strength. This is a cheap system-wide win: one source of truth, no prompts fighting each other.

---

### 2. Meeting Recap → Social Amplification (One-Click)

**Current:** Meetings get captured and recapped, but sharing key decisions/actions on socials is a separate manual job.

**Path:**
- `/meeting` skill Phase 5 report adds: `[--] Social amplification (opt-in) - share top 3 decisions on Farcaster?`
- If Zaal says yes, automatically:
  1. Extract top 2-3 decisions (by confidence + impact)
  2. Draft a Farcaster thread (3-4 casts) linking to recap doc
  3. Queue in socials clipboard
  4. Show for Zaal to review/edit before publish

**Files:**
- Meeting skill: add Phase 5 decision routing (in `~/.claude/skills/meeting/SKILL.md` line 298)
- Call existing socials drafter with meeting context
- Output: clipboard page with thread + copy button

**Why:** Decisions are high-signal. Sharing them amplifies thought leadership. Low effort (reuse existing socials skill) + high impact.

---

### 3. Voice-Memo Transcription → Post (Auto-Pipe)

**Current:** ZOE has `/voicememo <text>` for manual text, but voice-note transcription is manual (requires VPS Whisper + manual SCP).

**Path:**
- ZOE accepts `/voicememo <path-to-.m4a>` (instead of text)
- Pipes to VPS transcription (existing from `/meeting` skill's Phase 1)
- Returns transcript
- Auto-drafts "Personal" category post from transcript
- Shows draft for Zaal to edit or approve

**Files:**
- Reuse `~/.claude/skills/meeting/scripts/transcribe.sh` in `bot/src/zoe/posts/voicememo.ts`
- Add transcription handler + auto-draft path
- Reference: `bot/src/zoe/posts/voicememo.ts` (existing state file)

**Why:** Personal posts are 1 of 4 categories. This unblocks voice-first capture (Zaal's natural mode) without the copy-paste friction.

---

## Cheap Wins (Difficulty ≤3, Value HIGH, Buildable Now)

### Win 1: Post-Draft Link-Inclusion Check

**What:** Every draft asks "any extra links?" before outputting.

**Effort:** 2 hours (bonfire.recall + prompt in 3 files)

**Files:**
- `bot/src/zoe/posts/drafters.ts` - add bonfire.recall() call before return
- `bot/src/zoe/posts/scheduler.ts` - add link-prompt phase in fireOneDraft()
- `~/.claude/skills/socials/SKILL.md` - add recall() mention in Mode 2 section

**Expected impact:** +30 sec per draft, catches ~80% of missing links (POIDH bounties, Lu.ma RSVPs, GitHub repos).

---

### Win 2: Voice Consistency Guard

**What:** Single source of truth for voice rules, imported by all drafters.

**Effort:** 1.5 hours (extract rules, create `bot/src/zoe/voice/index.ts`, wire imports).

**Files:**
- Create `bot/src/zoe/voice/index.ts` - export ZAO_VOICE_RULES
- Update `bot/src/zoe/posts/drafters.ts` - reference rules in prompt
- Update `~/.claude/skills/socials/SKILL.md` - mention voice rules file instead of inline
- Update `/meeting/SKILL.md` - reference voice rules

**Expected impact:** Consistency across all 4 content sources, easier maintenance (one edit = everywhere).

---

### Win 3: Meeting Decision Amplification (Skeleton)

**What:** After meeting recap, offer one-click "share top decisions on Farcaster".

**Effort:** 1 hour (add routing in `/meeting` Phase 5, call existing socials drafter).

**Files:**
- `~/.claude/skills/meeting/SKILL.md` - Phase 5 section, add decision-thread routing (3 lines)
- Create skeleton: `~/.claude/skills/socials/templates/meeting-decision-thread.md` (3-4 cast template)

**Expected impact:** High-signal thought leadership, reuses existing infrastructure (socials skill).

---

## Pipeline State Summary

| Step | Status | Manual? | Automated? | Tool |
|---|---|---|---|---|
| **Capture** | LIVE | Yes | Partial (ZOE 4 categories daily) | ZOE posts scheduler |
| **Draft review** | LIVE | Yes (Zaal reads + copy-pastes keepers) | No | Manual Telegram + Firefly |
| **Multi-platform expand** | ON-DEMAND | Yes (explicit `/socials` call) | Partial (skill generates all 7, clipboard opens) | Socials skill |
| **Platform-specific copy-paste** | LIVE | Yes (6 separate apps) | No | Manual long-press-copy |
| **Newsletter agenda** | LIVE | Yes (hand-curate) | No | Manual + hand-draft |
| **Newsletter publish** | LIVE | Yes (Paragraph UI) | No | Manual |
| **Meeting capture + recap** | LIVE | Partial (skill extracts) | Yes (research doc auto-written) | `/meeting` skill |
| **Meeting decision share** | MANUAL | Yes | No | Manual Telegram |
| **Voice consistency check** | N/A | Yes (per-skill rules) | No | Manual pre-flight |
| **Analytics feedback** | N/A | N/A | No | None (gap) |

---

## Build Order (If Greenlit)

**Phase 1 - This week (Wed 2026-05-22):** Cheap wins only, no unlock gates.
1. Link-inclusion check (2hr)
2. Voice rules consolidation (1.5hr)
3. Decision amplification skeleton (1hr)

**Phase 2 - Post-quality-lock (tentative):** Newsletter semi-automation + Bonfire analytics.
1. Newsletter skill (7hr, depends on bonfire query stability)
2. Newsletter → social post chain (3hr, trigger wiring)
3. Per-platform caption tailoring (6hr, prompt work per platform)

**Phase 3 - Ops layer (future):** Scheduled synthesis, Bonfire webhook, analytics back.

---

## Risk / Constraints

- **Auto-publish gate:** Zaal's explicit constraint (feedback_social_pipeline_priorities_may6). This audit respects it - all wins are pre-publish, not bypassing review.
- **Bonfire API stability:** Newsletter + link-check both depend on bonfire.recall(). If unreachable, newsletter skill must graceful-degrade (per 676c architecture). Socials skill doesn't depend on it (not a blocker).
- **Voice rule drift:** If ZAO voice evolves, must update `bot/src/zoe/voice/index.ts` + re-seed all drafters. One source of truth reduces this burden but doesn't eliminate it.
- **Skills framework:** All automation relies on Hermes pattern (per CLAUDE.md). No raw SDK calls. `/meeting` skill is largest, most stateful - changes here ripple.

---

## Appendix: File Path Reference

### Skills (read-only, reference-only)
- `~/.claude/skills/socials/SKILL.md` - 7-platform post generation
- `~/.claude/skills/clipboard/SKILL.md` - browser copy-paste page UI
- `~/.claude/skills/meeting/SKILL.md` - meeting capture + distribution (5 phases, 350 lines)

### Bot code (build targets)
- `bot/src/zoe/posts/scheduler.ts` - ping cadence + categories
- `bot/src/zoe/posts/drafters.ts` - 4-category post generation (build/ecosystem/event/personal)
- `bot/src/zoe/posts/voicememo.ts` - voice memo capture state
- `bot/src/zoe/posts/sources.ts` - data sources for each category (repo activity, calendar, etc.)
- `bot/src/zoe/posts/README.md` - spec source of truth
- `bot/src/zoe/recall.ts` - bonfire recall integration (read-only reference)
- `bot/src/hermes/` - pattern for agent infrastructure (not directly modified)

### New targets (cheap wins)
- `bot/src/zoe/voice/index.ts` - centralized voice rules (to create)
- `~/.claude/skills/newsletter/SKILL.md` - newsletter skill (to create, 7 phases like `/meeting`)
- `bot/src/zoe/newsletter-agent.ts` - newsletter drafter (to create)
- `bot/src/zoe/posts/link-check.ts` - link-prompt helper (to create, 20 lines)

### Memories / Constraints
- `feedback_social_pipeline_priorities_may6.md` - Zaal's May 6 grill response (no auto-publish until quality locked)
- `feedback_firefly_only.md` - default to single Firefly post, expand only on explicit request
- `feedback_copyable_content_own_bubble.md` - copyable content goes in own Telegram bubble
- `project_zoe_post_slate.md` - ZOE v1 shape (7 pings/day, 4 categories)

### Data paths
- `~/.zao/zoe/posts/schedule.json` - ZOE post cadence state
- `~/.zao/zoe/posts/log.jsonl` - ZOE ping log (for analytics)
- `~/.zao/zoe/voice-memos/YYYY-MM-DD.md` - voice memo transcripts
- `~/.zao/newsletter-drafts/` - newsletter state (to create)
- `~/.zao/clipboard-queue.json` - persistent clipboard queue (future, Win 9)

---

## Related Work

- **Doc 676c (Content Flywheel):** Specifies 4-stage bonfire → hyperblogs → newsletter → community loop. This audit is the "pre-publish consolidation" layer for stage 3.
- **Doc 673 (ZOE ↔ Bonfires):** ZOE recall integration already live. This builds on it.
- **Doc 533 (ZOE Post Slate v1):** Deployed 2026-05-16, 4 categories + 7 pings/day. Link-check + voice-rules are v2 enhancements.
- **Feedback memories (2026-04-29 to 2026-05-16):** All constraints documented and locked.

---

**Status:** Research complete. Ready for Zaal green-light on cheap-win Phase 1. No blocking dependencies.
