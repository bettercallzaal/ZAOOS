---
topic: farcaster
type: decision
status: research-complete
last-validated: 2026-08-25
superseded-by:
related-docs: "304, 309, 489, 586, 587, 588, 589, 597, 643, 823"
original-query: "STANDARD on hypersnap, Cassie's fork of Farcaster. Zaal plans the ZAO social on it (async Respect Game in-feed, ZID identity, member-run nodes) and it has zero documentation on this machine. The doc must answer: 1) what hypersnap is - repo, author, relation to Farcaster protocol and snapchain, divergence; 2) state - last commit, activity, production users; 3) LICENSE read from the file, never the API field; 4) node requirements - hardware, ops, cost; 5) ZAO feasibility and the fallback if unsuitable (vanilla hub, snapchain, custom)."
tier: STANDARD
---

# 2418 - Hypersnap: what it actually is, what state it is in, and whether ZAO social can stand on it

> **Goal:** Answer the five hypersnap questions blocking L4 of the decentralization scale, with every claim traced to a file, an API response, or a live node.

## THE PREMISE OF THIS RESEARCH WAS WRONG - READ THIS FIRST

The brief said hypersnap "has zero documentation on this machine," and
`~/zao-vault/notes/zao-decentralization-scale.md` states it more strongly:

> "**Hypersnap is not documented anywhere on disk** - no note, no repo, no
> research doc mentions it. Before L4 anything, it needs a research pass...
> That is the single biggest unknown on this scale."

**That is false, and it is false by a wide margin.** Measured 2026-08-25 by
`find` and `grep -ril` over `research/`, `src/`, and the memory directory:

| What exists | Count | Evidence |
|---|---|---|
| Research doc directories on hypersnap / Cassie / haatz | **19** | `find research -type d` matching `hypersnap\|cassie\|haatz\|fip-live` |
| Hypersnap-specific doc directories | **9** | `_archive/010`, `farcaster/304`, `309`, `489`, `586`, `587`, `589`, `597`, `infrastructure/643` |
| A dedicated memory file | **1** | `memory/project_hypersnap_node_install.md`, ~200 lines, install playbook + Cassie engagement playbook |
| Production ZAO code paths | **2** | `src/lib/env.ts:88`, `src/lib/farcaster/neynar.ts:4-32` |
| Unmerged branch of stranded research | **1** | `ws/research-599-hypersnap-vps-options`, still on origin |

The single biggest unknown on the decentralization scale was in fact the most
heavily researched topic in the Farcaster folder. A VPS purchase for a hypersnap
node reached the Hetzner checkout page on 2026-05-04 and was paused there.

**Why this matters more than the hypersnap answer itself.** L4 was described as
blocked on an unknown. It is not blocked on an unknown; it is blocked on a
decision that was deferred four months ago and then forgotten. Those are
different problems with different fixes, and the note sent a lane to re-research
something already answered. This is the exact failure
`.claude/rules/confirm-before-claiming-absence.md` exists to prevent: an absence
claim asserted without an exhaustive search, written into a durable artifact,
and then read as fact by everything downstream.

The correction to the vault note is Next Action 1.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Do NOT build ZAO social on a self-run hypersnap node in 2026.** | Bus factor 1 (CassOnMars is the sole committer on all 12 most-recent commits), no tagged release since v0.11.8 on 2026-05-07, outside PRs unreviewed for 3+ months, and a 2026-08-09 commit message that reads `final snapchain version for parity`. |
| 2 | **DO keep using haatz as a free read proxy. It already works and ZAO already ships the code.** | `src/lib/farcaster/neynar.ts` has proxy support with Neynar failover built and merged. Live `/v1/info` answered in one request on 2026-08-25. This is the 80% of the value at 0% of the ops. |
| 3 | **If ZAO ever self-hosts, run vanilla `farcasterxyz/snapchain`, not hypersnap.** | Same GPL-3.0 license, same 16GB/4-core/1.5TB floor, same wire protocol - but 20 contributors instead of 1, releases through v0.14.2 on 2026-08-13, and it is the canonical implementation ZAO's bots already read from. |
| 4 | **L4 does not require running any node at all.** | ZAO social needs an app on Farcaster, not infrastructure under it. Node ownership is L7's problem, and L7 explicitly depends on L4's stack choice, not the reverse. |
| 5 | **Recover the stranded doc-599 branch before it is lost.** | `ws/research-599-hypersnap-vps-options` never merged, and number 599 is now taken by **four** different docs on main (`business/599-adam-meeting...`, `agents/599-zao-bonfire-bridge...`, `events/599-inbox-digest-2026-05-03`, `infrastructure/599-podcast-mp3-hosting-bcz-yapz`). The VPS cost comparison lives only on that branch. |

