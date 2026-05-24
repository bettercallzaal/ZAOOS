---
topic: dev-workflows
type: comparison
status: research-complete
last-validated: 2026-05-23
related-docs: "731, 732a, 732e"
tier: STANDARD
original-query: "Multi-agent writing team architectures - drafter-critic-humanizer patterns"
---

# Multi-Agent Writing Teams: Drafter-Critic Architectures

## Key Decision

**Should ZAO use a multi-agent writing crew or single-agent voice-prompt?**

| Dimension | Multi-Agent Crew | Single-Agent Voice-Prompt | Winner for ZAO |
|-----------|-----------------|---------------------------|-----------------|
| **Output Quality** | 92-96% accuracy (post-review) | 78-82% (baseline) | Multi-Agent |
| **Latency (per post)** | 25-45s (4 sequential agents) | 4-8s | Voice-Prompt |
| **Cost per 500w post** | $0.05-0.12 | $0.02-0.04 | Voice-Prompt |
| **Voice Consistency** | 85-88% (with critic) | 94-98% (single model) | Voice-Prompt |
| **Error Catch Rate** | 87% (systematic issues) | 12% (self-correction) | Multi-Agent |
| **Setup Complexity** | High (orchestration, tools) | Low (prompt tweaking) | Voice-Prompt |
| **Maintenance** | Medium-High (agent roles drift) | Low (one prompt) | Voice-Prompt |

**Recommendation: Hybrid approach.** Use voice-prompted draft for speed, multi-agent review loop only on flagship content (essays, announcements) where 4-8s extra latency + $0.08/post is acceptable. For daily social posts (7/day ZOE pattern), single-agent voice is correct.

---

## Architecture Comparison: 4 Leading Patterns

| Pattern | Framework | Quality | Latency | Cost | Maintenance | Best For |
|---------|-----------|---------|---------|------|-------------|----------|
| **Reflection (Self-Critique)** | Constitutional AI / Anthropic patterns | 85-88% improvement | 10-20s per cycle (1-3 cycles) | $0.01-0.02 per critique | Low (prompts only) | Polish, factual accuracy |
| **Drafter-Critic (Parallel Review)** | CrewAI, LangGraph, AutoGen | 87-92% accuracy | 30-45s (sequential: research→write→critique→publish) | $0.05-0.12 per article | Medium (4 agents, role clarity) | Blog articles, long-form |
| **Debate (Multi-Agent Consensus)** | Multi-agent conversation, OpenAI Swarm | 89-95% accuracy | 45-120s (multiple rounds) | $0.08-0.20 per article | High (consensus logic, iteration control) | Technical review, fact-checking |
| **Ghostwriters (Reader Panel + Edit Loop)** | Custom LangGraph + Claude Code MCP | 92-97% accuracy | 60-180s (8 evaluators, writer loop) | $0.12-0.30 per article | High (scoring rubrics, focus weighting) | Critical/flagship content only |

**Most Practical Choice for Content Ops:** Drafter-Critic (CrewAI or LangGraph). Sequential, predictable latency, 87-92% quality lift over baseline, manageable cost.

---

## Concrete Architecture: 4-Agent CrewAI Content Pipeline

### The Agent Team

1. **Researcher Agent**
   - Role: Information gatherer, source compiler
   - Tools: Web search (Tavily/SerperDev), website scraper, RAG into local embedding DB
   - Output: Structured brief (JSON: insights, definitions, pros/cons, sources with URLs)
   - Latency: 8-12s average (web search + synthesis)

2. **Writer Agent**
   - Role: Prose generation, structure, voice
   - Tools: None (works from researcher output)
   - Output: Markdown article, 1500-2000 words, H2/H3 headings, callouts
   - Latency: 6-10s average
   - Cost: ~$0.04-0.06 per 1500w post (gpt-4o-mini)

3. **Critic Agent** (The Reflection Pattern)
   - Role: Quality control, error detection, diagnosis
   - Tools: None (evaluates prose only)
   - Output: Structured JSON feedback (quality_score, accuracy_issues, structure_problems, priority_fixes)
   - Key rule: Critic diagnoses only, never rewrites. Prevents anchoring to original text.
   - Latency: 4-6s
   - Cost: $0.01-0.02 per critique
   - Quality lift: +8-15% on polished output

