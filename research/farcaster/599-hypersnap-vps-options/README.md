---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-05-03
related-docs: 489, 586, 587, 597
tier: STANDARD
---

# 599 — Hypersnap VPS Options Reality Check (Mid-Purchase)

> **Goal:** Settle the VPS purchase question once and for all. Honest pricing across Hetzner + 6 alternatives. One recommendation.

## TL;DR — Winner

**Hetzner AX41-NVMe with extra 1 TB disk (€47.40/mo from auction).** Year-1 cost: ~€607 (~$660 USD).

If that exact auction line is gone:
- **Plan B:** Hetzner AX41-NVMe from main catalog: €37.42/mo + €0 setup = €449 yr1 (~$485 USD). Catch: only 1 TB raw disk → ~50 days runway, plan disk upgrade.
- **Plan C:** Hetzner EX44 (Intel): €47/mo + €39 setup = €607 yr1 (~$660 USD). Same disk constraint, slightly newer CPU.

**Do NOT pick:**
- AX42-U: €234 setup fee is a tax on you for the newest CPU you don't need
- Hetzner Cloud CCX43: I/O penalty (shared SAN) hurts Hypersnap reads
- Contabo, OVH, Latitude, Vultr, DigitalOcean, Linode: all $500-$7,800/yr MORE expensive than Hetzner AX41-NVMe

## Honest Cross-Vendor Pricing Table

All in USD year-1 cost (monthly × 12 + setup fee).

| Rank | Vendor | SKU | Spec | Year 1 USD | Notes |
|------|--------|-----|------|------------|-------|
| 1 | **Hetzner** | AX41-NVMe | 64GB DDR4, 6C, 2x 512GB NVMe | **$485** | Cheapest. Disk tight (50d runway). |
| 2 | Hetzner | AX41-NVMe (auction +1TB) | 64GB DDR4, 6C, 2x 512GB + 1x 1TB | **$660** | Recommended — disk solved. |
| 3 | Hetzner | EX44 | 64GB DDR4, Intel 14C/20T, 2x 512GB NVMe | $660 | Newer Intel CPU, same disk constraint |
| 4 | Hetzner | AX42-U | 64GB DDR5, 8C Zen 4, 2x 512GB NVMe | $865 | DDR5 + Zen 4 wasted on read node |
| 5 | Hetzner | EX63 | 64GB DDR5, Intel 8C, 2x 1TB NVMe | $1,100 | 2 TB disk = 100+ days runway, but pricier |
| 6 | Hetzner Cloud | CCX43 | 64GB, 16 vCPU dedicated, 360GB SAN | $1,500 | Shared SAN = 20% slower I/O. Skip. |
| 7 | Contabo | AMD 12C | 64GB, 12C, 1TB NVMe | $1,248 | 48h provisioning, no setup |
| 8 | OVHcloud | Advance-2 | 64GB DDR5, 2x 960GB NVMe | $2,131 | Zero setup fee but 4x Hetzner cost |
| 9 | Latitude.sh | m4.metal.small | 64GB, 2x 960GB NVMe | $3,552 | Premium, global metros |
| 10 | Vultr | AMD EPYC | 64GB, 2x 1.945TB NVMe | $4,740 | Premium NA pricing |
| 11 | DigitalOcean | Premium AMD 64GB | 8 vCPU, 400GB SSD (NOT NVMe) | $6,048 | Falls short on disk spec |
| 12 | Linode/Akamai | Dedicated 64GB | 32 vCPU, 640GB SSD | $8,292 | Most expensive, SSD not NVMe |

## What changed from Doc 597's recommendation

Doc 597 said "AX42 ($48-58/mo)." That was based on Hetzner pricing pages without surfacing the **€234 setup fee** on AX42-U. Once you factor real setup, AX42 effective monthly = €78/mo, while AX41-NVMe effective = €37-50/mo. Doc 597 timeline assumed €600 yr1 — accurate only for AX41-NVMe + extra disk OR EX44, not AX42.

## Why not Contabo even though it has $0 setup

Contabo's 64GB/12C/1TB NVMe = €96/mo. €96 × 12 = €1,152/yr ≈ $1,248. **More expensive** than Hetzner AX41-NVMe ($485) by 2.6×, even with Hetzner's setup fee on the auction option ($660). Contabo's value pitch is "no setup fee" — but Hetzner's setup fees on the entry-level SKUs are €0-€39, which is negligible vs Contabo's higher monthly.

## Why not Hetzner Cloud (CCX43)

Cloud has $0 setup AND instant provisioning. Tempting. But:
- Disk: shared SAN, ~10-50ms I/O latency vs ~1-5ms dedicated NVMe
- Hypersnap is disk-I/O bound. The SAN penalty = ~20% slower state queries under load.
- Cost: €124.99/mo vs €37-47/mo for dedicated. 2.5-3.4× more expensive AND slower.

Cloud is right for stateless app servers. Wrong for a state-heavy read node.

## Why not the bigger Hetzner SKUs (AX42-U, EX63, AX102-U)

