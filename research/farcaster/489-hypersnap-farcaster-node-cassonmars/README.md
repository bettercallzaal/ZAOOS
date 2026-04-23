# 489 — Hypersnap + Cass on Mars — Run a Farcaster Snapchain Node

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Evaluate running a Farcaster Hypersnap (Snapchain-era replacement for Hubble) node on VPS infrastructure, plus a short research note on Cassie Heart (CassOnMars).

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Should ZAO run a Hypersnap node? | USE on VPS 1 (Hostinger KVM 2, per `project_openclaw_status.md`) — lowest-friction way to reduce Neynar dependency and give ZOE + portal bots a local read path. Start: **one node, read-only workloads**. |
| Bootstrap command (per CassOnMars gist)? | `mkdir hypersnap && cd hypersnap && curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh \| bash` — run after installing Docker. |
| What does a node buy us? | USE for (a) sovereignty from Neynar rate limits, (b) raw event streaming for ZAO bot fleet, (c) private analytics without third-party joins. |
| Replace Neynar entirely? | SKIP. Neynar is still the right layer for signer mgmt, image cache, and mini-app hosting. Hypersnap is additive. |
| Who is Cass on Mars? | Cassie Heart — Farcaster-core engineer, ex-Merkle Manufactory; works at the protocol layer. Also founder/maintainer of **Quilibrium** (privacy-focused decentralized network). Strong intro target for ZAO-Italy / protocol-level conversations. |
| Quilibrium fit for ZAO? | INVESTIGATE — `project_future_repos.md` already lists Quilibrium as a separate repo/API in the ZAO roadmap. Hypersnap context is a warm opening for that conversation. |

## Comparison of Options

| Option | What you get | Ops cost | Dependency risk | Fit for ZAO |
|---|---|---|---|---|
| **Hypersnap node (self-hosted)** | Raw Snapchain events + full FID data | Docker on VPS, regular updates | Low — you own it | Pilot on VPS 1 |
| Neynar API (current) | High-level cast/follow/signer APIs | $ per plan | Vendor — rate limits, SPOF | Keep as primary |
| Hubble node (legacy) | Original Farcaster hub software | Docker | Being deprecated for Snapchain | SKIP — deprecated |
| Airstack | Indexed reads | $$ | Vendor | Supplemental |
| direct Snapchain RPC (without node) | Limited | $ | Vendor | Not viable alone |

## Why Now

1. Neynar rate-limits and outages directly affected our `/inbox`, `/zao-research`, and broadcast flows in early 2026.
2. Several ZAO agents (Matricula pattern, doc 484) will each cost API calls whenever they poll for notifications. A node collapses that cost.
3. Snapchain (the replacement for classical Farcaster hubs) launched in 2025 and Hypersnap is one of the sanctioned bootstraps to spin one up quickly. The Hypersnap bootstrap script is explicitly the "just works" onramp — Cassie's gist reduces setup to 2 commands.
4. We already operate VPS 1 for OpenClaw + AO + ao.zaoos.com (`project_openclaw_status.md`, `project_ao_vps_portal_decision.md`). Adding one Docker stack is incremental.

## Hypersnap Bootstrap — What Actually Happens

```
# Prereqs
install docker
# Bootstrap
mkdir hypersnap && cd hypersnap && \
  curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | bash
```

Script (per the sanctioned upstream) handles: pulling the Snapchain node image, setting up a data volume, writing a default `docker-compose.yml`, and starting the node. First sync pulls historical Snapchain state; subsequent runs are incremental.

**Before running**: inspect the script. Secret-hygiene rule #5 applies (`.claude/rules/secret-hygiene.md` step 5): never pipe remote scripts to shell without review. Download, inspect, then run.

## Concrete Integration Points

- `infra/vps1/hypersnap/docker-compose.yml` — NEW. Pinned image version. Uses a dedicated bridge network.
- `scripts/hypersnap-health.sh` — NEW. Checks node height vs public RPC height; alerts if drift > 1000 blocks.
- `src/lib/farcaster/node-client.ts` — NEW. Read-only client. Falls back to Neynar on error.
- `src/lib/farcaster/` — existing Neynar integration stays primary; node is fallback + bulk source.
- `.env.example` — add `HYPERSNAP_RPC_URL=http://vps1:port`.
- `research/farcaster/README.md` — pointer to this doc as infra anchor.

## Cass on Mars — Quick Note

- Real name: Cassie Heart
- Handle: [@cass.eth on Farcaster](https://farcaster.xyz/cass.eth), @CassOnMars on GitHub
- Known for: Farcaster protocol contributions, Quilibrium (privacy-decentralized infra)
- Value for ZAO: high-context intros into both the Snapchain transition and privacy-infra conversations
- Approach: engage via code — run a Hypersnap node, file a useful PR or issue on the bootstrap flow, then mention ZAO work. Do not cold-pitch.

## Specific Numbers

- **2 commands** to bootstrap (Docker install + curl-piped script).
- **1** dedicated VPS we already own (Hostinger KVM 2 at 31.97.148.88 from `project_openclaw_status.md`).
- **2 tiers** of Farcaster read infra after adopting: node (primary bulk) + Neynar (signer/images/miniapps).
- **2026-04-18** — date of Cassie's gist (7 days before this research).
- **1 PR or issue upstream** = reasonable warm intro currency.

## Risks

- Snapchain spec still evolving; expect breaking upgrades. Pin versions; test before upgrading.
- Full historical sync is heavy on disk. Size the VPS volume before starting.
- Running a piped bash script blindly is the exact pattern our secret-hygiene rule forbids. Inspect before execute.
- Quilibrium is still early; cite with caution in any public ZAO roadmap slide.

## What to Skip

- SKIP running multiple nodes at once for v1. One is enough.
- SKIP writing our own Snapchain fork.
- SKIP public-facing RPC — firewall to VPS 1 private networking only.

## Sources

- [Cass on Mars — "how to hypersnap" gist](https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7)
- [Hypersnap bootstrap script](https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh)
- [farcasterorg/hypersnap](https://github.com/farcasterorg/hypersnap)
- [Snapchain announcement](https://www.merklemanufactory.com/blog/snapchain)
- [Neynar API](https://docs.neynar.com/)
- [Quilibrium](https://quilibrium.com/)
- [Cassie Heart on Farcaster](https://farcaster.xyz/cass.eth)
