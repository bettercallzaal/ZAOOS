---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2228, 2225, 2910
original-query: "gh repo clone clawdbotatg/anonymous-8004 (ERC-8004, trust-chain thesis) - read the actual code, write a grounded adopt-spec on what it adds to ZAO's off-chain trust chain (#2912/#2913/#2914)"
tier: STANDARD
---

# 2229 - clawd claude-p-attest (EAS web-of-trust): the on-chain anchor for ZAO's trust chain

> **Goal:** Read clawd's real attestation code and name what it adds to the off-chain
> trust chain built tonight (#2912 identity, #2913 receipts+reputation, #2914 message)
> - grounded, file:line, with the concrete adopt.

## Grounding (real clones, this run)

- `gh repo clone clawdbotatg/anonymous-8004 --depth 1` succeeded but the repo is an
  **empty stub** - `README.md` contains only `# anonymous-8004`, no code. Nothing to
  adopt; noted and pivoted. [FULL - confirmed empty]
- `gh repo clone clawdbotatg/claude-p-attest --depth 1` - real content. Read FULL:
  `attest` (161-line Python CLI), `MODULE.md`, `schema.uid`. No module-local LICENSE;
  parent repo `claude-p-agent` is MIT (doc 2228). Credit: **clawdbotatg / Austin
  Griffith, claude-p-attest (MIT via parent)**. [FULL]

## What claude-p-attest is (grounded)

The module-trust layer, v0: third-party "I audited this exact (repo, sha) and vouch"
as **onchain EAS attestations on Base**, read through a **LOCAL trust list**
(`MODULE.md`: "a web of trust, not a global score. Read-first by design: this version
signs nothing and holds no keys").

- The EAS schema (`attest:15-16`, `cmd_schema` at `attest:130-152`):
  `string repoUrl, string commitSha, string moduleName, bool safe, string notes` -
  registered once on `base.easscan.org` (Base chain 8453; EAS predeploy
  `0x42..21`, SchemaRegistry `0x42..20`, `attest:36-37`). `schema.uid` is committed so
  every operator queries the same schema (`schema.uid` = `0xd61d99...06fc`).
- `attest check REPO SHA` (`cmd_check`, `attest:78-119`) queries the public
  easscan GraphQL indexer (`attest:66-74`) for non-revoked attestations on that exact
  version, decodes `decodedDataJson`, and marks each attester `TRUSTED` vs `unknown`
  by membership in the local `trust.list` (`attest:105-113`). No keys, no cost.
- `trust.list` (`trust_list`, `attest:49-57`): one `0x...` address per line, `#`
  comments ok - "only addresses whose audits you'd act on."
- **Read-first, signs nothing** (`MODULE.md` "What it needs"): publishing an
  attestation is a one-time HUMAN step via easscan with a wallet; the code holds no
  private keys. On indexer-down it "treats as zero attestations" and defers to your own
  audit (`attest:88-91`) - a clean silent-failure-guard degrade.

## The three ideas ZAO should take (grounded, ranked)

### 1. LOCAL web-of-trust > global reputation score. REFINES agent-receipts (#2913).

clawd's core design choice (`MODULE.md`, `attest:105-113`): trust is **subjective and
local** - "TRUSTED" means "on YOUR trust.list", there is no universal score. My
`agent-receipts.py` (#2913) `reputation()` currently returns a **global** success-rate
- every caller sees the same number. clawd's insight says that's the wrong shape: a
reputation should be computed **from the perspective of a truster** (whose receipts /
attesters do I believe), not emitted as one universal rate. **Concrete adopt:** add a
`truster`/`trust_set` parameter to `agent-receipts.reputation()` so it can weight or
filter by a caller-supplied trust list, mirroring `attest`'s `trust.list`. This is a
PR-only refinement to a primitive I already shipped tonight - highest-value adopt.

### 2. EAS-on-Base is the concrete ON-CHAIN ANCHOR I kept deferring. DESIGN, gated.

Every trust-chain primitive tonight (#2912/#2913/#2914) says "on-chain anchoring is a
separate Zaal-gated step" without saying HOW. claude-p-attest is the how: **EAS
attestations on Base**, schema `repoUrl/commitSha/moduleName/safe/notes`, read via the
easscan indexer, published by a human. ZAO's receipt (a `{repo, sha, outcome, notes}`
from #2913) maps almost 1:1 onto that schema. **Concrete adopt (SPEC only, gated -
publishing on-chain is money+irreversible):** when ZAO wants a receipt anchored
on-chain, use EAS-on-Base with a ZAO schema; keep the read path (a `zao-attest check`)
keyless off the easscan indexer; keep signing a human step. Do NOT build the signing
path autonomously.

### 3. "Attestations are signal, never proof; the audit is the floor." VALIDATES our rules.

`MODULE.md` "What can go wrong": "Signed malware is an ancient tradition; the agent's
own code audit is always the floor. `check` says this out loud." This is
`anti-fabrication.md` (a claim is not a fact until checked) + `loop-evals.md` (the
default-FAIL evaluator) restated for attestations. No build - corroboration that the
receipts/reputation we ship must never be treated as proof, only as one signal above
the code read.

## Decision

The one PR-only adopt is **#1: make `agent-receipts.reputation()` truster-scoped** (a
local trust set), mirroring clawd's `trust.list`. #2 (EAS-on-Base on-chain anchor) is a
**gated design** - the concrete path for anchoring a receipt, but publishing is
money+irreversible = Zaal's, never autonomous. #3 is corroboration.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a `trust_set` param to `agent-receipts.reputation()` (truster-scoped reputation, mirroring clawd trust.list) - PR-only | @Zaal (Claude) | PR | 2026-08-07 |
| Decide whether to anchor ZAO receipts on EAS-on-Base (gated: on-chain publish is money+irreversible) - this doc is the design, not a build | @Zaal | Decision | 2026-08-10 |
| Review in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/claude-p-attest (MIT via parent claude-p-agent)** - cloned `--depth 1`
  2026-08-06, read FULL: `attest` (cmd_check attest:78-119, trust_list attest:49-57,
  cmd_schema attest:130-152, schema def attest:15-16), `MODULE.md`, `schema.uid`. [FULL]
- **clawdbotatg/anonymous-8004** - cloned; empty stub (README title only), no code. [FULL - empty]
- Docs 2228 (#2915, claude-p-agent adopt-spec), 2225 (#2910, clawd research). [FULL, in-repo]
- ZAO trust-chain primitives this session: #2912 (identity), #2913 (receipts+reputation
  - the one this refines), #2914 (message). [FULL, PRs]

## Also See

- [Doc 2228](../2228-clawd-claude-p-agent-adopt-spec/) - the claude-p-agent adopt-spec.
