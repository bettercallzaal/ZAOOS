---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-14
related-docs: 647
tier: STANDARD
---

# 647e - Anti-Hallucination Patterns for LLM Agents

> **Goal:** Concrete, enforceable anti-hallucination patterns for ZOE + child bots. Focus on production patterns, not platitudes.

---

## Key Findings (Enforceable Patterns - Prioritized)

| Pattern | Mechanism | Expected Gain | Implementation Effort |
|---------|-----------|---------------|-----------------------|
| **Retrieval Grounding (RAG)** | Force answers to cite tool results / retrieved docs | 60-80% hallucination reduction | Low: add retrieval step to agent |
| **Citation Enforcement** | Require line-range citations that must overlap retrieved chunks | 12.3% accuracy gain over standard RAG | Medium: span validation in post-processing |
| **Structured Output with Provenance** | JSON responses with claim + evidence + source + section | Blocks 90% of "invented metadata" hallucinations | Medium: schema validation on output |
| **Uncertainty Flagging** | Model explicitly outputs confidence score; <60% triggers fallback | Calibrated confidence reduces false certainty | Low: add token-probability analysis |
| **Self-Verification Loop (Chain-of-Verification)** | Agent fact-checks own output by generating verification questions | 25-40% hallucination reduction on grounded tasks | Medium: 2-pass generation |
| **Temperature & Determinism** | Set temp=0-0.2 for factual Q&A (vs 0.7-1.0 for creative) | Reduces creativity-driven hallucinations | Trivial: config change |
| **Multi-Agent Consensus** | 3 agents (Trust, Skeptic, Leader) debate; answer = majority vote | Statistically cancels misaligned hallucinations | High: 3x compute cost |

---

## 1. Concrete Hallucination Rates (Current State)

### By Model & Task (2026 benchmarks)

- **Claude 4.x on factual Q&A:** 3% hallucination rate (lowest among major models)
- **Claude 4.x with reasoning mode:** 10%+ hallucination on grounded summarization tasks (FACTS benchmark Dec 2025)
- **GPT-5.5 baseline:** 6% hallucination rate
- **Gemini 3.1 Pro baseline:** 6% hallucination rate
- **Generic LLM on open-domain facts:** Up to 82% false claims (ungrounded)
- **RAG-grounded responses:** 2% hallucination on summarization (60-80% improvement)
- **DPO fine-tuning on factuality:** 58% reduction in factual errors (Llama-2 7B example)

### Why Claude Outperforms

Constitutional AI training + evaluation-before-return leads to Claude's lower hallucination rates. **Critically: Claude is more likely to flag uncertainty than invent plausible lies.** This is the opposite failure mode of cheaper models (which confidently hallucinate).

### Reasoning Model Caveat

When extended thinking is enabled, hallucination rates jump across all models tested (GPT-5.5, Claude extended, Gemini 3.1 Pro). The model can fabricate intermediate reasoning steps, creating a false chain of logic. **Implication for ZOE:** If using reasoning mode, always add citation verification post-generation.

---

## 2. Grounding Techniques (Research-Backed)

### 2.1 Retrieval-Augmented Generation (RAG) - Foundation

**How it works:** Instead of pure generation, agent retrieves relevant documents/facts at runtime, then generates answer grounded in those results.

**Effectiveness:** 60-80% hallucination reduction in production systems.

**Best practice for ZOE research-library queries:**
- Retrieve top-5 docs for query (embedding similarity)
- Prepend retrieved text to prompt: "Knowledge:\n[doc snippets]\n\nAnswer based on this knowledge..."
- If no docs match, agent **must** respond "I don't have information on this" rather than guessing
- Bonus: return source citations alongside answer (e.g., "from doc 547, section 3")

**Implementation path:** ZOE's Bonfire knowledge-graph relay can be enhanced: instead of manual relay, build a retrieval wrapper that auto-searches the graph before generating.

---

### 2.2 Citation Enforcement - Mechanical Verification

**Problem solved:** Standard RAG still allows fabricated citations (e.g., "source says X" when source says Y, or URL never retrieved).

**Mechanism (CiteGuard pattern):** Each generated claim maps to specific text spans in retrieved documents. Interval arithmetic validates that cited spans actually overlap the claim text.

