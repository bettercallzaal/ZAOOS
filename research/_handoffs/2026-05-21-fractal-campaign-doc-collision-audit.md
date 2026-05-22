# Handoff - Fractal Campaign + Doc-Number Collision Audit

**Date:** 2026-05-21 (merge wave 2026-05-22 UTC)
**Session:** fractal research campaign + open-PR / doc-number audit

---

## State

A large merge wave landed overnight 2026-05-22 UTC: PRs #599, #600, #601, #602, #603, #604, #597 all merged within ~70 seconds. Open PRs across bettercallzaal + ZAODEVZ dropped from 28 to 3, plus the new #605.

The fractal research campaign (PR #599) shipped: 15 fractal docs re-researched to v2 standard plus new docs for the lineage, current state, Eden Creators, and an external ChatGPT deep-research synthesis. Festival names were normalized to ZAO-PALOOZA / ZAO-CHELLA (PR #604).

---

## 1. Doc-number collisions (audit finding)

The merge wave merged multiple parallel sessions at once, each of which had grabbed overlapping research-doc numbers. On `main` right now:

- **695** - used 3x: `events/695-zabal-games-context-prompt`, `governance/695-crypto-factor-avax-governance-decision`, `music/695-juke-integration-zao`
- **696** - used 2x: `community/696-zaal-zao-deep-audit` and `governance/696-respect-fractal-lineage-summary`
- **698-701** - used 2x each: `research/agents/` (agent stack re-audit, State of Agentic 2026, agent harness) and `research/governance/` (the fractal campaign docs)

**Fix in flight:** PR #605 renumbers the fractal campaign docs 698-701 -> 702-705 (the agent-research docs keep 698-701, since they are referenced by those numbers in the agent handoff). Merge #605 to clear the 698-701 collision.

**Still unresolved after #605:**

- The **695 three-way collision** needs 2 of the 3 docs renumbered.
- `governance/696-respect-fractal-lineage-summary` is the OLD fractal lineage doc carried by PR #597. It was recommended for CLOSE (superseded by the DEEP doc 702), but #597 was merged anyway. It now both duplicates doc 702 and collides with `community/696-zaal-zao-deep-audit`. Recommended action: delete `governance/696-respect-fractal-lineage-summary`.
- The research library needs one numbering-reconciliation pass to guarantee unique doc numbers.

---

## 2. Paperclip decision

- Chosen: option (b) - one ZOE harness that switches between per-project scopes. NOT a fleet of ~25 bots.
- **Open question (unresolved):** does "Paperclip" the software even need to exist? Per-project todos already live in cowork-zaodevz; per-project memory already lives in Bonfire. Likely conclusion: Paperclip is redundant - kill the dead crash-looping service, do not reinstall it. Resolve this before any Paperclip work.

---

## 3. P0 todos (from the agent-stack re-audit, doc 698-agents)

- Kill the Paperclip crash loop - 107,478 restarts on VPS 1.
- Fix cowork-zaodevz's 6 real bugs - blocks the ZAOcoworkingBot rollout.
- Decommission the dead ZAO Devz zombie systemd unit.
- Fix 4 Vercel crons returning 401.

---

## 4. Agent upgrades (docs 699 / 701-agents)

- Lock Bonfire as the persistent memory layer.
- Get ZAOcoworkingBot off root - security P0, needs Iman.
- Stand up Langfuse + PromptFoo evaluation (~$12-15/mo, OSS).
- Add multi-model routing to Hermes (~70% cost cut).
- Instrument Hermes with 4 harness metrics: token efficiency, retry depth, Critic accuracy, PR keep-rate.

---

## 5. Fractal campaign - loose ends

- **Eden Fractal schedule conflict:** `edencreators.com/events` says Wednesdays 16:00 UTC weekly; `edenfractal.com/respectgame` says biweekly Thursdays 17:00 UTC. Confirm the real cadence with Dan SingJoy or Tadas. Flagged in doc 704 (Eden Creators).
- **Fold-ins flagged in doc 705:** add the Fractally white paper's original round-one payout curve (21/13/8/5/3/2) to docs 058 and 702; standardize rank-label language across fractal docs to "highest-to-lowest payout order".
- **zao-research skill:** add a parent multi-agent reconciliation step. The campaign proved that parallel research subagents produce cross-doc contradictions (bot version, orclient version, Eden season number) that need a verify-against-ground-truth pass before docs ship.
- **Cagendas / Vlalendas** agenda games (doc 704) - evaluate for ZAO Fractal topic prioritization.

---

## 6. Infra / cleanup

- A stray local commit `6d5eaac6` sits on the local `main` ref in the repo root - run `git reset --hard origin/main` in the repo root to clear it (unpushed, harmless).
- Several git worktrees from these sessions live under `~/Documents/worktrees/` (research-fractal-campaign, brand-fix-palooza-chella, fractal-renumber-collision-fix, plus older ones). Clean up with `git worktree remove` after the PRs merge.

---

## 7. Open PRs

- **#605** - fix(docs): renumber fractal docs 698-701 -> 702-705. Merge to clear the collision.
- **#593** - re-research campaign: genuine live re-fetch of all 646 research docs. Needs review.
- **ww #1** and **zaaltimelinev1 #1** - React Server Components CVE fixes, DRAFT, months stale (Dec 2025 / Feb 2026). Merge or close.

---

## Immediate next 3

1. Merge PR #605 - clears the 698-701 collision.
2. Resolve the 695 three-way collision and delete `governance/696-respect-fractal-lineage-summary`.
3. Decide Paperclip - almost certainly "kill it, do not reinstall" - then knock out the 4 P0s.
