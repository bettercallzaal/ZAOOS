---
topic: business
type: guide
status: research-complete
last-validated: 2026-10-19
superseded-by:
related-docs: business/2648-baserooms-os-product-review, dev-workflows/659-zoe-posts-v2-voice-and-confirm-flow
original-query: "https://baserooms.io/ lets open the baserooms lane and then lets connect to the mcp for it" (Zaal, 2026-10-19, relayed by the orchestrator to the baserooms lane)
tier: QUICK
---

# 2687 - Connecting Base Rooms OS's MCP server: the safe path, the tool catalog sorted by risk, and what The ZAO should use it for

> **Goal:** Connect Zaal's Claude Code to `https://baserooms.io/mcp` without any key passing through an agent. Then record exactly what the server exposes, which tools only read and which write or move funds, and how The ZAO should use it.

**This is a follow-up to [doc 2648](../2648-baserooms-os-product-review/), not a second review.** Doc 2648 (2026-10-08, 29 loop ticks) covers who builds Base Rooms (@slavanova), the contracts, fees, the radio and the full pairing threat model (T1 to T12). This doc adds four things:

- the connect steps
- the 2026-10-19 tool catalog, re-measured
- the deltas since 2648
- a short ranked use list

All figures were measured on 2026-10-19 between about 21:05 and 21:20 UTC. Every fetch was a raw `curl` to baserooms.io. Nothing was signed, connected, minted or paired by this lane.

> **UPDATE 2026-10-19 evening: the connect path below does NOT work yet. Do not follow "How to connect".** Two things broke on first use. (1) Base Rooms' OAuth rejects Claude Code's redirect. (2) The server entry written by `claude mcp add` vanished twice from the Orca profile's `.claude.json`. See "2026-10-19 evening: what broke, and the setup that replaces it" below. Key Decisions 1 and 2 are SUPERSEDED by that section.

## Bottom line

1. **Zaal needs no mint.** He already holds Buddy #0252 (doc 2648 tick 20). A Base Rooms agent key is issued per Buddy.
2. **Connect with OAuth, not a pasted key, at `local` scope, with only the `tools` scope granted.** No key then exists in any file, terminal line or transcript. Only this lane's worktree loads the server, and the agent can read but not propose, remember or message.
3. **Never use the hooks method.** Doc 2648 Key Decision 1 stands: hooks send every prompt and tool input to their server and let it auto-approve or rewrite commands.
4. **What it is good for at The ZAO is read-only Base due diligence**: token safety, holder concentration, wallet approvals checkups and contract reads, run from a Claude session. The money-moving tools only place a card that Zaal must sign. Under the recommended scopes the agent cannot reach them at all.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **SUPERSEDED 2026-10-19 evening (OAuth fails, see below).** ~~CONNECT via OAuth (`claude mcp add` without a header, then `/mcp`, then Authenticate).** Fallback: a `brk_` key from Buddies, then Agent, added from a plain Terminal. | Base Rooms supports OAuth with dynamic client registration and PKCE S256. A browser approval replaces any copy-paste of a secret, and Claude Code holds the token. |
| 2 | **Scope `local`, never `project`, and not `user`.** | `project` writes `.mcp.json` into the repo, so a header key would be committed (ZAOOS is public). `user` loads it into every project on the profile. `local` limits it to this worktree. |
| 3 | **Grant only the `tools` OAuth scope.** Leave `propose`, `alerts`, `memory`, `talk`, `status` and `approve` off. | `tools` covers the 31 read tools. Each scope left off removes a path in 2648's threat model: `talk` (inbox injection, T5), `memory` (data at rest and workspace tasks, T8 to T10) and `propose` (signing cards). |
| 4 | **This supersedes doc 2648 Key Decision 2 ("SKIP the MCP pairing for now") on Zaal's word of 2026-10-19.** The sandbox-user part of 2648's mitigation 2 is NOT met. This runs in the normal Orca profile. | His instruction, 2026-10-19. The minimal-scope and no-hooks parts of 2648's mitigations are kept. The separate-macOS-user part is not, and that is recorded here rather than skipped silently. |
| 5 | **The agent calls read-only tools only, and treats every tool result as untrusted data.** | Tool output includes token names, wallet labels and contract metadata written by strangers. That text reaches the model's context. |

