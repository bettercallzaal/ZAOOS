| File | Lines | Header (first comment line, verbatim, cut at 120) | Local imports | Imported by (non-test) | In ZOE import graph | featureRan names |
|---|---|---|---|---|---|---|
| `hermes/claude-cli.ts` | 557 | (no header comment) | 1 | cockpit/cockpit.ts, hermes/claude-health.ts, hermes/coder.ts, hermes/critic.ts +10 | yes | - |
| `hermes/claude-health.ts` | 189 | claude-health.ts - did a Claude call actually succeed, and when? | 1 | hermes/claude-cli.ts, zoe/index.ts, zoe/pinned-brief-runner.ts | yes | - |
| `hermes/coder.ts` | 249 | (no header comment) | 4 | hermes/runner.ts | yes | - |
| `hermes/codex-cli.ts` | 180 | Codex CLI wrapper - a headless call to OpenAI's `codex exec`, used as ZOE's | 0 | hermes/critic.ts, zoe/critics/types.ts | yes | - |
| `hermes/commands.ts` | 244 | Parse `/fix [<target>] <issue text>` where <target> is an optional repo | 4 | index.ts | no | - |
| `hermes/critic.ts` | 595 | (no header comment) | 7 | hermes/runner.ts, zoe/index.ts | yes | - |
| `hermes/db.ts` | 61 | (no header comment) | 2 | devz/index.ts, hermes/commands.ts, hermes/runner.ts | yes | - |
| `hermes/git.ts` | 297 | (no header comment) | 1 | hermes/coder.ts, hermes/critic.ts, hermes/pr-watcher.ts, hermes/pr.ts +2 | yes | - |
| `hermes/pr-watcher.ts` | 144 | gh CLI defaults to reading remote info from the cwd's .git config. The | 2 | hermes/runner.ts | yes | - |
| `hermes/pr.ts` | 86 | (no header comment) | 1 | hermes/runner.ts | yes | - |
| `hermes/preflight.ts` | 179 | (no header comment) | 2 | hermes/runner.ts | yes | - |
| `hermes/runner.ts` | 355 | (no header comment) | 9 | devz/index.ts, hermes/commands.ts, hermes/pr-watcher.ts, zoe/dispatch.ts +3 | yes | - |
| `hermes/types.ts` | 189 | (no header comment) | 0 | hermes/coder.ts, hermes/commands.ts, hermes/critic.ts, hermes/db.ts +6 | yes | - |
| `zoe/advisors.ts` | 238 | Advisory Sandbox: independent advisors REVIEW Hermes decisions, they never make them. | 0 | none | no | - |
| `zoe/afferent-digest.ts` | 271 | Afferent Digest - receipts -> memory bridge. | 5 | zoe/scheduler.ts | yes | afferent-digest |
| `zoe/agent-delegation.ts` | 139 | agent-delegation.ts - Natural language task delegation and blocker resolution for ZOE. | 1 | zoe/index.ts | yes | - |
| `zoe/agents/decay.ts` | 58 | Memory decay + scoping for the multi-agent layer (doc 761 Phase 3). | 0 | none | no | - |
| `zoe/agents/guards.ts` | 130 | Pre-LLM guard battery (doc 761 Phase 3, design from doc 318). | 2 | zoe/agents/orchestrate.ts | yes | - |
| `zoe/agents/index.ts` | 26 | Agent-registration interface for ZOE's command agents (e.g. newsletter.ts). | 0 | zoe/agents/newsletter.ts | no | - |
| `zoe/agents/newsletter.ts` | 281 | Two modes: | 4 | none | no | - |
| `zoe/agents/orchestrate.ts` | 143 | Multi-agent orchestrator (doc 761 Phase 3) - wires registry -> softmax ranker -> guard | 4 | zoe/caster/trigger.ts | yes | - |
| `zoe/agents/ranker.ts` | 116 | Softmax action ranker (doc 761 Phase 3, design from doc 318). | 1 | zoe/agents/orchestrate.ts | yes | - |
| `zoe/agents/registry.ts` | 92 | Multi-agent registry (doc 761 Phase 3, design from doc 318 - Cassie's multi-agent | 1 | zoe/agents/guards.ts, zoe/agents/orchestrate.ts, zoe/agents/ranker.ts | yes | - |
| `zoe/always-open-topics.ts` | 433 | always-open-topics.ts - Self-refilling "always has one open move" per topic. | 5 | zoe/orchestrator-tick.ts | yes | - |
| `zoe/answer-loop.ts` | 244 | answer-loop.ts - close the loop on Zaal's answers: say what each one changed. | 2 | zoe/scheduler.ts | yes | answer-loop |
| `zoe/answers.ts` | 132 | answers.ts - the durable index of Zaal's answers to button questions. | 1 | zoe/answer-loop.ts, zoe/index.ts, zoe/orchestrator-tick.ts, zoe/tg-interactions.ts | yes | - |
| `zoe/approvals.ts` | 336 | approvals.ts - ZOE's pending-approval state machine (doc 759 keystone). | 5 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/attention.ts` | 442 | Attention layer - what ZOE sends on its own, and what it learns from Zaal's taps. | 1 | zoe/index.ts, zoe/relay-bridge.ts, zoe/scheduler.ts, zoe/work-loop.ts | yes | - |
| `zoe/backlog-grill-runner.ts` | 803 | backlog-grill-runner.ts - the IO half of the backlog grill. | 6 | zoe/index.ts, zoe/pinned-brief-runner.ts, zoe/scheduler.ts | yes | backlog-grill |
| `zoe/backlog-grill.ts` | 564 | backlog-grill.ts - drip the board backlog to Zaal's phone, one card every | 0 | zoe/backlog-grill-runner.ts, zoe/needs-zaal-digest.ts, zoe/pinned-brief-runner.ts | yes | - |
| `zoe/board-command-executor.ts` | 265 | board-command-executor.ts - apply the commands parsed out of an @zoe comment. | 2 | zoe/task-comment-replies.ts | yes | board-commands |
| `zoe/board-commands.ts` | 258 | board-commands.ts - let an @zoe board comment DO something, not just get a reply. | 0 | zoe/board-command-executor.ts | yes | - |
| `zoe/board-trust.ts` | 104 | board-trust.ts - which cowork board commands may run with Zaal's private scope. | 0 | zoe/index.ts | yes | - |
| `zoe/bonfire-queue.ts` | 174 | bonfire-queue.ts - ZOE drains the ZABAL Gamez community submission queue. | 2 | zoe/afferent-digest.ts, zoe/approvals.ts, zoe/index.ts | yes | bonfire-promote |
| `zoe/bonfire-retry.ts` | 169 | bonfire-retry.ts - a retry queue for EVERY Bonfire write, not just thread emits. | 4 | zoe/afferent-digest.ts, zoe/scheduler.ts, zoe/team-tracker.ts | yes | bonfire-retry |
| `zoe/brand-brain.ts` | 224 | brand-brain.ts - ICM box fetching and caching for brand-specific ZOE personas. | 0 | zoe/always-open-topics.ts, zoe/discord.ts, zoe/index.ts | yes | - |
| `zoe/brief-veto.ts` | 87 | brief-veto.ts - AI-ranked morning brief with tap-to-veto inline buttons. | 0 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/brief.ts` | 450 | Morning brief - runs daily at 5am EST (09:00 UTC). | 11 | zoe/scheduler.ts | yes | brief |
| `zoe/build-candidate.ts` | 114 | build-candidate.ts - tap-to-approve inline buttons for fleet BUILD candidates. | 0 | zoe/index.ts | yes | - |
| `zoe/build-intent.ts` | 168 | build-intent.ts - decide whether a DM to ZOE is asking for CODE to be written. | 1 | zoe/index.ts | yes | build-intent |
| `zoe/bus-bridge.ts` | 141 | bus-bridge.ts - see a partner-bus message and reply WELL, from the phone. | 2 | zoe/index.ts | yes | bus-bridge |
| `zoe/bus-receipt.ts` | 190 | bus-receipt.ts - ACK a DreamNet federation receipt and verify its hashes. | 2 | none | no | bus-receipt-verify |
| `zoe/bus-send.ts` | 111 | bus-send.ts - make the reply instruction in every bus message actually work. | 0 | zoe/bus-receipt.ts, zoe/bus-upload.ts, zoe/index.ts | yes | - |
| `zoe/bus-upload.ts` | 128 | bus-upload.ts - upload files to the DreamNet federation bus. | 2 | none | no | bus-upload |
| `zoe/button-bar.ts` | 98 | button-bar - a persistent Telegram reply keyboard (the tap-first cockpit bar) | 0 | zoe/index.ts | yes | - |
| `zoe/calendar.ts` | 344 | Calendar reader - fetches and caches the ZAO Luma calendar (ICS format). | 1 | zoe/brief.ts, zoe/events.ts, zoe/grill.ts | yes | - |
| `zoe/call-budget.ts` | 93 | ZOE daily LLM-call budget (doc 869 fix). | 0 | zoe/index.ts | yes | - |
| `zoe/capability-gaps.ts` | 337 | capability-gaps.ts - ZOE notes what she could not do, and once a week turns | 2 | zoe/concierge.ts, zoe/discord.ts, zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/caster/index.ts` | 180 | Caster pipeline (doc 761, Phase 2) under ZOE. | 5 | zoe/agents/orchestrate.ts, zoe/caster/mention-listener.ts, zoe/caster/trigger.ts, zoe/index.ts | yes | - |
| `zoe/caster/mention-listener.ts` | 50 | Mention listener (ZOL): wires the Farcaster event stream to the approval-gated | 2 | none | no | - |
| `zoe/caster/reason.ts` | 130 | Caster reasoning path (doc 761, Phase 2/4). | 2 | zoe/caster/index.ts | yes | - |
| `zoe/caster/trigger.ts` | 67 | One place that decides how an inbound cast becomes a drafted reply. | 3 | zoe/index.ts | yes | caster-guards |
| `zoe/commands.ts` | 125 | commands.ts - pure command-prefix detection for ZOE DMs. | 0 | zoe/index.ts | yes | - |
| `zoe/companion.ts` | 342 | companion.ts - ZOE active companion engine: situational estate awareness, | 3 | zoe/events.ts, zoe/index.ts | yes | - |
| `zoe/concierge.ts` | 510 | ZOE concierge brain - calls Claude Code CLI with the 4-block memory context | 8 | zoe/discord.ts, zoe/index.ts | yes | - |
| `zoe/cost-governance.ts` | 164 | cost-governance.ts - ZOE spend management guardrails (doc 1081 capability). | 1 | zoe/guardrail-adapters.ts, zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/cost-ledger.ts` | 131 | cost-ledger.ts - ZOE per-model spend visibility. | 0 | hermes/critic.ts, zoe/concierge.ts, zoe/cost-governance.ts, zoe/reflect.ts +1 | yes | - |
| `zoe/crash-guard.ts` | 126 | crash-guard.ts - fail-loud process lifecycle and crash reporting for ZOE. | 1 | zoe/index.ts | yes | - |
| `zoe/critics/comms-critic.ts` | 175 | comms-critic - scores drafted external copy against bot/src/zoe/brand.md | 1 | zoe/workers.ts | yes | - |
| `zoe/critics/research-critic.ts` | 142 | research-critic - scores a research doc against /zao-research Hard | 1 | zoe/workers.ts | yes | - |
| `zoe/critics/task-result-critic.ts` | 143 | task-result-critic - scores "did the agent actually meet the goal?" against | 1 | zoe/workers.ts | yes | - |
| `zoe/critics/types.ts` | 326 | Shared types for the 3 ZOE critics (doc 759 Gap 3). | 4 | zoe/critics/comms-critic.ts, zoe/critics/research-critic.ts, zoe/critics/task-result-critic.ts, zoe/workers.ts | yes | - |
| `zoe/crm.ts` | 160 | ZOE -> ZAO CRM write path (doc 772; direct-write refactor 2026-05-31). | 2 | zoe/index.ts | yes | - |
| `zoe/curator.ts` | 376 | curator.ts - Clean-curator Telegram topic posting for ZAO group forums. | 0 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/daily-note.ts` | 580 | Daily Note Capture + Auto-Rollover (Doc 2169) | 2 | zoe/scheduler.ts | yes | daily-note |
| `zoe/decompose.ts` | 460 | Goal decomposition router for ZOE (doc 759 Gap 1, locked Q10 sprint week 2). | 2 | zoe/approvals.ts, zoe/dispatch.ts, zoe/index.ts, zoe/work-loop.ts +1 | yes | - |
| `zoe/discord-admin.ts` | 515 | discord-admin.ts - Zaal runs the ZM Discord through ZOE: channels, threads, pins. | 1 | zoe/discord-digest.ts, zoe/discord-slash.ts, zoe/discord.ts | yes | - |
| `zoe/discord-digest.ts` | 172 | discord-digest.ts - once a day, ZOE DMs Zaal what happened in the ZM Discord. | 2 | zoe/discord.ts | yes | - |
| `zoe/discord-feedback.ts` | 99 | discord-feedback.ts - posts in the ZM feedback channels become board cards. | 1 | zoe/discord.ts | yes | - |
| `zoe/discord-scope.ts` | 145 | Which memory scope a Discord message gets, and whether a community reply | 1 | zoe/discord.ts | yes | - |
| `zoe/discord-slash.ts` | 203 | discord-slash.ts - ZOE's admin commands as Discord slash commands. | 1 | zoe/discord.ts | yes | - |
| `zoe/discord-spam.ts` | 150 | discord-spam.ts - ZOE watches ZM for likely spam and tells Zaal; it never acts alone. | 0 | zoe/discord.ts | yes | - |
| `zoe/discord-webhook.ts` | 69 | Discord webhook poster for ZOE status feed parity (doc 1135 Stage 1a). | 0 | zoe/scheduler.ts | yes | - |
| `zoe/discord-welcome.ts` | 129 | discord-welcome.ts - role picker, welcome on join, and which invite brought them. | 1 | zoe/discord.ts | yes | - |
| `zoe/discord.ts` | 1113 | ZOE Discord surface - responsive assistant in the ZAO Discord. | 16 | zoe/index.ts | yes | discord-admin, discord-digest, discord-feedback, discord-gap-log, discord-icm, discord-reply, discord-roles, discord-slash, discord-spam, discord-welcome, people-log |
| `zoe/dispatch.ts` | 363 | dispatch.ts - ZOE's Node-orchestrated dispatch loop (doc 759 Gap 2). | 6 | zoe/index.ts, zoe/work-loop.ts | yes | dispatch |
| `zoe/dm-build-buttons.ts` | 34 | dm-build-buttons.ts - the inline keyboards for the DM build flow. | 0 | zoe/index.ts | yes | - |
| `zoe/dm-build-pending.ts` | 79 | dm-build-pending.ts - the PURE half of the DM build buttons. | 0 | zoe/index.ts | yes | - |
| `zoe/dm-build-session.ts` | 126 | dm-build-session.ts - make a DM build STEERABLE while it is running. | 1 | zoe/index.ts | yes | dm-build |
| `zoe/done-work-detector.ts` | 169 | done-work-detector.ts - decide which open board tasks describe work that has | 0 | zoe/team-tracker.ts | yes | - |
| `zoe/drafts.ts` | 65 | Draft approval buttons (doc 1021 comms fix). Any outbound draft (a ZOL cast, | 0 | zoe/always-open-topics.ts, zoe/index.ts | yes | - |
| `zoe/env.ts` | 141 | env.ts - the ONE place ZOE resolves aliased environment variables. | 0 | zoe/index.ts, zoe/scheduler.ts, zoe/telegram-routing.ts, zoe/topic-router.ts | yes | - |
| `zoe/error-remediation.ts` | 405 | Error Remediation: ZOE turns a captured production error into a routed fix | 6 | zoe/own-errors.ts, zoe/scheduler.ts | yes | error-remediation |
| `zoe/escalation.ts` | 145 | escalation.ts - resend super-important pings Zaal hasn't acknowledged. | 1 | zoe/scheduler.ts | yes | - |
| `zoe/events.ts` | 450 | events.ts - proactive EVENT candidates for ZOE's reasoning tick. | 5 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/exec/ffx.ts` | 103 | FFX serverless exec wrapper (doc 761 Phase 4) - MARKED STUB. | 1 | zoe/caster/index.ts | yes | - |
| `zoe/extractors.ts` | 255 | Knowledge extraction fan-out (doc 862). | 2 | zoe/index.ts | yes | - |
| `zoe/fa-walkthrough.ts` | 123 | fa-walkthrough.ts - walk Zaal through applying to Fractured Atlas's fiscal | 0 | zoe/index.ts | yes | - |
| `zoe/farcaster/event-stream.ts` | 105 | Hypersnap gRPC event stream subscriber (doc 761, Phase 2). | 0 | zoe/caster/mention-listener.ts, zoe/index.ts | yes | - |
| `zoe/farcaster/read-node.ts` | 63 | Hypersnap read client (doc 761, Phase 0/2). | 0 | zoe/farcaster/wiki.ts, zoe/mcp/farcaster-server.ts | no | - |
| `zoe/farcaster/signer.ts` | 79 | Farcaster Ed25519 signer for the ZAO caster. | 0 | zoe/farcaster/write.ts | yes | - |
| `zoe/farcaster/wiki.ts` | 314 | wiki.ts - ZOL Farcaster wiki entry builder and learner. | 1 | none | no | - |
| `zoe/farcaster/write.ts` | 83 | Farcaster write path (doc 761, Phase 2). Signs a CastAdd with the configured Ed25519 signer | 2 | zoe/caster/index.ts | yes | - |
| `zoe/farcaster/x402.ts` | 99 | x402 payment header builder for the Neynar write hub (doc 762). | 0 | zoe/farcaster/write.ts | yes | - |
| `zoe/feature-ran.ts` | 61 | feature-ran.ts - let a feature say, once, that it actually executed. | 0 | zoe/afferent-digest.ts, zoe/answer-loop.ts, zoe/backlog-grill-runner.ts, zoe/board-command-executor.ts +35 | yes | - |
| `zoe/federation-checkpoint.ts` | 176 | federation-checkpoint.ts - durable state so a crash resumes instead of repeating. | 1 | none | no | - |
| `zoe/federation-states.ts` | 138 | federation-states.ts - the vocabulary the canary is allowed to conclude in. | 0 | zoe/federation-checkpoint.ts | no | - |
| `zoe/fleet-health.ts` | 180 | fleet-health.ts - process/unit liveness + SELF-HEAL for the watcher. | 1 | zoe/brief.ts, zoe/scheduler.ts | yes | - |
| `zoe/fleet.ts` | 81 | fleet.ts - the driver that puts the per-brand Identity Kit to work (doc 2155). | 2 | zoe/scheduler.ts | yes | - |
| `zoe/focus-guard.ts` | 143 | focus-guard.ts - Hyperfocus protection for Zaal's deep work. | 0 | zoe/index.ts | yes | - |
| `zoe/golden-eval.ts` | 144 | golden-eval.ts - a golden-set regression harness for ZOE (doc 2200). | 0 | none | no | - |
| `zoe/grill-pause.ts` | 68 | grill-pause.ts - one button, always on the grill, that stops it. | 0 | zoe/backlog-grill-runner.ts, zoe/grill.ts, zoe/inbox-nudge.ts, zoe/index.ts +3 | yes | - |
| `zoe/grill-queue.ts` | 411 | grill-queue.ts - the grill's second destination. | 0 | zoe/backlog-grill-runner.ts, zoe/grill.ts, zoe/needs-zaal-digest.ts | yes | - |
| `zoe/grill.ts` | 926 | grill - the bot->agent upgrade. Instead of waiting to be messaged, ZOE pulls | 9 | zoe/backlog-grill-runner.ts, zoe/index.ts, zoe/scheduler.ts | yes | grill-expire, grill-gate-sort |
| `zoe/groups.ts` | 199 | Per-Telegram-chat config for ZOE in group/channel contexts. | 1 | zoe/index.ts, zoe/member-dm.ts, zoe/relay.ts | yes | - |
| `zoe/guardrail-adapters.ts` | 65 | guardrail-adapters.ts - ZOE's real guards bound to the Guardrail interface. | 4 | zoe/concierge.ts | yes | - |
| `zoe/guardrails.ts` | 172 | guardrails.ts - a composable guardrail abstraction for ZOE. | 1 | zoe/guardrail-adapters.ts | yes | guardrails |
| `zoe/handoffs-surface.ts` | 137 | Surface new handoff-inbox items in the ZAAL BOTZ Handoffs topic. A /handoff | 1 | zoe/scheduler.ts | yes | - |
| `zoe/heart-canary.ts` | 228 | Heart fleet CANARY - first (and only, until proven) consumer of the shared | 2 | zoe/scheduler.ts | yes | - |
| `zoe/heart-run.ts` | 165 | heart-run.ts - resolve the agent_runs ROW that a Heart lease fences on. | 2 | zoe/scheduler.ts | yes | heart-run |
| `zoe/identities.ts` | 134 | identities.ts - the per-brand Identity Kit registry (doc 2155). | 0 | zoe/fleet.ts | yes | - |
| `zoe/inbound-media.ts` | 358 | inbound-media.ts - ingest inbound photos, PDFs, and screenshots from Telegram | 1 | zoe/index.ts | yes | - |
| `zoe/inbox-ingest.ts` | 185 | inbox-ingest.ts - pull new mail Zaal forwarded to zoe-zao@agentmail.to and | 3 | zoe/fleet.ts, zoe/inbox-triage.ts | yes | - |
| `zoe/inbox-nudge.ts` | 374 | inbox-nudge.ts - the daily "what waits on you" push that comes back until | 7 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/inbox-triage.ts` | 192 | inbox-triage.ts - Extend inbox-ingest with calm, structured triage. | 1 | zoe/inbox-ingest.ts | yes | - |
| `zoe/index.ts` | 5025 | ZOE - main entry. Telegram polling for @zaoclaw_bot. | 104 | none | yes | board-run-approved, capability-gap-log, fa-walkthrough, grill-pause, inbox-nudge, member-dm, people-log, recall-context, self-upgrade-dedupe, self-upgrade-intake, sleep-checkin, terminal-grill, terminals-digest, thinking-spinner, voice-ideas, x-desk |
| `zoe/lanes-board.ts` | 131 | lanes-board.ts - /lanes: the Mac's Claude Code lanes, read from a snapshot. | 0 | zoe/companion.ts, zoe/index.ts | yes | - |
| `zoe/learn.ts` | 325 | learn.ts - ZOE's improvement-over-time loop (doc 759 Gap 5). | 4 | zoe/approvals.ts, zoe/index.ts, zoe/scheduler.ts, zoe/workers.ts | yes | - |
| `zoe/live-status.ts` | 170 | live-status.ts - one message that updates in place, instead of six new ones. | 1 | zoe/index.ts | yes | live-status |
| `zoe/loops-status.ts` | 99 | loops-status.ts - read + format the tmux fleet loop status for ZOE's | 0 | zoe/index.ts | yes | - |
| `zoe/mcp/farcaster-client.ts` | 51 | farcaster-client.ts - ZOE reaches the Farcaster read TOOL-AGENT via MCP. | 0 | none | no | - |
| `zoe/mcp/farcaster-server.ts` | 82 | farcaster-server.ts - ZOE's first MCP TOOL-AGENT (a "harness just for one tool"). | 1 | none | no | - |
| `zoe/meetings.ts` | 128 | Meetings query for the morning brief. | 0 | zoe/brief.ts | yes | - |
| `zoe/member-dm.ts` | 132 | member-dm.ts - a DM turn for a ZAO member who is not Zaal. | 2 | zoe/discord-scope.ts, zoe/discord.ts, zoe/index.ts | yes | - |
| `zoe/memory-git.ts` | 144 | memory-git.ts - commit-per-edit versioning for ZOE's memory files. | 1 | zoe/memory.ts | yes | memory-git |
| `zoe/memory.ts` | 958 | Memory block builder - Letta-inspired pattern. | 4 | zoe/agents/newsletter.ts, zoe/agents/registry.ts, zoe/answers.ts, zoe/approvals.ts +36 | yes | - |
| `zoe/message-context.ts` | 124 | message-context.ts - Persistent store for mapping Telegram message IDs to ZOE contexts. | 0 | zoe/index.ts, zoe/orchestrator-tick.ts, zoe/tg-interactions.ts, zoe/thezao-daily.ts | yes | - |
| `zoe/mission-control.ts` | 187 | mission-control.ts - render + emit layer for the TG pinned mission-control. | 1 | zoe/error-remediation.ts, zoe/repo-improver.ts, zoe/watcher.ts | yes | mission-control |
| `zoe/models/cli-cap-aware.ts` | 47 | callClaudeCliCapAware - run a Claude CLI call, and if Claude is over its cap | 2 | hermes/critic.ts, zoe/brief.ts, zoe/decompose.ts, zoe/extractors.ts +8 | yes | - |
| `zoe/models/free-tier.ts` | 28 | Free-tier guard for every OpenRouter caller in the bot. | 0 | zoe/caster/reason.ts, zoe/models/router.ts | yes | - |
| `zoe/models/provider-health.ts` | 436 | provider-health.ts - deterministic state machine with hysteresis for LLM providers. | 0 | zoe/models/router.ts | yes | - |
| `zoe/models/router.ts` | 772 | ZOE multi-model router - dispatch concierge tasks to Claude, Grok (xAI), or GPT (OpenAI). | 3 | hermes/critic.ts, zoe/concierge.ts, zoe/critics/types.ts, zoe/models/cli-cap-aware.ts +1 | yes | - |
| `zoe/needs-zaal-digest.ts` | 434 | needs-zaal-digest.ts - scheduled "Needs Zaal" digest to Telegram (08:00 and 20:00 ET). | 7 | zoe/grill.ts, zoe/inbox-nudge.ts, zoe/scheduler.ts | yes | - |
| `zoe/node-cron.d.ts` | 23 | Local type shim for node-cron (no @types package installed in this repo). | 0 | none | no | - |
| `zoe/nudge-ladder.ts` | 166 | nudge-ladder.ts - an escalating -> decaying Telegram nudge for a single | 0 | zoe/orchestrator-tick.ts | yes | - |
| `zoe/nudge.ts` | 166 | Proactive nudge - surface stale captures and overdue tasks. | 2 | zoe/scheduler.ts | yes | - |
| `zoe/nudges.ts` | 233 | Forward nudges - surfaces the real next move from ZOE's task queue. | 1 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/orchestrator-tick.ts` | 808 | orchestrator-tick.ts - VPS cron tick for the durable orchestrator. | 14 | zoe/scheduler.ts | yes | orchestrator-tick |
| `zoe/outbox.ts` | 75 | outbox.ts - durable record of APPROVED outbound drafts. | 0 | zoe/index.ts | yes | - |
| `zoe/own-errors.ts` | 162 | own-errors.ts - feed ZOE's own code failures into app_errors. | 2 | zoe/crash-guard.ts | yes | - |
| `zoe/owner-only.ts` | 50 | owner-only.ts - what a non-owner hears when they type an owner command. | 0 | helper/handle.ts, helper/index.ts, zoe/index.ts | yes | - |
| `zoe/pending-answers.ts` | 42 | pending-answers.ts - "the last thing ZOE asked in a chat," so Zaal can answer | 0 | zoe/index.ts, zoe/orchestrator-tick.ts | yes | - |
| `zoe/pending-decisions.ts` | 157 | Pending decisions classifier for the morning brief. | 0 | zoe/brief.ts | yes | - |
| `zoe/people.ts` | 224 | people.ts - who has talked to ZOE, and what they want to be called. | 1 | zoe/discord.ts, zoe/index.ts | yes | - |
| `zoe/pii.ts` | 142 | pii.ts - PII scan + redaction for anything ZOE writes outward (Bonfire | 0 | zoe/bonfire-retry.ts, zoe/capability-gaps.ts, zoe/concierge.ts, zoe/guardrail-adapters.ts +3 | yes | - |
| `zoe/ping-lifecycle.ts` | 134 | ping-lifecycle.ts - tie teammate-ack pings to board task lifecycles. | 2 | zoe/scheduler.ts | yes | - |
| `zoe/pinned-brief-runner.ts` | 148 | pinned-brief-runner.ts - gather real state and keep the pinned brief current. | 4 | zoe/scheduler.ts | yes | - |
| `zoe/pinned-brief.ts` | 185 | pinned-brief.ts - ONE pinned Telegram message that is always the current state. | 1 | zoe/pinned-brief-runner.ts | yes | pinned-brief |
| `zoe/posts/buttons.ts` | 290 | Post slate v2 - inline keyboard + callback handler. | 8 | zoe/posts/fractal-promo.ts, zoe/posts/index.ts, zoe/posts/scheduler.ts | yes | post-publish |
| `zoe/posts/drafters.ts` | 216 | Post slate v2 - per-category Claude CLI drafter. | 2 | zoe/posts/buttons.ts, zoe/posts/scheduler.ts, zoe/x-desk.ts | yes | - |
| `zoe/posts/drafts-queue.ts` | 117 | Post slate v3 - silent drafts backlog (doc 796 Decision 2). | 2 | zoe/posts/index.ts, zoe/posts/scheduler.ts, zoe/posts/select-best.ts | yes | - |
| `zoe/posts/fractal-promo.ts` | 51 | fractal-promo.ts - dedicated weekly post slot for the ZAO Fractal. | 1 | zoe/posts/scheduler.ts | yes | - |
| `zoe/posts/index.ts` | 15 | Post slate v2 - public API. | 8 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/posts/pending.ts` | 70 | Post slate v2 - pending draft persistence + state machine. | 2 | zoe/posts/buttons.ts, zoe/posts/index.ts | yes | - |
| `zoe/posts/publish.ts` | 190 | POST button -> the real publish path (doc 2239 section 5, fix 1; doc 2244). | 0 | zoe/posts/buttons.ts | yes | - |
| `zoe/posts/scheduler.ts` | 319 | Post slate v1 - randomized scheduler. | 8 | zoe/posts/index.ts | yes | - |
| `zoe/posts/select-best.ts` | 119 | Post slate v4 - "one best draft" selector (build: surface ONE best, not 30). | 2 | zoe/posts/index.ts, zoe/posts/scheduler.ts | yes | - |
| `zoe/posts/sources.ts` | 150 | Post slate v1 - data gathering per category. | 3 | zoe/posts/buttons.ts, zoe/posts/index.ts, zoe/posts/scheduler.ts, zoe/posts/voicememo.ts | yes | - |
| `zoe/posts/types.ts` | 25 | Post slate v1 - shared types. | 0 | zoe/posts/buttons.ts, zoe/posts/drafters.ts, zoe/posts/drafts-queue.ts, zoe/posts/index.ts +3 | yes | - |
| `zoe/posts/voicememo.ts` | 30 | Post slate v1 - /voicememo Telegram command + plain-text capture. | 1 | zoe/posts/index.ts | yes | - |
| `zoe/posts/zaostock-promo-calendar.ts` | 126 | ZAOstock photo + promo calendar (research doc 1033) - pure date lookup. | 0 | zoe/posts/sources.ts | yes | - |
| `zoe/pr-reserved.ts` | 152 | pr-reserved.ts - which open PRs are truly Zaal's to merge. | 0 | zoe/inbox-nudge.ts | yes | - |
| `zoe/preflight.ts` | 182 | ZOE Config Preflight: fail LOUDLY on missing config, never silently. | 0 | zoe/guardrail-adapters.ts, zoe/scheduler.ts | yes | - |
| `zoe/proactive.ts` | 406 | proactive.ts - the reasoning-tick gate (doc 796 Move 1, Phase 2). | 3 | zoe/companion.ts, zoe/events.ts, zoe/index.ts, zoe/scheduler.ts | yes | proactive |
| `zoe/questions.ts` | 124 | questions.ts - one-question-at-a-time buttons for the orchestrator loop. | 0 | zoe/always-open-topics.ts, zoe/index.ts, zoe/orchestrator-tick.ts, zoe/telegram-routing.ts +1 | yes | - |
| `zoe/quiet-window.ts` | 319 | quiet-window.ts - nothing reaches Zaal at night; it is held and sent in the morning. | 1 | zoe/grill.ts, zoe/inbox-nudge.ts, zoe/scheduler.ts, zoe/send-budget.ts +1 | yes | - |
| `zoe/radar-dedup.ts` | 233 | radar-dedup.ts - layered duplicate detection for incoming research items. | 1 | zoe/research-dedupe.ts | yes | - |
| `zoe/recall-carry.ts` | 113 | recall-carry.ts - a Bonfire search that finishes after ZOE has answered is | 0 | zoe/index.ts | yes | - |
| `zoe/recall.ts` | 361 | Bonfire bridge for ZOE - read (recall) + write (remember). | 1 | zoe/agents/newsletter.ts, zoe/bonfire-queue.ts, zoe/bonfire-retry.ts, zoe/brief.ts +7 | yes | - |
| `zoe/recap.ts` | 151 | Nightly recap - runs daily at 9pm EST (02:00 UTC). | 2 | zoe/scheduler.ts | yes | recap |
| `zoe/receipt-envelope.ts` | 243 | DreamNet Receipt Envelope (dreamnet.receipt.v1) | 0 | zoe/receipts.ts | yes | - |
| `zoe/receipts.ts` | 187 | Receipt Emitter: Best-effort proof-of-action logging for ZOE tool calls. | 3 | hermes/runner.ts, zoe/afferent-digest.ts, zoe/error-remediation.ts, zoe/repo-improver-io.ts +1 | yes | receipts |
| `zoe/reflect.ts` | 151 | Evening reflection - runs daily at 9pm EST (01:00 UTC next day). | 5 | zoe/scheduler.ts | yes | reflect |
| `zoe/reflexion.ts` | 368 | reflexion.ts - Letta-style self-improving memory layer (doc 759 Gap 4 + | 3 | zoe/approvals.ts, zoe/index.ts | yes | reflexion |
| `zoe/relay-bridge.ts` | 319 | relay-bridge.ts - Telegram <-> fleet-relay bridge for ZOE. | 4 | zoe/index.ts, zoe/orchestrator-tick.ts, zoe/tg-interactions.ts | yes | relay-bridge |
| `zoe/relay.ts` | 89 | Cross-bot relay for ZOE (Phase 2 of Bonfire integration). | 2 | zoe/index.ts | yes | - |
| `zoe/repo-improver-io.ts` | 222 | Repo Improver Scout: I/O wiring (default deps + the tick). | 7 | zoe/scheduler.ts | yes | - |
| `zoe/repo-improver.ts` | 375 | Repo Improver Scout: cheap-AI audit loop that ZOE self-gates and learns from. | 4 | zoe/repo-improver-io.ts, zoe/scheduler.ts | yes | repo-improver-scout |
| `zoe/research-dedupe.ts` | 227 | research-dedupe.ts - URL deduplication for research dispatch. | 1 | zoe/index.ts, zoe/radar-dedup.ts, zoe/scheduler.ts | yes | - |
| `zoe/research-doc.ts` | 183 | research-doc.ts - turn a research-worker's findings into a numbered research | 0 | zoe/index.ts, zoe/work-loop.ts | yes | - |
| `zoe/resume.ts` | 68 | resume.ts - capture a resume/bio credential Zaal mentions (by voice or text), | 3 | zoe/index.ts | yes | - |
| `zoe/runs.ts` | 92 | runs.ts - append-only telemetry for ZOE's dispatch loop. | 1 | zoe/dispatch.ts, zoe/learn.ts, zoe/watcher.ts | yes | - |
| `zoe/safety/klearu.ts` | 200 | Klearu safety/classification wrapper (doc 761, Phase 2/4). | 0 | zoe/agents/guards.ts, zoe/caster/index.ts, zoe/exec/ffx.ts | yes | - |
| `zoe/scheduler.ts` | 2220 | Scheduler - proactive nudges on cron. | 66 | zoe/index.ts | yes | attention-consolidate, attention-digest, backlog-grill, bonfire-retry, capability-gap-digest, claude-auth-probe, inbox-nudge, pinned-brief-tick, quiet-window, self-scout, sleep-checkin, terminal-grill, terminals-digest, thezao-daily |
| `zoe/scope-lock.ts` | 49 | scope-lock.ts - what a concierge turn may DO, by scope. | 1 | zoe/discord.ts, zoe/index.ts | yes | - |
| `zoe/self-scout.ts` | 288 | self-scout.ts - once a week ZOE picks ONE outside open-source repo herself | 1 | zoe/scheduler.ts | yes | - |
| `zoe/self-upgrade.ts` | 310 | Self-upgrade loop, stages 1 and 4 (research doc 2652, merged as ZAOOS #3862). | 0 | zoe/index.ts, zoe/scheduler.ts, zoe/self-scout.ts, zoe/work-loop.ts | yes | - |
| `zoe/send-budget.ts` | 989 | send-budget.ts - one gate every outbound ZOE Telegram send passes through. | 1 | zoe/always-open-topics.ts, zoe/attention.ts, zoe/backlog-grill-runner.ts, zoe/caster/index.ts +14 | yes | - |
| `zoe/session-checkpoint.ts` | 104 | session-checkpoint.ts - Save/recall "where I left off" per thread. | 0 | zoe/index.ts | yes | - |
| `zoe/sidequests.ts` | 265 | SIDEQUESTZ - ZOE's goal-alignment layer (spec 2026-05-14, doc 648). | 1 | zoe/index.ts, zoe/memory.ts | yes | - |
| `zoe/sleep-checkin.ts` | 349 | sleep-checkin.ts - the morning sleep and energy check-in. | 1 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/task-classifier.ts` | 198 | task-classifier.ts - auto-tag a task from its title + notes (doc 983 Rec #4). | 0 | cockpit/adapters.ts, cockpit/types.ts, zoe/team-tracker.ts | yes | - |
| `zoe/task-comment-replies.ts` | 355 | task-comment-replies.ts - ZOE watches the cowork board for task comments that | 2 | zoe/scheduler.ts | yes | - |
| `zoe/task-mention-notify.ts` | 211 | task-mention-notify.ts - when someone @mentions a PERSON in a board task | 0 | zoe/scheduler.ts | yes | - |
| `zoe/task-teammate-ack.ts` | 721 | task-teammate-ack.ts - when a team member (e.g. Iman) comments on a cowork | 2 | zoe/index.ts, zoe/ping-lifecycle.ts, zoe/scheduler.ts | yes | - |
| `zoe/tasks.ts` | 186 | Task queue read/write for ZOE. | 2 | zoe/brief.ts, zoe/index.ts, zoe/reflect.ts | yes | - |
| `zoe/team-tracker.ts` | 797 | Team tracker read access for ZOE (doc 890 - bridge ZOE to the coworking system). | 5 | zoe/brief.ts, zoe/discord-feedback.ts, zoe/discord.ts, zoe/index.ts +3 | yes | auto-close |
| `zoe/teammate-heartbeat.ts` | 234 | teammate-heartbeat.ts - ask a teammate what they are on, so nobody has to police it. | 0 | none | no | - |
| `zoe/telegram-routing.ts` | 272 | telegram-routing.ts - centralized routing rule for ZOE Telegram messages. | 5 | zoe/index.ts, zoe/orchestrator-tick.ts, zoe/scheduler.ts | yes | - |
| `zoe/terminal-grill.ts` | 331 | terminal-grill.ts - /grill walks the seat's "Waiting on Zaal" items first. | 3 | zoe/index.ts, zoe/scheduler.ts | yes | - |
| `zoe/terminals-digest.ts` | 200 | terminals-digest.ts - tell Zaal how every terminal is doing, from his DM. | 1 | zoe/inbox-nudge.ts, zoe/index.ts, zoe/scheduler.ts, zoe/terminal-grill.ts +1 | yes | - |
| `zoe/tg-chunk.ts` | 125 | tg-chunk.ts - split + send long text to Telegram in <=4096-char messages. | 0 | zoe/bus-bridge.ts, zoe/index.ts, zoe/relay-bridge.ts, zoe/scheduler.ts +1 | yes | - |
| `zoe/tg-interactions.ts` | 523 | tg-interactions.ts - 6 new Telegram interaction features for ZOE. | 6 | zoe/index.ts | yes | - |
| `zoe/thezao-daily.ts` | 179 | thezao-daily.ts - the morning test.thezao.com message. | 3 | zoe/scheduler.ts | yes | - |
| `zoe/thinking-spinner.ts` | 153 | Thinking spinner - a visible "ZOE is working" line inside the chat itself. | 0 | zoe/index.ts | yes | - |
| `zoe/thread-memory.ts` | 163 | thread-memory.ts - open-threads → Bonfire emit (doc 796 Move 2, Layer B). | 4 | zoe/scheduler.ts, zoe/thread-ops.ts | yes | - |
| `zoe/thread-ops.ts` | 129 | thread-ops.ts - apply the concierge's thread_ops (doc 796 Move 2). | 3 | zoe/index.ts | yes | - |
| `zoe/threads.ts` | 302 | threads.ts - open-threads store (doc 796 Move 2, Layer A). | 1 | zoe/index.ts, zoe/proactive.ts, zoe/reflect.ts, zoe/scheduler.ts +2 | yes | - |
| `zoe/tick-lock.ts` | 248 | tick-lock.ts - an ATOMIC single-instance lock for the autonomous loops. | 1 | helper/index.ts, zoe/orchestrator-tick.ts, zoe/scheduler.ts, zoe/work-loop.ts | yes | tick-lock |
| `zoe/topic-router.ts` | 91 | topic-router.ts - map a ZAAL BOTZ forum topic to a behavior. | 2 | zoe/index.ts, zoe/orchestrator-tick.ts | yes | - |
| `zoe/topics.ts` | 90 | Forum-topic registry for the ZAAL BOTZ ops group. ZOE (a group admin with | 0 | zoe/always-open-topics.ts, zoe/index.ts, zoe/scheduler.ts, zoe/telegram-routing.ts +1 | yes | - |
| `zoe/trace.ts` | 145 | trace.ts - step-level execution tracing for ZOE's worker runs, WITHOUT a new | 1 | zoe/workers.ts | yes | - |
| `zoe/transcribe.ts` | 189 | transcribe.ts - voice/audio -> text for ZOE, via Groq's Whisper API. | 0 | zai/voice-capture.ts, zoe/index.ts, zoe/tg-interactions.ts | yes | - |
| `zoe/trust-audit.ts` | 212 | trust-audit.ts - Monthly trust audit to catch fallen tasks/captures. | 2 | zoe/index.ts | yes | trust-audit |
| `zoe/turn-queue.ts` | 85 | Per-chat turn queue (doc 872 - live steering, "finish then apply"). | 0 | zoe/index.ts | yes | - |
| `zoe/types.ts` | 303 | Shared types for bot/src/zoe - ZOE concierge brain. | 1 | zoe/brief.ts, zoe/concierge.ts, zoe/critics/types.ts, zoe/crm.ts +15 | yes | - |
| `zoe/user-errors.ts` | 57 | user-errors - keep raw error internals out of what a human sees. | 0 | zoe/index.ts | yes | - |
| `zoe/vault-freshness.ts` | 140 | vault-freshness - ZOE reads a COPY of the vault, and a copy goes stale silently. | 0 | zoe/needs-zaal-digest.ts | yes | - |
| `zoe/verify-replan.ts` | 139 | verify-replan.ts - a ResultVerifier + bounded replan for ZOE's autonomous | 0 | zoe/work-loop.ts | yes | - |
| `zoe/voice-ideas.ts` | 144 | voice-ideas.ts - a car-ride voice note becomes several draft ideas, split | 0 | zoe/index.ts | yes | - |
| `zoe/watcher.ts` | 90 | watcher.ts - the dispatch supervisor (the one genuinely-missing piece of the | 2 | zoe/fleet-health.ts, zoe/scheduler.ts | yes | - |
| `zoe/work-loop.ts` | 430 | work-loop.ts - the autonomous WORK track (the genuine doc 927 gap). | 12 | zoe/agent-delegation.ts, zoe/index.ts, zoe/orchestrator-tick.ts, zoe/scheduler.ts +1 | yes | self-upgrade-snapshot, work-loop |
| `zoe/work-park.ts` | 199 | work-park.ts - failed work survives, and can be asked about afterwards. | 1 | zoe/work-loop.ts | yes | - |
| `zoe/workers.ts` | 514 | workers.ts - the per-worker runner for ZOE's dispatch loop (doc 759 Gap 2). | 10 | zoe/dispatch.ts | yes | - |
| `zoe/x-desk.ts` | 425 | X desk, phase 1 (research doc 2651, merged as ZAOOS #3854). | 1 | zoe/index.ts | yes | - |
| `zoe/zaostock-approvals-surface.ts` | 141 | Surface new entries from the ZAOstock cloud research loop's pending-approvals | 1 | zoe/scheduler.ts | yes | - |
| `zoe/zol-queue.ts` | 84 | ZOL queue - bridge ZOE cast approvals to the cowork tracker. | 0 | zoe/index.ts | yes | - |
