---
topic: farcaster
type: guide
status: research-complete
last-validated: 2026-05-22
related-docs: 591c, 707, 250, 173, 708
tier: STANDARD
---

# 710 — Mini App registration, deep-linking, and running many surfaces on zaoos.com

> **Goal:** Answer Zaal's question directly - "if I share `zaoos.com/zabal/spotlight`, does it open right there or dump the user at the main miniapp page?" - and give the registration/architecture rules for running several mini app ideas on the one `zaoos.com` domain.

## TL;DR — the direct answer

**YES, a shared `zaoos.com/zabal/spotlight` link opens directly at the spotlight surface** - it does NOT route to `/miniapp`. This works because the page carries its own `fc:miniapp` embed whose `action.url` is `zaoos.com/zabal/spotlight` (shipped in PR #614, per Doc 707). The embed's `action.url` is what launches; `homeUrl` is only the default for app-directory launches.

**One caveat that was a real bug:** if a route has NO per-route embed, it inherits the root `layout.tsx` embed - which explicitly sets `action.url = /miniapp`. So it would have dumped users at the gated chat. Doc 707 fixed `/zabal` + `/zabal/spotlight`. Any NEW surface needs the same per-route embed or it inherits `/miniapp`.

## Key Decisions / Recommendations

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Deep-link to a sub-route?** | YES. Set a per-route `fc:miniapp` embed with `action.url` = that route. Tapping the embed in a feed launches that exact URL. Confirmed against the official Mini Apps sharing spec. |
| 2 | **`zaoos.com` = how many registered apps?** | ONE. One domain = one `/.well-known/farcaster.json` = one app in the Farcaster directory ("ZAO OS"). Every route (`/zabal`, `/zabal/spotlight`, `/miniapp`, future ideas) is part of that single registered app. |
| 3 | **Want a NEW idea to be its OWN app** (own name, icon, directory tile, discovery)? | Give it a **subdomain** - e.g. `zabal.zaoos.com`. Each subdomain hosts its own manifest + its own `accountAssociation` signature = a separate registered app. |
| 4 | **Want a NEW idea to just be another surface of ZAO OS?** | Keep it a route on `zaoos.com` + add a per-route embed. Shareable + deep-links. Costs nothing. Only downside: one directory tile for the whole domain. |
| 5 | **ZABAL specifically** | DECISION POINT for Zaal - see Part 4. `/zabal` as a route of ZAO OS (current) vs `zabal.zaoos.com` as its own registered app. Current = route. Recommend route for now; promote to subdomain only when ZABAL needs its own directory presence. |
| 6 | **Every shareable route needs its own embed** | Make per-route `fc:miniapp` metadata a standard. A route with no embed inherits `/miniapp`. This is a footgun - bake it into the page template. |

## Part 1 — How registration actually works

A Mini App is "registered" by publishing a **manifest** at `https://DOMAIN/.well-known/farcaster.json`. There is no central submission form - hosting the manifest IS the registration. Farcaster clients crawl/cache it.

```json
{
  "accountAssociation": {
    "header": "...", "payload": "...", "signature": "..."
  },
  "miniapp": {
    "version": "1",
    "name": "ZAO OS",
    "iconUrl": "https://zaoos.com/icon-1024.png",
    "homeUrl": "https://zaoos.com/miniapp",
    "splashImageUrl": "...", "splashBackgroundColor": "#0a1628",
    "webhookUrl": "https://zaoos.com/api/miniapp/webhook",
    "primaryCategory": "social",
    "tags": ["community", "music", "web3", "chat"]
  }
}
```

Three rules that matter here:

1. **One manifest per domain.** `zaoos.com` has exactly one. The `accountAssociation` is a signature binding that manifest to a Farcaster FID (Zaal's, FID 19640) and to the **exact domain string** in the payload.
2. **`homeUrl`** = the default launch URL. It is used when a user opens the app from the **app directory / catalog** (no cast context). For ZAO OS it is `/miniapp`.
3. **Domain binding is exact.** The signed `payload` domain must match the host exactly - apex vs `www` mismatch silently breaks it (Doc 591c). `zaoos.com`'s manifest is signed for `zaoos.com`.

## Part 2 — Deep-linking: the three URL layers

When a link is cast, what launches depends on three layers:

| Layer | What it is | Role |
|-------|-----------|------|
| **Page URL** | The URL actually shared in the cast (e.g. `zaoos.com/zabal/spotlight`) | The page whose `<head>` is read for embed meta |
| **`action.url`** | Inside that page's `fc:miniapp` embed | **The URL the app launches at.** If omitted, defaults to the page URL. |
| **`homeUrl`** | In the domain manifest | Default launch for app-directory opens; fallback for splash config only |

**The launch rule:** tap an embed in a feed -> the app opens at `action.url`. Not `homeUrl`. `homeUrl` is only the "open from the app drawer" destination.

So:
- Share `zaoos.com/zabal` -> embed `action.url = zaoos.com/zabal` -> opens the ZABAL hub. CORRECT (shipped).
- Share `zaoos.com/zabal/spotlight` -> embed `action.url = zaoos.com/zabal/spotlight` -> opens spotlight. CORRECT (shipped).
- Open "ZAO OS" from the Farcaster app directory -> `homeUrl` -> `/miniapp` (gated chat).

**The footgun:** ZAO OS's root `layout.tsx` sets a default `fc:miniapp` embed with `action.url` EXPLICITLY = `/miniapp`. Because it is set explicitly (not omitted), the "defaults to page URL" rule never kicks in. Any route without its own embed override inherits `-> /miniapp`. That is exactly the bug Doc 707 caught and fixed for the ZABAL routes.

## Part 3 — Running multiple mini app ideas on zaoos.com

Two architectures. Pick per idea:

### Option A — Route of ZAO OS (same domain)
- New idea = `zaoos.com/newthing`, add a per-route `fc:miniapp` embed.
- Shareable, deep-links, zero registration work.
- **One** directory tile for all of `zaoos.com` ("ZAO OS"). The new idea is not separately discoverable in the Farcaster app catalog.
- Shares ZAO OS's manifest, webhook, account association.

### Option B — Its own app (subdomain)
- New idea = `newthing.zaoos.com`, its own `/.well-known/farcaster.json`, its own `accountAssociation` signature, its own `name`/`icon`/`primaryCategory`.
- Separate tile in the Farcaster app directory - independently discoverable, searchable, its own splash + identity.
- More setup per app: sign a new account association, host a second manifest, separate webhook.

| Dimension | A: Route on zaoos.com | B: Subdomain app |
|-----------|----------------------|------------------|
| Setup cost | Add an embed - minutes | New manifest + signed association - ~30 min |
| Directory tile | Shared (ZAO OS only) | Own tile, own discovery |
| Deep-linking | Yes (per-route embed) | Yes (it is the homeUrl) |
| Own name / icon / category | No | Yes |
| Best for | A surface of ZAO OS | A product with its own identity + audience |

## Part 4 — Recommendation for Zaal's surfaces

| Surface | Today | Recommendation |
|---------|-------|----------------|
| ZAO OS chat | `zaoos.com/miniapp` (homeUrl) | Keep as the registered app's home |
| ZABAL hub | `zaoos.com/zabal` (route + embed) | Keep as a route NOW. It deep-links fine. Promote to `zabal.zaoos.com` (own app) only when ZABAL should have its own Farcaster directory tile + discovery - that is a marketing decision, not a tech one |
| ZABAL Spotlight | `zaoos.com/zabal/spotlight` (route + embed) | Keep as a route - it is a surface of ZABAL, not its own app |
| Future ideas | - | Default to Option A (route + embed). Use Option B (subdomain) only when the idea needs to be found in the app catalog on its own |

**Rule of thumb:** routes for surfaces, subdomains for products. A thing people discover by browsing the Farcaster app catalog = its own subdomain app. A thing people reach by a shared link or from inside ZAO OS = a route.

## Specific Numbers

| Metric | Value |
|--------|-------|
| Manifests per domain | 1 |
| Manifest path | `/.well-known/farcaster.json` |
| ZAO OS registered FID (account association) | 19640 |
| ZAO OS homeUrl | `https://zaoos.com/miniapp` |
| ZABAL routes with per-route embeds shipped | 2 (`/zabal`, `/zabal/spotlight`) - PR #614 |
| URL layers governing launch | 3 (page URL, action.url, homeUrl) |
| icon spec | 1024x1024 PNG, no alpha |
| What a subdomain costs | 1 new manifest + 1 new signed account association |

## Comparison — where to register a new idea

| Option | Verdict | Why |
|--------|---------|-----|
| Route on `zaoos.com` + per-route embed | DEFAULT | Free, deep-links, ships in minutes |
| Subdomain `idea.zaoos.com` + own manifest | WHEN it needs own discovery | Own directory tile, own identity |
| Brand-new domain | RARELY | Only if the idea is leaving the ZAO umbrella entirely |

## Sources

- [Farcaster Mini Apps - Sharing your app](https://miniapps.farcaster.xyz/docs/guides/sharing) - confirmed `action.url` launches; defaults to page URL if omitted (verified 2026-05-22)
- [Farcaster Mini Apps - Manifest spec](https://miniapps.farcaster.xyz/docs/specification) - one manifest per domain, homeUrl, account association
- [Doc 591c - Manifest + Cross-Client audit](../591c-manifest-cross-client/) - domain binding, subdomain = separate app
- [Doc 707 - ZABAL mini app conformance](../707-zabal-miniapp-conformance/) - the per-route embed fix
- [Doc 250 - Farcaster Mini Apps llms.txt 2026](../250-farcaster-miniapps-llms-txt-2026/)
- Code: `public/.well-known/farcaster.json`, `src/app/layout.tsx` (root embed), `src/app/zabal/page.tsx` (per-route embed shipped)

URLs verified 2026-05-22.

## Also See

- [Doc 707 - ZABAL mini app conformance](../707-zabal-miniapp-conformance/) - implements per-route embeds
- [Doc 708 - ZABAL hub landing page](../../business/708-zabal-hub-landing-page/) - the hub these embeds point at
- [Doc 591c - Manifest + Cross-Client](../591c-manifest-cross-client/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Make per-route `fc:miniapp` embed a standard for every new shareable route (template/checklist) | @Zaal / Claude | Convention | Ongoing |
| Decide if ZABAL should become its own subdomain app (`zabal.zaoos.com`) for Farcaster directory discovery | @Zaal | Decision | When ZABAL marketing needs its own tile |
| For each "new idea" on zaoos.com: pick Option A (route) or B (subdomain) using Part 4 rule | @Zaal | Decision | Per idea |
| If any subdomain app is created: sign a new account association for that exact subdomain | @Zaal | Setup | At creation |
| Re-validate Mini App sharing spec | @Zaal | Doc update | 2026-06-22 |