## 1. What hypersnap is

**Repo:** `farcasterorg/hypersnap` - Rust, 62 stars, 23 forks, 13 open issues,
created 2026-01-04, 12.3 MB. `QuilibriumNetwork/hypersnap` redirects to the same
repo (identical `created_at` and payload), so the project was transferred or
renamed into the `farcasterorg` account.

**Author:** Cassie Heart (`CassOnMars`) maintains it. She is **not** the author of
the codebase.

**Relation to snapchain - it is a hard fork, and the contributor list proves it.**
The GitHub API reports `"fork": false`, which only means it was not created with
the fork button. The all-time contributor list is the real evidence:

| Contributor | Commits | Who |
|---|---|---|
| aditiharini | 245 | Farcaster / Merkle core |
| sanjayprabhu | 154 | Farcaster / Merkle core |
| **CassOnMars** | **79** | **the hypersnap maintainer** |
| adityapk00 | 75 | Farcaster co-founder |
| suurkivi | 61 | Farcaster core |
| varunsrin | 5 | Farcaster co-founder |

The git history is snapchain's history. `CHANGELOG.md` carries upstream snapchain
entries verbatim, referencing snapchain PR numbers (`#942`, `#939`, `#747`) and
tasks like `Add Degen Validator` that have nothing to do with the fork.

**Divergence - "hyper mode", documented in `docs/hyper.md`.** This is the only
file in the repo that describes hypersnap rather than snapchain. Quoting it
directly:

> "This document captures the plan for running a **hyper** copy of the network
> alongside the canonical path. Hyper peers mimic the public protocol for every
> legacy interaction while maintaining a second execution context where pruning
> limits do not apply and new rules can be evaluated."

Concretely:

- `StateContext::{Legacy, Hyper}` tags every storage interaction; RocksDB keys
  are namespaced by context.
- **Pruning becomes a no-op in the hyper context.** Canonical Farcaster prunes
  messages under storage-rent limits. A hyper node keeps everything, forever.
- A dual pipeline runs both paths; each canonical block emits an extra
  `HyperEnvelope` carrying the hyper state root and retained message count.
- Gossip advertises `CAPABILITY_HYPER`. **Legacy peers never receive the hyper
  extension**, so a hyper node is wire-compatible with the real network.
- Defaults keep hyper mode **disabled**; enabling it is explicit configuration.

**So hypersnap is not a competing network or an alternative social graph.** It is
a superset node on the same Farcaster network whose distinguishing feature is
unpruned history. For an async Respect Game - where a durable record of who
interacted with whom is the settlement input - unpruned history is a genuinely
relevant property. That is the strongest technical argument in its favour, and it
is not strong enough to outweigh section 2.

## 2. State, measured 2026-08-25

| Signal | Value | Read from |
|---|---|---|
| Last commit | **2026-08-09** (16 days before this doc) | `commits?per_page=12` |
| Message of that commit | `bump for publish`; the one before it: **`fix disjoint with v19, final snapchain version for parity`** (20 files, +1610/-1439) | same |
| Recent authorship | **CassOnMars on all 12 most-recent commits** | same |
| Latest tagged release | **v0.11.8, 2026-05-07** - 3.5 months before this doc | `releases` |
| Total releases ever | 3 (`v0.11.8`, `v0.11.6`, `@latest`) | `tags` |
| Open issues + PRs | 13 | `issues?state=open` |
| Newest open issue or PR | **2026-06-08** | same |

**The phrase `final snapchain version for parity` is the single most important
signal in this doc.** It reads as a declaration that hypersnap has stopped
tracking upstream. Upstream has not stopped: `farcasterxyz/snapchain` released
**v0.14.1 on 2026-08-07** and committed `release v0.14.2` on **2026-08-13**.
Cassie's own live node reports version **0.13.5**. Hypersnap is a minor version
behind and, on the plain reading of that commit, intends to stay there.

