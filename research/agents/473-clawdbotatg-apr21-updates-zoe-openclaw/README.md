# 473 — clawdbotatg Apr 21 Update: Patterns to Steal for ZOE / OpenClaw / Agent Squad

> **Status:** Research complete
> **Date:** 2026-04-21
> **Goal:** 10-day delta since docs 339/340 (Apr 11). Focus on ZOE, OpenClaw, and the agent squad - NOT the ZABAL trading swarm (already mapped). What new code dropped + what to fork.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Install ss-triage-router as MCP for ZOE** | FORK `github.com/clawdbotatg/ss-triage-router` (Apr 18, MIT). Haiku classifies prompt complexity, routes to Haiku/Sonnet/Opus. ~75% cost reduction when 80% of prompts are simple. Drop-in replacement for ZOE's two-brain M2.7+Opus split. Direct fix for `project_zoe_v2_redesign.md`. |
| **Adopt fifth-builder worker pattern for ZAO build requests** | STEAL the `run.sh` pipeline from `github.com/clawdbotatg/fifth-builder`. Single `claude -p --model claude-opus-4-7` call drives Scaffold-ETH 2 build + test + forge deploy. Resumable by on-chain stage. Secret-hygiene guards (pre-commit hex-64 scan, redact pass, stub deployer key) are copy-paste for our `/ship` and agent pipelines. |
| **Adopt model IDs from CLAWD verbatim** | UPDATE `src/lib/agents/config.ts` to use `claude-haiku-4-5-20251001`, `claude-sonnet-4-6-20250514`, `claude-opus-4-7-20250219`. These are CLAWD's shipping IDs as of Apr 18 -- our codebase still references older strings in some places. |
| **Skip venice-e2ee-proxy for now** | SKIP `github.com/clawdbotatg/venice-e2ee-proxy`. Useful if we ever add privacy-sensitive ZOE workflows (member DMs, financial reasoning), but for current public Farcaster-facing agents it's overkill. Bookmark for `src/lib/agents/private/*` if we add that path. |
| **Register ZAO agent squad on ERC-8004 via leftclaw-services pattern** | USE leftclaw-services contract `0xb2fb486a9569ad2c97d9c73936b46ef7fdaa413a` on Base as reference. CLAWD runs 4 named workers (leftclaw, rightclaw, clawdheart, clawdgut) claiming jobs via x402 + on-chain. Map: VAULT=leftclaw, BANKER=rightclaw, DEALER=clawdheart, HERALD=clawdgut. Service types dynamic, not hardcoded enums. |
| **Adopt numbered-job repo pattern for ZOE autonomy logs** | OBSERVE: `leftclaw-service-job-39 ... job-66` are PUBLIC GitHub repos auto-created by CLAWD per job. Each one is evidence of an autonomous ship. For ZAO: wire ZOE's delivered tasks to create `zoe-task-<id>` repo or daily captures folder. Public proof, verifiable activity. |
| **Don't duplicate doc 340** | SKIP re-forking clawdviction / agent-bounty-board / clawd-larvae. Already documented in doc 340. This doc adds ONLY the Apr 11 -> Apr 21 delta. |

---

## Delta Since Doc 339/340 (Apr 11)

CLAWD's GitHub in numbers:

| Metric | Apr 11 (doc 339) | Apr 21 (today) | Delta |
|--------|-----------------|---------------|-------|
| Public repos | 168 | 190 | +22 |
| Followers | ~50 | 108 | +58 |
| GitHub bio | "AI agent with a wallet..." | same | - |
| Account created | 2026-01-27 | - | 85 days old |

22 new repos in 10 days. Of those, ~18 are `leftclaw-service-job-<N>` (autonomous build outputs). The 4 that are meta-tools:

| Repo | Shipped | Type | Relevance to ZAO |
|------|---------|------|-----------------|
| `ss-triage-router` | 2026-04-18 | MCP server (TS) | DIRECT - solves ZOE two-brain routing |
| `venice-e2ee-proxy` | 2026-04-15 | Local proxy (TS) | LATER - privacy-sensitive agent work |
| `fifth-builder` | 2026-04-17 | Bash + claude CLI | DIRECT - ship pipeline template |
| `gitlawb-audit` | 2026-04-21 | Audit repo | REFERENCE - two-methodology audit pattern |
| `leftclaw-services` | ongoing | Next.js + Foundry | REFERENCE - agent services marketplace in prod |
| `clawd-chronicle` | 2026-04-10 | Timeline doc | REFERENCE - how to document an autonomous agent |

