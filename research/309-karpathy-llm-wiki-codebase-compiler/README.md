# 309 - Karpathy's LLM Wiki: Codebase-to-Wiki Compiler for Token Optimization

**Source:** Reddit r/ClaudeCode (via ZOE inbox, Apr 8 2026)
**URL:** https://www.reddit.com/r/ClaudeCode/s/01YHygwn2u
**Category:** AI Tools / Developer Experience
**Date:** 2026-04-08

## Summary

Andrej Karpathy posted about his `raw/` folder workflow for LLM context management and issued a challenge: "I think there is room here for an incredible new product instead of a hacky collection of scripts." Within 48 hours, multiple implementations emerged as Claude Code skills/plugins.

## The Problem

A moderately complex codebase (30-40 files) costs 15,000-20,000 tokens just to re-establish project context at session start. Across 20 sessions/week, a huge portion of your token budget goes to redundant file reads - doing nothing useful.

## The Pattern: LLM Wiki

Instead of dropping raw files into context every session:

1. **Read codebase once** - parse files, extract structure, relationships, conventions
2. **Build a persistent knowledge graph/wiki** - structured markdown files organized by topic
3. **Query the wiki** - future sessions read only the relevant wiki pages, not raw source

## Token Savings Reported

| Implementation | Token Reduction | Approach |
|---|---|---|
| Graphify (safishamsi) | ~71x fewer tokens | Knowledge graph + clustered communities |
| wiki-skills (kfchou) | ~84% fewer tokens | LLM-maintained personal wiki skills |
| llm-wiki-compiler (ussumant) | ~89% fewer tokens | Topic-based wiki compiler |
| karpathy-wiki (toolboxmd) | Not specified | Persistent compounding knowledge bases |
| llm-wiki (ekadetov) | Not specified | Obsidian-integrated wiki |

## Key Implementations

- **[wiki-skills](https://github.com/kfchou/wiki-skills)** - Claude Code skills for LLM-maintained personal wiki
- **[llm-wiki-compiler](https://github.com/ussumant/llm-wiki-compiler)** - Compiles markdown into topic-based wiki
- **[karpathy-wiki](https://github.com/toolboxmd/karpathy-wiki)** - Persistent, compounding knowledge bases
- **[llm-wiki](https://github.com/ekadetov/llm-wiki)** - Obsidian integration variant
- **[Graphify](https://github.com/safishamsi/graphify)** - Knowledge graph approach (already installed in ZAO OS as `/graphify`)

## Relevance to ZAO OS

We already have Graphify installed as a skill (`/graphify`). This validates our approach. The research library (240+ docs) + CLAUDE.md + community.config.ts serve a similar purpose - pre-compiled knowledge so Claude doesn't need to re-read everything.

**Potential improvements:**
- Run `/graphify` periodically on the codebase to keep the knowledge graph fresh
- Evaluate wiki-skills or karpathy-wiki as complementary approaches
- The CLAUDE.md "Context Budget" section already implements manual version of this pattern
- Could automate: cron job that rebuilds wiki after each merge to main

## Key Insight

The broader trend: **knowledge over code**. Instead of feeding LLMs raw source, compile knowledge artifacts that persist across sessions. This is the "second brain" pattern applied to codebases.

## References

- [Karpathy's original post](https://www.facebook.com/businessinsider/posts/andrej-karpathy-posted-his-notes-from-claude-coding-describing-a-shift-in-engine/1264086478922967/)
- [RoboRhythms guide: 71x fewer tokens](https://www.roborhythms.com/how-to-build-llm-knowledge-base-claude-code-2026/)
- [MindStudio explainer](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code)
- [Pathmode: Knowledge Over Code](https://pathmode.io/blog/knowledge-over-code)
