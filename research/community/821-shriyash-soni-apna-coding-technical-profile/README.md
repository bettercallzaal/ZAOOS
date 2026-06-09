---
topic: community
type: audit
status: research-complete
last-validated: 2026-06-08
superseded-by:
related-docs: "736, 778, 780, 805"
original-query: "https://github.com/shriyashsoni and https://www.apnacoding.com/ - research his GitHub + the Apna Coding site, push the PR, clipboard it"
tier: STANDARD
---

# 821 - Shriyash Soni / Apna Coding - Technical Profile

> **Goal:** Deepen doc 736 (the intro-call recap) with the primary technical sources - Shriyash's GitHub, the live Apna Coding product, and his second company - so the ZABAL Games partnership is grounded in what he actually ships, not just what he pitched.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Keep him as a ZABAL Games agentic-workflows presenter - he is an authentic AI-tooling builder** | His repos prove it: `Opportunity-Hunter` (async multi-agent web crawler, Tavily+Serper+GPT-4o), `apna_coding` built on Convex + v0.dev. He vibe-codes for real, which is exactly the June workshop topic. |
| 2 | **Correct doc 736's "Ethereum stake-to-list" framing - the shipped Apna Coding is web2 (Convex BaaS), not on-chain** | The live `apna_coding` repo stack is Vite + React 19 + Convex (backend/DB/auth via email OTP). The "Web3 Opportunity Layer" tagline is marketing; there is no staking contract in the code. Spec the ZABAL Games submission rail as a web2 integration. |
| 3 | **Use the 50k+ dev email list for ZABAL Games cross-promo (doc 736 decision #4), but treat his scale claims as self-reported** | GitHub traction is early: 24 followers, max 3 stars across 89 repos. The "premier" / "50k+ developers" numbers are his own, unverified. Good amplification asset; do NOT make a critical-path dependency hang on his reach until proven. |
| 4 | **Do not build any integration against Brixs-Chain yet** | His second company (UAE, "AI-Powered Smart Contract Generation") is 3 repos, all 0 stars - pre-product. Note it, watch it, no action. |

## Findings

### Who he is (GitHub, verified 2026-06-08)

- `github.com/shriyashsoni` - "Shriyash soni", Jabalpur MP, India. Joined **2023-07-07**. **89 public repos**, **24 followers**. Blog: `shriyashsoni.social`.
- Bio: "Founder Of @Brixs-Chain | @APNA-CODING-BY-APNA-COUNSELLOR | Entrepreneur | Blockchain & Web3 Developer | AI & Software."
- This **validates doc 736's "100+ projects in 1.5 years" claim** - the repo list is a wall of hackathon builds: `yield-mind-on-polygon` (DeFi AI, 3 stars), `influenpeer` (video NFT on OP/Base/Zora, ETHGlobal SuperHack entry), `CerebraDAO`, `AI-x-DeFi--DeFAI`, `FlowTravel`, `SOL-TICKET-EVENT-PLTFROM` (Rust/Solana), `defaiance`. **Profile = prolific hackathon grinder: breadth over depth, nothing past 3 stars.** Honest read: high output, unproven traction, early-career.

### What Apna Coding actually is

- **Tagline (apnacoding.com, the only thing the SPA renders server-side):** "Apna Coding - India's Premier Web3 Opportunity Layer."
- **APNA org bio:** "Apna Coding is a global coding community and learning platform designed to empower aspiring developers, students, and tech enthusiasts."
- **Real stack (`apna_coding` repo README, FULL):** Vite, TypeScript, **React Router v7, React 19, Tailwind v4, Shadcn UI, Convex (backend + DB + auth), Framer Motion, Three.js.** Auth = email OTP + anonymous. **This is a web2 Backend-as-a-Service build. No staking contract, no on-chain listing logic in the code.** A second copy, `apna_codingfinal`, is a v0.dev-generated site auto-synced to Vercel.
- **The "opportunity board" engine:** `Opportunity-Hunter` - a local Python async multi-agent that crawls the web (up to 30+ concurrent queries via **Tavily AI** primary + **Serper.dev** fallback), extracts funded trips / UGC deals / speaker CFPs / hackathons with **Pollinations keyless GPT-4o** (or Groq Llama-3.3-70b / Gemini), dedupes by normalized URL + slugified title, and outputs a styled Excel dashboard. So the "50k-dev opportunity layer" is fed by an AI scraper -> listing pipeline, not a user-submission DAO.
- **Contradiction flagged:** doc 736 (his own pitch) framed Apna Coding as "an open-source layer based on Ethereum" with "stake-to-list." The shipped product is Convex/web2. Either the on-chain layer is roadmap (not built) or the Web3 framing is positioning. Spec the ZABAL Games rail against the web2 reality.

### Second company

- **Brixs-Chain** (`github.com/Brixs-Chain`) - "Brixs is a AI-Powered Smart Contract Generation," United Arab Emirates, **3 repos, all 0 stars** (`brixswebsite`, `web`, `agents-on-bod`). Pre-product. This is the "one company in UK/UAE" from his doc-736 quote about running two companies.

## ZAO Application

- **ZABAL Games (doc 778):** he is a legit June agentic-workflows presenter - his own tooling (`Opportunity-Hunter`, v0.dev, Convex) is the curriculum. Authentic, not a poser.
- **Submission rail (doc 736 action #5):** re-scope from "Ethereum stake-to-list flow" to a **web2 Convex integration**. Lower lift, but no on-chain credentialing - decide if that matters for the build-a-thon.
- **Cross-promo (doc 736 decision #4):** the 50k+ list is a real asset; use it, don't depend on it.

## Also See

- [Doc 736](../../events/736-shriyash-soni-intro-call-may23/) - the intro-call recap this deepens
- [Doc 778](../../events/778-tyler-magnetic-zabal-games-build-may27/) - ZABAL Games Magnetic build (he presents here)
- [Doc 805](../../events/805-arun-phillips-collab-jun6/) - Arun / DreamStarter (fellow India ZABAL Games presenter, similar profile)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Re-scope doc 736 action #5: ZABAL Games submission rail = web2 Convex, not Ethereum stake-to-list | @Zaal | Edit doc 736 | Next sprint |
| Confirm Apna Coding's on-chain layer is roadmap vs marketing - ask Shriyash directly | @Zaal | Telegram | Before build-a-thon spec |
| Lock his June ZABAL Games slot on agentic workflows (Opportunity-Hunter as the live demo) | @Zaal | Ops | 2026-06-15 |
| Treat "50k+ devs / premier" as unverified self-report in any ZABAL Games deck | @Zaal | Note | Ongoing |

## Sources

- [github.com/shriyashsoni (profile + 89 repos)](https://github.com/shriyashsoni) `[FULL - gh api, profile fields + top repos by stars, 2026-06-08]`
- [shriyashsoni/apna_coding README (live product stack)](https://github.com/shriyashsoni/apna_coding) `[FULL - gh api readme; Convex/Vite/React19 stack, web2 BaaS]`
- [shriyashsoni/apna_codingfinal README (v0.dev site)](https://github.com/shriyashsoni/apna_codingfinal) `[FULL - gh api readme; v0.dev-generated, Vercel-deployed]`
- [shriyashsoni/Opportunity-Hunter- README (the opportunity-board engine)](https://github.com/shriyashsoni/Opportunity-Hunter-) `[FULL - gh api readme; async multi-agent, Tavily+Serper+GPT-4o -> Excel]`
- [github.com/Brixs-Chain (2nd company)](https://github.com/Brixs-Chain) `[FULL - gh api org + repos; "AI-Powered Smart Contract Generation", UAE, 3 repos 0 stars]`
- [github.com/APNA-CODING-BY-APNA-COUNSELLOR (org)](https://github.com/APNA-CODING-BY-APNA-COUNSELLOR) `[FULL - gh api org bio]`
- [apnacoding.com](https://www.apnacoding.com/) `[PARTIAL - client-rendered SPA; only the title/tagline "India's Premier Web3 Opportunity Layer" is in the served HTML. WebFetch + exa web_fetch both return shell only; Playwright bridge not installed. Product reality recovered from the repo READMEs above, which are richer than the marketing site.]`
- [shriyashsoni.social (personal blog)](https://shriyashsoni.social) `[PARTIAL - 403 to WebFetch; exa returns only the title "Shriyash Soni - Software Engineer & Innovator". Body is client-rendered/gated.]`
- [Doc 736 intro-call transcript](../../events/736-shriyash-soni-intro-call-may23/) `[FULL - his own quotes on Apna Coding function, 50k-dev list, two companies, 100+ projects]`
