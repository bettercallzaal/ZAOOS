# 368 - Notion vs. Custom Dashboard for ZAOstock Festival Planning

> **Status:** Research complete
> **Date:** 2026-04-16
> **Goal:** Evaluate whether Notion should replace or complement the existing ZAOstock planning setup (markdown docs + Supabase dashboard)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Primary planning tool** | USE Notion as the team-facing planning hub. Move sponsor tracking, volunteer coordination, timeline, and meeting notes there. |
| **Custom dashboard** | KEEP zaoos.com/stock/team for goals + todos (already built, Supabase-backed, custom auth). Use for standup reporting and task cycling. |
| **Markdown docs** | KEEP for research, specs, and standup recaps (git-tracked, AI-readable). Stop using markdown for active planning that non-technical team members need to edit. |
| **Sync** | SKIP Notion-Supabase sync for now. Manual is fine at 14 people. Automate with n8n or Make later if it becomes a pain. |
| **Notion plan** | USE Free plan initially (up to 10 guests). Upgrade to Plus ($12/user/mo) only if guest limit is hit. |

---

## The Problem Notion Solves

The current setup works for Zaal + Claude Code but creates friction for the rest of the team:

| Current Tool | Works For | Doesn't Work For |
|-------------|-----------|-------------------|
| Markdown (GitHub) | AI processing, version control, research | Non-technical team members editing plans, Candy updating sponsor status |
| Supabase dashboard | Standup todos, goals tracking | Team members browsing planning docs, editing timelines collaboratively |
| Discord | Real-time chat, brainstorming | Organized reference docs, structured tracking |

**The gap:** Team members can't easily find, edit, or contribute to planning docs without going to GitHub or the custom dashboard. Notion fills this gap as a shared workspace anyone can use.

---

## What Goes Where (Recommended Split)

| Content | Tool | Why |
|---------|------|-----|
| **Sponsor pipeline** (contacts, status, follow-ups) | Notion database | Team needs to update status, add notes, track outreach. Database views (Kanban, table) are perfect. |
| **Volunteer roster** (names, roles, shifts, contact info) | Notion database | Need to assign shifts, track confirmations, share contact info. |
| **Timeline / milestones** | Notion timeline view | Visual, drag-to-reschedule, team can see what's coming. |
| **Meeting notes / agendas** | Notion pages | Team can contribute before/during/after meetings. |
| **Budget tracker** | Notion table | Simple table with income/expenses, everyone can see where money is. |
| **Artist wishlist + status** | Notion database | Track outreach, confirmation, travel, rider needs. |
| **Brand kit / design assets** | Notion page with embeds | Central place for logos, colors, fonts, templates. |
| **Weekly standup todos** | zaoos.com/stock/team | Already built, auth'd, status cycling works. Keep it. |
| **Goals board** | zaoos.com/stock/team | Already built, visual progress. Keep it. |
| **Research docs** | GitHub markdown | Git-tracked, AI-readable, 364+ docs. Don't move this. |
| **Standup recaps** | GitHub markdown | Dated files, AI processes transcripts into these. Keep it. |
| **Specs / design docs** | GitHub markdown | Version-controlled, linked to implementation. Keep it. |

---

## Notion Pricing for ZAOstock

| Plan | Price | Guests | Good For |
|------|-------|--------|----------|
| **Free** | $0 | 10 guests | Start here. Zaal owns the workspace, invites up to 10 team members as guests. |
| **Plus** | $12/user/mo | 100 guests | If team grows past 10 or need advanced features. |
| **Business** | $18/user/mo | 250 guests | Overkill for Year 1. |

**Year 1 cost at Free plan:** $0
**Year 1 cost at Plus (if needed):** $12 x 5 core members = $60/month = $360 for 6 months

---

## Comparison: Planning Tools for Small Festival Teams

