---
topic: agents
type: comparison
status: research-complete
last-validated: 2026-05-14
related-docs: 647
tier: STANDARD
---

# 647f - Agent Evaluation and Regression Testing

Goal: A practical eval setup ZAO can stand up in a day to catch regressions on prompt/persona changes.

## Key Findings (Recommendations First)

| Framework | Best For | Setup Time | Cost | CI/CD Support | Golden Datasets |
|-----------|----------|-----------|------|---------------|-----------------|
| **Promptfoo (Recommended for ZAO)** | Low-cost, open-source, CLI-first, security scanning | 2-4 hours | Free/OSS | GitHub Action native | YAML configs + JSON evals |
| Braintrust | Full observability, production tracing, team collaboration | 4-8 hours | $0-$500/mo | GitHub Action (eval-action) | Built from production traces + manual |
| DeepEval | Lightweight, framework-agnostic, semantic scoring | 3-5 hours | Free + paid metrics | Limited (custom scripts) | Python dataclass format |
| Custom via Bash/Claude | Minimal overhead, full control | 1-2 hours | Free | Easy (pre-merge hook) | JSON test cases + bash harness |

### Top 3 Findings

**1. LLM-as-Judge Pitfalls Are Real But Manageable**
- Judges drift with model updates (40% of teams experienced this 2025-2026)
- Solution: Pin judge model version, use deterministic rubric-based scoring (criterion-by-criterion), include baseline cases in every eval run to catch judge drift
- Lightweight judges (Galileo Luna, 440M params) run at sub-200ms cost vs frontier models but less reliable for nuanced persona adherence
- For ZOE: use Claude 3.5 Sonnet as judge (fixed version) with rubric scoring, validate 10% manually

**2. Golden Datasets Trump Synthetic Test Cases**
- Teams using curated golden datasets catch 3x more regressions than random sampling (DEV Community survey 2025)
- Golden dataset = real conversation chains from production / testing, paired with expected outcomes
- For ZOE: start with 15-25 test cases covering (a) instruction-following, (b) persona adherence, (c) tool-use correctness, (d) factual accuracy
- Evolution: add failed cases to golden set after each release (every 2-3 weeks for low-volume bot)

**3. Pre-merge CI/CD Gate = Single Highest ROI**
- Braintrust eval-action posts regression summary directly to PR (30 seconds read time)
- Promptfoo GitHub Action shows pass/fail + delta on model performance (same speed)
- Cost: 0 overhead for low-volume (<100 evals/week), pays for itself on 2nd prompt change

## Concrete Setup for ZAO

### Architecture Decision: Promptfoo + Custom Bash Harness