---

## System A: ss-triage-router (MCP Model Routing)

### What It Does

MCP server exposes a single tool `triage_prompt`. Flow:

1. Prompt arrives
2. Haiku classifier replies ONE word: `simple | medium | hard` (~$0.00003)
3. Router picks Haiku / Sonnet / Opus
4. Routed model responds
5. Returns response + metadata (model used, tokens)

### The Whole Classifier (40 lines)

`src/classifier.ts`:
```ts
export async function classifyComplexity(prompt: string): Promise<Complexity> {
  const response = await anthropicClient.messages.create({
    model: MODEL_IDS.haiku,
    max_tokens: 10,
    system: SYSTEM_PROMPT_CLASSIFIER,
    messages: [{ role: "user", content: prompt }],
  });
  const classification = response.content[0].type === "text"
    ? response.content[0].text.trim().toLowerCase()
    : "medium";
  if (classification === "simple" || classification === "easy") return "simple";
  if (classification === "hard" || classification === "complex") return "hard";
  return "medium";
}
```

`src/models.ts`:
```ts
export const MODEL_IDS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6-20250514",
  opus: "claude-opus-4-7-20250219",
} as const;

export const COMPLEXITY_TO_MODEL: Record<Complexity, ModelTier> = {
  simple: "haiku",
  medium: "sonnet",
  hard: "opus",
};

export const SYSTEM_PROMPT_CLASSIFIER =
  "Classify the following prompt by complexity: simple | medium | hard. Respond with ONE WORD ONLY.";
```

### Why This Matters for ZOE

`project_zoe_v2_redesign.md` says ZOE v2 = "single agent, two brains (M2.7+Opus)". CLAWD already shipped the cleaner 3-tier version on Apr 18. Assumed distribution 40% simple / 40% medium / 20% hard → ~75% cost reduction on a pure-Opus baseline.

### How to Ship in ZAO OS

| Step | Action |
|------|--------|
| 1 | `git clone github.com/clawdbotatg/ss-triage-router ~/tools/` |
| 2 | `npm install && npm run build` |
| 3 | Add to `~/.claude/settings.json` mcpServers block |
| 4 | In `src/lib/agents/runner.ts`, call `triage_prompt` instead of direct Anthropic client when tier not preset |
| 5 | Log `model_used` to Supabase `agent_events` table for cost tracking |

---

## System B: fifth-builder (Autonomous Ship Pipeline)

### The `run.sh` Shape

4-stage resumable worker, driven by on-chain `currentStage`:

| Stage | Model | Action |
|-------|-------|--------|
| 1. Setup | - | Accept job on-chain, `create-eth@latest -s foundry`, write `PLAN.md` from client spec, create public GitHub repo |
| 2. Build | `claude -p --model claude-opus-4-7` | Reads `PLAN.md`, writes contracts + deploy script + tests + frontend, loops `forge build` / `forge test` / `yarn next:build` until clean, transfers privileged roles to client |
| 3. Audit/Fix | Opus (cycle 1), Sonnet (after) | Up to 3 cycles. Auditor writes `AUDIT_REPORT.md` with `## MUST FIX` and `## KNOWN ISSUES`. Fixer (Sonnet) works the checklist. Exit when zero must-fix. |
| 4. Deploy | - | Switch `scaffold.config.ts` to Base, `forge script --private-key`, verify on Basescan, `next export`, upload to bgipfs, call `completeJob(jobId, liveURL)` on-chain |

### Secret Hygiene (Hard-Earned)

Direct quote from README after an "incident where an agent leaked the deployer key into AUDIT_REPORT.md on a public repo":

1. **Stub deployer key** in build dir `.env` (public anvil key). Real key only via `forge --private-key` flag at deploy time.
2. **Pre-commit guards** in stage 1: `.env` must be gitignored, no `PRIVATE_KEY=` or 32-byte hex in staged diff, no `.env` file staged.
3. **Post-fix-cycle scan** of `HEAD` for hex-64 / PEM blocks / `ghp_...` / `sk-...` - hard-aborts job on match.
4. **Pre-complete scan** over `packages/` for any hex-64 and for the worker's own `ETH_PRIVATE_KEY`.
5. **Prompt-level**: auditor + fixer prompts explicitly say "NEVER reproduce secret values", use `[REDACTED]` as placeholder.

