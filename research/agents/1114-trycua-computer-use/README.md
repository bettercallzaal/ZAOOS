---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-07-15
superseded-by:
related-docs: "759, 928, 994"
original-query: "Research github.com/trycua and evaluate whether Cua computer-use infrastructure could give ZOE/ZOL real sandboxed computer-use capability for autonomous agents to control desktops/browsers on real-world tasks like cold-calling, real-estate, postcards. Compare to existing Pi computer-use, Claude-in-Chrome MCP, and Playwright. Is it worth adopting for ZAO, and for what specific use case?"
tier: STANDARD
---

# 1114 - Cua Computer-Use Agent Infrastructure: Evaluation for ZAO Autonomous Agents

> **Goal:** Assess whether Cua (trycua.ai) is worth adopting to expand ZOE/ZOL's computer-control surface beyond browsers, and for which specific ZAO use cases.

## What is Cua?

Cua (github.com/trycua) is open-source infrastructure for building, training, and deploying AI agents that autonomously control full operating systems (macOS, Windows, Linux, Android) across both local and cloud environments. Founded in 2025 by ex-Xbox/Microsoft engineers, Y Combinator X25 batch, currently 19,700+ GitHub stars with 1,300+ new stars/week (July 2026).

**Core positioning:** Works with any LLM (Claude, Gemini, open-source models), operates agents on real desktops or sandboxed VMs without stealing user focus, and provides benchmarks (OSWorld, ScreenSpot) for measuring agent accuracy.

## Key Findings

### Architecture: Four Layers

1. **Cua Driver** (MCP server + CLI)
   - Native desktop app automation running in background (macOS, Windows UIA/Win32, Linux X11/Wayland)
   - Windows support (May 2026): Full Win32, WPF, WinUI, Electron, Chromium, legacy controls
   - No user focus stealing (critical for production agent workloads)
   - Tools: screenshot, mouse click, keyboard, shell commands, multi-touch gestures
   - Already implements MCP interface for Claude Code / Cursor integration

2. **Cua Sandbox** (VMs + containers)
   - Unified Python SDK across Linux, macOS, Windows, Android
   - Cloud deployment + local QEMU + container support
   - Reproducible state snapshots for benchmarking and deterministic replay

3. **Cua-Bench** (evaluation framework)
   - OSWorld (369 real-world tasks), ScreenSpot, Windows Arena benchmarks
   - Trajectory export for model training
   - Enables measurement of agent accuracy

4. **Lume** (macOS/Linux virtualization)
   - Apple Silicon native (M-series Macs) via Virtualization.Framework
   - Near-native performance, ~50GB VM images

### Maturity Indicators

| Metric | Data | Implication |
|--------|------|-------------|
| GitHub Stars | 19,700+ (1,300/week growth) | Strong adoption momentum |
| License | MIT, fully open-source | Self-hostable, no vendor lock-in |
| Founding | 2025 (Y Combinator X25, $500K seed) | Early-stage, rapid iteration |
| Release cycle | Weekly updates (lume-v0.3.16 July 2026) | Actively maintained; breaking changes possible |
| Accuracy ceiling | 45% on OSWorld-Verified, 60.8% on ScreenSpot-Pro | Research-grade, not production-grade for mission-critical tasks |
| Community users | 50,000+ engineers; Datadog, Meta, NVIDIA logos | Credible adoption; not just hype |
| Security | SOC 2 Type I claimed | Enterprise-ready compliance framing |

### Model Support & Cost

**License:** MIT open-source (free self-hosted) + optional managed cloud tier (usage-based pricing)

**Supported LLMs:** Model-agnostic (Claude, Gemini, open-source LLaMA, Mixtral, etc.)

**Cloud tier:** cua.ai managed cloud fleets with warm VM pools; pricing not published (contact sales)

**Enterprise:** On-premise deployment available

## Comparison: Cua vs. Existing ZAO Stack

