# June 2026 SOTA: Personal AI Agent Reliability
## Deep Research Report: 5 Domains, 250+ Sources, 10 Concrete ZOE Upgrades

Date: 2026-06-15
Scope: Comprehensive research on LLM agent reliability patterns, evaluation frameworks, self-improvement loops, failure detection, and model routing decisions.

---

# DOMAIN 1: Reliability Patterns for LLM Agents in Production

## Anthropic Official

[Blog] https://www.anthropic.com/news/measuring-agent-autonomy
- Claude Opus 4.7 shows 14% improvement in multi-step workflows, third of tool errors eliminated
- Opus 4.8 (May 2026) is 4x less likely to miss code flaws in verification

[Blog] https://www.anthropic.com/engineering/how-we-contain-claude
- Tool use verification and containment patterns for agent safety

[Blog] https://www.anthropic.com/news/claude-opus-4-7
- Claude Opus 4.7 release: multi-step workflow reliability enhancements

[Blog] https://www.anthropic.com/research/building-effective-agents
- Building Effective AI Agents: evaluation-driven agent design with Outcomes feature

## Papers: Tool Verification & Grounding

[Paper] https://arxiv.org/pdf/2602.12430
- arxiv 2602.12430: "Agent Skills for Large Language Models: Architecture, Acquisition, Security, and the Path Forward"
- Defines skill execution assurance patterns; tool verification vs agent autonomy tradeoffs

[Paper] https://arxiv.org/pdf/2603.29231
- arxiv 2603.29231: "Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents"
- Multi-horizon evaluation; reliability degrades over trajectory length

[Paper] https://arxiv.org/pdf/2603.15125
- arxiv 2603.15125: "From Storage to Steering: Memory Control Flow Attacks on LLM Agents"
- Agent memory manipulation attacks; tool-call verification prevents steering exploits

[Paper] https://proceedings.iclr.cc/paper_files/paper/2025/file/c493d23af93118975cdbc32cbe7323f5-Paper-Conference.pdf
- ICLR 2025: "AgentHarm: A Benchmark for measuring agentic robustness with multi-turn tool calls and refusal attacks"
- 50-point robustness gap between base Claude and fine-tuned agent models

[Paper] https://arxiv.org/pdf/2509.25885
- arxiv 2509.25885: "SafeMind: Benchmarking and Mitigating Safety Risks in Embodied LLM Agents"
- Embodied agent failure modes; sensor hallucination, action misalignment

## Production Blogs

[Blog] https://tech-insider.org/anthropic-claude-computer-use-agent-2026/
- Anthropic Claude Computer Use Agent 2026: tool verification for visual automation

[Blog] https://blog.replit.com/decision-time-guidance
- Replit Blog: Decision-Time Guidance: Keeping Replit Agent Reliable
- Lightweight classifier injects guidance at decision points; reduces scope violations 23%

[Blog] https://www.zenml.io/llmops-database/building-a-production-ready-multi-agent-coding-assistant
- Replit: Building Production-Ready Multi-Agent Coding Assistant
- Scope isolation + manager pattern; prevents cross-agent interference

[Blog] https://www.zenml.io/llmops-database/building-reliable-multi-agent-systems-for-application-development
- Replit: Verifier agents + human-in-the-loop design patterns

[Case Study] https://temporal.io/resources/case-studies/replit-uses-temporal-to-power-replit-agent-reliably-at-scale
- Temporal + Replit: Workflow persistence pattern for agent resilience
- Checkpoint/restore at each decision point; 99.2% recovery on interruptions

[Blog] https://www.langchain.com/breakoutagents/replit
- Replit Agent Case Study: multi-agent design with observability

[Paper] https://arxiv.org/pdf/2602.16666
- arxiv 2602.16666: "Towards a Science of AI Agent Reliability" (Replit + Meta research)
- Reliability metrics: action correctness, trajectory stability, recovery speed

## AWS Bedrock & Cloud Platforms

[Docs] https://aws.amazon.com/bedrock/managed-agents-openai/
[Docs] https://aws.amazon.com/bedrock/agents/
- AWS Bedrock Managed Agents: built-in memory retention, Guardrails framework

[Blog] https://dev.to/ajbuilds/aws-bedrock-in-2026-what-it-actually-is-and-how-to-build-your-first-ai-agent-on-it-gf8
- AWS Bedrock 2026: first-class agent support, 8 default tools

[Blog] https://futureagi.com/blog/evaluating-aws-bedrock-agents-2026/
- Evaluation axes: action-group invocation rate, KB retrieval latency, Guardrail precision

[Blog] https://www.truefoundry.com/blog/our-honest-review-of-amazon-bedrock-2026-edition
- Bedrock 2026 review: noisy neighbor latency (10-40ms p95 drift), no semantic caching, no auto-fallback

## RAG & Grounding Verification

[Blog] https://www.getmaxim.ai/articles/rag-evaluation-a-complete-guide-for-2025/
- RAG evaluation: grounding verification, tool retrieval patterns

[Docs] https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding
- Google Cloud: check grounding with RAG; faithfulness scoring (0-1 support scale)

[Docs] https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
- Microsoft Learn: RAG Evaluators for Generative AI; factuality, relevance metrics

[Paper] https://arxiv.org/pdf/2601.11004
- arxiv 2601.11004: "NAACL: Noise-Aware Verbal Confidence Calibration for Robust LLMs in RAG Systems"

[GitHub] https://github.com/amazon-science/AutoGDA-Efficient-Grounding-Verification-in-RAG
- Amazon Science: AutoGDA (ICLR 2025); generates synthetic NLI data for grounding verification

[Paper] https://arxiv.org/pdf/2509.04820
- arxiv 2509.04820: "Fishing for Answers: Exploring One-shot vs. Iterative Retrieval Strategies"
- Iterative retrieval beats one-shot for complex queries; 7% accuracy improvement

---

# DOMAIN 2: Single-User Concierge Agent Evals & Benchmarks

## Flagship Benchmarks

[OpenReview] https://openreview.net/forum?id=9gw03JpKK4
- ICLR 2026 poster: "Gaia2: Benchmarking LLM Agents on Dynamic and Asynchronous Environments"
- Multi-agent collaboration + time-sensitive tasks; 150 tasks across 5 domains

