---
topic: dev-workflows
type: incident-postmortem
status: research-complete
last-validated: 2026-08-13
superseded-by:
related-docs: 820, 824, 2262
original-query: "ITEM 2 - issue #1287, reddit OAuth for zao-fetch-reddit. This bit us twice today: all 7 Redlib instances failed and the .json route returns HTML. Either get a working OAuth path with a real fetch proving it, or write the honest finding that it cannot work unattended plus the alternative. Credentials stay Zaal's - prepare the config, never invent a key. PR-only."
tier: STANDARD
---

# 2273 - The reddit fix existed for a month, named like a backup

> **Goal:** Close issue #1287, and record why a finished fix stayed invisible for a month so the next one does not.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **v4 is promoted to the live path** (`zaal-dotfiles` PR #34), not rewritten. | It already existed and was correct. Rewriting it would have been duplicate work on a fix that was sitting in the repo the whole time. |
| 2 | **OAuth is the durable path and it CAN run unattended** - once registered. | A `script` app with `grant_type=client_credentials` is the userless flow: no password, no refresh token, no expiry to babysit. That is what makes it cron-viable. |
| 3 | **The one remaining step is Zaal's and cannot be delegated.** | Registering the app requires his reddit login. Two minutes, one time. No credential was invented or stored. |
| 4 | **The browse route is the interim, and it is proven.** | Verified on three threads on 2026-08-12 when every other path failed. It needs no credential at all. |
| 5 | **A file named `*.bak-*` will never be read as the newer version.** | This is the actual lesson and it generalises past reddit. |

## What happened

Issue #1287 (opened 2026-07-12, still open) says:

> Durable fix: `zao-fetch-reddit.sh` is already rewritten to v4 (OAuth-first, redlib fallback). Just needs a one-time reddit script app.

The file on disk was **v3**. Its header line read `no API key, no OAuth, no env`, and the only two matches for `oauth` in the whole script were comments explaining why it deliberately avoided OAuth. `~/bin` is a symlink into `zaal-dotfiles/bin`, so there was exactly one live copy and it was the old one.

Both statements were true at once. v4 **was** written on 2026-07-12. It was saved as:

```
bin/zao-fetch-reddit.sh.bak-redlib
```

inside a stash of untracked files (commit `ebee793`). The suffix reads as *a backup of the redlib version* - the thing you keep when you replace something. In fact it was the replacement. Anyone grepping for a v4 skipped it, because the filename said "old".

It was found by `git log --all -S "REDDIT_CLIENT_ID"`, which returned two commits, and then by reading the first eight lines of the file the stash contained:

```
# zao-fetch-reddit.sh (v4) - Fetch a Reddit thread. OAuth-first, redlib fallback.
```

## The cost

Two lanes hit the wall on 2026-08-12 and each spent about an hour on it. The failure looked like an IP block, because that is exactly what it looks like: `zao-fetch-reddit.sh` reported `no Redlib instance returned the thread (tried 7)` and a plain `curl` of `.json` returned HTML. Neither symptom hints that a working alternative is sitting in the same repo.

`agent-loops.md` rule 3 says read live code before building, because "usually 'build X' is really 'X exists, wire the last 10%'." This is the sharper case: X existed, was complete, and was **named so that reading the live code would not find it.**

## What was measured, 2026-08-13

Every claim here is a fetch made from this machine tonight.

| Path | Result | What it means |
|---|---|---|
| `www.reddit.com/api/v1/access_token` | **HTTP 401**, `application/json` | Reachable and behaving correctly. Invalid creds are rejected properly. **Not** network-blocked |
| `oauth.reddit.com/r/<sub>/hot` | **HTTP 403**, `text/html` "Blocked" page | Network policy. Identical response with no auth header, with a malformed bearer, and with a browser UA - so it is the policy, not UA sniffing |
| `reddit.com/r/<sub>/hot.json` | `content-type: text/html` | Walled, as hit twice on 2026-08-12 |
| redlib | **0 of 3** sampled instances returned HTTP 200 | The v3 path is dead, confirmed rather than assumed |

The block page's own text names the remedy:

> Your request has been blocked due to a network policy. [...] If you're running a script or application, please register or sign in with your developer credentials here. Additionally make sure your User-Agent is not empty and is something unique and descriptive.

## What is NOT proven, stated plainly

**That a valid token clears the 403.** It cannot be tested without a real credential, and until one exists reddit cannot distinguish this machine from any anonymous script - so the 403 is expected either way. Reddit's own block page pointing at developer credentials is strong evidence. It is not proof.

This is written into the script header and the PR body rather than left implicit, so nobody inherits "OAuth works" as a settled fact. If `--selftest` still shows a 403 with a valid token, that belongs on #1287.

