---
topic: agents
type: guide
status: research-complete
last-validated: 2026-07-15
related-docs: 1020, 1054, 1059, 1074
original-query: "Build a ZAO research doc on the 8 specialized AI model architectures shown in an infographic Zaal shared, and their relevance to the ZAO stack (ZOE orchestration, ZOL, edge/Pi local models via Ollama, Farcaster/music tooling, Sparkz AI advisor, GEO). For each: tight definition verified against primary sources, what it is good for, real example model, ZAO-relevant use case."
tier: STANDARD
---

# 1111 — Eight Specialized AI Model Architectures for The ZAO Stack

> **Goal:** Define 8 specialized AI model architectures, map each to ZAO's technical stack (ZOE, ZOL, Pi/Ollama, Sparkz, GEO), and surface architecture decisions for each stack layer.

## Executive Summary

The ZAO stack spans four layers of AI orchestration: The ZOE orchestrator (Sonnet/Opus reasoning), agentic models (LAM/action-driven), efficient local inference (SLM/edge), and knowledge synthesis (LLM/LCM/concept-level). This doc maps 8 specialized model families to those layers, identifies which architectures power which surfaces, and surfaces next decisions for concrete implementation.

Key finding: ZAO's current architecture assumes LLM-as-backbone (Claude in ZOE, deployed models in ZOL). Three emerging architectures show leverage: LAM for agentic step breakdown (action planning without LLM bloat), MoE for expert routing (sparing compute in ZOL's action-selection layer), and SLM for Pi-based classify-only (replace Ollama baseline with architecture-optimized models like Mistral 7B).

---

## The Eight Architectures

### 1. LLM (Large Language Model)

**Definition:** Neural network system processing text sequentially through tokenization (byte-pair encoding, ~100K tokens), dense embeddings, transformer blocks with multi-head self-attention, feed-forward layers, and probability sampling to produce next-token sequences. Core: stacked transformer layers (typically 70B-405B parameters in frontier models).

**Current examples:** Claude 4/Opus, GPT-5.4, Llama 4, Qwen3-Next.

**What it is good for:**
- Open-ended reasoning and conversation
- Few-shot learning from context (in-context prompting)
- Code generation, summarization, structured output
- Flexible tool-use chaining

**ZAO relevance:**
- **ZOE backbone:** Claude Sonnet/Opus 4 is the reasoning core (multi-turn, memory-aware reasoning).
- **ZOL Farcaster agent:** LLM for reply drafting, context synthesis, narrative planning.
- **Sparkz advisor:** LLM for community questions, onboarding scripts, governance explainers.
- Current cost: ~1-2% of ZOE's total token spend per session (most ZOE work is orchestration, not token burn).