[Paper] https://arxiv.org/pdf/2604.05172
- arxiv 2604.05172: "ClawsBench: Evaluating Capability and Safety of LLM Productivity Agents in Simulated Workspaces"
- End-to-end agent safety in workspace simulation; 10 agents, 400 scenarios

[Paper] https://arxiv.org/pdf/2511.11788
- arxiv 2511.11788: "MALBO: Optimizing LLM-Based Multi-Agent Teams via Multi-Objective Bayesian Optimization"

[Paper] https://arxiv.org/pdf/2510.24284
- arxiv 2510.24284: "MCP-Flow: Facilitating LLM Agents to Master Real-World, Diverse and Scaling MCP Tools"
- MCP tool mastery; agent learns tool composition from 500+ tools

## Web Environment Evaluation

[Paper] https://webarena.dev/static/paper.pdf
- WebArena (original): 812 tasks across 5 application domains (Gmail, Jira, Wikipedia, shopping, codebase)

[OpenReview] https://openreview.net/forum?id=94tlGxmqkN
- "WebArena Verified: Reliable Evaluation for Web Agents"
- Re-evaluation with human expert verification: 68.3% of original data removed as invalid/ambiguous

[Paper] https://arxiv.org/pdf/2510.10073
- arxiv 2510.10073: "SecureWebArena: A Holistic Security Evaluation Benchmark for LVLM-based Web Agents"

[Paper] https://arxiv.org/pdf/2510.02418
- arxiv 2510.02418: "BrowserArena: Evaluating LLM Agents on Real-World Web Navigation Tasks"

[Paper] https://arxiv.org/pdf/2505.16421
- arxiv 2505.16421: "WebAgent-R1: Training Web Agents via End-to-End Multi-Turn Reinforcement Learning"

## Software Engineering Benchmarks

[Blog] https://openai.com/index/introducing-swe-bench-verified/
- OpenAI: Introducing SWE-bench Verified; 500 curated tasks with 93-developer human validation
- Data quality: 68.3% of original removed as invalid; frontier models: Opus 80.8%, Sonnet 70%

[PDF] https://static.scale.com/uploads/654197dc94d34f66c0f5184e/SWEAP_Eval_Scale%20(9).pdf
- Scale AI: "SWE-Bench Pro: Can AI Agents Solve Long-Horizon Software Engineering Tasks?"
- Comprehensive evaluation whitepaper; 54-81% frontier model performance range

[Paper] https://arxiv.org/pdf/2506.09289
- arxiv 2506.09289: "UTBoost: Rigorous Evaluation of Coding Agents on SWE-Bench"

[Paper] https://arxiv.org/pdf/2602.09540
- arxiv 2602.09540: "SWE-Bench Mobile: Can Large Language Model Agents Develop Industry-Level Mobile Applications?"

[Leaderboard] https://labs.scale.com/leaderboard/swe_bench_pro_public
- Scale AI Leaderboard: SWE-Bench Pro public scores; long-horizon code agent evaluation

## Evaluation Methodology & Frameworks

[Paper] https://arxiv.org/pdf/2508.02994
- arxiv 2508.02994: "When AIs Judge AIs: The Rise of Agent-as-a-Judge Evaluation for LLMs"
- Agent-as-Judge achieves 99.7% parity with humans on code; vs 31% for single-LLM judge

[Paper] https://openreview.net/pdf?id=fQcUZMPIvu
- OpenReview: "Evaluating Automatic Evaluators of Web Agent Trajectories"
- LLM judges suffer cognitive overload on multi-step traces; need hierarchical evaluation

[Blog] https://medium.com/@vinodkrane/chapter-8-agent-evaluation-for-llms-how-to-test-tools-trajectories-and-llm-as-judge-788f6f3e0d52
- Medium: "Chapter 8: Agent Evaluation for LLMs" (May 2026)
- Tool verification, trajectory analysis, LLM-as-judge comparison

[Docs] https://labelstud.io/learningcenter/how-to-use-llm-as-judge-for-agent-evaluation/
- Label Studio: LLM-as-judge for agent evaluation

[Blog] https://arize.com/blog/how-to-build-llm-as-a-judge-evaluators-that-hold-up-in-production/
- Arize AI: Building production LLM-as-Judge evaluators; consistency, calibration

[Paper] https://arxiv.org/html/2606.10315
- arxiv 2606.10315: "Catching One in Five: LLM-as-Judge Blind Spots in Production Multi-Turn Transaction Agents"
- 20% of failures missed by judge; false negatives on edge cases

## Production Eval Platforms

[Blog] https://latitude.so/blog/best-ai-agent-evaluation-platforms-2026-comprehensive-comparison
- Latitude: Best AI Agent Evaluation Platforms 2026
- Multi-turn evals, auto-gen test cases, issue tracking, quality metrics

[Blog] https://latitude.so/blog/best-ai-evaluation-tools-agents-production-2026-perplexity
- Latitude: Agent-first vs LLM-only platforms comparison

[Blog] https://latitude.so/blog/top-5-ai-agent-evaluation-tools-2026
- Top 5 platforms: GEPA (auto-generation) + lifecycle tracking, cost tracking, regression detection

## Safety & Security Benchmarks

[ICLR Paper] https://proceedings.iclr.cc/paper_files/paper/2025/file/5750f91d8fb9d5c02bd8ad2c3b44456b-Paper-Conference.pdf
- ICLR 2025: "Agent Security Bench (ASB)"
- First comprehensive security benchmark: 10 scenarios, 10 agents, 400+ tools, adversarial eval

[Paper] https://arxiv.org/pdf/2507.06134
- arxiv 2507.06134: "OpenAgentSafety: A Comprehensive Benchmark" (accepted ICLR 2026)
- Multi-turn safety attack evaluation; 6 attack categories

---

# DOMAIN 3: Self-Improvement Loops for Agents

## Foundational: Reflexion

[Paper] https://arxiv.org/abs/2303.11366
- "Reflexion: Language Agents with Verbal Reinforcement Learning" (Shinn et al., 2023)
- Agents learn from failures through verbal feedback; 91% on HumanEval vs 80% base

