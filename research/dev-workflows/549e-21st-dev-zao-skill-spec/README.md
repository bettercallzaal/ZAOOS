---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 549a, 549b, 549c, 549d
tier: STANDARD
---

# 549e - `/21st` Skill Spec for ZAO

> **Goal:** A drop-in `SKILL.md` that wraps the 21st.dev Magic MCP tools with ZAO context (stack, brand tokens, repo rules) so any Claude Code session in any ZAO repo can search + lift + adapt components in one command.

## Where This Skill Lives

Create at: `~/.claude/skills/21st/SKILL.md`

Then it's invocable from any ZAO project session as `/21st <query>`.

## Prereqs (Run Once Per Machine)

```bash
# 1. Get API key at https://21st.dev/magic/console (login with GitHub)
# 2. Install Magic MCP into Claude Code
npx @21st-dev/cli@latest install claude --api-key <YOUR_KEY>
# 3. Restart Claude Code
# 4. Verify in any session: /mcp list   (should show "magic-mcp")
```

API key handling: per `.claude/rules/secret-hygiene.md`, never paste in chat or commit. The installer writes it into Claude Code's settings file - that's an acceptable destination because settings stay local.

## The SKILL.md (Copy This Verbatim)

```markdown
---
name: 21st
description: Search, generate, and adapt UI components from 21st.dev's marketplace + Magic MCP for ZAO surfaces (ZAO OS, ZAO Stock, BCZ, FISHBOWLZ-replacement, ZOE chat). Use when adding/refreshing a UI surface and you want to start from a vetted pattern instead of from scratch. Auto-applies ZAO stack (Next 16, React 19, Tailwind v4) + brand tokens (#0a1628 navy, #f5a623 gold) + repo rules (mobile-first, "use client", Biome, no inline styles).
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, mcp__magic-mcp__21st_magic_component_inspiration, mcp__magic-mcp__21st_magic_component_builder, mcp__magic-mcp__21st_magic_component_refiner, mcp__magic-mcp__logo_search
argument-hint: "<natural-language description of the component or surface you want>"
---

# /21st - ZAO Component Search + Generate + Adapt

Wraps 21st.dev Magic MCP for ZAO repos. Cost-aware: free tools first, paid only on user confirmation.

## Decision Tree (run this in order)

### Step 1 - Understand intent

Parse `$ARGUMENTS` into:
- **Surface** (which ZAO project / page): if not stated, ask. Default to the repo you're invoked from.
- **Component type** (hero, CTA, pricing, chat, etc.): pick the closest 21st category from doc 549a.
- **Constraints** (mobile-first, dark theme, brand tokens) - default to ZAO defaults below.

### Step 2 - Always start with FREE Inspiration Search

Call `21st_magic_component_inspiration` with a query that includes:
- Component type
- "dark theme, navy + gold" (ZAO default)
- "mobile-first" (ZAO default)
- The surface context (e.g. "festival sponsor tier", "wallet-gated audio room")

Skim results. Surface top 3-5 to the user with brief one-line summaries.

### Step 3 - Brand SVG search if any logos referenced

If `$ARGUMENTS` mentions brand logos (Farcaster, Base, Spotify, etc.), call `logo_search` for each. Both free.

### Step 4 - Decide path with the user

Present 3 options:

A. **Lift directly** (free, fastest): pick top Inspiration result; this skill adapts it.
B. **Refine an Inspiration result** (Pro tier - $20/mo): one MCP call to `21st_magic_component_refiner` with ZAO context.
C. **Generate fresh variants** (Pro tier): call `21st_magic_component_builder` with brand tokens; user picks 1 of 5.

If no Pro key OR user prefers free, default to A. Never silently spend Pro credits.

### Step 5 - Adapt to ZAO stack (always run)

Whether lifted or generated, sweep the code for:

| Sweep | Action |
|---|---|
| Tailwind v3 `@layer` syntax | Convert to v4 |
| Missing `"use client"` directive on hook-using component | Add at top |
| Inline styles | Convert to Tailwind classes |
| CSS modules | Convert to Tailwind classes |
| Hardcoded colors (any `#` color that isn't `#0a1628` or `#f5a623`) | Flag, replace with brand tokens or Tailwind dark palette |
| `clsx(...)` import | Replace with `cn` from `@/lib/utils` |
| Desktop-first responsive (`lg:` then narrower) | Restructure mobile-first (`sm:`, `md:`, `lg:` ascending) |
| No accessibility focus rings | Add `focus-visible:ring-2 focus-visible:ring-amber-400` |
| Image src with external URL | Confirm with user; default to local `/public/images/...` |

Use `Edit` to apply sweeps; never `Write` over a freshly generated file before sweeping.

### Step 6 - Place the file in the right ZAO directory

| ZAO project | Default dir |
|---|---|
| ZAO OS V1 | `src/components/<feature>/` (per `.claude/rules/components.md`) |
| ZAO Stock site (TBD repo) | `app/components/` per its conventions |
| BCZ portfolio | `components/` |
| FISHBOWLZ-replacement / Juke embed | `src/components/audio/` |
| ZOE dashboard | `apps/zoe/components/` |

