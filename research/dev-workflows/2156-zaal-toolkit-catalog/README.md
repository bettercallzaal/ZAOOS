# 2156 - Zaal's Toolkit Catalog (the complete skill + fleet-command reference)

**Date:** 2026-07-30
**Status:** Reference (living). Grounded - read from the actual `~/.claude/skills/*/SKILL.md` manifests + `~/bin` script headers on 2026-07-30, not from memory.
**Owner:** Zaal
**Siblings:** Doc 154 (skills/commands master reference), `zao-help` (the terminal cheat sheet), the cowork "How I Use My Tools" panel (ZAOcowork PR #271), [[project_fleet_command_center]], `.claude/rules/claude-usage.md`.

---

## Why this exists

The toolkit grew to **72 skills** + ~35 fleet commands - past the point Zaal (or an agent) can hold in memory. This is the durable, grounded home for "what do I have and when do I use it," so the reference stops living in throwaway clipboards. The Mission Control panel (PR #271) stays a curated top-20; `zao-help` is the terminal quick-ref; THIS doc is the exhaustive catalog. When a skill is added or a name changes, update here.

**How it was built:** a subagent read every `SKILL.md`/`skill.md` frontmatter + body and each `~/bin` daily-driver's header. Entries below trace to those files. 3 skill dirs had no manifest (noted). This is a point-in-time snapshot; verify a name against disk before depending on it.

## The system view (five loops, not 72 tools)

The tools are not independent - they form five loops that feed each other:

1. **Lane system** (terminals & fleet) - `/spawn`, `/pi`, `zj`, `ztui` - one repo per tmux lane, one task per lane, all visible in one screen.
2. **Capture loop** (second brain) - `todo` -> `capture -> triage -> crush` on the board; `/meeting` + `/ingest` feed it. Capture never means do-it-now.
3. **Build loop** (workshop -> production) - ground (`icm`, `/zao-research`) -> build in Claude Code -> `/qa` -> `/ship` -> `/review` -> PR. Docs auto-merge, code reviewed. Cowork app = production, Claude Code = workshop.
4. **Distribution loop** - `/socials` (starts with ZM) + `/clipboard`, all generated FROM the ICM boxes (upstream truth).
5. **Agent layer** - ZOE orchestrates (`@zaoclaw_bot` + agentmail + `relay`), ZOL on Farcaster, ZAI for community. The identity ladder (docs 2154/2155) extends this.

The cheap-AI stack (OpenRouter/Ollama/Codex) is wired into `/zao-research` + `/autoresearch` so the Claude Max weekly cap is spent on live-code editing, not research (`.claude/rules/claude-usage.md`).

---

## Catalog

### Terminals & Fleet
- **/spawn** (skill) - open a Mac Terminal running Claude Code on a local repo, seeded with a prompt, in tmux (shows in ztui + zj). Bare name -> `~/Documents/<name>`. *(built 2026-07-30)*
- **/pi** (skill) - SSH into the Raspberry Pi (ansuz) over Tailscale, launch Claude Code in persistent tmux for rolling threads.
- **/terminals** (skill) - manage persistent remote tmux on the VPS (zoe) + Pi (ansuz); attach from Mac or phone (Blink).
- **/handoff** (skill) - compress a session into a portable markdown bundle; paste into a new session, resume with zero context loss.
- **/coworkvps** (skill) - SSH shortcut for Iman's Hostinger VPS (ZAOcoworkingBot): status, logs, restart, deploy, env.
- **/quad** (skill) - local QuadWork dashboard, a 4-agent dev squad (Head/Dev/RE1/RE2), single auto-dispatching command; UI at 127.0.0.1:8400.
- **zj** (bin) - jump to a tmux session by name (via the ztui registry).
- **ztui** (bin) - the fleet TUI: all active sessions, bots, PRs, board tasks - one screen to run the fleet.
- **zx** (bin) - run a command across parallel tmux sessions (multicast).
- **zao-fleet** (bin) - global fleet health (bots, sessions, spend). **zao-fleet-push** - deploy to all fleet boxes atomically.

### Capture, Board & Memory
- **/capture** (skill) - capture content-as-source (Reels, YouTube, podcasts, articles); routes to `research/captures/`. Distinct from /meeting (creators, not attendees).
- **/meeting** (skill) - capture a meeting recording/transcript; auto-routes decisions + todos to the tracker, writes a recap, posts to Bonfire + Telegram + clipboard, updates the calendar.
- **/ingest** (skill) - universal source-to-transcript engine (Spotify, YouTube, Apple Podcasts, RSS, local A/V, Craig, Fathom); backbone for /meeting + /zao-research.
- **/clipboard** (skill) - clean copyable browser page; saves to `~/.zao/clipboard/` with browsable history.
- **/identify-speakers-in-recordings** (skill) - map diarized speaker_0/_1 to real names by cross-referencing platform UI (X Spaces, Twitch, Discord).
- **/bonfire** (skill) - post natural-language episodes to the ZABAL Bonfire knowledge graph (recall surface).
- **todo** (bin) - capture a thought to the tracker inbox; shows in cockpit + the triage loop.
- **cockpit** (bin) - one-screen real-time board of open tasks, needs, flags.
- **relay** (bin) - bridge Telegram (ZOE) <-> Claude Code sessions; inbound auto-surfaces, replies post back to TG. (Lost-update bug fixed 2026-07-30, doc note below.)
- **zao-agenda** (bin) - render the standing priority list from the board, numbered so Zaal walks top-to-bottom + replies by number.

### Content & Distribution
- **/socials** (skill) - platform-specific posts (Farcaster, X, Discord, Telegram, LinkedIn, Facebook). Every post starts with ZM.
- **/platform** (skill) - per-platform context loader (voice/audience/goals) for Farcaster, X, Telegram, Discord, LinkedIn, YouTube.
- **/event** (skill) - idea -> full pipeline: format, Google Calendar, Luma invite, announcement draft.
- **/zol** (skill) - drive ZOL (@zolbot, FID 3338501), the Farcaster music-curator agent on the Pi: post, reply, delete, draft, status.
- **/bcz-yapz-description** (skill) - render a BCZ YapZ YouTube description + tags from a transcript, paste-ready.

### Research & Knowledge
- **/zao-research** (skill) - three-tier research (QUICK/STANDARD/DEEP); exa + context7 MCPs, Reddit/HN/X, staleness detection, dual cowork + doc output.
- **/autoresearch** (skill) - Karpathy-style goal-directed autonomous iteration: modify -> verify -> keep/discard -> repeat.
- **/sparkz-research** (skill) - research that ships as a PR, with a fetch-quality gate + publishable-numbers accuracy (Sparkz publishes fees).
- **/bandz-research**, **/bcz-research** (skills) - B&Z / BetterCallZaal research libraries; reuse + standardized findings.
- **/last30days** (skill) - what people ACTUALLY say in the last 30 days (Reddit, X, YouTube, TikTok, HN, Polymarket, GitHub, web).
- **/fetch** (skill) - universal URL fetcher; routes Reddit/X/HN to the right scraper when WebFetch is blocked. **/reddit-fetch** - Reddit via Gemini CLI / JSON fallback.
- **/warpee** (skill) - semantic search + citations over 100s of GM Farcaster episodes (PAID x402, hard cap - explicit approval each query).
- **/graphify** (skill) - any input -> knowledge-graph episode (Bonfire).
- **/cold-outreach** (skill) - research a target, draft a 50-100 word DM in ZAO voice, surface for approval, log to CRM.
- **/fractal** (skill) - ingest fractal-governance resources; dedup, frontmatter, cross-link, fire the tracker.
- **icm** / **zao-icm.py** (bin) - manage ICM boxes (list/get/check/create); registry at `~/.zao/private/icm-registry.json`.
- **zao-crm** (bin) - terminal lookup of the ~950-person Supabase contacts CRM by name/company/category/recent.

### Meetings & People
- **/meeting**, **/identify-speakers-in-recordings**, **/cold-outreach** - see above.
- **/office-hours** (skill) - YC-mode six forcing questions (demand, status quo, specificity, wedge, observation, fit).

### Dev, Ship & Review
- **/qa** (skill) - test a web app + iteratively fix; before/after health scores, atomic commits, re-verify each fix. **/qa-only** - report only, no fixes.
- **/review** (skill) - pre-landing PR review (SQL safety, LLM trust boundaries, conditional side effects).
- **/ship** (skill) - full ship: detect merge base, tests, diff review, bump VERSION + CHANGELOG, commit, push, PR.
- **/investigate** (skill) - systematic debugging (investigate -> analyze -> hypothesize -> implement). Iron law: no fix without root cause.
- **/design**, **/design-consultation**, **/design-review** (skills) - design directions / full design system / visual QA + fixes.
- **/document-release** (skill) - post-ship doc sync (README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md, CHANGELOG, VERSION).
- **/plan-eng-review**, **/plan-design-review**, **/plan-ceo-review** (skills) - plan review from eng / designer / CEO lenses.
- **/retro** (skill) - weekly engineering retrospective (commit history, patterns, metrics, trends).
- **/skill-eval** (skill) - grade the last skill's output against its own SKILL.md; logs to `~/dev/zao-claude-skills/evals/`.
- **/codex** (skill) - OpenAI Codex CLI wrapper: code-review gate, adversarial challenge, consult.
- **/careful**, **/guard**, **/freeze**, **/unfreeze** (skills) - safety: warn before destructive ops / full safety mode / block edits outside a dir / clear the boundary.
- **/humanizer** (skill) - strip 20+ AI-writing tells (em-dashes, rule of three, inflated symbolism, passive voice).
- **/audit-skill** (skill) - audit skills against Anthropic best practices.
- **/expo-ios-app** (skill) - scaffold an Expo/RN iOS app; battle-tested TestFlight-crash pre-flight.
- **/connecting-wallets** (skill) - wallet-connect debugging (injected/EIP-6963, WalletConnect/Reown, Coinbase SDK, Privy, Farcaster Mini App, EIP-191, ERC-1271).
- **/browse** / **/gstack** (skills) - headless browser QA (~100ms/cmd): navigate, interact, verify, diff, screenshot, responsive, forms. **/gstack-upgrade** - update gstack.
- **zao-help** (bin) - the fleet cheat sheet; quick terminal reference to all built tools.

### Agents & Automation
- **/ask-gpt** (skill) - send a prompt to ChatGPT via the codex CLI (ChatGPT-account auth, no API cost); logs Q+A to `~/.zao/gpt-loop/<topic>.log` for multi-turn loops.
- **zao-ask** / **zao-ask-dm** / **zao-ask-check** / **zao-ask-wait** / **zao-ask-bump** / **zao-ask-chain** (bin) - Telegram button-question approval flow (post a question, Zaal taps, choice bridges back); DM variant grills Iman; check/wait/bump/chain manage non-blocking approvals.
- **zao-bots** (bin) - live bot-fleet health (systemd state, uptime, last log), attention-sorted, JSON for the HUD/TUI.

### Utility & Setup
- **/setting-secrets** (skill) - set an env var via a hidden terminal prompt (no echo, no history).
- **/setup-browser-cookies** (skill) - import cookies from a real browser into a headless session for auth testing.
- **/21st** (skill) - search/generate UI components from 21st.dev + Magic MCP, applying the ZAO stack + brand tokens.
- **/find-skills**, **/learned**, **/supabase**, **/supabase-postgres-best-practices** (skills) - *no manifest read (inferred from name): skill discovery / learning log / Supabase helpers.* Verify before relying.

### Creative & Brainstorming
- **/claude-creativity** (skill) - radical-creative-genius mode; intensity 0-1.
- **/drunk-claude** (skill) - unfiltered tipsy-genius ideation; intensity + mood picker.
- **/claude-is-tripping** (skill) - breakthrough engine (3 agents collide + verify); presents an idea menu first.

### Session Start/End
- **/start** (skill) - start a tracked work session (start time, piece, description -> session-state).
- **/end** (skill) - end it: duration -> hours-log CSV (Mac + Vercel), draft the Cameron update, clear state.

---

## Probably forgotten / underused (the reason to keep this doc)

1. **/quad** - a whole local 4-agent dev squad behind one command; easy to forget it exists.
2. **/warpee** - grounded citation-backed search over 100+ GM Farcaster episodes; invisible because it's paid (x402) and gated.
3. **/skill-eval** - self-improving skill loop; only fires on explicit call.
4. **/humanizer** - would improve nearly every draft; under-invoked.
5. **/sparkz-research** - research-that-ships-as-a-PR with a numbers-accuracy gate; distinct from /zao-research.
6. **zao-crm** - fast ~950-contact lookup mid-flow; bin-only so it hides.
7. **/identify-speakers-in-recordings**, **/connecting-wallets**, **/expo-ios-app**, **/fractal** - niche but powerful when their moment comes.

## Counts (as of 2026-07-30)

- Skills: **72** (69 with a manifest, 3-4 without: find-skills, learned, supabase, supabase-postgres-best-practices).
- Fleet bin commands documented: ~35 (zao-* ~20; standalone todo/cockpit/relay/icm/zj/ztui/zx; helper daemons).

## Related fix landed this session

`zao-relay` had a silent lost-update bug (shared jsonb read-modify-write erased another lane's keys - holds vanished twice). Fixed 2026-07-30 (zaal-dotfiles): `mutate_hub()` re-reads fresh + merges + retries. See the zaal-dotfiles commit.

## Source

Subagent read of `~/.claude/skills/*/SKILL.md` + `~/bin` headers, 2026-07-30. Curated top-20 lives in ZAOcowork PR #271 (Mission Control panel); `zao-help` is the terminal quick-ref. Keep all three in sync when a skill changes.
