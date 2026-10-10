---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-10
superseded-by:
related-docs: "technology/2278-ambient-voice-agent-interface, dev-workflows/803-local-ai-assistant-stack-raycast-ollama-siri, dev-workflows/165-claude-code-multi-session-management, agents/679-coworking-agent-mentions-code-pipeline, agents/2444-always-on-orchestrator, agents/2652-self-upgrade-shared-resources-ingest"
original-query: "https://www.reddit.com/r/claudeskills/s/wXMKJH2igl review this"
tier: STANDARD
---

# 2653 - Atticus: two transferable ideas for ZOE, and why we do not install it

> **Goal:** Decide what ZOE takes from Atticus (SaarthurR/atticus-mac, a Mac voice assistant that runs on `claude -p`): a pre-warmed `claude -p` over stream-json, and learned-shortcut graduation. Decide whether the app itself goes on the Mac.

> **Zaal's ruling (2026-10-10, zao-vault decisions/grill-2026-10-09-seat-morning.md item 45, vault commit ac70d25d, verified by the seat against the file):** "a sounds good for pnow lets focus on my zao things". Read as: A = this doc plus one board card; do NOT install Atticus on the Mac.

## Key Decisions

| # | Decision | Verdict | Why (evidence in the Findings section) |
|---|----------|---------|----------------------------------------|
| 1 | Pre-warmed `claude -p` over `--input-format stream-json` for ZOE | USE the idea for an interactive surface only; SKIP it for batch and loop work | The author measured one step at 3.3 s down to 1.9 s (about 1.4 s saved per ask). ZOE's fix and research runs take minutes, so a one-second saving is noise there. The saving matters only when a human is waiting on a hotkey or a reply. The spawn point in ZAO is `bot/src/hermes/claude-cli.ts:260`. |
| 2 | Learned-shortcut graduation for ZOE | USE it, as a reviewed table that a PR adds to, never as automatic learning | Atticus replays saved commands with no model call (5.5 s to 0.4 s, author's test). Its own code says the deny list is "not proof of safety" (`atticus.py:352`). ZAO's rules require outbound and spend actions to stay human-gated (`.claude/rules/agent-loops.md` rule 8), so a shortcut must exclude them by allowlist. See the comparison table. |
| 3 | Install Atticus on the Mac | SKIP | It runs Claude with `--permission-mode bypassPermissions` (`atticus.py:593`), its only hard limit is a prefix deny list (`atticus.py:104`), it holds Accessibility, Screen Recording and Automation (`Atticus.swift:634`, `:689-697`), and it pulls and rebuilds itself from its author's `main` every 6 hours with `autoUpdate` on by default (`Atticus.swift:20`, `:813-815`). The repo was created on 2026-10-10 (the day of this doc), has one contributor and 2 stars. |
| 4 | Clone or vendor any Atticus code into ZAOOS | SKIP for now | Ideas transfer; code does not need to. A reimplementation in `bot/src/zoe/` goes through the normal PR gate and keeps the ZAO safety rules. MIT would permit it, with attribution (see Credit). |
| 5 | Credit Atticus and the thinking-orbs source | DONE in this doc | The ideas are credited in the Credit section and must be credited again in any PR that builds on them (`.claude/rules/credit-attribution.md`). |

## Comparison: how ZOE could graduate a repeated successful tool trace

The question: when ZOE has run an ask that worked, can a repeat of the same ask skip the model? Four options.

| Option | How it works | Cost of a repeat | Latency (source) | Safety | Reviewable? | Verdict |
|--------|--------------|------------------|------------------|--------|-------------|---------|
| A. Atticus-style automatic learn | Save the exact commands after any success that had no error; replay by shell with no model (`atticus.py:363-392`) | Zero model turns | 5.5 s to 0.4 s (author's test, not reproduced) | Deny list only (`atticus.py:353`); a replay runs whatever was saved | Low: the app writes the file, nobody reads it | SKIP as written |
| B. Reviewed shortcut table | A success is proposed as a row (the ask, the command list, the trace id). A PR adds it. Replay goes only through an allowlist of verbs. Outbound and spend actions are excluded by type | Zero after merge; one PR review once | Same as A | Allowlist, not deny list; no curl with data, no rm, no outbound | High: a row is a diff | USE |
| C. Semantic cache of model answers | Match a new prompt to an old one by similarity and return the old answer | Near zero | Fast | Poor: a side-effect action returns a stale result and does nothing | Medium | SKIP |
| D. Status quo | Every repeat is a model turn | One turn per repeat. `.claude/rules/agent-spend.md` measured turns at about a dollar each (2026-08-10) | Model time every time | Unchanged | High | KEEP for anything not yet proven |

Option B is the only one that meets the rule in `.claude/rules/code-over-inference.md`: "Same judgment = a SCRIPT, written once, run free." The reviewed-PR path already exists for ZOE self-upgrades (`research/agents/2652-self-upgrade-shared-resources-ingest`, resolver said "no directory found" on this lane's index, but the directory is present on this branch).

## Findings

### 1. What Atticus is (measured this run)

- Repo `SaarthurR/atticus-mac`, created 2026-10-10T01:07:04Z, pushed 2026-10-10T06:22:56Z, 2 stars, 0 forks, 0 open issues (`gh api repos/SaarthurR/atticus-mac`, read this run).
- Licence: MIT, read from the LICENSE file (`Copyright (c) 2026 SaarthurR`), not from the API's licence field, per Hard Requirement 13.
- Size: `src/atticus.py` 886 lines (Python, standard library only); `src/Atticus.swift` 1149 lines (overlay, hotkey, on-device speech).
- Install: `curl -fsSL https://raw.githubusercontent.com/SaarthurR/atticus-mac/main/install.sh | bash` (README line 64). `install.sh` clones the repo to `~/.atticus` and runs `build.sh`, then opens the app.
- Requirements: macOS 26 and a paid Claude plan (README line 57).
- Snapshot delta: `zao-research-snapshot SaarthurR/atticus-mac` run twice, first look about 09:35Z and again this run. Output: "no numeric change" against the 2026-10-10 baseline. Second look is 0 days old, so the delta is not yet informative.
- Attribution in the code: `atticus.py:2` says the idea is from "Caleb Writes Code's 'Atticus'". The author of this repo is a different party (SaarthurR). Not fetched this run: UNVERIFIED who originated the name.

### 2. Idea 1: pre-warmed `claude -p` over stream-json

- The app starts `claude -p --input-format stream-json` at key-down and writes the request to stdin at key-up (`atticus.py:580-600`, `:787` `--wait`, `:792-793` reads the front app and the request from stdin).
- The start command carries `--model haiku --effort low --tools Bash,Read,WebSearch,WebFetch --permission-mode bypassPermissions --setting-sources '' --no-session-persistence --strict-mcp-config --disable-slash-commands --output-format stream-json --verbose` (`atticus.py:592-594`).
- The author's reported numbers (from the Reddit post, read from disk): one-step ask 3.3 s to 1.9 s; weather in Cupertino 10 s and five tool rounds down to 2.9 s and one round; "my last 97 asks used 13 cents' worth". These are author's test runs, not reproduced here.
- ZAO's current spawn point is `bot/src/hermes/claude-cli.ts:203-260`: `callClaudeCliInner` builds the args (`-p` at `:207`) and calls `spawn(process.env.HERMES_CLAUDE_BIN || 'claude', args, ...)` at `:260`. It spawns per call. Nothing pre-warms it.
- `bot/src/zoe/models/cli-cap-aware.ts:27` (`callClaudeCliCapAware`) wraps that spawn point for ZOE's callers.
- Why it is a small win for ZOE: the saving is one spawn, about one second per call (the author's number). ZOE's autonomous callers are background loops, so there is no human waiting at key-down. Pre-warm therefore helps only if a ZOE surface gets a hotkey-style or live reply. None is in the doc's scope.

### 3. Idea 2: learned-shortcut graduation

- Atticus saves an action when the model finished it and nothing errored (`atticus.py:363-376`, `learn()`): the saved commands must each start with an allowed action prefix (`act = (SHOW, PLACE, PLAY, TYPE, 'open ', 'osascript ')`, `:369`). The learner refuses deictic words such as "this" or "it" (`DEICTIC`, `:349`) and refuses any command containing a shortcut-forget token, `peekaboo`, or `make new` (`:366`, `:371`).
- `UNSAFE` (`atticus.py:353`) is a deny regex over `rm`, `sudo`, `curl`, `wget`, `find`, `mv`, `>`, `$(`, backticks and `git push`. Its own comment says "a deny list, not proof of safety" (`:352`).
- `replay()` (`atticus.py:385-392`) runs each saved command through `/bin/zsh -c` with a 20 s timeout and returns the saved reply on success; any failure hands the request back to the model.
- `skills.json` lives under the app's own directory and is never sent to the model (`atticus.py:346-347`).
- ZAO's nearest code: ZOE routes free text by prefix regexes in `bot/src/zoe/commands.ts:12-37` (`NOTE_PREFIX` at `:12`, `PLAN_PREFIX` at `:19`, `QUEUE_PREFIX` at `:22`, and others). A shortcut table would sit beside them as a lookup before the model call. No module named for shortcuts or replays appears in `bot/src/zoe/` (166 entries listed this run). Ten files in `bot/src/zoe/` contain the words "replay" or "shortcut" (grep this run); those ten were not opened, so "no learned-replay code exists in ZOE" is UNVERIFIED for those ten files.
- Cost tracking for a replay would attach to `bot/src/zoe/cost-ledger.ts:52` (`recordCall(caller, r)`), so a replayed ask records zero model cost and a saved-turn count.

### 4. Why Atticus is not installed (risks, traced from code)

- **Permissions.** `start_claude()` runs Claude with `--permission-mode bypassPermissions` (`atticus.py:593`). The only hard limit is `DENY`, a prefix list of `rm`, `rmdir`, `sudo`, `dd`, `diskutil`, `shutdown`, `reboot`, `halt`, `git push`, `srm`, `trash` (`atticus.py:104`). The source comment at `:103` reads "Full access: everything runs without asking, except these". Safe mode (default on, `atticus.py:586`) adds a sandbox and a PreToolUse gate, but see the next point.
- **Possible exfiltration path (TRACED FROM CODE, NOT RUN).** The model has `WebFetch` and `WebSearch` (`atticus.py:593`), so page content enters its context. `SAFE_OUT` (`atticus.py:109`) lists `curl *` as a command that runs outside the sandbox. The gate's `RISKY` list (`atticus.py:111-115`) asks only for POST, PUT, PATCH, DELETE or `-d`/`-F` style sends, and for `-o`/`-O` writes. A GET with a query string built from `$(cat file)` matches none of them, and `curl` is not in the `QUIET` skip list (`:116`), so the gate runs its regexes and finds nothing. Under this reading, an injected instruction could send a local file in a GET request with no prompt. The shortcut learner blocks `curl` (`:353`), but the live model path does not. Not run; a test would need a local listener.
- **Supply chain.** `Updater.check()` runs `git fetch`, `git pull --ff-only` and `./build.sh` in the source folder (`Atticus.swift:791-798`). It runs at launch plus 60 s, then every 6 hours (`:813-815`), and only when `autoUpdate` is true, which is the default (`:20`). The install itself is `curl | bash` from `main` (install.sh line 3, README line 64). So code from the author's `main` is built and run on the Mac without a human reading it.
- **OS privileges.** The app asks for Accessibility (`Atticus.swift:634`, `:689-690`), Screen Recording (`:693-697`) and Automation (`:634`, `auto` key). Screenshots are sent to the model when the words are about the screen (`atticus.py:789`).
- **Where it would run.** The Mac holds `~/.zao/private/` and every lane's working trees (per `.claude/rules/pii-hygiene.md` Rule 1 and `.claude/rules/handoff-discipline.md`). An app with bypassPermissions there sits next to the raw data the rules keep out of repos.
- **Terms.** The Anthropic consumer terms (fetched this run, `https://www.anthropic.com/legal/consumer-terms`, HTTP 200) say: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise." Read by keyword extraction, not in full: PARTIAL. Whether `claude -p` headless use on a subscription is "explicitly permitted" is UNVERIFIED against a primary source. See the UNVERIFIED section.

## ZAO grounding (where each idea would attach)

| Idea | Where it attaches in ZAO | Read this run |
|------|--------------------------|---------------|
| Pre-warm | `bot/src/hermes/claude-cli.ts:203-260` (spawn at `:260`); `bot/src/zoe/models/cli-cap-aware.ts:27` | Yes, these line ranges |
| Shortcut table | new module, proposed `bot/src/zoe/shortcuts.ts`, looked up before a call through the prefix routing in `bot/src/zoe/commands.ts:12-37` | Yes, `commands.ts` prefixes read by grep |
| Replay cost record | `bot/src/zoe/cost-ledger.ts:52` (`recordCall`) | Signature read by grep |
| Human gate for outbound | `.claude/rules/agent-loops.md` rule 8 | Yes |
| Measure before believing | `.claude/rules/code-over-inference.md` (the same judgment every time = a script); `.claude/rules/no-rm-rf.md` (no replay may delete; a shortcut that deletes is a deletion by proxy) | Yes, head of each file |
| Related prior docs | `technology/2278-ambient-voice-agent-interface` (title: "Ambient voice: build capture, not command"); `dev-workflows/803-local-ai-assistant-stack-raycast-ollama-siri`; `dev-workflows/165-claude-code-multi-session-management` (headless `-p` section, line 259-261); `dev-workflows/560-openwhisp-local-speech-to-text`; `music/327-open-source-speech-to-text-whisper-alternatives` (327 is ambiguous; this is the path); `agents/679-coworking-agent-mentions-code-pipeline`; `agents/2444-always-on-orchestrator` | Resolved with `zao-research-health --resolve` (2278, 803, 165, 679, 560, 2444 each resolved to one path; 327 is AMBIGUOUS, see path above) |

The 2278 doc's title already sets the direction for voice: "build capture, not command". A shortcut table makes repeated commands cheaper, but it does not make ZOE a voice-command surface. That keeps Atticus's core use case outside ZOE's current scope.

## Cost and policy notes

- `agents/679-coworking-agent-mentions-code-pipeline/README.md:51` says that from 2026-06-15 `claude -p` headless usage on Max and Pro moves to a monthly Agent SDK credit and then bills raw token cost. That is the 679 author's claim. This lane did not confirm it against a primary Anthropic source (the consumer terms page fetched this run does not mention the Agent SDK credit). UNVERIFIED here.
- If that 679 claim holds, every repeat ZOE avoids is money saved, which makes Option B more valuable. If it does not, Option B still saves time and the same safety argument holds.

## UNVERIFIED

1. Whether an always-on third-party app on a claude.ai Pro or Max login is permitted (consumer terms are silent on it; keyword extraction only). Next action below.
2. The author's timing numbers (3.3 s to 1.9 s; 5.5 s to 0.4 s; 10 s to 2.9 s; 97 asks for 13 cents). Reported by the author; not reproduced.
3. The exfiltration path in Finding 4. Traced from code, not run.
4. Whether `claude -p` headless is "explicitly permitted" under the subscription terms.
5. Caleb Writes Code as the origin of the name "Atticus" (the code says so at `atticus.py:2`; not fetched).
6. RESOLVED by the seat 2026-10-10: the decision note exists at zao-vault decisions/grill-2026-10-09-seat-morning.md item 45 (vault commit ac70d25d) and the quote above matches it.
7. RESOLVED by the seat 2026-10-10: `grep -rn -i replay bot/src/zoe --include='*.ts'` outside tests hits `receipt-envelope.ts:18,19,159` (receipt replay detection), `golden-eval.ts:5,17,94` (re-running golden cases), `board-command-executor.ts:94,226-228` (idempotency guard) and `bonfire-retry.ts:5` (queue replay on recovery). None saves a successful command list for later replay, so no learned-command code exists in `bot/src/zoe/` as of this grep.
8. Whether `research/agents/2652-self-upgrade-shared-resources-ingest` resolves in the canonical resolver. It exists on this branch; the resolver reported "no directory found" for 2652 on this lane.

## Also See

- [technology/2278-ambient-voice-agent-interface](../../technology/2278-ambient-voice-agent-interface/)
- [dev-workflows/803-local-ai-assistant-stack-raycast-ollama-siri](../../dev-workflows/803-local-ai-assistant-stack-raycast-ollama-siri/)
- [dev-workflows/165-claude-code-multi-session-management](../../dev-workflows/165-claude-code-multi-session-management/)
- [agents/679-coworking-agent-mentions-code-pipeline](../679-coworking-agent-mentions-code-pipeline/)
- [agents/2444-always-on-orchestrator](../2444-always-on-orchestrator/)
- [agents/2652-self-upgrade-shared-resources-ingest](../2652-self-upgrade-shared-resources-ingest/)
- Board card 10332 (research-doc:2653), created 2026-10-10 by `zao-tracker research`.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Leave Atticus uninstalled on the Mac; no clone of atticus-mac under `~/` or `~/.zao/` (shipped when `ls ~/.atticus` returns nothing and no Atticus.app is in `~/Applications`) | Zaal | Decision | 2026-10-10 |
| Board card 10332 exists for the ZOE graduation idea (shipped when `zao-tracker list --source "research-doc:2653"` returns it) | Zaal | Board | 2026-10-13 |
| Design PR for a ZOE shortcut table: names `bot/src/zoe/shortcuts.ts`, the write rule (saved only after a verified success, never outbound or spend), the allowlist, and a test where a shortcut must NOT replay (shipped when that PR is open against main with the test in it) | Zaal | PR | 2026-10-24 |
| Email Anthropic support to resolve UNVERIFIED item 1 and item 4 in writing; the answer goes into this doc as a dated follow-up (shipped when the reply is pasted here with its date). Zaal sends it; no lane sends outbound mail | Zaal | Ask | 2026-10-17 |
| Pre-warm prototype only if a ZOE surface gets a live reply: flag-gated change in `bot/src/hermes/claude-cli.ts`, measured on three runs before and three after (shipped when the PR body carries the six timings) | Zaal | PR | 2026-10-31 |
| Re-run `zao-research-snapshot SaarthurR/atticus-mac` on 2026-10-17 and record the delta here (shipped when the delta line is appended to this doc) | Zaal | Research | 2026-10-17 |

## Sources

- [Reddit r/claudeskills post 1x26i2p, "I built a voice assistant that runs your entire Mac on claude -p, no API key, and it learns its own shortcuts"](https://www.reddit.com/r/claudeskills/comments/1x26i2p/.rss) - FULL. METHOD: Atom feed fetched earlier this session by the lane lead (HTML page and mirrors bot-walled), read from disk this run. The post body contains cross-posting drafts for other subreddits; they are not reproduced here.
- [SaarthurR/atticus-mac README](https://github.com/SaarthurR/atticus-mac) - FULL. METHOD: `gh api repos/SaarthurR/atticus-mac/contents/README.md`, read from disk.
- [SaarthurR/atticus-mac src/atticus.py](https://github.com/SaarthurR/atticus-mac/blob/main/src/atticus.py) - FULL. METHOD: `gh api` contents, read from disk; line numbers confirmed this run by `grep -n`.
- [SaarthurR/atticus-mac src/Atticus.swift](https://github.com/SaarthurR/atticus-mac/blob/main/src/Atticus.swift) - FULL for the lines cited (`:20`, `:634`, `:689-697`, `:772-818`). METHOD: `gh api` contents, read from disk.
- [SaarthurR/atticus-mac install.sh](https://github.com/SaarthurR/atticus-mac/blob/main/install.sh) - FULL. METHOD: `gh api` contents, read from disk.
- [SaarthurR/atticus-mac LICENSE](https://github.com/SaarthurR/atticus-mac/blob/main/LICENSE) - FULL (MIT, read from the file via `gh api contents`, not the licence API field).
- [Anthropic consumer terms](https://www.anthropic.com/legal/consumer-terms) - PARTIAL. METHOD: `curl` with a browser user agent, HTML tags stripped, sentences matched by keyword (automated access, Agent SDK, claude -p, API key). The full page was not read as text; the Agent SDK and claude -p wording did not appear in the matched sentences.
- Repo metrics: `gh api repos/SaarthurR/atticus-mac` and `zao-research-snapshot SaarthurR/atticus-mac` - FULL (API output, this run).
- [thinking-orbs](https://github.com/Jakubantalik/thinking-orbs) - not fetched this run; credit taken from the Atticus README line 84 and line 88 (FULL for the README text, the repo itself PARTIAL/not fetched).
- ZAOOS internal: `agents/679-coworking-agent-mentions-code-pipeline/README.md` - PARTIAL (lines 49-58 read by grep and head). `dev-workflows/165-claude-code-multi-session-management/README.md` - PARTIAL (section 4, grep). `bot/src/hermes/claude-cli.ts`, `bot/src/zoe/commands.ts`, `bot/src/zoe/cost-ledger.ts`, `bot/src/zoe/models/cli-cap-aware.ts` - PARTIAL (lines read by grep and head). `.claude/rules/code-over-inference.md`, `.claude/rules/no-rm-rf.md` - FULL (head).
- Caleb Writes Code, "Atticus" - attribution in the code only (`atticus.py:2`); FAILED to fetch this run (not attempted as a separate source).

## Credit

- Atticus by SaarthurR, MIT, https://github.com/SaarthurR/atticus-mac. The `claude -p` pre-warm and the learned-shortcut pattern are credited to this repo. The name "Atticus" is credited in the code to Caleb Writes Code (`atticus.py:2`).
- thinking-orbs by Jakub Antalik, MIT, https://github.com/Jakubantalik/thinking-orbs, as the Atticus README states (lines 84 and 88).
- Any PR that builds on Idea 1 or Idea 2 carries this credit line and the MIT notice if code is copied (`.claude/rules/credit-attribution.md`).
