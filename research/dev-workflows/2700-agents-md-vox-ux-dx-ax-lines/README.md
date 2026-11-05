---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-22
superseded-by:
related-docs: dev-workflows/2081-ponytail-agent-restraint, dev-workflows/2507-vibe-coded-site-ui-polish, dev-workflows/2649-rules-history
original-query: "Research this: https://x.com/voxyz_ai/status/2113254050170843418 (Zaal idea 8, 2026-10-22, relayed by the seat: two lines Vox asks builders to add to AGENTS.md; check each against ZAOOS rules, AGENTS.md and research for coverage and conflicts, credit the source, open a rules PR only if a line is new and fits)"
tier: QUICK
---

# 2700 - Two AGENTS.md lines from Vox (@voxyz_ai): what ZAOOS already covers

## Key Decisions

| # | Line from the post | Verdict | Where it lands |
|---|---|---|---|
| 1 | "Cut taglines, helper text and secondary labels. If a screen needs them to make sense, fix the layout." | ADOPT, NARROWED. No ZAOOS rule says anything about on-screen copy, so this is new. Taken word for word it conflicts with accessibility and with our own design-review checklist, so it goes in with three exceptions. | One bullet in `.claude/rules/components.md`, in a separate rules PR that waits on Zaal |
| 2 | "Make the best decision that will elevate all three: the user experience (UX), developer experience (DX), and agent experience (AX) always, without breaking anything." | SKIP. "Without breaking anything" is already a binding rule three times over. "Elevate all three, always" cannot be checked, and it pulls against the restraint ladder and the scope rule. | Nothing. This doc records why |

## Line 1: cut taglines, helper text and secondary labels

**Already covered:** nowhere in rules or AGENTS.md. A grep of `origin/main` at `1ff68f45a` (2026-10-22) across every file in `.claude/rules/`, plus `AGENTS.md` and `CLAUDE.md`, for `tagline|helper text|secondary label|microcopy|fix the layout` found no rule. `.claude/rules/components.md` (13 lines) covers `"use client"`, mobile-first, theme colours, `next/dynamic`, Tailwind and the import alias, and nothing about copy. The nearest guidance is advisory, not binding: the vendored gstack design-review checklist, section "8. Content & Microcopy" (`.claude/skills/gstack/design-review/SKILL.md` line 634), and doc `dev-workflows/2507-vibe-coded-site-ui-polish`, which lists microcopy as one audit item.

**Where it conflicts, as worded:**

| Conflict | Source | Why the bare line would break it |
|---|---|---|
| Accessibility | `.claude/rules/code-restraint.md` line 16: "error handling and accessibility stay" | A form `<label>` and an `aria-label` on an icon-only button are labels. `src/` on `origin/main` carries 256 `aria-label` uses across 113 files. An agent told to "cut secondary labels" can strip them. |
| Colour-only encoding | gstack design-review line 582: "No color-only encoding (always add labels, icons, or patterns)" | This tells the reviewer to ADD labels exactly where the post says to cut them. |
| Empty and error states | gstack design-review lines 634 to 642: "Empty states designed with warmth (message + action ...)", "Error messages specific: what happened + why + what to do next" | These are the helper text a layout cannot replace. |
| Brand copy | `community.config.ts` line 16: `tagline: 'Community on Farcaster'` | The tagline is configured on purpose, and changes to that file are "ask first" in AGENTS.md. |

**Fit with mobile-first:** no conflict. A phone screen has the least room for repeated copy, so the line pulls the same way as `components.md`'s mobile-first bullet.

**Narrowed wording, as proposed in the rules PR:**

> Cut taglines, helper text and secondary labels that only restate what the layout already shows; if a screen needs them to make sense, fix the layout. Never cut accessible names (a form `<label>`, an `aria-label` on an icon-only control), error or empty-state messages, or brand copy set in `community.config.ts`. Source: Vox (@voxyz_ai), x.com/voxyz_ai/status/2113254050170843418, 2026-10-22.

## Line 2: elevate UX, DX and AX, without breaking anything

**Already covered:**

| Part of the line | Existing rule |
|---|---|
| "without breaking anything" | `.claude/rules/agent-loops.md` rule 4: "never leave a broken state"; `.claude/rules/loop-evals.md` check A (typecheck, build and tests green) and check B ("Test count after >= before"); `.claude/rules/pre-merge-security-and-suite.md` (full suite before merge) |
| DX, the developer experience | `.claude/rules/code-restraint.md` (the reuse-first ladder) and the CLAUDE.md elegance check |
| AX, the agent experience | AGENTS.md is the agent-facing file itself, and it opens: "Universal agent config for AI coding tools". A grep of `research/`, `.claude/` and AGENTS.md for "agent experience" or "(AX)" returned one hit, in an archived mission statement (`research/_archive/067-paperclip-ai-agent-company`); there is no rule. |

**Where it conflicts:** "the best decision ... always" is aspiration, not a check. `.claude/rules/loop-evals.md` asks for a gate that can fail, and nothing can fail this line. It also invites scope growth: "elevate all three" on every change pulls against `code-restraint.md` ("the minimum that WORKS") and loop-evals check D, scope honesty ("Only what the task named; split out drive-bys"). Adding it would put a third copy of "do not break things" next to two binding ones and make neither stronger.

## Source signal

Fetched raw on 2026-10-22 via the FxTwitter JSON API: posted 2026-10-22 13:00:02 UTC by Vox (@voxyz_ai), 1,696 likes, 68 reposts, 46 replies, 102,532 views. The post gives no evidence or measurement for either line; it is advice, and it was judged here only against ZAOOS's own files.

## Next Actions

| Action | Owner | Type | By when |
|---|---|---|---|
| Review the rules PR that adds the narrowed line 1 to `.claude/rules/components.md` | Zaal | Rules PR (policy, waits on him) | 2026-10-29 |
| If merged, apply line 1 in the next UI pass (the gstack `/design-review` run) rather than in a sweep of existing screens | whichever lane next touches a screen | Practice | next UI PR |
| No action on line 2 | quidli lane | Recorded here | done 2026-10-22 |

## Sources

- [FULL] https://x.com/voxyz_ai/status/2113254050170843418, the post. Method: raw JSON from https://api.fxtwitter.com/voxyz_ai/status/2113254050170843418 (HTTP 200, full text plus counts), not WebFetch.
- [FULL] ZAOOS `origin/main` at `1ff68f45a`, read with `git show` and `git grep`: `.claude/rules/components.md`, `code-restraint.md`, `workflow-discipline.md`, `agent-loops.md`, `loop-evals.md`, `AGENTS.md` (173 lines), `community.config.ts`, `src/` (aria-label count).
- [FULL] Vendored gstack design-review checklist, `.claude/skills/gstack/design-review/SKILL.md` lines 582 and 634 to 642 (https://github.com/garrytan/gstack, MIT).
