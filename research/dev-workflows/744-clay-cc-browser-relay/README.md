---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-05-25
related-docs: "165, 232, 238, 461, 483, 487, 547, 668, 668a, 668c, 730, 739"
original-query: "https://github.com/chadbyte/clay /zao-research this"
tier: STANDARD
---

# 744 - Clay (chadbyte/clay) - multiplayer Claude Code + Codex browser workspace

> **Goal:** Decide whether to adopt, steal-from, or skip Clay - a self-hosted, browser-based multi-user team workspace for Claude Code and Codex CLIs - given ZAO's existing Hermes (autonomous fix-PR loop), ZOE (concierge), QuadWork (4-agent overnight batch), cowork-zaodevz (action tracker) stack. Originally shared by a r/ClaudeCode commenter (ItsJustManager, 2026-05-25) as "a relay server that blows Claude Code's remote control functions away."

---

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **TEST `npx clay-server` solo on Zaal's MacBook this week.** Single command, MIT, no install, port 2633 default. | Zero commitment. Validates the cross-vendor (CC + Codex in one browser, one toggle) claim on real ZAO repos. If it sticks for personal use it sidesteps split-terminal pain on the laptop. Founder shipped 330 npm versions in ~3 months - active enough to trust. |
| 2 | **SKIP adopting Clay as ZAO infrastructure** (do NOT replace Hermes / ZOE / QuadWork). | CLAUDE.md hard rule: "no new bots without doc + explicit Zaal approval." Clay's collaboration story (multi-human + Mates) maps to ZAO Devz (Iman, Samantha, ThyRev) - but ZAO Devz already runs on Telegram + cowork-zaodevz Supabase tracker (doc 650), not a browser daemon. Forcing a swap = thrashing surfaces that just stabilized. |
| 3 | **STEAL the Mates pattern for ZOE persona blocks.** Each ZAO brand voice (Magnetiq / Research / WaveWarZ / POIDH per doc 668a decommission) becomes a persistent persona with its own `CLAUDE.md` + memory folder under `bot/src/zoe/personas/`, NOT a separate bot. | This is already the ZAO-decided direction (project_hermes_canonical.md - "new brand voices = persona block in `bot/src/zoe/` human.md, NOT a new bot"). Clay's Mates implementation (`~/.clay/mates/<id>/CLAUDE.md + mate.yaml + knowledge/`) is a clean reference for how to file-structure the persona. Issue #242 ("adopting an existing project as a mate") shows their own users want to mount existing project knowledge - same gap ZOE has. |
| 4 | **STEAL the YOKE adapter idea for /codex skill.** Today `/codex` and Claude Code are separate skills with separate session state. Clay's YOKE layer (Claude Agent SDK + Codex app-server JSON-RPC, unified) is the cleanest reference for how to make one ZAO session hot-swap engines mid-task. | Issue #357 ("context transfer: I start work on Claude and run out of tokens, or decide codex might be better at certain part, I want to continue with codex in one click") is exactly the friction Zaal hits. Even if we don't adopt Clay, the YOKE pattern is the right abstraction for a future `/swap-engine` skill or for the `/ask-gpt` flow to push a partial context across. |
| 5 | **INVESTIGATE the PWA + VAPID push pattern for `zoe.zaoos.com`.** Clay ships installable PWA + web-push for approvals from phone. zoe.zaoos.com is currently a passive chat dashboard. | Per project_zoe_dashboard.md, zoe.zaoos.com is the planned hub. Adding "your phone buzzes when an agent needs approval, tap approve, agent keeps going" is a real ZAO need (Hermes' auto-PR pipeline currently asks for nothing - but ZOE concierge often DOES need approvals). web-push is one of Clay's 8 npm deps (low-cost lift). |
| 6 | **SKIP the Stream Deck plugin** (community project `clay-streamdeck-plugin` by egns-ai). | Zaal does not own a Stream Deck. Out of scope. Note for future if hardware changes. |
| 7 | **SKIP Ralph Loop** (Clay's autonomous overnight coding loop). | Already covered by Hermes (doc 461 fix-PR pipeline, live since 2026-04-25) + QuadWork (doc 487, overnight 4-agent batches) + ECC `superpowers:autonomous-loops` + `/loop` skill. Three implementations of the same idea is enough. |
| 8 | **NOTE the `d.clay.studio` DNS-only HTTPS-cert trick.** It resolves to local IPs so the PWA gets a valid TLS cert without exposing the daemon publicly. | Pattern reusable for any ZAO local-first dashboard that needs valid HTTPS for service workers (PWA push won't work over HTTP). Could be borrowed for QuadWork (127.0.0.1:8400) or a future zoe-local dashboard. |

## Comparison: Clay vs ZAO's existing remote-control / multi-agent stack

| Stack | Surface | Multi-user | Multi-vendor (CC+Codex) | Mobile push | Autonomous loop | Persistent AI personas | License | Adopted in ZAO? |
|---|---|---|---|---|---|---|---|---|
| **Clay** | Browser PWA on local daemon (port 2633) | YES (per-user/per-project/per-session perms; Linux OS-isolation via setfacl) | YES (YOKE adapter) | YES (VAPID) | YES (Ralph Loop + cron) | YES (Mates with own CLAUDE.md + memory) | MIT | NO - candidate for personal-laptop test only |
| **QuadWork** (doc 487) | Browser dashboard on 127.0.0.1:8400 | Single-user | YES (Head=Codex, Dev=CC, RE1=Codex, RE2=CC) | NO | YES (15-min pulse, OVERNIGHT-QUEUE.md) | NO (ephemeral roles) | MIT | TESTED personally; not production |
| **Hermes** (doc 461 + `bot/src/hermes/`) | Telegram bot `@zoe_hermes_bot` + autonomous fix-PR pipeline | Single-user (Zaal) | NO (Claude Code only) | YES (Telegram = de-facto push) | YES (coder + critic + auto-PR) | In-house | YES, production since 2026-04-25 |
| **ZOE** (`bot/src/zoe/`) | Telegram bot `@zaoclaw_bot` + concierge | Single-user (Zaal) + group (`/zg`) | NO (Claude Sonnet/Opus via paid key) | YES (Telegram) | NO (event-driven) | YES (4-block Letta memory at `~/.zao/zoe/`, persona blocks in `human.md`) | In-house | YES, production |
| **cowork-zaodevz** (doc 650) | Supabase Kanban + `@ZAOcoworkingBot` | Multi-user (Zaal + Iman + ThyRev + Samantha) | NO | YES (Telegram) | NO (manual task tracking) | In-house | YES, production |
| **`/loop` + `superpowers:autonomous-loops`** | CLI inside any CC session | Single-session | NO | NO | YES | NO | MIT | YES, used ad-hoc |
| **dmux / dmux-workflows** (ECC plugin) | Terminal multiplexer wrapper | Single-user | NO | NO | NO | NO | MIT | Installed via ECC, not actively used |

**The slot Clay would fill that nothing else does:** browser-based, multi-vendor, multi-human, with persistent personas + mobile push + Ralph Loop, all in one daemon. **The reason that slot is empty in ZAO today:** ZAO's coordination is already Telegram-native (ZOE + Hermes + cowork bot + ZAOstock bot), and adding a 6th surface (Clay browser) creates context-switch tax. The existing surfaces collapsed from 12+ to 5 deliberately (per CLAUDE.md "Primary Surfaces (post-doc-601 cleanup)"). Don't re-fragment.

## What Clay actually is (technical)

Self-hosted Node 20+ daemon. One npm package: `clay-server` v2.39.0, 8 runtime dependencies (5.0 MB unpacked), MIT, maintainer Chad Changjoon Lee. 330 published versions since 2026-02-09 (active push cadence: 110/month average). Originally shipped as `claude-relay` (per Show HN 2026-02, 1 point - small launch); rebranded to Clay; npm `bin` aliases still include `claude-relay`.

**Architecture:**

```
Browser (any device) ─WS─> Clay daemon (your machine)
                              │
                              ├─ Auth + RBAC
                              ├─ Project context  ─> YOKE adapter ─┬─> Claude Agent SDK
                              │                                     └─> codex app-server (JSON-RPC stdio)
                              ├─ Built-in MCP servers (ask-user, browser, debate, email)
                              └─ Push (VAPID)
```

**Key dependencies (from `npm view clay-server`):**

| Dependency | Purpose |
|---|---|
| `@anthropic-ai/claude-agent-sdk` ^0.2.132 | Claude Code engine |
| `@openai/codex` ^0.124.0 | Codex engine |
| `@lydell/node-pty` ^1.2.0-beta.3 | Terminal/PTY handling |
| `imapflow` ^1.3.1 + `nodemailer` ^6.10.1 | Built-in email MCP |
| `qrcode-terminal` ^0.12.0 | First-run QR for mobile connect |
| `web-push` ^3.6.7 | VAPID push to PWA |
| `ws` ^8.18.0 | WebSocket transport |

**Storage:** sessions = JSONL, Mates = Markdown, settings = JSON, MCP config = `~/.clay/mcp.json`. No proprietary DB, no cloud relay. Plain text everything.

**OS-level isolation (Linux only):** opt-in. Each Clay user maps to a real Linux UID/GID; file ACLs via `setfacl`; agent processes spawn under the user's account. Mac (Zaal's primary) does not get this guarantee - all sessions run as Zaal.

## Community signal

| Source | Finding | Weight |
|---|---|---|
| **GitHub** | 290 stars, 43 forks, 17 contributors (top non-bot: @akuehner 14, @PancakeZik 13, @leiyangyou 10). 5 open issues, all feature requests not bugs. | Healthy small-OSS curve. Contributor flow = real adoption, not a vanity repo. |
| **GitHub Discussions** | 5 discussions including #59 "How are you using claude-relay?" (founder asking users for feedback), #294 Stream Deck plugin spawned, #355 Windows bug, #356 Claude account integration question. | Founder is engaged + actively asking users. Cross-platform issues exist (Windows). |
| **Top issues (signal of real-user need):** | #213 (cryptiklemur) "First-Class Agent Mode" - user wants to SEE other agents working in panes. #242 "adopt existing project as a mate" - 2 reactions. #357 "context transfer" between CC and Codex mid-session. #358 "one session starts multiple sessions." #360 "add Codex 5.5 model selector." | Real workflow asks from users actually using it. Issues #357 + #358 = exactly the friction Zaal also hits. |
| **HackerNews** | 1 Show HN thread (2026-02): "Claude Relay - Web UI for Claude Code, zero install, push notifications" - 1 point, 1 comment. | Tiny HN launch. Did not catch fire. Growth came from somewhere else (founder's Macbook story per Discussion #59 implies organic word-of-mouth). |
| **Reddit** | r/ClaudeCode comment by ItsJustManager (2026-05-25, 8 upvotes) calling Clay "a relay server that blows Claude Code's remote control functions away" - the spark that triggered this research. No r/ClaudeAI / r/LocalLLaMA / r/selfhosted threads about clay-server [PARTIAL - searched reddit.com/search.json with UA Mozilla, returned zero matches for "clay-server"; small product, no chatter yet]. | The Reddit comment is the high-signal endorsement; the absence of broader Reddit footprint = clay is small-but-mighty, not yet viral. |

## Where it slots in vs the OP r/ClaudeCode thread

The Reddit post that triggered this research was "Pretty sure I'm using maybe 30% of Claude Code - what's your daily workflow?" The comment chain recommended three tiers:

1. **Clay** (this doc) - "blows Claude Code's remote-control functions away" - browser/phone UI for the whole repo dashboard.
2. **Pad** (getpad.dev) - collaborative project management MCP for Claude Code [NOT YET RESEARCHED - candidate for follow-up doc].
3. **superpowers plugin** (obra/superpowers) - already installed via ECC stack (doc 739).
4. **Wispr Flow** - voice dictation - already used by Zaal (referenced in project_zoe_post_slate / dictation patterns).

Clay's pitch within that ecosystem: it's the "browser dashboard" layer. The other tools listed are CLI / VSCode-level. Pad would compete more directly with cowork-zaodevz Kanban. Wispr + superpowers are tool-level, not surface-level.

## Risks + open questions

| Risk | Mitigation |
|---|---|
| **Single-maintainer project.** 290 stars, but @chadbyte = 1,188 of ~1,200 commits. Bus factor = 1. | Test for personal use only. Don't put production ZAO workflows on it until contributor base diversifies OR the repo demonstrates 12+ months of consistent shipping. |
| **No GUI customization for ZAO branding.** Mates / debates / Ralph Loop are baked into the UI. Adapting it to "this is The ZAO's workspace" = forking. | Don't adopt as the team surface. Use it as a personal CC+Codex toggle box only. |
| **Windows-fragile** (per Issue #355). | Not Zaal's stack. ZAO Devz members (Iman = imanagent VPS Linux) would be fine. Not blocking. |
| **Cross-vendor cost routing untested.** README says "share one org-wide API key or let each member bring their own, with costs routing to whoever ran the model." | Claude Max subscription (per `feedback_prefer_claude_max_subscription`) means Zaal isn't billed per-token for CC. For Codex, ChatGPT Plus auth is the path. Clay's per-user billing claim isn't relevant for Zaal's setup. |
| **PWA cert via `d.clay.studio` (DNS-only resolver).** Clever but it's a single domain dependency for HTTPS service worker validity. If chadbyte stops paying for it, PWA features break. | Self-host the DNS pattern (see `clay-dns/` in repo) if going production. For personal test, accept the dependency. |
| **OS-isolation only on Linux.** Mac (Zaal's primary) runs all sessions as Zaal. | Personal-use test = fine. Multi-user team test would need to be on Iman's VPS (Linux). |

## Also See

- [Doc 165 - Claude Code multi-session management](../165-claude-code-multi-session-management/) - prior research on CC concurrency, worktrees, parallel sessions.
- [Doc 461 - Hermes fix-PR pipeline](../../agents/461-hermes-fix-pr-pipeline/) (or closest equiv in agents/) - the autonomous loop Clay's Ralph Loop competes with.
- [Doc 483 - Hermes local LLM framework](../../agents/483-hermes-agent-local-llm-framework/) - hermes architecture rationale.
- [Doc 487 - QuadWork 4-agent dev team](../../agents/487-quadwork-four-agent-dev-team/) - closest existing browser-based multi-agent ZAO experiment.
- [Doc 547 - Multi-agent coordination Bonfire ZOE Hermes](../../agents/547-multi-agent-coordination-bonfire-zoe-hermes/) - existing ZAO orchestration thinking.
- [Doc 668a - Current bot inventory health](../../agents/668-zao-agent-improvement-may-2026/668a-current-bot-inventory-health/) - why Clay won't replace ZOE/Hermes.
- [Doc 668c - Industry best practices 2026](../../agents/668-zao-agent-improvement-may-2026/668c-industry-best-practices-2026/) - benchmark context for Clay.
- [Doc 730 - MCP installation roadmap](../730-...) (per doc 739 reference) - where Clay's MCP fits.
- [Doc 739 - Claude Code efficiency + native MCPs](../739-claude-code-efficiency-native-mcps/) - existing efficiency baseline this doc extends.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| `npx clay-server` on Zaal's MacBook, point at one ZAO repo, drive a real task end-to-end in browser. | @Zaal | Personal test | This week |
| If test sticks: write follow-up doc on cross-vendor toggle UX learnings (CC ↔ Codex friction Clay does/doesn't solve). | @Zaal | Research doc | After test |
| STEAL: prototype ZOE persona-block file structure mirroring Clay's `~/.clay/mates/<id>/{CLAUDE.md, mate.yaml, knowledge/}` for a Magnetiq / WaveWarZ persona under `bot/src/zoe/personas/`. | @Zaal | PR | Within 2 weeks |
| INVESTIGATE: prototype VAPID web-push from a future zoe.zaoos.com daemon - validates the "phone buzzes on approval" pattern for ZOE concierge. | @Zaal | Spike doc | After persona-block PR |
| RESEARCH: getpad.dev (the other Reddit-thread recommendation) - is it a Kanban competitor to cowork-zaodevz or an additive surface? | @Zaal | New doc | Optional, after Clay test |
| WATCH: chadbyte/clay contributor diversification + 12-month shipping cadence. Revisit if bus-factor improves. | @Zaal | Calendar reminder | Q4 2026 |

## Sources

- [chadbyte/clay - README + repo](https://github.com/chadbyte/clay) [FULL - README 13.6KB read in full via `gh api repos/chadbyte/clay/readme`]
- [clay-server on npm](https://www.npmjs.com/package/clay-server) [FULL - metadata via `npm view`: v2.39.0, 8 deps, 5MB, 330 versions, MIT]
- [GitHub repo metadata](https://github.com/chadbyte/clay) [FULL - via `gh repo view`: 290 stars, 43 forks, 17 contributors, created 2026-02-09, last push 2026-05-25]
- [Issue #213 - First Class Agent Mode](https://github.com/chadbyte/clay/issues/213) [FULL - body + comments via `gh api`]
- [Issue #242 - adopting existing project as a mate](https://github.com/chadbyte/clay/issues/242) [FULL]
- [Issue #357 - Context transfer between CC and Codex](https://github.com/chadbyte/clay/issues/357) [FULL]
- [Issue #358 - one session starts multiple sessions](https://github.com/chadbyte/clay/issues/358) [FULL]
- [Issue #360 - add Codex 5.5 selector](https://github.com/chadbyte/clay/issues/360) [FULL]
- [Discussion #59 - How are you using claude-relay?](https://github.com/chadbyte/clay/discussions/59) [PARTIAL - founder OP body fetched; full comment thread fetch failed via the python heredoc (syntax error); comments would add user-deployment color but founder's reply confirming the "spare MacBook + bypass SSH" origin story was retrieved]
- [Discussion #294 - Stream Deck Integration](https://github.com/chadbyte/clay/discussions/294) [PARTIAL - listing only, body not fetched, low priority signal]
- [HackerNews Show HN: Claude Relay (Feb 2026)](https://news.ycombinator.com/item?id=) [FULL - Algolia search returned 1 hit, 1 point 1 comment, founder launch under former name "claude-relay"]
- [Reddit r/ClaudeCode origin comment - ItsJustManager 2026-05-25](https://www.reddit.com/r/ClaudeCode/) [FULL - pasted in original prompt by Zaal]
- [Reddit search "clay-server"](https://www.reddit.com/search.json?q=%22clay-server%22) [PARTIAL - via raw curl + Mozilla UA, returned zero matches; negative-signal evidence that Reddit footprint is minimal beyond the OP thread; could not escalate to last30days-skill within this session's scope]
- [ZAO CLAUDE.md "Primary Surfaces" section](../../../CLAUDE.md) [FULL - in-repo, confirms the 5-surface rule that bounds Decision #2]
- [ZAO research doc 487 - QuadWork](../../agents/487-quadwork-four-agent-dev-team/) [FULL - read in full for comparison-table accuracy]
- [ZAO research doc 739 - CC efficiency + native MCPs](../739-claude-code-efficiency-native-mcps/) [FULL - read for current baseline]
- [ZAO bot/src structure](../../../bot/src/) [FULL - verified hermes/ and zoe/ folders exist; supports comparison table]
