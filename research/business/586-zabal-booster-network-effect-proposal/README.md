---
topic: business
type: decision
status: review-pending
last-validated: 2026-05-02
related-docs: 582, 583, 584, 585
tier: STANDARD
---

# 586 - ZABAL Empire Network-Effect Booster Proposal (Telegram-Ready)

> **Goal:** A drop-in proposal Zaal can paste into Telegram to Adrian (`@glankerempire`) requesting that 5 network-effect ERC-20 boosters be added to the ZABAL Empire on Empire Builder V3. Closes issue EB-18 (#433).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Send timing | SEND before Sunday 2026-05-04 official V3 announcement window. Adrian is bug-bashing in the open this week, low-friction time to ask for empire config changes. |
| Tone | PEER. Adrian is a top ZABAL holder himself (rank 3 as `diviflyy`). Frame as "we're building EB into ZAOOS, here is the booster set we want; mirrors your own glonkybot config". |
| Scope | 5 boosters in this round. Don't over-ask. Each is a top-20 empire token by `total_distributed` or `rank` (doc 584). |
| Multiplier values | 5x for the strongest fits (CLANKER, GLANKER), 3x for the rest. Mirrors glonkybot's scheme but slightly more conservative. |
| Threshold values | Use `10000000000000000000000000` = 10M tokens with 18 decimals (the same threshold glonkybot uses on every ERC-20 booster). Keeps onboarding consistent across empires. |

---

## The Proposal (paste this to Telegram)

> Hey Adrian - GM. Diving into V3 on the ZABAL side and wanted to flag one config ask. We are building Empire Builder native into ZAO OS so members can see ZABAL leaderboard / boosters / distributions inline (PRs #412 + #429). Pulled the data and noticed our boosters set is light (LOANZ, zaal, SANG, ZAAL) compared to glonkybot's 17-token cross-promotion strategy.
>
> Want to mirror your network-effect approach with 5 boosters, all ERC-20 on Base, threshold 10M tokens (matches your glonkybot threshold):
>
> 1. **CLANKER** `0x1bc0c42215582d5a085795f4badbac3ff36d1bcb` - 5x
> 2. **GLANKER** `0x33ac788bc9ccb27e9ec558fb2bde79950a6b9d5b` - 5x
> 3. **ARTBABY** `0x09f3f0ee2cf938f56bc664ce85152209a7457b07` - 3x
> 4. **BB (BizarreBeasts)** `0x0520bf1d3cee163407ada79109333ab1599b4004` - 3x
> 5. **PUSH (Keep Pushing)** `0x620468c62ad229a110365495dd0d7b7b802fab81` - 3x
>
> Rationale per token:
> - **CLANKER** is the launchpad ZABAL was deployed through. Holders are aligned with the whole Farcaster token economy.
> - **GLANKER** is your bot's native token. Reciprocates - we list yours, your members get a boost in ours, and the loop closes.
> - **ARTBABY** is the top distributor in V3 ($10.7K lifetime). Pulls in a creator audience.
> - **BB** has the highest burn ratio in the top 10 (368M burned for $3.8K distributed). Disciplined community.
> - **PUSH** is a daily-cadence motivational community - high engagement profile, good cross-rewards.
>
> Once these are live we will surface them in our /zabal channel inside ZAO OS so members can see qualification status. Happy to Zoom for 15 to walk through the rest of the questions doc 582 / 583 / 584 surfaced (especially `farToken` semantics, the `api` leaderboard write path, and the QUOTIENT booster source).

---

## Why these 5 (full reasoning)

| Booster | Why it fits ZABAL | Empire stats (doc 584) | Multiplier |
|---------|-------------------|------------------------|------------|
| CLANKER | ZABAL was launched via Clanker. Adrian's Glonkybot has it at 1.5x at a low threshold. Low cost, high signal. | Now Farcaster-owned launchpad. Network-foundational. | 5x |
| GLANKER | Adrian's empire token. ZAO honoring his network-effect strategy by including it. Reciprocity. | Highest rank score in top-20 (9.34). | 5x |
| ARTBABY | Top USD distributor in V3. Holders are creators, ZAO's natural audience. | $10,797 distributed lifetime, 5.6B burned. | 3x |
| BB | BizarreBeasts community. Highest burn-to-distribute ratio in top 10. Disciplined / loyal. | $3,854 distributed, 368M burned. | 3x |
| PUSH | "Keep Pushing" daily-greeting community. Active engagement profile, complements ZAO's GM patterns. | $4,066 distributed, 1.04B burned, owner `push-`. | 3x |

## What we are not asking for (yet)

- DICKBUTT, SAUSAGE, CLANKERMON, etc. - cultural fit unclear for ZAO right now.
- LUM, REAPS, SPARTAN, MTDV, hmbt - smaller empires, secondary.
- Any NFT booster - ZAO does not run an NFT collection at the scale ArtBaby does. Skip the NFT-collector archetype for ZABAL.

## Open Questions Bundle (separate Telegram message)

1. CORS for `zaoos.com` calling `empirebuilder.world/api/*` direct (we proxy server-side currently).
2. Rate limits per IP / per token / per endpoint.
3. `farToken` vs `tokenHolders` - what is the engagement signal in farToken?
4. `api` leaderboard - how does ZAOOS submit votes to a slot like the Zabal Voting Miniapp?
5. QUOTIENT booster - source of truth (Quotient API)?
6. `total_distributed` denomination - USD always, or token sometimes?
7. Write API timeline (distribute / burn / airdrop) and whitelisting process.
8. Webhooks (push) vs polling (current) for distribute / burn / airdrop events.

## Sources

- [Doc 584 — top creator playbooks](../584-empire-builder-farcaster-creator-playbooks/) - the data behind the 5 picks
- [Doc 583 — idea surface](../583-empire-builder-zao-os-integration-ideas/) - issue mapping
- [Empire Builder API top-empires](https://empirebuilder.world/api/top-empires?page=1&limit=20)
- [Empire Builder API glonkybot boosters](https://empirebuilder.world/api/boosters/0x33ac788bc9ccb27e9ec558fb2bde79950a6b9d5b)
- Internal: PR #412 (MVP), PR #429 (hotfix), PR #430 (doc 585), Issues #413-#433

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Paste the proposal text into Telegram to @glankerempire | @Zaal | DM | Before Sunday 2026-05-04 |
| Send the open-questions bundle as a follow-up Telegram message | @Zaal | DM | Same window |
| Once boosters land in Adrian's config, refresh `/api/boosters/<ZABAL>` and confirm in EmpirePanel Boosters tab | @Claude (next session) | Verify | After Adrian confirms |
| If Adrian asks for a 15-min Zoom, schedule via Zaal's calendar | @Zaal | Calendar | After he replies |
| Close issue EB-18 (#433) once proposal is sent and add a link comment to the issue with the Telegram timestamp | @Zaal | Issue close | After send |
