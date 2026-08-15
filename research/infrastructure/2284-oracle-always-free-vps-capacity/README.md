---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-14
superseded-by:
related-docs: "2264, 1204, 601"
original-query: "Oracle Cloud Always Free as VPS capacity for the ZAO fleet - real limits, capacity reality, reclamation, alternatives"
tier: STANDARD
---

# 2284 - Oracle Cloud Always Free as ZAO fleet VPS capacity

> **Goal:** Decide whether Oracle Cloud's Always Free tier can carry real ZAO fleet workloads, and on what terms.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Fleet loop overflow onto Oracle | **USE** | 2 OCPU / 12GB carries the research and repo-improver loops, and their constant activity is what keeps the box above Oracle's idle-reclamation threshold |
| Bot hosting (ZOE and others) | **USE, as a migration** | Fits comfortably. One instance per bot token is non-negotiable (`agent-loops.md` rule 9) - moving a bot means moving it, never running a second copy |
| Oracle as the primary Ollama box | **SKIP** | The ARM allowance is 12GB, not the 24GB every guide still quotes. Runs a quantized 7-8B model, not the ones worth switching to. The Mac keeps this job |
| Oracle as hot standby for the Hostinger VPS | **SKIP** | Idle instances are reclaimed. A standby is idle by definition, so it deletes itself - a worse failure mode than having no standby, because you believe you have one |
| Home region | **Pick for latency, not capacity** | Home region is permanent; capacity shortages are temporary and Oracle's own guidance is to retry. Optimize the variable you cannot change later |
| Put ZAOstock or sponsor money through Oracle | **SKIP** | No reason to add a vendor whose free tier reclaims resources to anything revenue-bearing |

## Findings

### 1. The ARM allowance was halved, and almost every guide online is stale

Oracle's own documentation, read 2026-08-14:

> "All tenancies get the first 1,500 OCPU hours and 9,000 GB hours per month for free for VM instances using the VM.Standard.A1.Flex shape ... For Always Free tenancies, this is equivalent to 2 OCPUs and 12 GB of memory."

The arithmetic confirms the intent: 1,500 OCPU hours over a 730-hour month is 2.05 OCPU, and 9,000 GB hours is 12.3GB. The widely-cited 4 OCPU / 24GB figure corresponds to 3,000 and 18,000 hours - exactly double.

That figure was real once. A 2021 HN submission is titled "Oracle Cloud free tier - up to 4 ARM CPUs and 24 GB RAM free". Anyone reading a blog post from that era and planning around 24GB is planning around a number Oracle no longer offers.

**This is the single most load-bearing correction in this doc.** A 12GB ceiling changes what the box is for.

### 2. Idle instances are reclaimed, which eliminates the redundancy use case

Verbatim from the Always Free documentation:

> "Idle Always Free compute instances may be reclaimed by Oracle. Oracle will deem virtual machine and bare metal compute instances as idle if, during a 7-day period, the following are true:
> - CPU utilization for the 95th percentile is less than 20%
> - Network utilization is less than 20%
> - Memory utilization is less than 20% (applies to A1 shapes only)"

All three must hold, so a box doing genuine intermittent work is safe. A warm-spare that waits for a Hostinger failure satisfies all three continuously.

The failure mode is worse than not having a spare. You would discover the spare is gone at the moment you reach for it, which is by definition the moment the primary is already down. This is the same shape as `vanishing-dependencies.md` - a dependency that disappears silently, noticed only on the day it is needed.

The mitigation, if a standby is ever genuinely wanted, is to give it real recurring work so it is not a standby.

### 3. Capacity scarcity is real and officially acknowledged

Oracle documents the error rather than pretending it does not happen:

> "If you receive an 'out of host capacity' error when trying to create a Compute instance, this indicates a temporary lack of Always Free shapes in your home region. Try creating the instance in a different availability domain, or wait a while, then try to create the instance again."

Community corroboration that this persists: a **Show HN from 2026-02-15 titled "Retry script for Oracle Cloud free tier ARM instances"**. People are still shipping tooling to loop on instance creation five years into the program. Treat first-attempt failure as expected, not as a signal to abandon.

**This is why home region should be chosen for latency, not capacity.** Region is effectively permanent for a free tenancy - Always Free compute and Always Free block volume both exist only in the home region. Capacity is a temporary condition Oracle explicitly tells you to retry through. Choosing a distant region to dodge a transient shortage trades a permanent cost for a temporary one.

For Ellsworth, that argues for us-ashburn-1 and a retry loop, not us-phoenix-1.

### 4. Operational gotchas worth knowing before committing

- **Public IPv4 may not be stable.** An HN commenter (pm2222) reports: "my nodes lost public v4 IP and I have to go into portal and add v4 IP back. Since it's free tier the public IP changes. V6 IP was not affected." UNVERIFIED against Oracle docs. Before wiring any DNS or SSH config to an Oracle box, confirm whether a *reserved* public IP is inside the Always Free allowance, or use IPv6 / a dynamic-DNS updater.
- **Storage is tight and shared.** 200GB total covers boot and block volumes combined, with a 50GB minimum boot volume per instance. One ARM box at 100GB plus two micros at 50GB each consumes the entire allowance exactly.
- **One free account per person**, per Oracle's FAQ. There is no scaling this by making more accounts, and attempting it is the documented route to termination.
- **The account carries a relationship, not just a server.** HN, on whether the tier can be trusted: "You're agreeing to get audited by Oracle's lawyers and contacted by their sales just by having an account" (Someone1234). Expect sales contact at zaalp99@gmail.com.
- **The $300 / 30-day trial credit is a trap for planning.** Anything built on it dies at day 30. Build only on Always Free resources.