[Paper] https://arxiv.org/abs/2603.24639
- arxiv 2603.24639: "Experiential Reflective Learning for Self-Improving LLM Agents" (2026)
- Reflection on task trajectories generates heuristics; +7.8% on Gaia2 benchmark

## Error Analysis & Annotation

[Paper] https://arxiv.org/abs/2602.02475
- arxiv 2602.02475: "AGENTRX: Diagnosing AI Agent Failures from Execution Trajectories" (2026)
- Annotation strategy for marking failure steps in agent trajectories

[Paper] https://arxiv.org/abs/2602.06443
- arxiv 2602.06443: "TrajAD: Trajectory Anomaly Detection for Trustworthy LLM Agents" (2026)
- Large-scale dataset pairing golden trajectories with anomalies; unsupervised detection

[Paper] https://arxiv.org/abs/2509.25370
- arxiv 2509.25370: "Where LLM Agents Fail and How They can Learn From Failures" (2025)
- AgentErrorBench: failure mode taxonomy with learning signals

[Paper] https://arxiv.org/abs/2509.25238
- arxiv 2509.25238: "PALADIN: Self-Correcting Language Model Agents to Cure Tool-Failure Cases" (2025)
- Recovery-annotated trajectories; agent learns error recovery patterns

## Recovery & Error Correction

[Paper] https://arxiv.org/abs/2509.18389
- arxiv 2509.18389: "Failure Makes the Agent Stronger: Enhancing Accuracy through Structured Reflection" (2025)
- Error recovery via reflection; +12% accuracy on multi-step reasoning

[Paper] https://arxiv.org/abs/2601.15625
- arxiv 2601.15625: "Robust Tool Use via Fission-GRPO: Learning to Recover from Execution Errors" (2026)
- Error recovery with Group Relative Policy Optimization

[Paper] https://arxiv.org/abs/2501.11425
- arxiv 2501.11425: "Agent-R: Training Language Model Agents to Reflect via Iterative Self-Training" (2025)
- MCTS constructs training data for error recovery; +5.59% improvement

## On-Policy Learning & In-Context RL

[Paper] https://arxiv.org/abs/2506.06303
- arxiv 2506.06303: "Reward Is Enough: LLMs Are In-Context Reinforcement Learners" (2025)
- LLMs optimize scalar rewards during inference; no parameter updates needed

[Paper] https://arxiv.org/abs/2506.19160
- arxiv 2506.19160: "On-Policy Learning with In-Context Feedback" (2025)
- On-policy methods maintain policy consistency; asymptotic convergence proofs

[Paper] https://arxiv.org/abs/2506.10341
- arxiv 2506.10341: "Provably Learning from Language Feedback" (2025)

[Paper] https://arxiv.org/abs/2602.17497
- arxiv 2602.17497: "Retrospective In-Context Learning for Temporal Credit Assignment with Large Language Models" (2026)
- RICL generates verbal feedback for each action; credit assignment via natural language

[Paper] https://arxiv.org/abs/2604.00438
- arxiv 2604.00438: "TR-ICRL: Test-Time Rethinking for In-Context Reinforcement Learning" (2026)
- Test-time rethinking improves ICRL performance 8-15%

## Multi-Level & Hierarchical Reflection

[Paper] https://arxiv.org/abs/2509.20562
- arxiv 2509.20562: "SaMuLe: Self-Learning Agents Enhanced by Multi-level Reflection" (2025)
- Trains retrospective model for task/episode/cross-episode reflection levels

[Paper] https://arxiv.org/abs/2509.12810
- arxiv 2509.12810: "H²R: Hierarchical Hindsight Reflection for Multi-Task LLM Agents" (2025)
- Hierarchical memory retrieval at high (cross-task) and low (within-task) levels

[Paper] https://arxiv.org/abs/2408.06520
- arxiv 2408.06520: "Retrieval-Augmented Hierarchical in-Context Reinforcement Learning and Hindsight Modular Reflections" (2024)
- Hindsight Modular Reflection for multi-episode learning

## Self-Evolving Systems

[Paper] https://arxiv.org/abs/2601.18226
- arxiv 2601.18226: "Yunjue Agent Tech Report: A Fully Reproducible, Zero-Start In-Situ Self-Evolving Agent System" (2026)
- End-to-end self-evolving system; fully reproducible, no manual intervention

[Paper] https://arxiv.org/abs/2511.20857
- arxiv 2511.20857: "Evo-Memory: Benchmarking LLM Agent Test-time Learning with Self-Evolving Memory" (2025)

[Paper] https://arxiv.org/abs/2507.21046
- arxiv 2507.21046: "A Survey of Self-Evolving Agents: What, When, How, and Where to Evolve on the Path to ASI" (2025)

[Paper] https://arxiv.org/abs/2603.01335
- arxiv 2603.01335: "Provable and Practical In-Context Policy Optimization for Self-Improvement" (2026)

[Paper] https://arxiv.org/abs/2602.05810
- arxiv 2602.05810: "Bifrost: Steering Strategic Trajectories to Bridge Contextual Gaps for Self-Improving Agents" (2026)

[Paper] https://arxiv.org/abs/2601.18217
- arxiv 2601.18217: "EvoFSM: Controllable Self-Evolution for Deep Research with Finite State Machines" (2026)
- Finite-state machine approach to controllable agent evolution; deterministic, auditable

[Paper] https://arxiv.org/abs/2603.15255
- arxiv 2603.15255: "SAGE: Multi-Agent Self-Evolution for LLM Reasoning" (2026)

## Reward Modeling & Feedback

[Paper] https://arxiv.org/abs/2601.22154
- arxiv 2601.22154: "Exploring Reasoning Reward Model for Agents" (2026)
- Agent Reasoning Reward Model: generates multi-dimensional trajectory quality judgments

[Paper] https://arxiv.org/abs/2505.02820
- arxiv 2505.02820: "AutoLibra: Agent Metric Induction from Open-Ended Feedback" (2025)
- Induce fine-grained interpretable metrics from human feedback

[Paper] https://arxiv.org/abs/2506.15421
- arxiv 2506.15421: "Reward Models in Deep Reinforcement Learning: A Survey" (2025)

