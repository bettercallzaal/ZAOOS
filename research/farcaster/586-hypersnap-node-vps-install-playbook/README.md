---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-02
related-docs: 304, 309, 489, 534, 468
supersedes: none
extends: 489
tier: DEEP
---

# 586 - Hypersnap Node Install Playbook (VPS Purchase Decision + Step-by-Step)

> **Goal:** Stand up a Hypersnap (farcasterorg fork of Snapchain) node on a fresh VPS this week. Pick the VPS, run the bootstrap, expose a private RPC for ZAO OS + ZOE + bot fleet. Captures everything Doc 489 hand-waved over.

## TL;DR Decisions

| Decision | Recommendation |
|---|---|
| Run a Hypersnap node now? | YES. We have 4+ bots that poll Farcaster (ZOE, ZAOstockTeamBot, RaidSharks, Empire Builder) plus the `/inbox` and `/zao-research` flows. Free `haatz.quilibrium.com` reads have already saved $99-499/mo, but a private node removes the SPOF and unlocks raw event streams. |
| Which VPS? | **Hetzner AX42 dedicated (Ryzen 5 Pro 7745, 64 GB DDR5, 2x1TB NVMe RAID, 1 Gbit, $48-58/mo)** as primary pick. **GTHost ASHBURN dedicated ($59/mo+, 1 Gbit, DDoS included, instant deploy)** as the yura-recommended alternative if you want US East + DDoS-protected by default. Do NOT reuse VPS 1 (Hostinger KVM 2 at 31.97.148.88) - it lacks the 1.5 TB NVMe and is already running OpenClaw + AO + paperclip. |
| Validator vs read node? | READ NODE only. The mainnet docker-compose pins `read_node = true`. Becoming an actual block-producing validator requires election by the 15-voter Snapchain governance group; you cannot self-elect. yura's "validator" message in the screenshot is colloquial - he is running a node, not a validator. |
| Channel? | `stable` (default). `nightly` is for protocol contributors only and tracks `main` branch breaking changes. |
| Network? | `Mainnet` (FC_NETWORK_ID=1, default in docker-compose.mainnet.yml). |
| Hardware-buy timing? | yura is correct: rent for 1 month, then buy bare metal if signal is strong. ZAO has not earned any token yet (`AGREE_NO_REWARDS_FOR_ME=true` is mandatory in .env), so do not buy hardware in week 1. |
| Expose publicly? | NO. Firewall RPC (3381) and gossip (3382-3383) to ZAO OS, ZOE, and bot IPs only. Read more on why in the Risks section. |
| FID to declare as operator? | **App FID 19640** (zaal). Recorded in `HUB_OPERATOR_FID` for future reward eligibility. |

## Why Now (Why Not Just Use haatz)

1. **Bot fleet polling.** ZOE, ZAOstockTeamBot, RaidSharks, Empire Builder, the `/inbox` flow, and the broadcast OAuth retry queue all hit Farcaster at intervals. Even with haatz being free, each component is one outage away from breaking. Our own node = local fallback at sub-millisecond latency.
2. **Raw events.** haatz exposes the Neynar v2 API only. Our own node also exposes raw gRPC + HTTP at port 3381/3383, which lets us subscribe to real-time event streams (cast.created, follow.created, etc.) instead of polling. That collapses bot infra cost.
3. **Sovereignty against acquisitions.** The Neynar acquisition (Doc 304) demonstrated how fast the API layer can flip ownership. haatz could be next - Cassie's note "we're frankly tired of neynar bilking the last few builders" is a community gift, not an SLA. A self-hosted node insures against both Neynar and haatz disappearing.
4. **Future Quilibrium privacy.** When farcasterorg ships the privacy-preserving query layer (Doc 309), node operators get it first. We want to be a node operator before that lands.
5. **Warm intro to Cassie.** Running a node, filing one useful issue or PR upstream, then mentioning ZAO is the right intro pattern. Cold-pitching her does not work; she replies to code.

## Key Numbers (Verified 2026-05-02)