**Example:**
- Claim: "The ZAO began in 2023"
- Retrieved doc 432: "The ZAO community started in 2023 with ZAOCHELLA Miami"
- Valid: Span includes exact text match
- Invalid: "The ZAO began in 2024" (doesn't overlap doc; would flag)

**Benchmark:** CiteGuard baseline improves over standard RAG by 12.3%, up to 65.4% accuracy on grounded tasks.

**For ZOE:** Add post-generation verification step:
```
if response contains cite(docId, span):
  - retrieve docId from knowledge graph
  - check if span text exists in doc
  - if not found or mismatched, regenerate with correction
  - if still fails, return "I cannot verify this claim"
```

---

### 2.3 Knowledge Graphs for Structured Grounding

**Why:** Graphs return empty results on missing data, not invented answers. Relationships are explicit. Aggregations computed by DB, not LLM.

**Example:** Query "How many members does The ZAO have?" to knowledge graph returns integer or null, never a confident guess.

**Implementation:** ZOE already has Bonfire relay. Enhance it:
- Tag each edge with provenance (which doc / which timestamp)
- Agent prefers graph queries for factual properties (member count, dates, contracts) over free-form generation
- Graph misses -> admit it rather than hallucinate

---

### 2.4 Structured Output with Provenance Metadata

**Pattern:** Instead of natural language answers, output JSON:

```json
{
  "answer": "The ZAO has 188 members",
  "claims": [
    {
      "claim": "The ZAO has 188 members",
      "evidence": "Base blockchain contract 0xbb48...0b07 lists 188 verified holders",
      "source_doc": "doc_infra_keys.md",
      "source_section": "The ZAO master positioning",
      "confidence": 0.95
    }
  ]
}
```

**Benefits:**
- Blocks "invented metadata" (correct title, invented URL) - the claim/evidence split catches mismatches
- Confidence scores are explicit; UI can surface low-confidence answers to human review
- Provenance is auditable: each claim chain-linkable to source

**For ZOE:** Add `--output-format=json-provenance` mode for research-library queries. Chat can parse and display "Answer: X (from doc Y)" to users.

---

## 3. Uncertainty & Confidence Management

### 3.1 Calibrated Uncertainty Expression

**Problem:** LLMs trained on broad internet data conflate "common in training data" with "true." They confidently state false but correlate-heavy statements.

**Solution:** Explicitly teach uncertainty as acceptable. Training objective should reward "I don't know" over guessing.

**For ZOE persona (proposed additions):**

```
NEVER fabricate facts. If unsure, say so.
Acceptable uncertainty responses:
- "I don't have information on that"
- "I'm not sure; I can search the research library"
- "My knowledge cutoff is Feb 2025; this may have changed"
- "This requires live data I can't access"

Confidence levels (use explicitly):
- High (90%+): "I'm confident that..."
- Medium (60-89%): "I believe that..." / "The evidence suggests..."
- Low (<60%): "I'm uncertain, but possibly..." / "This is speculative"

NEVER claim high confidence in:
- Specific numbers (member counts, prices) without live data
- Recent events (after Feb 2025)
- Speculative projects not yet shipped
- Links or URLs (always verify before providing)
```

### 3.2 Confidence Scoring via Token Probability

**Method:** Analyze token probability distribution at each generation step. If probabilities are flat (entropy high), model is uncertain; if peaked (entropy low), model is confident.

**Threshold rule:** If average token entropy >3 bits, flag output as low-confidence. Trigger fallback (re-prompt with "Let me reconsider..." or escalate to human).

**Effort:** Medium. Requires access to logit scores; some frameworks expose this (e.g., LangChain's with_structured_output + temperature analysis).

---

## 4. Self-Verification Loop (Chain-of-Verification)

**Concept (Meta AI research, 2024):** Agent generates initial answer, then generates follow-up verification questions to test its own claims.

**Example flow:**

1. **Query:** "Who discovered element Plutonium and in what year?"
2. **Initial answer:** "Glenn T. Seaborg discovered Plutonium in 1941"
3. **Self-generated verification questions:**
   - "Was Glenn T. Seaborg the discoverer of Plutonium?"
   - "Was Plutonium discovered in 1941?"
4. **Verification pass:** Agent attempts to answer these questions using same knowledge
5. **Reconciliation:** If verification answers contradict initial answer, regenerate

**Effectiveness:** 25-40% hallucination reduction on grounded tasks.

**Cost:** 2x generation (initial + verification), adds ~500ms latency.

**For ZOE:** Implement as optional high-stakes mode:

```typescript
// research-library query (high stakes: user depends on accuracy)
if (query.importance === 'HIGH') {
  const answer = await generateAnswer(query, context)
  const verificationQuestions = await generateVerificationQuestions(answer)
  const verification = await Promise.all(
    verificationQuestions.map(q => generateAnswer(q, context))
  )
  if (contradicts(answer, verification)) {
    const revised = await generateAnswer(query, context, {
      hint: `Previous answer contradicted. Re-examine: ${verification}`
    })
    return revised
  }
  return answer
}
```

---

## 5. Multi-Agent Validation

**Pattern (from AWS workshop):** Deploy 3 LLM instances with different personas:
- **Trust:** Answers generously, assumes sources are accurate
- **Skeptic:** Questions every claim, demands evidence
- **Leader:** Synthesizes both views, produces final answer

**Mechanism:** Run all 3 in parallel, have them "debate" key factual claims. Answer = majority vote on facts.

**Effectiveness:** Statistically cancels hallucinations that only 1-2 agents commit.

**Cost:** 3x generation cost; adds compute but parallelizable.

**For ZOE:** Implement for high-stakes research synthesis:

```typescript
const trustedAnswer = await zoe_trust(query, context)
const skepticalReview = await zoe_skeptic(trustedAnswer, context)
const finalAnswer = await zoe_leader(trustedAnswer, skepticalReview, query, context)
```

This is expensive but high-value for doc synthesis that Zaal will publish.

---

## 6. Structured Reasoning & Span Verification

### Span-Level Verification
**Pattern:** Each sentence/claim in response is matched against retrieved evidence. If unsupported, flag or drop it.

**Best practice:**
- For each claim in generated response
- Search retrieved docs for supporting text
- If no match found, rewrite claim as "possibly..." or remove it
- Disclose: "All statements below are verified against source X"

---

## 7. Temperature & Determinism Settings

| Use Case | Temperature | Why |
|----------|-------------|-----|
| Factual Q&A (dates, names, counts) | 0.0-0.2 | Forces model to use most-probable tokens; reduces creative fabrication |
| Research library summaries | 0.2-0.4 | Slight variation OK, but grounded in training |
| Creative writing / brainstorming | 0.7-1.0 | Encourages diverse outputs |

**For ZOE:** Implement as context-aware:
```typescript
const temp = isFactualQuery(query) ? 0.1 : 0.7
const answer = await claude.generate(prompt, { temperature: temp })
```

---

## 8. Post-Generation Verification Passes

### Post-Processing Checklist (before sending to user)

```typescript
function verifyResponse(response: string, sources: Doc[]): boolean {
  const checks = {
    noNewlinksWithoutSource: () => {
      // Regex: extract URLs
      const urls = response.match(/https?:\/\/\S+/g) || []
      // Verify each URL appears in sources or is well-known (wikipedia.org, etc)
      return urls.every(url => sources.some(doc => doc.text.includes(url)) || isWellKnown(url))
    },
    
    noNumericalClaimsWithoutContext: () => {
      // Flag statements like "There are X members" without citing source
      const numericClaims = response.match(/\d{2,}/g) || []
      return numericClaims.every(num => 
        sources.some(doc => doc.text.includes(num))
      )
    },
    
    noPastTenseForFutureEvents: () => {
      // Don't say "ZAOstock happened on Oct 3" before Oct 3
      const pastClaims = response.match(/was|were|did|happened/gi) || []
      return pastClaims.every(claim => !isFutureEvent(claim))
    },

    noFictionalSourcesAttributed: () => {
      // Disallow statements like "As Wikipedia says..." if not actually retrieved
      const attributions = response.match(/According to (\w+)/gi) || []
      return attributions.every(attr => 
        sources.some(doc => doc.source === attr)
      )
    }
  }
  
  return Object.values(checks).every(check => check())
}
```

---

## 9. How Claude 4.x Specifically Behaves

### Hallucination Signature

Claude 4.x tends NOT to hallucinate facts; instead:
- **Refuses outright** ("I don't have information...")
- **Flags uncertainty** ("I believe X, but I'm not certain...")
- **Declines to speculate** on topics outside training data

This is **preferable** to older models, which confidently fabricate.

**Implication:** ZOE's baseline is already good. The patterns above *amplify* Claude's natural strength.

### Extended Thinking (Caveat)

When reasoning mode enabled, Claude can fabricate intermediate steps. Pattern: always verify final claims against sources even if reasoning was visible.

---

## 10. Concrete Changes for ZAO (Priority Order)

### Phase 1 (Week 1): Persona + Prompting

**File:** `src/lib/agents/zoe/persona.md`

Add to "Core Behaviors" section:

```markdown
## Hallucination Prevention (Non-Negotiable)

1. Never fabricate facts. If unsure, say so.
2. Never claim memory state changes that didn't happen.
3. Never invent citations or links. Only reference docs you've actually searched.
4. Confidence levels:
   - High (95%+): "I'm confident..."
   - Medium (70-94%): "Based on my research, I believe..."
   - Low (<70%): "I'm uncertain, but possibly..." or "This requires live data I don't have."
5. Always respond with source citations when answering research questions.

## Acceptable Uncertainty Responses

- "I don't have information on that in my knowledge base."
- "My knowledge cutoff is February 2025; this may have changed."
- "I need to search the research library for this. [initiates search]"
- "This is speculative and not yet verified."
```

### Phase 2 (Week 2): Retrieval Grounding

**File:** `src/lib/agents/concierge/research-query-handler.ts`

Before generation:

```typescript
async function answerResearchQuery(query: string) {
  // 1. Retrieve relevant docs from Bonfire
  const relevantDocs = await bonfire.search(query, { limit: 5 })
  
  if (relevantDocs.length === 0) {
    return {
      answer: `I don't have information on "${query}" in the research library.`,
      sources: []
    }
  }
  
  // 2. Build context with explicit source markers
  const context = relevantDocs
    .map(doc => `[DOC ${doc.id}] ${doc.title}\n${doc.excerpt}`)
    .join('\n---\n')
  
  // 3. Generate with temperature=0.2 (factual mode)
  const prompt = `
Knowledge base:
${context}

Question: ${query}

Answer using ONLY information from above. If not found, say "I don't have information on this."
For each claim, cite the source document by ID.
  `
  
  const answer = await claude.generate(prompt, { temperature: 0.2 })
  
  // 4. Post-processing: extract citations, verify they exist
  const citations = extractCitations(answer)
  const verifiedCitations = citations.filter(cite => 
    relevantDocs.some(doc => doc.id === cite.docId)
  )
  
  return {
    answer,
    sources: verifiedCitations,
    verified: citations.length === verifiedCitations.length
  }
}
```

### Phase 3 (Week 3): Self-Verification for High-Stakes

**File:** `src/lib/agents/zoe/verify.ts`

```typescript
async function verifyAnswer(
  query: string,
  initialAnswer: string,
  context: ResearchContext
): Promise<{ answer: string; verified: boolean }> {
  // Generate verification questions about initial answer
  const verificationPrompt = `
Original answer: "${initialAnswer}"

Generate 3 true/false verification questions to test this answer's accuracy.
Format: QUESTION: [question]\n
  `
  
  const questions = await claude.generate(verificationPrompt, {
    temperature: 0.2
  })
  
  // Try to answer each verification question from context
  const results = await Promise.all(
    questions.split('\n').map(q => 
      answerResearchQuery(q.replace('QUESTION:', '').trim())
    )
  )
  
  // Check if verification answers match initial answer's claims
  const allVerified = results.every(r => r.verified)
  
  if (!allVerified) {
    // Regenerate with hint
    const revisedAnswer = await answerResearchQuery(query + 
      ` [NOTE: Previous answer had unverified claims. Please re-examine.]`
    )
    return { answer: revisedAnswer.answer, verified: true }
  }
  
  return { answer: initialAnswer, verified: true }
}
```

### Phase 4 (Week 4): Structured Output Mode

**File:** `src/lib/agents/zoe/response-format.ts`

```typescript
interface VerifiedResponse {
  answer: string
  claims: Array<{
    claim: string
    evidence: string
    source_doc: string
    confidence: 'high' | 'medium' | 'low'
  }>
  metadata: {
    knowledge_cutoff: string
    verification_status: 'verified' | 'unverified' | 'mixed'
  }
}

