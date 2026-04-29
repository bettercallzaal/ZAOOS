---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-04-29
related-docs: 549, 549a, 549c, 549d, 549e
tier: STANDARD
---

# 549b - 21st.dev Access Patterns + Alternatives

> **Goal:** Lock down the exact install command, what tools we get, what each tool costs, and why 21st beats the alternatives for ZAO. So we can skip evaluation paralysis next time someone asks "should we use 21st or shadcn-ui-mcp-server?"

## Install (Claude Code, one-liner)

```bash
# 1. Generate API key at https://21st.dev/magic/console
# 2. Run installer (writes MCP config to your Claude Code settings)
npx @21st-dev/cli@latest install claude --api-key <YOUR_KEY>
# 3. Restart Claude Code session
```

Same `cli` supports `cursor`, `windsurf`, `cline`. VS Code uses MCP block in user settings JSON or one-click badge from `magic-mcp` README.

> **API key location:** `https://21st.dev/magic/console` - log in with GitHub or email, copy key. Treat as a secret per ZAO `.claude/rules/secret-hygiene.md`. Do NOT commit. Add to `.env.local` if any local script needs it; the installer writes it into Claude Code's settings, not the project.

## What MCP Tools Get Installed (4 total)

| Tool | Cost | What it actually does |
|---|---|---|
| `21st_magic_component_inspiration` | Free | Semantic search across the marketplace. Returns matched components with code + preview URL + metadata. Use as the default first move on any UI prompt. |
| `logo_search` | Free | Brand SVG search via svgl. Pass a brand name, get back SVG markup ready to paste. Replaces "find me a Spotify logo SVG" Google trips. |
| `21st_magic_component_builder` | Pro ($20/mo) | Generate 5 polished variants of a component from natural-language description. Opens browser tab to pick. |
| `21st_magic_component_refiner` | Pro ($20/mo) | Iterate on an existing component (yours or a generated one). Useful for theme adaptation, accessibility passes, prop API tweaks. |

All four return code that's TypeScript + React + Tailwind by default. Refiner can target other stacks per docs but ZAO doesn't need that.

## Stack Compatibility with ZAO

| ZAO requirement | 21st default output | Match |
|---|---|---|
| Next.js 16 App Router | React + Tailwind, framework-agnostic in JSX form | Yes (paste into client component) |
| React 19 | Compatible | Yes |
| Tailwind v4 | Tailwind classes (v3/v4 mostly identical for util output) | Yes - watch for legacy `@layer` syntax in older components |
| TypeScript | Generated as TSX | Yes |
| `cn` utility from `@/lib/utils` | Often uses `cn` already; sometimes inline `clsx` | Adapt during paste |
| `"use client"` directive | Sometimes missing on hook-using components | Add manually per `.claude/rules/components.md` |
| Mobile-first responsive | Most heroes/CTAs default desktop-first | Adapt; the `/21st` skill (549e) will enforce |
| Dark-theme tokens (`#0a1628`, `#f5a623`) | Components ship with their own tokens | Skill sweeps + replaces |

## Alternatives Considered (Why Not Pick Them)

| Alt | What it does | Why we still pick 21st |
|---|---|---|
| **shadcn-ui-mcp-server** (`Jpisnice/shadcn-ui-mcp-server`) | Read shadcn/ui + community shadcn registries, copy block code | Catalog is shadcn-only. No semantic search across community marketplace. No generation. |
| **shadcn/ui official MCP** (`ui.shadcn.com/docs/registry/mcp`) | Lists shadcn registry items | Same as above. Ships with shadcn (which ZAO doesn't use everywhere). |
| **shadcn studio MCP** (`shadcnstudio.com`) | Slightly fancier shadcn aggregator | Still shadcn-bound. |
| **Aceternity UI** | High-quality animated components | No MCP. Manual copy-paste. |
| **MagicUI** | Open-source animated components | No MCP at this size. Smaller catalog. |
| **OriginUI** | Free shadcn-compatible blocks | No MCP. Smaller. |
| **v0.dev (Vercel)** | AI component generation, browser-only | No MCP. No catalog browse. Lock-in to vercel.com flow. |
| **Cursor's built-in** | Some component scaffolding via Cursor agent | Editor-locked. ZAO uses Claude Code. |

**Why 21st wins for ZAO:**

1. Magic MCP is the only one that bundles **catalog search + generation + iteration** in one install.
2. Open-source MIT MCP layer means we can fork or self-host if pricing changes.
3. 47K monthly DLs + 4.8K stars = active enough to trust.
4. Catalog is community-published, not just one team's components - higher diversity, better odds the right pattern already exists.

## Programmatic Access Beyond MCP

For server-side / CI use beyond Claude Code:

- **REST API:** Surface mentioned across third-party MCP directories but not enumerated on `21st.dev/docs` (which 404'd on fetch 2026-04-29). The MCP itself wraps the same backend; calling MCP from a script is the path.
- **`21st-sdk`** (107 stars) - SDK package for embedding 21st features in apps. Not yet audited for ZAO use; see [549d](../549d-21st-dev-ai-features-magic/).
- **`21st-extension`** (133 stars) - browser extension. Not relevant to repo workflow.

## Auth + Quotas

- Free tier: API key + low quota on `21st_magic_component_builder` (5 free requests per PulseMCP listing; conflicts with `/magic` page's "100 credits"). Free tools (`inspiration`, `logo_search`) are unmetered to the published claim.
- Pro: same key, raised quota.
- Max: same key, max quota + site cloning + early access.

API key is per-user. No team plan documented. If the team needs shared access, each engineer gets their own key (this is the recommended pattern for cost attribution anyway).

## Failure Modes + Mitigations

| Failure | Mitigation |
|---|---|
| Quota exhausted mid-session | Skill (549e) checks for `21st_magic_component_*` errors and falls back to inspiration-only mode |
| MCP server down | Skill detects timeout, surfaces it, suggests manual browse at `21st.dev/community/` |
| Generated code uses non-Tailwind-v4 syntax | Skill includes "Tailwind v4 only" instruction in the refiner prompt |
| Generated code missing `"use client"` | Skill post-processes to add directive on detected hooks |
| Brand tokens ignored by generator | Skill passes brand tokens explicitly in every Magic call |

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Generate API key at `21st.dev/magic/console` | Zaal | One-shot | This week |
| Run `npx @21st-dev/cli@latest install claude --api-key <key>` | Zaal | One-shot | Same |
| Restart Claude Code session, verify with `/mcp list` | Zaal | Verify | Same |
| Run first free `21st_magic_component_inspiration` query | Zaal | Spike | Same |

## Sources

- [21st-dev/magic-mcp on GitHub](https://github.com/21st-dev/magic-mcp) - 4,815 stars, MIT, last updated 2026-04-29
- [@21st-dev/cli on npm](https://www.npmjs.com/package/@21st-dev/cli)
- [Jpisnice/shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server) - alt 1
- [ui.shadcn.com MCP docs](https://ui.shadcn.com/docs/registry/mcp) - alt 2
- [shadcnstudio.com MCP docs](https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server) - alt 3
- [PulseMCP - 21st-dev/magic](https://www.pulsemcp.com/servers/21st-dev-magic) - tool surface + quota notes

## Staleness Notes

Free-tier quota figure (5 vs 100) unresolved at fetch time. Verify at signup. Update both this doc and 549c.
