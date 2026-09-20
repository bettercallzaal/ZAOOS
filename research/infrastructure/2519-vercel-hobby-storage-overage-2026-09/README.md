---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-09-20
related-docs: infrastructure/543-vercel-fluid-active-cpu-cap-bcz-team, infrastructure/283-vercel-nextjs16-performance-optimization
original-query: "Vercel free-tier resource limits and how to manage/reduce usage across a fleet of ~20+ Next.js projects on one team (Hobby/free tier hit: Functions Storage 25.64GB/10GB, Deployment Storage 12.2GB/10GB, Function Invocations 1.1M/1M, Fluid Active CPU 4h53m/4h). Focus on: what actually causes each metric to grow, what's controllable from code/repo config vs only the Vercel dashboard, deployment retention/pruning settings, whether upgrading off Hobby is the realistic fix, and gotchas specific to a team running many small internal-tool projects on one shared free team."
tier: STANDARD
---

# 2519 — Vercel Hobby Overage on info-75478046s-projects (Sept 2026): a Policy Change, Not Just Growth

> **Goal:** Explain what Functions Storage, Deployment Storage, Function Invocations and Fluid Active CPU actually measure, why all four are over on the `info-75478046s-projects` team right now, and what's actually fixable from code vs the Vercel dashboard vs simply timing.

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|-----------------|-----|
| **Expect deletion to NOT free storage immediately** | DO NOT rely on deleting old deployments as a fast fix | Vercel staff, in a support thread from **today, 2026-09-20**: "You need to wait 30 days to free up the storage till next billing cycle." A second user who manually deleted 75 deployments across two projects on 2026-09-16 still could not get a straight answer from Vercel on whether it had any effect. |
| **Upgrade `info-75478046s-projects` to Pro if actively blocked from deploying** | USE — $20/mo base, Deployment Storage billed at $0.10/GB/month past the Pro allotment | Removes the hard 10GB cap entirely. At an estimated few-GB overage, Pro storage overage cost is single-digit dollars/month — cheap relative to being blocked from shipping during ZAOstock crunch (13 days out) |
| **Dedupe committed static assets in the heaviest repos** | USE — start with ZAOstock: `public/ops/assets/zaostock.mp3` and `ops-room/assets/zaostock.mp3` appear to be the same 3MB file committed in two places | Deployment Storage = "build outputs and static assets stored for your deployments" (Vercel's own definition) — every retained deployment re-stores every committed static asset. A 3MB duplicate costs 3MB × however many deployments Vercel currently protects for that project |
| **Reduce which projects deploy to multiple regions** | INVESTIGATE per-project — Functions Storage is "Vercel Function bundles stored **in each region where Vercel deploys them**" | This is a multiplier most people don't know about: a function bundle deployed to 3 regions costs 3x the Functions Storage of the same bundle in 1 region. Worth an audit of `vercel.json` regions config across the fleet |
| **Don't manually mass-delete deployments expecting quick relief** | SKIP as the primary lever right now | Real, current community reports (both from this week) show Vercel's own storage accounting after deletion is inconsistent/unclear even to Vercel support. The UI's own deletion dialog says untraffic'd deployments "do not count towards any limits," which appears to contradict the Deployment Storage meter still counting their build output — an unresolved discrepancy as of this writing |
| **Function Invocations / Fluid Active CPU fixes** | Reuse Doc 543's guidance | Same underlying Hobby meters (1M invocations/mo, 4 CPU-hrs/mo) as the `bettercallzaals-projects` team Doc 543 already diagnosed in depth — same fixes apply: cron audit, per-route maxDuration review, WAF against crawler traffic |

## What Changed 4 Days Before This Overage Was Noticed

**Vercel's own changelog, dated 16 Sep 2026** (4 days before Zaal's screenshot): "Hobby projects now retain fewer deployments to free up storage."

- Each Hobby project now keeps only its **3 most recent production deployments**, plus its **3 most recent deployments of any type**, regardless of age.
- **Preview deployments no longer get their own protection** — previously they had separate retention.
- Current production deployment is still never deleted; aliased and active-branch deployments are still protected.
- **If a team is already over the 10GB limit, deployments outside those exceptions are now deleted immediately instead of after 30 days.**

This is the load-bearing fact of this doc: the retention policy that determines what counts toward the 10GB cap tightened 4 days before the overage screenshot. **This overage may be partly (or mostly) Vercel surfacing pre-existing bloat that used to be protected, not new usage growth.** Worth checking exact historical usage trend in the dashboard's Usage tab (View > date range) before assuming the fleet suddenly got heavier.

## What Each Metric Actually Measures (verified 2026-09-20, vercel.com/docs/limits/usage)

| Metric | Official definition | Hobby limit |
|--------|---------------------|--------------|
| **Deployment Storage** | "Build outputs and static assets stored for your deployments" | 10 GB (Pro: billed $0.10/GB/mo past allotment) |
| **Functions Storage** | "Vercel Function bundles stored **in each region** where Vercel deploys them" | 10 GB (same cap type; multiplies per deployed region) |
| **Function Invocations** | Total function calls across the team | 1M/mo (Doc 543, still current) |
| **Fluid Active CPU** | Active compute time only — I/O wait (DB queries, API calls, streaming) excluded | 4 CPU-hrs/mo (Doc 543, still current) |