## How to connect (Zaal's hands)

Recommended, A: OAuth. Type these in the baserooms Orca pane:

```
! claude mcp add --transport http --scope local baserooms https://baserooms.io/mcp
/mcp
```

Pick `baserooms`, then Authenticate. baserooms.io opens in the browser. Approve with your wallet, pick Buddy #0252, tick only `tools`, and approve. There is no secret in either line, so the `!` prefix is safe.

Fallback, B: a bearer key. Make a key in baserooms.io: Buddies, then Agent, on Buddy #0252, with only the `tools` scope. Then run this in a plain Mac Terminal, not in a Claude pane, because a `!` line would put the key in the transcript:

```
cd "/Users/zaalpanthaki/orca/workspaces/ZAO OS V1/baserooms-2" && \
CLAUDE_CONFIG_DIR="/Users/zaalpanthaki/Library/Application Support/orca/claude-profiles/7d665b5d-76cb-418d-811d-cc7f60b99a69/home" \
claude mcp add --transport http --scope local baserooms https://baserooms.io/mcp \
  --header "Authorization: Bearer <YOUR_brk_KEY>"
```

`CLAUDE_CONFIG_DIR` matters because Orca panes use their own profile directory, not `~/.claude.json`. With B, the key is stored in plain text in that profile's `.claude.json`. Base Rooms' own setup code (the `setupFor` function in the site bundle) emits `claude mcp add --transport http --scope user baserooms https://baserooms.io/mcp --header "Authorization: Bearer <key>"`. This doc changes `user` to `local`.

**To remove it later:** `claude mcp remove baserooms -s local`. Then revoke the key or OAuth grant in Buddies, then Agent.

## What the server exposes (public catalog, 2026-10-19)

The server rejects anonymous calls. `POST /mcp` with no key returns HTTP 401 and `{"code":-32001,"message":"missing or malformed agent key (Authorization: Bearer brk_…)"}`, and `GET /mcp` returns 405. But the tool catalog is public at `/agent/tools?format=mcp`, with a `scopes` map. It lists **58 tools**. `/agent.md` documents **71**: those 58 plus 13 chat-only `prepare_*` tools (`prepare_swap`, `prepare_pay`, `prepare_multisend`, `prepare_launch`, `prepare_airdrop` and others). The `?set=chat` OpenAPI has 30 operations. Doc 2648 counted 64 in `/agent.md` and 53 in OpenAPI on 2026-10-08, so the surface grew in eleven days.

The authenticated `tools/list` is what actually counts. It is recorded in the section below once Zaal has connected.

| Class | Scope | Tools | What a call does |
|---|---|---|---|
| **READ** | `tools` (31) | token_safety, token_price, token_holders, token_search, token_chart, screener, market_pulse, gas, yields, earn_vaults, predict_odds, wallet_profile, wallet_positions, wallet_approvals, wallet_checkup, wallet_nfts, wallet_stats, explain_tx, decode_signature, scam_check, contract_read, basename, perps_markets, perps_positions, lend_market, earn_rewards, brtc_vault, ticket_status, skills_list, skill_use, buddy_care | Reads public chain or market data (DexScreener, GeckoTerminal, GoPlus, Blockscout, DefiLlama). Two exceptions inside `tools`: **buddy_care WRITES** pet state on their server, and **skill_use returns instructions** the agent is told to follow (2648 T9). This lane calls neither. |
| READ | `any` (2) | buddy_info, buddy_island | Reads the paired Buddy's own state |
| WRITES to their server | `status` (2) | buddy_status, buddy_log | Posts lines to the Buddy's desktop and activity feed |
| WRITES, and an injection path | `talk` (2) | buddy_inbox, buddy_reply | Inbox text is written by the owner and by other paired agents, then read by the model (2648 T5) |
| WRITES | `approve` (2) | buddy_request_approval, buddy_approval_status | An approval prompt on the Buddy |
| WRITES | `alerts` (2) | alert_create, alert_list | alert_create can attach a sell order that becomes a signing card when it fires |
| WRITES, stored off-site | `memory` (8) | memory_recall, memory_remember, memory_forget, workspace_board, workspace_task, workspace_task_update, workspace_task_comment, skill_draft | Notes and tasks on their server, shared with the owner's other Buddies' agents (2648 T8 to T10) |
| **MOVES FUNDS once signed** | `propose` (9) | propose_swap, propose_bridge, propose_revoke, propose_earn, propose_lend, propose_perp, propose_stake, propose_ticket, proposal_status | Puts a transaction card on the Buddy. Money moves only when Zaal signs in his wallet. Off limits to this lane. |
| MOVES FUNDS once signed | chat set only | 13 `prepare_*` | Same model: a card the owner confirms in their wallet |

