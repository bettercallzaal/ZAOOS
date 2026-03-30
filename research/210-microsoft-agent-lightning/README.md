# 210 — Microsoft Agent Lightning: RL Training for AI Agents

> **Status:** Research complete
> **Date:** March 29, 2026
> **Goal:** Evaluate Microsoft's Agent Lightning framework for training/optimizing AI agents via reinforcement learning, and assess relevance to ZAO OS's AI agent plans

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use for ZAO agent?** | SKIP for now — Agent Lightning is a Python RL training framework requiring GPU infrastructure (VERL backend). ZAO OS is a Next.js 16 TypeScript app with no Python backend or GPU resources. The framework trains models, it doesn't run them in production |
| **When it becomes relevant** | When ZAO builds a dedicated AI agent (ElizaOS or custom) that uses its own fine-tuned LLM, Agent Lightning is the best tool to optimize that agent's prompts and weights via RL. This is a Phase 3+ concern |
| **Immediate value** | USE the **APO (Automatic Prompt Optimization)** concept — even without Agent Lightning, the evaluate-critique-rewrite loop for improving prompts is applicable to ZAO's AI moderation (`src/lib/moderation/moderate.ts`) and any future agent prompts |
| **Alternative for now** | USE direct prompt engineering + eval datasets. Agent Lightning adds value when you have 100+ tasks to optimize against and want automated improvement. ZAO's current agent surface is too small |
| **License** | MIT — safe to use, adapt, or integrate if/when needed |
| **Comparison winner** | Agent Lightning beats TRL, OpenRLHF, and verl for agent optimization specifically because of its "Training-Agent Disaggregation" — you don't need to rebuild your agent inside the training framework |

## Comparison of Options

### RL Training Frameworks for AI Agents

