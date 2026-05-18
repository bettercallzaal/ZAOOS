---
topic: business
type: guide
status: research-complete
last-validated: 2026-05-04
related-docs: 361, 582, 583, 584, 585, 586
tier: STANDARD
---

# 602 - Empire Builder SKILL.md Spec: Phase 3 Unblock + 6 New Build Targets

> **Goal:** Adrian published the full V3 integration spec at `https://www.empirebuilder.world/skill/SKILL.md` (forwarded by Zaal to ZOE inbox 2026-05-03). This doc parses it, maps the new endpoints to our open issues, identifies which Phase-3 issues are NOW UNBLOCKED, and surfaces 6 new build targets the spec exposed (EB-19 through EB-24).

---

## Key Decisions / Recommendations

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Phase 3 status | UNBLOCKED. Spec ships full write API: `POST /api/distribute-prepare`, `POST /api/store-distribution`, `POST /api/store-burn`, `POST /api/store-airdrop`, `POST/DELETE /api/boosters/[empire_id]`, plus 10+ leaderboard create/refresh routes. No more waiting on Adrian for write endpoints. |
| 2 | Owner-vs-co-signer constraint | The vault `owner()` must broadcast `executeBatch` for distributions. ZABAL_OWNER = `0x7234c36A71ec237c2Ae7698e8916e0735001E9Af` (Zaal's wallet). Co-signers (any future co-emperor) cannot use the API path - they go through the web app sponsored UserOp flow. **Implication:** BANKER auto-distribute needs server-side signing as Zaal OR Zaal pre-signs and we cache the bundle. |
| 3 | Booster proposal (doc 586, lost in merge) | SHIP DIRECTLY. The `POST /api/boosters/<empire_id>` endpoint accepts an owner-signed payload. Zaal can self-add CLANKER + GLANKER + ARTBABY + BB + PUSH from his own wallet without DM-ing Adrian. Multiplier constraint: `1.1` to `5.0`, max 1 decimal place. Skip the Telegram step - run the API call. |
| 4 | API key | The user-mentioned key from Apr 30 is for `x-api-key` header. Goes in `.env.local` as `EMPIRE_BUILDER_API_KEY`. Server-only. Never paste in chat. |
| 5 | New leaderboard types ZABAL can use | 10 types now documented (was 4 in doc 584). Worth shipping for ZABAL: `farcasterChannelLeaderboards` (rank /zabal channel activity), `farcasterCastLeaderboards` (rank engagement on a single GM cast), `csvLeaderboards` (manual quarterly leaderboards for ZAOstock contributors), `apiLeaderboards` (ZAO RESPECT feed). |
| 6 | Voting Miniapp slot (doc 584) | Now we know how it works. `apiLeaderboards` requires an `apiEndpoint` URL the EB server fetches. ZAOOS hosts a JSON endpoint, EB pulls. Refresh via `PATCH /api/leaderboards/refresh/apiLeaderboards` with ~30s cooldown. Ship EB-17 native vote-cast as ZAOOS-hosted endpoint that EB consumes. |
| 7 | Burn tracking (#427 EB-9) | NOT a webhook, never was. We poll Base/Arbitrum logs for ERC-20 Transfer to `0x0` or `0xdEaD` from the ZABAL token, then `POST /api/store-burn`. Pure cron. |
| 8 | Multi-chain | SmartVault deploys on **Base 8453 AND Arbitrum 42161** with same logical address. Distribution `transactions[]` array splits across chains. Order: ascending `batchIndex` per `chainId`. Our cron must broadcast to both chains. |

## Six New Build Targets the Spec Surfaced

| New Issue | Title | Maps to spec endpoint | Old issue replaced/extends | Difficulty |
|-----------|-------|------------------------|------------------------------|------------|
| EB-19 | BANKER weekly distribute via API | `POST /api/distribute-prepare` -> `executeBatch` -> `POST /api/store-distribution` | replaces #426 EB-8 | 8/10 |
| EB-20 | Burn watcher cron + store-burn | `POST /api/store-burn` | replaces #427 EB-9 | 5/10 |
| EB-21 | ZAO RESPECT api-leaderboard JSON endpoint | `POST /api/leaderboards/apiLeaderboards` + `PATCH /api/leaderboards/refresh/apiLeaderboards` + new ZAOOS route hosting JSON | extends #420 EB-6 + new | 5/10 |
| EB-22 | /zabal Farcaster channel leaderboard slot | `POST /api/leaderboards/farcasterChannelLeaderboards` | new (informed by #422 EB-12) | 3/10 |
| EB-23 | GM streak farcasterCast leaderboard | `POST /api/leaderboards/farcasterCastLeaderboards` | new | 3/10 |
| EB-24 | Self-serve booster proposal flow | `POST /api/boosters/<empire_id>` (owner-signed) | replaces doc 586 (#433 EB-18) | 4/10 |

Also: refresh booster + leaderboard adds via `PATCH /api/leaderboards/refresh/<type>` (cooldown ~30s). Bake into all leaderboard types.

## Existing Issue Status After Spec

| Issue | Title | New status |
|-------|-------|-------------|
| #417 EB-2 | Inline empireMultiplier badge on chat messages | Same. Read-only. |
| #418 EB-3 | Live ZABAL distribution feed in /zabal | Same. Read-only. |
| #419 EB-5 | Boosters dashboard | Already shipped read-side (PR #434). Now also has add/remove path via EB-24. |
| #420 EB-6 | My Empires page | Same. Read-only. Could extend with deploy-empire if Zaal deploys more empires. |
| #421 EB-10 | Live leaderboard preview on chat URL embeds | Same. Read-only. |
| #422 EB-12 | Empire-gated chat features | Same. Top-100 set still pulled from /api/leaderboards/<id>. |
| #423 EB-13 | Auto-cast distributions to /zabal | Same. Polling-based. |
| #424 EB-14 | Stake-to-earn forecast | Same. Read-only. |
| #425 EB-7 | Cross-empire respect amplifier | UNBLOCKED. Implementable via `POST /api/boosters/<empire_id>` + ZAO RESPECT score via apiLeaderboards (EB-21). |
| #426 EB-8 | BANKER auto-distribute | UNBLOCKED. Replace with EB-19. Close #426 once EB-19 ships. |
| #427 EB-9 | Webhook receiver for distribute / burn | OBSOLETE. EB never ships webhooks; we own the polling. Replace with EB-20 (burn cron). Close #427. |
| #431 EB-16 | Cross-product slot dashboard | Shipped read-side in PR #434. |
| #432 EB-17 | Voting Miniapp surface | Read-side shipped. Write-side now spec'd via apiLeaderboards (EB-21 enables it). |
| #433 EB-18 | Booster proposal one-pager for Adrian | OBSOLETE - Zaal can self-add via API. Replace with EB-24. Close #433. |

## Spec Highlights (3 specific numbers + integration anchors)

- **2 chains**: Base `8453` + Arbitrum `42161`. Same vault address on both.
- **10 leaderboard types**: `tokenHoldersLeaderboards`, `nftLeaderboards`, `apiLeaderboards`, `csvLeaderboards`, `farTokenLeaderboards`, `tipnLeaderboards`, `farcasterCastLeaderboards`, `farcasterChannelLeaderboards`, `farcasterInteractionLeaderboards`, `quotientLeaderboards`. Each has its own `POST /api/leaderboards/<type>` create endpoint.
- **3 distribution modes**: `even` (split equally), `weighted` (by score), `raffle` (with `raffleWinnerCount`).
- Booster multiplier range: `1.1` to `5.0`, max 1 decimal place.
- Refresh cooldown per leaderboard: ~30s.
- Signature field name varies: `signerAddress` for leaderboard creates, `signer` for boosters and `distribute-prepare`.
- `distribute-prepare` returns `transactions[]`. Broadcast in ascending `batchIndex` per `chainId`. Success when `receipt.status === 1`.
- ABI: SmartVault is ERC-4337. `execute(Call)` and `executeBatch(Call[])`. Co-signer EOA reverts `Unauthorized` on direct calls.

## Recommended Ship Sequence (Iteration-3)

| Order | Issue | Why first |
|-------|-------|-----------|
| 1 | EB-24 (self-serve booster add) | Smallest scope, validates owner-signing flow end-to-end, immediately ships the booster expansion (CLANKER/GLANKER/ARTBABY/BB/PUSH) the team has been waiting on |
| 2 | EB-20 (burn watcher cron) | No signing needed, only API key. Pure polling. Closes #427. |
| 3 | EB-22 (Farcaster channel leaderboard slot creation) | One signed POST. Adds the /zabal channel as a new leaderboard type for ZABAL. Surfaces in our existing EmpirePanel (PR #434) automatically. |
| 4 | EB-21 (apiLeaderboards JSON endpoint for ZAO RESPECT) | Builds on existing `src/lib/respect/leaderboard.ts`. Lets ZABAL Empire pull live OG/ZOR scores. |
| 5 | EB-23 (farcasterCast GM streak leaderboard) | Pick a recurring GM cast, score by likes/recasts. Fun + low risk. |
| 6 | EB-19 (BANKER weekly distribute) | Highest difficulty. Requires owner-signing infra, on-chain gas (Base + Arbitrum), and transaction tracking. Save for last after the 5 above prove the signing/refresh flow. |

## Risks + Open Questions

| Risk / Question | Mitigation |
|------------------|-------------|
| Owner-signing infra | EB-24 first as smallest test of EIP-191 flow. If Zaal doesn't want a server-side wallet that IS the owner, build a "request signature" UI where Zaal pastes a signed message into the dashboard. |
| Gas pre-funding for EB-19 | ZABAL_OWNER wallet must hold ETH on Base + Arbitrum to broadcast. Forecast gas costs before shipping. |
| Spec drift | The SKILL.md is dated as of 2026-05-03. Recheck before shipping each iteration-3 issue. |
| Sponsored UserOp path (web app) | We do NOT use this. API integration is direct vault `executeBatch` only. Don't conflate. |
| Token type for new leaderboards | `apiLeaderboards`, `nftLeaderboards`, `tipnLeaderboards`, `farTokenLeaderboards`, `quotientLeaderboards` reject tokenless empires. ZABAL is token-based so unaffected. |

## Sources

External (verified 2026-05-04):
- [Empire Builder skill index](https://www.empirebuilder.world/skill/SKILL.md)
- [Empire Builder HTTP API reference](https://www.empirebuilder.world/skill/references/http-api.md)
- [Empire Builder workflows reference](https://www.empirebuilder.world/skill/references/workflows.md)
- [Empire Builder contracts reference](https://www.empirebuilder.world/skill/references/contracts.md)

Inbox source:
- ZOE inbox message from `zaalp99@gmail.com` dated 2026-05-03T23:05:12Z, subject = URL only, body = `https://www.empirebuilder.world/skill/SKILL.md`

Internal:
- [Doc 361](../361-empire-builder-deep-dive-v3-integration/) - V2 baseline + ZABAL token address
- [Doc 582](../582-empire-builder-v3-live-launch/) - V3 endpoint surface
- [Doc 583](../583-empire-builder-zao-os-integration-ideas/) - 15-idea iteration-1 surface
- [Doc 584](../584-empire-builder-farcaster-creator-playbooks/) - top-creator playbooks DEEP
- [Doc 585](../585-empire-builder-test-loop-ideas-iteration-2/) - test-loop findings
- Memory: `project_empire_builder_zabal_integration.md`
- Code: `src/lib/empire-builder/{config,types,client,cache}.ts`, `src/components/chat/EmpirePanel.tsx`
- Issues: #413-#427 (iteration-1), #431-#433 (iteration-2)

Community sources: SKILL.md is Adrian's official spec - skip Reddit/X for STANDARD tier (zero new signal vs the spec).

## Also See

- [Doc 584](../584-empire-builder-farcaster-creator-playbooks/) - the live-data deep dive
- [Doc 585](../585-empire-builder-test-loop-ideas-iteration-2/) - iteration-2 idea ranking
- [Doc 586 in PR #434 commit](../586-zabal-booster-network-effect-proposal/) - the booster proposal text (lost in merge, OBSOLETE per EB-24)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Open 6 new GitHub issues EB-19 through EB-24 with the acceptance criteria above | @Claude | Issues | After this PR lands |
| Close obsolete issues #426 (replaced by EB-19), #427 (replaced by EB-20), #433 (replaced by EB-24) with link to this doc | @Claude | Issue close | After issues open |
| Add `EMPIRE_BUILDER_API_KEY` to Vercel env (production + preview). Confirm key from Adrian via Telegram. | @Zaal | Vercel UI | Before shipping EB-24 |
| Pick start point for iteration-3: recommend EB-24 (booster self-serve) as the smallest end-to-end signing test | @Zaal | Decision | Next session |
| Update `src/lib/empire-builder/types.ts` with the 6 new leaderboard types (`csvLeaderboards`, `tipnLeaderboards`, `farcasterCastLeaderboards`, `farcasterChannelLeaderboards`, `farcasterInteractionLeaderboards`, `quotientLeaderboards`) | @Claude (next session) | PR | Before shipping any leaderboard-creation endpoint |
| Mark inbox message from 2026-05-03 as `processed` with labels `[research, processed]` | @Claude | inbox API | This session |

## Staleness Notes

- All spec data current as of 2026-05-04. SKILL.md may evolve; recheck before each iteration-3 issue ships.
- The booster proposal in doc 586 is now OBSOLETE - Zaal self-adds boosters via API instead of DM-ing Adrian. Close issue #433 once EB-24 ships.