**The design holds up on one point that matters:** no tool can sign. Every money path ends in Zaal's own wallet prompt (2648 section 5, and `/agent.md`: "You can't sign or send transactions for the owner").

## 2026-10-19 evening: what broke, and the setup that replaces it

### 1. Base Rooms' OAuth rejects Claude Code

Zaal ran path A. The browser page read "Can't connect this app. This redirect address isn't registered for this app." (his screenshot, 2026-10-19).

Measured cause:

- Claude Code identifies itself with a client-ID metadata document. `curl https://claude.ai/oauth/claude-code-client-metadata` returned `"redirect_uris":["http://localhost/callback","http://127.0.0.1/callback"]`, with no port.
- The authorize URL that Claude Code built (from the `mcp__baserooms__authenticate` tool, 2026-10-19) carried `redirect_uri=http%3A%2F%2Flocalhost%3A52675%2Fcallback`, a random local port.
- Base Rooms compares the two exactly, so the port makes them differ. RFC 8252 section 7.3 says an authorization server must allow any port on a loopback redirect. So this is a Base Rooms bug and only they can fix it.
- The same URL requested `scope=status talk approve tools propose alerts memory`, which is every scope. Even with the redirect fixed, Zaal would have to untick all but `tools` on the consent screen.

### 2. The `.claude.json` entry does not stay

- Zaal's first `claude mcp add --scope local` printed `[project: .../baserooms-2]`. A read of the file showed the entry stored under the main repo key `projects["/Users/zaalpanthaki/Documents/ZAO OS V1"]`, not under the worktree. So "local" scope here reaches every ZAOOS worktree on the profile.
- About 17:50 EDT `claude mcp get baserooms` returned `No MCP server named "baserooms"`.
- Zaal re-added it at 17:53. orchestrator2's 17:59:17 EDT snapshot showed it gone again, under every key.
- `pgrep -x claude` counted 20 processes on the Mac at 17:53.

What removes it is UNVERIFIED. The working guess is that concurrent sessions sharing one profile write the whole file back, and the last writer wins. This is escalated to the orchestrator as an estate-wide problem, because any setting in that file could revert the same way.

### 3. Do not paste keys into a Claude pane

On 2026-10-19 a live `brk_` key was pasted into this lane's chat as part of a `claude mcp add ... --scope user` line. That key is treated as exposed and must be revoked in Buddies, then Agent, then **Disconnect (revoke key)**. Its value is not reproduced anywhere in this doc.

### 4. The replacement setup (proposed, not yet run)

Keep the server definition out of `.claude.json`, and keep the key out of every file.

**Where the definition lives:** an UNTRACKED `.mcp.json` in the root of the one worktree that uses it. **Never commit it to ZAOOS.** The Claude Code MCP docs (`code.claude.com/docs/en/mcp.md`, fetched 2026-10-19) say project-scoped servers are loaded without the approval prompt in `claude -p` runs, Agent SDK sessions, and `bypassPermissions` sessions with `skipDangerousModePermissionPrompt`. A committed file would therefore wire a third-party server into this public repo's every headless and bypass session, ZOE's included. Even untracked, a `.mcp.json` reaches only the sessions started in that folder.

**Where the key lives:** the macOS Keychain, read at connect time by `headersHelper`. The same docs say `headersHelper` "run[s] the command and merges its output into the connection headers", "must write a JSON object of string key-value pairs to stdout", runs fresh on each connection, and is not cached. It needs the folder to be trusted first.

The docs also confirm that `.mcp.json` expands `${VAR}` in `url` and `headers` (their example: `"Authorization": "Bearer ${API_KEY}"`). Names outside Claude Code's protected credential set expand as written. An env var works, but on a Mac it ends up in a shell rc file, which is a file. The Keychain does not, so it is the recommendation.

