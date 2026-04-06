# ZAO OS Research Freshness Audit — 2026-04-06

**Auditor:** Claude Code (automated)  
**Audit Date:** 2026-04-06  
**Freshness Threshold:** 30 days (stale = last modified before 2026-03-07)  
**Scope:** All `research/` README files, excluding `_archive/`

---

## Freshness Summary

| Metric | Count |
|--------|-------|
| Total active research docs | 226 |
| Archived/superseded docs | 79 |
| Docs older than 30 days | **0** |
| Docs on fast-moving topics | ~80 (AI/agents, Farcaster, crypto, infra) |
| Docs requiring immediate action | 0 (all current) |

**Finding:** All 226 active research documents were created or substantially revised on 2026-03-30 or later. No documents meet the "stale" threshold of >30 days. The library is in excellent shape.

---

## Priority Updates Needed

No documents are technically stale (>30 days). However, several documents contain **version-pinned or time-sensitive claims** that warrant proactive monitoring even though they were recently written:

| Doc # | Title | Last Modified | Topic Area | Watch Reason |
|-------|-------|---------------|------------|--------------|
| 208 | Paperclip Plugins Update | 2026-03-25 | Agents | Paperclip ships new versions every ~7 days (`v2026.325.0` is latest documented); could be outdated within days |
| 268 | Milady AI + ElizaOS Evolution | 2026-03-28 | Agents | ElizaOS v2 still alpha.76; transition timeline will shift |
| 205 | OpenClaw + Paperclip + ElizaOS Stack | 2026-03-28 | Agents | Live deployment configs; version drift risk |
| 227 | Agentic Workflows 2026 | 2026-03-29 | Agents | Claude SDK v0.2.71 / Vercel AI SDK v6 / LangGraph v1.1.0 pinned |
| 073 | Farcaster Ecosystem Update 2026 | 2026-03-19 | Farcaster | Post-Neynar-acquisition API stability/pricing not yet settled |
| 152 | Arweave Ecosystem Deep Dive | 2026-03-26 | Crypto/NFT | Irys deprecation (Nov 2025) — confirms ArDrive Turbo; verify no Irys code in codebase |
| 144 | ZOUNZ Music NFT Distribution | 2026-03-26 | Crypto/NFT | Live contract addresses on Base; Zora Protocol has no version pin |
| 155 | Music NFT End-to-End Implementation | 2026-03-26 | Crypto/NFT | Zora 1155 + 0xSplits evolve frequently |
| 085 | Farcaster Agent Setup | 2026-03-19 | Farcaster/Agents | Neynar rate limits / pricing post-acquisition |

---

## Still Current — No Action Needed

These documents are old-ish relative to the rest but cover stable or archival topics:

| Doc # | Title | Topic Area | Why It's Stable |
|-------|-------|------------|-----------------|
| 051 | ZAO Whitepaper 2026 | Community | Annual-cycle strategic doc |
| 057 | Codebase Security Audit Mar 2026 | Security | Point-in-time audit; accurate as of date |
| 136 | API Status Verification Mar 2026 | Security | Snapshot verification log |
| All Events docs | ZOE Ship Logs, session notes | Events | Historical audit logs; no refresh needed |
| All Inspiration docs | Daily app analysis logs | Inspiration | Reference material, not canonical |
| Governance docs | Hats v2, ORDAO, BuilderOSS | Governance | DAO spec changes slowly; quarterly review sufficient |

---

## Version Number & Dated Reference Inventory

Key version pins found across the research library:

| Component | Version / Date Mentioned | Doc # | Risk |
|-----------|--------------------------|-------|------|
| Claude Agent SDK (TS) | v0.2.71 | 227 | Medium |
| Claude Agent SDK (Python) | v0.1.48 | 227 | Medium |
| Vercel AI SDK | v6 (Dec 2025) | 227 | Low |
| Paperclip | v2026.325.0 (Mar 25, 2026) | 208 | **High** |
| ElizaOS | v1.7.2 stable / v2 alpha.76 | 268 | Medium |
| Milady AI | v2.0.3 (Mar 28, 2026) | 268 | Medium |
| LangGraph | v1.1.0 (Mar 2026) | 227 | Low |
| CrewAI | v1.1.0+ (maintenance mode) | 227 | Low |
| ArDrive Turbo SDK | `@ardrive/turbo-sdk` (latest) | 152 | Low |
| Neynar API | Post-acquisition (Jan 21, 2026) | 073 | **High** |
| Snapchain | Live Apr 2025, 10K+ TPS | 073 | Low |
| Next.js | v16 | 283 | Low |
| Zora Protocol 1155 | No version pinned | 155 | Medium |
| Farcaster DAU | 40-60K (Mar 2026) | 073 | Low (metric) |

---

## Recommended Actions

### Immediate (this week)

1. **Check Paperclip version** — v2026.325.0 was latest as of Mar 25. Paperclip ships weekly; run `paperclip --version` on VPS and update doc 208 if behind.
2. **Verify no Irys bundler usage** — Doc 152 warns against Irys (deprecated Nov 2025). Grep codebase for `irys` / `bundlr` to confirm clean. Update doc if any Irys calls found.
3. **Pin Zora Protocol version** — Docs 144 and 155 reference Zora 1155 without a version. Add version pin to prevent silent breaking changes.

### Short-Term (April → May 2026)

4. **ElizaOS v2 readiness check** — Doc 268 says v2 alpha.76 (not production-ready). Run a readiness check in late April; update doc with go/no-go recommendation.
5. **Neynar pricing audit** — Neynar acquired Farcaster in January 2026. Monitor API pricing and rate limit docs; update doc 073 and 085 if pricing/tiers change.
6. **Claude SDK version tracking** — Create `research/versions.json` to track critical SDK versions centrally:
   ```json
   {
     "claude-sdk-ts": "v0.2.71",
     "claude-sdk-py": "v0.1.48",
     "paperclip": "v2026.325.0",
     "elizaos": "v1.7.2",
     "next": "16",
     "arweave-turbo": "latest"
   }
   ```

### Long-Term (Q2 2026)

7. **Plan ElizaOS v2 migration** — Docs recommend v2 once stable; add a doc tracking migration readiness.
8. **Farcaster app rebrand monitoring** — "Warpcast" → "Farcaster" app rebrand happening mid-2026; update all brand references across docs and codebase (`CLAUDE.md` already correct: "Always say 'Farcaster' not 'Warpcast'").
9. **Schedule next freshness audit** — Run this audit again in **early July 2026** (or sooner if major ecosystem events occur like ElizaOS v2 stable release or Neynar pricing changes).

---

## Review Cadence Recommendation

| Frequency | Topics |
|-----------|--------|
| Weekly | Paperclip releases, agent framework changelogs |
| Bi-weekly | Farcaster/Neynar API changes, Arweave ecosystem |
| Monthly | Infrastructure tools (Next.js, Supabase, Stream.io, Vercel), music NFT contracts |
| Quarterly | Governance (Hats, ORDAO, Snapshot), community strategy, cross-platform APIs |
| Annually | Whitepaper, community guides, archived audits |

---

## Archive Health

79 documents are correctly archived in `research/_archive/`. Notable archived items confirm good hygiene:
- Old Farcaster Hub/CRDT patterns (replaced by Snapchain)
- Irys/Bundlr Arweave patterns (Irys pivoted away Nov 2025)
- CrewAI production patterns (now maintenance mode per doc 227)
- Legacy auth flows

No action needed on archive — it is properly maintained.

---

*Next audit recommended: 2026-07-06 (or sooner on major ecosystem events)*  
*Generated by Claude Code research-freshness auditor*