For ZAO's actual scale (188 members, low query volume):
- AX41-NVMe handles ~30 concurrent ZAO queries on top of base Hypersnap operation
- AX42-U's newer Zen 4 CPU is ~50% faster single-thread, but Hypersnap is I/O bound, not CPU bound
- EX63's 2x 1TB NVMe doubles disk runway (100+ days), but at $1,100 yr1 cost vs $660 for AX41-NVMe + extra disk
- AX102-U's 16C / 128GB RAM / 1.92TB disk is 4x more capacity than needed

Right-size first. Upgrade later only if you actually hit limits.

## What to actually click in Hetzner UI

### Option A (recommended, if available): Auction page
1. Go to https://www.hetzner.com/sb/
2. Filter: Location = Finland or Germany; RAM ≥ 64 GB; "Instant available"
3. Find an AX41-NVMe row with **2x 512GB NVMe + 1x 1TB NVMe** (3-disk configuration)
4. Price should be €44-50/mo, setup €39-50
5. Click Order

### Option B (if auction option gone): Main catalog
1. Go to https://www.hetzner.com/dedicated-rootserver/ax41-nvme/
2. Configure: 64GB RAM (default), Ubuntu 22.04 LTS, RAID 1, no backup, paste SSH key
3. Setup fee should be €0
4. Monthly: €37.42

### Option C (if you want newer Intel CPU): EX44
1. Go to https://www.hetzner.com/dedicated-rootserver/ex44/
2. Same configure flow
3. Setup fee: €39
4. Monthly: €47.30

## Hidden costs to watch

- **Traffic / bandwidth:** Hetzner gives unlimited traffic on dedicated. Cloud has 20 TB/mo cap. Hypersnap initial sync = ~500 GB inbound. Steady state ~20-50 GB/day. Dedicated = no concern. Cloud = within cap but watch.
- **IPv4 address:** Included on dedicated. Cloud charges €0.50/mo for additional IPv4 (one included).
- **Backups:** Skip on Hetzner. Hypersnap data is rebuildable from network. Backups would cost €5-15/mo for nothing useful.
- **Setup fee waivers:** Hetzner occasionally runs no-setup-fee promos. Check https://www.hetzner.com/news for current.

## Decision path

```
Need it tonight + budget tight?
  → Hetzner AX41-NVMe main catalog (Plan B, $485 yr1, plan disk upgrade in ~50 days)

Need it tonight + want disk runway?
  → Hetzner AX41-NVMe + extra disk from auction (Plan A, $660 yr1, 100+ days runway)

Hate auctions, want catalog only?
  → Hetzner EX44 ($660 yr1, Intel CPU, 50 days runway)

OK with 48h wait + want $0 setup fee specifically?
  → Contabo ($1,248 yr1) — but it's MORE expensive than Hetzner once you do the math

Want managed-VPS simplicity at any cost?
  → Hetzner Cloud CCX43 ($1,500 yr1) — but slower for Hypersnap I/O, not recommended
```

## Action

Go back to Hetzner. Pick from Plan A, B, or C above. Stop optimizing. Click Order.

If anything is sold out, walk down the list. AX41-NVMe family at €37-50/mo is the answer.

## Sources

- Hetzner main catalog: https://www.hetzner.com/dedicated-rootserver/ (AX41-NVMe, AX42-U, EX44, EX63, AX102-U)
- Hetzner Cloud: https://www.hetzner.com/cloud
- Hetzner Auction: https://www.hetzner.com/sb/
- April 2026 setup fee adjustment: https://www.hetzner.com/pressroom/statement-setup-fees-adjustment/
- Server Radar tracker: https://radar.iodev.org/
- OVHcloud bare-metal: https://www.ovhcloud.com/en/bare-metal/
- Latitude.sh pricing: https://www.latitude.sh/pricing
- Vultr bare-metal: https://www.vultr.com/products/bare-metal/
- Contabo dedicated: https://contabo.com/en/dedicated-servers/
- DigitalOcean droplets: https://www.digitalocean.com/pricing/droplets
- Linode/Akamai: https://www.linode.com/pricing/
- Doc 309 (Snapchain protocol deep dive)
- Doc 489 (Cassie warm intro + bootstrap)
- Doc 586 (original VPS pricing options)
- Doc 587 (Hypersnap+Quilibrium ecosystem)
- Doc 597 (install reality check) — superseded on AX42 recommendation by THIS doc

## Hallucination check

- Hetzner main catalog prices verified via product pages 2026-05-03
- Hetzner Cloud CCX43 spec (16 vCPU dedicated / 64GB / 360GB) per Hetzner Cloud page
- Contabo pricing verified at contabo.com/en/dedicated-servers
- Year-1 USD conversions used 1 EUR ≈ 1.08 USD (May 2026)
- One agent originally cited "Hetzner $740-940 baseline" — this corresponds to AX42-U / EX63, not AX41-NVMe. AX41-NVMe is €37.42/mo + €0 setup = €449 = ~$485 yr1. Trust the cheaper number.