**Production users.** One confirmed: `haatz.quilibrium.com`, Cassie's own node,
which ZAO already uses. No second production deployment was identified. The
network the node serves is real and healthy - but that is Farcaster's health, not
hypersnap's adoption.

**Live network state** (`GET https://haatz.quilibrium.com/v1/info`, 2026-08-25):

| Metric | Value |
|---|---|
| version | `0.13.5` |
| messages | **913,407,085** |
| FID registrations | **3,348,249** |
| approximate DB size | **787,792,319,775 bytes (~788 GB)** |
| shard heights | 43,774,536 / 44,420,901 / 44,257,424 |
| blockDelay | 0-3 (node is caught up) |

Against the same endpoint recorded on 2026-05-02 in
`memory/project_hypersnap_node_install.md` (908M messages, 3.3M FIDs, 773 GB),
over 115 days:

- messages **+~5.4M (+0.6%)**
- disk **+~15 GB**, i.e. **~129 MB/day, ~47 GB/year**
- shard 1 advanced 34.6M -> 44.42M blocks = 85,391 blocks/day = **0.99 blocks/sec**,
  confirming the ~1 second block time empirically for a second time

**One anomaly, reported without a confident interpretation.** Shards 1 and 2 both
returned a `mempoolSize` of exactly `2^32 - 1` (4,294,967,295). Shard 0 returned
`0`. This is either a `u32` underflow or a sentinel meaning "unknown". It is not
diagnosable from a single field and is recorded here only so a future reader does
not treat 4.29 billion queued messages as a real number.

**Community signal: effectively zero outside the Farcaster ecosystem.** Hacker
News Algolia returns **11,999 hits for `hypersnap` and not one of them is this
project** - they are `HyperSnatch`, Meta `Hyperscape`, and Windows threads. A
`snapchain farcaster` query returns **3 hits**, none substantive. Reddit was not
attempted: `.claude/rules` and doc 2282 record that reddit is fully walled from
this machine, and a snippet is not a source.

**The real community source is the issue tracker, and it is unflattering:**

| Item | Opened | By | What it says |
|---|---|---|---|
| IS #26 | 2026-05-11 | 0xsoli | "README install command points to farcasterxyz/snapchain inst[ead]" - **still open** |
| IS #19 | 2026-05-03 | issam2021 | "Improve onboarding experience & missing documentation for ne[w users]" - **still open** |
| PR #31 | 2026-05-20 | jpfraneto | "Add Hypersnap Lite relay mode" - a substantive contribution, **unreviewed for 3 months** |
| PR #29 | 2026-05-18 | jfarid27 | "Adds following timeline for requested fid" - **unreviewed for 3 months** |
| IS #25, #15, #16, #18 | 2026-04/05 | various | "Where can I claim", "fork rewards" - airdrop farmers, noise |

Issue #26 is independently confirmed by this research: **the hypersnap README is
still snapchain's README, unmodified.** It opens `# Snapchain`, calls itself "the
open-source, canonical implementation," and its install instructions tell you to
you to `git clone` the **farcasterxyz/snapchain** repo over SSH. A community member
reported this 3.5 months ago and it has not been fixed. Outside `docs/hyper.md`,
**hypersnap ships no documentation of its own.**

## 3. LICENSE - read from the file

Per hard requirement 13, the licence was read from the file, not the API field:

```
gh api repos/farcasterorg/hypersnap/contents/LICENSE --jq .content | base64 -d | head -30
```

Returns verbatim **GNU GENERAL PUBLIC LICENSE Version 3, 29 June 2007**, file
size **35,149 bytes** (the standard unmodified GPLv3 text). `LICENSE` is the only
licence-shaped file at the repo root. The API field also said `GPL-3.0`; this
time it agreed, but the file is the authority.

**Upstream `farcasterxyz/snapchain` carries the identical licence** - GPL-3.0,
`LICENSE` file, byte-for-byte the same 35,149 bytes. So hypersnap inherits GPL
from upstream rather than relicensing it. There is no licence conflict and no
relicensing question.

**What GPL-3.0 means for ZAO, precisely:**

- **Running a node - modified or not - triggers nothing.** GPLv3 has no
  network-use clause. That is AGPL, and this is not AGPL.
- **Distributing a modified binary or image triggers source disclosure.** If ZAO
  patches hypersnap and ships that build to members running their own nodes
  (exactly the L7 plan), the modified source must be offered under GPL-3.0.
