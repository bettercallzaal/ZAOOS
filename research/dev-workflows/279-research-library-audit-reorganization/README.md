# 279 — Research Library Audit & Reorganization

> **Status:** Phase 1 complete
> **Date:** April 5, 2026
> **Goal:** Audit all 277 research docs, fix duplicate numbers, archive superseded docs, plan topic-first reorganization

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Duplicate numbers** | FIXED — 13 folders renumbered (265-277), zero duplicates remain |
| **Superseded docs** | ARCHIVED — 69 docs moved to `research/_archive/`, all preserved |
| **Active library** | REDUCED from 277 → 207 active docs |
| **CANONICAL docs** | IDENTIFIED — 42 living reference docs that own their topic |
| **Future system** | PLANNED — Topic-first organization with living docs (Phase 2, separate session) |

## What Was Done (Phase 1)

### 1. Fixed 13 Duplicate-Numbered Folders

| Old # | New # | Doc |
|-------|-------|-----|
| 200 | 265 | clawdown-poker-agent |
| 208 | 266 | mission-control-v2 |
| 208 | 267 | openclaw-skills-capabilities |
| 208 | 268 | milady-ai-elizaos-evolution |
| 209 | 269 | claude-skills-mcp-agent-toolkit |
| 213 | 270 | zao-stock-planning |
| 214 | 271 | zao-knowledge-graph |
| 215 | 272 | zao-task-forces-2026 |
| 216 | 273 | web3-streaming-features-tipping-gating-tickets |
| 232 | 274 | zao-stock-team-deep-profiles |
| 240 | 275 | stream-video-sdk-dashboard-configuration |
| 241 | 276 | howiai-gridley-ai-habit-workflows |
| 258 | 277 | fishbowlz-audio-providers |

### 2. Archived 69 Superseded + Stale Docs

Moved to `research/_archive/`. See `_archive/README.md` for full index.

**Key supersession chains:**
- Farcaster: 001/013/019/021/022/034 → **073** (ecosystem 2026)
- Paperclip/OpenClaw: 067→072→174/175→226 → **234** (comprehensive guide)
- Music distribution: 108→142/147→ **148** (master plan)
- Governance: 007/031/055/078/131 → **133** (complete audit)
- Public APIs: 009→025 → **092** (2026 update)
- Agent memory: 008/024→197/204 → **234** (OpenClaw guide)

### 3. Identified 42 CANONICAL Docs

These are the definitive references for their topic. In Phase 2, they become living topic docs.

| # | Topic Owned | Category |
|---|-------------|----------|
| 029 | Artist economics & revenue | business |
| 035 | Notification architecture | infrastructure |
| 041 | Next.js/React framework | infrastructure |
| 050 | ZAO ecosystem (Complete Guide) | community |
| 051 | Whitepaper (Draft 4.5) | community |
| 056 | ORDAO/Respect Game mechanics | governance |
| 057 | Security audit findings | security |
| 058 | Respect scoring math | governance |
| 066 | Testing strategy (Vitest) | dev-workflows |
| 073 | Farcaster ecosystem state | farcaster |
| 074 | XMTP V3/MLS | farcaster |
| 075 | Hats Protocol V2 | governance |
| 082 | Music-first platform vision | music |
| 092 | Public APIs 2026 | infrastructure |
| 093 | Infrastructure gaps | infrastructure |
| 094 | Moderation + onboarding UX | community |
| 096 | Cross-posting per-platform | cross-platform |
| 098 | Supabase optimization | infrastructure |
| 101 | WaveWarZ integration | wavewarz |
| 103 | Fractal ecosystem | governance |
| 112 | Audius integration | music |
| 130 | Music integration roadmap | music |
| 133 | Governance feature inventory | governance |
| 140 | Nouns Builder/BuilderOSS | governance |
| 141 | On-chain music distribution | music |
| 148 | Music distribution roadmap | music |
| 152 | Arweave music layer | music |
| 154 | Skills/commands master ref | dev-workflows |
| 158 | ENS/Basenames/naming | identity |
| 159 | QA test checklist | dev-workflows |
| 160 | Audio spaces providers | music |
| 167 | Audio API landscape | music |
| 173 | Farcaster Mini Apps | farcaster |
| 188 | Fractal bot process | governance |
| 190 | Music player inventory | music |
| 191 | Reputation/ZAO Score | identity |
| 192 | RTMP multistream | infrastructure |
| 200 | Community OS vision | community |
| 218 | Mobile PWA strategy | infrastructure |
| 222 | Payment infrastructure | business |
| 223 | Smart contract dev | infrastructure |
| 227 | Agentic workflows 2026 | agents |
| 232 | MCP protocol/development | dev-workflows |
| 233 | Spaces full audit | infrastructure |
| 234 | OpenClaw comprehensive | agents |
| 239 | Agent framework comparison | agents |
| 245 | ZOE upgrade plan | agents |
| 255 | FISHBOWLZ spec | music |
| 256 | ZOE agent factory | agents |
| 270 | ZAO Stock planning | events |
| 271 | Knowledge graph | identity |
| 272 | Task forces 2026 | community |

## Phase 2 Plan (Future Session)

Topic-first reorganization:
1. Group remaining 207 docs into ~15 topic folders
2. Merge related STANDALONE docs into living topic docs
3. Move EVENT/LOG docs into `events/` folder
4. Update all category files and indexes
5. Update `/zao-research` skill for new structure

## Comparison: Before vs After Phase 1

| Metric | Before | After |
|--------|--------|-------|
| Active docs | 277 | 207 |
| Duplicate numbers | 11 (24 folders) | 0 |
| Archived | 0 | 69 |
| CANONICAL identified | 0 | 42 |
| Categories | 13 | 13 (unchanged) |

## Sources

- [Research README](../README.md) — master index
- [Archive README](../_archive/README.md) — archived doc index
- [topics.md](../../.claude/skills/zao-research/topics.md) — topic categories
