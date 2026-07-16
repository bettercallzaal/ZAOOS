---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-07-16
related-docs: "154"
original-query: "Research the BEST way to share + collaborate on whitepapers for web3/music org, then audit zao-papers repo + produce concrete TODO list for making it a published, shareable, commentable whitepaper site"
tier: STANDARD-DEEP
---

# 1142 — Whitepaper Share + Collaborate Stack

> **Goal:** Recommend a two-layer architecture for The ZAO's whitepaper publishing: a fresh, beautiful public read surface bridging to GitHub-native collaboration.

## Key Decision

**RECOMMENDED ARCHITECTURE: Two-Layer Pattern**

| Layer | Surface | Audience | Purpose | Tech |
|-------|---------|----------|---------|------|
| **1 - SHARE** | Fresh public webpage (thezao.xyz/papers or standalone Vercel deploy) | Anyone on a phone/desktop, no account needed | Read whitepapers beautifully, share links, understand governance | Astro Starlight on GitHub Pages (or Vercel) + ZAO navy/gold theme, mobile-first |
| **2 - WORKFLOW** | zao-papers repo on GitHub | Devs, contributors, governance participants | Write, version-control, discuss, amend ZIPs via PRs + GitHub Discussions | GitHub Pages raw markdown + PR workflow + per-paper GitHub Discussions |
| **BRIDGE** | "Comment/Collaborate on GitHub" link at bottom of each paper | Reader curious about contributing | Drop reader from share page into GitHub Discussion for that paper | GitHub Discussion link in page footer |

**Why this pattern:**
- Non-technical readers see a polished, fast, mobile-optimized page (no GitHub UI, no friction).
- Developers/contributors work in native GitHub (PRs, Discussions, versioning) - no new platforms.
- Ownership: repo is source of truth, GitHub is permanent, data is exportable.
- Zero lock-in: if the share page disappears, GitHub is still there.
- Web3 credibility: GitHub is the standard for open governance (Optimism, Ethereum, etc.). Mirror/Arweave optional for future archival.

## Current State (zao-papers Audit)

**Repo:** github.com/bettercallzaal/zao-papers (private, no GitHub Pages)

**What exists:**
- README.md (overview of ZIP process)
- PROCESS.md (full ZIP specification + status lifecycle + submission guidelines)
- CLAUDE.md (contributor guidelines for Claude Code)
- zips/ folder with ZIP-0001 (The ZAO Framework, 20KB) + zip-template.md
- No public site, no theme, no GitHub Pages enabled
- No GitHub Discussions enabled
- No site generator config (Nextra, Astro, MkDocs, etc.)
- No public rendering or share links

**Structure is sound for governance:** ZIP process is thorough (status lifecycle, voting gates, amendment workflow). Template exists. Process doc is detailed. Ready for public collaboration.

