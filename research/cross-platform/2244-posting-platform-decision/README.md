---
topic: cross-platform
type: decision
status: research-complete
last-validated: 2026-10-07
related-docs: 2232, 2243, 1089, 2567, 897
original-query: "I just tried tapping post on this and it just said the same thing again. We need to prep a proper posting platform and product so that it actually works. Research postiz really hard."
tier: DEEP
---

# 2244 - The posting platform decision: sovereign vs Postiz vs Borker

> **Goal:** Zaal tapped POST on a ZOE draft and it echoed the text back. Find out why,
> research Postiz hard (his ask), weigh it against the alternatives, and decide what
> ZAO's real posting product should be.

## Re-validated 2026-10-07 - Postiz is already ZAO's posting tool for Iman; should Zaal post from it too?

Zaal, 2026-10-07: "lets revewi postiz today aswell", on a day he wants to spend
posting. Everything below this section is the original 2026-08-07 record and is
left as written. This section says what changed since then.

### What changed (measured 2026-10-07)

| What | 2026-08-07 | 2026-10-07 | Source |
|---|---|---|---|
| The ruling | "Posting stays sovereign - not Postiz, not Borker" | **Superseded for Iman's posting on 2026-09-27.** Zaal: "We need to tell Iman to set up postiz", "postiz is most imporatn", "tell iman to try using postiz for posting" | vault `decisions/grill-2026-09-27-iman-desk-afternoon.md` items 13-15; the 08-07 file `decisions/posting-platform-stays-sovereign.md` was never updated to say so |
| A Postiz account | none | **Live and paid by Zaal on 2026-09-29**, cloud (postiz.com), signed in with the info@thezao.com Google account. Plan tier: not recorded anywhere I read | ZAODEVZ/iman-desk #40 (closed 2026-09-29: "Postiz is logged in and paid"), #30 comment of 2026-09-30 |
| Channels connected | - | **One: X @ZAOFestivals** (authorised 2026-09-30). Facebook Page and Instagram not connected (Page admin, desk #13) | iman-desk #30, IMan 2026-09-30 and 2026-10-01 |
| Does it post | - | **Yes, end to end.** Test post 2026-09-30 to @ZAOFestivals; the T-1 countdown was scheduled through it for 2026-10-02 | iman-desk #30 |
| Links on X | - | **Hosted Postiz deletes every URL from X posts, on purpose.** IMan hit it twice. Upstream issue gitroomhq/postiz-app#1939 was closed `not_planned` on 2026-09-30; maintainer: "deliberately added, due to X increasing their pricing significantly for any posts containing links. Making this a per-org Switch would completely defeat the point" | iman-desk #30; `gh api` of issue 1939 and its comments |
| ZAO's own stack | #2946 compose route + `/publish` dashboard, just merged | Unchanged and still live (`src/app/api/publish/compose/route.ts`, `src/app/publish/page.tsx`). **ZOE's POST button was never wired to it**: `bot/src/zoe/posts/buttons.ts:164` still answers `'approved - paste it'`. No scheduling was added. No live (non-dryRun) post through it appears in anything I read | origin/main 2b5b9cf2f; vault `notes/publish-test-postiz-borker-2026-08-20.md` (live fire "is Zaal's tap", not run) |
| The success-shaped stub | existed | Still there: `src/lib/autocliper/postiz-api.ts:17-20` returns a `stub-` id as if scheduled when `POSTIZ_API_KEY` is unset. Doc 2567 section 6 already flags it | origin/main |
| Postiz itself | 34,373 stars, v2.23.0 | **36,814 stars, AGPL-3.0, pushed 2026-10-07.** v2.24.0 (2026-09-22) is a security release ("all users are recommended to upgrade immediately"); v2.25.0 (2026-10-02) adds inline comments on previews and a self-hosted MCP connector. Four of the seven releases since April are security fixes | `gh api repos/gitroomhq/postiz-app` and `/releases` |
| Networks | 16 claimed | 37 provider files in-tree, including `x`, `farcaster`, `bluesky`, `telegram`, `discord`, `linkedin`, `instagram`, `threads`, `tiktok`, `youtube`, `nostr`. The pricing page lists Warpcast (Farcaster) as a channel | `gh api .../integrations/social`; postiz.com/pricing |
| Hosted price | not stated | **Standard $29/mo (5 channels), Team $39 (10 channels, unlimited team members), Pro $49 (30), Ultimate $99 (100).** Every plan includes the MCP server, CLI and API; 7-day free trial | postiz.com/pricing, raw HTML |
| Self-host floor | "~4GB RAM recommended" (subagent read) | Docker Compose "tested with Ubuntu 24.04, 2Gb RAM, 2 vCPUs", Temporal included. The VPS has 6.2Gi available of 7.8Gi, 2 cores, 46G disk free | docs.postiz.com/installation/docker-compose; `ssh vps free -h` |
| Agent CLI | 401 stars | `gitroomhq/postiz-agent` 506 stars, pushed 2026-10-07 | `gh api` |
| zao-social / zabalsocials | - | Neither is a posting tool. `zao-social` holds only a LICENSE (the Farcaster client's future home). `zabalsocials` is a link hub of social profiles (zabalsocials.vercel.app) | `gh api` of both repos |

### What this means

The 08-07 question was "adopt a platform or keep our own?". Zaal answered it in
practice on 09-27 and paid on 09-29, for Iman. So the live question today is
narrower: **does Zaal's own posting move into the Postiz account he already
pays for?**

For today, yes, with two limits:

1. **Links on X.** Hosted Postiz will always strip them. That matches doc 897's
   own rule (on X, the link goes in the first reply), but the reply has to be
   added by hand after the post lands, as IMan does. Farcaster, Bluesky and the
   rest are not affected by this flag.
2. **Who can post as Zaal.** IMan signs in to the same Postiz workspace. If
   Zaal's personal accounts (@zaal on Farcaster, @bettercallzaal on X) are
   connected there, IMan can post as Zaal. Decide that before connecting them.
   The channel cap matters too: Standard holds 5 channels and one is already
   used. The plan tier is on his Postiz billing page.

For the next month: stay on hosted. Self-hosting is the only way to keep links
on X, and the VPS has room, but it makes ZAO the patcher of a service that
shipped four security releases in six months, plus one OAuth app per network
(an X developer app, a Neynar signer). That trades a known, small annoyance for
a standing chore. Keep the sovereign `/publish` stack as the code path ZOE and
the agents own; Postiz becomes the human scheduling surface, and doc 2567
section 6 is the bridge (desk drafts become Postiz drafts by API, approval is
one status change).

### Recommendation (one Grill line)

**A (recommended)** - Today: post from the Postiz account already paid for.
Connect your own channels (Farcaster first, then X), schedule the day there,
put X links in a first reply. Next month: keep hosted, no self-host, decide
whether ZOE drafts go into Postiz. Extra cost $0 if the plan has room, else
the next tier. **B** - Today by hand via Firefly as usual; decide Postiz after
the day. **C** - Self-host on the VPS to keep X links: no extra subscription,
but days of setup and ZAO owns the security patching.

### Next Actions (2026-10-07)

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick A, B or C in the Grill | @Zaal | Decision | 2026-10-07 |
| If A: decide whether IMan may post as you, then connect your own channels in Postiz | @Zaal | Account (his login, his OAuth taps) | 2026-10-07 |
| If A: check the plan tier on the Postiz billing page against the channel count | @Zaal | Check | 2026-10-07 |
| Mark `decisions/posting-platform-stays-sovereign.md` as superseded for Iman's posting (and for Zaal's, if A) | vault seat | Vault edit | after the ruling |
| Make the autocliper Postiz stub fail loudly (doc 2567 section 6, step 3) | ZAOOS lane | PR | when the desk-to-Postiz bridge is built |

### Sources for this section

- vault origin/main `decisions/grill-2026-09-27-iman-desk-afternoon.md`, `decisions/grill-2026-09-29-iman-desk-morning.md`, `decisions/posting-platform-stays-sovereign.md`, `notes/publish-test-postiz-borker-2026-08-20.md` [FULL, git show]
- ZAODEVZ/iman-desk issues #30 and #40, body and all comments [FULL, `gh issue view`]
- gitroomhq/postiz-app repo metadata, last 8 releases, provider directory listing, issue #1939 with comments [FULL, `gh api`, raw JSON]
- gitroomhq/postiz-agent metadata [FULL, `gh api`]
- postiz.com/pricing [FULL, curl with a browser User-Agent, HTML stripped, prices read from raw text]
- docs.postiz.com/installation/docker-compose [FULL, same method]
- `STRIP_LINKS_FROM_X_POSTS` default on a self-hosted install [UNVERIFIED - the issue calls it a hosted flag; I did not read the env reference]
- ZAOOS origin/main 2b5b9cf2f: `bot/src/zoe/posts/buttons.ts:164`, `src/lib/autocliper/postiz-api.ts:17-20`, `src/app/api/publish/*` [FULL]
- VPS memory and disk [FULL, `ssh vps free -h; df -h /`]

---

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