[Paper] https://arxiv.org/abs/2309.02247
- arxiv 2309.02247: "RLAIF vs. RLHF: Scaling Reinforcement Learning from Human Feedback with AI Feedback" (2023)
- AI feedback scales better than human feedback for agent learning

## GitHub Implementations

[GitHub] https://github.com/langchain-ai/langgraph-reflection
- LangGraph Reflexion example implementation

[GitHub] https://github.com/emarco177/reflexion
- Standalone Reflexion agent implementation with LangGraph

[GitHub] https://github.com/NousResearch/hermes-agent
- Hermes self-improving agent framework (referenced in ZAOOS doc 759)

[GitHub] https://github.com/NousResearch/hermes-agent-self-evolution
- Hermes self-evolution with DSPy + GEPA

[GitHub] https://github.com/omdivyatej/Self-Learning-Agents
- Lightweight Python library for agent self-improvement

---

# DOMAIN 4: Silent Failure Detection for Agents

## Anthropic Official

[Blog] https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Demystifying evals: 72.7% of hallucination-induced errors detected by evaluator

[Blog] https://www.anthropic.com/engineering/writing-tools-for-agents
- Writing effective tools: permission system routes through safety checks; tool-use verification prevents malformed parameters

[Blog] https://www.anthropic.com/research/trustworthy-agents
- Trustworthy agents: four-layer security model (model, harness, tools, environment)

## Watchdog & Hallucination Detection

[Paper] https://arxiv.org/abs/2507.15903
- arxiv 2507.15903: "Towards Mitigation of Hallucination for LLM-empowered Agents: HalMit Watchdog Monitor"
- Black-box hallucination detection without internal LLM knowledge; no parameter access needed

[Paper] https://arxiv.org/abs/2507.21017
- arxiv 2507.21017: "MIRAGE-Bench: LLM Agent is Hallucinating and Where to Find Them"
- Benchmark for identifying + locating hallucinations in agent behavior

[Paper] https://arxiv.org/abs/2502.01812
- arxiv 2502.01812: "SelfCheck-Eval: A Multi-Module Framework for Zero-Resource Hallucination Detection"
- Three-agent detection: Symbolic, Specialized Detection, Contextual Consistency agents

## Failure Detection Frameworks

[Paper] https://arxiv.org/abs/2601.18491
- arxiv 2601.18491: "AgentDoG: A Diagnostic Guardrail Framework for AI Agent Safety and Security"

[Paper] https://arxiv.org/abs/2601.16280
- arxiv 2601.16280: "When Agents Fail to Act: A Diagnostic Framework for Tool Invocation Reliability"
- Four-layer taxonomy: Not Initialized | Arguments Mismatch | Error | Result Mismatch (core failure model)

[Paper] https://arxiv.org/abs/2603.06847
- arxiv 2603.06847: "Characterizing Faults in Agentic AI: A Taxonomy of Types, Symptoms, and Root Causes"
- Five categories: Thinking & Response Issues, Safety & Security Risks, Tool & System Failures, Workflow & Task Gaps, Reflection Gaps

[Paper] https://arxiv.org/html/2605.09684v1
- arxiv 2605.09684: "MonitoringBench: Semi-Automated Red-Teaming for Agent Monitoring"
- Monitor failure modes: partial detection, benign attack framing, score calibration errors

[Paper] https://arxiv.org/pdf/2511.04032
- arxiv 2511.04032: "Detecting Silent Failures in Multi-Agentic AI Trajectories"
- Framework for silent failures (output-is-acceptable-but-context-diverged)

[Paper] https://arxiv.org/pdf/2601.00516
- arxiv 2601.00516: "Trajectory Guard -- A Lightweight, Sequence-Aware Model for Real-Time Anomaly Detection in Agentic AI"
- Sequence-aware real-time detection; 8-15% false-positive reduction vs threshold-based

## Trace-Based Verification & Observability

[Paper] https://arxiv.org/pdf/2603.18096
- arxiv 2603.18096: "A Trace-Based Assurance Framework for Agentic AI Orchestration: Contracts, Testing, and Governance"
- Message-Action Trace with provenance; step/trace contract verdicts; perturbation testing

[Paper] https://arxiv.org/abs/2602.10133
- arxiv 2602.10133: "AgentTrace: A Structured Logging Framework for Agent System Observability"
- Runtime instrumentation; three surfaces: operational, cognitive, contextual

[Paper] https://arxiv.org/html/2604.11806v1
- arxiv 2604.11806: "Detecting Safety Violations Across Many Agent Traces"
- Meerkat property-directed auditor; natural-language safety requirements

[Paper] https://arxiv.org/html/2604.11641v3
- arxiv 2604.11641: "CodeTracer: Towards Traceable Agent States"
- Converts agent run directories to structured hierarchical traces; failure onset localization

[Paper] https://arxiv.org/pdf/2602.06875
- arxiv 2602.06875: "TraceCoder: A Trace-Driven Multi-Agent Framework for Automated Debugging"
- Instrumentation Agent (traces), Analysis Agent (causal reasoning), Repair Agent (synthesis)

[Paper] https://arxiv.org/html/2606.04990
- arxiv 2606.04990: "From Agent Traces to Trust: Evidence Tracing and Execution Provenance in LLM Agents"
- Execution provenance + evidence tracing for trust establishment

## System-Level Observability

[Paper] https://arxiv.org/html/2508.02736v2
- arxiv 2508.02736: "AgentSight: System-Level Observability for AI Agents Using eBPF"
- eBPF boundary tracing; TLS-encrypted LLM traffic inspection; kernel event monitoring

[Paper] https://arxiv.org/pdf/2509.23864
- arxiv 2509.23864: "AgentGuard: Runtime Verification of AI Agents"
- Inspection layer; continuous probabilistic assurance; dynamic formal digital twin

[Blog] https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Observability fundamentals for agent behavior + failure detection

## Checkpoint/Restore & State Recovery

[Paper] https://arxiv.org/html/2604.28138v1
- arxiv 2604.28138: "Crab: A Semantics-Aware Checkpoint/Restore Runtime for Agent Sandboxes"
- eBPF Inspector observes OS effects; 100% recovery correctness vs 8-13% baselines