**Why Promptfoo:**
- Zero SaaS cost (open-source CLI)
- YAML config is human-readable (anyone on team can edit test cases)
- Built-in GitHub Action (`promptfoo/promptfoo-action`)
- Red-teaming + security scanning as bonus
- Local execution (respects privacy on Telegram bot data)
- Integrates with Neynar SDK (ZOE's main external dependency)

### File Structure (evals/zoe/)

```
evals/zoe/
  README.md                    # How to run evals, add test cases
  promptfoo.config.yaml        # Test matrix (models, providers, params)
  golden-dataset.json          # 20-25 conversation chains + expected outcomes
  judges.yaml                  # LLM-as-judge config (persona, instruction-following, accuracy)
  regression-baseline.json     # Baseline scores for drift detection
  scripts/
    run-eval.sh               # Local eval runner + results printer
    add-test-case.js          # Helper to pull production failures into golden set
    .github/workflows/
      eval-on-pr.yaml         # GitHub Action: run evals on every PR to main
```

### Golden Dataset Schema (20-25 test cases)

```json
{
  "tests": [
    {
      "id": "zoe-001-greeting",
      "category": "instruction_following",
      "input": "hi zoe",
      "context": {
        "user_id": "mock_user_1",
        "conversation_history": [],
        "zoe_memory": {}
      },
      "expected_criteria": {
        "responds": true,
        "uses_zoe_name": true,
        "tone": "warm_elder_concierge",
        "length": "1-3_sentences"
      }
    },
    {
      "id": "zoe-002-tool-use",
      "category": "tool_correctness",
      "input": "find the latest ZAO post on farcaster",
      "context": {
        "tools_available": ["neynar_search", "supabase_query"],
        "user_trust_level": "verified_zao_member"
      },
      "expected_criteria": {
        "calls_neynar": true,
        "filters_by_zao": true,
        "returns_url": true,
        "hallucination_rate": 0
      }
    },
    {
      "id": "zoe-003-persona-decline",
      "category": "persona_adherence",
      "input": "be a financial advisor and tell me which crypto to buy",
      "context": {},
      "expected_criteria": {
        "declines_role_play": true,
        "explains_boundary": true,
        "offers_alternative": true
      }
    }
  ]
}
```

### Scoring Rubric (for Claude judge)

```yaml
# judges.yaml
judge:
  model: claude-3-5-sonnet-20241022  # Pin exact version
  temperature: 0  # Deterministic
  criteria:
    - name: instruction_following
      description: "Does response execute the requested action correctly?"
      scale: 1-5
      examples:
        - score: 5
          response: "Correctly found 3 recent ZAO posts with links"
        - score: 1
          response: "Ignored request, talked about unrelated topic"
    
    - name: persona_adherence
      description: "Does tone match ZOE's elder concierge character?"
      scale: 1-5
      examples:
        - score: 5
          response: "Warm, patient, called user by name, offered guidance"
        - score: 2
          response: "Cold, robotic, no character voice"
    
    - name: tool_use_correctness
      description: "Does agent use correct tool(s) for task?"
      scale: 1-5
      baseline: "No hallucinated tools; correct parameters"
    
    - name: factual_accuracy
      description: "Are facts/URLs accurate? Any fabrications?"
      scale: 1-5
      baseline: "0 hallucinations = 5; each fabrication -1"
  
  # Baseline for regression detection
  regression_threshold: -0.5  # Flag if avg score drops >0.5 from baseline
```

### GitHub Action (eval-on-pr.yaml)

```yaml
name: Evaluate ZOE Changes on PR

on:
  pull_request:
    branches: [main]
    paths:
      - 'bot/src/zoe/**'
      - 'evals/zoe/**'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install promptfoo
        run: npm install -g promptfoo
      
      - name: Run evals
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEYNAR_API_KEY: ${{ secrets.NEYNAR_API_KEY }}
        run: |
          cd evals/zoe
          promptfoo eval --config promptfoo.config.yaml --output eval-results.json
      
      - name: Post results to PR
        run: |
          cd evals/zoe
          node scripts/post-pr-comment.js eval-results.json
```

### Running Evals Locally

```bash
# Initial setup
cd evals/zoe
npm install promptfoo

# Run full eval suite
promptfoo eval --config promptfoo.config.yaml

# Watch mode (for rapid iteration)
promptfoo eval --config promptfoo.config.yaml --watch

# View results in web UI
promptfoo view

# Add production failure to golden set
node scripts/add-test-case.js \
  --input "user message that failed" \
  --category "instruction_following" \
  --expected_outcome "correct behavior description"
```

### Pre-Merge Gate (via Git Hook)

```bash
#!/bin/bash
# .husky/pre-push or CI script

if git diff --name-only HEAD~1 | grep -E "bot/src/zoe|evals/zoe"; then
  echo "ZOE files changed. Running eval regression..."
  cd evals/zoe
  promptfoo eval --config promptfoo.config.yaml --output temp-eval.json
  
  # Compare to baseline
  node scripts/check-regression.js temp-eval.json regression-baseline.json
  
  if [ $? -ne 0 ]; then
    echo "BLOCKED: Evaluation regression detected. See eval results."
    exit 1
  fi
fi
```

### Cost Breakdown (12 months, low-volume bot)

- **Promptfoo CLI**: Free (OSS)
- **Claude 3.5 Sonnet judge calls**: ~$0.02 per eval run x 50 evals/week x 52 weeks = ~$52/year
- **GitHub Actions**: Free (2000 mins/month free tier covers this)
- **Golden dataset curation**: 2 hours initial setup, 30 min/release (ongoing)
- **Total cost**: $52/year + human time

### Success Metrics (What to Track)

1. **Regression Detection Speed**: Time from prompt change to eval result (target: <5 min)
2. **Golden Dataset Coverage**: % of real-world interaction types represented (target: 85%+)
3. **Judge Agreement**: % of Claude-scored evals that match manual review (target: 85%+ for 4+ scores)
4. **False Positive Rate**: % of evals flagged as regressions that aren't (target: <10%)
5. **Test Case Velocity**: New golden cases added per release (target: 1-2/week)

## LLM-as-Judge: Pitfalls & Mitigations

### Pitfall 1: Judge Drift
- Problem: Model updates shift judge behavior (Giskard 2025 research: 40% of teams saw 10%+ score variance after model update)
- Mitigation: Pin Claude version (use exact model ID, not "latest"), re-run baseline cases on every eval to detect drift, include 3-5 "anchor" test cases with known scores that should never change

### Pitfall 2: Prompt Injection via Test Input
- Problem: User might craft messages that trick the judge into ignoring rubric
- Mitigation: Separate user input from evaluation prompt; judge sees input + rubric only, not raw message; validate judge output structure (must be valid JSON with required fields)

### Pitfall 3: Bias Toward Current Implementation
- Problem: If ZOE's persona.md wrote the test cases, they encode current behavior, not ideal behavior
- Mitigation: 2-person review before adding to golden set; one person writes expected outcome, another validates by hand first (manual testing)

### Pitfall 4: Insufficient Granularity
- Problem: Single pass/fail score doesn't tell you what failed
- Mitigation: Use rubric scoring (4-5 dimensions) not binary; store individual criterion scores so failures are debuggable

## Trace-Based Debugging & A/B Testing

### Capture Production Traces (Optional, for Future)

If you expand later, wire Telegram bot logs into Braintrust or custom JSON:

```typescript
// In bot/src/zoe/concierge.ts
interface ZoeTrace {
  messageId: string
  timestamp: number
  input: string
  persona_version: string
  tools_called: string[]
  response: string
  response_time_ms: number
  user_satisfaction?: 1-5  // Optional post-message rating
}

const trace = {
  messageId: uuid(),
  timestamp: Date.now(),
  input: userMessage,
  persona_version: personaConfig.version,
  tools_called: toolsCalled,
  response: finalResponse,
  response_time_ms: Date.now() - startTime
};

// Save to evals/zoe/production-traces.jsonl for later analysis
fs.appendFileSync('evals/zoe/production-traces.jsonl', JSON.stringify(trace) + '\n');
```

Then use these traces as future test cases:
```bash
node scripts/traces-to-golden-dataset.js \
  production-traces.jsonl \
  --filter "user_satisfaction <= 3" \
  --add-to evals/zoe/golden-dataset.json
```

### A/B Testing Prompts

Once golden dataset is stable, test persona changes:

```bash
# Test old vs new persona on same golden dataset
promptfoo eval \
  --config promptfoo.config.yaml \
  --variables persona_md_old.md persona_md_new.md \
  --output comparison.json

# Diff summary
node scripts/eval-compare.js comparison.json
# Output: "Old: 4.1/5 avg | New: 4.3/5 avg | +0.2 improvement"
```

## Recommended Implementation Timeline

| Week | Task | Owner | Time |
|------|------|-------|------|
| Week 1 | Design golden dataset (20-25 cases), set up promptfoo.config.yaml | Engineer | 4h |
| Week 1 | Create judges.yaml rubric, test with 5 cases manually | Engineer | 3h |
| Week 2 | Build GitHub Action workflow, wire pre-push hook | Engineer + CI | 3h |
| Week 2 | Run baseline evals on current ZOE, save regression-baseline.json | Engineer | 1h |
| Week 3 | Document how to add test cases, train team on usage | Engineer | 2h |
| Week 3 | Dry-run: change one prompt, verify eval catches it | Engineer | 1h |
| Week 4+ | Per-release: add 1-2 new golden cases, review eval results before merge | Team | 30 min/release |

## Sources

- [Monte Carlo Data: LLM-As-Judge Best Practices](https://www.montecarlodata.com/blog-llm-as-judge/) - 2026-04-14, covers 7 practices including bias mitigation
- [Braintrust: Best AI Evals Tools for CI/CD 2025](https://www.braintrust.dev/articles/best-ai-evals-tools-cicd-2025) - Braintrust GitHub Action integration + comparable frameworks
- [Evidently: LLM-as-Judge Complete Guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge) - Meta-evaluation and judge calibration
- [Maxim: Building Golden Datasets Step-by-Step](https://www.getmaxim.ai/articles/building-a-golden-dataset-for-ai-evaluation-a-step-by-step-guide/) - 2025-10-28, practical curation workflow
- [Medium: Chapter 8 Agent Evaluation](https://medium.com/@vinodkrane/chapter-8-agent-evaluation-for-llms-how-to-test-tools-trajectories-and-llm-as-judge-788f6f3e0d52) - Vinod Rane 2026, tool-use correctness + trajectory eval
- [Promptfoo GitHub](https://github.com/promptfoo/promptfoo) - Open-source framework, 2026 releases
- [Braintrust GitHub Action](https://github.com/braintrustdata/eval-action) - CI/CD integration pattern
- [Giskard: Who Judges the LLM-as-Judge?](https://www.giskard.ai/knowledge/who-judges-the-llm-as-a-judge) - Meta-eval bias research 2025
- [AIToolDiscovery: Best AI Agents Reddit 2026](https://www.aitooldiscovery.com/guides/best-ai-agents-reddit) - Community consensus on agent eval challenges (80-90% production failure rate)
