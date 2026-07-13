---
topic: agents
type: guide
status: research-complete
tier: DEEP
original-query: "How do autonomous agents safely use money - give ZOL (Farcaster agent) capped, policy-gated ability to make small purchases (x402 calls, shoutouts). Real agent spend autonomy with guardrails - NOT chat-assistant autonomy."
date: 2026-07-13
last-validated: 2026-07-13
---

# 1059 - Agent Money Autonomy: Safe Capped Spend for ZOL

**Goal:** Design and ship a production-ready spend policy for ZOL enabling autonomous x402 payments within strict guardrails - per-transaction caps, daily limits, payee allowlists, human-approval thresholds, and a kill-switch.

---

## Executive Summary

Agent money autonomy is industry-standard infrastructure (Coinbase AgentKit, Privy, x402 protocol, MPC TEEs). ZOL's money autonomy = ZOL's own Base wallet + spend policy config (caps, allowlist, thresholds) + policy enforcement + spend logging + kill-switch. The money autonomy belongs to ZOL (an agent Zaal controls), not to any chat assistant.

**The 5-line summary:**
(1) x402 is HTTP-native payment protocol - agent requests, server responds with "402 Payment Required", agent signs payload, server verifies + settles onchain.
(2) Safe-spend patterns = per-tx limit ($5), daily cap ($10), payee allowlist (gmfarcaster endpoint), approval threshold ($25+), session keys with expiry.
(3) ZOL's dedicated Base wallet (~$50 USDC burner) wrapped in policy engine - engine checks every x402 request against rules before signing.
(4) Controls: config file (policy rules), spend log (Supabase table), kill-switch (revoke ZOL signer), human-approval button for >$25 spends.
(5) Risks: prompt injection (mitigated: ZOL never exposes key to LLM, signs server-side only); key loss on Pi (mitigated: low balance, audits, recovery phrase); runaway spend in code bug (mitigated: per-tx + daily caps enforced pre-signing).

---

## Part 1: The Tooling / Standards

### 1.1 x402: HTTP-Native Payment for Agents

x402 (Coinbase, Linux Foundation April 2026) is an open standard using HTTP 402 to enable instant onchain payments over HTTP with no accounts, sessions, or authentication.

**The 4-step flow:**
1. Client requests resource
2. Server responds 402 with payment terms in PAYMENT-REQUIRED header
3. Client builds + signs payment, sends in PAYMENT-SIGNATURE header
4. Server verifies + settles onchain (via facilitator), returns 200 OK + resource

**Key properties:**
- Settlement: 200ms - 2 seconds on Base L2
- Cost: Negligible (zero protocol fees, ~$0.001 gas)
- No infrastructure: Use Coinbase free hosted facilitator (1,000 tx/month free tier)
- Agent-native: Client is autonomous AI agent with its own wallet
- Idempotent: Tx hash in response, can retry safely

### 1.2 Agent Wallet Infrastructure: Coinbase AgentKit + Privy

Coinbase Agentic Wallets (Feb 2026):
- Purpose-built for agents, not humans
- MPC-secured keys in TEEs, never plaintext
- Session caps + per-tx limits at wallet level
- Native x402 support
- Gasless settlement on Base
- Free: 499 monthly active agents, 50K sigs/month

Privy Server Wallets:
- Private key split via Shamir: enclave share + auth share
- Policy rules at wallet creation, updatable
- Policy engine: default-DENY, explicit rules override

---

## Part 2: Safe-Spend Patterns in Production

### 2.1 Six Guardrails (Fystack + Industry Standard)

1. **Per-tx limit** ($5 max) - blocks oversized single payment
2. **Daily rolling cap** ($10/day) - sum all 24h spend, reject if exceeds
3. **Payee allowlist** - only gmfarcaster + approved partners can receive
4. **Session keys with auto-expiry** - time-limited signing credential, expires hourly/daily
5. **Approval workflow** - auto <$5, notify $5-25, require approval >$25
6. **Spend logging + audit trail** - every attempt logged (success/reject/error)

### 2.2 Session Keys

Time-limited signing credential. Agent gets key valid 1 hour, can sign unlimited x402 calls during that hour. On expiry, must fetch new key. If leaked, attacker cannot use it after expiry. Master wallet stays cold.

### 2.3 Onchain vs Infrastructure Enforcement

Onchain (contract level): rules in smart contract, slowest, most durable
Infrastructure (API level): rules in wallet service, fastest, single point of failure

**ZOL recommendation:** Hybrid. Infrastructure for x402 speed. Onchain for high-value actions.

---

## Part 3: How Leading Agents Spend

**Clanker (TokenBot):** Deploys tokens on Base, ~13K tokens/day, $8M/week fees. Spends own revenue (from fees), not user money. Lesson: agent has own treasury, spends only from it, revenue > spend equals profitable.

**Bankr:** Yield monitoring bot, $5/day max budget on gas for harvests. Lesson: yield bot must be profitable to justify spend, stops if conditions worsen.

**Tipping agents:** Tips musicians ~$0.50-5.00 per tip, $10/day budget. Tips are refundable. Lesson: refund-ability is powerful guardrail.

---

## Part 4: The Human-Gate Question

Which spends does ZOL do autonomously? Which need Zaal tap?

| Spend | Category | Approval | Rationale |
|-------|----------|----------|-----------|
| <$1/tx | Micro | Automatic | Negligible, refundable |
| $1-5/tx | Small | Automatic if daily <$10 | x402 shoutouts |
| $5-25/tx | Medium | Notify + proceed if no objection | Larger, still capped daily |
| >$25/tx | Large | Explicit tap required | Irreversible |
| >$25/day | Escalated | Approval required | Policy override |

