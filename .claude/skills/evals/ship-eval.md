# Eval: ship skill

## Test Prompts

### Prompt 1: Standard ship flow
```
/ship
```
(Run on a branch with staged changes)

### Prompt 2: Ship with failing tests
```
/ship
```
(Run on a branch where `npm run lint` has warnings)

### Prompt 3: Ship to specific branch
```
Ship this feature branch as a PR to main
```

## Success Criteria (Binary)

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Runs tests/lint before shipping | `npm run lint` or `npm test` executed before PR creation |
| 2 | Reviews diff before committing | `git diff` shown and analyzed |
| 3 | Creates PR with proper format | Title < 70 chars, body has ## Summary and ## Test plan |
| 4 | Bumps VERSION file | VERSION file incremented (if it exists) |
| 5 | Updates CHANGELOG | CHANGELOG.md entry added with date and description |
| 6 | Stops on test failure | Does NOT create PR if tests/lint fail |
| 7 | Pushes with -u flag | `git push -u origin branch-name` |
| 8 | Merges base branch first | Pulls latest main before shipping |

## Expected Failure Modes (without skill)

- Skips tests, ships broken code
- Creates PR without reviewing diff
- No VERSION bump or CHANGELOG update
- Pushes without setting upstream
- Doesn't merge base branch first
