# Eight Specialized AI Model Types: Landscape & ZAO Fleet Relevance

**Doc 1185** | Research | Updated 2026-07-16 | Type: Reference | Tier: STANDARD

---

## Overview

Zaal shared an infographic on "8 Different Specialized AI Models" (LLM, LCM, LAM, MoE, VLM, SLM, MLM, SAM) and asked if we've researched them. This doc surveys all 8 with 2026 current examples, use cases, and concrete analysis of which matter to the ZAO agent fleet. The landscape shifted dramatically in 2025-2026: MoE became standard in frontier models, SLMs proved viable for edge, and LAMs (agent-first) emerged as a distinct category. This research grounds the fleet's model routing strategy (ZOL Model Gateway, ZOE's worker dispatch, Ollama local inference).

---

## The 8 Model Types: What, How, Examples, Best At, Limits

### 1. LLM - Large Language Model

**What it is:** Autoregressive transformers (next-token prediction) trained on massive text corpora to generate coherent text. The foundation of the AI wave (2017-2026).

**Pipeline:**
1. Tokenization (BPE/SentencePiece) converts text to subword IDs
2. Embedding layer maps token IDs to dense vectors
3. Transformer stack (multi-head attention, feed-forward) processes sequence bidirectionally (encoding only in LLM)
4. Output projection predicts next token probability distribution
5. Sampling/beam-search decodes into natural language

**2026 Examples:**
- OpenAI GPT-4o, GPT-5 (frontier, closed)
- Anthropic Claude Opus 4.7 (frontier, conversation/reasoning)
- Meta Llama 3.2 (70B open-weight, strong baseline)
- Mistral Large 2 (open-weight, cost-effective)

**Best at:**
- Long-form generation (email, code, prose, reasoning)
- Multi-turn conversation (in-context learning)
- Zero-shot transfer (handles unseen tasks)
- Instruction following (fine-tuning via RLHF or synthetic data)

**Limits:**
- Context window (even 200K tokens hit cost + latency cliffs)
- Hallucination (confident false outputs, especially on retrieval)
- Slow inference (token-by-token autoregressive)
- Cost at scale (frontier models $5-50/MTok input)
- No structured reasoning (reasoning is implicit in weights)

---

### 2. LCM - Large Concept Model

**What it is:** Meta's paradigm shift: operate on explicit sentence-level semantic embeddings (SONAR space) instead of tokens. Predicts entire sentences in a language- and modality-agnostic concept space.

**Pipeline:**
1. Input text → SONAR encoder (200+ languages, dual text+speech)
2. Concept space: each token → sentence embedding (e.g., 1024-dim semantic vector)
3. LCM transformer (1.6B-7B params) predicts next concept given prior concepts
4. Decoder maps predicted concept back to text (any language)

**2026 Examples:**
- Meta LCM (7B, outperforms Llama 7B on multilingual tasks)
- v-LCM (vision-language, extends SONAR to vision via v-Sonar)
- v-Sonar embedding space (1500 text languages + 177 speech languages, unified)

**Best at:**
- Multilingual generation (concept space is language-agnostic)
- Cross-lingual transfer (train on one language, zero-shot generalize to 61 others)
- Long-document reasoning (sentences as units, not tokens, = fewer steps)
- Semantic search (SONAR embeddings are highly interpretable)

**Limits:**
- Immature ecosystem (no fine-tuning harness, no production deployments yet)
- Concept → text decoder bottleneck (reversing embeddings loses information)
- Adoption slow (industry still token-first)
- Emerging (v-LCM only released 2025, still research-grade)
- Not widely available via API (Meta research only)

---

### 3. LAM - Large Action Model

**What it is:** Agent-first architecture: perception → intent recognition → task decomposition → action planning → tool execution. Agents that do things, not just predict text. Goes beyond "output a function call" (LLM tool-use) to stateful, multi-step task ownership.

**Pipeline:**
1. Perception: parse user input + screen state + prior context
2. Intent recognition: classify whether task requires action or just text
3. Decompose: break complex goal into substeps
4. Plan: sequence actions (click, type, API call, navigate)
5. Execute: run actions in environment, observe feedback
6. Learn: update state, adjust next action based on result
7. Repeat until task done or escalate to human

**2026 Examples:**
- Rabbit R1's DLAM (transforms r1 into Windows/Mac computer controller)
- Rabbit OpenClaw (open-source agent, runs in user's environment, direct action)
- AI21's agent stack (perception-to-action middleware)

**Best at:**
- Multi-step automation (book flights, file expenses, manage spreadsheets)
- Computer vision tasks + action (screenshot → understand → click/type)
- Embodied reasoning (agents that learn by doing)
- Tool chaining (coordinate multiple APIs/software)

**Limits:**
- Hallucination + action = real risk (agent books flight to wrong city)
- Latency (perception → decomposition → execution is slow)
- Brittleness (environment changes break trained behaviors)
- Safety (agents need hard guardrails, not just prompts; see rule 9: one instance per resource)
- Still in 2026: Rabbit's own LAM still makes mistakes, rates ~60-70% task accuracy on real workflows

---

### 4. MoE - Mixture of Experts

**What it is:** Sparse activation architecture: instead of running all parameters for every token, split network into K experts + router. Router selects top-N experts per token; only those N experts run. Stays fast while scaling parameter count.

**Pipeline:**
1. Input token → gating network (router)
2. Router outputs probability for each expert (linear + softmax, or cosine similarity)
3. Top-K selection (e.g., top-2 for Mixtral, top-8 for DeepSeek-V3)
4. Selected experts process token in parallel
5. Weighted combination (router weights + expert outputs) → output
6. Load balancing: auxiliary loss (or DeepSeek's dynamic bias) keeps expert utilization even

**2026 Examples:**
- Mixtral 8x7B (top-2 across 8 experts, runs at 13B speed)
- DeepSeek-V3 (top-8 across 256 tiny experts, 671B params, state-of-the-art reasoning)
- GPT-4 (confirmed sparse MoE, exact architecture proprietary)
- Qwen3-MoE (top-6 across 60+ experts)

**Best at:**
- Cost-efficient scaling (650B params, inference cost of 100B model)
- Task specialization (experts learn different domains)
- Reasoning + code (DeepSeek-V3 dominates benchmarks)
- Heterogeneous workloads (route coding tasks to "code expert," reasoning to "reasoning expert")

**Limits:**
- Load balancing still unsolved (uneven token routing → GPU idle time, 2026 research active)
- Communication overhead (inter-GPU expert sync)
- Training instability (convergence slower than dense LLMs)
- Inference optimization hard (not all hardware can parallelize expert selection)
- Expert dead-outs (some experts unused in practice, wasted params)

---

### 5. VLM - Vision Language Model

**What it is:** Dual encoders (vision + text) + projection layer. Learns joint embedding of images and text, enabling image understanding + captioning + visual QA.

**Pipeline:**
1. Image → vision transformer (ViT, e.g., CLIP's image encoder)
2. Text → text transformer (BERT-style or LLM encoder)
3. Projection: both outputs → shared embedding space
4. Contrastive training: maximize similarity for (image, description) pairs, minimize for mismatches
5. At inference: encode image + query text, rank by similarity

**2026 Examples:**
- GPT-4o / GPT-5o (unified text+image, strong OCR + reasoning)
- Claude Opus 4.7 (strong on document QA, computer-use GUI control)
- Qwen2.5-VL (open-weight, competitive with GPT-4o on MMMU)
- Pixtral (Mistral's VLM, fast, open-weight)
- Llama 4 multimodal (open, strong on charts/diagrams)

**Best at:**
- Visual reasoning (math, diagrams, flowcharts)
- Document processing (PDF QA, receipt parsing)
- Computer vision for agents (screenshot → understand → action)
- Zero-shot visual search (no fine-tuning needed)
- OCR + layout understanding (stronger than pure CV models)

**Limits:**
- Image size limits (most cap at ~1-2MB encoded, low detail for very large images)
- Latency (encoding + attention over image patches = expensive)
- Token budget (images take 300-1500 tokens vs text's dense meaning)
- Still hallucinate (confident wrong captions for ambiguous images)
- Not specialized for real computer-vision tasks (edge detection, instance segmentation—SAM is better)

---

### 6. SLM - Small Language Model

**What it is:** Compact models (1B-13B params) designed for on-device or edge inference. Trade frontier performance for latency + cost + privacy.

**Pipeline:**
Same as LLM (transformer, autoregressive), but:
1. Smaller embedding dimension (512-1024 vs 8192 for frontier)
2. Fewer layers (12-24 vs 80+ for frontier)
3. Lower vocab size (sometimes)
4. Quantization to 4-8 bit for memory efficiency

**2026 Examples:**
- Phi-4 (14B, synthetic data magic, rivals 70B models on reasoning)
- Gemma 4 (12B multimodal, fits ~7GB at 4-bit, text+image+audio+video)
- Llama 3.2 (1B/3B, mobile-targeted, can run on smartphone)
- Qwen-small (2.7B, competitive on code/math for size)

**Best at:**
- Edge/on-device (no cloud latency, no privacy leak)
- Cost efficiency (5-20x cheaper than LLM APIs for high volume)
- Low-latency inference (2-5 tokens/sec on CPU)
- Constrained devices (Raspberry Pi, iOS phone, embedded systems)
- Specialized tasks with fine-tuning (after pre-train, customize for domain)

**Limits:**
- Lower quality (Phi-4 is good, but not Claude Opus level)
- Smaller context (often 4K-8K vs 200K+ for frontier)
- Limited reasoning (few-shot weak, need examples in prompt)
- Hallucination worse (smaller model, less parameter diversity)
- Fine-tuning instability (small models overfit quickly on small datasets)

---

### 7. MLM - Masked Language Model

**What it is:** Bidirectional encoder trained by masking random tokens and predicting them from context. Powers retrieval, similarity, and reranking (not generation).

**Pipeline:**
1. Input text → tokenize
2. Randomly mask ~15% of tokens (replace with [MASK])
3. Encoder processes full sequence (bidirectional attention)
4. Output: predict the masked tokens' identities
5. At inference: encode without masking, use hidden states as semantic vectors

**2026 Examples:**
- BERT (10B, still used for retrieval)
- BGE-M3 (embedding model, MIT-licensed, 100+ languages, sparse+dense+multi-vector)
- E5 family (open-source, strong on semantic search)
- SBERT / Sentence-BERT (encodes sentences into meaningful vectors)

**Best at:**
- Semantic search (query → embedding, document → embedding, rank by similarity)
- Clustering (group similar documents)
- Similarity scoring (reranking LLM candidates)
- Retrieval-augmented generation (encode corpus, find relevant docs fast)
- Multilingual transfer (one encoder, cross-lingual search)

**Limits:**
- No generation (can't write, only understand)
- Frozen vocabulary (can't handle out-of-vocab words well)
- Smaller models (encoder-only, so 110M-335M params typical vs 7B+ for SLM)
- Sentence length (most cap at 512 tokens, long docs need chunking)
- Training expensive (need large clean corpus, careful masking strategy)

---

### 8. SAM - Segment Anything Model

**What it is:** Prompt-driven image segmentation. Given an image + prompt (point click, bounding box, text, or exemplar image), output precise pixel-level mask of the object.

**Pipeline:**
1. Image → vision encoder (ViT-based)
2. Prompt (point/box/mask/text) → prompt encoder
3. Mask decoder (lightweight, CNN-style)
4. Decoder fuses image + prompt embeddings → probability map for each pixel
5. Output: binary segmentation mask + confidence score

**2026 Examples:**
- SAM (original, 2023)
- SAM 2 (unified image+video, first-click refinement)
- SAM 3 (concept-based: text prompts like "yellow school bus" segment all instances)
- SAM 3.1 (real-time video, multiplexed tracking)

**Best at:**
- Interactive segmentation (user clicks + refines)
- Zero-shot segmentation (unseen object categories work)
- Video object tracking (SAM 2+)
- Data labeling automation (segment unlabeled images for annotation)
- Concept discovery (SAM 3: "find all instances of X" without labeling)

**Limits:**
- Not for semantic segmentation (which category? requires post-processing)
- Small object weakness (SAM struggles with fine details < 10 pixels)
- Prompt dependency (quality varies by prompt quality)
- Compute (inference slow on edge, better on GPU)
- Not for dense scene understanding (street scene with 50 objects needs 50 prompts)

---

## ZAO Fleet Context: Current State

From CLAUDE.md + memory (ZOL, ZOE, Ollama):

| Component | Model Type | Status | Role |
|-----------|-----------|--------|------|
| **ZOE orchestrator** | LLM (Sonnet/Haiku) | Live, production | Concierge, task decomposition, worker dispatch |
| **ZOL (@zolbot)** | LLM (Sonnet/Haiku via OpenRouter) | Live, autonomous posts | Farcaster agent, music scout persona |
| **Ollama on VPS** | SLM (llama3.1:8b) | Live, classification | Inbox labeling, entity first-pass, health checks |
| **Bonfire memory** | MLM (embeddings) | Dormant, RLS block | Knowledge graph recall, multi-corpus ingest |
| **ZOL Model Gateway** (mentioned in doc 1098, not yet read) | MoE routing | Planned | Route tasks to right model based on cost/capability |
| **Computer-use on VPS** | VLM (Claude vision) | Planned, research | Screenshot understanding for agents |
| **Pi edge inference** | SLM + MoE | Research | Fallback when cloud unreachable |

---

## Comparison Table: Model Type Cheat Sheet

| Model Type | Pipeline Unit | Params (typical) | Inference Cost | Best For | Worst For |
|-----------|---------------|------------------|-----------------|----------|-----------|
| **LLM** | Token | 7B-670B | $1-50/MTok | Generation, reasoning, chat | Fast retrieval, embedded devices |
| **LCM** | Sentence | 1.6B-7B | $0.20/MTok (est.) | Multilingual, cross-lingual zero-shot | Production maturity, fine-tuning |
| **LAM** | Action | N/A (composition) | $2-10/task (est.) | Computer automation, multi-step tasks | Single-turn queries, hallucination risk |
| **MoE** | Token (sparse) | 40B-670B total | $0.50-5/MTok | Reasoning + cost efficiency, scaling | Load balancing, inter-GPU sync |
| **VLM** | Image+text | 7B-130B | $2-20/image | Visual reasoning, document QA, GUI control | Fine-grained segmentation, edge deployment |
| **SLM** | Token | 1B-13B | $0.05-0.50/MTok | On-device, edge, cost (5-20x cheaper) | Frontier reasoning, large context |
| **MLM** | Sentence | 110M-335M | $0.001-0.01/embedding | Semantic search, clustering, reranking | Generation, long documents (>512 tokens) |
| **SAM** | Pixel mask | 600M-2B | $0.10-0.50/image | Interactive segmentation, zero-shot masking | Semantic segmentation, dense scenes |

---

## Cross-Reference: Which 8 Types Matter to ZAO Fleet?

### Verdict Matrix

| Type | Current Use | ZAO Relevance | Verdict | Reason |
|------|-------------|---------------|---------|--------|
| **LLM** | ZOE, ZOL core | Critical | **USE NOW** | Foundation: all dispatch, reasoning, concierge run on Claude/Haiku LLMs. No alternative. |
| **LCM** | None yet | Speculative | **MONITOR** | Multilingual community bridges (Apna, Crypto Factor AVAX, Berlin partners) may need cross-lingual zero-shot. v-LCM maturity = 2026, tooling immature. Watch for production harness. |
| **LAM** | None yet | Moderate | **BORROW PATTERN** | ZOL->ZOE chain + work-loop partially map to LAM decompose/plan/act. Don't build LAM; steal the decomposition pipeline (doc 759's Gap 1). |
| **MoE** | Router concept | High | **USE NOW** | ZOL Model Gateway (cost-aware routing, fallback to SLM on budget) = MoE pattern. Route tasks: Haiku for classification, Sonnet for reasoning, Opus for escalation. Same load-balancing challenge. |
| **VLM** | Pilot (computer-use) | High | **USE NOW** | /meeting frame extraction (Claude vision), agent GUI control (ZOL->clicks). Budget: $2-20/image; cap at 10 images/day per agent = $5-200/day (fits $50/day cap). |
| **SLM** | Ollama (llama3.1:8b) | Critical | **USE NOW** | Edge fallback (Pi, cost-aware routing), inbox label classification ($0 marginal), health checks. Phi-4/Gemma-4 = better baseline for fine-tuning to ZAO voice. |
| **MLM** | Bonfire embeddings | Critical | **USE NOW** | Bonfire corpus search, MemoryWeaver retrieval, semantic similarity (research docs, team members). BGE-M3 for multilingual graph. Bottleneck: RLS/labeling block, not missing. |
| **SAM** | None yet | Low | **NOT RELEVANT** | Pixel segmentation niche. No ZAO use case in roadmap (music video editing? low priority per doc 743 WaveWarZ). Flag honestly. |

---

## Analysis: Which 3 Matter Most to ZAO, and Why?

### Ranked by Impact x Imminence x Fit

**1. MoE (Mixture of Experts) - IMMEDIATE**

**Why:** ZOL Model Gateway (doc 1098) depends on it. Cost-aware model routing is the bottleneck to autonomous scale. Current state: dispatch routes to Sonnet for all tasks (expensive). With MoE thinking: route Haiku for classification/summarization, Sonnet for reasoning, Opus only for escalation + sensitive decisions. Unlocks 3-5x cost efficiency. Mimics DeepSeek-V3's sparse activation (top-K expert selection) but at model level: Haiku = cheap expert (many tasks), Sonnet = mid-expert, Opus = expert-of-last-resort. No new infrastructure needed; already have the models. Just formalize the router rules.

**Concrete action:** Doc 1098 finalize + add routing table (task type → model, cost budget). A/B test ZOE dispatch with/without MoE routing.

**2. SLM (Small Language Model) - IMMEDIATE to Q3**

**Why:** Edge fallback is the moat. ZAO's data (community, songs, documents) often sensitive; Ollama on Pi = zero cloud exposure. Current Ollama (llama3.1:8b) does classification OK but hallucinates on sourcing. Phi-4 (14B, synthetic data quality) would be better baseline. Also: SLMs enable on-device fine-tuning to ZAO voice (Phi-4 or Gemma-4 with ~10K examples of ZAO posts = custom model). Fallback when cloud budget exhausted (rule 5: $50/day cap). At $0.05/MTok, even 100M tokens/day = $5.

**Concrete action:** Test Phi-4 on Ollama (memory footprint, latency). If fits on Pi, stage as fallback. Plan fine-tuning run: 10K examples of /socials posts (Zaal, Iman, team) → Phi-4 lora adapter (ZAO voice model).

**3. VLM (Vision Language Model) - Q3 to Q4**

**Why:** Computer-use for agents is the frontier. ZOL eventually needs to screenshot a website, understand the layout, and click/type (LAM pattern). Claude Opus 4.7 vision = best-in-class for GUI control. But cost: ~$2-20/image. Budget: cap at 1 image/hour per agent = ~24/day = $50-480/day (overlaps Sonnet budget). Need to be surgical. VLMs also unlock /meeting frame extraction (keynote slides → speaker name + quote). Opportunity: SAM 3 for video (detect speaker on frame) + VLM (read speaker's name), then route to Bonfire. But that's Q4.

**Concrete action:** Wire Claude vision into ZOL's screenshot path (one-off for testing). Measure real cost on 100 agents x 5 screenshots/day. Decide: worth the budget trade-off vs pure text-based understanding?

---

## What We are NOT Doing (Honestly)

- **SAM 3:** Niche play. Pixel segmentation doesn't unlock revenue or autonomy for ZAO. WaveWarZ editor (doc 743) is parked; no music video pipeline yet. Flag for future, but low priority.
- **LCM (Large Concept Models):** Neat research, but ecosystem immature (2026 tooling not production-ready). Multilingual is nice-to-have; English + Spanish (SONAR native) covers 90% of ZAO community. Revisit 2027 if v-LCM shipping on Claude API.
- **Direct LAM build:** Don't build a LAM orchestrator (Rabbit-style). Instead, borrow the mental model (perceive → decompose → plan → act) and fold it into ZOE's workers (Gap 1 decomposition is conceptually LAM-ish already).

---

## Appendix: 2026 Model Landscape Shifts

**2025-2026 Realizations (from web research):**

1. **MoE is standard, not exotic.** GPT-4, Mixtral, DeepSeek-V3, Qwen all MoE. Frontier = sparse activation. Implications: assuming dense params = hallucinating. ZOL's router must think MoE-style (top-K experts).

2. **SLMs are production.** Phi-4 rivals Llama-70B on reasoning. Gemma-4 does text+image+audio+video in 12B. Not toys anymore. Edge deployment in Taiwan manufacturing up 3x (2025-26). ZAO should bet on on-device fallback.

3. **LCM is the dark horse.** Meta betting hard (v-LCM + v-Sonar ecosystem). Concept-space = language-agnostic reasoning. If multilingual crew grows (Berlin, Apna, AVAX), LCM is sleeper play. Monitor, don't adopt yet.

4. **VLM ≈ commodity.** GPT-4o, Claude Opus 4.7, Qwen2.5-VL all competitive on MMMU, OCR, DocVQA. Price war = all <$1 per image now. Adoption barrier = just integration (add vision encoder), not capability.

5. **LAM = agent pattern.** Not a specific model type, but an architecture (perception→decompose→plan→act). Rabbit's DLAM (computer controller) + OpenClaw (action toolkit) are concrete implementations. ZAO's ZOE workers already do this (Gap 1 decompose, Gap 2 dispatch). Borrow naming + formalize the pattern.

---

## Sources & References

Research data:
- [Meta Large Concept Models research](https://ai.meta.com/research/publications/large-concept-models-language-modeling-in-a-sentence-representation-space/)
- [Rabbit R1 LAM updates 2026](https://www.rabbit.tech/blog/first-major-update-of-2026-dlam-openclaw-and-a-surprise)
- [MoE Architecture 2026 field guide](https://tensorops.ai/blog/what-is-mixture-of-experts-llm)
- [Top Vision Language Models 2026](https://www.datacamp.com/blog/top-vision-language-models)
- [Small Language Models 2026 edge guide](https://zenvanriel.com/ai-engineer-blog/small-language-models-edge-ai-deployment-guide/)
- [MLM and embeddings in 2026](https://futureagi.com/blog/best-embedding-models-2025/)
- [SAM 3 concept segmentation](https://ai.meta.com/research/sam3/)
- [LLM tokenization 2026 deep dive](https://futureagi.com/blog/what-is-tokenization-llms-2026/)

ZAO internal:
- [CLAUDE.md](../../CLAUDE.md) - stack, agent fleet, Primary Surfaces
- Memory: project_zol_farcaster_agent, project_zoe_orchestrator_locked, project_ollama_local_llm
- Doc 759 - ZOE orchestrator gaps (reference for LAM/decomposition pattern)
- Doc 1098 - ZOL Model Gateway (cost-aware routing, MoE pattern)
- Doc 743 - WaveWarZ canonical positioning

---

## Next Actions

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Finalize ZOL Model Gateway routing table (Haiku/Sonnet/Opus by task type + cost) | Zaal + engineering | 2026-07-23 | Blocked on doc 1098 review |
| Test Phi-4 on Ollama (memory, latency, quality on classification) | Engineering | 2026-07-30 | Queued |
| A/B test ZOE dispatch with MoE routing (vs. current all-Sonnet) | ZOE ops | 2026-08-06 | Plan spec needed |
| Wire Claude vision into ZOL screenshot path (pilot, 10 screenshots/day) | Engineering | 2026-08-13 | Depends on budget approval |
| Monitor LCM ecosystem maturity (v-LCM production readiness, tooling) | Research | 2026-09-01 | Quarterly review |
| Close SAM gap (document: niche, deprioritized vs. WaveWarZ roadmap) | Zaal | 2026-07-20 | Feedback needed |

---

## Summary: One-Line Best-At for Each 8

1. **LLM:** Long-form generation + multi-turn reasoning at human level
2. **LCM:** Multilingual zero-shot generalization in unified concept space
3. **LAM:** Multi-step computer automation (perceive → decompose → act)
4. **MoE:** Cost-efficient frontier reasoning via sparse expert routing
5. **VLM:** Visual reasoning + GUI control + document QA
6. **SLM:** Edge deployment + on-device inference at 5-20x cost savings
7. **MLM:** Semantic search + clustering via bidirectional embeddings
8. **SAM:** Interactive pixel-level segmentation from prompts

**Top 3 for ZAO:** MoE (routing optimization) + SLM (edge fallback) + VLM (computer-use agents). Together they unblock cost-aware, resilient, autonomous scaling.
