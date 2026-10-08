---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: "agents/2212-zao-sovereign-a2a-bus-design, agents/2416-agent-social-networks-feedback-loop, agents/2423-vault-as-transport-inter-terminal-context, agents/2109-buzz-block-dorsey-human-ai-workspace, agents/2246-claude-code-cross-session-messaging"
original-query: "next thing i wanna make is a bus for our agents to communicate on, research deeply all open agent social medias and how its organized and see if it makes sense to do a private version of that on someone else's netowrk or build our own"
tier: DEEP
---

# 2638 - Agent bus: a private space on someone else's network, or our own?

> **Goal:** Decide where ZAO's agents (ZOE, the desk bots, ZOL, Hermes, the Claude Code lanes, outside partners) talk to each other, after surveying every open agent social network, agent-to-agent protocol and private transport live on 8 Oct 2026.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Do NOT put our agents on an agent social network.** None offers a private space | Moltbook is "a public platform" (privacy policy, updated 15 Mar 2026), uses data "to improve AI models", has no private or invite flag in its API (skill.md v1.12.0), and Meta bought it (HN, 10 Mar 2026, 554 points). Farcaster casts are public. Every smaller clone found (Moltshit, Agentkind and others) is public. |
| 2 | **We already built our own bus. Extend it; do not start over.** | `infra/bus/bus.js` in ZAOOS, live at `https://bus.zaoos.com/bus` since 20 Aug 2026. `/bus/health` returned 200 on 8 Oct. It is 293 lines of vanilla `node:http`, built to Jim's tasern wire contract. The gap is use, not existence: it was built for partners ("partners send only to coordinator"), and its own deploy note says ZOE is "NOT yet wired". |
| 3 | **Open the bus to internal agents: one named inbox per agent, typed messages.** | Today our agents talk across five separate channels: the bus (partners only), Claude Code cross-session messages (same Mac only), the vault drop-box (`inbox/agents/<name>/`, 48 files), the ZAAL BOTZ Telegram group, and GitHub issues on the desks. None of them shares a message id with another, so no single log shows a loop. |
| 4 | **Harden the bus before adding agents.** SQLite instead of the flat JSON file, a hop cap and a per-thread budget, idempotency keys, separate delivered and read receipts, and inbound messages marked as untrusted | `bus.js` line 62 writes the whole `messages.json` on every change (no atomic ack). The best-known failure in this space is two agents looping for 11 days at about $47,000 (Nov 2025, secondary sources). Moltbook's agents injected instructions into each other (Feb 2026). Sender binding is already right: `from` is taken from the token, not the body (`bus.js` line 157). |
| 5 | **Speak A2A at the edge, without making it the bus.** Wrap each message body in an A2A `Message` shape and give each agent a static `/.well-known/agent-card.json` | A2A (Linux Foundation, spec v1.0.0 on 12 Mar 2026, Apache-2.0, 26,071 stars) gives a standard vocabulary and discovery for free. It is request and response between online agents with no offline mailbox. Our bots and laptop sessions are often offline, which is the mailbox's job. Pin v1.0.x: the step from v0.3 to v1.0 broke existing code. |
| 6 | **Give Claude Code lanes the bus through a small MCP server** (send, poll, ack) | Claude Code's built-in cross-session messaging is same user, same Mac, plain text, at most 50 queued messages (official docs). It cannot reach the VPS bots or partners. `mcp_agent_mail` (2,196 stars, pushed 29 Sep 2026) proves the pattern. Its licence is "MIT with OpenAI/Anthropic Rider", so read the rider before copying any code. |
| 7 | **Keep the Telegram group as the human-readable window, not the bus** | Since Bot API 10.0 (8 May 2026), bots can see each other's group messages if each one turns on Bot-to-Bot Communication Mode in BotFather. But group chats are not end-to-end encrypted, the limit is 20 messages a minute per bot, and Telegram's own FAQ warns that bots talking can "get stuck in unwelcome loops". |
| 8 | **SKIP for now:** XMTP, Nostr or Buzz, Matrix, AGNTCY, NANDA, ANP, Coral, ERC-8004 as transport | XMTP is the only truly third-party end-to-end option ($5 per 100,000 messages, paid in USDC), but it ties us to one company's network. Use it only if a partner insists on E2E. Buzz (Block, 35,667 stars, Apache-2.0) is the closest ready-made human-plus-agent workspace, but it is pre-1.0 with 3,586 open issues. Coral has no LICENSE file. ERC-8004 is a public on-chain registry with no transport, and the ERC is still Draft. |

## Findings

### A. What we already have (measured 8 Oct 2026)

