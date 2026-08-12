# Doc 2268 - T3 Code: an agent control surface, and the setting we already own

**Date:** 2026-08-12
**Question asked:** try `npx t3 connect` on the VPS, find out what T3 Code is, and
whether it is useful to ZAO.
**Short answer:** it is not nothing. It targets ZOE's weakest capability directly.
But before adopting it we should turn on the equivalent we already have and have
not enabled.

## What T3 Code is

An **agent harness control surface**. It runs a backend on a machine and lets you
drive the coding agents already installed there from a phone, a web app, or a
desktop app.

Quoting the repo README verbatim:

> T3 Code is an "agent harness control surface". It enables control of the agents
> on your machine with a best-in-class mobile app (iOS, Android), web app and
> Electron-based desktop app.
>
> Works with your subscriptions on Claude Code, Codex, Cursor, Grok Build, and
> OpenCode. If they're set up on your computer, T3 Code can control them.

Measured facts, not impressions:

| Fact | Value | Source |
|---|---|---|
| Repo | `pingdotgg/t3code` | `gh api repos/pingdotgg/t3code` |
| License | MIT | same |
| Stars | 18,337 | same |
| Created | 2026-02-08 | same |
| Last push | 2026-08-12T09:58Z, hours before this doc | same |
| npm latest | `t3@0.0.33`, published 2026-08-12T00:46Z | registry.npmjs.org/t3 |
| Maintainers | `t3dotgg`, `juliusmarminge` | same |
| Node required | `^22.16 \|\| ^23.11 \|\| >=24.10` | package engines |

Its dependency list tells you what it is more honestly than any marketing would:
`@anthropic-ai/claude-agent-sdk`, `@opencode-ai/sdk`, `node-pty`, `@pierre/diffs`,
`@effect/sql-sqlite-bun`. A terminal multiplexer and diff renderer wrapped around
other people's agent SDKs, with a mobile client on top.

The README is candid about maturity: "We are very very early in this project.
Expect bugs." and "We are (mostly) not accepting contributions yet."

## The VPS attempt: it does not run there, and should not

```
$ ssh vps 'cd /tmp && npx --yes t3@latest connect --help'
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 't3@0.0.33',
npm warn EBADENGINE   required: { node: '^22.16 || ^23.11 || >=24.10' },
npm warn EBADENGINE   current: { node: 'v20.20.2', npm: '10.8.2' }
EXIT=1
```

Confirmed as user `zaal` on the VPS, Node v20.20.2. Exit 1. (Hostname omitted - this repo is public.)

The engine gap is the surface reason. The better reason is architectural: T3 Code
controls the agents **on the machine it runs on**. The VPS runs the bot fleet, not
Zaal's coding agents. Even with Node upgraded, the VPS is the wrong host - this
belongs on the Mac or the Windows desktop, where the agents he wants to drive
actually live.

## Why it is genuinely interesting for ZAO

The single loudest standing complaint about ZOE is that Zaal cannot build from his
phone. `feedback_zoe_measured_by_telegram_build` records the measure in his words -
"can Zaal BUILD from the Telegram DM?" - and grades it **1/10**. Doc 2246 and the
three-surface split exist because questions were dying in terminal scrollback.

T3 Code is a mobile client for exactly that. It is not a new agent, and it does not
replace ZOE - it is a remote control for the Claude Code sessions already running
on his machines.

## Before adopting it: the thing we already own and have not switched on

`.claude/rules/session-boundaries.md` states:

> **Remote Control on** (`remoteControlAtStartup: true`, set 2026-08-09) so a named
> session is reachable from Zaal's phone.

That is not what the settings file says:

```
$ grep -rn "remoteControlAtStartup" ~/.claude/settings.json
418:  "remoteControlAtStartup": false,
```

**The rule asserts a value the file contradicts.** Claude Code's own Remote Control
covers a large part of what T3 Code offers, from the vendor whose subscription we
already pay for, with no third-party process holding the keys to every agent on the
machine.

Precise reading, because the distinction matters: `remoteControlAtStartup: false`
means it does not start automatically. It does not mean Remote Control is
unavailable - a session can still enable it. But the capability the rule describes
as on, by default, is off by default.

## Recommendation

1. **Flip `remoteControlAtStartup` to `true` and use it for a week.** It is one
   setting, it is first-party, and the rule already says this is the intent.
   Settings changes are Zaal-gated, so this is a recommendation, not a change.
2. **Correct `session-boundaries.md`** so it stops asserting a value that is not
   set. A rule that describes a state we are not in is worse than no rule.
3. **Revisit T3 Code after that week**, on the Mac or Windows desktop, never the
   VPS. Judge it on what Remote Control still cannot do. If the honest answer is
   "nothing much", that is a saved dependency.
4. **Do not put it on the VPS.** Wrong host, and it would need a Node major bump
   on the box that runs the bot fleet, for a tool that has nothing to control there.

## Security note, if it is ever adopted

T3 Code's whole function is remote control of local coding agents with your
credentials attached. That is a high-value surface: anything that can drive Claude
Code on the Mac can read and write every repo on it. Before install, settle where
the backend listens, how the mobile client authenticates, and whether it is exposed
beyond localhost. Not evaluated here - flagging the question, not answering it.

## Sources

All fetched 2026-08-12.

- `https://registry.npmjs.org/t3` - version, engines, dependencies, maintainers.
- `gh api repos/pingdotgg/t3code` - license, stars, timestamps.
- `gh api repos/pingdotgg/t3code/contents/README.md` - the quoted description.
- `ssh vps 'npx --yes t3@latest connect --help'` - the EBADENGINE failure, exit 1.
- `~/.claude/settings.json:418` - `remoteControlAtStartup: false`.
- `.claude/rules/session-boundaries.md` - the conflicting claim.

Method: registry and GitHub read as raw JSON via curl and `gh api`; the VPS command
run directly over ssh. Nothing here is from a summary.

Credit: T3 Code is by Theo (`t3dotgg`) and Julius Marminge at Ping Labs, MIT
licensed, at `github.com/pingdotgg/t3code`.
