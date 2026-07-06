---
topic: infrastructure
type: audit
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 621
original-query: "Porkbun -> nexus audit - reconcile the domains I hold on Porkbun against the ZAO NEXUS directory so the directory reflects live domains and dead/parked ones get flagged"
tier: STANDARD
---

# 976 - Porkbun -> NEXUS domain audit

> **Goal:** Reconcile the domains registered on Porkbun against what the ZAO NEXUS directory + the codebase actually point to, so the directory shows live URLs and parked/dead domains get caught. This doc audits every domain the **repo declares** and hands Zaal a Porkbun-side verification checklist for what the repo cannot see.

## Scope + honest limit

I cannot read Porkbun's live DNS records or the account's domain list from here (no Porkbun API creds in-session, and I do not ask for them). So this audit has two halves:

1. **Repo-declared inventory (MEASURED)** - every domain/subdomain the ZAOOS codebase + NEXUS memory declare, and what each is supposed to resolve to. This is solid ground truth from the code.
2. **Porkbun-side checklist (FOR ZAAL TO RUN)** - the exact list of records to confirm on Porkbun, because "domain declared in config" != "DNS record exists and resolves". The gap between the two is the whole point of the audit.

Anything I did not verify live is marked plainly. No domain status is invented.

## Repo-declared domain inventory (MEASURED from code + config)

### Apex domains referenced by the ecosystem

| Domain | Declared use | Source |
|--------|-------------|--------|
| `thezao.com` / `thezao.xyz` | The ZAO main site + ZAODEVZ/ZAOcowork board (thezao.xyz) | CLAUDE.md, nexus hub |
| `zaoos.com` | ZAO OS app + subdomains (below) | `community.config.ts` |
| `wavewarz.com` (`www.`) | WaveWarZ main app | `community.config.ts:220` |
| `wavewarz.info` | WaveWarZ secondary | nexus hub memory |
| `cocconcertz.com` | COC Concertz (graduated repo) | nexus hub memory |
| `fishbowlz.xyz` | FISHBOWLZ (paused) | nexus hub memory |
| `zaofestivals.com` | ZAO Festivals | nexus hub memory |
| `bettercallzaal.com` | BCZ site + `/nexus.html` directory | nexus hub memory |
| `bczyapz.com` | BCZ YapZ (graduated) | nexus hub memory |
| `sopha.social` | External feed API (not ZAO-owned - third party) | `community.config.ts:54` |

### zaoos.com subdomains (agent dashboards, config-declared)

| Subdomain | Points to | Source | Note |
|-----------|-----------|--------|------|
| `zoe.zaoos.com` | ZOE chat dashboard | `community.config.ts:317` | auth-gated |
| `pixels.zaoos.com` | pixels app | `community.config.ts:318` | verify live |
| `paperclip.zaoos.com` | paperclip app | `community.config.ts:319` | verify live |
| `ao.zaoos.com` | AO app | `community.config.ts:320` | verify live |
| `chat.zaoos.com` / `claude.zaoos.com` | ZOE landings | nexus hub memory | "no public landing yet" - may be dead |

The nexus hub memory also lists ZAO OS subdomains `portal / chat / claude / agents / ao / paperclip / pixels / api(mcp)` - only 4 (zoe/pixels/paperclip/ao) are in the live `community.config.ts`. **portal / agents / api are declared in the human-facing nexus.html but NOT in config** - prime candidates for parked-or-dead. Flag for the checklist.

### Vercel-hosted (NOT Porkbun DNS - hosting, not registrar)

`zaonexus.vercel.app`, `intelligence.vercel.app`, `wavewarzapp.vercel.app`, `zaofractal.vercel.app`, `zabalnewsletterbuilder.vercel.app` - these resolve via Vercel, not a Porkbun A/CNAME record, so they are out of scope for a Porkbun audit except where a custom domain is meant to front them (e.g. if `nexus.thezao.xyz` should CNAME to zaonexus.vercel.app - it currently does not appear to).

## The core finding

**The NEXUS directory and the domain reality have drifted in three known ways** (from [[project_zao_nexus_sources]]):

1. There are **three disconnected NEXUS data sources** (zaonexus.vercel.app app, the orphaned ZAOOS `nexus_links` Supabase table, and 64 FAKE placeholder links in `src/lib/nexus/links.ts` with `zao.gg` URLs that were never real domains). The consolidation to one canonical `links.json` (139 links) was designed but the audit should confirm it actually shipped to zaonexus.
2. **`zao.gg` placeholder URLs** in the static links file are fabricated - they are not domains Zaal owns and should never have been in the directory. Confirm they are gone from the live directory.
3. Several **nexus.html subdomains (portal/agents/api) are not in config** - either they exist on Porkbun and config is stale, or they are dead links in the directory. Only Porkbun + a curl can say which.

## Porkbun-side checklist (Zaal runs this)

For each apex domain above, confirm on Porkbun:

- [ ] Domain is in the account and **not expiring** in the next 60 days (renewal auto-on).
- [ ] Apex `A`/`ALIAS` record resolves (curl -sI https://<domain> returns 200/301, not NXDOMAIN).
- [ ] For Vercel-fronted custom domains: the `CNAME`/`A` points at Vercel (`cname.vercel-dns.com` / `76.76.21.21`), not a parked page.
- [ ] `zaoos.com` subdomains: confirm `zoe/pixels/paperclip/ao` each have a live record; decide whether `portal/agents/api/chat/claude` should exist or be removed from nexus.html.
- [ ] Any domain that is parked / for-sale / dead -> either point it or **remove it from the NEXUS directory** so users never hit a dead link.

Fastest path: Porkbun dashboard -> Domain Management (the owned list), then `dig`/`curl -sI` each domain against the inventory table above. The delta is the audit result.

## Also See

- [[project_zao_nexus_sources]] - the 3-source drift + 139-link consolidation plan (canonical JSON at `~/.zao/nexus/`).
- [[project_nexus_hub_live]] - bettercallzaal.com/nexus.html, the 14-brand human-facing directory; ~30 URLs already flagged "need live 200 checks".
- [Doc 621](../../governance/621-zao-brand-legal-architecture/) - brand + legal architecture; the 14-brand sectioning is the de-facto org chart the domains map to.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the Porkbun-side checklist above (owned-domain list + `curl -sI` each apex against the inventory) and record the live status delta | @Zaal | Audit | 2026-07-13 |
| Remove any `zao.gg` / fabricated placeholder URLs still live in the NEXUS directory (zaonexus + `src/lib/nexus/links.ts`) | @Zaal | PR | 2026-07-13 |
| Decide keep-or-kill for `portal/agents/api/chat/claude` .zaoos.com subdomains; sync nexus.html + config to match reality | @Zaal | PR | 2026-07-20 |
| Point any parked-but-owned domain at its Vercel app, OR drop it from the directory | @Zaal | DNS | 2026-07-20 |

## Sources

- [FULL] `community.config.ts` (ZAOOS working tree, read 2026-07-06) - lines 54, 220, 317-320: the config-declared domains + zaoos.com subdomains.
- [FULL] `project_zao_nexus_sources` memory - the 3-source NEXUS drift, 139-link consolidation, `zao.gg` fake-link finding.
- [FULL] `project_nexus_hub_live` memory - the 14-brand nexus.html inventory + the ~30-URL live-check gap.
- [FAILED] Porkbun live DNS / owned-domain list - not accessible in-session (no creds; not requested). This is why the audit ships a checklist for Zaal to run rather than a live status column.
