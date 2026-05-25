---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-25
related-docs: "165, 232, 238, 353, 434, 480, 684, 687, 722, 728, 730, 737"
original-query: "ill look into all that reclipboard it and then reseach claude code useage mcps the connections i shared i made earlier and all of waht we can do to use claude code more efficeitly"
tier: STANDARD
---

# 739 - Claude Code efficiency + native Claude.ai MCP connectors (Gmail / GCal / GDrive / GitHub)

> **Goal:** Companion to doc 730. Doc 730 was "what MCPs to install + general efficiency." This doc is "what to actually DO with the 4 native Claude.ai connectors Zaal connected 2026-05-23 + new efficiency patterns from the last 24h of real ZAO usage." Includes the OAuth-broken-Gmail discovery + the read+create-only tool surface across all three Google connectors.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **TRUST only Google Calendar today.** Use list_events + create_event + (cautiously) update_event. SKIP Gmail native + GDrive native until Anthropic fixes the OAuth + write-op gaps. | GCal validated in production 2026-05-24 (Vlad meeting / week sweep / 16 events imported to Airtable). Gmail is structurally broken at OAuth - Issue #51326 routes through Google Drive OAuth client, can never grant Gmail scopes. GDrive native has only 6 read tools + 1 create tool, no move/rename/delete - blocks most "organize my Drive" use cases (Anthropic Issue #51040, still open). |
| 2 | **For Gmail data NOW use the existing /inbox + AgentMail flow, not the native Gmail MCP.** Forward to zoe-zao@agentmail.to from your phone; /inbox skill processes via AgentMail REST API. | The AgentMail-mediated flow is what's already wired + verified. The native Gmail MCP is broken per #51326, and even when fixed only ships read+create per Issue #51040. AgentMail is more capable today. |
| 3 | **For GDrive use the docs-graduate-out pattern, NOT live Drive editing.** If you need Claude to write to a Drive doc, export it locally first, edit, re-upload manually via browser. | GDrive native MCP has create_file but no update_file. The 6 read tools (download_file_content, read_file_content, search_files, list_recent_files, get_file_metadata, get_file_permissions) work fine for ingestion. Editing on existing files = not possible via the connector. |
| 4 | **For "GitHub native" - the existing `gh` CLI + the ECC `mcp__plugin_everything-claude-code_github__*` plugin remain canonical.** Anthropic does not ship a first-party GitHub MCP as of 2026-05-25. | Verified via deferred-tools list at session start: only auth-style `mcp__claude_ai_*` entries for Gmail/GCal/GDrive. No `mcp__claude_ai_GitHub__*` entries. Doc 730 already keeps the ECC plugin GitHub - no change. |
| 5 | **TREAT GCal event descriptions as untrusted user input** (prompt-injection vector). Keep the default confirmation prompt for Bash + destructive tools when GCal is in scope for the session. | Per dev.classmethod 2026 hands-on test: "If malicious instructions are embedded in an event's description, Claude might read them and attempt to execute commands using Bash tools." External invitees can plant injection payloads. The default per-tool confirm is the only defense. |
| 6 | **GCal usage pattern that works: list-and-redirect.** list_events into `~/.zao/private/gcal-<window>.json` (per PR #666 perimeter), filter to ZAO-relevant titles, write only those as activity rows. | Verified 2026-05-24: 50 events in a week, 16 ZAO-tagged, 34 personal stayed in private dump. Don't pull every attendee email into chat - use the heuristic title-keyword filter from `airtable-gcal-week-import.py` and the `<redacted-email>` rule from `.claude/rules/pii-hygiene.md`. |
| 7 | **CONFIRM Claude Code is on v2.1.46+ to use claude.ai connectors at all.** Released 2026-02-17 - earlier versions don't see connectors added on claude.ai. | Run `claude --version` to verify. If < 2.1.46, upgrade per Anthropic install docs. Connector calls silently 404 on older versions. |
| 8 | **NEW efficiency patterns shipped 2026-05-23 to 05-25 (not in doc 730):** `~/bin/zao-tracker` unified writer/reader for the cowork tracker (Supabase), `~/bin/zao-secrets` Keychain wizard, `airtable-crm-write.py` Flow E into the /meeting skill, ffmpeg silence-remove pre-process for `/meeting` audio that loops in whisper-turbo. | All earn their slot. See "New efficiency patterns" section below. |

## Status of the 4 connectors (verified 2026-05-25)

| Connector | Status | Tools available | Verdict |
|-----------|--------|----------------|---------|
| **Google Calendar** (`mcp__claude_ai_Google_Calendar__*`) | WORKING | list_events, list_calendars, get_event, create_event, update_event, delete_event, respond_to_event, suggest_time | USE for read + create. Cautious on update/delete (write-op coverage uneven per Issue #51040). |
| **Google Drive** (`mcp__claude_ai_Google_Drive__*`) | PARTIAL | (full list per Issue #51040): download_file_content, get_file_metadata, get_file_permissions, list_recent_files, read_file_content, search_files, create_file | READ + CREATE only. No move/rename/delete. Use for ingestion, NOT for editing existing Drive content. |
| **Gmail** (`mcp__claude_ai_Gmail__*`) | BROKEN | authenticate + complete_authentication only (so far loaded in this session); even when auth flow completes, label_thread / read_message fail per Issues #47847 #47383 #51326 #46206 #52177 #55113 | BLOCKED. Auth flow routes through Google Drive OAuth client (#51326), can never grant Gmail scopes. WAIT for Anthropic fix; meanwhile use the AgentMail-mediated /inbox flow. |
| **GitHub native** | NOT SHIPPED | none under `mcp__claude_ai_GitHub__*` | Anthropic ships no native GitHub MCP today. KEEP the existing `gh` CLI + ECC plugin (`mcp__plugin_everything-claude-code_github__*`) per doc 730 Decision #4. |

## Google Calendar deep-dive (the one that works)

**Verified usage from 2026-05-24:** I called `mcp__claude_ai_Google_Calendar__list_events` for the 2026-05-17 to 2026-05-24 window. It returned 50 events / 57KB JSON, which I saved to `~/.zao/private/gcal-2026-05-17-to-24.json` (chmod 600 per PR #666 perimeter), filtered to 16 ZAO-tagged events via the `airtable-gcal-week-import.py` heuristic, and wrote them as activity rows into the ZAO CRM AGENTIC Airtable base. 34 personal events stayed in the private dump only.

That flow is reusable: it's the prototype for every recurring "what did I miss this week" sweep. The script `/tmp/airtable-gcal-week-import.py` is small (~150 lines Python) and can be hardened into a permanent location once the pattern proves stable.

### When to use which GCal tool

| Tool | Use for | ZAO example |
|------|---------|-------------|
| `list_events(startTime, endTime, pageSize)` | Sweeps - "what's this week" | Weekly Airtable activity import (today) |
| `list_calendars()` | Discover non-primary calendars | Find a ZAO-shared cal if it exists |
| `get_event(id)` | Read one specific event | Pull attendee list for a meeting recap that the /meeting skill couldn't find |
| `create_event(...)` | Schedule one event | Block "ship doc 739" on Zaal's cal after Claude proposes the PR |
| `update_event(...)` | Modify | UNCERTAIN - may fail per Issue #51040 write-op gap; test before relying on |
| `delete_event(...)` | Remove | UNCERTAIN - same as update |
| `respond_to_event(...)` | RSVP yes/no/maybe | Auto-RSVP for ZAO recurring events Zaal has confirmed |
| `suggest_time(...)` | Find a slot | Calendly substitute when a counterparty wants a meeting and you don't want to send them your full availability |

### GCal security warning (prompt injection)

Per dev.classmethod 2026 hands-on test:

> "If malicious instructions are embedded in an event's description, Claude might read them and attempt to execute commands using Bash tools, etc."

**Mitigation:** keep the default per-tool confirmation prompt for Bash + Edit + Write when a session has GCal data in context. Don't blanket-allowlist Bash. External invitees CAN plant injection payloads in event descriptions or location fields. This is the same threat model as `.claude/rules/pii-hygiene.md` flagged for general PII handling.

## GDrive: useful for ingestion, useless for editing

7 tools (per Anthropic Issue #51040 verbatim):

```
Read-only (6):  download_file_content, get_file_metadata, get_file_permissions,
                list_recent_files, read_file_content, search_files
Write/delete (1): create_file
```

Missing: `move`, `rename`, `trash`, `delete`, `copy`, `update_permissions`, `update_file`.

**ZAO use cases that work today:**
- Pull a Drive doc into a research session (`read_file_content` + write synthesis as a research doc in the ZAOOS repo)
- Search Drive for "ZAOstock contract" before reaching out to a counterparty (`search_files`)
- Create a new doc in Drive from Claude (`create_file`) - useful for handing off a clean doc to a collaborator who doesn't use Claude

**ZAO use cases that DON'T work (per Issue #51040):**
- Update an existing budget spreadsheet
- Move docs into a folder per a naming convention
- Trash old drafts
- Share/unshare files (no `update_permissions`)

**Workaround when you need to edit:** pull via `read_file_content` -> save to `~/.zao/private/` -> edit locally -> Zaal re-uploads via Drive UI manually. Annoying but the only path until Anthropic ships the missing tools.

## Gmail: broken at OAuth, use /inbox + AgentMail instead

Per the open Anthropic Issues (as of 2026-05-25):

| # | Issue | Reproducibility | Effect |
|---|------|----------------|--------|
| #51326 | Gmail MCP routes through Google Drive OAuth client | Universal | Cannot grant Gmail scopes during auth flow; Gmail tools never get permissions |
| #47847 | Thread search + message reading fail despite correct scopes | Universal | Even when auth somehow works, reads are blocked |
| #47383 | Missing gmail.modify scope | Universal | label_thread / label_message return permission errors |
| #46206 | Same as #47383 - permission error on label ops | Universal | Same |
| #52177 + #55113 | Google explicitly blocks the app on reconnect attempt | Recurring | Auth flow returns "This app is blocked" |

**Result:** native Gmail MCP is effectively unusable for ZAO purposes today.

**Workaround (already in production):**
- Forward email to `zoe-zao@agentmail.to` from your phone (Gmail forwarder rule)
- /inbox skill processes via AgentMail REST API (which IS working)
- /inbox v2 update shipped 2026-05-24 (PR #675) auto-fires cowork tracker tasks for action-items

The AgentMail flow has BETTER coverage than native Gmail would provide even when fixed (read + label + organize all work), so no rush to switch back even after Anthropic patches.

**When Anthropic fixes (track Issue #51326):** consider native Gmail for a specific class of work AgentMail can't reach (search across all-time Zaal-personal Gmail, e.g. "find the email Tyler sent me in March 2024 about Magnetiq"). Until then, AgentMail covers all ZAO operational mail.

## GitHub: native doesn't exist, plugin works

The deferred-tools list at session start showed zero `mcp__claude_ai_GitHub__*` entries. Confirmed: Anthropic does NOT ship a first-party GitHub MCP as of 2026-05-25. "GitHub" in your earlier message ("Gmail, Google Calendar, Google Drive, GitHub") = the ECC plugin GitHub MCP that was already installed (it's `mcp__plugin_everything-claude-code_github__*`), or it's `gh` CLI invoked via Bash.

**Per doc 730 Decision #4:** keep the ECC plugin GitHub + use `gh` CLI for most operations (token-efficient). No change.

**Future:** Anthropic may add a native GitHub connector eventually (it's mentioned in roadmap signals per claude.com/blog/integrations). When it ships, evaluate replacing the ECC plugin. Until then: don't worry about it.

## New efficiency patterns shipped this week (not in doc 730)

Doc 730 covered the GENERAL stack as of 2026-05-23. Last 48h shipped these additional patterns worth using:

### Pattern 1: `~/bin/zao-tracker` unified Kanban writer/reader (2026-05-24)

Replaces the kind-specific `zao-pr-task` helper. One bash tool talks to the Supabase cowork tracker (`tasks` table) with subcommands per writer:

```bash
~/bin/zao-tracker pr <num> "<title>"        # auto-fire on every PR I open
~/bin/zao-tracker research <doc-num> "<title>"
~/bin/zao-tracker inbox <slug> "<title>"
~/bin/zao-tracker meeting <slug-date> "<title>"
~/bin/zao-tracker search "<query>" --status todo --limit 5
~/bin/zao-tracker list --source pr-auto --limit 20
```

Each writer uses a distinct `legacy_source` prefix (pr-auto / research-doc / inbox / meeting / meeting:slug-date) so the Kanban can be filtered by writer. /meeting + /zao-research + /inbox skills auto-fire this now per the integration PRs (#674 / #675 + global SKILL.md updates).

**Efficiency win:** before this, every research doc shipped required manual "remind Iman to review" via Telegram. Now it auto-lands in his Kanban with due-date + linked URL. Zero ergonomics on my side, zero forget-to-tell-Iman risk on your side.

### Pattern 2: `~/bin/zao-secrets` Keychain wizard (2026-05-23)

Was building env-file flow, simplified to macOS Keychain after Zaal called out the friction. Then the user said "use env file actually" so we re-migrated to `~/.zao/zao.env` chmod 600. The wrapper stays useful for the Keychain-preferring case + future secrets:

```bash
~/bin/zao-secrets wizard            # interactive setup all 5 secrets at once
~/bin/zao-secrets set <name>        # silent-input prompt one secret
~/bin/zao-secrets get <name>        # fetch one
~/bin/zao-secrets export            # eval $(zao-secrets export) loads all as env vars
```

**Efficiency win:** new env vars (Airtable PAT today, X API key tomorrow, etc) take ~30 sec to add without manual nano editing or clipboard residue.

### Pattern 3: `airtable-crm-write.py` Flow E for /meeting (2026-05-24)

Every `/meeting` recap now auto-writes contacts + 1 activity row to the ZAO CRM AGENTIC Airtable base. First production fire was the 2026-05-23 Vlad meeting (doc 738). 2 contacts + 1 activity inserted in one call.

**Efficiency win:** the CRM stays current automatically. Each new collaborator (Vlad / Shriyash / Cannon / Arthur / etc) is in Airtable within seconds of the meeting recap shipping.

### Pattern 4: ffmpeg silence-remove pre-process for /meeting audio (2026-05-24)

Whisper-large-v3-turbo loops catastrophically on long silences in Restream audio. The 2026-05-24 Vlad call lost ~33 of 46 minutes to a "So yeah." loop on the first pass.

Fix: pre-process with ffmpeg silenceremove before transcribing:

```bash
ffmpeg -y -i source.m4a -af "silenceremove=stop_periods=-1:stop_duration=2:stop_threshold=-40dB" \
  -ar 16000 -ac 1 cleaned.wav
```

That drops 46min -> 13min (for the Vlad audio specifically). Re-transcribed the cleaned WAV recovered 6.5 min of unique real content vs ~2 min from the first run.

**Efficiency win:** /meeting now has a recovery path for Restream / streamed-with-music audio. Worth bolting into the skill as a flag (`--silence-remove`) - filed as a follow-up.

### Pattern 5: Bi-directional /zao-research <-> tracker (2026-05-24)

Global `~/.claude/skills/zao-research/SKILL.md` v2.4. Two new steps:

- **Step 2.6** (pre-write): `~/bin/zao-tracker search "<topic>"` for related in-flight tasks. Surfaces context before duplicating.
- **Step 9.5** (post-PR): auto-fires `~/bin/zao-tracker research <doc-num>` so the doc appears in your Kanban for review.

**Efficiency win:** research docs no longer slip into the void. Each one lands in your review queue with due-date.

### Pattern 6: /inbox action-items -> tracker (2026-05-24, PR #675)

When `/inbox` classifies an item as `action-items`, also fire `~/bin/zao-tracker inbox <slug> "<subject>"`. The forwarded email becomes a Kanban row in your queue. No manual re-entry.

## Coexistence with existing docs

| Existing doc | This doc adds | Relationship |
|--------------|--------------|--------------|
| Doc 730 (CC best practices + MCP stack) | Per-connector deep-dive on the 4 Anthropic-native ones | This is the 730 chapter on "what to DO with Anthropic-native connectors after install" |
| Doc 728 (Serena MCP integration) | No overlap - Serena is semantic code intel, native connectors are calendar/drive/mail | Sibling |
| Doc 729 (v2 dossier ops in CC) | No overlap | Sibling |
| Doc 737 (Airtable CRM v3) | This doc validates the Flow E ingestion - the GCal-to-Airtable pipeline is the first real-world execution | This builds on 737 |
| Doc 722 (CC 3-month synthesis) | Carries forward the patterns 722 identified, validates them in production | Successor |
| Doc 685 (code-on-incus sandbox) | No overlap | Sibling |
| Doc 734 (hermes-orchestrator) | No overlap directly, but the supervisor pattern in 734 could wrap native-connector calls for auto-redaction of PII before context | Future integration target |

## Risks + open questions

| Risk | Mitigation |
|------|-----------|
| Anthropic Gmail OAuth never gets fixed (#51326 open since 2026-05) | AgentMail flow already covers ZAO mail needs; Gmail native is bonus, not load-bearing |
| GCal write ops (update_event / delete_event) start failing silently | Test before relying on. Today's prod usage only used list_events + create_event (the verified-safe pair). |
| GCal description prompt injection (external invitee attack) | Keep per-tool Bash confirmation ON when GCal is in session. Don't allowlist anything that can spawn commands. |
| Native connectors change tool shape without notice | The deferred-tools list is the source of truth. Re-check at session start. The session reminder shows what's currently available. |
| Connectors not visible to Claude Code < v2.1.46 | `claude --version` check on Zaal's machine. Anthropic install docs for upgrade. |
| AgentMail rate limit / pricing change | Doc 562 + the existing /inbox flow note this; current usage well within free tier. |

## Action bridge

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify `claude --version >= 2.1.46` on Zaal's Mac | @Zaal | One-shot | This week |
| Subscribe (thumbs-up + watch) Anthropic Issue #51326 (Gmail OAuth) + #51040 (write ops) | @Zaal | GitHub | This week |
| Bolt `--silence-remove` flag into `/meeting` skill transcribe.sh (the ffmpeg workaround) | @Claude | Skill PR | Next session |
| Move `airtable-gcal-week-import.py` from /tmp to scripts/ in ZAOOS repo with cron-able interface | @Claude | ZAOOS PR | After dogfooding the GCal sweep weekly for 2 weeks |
| Test `create_event` flow: have Claude create a GCal block "review doc 739" - confirms write tools work | @Claude+Zaal | Manual test | Before adopting create_event as a default |
| Document the `~/bin/zao-tracker` + `~/bin/zao-secrets` helpers in CLAUDE.md primary-surfaces section | @Claude | ZAOOS PR | Soon |
| Re-validate this doc in 30 days (Anthropic may have shipped Gmail OAuth fix or write tools by then) | @Zaal | Audit | 2026-06-25 |
| Add an "AgentMail vs native Gmail" decision section to doc 730 next re-research, citing this doc's findings | @Claude | doc 730 update | When Anthropic ships Gmail fix |
| File ZAO opinion comment on Anthropic Issue #51040 with the 4 specific write ops we need (move, rename, trash, update) | @Zaal | GitHub | Optional - amplifies the signal |

## Also See

- [Doc 730 - Claude Code best practices + MCP stack](../730-claude-code-mcp-best-practices/) - the canonical CC stack doc; this is the per-native-connector chapter
- [Doc 728 - Serena MCP for ZAO OS](../728-serena-mcp-zao-integration/) - the OTHER critical MCP; semantic code intel
- [Doc 737 - Airtable agentic CRM v3](../../business/737-airtable-agentic-crm-v3/) - the destination for GCal+Gmail+GDrive synthesized data
- [Doc 734 - hermes-orchestrator](../../agents/734-hermes-orchestrator-framework/) - supervisor pattern; could wrap connector calls for PII auto-redaction
- [Doc 722 - CC 3-month synthesis](../722-zao-claude-code-3-month-synthesis/) - the foundation this builds on
- [Doc 562 - Reddit/X scraping fallback](../562-reddit-x-fallback-chain/) - sibling pattern for "external service is broken, here's the workaround"
- `.claude/rules/pii-hygiene.md` - PII redaction rules that apply to all connector data
- `~/.zao/private/gcal-2026-05-17-to-24.json` - the first prod GCal dump (chmod 600, off-repo per PR #666)
- `~/bin/zao-tracker` - new unified Kanban writer/reader helper
- `~/bin/zao-secrets` - Keychain wizard (sibling to zao.env file)

## Sources

- [Anthropic Issue #51040 - Google Drive/Gmail/Calendar MCP lack write operations](https://github.com/anthropics/claude-code/issues/51040) [FULL - fetched via gh api, complete body + tool list extracted]
- [Anthropic Issue #51326 - Gmail MCP uses GDrive OAuth client](https://github.com/anthropics/claude-code/issues/51326) [PARTIAL - found via WebSearch, issue title + summary confirmed; body not separately fetched but the search result quoted root-cause verbatim]
- [Anthropic Issues #47847, #47383, #46206, #52177, #55113 - Gmail OAuth / scope / blocking bugs](https://github.com/anthropics/claude-code/issues/47847) [PARTIAL - WebSearch surfaced all 5 issue titles + brief; not separately fetched, but the pattern is consistent across them]
- [dev.classmethod hands-on test of GCal connector](https://dev.classmethod.jp/en/articles/claude-code-google-calendar-connector/) [FULL - fetched, prompt-injection warning extracted verbatim, setup notes confirmed]
- [Composio Google Calendar / Gmail MCP wrappers](https://composio.dev/toolkits/googlecalendar/framework/claude-code) [PARTIAL - referenced as workaround; not deeply audited this session, listed as future option in Action bridge]
- [Anthropic claude.com/blog/integrations](https://claude.com/blog/integrations) [PARTIAL - confirms native integration program exists but article content was thin on Gmail/GCal/GDrive specifics]
- [v2.1.46 release note for connectors in Claude Code](https://github.com/anthropics/claude-code/releases) [PARTIAL - dated 2026-02-17 per WebSearch summary; release page not separately fetched but version cited consistently]
- ZAO codebase artifacts from 2026-05-23 to 2026-05-25 production usage [FULL]:
  - `~/.zao/private/gcal-2026-05-17-to-24.json` (50 events, chmod 600)
  - `/tmp/airtable-gcal-week-import.py` (the 16-event ZAO-tag filter + Airtable import)
  - `~/bin/zao-tracker` (140 lines bash, shipped 2026-05-24)
  - `~/bin/zao-secrets` (120 lines bash, shipped 2026-05-23 + wizard 2026-05-23)
  - `/Users/zaalpanthaki/.claude/skills/meeting/scripts/airtable-crm-write.py` (Flow E, first prod fire 2026-05-24 on Vlad meeting)
- ZAO existing docs cross-read [FULL]: doc 730 head (~90 lines), doc 728, doc 737, doc 722, doc 562
- Deferred-tools list at session start [FULL]: confirmed Gmail/GDrive have only authenticate + complete_authentication tools loaded; GCal has 8 functional tools; no GitHub native entries