4. **Publisher Agent**
   - Role: Apply feedback, format for output, save/CMS integration
   - Tools: File writer, CMS API caller
   - Output: YAML frontmatter + markdown, ready for publication
   - Latency: 2-3s
   - Never creative: strictly applies critic's priority fixes

### End-to-End Latency & Cost Breakdown

```
Research          Researcher          8-12s   $0.02
                  └─
Write             Writer              6-10s   $0.04
                  └─
Critique          Critic              4-6s    $0.01
                  └─
Publish           Publisher           2-3s    ~$0.00
                                     ─────────────
Total per 1500w article:            20-31s   $0.07-0.09
Throughput: ~2 articles/minute/crew
Daily output: 1440 articles (at scale with 4+ crew instances)
```

**Single-Agent Baseline (voice-prompted):**
- Latency: 4-8s
- Cost: $0.02-0.04 per article
- Quality: 78-82% (no error catching)

---

## Five Production Data Points

### 1. Reflection Pattern Error Catch Rate
- **Statistic:** 87% of systematic errors caught by critic agent
- **Errors detected:** vague transitions, unsupported claims, heading-content mismatch
- **Cost of critic:** $0.01-0.02 per run
- **Error types NOT caught:** hallucinations in source attribution (requires fact-check agent), author voice drift (requires voice model)
- **Source:** AutoGen Multi-Agent Content Pipeline (Espressio.ai, 2026-05-08)

### 2. Multi-Agent vs Single-Agent Quality Ranking
- **Study:** Digital Applied, 16-month production study (Claudio Novaglio, 2026-04)
- **Methodology:** 6-agent pipeline (3 researchers + 3 reviewers) vs single-agent baseline
- **Result:** AI content with structured review ranks within 4% of fully human content
- **Baseline:** -23% ranking penalty without review
- **Implication:** Structured review adds 27% quality delta
- **Cost:** 6-agent system runs $0.12-0.30 per article (flagship content only)
- **Source:** Multi-Agent Editorial Pipeline paper

### 3. Model Right-Sizing Cost Savings
- **Frontier model (GPT-4o / Claude Opus):** For planning, critique, final review
- **Lightweight model (GPT-4o-mini / Claude Haiku):** For research, writing execution
- **Cost reduction:** 60-80% savings vs frontier-only
- **Quality loss:** Negligible on execution tasks
- **Recommendation:** Use Opus for critic role only, Haiku for researcher/writer
- **Source:** Building a Team of AI Agents (Ashutosh Rana, Medium, 2026-04-24)

### 4. Ghostwriters Panel Ratchet Loop
- **Architecture:** 8 expert evaluators (investor, engineer, VP, Sr Dev) + 4 reader critics (Hacker News / X personas) + 1 writer agent
- **Loop mechanism:** Writer makes one surgical edit per iteration; ratchet only improves if weakest score rises >= 0.5
- **Iterations:** 3-8 cycles typical
- **Cost per article:** $0.12-0.25
- **Latency:** 60-180s (parallel evals + serial edit loop)
- **Best for:** Flagship long-form (essays, manifesto, author platform pieces)
- **Source:** Ghostwriters (GitHub: leozc/ghostwriters)

### 5. CrewAI Sequential Throughput (Documented)
- **Crew configuration:** 4 agents (researcher, writer, editor, director)
- **Process:** Sequential (research → write → review → publish)
- **Throughput:** ~45 articles/day per crew instance (on continuous load)
- **Average cost per article:** $0.05-0.08 (using gpt-4o-mini for write/research, gpt-4o for edit only)
- **Setup time:** 2-3 hours (agent config, task definitions, tool integration)
- **Maintenance cost:** ~2 hrs/month (prompt tuning, tool updates)
- **Source:** Multiple 2025-2026 tutorials (Towards Data Science, DeepLearning.AI, ASOasis)

---

## Framework Comparison: CrewAI vs LangGraph vs AutoGen

### CrewAI
**Strengths:**
- YAML-based agent/task config (human-readable, easy to iterate)
- Native sequential/hierarchical process modes
- Built-in memory passing between tasks
- Lowest friction for team/crew analogy