Always confirm the path with the user before writing.

### Step 7 - Tell the user

Output:
- File path written
- Source (Inspiration slug or generation prompt)
- Cost (free / Pro N credits)
- Sweep summary ("converted 3 inline styles, added use client, swapped 2 colors to brand tokens")
- Next step suggestion ("preview at http://localhost:3000/<route>?")

## ZAO Defaults (Always Pass to Magic MCP)

```
brand_tokens: { primary: "#f5a623", background: "#0a1628", text: "#e2e8f0" }
stack: "Next.js 16 App Router, React 19, Tailwind v4, TypeScript 6"
constraints: ["dark theme", "mobile-first", "no inline styles", "use cn from @/lib/utils", "use client where hooks/handlers"]
```

## Cost Awareness

| Tool | Cost | When to use |
|---|---|---|
| `21st_magic_component_inspiration` | Free | Always first |
| `logo_search` | Free | Whenever brand logos referenced |
| `21st_magic_component_builder` | Pro | Only on user confirmation, only when no Inspiration match works |
| `21st_magic_component_refiner` | Pro | Only on user confirmation, only when one Inspiration result is 80% there but needs theme adaptation beyond Step 5 sweeps |

If quota errors come back from any paid tool: degrade gracefully to lift-and-sweep, surface error to user, do NOT auto-retry.

## Anti-Patterns (Skip)

- Calling `21st_magic_component_builder` when Step 2 returned a strong match
- Generating without passing brand tokens
- Writing files without sweep
- Lifting components with unclear license for ZAO public-facing surfaces (per doc 549c, prefer Magic-generated for `zaoos.com` / `thezao.com` / `bettercallzaal.com`)
- Mixing Tailwind v3 + v4 syntax
- Touching `community.config.ts` without explicit user request

## Example Invocations

```
/21st sponsor tier pricing card with Bronze/Silver/Gold/Founder for ZAO Stock landing
/21st AI chat input bar with tool indicators for ZOE shell
/21st audio room CTA with live listener count for FISHBOWLZ replacement
/21st refresh /stake hero with token chart placeholder
/21st RSVP button card mobile-first
```

## Failure Modes

| Symptom | Recovery |
|---|---|
| `magic-mcp` not in `/mcp list` | Install: `npx @21st-dev/cli@latest install claude --api-key <key>`, restart Claude Code |
| Quota error | Surface to user; offer free fallback |
| Generated code uses non-Tailwind-v4 syntax | Apply Step 5 sweep; if still broken, ask user to manually review |
| Brand tokens ignored | Re-prompt the refiner with explicit brand tokens; if still off, manual swap |
| Mobile-first violation | Apply Step 5 restructure; verify with user before commit |

## Memory Hooks

After successful use, suggest saving:
- Top 3 contributor handles whose components fit ZAO -> `feedback_21st_signals.md`
- Patterns that worked -> `feedback_21st_wins.md`
- Patterns that didn't -> `feedback_21st_losses.md`

This builds a project-specific 21st taste over time.

## Cross-References

- Doc 549 (hub) - decision matrix
- Doc 549a - catalog inventory
- Doc 549b - access patterns
- Doc 549c - pricing & licensing
- Doc 549d - other 21st-dev products (1code, sdk)
- `.claude/rules/components.md` - ZAO component conventions
- `.claude/rules/typescript-hygiene.md` - TS rules
- `community.config.ts` - brand tokens source of truth
```

## How to Install This Skill

```bash
# 1. Make the skill dir
mkdir -p ~/.claude/skills/21st

# 2. Save the SKILL.md content above (the block between the ```markdown fences)
# Copy from this doc, paste into the file
nano ~/.claude/skills/21st/SKILL.md   # or use your editor

# 3. Verify Claude Code picks it up
# In any session: /21st test query
```

## How To Iterate The Skill

This skill ships v0.1. Expected to refine after first ZAO Stock site sprint - brand-token sweeps, default invocation patterns, contributor-handle memory. Update process:

1. After each meaningful use, note what worked / didn't in a session-end reflection
2. Once a month, refine `Step 5 - Sweep` table with new rules learned
3. After first 10 uses, post a "what changed" doc as 549e1 (no hyphen) if material

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Drop the SKILL.md into `~/.claude/skills/21st/SKILL.md` | Zaal | One-shot | This week |
| First test on `/stake` hero refresh | Zaal | Spike | Same |
| Refine Step 5 sweep rules from spike findings | Zaal or auto | PR to skill | After 1st use |
| Capture top-fit contributor handles to memory | Auto via skill | Memory | Ongoing |

## Sources

- [21st-dev/magic-mcp tool surface](https://github.com/21st-dev/magic-mcp) - exact tool names + behaviour
- ZAO `.claude/rules/components.md` - in-repo component conventions
- ZAO `.claude/rules/typescript-hygiene.md` - in-repo TS hygiene
- `community.config.ts` - brand tokens source of truth
- Doc 549b - install command verified

## Staleness Notes

Tool names (`21st_magic_component_*`, `logo_search`) verified from `magic-mcp` README on 2026-04-29. If 21st-dev renames tools, this skill needs updating - watch repo releases.
