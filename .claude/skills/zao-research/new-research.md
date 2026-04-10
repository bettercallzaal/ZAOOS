# How to Add New Research

## Step 1: Pick the Next Number

Check the highest numbered folder across ALL topic folders in `research/` and use the next number. Current highest: `316`. Next doc should be `317`.

```bash
# Find the highest number across all topic folders
ls research/*/[0-9]*/ research/[0-9]*/ 2>/dev/null | grep -oE '[0-9]+' | sort -n | tail -1
```

## Step 2: Choose the Topic Folder

Research docs now live in topic folders. Pick the right one:

| Folder | For |
|--------|-----|
| `agents/` | AI agents, OpenClaw, ZOE, frameworks, memory, orchestration |
| `music/` | Player, NFTs, distribution, Arweave, audio, FISHBOWLZ |
| `dev-workflows/` | Skills, Claude Code, testing, autoresearch, git, MCP |
| `infrastructure/` | Next.js, Supabase, streaming, mobile, notifications |
| `governance/` | Respect, ORDAO, Hats, ZOUNZ, fractals, Snapshot |
| `community/` | ZAO guide, onboarding, member profiles, task forces |
| `cross-platform/` | Bluesky, Lens, Nostr, Mastodon, Reddit, X, Twitch |
| `farcaster/` | Protocol, Mini Apps, XMTP, ecosystem, social graph |
| `identity/` | ZIDs, ENS, reputation, knowledge graph |
| `business/` | Revenue, payments, strategy, marketplace |
| `events/` | Bootcamp notes, ship logs, big wins, retros |
| `wavewarz/` | Prediction markets, artist pipeline |
| `security/` | Audits, testing, API verification |

## Step 3: Create the Folder and README

```bash
mkdir -p research/{topic}/{number}-{doc-name}
```

Example: `research/agents/281-new-agent-feature/README.md`

## Step 4: Write the README with This Template

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

## Step 5: Update the Topic Folder's README

Add the new doc to the table in `research/{topic}/README.md`.

## Step 6: Commit

```bash
git add research/{topic}/{number}-{doc-name}/ research/{topic}/README.md
git commit -m "docs: {topic} research (doc {number})"
```

## Research Quality Checklist

- [ ] Recommendations/key decisions at the top
- [ ] Specific to ZAO OS (not generic)
- [ ] Numbers, versions, and dates included
- [ ] Sources linked
- [ ] Actionable (tells you what to do, not just what exists)
- [ ] Updated topic folder README.md
