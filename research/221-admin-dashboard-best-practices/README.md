# 221 — Admin Dashboard Best Practices for Web3 Community Apps

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Identify missing admin features for ZAO OS by benchmarking against Guild.xyz, Coordinape, Collab.Land, Hats Protocol, Discourse, and Farcaster clients

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Activity timeline** | BUILD an admin activity feed surfacing `security_audit_log` — the table exists (`src/lib/db/audit-log.ts`) but has no UI; 2-day effort |
| **Member lifecycle tracking** | BUILD a "member journey" view showing signup > first login > first cast > first fractal > respect earned — query existing `users` + `respect_ledger` tables; 3-day effort |
| **Churn/retention alerts** | BUILD a "dormant members" alert: members who haven't logged in for 30+ days, with one-click re-engagement cast via Neynar; 2-day effort |
| **Onboarding funnel** | BUILD a conversion funnel: allowlist > wallet connected > FID linked > first post > first fractal — all data already in Supabase; 1-day effort |
| **Bulk actions** | ADD bulk role assignment, bulk ZID assignment, bulk deactivation — `UsersTable` currently only supports single-user operations; 2-day effort |
| **Export/reporting** | ADD CSV/JSON export for member directory, respect leaderboard, and engagement data; 0.5-day effort |
| **Scheduled health checks** | ADD a Supabase cron (pg_cron) that runs `member-health` checks weekly and stores snapshots for trend tracking; 1-day effort |
| **Role/permission matrix** | SKIP Hats Protocol integration — overkill for 188 members with 3 roles (beta/member/admin); revisit at 500+ members |
| **Coordinape-style GIVE circles** | SKIP for now — ZAO's fractal process already handles peer-to-peer respect allocation weekly |
| **Guild.xyz gating engine** | SKIP — ZAO already has allowlist + NFT gating in `src/lib/gates/`; Guild adds complexity without value at this scale |

## What ZAO OS Admin Already Has (Baseline Audit)

ZAO OS has a surprisingly complete admin panel across 9 tabs in `src/app/(auth)/admin/AdminPanel.tsx`:

| Tab | Component | What It Does |
|-----|-----------|-------------|
| Users | `UsersTable` | Full CRUD, search, role filter, add by wallet/FID/@username, edit modal, deactivate, assign ZID |
| ZIDs | `ZidManager` | ZID assignment and management |
| Allowlist | `AllowlistTable` | CSV-imported allowlist with search |
| Import | `CsvUpload` | Airtable CSV import |
| Moderation | `ModerationQueue` | AI-flagged content with Perspective API scores (toxicity, identity attack, threat) |
| Respect | `RespectOverview` | Leaderboard with fractal/OG/ZOR breakdown, search, stats cards |
| Polls | `PollConfigEditor` | Snapshot poll template configuration |
| Discord | `DiscordLinkManager` | Discord ID linking with bulk preview |
| Engagement | `EngagementOverview` | Cross-platform post metrics (views, likes, reposts) |

Plus a dedicated **Member CRM** at `/admin/members` with 3 sub-tabs: directory (search/filter/sort), data health (auto-fix buttons for 7 actions), and missing FIDs management.

**Audit log infrastructure exists** (`src/lib/db/audit-log.ts`) writing to `security_audit_log` table, but has no admin UI to view entries.

## Comparison: ZAO OS vs. Comparable Tools

