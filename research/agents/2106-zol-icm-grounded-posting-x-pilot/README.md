---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-28
related-docs: 1021, 1016, 2104
original-query: "Zaal: give X API keys and have ZOE/ZOL pilot my X account so I can focus on Farcaster. Correction: ZOL's posts aren't good - it recycles old WaveWarZ; it needs to use the ICM boxes. Write it up as a plan."
tier: STANDARD
---

# 2106 - ZOL: ICM-grounded posting + governed X pilot

> **Goal:** Fix ZOL's bad posts (recycled WaveWarZ -> grounded, rotating, current) by wiring it to the ICM boxes it already has, and give Zaal a Farcaster-first setup where X stays alive without paid automation he doesn't need.

## The two problems (Zaal's words)

1. **"ZOL's posts haven't been good - stop just posting old WaveWarZ stuff and use ICMs."** Post quality is the blocker.
2. **"Give X API keys and pilot my X account, I wanna focus on Farcaster."** Zaal wants to live on Farcaster and have X handled.

## Root cause (grounded in the code, not assumed)

The ICM-brain fetcher **already exists and works** - `bot/src/zoe/brand-brain.ts` fetches an ICM box's `llm.txt` (cached 10 min) and has 7 brand boxes mapped (The ZAO, ZABAL Games, WaveWarZ, BetterCallZaal, Magnetiq, ZAOstock, ZAOlingo). But it is only used **reactively**: when Zaal posts in a brand topic, ZOE loads that brand's ICM to respond in-character ("one engine, many masks," doc 1021).

**ZOL's *proactive* cast-drafting never calls it.** The draft-approval UI (`drafts.ts`: Post/Skip/Edit) and the cast queue (`zol-queue.ts`: `zolcast:` rows -> Pi signer) are built and fine - but the *content source* feeding drafts is narrow/static, so ZOL recycles WaveWarZ. Meanwhile **15 ICM boxes** are registered (thezao, zabalgamez, wavewarz, fractal, coc-concertz, poidh, magnetiq, zao-festivals, zao-newsletter, zuke, milk-road, farcaster, loop-engineering, zao-assistant, bettercallzaal) - a rich, current, on-brand brain sitting unused for proactive posts.

So this is a **wire-the-last-10%** fix, not a build (doc 928 rule 3: the thing already exists).

## The fix - ZOL posts from the ICM boxes (rotating + fresh)

1. **Wire `brand-brain.ts` into ZOL's proactive draft generator.** Each draft is grounded in a real ICM box, not a WaveWarZ template.
2. **Rotate across the box set, weighted to what's ACTIVE.** Never post the same project twice in a row. Weight by activity (recent ships, the board) + calendar (upcoming events get more air - e.g. ZAOstock Oct 3). WaveWarZ becomes one of ~15 voices, not the only one.
3. **Blend evergreen ICM context with CURRENT signals** so posts read "here's what's happening NOW in <project>," not evergreen: pull recent ships/PRs, the cowork board, the ZABAL Games media library (28 recorded workshops), festival recaps, upcoming events.
4. **Keep the quality gate that already exists.** Draft -> Zaal taps Post/Skip/Edit (`drafts.ts`) -> `zolcast:` queue -> Pi casts. The approval loop is built; only the draft *source* changes. Stop any path that auto-posts without the gate.
5. **Fill the 10 empty ICM content files** (zao-festivals, zao-newsletter, fractal, coc-concertz, poidh, zuke, milk-road, farcaster, loop-engineering, magnetiq) so those brains are rich and versioned in `research/identity/icm-boxes/` - right now only 5 of 15 have a repo content file.

## The X pilot - Farcaster-first, no paid automation you don't need

- **Outbound (keep X alive): Firefly cross-post.** Firefly posts to Farcaster AND X at once. Live on Farcaster (your focus), post through Firefly, X mirrors automatically. Zero API keys, zero monthly cost, zero automation risk. Solves ~80% of "focus on Farcaster, X stays alive."
- **X-native replies (mentions like Candy's "thoughts?"):** the only piece Firefly doesn't cover. Needs ZOL + the X API - which means a **paid tier (~$200/mo; X killed free posting)**, keys in `~/.zao/private/` (never held by ZOE), and **approval classes** (auto only for low-stakes; draft-and-approve anything in Zaal's voice).
- **Recommendation: Firefly first (free, immediate). Wire ZOL+X-API for replies only if X engagement earns the $200/mo.** Don't pay to automate a platform you're stepping back from.

## Guardrails (non-negotiable)

- **ZOE never holds raw API keys.** Keys go in `~/.zao/private/` (chmod 600, the fleet vault); the ZOL agent reads them. This is not "give ZOE the keys."
- **ZOL is the social agent, not ZOE** (taxonomy: ZOE=private orchestrator, ZOL=social, ZAI=community).
- **Posting as Zaal is governed** - draft-and-approve for voice content, auto only for low-stakes. This is the "Mouth" governed-comms pattern.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Wire brand-brain ICM fetch + rotation into ZOL's proactive draft generator (the post-quality fix) | @Zaal (ZOE build) | PR | 2026-08-01 |
| Add freshness signals (recent ships, board, ZABAL media, upcoming events) to the draft context | @Zaal (ZOE build) | PR | 2026-08-04 |
| Fill the 10 empty ICM content files so those brains are rich + versioned | @Zaal | PR | 2026-08-08 |
| Set up Firefly cross-post (Farcaster -> X) - the free X-outbound path | @Zaal | Config | 2026-08-01 |
| Decide: pay ~$200/mo for X API to enable ZOL mention-replies, or Firefly-only | @Zaal | Decision | 2026-08-04 |

## Also See

- [Doc 1021](../1021-*/) - "a bot's brain = its ICM box" / one-engine-many-masks (the principle this applies)
- [Doc 1016](../../identity/1016-*/) - GEO + ICM boxes as the AI-readable surface
- [Doc 2104](../2104-fleet-coordination-deep-audit/) - fleet coordination (sibling agent-ops doc)

## Sources

- First-party, verified live 2026-07-28: `bot/src/zoe/brand-brain.ts` (ICM fetch + 7 brand boxes), `bot/src/zoe/drafts.ts` (approval UI), `bot/src/zoe/zol-queue.ts` (cast queue -> Pi), `~/.zao/private/icm-registry.json` (15 boxes). [FULL]
- X API pricing: X killed the free write tier; posting needs Basic (~$200/mo) as of 2026. [PARTIAL - confirm current tier before paying]
