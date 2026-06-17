---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-06-14
related-docs: "855, 856, 601"
original-query: "Should ZAO build a Telegram-native surface, and is TON worth it? Triggered by the AI-agent shift to Telegram (Mira, Manus) that GCvlcnti surfaced."
tier: STANDARD
---

# 857 - TON / Telegram-native strategy for ZAO

> **Goal:** decide whether ZAO should build a Telegram-native surface (mini app,
> TON rail, public bonfire bot) given the verified shift of consumer AI agents
> to Telegram, or stay focused on Farcaster + Base.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **SKIP a Telegram mini app / TON build now. WAIT 12-18 months.** | Telegram mini apps are optimized for gaming / DeFi / memecoins; zero successful artist-community examples; retention is structurally broken (Hamster Kombat lost 96% of users in 18 months). Wrong surface for a 188-member high-intent artist network. |
| 2 | **DO the one low-effort move: put ZOE on Telegram as a bot** (no mini app) | Gives Telegram distribution of the concierge without the gaming/monetization/mini-app build. ZOE already exists. |
| 3 | **Treat Mira as a WATCH (competitor), not a model to copy** | GCvlcnti wants Bonfire to copy Mira. Mira is impressive (2M users, 900+ integrations) but its cross-chat-memory model is a security liability for a private graph (doc 856). Learn from its UX, do not adopt its data model. |
| 4 | **Do NOT chase TON grants** | Real money exists (Memelandia $5M, Accelerator $2.5M) but requires a working Telegram product with traction ZAO does not have, and the meme/gaming focus does not fit. Funding without product clarity = wasted effort. |
| 5 | Revisit when ZAO hits 500+ active Farcaster members OR a real artist use-case appears on Telegram OR ZAOstock spins out with spare bandwidth | Clear re-entry triggers, not a permanent no. |

## What the research found (June 2026)

### TON ecosystem - real but mismatched
- Grants are real + accessible to foreign teams: TON Champion Grants, **Memelandia
  ($5M fund, $500K/project)**, **TON Accelerator ($2.5M)**, STON.fi (up to $10K).
  But Memelandia requires 25k+ mini-app users + $1M+ volume; all require a working
  product with traction.
- Ecosystem health: ~10,938 active devs (June 2025), 34k+ contracts, 800M Telegram
  users addressable. Real, but 2026 growth figures unpublished.

### Telegram mini apps - adoption is easy, retention is broken
- Mega-apps exist: MAJOR (70M), Blum (43M MAU), X Empire (36M), Catizen (34M),
  Notcoin (35M+).
- **Retention is the killer:** Hamster Kombat went from a ~155M peak to losing
  **96% of users + 95% of token value in 18 months.** Tap-to-earn bleeds out.
- Monetization via Telegram Stars nets creators ~$0.013/Star after a 30% cut;
  32% total fees on mobile. Token launches != sustainable revenue.
- **No successful artist-collective or community-DAO mini app exists.** The space
  is transactional (games, DeFi, memecoins).

### The AI-agent wave - real, but saturated + commoditized
- **Mira:** launched Feb 2026, 2M+ users, 500k MAU, 50k+ groups, 900+ integrations,
  model-routing across OpenAI/Anthropic/Minimax/ByteDance, Private Mode via Cocoon
  (decentralized GPU on TON). Genuinely strong.
- **Manus:** Meta's ~$2B+ acquisition (Dec 2025) launched Agents on Telegram Feb
  16 2026 - **but China's NDRC BLOCKED the acquisition in April 2026; status is
  now in legal limbo.** (GCvlcnti's "Manus bought by Meta" was correct when said,
  now uncertain.)
- 120+ agentic AI tools competing. Launching an AI agent gives **no defensibility**.

## Why this matters for ZAO specifically

ZAO's edge is a small (188), high-intent, artist-first community on Farcaster +
Base, with ZABAL Games live and ZAOstock spinning out. Telegram mini apps reward
casual churn and viral spikes - the opposite of ZAO's retention profile. The
bandwidth is better spent deepening Farcaster and shipping ZAOstock. The AI-agent
shift to Telegram is real and worth tracking (GCvlcnti's macro read holds), but
"real trend" does not equal "ZAO should build there now."

## Also See

- [Doc 856](../../security/856-mira-cross-chat-graph-leakage/) - Mira as a security liability (the other half of the Mira story)
- [Doc 855](../../community/855-gcvlcnti-bonfire-admin-relationship-log/) - where this question originated
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - the "no new surfaces" discipline this respects

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide ZOE-on-Telegram (low-effort distribution) yes/no | @Zaal | Decision | Next sprint |
| Keep Mira/Telegram-agent space on a quarterly watch | @Zaal | Note | Q3 2026 |
| Re-evaluate TON/Telegram when 500+ Farcaster members OR ZAOstock spun out | @Zaal | Trigger | When hit |

## Sources

- [TON Grants](https://ton.org/en/grants) [FULL]
- [Top Telegram Mini Apps on TON - BingX](https://bingx.com/en/learn/article/top-telegram-mini-apps-on-ton-network-ecosystem) [FULL]
- [Telegram Stars monetization - TeleStars](https://telestars.io/blog/telegram-stars) [FULL]
- [China blocks Meta from buying Manus - Euronews, 2026-04-27](https://www.euronews.com/next/2026/04/27/china-blocks-meta-from-buying-ai-startup-manus) [FULL]
- [Mira - mira.tg](https://mira.tg/) [FULL]