| Feature | ZAO OS | Guild.xyz | Coordinape | Collab.Land | Discourse | Herocast |
|---------|--------|-----------|------------|-------------|-----------|----------|
| Member directory + search | YES | YES | YES (circles) | NO (bot-only) | YES | NO |
| Role management | YES (3 roles) | YES (100+ integrations) | YES (circle admin) | YES (TGR-based) | YES (trust levels) | NO |
| Data health/auto-fix | YES (7 actions) | NO | NO | YES (resolve discrepancies) | NO | NO |
| AI moderation | YES (Perspective API) | NO | NO | NO | YES (Akismet + community flags) | NO |
| Engagement analytics | YES (cross-platform) | Planned 2026 | NO | NO | YES (built-in reports) | YES (post analytics) |
| Respect/reputation | YES (fractal + on-chain) | NO | YES (GIVE/GET tokens) | NO | YES (trust levels, auto) | NO |
| Activity audit log | PARTIAL (writes, no UI) | NO | NO | YES (bot config) | YES (staff action logs) | NO |
| Member lifecycle/funnel | NO | YES (dynamic rules) | NO | NO | YES (trust level progression) | NO |
| Churn/retention alerts | NO | NO | NO | NO | YES (inactive user emails) | NO |
| Bulk operations | NO | YES | YES (epoch-based) | YES (background checks) | YES (bulk invite, suspend) | NO |
| CSV/data export | NO | NO | YES (allocation export) | NO | YES (user export) | NO |
| Scheduled health checks | NO | YES (dynamic verification) | YES (epoch scheduling) | YES (background balance checks) | YES (daily digest) | NO |
| Onboarding funnel | NO | YES (step-by-step requirements) | NO | NO | YES (trust level 0 > 1 tracking) | NO |
| Team/multi-admin | YES (admin role) | YES | YES (circle admin) | YES | YES (staff groups) | YES (team accounts) |

## 8 Missing Features with Implementation Plans

### 1. Audit Log Viewer (Priority: HIGH, Effort: 2 days)

**What:** A tab in AdminPanel showing admin actions from `security_audit_log` — who did what, when, to whom.

**Why:** Guild.xyz, Discourse, and Collab.Land all surface admin activity. ZAO already writes audit logs (`src/lib/db/audit-log.ts`) but admins cannot view them. With 3 admins, accountability is essential.

**Implementation:**
- New API route: `src/app/api/admin/audit-log/route.ts` — paginated query on `security_audit_log`, filter by actor/action/date
- New component: `src/components/admin/AuditLogViewer.tsx` — timeline view with avatar, action description, timestamp, target
- Add as 10th tab in `AdminPanel.tsx`
- Query: `SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 50 OFFSET ?`

### 2. Member Lifecycle / Onboarding Funnel (Priority: HIGH, Effort: 3 days)

**What:** Visual funnel showing conversion through stages: Allowlisted (188) > Wallet Connected > FID Linked > First Cast > First Fractal > Respect Earned.

**Why:** Discourse's trust level distribution dashboard is the gold standard — it shows exactly where members stall. ZAO has all the data but no visualization. At 188 members, knowing that 40 never linked a FID (from the Missing FIDs tab) is useful but not actionable without seeing the full funnel.

**Implementation:**
- New API route: `src/app/api/admin/funnel/route.ts` — aggregate counts per stage from `users`, `allowlist`, `casts` (or webhook log), `respect_ledger`
- New component: `src/components/admin/OnboardingFunnel.tsx` — horizontal bar funnel chart (no charting library needed, use Tailwind width percentages)
- Add to the existing "Data Health" section in Member CRM or as a card on the main admin dashboard

### 3. Churn / Dormant Member Alerts (Priority: HIGH, Effort: 2 days)

**What:** Surface members who haven't logged in for 14/30/60/90 days, with one-click actions: send a Farcaster DM, send a notification, or mark as "inactive review."

**Why:** Discourse auto-emails inactive users. Formo's research shows DAO communities with re-engagement flows achieve 80% retention vs. 40% without. ZAO already tracks `last_login_at` and `last_active_at` in the users table — just needs a UI.

**Implementation:**
- New API route: `src/app/api/admin/dormant/route.ts` — query `users WHERE last_login_at < NOW() - INTERVAL '30 days' AND is_active = true`
- New component: `src/components/admin/DormantMembers.tsx` — list with days-since-active badge, re-engage button (calls Neynar cast API)
- Add to Data Health tab or as a red alert badge on the Users tab

### 4. Bulk Operations (Priority: MEDIUM, Effort: 2 days)

**What:** Multi-select checkbox on UsersTable + AllowlistTable with bulk actions: assign role, assign ZID, deactivate, export selected.

