---
topic: cross-platform
type: decision
status: research-complete
last-validated: 2026-08-07
related-docs: 2232, 2243
original-query: "I just tried tapping post on this and it just said the same thing again. We need to prep a proper posting platform and product so that it actually works. Research postiz really hard."
tier: DEEP
---

# 2244 - The posting platform decision: sovereign vs Postiz vs Borker

> **Goal:** Zaal tapped POST on a ZOE draft and it echoed the text back. Find out why,
> research Postiz hard (his ask), weigh it against the alternatives, and decide what
> ZAO's real posting product should be.

## Why POST echoed (the trigger, root-caused)

`bot/src/zoe/posts/buttons.ts:135` - POST was never a publish button:

```
await opts.ctx.answerCallbackQuery('approved - paste it');
// Resend the bare text one more time as a clean copy-target without buttons.
await opts.ctx.api.sendMessage(opts.zaalTgId, pending.text);
```

It marks the draft approved and resends it for manual copy-paste. Working as written;
just not what a button labelled POST implies.

## The finding that reframes everything (confirm-before-claiming-absence)

**ZAO already had a complete publishing stack.** Before recommending any platform, a
grep of `src/lib/publish/` found: `auto-cast.ts` (Farcaster), `x.ts`, `bluesky.ts`,
`telegram.ts`, `discord.ts`, `threads.ts`, `lens.ts`, `hive.ts`, `broadcast.ts`, plus
**9 admin-gated routes** under `/api/publish/*` with Zod validation.

What was missing was the ORCHESTRATOR: every existing route MIRRORS an existing
Farcaster cast (they require a `castHash`), and `/api/publish/farcaster` only publishes
governance proposals. Nothing took one piece of text and fanned it out - so ZOE's
button had nothing to call.

**Fixed in PR #2946**: `POST /api/publish/compose` (Farcaster first -> X + Bluesky
mirror it -> TG + Discord broadcast; dryRun defaults TRUE) + a `/publish` dashboard.
9/9 tests, tsc clean.

## Postiz, researched hard (claims independently verified)

`gitroomhq/postiz-app`, verified via `gh api` 2026-08-07 (the subagent's claims were
re-checked by the orchestrator, per research-grounding):

