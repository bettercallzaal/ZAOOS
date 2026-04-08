# 30-Day AI Tool Mastery Curriculum

ZOE delivers one tip per day via Telegram at 9 AM ET. Each tip takes 5 minutes max.

---

## Week 1: Claude Code Power User

### Day 1: /compact saves tokens
**Try this:**
1. Start a normal session, work for 15-20 messages
2. Type `/compact`
3. Notice the conversation compresses but Claude still remembers context

**Why:** Message 30 costs 31x more tokens than message 1. Compacting resets the cost curve.

### Day 2: Model switching
**Try this:**
1. Type `/model sonnet` before doing a simple file read or grep
2. Do the task - notice it works fine
3. Switch back to Opus with `/model opus` for architecture decisions

**Why:** Sonnet handles 70%+ of tasks at ~50% fewer tokens. Save Opus for the hard stuff.

### Day 3: Edit prompts, don't follow up
**Try this:**
1. Next time Claude gets something wrong, DON'T send a correction
2. Instead, click Edit on your original message and rewrite it
3. Compare: the old exchange is replaced, not stacked

**Why:** Follow-ups stack on the history. Edits replace. Saves 50% per correction.

### Day 4: Batch questions
**Try this:**
1. Think of 3 things you need to know about the codebase
2. Send them all in ONE message: "1) ... 2) ... 3) ..."
3. Compare the result vs 3 separate messages

**Why:** 3 separate prompts = 3 context reloads. 1 prompt with 3 tasks = 1 context reload.

### Day 5: Background agents
**Try this:**
1. Ask Claude to do 2 independent things in one message
2. Watch it dispatch parallel agents
3. Notice both complete simultaneously

**Why:** Parallel agents = same wall-clock time, more throughput.

### Day 6: /z for quick status
**Try this:**
1. Start your session with `/z`
2. Read: branch state, recent commits, what needs attention
3. This replaces 5 minutes of manual git log / git status

**Why:** 10 seconds to orient. Every session should start here.

### Day 7: Peak hours awareness
**Try this:**
1. Note what time you start heavy Opus work today
2. Is it 5-11 AM PT (8 AM-2 PM ET)? That's peak - tokens cost more
3. Try scheduling complex architecture work for afternoon/evening

**Why:** Same weekly limit, but peak hours burn it 20-30% faster.

---

## Week 2: Knowledge Infrastructure

### Day 8: Install Graphify
**Try this:**
1. Run: `pip install graphifyy && graphify install`
2. In Claude Code: `/graphify ./research`
3. Open `graphify-out/graph.html` in a browser - browse the knowledge graph

**Why:** 338 research docs take thousands of tokens to search. Graphify = 71.5x fewer tokens.

### Day 9: Query the graph
**Try this:**
1. `/graphify query "What research covers XMTP?"`
2. Compare speed vs manually grepping `research/*/README.md`
3. Try: `/graphify query "What connects the music player to governance?"`

**Why:** Graph queries find non-obvious connections between concepts.

### Day 10: Install wiki-skills
**Try this:**
1. In Claude Code: `/plugin marketplace add kfchou/wiki-skills`
2. Then: `/plugin install wiki-skills@kfchou/wiki-skills`
3. Test: `/wiki-init` pointed at a test directory

**Why:** Turns research docs into a queryable, compounding wiki (Karpathy pattern).

### Day 11: Wiki ingest
**Try this:**
1. Pick 1 important research doc (try doc 050 - ZAO Complete Guide)
2. Run `/wiki-ingest` and point it at that doc
3. Watch how it creates summary + concept pages + cross-links

**Why:** Each ingest makes future queries smarter. Knowledge compounds.

### Day 12: Install last30days
**Try this:**
1. `/plugin marketplace add mvanhorn/last30days-skill`
2. Research: "Farcaster music communities 2026"
3. Check the auto-saved briefing at `~/Documents/Last30Days/`

**Why:** Real-time social intelligence from Reddit, HN, Polymarket. Grounds content in data.

### Day 13: Nia Docs for API lookups
**Try this:**
1. Run: `npx nia-docs https://docs.neynar.com -c "tree"`
2. Browse the Neynar docs as a filesystem
3. Try: `npx nia-docs https://docs.neynar.com -c "grep -rl 'webhook' ."`

**Why:** Agents read docs as files - no more manually browsing API docs.

### Day 14: Oh-My-Mermaid
**Try this:**
1. Run: `npm install -g oh-my-mermaid && omm setup`
2. In Claude Code: `/omm-scan`
3. Open `.omm/` and view the architecture diagrams

**Why:** Automatic architecture documentation. Shows how modules connect.

---