### Skills Referenced at Runtime

fifth-builder fetches external skills at runtime so the worker updates without editing `run.sh`:

- `ethskills.com/SKILL.md` - master skill index
- `ethskills.com/orchestration/SKILL.md`
- `ethskills.com/frontend-ux/SKILL.md`
- `ethskills.com/frontend-playbook/SKILL.md`
- `ethskills.com/qa/SKILL.md` - auditor uses this
- `ethskills.com/audit/SKILL.md` - contract security framework
- `docs.scaffoldeth.io/SKILL.md`
- `github.com/scaffold-eth/scaffold-eth-2/blob/main/AGENTS.md`
- `bgipfs.com/SKILL.md`

### What to Steal for ZAO OS

| Pattern | ZAO OS Application |
|---------|-------------------|
| Single `claude -p` build call | `/ship` skill - give agent spec + constraints, one shot |
| Resumable by on-chain stage | Our build jobs in Supabase `agent_tasks` table - `status` field drives resume |
| 3-cycle audit/fix loop | New skill: `/audit-fix-loop` - runs our code-reviewer agent 3x max |
| External skill fetch at runtime | Our `.claude/rules/*.md` fetched by agent prompts, not baked in |
| Secret hygiene guards | Copy the 5-item list into `/ship` pre-flight checks. CRITICAL - we have `.env.example` but no hex-64 scan. |

---

## System C: leftclaw-services (Agent Services Marketplace)

**Contract:** `0xb2fb486a9569ad2c97d9c73936b46ef7fdaa413a` on Base
**Live:** leftclaw.services

### Production Pricing (CLAWD's Bet on Agent Services Market)

| Service | Slug | USD Price |
|---------|------|----------|
| Quick Consult | `consult` | $20 |
| Deep Consult | `consult-deep` | $30 |
| PFP Generator | `pfp` | $0.25 |
| Contract Audit | `audit` | $200 |
| Frontend QA Audit | `qa` | $50 |
| Build (full dApp) | `build` | $1,000 |
| Research Report | `research` | $100 |
| Judge / Oracle | `judge` | $50 |
| Human QA | `humanqa` | $200 |
| Feature addition | `feature` | $500 |

Note: contract currently in TEST MODE at ~1/50 of listed prices.

### 4 Named Workers (CLAWD's Agent Squad)

CLAWD runs 4 workers against leftclaw-services:

1. **leftclaw** - primary builder
2. **rightclaw** - secondary builder
3. **clawdheart** - role unclear, likely QA/consult
4. **clawdgut** - role unclear, likely research/judge

Each is ERC-8004 registered on Ethereum mainnet. This validates the VAULT/BANKER/DEALER/HERALD naming pattern from doc 345.

### x402 Payment Flow

```
Hire endpoint -> x402 USDC payment -> sanitizer wallet
  -> postJobFor() on-chain
  -> auto-swap USDC -> WETH (0.05%) -> CLAWD (1%) via Uniswap V3
```

- Service types DYNAMIC (seeded at deploy), NOT hardcoded enums. Pattern for ZAO: `services` table in Supabase, not TypeScript enum.
- Payment transferred to treasury at accept time.
- No dispute window, no claim step. Bet on reputation.

---

## System D: venice-e2ee-proxy (Deferred)

### What It Does

Local OpenAI-compatible proxy on `localhost:3333`. Fetches Venice AI TEE attestation, verifies Intel TDX + NVIDIA GPU, encrypts prompts with secp256k1 ECDH + HKDF-SHA256 + AES-128-GCM before forwarding. Any OpenAI-SDK tool pointed at localhost gets transparent E2EE.

### Why We Defer

Current ZAO agents post to Farcaster publicly. E2EE adds zero value to a public-feed agent. Bookmark this for:
- Any future financial reasoning agent (BANKER deliberation on large trades)
- Member DM summarization agent
- Personal ZOE variant per admin

Re-evaluate when `src/lib/agents/private/*` exists.

---

## Numbered Job Repos: CLAWD's Autonomy Log

Between Apr 10 and Apr 21, CLAWD auto-created these public repos (partial list):

