# I Built a Full-Stack Web3 App in 16 Days With Claude Code. Here's Everything I Learned.

**584 commits. 46,000 lines of code. 160 API routes. 150 components. 24 feature domains. One developer.**

ZAO OS is a gated social client for a decentralized music community. It has auth, messaging, a music player with crossfade and binaural beats, three-tier governance, cross-platform publishing to five social networks, AI content moderation, fractal coordination, and a community directory.

I built it in 16 days using Claude Code as my only engineering partner.

This isn't a flex post. This is a build log — what worked, what failed, and what I'd do differently. With real numbers, not vibes.

---

## The Numbers

I pulled these directly from git. No rounding, no cherry-picking.

- **584 commits** in 16 days (March 12-28, 2026)
- **~36 commits per day** average, peaked at 61 on March 25
- **494 TypeScript/React files**, 46,046 lines
- **160 API routes** — auth, music, governance, publishing, moderation, messaging
- **150 React components** across 29 feature categories
- **191 research documents** — every decision documented before building
- **9 custom Claude Code skills** — reusable workflows I built along the way

The stack: Next.js 16, React 19, Supabase, Neynar (Farcaster), XMTP, Wagmi/Viem, Tailwind v4, Vercel.

---

## What "Building With AI" Actually Looks Like

It's not what you think. I didn't sit back and watch code appear. Here's what a typical day looked like:

**Morning:** Open Claude Code, run `/catchup` to restore context. Review what shipped yesterday. Pick the next feature.

**Building:** Describe the feature I want. Claude writes the first pass. I read every line. I push back on architecture decisions. I ask for alternatives. Sometimes I throw away the first attempt entirely and re-describe what I want.

**Debugging:** This is where AI both helps and hurts. Claude can grep the entire codebase instantly and cross-reference patterns — but it also confidently suggests fixes that don't address the root cause. I learned to say "investigate before fixing" rather than accepting the first suggestion.

**Research:** Before building any major feature, I'd run `/zao-research` — a custom skill that searches my 191-doc research library, checks what's already built in the codebase, searches open-source reference implementations, and saves findings in a standardized format. This is the secret weapon. When you research before building, you make better architecture decisions and avoid rework.

**Shipping:** Commit, push, deploy to Vercel. No PRs because I'm solo. No branches because velocity mattered more than process. This is a trade-off I'm now unwinding.

---

## What Actually Worked

### 1. Research-First Development

I wrote 191 research documents alongside the code. Every time I faced a "should we use X or Y?" decision, I'd research it properly: compare options, check pricing, read the docs, find reference implementations, document the decision.

This sounds slow. It's the opposite. I never had to re-architect a feature because I picked the wrong library. I never wasted a day integrating something that turned out to have a deal-breaking limitation. The 30 minutes spent researching saved hours of rework.

The `/zao-research` skill enforces this. It scores every doc against an 8-point quality checklist. If the research is vague or missing sources, the AI flags it before I save.

### 2. CLAUDE.md as Institutional Memory

My CLAUDE.md file is 200+ lines. It encodes every convention: how to name files, how to structure API routes, which security rules are non-negotiable, what the architecture decisions are and why.

Every new Claude Code session reads this file automatically. It's like onboarding a new engineer who instantly knows everything about the project. When I say "add a new API route," Claude already knows to use Zod validation, check the session, return NextResponse.json, and wrap everything in try/catch — because CLAUDE.md says so.

### 3. Custom Skills (The Real Multiplier)

I built 9 skills — basically saved workflows:

- `/new-route feature/action` — scaffolds an API route following ZAO conventions
- `/new-component feature/Name` — scaffolds a component with dark theme, mobile-first
- `/qa` — headless browser tests the live site and fixes bugs it finds
- `/review` — pre-landing code review that checks for security issues
- `/ship` — full workflow: tests, review, PR, deploy

Each skill encodes decisions I'd otherwise have to explain every time. The `/zao-research` skill alone has saved me from making bad architecture decisions at least a dozen times.

### 4. The AI Validates Its Own Output

I set up hooks — automated checks that run after Claude writes code:

