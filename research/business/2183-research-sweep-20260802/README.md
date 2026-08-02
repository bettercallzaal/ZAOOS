---
topic: business
type: guide
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs: 2182, 2179, 780, 1264, 584
original-query: "Research sweep 2026-08-02: shiponeshot, Emerge/atown, Empire Builder tokenless empire (for Zoostr/Sparkz/ZOL), the Farcaster dev-update cast, Trinity Labs. Executed by the orchestrator as dropped ideas flowed through the per-brand-terminals system (doc 2182)."
tier: STANDARD
---

# 2183 - Research Sweep, 2026-08-02

> **Goal:** Capture the day's dropped-idea research in one durable place (they were executed live as board items via the per-brand harness, doc 2182). The actionable centerpiece: how to stand up a **tokenless empire on Empire Builder** now that Clanker v5 is delayed.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | How to launch the no-token empire (Zoostr/Sparkz) | **Empire Builder tokenless API** - `POST /api/deploy-empire-tokenless`. No Clanker v5 needed. | v5 is delayed for a security audit; the tokenless path is unblocked + ZAO already runs one. |
| 2 | Can ZOL create it autonomously | **Only if ZOL holds a signer key.** Otherwise: ZOL proposes -> Zaal signs -> ZOL submits. | The API needs an EIP-191 wallet signature - a gated step. |
| 3 | shiponeshot | **Skip** (paid starter kit, 404 repo). Look at the author's `cw` (parallel-Claude worktree mgr) instead. | ZAO has a mature stack; a boilerplate is negative value. |
| 4 | Emerge/atown | **Skip as a core tool;** revisit only if ZAO 10x's social-native video. | Nice-to-have for clips/promo, not ZAO's bespoke pipeline. |
| 5 | Trinity Labs | **Blocked - need Zaal's URL.** trinity-labs.org times out. | Can't research a dead domain; a namesake `.io` may be the wrong entity. |

## 1. Empire Builder tokenless empire (the actionable one)

**What it is:** a leaderboard-enabled community hub (a Splits SmartVault treasury) around a Farcaster profile/channel/custom slug, WITHOUT launching an ERC-20. The unblocked path while Clanker v5 waits on its audit. **ZAO already runs one:** the ZABAL Games tokenless empire `zabalgamez01e9af`, live since June 2026 ([doc 1264], FULL). So this is proven at production scale.

**Create it (API - verified from empirebuilder.world/skill/references/http-api.md):**
`POST /api/deploy-empire-tokenless` with one of three modes:
- `farcaster` - `{mode, owner:<0x wallet>, name, fid, farcasterUsername, signature, message}`
- `channel` - `{mode, owner, name, channel, signature, message}`
- `custom` - `{mode, owner, name, signature, message}`
The `signature` is EIP-191 (the wallet signs the exact templated `message` string). Response (shape UNVERIFIED): `{empireId, url, status}`.

**What it gives you:** a points leaderboard (Farcaster interaction or custom-fed scores), a branded hub at `empirebuilder.world/empire/<id>`, a create2-predicted treasury (deployed on first interaction), and an upgrade-to-token path later when v5 ships.

**UNVERIFIED:** exact UI-form steps, API rate limits, the response shape, multi-empire-per-owner. The API path is documented + trusted; the UI path is not fully confirmed.

**The ZOL angle (idea #9060/#9059):** the endpoint is one POST + a signature. If ZOL has a **dedicated signer key** (like ZOE's XMTP burner), it can go end-to-end autonomous: read the empire config (name/mode/channel) from a board task, sign, POST, report the live URL back to Telegram. If ZOL has **no key**, it's a propose->Zaal-signs->submit flow. **This is the open decision (#2) - does ZOL get a signer key, or stays gated?** (Signing = near the on-chain line; keep it gated unless Zaal deliberately gives ZOL a scoped key.)

## 2. shiponeshot (idea from wbnns link)

`github.com/wbnns/shiponeshot` is a **404**. "Ship One Shot" is a paid commercial starter kit (auth + Stripe + mobile shells) by Will Binns (@wbnns, Coinbase/Base). **Not for ZAO** - a generic boilerplate against ZAO's mature custom stack is negative value. **Real takeaway:** wbnns' OSS tools `cw` (git-worktree manager for parallel Claude Code) + `cx` (Claude Extender) map onto the per-brand-terminals / fix-PR pipeline - worth evaluating `cw`.

## 3. Emerge / atown

Emerge (tryemerge.xyz) = AI content-generation platform (image/video in social feeds, crypto-pay), founder atown / Sayeed Mehrjerdian; also Capacitr.xyz (signal->trade). The "Google Omni" cast claim is **UNVERIFIED** (site lists Mochi V2). **ZAO fit:** nice-to-have for social clips/promo (WaveWarZ visuals, festival recap clips), **not a core production tool** - ZAO's content is more bespoke/high-touch.

## 4. Farcaster dev-update (ecosystem intel)

From @farcaster's dev-update cast: **Clanker v5 delayed** (security audit extended - use the tokenless path above); **mini-app push notifications** rolling out with user settings (relevant to a ZAO mini-app); feed follower counts now reflect **Neynar score** + real activity (affects ZAO reach metrics); sponsored sign-ups live. Actionable: plan any ZAO mini-app around the new push-notif API; don't gate Sparkz on v5.

## 5. Trinity Labs - BLOCKED

`trinity-labs.org` times out (apex dead; `www` 301-loops back to it). A `trinitylabs.io` (gaming/DeFi VC) exists but is likely a different entity. **Needs Zaal's URL confirm / retry.**

## Also See

- [Doc 2182](../../agents/2182-per-brand-terminals-dispatch/) - the harness that executed these as dropped ideas.
- [Doc 2179](2179-creator-organism-stack-sparkz/) - Sparkz creator-organism (the tokenless empire is its economic-identity layer).
- [Doc 780] Adrian's Empire Builder workshop; [Doc 1264] ZABAL Games Empire Builder audit; [Doc 584] Empire Builder creator playbooks.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: does ZOL get a scoped signer key (autonomous empire create) or stays propose->Zaal-signs? | @Zaal | Decision | 2026-08-05 |
| Stand up the Zoostr/Sparkz tokenless empire via `deploy-empire-tokenless` (one signed POST) | @Zaal | Manual (signature) | 2026-08-06 |
| Evaluate wbnns' `cw` (parallel-Claude worktree mgr) for the fix-PR pipeline | @Zaal | Spike | 2026-08-09 |
| Confirm the Trinity Labs URL (retry / correct link) | @Zaal | Decision | 2026-08-04 |

## Sources

- [FULL] empirebuilder.world/skill/references/http-api.md - `deploy-empire-tokenless` endpoint + modes.
- [FULL] Doc 1264 (ZABAL Games Empire Builder audit) - `zabalgamez01e9af` tokenless empire live since June 2026.
- [FULL] Doc 780 (Adrian x Zaal Empire Builder workshop).
- [FULL] tryemerge.xyz, capacitr.xyz (Emerge/atown).
- [FAILED] github.com/wbnns/shiponeshot (404); trinity-labs.org (timeout).
- [PARTIAL] @farcaster + @atown Farcaster casts (fetched via haatz; some search paths failed).