## Week 3: Content & Communication

### Day 15: Brand voice test
**Try this:**
1. Write a 3-sentence update about today's coding work
2. Ask Claude to rewrite it using the brand-voice skill
3. Compare: which sounds more like your published posts?

**Why:** Consistency across all content. The skill has your real voice patterns.

### Day 16: Quote-cast pattern
**Try this:**
1. Open Farcaster, find a trending cast in music/web3
2. Draft a response that adds tactical value (not just "great cast")
3. Format: bold claim + numbered breakdown + specific example

**Why:** Quote-casts borrow someone's audience while adding original value. High leverage.

### Day 17: Research-first content
**Try this:**
1. Before writing anything today, run `/last30days [your topic]`
2. Read the briefing - what's actually trending?
3. Write content based on what people care about, not what you assume

**Why:** Content grounded in real data gets more engagement than gut-feeling content.

### Day 18: /socials with research
**Try this:**
1. Run last30days on a music/web3 topic
2. Feed the results into `/socials`
3. Compare the output vs running /socials without research context

**Why:** Research-informed social posts are more specific, more relevant, more bookmarkable.

### Day 19: Build-in-public post
**Try this:**
1. Take a screenshot of something you built or fixed today
2. Write a 3-5 sentence build update with the screenshot
3. Include a specific number (files changed, time saved, feature count)

**Why:** Build-in-public posts outperform announcements because they show real work.

### Day 20: Newsletter with voice check
**Try this:**
1. Draft a newsletter with `/newsletter`
2. Check it against `.claude/skills/zao-os/brand-voice.md` rules
3. Fix anything that sounds corporate or vague

**Why:** Every newsletter should sound like Zaal, not like AI.

### Day 21: Review your best cast
**Try this:**
1. Find your best-performing Farcaster cast from the past month
2. What made it work? Numbers? Specificity? Build update? Question?
3. Write that pattern down in your skills journal

**Why:** Your own data tells you what works better than any guide.

---

## Week 4: Codebase & Agent Mastery

### Day 22: Auto-memory review
**Try this:**
1. Read `~/.claude/projects/.../memory/MEMORY.md`
2. Is everything in there still accurate? Update stale entries.
3. Check: are there memories you wish were there but aren't?

**Why:** Stale memory causes Claude to make wrong assumptions. Clean memory = better output.

### Day 23: MemPalace search
**Try this:**
1. If MemPalace is installed: ask "What did I decide about XMTP?"
2. Test cross-session recall: ask about a decision from a previous session
3. Notice what it remembers vs what it misses

**Why:** Cross-session memory across 15+ repos means never re-explaining context.

### Day 24: /investigate vs guessing
**Try this:**
1. Next bug you encounter, DON'T guess the fix
2. Run `/investigate` and follow the 4-phase process
3. Compare: did the root cause match your initial guess?

**Why:** Root cause analysis prevents fix-then-break cycles. Iron law: no fixes without root cause.

### Day 25: /review before shipping
**Try this:**
1. Before your next PR, run `/review`
2. Read everything it flags
3. How many issues would you have caught manually?

**Why:** Code review catches SQL safety, trust boundary violations, conditional side effects.

### Day 26: /autoresearch on a goal
**Try this:**
1. Pick a measurable goal: "reduce homepage load time by 200ms"
2. Run `/autoresearch` with that goal
3. Watch it iterate: modify, verify, keep/discard, repeat

**Why:** Autonomous iteration toward measurable goals. Let the agent drive.

### Day 27: Check your agent squad
**Try this:**
1. Run `/vps status` - see what ZOE, SCOUT, CASTER, ROLO, STOCK are doing
2. Send ZOE a task via Telegram: "brief me on today's agent activity"
3. Check zoe.zaoos.com dashboard

**Why:** 5 agents running 24/7. You should know what they're producing.

### Day 28: Custom skill creation
**Try this:**
1. Think of one repetitive task you do every session
2. Write a 20-line skill for it: name, description, steps
3. Save to `.claude/skills/` and test it

**Why:** Every repetitive task is a skill waiting to be written. 20 lines saves hours over time.

### Day 29: GitNexus exploration
**Try this:**
1. Use GitNexus MCP tools to query the codebase knowledge graph
2. Try: "What are the most connected files in ZAO OS?"
3. Try: "What would break if I changed session.ts?"

**Why:** 17,627 nodes + 23,151 edges indexed. Impact analysis before making changes.

### Day 30: Reflection
**Try this:**
1. Run `/reflect`
2. What tools stuck? What changed your workflow?
3. What do you want to learn in the next 30 days?

**Why:** Learning compounds like code. Track what works, drop what doesn't.