- Write a research doc? A hook scores it against 8 quality criteria and warns if it's below threshold.
- Commit code? A hook lints the staged files and blocks the commit if there are errors.
- Push to remote? A hook typechecks the entire project first.

The AI checks the AI. It's not perfect, but it catches the obvious stuff.

---

## What Didn't Work (The Honest Part)

### 1. The Fix Commit Problem

23.6% of my commits are fixes. That's 137 fix commits out of 584. Most of them fix the feature that was committed immediately before.

The pattern looks like this:

```
feat: add audio filter presets
fix: simplify audio filters to playbackRate-based effects
fix: audio filters — disconnect source before inserting filter chain
```

```
feat: add Library page
fix: await Minimax summary instead of fire-and-forget
fix: add bottom padding to clear music player bar
fix: SSRF protection, search debounce, vote guard
fix: navigation, search injection, fid checks
```

Ship feature. Fix feature. Fix feature again. Fix feature a third time.

Root cause: I wasn't running lint or typecheck before committing. I wasn't running `/review` before shipping features. The CI pipeline caught errors, but by then I'd already moved on to the next thing.

I've now added pre-commit hooks. We'll see if the fix ratio drops.

### 2. Test Coverage: 2.8%

14 test files for 494 source files. That's embarrassing. The music player has 41 components and 8 fix commits — it's crying out for tests. The library feature has 15 files and 6 fix commits.

Why did this happen? Because AI makes writing features feel free. Why write tests when you can just ship another feature? The answer comes later, when you're three features deep and a change in one breaks something in another and you don't catch it until a user reports it.

### 3. Everything on Main

Zero branches. Zero PRs. Every commit lands on main. This is the "solo developer going fast" trap. It works until it doesn't. When a bad commit hits main, there's no gate, no review, no rollback plan.

### 4. The Productivity Paradox Is Real

METR ran a randomized controlled trial and found experienced developers were **19% slower** with AI tools — while believing they were 20% faster.

I felt fast. 584 commits in 16 days feels fast. But 137 of those were fix commits. If I'd spent 10 more minutes on each feature (running `/review`, writing a basic test), I might have shipped fewer commits but more stable features.

The AI multiplier isn't speed. It's **breadth**. I could work on governance, music, messaging, and moderation in the same week — domains that would normally require different specialists. That's the real unlock: a solo developer who can credibly cover the entire stack.

---

## The Workflow I'd Recommend

After 16 days and 584 commits, here's what I'd tell someone starting a similar project:

### Before You Write Code

1. **Write your CLAUDE.md first.** Every convention, every security rule, every architecture decision. This is your team's onboarding doc, and your team is an AI that reads it every session.

2. **Research before building.** 30 minutes of research saves 3 hours of rework. Document the decision so you don't revisit it.

3. **Build custom skills for your repeating workflows.** If you're going to scaffold 20 API routes, teach the AI how to do it once, then invoke the skill 20 times.

### While Building

4. **Name your sessions.** `claude -n "music-player"` means you can come back to it tomorrow with full context via `claude -r "music"`.

5. **Run `/review` before committing features.** Not after. Not "I'll do it later." Before the commit.

6. **Set `Bash(*)` in your permissions.** The default permission model is designed for safety but kills flow for solo development. Add a deny list for the actually dangerous commands (`rm -rf /`, `git push --force`, `DROP TABLE`) and auto-approve everything else.

7. **Use hooks to validate output.** The AI should check its own work. Pre-commit lint. Pre-push typecheck. Post-write quality scoring.

### The Meta-Lesson

AI doesn't replace thinking. It replaces typing. The architecture decisions, the "should we even build this?" questions, the user experience judgment — that's still you.

The developers who get the most out of AI tools are the ones who spend more time directing and reviewing, not less. The worst failure mode is accepting AI output without reading it, shipping fast, and spending the next three days fixing what you shipped.

584 commits in 16 days. 137 of them were fixes. The next 16 days will have fewer commits and fewer fixes.

That's the real productivity gain.

---

*Building ZAO OS in public. Follow the journey on Farcaster.*