The first two are storage-of-artifacts metrics, not runtime metrics — they grow with **how much you keep**, not how much traffic you get. The second two are runtime/usage metrics that grow with **how much gets called**. This matters for diagnosis: storage overage is a repo/retention problem, invocation overage is a traffic/polling problem, and they need different fixes.

## Real-World Evidence (current, verified 2026-09-20)

Two Vercel Community threads, both from this week, both on Hobby:

1. **"Hobby Deployment Storage near 10 GB: accounting after deleting 75 deployments"** (2026-09-16, community.vercel.com/t/.../49305) — a user manually deleted 75 deployments across two projects, watched the total briefly show 0 B then recover, and could not get Vercel's own support assistant to give a consistent answer on whether the 30-day floor applies from deployment creation or from deletion. Documented four specific unanswered questions to Vercel staff.
2. **"Hobby — Functions Storage stays at 9.62 GB / 10 GB after deleting 71 of 73 deployments"** (2026-09-19/20, community.vercel.com/t/.../49443) — same shape, different project. Vercel staff's own reply: **"You need to wait 30 days to free up the storage till next billing cycle."**

Both are FULL fetches (exa web_fetch, read the real thread content, not a search snippet).

## What's Controllable From Code vs Only the Dashboard

| Lever | Where | Speed |
|-------|-------|-------|
| Remove duplicate/oversized committed assets (images, zips, mp3s) | Code (PR) | Slow — affects only NEW deployments; existing protected ones still count until they age out or the billing cycle turns |
| Reduce `vercel.json` region count per project | Code (PR) | Slow, same reason |
| Cron frequency / route `maxDuration` (Fluid CPU driver, per Doc 543) | Code (PR) | Slow, same reason |
| Deployment Retention exceptions / what counts as "protected" | Dashboard only (Vercel's own policy, not configurable per-team beyond upgrading) | N/A — Vercel controls this |
| Upgrading to Pro (removes hard cap) | Dashboard/billing | **Immediate** — the only lever that unblocks deploys today |
| Manually deleting old deployments | Dashboard | **Unreliable right now** — per both community threads, may not free metered storage until next billing cycle |

## Also See

- [Doc 543 — Vercel Fluid Active CPU Cap on bettercallzaals-projects](../543-vercel-fluid-active-cpu-cap-bcz-team/) — same Hobby CPU/invocation mechanics, different team; this doc's Fluid CPU and Invocation numbers are reused here rather than re-verified
- Tracker `inbox:handoff-diagnostic-vercel-costs` (due 2026-08-23, "Vercel overage fixed+verified PRs 3147/90") — a prior overage incident, appears to be a different team/moment; not verified against this one

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Check Usage tab date-range history on `info-75478046s-projects` to confirm this is the Sept 16 policy surfacing old bloat vs real growth | @Zaal | Vercel dashboard | 2026-09-21 |
| Decide: upgrade `info-75478046s-projects` to Pro, or wait out the billing cycle | @Zaal | Vercel billing | 2026-09-21 |
| PR: dedupe `public/ops/assets/zaostock.mp3` / `ops-room/assets/zaostock.mp3` in ZAODEVZ/ZAOstock | Claude | PR | 2026-09-22 |
| Audit `vercel.json` region config across the info-75478046s-projects fleet for multi-region Functions Storage multiplier | Claude | Research/audit | 2026-09-25 |
| Re-validate this doc once Zaal reports the Usage-tab history | Claude | Update `last-validated` | 2026-09-27 |

## Sources

1. [Vercel Docs: Usage Limits](https://vercel.com/docs/limits/usage) — official metric definitions, verified 2026-09-20 [FULL, method: curl]
2. [Vercel Changelog: Hobby projects now retain fewer deployments to free up storage](https://vercel.com/changelog/hobby-projects-now-retain-fewer-deployments-to-free-up-storage) — 16 Sep 2026, [FULL, method: curl]
3. [Vercel Community: Hobby Deployment Storage near 10 GB, accounting after deleting 75 deployments](https://community.vercel.com/t/hobby-deployment-storage-near-10-gb-accounting-after-deleting-75-deployments/49305) — 16 Sep 2026 [FULL, method: exa web_fetch]
4. [Vercel Community: Hobby Functions Storage stays at 9.62GB/10GB after deleting 71 of 73 deployments](https://community.vercel.com/t/hobby-functions-storage-stays-at-9-62-gb-10-gb-after-deleting-71-of-73-deployments/49443) — 19-20 Sep 2026, Vercel staff reply [FULL, method: exa web_fetch]
5. [Doc 543 — Vercel Fluid Active CPU Cap on bettercallzaals-projects](../543-vercel-fluid-active-cpu-cap-bcz-team/) — reused for Function Invocations / Fluid Active CPU Hobby limits (unchanged by the Sept 16 policy update, which only touched storage retention)
