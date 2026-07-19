---
topic: business
type: note
status: verified
last-validated: 2026-07-19
original-query: Zaal ToS review - ZAO payment rails fit assessment
tier: QUICK
---

# Coinflow (coinflow.cash) - Payments Platform ZAO Fit Assessment

## What Coinflow Is

Coinflow is a merchant payments infrastructure platform (Coinflow Labs Limited, Delaware-governed) offering non-custodial payment processing to businesses. Supports US card acquiring, ACH pay-in/out, RTP, PIX, Venmo, PayPal, CashApp, Buy-Now-Pay-Later, wires, and crypto pay-ins. Runs on a smart-contract "Protocol"; connects to Digital Asset Wallets. Positioned for marketplaces, gaming, remittance, fintech, e-commerce, and payroll.

FETCH: coinflow.cash (PARTIAL) - homepage describes audiences, settlement speed, fraud indemnification; no visible pricing.

## ZAO-Relevant Terms (Flagged)

### Entity + KYC Requirement [BLOCKING]
Merchant must be a legal ENTITY (companies/orgs only, NOT individuals). Full KYC required: legal name, address, SSN/TIN, government ID photo, bank account info, articles of incorporation, beneficial ownership disclosures, source-of-funds verification. So ZAO needs a legal entity to sign + full corporate verification to use Coinflow.

### Coinflow Credit Model (Closed-Loop)
Purchasers buy a single-merchant, prepaid, non-transferable "Coinflow Credit" (like a gift card): no cash-out, non-reloadable, auto-applied to purchase, non-refundable. Relevant for ZAOstock ticket flow, Sparkz creator payouts, marketplace checkout -- purchaser credit is prepaid, not a general account balance.

### Reserve + Bank Debit Authorization [MATERIAL]
Coinflow can withhold funds in a Reserve (at their discretion) and ACH-debit your linked bank account to collect fees, chargebacks, or disputed amounts WITHOUT separate notice each time. Grants them a security interest. Canada = PAD agreement. Excessive chargebacks can trigger new fees, Reserve withholding, or suspension.

### Fees: Set Unilaterally, Non-Refundable
Coinflow modifies fees at will. Blockchain/network fees are merchant's responsibility. All fees are non-refundable.

### Liability Cap: $100 (or Last 6 Months Fees)
Broad warranty disclaimer ("as is"). Liability capped at $100 or fees paid in last 6 months, whichever is greater. Very narrow recourse.

### Mandatory Arbitration + Class-Action Waiver + Jury Trial Waiver
Disputes: ICC arbitration, New York. No jury trial, no class action. 1-year claim filing limit. Delaware governing law.

### Non-Custodial
ZAO bears all risk of digital-asset loss; Coinflow does not custody digital assets. Crypto pay-ins are non-custodial.

### MiCA Note (EU/EEA)
No Coinflow entity is a licensed crypto-asset service provider in EU/EEA. Regulated activity there flows through licensed third parties only.

### Sub-Processors
Plaid (bank linking), Checkbook, PayPal.

## ZAO Relevance + Verdict

**Fit:** Coinflow is a merchant payment rail, not a consumer wallet or self-custody tool. ZAO could use it for:
- ZAOstock ticket ticketing (USD / card acquisition)
- Sparkz creator payouts (fiat + crypto bridge to creator wallets)
- Marketplace checkout (ZAO collectibles, ZOL posts, etc.)
- Multi-sig business account settlement

**Blockers & Caveats:**
1. **Entity requirement** - ZAO needs a legal entity (BCZ Strategies LLC exists; MIDAO/"Greg legal body" work ties here). Full KYC mandatory.
2. **Reserve/bank-debit model** - Coinflow can hold funds and auto-debit your bank without per-transaction notice. Contract heavily favors platform.
3. **$100 liability cap** - very narrow. Disputes/chargebacks have minimal recourse.
4. **Mandatory arbitration** - removes court option; class-action waiver limits collective remedy.
5. **Non-custodial crypto** - ZAO accepts all risk on digital-asset inbound; Coinflow doesn't hold them.

**Practical Takeaway:** Coinflow is a viable merchant processor for fiat + limited crypto bridging, but terms heavily favor the platform (unilateral fee/reserve control, $100 liability, mandatory arbitration). STRONGLY RECOMMEND legal review (tie to Greg's ongoing legal-entity work) before signing. Useful for ZAOstock ticketing + marketplace, not for treasury/held assets.

---

## Sources

- **Coinflow.cash website** (PARTIAL): Product overview, audiences, feature positioning; no pricing disclosed.
- **Coinflow Terms of Service** (reviewed 2026-07-15, provided by Zaal): Full KYC, Entity requirement, Reserve, bank debit, chargebacks, fees, liability cap, arbitration, non-custodial, MiCA, sub-processors.

---

Last updated: 2026-07-19