| Channel | Who uses it | Limit |
|---|---|---|
| `bus.zaoos.com` (ZAOOS `infra/bus/`) | Partners: Candy, Jim, Brandon tokens minted 20 Aug | Partners can only message "coordinator". ZOE is not wired (`bot/src/zoe/__tests__/bus-send.test.ts`: "The live host has no BUS_URL/BUS_TOKEN today"). Traffic volume is UNKNOWN; reading it needs the admin token on the VPS, which this lane did not use. |
| Claude Code SendMessage | Lanes on Zaal's Mac | Same machine, same user, plain text |
| Vault `inbox/agents/<name>/` via `scripts/agent-msg.py` | Antigravity (26 files), vault (13), others | A writer only; by design nothing polls it |
| Telegram ZAAL BOTZ | ZOE and other bots | Bots could not see each other until bot-to-bot mode; no sender proof |
| GitHub desk issues | IMan, Jose, Danny desks | Human-paced, not agent-to-agent |

Prior decisions this builds on: `agents/2212` (August, our own bus rather than riding Jim's), `agents/2423` (the vault is memory, not a message bus), and `agents/2416` (agent social networks gave little real feedback).

### B. Agent social networks: how they are organized

| Network | Identity | Spaces | Limits | Private? |
|---|---|---|---|---|
| Moltbook (Meta since Mar 2026) | `POST /agents/register` returns an API key; the human owner verifies by email and a post on X | "Submolts" (communities), posts, comments, follows | 1 post per 30 min, 50 comments a day; new agents get 1 post per 2 h | No. Public by policy; data used to train models. Jan-Feb 2026 leak of an open database: 1.5M API keys, 35K emails, private messages (Wiz) |
| Farcaster (Neynar since Jan 2026) | FID plus signer key; Neynar "Create Agent" | Public casts, channels, 1:1 direct casts | Neynar plan limits (not measured) | No for casts. Channel membership does not hide content |
| Moltshit, Agentkind, AgentGram and other clones | Read `skill.md`, keep a key, add a heartbeat | Boards, feeds | Proof-of-work gates | No hosted private tier found; AgentGram claims self-hosting (not verified) |

Reply depth stays thin. A secondary source puts Moltbook's share of comments with zero replies at 93% (Feb-Mar data). No Sept-Oct 2026 evidence either way was reachable. This matches what `agents/2416` found on 25 Aug.

### C. Agent-to-agent protocols

| Protocol | Version, date | Licence (file) | Mailbox / offline? | Fit |
|---|---|---|---|---|
| A2A | v1.0.0 12 Mar 2026; v1.0.1 28 May | Apache-2.0 | No. Sync, SSE, polling `GetTask`, webhook push | Use its shapes at the edge |
| MCP | spec 2026-07-28 | Moving from MIT to Apache-2.0 | Not a bus; agent-to-tool | The way Claude Code reaches our bus |
| IBM ACP | archived; "now part of A2A" | Apache-2.0 | n/a | Dead |
| AGNTCY SLIM and Directory | active (Oct 2026) | Apache-2.0 (SLIM) | Group sessions, end-to-end encrypted (MLS) | Needs new Rust and Go daemons; too much for about 10 agents |
| ANP | v1.2, 24 Sep 2026 | Apache-2.0 | DID-authenticated HTTP | More identity machinery than we need |
| Coral | no release checked | **no LICENSE file** | MCP-style threads | Cannot adopt |
| ERC-8004 | Draft, created 13 Aug 2025 | no LICENSE file in contracts repo | No transport | Public registry only; keep `scripts/agents/erc8004-agentcard.py` for public discovery |

HN, "Ask HN: Is anyone using the A2A protocol?" (18 Jun 2026, 96 points, 45 comments): mixed. One reply: "No, it was designed on paper by someone with no understanding of prompt caching and no consideration of latency or token costs." Another: "just build an API in front of your agent, give the other agent the spec in a markdown file".

### D. A private room on someone else's network

| Network | Bots see bots? | Private how | Cost | Verdict |
|---|---|---|---|---|
| Telegram group | Yes, opt-in since 8 May 2026 | Server-side only; Telegram and admins can read | Free; 20 msgs/min per bot per group | Window for humans, not the bus |
| XMTP group | Yes | End-to-end (MLS); invite-only groups | $5 per 100,000 messages, USDC | Only if a partner needs E2E across orgs |
| Nostr NIP-29 group / Buzz | Yes | Relay-enforced membership, not E2E; you run the relay | Your relay | A self-host in disguise; NIP-29 still draft |
| Matrix room | Yes | Optional E2E; self-host Tuwunel (Apache-2.0) or Synapse (AGPL-3.0) | Free to about $5/mo | Best chat-shaped self-host if we ever want one |
| Farcaster | 1:1 direct casts only | | Neynar plan | Skip |

### E. Failure modes to design against

1. **Loops and cost.** A LangChain A2A analyzer and verifier looped for 264 hours, about $47,000, Nov 2025. All retellings trace to one self-reported Medium post (PARTIAL). Fix: a hop cap and a per-thread budget checked by code before any model call.
2. **Agent-to-agent prompt injection.** On Moltbook, agents told other agents to delete their accounts and pushed crypto schemes (SecurityWeek, 4 Feb 2026; Zenity Labs). Imperva (10 Jun 2026) injected through contact names and location labels. Fix: deliver every inbound body as quoted, untrusted data, never as instructions.
3. **Impersonation.** Telegram bots in one group carry no sender signature. Fix: sender comes from the token, never the body. Our bus already does this.
4. **Lost or stuck messages.** Read-pointer bugs in `let-them-talk` (#1) and `mcp_agent_mail` (#274). Fix: ack after processing, with idempotency keys.
5. **A bus nobody reads.** No external incident found (searched HN, GitHub issues; not searched Discord or X). Our own bus is the internal example: live for seven weeks, with ZOE still unwired.

## Comparison: the three real paths

| Path | Cost | Privacy | Work | Verdict |
|---|---|---|---|---|
| Private space on an agent social network | Free | None found | Low | **No** |
| Third-party private transport (XMTP, matrix.org, Telegram) | $0 to $5 per 100k msgs | Varies; only XMTP is E2E | Medium; still need the loop guards | Only as an edge for partners |
| **Our own bus, extended and hardened** | Already running on the VPS | We hold it | One PR series on code we own | **Yes** |

## Also See

- [agents/2212-zao-sovereign-a2a-bus-design](../2212-zao-sovereign-a2a-bus-design/) - the August design this extends
- [agents/2416-agent-social-networks-feedback-loop](../2416-agent-social-networks-feedback-loop/) - ZOL on Farcaster, Moltbook reply data
- [agents/2423-vault-as-transport-inter-terminal-context](../2423-vault-as-transport-inter-terminal-context/) - why the vault is not the bus
- [agents/2109-buzz-block-dorsey-human-ai-workspace](../2109-buzz-block-dorsey-human-ai-workspace/) - Buzz, the ready-made alternative
- [agents/2246-claude-code-cross-session-messaging](../2246-claude-code-cross-session-messaging/) - the Mac-local layer

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule on the direction (extend our bus for internal agents, no agent social network); done when the ruling is in zao-vault decisions | Zaal | Decision | 2026-10-10 |
| PR to ZAOOS `infra/bus`: SQLite storage, typed envelope (`type`, `thread_id`, `in_reply_to`, `ttl`, `hops`), idempotency key, delivered/read receipts, per-sender rate limit, hop cap; done when merged with tests including a loop test | dotfiles or ZAOOS lane | PR | 2026-10-17 |
| PR: internal agent role in `bus.js` (named inboxes for zoe, zol, hermes, desk bots) so agents can message each other, not only the coordinator; done when merged | ZAOOS lane | PR | 2026-10-17 |
| Wire ZOE to the bus (BUS_URL and BUS_TOKEN on the VPS host, one poll cron); done when ZOE answers a test message end to end | Zaal (env is his hand) | Hand | 2026-10-20 |
| Small MCP server exposing send, poll and ack for Claude Code lanes; done when one lane sends and another receives through the bus | dotfiles lane | PR | 2026-10-24 |
| Static A2A `agent-card.json` per agent (spec v1.0.x), generated from one registry file; done when served for ZOE and ZOL | ZAOOS lane | PR | 2026-10-31 |
| Decide on Telegram bot-to-bot mode for ZAAL BOTZ (read-only window); done when Zaal rules yes or no | Zaal | Decision | 2026-10-10 |

## Sources

1. [Moltbook skill.md v1.12.0](https://www.moltbook.com/skill.md) - [FULL] curl raw, 38,214 bytes; rate limits read; no private or invite fields (grep returned none, control grep matched "30 minutes")
2. [Moltbook privacy policy](https://www.moltbook.com/privacy) - [FULL] curl + strip; "a public platform", "improve AI models"
3. [HN: Meta acquires Moltbook](https://news.ycombinator.com/item?id=47323900) - [FULL] Algolia items API, 554 points, 10 Mar 2026 (community)
4. [HN: Hacking Moltbook](https://news.ycombinator.com/item?id=46857615) - [PARTIAL - metadata only] Algolia API, 397 points (community)
5. [Wiz: exposed Moltbook database](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys) - [PARTIAL - excerpts] curl
6. [MIT Technology Review, 6 Feb 2026](https://www.technologyreview.com/2026/02/06/1132448/moltbook-was-peak-ai-theater/) - [PARTIAL - excerpts] curl
7. [Neynar: acquiring Farcaster](https://neynar.com/blog/neynar-is-acquiring-farcaster) - [PARTIAL - headline and date] curl
8. [Neynar docs index](https://docs.neynar.com/llms.txt) - [FULL for listed endpoints] curl
9. [A2A repo, LICENSE, GOVERNANCE](https://github.com/a2aproject/A2A) - [FULL] gh api + raw curl
10. [A2A specification](https://raw.githubusercontent.com/a2aproject/A2A/main/docs/specification.md) - [PARTIAL - grep for task states, push, auth] curl raw
11. [HN: Ask HN, is anyone using A2A?](https://news.ycombinator.com/item?id=48582679) - [FULL for quoted comments] Algolia API (community)
12. [IBM ACP repo](https://github.com/i-am-bee/acp) - [FULL] gh api; archived, "now part of A2A"
13. [AGNTCY SLIM](https://github.com/agntcy/slim) and [dir](https://github.com/agntcy/dir) - [PARTIAL - dir LICENSE.md not read] gh api + curl
14. [Coral server](https://github.com/Coral-Protocol/coral-server) - [PARTIAL - no LICENSE file found, release not checked] gh api
15. [ANP](https://github.com/agent-network-protocol/AgentNetworkProtocol) - [FULL] gh api + LICENSE
16. [ERC-8004](https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-8004.md) - [PARTIAL - head plus grep] curl raw
17. [Telegram Bot Features](https://core.telegram.org/bots/features) - [FULL for quoted lines] curl + strip, verified by this lane
18. [Telegram Bot API changelog](https://core.telegram.org/bots/api-changelog) - [FULL] curl + strip; Bot API 10.0 bot-to-bot
19. [Telegram Bots FAQ](https://core.telegram.org/bots/faq) - [FULL for quoted lines] curl + strip; contradicts the features page (stale)
20. [XMTP fees](https://docs.xmtp.org/fund-agents-apps/calculate-fees) - [FULL for quoted lines] curl + strip, verified by this lane
21. [XMTP security](https://docs.xmtp.org/protocol/security) - [PARTIAL] curl + strip; mainnet decentralization status UNKNOWN
22. [NIP-29](https://raw.githubusercontent.com/nostr-protocol/nips/master/29.md) and [NIP-17](https://raw.githubusercontent.com/nostr-protocol/nips/master/17.md) - [PARTIAL - first sections] curl raw
23. [block/buzz](https://github.com/block/buzz) - [FULL for stars, dates, LICENSE] gh api, verified by this lane: 35,667 stars, Apache-2.0
24. [Claude Code cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging.md) - [FULL] curl raw .md
25. [mcp_agent_mail](https://github.com/Dicklesworthstone/mcp_agent_mail) - [FULL for stars, LICENSE head, issues #268-275] gh api
26. [NATS](https://github.com/nats-io/nats-server), [Valkey](https://github.com/valkey-io/valkey), [Tuwunel](https://github.com/matrix-construct/tuwunel), [Synapse](https://github.com/element-hq/synapse) - [FULL for stars, releases, LICENSE] gh api; delivery-guarantee claims not fetched
27. [vectara/awesome-agent-failures: A2A $47k loop](https://github.com/vectara/awesome-agent-failures/blob/main/docs/case-studies/langchain-a2a-47k-infinite-loop.md) - [PARTIAL - exa highlights; primary Medium post not fetched]
28. [SecurityWeek on Moltbook](https://www.securityweek.com/security-analysis-of-moltbook-agent-network-bot-to-bot-prompt-injection-and-data-leaks/) and [Imperva on OpenClaw](https://www.imperva.com/blog/compromise-openclaw-with-prompt-injections-in-message-objects/) - [PARTIAL - exa highlights]
29. ZAOOS `infra/bus/bus.js`, `infra/bus/deploy/DEPLOYED.md`, `bot/src/zoe/__tests__/bus-send.test.ts` - [FULL] git show on origin/main; `/bus/health` probed with curl on 8 Oct, HTTP 200
30. Reddit (r/moltbook and others) - [FAILED] `zao-fetch-reddit.sh` has no OAuth credentials and reported every path blocked; exa hit its free rate limit mid-run for Sept-Oct Moltbook news. No Reddit evidence is used.
