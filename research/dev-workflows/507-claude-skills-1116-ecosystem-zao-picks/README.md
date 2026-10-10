---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-10
related-docs: 154, 312, 491, 506
tier: STANDARD
original-query: Out of 1,116 Claude Code skills in the ecosystem, which ~15 are worth installing for ZAO OS, BCZ, and the agent fleet? (reconstructed)
---

# 507 - Claude Skills 1,116 Ecosystem - ZAO Curated Picks

> **Goal:** Cut @polydao's 1,116-skill / 500-repo catalog down to the ~15 picks worth installing for ZAO OS / BCZ / agent fleet, flag hallucinations, flag stack gaps the catalog does not cover.

Trigger: Polydao 1,116 skills catalog (Apr 24 2026). Ecosystem grew 1,100+ skills in months. May 2026 validation: ecosystem still 1,100+, no consolidation yet. Most add context tax without capability. [FULL]

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| Install entire catalog | **SKIP - HARD** | Each skill is a permanent context tax on every conversation. Doc 312 already cites RoboRhythms: "install no more than 3 skills total" without measurable lift. ZAO already runs ~32 user skills + ECC plugin (200+); we are over-budget already. |
| Add 5-10 stack-relevant new skills | **YES, CURATED** | See "Install" table below. Pick only skills that map to actual ZAO stack (Supabase, Next.js 16, Farcaster, agents, music, security). |
| Build a ZAO-specific Farcaster skill + publish to marketplace | **YES** | Catalog has ZERO Farcaster / XMTP / Neynar skills. We have the most production Farcaster + XMTP + iron-session code in the ecosystem. Publishing one is community contribution + recruiting magnet. |
| Trust @polydao's repo URLs blindly | **NO** | At least 3 hallucinations found in spot-check (see "Hallucinations" section). Verify each repo before install. |
| Treat polydao thread as canonical map | **NO** | It is a snapshot dated 2026-04-24, surfaces low-star repos as if equal to 100K-star repos, and missed several gaps that matter to ZAO. Use as a discovery feed only, not authority. |

## Already Installed in ZAO (do not reinstall)

Cross-checked against `~/.claude/skills/`, `~/.claude/plugins/`, and `community.config.ts` skill mentions on 2026-04-24:

