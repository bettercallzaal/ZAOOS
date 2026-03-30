# APO Prompt Optimization — Design Spec

> **Date:** March 29, 2026
> **Status:** Approved
> **Goal:** Build a reusable Automatic Prompt Optimization (APO) utility that improves ZAO OS's LLM prompts through an evaluate-critique-rewrite loop, inspired by Microsoft Agent Lightning's APO algorithm.

## Overview

A CLI script + admin API route that takes any LLM prompt, runs it against test cases, grades the output, critiques failures, rewrites the prompt, and repeats for 2-3 rounds. Uses Minimax (already configured) as the LLM for all steps.

Two target prompts:
1. `LIBRARY_SYSTEM_PROMPT` in `src/lib/library/minimax.ts` — summarizes research items for ZAO relevance
2. `TASTE_REFLECT_PROMPT` in `src/lib/memory-recall.ts` — synthesizes weekly taste profiles from user memory

## File Structure

```
scripts/
  apo-optimize.ts                — CLI runner: npx tsx scripts/apo-optimize.ts <prompt-name>
  apo-prompts/
    library-summary.json         — Config + test cases for LIBRARY_SYSTEM_PROMPT
    taste-reflection.json        — Config + test cases for TASTE_REFLECT_PROMPT

src/
  lib/
    apo/
      engine.ts                  — Core APO loop (evaluate, critique, rewrite)
      types.ts                   — TypeScript interfaces
  app/
    api/
      admin/
        apo/
          run/route.ts           — POST: trigger APO run for a prompt
          prompts/route.ts       — GET: list available prompt configs
```

The core engine lives in `src/lib/apo/` so both the CLI script and API route share the same logic.

## Prompt Config Format

Each JSON file in `scripts/apo-prompts/`:

```typescript
interface PromptConfig {
  name: string;                    // e.g. "library-summary"
  description: string;             // Human-readable purpose
  currentPrompt: string;           // The prompt text to optimize
  testCases: TestCase[];           // 5-8 test cases
  gradingPrompt: string;           // How to score outputs (returns {score, feedback})
  maxRounds: number;               // Default 3
}

interface TestCase {
  input: string;                   // User message / content to process
  criteria: string[];              // What a good output must do
  idealOutput?: string;            // Optional gold-standard reference
}
```

### Test Case Counts
- `library-summary.json`: 6 test cases (3 highly relevant items, 2 tangentially relevant, 1 irrelevant)
- `taste-reflection.json`: 5 test cases (varied user activity patterns: active curator, lurker, new member, power user, inactive)

## Core APO Engine

### Algorithm (3 steps per round)

**Step 1 — Evaluate:**
For each test case, run the current prompt + test input through Minimax. Grade each output using the `gradingPrompt`, which returns `{score: number, feedback: string}`. Round score = average of all test case scores (0.0-1.0 scale).

**Step 2 — Critique:**
Collect all test cases that scored below 0.7. Send to Minimax with this meta-prompt:

```
You are a prompt engineer. The following prompt was tested on several inputs.
Some outputs scored poorly. Analyze the failures and identify specific weaknesses
in the prompt that caused them.

PROMPT: {currentPrompt}

FAILURES:
{for each low-scoring case: input, output, score, feedback}

List 3-5 specific, actionable issues with the prompt.
```

**Step 3 — Rewrite:**
Send the critique to Minimax:

```
You are a prompt engineer. Rewrite this prompt to fix the identified issues.
Keep the same role and purpose. Do not add unnecessary complexity.

ORIGINAL PROMPT: {currentPrompt}

ISSUES FOUND:
{critique output}

Return ONLY the rewritten prompt, no explanation.
```

### Loop Control
- Max rounds: configurable per prompt (default 3)
- Keep-best: if a rewrite scores lower than the previous best, discard it and use the previous best for the next round's critique
- Early stop: if improvement is <0.02 for 2 consecutive rounds, stop early
- Timeout: 120 seconds per round (covers all test case evaluations)

### Output

The engine returns:

```typescript
interface APOResult {
  promptName: string;
  rounds: Array<{
    round: number;
    prompt: string;
    avgScore: number;
    testScores: Array<{ input: string; score: number; feedback: string }>;
    critique?: string;
    kept: boolean;
  }>;
  bestPrompt: string;
  bestScore: number;
  baselineScore: number;
  improvement: number;          // percentage
}
```

## CLI Script

Usage:
```bash
# Optimize a specific prompt
npx tsx scripts/apo-optimize.ts library-summary

# Optimize with custom rounds
npx tsx scripts/apo-optimize.ts taste-reflection --rounds 5

# Dry run (evaluate only, no rewrite)
npx tsx scripts/apo-optimize.ts library-summary --evaluate-only
```

Requires `MINIMAX_API_KEY` in `.env`.

Console output: round-by-round scores, critique summaries, and the final optimized prompt printed to stdout. No file writes — you copy the result into the source code manually.

## Admin API Routes

### POST `/api/admin/apo/run`

```typescript
// Request
{ promptName: string; rounds?: number }

// Response
APOResult (same as engine output)
```

- Validates admin session via `getSession()`
- Reads prompt config from `scripts/apo-prompts/{promptName}.json`
- Runs APO engine
- Returns results as JSON
- No Supabase writes, stateless

### GET `/api/admin/apo/prompts`

```typescript
// Response
{ prompts: Array<{ name: string; description: string; testCaseCount: number }> }
```

- Validates admin session
- Lists all JSON files in `scripts/apo-prompts/`
- Returns name, description, and test case count for each

## Minimax Integration

All LLM calls go through one shared helper that mirrors the existing pattern in `src/lib/library/minimax.ts`:

```typescript
async function callMinimax(system: string, user: string): Promise<string>
```

- Uses `MINIMAX_API_KEY`, `MINIMAX_API_URL`, `MINIMAX_MODEL` from env
- Strips `<think>` tags from M2.7 responses (same as existing code)
- 30-second timeout per call
- No retry logic — if a call fails, that test case gets score 0.0

## Error Handling

- Missing env var: exit with clear error message
- Missing prompt config file: exit with list of available configs
- Minimax API failure: log error, score that test case as 0.0, continue
- All test cases fail: stop optimization, report baseline scores
- Grading response not valid JSON: retry once with stricter instruction, then score 0.0

## Testing

- Unit tests for the APO engine with mocked Minimax responses
- Test the grading prompt parsing (valid JSON extraction from LLM output)
- Test keep-best logic (discard worse rewrites)
- Test early-stop condition
- Co-located at `src/lib/apo/__tests__/engine.test.ts`

## What This Does NOT Do

- Does not store optimization history in a database
- Does not auto-deploy optimized prompts (manual copy-paste)
- Does not support OpenAI or other providers (Minimax only for now)
- Does not modify source files automatically
- Does not run on a schedule