### 5. What this means against the current ZAO estate

The fleet currently runs on one Hostinger box, `31.97.148.88`, reachable as `vps` (see `~/.ssh/config`), plus the Pi (`ansuz`, Tailscale `100.117.191.11`) and the Mac. Doc 2264 covers the Mac offline/always-on migration.

Found while auditing this: **`~/.ssh/config` contains two `Host ansuz` blocks** - the first aliases `ansuz` to `31.97.148.88` (the Hostinger VPS) and a later one to `100.117.191.11` (the Pi). SSH takes the first match, so `ssh ansuz` currently reaches the VPS, not the Pi. This is unrelated to Oracle but is a live misconfiguration and should be fixed before adding a fourth host to the same file.

## Comparison

| Option | Cost | Compute | Reclamation risk | Fit for ZAO |
|---|---|---|---|---|
| **Oracle Always Free (ARM)** | $0 | 2 OCPU / 12GB, one box | **Yes** - idle reclamation at 20% thresholds over 7 days | Loop overflow, bot hosting |
| **Oracle Always Free (AMD micro)** | $0 | 1/8 OCPU, 1GB, x2 | Same policy | Watchdogs, healthchecks. Too small for node bots |
| **Hetzner Cloud** | PARTIAL - pricing not retrieved, see Sources | ARM and x86 shared-vCPU shapes | None - you pay, it stays | The honest comparison if Oracle's terms are unacceptable |
| **Current Hostinger VPS** | Already paid | Existing | None | Stays primary |

## Also See

- [Doc 2264](../2264-mac-offline-always-on-migration/) - the Mac always-on migration this capacity question sits next to
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the four surviving surfaces; nothing here adds a bot
- `.claude/rules/agent-loops.md` rule 9 - one instance per bot token, the constraint on any bot migration

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Create the Oracle Cloud account at oracle.com/cloud/free, home region us-ashburn-1. Done when the tenancy exists and the region is confirmed in the Console | @Zaal | Manual, gated | 2026-08-18 |
| Fix the duplicate `Host ansuz` block in `~/.ssh/config` so `ansuz` resolves to 100.117.191.11. Done when `ssh -G ansuz` reports the Tailscale IP | @Zaal | Config | 2026-08-16 |
| Provision A1 at 2 OCPU / 12GB / 100GB boot, retrying on out-of-capacity. Done when the instance is reachable over SSH | @Zaal | Infra | 2026-08-20 |
| Confirm whether a reserved public IPv4 is inside Always Free before pointing any DNS or ssh config at the box. Done when the answer is written into this doc | @Zaal | Verify | 2026-08-20 |
| Migrate one fleet loop (not a bot) as the first workload, to prove the box stays above the idle threshold. Done when 7 days pass without reclamation | @Zaal | Infra | 2026-08-28 |

## Sources

- [FULL] [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) - Always Free service list, one-account-per-person, $300/30-day trial terms. Fetched raw via curl 2026-08-14.
- [FULL] [Always Free Resources - OCI docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) - the 1,500 OCPU hours / 9,000 GB hours figure, the 2 OCPU / 12GB equivalence, idle reclamation thresholds, out-of-host-capacity guidance, 200GB block volume, micro shape details. Fetched raw via curl 2026-08-14. This is the doc that overturns the 24GB claim.
- [FULL] [HN 31019702 - "Oracle cloud 'always free' tier - can they be trusted?"](https://news.ycombinator.com/item?id=31019702) - comment tree fetched via Algolia API. Source of the sales/audit quote and the public IPv4 instability report.
- [PARTIAL - title and date only, zero comments on thread] [HN 47022311 - "Show HN: Retry script for Oracle Cloud free tier ARM instances"](https://news.ycombinator.com/item?id=47022311) - 2026-02-15. Cited only as evidence that capacity retry tooling is still being written in 2026, which the title alone supports.
- [PARTIAL - title only] [HN 27280224 - "Oracle Cloud free tier - up to 4 ARM CPUs and 24 GB RAM free"](https://news.ycombinator.com/item?id=27280224) - 2021-05-25. Cited only to date the historical 4/24 allowance.
- [FAILED - JS-rendered pricing, raw curl returned no price data; ladder not escalated to Playwright] [Hetzner Cloud](https://www.hetzner.com/cloud/) - no prices quoted in this doc rather than quote remembered figures.
- [FAILED - IP blocked, known issue per feedback_reddit_x_ip_block] r/oraclecloud search for account terminations - both `zao-fetch-reddit.sh` and direct curl returned non-JSON. Community sentiment on terminations is therefore NOT covered here and remains an open question.