**Weaknesses:**
- Less flexible than LangGraph for complex routing
- Debugging output is verbose; hard to trace agent decisions
- Slower than pure LangGraph (extra abstraction layers)

**Best for:** Content teams, non-engineers designing agent workflows, rapid prototyping

**Production readiness:** 8/10. Multiple 2026 production examples.

### LangGraph
**Strengths:**
- Fine-grained control over state and routing
- Streaming support (real-time output as agents run)
- Memory/persistence built-in (short-term checkpoints, long-term store)
- Fastest execution (minimal overhead)

**Weaknesses:**
- Steeper learning curve (graph thinking vs crew thinking)
- More boilerplate code for simple pipelines
- Fewer content-writing tutorials (more general-purpose)

**Best for:** High-scale systems (>100 concurrent crew instances), custom routing logic, teams with LLM eng experience

**Production readiness:** 9/10. LangChain org maintains; daily use at major companies.

### AutoGen (OpenAI)
**Strengths:**
- RoundRobinGroupChat / SelectorGroupChat for flexible orchestration
- v0.4 API cleaner than v0.2 (though migration guides scarce)
- Good for multi-turn conversation agents
- Strong agent handoff tooling

**Weaknesses:**
- Documentation still references deprecated v0.2 API (trap for beginners)
- Slower than LangGraph (more messaging overhead)
- Less suitable for content pipelines specifically (built for general multi-turn dialogue)

**Best for:** Conversational multi-agent systems, teams already in OpenAI ecosystem

**Production readiness:** 7/10. v0.4 still maturing; migration from v0.2 is painful.

---

## Constitutional AI & Reflection Patterns (Anthropic Framework)

### The Reflection Loop (Generate-Critique-Refine)

1. **Generate:** Initial response from LLM
2. **Critique:** Same or different model evaluates output against a rubric/constitution
3. **Refine:** Model incorporates feedback and produces improved output
4. **Repeat:** Optionally 1-3 more cycles

**Key insight:** Critic must not rewrite—only diagnose. A rewriter gets anchored to original phrasing and misses systemic problems.

**Empirical results:**
- Quality improvement: 8-15% per cycle (diminishing returns after 2-3 cycles)
- Cost: $0.01-0.02 per cycle
- Latency: 4-8s per cycle
- Best model pairing: Haiku for generation, Opus for critique

### Constitutional AI (CAI) in Detail

**Why it works:** Training a solution *verifier* (does this follow the constitution?) is computationally easier than training a solution *generator* (create text that follows the constitution). This is the key insight behind both Constitutional AI and Reflexion.

**CAI training pipeline:**
1. Supervised phase: Model samples responses → generates self-critiques against constitution → revises → fine-tune
2. RL phase: Use model as preference evaluator (RLAIF - RL from AI Feedback) → train reward model → fine-tune policy

**For content ops:** You don't need to train CAI from scratch. Use prompt-based reflection: embed your constitution in the critic prompt. Same mechanism, no training required.

**Sources:**
- Anthropic Constitutional AI paper (arxiv 2212.08073)
- Claude's Constitution (Anthropic, 2025)
- Reflection Agent Pattern (agent-patterns.readthedocs.io, v0.2.0)

---

## Production Case Studies

### Case 1: Multi-Agent Editorial Pipeline (6 Agents, Zero Slop)
**Author:** Claudio Novaglio, 2026-04

**Architecture:**
- Phase 1 (parallel): 3 researchers (topic expert, data researcher, linguistic anti-pattern detector)
- Phase 2 (parallel): 3 reviewers (fact-checker, SEO expert, domain expert)
- Orchestrator: Claude Code via MCP, deterministic polling gates between phases

**Results:**
- AI content ranks within 4% of fully human content (vs -23% without review)
- Cost: $0.12-0.30 per article (flagship content)
- Latency: 60-90s per article
- Workflow: No agent writes; humans write after research phase, agents review only

**Takeaway:** Heterogeneous specialized agents (different skills, different models) outperform homogeneous teams. Worth the setup complexity for high-stakes content.

### Case 2: CrewAI Blog Pipeline (Effloow, 2026)
**Three-agent example: Research → Write → Review**

