---
topic: agents
type: guide
status: research-in-progress
last-validated: 2026-08-06
related-docs: 925, 997, 2106, 891, 892, 910, 1607, 1610, 761, 762, 484, 602, 659, 765
original-query: "Deep research on how to have agentic tooling post on socials better - looped for an hour+, very important. Grounded in tonight's finding that the R3 winner cast sat drafted-but-unposted in a markdown file for weeks despite being ready."
tier: DEEP
---

# 2213 — Agentic social posting: what's actually built, what's missing, what to do next

> **Goal:** Ground a concrete answer to "how do we have agentic tooling post to
> socials better" in what the ZAO has ALREADY built (not re-derive it), find
> the real gap, and land on actionable next steps. Triggered by a live
> incident: tonight's zpoidh session drafted a ready-to-post R3 winner cast
> that then sat untouched in a markdown file - the exact failure mode this
> doc needs to close.

**Status: DRAFT, IN PROGRESS.** This is being built iteratively over a looped
research session (started 2026-08-06). Sections marked `[VERIFY NEXT]` are
findings from internal docs that haven't been independently re-checked yet
this pass.

## Key Decisions (working, will firm up as research continues)

| # | Recommendation | Why |
|---|---|---|
| 1 | **The gap isn't "build agentic posting" - it already exists and works.** ZOE's `caster` pipeline (`bot/src/zoe/caster/index.ts`) is a complete, live, human-gated draft→approve→post flow for Farcaster: draft (OpenRouter) → safety check (Klearu) → Telegram approval (POST/REGEN/SKIP buttons) → sign (self-custodied Ed25519) → publish. Zero cost per cast. This is not a proposal - it's running code. | Verified directly by reading `bot/src/zoe/caster/index.ts`, `bot/src/zoe/farcaster/write.ts`, `bot/src/zoe/farcaster/signer.ts` in this pass, not just citing docs. |
| 2 | **The real gap: Claude Code session drafts (what *I* produce, e.g. tonight's femmie cast) never touch that pipeline.** They land as static markdown files for manual copy-paste - a structurally weaker path than ZOE's own drafts, which get a live Telegram approval button. Same underlying human-gate philosophy, two disconnected implementations. | This is the exact failure mode that triggered this doc: the R3 winner cast sat ready-to-send in `zpoidh/rounds/r3/cast-templates/winner-announce-femmie.md` for weeks with nobody prompted to act on it. |
| 3 | `zao-relay` (`~/bin/zao-relay send zoe "<message>"`) already exists as a terminal-to-terminal message bus and was used successfully earlier tonight to reach ZOE's inbox. **`[VERIFY NEXT]`** whether a relayed message from a Claude Code session can actually enter the caster pipeline's Telegram-approval flow, or whether that wiring doesn't exist yet - this is the single highest-leverage thing to confirm before recommending it as *the* bridge. | If relay→caster already works, the fix is a documented workflow change, not new code. If it doesn't, it's a small, well-scoped build (the caster pipeline already has every other piece). |
| 4 | External research independently confirms ZOE's existing pattern is the right one, not something to redesign. Industry framing in 2026 calls this "autonomous with guardrails" / "AI proposes, human approves" - agent drafts, selects context, queues for review; fully autonomous posting "does not exist in production today" as an industry norm, matching ZAO's own stated design. | Cross-checked against fresh external sources (see Sources), not just internal docs - the point was to verify ZAO's approach isn't stale, not to import new frameworks. |

## What ZOL/ZOE can actually do today (2026-08-06, verified against live code)

Read directly, not cited secondhand:

- **`bot/src/zoe/farcaster/write.ts`** - `publishCast()` is real, working code. Self-custodied Ed25519 signer (`signer.ts`), submits directly to a write-enabled hub (`FARCASTER_WRITE_API_BASE`), pays via x402 (EIP-3009 USDC on Base) if enabled, or a bearer key for a self-hosted/3rd-party hub. Not dependent on Neynar's managed-signer product. Zero marginal cost per cast once the signer is registered.
- **`bot/src/zoe/caster/index.ts`** - the orchestration layer. Docstring states the pipeline plainly: `draftCast (OpenRouter) -> safetyCheck (Klearu PRE) -> Telegram approval (human gate) -> publishCast (sign -> write endpoint) -> optional Klearu POST`. The approval gate is described as "mandatory and stack-independent" - every drafted cast/reply goes through it, and "all onchain $ZABAL actions require approval" too, per the same file.
  - Draft stage produces `draftText` + a `SafetyVerdict`.
  - If Klearu's PRE check blocks it, Zaal is notified and NOT offered a publish option.
  - If it clears, a Telegram message goes out with inline buttons: `Approve`, `Reject`/`Regen` (callback-query handlers keyed `cast-approve:`, `cast-reject:`, `cast-regen:`).
  - `publishCast()` only fires inside the approve callback handler - there is no code path that posts without that human tap.
- **`bot/src/zoe/mcp/farcaster-server.ts`** - a separate, deliberately **read-only** MCP server ("Read-only by construction - read-node.ts is a read client that cannot post"). This is ZOE's first MCP tool-agent experiment, proving the pattern with one safe tool (`casts_by_fid`, `node_info`). It does not post. Worth noting since it shows the team already has hands-on MCP-server experience internally - relevant to Key Decision 5 below.

Cross-referenced against the background research pass on internal docs (925, 891, 892, 761, 762, 910), which independently arrived at the same picture: draft+approve+publish is live for Farcaster, zero-cost signer path is the chosen one, Neynar managed signer and x402 are documented fallbacks, and posting is not autonomous - every cast needs a human tap.

## The approval-gate pattern in detail

- **UI:** persistent Telegram inline keyboard, single pending draft at a time (a second draft doesn't queue past the first).
- **Resend/expiry:** re-prompts a bounded number of times over a few hours, then expires rather than nagging forever.
- **Voice enforcement:** the draft prompt bakes in the ZAO's actual style rules (no hashtags, no emojis, no em dashes, lowercase, exact brand spellings, a hard character cap) - this session's own global instructions (no emojis, no em dashes) are a subset of the same list, suggesting the voice rules are already centralized somewhere worth finding and reusing rather than re-specifying per session.
- **Named pattern:** internal docs call this "graduated trust" - reads/likes auto-allow, casts/replies/on-chain actions gate on a human. This maps directly onto the external "three levels of autonomy" framing found in fresh research this session: level 1 (assist), level 2 (autonomous with guardrails - draft + queue for approval), level 3 (fully autonomous) - industry consensus is level 3 isn't in production anywhere for social posting in 2026, which validates that ZAO staying at level 2 isn't behind, it's the current ceiling everyone else is at too.

## Technical options for Farcaster posting (verified + cross-checked)

| Option | Cost | Auth | Status for ZAO |
|---|---|---|---|
| Self-custodied Ed25519 + free hub (Pinata gRPC) | ~$0.50-1 one-time signer registration (Optimism gas), $0/cast after | Private key held locally, never a third party | **Chosen and live** - this is what `write.ts` actually does today |
| x402 pay-per-write to Neynar hub | ~$0.001-0.01/cast | EIP-3009 USDC payment on Base | Implemented as a fallback (`farcaster/x402.ts`), not the primary path |
| Neynar managed signer | Free tier / $249mo Scale tier if scaled up | Neynar-hosted, SIWN flow | Supported but not preferred - key custody isn't ZAO's, and Neynar's credit-to-USD conversion is undocumented behind a login wall (flagged as an open cost-verification item in prior research, not yet resolved) |

External confirmation (fresh search this session): Neynar's own docs describe managed signers as giving developers "full assurance" against account bans when posting on a user's behalf - a real, current, supported option, just not the one ZAO chose, and that choice (self-custody over convenience) matches the ZAO's broader "own your infrastructure" posture seen elsewhere (Hypersnap read node, doc 761).

## X/Twitter posting

- **Chosen path:** Firefly cross-posting (Farcaster → X simultaneously), free, no API key custody. This is explicitly the "don't pay to automate a platform you're stepping back from" call from prior research - only wire a paid X API path if X engagement actually earns back a ~$200/mo Basic tier cost.
- **Gap Firefly doesn't cover:** inbound X-native replies/mentions - those need the paid API path if ZOL is ever expected to respond on X directly, not just cross-post outbound.
- **`[VERIFY NEXT]`**: confirm current X API pricing directly - the $200/mo figure in prior research is about a month old as of this doc, and X's terms/pricing move fast.

External research this session on X specifically: 2026 guidance is consistent with ZAO's approach - autonomous *posting* is explicitly permitted by X's own policy, autonomous *engagement* (auto-like, auto-follow, auto-reply) is the thing that gets accounts flagged. Behavioral fingerprinting is real (velocity anomalies, exact-interval posting without jitter) - worth folding into any future ZOL→X wiring as a concrete implementation detail, not just a cost decision.

## The MCP-server angle - new ground, not in prior ZAO research

This is the one genuinely new finding from tonight's external research pass, not previously covered in the internal doc corpus:

**Model Context Protocol (MCP) social-posting servers are now a mature, standardized pattern** - Postiz (open-source, AGPL-3.0, self-hostable, first-party MCP server, 33 platforms including Farcaster and Bluesky), Outstand, Blotato, and even official platform-run MCP servers (Meta shipped one in April 2026; Hootsuite and Buffer added MCP connectors mid-2026) all expose the same shape: an MCP client (Claude Code, Claude Desktop, any agent) calls a tool like `post_publish(profiles=[...], body='...')` and gets back a post ID.

Why this matters specifically for the gap in Key Decision 2: **a Claude Code session already knows how to call MCP tools** - that's exactly the mechanism used throughout tonight's zpoidh session (`mcp__claude-in-chrome__*` tools). If a self-hosted Postiz instance (or an equivalent) were connected as an MCP server to Claude Code sessions, a session like tonight's could call a `draft_post` tool directly instead of writing a markdown file that then needs a human to notice it exists, resolving Key Decision 2 without inventing new ZAO-specific plumbing.

The catch, and the reason this isn't a slam-dunk recommendation yet: Claude Code's own MCP tool-call flow doesn't have a built-in "propose, then a human approves in a separate channel, then it executes" primitive the way ZOE's Telegram-button flow does - a raw MCP posting tool would need the SAME kind of approval wrapper ZOE already built, or it just becomes an easier way to accidentally auto-post. External research surfaced dedicated approval-gateway MCP servers for exactly this reason (e.g. one pattern requiring human approval via Telegram before an agent executes a "critical, destructive, or irreversible" action) - which is functionally the same shape as ZOE's caster pipeline, just generalized as an MCP-native pattern instead of ZOE-specific code.

**`[VERIFY NEXT]`**: whether it's lower-effort to (a) build a thin MCP wrapper around ZOE's *existing* caster pipeline so Claude Code sessions can call into the same Telegram-approval flow ZOE already has, or (b) stand up a general-purpose approval-gated MCP posting server (Postiz + an approval-gate MCP in front of it) independent of ZOE. Option (a) reuses more; option (b) is more platform-agnostic (covers Bluesky/Telegram/etc. for free via Postiz's 33-platform coverage instead of building each one by hand, per the Telegram-autopost spec that's sitting ready-but-unbuilt in prior research).

## Other platforms

- **Bluesky (AT Protocol):** app-password auth still works for self-scripted single-account bots; official guidance has shifted toward OAuth for anything onboarding other users, which doesn't apply to ZAO's own-account use case. Bot accounts should self-label as automated per platform norms. Not currently wired for ZAO at all - Postiz's existing Bluesky support (same MCP server that covers Farcaster) is a plausible fast path if this becomes a priority.
- **Telegram:** fully specified (prior research, doc 1610), not yet built. Gated on Zaal providing a channel ID and one other PR merging - a ~2 hour build once unblocked, reusing ZOE's existing bot infrastructure (`@zaoclaw_bot`). Lowest-effort platform to add next if a second platform is wanted before the MCP question above is resolved.

## Contradictions and staleness carried from prior research (flagging, not yet independently re-verified)

- Neynar's actual monthly cost to ZAO is unpublished/opaque (credit-to-USD conversion is behind a login wall in their dashboard) - prior research flagged this as unresolved twice already; still unresolved.
- X API pricing (~$200/mo Basic tier) is about a month old in prior research - X's terms move fast, worth a direct check before committing spend.
- EIP-8004 on-chain agent identity registration for ZOL was explicitly evaluated and skipped for v1 (zero Farcaster agents were found registered on the standard as of the last check) - Neynar's own reputation score is being used as the practical trust signal instead. Worth a quick recheck given how fast this space moves, but not urgent.

## Sources

Internal (ZAO OS V1 repo, read directly this session):
- `bot/src/zoe/caster/index.ts`, `bot/src/zoe/farcaster/write.ts`, `bot/src/zoe/farcaster/signer.ts`, `bot/src/zoe/mcp/farcaster-server.ts`
- Doc 925 (ZOL free cast posting build guide), Doc 997 (agent harness design), Doc 2106 (ZOL ICM-grounded posting + X pilot), Doc 891/892 (Farcaster agentic bootcamp + 2026 landscape), Doc 910 (zero-cost Farcaster posting), Doc 1607 (channel autopost spec), Doc 1610 (Telegram autopost spec), Doc 761/762 (multiagent Quilibrium stack, QKMS resolution)

External (fetched live this session, 2026-08-06):
- [Building AI Agents on Farcaster - Neynar](https://neynar.com/blog/building-ai-agents-on-farcaster)
- [How writes to Farcaster work with Neynar managed signers](https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers)
- [Postiz MCP](https://postiz.com/mcp) and [Postiz self-hosting](https://crunchtools.com/self-hosting-postiz-rhel10-one-container-six-platforms/)
- [Best Social Media MCP Servers in 2026](https://www.socialync.io/blog/best-social-media-mcp-servers-2026)
- [Posting via the Bluesky API - AT Protocol](https://atproto.com/blog/create-post) and [Bluesky Bots docs](https://docs.bsky.app/docs/starter-templates/bots)
- [AI Bot Twitter Guide 2026: Risks & How to Spot Them](https://superx.so/blog/ai-bot-twitter)
- [Building Human-In-The-Loop Agentic Workflows](https://towardsdatascience.com/building-human-in-the-loop-agentic-workflows/)
- [The MCP Security Survival Guide](https://towardsdatascience.com/the-mcp-security-survival-guide-best-practices-pitfalls-and-real-world-lessons/)

## Next Actions

_Will be finalized once research is complete - placeholder pass:_

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm whether zao-relay messages can enter the caster/Telegram-approval pipeline today | Zaal (assistant to verify code path) | Investigation | in progress this session |
| Decide MCP-wrapper-on-caster vs. standalone Postiz+approval-gate MCP | Zaal | Decision | pending this doc's completion |