**Why:** Every comparable tool (Guild.xyz, Discourse, Coordinape) supports bulk operations. With 188 members, single-user editing is tedious for batch operations like "upgrade all beta users with FIDs to member role."

**Implementation:**
- Add checkbox column to `src/components/admin/UsersTable.tsx` with "select all" header
- New bulk action bar (appears when 1+ selected): role dropdown, "Assign ZIDs", "Deactivate", "Export CSV"
- API: extend `src/app/api/admin/users/route.ts` PATCH to accept `ids: string[]` for batch updates

### 5. CSV/JSON Export (Priority: MEDIUM, Effort: 0.5 days)

**What:** Export buttons on member directory, respect leaderboard, and engagement overview.

**Why:** Coordinape and Discourse both offer data export. ZAO admins need this for fractal planning, external reporting, and Airtable sync (reverse direction).

**Implementation:**
- Utility function: `src/lib/utils/export.ts` — `downloadCSV(rows, filename)` and `downloadJSON(data, filename)`
- Add export button to `RespectOverview`, `EngagementOverview`, and `UsersTable` headers
- Client-side only — no API needed, just format the already-fetched data

### 6. Scheduled Health Check Snapshots (Priority: MEDIUM, Effort: 1 day)

**What:** Store weekly health stats (total users, respect holders, unlinked, dormant count) in a `health_snapshots` table. Show trend sparklines on the admin dashboard.

**Why:** Collab.Land runs background balance checks. Discourse generates daily digests. ZAO's health check runs on-demand only — no way to see if data health is improving or degrading over time.

**Implementation:**
- New table: `health_snapshots (id, stats JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`
- Supabase pg_cron: `SELECT cron.schedule('weekly-health', '0 9 * * 1', $$ INSERT INTO health_snapshots (stats) SELECT row_to_json(t) FROM (SELECT count(*) as total_users, ... FROM users) t $$);`
- Add sparkline to `MemberCRMPage` stats cards using a 52-point SVG polyline (no charting library)

### 7. Quick Stats Home Card (Priority: LOW, Effort: 1 day)

**What:** Replace the current admin landing (which goes straight to Users tab) with a summary dashboard card showing: members this week, active today, posts published, respect distributed, open moderation flags.

**Why:** Discourse's admin dashboard opens with health metrics, not a user table. Guild.xyz opens with community overview. The "glanceable pulse" pattern is standard in 2026.

**Implementation:**
- New component: `src/components/admin/AdminHome.tsx` — 5-6 stat cards + mini funnel + recent audit log entries
- Add as default `home` tab in `AdminPanel.tsx` (shift users to second position)
- Aggregate data from existing APIs: `/api/admin/member-health`, `/api/respect/leaderboard`, `/api/admin/audit-log`

### 8. Notification Broadcast (Priority: LOW, Effort: 2 days)

**What:** Send a Farcaster cast or in-app notification to all members, a role group, or a custom selection from the admin panel.

**Why:** Herocast supports team broadcasting. Discourse has bulk messaging. ZAO's notification system exists (`src/app/api/notifications/send/route.ts`) but has no admin UI for broadcasting to segments.

**Implementation:**
- New component: `src/components/admin/BroadcastCompose.tsx` — text input, audience selector (all/role/custom), preview, send
- Extend `src/app/api/notifications/send/route.ts` to accept `audience: 'all' | 'role:member' | 'fids:123,456'`
- Use existing Neynar integration for Farcaster delivery

## Prioritized Roadmap

| Phase | Features | Total Effort | Impact |
|-------|----------|-------------|--------|
| **Week 1** | Audit log viewer + onboarding funnel + CSV export | 5.5 days | Admin visibility from zero to full |
| **Week 2** | Dormant member alerts + bulk operations | 4 days | Operational efficiency, retention |
| **Week 3** | Health snapshots + quick stats home | 2 days | Trend tracking, glanceable pulse |
| **Week 4** | Notification broadcast | 2 days | Direct member engagement |

**Total: ~13.5 days of effort for all 8 features.**