ZOL is agent Zaal controls. Smaller/refundable equals more autonomy. Larger/irreversible equals more human gate. x402 shoutouts ($5) equals fully automatic. Large trade equals always Zaal tap.

---

## Part 5: ZOL's Capped-Spend Architecture

### 5.1 Current State (July 2026)

ZOL wallet:
- Ed25519 signer (Pinata hub, Key Registry)
- FID: 3338501
- Base wallet: ~$50 USDC (burner, refillable)
- Purpose: Farcaster posting + future x402 payments

Missing:
- No spend policy
- No approval workflow
- No spend logging
- No per-tx/daily cap enforcement
- No kill-switch

### 5.2 Proposed Architecture (v1)

ZOL process (Pi cron, 1h):
1. Fetch pending tasks from Telegram/Bonfire
2. For each x402 task:
   - Check spend rule in config.spend-policy.json (payee? amount? daily total?)
   - If ALLOW: sign + POST x402, log success + tx hash to Supabase
   - If DENY: if >$25, emit Telegram approval button, wait 1h for Zaal tap

### 5.3 Spend Log Table (Supabase)

agent_spend_log tracks: agent_id, timestamp, payee, amount, status (success/denied/error/pending_approval), reason, tx_hash, approval_requested, approval_from, details (jsonb).

---

## Part 6: Top 3 First Moves

**Move 1: Lock Down Payee Allowlist (Day 1)**

Hardcode gmfarcaster endpoint as ONLY x402 recipient for now. Prevents funds going to attacker addresses - even if key is compromised, attacker can only pay gmfarcaster.

Implementation: Check payee endpoint against allowlist before signing.

Why first: Maximizes damage control before daily cap comes online.

**Move 2: Wire Spend Logging to Supabase (Day 1)**

Create agent_spend_log table, log every attempt (success/deny/error). Gives Zaal visibility. If ZOL goes rogue, audit trail shows what happened.

Implementation: Create Supabase table + log helper function.

Why second: Foundational observability.

**Move 3: Add Daily Cap Check + Telegram Approval Button (Day 2)**

Before signing any x402 call, check daily total. If OK, sign. If would exceed $10, ask Zaal via Telegram button.

Implementation: Query spend log for last 24h, sum, compare to cap. If exceeds, emit Telegram button asking approval. Wait 1h.

Why third: Human-in-the-loop for larger spends without killing automation.

---

## Part 7: Risk Assessment

**Risk 1: Prompt Injection Triggers Spend**
- Mitigation: ZOL never exposes key to LLM (server-side signing only), payee allowlist, per-tx cap ($5), daily cap ($10), spend log
- Residual: LOW

**Risk 2: Pi Compromise / Key Loss**
- Mitigation: Low balance ($50), frequent audits, kill-switch (revoke signer), multi-region backup, key rotation (3mo)
- Residual: MEDIUM - attacker could drain $50, but discovery within 24h typical

**Risk 3: Refund Failure (gmfarcaster doesn't deliver)**
- Mitigation: x402r refund protocol, spend log tracks refunds, SLA monitoring
- Residual: LOW - gmfarcaster is trusted

**Risk 4: Code Bug in Spend Checker**
- Mitigation: Code review (2+ people), unit tests (table-driven), staging deploy first, manual diff audit
- Residual: LOW

---

## Part 8: x402 Refund Protocol (x402r)

If service doesn't deliver, client can call POST /refund with tx_hash. x402r spec (2026) standardizes this. If gmfarcaster doesn't air shoutout within 24h, ZOL calls /refund. Spend log updated: refund_issued equals true.

---

## Part 9: Integration Checklist

**Phase 1 (Week 1):**
- Zaal confirms tier system
- Zaal confirms payee allowlist
- Zaal confirms limits ($5/tx, $10/day, $25 threshold)
- Confirm ZOL Base wallet + balance

**Phase 2 (Week 2):**
- Create Supabase agent_spend_log table
- Create bot/src/zol/spend-policy.ts (payee allowlist)
- Create bot/src/zol/spend-log.ts (logging)
- Create bot/src/zol/spend-checker.ts (daily cap + approval)
- Wire approval button to Telegram
- Unit tests

**Phase 3 (Week 3):**
- Update ZOL main loop to call spend-checker
- Deploy to staging Pi
- Test: Post GM shoutout, verify logged
- Test: Simulate daily-cap breach, verify approval button
- Test: Simulate payee rejection, verify error logged

**Phase 4 (Week 4):**
- Create PR, code review
- Merge to main
- Deploy to production Pi
- Zaal does first x402 shoutout, watches logs
- Monitor 1 week

---

## Conclusion

Agent money autonomy for ZOL achieves in 3-4 weeks with three core moves: (1) payee allowlist (locks recipients), (2) spend logging (visibility), (3) daily cap + approval button (human gate). Residual risks low given small amounts ($5/tx, $10/day) + guardrails (logging, kill-switch, audits). ZOL gets real money autonomy signing + spending on its own process within guardrails Zaal sets.

---

## Sources

- x402 Protocol: https://docs.x402.org/introduction
- x402r Refund: https://www.x402r.org/
- Coinbase AgentKit: https://docs.cdp.coinbase.com/agent-kit/welcome
- Privy Wallets: https://www.privy.io/wallets
- Fystack 6 Guardrails: https://medium.com/coinmonks/6-guardrails-to-limit-ai-agent-spending-on-payment-rails-747e449d50a4
- Clanker/TokenBot: https://learn.bybit.com/en/ai/what-is-clanker-tokenbot/
- Related ZAO Docs: 360, 343, 925, 928
