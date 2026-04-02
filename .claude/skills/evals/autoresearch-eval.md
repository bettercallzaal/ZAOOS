# Eval: autoresearch skill

## Test Prompts

### Prompt 1: Code optimization
```
/autoresearch Reduce music player initial load time below 2 seconds
```

### Prompt 2: Content quality
```
/autoresearch Improve zao-research skill output quality — target 10/10 on all 6 hard requirements
```

### Prompt 3: Bug hunting
```
/autoresearch:debug Find all bugs in the Spaces components
```

## Success Criteria (Binary)

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Defines measurable metric | Clear metric stated (e.g., "load time in ms", "6/6 requirements passing") |
| 2 | Establishes baseline | Measures current state before making changes |
| 3 | Iterates autonomously | Runs modify → verify → keep/discard loop without stopping to ask |
| 4 | Verifies after each change | Runs measurement after every modification |
| 5 | Reverts failed changes | Discards modifications that don't improve the metric |
| 6 | Keeps successful changes | Retains modifications that improve the metric |
| 7 | Logs iterations | Documents what was tried, what worked, what didn't |
| 8 | Reports final vs baseline | Summary shows starting metric → ending metric with delta |

## Expected Failure Modes (without skill)

- Makes changes without measuring first (no baseline)
- Doesn't verify after changes — assumes they worked
- Keeps changes that made things worse
- Stops after 1 iteration instead of looping
- No iteration log — can't see what was tried
- Asks permission for every small change instead of iterating autonomously