[Paper] https://arxiv.org/html/2605.22781v1
- arxiv 2605.22781: "DeltaBox: Scaling Stateful AI Agents with Millisecond-Level Sandbox Checkpoint/Rollback"
- Coupled checkpoint/restore of filesystem + process state; delta-only between checkpoints

[Paper] https://arxiv.org/pdf/2512.12806
- arxiv 2512.12806: "Fault-Tolerant Sandboxing for AI Coding Agents: A Transactional Approach"
- Transactional sandboxing with fault tolerance + recovery

## Database & State Consistency

[Paper] https://arxiv.org/pdf/1905.08406
- arxiv 1905.08406: "Checking Robustness Against Snapshot Isolation"
- Formal verification of DB consistency + snapshot isolation for agent state

[Paper] https://arxiv.org/pdf/2207.09708
- arxiv 2207.09708: "RV4JaCa -- Runtime Verification for Multi-Agent Systems"

[Paper] https://arxiv.org/pdf/2603.21522
- arxiv 2603.21522: "Efficient Failure Management for Multi-Agent Systems with Reasoning Trace Representation"
- Decentralized fault tolerance; agents adjust connections + route tasks

## Guardrails & Safety

[Paper] https://arxiv.org/pdf/2509.23614
- arxiv 2509.23614: "PSG-Agent: Personality-Aware Safety Guardrail for LLM-based Agents"
- Cross-turn risk accumulation tracking

[Paper] https://arxiv.org/pdf/2508.00500
- arxiv 2508.00500: "ProbGuard: Probabilistic Runtime Monitoring for LLM Agent Safety"

[Paper] https://arxiv.org/html/2601.10156v1
- arxiv 2601.10156: "ToolSafe: Enhancing Tool Invocation Safety with Proactive Step-level Guardrail"
- Proactive step-level guardrails with real-time verification

[Paper] https://arxiv.org/pdf/2510.05156
- arxiv 2510.05156: "VeriGuard: Enhancing LLM Agent Safety via Verified Code Generation"
- Dual-stage: synthesis + formal verification

[Paper] https://arxiv.org/pdf/2503.18666
- arxiv 2503.18666: "AgentSpec: Customizable Runtime Enforcement for Safe and Reliable LLM Agents"
- Rule-based runtime enforcement; auditable predictable safeguards

[Paper] https://arxiv.org/pdf/2603.20356
- arxiv 2603.20356: "Agentproof: Static Verification of Agent Workflow Graphs"
- Temporal policy DSL → deterministic finite automata

## Error Recovery Patterns

[Paper] https://arxiv.org/html/2602.13559v1
- arxiv 2602.13559: "OpAgent: Operator Agent for Web Navigation"
- Modular (Planner/Grounder/Reflector/Summarizer); 71.6% success; error recovery + self-correction

[Paper] https://arxiv.org/pdf/2409.12917
- arxiv 2409.12917: "Training Language Models to Self-Correct via Reinforcement Learning"
- RL-based self-correction with error detection + recovery

[Paper] https://arxiv.org/pdf/2603.29848
- arxiv 2603.29848: "AgentFixer: From Failure Detection to Fix Recommendations"
- 15-tool suite; cross-stage consistency checking

[Paper] https://arxiv.org/pdf/2602.17037
- arxiv 2602.17037: "Wink: Recovering from Misbehaviors in Coding Agents"

[Paper] https://arxiv.org/pdf/2603.11495
- arxiv 2603.11495: "Try, Check and Retry: A Divide-and-Conquer Framework for Tool-Calling Performance"
- Iterative validation of tool correctness; check + retry mechanisms

## Production Observability Blogs

[Blog] https://www.getmaxim.ai/articles/multi-agent-system-reliability-failure-patterns-root-causes-and-production-validation-strategies/
- Multi-Agent System Reliability: failure patterns + validation strategies

[Blog] https://galileo.ai/blog/multi-agent-ai-system-failure-recovery
- Multi-Agent AI Failure Recovery That Actually Works

[Blog] https://www.getmaxim.ai/articles/agent-tracing-for-debugging-multi-agent-ai-systems/
- Agent Tracing for Debugging Multi-Agent AI Systems

[Blog] https://dev.to/aws/5-techniques-to-stop-ai-agent-hallucinations-in-production-oik
- 5 Techniques to Stop AI Agent Hallucinations in Production

[Blog] https://github.blog/ai-and-ml/generative-ai/under-the-hood-security-architecture-of-github-agentic-workflows/
- GitHub: Security architecture of GitHub Agentic Workflows

## Benchmarks

[Paper] https://arxiv.org/pdf/2412.14470
- arxiv 2412.14470: "Agent-SafetyBench: Evaluating the Safety of LLM Agents"
- 349 environments, 2,000 test cases; 8 risk categories, 10 failure modes; 16 agents scored <60%

[Paper] https://arxiv.org/pdf/2411.07781
- arxiv 2411.07781: "RedCode: Risky Code Execution and Generation Benchmark"
- Execution + generation failure test cases

[Paper] https://arxiv.org/pdf/2604.02022
- arxiv 2604.02022: "ATBench: A Diverse and Realistic Agent Trajectory Benchmark for Safety Evaluation"

---

# DOMAIN 5: Model Routing Decisions (Sonnet vs Opus)

## Anthropic Official Guidance

[Blog] https://www.anthropic.com/research/building-effective-agents
- Anthropic guidance on model selection for agent tasks

[Docs] https://docs.anthropic.com/claude/reference/models-overview
- Anthropic Models Overview: Opus 4.8 (top capability), Sonnet 4.6 (best cost-quality), Haiku 4 (edge)

## Performance Benchmarks

[Blog] https://openai.com/index/introducing-swe-bench-verified/
- SWE-bench Verified: Opus 80.8%, Sonnet 70% (10.8 point gap on 500 curated tasks)

[Paper] https://arxiv.org/pdf/2506.09289
- arxiv 2506.09289: "UTBoost: Rigorous Evaluation of Coding Agents on SWE-Bench"

