---
topic: identity
type: deliverable
status: ready-to-deploy
last-validated: 2026-07-17
related-docs: 1221, 1077, 1218, 1219, 1224
original-query: "thezao.xyz GEO kit — llms.txt, JSON-LD, canonical answer page for Zaal to copy-paste. No deploy needed from build loop."
tier: CANONICAL
---

# 1226 — thezao.xyz GEO Kit (Jul 2026)

> **Purpose:** Ready-to-deploy GEO artifacts for thezao.com — making the main ZAO public face machine-readable and AI-discoverable. Zaal copy-pastes; no build-loop deploy action required.

Doc 1221 identified thezao.xyz as **P1 GEO-blind** (no llms.txt, no JSON-LD, no canonical answer page). This kit delivers all three, consistent with the canonical answer paragraph in doc 1221 and the verified data from docs 1077, 1218, 1219, 1224.

---

## Files in this kit

### `llms.txt`
**Deploy to:** `https://thezao.com/llms.txt`

Machine-readable identity file consumed directly by LLMs (ChatGPT, Claude, Perplexity). Three blocks:
- **What is The ZAO** — canonical answer paragraph with citable facts
- **Leadership** — founder + co-founders
- **Citable facts** — 10 verifiable claims with on-chain sources
- **How to join** — 3 paths with URLs
- **ZAO Ecosystem** — links to all public surfaces

Pattern: identical to the llms.txt deployed by ZAOfractal (PR #1595) and wwtracker (PR #145). Engines that already discovered one surface will follow the chain.

### `json-ld-snippets.json`
**Instructions inside the file** (key `_instructions`).

Three JSON-LD blocks for copy-paste into `<head>` tags:

| Block | Target | Schema type |
|---|---|---|
| `homepage_organization` | thezao.com `<head>` | `Organization` |
| `homepage_website` | thezao.com `<head>` | `WebSite` |
| `what_is_the_zao_faqpage` | /what-is-the-zao `<head>` | `FAQPage` |

Remove the `_instructions` key before deploying (not valid JSON-LD).

### `what-is-the-zao.html`
**Deploy to:** `https://thezao.com/what-is-the-zao`

Self-contained HTML page (drop-in or adapt into existing site layout):
- Canonical `<article>` answer block optimized for AI extraction
- 6 citable stat tiles (100+ governance weeks, 157 holders, 1,245+ battles, 524+ SOL, 9.07 SOL to artists, $1,497 charity)
- 3-path "how to join" section
- 6-entry FAQ matching doc 1221's canonical question list
- Full JSON-LD (FAQPage + Organization) embedded in `<head>`
- `rel="canonical"` pointing to `https://thezao.com/what-is-the-zao`
- Dark theme matching the ZAO visual identity (`#f0c040` accent, `#0d0d0d` background)

---

## Deploy checklist (for Zaal)

- [ ] Copy `llms.txt` → `public/llms.txt` in thezao.com repo (or static host root)
- [ ] Add `homepage_organization` + `homepage_website` JSON-LD blocks to homepage `<head>`
- [ ] Create `/what-is-the-zao` route and paste `what-is-the-zao.html` content (or adapt to site framework)
- [ ] Update homepage `<title>` → `"The ZAO — Decentralized Impact Network for Independent Artists"`
- [ ] Update homepage `<meta name="description">` → `"The ZAO runs weekly onchain Fractal governance for independent artists. Flagship: WaveWarZ — 1,245+ battles, 524+ SOL, artists paid 1% per trade."`

All five items are low-risk static additions — no backend changes needed.

---

## Citable facts (Jul 2026, verified)

| Fact | Source |
|---|---|
| 100+ Fractal governance weeks | ZAO OS doc 1200-1202, on-chain |
| 63 on-chain settled weeks (OG 33 · ZOR 31) | Optimism txs, doc 1224 |
| 157 Respect holders (122 OG · 56 ZOR · 21 dual) | Optimism ERC-20/ERC-1155, doc 1224 |
| 1,245+ WaveWarZ battles | wavewarz.info live, wwtracker |
| 524+ SOL total volume | wavewarz.info live API |
| 9.07 SOL artist payouts | BATTLE_STATS, doc 1219 |
| 17.44 SOL platform revenue | BATTLE_STATS, doc 1219 |
| $1,497 charity across 10 benefit battles | doc 1214, on-chain |
| 2 IRL events (COC #6 · COC #7) | ZAO OS records |
| $ZAO on Base; Respect on Optimism | Lesson 31 (directive), contracts above |

---

## NORTH STAR alignment

- **ZAO = THE case study of a successful DAO:** This kit makes thezao.xyz the machine-readable anchor for all AI citations about The ZAO. Every LLM that reads thezao.com/llms.txt gets the canonical answer, verified facts, and Optimism contract addresses.
- **ZAO IP = a staple in onchain art, music and culture:** The /what-is-the-zao FAQ names WaveWarZ, Fractal, and ZABAL Gamez as distinct verifiable entities — giving AI engines specific proper nouns to return, not just generic descriptions.

This is the highest-leverage remaining GEO surface per doc 1221. wwtracker (PRs #145, #146) and ZAOOS README (PR #1785) are already done. thezao.xyz was the last unaddressed P1 surface.