| Capability | Claude-in-Chrome | Playwright MCP | Cua Driver | Cua Sandbox | Pi Computer-Use |
|------------|------------------|----------------|-----------|-------------|-----------------|
| Browser automation | Yes | Yes | Yes | Yes | Limited |
| Native app control (Excel/CRM/legacy) | No | No | Yes (Win/Mac) | Yes (any OS) | No |
| Headless execution | No | Yes | No | Yes | No |
| Background mode (no focus steal) | No | No | Yes | Yes | No |
| Cross-platform (W/M/L) | Browser only | Browser only | Yes | Yes | Mac only |
| Training + eval framework | No | No | No | Yes (cua-bench) | No |
| Self-hostable | Yes (extension) | Yes | Yes (MCP) | Yes (QEMU) | Yes (Pi hardware) |
| Maturity | Shipped | Shipped | Beta | Beta | Experimental |

**Key differentiator:** Cua enables desktop app automation (CRM, spreadsheets, design tools) that browser-only solutions cannot reach. MCP integration means wiring into ZOE is straightforward (low adoption cost).

## ZAO-Specific Use Cases

### HIGH fit for Cua adoption:

**1. ZABAL Games logistics automation**
- Mentor task tracking, lesson scheduling in tools without APIs (Google Sheets + legacy CRM)
- Shipped criteria: Agent fills 10+ consecutive spreadsheet rows without manual intervention
- Owner: Zaal | Date: 2026-09-30

**2. ZAO Stock cold-outreach at scale**
- Agents filling vendor/partner inquiry forms, CRM updates, email outreach on desktop (higher fidelity than browser-only)
- Shipped criteria: Cold-outreach agent completes 50 vendor inquiries with <5% manual fallback (Cua Sandbox running 24h without human intervention)
- Owner: Zaal | Date: 2026-10-31

### MEDIUM fit:

**ZOE autonomous PR + code automation**
- Cua Driver could screenshot code diffs in IDEs, navigate GitHub Web UI edge cases, file-system automation
- Shipped criteria: ZOE task auto-screenshots failing test output from IDE, files issue with screenshot + stack trace, creates PR draft
- Owner: Zaal | Date: 2026-11-15

### LOW fit:

**On-chain operations** - Cua doesn't execute smart contracts; it's purely desktop/browser control. Signing handled by ZOL signer already.

## Technical Adoption Path

**Layer 1 (proof-of-concept, 1 week):**
- Wire Cua Driver as MCP server into ZOE's toolkit (MCP interface already exists)
- Test with single browser task (e.g. fill a GitHub form without Claude-in-Chrome)
- Measure latency + accuracy vs. existing Playwright MCP

**Layer 2 (pilot, 2-4 weeks):**
- Pilot on ZABAL Games bounded-scope task (update spreadsheet, confirm no hallucinations)
- Measure success rate on cua-bench tasks (OSWorld subset, replicate locally)