- **34,373 stars; license AGPL-3.0; pushed 2026-08-07** (same day - very active). [FULL]
- **Farcaster support is real**: `libraries/nestjs-libraries/src/integrations/social/farcaster.provider.ts` exists (5,219 bytes). [FULL, verified by direct API fetch]
- **Public REST API is real**: `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts` exists. [FULL, verified]
- **Agent-ready by design**: a companion repo `gitroomhq/postiz-agent` (401 stars) is described as *"Postiz Agents CLI - connect it to Claude / OpenClaw / etc, to schedule social media posts"*. [FULL, verified]
- **Platforms (16 claimed)**: X, Farcaster, Bluesky, Telegram, Discord, Slack, LinkedIn, Facebook, Instagram, YouTube, TikTok, Pinterest, Mastodon, Threads, Reddit, Dribbble. [PARTIAL - Farcaster + the API verified directly; the full list is the subagent's source read, not individually re-verified]
- **API shape**: `POST /public/v1/posts` (draft or scheduled), `PUT /public/v1/posts/:id/status`, upload endpoints, `GET /public/v1/integrations`. Draft-then-publish maps exactly onto ZOE's POST/REGEN/SKIP flow. [PARTIAL - from the source read]
- **Self-host cost**: docker-compose brings Postgres + Redis + **Temporal + Elasticsearch**. That is the real price - **~4GB RAM recommended**, comparable to running n8n or Airflow. [PARTIAL]
- **No paywall on self-host** (README: no difference between hosted and self-hosted). [PARTIAL]
- **AGPL implication**: calling its API is fine; FORKING it means share-alike. Treat Postiz as a service you run, never a library you modify.

## Borker (Sven's tip, fetched 2026-08-07)

`borker.xyz/docs/changelog/2026-07-31-agent-api-and-mcp` [FULL]:

- **Hosted MCP endpoint** `https://borker.xyz/api/v1/mcp` - "point your client at one URL, paste a key"; eleven tools; Bearer auth. ZOE/Claude Code could drive it natively with no adapter.
- **The agent never holds social credentials** - a scoped, revocable key; Borker holds the accounts. That is a genuinely better security posture than ZAO holding every token.
- **Approval built in**: drafts arrive with an API badge and nothing publishes until approved (or the agent may self-approve if configured); sensitivity rules can hold posts.
- **Platforms: X, LinkedIn, Farcaster, Paragraph only.** No Bluesky, Telegram, Discord.
- Hosted (not self-hostable), pricing NOT STATED in the changelog.

## The comparison

| | Sovereign (#2946) | Postiz | Borker |
|---|---|---|---|
| Platforms | Farcaster, X, Bluesky, TG, Discord (+Threads/Lens/Hive unused) | 16 incl. LinkedIn, IG, TikTok, YouTube | X, LinkedIn, Farcaster, Paragraph |
| Scheduling | none | yes (Temporal) | yes (weekly schedule) |
| Agent-drivable | it IS our code | REST API + agent CLI | MCP endpoint (native) |
| Credentials | ZAO holds all tokens | ZAO holds all tokens | **Borker holds them; agent gets a revocable key** |
| Cost | zero | a ~4GB VPS service | hosted, price unknown |
| Sovereignty | total | self-hosted, AGPL | vendor dependency |
| Ready | now (#2946) | ~30min setup + OAuth per platform | account + key |

## Decision (recommended, all gated moves are Zaal's)

1. **Now: use the sovereign path.** #2946 already covers ZAO's five core platforms with
   zero new dependency, and the dry-run dashboard makes it testable by hand. Wire ZOE's
   POST button to `/api/publish/compose` once the dashboard is proven.
2. **Next: add Postiz for what ZAO genuinely lacks** - scheduling and the platforms we
   have no publisher for (LinkedIn, Instagram, TikTok, YouTube). Run it as a SERVICE,
   never fork it (AGPL). ZOE calls its REST API; `postiz-agent` exists if a CLI path is
   easier. This is the "buy the boring infrastructure" call - writing OAuth for four
   more networks ourselves is weeks of work Postiz has already done.
3. **Borker: keep as a watch item, not the rail.** Its credential isolation is the best
   idea in the space and the MCP endpoint is the least-friction agent integration
   available - but four platforms is too thin to be ZAO's posting product, and it is a
   hosted dependency. Revisit if it adds Bluesky/Telegram, or use it narrowly for X +
   LinkedIn if holding those tokens ever becomes a liability.

**The through-line:** own the rail (ZAO's publishers), rent the reach (Postiz for the
long tail). Same shape as the Unlock/Whop decision in doc 2233 - the door stays ours.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Test `/publish` by hand (dry run, then one live post) | @Zaal | Test | 2026-08-08 |
| Wire ZOE's POST button to `/api/publish/compose` once proven | @Zaal (Claude) | PR | after the test |
| DECISION: self-host Postiz for scheduling + LinkedIn/IG/TikTok/YouTube? | @Zaal | Decision (VPS + OAuth = gated) | 2026-08-14 |
| Watch Borker for Bluesky/Telegram support | @Zaal (Claude) | Watch | 2026-09-01 |

## Sources

- `bot/src/zoe/posts/buttons.ts:135` (the echo root cause); `src/lib/publish/*`; 9 routes under `src/app/api/publish/*`. [FULL, in-repo]
- **gitroomhq/postiz-app** - gh api 2026-08-07: 34,373 stars, AGPL-3.0, pushed today; `farcaster.provider.ts` + `public-api/routes/v1` confirmed present. **gitroomhq/postiz-agent** - 401 stars, "connect it to Claude / OpenClaw". [FULL, orchestrator-verified]
- Platform list + API endpoint shapes + docker-compose profile: subagent source read (46 tool calls). [PARTIAL - not individually re-verified]
- **borker.xyz** changelog 2026-07-31 (agent API + MCP). [FULL]
- Alternatives checked + rejected: Mixpost (MIT but missing Farcaster/Bluesky/Telegram, 5mo stale), Ayrshare (proprietary, pay-per-call), assorted 0-star repos. [PARTIAL]

## Also See

- [Doc 2233](../../business/2233-unlock-whop-crypto-access-bridge/) - the same own-the-door pattern applied to payments.