| Framework | Agent-Agnostic | Multi-Turn RL | GPU Required | Difficulty | Best For |
|-----------|---------------|---------------|-------------|------------|----------|
| **Agent Lightning** (Microsoft) | Yes — works with any framework | Yes — LightningRL hierarchical approach | Yes (VERL backend) | Medium | Optimizing existing agents without code rewrites |
| **TRL** (Hugging Face) | No — text-based only | No — single-turn focus | Yes | Low | Simple RLHF on text generation, no environment interaction |
| **verl** (ByteDance) | No — agents must be rebuilt inside training system | Yes | Yes (FSDP/DeepSpeed/Megatron) | High | Large-scale RL training (128+ GPUs), mature community |
| **OpenRLHF** | No — limited agent support | Limited | Yes | Medium | RLHF with reward models, async training |
| **SuperOptiX** | Partial | Yes | Optional | Medium | Prompt optimization focus, less RL depth |
| **Manual prompt engineering** | N/A | N/A | No | Low | Small-scale agent systems (ZAO's current state) |

### Agent Lightning Algorithms

| Algorithm | What It Optimizes | How It Works | When to Use |
|-----------|-------------------|-------------|-------------|
| **APO** (Automatic Prompt Optimization) | Prompt templates | Evaluate rollouts, critique with LLM, rewrite prompts. Improved accuracy from 0.569 to 0.721 in 2 rounds | When you want better prompts without model fine-tuning |
| **GRPO** (Group Relative Policy Optimization) | Model weights | Groups of completions scored relatively, updates policy | When you can fine-tune the underlying LLM |
| **PPO** (Proximal Policy Optimization) | Model weights | Classic RL policy gradient with clipping | Standard RL training, more stable than GRPO |
| **SFT** (Supervised Fine-Tuning) | Model weights | Train on curated input/output pairs (e.g., with Unsloth) | When you have gold-standard examples |

## What Agent Lightning Actually Does

### Architecture (4 Components)

1. **Agent Runner** — Executes your existing agent on tasks, collects rollouts (complete execution traces). Agents emit structured spans via `agl.emit_xxx()` helpers. 8 parallel runners in the tutorial example
2. **LightningStore** — Central hub syncing tasks, resources (prompts, model weights), and traces between runner and algorithm. v0.3.0 supports MongoDB backend. 15x throughput improvement over v0.2.2
3. **Algorithm Layer** — Processes spans, assigns credit per LLM call, generates improved resources. Supports APO, GRPO, PPO, SFT
4. **Trainer** — Orchestrates the loop: send tasks + resources to agents, collect rollouts, feed to algorithm, repeat

### Training Loop

```
Tasks + Prompt Templates → Agent Runner (8 parallel) → Rollouts + Rewards
     ↓                                                        ↓
LightningStore ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
     ↓
Algorithm (APO/GRPO/PPO) → Updated Resources → Next Iteration
```

### Key Innovation: LightningRL

Traditional RL treats multi-step agent runs as one long sequence. LightningRL breaks runs into individual LLM calls, each with its own input/context/output/reward. A credit assignment module determines each call's contribution. This makes standard single-step RL algorithms (GRPO, PPO) work on multi-step agents without modification.

### Minimal Code Changes Required

```python
import agentlightning as agl

# 1. Wrap your prompt in a PromptTemplate
prompt = agl.PromptTemplate("You are a helpful assistant. {task_description}")

# 2. Emit spans during agent execution
agl.emit(input=user_query, output=llm_response)

# 3. Set up trainer
algo = agl.APO(openai_client)
trainer = agl.Trainer(
    algorithm=algo,
    n_runners=8,
    initial_resources={"prompt_template": prompt},
    adapter=agl.TraceToMessages()
)
trainer.fit(agent=my_agent, train_dataset=tasks, val_dataset=val_tasks)
```

### Release History

| Version | Date | Key Changes |
|---------|------|-------------|
| v0.1 | August 4, 2024 | Initial release |
| v0.2.0 | October 22, 2024 | LightningStore, Emitter, LLM Proxy, Agent Runner redesign (78 PRs) |
| v0.3.0 | December 24, 2024 | Tinker RL backend, Azure OpenAI, MongoDB store, Dashboard preview, Claude Code integration, 15x store throughput |

15,623 GitHub stars, 1,300+ forks, 254 commits, 32 contributors, MIT license.

## ZAO OS Integration

### Current State

ZAO OS has no AI agent training infrastructure. Relevant existing code:

- `src/lib/moderation/moderate.ts` — AI content moderation via Perspective API (prompt-based, could benefit from APO)
- `src/lib/ai/textAnalysis.ts` — Text analysis utilities
- `src/components/library/DeepResearch.tsx` — Research component
- Research docs on agent plans: Doc 24 (ElizaOS agent), Doc 83 (ElizaOS 2026 update), Doc 26 (Hindsight memory)

### Why It's Not Relevant Yet

1. **Python-only** — Agent Lightning is a Python framework. ZAO OS is Next.js 16 + TypeScript. No Python backend exists
2. **GPU infrastructure required** — VERL backend needs GPU compute (A100/H100). ZAO runs on Vercel serverless
3. **Training, not inference** — Agent Lightning trains/optimizes agents. ZAO hasn't built the agent to train yet
4. **Scale mismatch** — APO shines with 100+ tasks and automated eval. ZAO's 100-member community doesn't generate enough agent interaction data yet

### When It Becomes Relevant (Phase 3+)

When ZAO deploys a dedicated AI agent (ElizaOS or custom) that:
- Handles onboarding, support, or curation for the community
- Uses a fine-tunable LLM (not just API calls to Claude/GPT)
- Has a measurable task set (e.g., "correctly answer community questions" with ground truth)
- Has GPU access (VPS with GPU, or cloud training job)

At that point, Agent Lightning's APO algorithm alone (no GPU needed, just LLM API) could optimize the agent's prompts automatically.

### Actionable Takeaway: Steal the APO Pattern

Even without Agent Lightning, the APO loop is valuable now:

1. **Evaluate** — Run current prompt on test cases, score results (0.0-1.0)
2. **Critique** — Use Claude/GPT to analyze failures and generate natural language feedback
3. **Rewrite** — Generate improved prompt based on critique
4. **Repeat** — 2-3 rounds typically sufficient (Agent Lightning saw 0.569 → 0.721 in 2 rounds)

This pattern applies to `src/lib/moderation/moderate.ts` prompts, any future agent system prompts, and content generation prompts.

## Sources

- [microsoft/agent-lightning GitHub](https://github.com/microsoft/agent-lightning) — MIT license, 15.6K stars
- [Agent Lightning: Adding RL to AI Agents (Microsoft Research Blog)](https://www.microsoft.com/en-us/research/blog/agent-lightning-adding-reinforcement-learning-to-ai-agents-without-code-rewrites/) — architecture and LightningRL details
- [ArXiv Paper: Agent Lightning (2508.03680)](https://arxiv.org/html/2508.03680) — published August 5, 2025
- [Agent Lightning Official Docs](https://microsoft.github.io/agent-lightning/stable/) — API reference, tutorials
- [Train the First Agent Tutorial](https://microsoft.github.io/agent-lightning/latest/how-to/train-first-agent/) — APO example with room selector agent
- [Agent Lightning vs SuperOptiX (Medium)](https://medium.com/superagentic-ai/agent-lightning-vs-superoptix-microsoft-enters-the-agent-optimization-race-c97fa3a9472f) — comparison analysis
- [Open Source RL Libraries for LLMs (Anyscale)](https://www.anyscale.com/blog/open-source-rl-libraries-for-llms) — TRL vs verl vs OpenRLHF comparison
- [Analytics Vidhya: Full Setup & Workflow](https://www.analyticsvidhya.com/blog/2025/10/microsoft-agent-lightning/) — practical tutorial
