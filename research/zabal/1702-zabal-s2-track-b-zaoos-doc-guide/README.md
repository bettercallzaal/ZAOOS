---
topic: zabal, zaoos, builders
type: how-to-guide
status: ACTIVE — distribute to Track B participants at Week 3 (Sep 15). Goal: 2+ merged ZAOOS PRs by Week 10 (Nov 2). First PR due Week 5 (Sep 29).
last-validated: 2026-07-18
related-docs: 1626-zabal-s2-curriculum-spec, 1588-zabal-s2-curriculum-week-by-week, 1567-zabal-s2-participant-tracker-spec, 1677-zabal-s2-zoe-weekly-ops-guide
action-owner: Track B participants (submit PRs); ZOE (record milestone on PR merge, not PR open); Zaal (reviews + merges within 48h of PR open)
---

# 1702 — ZABAL S2 Track B: How to Write and Submit a ZAOOS Research Doc

> **What this is:** A practical guide for ZABAL S2 Track B participants to write and merge at least 2 ZAOOS research docs by Week 10 (Nov 2). Track B requires 2+ merged PRs — this guide shows you exactly how to do it. No prior ZAOOS knowledge required.
>
> **What ZAOOS is:** The ZAO Operating System — a public knowledge base of specs, guides, plans, and research docs that ZAO and ZOE use to run the ecosystem. Every doc merged into ZAOOS is live context that ZOE reads. When you write a ZAOOS doc, you're directly improving how ZOE operates.
>
> **Deadline:** First PR open by Week 5 (Sep 29). First PR merged by Week 7 (Oct 13). Second PR merged by Week 10 (Nov 2).

---

## What Counts as a ZAOOS Research Doc

A ZAOOS doc is a README.md file that documents something specific and actionable about ZAO. Examples:

| Type | Example |
|------|---------|
| Spec | "How ZOE should handle new WaveWarZ battle results" |
| How-to guide | "How Track A artists complete their on-chain release" (doc 1696) |
| Research | "Farcaster mini-app analytics landscape (what ZAO should consider)" |
| Event plan | "Africa Battle Week artist onboarding" (doc 1680) |
| Operations guide | "ZABAL S2 ZOE weekly ops" (doc 1677) |
| Decision brief | "WaveWarZ vs Sound.xyz for ZAO Music distribution — comparison" |
| Tool evaluation | "Helius API vs Solana RPC for WaveWarZ on-chain tracking" |

What does NOT count:
- Copy-paste of external documentation (must be original synthesis or application to ZAO)
- Duplicating an existing ZAOOS doc without adding new content
- A README that's just a list with no explanation

A good ZAOOS doc answers a specific question for a specific audience. The best docs are ones ZOE can actually act on.

---

## Step 1: Find a Topic

**Look for gaps.** The best ZAOOS docs fill something that doesn't exist yet.

Ways to find gaps:

**A. Look at what ZOE references but doesn't have:**
In existing ZAOOS docs, you'll often see `related-docs:` entries pointing to doc numbers that don't exist, or sections that say "spec TBD" or "see future doc." These are explicit gaps.

**B. Ask yourself: "What would ZOE need to know?"**
ZOE is an AI agent running ZAO operations. Anything ZOE needs to do but doesn't have a spec for is a doc opportunity. Examples:
- "How should ZOE respond to WaveWarZ battle dispute messages?"
- "What's the protocol when a ZABAL S2 participant drops out?"
- "How does ZOE track Africa Battle Week press coverage?"

**C. Check the ZAOOS board (github.com/bettercallzaal/ZAOOS/issues):**
Open issues or project board cards tagged as doc requests.

**D. Ask Zaal or in the ZABAL S2 Telegram:**
"What's something ZOE currently handles inconsistently?" or "What do you have to explain manually every time?"

**Topics available for ZABAL S2 Track B participants (confirmed gaps as of Jul 2026):**
- ZABAL S2 onboarding FAQ (most common questions from applicants, none documented)
- WaveWarZ quick battle results announcement format (when does ZOE post, what template)
- ZAO Telegram group management protocol (when to pin, when to announce, what ZOE handles)
- ZAOstock volunteer day-of communication protocol (what volunteers need to know)
- ZOR holder quarterly governance report template (what gets reported, when)
- Fractal Democracy session recap format (what ZOE posts after each session to /zao)
- ZABAL S2 milestone verification criteria (what counts as a "WaveWarZ battle" milestone — is it playing, is it submitting, is it completing?)

