# Sub-Agent 663e: BOTS + STANDALONE TOOLS Audit

**Audit date:** 2026-05-17 | **Scope:** 9 bettercallzaal repos (7 primary + 2 secondary)

---

## Primary Repos (Active/Production)

### 1. **imanprojects**
- **Purpose:** Iman x Zaal action tracker. Kanban + Six Sigma-flavored team coordination.
- **Type:** Web app (not a bot)
- **Stack:** Next.js 15, React 19, Tailwind v3, GitHub Contents API for persistence (no DB)
- **Auth:** Password-based (3 users: Zaal, Iman, ThyRev)
- **Status - LIVE:** Yes. Deployed to Vercel. Last push 2026-05-14.
- **Deployment:** Vercel (primary) + GitHub sync to `bettercallzaal/imanprojects` (backup). CLAUDE.md tracks dual remote: `cowork-zaodevz` (canonical Vercel) + `origin`.
- **Dependencies:** GitHub API (Contents API for data persistence).
- **Cross-dependencies:** ZAOOS integrations pending (doc 650 Phase 2).
- **Share-readiness:** High. Standalone, no secrets in repo, all stack choices documented.
- **Action:** Healthy. Monitor Phase 2 backlog (Supabase migration, bot API, VPS imanagent, ZAO OS port). Keep Vercel + GitHub remotes in sync.

---

### 2. **fractalbotapril2026**
- **Purpose:** Discord bot for ZAO Fractal democracy governance (weekly meetings, voting, Respect onchain submission).
- **Type:** Discord bot (Python + discord.py)
- **Stack:** Python 3, discord.py, Supabase (optional), Optimism smart contracts
- **Status - LIVE:** Partially. Bot is built + tested (v2.3 as of Apr 13). **Systemd/VPS deployment status unknown.** Vercel.json present (may run on Vercel or VPS).
- **Latest features (v2.3):** Manual member selection, auto-start timer, timer race condition fix, webhook to ZAO OS.
- **Key files:** `main.py`, cogs (commands), web/ (Vercel support), scripts (SQL migrations).
- **Dependencies:** Discord bot token, Supabase, Optimism RPC.
- **Cross-dependencies:** Overlaps with ZAO primary surface (Fractal governance). Webhooks to ZAOOS for event logging.
- **Share-readiness:** Medium. Bot logic solid; infrastructure ties (VPS/systemd) need confirmation.
- **Action:** Confirm deployment: is this running on VPS 1 or Vercel? If VPS, document systemd unit. Compare with March version — April is successor (v2.3 > v2.1).

---

### 3. **fractalbotmarch2026**
- **Purpose:** Discord bot for ZAO Fractal (earlier version).
- **Type:** Discord bot (Python)
- **Stack:** Same as April version.
- **Status - LIVE:** No. Archived version. Last push 2026-03-28. Superseded by April version.
- **Key difference:** v2.1 feature set. No manual member selection, no auto-start timer, no webhook integration.
- **Action:** DELETE (with confirmation). April version (v2.3) is the production successor. No parallel use case evident.

---

### 4. **uvrintrobot**
- **Purpose:** Discord bot for Underground Violet Rave (UVR). Look up Raver intros from channel history.
- **Type:** Discord bot (Python + discord.py)
- **Stack:** Python, discord.py, local JSON cache (uvr_intros.json).
- **Deployment:** Heroku Procfile (worker + web). Last push 2026-04-17.
- **Commands:** `/intro <raver>`, `/admin_refresh_intros`, `/about`.
- **Status - LIVE:** Presumed yes (Heroku active). Minimal infrastructure needs.
- **Dependencies:** Discord bot token, Underground Violet Rave guild access.
- **Cross-dependencies:** None. Standalone community bot (rebranded from ZAO Fractal intro cog).
- **Share-readiness:** High. Portable, no secrets, self-contained.
- **Action:** Healthy. Verify Heroku dyno is active. Low maintenance.

---

