# 409 - Claude Skills: Anthropic Engineers Barry & Mahesh Explain

> **Status:** Research complete
> **Date:** April 16, 2026
> **Goal:** How Claude Skills work according to Anthropic engineers - "skills are just folders" - from Kirill's 17min summary + 4hr course reference
> **Source:** [@kirillk_web3 on X](https://x.com/kirillk_web3/status/2043037616979759465)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **What skills are** | Folders with markdown files. Claude reads them when invoked. Not code, not plugins - just structured knowledge. |
| **Where they live** | `.claude/skills/` in your project or `~/.claude/skills/` globally |
| **When to create one** | Any repeatable workflow you explain to Claude more than twice. Encode it as a skill. |
| **ZAO OS status** | Already have 11+ project skills in `.claude/skills/`. This validates our approach. |

---

## Core Concept: "Skills Are Just Folders"

From Anthropic engineers Barry and Mahesh:

- A skill = a folder containing markdown files
- Claude reads the markdown when the skill is invoked
- The markdown teaches Claude about your job, workflow, and expertise
- Skills make Claude more capable over time by accumulating your team's knowledge
- No code required - just structured documentation

### Skill File Structure

```
.claude/skills/
  my-skill/
    SKILL.md          # Main skill definition (name, description, instructions)
    reference.md      # Optional supporting docs
    templates/        # Optional templates
```

### SKILL.md Format

```markdown
---
name: skill-name
description: When to trigger this skill
---

## Instructions

Step-by-step workflow...
```

---

## Key Insights from the Videos

### 17-Minute Summary (Kirill's Condensation)

1. **Skills grow with you** - Start simple, add detail as edge cases emerge
2. **Skills encode tribal knowledge** - The stuff that's "in your head" about how your team works
3. **Skills replace onboarding docs** - New Claude sessions (and new team members) get up to speed instantly
4. **Skills are composable** - One skill can reference another

### 4-Hour Full Course Framework

Claude -> Tools -> Automation -> Products -> Money

The progression:
1. **Claude** - Learn to prompt effectively
2. **Tools** - Build MCP servers, skills, custom commands
3. **Automation** - Chain tools into workflows
4. **Products** - Ship products faster than humanly possible
5. **Money** - Monetize the speed advantage

---

## ZAO OS Skill Inventory (Current)

Already have 11+ skills in `.claude/skills/`:

| Skill | Purpose |
|-------|---------|
| `/worksession` | Isolated git worktree creation |
| `/zao-research` | Research with 319+ doc library |
| `/inbox` | Process ZOE email inbox |
| `/vps` | Manage ZOE on VPS |
| `/ship` | PR creation workflow |
| `/qa` | QA testing and fix loop |
| `/review` | Pre-landing code review |
| `/investigate` | Root cause debugging |
| `/design-review` | Visual QA audit |
| `/newsletter` | Year of the ZABAL posts |
| `/socials` | Multi-platform social posts |

Plus ~30 gstack/superpowers skills, 8 autoresearch subcommands.

**Validation:** ZAO OS is already following the exact pattern Anthropic engineers recommend. Our skills are "just folders" with markdown instructions.

---

## What We Could Improve

| Gap | Fix |
|-----|-----|
| Some skills are long (1000+ lines) | Break into focused sub-skills per the composability principle |
| No skill versioning | Add `version:` to frontmatter, track changes |
| Skills don't reference each other explicitly | Add cross-references (e.g. `/ship` should mention `/review` as prerequisite) |
| No skill discovery for new sessions | Doc 154 exists but could be a skill itself |

---

## Sources

- [@kirillk_web3 - Claude Skills by Anthropic Engineers](https://x.com/kirillk_web3/status/2043037616979759465)
- [Claude Code Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Doc 154 - Skills Commands Master Reference](../../154-skills-commands-master-reference/)