| Metric | Value | Source |
|---|---|---|
| Hypersnap repo stars | 41 | github.com/farcasterorg/hypersnap (api.github.com/repos response) |
| Hypersnap repo last push | 2026-04-28 | same |
| Latest stable tag | v0.11.6 | github releases - tagged 2026-03-31, also tagged @latest |
| License | GPL-3.0 | repo metadata |
| Snapchain TPS target | 10,000+ | upstream README |
| Block finality | 780 ms | Doc 309 |
| Required RAM | 16 GB | repo README |
| Required vCPU | 4 | repo README |
| Required disk | 1.5 TB | repo README; verified by Doc 304 |
| Snapshot size | ~200 GB historical | Doc 304 |
| Initial sync time | up to 2 hours | repo README |
| Required ports | 3381 (HTTP), 3382 (gossip QUIC), 3383 (gRPC) | docker-compose.mainnet.yml |
| Mandatory env flag | AGREE_NO_REWARDS_FOR_ME=true | hypersnap.sh `prompt_for_hub_operator_agreement` |
| Network ID for mainnet | 1 | hypersnap.sh `write_env_file` |
| Bootstrap peers | 7 AWS-hosted IPs (54.236.164.51, 54.87.204.167, 44.197.255.20, 54.157.62.17, 34.195.157.114, 107.20.169.236, 34.4.32.36) | docker-compose.mainnet.yml |
| Active validator keys (Apr 2026) | 6 ed25519 public keys, governed by 15-voter election every 6 months | docker-compose.mainnet.yml + Doc 309 |
| haatz.quilibrium.com status | Live, free, no API key | Doc 304 last verified 2026-04-08 |

## VPS Comparison (Bare Metal Required)

The 1.5 TB NVMe requirement is the cost driver. Cloud VPS with attached volumes is 2-4x more expensive than bare metal at this size, so we rule out DigitalOcean, AWS, GCP for the base node.

