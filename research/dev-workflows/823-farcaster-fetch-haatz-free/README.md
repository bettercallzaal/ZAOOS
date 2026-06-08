---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "822, 820, 819"
original-query: "for farcaster lets use https://haatz.quilibrium.com/ for free read"
tier: STANDARD
---

# 823 - Farcaster Cast Fetching, Free (Haatz Snapchain Mirror)

> **Goal:** Close the last inbox fetch gap. `farcaster.xyz` links had no fetch path. Wire a free, no-key Farcaster reader using Haatz (Quilibrium's public Snapchain hub mirror) instead of a paid Neynar key.

## TL;DR

`haatz.quilibrium.com` is a **free, no-auth, full Snapchain hub read mirror** (911M messages, full mainnet, 2 shards). It implements the standard Farcaster hub HTTP API. Built `~/bin/zao-fetch-farcaster.sh` on it - resolves `farcaster.xyz/<user>/<0xshorthash>` URLs to full cast text + embeds, and `<user>` or `<fid>` to profile + recent casts. Verified live 2026-06-08. No Neynar key needed for reads.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE Haatz (`haatz.quilibrium.com`) for all Farcaster reads** | Free, no key, no rate-limit headers seen, full mainnet via standard Snapchain HTTP API. Preserves the Neynar key for writes/webhooks/enrichment where it's actually needed. |
| 2 | **Ship `~/bin/zao-fetch-farcaster.sh` and route `farcaster.xyz` / `warpcast.com` URLs to it** | Inbox auto-categorization already routes Farcaster links to `research`; now they actually resolve. Three modes: single cast, profile, FID. Verified on dwr.eth. |
| 3 | **Resolve username->FID via `/v1/userNameProofByName`; prefix-match the URL's short hash against `castsByFid`** | Farcaster share URLs carry only an 8-char hash prefix + username, not FID + full hash. The proof endpoint resolves both ENS (`USERNAME_TYPE_ENS_L1`) and fname (`USERNAME_TYPE_FNAME`); paging recent casts and prefix-matching recovers the full cast. |
| 4 | **Keep Neynar (`lookupCastByHashOrUrl`) as the paid fallback** | If Haatz goes down, Neynar's `/v2/farcaster/cast?identifier=<url>&type=url` resolves a farcaster.xyz URL directly in one call (needs the key). Haatz needs the username+pagination dance but is free. |

## Findings

### Haatz is a real Snapchain mirror (verified live 2026-06-08)

| Endpoint | Result |
|----------|--------|
| `GET /v1/info` | `numMessages: 911,248,960`, `numFidRegistrations: 3,335,847`, 2 shards, full mainnet |
| `GET /v1/userDataByFid?fid=3` | "Dan Romero" + username `dwr` + bio + pfp |
| `GET /v1/userNameProofByName?name=dwr.eth` | `{fid: 3, type: USERNAME_TYPE_ENS_L1}` |
| `GET /v1/userNameProofByName?name=dwr` | `{fid: 3, type: USERNAME_TYPE_FNAME}` |
| `GET /v1/castsByFid?fid=3&reverse=true&pageSize=N` | full cast messages (text, embeds, parentCastId, hash) |
| `GET /v1/castById?fid=&hash=<full>` | single cast by full hash |

No `x-api-key`, no token, no login. Same HTTP API shape as a self-run Farcaster hub / Snapchain node.

### The URL-resolution problem (and the fix)

A shared Farcaster URL is `farcaster.xyz/<username>/<0xSHORTHASH>` - e.g. `farcaster.xyz/dwr.eth/0x029f7cce`. The hub's `castById` needs **FID + full 40-char hash**, but the URL gives a **username + 8-char prefix**. The script bridges it:

1. `userNameProofByName?name=<username>` -> FID (handles both `.eth` and plain fnames).
2. `castsByFid?fid=<FID>&reverse=true&pageSize=1000`, paged up to 6x (~6,000 recent casts), prefix-match `hash.startswith(shorthash)`.
3. Emit text + embeds + reply-parent.

Verified end-to-end: `zao-fetch-farcaster.sh farcaster.xyz/dwr.eth/0xd658bb46` resolved to the full cast `0xd658bb462c7c1781db1cb65beaef891563ce6c0c` ("Bain*", a reply). Limitation: a very old cast from a prolific account may fall outside the recent ~6k window - then the script tells you to supply the full hash for a direct `castById`.

### Now the inbox is fully covered

| Inbox type | Path | Free? |
|-----------|------|-------|
| X tweets + Articles | `zao-fetch-x.sh` (FxTwitter, doc 822) | yes |
| Reddit | `zao-fetch-reddit.sh` v2 (OAuth, doc 820) | yes (pending creds) |
| **Farcaster** | **`zao-fetch-farcaster.sh` (Haatz, this doc)** | **yes** |
| GitHub | `gh` CLI | yes |
| Articles / blogs | WebFetch -> exa web_fetch | yes |
| YouTube / Spotify / podcasts | `zao-ingest.sh` | yes |

## ZAO Application

- `~/bin/zao-fetch-farcaster.sh` - SHIPPED + verified. The `/fetch`, `/inbox`, `/zao-research` skills should route `farcaster.xyz` / `warpcast.com` URLs here (currently they fall through to WebFetch, which gets the SPA shell).
- Saves the Neynar quota - reads go to Haatz, the key stays for writes/enrichment.
- ZAO already tracks Quilibrium (Cassie Heart's network); Haatz being a Quilibrium service is a nice ecosystem alignment - a ZAO-adjacent network powering ZAO's tooling.

## Also See

- [Doc 822](../822-x-scraping-without-login/) - X fetch fix (FxTwitter)
- [Doc 820](../820-reliable-inbox-url-fetching/) - Reddit fetch fix (OAuth)
- [Doc 819](../../agents/819-ai-coding-agent-discourse-inbox-cluster/) - the cluster that surfaced the fetch wall

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `zao-fetch-farcaster.sh` on Haatz - SHIPPED + verified | Claude | Done | 2026-06-08 |
| Route farcaster.xyz/warpcast.com in `/fetch` skill to the new script | @Zaal | Edit | Next sprint |
| Monitor Haatz uptime; if flaky, flip the inbox to Neynar `lookupCastByHashOrUrl` fallback | @Zaal | Watch | Ongoing |
| Add full-thread (replies) fetch via `castsByParent` if inbox needs conversation context | @Zaal | Enhance | When needed |

## Sources

- Haatz live tests 2026-06-08 (`/v1/info`, `/v1/userDataByFid`, `/v1/userNameProofByName`, `/v1/castsByFid`, single-cast resolution via `zao-fetch-farcaster.sh`) `[FULL - primary; every endpoint hit live, no auth, returned real mainnet data]`
- [Neynar - Lookup cast by hash or URL](https://docs.neynar.com/reference/lookup-cast-by-hash-or-url) `[FULL via exa highlight - the paid one-call fallback: /v2/farcaster/cast?identifier=<url>&type=url]`
- [Neynar - Get cast information from URL guide](https://docs.neynar.com/docs/how-to-get-cast-information-from-url) `[FULL via exa highlight - confirms farcaster.xyz URLs carry only a short hash prefix, must resolve]`
- [Snapchain Casts HTTP API reference](https://snapchain.farcaster.xyz/reference/httpapi/casts) `[FULL via exa highlight - the castById / castsByFid / castsByParent endpoint shapes Haatz implements]`