---

## Step 2: Choose a Doc Number

ZAOOS docs are numbered sequentially. The number is just an ID — it goes in the folder name, file heading, and PR title. **Number collisions are the most common Track B mistake.** Here's how to avoid them:

**Every time you start a new doc, run this command:**
```bash
cd /tmp/zaoos  # wherever you have the repo cloned
git fetch origin main
git log origin/main --oneline -5
```

The top commit title contains the most recent doc number. If you see `docs(zabal): ZABAL S2 ZOE weekly ops (1677)`, then 1677 is on main. Jump at least 5 ahead: use 1682.

**Rule: always jump 5+ ahead of whatever is on main when you start.** Other participants and ZOE sessions may be working in parallel.

**If a collision happens (your PR number is already taken):**
```bash
git mv research/CATEGORY/OLD-NUMBER-NAME research/CATEGORY/NEW-NUMBER-NAME
# Edit the h1 heading in README.md: # OLD → # NEW
# Update the index in research/CATEGORY/README.md
git commit --amend -m "docs(category): [title] — [description] (NEW_NUMBER)"
git push origin YOUR-BRANCH --force-with-lease
# Then update the PR title via GitHub web or: gh pr edit PRNUMBER --title "docs(NEW_NUMBER): ..."
```

---

## Step 3: Set Up the Repo

You need a GitHub account and basic git knowledge.

**Clone the repo (one-time setup):**
```bash
git clone https://github.com/bettercallzaal/ZAOOS.git /tmp/zaoos
cd /tmp/zaoos
```

**Before starting any doc, update to latest main:**
```bash
git fetch origin main
git checkout origin/main -b research/YOUR-DOC-NUMBER-short-name
```

Always branch from `origin/main`, not from your local `main` — local `main` may be stale.

---

## Step 4: Create the Doc

**Folder structure:**
```
research/
  [CATEGORY]/
    [DOCNUMBER]-[short-kebab-case-name]/
      README.md          ← this is your entire doc
```

**Categories:**
- `zabal/` — ZABAL S2 content
- `events/` — ZAOstock, Africa Battle Week, COC Concertz
- `farcaster/` — Farcaster + channel strategy
- `technology/` — ZOL, ZOE, WaveWarZ technical specs
- `community/` — newsletters, Telegram, member programs
- `governance/` — ZOR, Fractal, voting
- `music/` — ZAO Music, releases, artist guides
- `wavewarz/` — WaveWarZ-specific docs
- `business/` — grants, partnerships, legal

**Create your folder and file:**
```bash
mkdir -p research/CATEGORY/DOCNUMBER-your-doc-name
touch research/CATEGORY/DOCNUMBER-your-doc-name/README.md
```

---

## Step 5: Write the README

Every ZAOOS README follows this format:

```markdown
---
topic: [comma-separated topics]
type: [one of: spec, how-to-guide, ops-guide, event-plan, research, decision-brief, etc.]
status: [what to do with this doc and when — ZOE reads this]
last-validated: 2026-[MM]-[DD]
related-docs: [doc numbers that link to this]
action-owner: [who does what]
---

# [DOCNUMBER] — [Full Title]

> **What this is:** [One paragraph describing what this doc covers and who it's for]

---

## [Section 1]
...content...

## [Section 2]
...content...

---

## Sources

- `research/[path]/` — [why it's relevant]
```

**Frontmatter rules:**
- `status:` is the most important field — it tells ZOE when and how to use this doc. "ACTIVE", "EXECUTE [DATE]", "REFERENCE", "PLANNING" are common values.
- `related-docs:` uses the numbered slug format: `1677-zabal-s2-zoe-weekly-ops-guide`
- `last-validated:` is today's date in YYYY-MM-DD format

