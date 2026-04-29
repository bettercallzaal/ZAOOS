---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 432, 552, 553
tier: STANDARD
---

# 558 - Anbeeld WRITING.md (AI-Prose Diagnostic Toolkit)

> **Goal:** Decide whether to fold Anbeeld's WRITING.md ruleset into ZAO content skills (`/socials`, `/newsletter`, `/onepager`, `/article-writing`). Aim is less "AI-detector evasion," more "writing that fits its medium and reader."

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Fold a curated subset of WRITING.md rules into ZAO content skills | **YES** | 14 rules. Diagnostic, not prescriptive. Fits Zaal's `feedback_brainstorm_before_writing` (already a memory) and the project's "concrete specificity over polished generality" pattern. |
| Adopt the 5-10 required-checks gate before publishing any newsletter / 1-pager / pitch | **YES** | Tightens an already-good cycle. Use as a ZAO-internal pre-publish lint, not a public rule. |
| Mirror the entire 296-line ruleset verbatim into a ZAO skill | **NO** | License unspecified. Lift specific rule patterns and rewrite in Zaal's voice; cite Anbeeld as influence. |
| Treat as anti-AI-detector tool | **NO** | Author explicitly rejects optimising for "sounding human" or beating detectors. Use it for fit-to-medium discipline, not adversarial framing. |

## What WRITING.md Actually Is

Verified 2026-04-29 from `github.com/Anbeeld/WRITING.md`:

| Field | Value |
|---|---|
| Repo | `Anbeeld/WRITING.md` |
| Stars | 123 |
| Forks | 10 |
| Length | 296 lines (208 of "code") |
| License | **None specified** |
| Author identity | Not disclosed in repo |

Document structure (per fetch):

1. Purpose statement (writing fits medium + audience + purpose, not "sound human")
2. Detector limits (does not chase AI-detector scores)
3. Precedence framework (when rules conflict, which wins)
4. Medium routing (chat vs. document vs. long-form)
5. Safety rails
6. **Core rules** (14 rules)
7. Required checks (5-10 depending on length)
8. Optional diagnostics
9. Formula phrases to scrutinise
10. Provenance guidance

## The 14 Core Rules (Synthesised From Fetch)

The fetch summarised: anchor to actual reader needs, match format to medium, prefer concrete specificity over polished generality, plain words with ordinary repetition, avoid performative tone, watch for suspicious regularity in sentence patterns. Specific 14 rules not enumerated in fetched summary - full doc fetch needed for verbatim extraction (avoid hallucination).

**Action:** verbatim 14-rule list extraction is a separate task. For now, rule families above are sufficient to inform ZAO content skill upgrades.

## ZAO Content Skill Audit (Where WRITING.md Could Land)

| Skill | What it does today | Where WRITING.md helps |
|---|---|---|
| `/socials` (global) | Generate platform-specific posts | Add: "concrete specificity over polished generality" check. Force one specific number/name/quote per post. |
| `/newsletter` (project) | Draft "Year of the ZABAL" daily post in Zaal's voice | Add: "watch suspicious regularity" check. Catch parallel-structure overuse common in newsletter sections. |
| `/onepager` (project) | ZAOstock sponsor / partner / venue briefings | Add: "match format to medium" - 1-pager rules differ from email rules. |
| `/article-writing` (ECC plugin) | Articles + guides | Already has structure; add WRITING.md required-checks as the pre-publish gate. |
| `/bcz-yapz-description` | YouTube description renderer | Add: avoid formula phrases ("In this episode," "Today we discuss"). |

## How to Cherry-Pick Without License Risk

License is unspecified upstream. Defensive approach:

1. Read `Anbeeld/WRITING.md` once, manually
2. Pull rule **principles** (idea-level, not verbatim text)
3. Reword in ZAO voice + add ZAO-specific examples
4. Cite Anbeeld in the source list of any ZAO skill that adopts a rule
5. Don't host or redistribute the original text

This is identical to how we treat `superpowers:writing-skills` rules: principle-level adoption.

## Concrete Lift: 5 Rules To Adopt First (Zaal-Voice Restatement)

These are restatements, not quotes. Each maps to an Anbeeld rule family per the fetch.

1. **Reader before audience.** Write for one specific person who will read this. If it's Zaal's newsletter, write for the ZABAL holder who almost-but-didn't-read yesterday's post.
2. **One concrete per paragraph.** Every paragraph should have one number, name, date, or quote. If a paragraph has none, it's smoke.
3. **Plain words, ordinary repetition.** Don't avoid the word you already used. Don't reach for the synonym to look polished.
4. **No performative empathy.** "I get it, building is hard." Cut. The reader knows.
5. **Suspicious regularity is a smell.** If three sentences in a row start the same way, one is wrong.

These five alone should sharpen `/newsletter` + `/socials` + `/onepager` outputs.

## Risks

| Risk | Mitigation |
|---|---|
| License is unspecified - reuse risk | Principle-level lifts only; cite Anbeeld; don't redistribute text |
| Author identity unclear (no biography) | Cite as `Anbeeld (GitHub user)` not as a named expert |
| Doc could change or disappear | Capture key principles in a ZAO-local doc (this one) so we're not dependent |
| Over-applying turns voice mechanical | Use rules as diagnostics on draft, not prescriptions during draft |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Manually read all 14 rules from `Anbeeld/WRITING.md` | Zaal or one-shot session | Reading | This week |
| Update `/newsletter` + `/socials` + `/onepager` skill docs with the 5 rules above | Zaal | Skill PR | This week |
| Add WRITING.md required-checks as a "pre-publish gate" snippet in `~/.claude/skills/article-writing/` (if owned globally) | Zaal | Skill PR | Next sprint |
| Re-validate after first month of skill usage | Zaal | Reflection | 2026-05-29 |

## Also See

- [Doc 432 - The ZAO master positioning (Tricky Buddha)](../../community/432-tricky-buddha-zao-master-context/) - brand voice constraints
- [Doc 552 - ZAO skill library audit](../552-zao-skill-library-audit/)
- Memory `feedback_brainstorm_before_writing` - aligns with WRITING.md's "anchor to actual reader needs"
- Memory `feedback_no_em_dashes`, `feedback_no_emojis` - existing ZAO style rules
- `superpowers:writing-skills` upstream skill - skill-creation rules (different scope)

## Sources

- [Anbeeld/WRITING.md on GitHub](https://github.com/Anbeeld/WRITING.md/blob/main/WRITING.md) - 123 stars, 10 forks, 296 lines, no license stated
- ZAO content skills already on disk (`/newsletter`, `/socials`, `/onepager`, `/bcz-yapz-description`)

## Staleness Notes

Author may add license or update rules. Re-validate by 2026-07-29 or on any major repo update.