| Tool | Cost | Collaboration | Non-Technical Friendly | Event-Specific Features | ZAOstock Fit |
|------|------|--------------|----------------------|------------------------|---------------|
| **Notion** | Free-$12/user | Excellent - real-time, comments, mentions | Yes - drag-and-drop, visual | Templates for volunteers, sponsors, budgets | USE - best fit for team collaboration |
| **GitHub Markdown** | Free | Poor for non-devs | No - requires git knowledge | None | KEEP for research + specs only |
| **Supabase Dashboard** | Free (already built) | Good - auth'd, task cycling | Medium - custom UI but limited views | Custom-built for standup workflow | KEEP for todos + goals |
| **Google Sheets** | Free | Good - everyone knows it | Yes | None built-in, flexible | SKIP - Notion does everything Sheets does but better organized |
| **Airtable** | Free-$20/user | Excellent | Yes | Good database views, forms | SKIP - Notion is cheaper and we don't need Airtable's advanced features |
| **Monday.com** | $9/user/mo | Excellent | Yes | Event planning templates | SKIP - paid from day 1, overkill |
| **Trello** | Free | Good | Yes - Kanban native | Limited to boards | SKIP - Notion Kanban does the same thing plus more |

---

## Notion-Supabase Sync (Future)

If you want the Notion sponsor database to sync with the zaoos.com/stock/team dashboard later:

| Platform | How | Cost |
|----------|-----|------|
| **n8n** (self-hosted) | Webhook triggers on Notion changes, write to Supabase | Free (self-hosted) |
| **Make** | Visual workflow builder, Notion ↔ Supabase modules | Free tier (1,000 ops/mo) |
| **Whalesync** | Two-way real-time sync | $49/mo (overkill) |
| **Custom API route** | Notion webhook → /api/stock/sync/route.ts → Supabase | Free (build it yourself) |

**Recommendation for now:** SKIP automation. At 14 people with weekly standups, manual sync is fine. Build automation only when the pain of manual copying is real.

---

## Implementation Plan

### Phase 1: Set up Notion workspace (this week)
1. Create "ZAO Festivals" workspace on Notion Free plan
2. Create databases: Sponsors, Artists, Volunteers, Timeline
3. Move active planning content from markdown to Notion
4. Invite core team (Candy, FailOften, DaNici, DCoop, Shawn)
5. Share link in Discord + standup

### Phase 2: Run both systems (next 2 weeks)
- Notion for collaborative planning (sponsors, volunteers, timeline)
- zaoos.com/stock/team for standup todos and goals
- GitHub for research, specs, recaps
- Evaluate what's working, what's not

### Phase 3: Decide (after 3 standups)
- If Notion works: expand usage, add more databases
- If friction: simplify or go back to all-markdown
- If team grows past 10: upgrade to Plus

---

## ZAO Ecosystem Integration

- Custom dashboard: `src/app/stock/team/` (keep for todos/goals)
- Todos API: `src/app/api/stock/team/todos/route.ts` (keep)
- Goals API: `src/app/api/stock/team/goals/route.ts` (keep)
- Planning docs to migrate: `ZAO-STOCK/planning/outreach.md` → Notion Sponsors DB
- Planning docs to migrate: `ZAO-STOCK/planning/timeline.md` → Notion Timeline
- Keep in markdown: `ZAO-STOCK/standups/`, `ZAO-STOCK/research/`, all specs

---

## Sources

- [Notion Event Planning Templates](https://www.notion.com/templates/category/event-planning)
- [Notion Pricing 2026](https://costbench.com/software/knowledge-management/notion-teams/)
- [Notion Free Plan Details](https://costbench.com/software/knowledge-management/notion-teams/free-plan/)
- [Notion + Supabase Integration via n8n](https://n8n.io/integrations/notion/and/supabase/)
- [Notion + Supabase via Make](https://www.make.com/en/integrations/supabase/notion)
- [Whalesync Notion-Supabase Sync](https://www.whalesync.com/connect/notion-supabase)
- [Best Notion Event Templates - Super.so](https://super.so/templates/notion-event-planner-templates)