- **This does not infect ZAOOS.** ZAO talks to the node over HTTP. Calling a
  GPL program's network API is not linking.
- Credit is required regardless, per `.claude/rules/credit-attribution.md`.

L7 - "hypersnap node packaged so a member can run one" - is the one plan on the
decentralization scale that would actually engage the copyleft obligation. It is
satisfiable (publish the patched fork), but it must be a deliberate choice rather
than a surprise.

## 4. Node requirements, ops, and cost

**Hardware floor**, from the README (which is snapchain's, so these are
canonical-snapchain numbers and hypersnap inherits them):

- **16 GB RAM**
- **4 CPU cores or vCPUs**
- **1.5 TB free storage**
- **A public IP address**
- **Ports 3381-3383 open on both TCP and UDP**

**Storage reality check.** The live canonical DB is **788 GB** today and grows at
**~47 GB/year** on the measured rate, so 1.5 TB is a sane floor with roughly 15
years of headroom - *for the canonical path*. **Hyper mode removes pruning
entirely.** `docs/hyper.md` says pruning "becomes a no-op" and warns operators to
"monitor disk usage... to ensure the unbounded store remains healthy." The repo
offers no figure for what unpruned history costs, and neither does this doc,
because nothing measurable exists to cite. **Anyone enabling hyper mode is
accepting an unbounded and unquantified disk commitment.** Hyper mode is disabled
by default, which is the correct default.

