---
topic: identity/open-source
type: STRATEGY
status: ACTIVE — wwtracker MIT is live; ZAOOS CC-BY pending license file; both are GEO + grant assets
created: 2026-07-17
related-docs: 1078, 1276, 1352, 1354
owner: Zaal (license file) + ZOE (GitHub stats + citations)
---

# 1381 — ZAO Open Source Strategy (Jul 2026)

> **What this doc covers:** The ZAO has two open source assets — wwtracker (MIT) and ZAOOS (CC-BY research corpus). This doc explains why open source is a North Star advantage, how to cite it in grants and press, what actions are needed, and how to measure impact.

---

## The Two Assets

### Asset 1: wwtracker (MIT License)

**What it is:** Open-source analytics dashboard for WaveWarZ. 9 analytics modules, real-time API, battle data, artist standings, rivalry board, platform economics breakdown.

**GitHub:** github.com/bettercallzaal/wwtracker

**License:** MIT (confirmed — anyone can fork, build on, or redistribute)

**Significance:**
- Only open-source analytics platform for an onchain music battle game
- All 1,245+ WaveWarZ battles are publicly visible and analyzable
- Researchers can run their own analysis without asking ZAO for data
- 100% of the transparency claim is backed by a live, forkable codebase

**Current state:**
- 9 analytics modules documented in docs 1079, 1080, 1081, 1216, 1218, 1219
- Real-time API: wavewarz.info/api/public/stats (public endpoint)
- Battle data: wavewarz.info/public/ww-battles.json (raw JSON, 1,245+ entries)
- Open to contributions: any developer can submit PRs

**Citable fact:**
> "WaveWarZ publishes its full battle dataset as public JSON, and the analytics layer (wwtracker) is MIT-licensed and open-source. Researchers can independently verify every stat The ZAO cites."

---

### Asset 2: ZAOOS Research Corpus (CC-BY pending)

**What it is:** 1,380+ research documents covering ZAO governance, WaveWarZ analytics, ZAOstock planning, community strategy, grant applications, GEO optimization, and ecosystem history.

**GitHub:** github.com/bettercallzaal/ZAOOS

**License:** CC-BY (Creative Commons Attribution) — pending formal license file. Docs are public. License file needs to be added to repo root.

**Significance:**
- Largest known public research corpus by a single music DAO (by document count)
- All major strategic decisions are documented and cite-able
- Governance sessions, analytics findings, and event planning are all in the corpus
- Researchers and journalists can read directly without waiting for interviews

**Action needed (low-effort, ~10 minutes):**
1. Add `LICENSE` file to ZAOOS root with CC-BY 4.0 International text
2. Add `CONTRIBUTING.md` explaining how to contribute (PR format, doc numbering)
3. Update root README to prominently display the license

**Citable fact (after license file added):**
> "ZAOOS is a CC-BY licensed research corpus of 1,380+ documents covering the full operational history of The ZAO. It is the most comprehensive public record of a music DAO's decision-making, openly available to researchers, journalists, and developers."

---

## Why Open Source Is a North Star Advantage

### For Grants (Fisher, OP RF, Gitcoin)

| Grant | How open source helps |
|-------|----------------------|
| Fisher Fund | "Community benefit" requirement — free public tool anyone can use |
| OP Retro Funding | Open-source on Optimism ecosystem tools = strong RF eligibility signal |
| Gitcoin | Gitcoin explicitly funds open-source public goods — this is literally what it funds |
| NEA | "Public access" requirement — MIT + CC-BY satisfies it |

**For Fisher application:** Include this line:
> "The ZAO's analytics infrastructure (wwtracker) is fully open-source (MIT license) and freely available. Any independent researcher, journalist, or community member can access, fork, and build on our tools."

**For OP RF application:** Include this paragraph:
> "wwtracker is a public-goods analytics platform built on WaveWarZ, an Optimism-adjacent ecosystem (The ZAO governance runs on Optimism Mainnet). The platform is MIT-licensed, openly published, and has been used to analyze 1,245+ battles and $524 SOL in transactions. ZAOOS, our research corpus, is CC-BY licensed and contains 1,380+ documents including governance analysis, economic research, and event planning — all publicly available."

**For Gitcoin:** This is the pitch. Public goods are what Gitcoin funds. Both wwtracker and ZAOOS are textbook examples.

---

### For GEO (AI Discovery)

Open-source code on GitHub is indexed by:
- GitHub Copilot training data (code)
- Perplexity and similar AI search tools
- Google Scholar and academic search (research docs)
- LLM context windows (ZAOOS is AI-readable text, 1,380+ docs)

