# ZAOstock Hub — AI-Assisted Festival Production

> **Status:** Autoresearch bundle in progress
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME · part of 9th Annual Art of Ellsworth
> **Days out:** 163
> **Team:** 17 active (Zaal lead · Candy 2nd · DCoop music 2nd · 14 contributors · Tyler/Craig/Fellenz advisory)

## What this hub is

One folder that answers "how can we use AI to run ZAOstock end-to-end?" Each dimension of festival production gets a research doc with: tools available today, open-source patterns to borrow, concrete integration with `/stock/team` dashboard, cost estimates, and 170-day timeline hooks.

## Source of truth (other ZAOstock docs)

These are the canonical planning docs. This hub does NOT duplicate them — it cross-references and extends.

| # | Doc | What it covers |
|---|-----|----------------|
| 270 | [ZAOstock Planning](../270-zao-stock-planning/) | Master planning doc: goals, budget, timeline, org structure |
| 274 | [Team Deep Profiles](../274-zao-stock-team-deep-profiles/) | Background on every teammate, scope, strengths |
| 364 | [ZAO Festivals Deep Research](../364-zao-festivals-deep-research/) | How ZAO thinks about events broadly |
| 418 | [Birding Man Festival Analysis](../418-birding-man-festival-analysis/) | Peer festival in NY — what to borrow |
| 425 | [Dashboard UI: Lean + Kanban Patterns](../425-zaostock-dashboard-ui-lean-kanban-patterns/) | Visual management patterns powering `/stock/team` |
| 428 | [Run-of-Show Program](../428-zaostock-run-of-show-program/) | Day-of schedule draft |
| 433 | [Media Capture Pipeline Spec](../433-zao-media-capture-pipeline-spec/) | Photo/video capture plan |
| 472 | [Artist Lockin Timeline](../472-zaostock-artist-lockin-timeline/) | Artist milestones with Sep 3 hard cutoff |
| 473 | [Road to ZAOstock Magnetic Portal](../473-road-to-zaostock-magnetic-portal/) | Weekly drip content plan |
| 476 | [Apr 22 Team Recap](../476-zaostock-apr22-team-recap/) | Internal roster + decisions |
| 477 | [Dashboard Notion-Replacement 170-Day Build](../477-zaostock-dashboard-notion-replacement/) | Phase 1 shipped (attachments, activity, comments, contact log); phases 2-5 mapped |

## AI-assist dimensions (this hub)

20 angles on how to put AI in the loop. Each has its own doc.

| # | Dimension | Status |
|---|-----------|--------|
| 01 | [Sponsor outreach automation](01-sponsor-ai.md) | done |
| 02 | [Artist discovery + outreach](02-artist-ai.md) | done |
| 03 | [Volunteer recruitment + matching](03-volunteer-ai.md) | done |
| 04 | [Run-of-show optimization](04-runofshow-ai.md) | done |
| 05 | [Day-of coordination + incident response](05-dayof-ai.md) | done |
| 06 | [Social media amplification](06-social-ai.md) | done |
| 07 | [Post-event analytics](07-analytics-ai.md) | done |
| 08 | [Budget forecasting + variance tracking](08-budget-ai.md) | done |
| 09 | [Media production assist (photo/video/caption)](09-media-ai.md) | done |
| 10 | [Community building + retention](10-community-ai.md) | done |
| 11 | [Contributor onboarding + task matching](11-onboarding-ai.md) | done |
| 12 | [Meeting facilitation + note-taking](12-meeting-ai.md) | done |
| 13 | [Decision tracking + action item extraction](13-decision-ai.md) | done |
| 14 | [Artist rider + contract intake](14-rider-ai.md) | done |
| 15 | [Sponsor package pricing + competitive analysis](15-pricing-ai.md) | done |
| 16 | [Weather + logistics contingency planning](16-contingency-ai.md) | done |
| 17 | [Content calendar generation](17-content-calendar-ai.md) | done |
| 18 | [Accessibility compliance (captioning, ADA)](18-accessibility-ai.md) | done |
| 19 | [Safety + emergency prep](19-safety-ai.md) | done |
| 20 | [Post-event follow-up + next-year retention](20-followup-ai.md) | done |

Synthesis (single source of truth for Oct 3 success):
- **[170-day-ai-timeline.md](170-day-ai-timeline.md)** — MASTER TIMELINE. Read this to know WHAT to build, WHEN to build it, and WHICH 10 WIRES are critical. 8 phases (Apr-Oct), 163 days, weekly milestones, cost breakdown. Start here.
- [tools-matrix.md](tools-matrix.md) — Master inventory of 50 AI + SaaS tools across all 20 dimensions. Includes PARETO buy list ($200-400 minimum, $1,200-1,400 full stack), free/open-source alternatives, skip list with ROI reasoning, and 6-month spend roadmap. Top 3 must-haves: Clay ($200/mo sponsor enrichment), SignUp.com ($99 volunteer scheduling), Deepgram ($38 meeting transcription). Everything else free or defer to Year 2. Break-even: 4 weeks.
- [zoe-integration.md](zoe-integration.md) — ZOE's ops dispatch role: 5 daily crons + 5 Telegram commands + day-of incident triage. Runs 20 dimensions via Supabase + Claude API + SMS alerts.
- [results.tsv](results.tsv) — iteration log

## How to use this hub

If you're a teammate: pick your dimension, read the doc, see the "This week" action, do it.
If you're Zaal: `tools-matrix.md` is the buy-list; `170-day-ai-timeline.md` is the order of operations.
If you're an AI agent reading this later: `zoe-integration.md` + each dimension's "Integration point" section is your brief.