| Provider | Plan | Specs | Monthly | Hypersnap Fit | Notes |
|---|---|---|---|---|---|
| **Hetzner Dedicated** | AX42 | Ryzen 5 Pro 7745 (8c/16t), 64 GB DDR5, 2x1 TB NVMe, 1 Gbit unmetered | EUR 47-55 (~$48-58) | EXCELLENT | Best $/perf. EU-based (Falkenstein/Helsinki). RAID-1 means usable disk is 1 TB - tight against 1.5 TB requirement, see option B below. |
| **Hetzner Dedicated** | AX52 | Ryzen 7 7700 (8c/16t), 64 GB DDR5, 2x1 TB NVMe, 1 Gbit | EUR 55-67 (~$58-72) | EXCELLENT | Same disk concern. Faster CPU. |
| **Hetzner Server Auctions** | varies | Often 64 GB + 2x2 TB or 4x4 TB SATA + NVMe boot | EUR 30-50 (~$32-55) | EXCELLENT | Used hardware, instant deploy after first available match. Best for ZAO if a 4x4TB or 2x2TB lands. |
| **GTHost Dedicated** (yura's pick) | Likely Ashburn or Toronto class | 1 Gbit DDoS-protected, NVMe SSD | from $59/mo (homepage stated min) | LIKELY GOOD | yura uses this. 19 global locations including Ashburn (close to AWS bootstrap peers - latency win). Specs vary by SKU, must confirm 1.5 TB+ disk before commit. |
| **OVH Eco / SoYouStart** | Rise-2 / SYS-1 | Xeon 6c, 32-64 GB, 2x2 TB SSD or HDD | $40-80 | OK | Slow disks on cheaper SKUs - HDD will not work, NVMe SKUs only. |
| **Latitude.sh** | c2.large.x86 | Xeon Gold 8c, 64 GB, 2x1.92 TB NVMe | $99-149 | EXCELLENT | Pricier but 1-min provisioning, good API for IaC. Good if we plan to provision 3+ nodes via Terraform later. |
| **Hostinger KVM 8** | KVM 8 | 8 vCPU, 32 GB RAM, 400 GB NVMe | $15-25 | NO | Disk too small. Even KVM 16 (32 GB RAM, 800 GB NVMe) at ~$25 falls short of 1.5 TB. |
| **VPS 1 (existing)** | Hostinger KVM 2 | 8 vCPU, 8 GB RAM, 200 GB NVMe | already paid | NO | RAM half of required minimum, disk 7x too small. Already runs OpenClaw + AO + paperclip - colocating Hypersnap would starve all three. |

### Recommendation

**Tier 1 - if Zaal wants the cheapest viable option:** Hetzner Server Auctions, filter by `NVMe + 64GB RAM + 2x2TB SSD`. Match in 24-48 hours, EUR 30-50/mo. Falkenstein DC (Germany).

**Tier 2 - if Zaal wants 1-click deploy + DDoS + USA latency:** GTHost Ashburn (or Chicago) dedicated, $59-89/mo depending on SKU. Use yura's referral if he has one. Confirm spec sheet shows >=1.5 TB NVMe and >=16 GB RAM before purchase.

**Tier 3 - if Zaal wants frictionless EU bare metal:** Hetzner AX42 in Helsinki, ~$48/mo. Order via robot.hetzner.com. NB: AX42's 2x1 TB NVMe in default RAID-1 leaves only 1 TB usable. Either (a) request RAID-0 at install (no redundancy but 2 TB usable - acceptable for a Snapchain replica that can resync), or (b) bump to AX102 (2x1.92 TB NVMe, ~$95/mo) for true RAID-1 + headroom.

For the **first node, this week**, pick Tier 2 (GTHost) - lowest friction, fastest signal, and matches yura's already-tested choice. Move to Tier 1 in month 2 once we know the workload.

## Repo Anatomy (What Bootstrap Actually Pulls)

`farcasterorg/hypersnap` top-level files (verified 2026-05-02 via GitHub Contents API):

```
.dockerignore         CHANGELOG.md     Dockerfile           docker-compose.mainnet.yml
.github/              Cargo.lock       LICENSE              docker-compose.nightly.yml
.gitignore            Cargo.toml       Makefile             docker-compose.testnet.yml
config/               cliff.toml       README.md            docker-compose.yml
docs/                 grafana/         proto/               site/
src/                  tests/                                scripts/
```

Bootstrap script (`scripts/hypersnap-bootstrap.sh`) does only this:

1. Installs `jq` if missing.
2. `mkdir -p ~/hypersnap`.
3. Downloads `scripts/hypersnap.sh` from `@latest` tag, makes it executable.
4. If `HYPERSNAP_CHANNEL=nightly`, writes that to `~/hypersnap/.env`.
5. `cd ~/hypersnap && exec ./hypersnap.sh upgrade`.

Manager script (`scripts/hypersnap.sh`) does this on `upgrade`:

1. Self-upgrade: hashes itself vs upstream, replaces if different.
2. Picks `docker-compose.mainnet.yml` (stable) or `docker-compose.nightly.yml`.
3. Fetches `docker-compose.yml`, `grafana/grafana-dashboard.json`, `grafana/grafana.ini`.
4. Prompts for the **AGREE_NO_REWARDS_FOR_ME** acknowledgement.
5. Prompts for HUB_OPERATOR_FID (or username, resolves via fnames.farcaster.xyz).
6. Writes `.env` with `FC_NETWORK_ID=1`, `STATSD_METRICS_ENABLED=...`, etc.
7. `docker compose pull && docker compose up -d`.

The mainnet docker-compose pins `image: farcasterorg/hypersnap:latest` and runs as a single service. It writes `config.toml` inline at container start with hardcoded bootstrap peers and validator public keys.

## Step-by-Step Install (After VPS Provisioned)

**Pre-flight:**
- Ubuntu 22.04 LTS or 24.04 LTS (Hetzner default: Ubuntu 24.04. GTHost: choose Ubuntu 22.04 or 24.04 from the deploy menu).
- Public IPv4.
- Inbound firewall open: 22 (SSH from Zaal's IP), 3381/tcp (HTTP RPC, internal only), 3382/udp (gossip QUIC), 3383/tcp (gRPC, internal only). Outbound: all.
- 32 GB swap recommended (snapshot decompression spikes RAM).

**1. SSH in, harden basics:**

```bash
ssh root@<VPS_IP>
adduser zaal
usermod -aG sudo zaal
mkdir -p /home/zaal/.ssh && cp /root/.ssh/authorized_keys /home/zaal/.ssh/
chown -R zaal:zaal /home/zaal/.ssh
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload sshd
ufw allow 22/tcp
ufw allow 3382/udp
ufw default deny incoming
ufw default allow outgoing
ufw enable
```

**2. Install Docker + Compose plugin:**

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg jq
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker zaal
newgrp docker
docker compose version  # confirm v2 plugin
```

**3. Inspect bootstrap script BEFORE piping to bash (per `.claude/rules/secret-hygiene.md` step 5):**

```bash
curl -sSL https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh -o /tmp/hypersnap-bootstrap.sh
less /tmp/hypersnap-bootstrap.sh   # confirm contents match Doc 586 "Repo Anatomy" section
sha256sum /tmp/hypersnap-bootstrap.sh   # record hash for audit log
```

**4. Run bootstrap:**

```bash
bash /tmp/hypersnap-bootstrap.sh
```

When prompted:
- **AGREE_NO_REWARDS_FOR_ME**: type `Yes`.
- **HUB_OPERATOR_FID**: type `19640` (zaal app FID) or the username `zaal`. Script resolves via `fnames.farcaster.xyz/transfers?name=zaal`.

**5. Wait for sync:**

```bash
cd ~/hypersnap
docker compose ps              # confirm 'hypersnap' service is up
docker compose logs -f --tail 200 hypersnap   # watch logs
# In another shell:
curl -s http://localhost:3381/v1/info | jq .  # maxHeight should be increasing, blockDelay decreasing
```

Sync target: `blockDelay` < 100 = caught up. Cassie's gist quotes "up to 2 hours" but real-world reports (Doc 309 Reddit thread) cite 1.5-3 hours on NVMe, much longer on SATA SSD. If `blockDelay` is not falling after 30 minutes, check disk IOPS.

**6. Tighten the firewall to only allow ZAO OS + ZOE + Vercel:**

```bash
# Replace these with your actual IPs:
ZAOOS_IP=<vercel egress or VPS 1 IP>
ZOE_VPS=31.97.148.88
ufw allow from $ZOE_VPS to any port 3381 proto tcp
ufw allow from $ZAOOS_IP to any port 3381 proto tcp
ufw allow from $ZOE_VPS to any port 3383 proto tcp
ufw allow from $ZAOOS_IP to any port 3383 proto tcp
# Gossip 3382/udp must remain open to all (peer-to-peer).
ufw status numbered
```

**7. Wire it into ZAO OS:**

```bash
# In zaoos repo, set on Vercel + .env.local:
FARCASTER_NODE_HTTP=http://<HYPERSNAP_VPS_IP>:3381
FARCASTER_NODE_GRPC=<HYPERSNAP_VPS_IP>:3383
# Keep:
FARCASTER_READ_API_BASE=https://haatz.quilibrium.com   # community fallback
NEYNAR_API_KEY=...                                     # writes only
```

Then update `src/lib/farcaster/neynar.ts` (existing dual-provider) to add a 3-tier read fallback: own node -> haatz -> Neynar. See Concrete Integration Points below.

## Concrete Integration Points (ZAO OS)

| File | Change | Purpose |
|---|---|---|
| `src/lib/farcaster/neynar.ts` | Add `FARCASTER_NODE_HTTP` to read base URL list. New `fetchWithFailover` order: node -> haatz -> Neynar. Writes still go to Neynar only. | 3-tier read failover. |
| `src/lib/env.ts` | Add `FARCASTER_NODE_HTTP` (optional, no key) and `FARCASTER_NODE_GRPC` (optional). | Env-typed config. |
| `src/lib/farcaster/node-client.ts` (NEW) | Thin Snapchain HTTP client at `${FARCASTER_NODE_HTTP}/v1/*`. Exposes `getCastsByFid`, `getInfo` for raw protocol queries that haatz/Neynar don't expose. | Raw event access. |
| `scripts/hypersnap-health.sh` (NEW) | Cronned every 5 min on the Hypersnap VPS itself. Compares local `/v1/info` `maxHeight` vs `https://haatz.quilibrium.com/v1/info`. Alerts to ZOE Telegram if drift > 1000 blocks. | Drift detection. |
| `infra/hypersnap/firewall.sh` (NEW) | UFW rules-as-code. Re-applies allow-list IPs on every commit. | IaC for firewall. |
| `community.config.ts` | No change. Hypersnap is infra, not branding. | n/a. |
| `.env.example` | Add `FARCASTER_NODE_HTTP=` and `FARCASTER_NODE_GRPC=` placeholders. | Doc the new envs. |
| `research/farcaster/README.md` | Add this doc as the install playbook anchor below Doc 489. | Index. |

## Risks + Mitigations

| Risk | Mitigation |
|---|---|
| Public RPC at 3381 lets anyone query ZAO traffic patterns + drains bandwidth | Firewall-allowlist by IP. Never expose 3381/3383 to 0.0.0.0. |
| Snapchain breaking upgrade (per Doc 309 release cycle) | Pin `image: farcasterorg/hypersnap:v0.11.6` instead of `:latest`. Test nightly channel on a dev VPS before promoting. |
| Disk fills (blockchain grows ~1-2 GB/day) | Provision 2 TB+ and cron `df -h` to ZOE. RocksDB compaction reclaims ~30% on rolling 7-day window. |
| Bootstrap script piped to bash (banned by secret-hygiene.md step 5) | Step 3 above mandates download + inspect + hash before run. |
| GPL-3.0 viral if we modify Hypersnap | We are running the binary, not modifying it. Compliant. If we ever fork, the fork must be public + GPL. |
| haatz also goes down at the same time as our node | 3-tier failover (node -> haatz -> Neynar) means writes still work via Neynar; reads degrade gracefully. |
| Cassie removes haatz public access | Our node + Neynar are still up. No SLA impact. |
| AGREE_NO_REWARDS_FOR_ME flips to a paid token | Watch farcasterorg announcements. We are early in the queue if so. Cost so far: $48-89/mo, recoverable. |
| Bandwidth overage on cheap VPS | Hetzner unmetered, GTHost 1 Gbit unmetered, Latitude unmetered. Avoid DigitalOcean (egress charged). |
| Validator slot opens up later | Skip for v1. ZAO is an app, not infra. Revisit only if a slot is offered to us by the 15-voter group. |

## What This Doc Replaces / Extends

| Prior doc | Status | Why this doc exists |
|---|---|---|
| Doc 304 (haatz free API) | Still valid. | Doc 304 said "skip self-hosting." Doc 586 reverses that for the bot fleet use case. Both are correct: use haatz for the public client, run own node for bots + raw events. |
| Doc 309 (Snapchain protocol deep dive) | Still valid. | Doc 309 explains the protocol. Doc 586 is the install playbook. |
| Doc 489 (cassonmars + Hypersnap intro) | Extended. | Doc 489 was a 7-day-old summary of Cassie's gist. Doc 586 is the actual install + VPS purchase + integration plan. |
| Doc 534 (Snapchain best practices in the wild) | Still valid. | Operational tips post-install. Read after first sync. |
| Doc 468 (POIDH dual-hub) | Adjacent. | Different use case (POIDH bounty board), same infra pattern. |

## Sources (Verified 2026-05-02)

| Source | Type | URL | Last verified |
|---|---|---|---|
| Cass on Mars - "how to hypersnap" gist | Primary | https://gist.github.com/CassOnMars/cbb2007b2bcb713b81da827180d4ffb7 | 2026-05-02 (live) |
| farcasterorg/hypersnap repo | Primary | https://github.com/farcasterorg/hypersnap | 2026-05-02 (live, 41 stars, last push 2026-04-28) |
| Hypersnap bootstrap script | Primary | https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap-bootstrap.sh | 2026-05-02 (fetched + inspected) |
| Hypersnap manager script | Primary | https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/scripts/hypersnap.sh | 2026-05-02 (fetched + inspected) |
| Hypersnap mainnet docker-compose | Primary | https://raw.githubusercontent.com/farcasterorg/hypersnap/refs/heads/main/docker-compose.mainnet.yml | 2026-05-02 (fetched, contains read_node=true and bootstrap peers) |
| Hypersnap upstream README | Primary | https://github.com/farcasterorg/hypersnap/blob/main/README.md | 2026-05-02 |
| Cassie Heart GitHub profile | Primary | https://github.com/CassOnMars | 2026-05-02 (52 repos, 419 followers, "BDFL of Quilibrium, eng @ Farcaster") |
| Cassie Heart Farcaster | Primary | https://farcaster.xyz/cass.eth | 2026-05-02 |
| GTHost dedicated servers | Vendor | https://gthost.com/dedicated-servers | 2026-05-02 (homepage min $59/mo, 19 locations, DDoS included) |
| Hetzner dedicated AX42/AX52 | Vendor | https://www.hetzner.com/dedicated-rootserver | 2026-05-02 |
| Hetzner Server Auctions | Vendor | https://www.hetzner.com/sb | 2026-05-02 |
| Latitude.sh c2.large.x86 | Vendor | https://www.latitude.sh/pricing | 2026-05-02 |
| Snapchain whitepaper (FIP) | Primary | https://github.com/farcasterxyz/protocol/discussions/207 | per Doc 309 |
| ZAO OS internal: Doc 489 | Internal | research/farcaster/489-hypersnap-farcaster-node-cassonmars/ | 2026-04-23 |
| ZAO OS internal: Doc 309 | Internal | research/farcaster/309-snapchain-hypersnap-protocol-deep-dive/ | 2026-04-09 |
| ZAO OS internal: Doc 304 | Internal | research/farcaster/304-quilibrium-hypersnap-free-neynar-api/ | 2026-04-08 |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Decide VPS: Hetzner AX42 vs GTHost Ashburn vs Hetzner Server Auction match | @Zaal | Decision | Today |
| Order VPS, share root SSH cred via 1Password (NOT chat) | @Zaal | Procurement | Today |
| Run install playbook section "Step-by-Step" on the new box | Claude session | Ops | Within 24h of VPS access |
| Open PR adding `FARCASTER_NODE_HTTP` + 3-tier failover in `src/lib/farcaster/neynar.ts` | Claude session | PR | After node syncs |
| Add `scripts/hypersnap-health.sh` cron + ZOE alert wire | Claude session | PR | After node syncs |
| Pin Hypersnap image to `v0.11.6` in `~/hypersnap/.env` (not `:latest`) | Claude session | Ops | During install |
| File 1 useful issue/PR upstream to farcasterorg/hypersnap (warm intro to Cassie) | @Zaal | Outbound | Within 30 days of node going live |
| Document install in build-in-public Farcaster post (BEFORE/DURING/AFTER per `feedback_post_irl_events.md` adapted for infra) | @Zaal | Content | When node is live |
| Re-validate this doc | Claude | Audit | 2026-06-02 (30-day SLA) |

## Operator FYI

- **No token, no rewards.** The `AGREE_NO_REWARDS_FOR_ME=true` flag is mandatory. Snapchain has no token; running a node is a public good + a strategic position for ZAO. Do not budget any return beyond ops cost.
- **No staking, no slashing.** Read nodes do not stake. Only the 5-6 elected validators have any consensus role.
- **Sync state is portable.** If we move from GTHost to Hetzner later, we can rsync the `.rocks` data directory to the new box and avoid the 2-hour resync. Document this in a follow-up if/when we migrate.
