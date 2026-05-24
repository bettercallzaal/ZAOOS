# PII Hygiene

Rules for working with personal data from connected services (Gmail, Google Calendar, Google Drive, GitHub, etc.). Sibling to `secret-hygiene.md` - that file covers API keys / tokens / PEM blocks; this file covers personal contact data, calendar attendees, email bodies, and any third-party human information that surfaces through MCP queries.

Established 2026-05-23 when Zaal connected Gmail / GCal / Drive / GitHub MCP servers to Claude.

## Threat model

The risk is not credential theft (that's `secret-hygiene.md`). The risk is **leakage of third-party personal data** through:

1. **Git commit** - PII written into a research doc, recap, or memory file that lands on a public repo.
2. **PR description / commit message** - email addresses, attendee names, phone numbers pasted into commit text.
3. **Chat output** - Claude reads a 200-email batch and the raw bodies end up in a Telegram block or clipboard skill output that Zaal forwards somewhere.
4. **Bonfire / knowledge-graph episode** - episode body contains a real email or attendee name, gets POSTed to a graph that other agents can query.
5. **Public artifacts** - a synthesized "what people said about X" doc accidentally names individuals who did not consent to being quoted.

The blast radius is reputational + relational, not financial. The fix is **default-private**: query output stays off-repo, summaries omit names unless authorized, and the perimeter catches accidents before push.

## The perimeter (4 rules)

### Rule 1 - All raw query output writes to `~/.zao/private/`

Never write a raw Gmail thread, calendar event with attendees, Drive document, or GitHub private-repo content inside the repo working tree. The canonical off-repo location is:

```
~/.zao/private/
```

This mirrors the existing `~/.zao/` skill convention (`gpt-loop/`, `clipboard/`, `diarization-models/` all live there, all outside the repo).

Naming convention for dumps:

```
~/.zao/private/gmail-<query-slug>-<YYYYMMDD>.json
~/.zao/private/gcal-<calendar>-<YYYYMMDD>.json
~/.zao/private/gdrive-<folder-slug>-<YYYYMMDD>.json
~/.zao/private/github-<repo>-<query-slug>-<YYYYMMDD>.json
```

A dump file is re-readable across sessions for follow-up queries without re-hitting the API.

### Rule 2 - `.gitignore` blocks the leak path

These patterns are in `.gitignore` (verified 2026-05-23 commit):

```
**/.private/
**/private-queries/
**/.zao-private/
*.private.json
*.gmail.json
*.gcal.json
*.gdrive.json
*.contacts.json
.claude/.private/
.claude/private-queries/
```

If a query result ends up under the repo path by accident, it cannot be staged. Belt + suspenders for Rule 1.

### Rule 3 - PII patterns banned from any committed file

These regex patterns must not appear in any file staged for commit (research docs, memories, PR descriptions, commit messages, recap docs). Scan before push.

| Pattern | Regex | Notes |
|---------|-------|-------|
| Email address | `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` | Allowlist below |
| US phone | `\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b` | All formats |
| International phone | `\+\d{1,3}\s*\d{6,}` | Loose pattern |
| Street address (US) | `\d{1,5}\s+\w+\s+(St|Ave|Blvd|Rd|Dr|Ln|Way|Pl|Ct|Pkwy)\b` | Common suffixes |
| Full birthdate | `\b(0?[1-9]\|1[012])[-/](0?[1-9]\|[12]\d\|3[01])[-/](19\|20)\d{2}\b` | MM/DD/YYYY etc. |
| Credit-card-ish | `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b` | Luhn check separately if needed |
| Telegram handle | `@\w+` outside the project allowlist | See allowlist |

### Email allowlist (these may appear in commits)

The following email addresses are already public and may appear in research docs, recap docs, and commit messages without redaction:

```
zaal@thezao.com
zaalp99@gmail.com
zaal@bettercallzaal.com
zoe-zao@agentmail.to
hello@thezao.com
support@thezao.com
```

Public role-emails belonging to ZAO/BCZ entities (`contact@<zao-brand>.com`, `team@<zao-brand>.com`) may also appear. Personal emails of third parties (anyone NOT on this list) get redacted to `<redacted-email>` in any committed artifact.

### Telegram handle allowlist

The following Telegram handles are public ZAO bot identities and may appear unredacted:

```
@zaoclaw_bot
@zoe_hermes_bot
@zaodevz_bot
@zabal_bonfire
@ZAOstockTeamBot
@ZAOcoworkingBot
```

Personal Telegram handles (e.g. `@some_person`) belonging to third parties get redacted to `@<redacted-handle>` in committed artifacts unless that person's handle has been explicitly cleared by Zaal for inclusion (e.g. ZAO Devz public team page, ZABAL Games mentor list).

### Rule 4 - Default chat behavior when querying connected services

When Claude runs a query against Gmail, Google Calendar, Google Drive, or any other PII-bearing connection:

1. **Write the full raw response to `~/.zao/private/<service>-<slug>-<date>.json`** (Rule 1 location).
2. **Surface only the synthesized answer in chat** - the specific facts the query asked about, with personal data redacted per the allowlists.
3. **Never paste raw email bodies, attendee lists, or contact data into chat unless explicitly requested.** Even then, ask before doing so a second time in the same session - context-window leakage is a quieter version of the commit leak.
4. **Never include raw PII in any research doc, recap doc, memory file, PR description, commit message, Bonfire episode, or Telegram block** without an explicit go-ahead from Zaal for that specific item.

If Zaal asks "show me the raw response," surface it in chat (he sees it, no commit happens). If he then asks "save that to a doc," redact PII per Rule 3 before writing.

## Pre-flight checks (before commit)

Manual checklist - run before `git commit` on any branch that touched query output:

```bash
# 1. Confirm no private-data file is staged
git diff --cached --name-only | grep -E '\.(gmail|gcal|gdrive|contacts|private)\.json$' && echo "BLOCK: private file staged" || echo "ok"

# 2. Scan staged content for email addresses outside allowlist
git diff --cached -G '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' --no-color \
  | grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
  | sort -u

# Compare the output to the allowlist in this file. Any address not on the
# allowlist must be redacted before commit.

# 3. Scan staged content for phone numbers
git diff --cached -G '\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b' --no-color \
  | grep -oE '\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'

# 4. If any check fires, abort the commit. Redact, re-stage, re-run.
```

A pre-commit hook automating step 2+3 is a worthwhile follow-up (see Next Steps below). Until that ships, this is a manual discipline.

## Bonfire / knowledge-graph specifics

Bonfire episode bodies are searchable across all agents that read the graph. PII in an episode body is the highest-leakage case in the ZAO stack.

Rules:

- **Meeting recap Bonfire episodes** (per `/meeting` skill) - attendee names of ZAO ecosystem people are OK (Zaal, Iman, Tyler, etc.). Names of intro-call counterparties (e.g. Shriyash Soni) are OK after first explicit Zaal confirmation that they consent to graph inclusion (the act of choosing to write a recap = implicit consent for ZAO-internal graph use; explicit consent needed for public outputs).
- **Never** include a counterparty's personal email, personal phone, home address, or unredacted Telegram handle in a Bonfire episode body.
- **Never** dump raw email or calendar invite content into a Bonfire episode. Episode bodies are natural-language prose summaries, not data dumps.
- The `BonfireMemory` adapter in `hermes-orchestrator` (doc 734) already secret-scans for API keys / tokens. It does NOT currently scan for PII patterns. **Open follow-up:** add PII regex to the adapter's pre-POST scan.

## Skill defaults to update

The following skills currently have no PII default. They need a one-line "outputs to `~/.zao/private/` by default" update:

- `/meeting` - already writes meeting transcripts to `/tmp/` which is fine for transcription scratch; but any raw Google Calendar attendee dump must go to `~/.zao/private/` not `/tmp`.
- `/inbox` (zoe-zao AgentMail) - whitelisted sender chain limits inbound to forwards from Zaal, but the message bodies often contain third-party content. Synthesis goes in chat; raw stays in AgentMail itself (already off-repo by design).
- Future: any Gmail / GCal / GDrive querying skill must declare its output path before first use.

## Source

- Established 2026-05-23 in response to Zaal connecting Gmail / GCal / GDrive / GitHub MCP servers.
- Sibling to `.claude/rules/secret-hygiene.md` (API keys / tokens / PEM blocks).
- Allowlists above are the working set; update via PR when new public emails / bot handles enter the ZAO ecosystem.

## Next steps (deferred to follow-up PRs)

1. **Pre-commit hook** that runs the "Pre-flight checks" section automatically and aborts on any non-allowlisted PII match. Wire into `.husky/pre-commit` or `.claude/settings.json` PreToolUse on `Bash(git commit*)`.
2. **PII scanner in `BonfireMemory` adapter** (`hermes-orchestrator` doc 734) - extend the existing secret-scan regex list with the PII patterns from this file. Episodes containing matches get SKIPPED (same best-effort pattern as the secret scan).
3. **Allowlist file format** - if the allowlists grow past ~20 entries each, extract to `.claude/rules/pii-allowlist.yaml` and have skills read it directly.
