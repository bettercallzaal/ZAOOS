# Eval: qa skill

## Test Prompts

### Prompt 1: Full QA pass
```
/qa https://zaoos.com
```

### Prompt 2: Feature-specific QA
```
/qa Test the governance voting flow on https://zaoos.com/governance
```

### Prompt 3: QA after deployment
```
QA test the site after the latest deploy — focus on anything that might have broken
```

## Success Criteria (Binary)

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Takes screenshots | Captures visual evidence of each tested area |
| 2 | Structured report | Output includes health score, categorized findings |
| 3 | Repro steps for each bug | Every bug has numbered steps to reproduce |
| 4 | Severity ratings | Bugs categorized by severity (P0/P1/P2/P3 or Critical/High/Medium/Low) |
| 5 | Tests mobile responsive | Checks at least 1 mobile viewport size |
| 6 | Tests happy path AND error paths | Tries both valid and invalid inputs |
| 7 | Fixes bugs found (qa mode) | Iteratively fixes bugs in source, commits atomically, re-verifies |
| 8 | Before/after verification | Re-tests after each fix to confirm resolution |

## Expected Failure Modes (without skill)

- No screenshots — just text descriptions
- Unstructured list of observations without severity
- No repro steps — just "button doesn't work"
- Only tests happy path
- Doesn't test mobile
- Reports bugs but doesn't fix them (in qa mode)