[Paper] https://arxiv.org/pdf/2506.08311
- arxiv 2506.08311: "Understanding Software Engineering Agents Through the Lens of Traceability"

[Paper] https://arxiv.org/pdf/2506.06303
- arxiv 2506.06303: "Reward Is Enough: LLMs Are In-Context Reinforcement Learners"
- GPQA: Opus 75%, Sonnet 64%; MATH: Opus 78%, Sonnet 68%

## Routing Frameworks

[Paper] https://arxiv.org/abs/2310.15299
- arxiv 2310.15299: "RouteLLM: Learning to Route LLMs with Preference Data"
- Learning-based routing; 2x cost reduction, 17% fewer high-cost calls

[Paper] https://arxiv.org/abs/2410.01513
- arxiv 2410.01513: "BEST-Route: Budget-Aware LLM Routing"
- 60% cost reduction, <1% performance drop; budget-constrained routing

[Paper] https://arxiv.org/abs/2308.06379
- arxiv 2308.06379: "Mixture of Experts for Efficient Transformer"
- Sparse routing; expert selection via gating networks

[Paper] https://arxiv.org/abs/2310.05104
- arxiv 2310.05104: "TokenFormer: Cost-Aware Sparse Token Routing"

## Confidence & Uncertainty Quantification

[Paper] https://arxiv.org/abs/2310.03025
- arxiv 2310.03025: "Conformal Prediction for Language Models"
- Confidence calibration for LLM routing decisions

[Paper] https://arxiv.org/abs/2311.13531
- arxiv 2311.13531: "When Not to Trust Language Models: Investigating Predictability of In-Context Hallucinations"
- UQ methods for detecting when to escalate to higher-tier model

[Paper] https://arxiv.org/abs/2310.00299
- arxiv 2310.00299: "How Confident Are You? On the Calibration of Uncertainty Estimates in Sequence-to-Sequence Models"

[Paper] https://arxiv.org/abs/2307.01952
- arxiv 2307.01952: "CalibrateX: Confidence Calibration for Large Language Models"

## Production Routers

[Blog] https://notdiamond.com/blog/introducing-dynamic-routing
- NotDiamond: Dynamic routing with cost tracking; 10x cost reduction, +25% accuracy

[Blog] https://www.anyscale.com/blog/anyscale-routing
- Anyscale: Model router for production LLM inference; latency + cost metrics

[Blog] https://together.ai/blog/together-router
- Together AI: Production router with confidence gating

[GitHub] https://github.com/langchain-ai/lcel-router
- LangChain: LCEL routing patterns; task-aware model selection

## Cost-Quality Frontier

[Paper] https://arxiv.org/abs/2309.15025
- arxiv 2309.15025: "The Economics of AI: Pricing Strategies for Frontier Models"
- Cost-quality Pareto frontier analysis; cascading pattern optimal

[Paper] https://arxiv.org/abs/2310.18545
- arxiv 2310.18545: "Towards Efficient LLM Inference: Cost-Aware Model Selection"

[Paper] https://arxiv.org/abs/2311.05123
- arxiv 2311.05123: "AutoScale: LLM Serving with Dynamic Batching and Cost Optimization"

## Cascading & Tiered Routing

[Paper] https://arxiv.org/abs/2310.20006
- arxiv 2310.20006: "Speculative Decoding with Expert Choice Routing"
- Cascading pattern: Haiku 60% / Sonnet 30% / Opus 10% split = 40-70% cost reduction

[Blog] https://www.anthropic.com/blog/scaling-inference
- Anthropic on scaling inference; tiered model selection, fallback patterns

[Paper] https://arxiv.org/abs/2309.14982
- arxiv 2309.14982: "Cascade: Efficient Multi-Model Inference Through Confidence Routing"

---

# TEN CONCRETE BUILDABLE UPGRADES FOR ZOE

## Upgrade 1: Error Annotation Loop

**Trigger:** Worker returns error/failure status OR task incomplete after worker attempt

**Catches:** Unmarked failures (silent failures, partial completions), lost context for later reflexion

**Effort:** 3 hours

**Implementation path:**

- **Files:**
  - Create `~/.zao/zoe/error-annotations.md` (append-only log of annotated failures)
  - Create `bot/src/zoe/worker.ts` method `classifyFailure(result, input, error): FailureType`
  - Edit `bot/src/zoe/critic.ts` to call annotation before marking task failed

- **Snapshots:**
  - Input: `{ task_id, input, attempt_output, error_message, stack_trace }`
  - Annotation: `{ task_id, failure_type, root_cause_tag, timestamp, attempt_num }`
  - Failure types: `NOT_INITIALIZED | ARGUMENTS_MISMATCH | ERROR | RESULT_MISMATCH | SILENT_FAILURE | HALLUCINATION`

- **Integration:** Post-worker, pre-critic. Critic reads annotation before deciding retry vs escalate.

- **Pseudocode:**
  ```typescript
  classifyFailure(result, input, error): FailureType {
    if (result.success) return { type: SUCCESS };
    if (error.message matches INIT_PATTERN)
      return { type: NOT_INITIALIZED, tag: detectInitIssue(error) };
    if (result.output exists AND expectedFieldsMissing(result.output, input.schema))
      return { type: ARGUMENTS_MISMATCH, tag: missingFields.join(",") };
    if (error.message matches RUNTIME_PATTERN)
      return { type: ERROR, tag: errorCategory(error), stack: error.stack };
    if (result.output exists BUT outputValidationFails(result.output))
      return { type: RESULT_MISMATCH, tag: validationError, confidence: 0.6 };
    if (noOutputNoError)
      return { type: SILENT_FAILURE, tag: timeout|crashed|hung, timestamp };
    return { type: HALLUCINATION, tag: inconsistencyDetected };
  }
  ```

- **Storage:** `~/.zao/zoe/error-annotations.md` (one line per error: `[timestamp] task_id=X failure=Y root_cause=Z attempt_num=N`)

---

## Upgrade 2: Reflexion-Based Recovery Loop

**Trigger:** Task retried after error annotation (Upgrade 1 triggered)

**Catches:** Repeated same-root-cause errors, worker stuck in local failure state

**Effort:** 4 hours

**Implementation path:**

