# 256 — ZOE Agent Factory: The Vision

**Category:** AI/Agents / Architecture
**Status:** Active design
**Priority:** P0

---

## Vision

ZOE becomes the best agent curator and creator in the ZAO ecosystem. She builds agents, tests what works, eventually builds a factory that can make agents itself — then ZOE just watches.

## The Experiment

ZOE is both scientist and factory:
- **Scientist:** Tests different agent approaches, measures what works, iterates
- **Factory:** Produces agents for ZAO members — artist agents, assistant agents, product agents
- **Goal:** Factory becomes self-sustaining. ZOE oversees, doesn't build every agent by hand.

## Agent Hierarchy

```
ZOE (overseer / factory / scientist)
├── ZOEY (action agent — external execution, represents ZAO)
├── FISHBOWLZ Agent (persistent audio spaces product)
├── Artist Agent Template (everything but the music)
│   ├── Lead Gen — cold leads → warm leads for client work
│   ├── Opportunity Finder — metaverse gigs, livestreams, local venues, crypto conferences, nearby cities
│   ├── Booking / Outreach — actually reaching out, following up
│   └── Career Intelligence — what's working, what to try next
├── Member Assistant Agents (personalized per ZAO member)
│   ├── Customized to their strengths and needs
│   └── Suggests ways to support ZAO that fit them
└── Future: Self-replicating factory (ZOE teaches factory, factory makes agents, ZOE watches)
```

## Artist Agent — "Everything But The Music"

The core value prop: artists focus 100% on their craft. The agent handles everything else.

### What It Does
- **Cold → Warm Leads:** Finds potential clients, venues, collaborators. Warms them up through engagement, DMs, social proof.
- **Performance Opportunities:** Scans for gigs — metaverse shows, livestream slots, local venue openings, nearby city events, crypto conference stages, festival submissions.
- **Booking & Outreach:** Actually reaches out. Sends emails, DMs, applications. Follows up. Tracks responses.
- **Career Intelligence:** Analyzes what's working (which posts get engagement, which outreach converts, which genres are trending). Recommends next moves.
- **Administrative:** Updates bios, submits to playlists, manages social posting schedule.

### What It Does NOT Do
- Make music
- Make creative decisions about the art itself
- Spend money without approval

### Per-Artist Customization
Each ZAO member's artist agent is tuned to them:
- Their genre/style
- Their location (for local gig finding)
- Their goals (touring vs studio vs sync licensing vs teaching)
- Their existing network (warm contacts to leverage)
- Their comfort level (introvert vs extrovert outreach style)

## Member Assistant Agents

Beyond artist-specific agents, each ZAO member gets a general assistant that:
- Knows their role in ZAO
- Suggests ways to contribute that match their strengths
- Surfaces relevant opportunities from the ecosystem
- Connects them with other members working on similar things
- Tracks their engagement and suggests improvements

## The Factory Evolution

### Phase 1: ZOE builds agents manually
ZOE creates each agent by hand. Learns what works, what fails. Documents patterns.

### Phase 2: ZOE builds templates
Common patterns get abstracted into templates. New agents spin up from templates with customization.

### Phase 3: Factory builds agents
ZOE creates a meta-agent that can produce new agents from templates. ZOE provides oversight, not labor.

### Phase 4: ZOE watches
Factory runs itself. ZOE monitors quality, intervenes on edge cases, evolves the templates based on results.

## Measurement

How ZOE knows the experiment is working:
- Number of agents created and active
- Member satisfaction (are agents actually helpful?)
- Lead conversion rates (cold → warm → booked)
- Gig opportunities surfaced vs. gig opportunities landed
- Token velocity in FISHBOWLZ
- Member retention in ZAO
- Research docs produced per week
- Agent uptime and error rates

## Integration Points

- **Farcaster:** Agent posting, scanning, engagement
- **FISHBOWLZ:** Agents join rooms, host, tip
- **publish.new:** Agents sell digital products (x402)
- **AgentMail:** Email outreach for booking
- **Neynar API:** Farcaster data for intelligence
- **OpenClaw:** All agents run on this stack
- **Bootcamp curriculum:** Knowledge backbone through Apr 10

## Immediate Next Steps

1. Launch FISHBOWLZ Clanker token (Apr 4)
2. Finish ZOEY setup (action agent operational)
3. Spec artist agent template (detailed capabilities)
4. Build first artist agent for one ZAO member as pilot
5. Monitor bootcamp sessions Apr 6-10 for patterns to incorporate