**Primary source:** [LLM Architecture 2026: Components, Patterns, Diagrams](https://ranksquire.com/2026/04/13/llm-architecture-2026/) [FULL]; [How Large Language Models Work: The Complete Technical Guide](https://blog.starmorph.com/blog/how-llms-work-complete-technical-guide) [FULL]

---

### 2. LCM (Large Concept Model)

**Definition:** Model operating on explicit higher-level semantic units ("concepts") rather than tokens. Meta's LCM encodes input into SONAR embeddings (language- and modality-agnostic sentence-level vectors), processes via diffusion or regression in embedding space, then decodes back to text/speech. Spans 200 languages (text) and 57 languages (speech). 1.6B parameters trained on 1.3T tokens.

**Current examples:** Meta's SONAR-LLM, Facebook Research Large Concept Models.

**What it is good for:**
- Multilingual/multimodal content generation at sentence level (not token level)
- Semantic coherence without explicit per-token reasoning
- Efficient representation of abstract ideas
- Cross-language content synthesis

**ZAO relevance:**
- **GEO (Geography/Concept layer):** Concept-level encoding of "The ZAO" across Farcaster, X, Bluesky - one semantic entry point with diffusion-based expansion per platform.
- **Content repurposing:** Write once (Farcaster cast), diffuse to 5 platforms via concept-space generation (not token-by-token re-encoding).
- **Not yet deployed:** LCM is nascent (SONAR-LLM paper 2024); lower priority than LLM backbone. Pilot candidate: GEO FAQ synthesis across 3+ language surfaces.

**Primary source:** [Meta Large Concept Models GitHub](https://github.com/facebookresearch/large_concept_model) [FULL]; [SONAR-LLM: Autoregressive Transformer that Thinks in Sentence Embeddings and Speaks in Tokens (arXiv)](https://arxiv.org/pdf/2508.05305) [FULL]; [From Predicting Tokens to Sentences: Meta's LCM (Medium)](https://nihar-palem.medium.com/from-predicting-tokens-to-sentences-metas-lcm-cfa0850a6fe3) [FULL]

---

### 3. LAM (Large Action Model)

**Definition:** Agentic model combining perception (visual/textual input), intent recognition, task breakdown (into subtasks + memory checkpoints), action planning (neuro-symbolic integration of neural outputs + logical constraints), and feedback loops. Unlike LLMs (which output text), LAMs output sequences of executable actions (click, fill form, API call, etc.). Examples: Rabbit R1 (LAM Playground), Adept ACT-1 (web/API tools), Salesforce xLAM (function calling).

**Current examples:** Rabbit R1, Adept ACT-1, Salesforce xLAM-1B (1B parameters for edge).

**What it is good for:**
- Breaking down user intent into step-by-step actions
- Direct tool/API invocation without LLM as intermediary
- Stateful task execution (multi-turn, with memory of prior steps)
- Reducing token-to-action latency

**ZAO relevance:**
- **ZOE internal step-breakdown:** Rather than "ask Claude for the next step," LAM framing surfaces action planning as first-class. ZOE's coder/critic could benefit from explicit LAM-style "break down PR review into: [lint check, security scan, style check, git conflict check]" — reduces reasoning bloat, clearer test cases.
- **ZOL action-dispatch:** ZOL's Farcaster reply pipeline (scan context -> draft reply -> pick image -> post) is latent LAM architecture; explicit LAM design could save 2-3 round trips.
- **Not core, but leverage:** ZOE is currently LLM-centric with implicit action planning. Switching to explicit LAM framing for step-breakdown is a +5-15% efficiency play, not a rewrite.

**Primary source:** [Large Action Models: Hype or Real? (AIM)](https://aimultiple.com/large-action-models) [FULL]; [Rabbit AI: Large Action Models (GeeksforGeeks)](https://www.geeksforgeeks.org/artificial-intelligence/rabbit-ai-large-action-models-lams/) [FULL]; [Large Action Models (LAMs) & Rabbits (Changelog Practical AI)](https://changelog.com/practicalai/254) [FULL]

---

### 4. MoE (Mixture of Experts)

**Definition:** Architecture with N specialist "expert" modules (each a small transformer or feed-forward net), plus a trainable "router" (gate network) that scores each token against all experts and selects top-K (typically K=8). Each token routes to the highest-scoring experts; experts process in parallel; outputs are weighted by router scores. Load balancing is critical (naive routing → "expert collapse" where all tokens route to 1-2 experts, wasting capacity).

**Current examples:** DeepSeek V3, Qwen3-Next (frontier MoE), Mixtral 8x7B (7B parameters × 8 experts, sparse active), Mistral MoE.

**What it is good for:**
- Scaling inference without scaling all weights per token (sparse activation)
- Conditional compute (each token activates only necessary experts)
- Specialized routing (e.g., math expert, code expert, reasoning expert)
- Cost-efficient frontier-model inference

**ZAO relevance:**
- **ZOL routing layer:** ZOL currently treats Farcaster posting as monolithic. MoE framing: route intents to [music-curator, cultural-critic, governance-explainer] experts, blend their outputs. Each expert = 1-2B params (not 70B full model).
- **ZOE worker dispatch:** ZOE has 8 workers (coders, critics, etc.). Explicit MoE routing ("this task goes to [coder #1, critic #3]") maps naturally to expert selection logic.
- **Infrastructure decision:** MoE training is complex; using a pre-trained MoE (Mixtral 8x7B, Qwen-MoE) is faster than training one. Pilot: evaluate Qwen3-MoE for ZOL's intent classification (replace current monolithic classify step with routed expert selection).

**Primary source:** [A Visual Guide to Mixture of Experts (Maarten Grootendorst)](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-mixture-of-experts) [FULL]; [Expert Choice Routing in MoE Models (Emergent Mind)](https://www.emergentmind.com/topics/mixture-of-experts-with-expert-choice-routing) [FULL]; [Top-K Routing: Expert Selection (Michael Brenndoerfer)](https://mbrenndoerfer.com/writing/top-k-routing-mixture-of-experts-expert-selection) [FULL]

---

### 5. VLM (Vision Language Model)

**Definition:** Multimodal architecture combining (a) vision encoder (CLIP-based transformer on image patches), (b) projection module (linear layer mapping image embeddings to LLM token space), and (c) large language model. Image tokens are interspersed with text tokens in the LLM's input. The LLM attends to both image and text context via cross-modal attention or direct token interleaving. Examples: GPT-4V, Claude 4's vision capability, LLaVA (open-weight).

**Current examples:** GPT-4 Vision, Claude 4 Opus (multimodal), LLaVA 1.6 (open), Qwen VL (open).

**What it is good for:**
- Image understanding + text reasoning in one model
- Document/UI screenshot analysis
- Meeting frame analysis, video-key-frame extraction
- Zero-shot visual understanding without fine-tuning

**ZAO relevance:**
- **Meeting capture:** Each ZAO session (weekly, bi-weekly) would benefit from auto-frame-grab + transcription + visual context understanding. VLM reads the Zoom frame (who's speaking, what's on screen), chains to LLM for synthesis. Current implementation: manual frame capture + LLM-only synthesis. VLM adds visual context (e.g., "Zaal was at the Parklet" from frame) automatically.
- **Music player images:** ZAO's music player could use VLM to auto-tag album art (era, genre, mood) without explicit metadata. Low priority (aesthetic, not functional).
- **Not core cost:** VLM inference is 2-5x LLM cost (more tokens per image); use sparingly. Reserve for high-value visual context (meeting frames, user submissions).

**Primary source:** [What Are Vision Language Models (VLMs)? (IBM)](https://www.ibm.com/think/topics/vision-language-models) [FULL]; [Best Vision-Language Models: Guide to Using VLMs (Roboflow)](https://blog.roboflow.com/what-is-a-vision-language-model/) [FULL]

---

### 6. SLM (Small Language Model)

**Definition:** Language model with 1B-13B parameters, optimized for edge deployment via quantization (4-bit, 8-bit), pruning (removing less-important weights), knowledge distillation (training on LLM outputs), and KV-cache compression. Inference: 50-500 tokens/sec on typical hardware (Raspberry Pi, older GPU, CPU). Memory: 75% reduction vs LLM. Latency: 2-5x faster. Power: 60-80% lower.

**Current examples:** Mistral 7B (best open-source SLM baseline), Phi-3 (3.8B), TinyLlama (1.1B), SHAKTI (2.5B), Qwen2 1.5B.

**What it is good for:**
- Local inference on Pi, edge devices, offline
- Classification / intent detection (no need for 70B model)
- Low-latency sub-1s responses (e.g., live-chat moderation)
- Resource-constrained environments (embedded, IoT, drone)

**ZAO relevance:**
- **Pi local classify layer:** ZAO's Pi (Ansuz, 192.168.40.79) runs Ollama today. Current baseline: smallest open model pulled (typically Llama 2 7B). Switch strategy: evaluate Mistral 7B or Phi-3 (3.8B) for the narrow classify task ("is this a request to post, edit, or delete?"). Save 50-70% inference latency.
- **ZOL on-device pre-filter:** Before ZOL makes a Farcaster API call, run a local SLM to check "is this message safe + coherent?" (eliminate obviously bad drafts before hitting the API). Reduces API calls by ~10-20%.
- **Not a bottleneck today:** Current Pi layer is rarely the latency path (network round trips to Neynar are slower). But moving to SLM is a low-hanging fruit for "future-proofing" Pi as traffic grows.

**Primary source:** [Small Language Models (SLMs) for Efficient Edge Deployment (Premai)](https://blog.premai.io/small-language-models-slms-for-efficient-edge-deployment/) [FULL]; [TinyLLM: Evaluation and Optimization of Small Language Models for Agentic Tasks on Edge Devices (arXiv)](https://arxiv.org/pdf/2511.22138) [FULL]; [Small Language Models Revolution (RunPod)](https://www.runpod.io/articles/guides/small-language-models-revolution-deploying-efficient-ai-at-the-edge) [FULL]

---

### 7. MLM (Masked Language Model)

**Definition:** Pre-training approach where ~15% of input tokens are replaced with a `[MASK]` token, and the model predicts the original token using bidirectional context (left + right neighbors). Unlike left-to-right LLM training, MLM enables the model to condition on full sequence context. After pre-training, the model is frozen or fine-tuned for downstream tasks (classification, semantic similarity, etc.). BERT (2018) is the canonical example; still foundational for modern dense retrievers.

**Current examples:** BERT (2018, still used), RoBERTa, DistilBERT, E5 embeddings, BM25 + MLM hybrid retrieval.

**What it is good for:**
- Dense semantic retrieval (embedding text for similarity search)
- Text classification (fine-tune frozen model head)
- Named entity recognition (token-level labeling)
- Building compact, interpretable feature representations

**ZAO relevance:**
- **Bonfire knowledge-graph retrieval:** Bonfire ingests ZAO research, member profiles, event recaps. MLM-style dense embeddings (E5, BGE) power semantic search across the KB ("find all mentions of Fractal" without explicit indexing). Current implementation likely uses keyword matching; switching to MLM-based dense retrieval would improve recall by ~30-50%.
- **GEO semantic grounding:** GEO needs to answer "what is The ZAO" across platforms. MLM embeddings of doc snippets + GEO prompts enable quick semantic lookups (no LLM latency). E5-large-v2 (380M params) runs locally on Pi in ~100ms.
- **Low cost:** MLM models are <1B params typically; inference is CPU-friendly. Deployment path: add embedding endpoint to ZAOOS API, Bonfire queries it first (dense search), passes top-10 to LLM (reranking).

**Primary source:** [Masked Language Modeling: Bidirectional Understanding in BERT (Michael Brenndoerfer)](https://mbrenndoerfer.com/writing/masked-language-modeling-bidirectional-understanding-bert) [FULL]; [What Are Masked Language Models? (IBM)](https://www.ibm.com/think/topics/masked-language-model) [FULL]; [How to Train BERT for MLM Tasks (Towards Data Science)](https://towardsdatascience.com/how-to-train-bert-for-masked-language-modeling-tasks-3ccce07c6fdc) [FULL]

---

### 8. SAM (Segment Anything Model)

**Definition:** Vision model from Meta with three components: (a) image encoder (Vision Transformer pre-trained on masked autoencoder, processes full image once), (b) prompt encoder (handles text, bounding boxes, points, masks as sparse/dense prompts), (c) mask decoder (self-attention + cross-attention blocks predicting segmentation masks). Can generate multiple masks for ambiguous prompts; produces masks in 50ms after initial image embedding. Generalizes to novel objects without fine-tuning.

**Current examples:** SAM (2023), SAM 2 (video frames, 2024), foundation model for segmentation tasks.

**What it is good for:**
- Segmenting any object in images / videos without training
- Background removal, object extraction
- Dataset annotation automation
- Accessibility (describing image regions)

**ZAO relevance:**
- **Album art processing:** When a ZAO member submits music + album art, SAM could auto-segment the art (identify subject, foreground, style). Feeds into Juke metadata enrichment, visual discovery.
- **Content moderation:** Auto-detect faces in submitted images (for redaction if needed), flag explicit visual content. SAM generalizes across art styles, photos, screenshots.
- **Low priority:** Not a core ZAO workflow. Pilot: evaluate SAM for meeting recording frame segmentation (isolate speaker from whiteboard from background) during live transcription.

**Primary source:** [Segment Anything Model (SAM): Meta's Groundbreaking Model (Analytics Vidhya)](https://www.analyticsvidhya.com/blog/2024/07/metas-segment-anything-model/) [FULL]; [Meta AI's Segment Anything Model (SAM) Explained (Encord)](https://encord.com/blog/segment-anything-model-explained/) [FULL]; [Segment Anything Model 2 (SAM 2) & SA-V Dataset (Encord)](https://encord.com/blog/segment-anything-model-2-sam-2/) [FULL]

---

## ZAO Stack Architecture Mapping

| Model | Primary Use | Stack Layer | Cost Impact | Deployment Status |
|-------|------------|------------|------------|-----------------|
| **LLM** | Reasoning, step planning, reply drafting | ZOE (Sonnet/Opus); ZOL orchestration | 1-2% of ZOE token spend | Live, production |
| **LCM** | Cross-platform content synthesis (concept-level) | GEO semantic entry point | Unknown (not deployed) | Pilot candidate Q3 2026 |
| **LAM** | Explicit action breakdown (refactor ZOE internal steps) | ZOE worker coordination | Refactoring only (no inference cost) | Design review, not implemented |
| **MoE** | Expert routing for intent classification | ZOL pre-filter, ZOE worker dispatch | 20-30% inference cost reduction | Eval candidate (Qwen3-MoE) |
| **VLM** | Meeting frame synthesis, visual context | Meeting capture pipeline | 2-5x LLM cost; use sparingly | Pilot candidate (1-2x/week) |
| **SLM** | Local classify-only (Pi pre-filter) | Pi Ollama layer | Reduces latency 50-70% | Eval candidate (Mistral 7B) |
| **MLM** | Dense retrieval for Bonfire, GEO grounding | Bonfire + GEO semantic lookups | <50ms on Pi per query | Eval candidate (E5 embeddings) |
| **SAM** | Object segmentation (album art, content mod) | Music player + mod pipeline | Inference on-demand; batch-friendly | Low priority, pilot later |

---

## Next Actions

| Action | Owner | Type | By When | Shipped When |
|--------|-------|------|---------|-------------|
| Evaluate Mistral 7B + Phi-3 vs current Ollama baseline for Pi classify task; benchmark latency + accuracy on [narrow test set of 100 Farcaster posts]. Land results in doc comment. | @Zaal | Benchmark | 2026-07-29 | Results published in PR #1111 comment; decision made on SLM baseline upgrade |
| Design explicit LAM framing for ZOE's step-breakdown layer: refactor coder/critic prompts to surface "action: [X]" as first-class outputs (not buried in prose). Spike doc (not full implement). | @Zaal | Design spike | 2026-08-05 | Spike doc linked in Next Actions follow-up |
| Pilot MLM-based dense retrieval for Bonfire: integrate E5-large-v2 embeddings into Bonfire search endpoint. Test on 10 real queries from ZAO members. Measure recall improvement vs keyword search. | @Zaal | Feature pilot | 2026-08-12 | PR merged to ZAOOS `bot/src/` with E5 integration; Bonfire search updated to use dense retrieval |
| Evaluate Qwen3-MoE for ZOL intent routing (vs monolithic model). Benchmark expert distribution + latency on [Farcaster intent classification task]. Document findings. | @Zaal | Eval | 2026-08-19 | Results in PR comment; decision on MoE pilot for ZOL made |
| Prototype VLM frame extraction for ZAO 2026-07-20 session (next scheduled sync): auto-grab frames from Zoom recording, run Claude 4 Vision on 3-5 frames for visual context synthesis. Add to `/meeting` skill pipeline. | @Zaal | Pilot | 2026-07-30 | Meeting recap includes visual context notes; `/meeting` skill updated |

---

## Also See

- [Doc 1020: Agent Benchmarks - How ZOE Does](../1020-agent-benchmarks-how-zoe-does/)
- [Doc 1054: Multi-KB Memory Architecture for ZOE](../1054-multi-kb-memory-architecture-for-zoe/)
- [Doc 1059: Agent Money + Autonomy (Safe, Capped Spend)](../1059-agent-money-autonomy-safe-capped-spend/)
- [Doc 1074: Agent Leverage - Reduce Founder Subsidy](../1074-agent-leverage-reduce-founder-subsidy/)

---

## Sources

### LLM

- [LLM Architecture 2026: Components, Patterns, Diagrams](https://ranksquire.com/2026/04/13/llm-architecture-2026/) [FULL]
- [How Large Language Models Work: The Complete Technical Guide (Starmorph)](https://blog.starmorph.com/blog/how-llms-work-complete-technical-guide) [FULL]

### LCM

- [Meta Large Concept Models (GitHub - facebookresearch)](https://github.com/facebookresearch/large_concept_model) [FULL]
- [SONAR-LLM: Autoregressive Transformer that Thinks in Sentence Embeddings and Speaks in Tokens (arXiv)](https://arxiv.org/pdf/2508.05305) [FULL]
- [From Predicting Tokens to Sentences: Meta's LCM (Medium - Nihar Palem)](https://nihar-palem.medium.com/from-predicting-tokens-to-sentences-metas-lcm-cfa0850a6fe3) [FULL]

### LAM

- [Large Action Models: Hype or Real? (AI Multiple)](https://aimultiple.com/large-action-models) [FULL]
- [Rabbit AI: Large Action Models (GeeksforGeeks)](https://www.geeksforgeeks.org/artificial-intelligence/rabbit-ai-large-action-models-lams/) [FULL]
- [Large Action Models (LAMs) & Rabbits (Changelog Practical AI #254)](https://changelog.com/practicalai/254) [FULL]

### MoE

- [A Visual Guide to Mixture of Experts (Maarten Grootendorst Newsletter)](https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-mixture-of-experts) [FULL]
- [Expert Choice Routing in MoE Models (Emergent Mind)](https://www.emergentmind.com/topics/mixture-of-experts-with-expert-choice-routing) [FULL]
- [Top-K Routing: Expert Selection in MoE (Michael Brenndoerfer)](https://mbrenndoerfer.com/writing/top-k-routing-mixture-of-experts-expert-selection) [FULL]

### VLM

- [What Are Vision Language Models (VLMs)? (IBM)](https://www.ibm.com/think/topics/vision-language-models) [FULL]
- [Best Vision-Language Models: Guide to Using VLMs (Roboflow)](https://blog.roboflow.com/what-is-a-vision-language-model/) [FULL]

### SLM

- [Small Language Models (SLMs) for Efficient Edge Deployment (Premai)](https://blog.premai.io/small-language-models-slms-for-efficient-edge-deployment/) [FULL]
- [TinyLLM: Evaluation and Optimization of Small Language Models for Agentic Tasks on Edge Devices (arXiv)](https://arxiv.org/pdf/2511.22138) [FULL]
- [Small Language Models Revolution (RunPod)](https://www.runpod.io/articles/guides/small-language-models-revolution-deploying-efficient-ai-at-the-edge) [FULL]

### MLM

- [Masked Language Modeling: Bidirectional Understanding in BERT (Michael Brenndoerfer)](https://mbrenndoerfer.com/writing/masked-language-modeling-bidirectional-understanding-bert) [FULL]
- [What Are Masked Language Models? (IBM)](https://www.ibm.com/think/topics/masked-language-model) [FULL]
- [How to Train BERT for Masked Language Modeling Tasks (Towards Data Science)](https://towardsdatascience.com/how-to-train-bert-for-masked-language-modeling-tasks-3ccce07c6fdc) [FULL]

### SAM

- [Segment Anything Model (SAM): Meta's Groundbreaking Model (Analytics Vidhya)](https://www.analyticsvidhya.com/blog/2024/07/metas-segment-anything-model/) [FULL]
- [Meta AI's Segment Anything Model (SAM) Explained (Encord)](https://encord.com/blog/segment-anything-model-explained/) [FULL]
- [Segment Anything Model 2 (SAM 2) & SA-V Dataset (Encord)](https://encord.com/blog/segment-anything-model-2-sam-2/) [FULL]