```
leftclaw-service-job-39   Onchain Guestbook
leftclaw-service-job-43   (private desc)
leftclaw-service-job-46   (private desc)
leftclaw-service-job-47   Hello World onchain greeting
leftclaw-service-job-48   (private desc)
leftclaw-service-job-51   CLAWD Token Dashboard
leftclaw-service-job-52   (private desc)
leftclaw-service-job-54   (private desc)
leftclaw-service-job-55   (private desc)
leftclaw-service-job-56   (private desc)
leftclaw-service-job-57   (private desc)
leftclaw-service-job-58   (private desc)
leftclaw-service-job-59   (private desc)
leftclaw-service-job-60   (private desc)
leftclaw-service-job-63   (private desc)
leftclaw-service-job-65   UP/DOWN 1-minute CLAWD price game
leftclaw-service-job-66   (most recent, 2026-04-21)
```

**Pattern to steal:** every autonomous task produces a public GitHub repo as verifiable output. For ZAO:
- ZOE ships a daily captures doc -> create `zoe-capture-YYYY-MM-DD` repo? Overkill.
- ZAO agent claims a community bounty -> create `zao-bounty-<id>` repo. YES.
- Aligns with build-in-public user preference (`feedback_build_public.md`).

---

## ZAO Ecosystem Integration

### Files to Touch

| File | Change | Source |
|------|--------|--------|
| `src/lib/agents/config.ts` | Update model IDs to CLAWD's shipping strings | ss-triage-router/src/models.ts |
| `src/lib/agents/runner.ts` | Add optional triage-router MCP call before direct Anthropic client | ss-triage-router |
| `src/lib/agents/types.ts` | Add `ModelTier = 'haiku' | 'sonnet' | 'opus'` type | ss-triage-router |
| `scripts/` | New: `ship-audit-fix-loop.sh` mirroring fifth-builder's 3-cycle loop | fifth-builder/run.sh |
| `.claude/rules/secret-hygiene.md` | New: copy fifth-builder's 5-item pre-commit + post-fix scan list | fifth-builder |
| `community.config.ts` | Add `agentServices` array pattern (not enum) | leftclaw-services |
| `src/app/api/agents/services/route.ts` | New endpoint listing agent-offered services | leftclaw-services API |
| OpenClaw VPS `SOUL.md` for ZOE | Reference ss-triage-router for routing rationale | ss-triage-router README |

### Connected Research

| Doc | What This Adds |
|-----|---------------|
| 339 | Original CLAWD deep dive (Apr 11). This doc adds the 10-day delta + ZOE-specific angle. |
| 340 | CLAWD 4 systems fork plan (Apr 11). This doc is complementary - covers NEW tools (ss-triage-router, fifth-builder, venice-e2ee-proxy) not in 340. |
| 345 | ZABAL Agent Swarm Master Blueprint. This doc validates the 4-agent naming pattern using CLAWD's 4 named workers. |
| 415 | Composio Agent Orchestrator. ss-triage-router is simpler + cheaper than Composio for model routing. |
| 422 | Claude Routines ZAO Automation Stack. fifth-builder's resumable by on-chain stage pattern applies to our routines. |

### memory/ Follow-ups

- `project_zoe_v2_redesign.md` - update to reference ss-triage-router as the chosen routing implementation
- `project_tomorrow_first_tasks.md` - add "install ss-triage-router MCP globally" as P1

---

## Sources

- [clawdbotatg GitHub](https://github.com/clawdbotatg) - 190 repos, 108 followers
- [ss-triage-router](https://github.com/clawdbotatg/ss-triage-router) - model routing MCP, Apr 18
- [fifth-builder](https://github.com/clawdbotatg/fifth-builder) - autonomous SE-2 builder worker
- [leftclaw-services](https://github.com/clawdbotatg/leftclaw-services) - agent services marketplace
- [venice-e2ee-proxy](https://github.com/clawdbotatg/venice-e2ee-proxy) - local TEE proxy
- [leftclaw.services (live)](https://leftclaw.services) - production agent marketplace
- [LeftClaw contract on Basescan](https://basescan.org/address/0xb2fb486a9569ad2c97d9c73936b46ef7fdaa413a) - `0xb2fb486a9569ad2c97d9c73936b46ef7fdaa413a`
- [clawdbotatg on X](https://x.com/clawdbotatg) - announcement stream
- [ETHSkills index](https://ethskills.com/SKILL.md) - external skill contract referenced by fifth-builder
- [Doc 339](../339-austin-griffith-clawd-ethskills-agent-patterns/) - original CLAWD deep dive
- [Doc 340](../340-clawd-patterns-deep-dive-4-systems/) - 4 systems fork plan
