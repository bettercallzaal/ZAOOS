# PII Hygiene

Third-party personal data from connected services (Gmail, Calendar, Drive, GitHub) must not leak through commits, PR/commit text, chat, Bonfire episodes, or public artifacts. Sibling of `secret-hygiene.md`. Threat model and amendment history: `research/dev-workflows/2649-rules-history/archive/pii-hygiene.md`.

**Rule 1 - raw query output writes to `~/.zao/private/`**, never inside a repo working tree: `gmail-<query-slug>-<YYYYMMDD>.json`, `gcal-<calendar>-<YYYYMMDD>.json`, `gdrive-<folder-slug>-<YYYYMMDD>.json`, `github-<repo>-<query-slug>-<YYYYMMDD>.json`.

**Rule 2 - `.gitignore` blocks the leak path.** Keep these patterns: `**/.private/`, `**/private-queries/`, `**/.zao-private/`, `*.private.json`, `*.gmail.json`, `*.gcal.json`, `*.gdrive.json`, `*.contacts.json`, `.claude/.private/`, `.claude/private-queries/`.

**Rule 3 - where it is committed decides** (amended by Zaal 2026-09-01):

| Destination | Third-party contact data |
|---|---|
| `~/zao-vault` (private) | PERMITTED - the sanctioned home. Record a working contact list; do not accumulate one for its own sake. |
| ZAOOS `research/`, any public repo | BANNED (ZAOOS is public) |
| PR bodies, commit messages, issue text | BANNED |
| Chat, Telegram blocks, clipboard | BANNED unless Zaal asked for that item (Rule 4) |
| Bonfire episodes | BANNED |
| Anything outbound | BANNED |

Raw query dumps still go to `~/.zao/private/`, not the vault. For public destinations these patterns must not appear in staged content: email `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}` (allowlist below); US phone `\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b`; international phone `\+\d{1,3}\s*\d{6,}`; US street address `\d{1,5}\s+\w+\s+(St|Ave|Blvd|Rd|Dr|Ln|Way|Pl|Ct|Pkwy)\b`; full birthdate `\b(0?[1-9]|1[012])[-/](0?[1-9]|[12]\d|3[01])[-/](19|20)\d{2}\b`; credit-card-ish `\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b`; Telegram `@\w+` outside the allowlist. Redact to `<redacted-email>` / `@<redacted-handle>`.

- **Email allowlist:** `zaal@thezao.com`, `zaalp99@gmail.com`, `zaal@bettercallzaal.com`, `zoe-zao@agentmail.to`, `hello@thezao.com`, `support@thezao.com`, plus public role-emails of ZAO/BCZ entities (`contact@<zao-brand>.com`, `team@<zao-brand>.com`).
- **Telegram allowlist:** `@zaoclaw_bot`, `@zoe_hermes_bot`, `@zaodevz_bot`, `@zabal_bonfire`, `@ZAOstockTeamBot`, `@ZAOcoworkingBot`. A personal handle appears only if Zaal cleared it (e.g. a public team page or mentor list).
- **Venue allowlist (2026-09-06):** a commercial venue's own published address may appear when it is a business/public venue (never a residence), published by the venue or event (name the source), and recorded as where an event happened, not where a person lives. Cleared: 219 Bowery (TIME TO BE HAPPY Gallery), 327 Bowery (Bowery Palace), 300 Broome St (Heft Gallery), 91 Allen St (Cycol Gallery), 141 E Houston St (Solana / Skyline Tower), 247 W 30th St (American Whiskey), 48 E 23rd St (SPIN New York Flatiron). A private residence stays banned whoever published it.

**Rule 4 - chat defaults when querying a PII-bearing connection:** write the full raw response to `~/.zao/private/`; surface only the synthesized answer, redacted; never paste raw email bodies, attendee lists or contact data unless explicitly requested (ask before doing it a second time in a session); never put raw PII in a doc, memory, PR, commit, Bonfire episode or Telegram block without Zaal's go-ahead for that item. If he asks to save a raw response to a doc, redact first.

**Pre-flight before commit** on any branch that touched query output:
```bash
git diff --cached --name-only | grep -E '\.(gmail|gcal|gdrive|contacts|private)\.json$' && echo "BLOCK: private file staged" || echo "ok"
git diff --cached -G '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' --no-color | grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' | sort -u   # compare to allowlist
git diff --cached -G '\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b' --no-color | grep -oE '\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
```
If any check fires, abort, redact, re-stage, re-run.

**Bonfire:** episode bodies are natural-language summaries, never raw email or calendar dumps; never a counterparty's personal email, phone, home address, or unredacted handle. ZAO ecosystem people may be named; intro-call counterparties after Zaal confirms consent (explicit consent for public outputs).

**Skills:** `/meeting` sends any raw calendar attendee dump to `~/.zao/private/`, not `/tmp`. `/inbox` keeps synthesis in chat and raw bodies in AgentMail. Any new Gmail/GCal/GDrive querying skill declares its output path before first use.