Zaal's steps (his hands; settings edits stay his):

1. Revoke the exposed key, then make a NEW key on Buddy #0252 with only "baserooms.io tools: wallet, safety, prices" ticked.
2. In a plain Mac Terminal, run `security add-generic-password -a "$USER" -s baserooms-brk -w`. It prompts for the value, so the key never enters shell history. Paste the key at the prompt.
3. Create `.mcp.json` in the worktree root with:

```json
{
  "mcpServers": {
    "baserooms": {
      "type": "http",
      "url": "https://baserooms.io/mcp",
      "headersHelper": "printf '{\"Authorization\":\"Bearer %s\"}' \"$(security find-generic-password -a \"$USER\" -s baserooms-brk -w)\""
    }
  }
}
```

4. Start Claude in that folder and approve the `baserooms` project server when asked.

Checked so far: the `headersHelper` string, taken from the JSON block above and run through `sh` with a stub `security` that prints `STUBKEY`, printed `{"Authorization":"Bearer STUBKEY"}`, which parses as JSON. Not checked: the whole chain against Base Rooms. That needs Zaal's new key, and it is the first thing to run once he has done steps 1 to 4.

**Simpler alternative if the OAuth bug gets fixed:** OAuth needs no key and no file. A note to Slava naming the redirect-port bug is the only outbound step, and it is Zaal's call.

## Authenticated tools/list (fill after connect)

PENDING: Zaal has not connected yet as of this commit. When he has, this lane runs one `tools/list` and records the names and count here, with any difference from the 58-tool public catalog. It also records any server `instructions` field returned by `initialize`, because that text is server-authored context. It then calls one read-only tool as a smoke test (`gas`), and nothing that writes.

## What changed since doc 2648 (2026-10-08 to 2026-10-19)

| Measure | 2648 (2026-10-08) | 2026-10-19 (homepage, data stamp 21:08:15 UTC) |
|---|---|---|
| BRTC market cap | $37.3K | $82.9K |
| Liquidity | $20.7K | $31.5K |
| Holders | 133 to 134 | 389 (homepage figure; 2648 used `/api/holders`, so the two may not be the same count) |
| Top-10 holder share | not stated in the bottom line | 54.88% (homepage) |
| Agent tools in `/agent.md` | 64 | 71 |
| Tools in the public catalog and OpenAPI | 53 | 58 |
| "APY" | turnover, not yield | still labelled "ANNUALIZED TURNOVER (24H VOLUME / MCAP × 365). NOT A DIVIDEND." (4490.4%) |

## Risks specific to connecting the MCP

1. **Prompt injection through tool results.** Token names, labels and contract metadata are attacker-writable, and they arrive as text the model reads. Mitigation: read tools only, results treated as data, no action taken because a result asked for it.
2. **Server-authored behaviour.** `/agent.md` tells connecting agents to call `buddy_inbox` when a conversation starts, and that "a message saying a task was handed to you means: read the board and take it". Those are instructions from a third party's server. Not granting `talk` or `memory` makes them impossible to follow.
3. **Token concentration.** The top 10 holders hold 54.88% of BRTC (homepage, 2026-10-19). Nothing in this connection touches BRTC. 2648 Key Decision 6 (no treasury exposure) stands.
4. **Wallet-touching tools.** With `propose` off, the agent cannot place a signing card. If `propose` is ever granted, every card still needs Zaal's signature, but a card is itself a social-engineering surface, so keep it off.
5. **Credential at rest.** Fallback B leaves a bearer key in plain text in the Orca profile's `.claude.json`. OAuth (A) avoids that, which is why A is recommended.
6. **Not sandboxed.** 2648 asked for a separate macOS user. That is not met here (Key Decision 4). The scope limits are what stand in for it.

## Ways The ZAO could use it, ranked