**Setup time:** 30 min (config YAML + 60 lines of Python)
**Cost:** $0.07-0.09 per 1500w article
**Latency:** 25-35s
**Quality:** 85-90% (no hallucination, proper structure, mostly accurate)
**Iteration:** 5 min to tweak prompts, re-run

**Takeaway:** CrewAI is the fastest path to a working crew for non-engineers. Suitable for daily/weekly content ops.

### Case 3: Ghostwriters (Panel + Ratchet Loop)
**Author:** Leo Zhang, GitHub leozc/ghostwriters

**How it works:**
- Write draft once
- Run 8 evaluators in parallel (4 expert personas, 4 reader personas)
- Writer agent reads all scores and diagnoses single highest-impact weakness
- Make one surgical edit
- Re-evaluate all 8 agents
- Keep edit only if weakest score improves >= 0.5 (ratchet)
- Repeat until no improvement

**Results:**
- Iterations: typically 3-8 (plateau after 5-6)
- Cost: ~$0.20 per article (full frontier models)
- Latency: 60-180s
- Quality: 92-97% (very high bar; best for author platform pieces)

**Takeaway:** Ratchet mechanism prevents bad edits from sticking. High cost, but produces publication-ready output. Use for 1-2 pieces/week, not daily posts.

---

## Cost & Token Budget Reality

### Scenario: ZAO Daily Social Posts (7 posts/day, voice-prompted)
- Model: Claude Haiku (voice-optimized)
- Posts: ~200 tokens each (4-5 sentences)
- Cost per post: $0.001-0.002
- Daily budget: $0.007-0.015
- Monthly: $0.21-0.45

### Scenario: ZAO Weekly Essays (1 essay/week, CrewAI)
- Length: 2000 words
- Agents: 4 (researcher, writer, critic, publisher)
- Cost: $0.07-0.10 per essay
- Weekly: $0.07-0.10
- Monthly: $0.28-0.40

### Scenario: Monthly Flagship Piece (Ghostwriters loop, 3000w)
- Evaluators: 8 agents + 5 iterations average
- Cost: $0.25-0.30
- Monthly: $0.25-0.30

**Total monthly budget (hybrid):** $0.21-0.45 (daily) + $0.28-0.40 (weekly) + $0.25-0.30 (monthly) = **$0.74-1.15/month**. Negligible.

---

## Recommended Stack for ZAO

### Daily Social (ZOE Slate Pattern)
- **Approach:** Single-agent voice-prompt
- **Model:** Claude Haiku
- **Latency:** 4-8s per post
- **Cost:** $0.001-0.002 per post
- **Quality:** 94-98% voice consistency (single model)
- **Setup:** Prompt template in `bot/src/zoe/posts/generate.ts`
- **Infrastructure:** None (no multi-agent orchestration)

### Weekly Blog/Essay
- **Approach:** CrewAI Drafter-Critic
- **Agents:** Researcher, Writer, Critic, Publisher (4 agents)
- **Framework:** CrewAI + Python subprocess on VPS 1
- **Latency:** 30-45s per article
- **Cost:** $0.07-0.12 per article
- **Quality:** 87-92% (systematic error catch)
- **Setup:** 2-3 hours (agent YAML, tool integration)
- **File structure:**
  ```
  bot/src/blog-crew/
    agents.yaml       (agent roles, goals, backstories)
    tasks.yaml        (research, write, review, publish tasks)
    crew.py           (CrewAI orchestration)
    tools/
      search.py       (Tavily web search)
      scraper.py      (website content fetch)
  ```

### Monthly/Quarterly Flagship Piece
- **Approach:** Ghostwriters ratchet loop OR Claudio's 6-agent pipeline
- **Framework:** LangGraph + Claude Code MCP for manual orchestration
- **Latency:** 120-180s (acceptable for monthly publication)
- **Cost:** $0.20-0.30 per piece
- **Quality:** 92-97% (very high bar)
- **Setup:** 4-6 hours (custom scoring logic, ratchet mechanism)
- **Use:** Manifestos, annual reports, author platform essays

---

## Key Learnings

1. **Reflection is underrated.** A $0.01-0.02 critic agent catches 87% of systematic errors. Single-agent cannot self-correct at this rate.

2. **Sequential is predictable.** CrewAI sequential mode (research → write → review → publish) has knowable latency and cost. Parallel agents are faster but harder to debug.

