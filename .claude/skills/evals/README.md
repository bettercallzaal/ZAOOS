# Skill Eval Suites

Eval definitions for ZAO OS's top 5 skills. Use with Claude Skills 2.0 eval system.

## How to Run

In Claude.ai Customize > Skills, use the Skill-Creator's eval feature:
1. Load the skill being tested
2. Paste the test prompts from the eval file
3. Define success criteria from the eval file
4. Run — Claude tests with skill loaded vs unloaded, A/B compares blind

## Eval Files

| Skill | Eval File | Test Prompts | Key Criteria |
|-------|-----------|-------------|--------------|
| zao-research | `zao-research-eval.md` | 3 | Comparison table, numbers, sources, file paths, no vague language |
| ship | `ship-eval.md` | 3 | Tests run, PR created, version bumped, changelog updated |
| investigate | `investigate-eval.md` | 3 | Root cause before fix, no premature solutions |
| qa | `qa-eval.md` | 3 | Screenshots taken, bugs with repro steps, severity ratings |
| autoresearch | `autoresearch-eval.md` | 3 | Measurable metric, iterations logged, verify step executed |