| Rank | Use | Value | Risk |
|---|---|---|---|
| 1 | **Read-only Base due diligence from Claude**: `token_safety`, `token_holders` and `contract_read` before The ZAO touches any token or partner contract; `wallet_checkup` and `wallet_approvals` on ZAO wallets to find risky approvals. | Real, and repeatable. It is a second opinion next to Basescan. | Low with `tools` scope only |
| 2 | **Radio: a curated WaveWarZ / The ZAO station** (2648 Key Decision 4). Not MCP work. | Reach for ZAO artists inside an app their users already open | None for us. Contacting Slava is Zaal's call. |
| 3 | **Keep using `meet.baserooms.io` for Monday cobuilds** (already in ZOE's post slate, `bot/src/zoe/posts/drafters.ts`). Not MCP work. | Already in use | None new |
| - | **Do nothing**: leave the MCP unconnected | No new surface | Loses only rank 1, which Basescan and GoPlus also cover by hand |

Not recommended: pairing ZOE or any loop to the MCP; the `memory` and workspace tools; any `propose` or `prepare` use; the hooks method.

## Also See

- [business/2648 Base Rooms OS product review](../2648-baserooms-os-product-review/) - the full review and threat model this doc builds on
- [dev-workflows/659 ZOE posts v2](../../dev-workflows/659-zoe-posts-v2-voice-and-confirm-flow/) - where `meet.baserooms.io/zaal` entered ZOE's posts

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| ~~Run connect path A (or B)~~ SUPERSEDED: revoke the pasted key; done when Buddies, then Agent, shows it disconnected | Zaal | Security | 2026-10-19 |
| Run the Keychain + untracked `.mcp.json` setup (section 4 above); done when Zaal tells the baserooms lane "added" | Zaal | Setup | 2026-10-21 |
| Decide whether to tell Slava about the OAuth redirect-port bug (RFC 8252 section 7.3); done when Zaal says yes or no | Zaal | Decision | 2026-10-22 |
| Root-cause the vanishing `.claude.json` entries; done when the orchestrator names the writer or rules it out | orchestrator2 | Investigate | 2026-10-21 |
| Record the authenticated `tools/list`, the `initialize` instructions and one `gas` smoke test in the PENDING section; done when that follow-up PR is open | baserooms lane | Re-research | same day as connect |
| If the connection is not wanted after a week, `claude mcp remove baserooms -s local` and revoke the grant in Buddies, then Agent; done when both are gone | Zaal | Cleanup | 2026-10-26 |

## Sources

All fetched 2026-10-19 with `curl` and a browser User-Agent. Raw text, no WebFetch summaries.

| URL | Method | Result |
|---|---|---|
| https://baserooms.io/ | curl, HTML stripped to text | FULL (190,389 bytes): token figures, "AI AGENT / PAIR IT", X and Telegram links |
| https://baserooms.io/mcp | curl GET and POST `initialize` | FULL: 405 on GET; 401 with `-32001 missing or malformed agent key` on POST |
| https://baserooms.io/agent.md | curl | FULL (24,019 bytes): connect methods, key origin "Base Rooms OS, then Buddies, then Agent", 71 tools |
| https://baserooms.io/agent/tools?format=mcp | curl, parsed JSON | FULL: 58 tools plus the `scopes` map |
| https://baserooms.io/agent/tools?format=openai | curl | FULL: 58 tools |
| https://baserooms.io/agent/openapi.json and `?set=chat` | curl | FULL: 58 and 30 operations |
| https://baserooms.io/.well-known/oauth-protected-resource | curl | FULL: scopes status, talk, approve, tools, propose, alerts, memory |
| https://baserooms.io/.well-known/oauth-authorization-server | curl | FULL: DCR at `/oauth/register`, PKCE S256, refresh tokens |
| baserooms.io site bundle (177 `_next/static` chunks) | curl, then searched | FULL: the `setupFor` function holding the `claude mcp add` line; Buddy mint tiers |
| https://baserooms.io/llms.txt, /docs, /.well-known/mcp.json, /robots.txt | curl | 404 each |
| https://claude.ai/oauth/claude-code-client-metadata | curl | FULL: redirect_uris localhost and 127.0.0.1 `/callback`, no port |
| https://code.claude.com/docs/en/mcp.md | curl (raw markdown, 122,889 bytes) | FULL: `${VAR}` expansion in url and headers, `headersHelper`, project-server approval rules |
| https://api.fxtwitter.com/baserooms | curl | FAILED: `{"code":404,"message":"User not found"}`. 2648 read the same handle on 2026-10-08 (352 followers), so the account may have been renamed or removed. UNVERIFIED which. |
