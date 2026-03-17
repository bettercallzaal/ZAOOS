# Decision Points — Resolved (March 17, 2026)

## 1. Decent DAO vs Custom Hats Stack — NEEDS EVALUATION

### Decent DAO (All-in-One)
**Pros:**
- Bundles Hats + Safe + fractal subDAOs into one interface
- Automated term limits and re-election triggers
- Parent DAO oversight of Sub-DAOs built in
- Treasury + roles + payments in one system
- Faster to deploy — less assembly required
- Battle-tested by existing DAOs

**Cons:**
- Additional dependency on Decent's codebase
- Less flexibility to customize eligibility logic
- May not support ZAO's specific fractal Respect model out of the box
- If Decent changes direction, ZAO is coupled to their decisions
- Adds abstraction layer between ZAO OS and Hats contracts

### Custom Hats Stack (Assemble from Components)
**Pros:**
- Direct control over every piece (Hats SDK + Safe + eligibility modules)
- Can write custom eligibility module for Respect tokens specifically
- No dependency beyond Hats Protocol itself (well-established, 50+ DAOs)
- Can integrate deeply with ZAO OS UI (subgraph queries for hat ownership)
- More flexibility to add ZAO-specific logic later

**Cons:**
- More setup work (deploy Safe, create hats, configure modules individually)
- Need to handle Safe + HSG integration manually
- More testing surface area
- No built-in term limits or re-election (would need custom logic)

**Decision:** Evaluate both before Sprint 5. Start with custom stack research since it gives more control.

---

## 2. Agent Framework — DECIDED: ElizaOS

ElizaOS selected. Has Farcaster and XMTP plugins ready. Separate `zao-agent` repo.

---

## 3. Agent Memory — DECIDED: pgvector in Supabase

Custom pgvector in existing Supabase database. Can pull from research library files (54 docs, 300K+ words) as knowledge base for the agent.

Architecture: embed research docs + community data into pgvector for semantic search. Agent queries its own memory tables in the same database the app uses.

---

## 4. Cross-Platform Publishing — DECIDED: Custom, defer for now

Build custom integrations when ready. X/Twitter posting and other platforms. Not using Ayrshare. Not a current priority.

---

## 5. On-Chain Attestation — DECIDED: Defer

Don't worry about EAS attestation for now. Focus fully on Respect tokens and governance first. On-chain attestation comes later.

---

## 6. Non-Crypto Login (Privy) — DECIDED: No

Wallet required to login. This is a web3-native community — wallet-first auth stays.

---

## 7. Redis for Rate Limiting — DECIDED: Yes, add it

Add Redis-backed rate limiting. Resolves the multi-replica issue on Vercel.
