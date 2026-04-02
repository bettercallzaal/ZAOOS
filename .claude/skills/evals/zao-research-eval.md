# Eval: zao-research skill

## Test Prompts

### Prompt 1: Known topic with existing research
```
/zao-research XMTP messaging protocol for ZAO OS
```

### Prompt 2: New topic requiring web research
```
/zao-research Farcaster Frames v3 — what changed, should ZAO adopt?
```

### Prompt 3: Codebase-heavy topic
```
/zao-research audit the music player architecture — what's built vs what's documented in research docs?
```

## Success Criteria (Binary — all must pass)

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | First `##` section is "Key Decisions / Recommendations" | No intro, no background before it |
| 2 | Contains comparison table with 3+ options | Markdown table, multiple columns, 3+ rows |
| 3 | Contains 3+ specific numbers | Versions, prices, dates, stats — not vague |
| 4 | Sources section with 2+ clickable URLs | `## Sources` at bottom with links |
| 5 | References at least 1 ZAO OS file path | `src/app/api/...`, `src/components/...`, etc. |
| 6 | No banned vague phrases | Zero instances of "consider using", "it might be worth", "you could explore", "potentially useful", "worth investigating" |
| 7 | Checked existing research first | Output mentions searching existing docs before web research |
| 8 | Searched open-source code | Output mentions grep.app, GitHub, or reference repos |
| 9 | Saved as numbered doc | Created `research/{N}-{topic}/README.md` |
| 10 | Updated indexes | Updated research-index.md, topics.md, new-research.md |

## Expected Failure Modes (without skill)

- Generic research not filtered through ZAO context
- No comparison table
- Vague recommendations ("consider using X")
- No file paths referenced
- No sources section
- Doesn't check existing research first
- Doesn't search open-source code