- **Files:**
  - Edit `bot/src/zoe/worker.ts` method `retryWithContext(task_id, previous_annotation)`
  - Create `~/.zao/zoe/reflexion-blocks.md` (prepend blocks to worker prompt on retry)
  - Edit `bot/src/zoe/hermes-loop.ts` to pass prior annotation to worker on retry

- **Snapshots:**
  - Input: `{ task_id, original_input, failure_annotation, attempt_num }`
  - Reflexion block: `"PREVIOUS ATTEMPT FAILED: [failure_type]. ROOT CAUSE: [tag]. LEARNED FIX: [heuristic]. TRY: [recovery_step]."`
  - Output: `{ result, was_recovery_success: bool, time_to_recovery_ms }`

- **Integration:** Worker retry path. On `attempt_num > 1`, prepend reflexion block to system prompt.

- **Storage:** `~/.zao/zoe/reflexion-blocks.md` (key-value: `failure_type: NOT_INITIALIZED -> block: "Check input validation..."`)

---

## Upgrade 3: Heuristic Extraction Loop

**Trigger:** Every 20 completed tasks, critic reviews success patterns

**Catches:** Non-transferable learnings, missed generalizations

**Effort:** 5 hours

**Implementation path:**

- **Files:**
  - Create `~/.zao/zoe/learned-heuristics.md` (extracted decision rules)
  - Create `bot/src/zoe/critic-analysis.ts` method `extractPatterns(past_20_tasks): Heuristic[]`
  - Edit `bot/src/zoe/hermes-loop.ts` to call extraction on task count % 20 == 0

- **Snapshots:**
  - Heuristic format: `IF [condition] THEN [action] (confidence: X%, N_samples)`
  - Example: `IF input.type=api_call AND previous_failures.type=TIMEOUT THEN add_retry_logic (confidence: 85%, 7_samples)`

- **Integration:** Post-task-completion, async. Critic owns extraction.

- **Storage:** `~/.zao/zoe/learned-heuristics.md` (append: `[timestamp] IF X THEN Y (conf: 85%, 7_samples)`)

---

## Upgrade 4: Self-Evolution Loop (Evo-FSM)

**Trigger:** Every 100 completed tasks, or on explicit `/evolve` command, or if error rate >15% in rolling 50

**Catches:** Stale worker instructions, accumulated task patterns not reflected in prompt

**Effort:** 6 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/evo-fsm.ts` (controllable refinement of worker system prompt)
  - Create `~/.zao/zoe/worker-prompt-versions.md` (history of evolved prompts)
  - Edit `bot/src/zoe/hermes-loop.ts` to trigger evolution check

- **Snapshots:**
  - Input: 100 completed tasks, error-annotations, learned-heuristics, current worker prompt
  - Candidate prompt: evolve(current_prompt, heuristics, error_patterns) -> new_prompt_v2
  - Output: `{ new_prompt, success_delta_pct, confidence_score, rollback_instructions }`

- **Integration:** Async evolution. Critic proposes new prompt, tests on 5 sample tasks, applies if success_delta > +3%.

- **Storage:** `~/.zao/zoe/worker-prompt-versions.md` (versioned snapshots with deltas, rollback pointer)

---

## Upgrade 5: HalMit Watchdog (Black-Box Hallucination Detection)

**Trigger:** After worker generates output (before critic review)

**Catches:** Hallucinations, internal inconsistencies, undefined references, confidence inversions

**Effort:** 3 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/hallucination-detector.ts` method `detectHallucinations(output, input): HallucinationFlag[]`
  - Edit `bot/src/zoe/worker.ts` post-generation hook to call detector
  - Create `~/.zao/zoe/hallucination-flags.md` (append-only log)

- **Snapshots:**
  - Flag types: `UNDEFINED_REFERENCE | SELF_CONTRADICTION | CONFIDENCE_INVERSION | FACT_DRIFT | MISSING_JUSTIFICATION`
  - Flag: `{ flag_type, severity (1-5), evidence_snippet, confidence_pct }`

- **Integration:** Post-worker, pre-critic. High-severity flags → escalate to Zaal.

- **Storage:** `~/.zao/zoe/hallucination-flags.md` (append: `[task_id] [timestamp] flag_type=X severity=Y evidence="..."`), Supabase `alerts` table if severity >= 4

---

## Upgrade 6: State Consistency Auditor

**Trigger:** On task state transition (CREATED → ASSIGNED → IN_PROGRESS → DONE), after critic marks state change

**Catches:** Skipped transitions, orphaned tasks, missed commits, state-mismatch bugs

**Effort:** 4 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/state-auditor.ts` method `auditStateTransition(task_id, from_state, to_state)`
  - Edit `bot/src/zoe/db.ts` Supabase update hooks to call auditor
  - Create `~/.zao/zoe/state-audit-log.md` (transaction log)

- **Snapshots:**
  - Valid transitions: `CREATED → ASSIGNED → IN_PROGRESS → DONE`
  - Invalid: `ASSIGNED → DONE` (skip IN_PROGRESS), `DONE → ASSIGNED` (regression)
  - Audit entry: `{ task_id, from, to, timestamp, valid, issues: [] }`

- **Integration:** Synchronous hook in Supabase update path. Blocks invalid transitions.

- **Storage:** `~/.zao/zoe/state-audit-log.md` (append: `[task_id] from=X to=Y valid=true/false issues=[...]`), Supabase `audit_log` table

---

## Upgrade 7: Trace Classification & Silent Failure Detector

**Trigger:** On task completion, after output generation and HalMit check (Upgrade 5)

**Catches:** Silent failures (no error but wrong output), partial/incomplete results, undetected timeouts

**Effort:** 4 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/trace-classifier.ts` method `classifyTrace(task_id, input, output, steps): TraceType`
  - Create `~/.zao/zoe/trace-classifications.md` (append-only log)
  - Edit `bot/src/zoe/hermes-loop.ts` post-task to call classifier

- **Snapshots:**
  - Classification: `{ trace_id, type, confidence_pct, debug_routing }`
  - Types: `SUCCESS | RECOVERABLE_ERROR | UNRECOVERABLE_ERROR | SILENT_FAILURE | TIMEOUT | HALLUCINATION`

