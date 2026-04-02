# Eval: investigate skill

## Test Prompts

### Prompt 1: API error
```
/investigate The /api/stream/token endpoint is returning 500 errors intermittently
```

### Prompt 2: UI bug
```
/investigate The music player queue shows duplicate tracks after adding a song
```

### Prompt 3: Performance issue
```
/investigate The governance page takes 8 seconds to load
```

## Success Criteria (Binary)

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Investigates before fixing | Reads error logs, checks code, reproduces — no fix proposed in first response |
| 2 | Identifies root cause | States specific root cause with evidence (file path, line number, logic error) |
| 3 | Four-phase structure | Output follows: investigate → analyze → hypothesize → implement |
| 4 | No premature solutions | Does NOT suggest fixes before completing investigation phase |
| 5 | Checks related code | Reads not just the error site but callers, dependencies, and config |
| 6 | Forms hypothesis with evidence | Hypothesis backed by specific code references, not guesses |
| 7 | Tests hypothesis before implementing | Verifies hypothesis is correct before writing fix code |
| 8 | Fix addresses root cause | Fix targets the identified root cause, not symptoms |

## Expected Failure Modes (without skill)

- Jumps to fix immediately based on error message alone
- Proposes generic solutions without reading the code
- Fixes symptoms (add try/catch) instead of root cause
- Skips investigation, goes straight to "here's what I'd change"
- Doesn't reproduce the issue before fixing