**Missing to make it publishable + shareable:**
1. Public repo (private blocks all reading/collaboration)
2. A beautiful, fast public read surface with ZAO branding (navy #0a1628, gold #f5a623, mobile-first)
3. Per-paper GitHub Discussion threads (for comments + amendments)
4. A bridge link ("Discuss on GitHub") at the bottom of each paper
5. Navigation + site structure (home, paper list, search, Respect FAQ, etc.)
6. A build step that pulls zao-papers markdown and renders it on the share surface

## Platform Comparison (Decision Background)

Evaluated 8 platforms across 7 dimensions (reading UX, collaboration model, account barrier, ownership, setup effort, cost, web3 adoption). **Rejected alternatives:**

| Platform | Why Not | Better Alternative |
|----------|---------|-------------------|
| Paragraph.xyz | Merging into Mirror; server-stored; less web3 adoption for governance docs | Mirror (if archival layer added later) |
| Mirror.xyz | Excellent for essays/collectibles, but not for collaborative governance workflows; Arweave means slower reads; not designed for discussion threads | GitHub as primary; Mirror optional for archival |
| MkDocs Material | Entering maintenance mode (no new features planned). Requires Python workflow. Less modern UX. | Astro Starlight (actively maintained, better mobile, faster) |
| HackMD | Excellent for real-time drafting collaboration, but server-stored and not a publication platform. | Use as draft layer (optional), not primary. |
| Notion | No web3 signal. Not discoverable in crypto communities. Data trapped behind paywall for non-members. | GitHub + Astro is more open |
| Google Docs | Same issues as Notion. Not web3, not discoverable. | GitHub + Astro |
| GitHub Pages (raw) | No site layout, no theming, no comments, no professional presentation | Add Astro Starlight layer |

## Recommended Implementation Path

### Phase 1: Setup (Zaal-gated decisions)

1. **Make zao-papers PUBLIC** - Enable community reading + forking + discussions
2. **Enable GitHub Discussions** on zao-papers repo (one Discussion per ZIP for amendment proposals + comments)
3. **Decide: Where does the share page live?**
   - **Option A (Lowest effort):** Add Astro Starlight theme to zao-papers itself. GitHub Pages renders at zao-papers.github.io (subdomain). Zaal redirects thezao.xyz/papers to it.
   - **Option B (Custom domain):** Vercel deploy of Astro Starlight pointed at zao-papers markdown. Renders at zao-papers.thezao.xyz or papers.thezao.xyz. Slightly more setup, cleaner branding.
   - **Option C (Monorepo route):** Add Astro Starlight as a publish/ subdirectory in the zao-papers repo itself, built on each PR merge.
   - **Recommendation:** Start with **Option A** (lowest friction), graduate to **Option B** if Vercel is already in the CI/CD flow.

### Phase 2: Build Share Page (Loop-buildable)

1. **Add Astro Starlight theme** to zao-papers (docs/ or pages/ directory)
   - Configure ZAO navy (#0a1628) + gold (#f5a623) color scheme
   - Mobile-first responsive design
   - Markdown rendering with syntax highlighting for YAML frontmatter
   - Built-in search (Starlight provides Pagefind by default)
   - Navigation auto-generated from markdown structure
   
2. **Create site structure:**
   - Home page: brief intro to ZAO governance + link to Fractal process
   - "All Papers" index page with filter by status (Draft, Discussion, Ratified, Superseded)
   - Individual paper pages rendering from zips/ markdown files
   - Respect FAQ / governance glossary (optional first pass)
   - "How to Propose" guide (excerpt from PROCESS.md)

3. **Add GitHub bridge at each paper:**
   - Extract paper number + title from YAML frontmatter (zip: 1, title: "The ZAO Framework")
   - Auto-generate GitHub Discussion link: `https://github.com/bettercallzaal/zao-papers/discussions/new?category=zips&title=ZIP-<num>:<title>`
   - Button/footer: "Comment / Collaborate on GitHub" (gold, visible, bottom of page)
   - (Optional) Embed GitHub Discussions iframe on the page itself, but this requires a public discussion per paper - start with the link approach.

4. **Build + deploy:**
   - `npm install -D astro @astrojs/starlight`
   - Configure astro.config.ts with markdown source path (src/papers/) 
   - `npm run build` → static HTML
   - Deploy to GitHub Pages (auto on each PR merge to main) or Vercel (Astro integrates natively)

### Phase 3: Enable GitHub Discussions (Loop-buildable)

1. **Enable GitHub Discussions** on zao-papers repo (Settings → Discussions)
2. **Create a Discussion category** for ZIP amendments (if not auto-created)
3. **Set Discussion template** to mirror the ZIP amendment process (who can propose, voting gates, timeline)
4. **Link each ZIP** to its Discussion (manual or via GitHub API on PR merge)

### Phase 4: Optional - Future Enhancements

- **Real-time collab layer:** Keep HackMD workspace for drafting new ZIPs (writers collaborate live, then open PR to zao-papers)
- **Arweave archival:** After a ZIP is ratified, optionally publish to Mirror/Arweave for immutable web3 record (one-time ~$0.50 cost)
- **Respect FAQ:** Expand governance glossary with diagrams of Fractal mechanics, Respect distribution, ORDAO voting (high-signal for new members)
- **API endpoint:** Expose ZIP metadata as JSON (useful for ZAO dashboard / ZOE agent to query governance state)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Make zao-papers public on GitHub (Settings → Change to Public) | Zaal | Config | 2026-07-20 |
| Enable GitHub Discussions on zao-papers (Settings → Features → Discussions) | Zaal | Config | 2026-07-20 |
| Confirm which deploy option (GitHub Pages vs Vercel) | Zaal | Decision | 2026-07-20 |
| Implement Astro Starlight theme + ZAO navy/gold colors in zao-papers | Loop | Code | 2026-07-27 |
| Build site structure: home, papers index, individual paper pages | Loop | Code | 2026-07-27 |
| Add "Comment on GitHub" button + Discussion link to each paper | Loop | Code | 2026-08-03 |
| Test on mobile (iPhone) + desktop; verify link clicks work | Loop | Test | 2026-08-03 |
| Deploy to GitHub Pages (or Vercel) + verify live | Loop | Deploy | 2026-08-03 |
| Create first GitHub Discussion for ZIP-0001 (test the workflow) | Zaal | Config | 2026-08-03 |

## Also See

- [Doc 154](../../154-skills-commands-master-reference/) - Skills + workflow reference
- [PROCESS.md](https://github.com/bettercallzaal/zao-papers/blob/main/PROCESS.md) - ZIP specification (source of truth)
- [Astro Starlight docs](https://starlight.astro.build) - Theme configuration
- [GitHub Discussions API](https://docs.github.com/en/graphql-core/reference/mutations#creatediscussion) - Automation

## Sources

- [Astro Starlight official docs](https://starlight.astro.build) (verified live, 2026-07-16) [FULL]
- [GitHub Discussions documentation](https://docs.github.com/en/discussions) (verified live, 2026-07-16) [FULL]
- [GitHub Pages deployment guide for Astro](https://docs.astro.build/en/guides/deploy/github/) (verified live, 2026-07-16) [FULL]
- [ZAO Papers repo audit](https://github.com/bettercallzaal/zao-papers) (cloned + inspected 2026-07-16, private as of audit date) [FULL]
- [Optimism governance on GitHub](https://github.com/ethereum-optimism/OPs) (example of GitHub-native governance, verified 2026-07-16) [FULL]
- [Ethereum governance EIP process](https://eips.ethereum.org/) (example of document-centric + discussion-based governance, verified 2026-07-16) [FULL]

---

## TODO List for Zaal

**Copy-paste ready for the board:**

ZAAL-GATED (decisions/config only):
- [ ] Make zao-papers public (GitHub Settings → Change to Public) - due 2026-07-20
- [ ] Enable GitHub Discussions on zao-papers - due 2026-07-20
- [ ] Choose deploy option: GitHub Pages vs Vercel - due 2026-07-20

LOOP-BUILD (development):
- [ ] Implement Astro Starlight + ZAO navy/gold theme in zao-papers - due 2026-07-27
- [ ] Build site structure (home, papers list, individual pages) - due 2026-07-27
- [ ] Add "Comment on GitHub" button + Discussion link to each paper - due 2026-08-03
- [ ] Test on mobile + desktop - due 2026-08-03
- [ ] Deploy to GitHub Pages/Vercel + verify live - due 2026-08-03

ZAAL-GATED (launch):
- [ ] Create first GitHub Discussion for ZIP-0001 (test workflow) - due 2026-08-03
- [ ] Share public link to thezao.xyz/papers (or deployed URL) with team - after deploy complete