## The answer to "can it work unattended"

**Yes, after one attended step.** The distinction the brief asked for:

- **Registration is attended and cannot be delegated.** It needs Zaal's reddit login. No agent should have it, and no key may be invented.
- **Operation is unattended.** `client_credentials` on a script app issues a userless token with no password and no refresh cycle. A cron or an overnight lane can hold it.

So OAuth does not fail the unattended test. It has a one-time human gate, which is a different and much smaller problem than the one the brief hedged against.

## The interim that already works

Proven on 2026-08-12 across three threads (`1vlm3t1`, `1vmgubd`, `1vmpplr`) when redlib, `.json`, and `old.reddit.com` all failed:

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B goto "https://www.reddit.com/r/<sub>/comments/<id>/"      # banks the JS-challenge cookie
$B goto "https://www.reddit.com/r/<sub>/comments/<id>.json"  # same session -> real JSON
$B js "document.body.textContent" > /tmp/thread.raw
```

**The first `goto` is load-bearing.** Headless Chromium solves reddit's JS challenge and holds the cookie; the `.json` request then rides that session. Requesting `.json` first returns HTML. `old.reddit.com` bounces to a login wall and is not a fallback.

This needs no credential, so it is the right answer for any lane that hits the wall before setup happens. It is now printed in the script's own failure message.

## Changes made on top of v4

- **`--selftest`** reports every path's status in one command. Diagnosis was an hour twice; it is now one command.
- **`oauth.reddit.com` is queried bare first**, `.json` only as a fallback with a `content-type` check. v4 hardcoded the `.json` suffix, which is not documented for that host and could not be verified without creds.
- **Bad arguments exit 5** instead of falling through into the redlib loop.
- **The failure message names the browse route** instead of only saying "blocked".

## The lesson worth keeping

**Name a replacement for what it is, and delete-or-promote in the same commit.** The failure was not technical. v4 was good code that worked as designed. It was lost because:

1. It was saved under a name that means "superseded" (`.bak-redlib`).
2. It lived in a stash of untracked files rather than a branch or a PR, so no review surface ever showed it.
3. The issue asserted the work was done, which is true of the code and false of the deployment - `state-claims.md` rule 5, merged is not running, one rung earlier: **written is not installed.**

If a fix is finished, it belongs on a branch with a PR, under the real filename. If it is not ready, it belongs in a branch named for what it is. A stashed untracked file named like a backup is neither, and it is invisible to exactly the search that would find it.

## Also See

- [Doc 820](../820-reliable-inbox-url-fetching/) - the original fetch-reliability work
- [Doc 831](../831-keyless-forkable-fetch-trio/) - the keyless trio v3 belonged to. Note: v3's own header cites "Doc 824" for this, which is wrong - 824 is an events doc. Corrected here rather than propagated
- [Doc 822](../822-x-scraping-without-login/) and [Doc 823](../823-farcaster-fetch-haatz-free/) - the X and Farcaster siblings, both still working
- [Doc 2262](../../agents/2262-agent-link-multi-agent-coordination/) - the first of the r/claudeskills extractions this fetch path serves

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Register the reddit script app and set `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` via the setting-secrets skill. Shipped when `zao-fetch-reddit.sh --selftest` prints `oauth API: HTTP 200`. | @Zaal | Config | 2026-08-16 |
| Merge `zaal-dotfiles` PR #34 | @Zaal | PR | 2026-08-16 |
| Report the result on issue #1287 and close it - including if a valid token does NOT clear the 403, which is the outcome that must not be assumed away | @Zaal | Issue | 2026-08-16 |
| Sweep `zaal-dotfiles` for other `*.bak*` files that are actually newer than the live file | @Zaal | PR | 2026-08-20 |

## Sources

- `bettercallzaal/ZAOOS` issue **#1287** - **[FULL]** body read via `gh api`. Opened 2026-07-12, 0 comments, still open.
- `~/zaal-dotfiles/bin/zao-fetch-reddit.sh` (v3, live) and the v4 recovered from stash commit `ebee793` at `bin/zao-fetch-reddit.sh.bak-redlib` - **[FULL]** both read in full from disk, 160 lines for v4.
- Live HTTP probes against `www.reddit.com/api/v1/access_token`, `oauth.reddit.com`, `reddit.com/*.json`, and 3 redlib instances - **[FULL]** run 2026-08-13, status codes and content-types recorded above. Invalid credentials used deliberately for the token endpoint; no real key exists on this machine.
- Browse-route verification - **[FULL]** three reddit threads fetched 2026-08-12 by this method after all other paths failed.
- Reddit's block-page text - **[FULL]** quoted from the actual 1,522-byte response body, not from documentation.
