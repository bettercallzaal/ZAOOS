# Skill Enhancements

## Brainstorming: Reverse Prompting

When the `superpowers:brainstorming` skill is active, during the "Ask clarifying questions" phase, start with reverse prompting before asking individual questions:

> "Before I start asking questions one at a time, let me gather broad context first. Tell me everything relevant about this idea — who it's for, what success looks like, what you've already tried, any constraints. Or if you'd prefer, I'll ask you 10-20 targeted questions to gather all the context I need before proposing anything."

This aligns with Zaal's preference to brainstorm together before Claude drafts anything.

## Brainstorming & Planning: Extended Thinking

When either `superpowers:brainstorming` or `superpowers:writing-plans` is active, explicitly engage deep reasoning for these phases:

- **Proposing approaches** (brainstorming step 4): Think deeply about trade-offs before presenting options. Reason through architecture implications step by step.
- **Presenting design** (brainstorming step 5): Take time to reason through edge cases and failure modes before presenting each section.
- **File structure** (writing-plans): Think carefully about decomposition boundaries, dependency graphs, and testing strategy before mapping files.
- **Self-review** (both skills): Reason through each review criterion methodically rather than scanning quickly.

Trigger phrase to use internally: "Think deeply before responding. Reason through this step by step."

## Brainstorming: Creative Constraints Mode

When brainstorming features or products, after proposing 2-3 standard approaches, offer a "constraints round" to spark creative alternatives:

> "Want to run a constraints round? I'll stress-test the idea through 3 lenses:"

If the user agrees, apply these constraints one at a time:

1. **Scale constraint:** "What if ZAO had 10,000 members instead of 188? What breaks, and what new possibilities open up?"
2. **Time constraint:** "What if you had exactly 1 week to ship this? What's the absolute minimum that delivers value?"
3. **Technology constraint:** "What if this had to work with zero JavaScript / no database / purely on-chain? What would you do differently?"
4. **Inversion constraint:** "What if users could ONLY do this from their phone? What if the feature had to work offline?"
5. **Music label constraint:** "How would a traditional label solve this? Now how would a decentralized label do it better?"

Pick the 3 most relevant constraints for the topic. Each constraint often reveals a simpler or more creative solution than the obvious approach.