## What NOT to Build (and Why)

| Feature | Why Skip |
|---------|----------|
| **Hats Protocol integration** | 188 members, 3 roles — Hats adds ERC-1155 on-chain complexity for a problem that `role: 'beta' \| 'member' \| 'admin'` already solves. Revisit at 500+ members or when role delegation is needed. |
| **Guild.xyz integration** | Guild's value is cross-platform gating at scale (100+ integrations). ZAO's allowlist + NFT gate in `src/lib/gates/` covers the single-community use case. |
| **Coordinape GIVE circles** | ZAO's weekly fractal process (90+ weeks running) already distributes respect peer-to-peer. Adding GIVE would create a parallel, confusing system. |
| **Full analytics platform** | Tools like Helika or Formo are designed for 10K+ user projects. At 188 members, Supabase queries + simple Tailwind charts are sufficient. |
| **Token-gated role automation** | Collab.Land's background balance checks make sense for Discord bots checking NFT holdings. ZAO's auth flow already checks wallet + allowlist on login. |

## ZAO OS Integration

All new features integrate with existing infrastructure:

- **Audit log data**: Already written to `security_audit_log` via `src/lib/db/audit-log.ts` — just needs a read API and UI
- **Member data**: `src/app/api/admin/member-health/route.ts` already computes health stats — extend for funnel and snapshots
- **User table**: `src/components/admin/UsersTable.tsx` (743 lines) needs checkbox column for bulk ops
- **Admin panel**: `src/app/(auth)/admin/AdminPanel.tsx` tab system is extensible — add new tabs with `next/dynamic` lazy loading
- **Notifications**: `src/app/api/notifications/send/route.ts` exists — extend for broadcast audience targeting
- **Neynar**: `src/lib/farcaster/neynar.ts` client ready for re-engagement casts
- **Export**: No external dependency — client-side CSV generation from already-fetched React Query data
- **Health snapshots**: Supabase pg_cron (free tier includes 1 cron job) or Vercel cron at `/api/cron/health-snapshot`

## Reference Implementations

| Project | License | Key Pattern | Relevance |
|---------|---------|-------------|-----------|
| Discourse | GPL-2.0 | Admin dashboard with 30+ report types, trust level distribution, staff action logs | Gold standard for community health dashboards — ZAO should copy the "pulse at a glance" pattern |
| Herocast | AGPL-3.0 | Multi-account management, post analytics, team delegation | Shows how Farcaster clients handle admin — focused on casting, not community management |
| Coordinape | GPL-3.0 | Circle admin, epoch scheduling, GIVE allocation export | Peer-to-peer allocation UI — ZAO's fractal process is the equivalent |
| Collab.Land | Proprietary | Command Center TGR management, background balance checks, role discrepancy resolution | "Resolve" button pattern for fixing role mismatches — ZAO's auto-fix buttons are better |
| Guild.xyz | MIT | Dynamic role assignment, 100+ platform integrations, portable memberships | Over-engineered for 188 members but shows where gating UX is headed |

## Sources

- [Guild.xyz — Community Management Platform](https://guild.xyz/)
- [Coordinape Docs — Admin Features](https://docs.coordinape.com/get-started/admin)
- [Collab.Land — Command Center Documentation](https://docs.collab.land/help-docs/key-features/command-center/)
- [Hats Protocol — Onchain Roles](https://docs.hatsprotocol.xyz/)
- [Discourse Admin Dashboard Report Reference](https://meta.discourse.org/t/admin-dashboard-report-reference-guide/240233)
- [Discourse Trust Levels](https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/)
- [Herocast — Power User Farcaster Client](https://github.com/hero-org/herocast)
- [Formo — Web3 Community Analytics & Retention](https://formo.so/blog/what-is-web3-user-analytics-benefits-metrics-and-tools)
- [OptimizeDAO — DAO Digital Vitals Scoreboard](https://optimizedao.xyz/leaderboard/)
- [Tracking Community Health Metrics Guide](https://www.automateed.com/tracking-community-health-metrics)