| Skill / Pack | Source | ZAO use |
|--------------|--------|---------|
| obra/superpowers (brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, systematic-debugging, verification-before-completion, using-git-worktrees, finishing-a-development-branch, requesting-code-review, receiving-code-review, writing-skills, using-superpowers, subagent-driven-development, test-driven-development) | ~/.claude/plugins | Core planning + review loop |
| safishamsi/graphify | ~/.claude/skills/graphify | `/graphify` for codebase + research knowledge graphs |
| everything-claude-code (200+ skills) | ECC plugin | Wide spectrum: nextjs-turbopack, postgres-patterns, claude-api, security-review, hookify, etc. |
| autoresearch + 7 sub-skills | ~/.claude/skills/autoresearch | Karpathy autoresearch loop |
| caveman | ~/.claude/skills/caveman | Token compression on output |
| oh-my-mermaid | ~/.claude/plugins | Architecture diagrams |
| /worksession, /qa, /ship, /review, /retro, /vps, /onepager, /zao-research, /bcz-research, /design-review, /design-consultation, /investigate, /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /clipboard, /ship, /document-release, /codex, /careful, /freeze, /unfreeze, /guard, /gstack, /browse, /retro, /reflect, /morning, /z, /big-win, /lean, /inbox, /newsletter, /socials, /design-steal, /next-best-practices, /fishbowlz, /quad, /setup-browser-cookies, /bcz-yapz-description | ~/.claude/skills/* | ZAO custom skills (see Doc 154) |

Total context budget already heavy. New installs should clear a high bar.

## Install (5-7 picks max)

| Skill / Repo | Why ZAO needs it | Stack fit |
|--------------|------------------|-----------|
| **supabase/agent-skills** (1,995 stars, verified) | Postgres best practices + RLS guidance from Supabase team. ZAO has 301 API routes hitting Supabase + RLS on every table. Authoritative source beats ECC's generic postgres-patterns for our specific stack. | DIRECT fit |
| **trailofbits/skills** (4,783 stars, verified) | static-analysis, semgrep-rule-creator, insecure-defaults, differential-review. ZAO holds wallet keys, signs EIP-712, runs autonomous trading agents (`src/lib/agents/`), and ships smart contracts (`contracts/`). Trail of Bits' security skills are the gold standard. | HIGH fit |
| **fal-ai-community/skills** (77 stars, verified) | Image / video / audio gen, lip sync, tryon, upscale, realtime. ZAOstock event posters, BCZ social content, ZAO Music release art, WaveWarZ artist visualization. Already in ECC as `fal-ai-media` - install fal-ai-community variant only if it adds workflow templates ECC lacks. | MEDIUM (audit overlap with ECC first) |
| **hamelsmu/evals-skills** (1,183 stars, verified) | LLM evaluation skills for benchmarking. ZAO runs ZOE + QuadWork + autonomous trading agents. Evals are the missing layer in our agent fleet (per `feedback_no_arbitrary_targets` - we need real measurement, not made-up cadences). | HIGH fit |
| **mattpocock/skills** (18,217 stars, verified) | TypeScript-first TDD, git-guardrails, setup-pre-commit, request-refactor-plan, to-prd. ZAO is TS / Next.js 16. Matt Pocock's TS rigor is exactly what `.claude/rules/typescript-hygiene.md` already gestures at. | HIGH fit |
| **EveryInc/charlie-cfo-skill** (202 stars, verified) | Bootstrapped CFO. BCZ Strategies LLC bookkeeping + ZAO Music DBA tax + 0xSplits accounting. | MEDIUM fit (BCZ scope) |
| **forrestchang/andrej-karpathy-skills** (83,697 stars, verified) | Karpathy coding philosophy for AI-native development. ZAO already runs `/autoresearch` (Karpathy autoresearch). This pack expands the surface. Audit overlap with our existing autoresearch first - probably 70% redundant. | LOW (only after audit) |

Hard cap: install 3-5 from this list, audit each one against actual ZAO use over 2 weeks, prune the ones that do not measurably improve output (per Doc 312).

## Skip Outright

| Skill / Pack | Why skip |
|--------------|----------|
| K-Dense-AI/scientific-agent-skills (19,357 stars) | Genomics / drug binding / molecular dynamics. Out of scope. |
| Unity-Skills, GodotPrompter, godogen | Not building games. |
| WordPress block dev pack | Not in stack. |
| awslabs/agent-plugins (623 stars), MicrosoftDocs/Agent-Skills (509 stars) | Not in stack (ZAO is Vercel + Supabase, not AWS / Azure). |
| planetscale/claude-plugin (2 stars), neondatabase-labs/ai-rules (83 stars) | Wrong DB - we use Supabase. Neon could matter if Supabase costs ever push us off. |
| openaccountants (371 tax skills, 134 countries) | Hire a CPA, not a 371-skill pack. |
| Unity / homelab / agilefitness / genealogy / travel-hacking-toolkit | Personal scope, not ZAO. |
| alirezarezvani/claude-skills mega pack (235 skills, 12,618 stars) | TOO BROAD. Cherry-pick individual skills (rag-architect, llm-cost-optimizer, monorepo-navigator, self-improving-agent) only if a specific need surfaces. Installing all 235 = ~10x context blowup. |
| wshobson/agents mega pack (34,245 stars, 150 skills) | Already largely covered by ECC plugin. Audit individual skills before adding the pack. |
| VoltAgent/awesome-agent-skills (18,607 stars) | Mostly aggregator / awesome-list. Use as discovery, do not install. |
| pm-skills, Product-Manager-Skills, founder-skills | ZAO is solo-PM mode (Zaal). One PM skill could help; 100+ is noise. |
| seo-geo-claude-skills (1,100 stars) | ECC already has a `seo` skill. |
| anthropic-cybersecurity-skills (4,800 stars, 754 skills) | Trail of Bits 29-skill pack is a sharper tool. 754 skills is context bankruptcy. |
| Anything from a repo with under 50 stars and no recognizable author | Skill-marketplace spam. |

## Hallucinations Found in @polydao's List

Verified live via `gh api repos/<owner>/<repo>` on 2026-04-24:

| Tweet claim | Actual state | Implication |
|-------------|--------------|-------------|
| `github.com/hashicorp/skills` (Terraform pack) | 404 NOT FOUND | Repo does not exist. Tweet hallucinated. |
| `github.com/firecrawl/firecrawl-claude-plugin` "3,000+ stars" | 58 stars (real). Firecrawl's 6,134-star repo is `firecrawl-mcp-server`, which is an MCP server, not a Claude skill. | Tweet conflated two different repos and inflated stars ~50x. |
| `github.com/snyk/snyk-fix` | 404 NOT FOUND | Hallucinated. Snyk has plenty of public repos but not this one. |
| `github.com/better-auth/...` agent-skills | 404 (no `agent-skills` subrepo) | Hallucinated. |
| Star counts generally | Most counts in tweet are 5-30% under current. Acceptable drift. | Use gh api to verify before quoting numbers. |

This pattern matches the @zao-research skill's documented failure mode "Metadata Fabrication (78.5% of phantom citations) - title is correct; URL invented." Treat the tweet as a discovery feed, never a citation.

## Stack Gaps the Catalog Does Not Cover

ZAO's hottest paths have no skill in the catalog. These are the highest-leverage build-and-ship-back opportunities:

| Gap | What ZAO has | Skill we could publish |
|-----|--------------|------------------------|
| **Farcaster Protocol** | App FID 19640, signer flow, Neynar SDK, EIP-712 register, hub fanout, mini-app SDK | `farcaster-protocol` skill: signer registration patterns, Neynar best-practices, mini app conventions, hub vs Neynar tradeoffs |
| **XMTP** | Burner-key pattern, group chat, Stream.io fallback, encrypted DM (Phase 2) | `xmtp-encrypted-messaging` skill: app-specific keys, group conversations, browser SDK pitfalls |
| **Iron-session + Wagmi/Viem auth** | Progressive auth (wallet -> Farcaster -> XMTP), session middleware | `web3-progressive-auth` skill |
| **Base chain + 0xSplits** | ZABAL, SANG, ZAO Music splits | `base-chain-music-splits` skill |
| **Arweave + ArDrive permanent storage** | Music phase 2 architecture (Doc 162) | `arweave-permanent-music-storage` skill |
| **Privy embedded wallets** | FISHBOWLZ used Privy; Juke partnership likely revives it | `privy-embedded-wallet` skill (gap noted by Privy team in their docs - could co-publish) |
| **Stream.io live audio** | Spaces / DJ mode | `stream-io-live-audio` skill |
| **Farcaster Mini Apps** | BCZ static mini app, ZAO frame routes | `farcaster-mini-apps` skill |

Publishing 1-2 of these to a public skills repo is the same lift as a Doc 491 (QuadWork OSS) - high upside for ZAO recruiting + Farcaster ecosystem clout.

## Numbers Snapshot (verified 2026-04-24)

| Repo | gh api stars | Tweet claim | Drift |
|------|--------------|-------------|-------|
| anthropics/skills | 123,450 | 121,000 | +2K |
| obra/superpowers | 166,781 | 166,000 | match |
| supabase/agent-skills | 1,995 | n/a | n/a |
| cloudflare/skills | 1,268 | 923 | +345 |
| trailofbits/skills | 4,783 | 4,700 | +83 |
| MicrosoftDocs/Agent-Skills | 509 | 495 | +14 |
| wshobson/agents | 34,245 | 33,900 | +345 |
| alirezarezvani/claude-skills | 12,618 | 12,000 | +618 |
| VoltAgent/awesome-agent-skills | 18,607 | 16,400 | +2.2K |
| mattpocock/skills | 18,217 | 16,500 | +1.7K |
| K-Dense-AI/scientific-agent-skills | 19,357 | 18,900 | +457 |
| safishamsi/graphify | 34,323 | 27,462 | +6.9K |
| forrestchang/andrej-karpathy-skills | 83,697 | 43,650 | +40K (massive growth or tweet error) |
| shareAI-lab/learn-claude-code | 56,267 | 53,825 | +2.4K |
| coreyhaines31/marketingskills | 24,490 | n/a | n/a |
| phuryn/pm-skills | 10,608 | 10,300 | +308 |
| K-Dense scientific | 19,357 | 18,900 | +457 |
| hamelsmu/evals-skills | 1,183 | 995 | +188 |

Star counts moved 1-30% upward in days/weeks. Use as proxy for "ecosystem still hot" not absolute ranking.

## Re-validation 2026-10-10

Card 10305. This doc's `last-validated` had stood at 2026-05-21, twenty weeks. What was re-measured, and what was not:

**ZAO's own skill count (measured 2026-10-10, this Mac).** `~/.claude/skills/*/SKILL.md` matches 57 files. The April text says "~32 user skills + ECC plugin (200+)"; how that 32 was counted is not recorded, so 32 to 57 is not a clean trend. Five plugins are installed per `~/.claude/plugins/installed_plugins.json`: caveman, connect-apps, everything-claude-code, oh-my-mermaid, superpowers. Doc 2496 holds the measured usage: 34 of the 57 have been invoked at least once across 4,630 transcripts, 23 never.

**The "Already Installed" table has drifted.** `graphify` and `caveman` no longer have a directory under `~/.claude/skills` (caveman is now a plugin; graphify is in neither list). `autoresearch` is still there.

**The Install picks, five months on.** Searched `~/.claude/skills` by directory name only, not the plugin caches:

| Pick | Found on 2026-10-10 |
|---|---|
| supabase/agent-skills | YES - `supabase` and `supabase-postgres-best-practices` (frontmatter `author: supabase`) |
| trailofbits/skills | no matching directory |
| mattpocock/skills | no matching directory |
| hamelsmu/evals-skills | no matching directory |
| fal-ai-community/skills | no matching directory |

One of the three "strongest fits" from the first Next Action is installed. No record was found of the before-and-after trial that row asked for; the places searched were this doc and doc 2496.

**Star counts (`gh api repos/<owner>/<repo>`, 2026-10-10)** against the 2026-04-24 snapshot above:

| Repo | 2026-04-24 | 2026-10-10 |
|---|---|---|
| anthropics/skills | 123,450 | 180,335 |
| obra/superpowers | 166,781 | 297,208 |
| supabase/agent-skills | 1,995 | 2,708 |
| cloudflare/skills | 1,268 | 3,028 |
| trailofbits/skills | 4,783 | 7,465 |
| MicrosoftDocs/Agent-Skills | 509 | 776 |
| wshobson/agents | 34,245 | 40,335 |
| alirezarezvani/claude-skills | 12,618 | 27,968 |
| VoltAgent/awesome-agent-skills | 18,607 | 35,473 |
| mattpocock/skills | 18,217 | 284,320 |
| K-Dense-AI/scientific-agent-skills | 19,357 | 48,289 |
| safishamsi/graphify | 34,323 | 125,286 (repo now resolves to `Graphify-Labs/graphify`) |
| forrestchang/andrej-karpathy-skills | 83,697 | 218,186 (now resolves to `multica-ai/andrej-karpathy-skills`; last push 2026-04-20) |
| shareAI-lab/learn-claude-code | 56,267 | 78,316 |
| coreyhaines31/marketingskills | 24,490 | 54,053 |
| phuryn/pm-skills | 10,608 | 26,868 |
| hamelsmu/evals-skills | 1,183 | 1,676 |
| ComposioHQ/awesome-claude-skills | 58.4K (May) | 76,808 |
| fal-ai-community/skills | 77 | 251 |
| EveryInc/charlie-cfo-skill | 202 | 324 |

The mattpocock/skills figure is a 15x rise and is what the API returned; it was read once and not cross-checked against a second source.

**Hallucinations, re-checked.** `hashicorp/skills` and `snyk/snyk-fix` still return 404. `firecrawl/firecrawl-claude-plugin` exists at 237 stars (58 in April), so the tweet's "3,000+" is still wrong. The better-auth claim was not re-checked.

**Not re-measured.** The ecosystem total ("1,116", "1,100+", "no consolidation"): no catalog was re-counted in this pass, so those lines are carried forward from May and are UNVERIFIED as of today. The ten May 2026 sources below were not re-fetched. The Stack Gaps table was not re-checked against the current catalogs.

**Does the verdict hold?** The decision to skip the full catalog and install a handful still stands on this evidence. The stated reason has since been measured against: doc 2496 found the always-on cost of an idle skill is about 70 tokens of description, so the "no more than 3 skills" rule of thumb this doc inherits is aimed at the wrong cost. The better cut is by wrong instructions, not by count. See [doc 2496](../2496-claude-skills-mechanisms-measured/).

## Sources (May 2026 Validation)

[FULL]
- [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) - 58.4K stars (May 2026)
- [supabase/agent-skills](https://github.com/supabase/agent-skills) - 1.9K stars, RLS authority
- [trailofbits/skills](https://github.com/trailofbits/skills) - 4.8K stars, security gold standard
- [mattpocock/skills](https://github.com/mattpocock/skills) - 18.2K stars, TypeScript rigor
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) - 20.5K stars, 1,184+ curated
- [Growthexe — 1,116 Claude Skills from 500+ Repos](https://growthexe.substack.com/p/i-found-1116-claude-code-skills-from) - Apr 29 2026 ecosystem snapshot
- [Best Claude Code Skills 2026 — The Prompt Shelf](https://thepromptshelf.dev/blog/best-claude-code-skills-2026/) - Mar 31 2026
- [Developers Digest — Best Claude Code Skills 2026](https://www.developersdigest.tech/blog/best-claude-code-skills-2026) - Apr 28 2026
- [awesome-skills.com](https://awesome-skills.com/) - Curated 150+ editor picks
- [ClaudeWave — Best Skills for Claude](https://claudewave.com/en/categories/skills) - 437 ranked, May 2026

## Staleness + Verification (May 2026)

Ecosystem remains at 1,100+ skills. No consolidation. Re-validate monthly as churn continues. [FULL]

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install supabase/agent-skills + trailofbits/skills + mattpocock/skills (3 strongest fits). Run identical task before and after; measure output quality lift. | @Zaal | Local install + 1-week trial | This week |
| Audit fal-ai-community vs ECC `fal-ai-media` overlap. Install only if it adds workflow templates ECC lacks. | @Zaal | Diff + decision | Next sprint |
| Decide install / skip on hamelsmu/evals-skills based on ZOE + QuadWork eval needs surfacing | @Zaal | Decision | When ZOE v2 ships |
| Build + publish `farcaster-protocol` skill from ZAO's signer + Neynar + mini-app code. Same lift as Doc 491 (QuadWork OSS). | @Zaal / Quad | New OSS repo | Mid-May 2026 |
| Build + publish `xmtp-encrypted-messaging` skill from ZAO's burner-key pattern | @Zaal / Quad | New OSS repo | Phase 2 (after Farcaster skill ships) |
| Update Doc 154 (skills master reference) to add new picks once installed and validated | @Zaal | Doc edit | Rolling |
| DONE 2026-10-10 (card 10305) - local skill count, install picks, star counts and hallucinations re-measured; ecosystem total not re-counted | Claude | Audit | Done 2026-10-10 |
| Re-count the ecosystem total from a live catalog, or drop the "1,100+" line | Claude | Audit | 2026-11-10 |

## Also See

- Doc 154 - Skills & Commands Master Reference (current ZAO skill inventory)
- Doc 312 - Claude Skills Marketplace & Ecosystem (Apr 9 2026 - prior reference, RoboRhythms "most are garbage" thesis)
- Doc 491 - QuadWork install three-repo split (model for OSS skill publishing)
- Doc 506 - TRAE AI SOLO ByteDance skip-decision (companion vendor-risk doc)
- `CLAUDE.md` Token Budget section - context discipline