**Layer 3 (scale, 4-8 weeks):**
- Spin up warm Cua Sandbox pool on VPS for cold-outreach agents
- Monitor accuracy ceiling (expect 30-50% independent success, higher with human fallback loops)
- Budget ops cost (50GB VM images, managed cloud pricing if chosen)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Accuracy ceiling (30-50% on OSWorld) | HIGH | Start with low-stakes tasks (ZABAL Games); design agent fallback loops; measure before scaling to mission-critical (cold-calling) |
| Rapid development = breaking changes | MEDIUM | Pin Cua versions, maintain test suite against releases, monitor GitHub for deprecations |
| Resource intensity (50GB VMs) | MEDIUM | Use local QEMU for dev/test, managed cloud only for prod if cost justifies |
| Desktop automation injection attacks | MEDIUM | Sandbox by design (Cua's strength), but audit input validation + agent prompts for shell-injection risk |
| Model-dependent accuracy | HIGH | Agent reasoning matters more than infrastructure; requires memory + planning (already in ZOE); Cua only solves the "control" layer |

## Decision: Should ZAO Adopt Cua?

### Recommendation: YES - Phased Adoption (Proof-of-Concept First)

**Why:**
- **MCP-ready:** Zero friction wiring into ZOE; extends existing toolkit (Playwright MCP + Claude-in-Chrome) without replacement
- **Fills a gap:** Desktop/native-app automation is not covered by current stack; enables new classes of ZAO agents (cold-outreach, logistics, real-estate)
- **Benchmarked:** OSWorld + ScreenSpot evals let us measure agent quality before scaling (reduces risk of deploying inaccurate agents)
- **Well-funded:** Y Combinator backing + growing community signal low abandonment risk

**Starting point:** PoC (Layer 1 adoption) on ZABAL Games logistics (bounded scope, measurable success, low business impact if it fails). Revisit for cold-outreach only if PoC accuracy is >70%.

### What NOT to do:
- Do NOT replace Playwright MCP / Claude-in-Chrome (they're proven, Cua is complementary)
- Do NOT deploy to cold-calling without human fallback loops (30-50% accuracy is not sufficient for mission-critical outreach)
- Do NOT adopt cloud tier immediately (self-hosted QEMU + sandbox is free; cloud pricing not transparent)

## Also See

- [Doc 759 - ZOE orchestrator architecture](../759-zoe-orchestrator/)
- [Doc 928 - Agent loop best practices](../928-agent-loop-best-practices/)
- [Doc 994 - ZOL Farcaster agent](../994-zol-farcaster-agent/)
- [Memory: project_pi_computer_use](../../..MEMORY.md) - existing Pi computer-use setup
- [Memory: project_zoe_orchestrator_locked](../../..MEMORY.md) - ZOE's current architecture

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|--------|-------|------|---------|------------------|
| Proof-of-concept: Wire Cua Driver as MCP server into ZOE's toolkit | @Zaal | PR | 2026-08-15 | Cua Driver MCP server registered in ZOE tools; one test task (browser automation) completes via Cua instead of Playwright MCP; latency benchmarked |
| Pilot Cua on ZABAL Games spreadsheet task (update mentor lesson schedule) | @Zaal | Task | 2026-09-30 | Agent updates 10+ consecutive rows in shared spreadsheet without manual intervention; zero hallucinations on field names |
| Evaluate Cua Sandbox OSWorld accuracy on local benchmark | @Zaal | Task | 2026-10-15 | Run ScreenSpot-Pro subset locally, measure agent success rate; if <50%, document fallback loop design before cold-outreach pilot |
| If PoC succeeds: Design cold-outreach fallback loop (agent fails -> escalate to human) | @Zaal | Decision | 2026-10-31 | Design doc with abort criteria, error handling, escalation flow; tie to ZOE memory/routing |

## Sources

- [Cua GitHub Organization](https://github.com/trycua/) [FULL]
- [Cua Main Repository](https://github.com/trycua/cua) [FULL]
- [Cua Official Website](https://cua.ai/) [FULL]
- [Cua Documentation](https://cua.ai/docs) [FULL]
- [Cua Driver README](https://github.com/trycua/cua/blob/main/libs/cua-driver/README.md) [FULL]
- [Cua Y Combinator Profile](https://www.ycombinator.com/companies/cua) [FULL]
- [Launch HN: Cua (YC X25)](https://news.ycombinator.com/item?id=43773563) [FULL]
- [Computer Use Agents: Benchmark & Architecture](https://aimultiple.com/computer-use-agents) [FULL]
- [Computer Use and GUI Agents in 2026: State of the Art](https://zylos.ai/research/2026-02-08-computer-use-gui-agents/) [FULL]
- [Claude Computer Use vs OpenAI CUA Comparison](https://workos.com/blog/anthropics-computer-use-versus-openais-computer-using-agent-cua) [FULL]
