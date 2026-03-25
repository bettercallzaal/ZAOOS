# How to Add New Research

## Step 1: Pick the Next Number

Check the highest numbered folder in `research/` and use the next number. Current highest: `127`. Next doc should be `128`.

## Step 2: Create the Folder and README

```bash
mkdir -p research/{number}-{topic-name}
```

## Step 3: Write the README with This Template

```markdown
# {Number} — {Title}

> **Status:** Research complete
> **Date:** {Today's date}
> **Goal:** {One-line description of what this research answers}

---

## Key Decisions / Recommendations

{Table or bullet list of the main takeaways — put these FIRST so readers get value immediately}

---

## {Section 1}

{Research content with tables, code blocks, comparisons}

## {Section 2}

{More content}

---

## Sources

- [Source Name](URL)
- [Source Name](URL)
```

### Rules for Writing Research Docs

1. **Put recommendations/decisions at the top** — readers should get the answer in 30 seconds
2. **Use tables** for comparisons, pricing, feature lists
3. **Include specific numbers** — versions, prices, dates, stats
4. **Link sources** at the bottom
5. **Keep it actionable** — not theoretical, but "here's what to do"
6. **Match ZAO OS's context** — filter findings through the lens of a 100+ member gated Farcaster music community on Next.js/Supabase
7. **Cross-reference with codebase** — check what's actually built in `src/` before making claims about what exists
8. **Note aspirational vs actual** — if research describes features not yet built, mark clearly as "aspirational" or "not implemented"

## Step 4: Update the Research Hub Index

Add the new doc to `research/README.md` in the appropriate topic category.

## Step 5: Commit

```bash
git add research/{number}-{topic}/ research/README.md
git commit -m "docs: {topic} research (doc {number})"
```

## Research Quality Checklist

- [ ] Recommendations/key decisions at the top
- [ ] Specific to ZAO OS (not generic)
- [ ] Numbers, versions, and dates included
- [ ] Sources linked
- [ ] Actionable (tells you what to do, not just what exists)
- [ ] Updated research/README.md index