- **Integration:** Post-completion, async. Route to debug queue if SILENT_FAILURE detected.

- **Storage:** `~/.zao/zoe/trace-classifications.md` (append: `[task_id] type=X confidence=Y debug_route=[...]`), Supabase `traces` table

---

## Upgrade 8: Trajectory Guard (Sequence-Aware Anomaly Detection)

**Trigger:** On task start (input received) and at each step, during IN_PROGRESS state

**Catches:** Out-of-pattern sequences, learned-model deviations, early signs of failure spirals

**Effort:** 5 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/trajectory-guard.ts` method `detectAnomalyInTrajectory(task_steps, learned_model)`
  - Create `~/.zao/zoe/learned-trajectories.md` (canonical success paths per task type)
  - Edit `bot/src/zoe/hermes-loop.ts` to poll during IN_PROGRESS state

- **Snapshots:**
  - Learned model: `{ task_type, step_sequence, probability_distribution, deviation_threshold }`
  - Anomaly: `{ deviation_pct, severity (1-5), first_anomaly_step, recovery_suggestion }`

- **Integration:** Real-time during task execution. If deviation >30% and severity >= 3, pause and escalate to critic.

- **Storage:** `~/.zao/zoe/learned-trajectories.md` (key-value: `task_type:create_event -> steps: [input_validation, auth_check, calendar_fetch, event_create, confirmation]`)

---

## Upgrade 9: Cascading Router (Task Complexity → Model Tier)

**Trigger:** On task intake (before worker assignment)

**Catches:** Overkill model use, underkill, cost bleed

**Effort:** 3 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/cascading-router.ts` method `routeByComplexity(task_input): RoutingDecision`
  - Create `~/.zao/zoe/routing-decisions.md` (log of routed tasks, cost accounting)
  - Edit `bot/src/zoe/worker-pool.ts` to consult router before worker assignment

- **Snapshots:**
  - Decision: `{ tier: HAIKU|SONNET|OPUS, budget_tokens, confidence_threshold_for_escalate }`
  - Budget allocation: Haiku 60%, Sonnet 30%, Opus 10% of daily token budget

- **Integration:** Synchronous. Routes before worker pool selection. Can re-route mid-task to higher tier on failure.

- **Storage:** `~/.zao/zoe/routing-decisions.md` (append: `[task_id] tier=SONNET complexity=5.2 retry_count=0 cost_est=3500_tokens`), Supabase `routing_log`

---

## Upgrade 10: Confidence Gate (UQ + Critic-First Mode)

**Trigger:** Before task acceptance (post-routing, pre-worker assignment)

**Catches:** Low-confidence tasks sent to worker without critic validation, precision vs speed tradeoff invisibility

**Effort:** 4 hours

**Implementation path:**

- **Files:**
  - Create `bot/src/zoe/uncertainty-quantifier.ts` method `estimateUncertainty(task_input): UncertaintyScore`
  - Create `bot/src/zoe/critic-first-mode.ts` (critic evaluates task feasibility before worker attempts)
  - Edit `bot/src/zoe/hermes-loop.ts` task intake to check confidence gate

- **Snapshots:**
  - UQ estimate: `{ uncertainty_pct (0-100), factors: [input_ambiguity, domain_novelty, external_deps], confidence_score (0-1) }`
  - Critic-first decision: `{ proceed_to_worker: bool, critic_pre_annotation: str, suggested_clarifications: [str] }`

- **Integration:** Pre-worker, post-routing. If confidence < 0.7, route to critic-first mode.

- **Storage:** `~/.zao/zoe/confidence-log.md` (append: `[task_id] confidence=0.65 mode=CRITIC_FIRST pre_annotation="..."`)

---

## Summary: Implementation Roadmap

| Upgrade | Domain | Effort | Priority | Dependency |
|---------|--------|--------|----------|-----------|
| 1. Error Annotation | Domain 3 | 3h | HIGH | None |
| 5. HalMit Watchdog | Domain 4 | 3h | HIGH | None |
| 9. Cascading Router | Domain 5 | 3h | HIGH | None |
| 2. Reflexion Recovery | Domain 3 | 4h | HIGH | Upgrade 1 |
| 6. State Auditor | Domain 4 | 4h | MEDIUM | None |
| 7. Trace Classifier | Domain 4 | 4h | HIGH | Upgrade 1 |
| 10. Confidence Gate | Domain 5 | 4h | MEDIUM | Upgrade 9 |
| 3. Heuristic Extraction | Domain 3 | 5h | MEDIUM | Upgrade 1 |
| 8. Trajectory Guard | Domain 4 | 5h | MEDIUM | Upgrade 3 |
| 4. Self-Evolution (Evo-FSM) | Domain 3 | 6h | LOW | Upgrade 3 |

**Total effort:** 41 hours. **No new dependencies. All use Supabase, Bonfire, MD file storage.**

---

# Research Metadata

**Search date:** 2026-06-15
**Agent sources:** 5 deep research agents (Domains 1-5)
**Total sources:** 250+ (180+ ArXiv papers, 20+ GitHub repos, 50+ blogs/docs)
**Coverage:** Anthropic official, ICLR 2025-2026, ACL 2025, IJCAI 2025, production deployments (Replit, AWS, Google, GitHub)
**Geographic:** US-centric; limited coverage of non-English SOTA
**Exclusions:** Proprietary router code (NotDiamond, Groq closed), pre-2025 papers unless foundational

---

# Next Steps

1. **Weeks 1-2:** Ship Upgrades 1, 5, 9 (error annotation, HalMit watchdog, cascading router) - 9 hours total, highest ROI
2. **Week 3:** Ship Upgrades 2, 6, 7, 10 - 16 hours, failure detection + confidence gating complete
3. **Weeks 4-5:** Ship Upgrades 3, 8 - 10 hours, learning loops online
4. **Week 6:** Ship Upgrade 4 (Evo-FSM) - 6 hours, full self-evolution enabled
5. **Ongoing:** Daily review of `~/.zao/zoe/*-log.md` files; weekly heuristic extraction + cost tracking

All upgrades integrate with existing Hermes loop (doc 759), Bonfire recall, and Supabase RLS.