**Writing rules:**
- Use headers (##) to break content into clear sections
- Paste-ready templates go in code blocks (```text``` for prose, ```sql``` for queries, ```bash``` for commands)
- Every section should answer a question: "What does ZOE do here?" or "How does [person] do X?"
- Avoid vague language: "ZOE should handle this" is bad; "ZOE sends Zaal a Telegram: 'At-risk: [handle] missed 3 sessions'" is good
- Target length: 300–800 lines. Under 200 = too thin. Over 1,000 = probably two docs.

---

## Step 6: Update the Category Index

Every category has a `research/[CATEGORY]/README.md` that is an index table. After writing your doc, add a row.

Find the format by looking at the existing rows:
```bash
tail -3 research/CATEGORY/README.md
```

Your row format:
```
| DOCNUMBER | [Short Title](./DOCNUMBER-folder-name/) | TYPE | ONE-LINE summary of what's in the doc, what status it is, and related docs. |
```

The summary should be information-dense — other sessions scan this table to avoid overlap. Include the key facts from your doc in the summary.

---

## Step 7: Commit and Open a PR

```bash
git add research/CATEGORY/DOCNUMBER-name/README.md research/CATEGORY/README.md
git commit -m "docs(CATEGORY): [short title] — [brief description] (DOCNUMBER)"
git push origin research/DOCNUMBER-short-name
```

Then on GitHub: create a PR with:
- **Title:** `docs(DOCNUMBER): [same as commit message]`
- **Body:** 2-3 sentences on what gap this fills, what's in the doc, and which related docs it connects to

PR merges within ~48 hours. Zaal reviews. If changes are requested, ZOE will comment — push to the same branch to update the PR (no need to open a new PR).

---

## Step 8: Submit Milestone to ZOE

After your PR is **merged** (not just opened), post in ZABAL S2 Telegram:
```
@zaoclaw_bot milestone: [your-farcaster-handle] zaoos_doc [github.com/bettercallzaal/ZAOOS/pull/PRNUMBER]
```

ZOE checks:
- That the PR URL is valid and merged (state = MERGED)
- Records to `zabal_s2_milestones` as type `zaoos_doc`
- Replies: "✓ [handle] — ZAOOS doc milestone recorded. PR [number]. Counts toward graduation."

**Important:** ZOE records on merge, not on PR open. A PR that's open for 6 weeks but never merged does not count. Open your PR early (Week 5 latest) so there's time to address review feedback and get merged before the Week 10 deadline.

---

## Tips for a Strong ZAOOS Doc

**Write for ZOE, not for Zaal.**
Zaal already knows most of this. ZOE is the reader who will try to act on your doc. Ask: "If ZOE read only this doc, would it know what to do?"

**One topic per doc.**
Don't combine "how to do an on-chain release" and "how to track release metrics in Supabase" into one doc. Two separate docs is cleaner and both count toward your requirement.

**Fill in the templates.**
If your doc has a Farcaster post template or a Telegram message, write out the full text — not "ZOE should post something like..." Write the exact words.

**Quote your sources.**
If you're synthesizing from external docs (Zora docs, Sound.xyz docs, Neynar API docs), paraphrase and attribute. Don't copy-paste external documentation verbatim.

**Add a status that ZOE can act on.**
`status: PLANNING — needs Zaal review before activation` is better than `status: draft`.

---

## Example First PR Idea for Track B Participants

If you're unsure where to start, write a doc on something you personally experienced during ZABAL S2 onboarding. What questions did you have when you were accepted? What wasn't clear? 

A doc titled "ZABAL S2 First Week: Questions ZOE Should Be Ready to Answer" would be an immediate contribution — write the 10 most common new participant questions and ZOE's answers. That's a real doc that didn't exist before and that ZOE can use starting Sep 1.

---

## Sources

- `research/zabal/1626-zabal-s2-curriculum-spec/` — Track B graduation criteria (source of the 2-PR requirement)
- `research/zabal/1588-zabal-s2-curriculum-week-by-week/` — Week 3 session covers ZAOOS doc writing; Week 5 first PR deadline
- `research/zabal/1567-zabal-s2-participant-tracker-spec/` — Supabase zabal_s2_milestones table schema
- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — ZOE's Friday milestone detection from Telegram