### 5. **crownvics**
- **Purpose:** Static website for The Crown Vics (America's Favorite Rock 'n' Roll Dance Band).
- **Type:** Static site (HTML/CSS)
- **Status - LIVE:** Yes. `www.thecrownvics.com`. Last push 2026-04-13.
- **Stack:** Plain HTML/CSS, no framework.
- **Dependencies:** Domain only.
- **Cross-dependencies:** None.
- **Share-readiness:** Complete. Ready for handoff to band.
- **Action:** Complete. Monitor domain + DNS. README TODO items (photos, social links, upcoming shows) are nice-to-haves.

---

## Secondary Repos (Development/Not Live)

### 6. **B-ZBUILD2**
- **Purpose:** Unknown (appears to be a Next.js boilerplate or internal tool).
- **Type:** Web app (Next.js 15)
- **Stack:** Next.js 15, React 19, Tailwind.
- **Status - LIVE:** No. Generic Next.js starter, no purpose doc in README. Last push 2026-03-20.
- **Action:** Clarify purpose or archive. If experimental, move to a `experiments/` org folder or delete if abandoned.

---

### 7. **textsplitter**
- **Purpose:** Unknown (React + Vite boilerplate, no purpose stated).
- **Type:** Frontend tool (React + Vite + Python).
- **Stack:** Vite, React, Python (requirements.txt), ESLint.
- **Status - LIVE:** No. Generic template. Last push (unknown).
- **Action:** Clarify purpose or delete. Appears to be a template clone, not a product.

---

### 8. **ZAOFlights** (Secondary: verify existence)
- **Purpose:** Flight aggregator — conversational search across Google/Kayak/Skyscanner/Expedia with Claude chatbot.
- **Type:** Web app (Next.js 14)
- **Stack:** Next.js 14, Claude API, SerpAPI, RapidAPI, Seats.aero integration.
- **Status - LIVE:** No. MVP development. Last push 2026-03-15. Requires API keys (fallback to mock data if missing).
- **Dependencies:** Anthropic API, SerpAPI, RapidAPI, Seats.aero keys.
- **Cross-dependencies:** None explicit.
- **Share-readiness:** Low. Incomplete (mock fallback suggests unfinished provider integration).
- **Action:** Clarify status. Is this abandoned or paused? If paused, document why. If abandoned, archive.

---

### 9. **bcz-journal** (Secondary: verify existence)
- **Purpose:** Public journal by Zaal Panthaki. Front door to ZAO ecosystem.
- **Type:** Static site / content hub (Markdown + HTML)
- **Status - LIVE:** Yes. Updated 2026-05-14. Long-lived (not a bot).
- **Stack:** Likely GitHub Pages or Vercel static deploy.
- **Cross-dependencies:** Mirrors docs from ZAOOS research/. Links to all 103+ repos at github.com/bettercallzaal.
- **Share-readiness:** Very high. Public by design.
- **Action:** Monitor. Ensure research mirror stays in sync with ZAOOS.

---

## Summary Table

| Repo | Type | Status | Language | Last Push | Primary Surface? | Action |
|------|------|--------|----------|-----------|-----------------|--------|
| imanprojects | Web app | LIVE | TypeScript | 2026-05-14 | No (cowork-zaodevz alias) | Monitor Phase 2. Keep remotes synced. |
| fractalbotapril2026 | Discord bot | LIVE? | Python | 2026-04-14 | YES (ZAO Fractal) | Confirm VPS/Vercel. v2.3 is prod. |
| fractalbotmarch2026 | Discord bot | ARCHIVED | Python | 2026-03-28 | No | DELETE. Superseded by April. |
| uvrintrobot | Discord bot | LIVE | Python | 2026-04-17 | No (UVR community) | Verify Heroku. Healthy. |
| crownvics | Static site | LIVE | HTML | 2026-04-13 | No (external band) | Complete. Monitor domain. |
| B-ZBUILD2 | Web app | ABANDONED? | TypeScript | 2026-03-20 | No | Clarify purpose or delete. |
| textsplitter | React app | ABANDONED? | TypeScript | Unknown | No | Clarify purpose or delete. |
| ZAOFlights | Web app | PAUSED | TypeScript | 2026-03-15 | No | Document status (abandoned vs. paused). |
| bcz-journal | Content hub | LIVE | Markdown | 2026-05-14 | No (external) | Monitor sync with ZAOOS research. |

---

## Fractal Bot Decision: April vs. March

**Recommendation:** DELETE March, keep April.

- **April (v2.3)** = production version. Includes manual member selection, auto-start timer, race condition fixes, webhook to ZAO OS (doc 654 integration).
- **March (v2.1)** = deprecated version. No newer features. Single codebase per feature is ZAO pattern.
- **No parallel use case:** Both target same governance process. No evidence of separate communities/instances.
- **Lineage:** March -> April is linear succession, not fork.

**Action:** Delete `fractalbotmarch2026` repo after confirming April is fully deployed and passing tests.

---

## Open Questions

1. **fractalbotapril2026 deployment:** Where is it running? VPS 1 systemd unit? Vercel? Both?
2. **B-ZBUILD2 + textsplitter:** Why created? Purpose? Active development or cruft?
3. **ZAOFlights:** Abandoned or paused? Should it be revived or sunset?
4. **imanprojects remotes:** Are both `cowork-zaodevz` and `origin` staying in sync? Risk of drift?

---

## References

- ZAOOS CLAUDE.md: "Primary Surfaces" section lists 5 official bots (ZOE, Hermes, ZAO Devz, Bonfire, ZAOstockBot).
- Doc 650 (cowork-zaodevz): imanprojects context + Phase 2 backlog.
- Doc 654 (ZABAL Games + Empire V3): fractal bot webhook integration to ZAOOS.
- research/agents/601: Agent stack cleanup + bot decommissioning rules.