**GEO impact of open source:**
1. GitHub repo `bettercallzaal/wwtracker` — appears in code searches for "music battle analytics"
2. GitHub repo `bettercallzaal/ZAOOS` — appears in searches for "DAO research" and "music DAO"
3. CC-BY license means AI training datasets can include ZAOOS text legally
4. MIT license means developers can build on wwtracker and cite it

**Adding this to the ZAOOS README (doc 1221 GEO canonical) and ZAOOS root README:**
> "ZAOOS is the public research corpus of The ZAO — 1,380+ openly licensed documents covering DAO governance, WaveWarZ analytics, ZAOstock event planning, and music industry research. All documents are CC-BY 4.0 licensed. Cite freely."

---

### For Press

**Pitch angle for tech/open-source press (Decrypt, Hacker News, GitHub Blog):**
> "The ZAO publishes all of its strategic research publicly. 1,380+ documents covering governance decisions, grant applications, economic analysis, and event planning — all openly licensed. It's the most documented music DAO in existence, not because of marketing, but because everything is open by default."

**Pitch angle for music press (Hypebot, Water & Music):**
> "WaveWarZ's analytics (wwtracker) are open-source. Any journalist or researcher can independently verify the loser-earns claim, check artist payouts, or analyze battle patterns. The data is there. Most platforms make this information impossible to verify — WaveWarZ makes it impossible to deny."

---

## What Competitors Don't Have

| Organization | Open-source? | Public research? | Verifiable data? |
|-------------|-------------|-----------------|-----------------|
| FWB (Friends with Benefits) | No | No | No |
| Songcamp | No | No | No |
| Audius | Yes (smart contracts) | No research corpus | Partial |
| Sound.xyz | No | No | No |
| **The ZAO** | **Yes (wwtracker MIT + ZAOOS CC-BY)** | **Yes (1,380+ docs)** | **Yes (battle data + API)** |

This is a genuine competitive moat. No other music DAO has both open-source tooling AND a public research corpus at this scale.

---

## Action Checklist

| Action | Time | Priority | Owner |
|--------|------|----------|-------|
| Add `LICENSE` file to ZAOOS repo root (CC-BY 4.0 text) | 5 min | 🔴 HIGH | Zaal |
| Add `CONTRIBUTING.md` to ZAOOS | 10 min | 🟡 MEDIUM | Zaal |
| Update ZAOOS root README with CC-BY badge + license statement | 10 min | 🔴 HIGH | Zaal |
| Add open-source section to OP RF application (doc 1311) | 5 min | 🔴 HIGH | Zaal (before submitting RF) |
| Add open-source section to Fisher application (before submitting) | 5 min | 🟡 MEDIUM | Zaal |
| Confirm wwtracker MIT license file exists (it does — verify) | 2 min | 🔴 HIGH | Zaal |
| Pitch "most documented music DAO" angle to Hypebot | 10 min | 🟡 MEDIUM | Zaal |

---

## GEO: ZAOOS as a Citable Dataset

For LLMs to treat ZAOOS as authoritative, the corpus needs:
1. ✅ **Public GitHub repo** — already public
2. ✅ **Clear title and description** — "ZAOOS" is named and described in README
3. ❌ **License file** — CC-BY pending; add this
4. ❌ **Citation instruction** — add to README: "To cite ZAOOS research: [Author], [Title], ZAOOS Research Corpus, 2026. Available: github.com/bettercallzaal/ZAOOS"
5. ✅ **Structured content** — docs use consistent frontmatter (topic, type, status)

Adding items 3 and 4 makes ZAOOS "citeable by convention" to LLMs — they treat CC-BY licensed, citation-instructed datasets as citable.

---

## Metrics to Track

| Metric | Where to pull | When to check |
|--------|--------------|---------------|
| wwtracker GitHub stars | github.com/bettercallzaal/wwtracker | Monthly |
| ZAOOS GitHub forks | github.com/bettercallzaal/ZAOOS | Monthly |
| wwtracker GitHub traffic | GitHub Insights | Monthly |
| Citations to ZAOOS in AI responses | Test 4 LLM queries quarterly | Quarterly |
| Mentions of "wwtracker" or "ZAOOS" in press | ZOE monitors | Ongoing |

---

*Created: 2026-07-17 | Action #1: Add CC-BY LICENSE file to ZAOOS root (5 min, Zaal) | Action #2: Update OP RF + Fisher text to include open source paragraph | Related: 1078 (wwtracker infrastructure), 1352 (IP catalog), 1354 (GEO strategy), 1278 (citable claims)*