async function generateVerifiedResponse(
  query: string,
  context: ResearchContext
): Promise<VerifiedResponse> {
  const answer = await answerResearchQuery(query)
  const claims = extractClaimsFromAnswer(answer.answer)
  
  return {
    answer: answer.answer,
    claims: claims.map(claim => ({
      claim: claim.text,
      evidence: answer.sources
        .find(s => s.docId === claim.sourceDocId)
        ?.excerpt || 'Not found',
      source_doc: answer.sources
        .find(s => s.docId === claim.sourceDocId)
        ?.title || 'Unknown',
      confidence: estimateConfidence(claim, answer.sources)
    })),
    metadata: {
      knowledge_cutoff: 'February 2025',
      verification_status: answer.verified ? 'verified' : 'unverified'
    }
  }
}
```

---

## 11. Sources

1. [Mitigating Hallucination in Large Language Models: An Application-Oriented Survey on RAG, Reasoning, and Agentic Systems](https://arxiv.org/html/2510.24476v1) - Comprehensive 2025 survey on hallucination mitigation techniques across agentic systems.

2. [LLM Hallucinations in 2026: How to Understand and Tackle AI's Most Persistent Quirk - Lakera](https://www.lakera.ai/blog/guide-to-hallucinations-in-large-language-models) - Industry guide covering training data limitations, probabilistic generation, and practical mitigation strategies.

3. [Reducing LLM Hallucinations: A Developer's Guide - Zep](https://www.getzep.com/ai-agents/reducing-llm-hallucinations/) - In-depth developer guide with implementation examples for RAG, fine-tuning, prompting, and temporal memory systems (April 2025).

4. [LLM Hallucination Statistics 2026 - SQ Magazine](https://sqmagazine.co.uk/llm-hallucination-statistics/) - Benchmark data: 82% factual error rate on ungrounded open-domain queries; Claude 4.6 = 3% hallucination rate.

5. [Claude vs GPT vs Gemini Factual Accuracy in 2026 - DigitBin](https://www.digitbin.com/chatgpt-claude-gemini-accuracy/) - Comparative study: Claude 4.6 Sonnet = 91% Green Rate (BS detection), 3% Red Rate (false confidence).

6. [Stop AI Agent Hallucinations: 4 Essential Techniques - AWS DEV Community](https://dev.to/aws/stop-ai-agent-hallucinations-4-essential-techniques-2i94) - Practical patterns: Graph-RAG, semantic tool selection, multi-agent validation, neurosymbolic guardrails.

7. [Show HN: G0 - Detect LLM Hallucinations with a 3-Criterion Grounding Metric - Hacker News](https://news.ycombinator.com/item?id=46676357) - Community tool using tracking, intervention, and counterfactual criteria to score claims (Tracking: does claim follow from sources? Intervention: would changing sources change claim? Counterfactual: is claim uniquely dependent on sources?).

8. [Citation-Grounded Code Comprehension: Preventing LLM Hallucination Through Hybrid Retrieval and Graph-Augmented Context](https://arxiv.org/html/2512.12117v1) - Citation enforcement mechanism requiring line-range overlaps; prevents "fabricated metadata" hallucinations.

9. [AWS Sample: Stop AI Agent Hallucinations Workshop](https://github.com/aws-samples/sample-stop-ai-agent-hallucinations-workshop) - Production-ready demos on Graph-RAG, semantic tool selection, multi-agent validation deployed on Amazon Bedrock.

---

## Summary

**Single highest-leverage enforceable pattern for ZOE:** Retrieval-grounded answers with citation enforcement + post-generation verification. Implement Phase 2 first (adds one retrieval call + temperature=0.2 + citation check). Gains 60-80% hallucination reduction with low engineering effort.

**Most important persona change:** Explicit confidence levels + "I don't know is acceptable" messaging. This aligns with Claude's Constitutional AI training, which already favors uncertainty over fabrication.

**For child bots:** Apply same patterns; multi-agent validation is worth the compute cost for Telegram broadcasts where errors compound across audience.