**Ops.** Bootstrap is a piped shell script; a new node downloads historical
snapshots and takes **up to 2 hours** to catch up before syncing. Health is
`curl http://localhost:3381/v1/info`, watching `maxHeight` rise and `blockDelay`
fall toward zero. Upgrades are `./snapchain.sh upgrade`. Note that the bootstrap
URL in the README points at **farcasterxyz/snapchain**, so following hypersnap's
own README installs upstream snapchain, not hypersnap (issue #26). Per
`.claude/rules/secret-hygiene.md`, inspect any bootstrap script - checksum and
read it - before piping it to bash.

**Cost.** The last real quote is dated and is recorded here with its date rather
than presented as current: on **2026-05-04** a Hetzner **AX41-NVMe** (Finland
HEL1) was priced at **EUR 38.40/mo + EUR 39 setup**, reaching **EUR 45.70/mo with
19% VAT**, and Zaal reached the checkout page without confirming. A cross-vendor
year-1 comparison in that same session put Hetzner AX41-NVMe at **$485-660**
against Contabo $1,248, OVH $2,131, Vultr $4,740, DigitalOcean $6,048 and Linode
$8,292. **Re-quote before acting** - these are 3.7 months old, and the detailed
comparison lives on the stranded `ws/research-599-hypersnap-vps-options` branch (unmerged; 599 now collides four ways on main).
A live fetch of Hetzner's AX41-NVMe page returned HTTP 200 with JS-rendered
pricing and no price in the static HTML; this is marked PARTIAL in Sources rather
than filled in with a guess.

Snapchain's own README targets "**< $1,000/month**" for data availability, which
is the ceiling the design is built against, not what a single read node costs.

## 5. ZAO feasibility - and the integration that already exists

**The read-path integration is already built and merged.** This is the second
thing the vault note's absence claim obscured:

- `src/lib/env.ts:88` declares `FARCASTER_READ_API_BASE` as an optional env var,
  commented "Farcaster read API proxy (e.g., Hypersnap free Neynar proxy)".
- `src/lib/farcaster/neynar.ts:4-32` sets `READ_BASE` from it, and `readHeaders()`
  **drops the Neynar API key** when the proxy is set, because haatz needs no key.
- `fetchWithFailover()` tries the proxy and falls back to Neynar on any non-OK
  response or throw.
- `src/lib/farcaster/neynar.ts:158-175` documents a silent-failure case already
  caught in the wild: haatz returns **HTTP 200** for `/user/bulk` but does not
  populate the `experimental` block, so `getNeynarUserScore` deliberately
  bypasses the proxy. Failover would never fire, because 200 reads as success.
  That is `.claude/rules/silent-failure-guard.md` rule 2, found and handled on
  2026-05-20.

State honestly, per `.claude/rules/state-claims.md` rule 5: this is **BUILT and
WIRED**. Whether `FARCASTER_READ_API_BASE` is actually **SET** in production was
not verified - reading the env file was correctly blocked in this session, so no
claim is made either way.

**Against Zaal's three L4 requirements:**

| Requirement | Does hypersnap enable it? | Reality |
|---|---|---|
| Async Respect Game in-feed | **No differently than vanilla Farcaster** | The game is an app reading and writing casts. Any hub or Neynar serves it. Hyper mode's unpruned history helps *settlement auditing*, not the feed. |
| ZID identity layer | **No** | ZIDs are ZAO's own numbering. The ZID system is already built - its migration sits in `scripts/archive/old/`. It binds to FIDs and wallets, not to a node implementation. |
| Member-run nodes | **Yes, and this is the only real fit** | This is L7. It needs a packaged, documented, maintained node. Hypersnap today has one maintainer, no release in 3.5 months, and a README that installs a different project. |

**The disqualifying issue is not technical, it is maintenance.** Hypersnap works;
its live node answered every request made during this research in under a second.
But asking 20+ ZAO members to run infrastructure means committing them to a
codebase with a bus factor of 1, whose maintainer has signalled parity with
upstream is finished, and whose contributors' PRs have gone unread since May.
When that node breaks at 2am, the escalation path is one person who is also
running Quilibrium.

**Fallback comparison:**

| Option | Cost | Ops burden | Maintenance risk | Verdict |
|---|---|---|---|---|
| **haatz read proxy** (today) | **$0** | **none** | Cassie's node goes dark; ZAO auto-fails-over to Neynar, already coded | **KEEP - this is the recommendation** |
| **Vanilla `farcasterxyz/snapchain`** self-hosted | ~$46/mo + 1.5TB | bootstrap, 2h sync, upgrades, monitoring | **Low** - 20 contributors, releases through v0.14.2 on 2026-08-13, canonical implementation | **USE THIS if ZAO ever self-hosts** |
| **Hypersnap** self-hosted | same as above | same, plus undocumented divergence | **High** - single maintainer, no release since 2026-05-07, `final snapchain version for parity` | **SKIP for now** |
| **Neynar managed** (status quo for writes) | $99-499/mo | none | vendor dependency; the acquisition risk that motivated this in the first place | **KEEP for writes** - haatz cuts the read bill 70-90% per doc 589 |
| **Custom / non-Farcaster social** | very high | total | ZAO builds and owns a social protocol | **SKIP** - nothing in the L4 goal requires leaving Farcaster |

**Unpruned history is the one reason to revisit this.** If the async Respect Game
settles real value on-chain from social interactions, and canonical pruning would
erase the evidence those settlements were computed from, hyper mode becomes a
genuine requirement rather than a nice-to-have. That is an L3 question - once the
async game's settlement inputs are specified, check whether canonical retention
covers them. If it does not, this decision reopens, and the right move then is
probably to ask Cassie directly rather than self-host.

## Also See

- [Doc 586](../586-hypersnap-node-vps-install-playbook/) - the install playbook, read-node config, 3-tier failover design
- [Doc 587](../587-hypersnap-quilibrium-farcasterorg-ecosystem-may2026/) - ecosystem, FIP-11/13/19, validator math
- [Doc 588](../588-cassie-heart-github-deep-profile/) - **read before any outreach**; contains explicit do-not-do list
- [Doc 589](../589-haatz-coverage-cassie-casts-may2026/) - the 30+ free haatz endpoints and what is NOT served
- [Doc 597](../597-hypersnap-install-prep/) - superseded on VPS choice by the stranded 599 branch
- [Doc 304](../304-quilibrium-hypersnap-free-neynar-api/) / [Doc 309](../309-snapchain-hypersnap-protocol-deep-dive/) / [Doc 489](../489-hypersnap-farcaster-node-cassonmars/) - earlier passes
- [Doc 643](../../infrastructure/643-hypersnap-run-a-node/) - run-a-node angle
- [Doc 823](../../dev-workflows/823-farcaster-fetch-haatz-free/) - the keyless fetch path in daily use
- `~/zao-vault/notes/zao-decentralization-scale.md` L4/L7 - the decision this feeds
- `~/zao-vault/people/Cassie.md` - relationship context

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Correct `zao-decentralization-scale.md`: replace "Hypersnap is not documented anywhere on disk" with a link to this doc + the 9 prior docs; change L4's gate from "hypersnap research pass done" to "async settlement retention requirement specified". Shipped when the vault commit is pushed to main. | @Zaal | Vault commit | 2026-08-26 |
| Recover `ws/research-599-hypersnap-vps-options`: renumber to the next free doc number (599 collides with four docs on main), add the index row, PR it. Shipped when the PR merges. Branch will otherwise be pruned. | @Zaal | PR | 2026-08-29 |
| Decide and record: is the paused Hetzner purchase cancelled or deferred? It has sat unresolved since 2026-05-04 and is silently blocking L7 in everyone's mental model. Shipped when written into the decision note either way. | @Zaal | Decision | 2026-08-28 |
| Verify whether `FARCASTER_READ_API_BASE` is set in production and record the answer in the vault. BUILT and WIRED is confirmed; LIVE is not. Shipped when the note says which. | @Zaal | Verification | 2026-08-27 |
| Specify the async Respect Game's settlement inputs (L3), then check them against canonical Farcaster retention limits. This is the one input that could reopen the hypersnap decision. Shipped when the retention answer is written into the L3 section. | @Zaal | Spec | 2026-09-15 |
| Re-validate this doc - hypersnap has a single maintainer and one commit could change the verdict. Shipped when `last-validated` is bumped or a superseding doc exists. | @Zaal | Re-research | 2026-09-25 |

## Sources

All fetched 2026-08-25. Method stated per `.claude/rules/research-grounding.md` -
no claim here rests on a WebFetch summary.

- [farcasterorg/hypersnap](https://github.com/farcasterorg/hypersnap) - **[FULL]** via `gh api repos/...` (raw JSON): metadata, 12 commits, releases, tags, contributors, open issues.
- [hypersnap LICENSE](https://github.com/farcasterorg/hypersnap/blob/main/LICENSE) - **[FULL]** via `gh api .../contents/LICENSE --jq .content | base64 -d` (raw file bytes). GPLv3, 35,149 bytes.
- [hypersnap docs/hyper.md](https://github.com/farcasterorg/hypersnap/blob/main/docs/hyper.md) - **[FULL]** same method. The only hypersnap-specific documentation in the repo; quoted verbatim above.
- [hypersnap README.md](https://github.com/farcasterorg/hypersnap/blob/main/README.md) - **[FULL]** same method. Confirmed to be snapchain's unmodified README.
- [hypersnap CHANGELOG.md](https://github.com/farcasterorg/hypersnap/blob/main/CHANGELOG.md) - **[FULL]** same method. Inherited upstream entries.
- [hypersnap open issues + PRs](https://github.com/farcasterorg/hypersnap/issues) - **[FULL]** via `gh api .../issues?state=open` (raw JSON). 13 items. **This is the community source for requirement 7.**
- [farcasterxyz/snapchain](https://github.com/farcasterxyz/snapchain) - **[FULL]** via `gh api`: metadata, releases through v0.14.1, commits through 2026-08-13, and its LICENSE read as raw bytes.
- `https://haatz.quilibrium.com/v1/info` - **[FULL]** via `curl` (raw JSON, keyless). Live network state, quoted in full above.
- Hacker News Algolia (`hn.algolia.com/api/v1/search`) - **[FULL]** via `curl` (raw JSON, keyless). `hypersnap`: 11,999 hits, **zero relevant**. `snapchain farcaster`: 3 hits, none substantive. A real negative result, not a failed fetch.
- [Hetzner AX41-NVMe](https://www.hetzner.com/dedicated-rootserver/ax41-nvme/) - **[PARTIAL - price not in static HTML]** via `curl` + tag strip: HTTP 200, 105,406 bytes, only 4,325 chars of visible text and no price string; pricing is JS-rendered. Not escalated to Playwright because the cost figure is not load-bearing for the recommendation, which is "do not buy". Dated 2026-05-04 quote used instead and labelled as such.
- Reddit - **[FAILED - not attempted]** Reddit is fully walled from this machine per doc 2282 and `.claude/rules`. No snippet substituted.
- Local: `research/` (19 matching directories), `memory/project_hypersnap_node_install.md`, `src/lib/env.ts`, `src/lib/farcaster/neynar.ts`, `~/zao-vault/notes/zao-decentralization-scale.md`, `~/zao-vault/people/Cassie.md` - **[FULL]** read from disk.
