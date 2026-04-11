# 343 -- Agent Wallet Security: Securing VAULT/BANKER/DEALER Beyond Env Vars

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Map every security layer for the ZABAL agent swarm wallets -- from current risk (raw private keys in Vercel env vars) to production-grade security (Privy TEE + Safe multisig + policy engine + OWASP agentic controls)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Immediate: Migrate from env vars to Privy** | USE Privy Agentic Wallets to replace raw `VAULT_WALLET_PRIVATE_KEY` env vars. Private keys stored in TEE (Trusted Execution Environment), never exposed in plaintext. Policy engine enforces spending limits at signing time. Free for 0-499 MAU, 50K sigs/month |
| **Treasury: Safe 3/6 multisig** | USE Safe{Wallet} for the ZABAL treasury (the pool agents draw from). CLAWD uses 3/6 multisig -- adopt same pattern. 3 of 6 signers needed: Zaal + 2 trusted ZAO members + 3 backup keys. Never N-of-N |
| **Agent wallets: Privy + policies** | USE Privy server wallets for each agent (VAULT/BANKER/DEALER) with per-agent policies: $5/day max, approved contracts only (0x router + ZABAL + SANG + USDC), time windows (no 3 AM trades) |
| **Key quorum for large actions** | USE Privy key quorum (2-of-3) for any action >$10 or policy changes. VAULT signs + Zaal co-signs. Prevents single-agent drainage |
| **OWASP agentic controls** | IMPLEMENT the OWASP Top 10 for Agentic Applications: input validation on all agent prompts, tool permission scoping, inter-agent message signing, kill switches, behavioral monitoring |
| **Anti-prompt-injection** | NEVER expose wallet private keys to agent prompts, memory, or skills. All signing happens server-side in Privy TEE. Agent only receives tx hash after execution |
| **Monitoring** | USE Blockscout alerts + Supabase agent_events table for real-time monitoring. Alert on: any tx >$5, any tx to non-approved contract, any failed tx, any tx outside scheduled hours |

---

## Current Risk Assessment (What We Have Now)

| Risk | Severity | Current State |
|------|----------|--------------|
| **Private keys in Vercel env vars** | HIGH | If Vercel account is compromised, attacker gets all 3 wallet keys. Env vars are encrypted at rest but exposed to all serverless functions |
| **No spending limits** | HIGH | Nothing prevents a code bug from sending the entire wallet balance in one tx |
| **No contract allowlist enforcement** | MEDIUM | The 0x swap could be manipulated to send to an attacker address if the API response is spoofed |
| **Single point of failure** | HIGH | One compromised key = one drained wallet. No multisig, no co-signing |
| **No behavioral monitoring** | MEDIUM | Rogue trade activity would go unnoticed until someone checks Basescan manually |
| **Agent prompt could access keys** | LOW (currently not LLM-driven) | Our agents are cron-based, not LLM-prompt-driven. But if we add AI decision-making later, prompt injection becomes a vector |

---

## Security Upgrade Path (3 Phases)

### Phase 1: Privy Migration (Week 1, $0)

Replace raw env var keys with Privy Agentic Wallets.

**How Privy secures keys:**
1. Private key generated inside TEE (Trusted Execution Environment)
2. Key split into 2 shares via Shamir secret sharing:
   - **Enclave share**: secured by TEE, only accessible within it
   - **Auth share**: encrypted, stored by Privy, retrievable only with valid auth
3. Full key NEVER persisted -- exists only momentarily inside enclave during signing
4. No one (not even Privy) can access the full key

**Policy engine (3 primitives):**

| Primitive | What It Does |
|-----------|-------------|
| **Policy** | Complete set of constraints for a wallet. Default-deny -- actions must be explicitly permitted |
| **Rule** | Maps to specific actions: send tx, sign typed data, contract interaction, key export. Evaluates to ALLOW or DENY |
| **Condition** | Boolean checks: recipient address, amount, contract function, network, time window. ALL conditions must pass for rule to apply |

**Policies for VAULT:**
```
Policy: "VAULT Daily Trading"
  Rule 1: ALLOW send_transaction
    Condition: recipient IN [0x API router, ZABAL, SANG, USDC, WETH, burn address]
    Condition: value <= $2 per tx
    Condition: aggregate_daily <= $5
    Condition: time BETWEEN 05:00-07:00 UTC (1-hour window around 6 AM cron)
  Rule 2: DENY everything else
```

