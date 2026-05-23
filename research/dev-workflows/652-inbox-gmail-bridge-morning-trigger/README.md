---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: Lock the path from email arrives in Zaal's Gmail to doc lands in research by 7am EST - decide Gmail-MCP vs auto-forward, wire /inbox into /morning (reconstructed)
related-docs: 422, 574, 599
tier: STANDARD
---

# 652 - Gmail to /inbox Bridge + Morning Auto-Research Trigger

> **Goal:** Lock the path from "email arrives in Zaal's Gmail" to "doc lands in `research/` by 7am EST." Decide Gmail-MCP vs auto-forward, wire `/inbox research all` into `/morning`, ship.

## Key Decisions (TL;DR)

| # | Recommendation | Why | Owner |
|---|---|---|---|
| 1 | **PRIMARY: Gmail filter -> verified auto-forward to `zoe-zao@agentmail.to`** | Reuses existing AgentMail inbox + `/inbox` skill (proven across docs 574, 599). Decoupled from MCP scope changes. One filter rule = label-in-Gmail + forward-out, both at once. New mail only; backfill stays in Gmail. | @Zaal |
| 2 | **SECONDARY: Keep Anthropic Gmail MCP installed for ad-hoc search** | `mcp__claude_ai_Gmail__*` already wired by Anthropic connector. READ-only in 2026 (search by `label:`, sender, date, keyword + read message + list labels + create draft). No modify/archive (issue #36547 open). Use it for "Zaal, find any email mentioning X from last 7 days" without bouncing through AgentMail. | @Zaal |
| 3 | **PATCH `/morning` skill: call `/inbox count` in brief, surface unread count + offer `/inbox research all`** | `/morning` today does `/z` + briefs + PRs + issues, but ignores ZOE inbox. Inbox is the highest-signal queue in the morning. | @Zaal |
| 4 | **DO NOT auto-execute `/inbox research all` unattended in the local `/morning` skill** | `/morning` is interactive (asks "what's the ONE thing today"). Auto-research belongs in the scheduled cloud routine (Doc 422 plan), not the local skill. Local = surface + offer. Cloud = run. | @Zaal |
| 5 | **PROMOTE the autonomous `/inbox research all` runner to a Claude Routine on the same cadence as `/morning`** (6am ET daily) per Doc 422 migration order (#2 in the queue) | Routine writes digest doc to `research/events/<n>-inbox-digest-YYYY-MM-DD/`, opens PR. By the time Zaal runs local `/morning`, doc is already in `gh pr list` output. | @Zaal |
| 6 | **REJECT third-party MCPs (StackOne 42-action, Composio, charlesad)** | Anthropic connector covers the read scope we need. Modify-labels gap is solved by AgentMail labels (we control those server-side already). One less third-party token to manage; aligns with `feedback_oss_first_no_platforms.md`. | @Zaal |

## Today's Picture

```
Zaal phone -> forward email to zoe-zao@agentmail.to
                                     |
                              AgentMail inbox
                                     |
                          /inbox skill (manual run)
                                     |
                /zao-research per item -> research/ doc -> PR
```

Pain points:
- Manual `/inbox` only fires when Zaal remembers to type it
- Gmail mail not auto-forwarded; Zaal has to forward each one
- `/morning` doesn't know `/inbox` exists
- No way to search Gmail directly inside Claude Code session without leaving

## Target Picture

```
Gmail (zaalp99@gmail.com)
   |
   |-- Filter: label "zoe-inbox" + forward to zoe-zao@agentmail.to
   |          (criteria: any of - subject "zoe", to "zoe-zao@", from select senders,
   |           manual label "zoe-inbox" applied from phone)
   |
   v
AgentMail (zoe-zao@agentmail.to)
   |
   v
Claude Routine (cloud, 6am ET daily, Doc 422)
   |-- /inbox research all -> research/events/<n>-inbox-digest-YYYY-MM-DD/
   |-- opens PR on claude/inbox-digest-YYYY-MM-DD
   v
Local /morning skill (when Zaal opens laptop)
   |-- /z status
   |-- /inbox count (whitelisted unread)
   |-- gh pr list (catches the cloud-built digest PR)
   |-- surfaces: "ZOE digest #N ready in PR, M unread still pending"
   v
Zaal reviews PR, merges, sets day intention.

Optional sidecar: Gmail MCP for ad-hoc search inside any Claude Code session
  e.g. "find emails from Cassie in last 30 days about ZAOstock" ->
       mcp__claude_ai_Gmail__search_messages(query: "from:cassie ZAOstock newer_than:30d")
```

## Why Auto-Forward, Not MCP-Only

Three reasons MCP alone is not enough:

1. **No modify-labels in 2026.** The Anthropic Gmail connector is READ + create-draft only. You can `gmail_search_messages` for unread mail, but you cannot archive it, mark it read, or remove an `INBOX` label after processing. AgentMail already supports add/remove labels via `PATCH /messages/{id}` (the `/inbox` skill uses `add_labels: ["processed"], remove_labels: ["unread"]` today). MCP would force a "read but cannot file" workflow.
2. **Verification + auth churn.** MCP needs OAuth refresh; AgentMail forwarding is plain SMTP. Once verified, Gmail keeps forwarding until disabled.
3. **AgentMail webhooks enable push, not poll.** AgentMail supports inbound webhooks ([docs](https://docs.agentmail.to/overview)). Future move: AgentMail webhook -> Claude Routine API trigger (Doc 422 pattern) = real-time research within minutes of email arrival, not "wait until 6am cron."

MCP is still worth keeping for ad-hoc Gmail searches that are not worth queueing through the inbox (e.g. "did I get the Coinflow Labs onboarding confirmation?").

## Gmail Filter Setup (5 minutes)

Step-by-step (Gmail web, Settings -> Forwarding and POP/IMAP):

1. Add forwarding address: `zoe-zao@agentmail.to`. Click "Send verification."
2. Open AgentMail inbox (via `/inbox` or `curl`), find verification email from Gmail, copy the 9-digit code, paste back in Gmail.
3. Set "Forwarding" radio to **"Disable forwarding"** at the top-level (we will NOT forward everything - only filtered).
4. Settings -> Filters and Blocked Addresses -> Create a new filter.
5. Choose criteria. Two recommended patterns:

| Pattern | Filter criteria | Use when |
|---|---|---|
| **Manual label** (recommended start) | `label:zoe-inbox` | Zaal applies "zoe-inbox" label from Gmail mobile app to anything he wants ZOE to research. Highest control, zero false positives. |
| **Sender allowlist** | `from:(cassie@... OR iman@... OR samantha@... OR a-trusted-newsletter)` | For people whose every email is worth queueing (rare). Add senders one at a time. |
| **Subject keyword** | `subject:(research OR zoe OR research-this)` | When forwarding from desktop, prepend "Research:" to subject. |
| **Forwarded-to alias** | `to:zoe@bettercallzaal.com` (if Gmail accepts forwarding via alias) | Cleanest semantic - "anything I forwarded to this address goes to ZOE." Requires Gmail alias setup. |

6. Click "Create filter" (bottom-right of search panel).
7. Tick:
   - "Apply the label" -> create label `zoe-inbox` (so you can see what was queued)
   - "Forward it to" -> `zoe-zao@agentmail.to` (verified)
   - (Optional) "Skip the Inbox" - moves the email to `zoe-inbox` label only, keeps your main inbox clean
   - (Optional) "Mark as read" - mute unread badge

8. Save. New mail matching the filter is now mirrored to AgentMail.

**Important:** filters only fire on new mail. Existing matching mail stays in Gmail. To backfill, search the same query in Gmail, "Select all matching" -> bulk-apply the label (Gmail will forward + label them).

**Loop guard:** AgentMail messages cannot end up in your Gmail (different domain), so no forwarding loop. But if you ever set up a "ZOE replies to me from agentmail" pipeline, exclude `from:zoe-zao@agentmail.to` in the Gmail filter to prevent ping-pong.

## Sender Whitelist Compatibility

`/inbox` skill enforces `from:zaalp99@gmail.com` (security rule). When Gmail auto-forwards, the original sender's `From:` header is preserved in the forwarded message (Gmail wraps with `Resent-From:` but does not rewrite `From:`). 

**Problem:** the original `From:` will be the source of the email (e.g. a newsletter), not `zaalp99@gmail.com`. The current whitelist will silently drop everything.

**Fix:** loosen the whitelist check to accept EITHER:
- `from` contains `zaalp99@gmail.com` (direct send from Zaal's phone)
- OR `Resent-From:` / `Delivered-To:` / `X-Forwarded-For:` headers contain `zaalp99@gmail.com` (auto-forwarded from Zaal's account)

Implementation: patch `/inbox` skill SKILL.md "Security" section to check forwarded-by headers as well. AgentMail exposes the full raw message; the routine should parse `Resent-From` / `X-Forwarded-For` from headers. This needs a code/skill update (see Next Actions #2).

## Anthropic Gmail MCP - Confirmed Capabilities (May 2026)

Source: [GitHub issue #36547](https://github.com/anthropics/claude-code/issues/36547) filed Mar 20 2026.

| Tool | Type | Status |
|---|---|---|
| `gmail_search_messages` | Read | Available - supports `from:`, `to:`, `label:`, `subject:`, `newer_than:`, `older_than:`, full Gmail search grammar |
| `gmail_read_message` | Read | Available |
| `gmail_read_thread` | Read | Available |
| `gmail_list_labels` | Read | Available |
| `gmail_list_drafts` | Read | Available |
| `gmail_get_profile` | Read | Available |
| `gmail_create_draft` | Write | Available |
| `gmail_modify_labels` | Write | **MISSING** (issue #36547, open) |
| `gmail_send_draft` | Write | **MISSING** (issue #32266, related) |

Auth: OAuth flow via `mcp__claude_ai_Gmail__authenticate`. Once authorized, tools become available. Re-auth required if Google revokes (e.g. password change, suspicious activity flag).

Cannot expand scope: attempting `gmail.modify` scope returns 403; trying to re-authorize for broader access hits Google's "This app is blocked" screen with no `Advanced` bypass. This is why label management has to live in AgentMail, not Gmail, for now.

## `/morning` Skill Patch Plan

Current `/morning` (`.claude/skills/morning/SKILL.md`) does:
1. `/z` (branch + commits)
2. read daily brief
3. read inspiration
4. `gh issue list`
5. `gh pr list`
6. read yesterday reflection

Patch adds two lines between steps 4 and 5:

```markdown
4.5. **Check ZOE inbox** - run `/inbox count`. If unread > 0, surface count and offer `/inbox research all` (require user "yes" before firing - inbox-research can write a research doc per item, big change).
4.6. **Check overnight inbox digest** - if a `claude/inbox-digest-YYYY-MM-DD` PR exists for today, surface it in the brief as "ZOE overnight digest ready for review."
```

Brief output gets one extra line:
```
**ZOE inbox:** [N unread] · [overnight digest: PR #M | none]
```

## Claude Routine Definition (Doc 422 link)

Per Doc 422 migration order, `/morning` is item #1 and `/inbox` is item #2 in the queue. Both will eventually run as Claude Routines (Anthropic cloud, 15 runs/day on Max plan).

Recommended schedule:

| Routine | Cadence | Output |
|---|---|---|
| `zao-morning-brief` | Daily 6:00 ET | Writes `docs/daily-briefs/YYYY-MM-DD.md`, opens PR `claude/morning-brief-YYYY-MM-DD`. Local `/morning` reads this. |
| `zao-inbox-digest` | Daily 6:30 ET (30min after morning brief, so brief can reference it) | Runs `/inbox research all`, writes `research/events/<next>-inbox-digest-YYYY-MM-DD/README.md`, opens PR. |
| `zao-reflection-prompt` | Daily 21:00 ET | Composes "what worked / surprised / message to tomorrow" prompt, sends via Telegram to ZOE. |

Connectors per routine (do NOT attach all):
- `zao-morning-brief`: GitHub, Linear (if used), Telegram
- `zao-inbox-digest`: GitHub, AgentMail (via REST in skill), Gmail MCP (for backfill searches), exa, WebSearch
- `zao-reflection-prompt`: Telegram only

Network mode: `full network` for all three (need Neynar, AgentMail, exa).

## Sources

- [Anthropic Gmail MCP issue #36547 - modify-labels gap](https://github.com/anthropics/claude-code/issues/36547)
- [Anthropic Gmail MCP issue #51790 - gmail.modify scope blocked by Google](https://github.com/anthropics/claude-code/issues/51790)
- [Anthropic Gmail MCP issue #27567 - multi-account connector](https://github.com/anthropics/claude-code/issues/27567)
- [Gmail Help - automatically forward Gmail messages](https://support.google.com/mail/answer/10957)
- [Gmail Help - create rules to filter your emails](https://support.google.com/mail/answer/6579)
- [Gmail API - manage email forwarding](https://developers.google.com/workspace/gmail/api/guides/forwarding_settings)
- [AgentMail webhooks overview](https://docs.agentmail.to/overview)
- [AgentMail inbound email patterns](https://www.agentmail.to/insights/inbound-email)
- [Doc 422 - Claude Routines automation stack (this project)](../422-claude-routines-zao-automation-stack/)
- [Doc 574 - inbox batch Apr 30 (proves /inbox flow works)](../../agents/574-inbox-apr30-agent-commerce-skills-stack/)
- [Doc 599 - inbox digest May 3 (latest /inbox output)](../../events/599-inbox-digest-2026-05-03/)

## Also See

- [Doc 422](../422-claude-routines-zao-automation-stack/) - The Routine framework these triggers run on
- [Doc 574](../../agents/574-inbox-apr30-agent-commerce-skills-stack/) - Prior /inbox digest output, proves flow
- [Doc 599](../../events/599-inbox-digest-2026-05-03/) - Latest /inbox digest output

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Set up Gmail filter: label `zoe-inbox` + forward to verified `zoe-zao@agentmail.to` (start with manual-label pattern) | @Zaal | Gmail config | Tonight |
| Patch `/inbox` skill SKILL.md security section to accept `Resent-From` / `X-Forwarded-For: zaalp99@gmail.com` in addition to direct `From:` | @Zaal (Claude) | Skill edit | Same PR as this doc |
| Patch `/morning` skill SKILL.md to add inbox count + digest-PR check | @Zaal (Claude) | Skill edit | Same PR as this doc |
| Verify Anthropic Gmail MCP auth still live; if not, run `mcp__claude_ai_Gmail__authenticate` and complete OAuth | @Zaal | One-time | Before next /morning |
| Stand up `zao-inbox-digest` Claude Routine per Doc 422 (cloud cron, 6:30 ET daily) | @Zaal | Routine setup | This week |
| Test the loop end-to-end: forward one email from phone -> wait for AgentMail receipt -> run `/inbox` locally -> confirm it appears | @Zaal | Manual smoke test | Day 1 |
| Decide if `to:zoe@bettercallzaal.com` alias makes sense as semantic forwarding address (cleaner than label-based filter) | @Zaal | Decision | Optional polish |

## Re-Validation (2026-05-21)

Verified against live codebase (2026-05-21):
- /inbox skill EXISTS and active
- /morning skill patches SHIPPED (PR #530, 2026-05-16)
- Gmail MCP confirmed available
- Status: CURRENT + NO BREAKING CHANGES