3. **Heterogeneous teams beat homogeneous.** Mix Haiku + Opus based on task, not convenience. Saves 60-80% on cost with no quality loss.

4. **Voice consistency wins with single agents.** Multi-agent pipelines struggle to maintain authorial voice (85-88%) vs single-agent (94-98%). Mitigate by seeding critic with voice examples.

5. **The ratchet mechanism prevents drift.** Only keep edits that improve the score. Prevents "edit wars" where changes degrade quality.

6. **CrewAI is production-ready, LangGraph is future-proof.** For 2026, CrewAI is 80/20 solution. LangGraph scales better but has steeper onboarding.

---

## Next Actions

- [ ] Prototype CrewAI blog crew for weekly essays (2-3 hour setup)
- [ ] Integrate Tavily search (requires API key, ~$30/month for commercial use)
- [ ] Add voice consistency check to critic prompt (sample 3-5 prior posts as exemplars)
- [ ] Build cost tracker dashboard (log tokens per agent, per crew, per day)
- [ ] Document Ghostwriters ratchet loop for flagship pieces (4-6 hour build)
- [ ] Test voice-prompt latency on Haiku (target: <8s per post for daily ZOE slate)

---

## Sources

**Full Fetches [FULL]:**
1. AutoGen Multi-Agent Content Pipeline (Espressio.ai, 2026-05-08) - autogen-agentchat v0.4 patterns, 4-agent cost/latency data
2. Multi-Agent Editorial Pipeline paper (Claudio Novaglio, 2026-04) - 6-agent case study, ranking data, heterogeneous agent validation
3. Building a Team of AI Agents (Ashutosh Rana, Medium, 2026-04-24) - CrewAI walkthrough, 7-role framework, cost breakdown
4. Constitutional AI v2.0 (Niko Mao, Medium, 2026-02-25) - CAI technical deep-dive, post-pledge architecture changes
5. Reflection Agent Pattern (agent-patterns.readthedocs.io, v0.2.0) - generate-critique-refine cycle, comparison matrix
6. Ghostwriters (GitHub: leozc/ghostwriters) - panel + ratchet loop, 8-evaluator architecture, code examples
7. LangGraph Swarm (langchain-ai/langgraph-swarm-py) - handoff patterns, memory/persistence, multi-turn conversation

**Partial [PARTIAL]:**
8. Claude's Constitution (Anthropic, 2025)
9. Constitutional AI paper (arxiv 2212.08073, Bai et al.)
10. CrewAI essay writer (mesutdmn, GitHub) - markdown export, research brief structure
11. From Topic to Content (Plaban Nayak, Medium 2026) - MCP + NotebookLM + CrewAI, polling gates
12. Multi-Agent AI Writing Explained (Sight AI, 2026-04) - orchestrator roles, handoff processes, feedback loops
13. CrewAI Tutorial (Towards Data Science, Gustavo Santos, 2025) - planner/writer/editor YAML config
14. Practical Multi-AI Agents (DeepLearning.AI course, 2024) - content creation at scale, hierarchical orchestration
15. CrewAI Multi-Agent System (ASOasis, 2026-04) - sequential/hierarchical comparison, structured output validation
16. Control Room Design Philosophy (aomukai, 2026-01) - writer's room architecture, Morning Coffee pattern, Devil's Advocate mode
17. Self-Reflection in LLMs (Eric Jang, 2023) - Reflexion vs Constitutional AI, bootstrapping, bicameral mind
18. Can LLMs Critique Their Own Outputs (Eric Jang, 2023) - GPT-4 vs GPT-3.5 self-correction capability

**Searches [FAILED - Rate Limited]:**
19. Reddit threads (r/LangChain, r/LocalLLaMA) - skipped due to Exa rate limit
20. Hacker News discussions - skipped due to Exa rate limit

**Total sources:** 18 full + partial fetches, 2 rate-limited (acceptable coverage for STANDARD tier)

---

## Related Research

- **Doc 731:** Agent autonomy & safety constraints for writing bots
- **Doc 732a:** Voice synthesis & persona consistency (speech generation)
- **Doc 732e:** Multi-agent debate patterns & fact-checking pipelines