**Code change to `src/lib/agents/wallet.ts`:**
```typescript
// BEFORE (insecure):
const privateKey = process.env[envKey];
const account = privateKeyToAccount(privateKey);

// AFTER (Privy):
const { PrivyClient } = require('@privy-io/server-auth');
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);
const { hash } = await privy.walletApi.ethereum.sendTransaction({
  walletId: VAULT_WALLET_ID,
  caip2: 'eip155:8453', // Base
  transaction: { to, data, value },
});
```

**Pricing:** Free for 0-499 MAU, 50K signatures/month. Our 3 agents doing 1 trade/day = 90 sigs/month. Well within free tier.

### Phase 2: Safe Treasury Multisig (Week 2, ~$5)

The main ZABAL treasury (the pool agents draw from) should be a Safe multisig, not a single EOA.

**CLAWD's model:** 3/6 multisig Safe at `safe.clawd.atg.eth`. 3 of 6 signers must approve any treasury withdrawal.

**ZABAL treasury design:**
```
Safe{Wallet} on Base: 2-of-3 multisig
  Signer 1: Zaal's hardware wallet (Ledger)
  Signer 2: Trusted ZAO member #1
  Signer 3: Trusted ZAO member #2

Agents draw from treasury via:
  1. Admin triggers "fund VAULT" in dashboard
  2. Safe proposes tx: send $15 ETH to VAULT's Privy wallet
  3. 2 of 3 signers approve
  4. Funds arrive in VAULT's wallet
  5. VAULT trades within policy limits

Agents can NEVER access treasury directly.
Treasury can NEVER be drained by a single signer.
```

**Safe deployment on Base:** ~$5 in gas. Use safe.global UI to create.

**Guard module:** Deploy a Safe Guard contract that auto-rejects:
- Any tx > $50 without 24-hour timelock
- Any tx to non-whitelisted addresses
- Any tx that moves >20% of treasury in one day

### Phase 3: OWASP Agentic Controls (Week 3)

The OWASP Top 10 for Agentic Applications (2026) identifies 10 risks. Here's how each applies to VAULT/BANKER/DEALER:

| OWASP Risk | Applies to ZABAL? | Mitigation |
|-----------|-------------------|-----------|
| **ASI01: Agent Goal Hijacking** | LOW (cron-based, no external input) | Will become HIGH if we add LLM-driven decisions. Never inject external data into agent prompts without sanitization |
| **ASI02: Tool Misuse** | MEDIUM | Privy policy engine limits what tools (contracts) agents can interact with. 0x API response should be validated before execution |
| **ASI03: Identity & Privilege Abuse** | MEDIUM | Each agent has its own Privy wallet with its own policy. VAULT cannot use BANKER's wallet. Short-lived Privy auth tokens |
| **ASI04: Supply Chain** | LOW | We only use 0x API (trusted aggregator). Validate 0x API TLS cert. Pin API version |
| **ASI05: Code Execution** | LOW | Agents don't generate code. If they did, sandbox all generated code |
| **ASI06: Memory Poisoning** | LOW (no shared memory yet) | Will become MEDIUM when agents share Supabase state. Segment memory per agent, track provenance |
| **ASI07: Inter-Agent Communication** | MEDIUM | VAULT/BANKER/DEALER communicate via Supabase tables. Add row-level security so agents can only write to their own events |
| **ASI08: Cascading Failures** | MEDIUM | If VAULT's cron errors, it shouldn't cascade to BANKER. Each cron is independent. Add circuit breakers: 3 consecutive failures = auto-disable agent |
| **ASI09: Human-Agent Trust** | LOW | Admin dashboard shows all agent actions transparently. No hidden agent operations |
| **ASI10: Rogue Agents** | MEDIUM | Privy policies prevent rogue behavior. Kill switch: set `trading_enabled = false` in Supabase. Behavioral monitoring: alert if agent trades outside normal patterns |

---

## Comparison: Agent Wallet Security Approaches

| Approach | Key Security | Spending Limits | Contract Allowlist | Multi-Approval | Cost | ZAO Fit |
|----------|-------------|----------------|-------------------|---------------|------|---------|
| **Raw env vars (current)** | Encrypted at rest in Vercel. Exposed to all functions | NONE -- code-only | NONE -- code-only | NONE | Free | **WORST** -- single point of failure |
| **Privy Agentic Wallets** | TEE + Shamir sharding. Key never exposed | YES (policy engine, per-tx + daily) | YES (policy conditions) | YES (key quorum n-of-m) | Free 0-499 MAU | **BEST for agents** |
| **Coinbase AgentKit / CDP** | MPC wallets, Base-native | YES (via policies) | YES | YES (MPC threshold) | Free tier | Good alternative |
| **Turnkey** | TEE isolation | YES (basic) | YES | YES (policies) | $0.02/wallet/mo | Good for signing-only |
| **Safe multisig (treasury)** | n-of-m onchain signing | YES (via Guard module) | YES (via Guard) | YES (built-in) | ~$5 deploy | **BEST for treasury** |
| **Self-hosted KMS (AWS/GCP)** | HSM-backed keys | Manual implementation | Manual | Manual | $1-5/mo | Overkill for 3 agents |

---

## Implementation Checklist

### Immediate (Before Going Live)

- [ ] Sign up at privy.io, create app for ZAO OS
- [ ] Create 3 Privy server wallets (VAULT, BANKER, DEALER)
- [ ] Define policies for each wallet (spending limits, contract allowlist, time windows)
- [ ] Update `src/lib/agents/wallet.ts` to use Privy SDK instead of raw `privateKeyToAccount`
- [ ] Remove `VAULT_WALLET_PRIVATE_KEY` / `BANKER_WALLET_PRIVATE_KEY` / `DEALER_WALLET_PRIVATE_KEY` from Vercel env vars
- [ ] Add `PRIVY_APP_ID` and `PRIVY_APP_SECRET` to Vercel env vars instead
- [ ] Add circuit breaker: 3 consecutive failed trades = auto-disable agent

### Before Scaling (When Treasury >$100)

- [ ] Deploy Safe 2-of-3 multisig on Base for ZABAL treasury
- [ ] Fund agent wallets from Safe (never directly)
- [ ] Add Privy key quorum (2-of-3) for any tx >$10
- [ ] Set up Blockscout alerts for all 3 agent wallet addresses
- [ ] Add Safe Guard module: reject tx >$50 without 24h timelock

### Before Adding AI Decision-Making

- [ ] Implement prompt injection safeguards (never expose keys to prompts)
- [ ] Add input validation on all data that enters agent context
- [ ] Segment Supabase agent_events with RLS per agent
- [ ] Add behavioral monitoring: alert on trades outside normal patterns
- [ ] Implement kill switch accessible from admin dashboard AND via Telegram bot

---

## ZAO Ecosystem Integration

### Files to Change

| File | Current | After Privy Migration |
|------|---------|---------------------|
| `src/lib/agents/wallet.ts:10-12` | `KEY_MAP` reads env var private keys | Replace with Privy wallet IDs |
| `src/lib/agents/wallet.ts:21-28` | `privateKeyToAccount()` + `createWalletClient()` | `privy.walletApi.ethereum.sendTransaction()` |
| `src/lib/env.ts:81-83` | `VAULT/BANKER/DEALER_WALLET_PRIVATE_KEY` | `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `VAULT/BANKER/DEALER_WALLET_ID` |
| `vercel.json` | No change | No change |
| `scripts/seed-agent-config.sql` | `wallet_address` field | Add `privy_wallet_id` field |

### New Dependencies

```bash
npm install @privy-io/server-auth
```

---

## Sources

- [Privy Policy Engine](https://privy.io/blog/turning-wallets-programmable-with-privy-policy-engine)
- [Privy + OpenClaw Security](https://privy.io/blog/securely-equipping-openclaw-agents-with-privy-wallets)
- [Privy Key Management](https://privy.io/blog/powering-programmable-wallets-with-low-level-key-management)
- [Privy Agentic Wallets Docs](https://docs.privy.io/recipes/agent-integrations/agentic-wallets)
- [Safe{Wallet}](https://safe.global/)
- [SEAL Secure Multisig Best Practices](https://frameworks.securityalliance.org/wallet-security/secure-multisig-best-practices/)
- [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [Agent Wallets Compared (Crossmint)](https://www.crossmint.com/learn/agent-wallets-compared)
- [CLAWD Treasury (3/6 Safe)](https://clawdbotatg.eth.link/)
- [Doc 283 - Privy Embedded Wallets](../../283-privy-embedded-wallets-fishbowlz-token-mechanics/)
- [Doc 339 - CLAWD Patterns](../../agents/339-austin-griffith-clawd-ethskills-agent-patterns/)
- [Doc 325 - Agent Swarm Economy](../../agents/325-zabal-agent-swarm-economy/)
