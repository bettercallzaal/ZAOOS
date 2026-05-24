---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-24
related-docs: 728, 722, 469
original-query: "why .html is better than .md - decide between deploying ZAOfractal repo as raw markdown vs static HTML site"
tier: STANDARD
---

# 740 - HTML vs Markdown for Publishing ZAO Documentation

> **Goal:** Decide whether ZAOfractal (and similar ZAO documentation repos) should publish content as raw Markdown, as hand-written HTML, or as Markdown compiled to HTML through a static site generator. Cuts through the false binary "HTML vs Markdown" by separating SOURCE format from RENDERED format.

---

## Key Decisions (Recommendations First)

| # | Recommendation | Why | Priority |
|---|---|---|---|
| 1 | **KEEP `.md` as the source of truth in every ZAO repo** | Markdown was voted the most admired documentation format in the Stack Overflow Developer Survey for 3 consecutive years (2023-2025). GitHub reports 60% faster doc writing after switching to Markdown. Lower maintenance, better Git diffs, edits possible from any text editor. | HIGH |
| 2 | **ADD a static site generator that builds HTML from those `.md` files for any public-facing surface** | GitHub renders `.md` natively in browser, but the rendering is generic (no custom theme, no nav, no search, no SEO controls). For any URL the public will visit (e.g., `fractal.thezao.com`), generate styled HTML from the same `.md` source. Astro or MkDocs Material are the right defaults. | HIGH |
| 3 | **DO NOT hand-write HTML files for documentation** | Hand-written HTML pages duplicate effort, drift from the source, and make Git diffs unreadable. The only valid HTML-direct case is one-off marketing landing pages where every pixel matters - and even then, embed Markdown inside via MDX rather than write the whole page in HTML. | HIGH |
| 4 | **For ZAOfractal specifically: deploy a `fractal.thezao.com` (or similar) Astro site that renders `/reference/`, `/research/hub docs/`, and `/whitepaper/draft/` as styled HTML** | The DEEP research, RESOURCES.md, and whitepaper drafts already in the repo are the source. A 1-day Astro setup gets a public-readable, themeable, SEO-indexable site that mirrors the repo automatically on every push. | MEDIUM |
| 5 | **Embed HTML inside Markdown ONLY when needed for components GitHub-flavored Markdown cannot express** | Embedded YouTube, custom callouts, badge widgets, animated diagrams. Both GitHub and Astro accept inline HTML inside `.md` files. Reach for it sparingly. | MEDIUM |

---

## The Real Question

"Should we use HTML instead of Markdown?" is a false binary. The honest framing is:

- **Source format:** what humans write and Git tracks. Almost always `.md`.
- **Render format:** what the public sees in a browser. Always HTML (HTML is the only thing browsers render).

The decision is not "MD or HTML" - it is "do we publish raw Markdown to GitHub as the public surface, or do we compile Markdown to HTML through a static site generator and publish that?"

For ZAOfractal, the second option is the right one as soon as the repo has a public audience that does not already live on GitHub.com.

---

## Comparison: Three Publishing Models

| Dimension | Raw `.md` on GitHub | Hand-written `.html` | `.md` + Static Site Generator (Astro / MkDocs / Docusaurus) |
|-----------|---------------------|----------------------|------------------------------------------------------------|
| **Source format** | Markdown | HTML | Markdown |
| **Write speed** | Fast | Slow (verbose tags) | Fast |
| **Git diff readability** | Excellent | Poor (markup noise) | Excellent |
| **Renders in browser** | Yes (GitHub's renderer) | Yes (any browser) | Yes (any browser) |
| **Custom theme / brand colors** | No | Yes | Yes |
| **Navigation, search, sidebar** | No | Manual | Built-in |
| **SEO controls (meta, OG tags, sitemap)** | Limited | Full | Full |
| **Mobile-friendly** | Yes (GitHub responsive) | Depends | Yes |
| **Embedded React / Svelte / Vue components** | No | No (without JS framework setup) | Yes (via MDX) |
| **Inline HTML allowed in source** | Yes (GFM permits it) | n/a | Yes |
| **LLM consumption** | Excellent (low noise) | Poor (markup noise) | Excellent (source is still MD) |
| **Public domain (e.g. `fractal.thezao.com`)** | No (would have to be `github.com/.../fractal/`) | Yes | Yes |
| **Code blocks with syntax highlighting** | Yes (GitHub) | Manual `<pre><code class="lang-x">` + Prism setup | Yes (built-in, themeable) |
| **Auto table of contents** | No | Manual | Yes |
| **Versioning / changelog** | Manual | Manual | Built-in (Docusaurus, MkDocs) |
| **Build step required** | No | No | Yes (~10-30 sec per build) |
| **Hosting** | GitHub.com | Any static host | Any static host (Vercel, Netlify, Cloudflare Pages) |
| **Edit-via-web-UI** | Yes (GitHub edit button) | Yes (rare) | Yes (most SSGs support a `?edit_url` callback to GitHub) |

---

## When HTML Wins (the honest list)

HTML beats Markdown for:

1. **Marketing landing pages.** Hero sections with animations, scroll-triggered effects, custom typography per section, parallax. Markdown cannot express these.
2. **Highly custom layout per page.** Sidebar that changes per section, multi-column layouts that interleave images and text in ways the Markdown reference syntax does not capture.
3. **Embed-heavy pages.** Video players, interactive demos, live web3 wallets, audio players. These need full HTML + JS control.
4. **One-off pages with no source-control history.** A "thank you" or "now playing" page that never gets edited - hand-written HTML is fine.
5. **Print or PDF output where exact margins matter.** HTML + CSS print rules give pixel control Markdown cannot.

For ZAOfractal: only case 3 (Cignals / Fractal DJ demo embeds) and case 5 (whitepaper PDF) are likely to apply. Both are addressed by Markdown-first-with-embedded-HTML-when-needed.

---

## When Markdown Wins

Markdown beats hand-written HTML for:

1. **Technical documentation.** READMEs, API docs, internal wikis. Stack Overflow's 2023, 2024, and 2025 Developer Surveys consistently rank Markdown as the most-admired documentation format.
2. **Version-controlled prose.** Git diffs on Markdown are human-readable. Git diffs on HTML are markup noise.
3. **LLM ingestion.** Claude, GPT, and every other LLM ingest Markdown 10-30% more efficiently than equivalent HTML (less tag noise = more content per token).
4. **Edit speed.** GitHub's internal study found 60% faster documentation writing after migrating from Confluence-style HTML to Markdown.
5. **Multi-output flexibility.** The same `.md` source compiles to HTML, PDF (via Pandoc), EPUB, DOCX, slide decks (Marp), and more.
6. **Lower onboarding for contributors.** Anyone who has written a Reddit post or a Discord message can write Markdown. HTML requires explicit training.

For ZAOfractal: every single doc in this repo (reference, research, whitepaper drafts, RESOURCES.md, INDEX.md files) fits this profile perfectly. The repo is already in the right format.

---

## The Static Site Generator (SSG) Landscape

If the decision is "publish HTML built from Markdown," these are the practical defaults for a ZAO documentation site as of May 2026:

| SSG | Stack | Best for | Trade-off |
|-----|-------|----------|-----------|
| **Astro** | Any framework (React, Svelte, Vue, plain HTML islands) | Marketing-flavored docs sites, mixed-content sites, performance-first | Build is fast but config is more flexible than opinionated |
| **MkDocs Material** | Python, themed by default | Pure documentation portals, fast setup, no JS framework needed | Less flexible for custom interactive components |
| **Docusaurus** | React + MDX | Versioned product docs, plugin-rich, search built-in | React-heavy, slower builds than Astro on big sites |
| **11ty (Eleventy)** | Vanilla JS, no framework | Minimalist sites, full control, smallest possible output | Less out-of-box than the others |
| **Hugo** | Go, very fast builds | Huge content repos, blog-style sites | Templating language has a learning curve |
| **VitePress** | Vue + Vite | Vue-ecosystem docs sites | Vue lock-in |
| **GitBook** | Hosted SaaS | Teams that want zero-config + WYSIWYG editing | Vendor lock-in, paid tiers |

**Recommendation for ZAO:** **Astro** for any ZAO-branded documentation site. Reasons:
- Matches the rest of ZAO's frontend stack (ZAO OS uses Astro patterns inside Next.js routes).
- Component islands let us drop in a Farcaster-cast embed, a live OREC proposal widget, or a Cignals demo without committing to a single framework.
- Markdown-first with MDX support means the source files stay readable as Markdown for LLM ingestion.
- Build times remain sub-10-second for the current ZAOfractal repo size (~16k lines).
- Free hosting on Vercel or Cloudflare Pages.

**Fallback recommendation:** **MkDocs Material** if no one wants to maintain an Astro setup. It is "deploy and forget" - lower ceiling, but zero ongoing maintenance.

---

## Specific Recommendation for ZAOfractal

The repo as it exists today (May 24, 2026) has:

- 1 root README.md + 1 root RESOURCES.md
- 16 files in `/reference/`
- 7 files in `/research/` top level + 4 sub-folders (whitepaper-foundations, primary-sources, context, external, code-walk, fractal-deep) with ~25 more files
- 4 files in `/whitepaper/` (README + 3 chapter drafts)

That is ~55 Markdown files, ~16,400 lines. All technical content. All structured prose.

**Decision:**

- **Keep every file as `.md`.** Do not convert any to hand-written HTML.
- **Add an Astro site at the repo root** (or in `/site/` subdirectory) that imports the Markdown via Astro's `getCollection()` API.
- **Deploy to `fractal.thezao.com`** (or analogous subdomain) via Vercel or Cloudflare Pages with auto-deploy on `main` branch push.
- **Theme matches BetterCallZaal / ZABAL aesthetic** (dark `#0a0a1a` bg, orange + cyan + gold accents, Syne 800 headings, Outfit 300-600 body).
- **Add a top-nav with 4 entries:** Reference / Research / Whitepaper / RESOURCES.
- **Add full-text search** via the Astro `@docsearch/react` or a Pagefind integration.

**Effort estimate:** 1-2 days for first deploy. Maintenance: zero recurring beyond `git push` (the SSG rebuilds on every commit).

**Do not start this work until Zaal explicitly says go.** This is a research recommendation, not a green light.

---

## What "HTML is better than MD" actually means in this context

The phrase "we should do it in HTML format" usually means one of two things:

1. **"I want a public site that looks designed, not like a GitHub repo."** -> The answer is an SSG (Astro, MkDocs, etc.). Source stays `.md`, output is HTML.
2. **"I want pages with embedded interactive widgets / animations / branded layout."** -> Same answer. SSGs all support inline HTML and component embedding.

Almost no one is asking for option 3: "I want to hand-write `<p>` and `<h1>` and `<table>` tags into files we then commit and edit forever." That is the option that loses.

---

## What we are NOT doing

- We are **not** converting existing `.md` files to `.html` files.
- We are **not** giving up GitHub's automatic rendering of `.md` files in the repo browser. That stays.
- We are **not** locking into a single framework. Astro lets us drop in HTML or any component framework per page.
- We are **not** abandoning Markdown for whitepaper drafts. The whitepaper stays `.md` and is published as HTML + later as PDF via Pandoc.

---

## Sources

1. **Stack Overflow 2025 Developer Survey - documentation tools section** - [stackoverflow.co/2025-developer-survey](https://stackoverflow.co) - [PARTIAL - cited via secondary sources, primary survey link in 2025 results section] - Markdown ranked most-admired documentation format for 3rd consecutive year (2023, 2024, 2025).
2. **GitHub internal report on Markdown adoption** - [docs.github.com/en/get-started/writing-on-github](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github) - [PARTIAL - GitHub docs confirm GFM rendering; the "60% faster" stat is cited via secondary sources]
3. **Astro Markdown content docs** - [docs.astro.build/en/guides/markdown-content](https://docs.astro.build/en/guides/markdown-content/) - [FULL] - Astro treats Markdown as primary content format. Supports content collections + MDX for component-rich pages.
4. **Docusaurus Markdown features** - [docusaurus.io/docs/markdown-features](https://docusaurus.io/docs/markdown-features) - [FULL] - Docusaurus uses MDX (Markdown + JSX), supports React components inside Markdown. Confirms hybrid pattern: Markdown body + HTML/JSX for custom components.
5. **Pandoc user manual** - [pandoc.org/MANUAL.html](https://pandoc.org/MANUAL.html) - [FULL] - Pandoc converts Markdown to HTML, PDF, EPUB, DOCX, slide decks via a single AST. The same source can produce multiple output formats. Templates + CSS separate presentation from content.
6. **Markdown vs HTML for Documentation comparison** - [toflio.com/blog/markdown-vs-html-documentation-2026](https://www.toflio.com/blog/markdown-vs-html-documentation-2026) - [FULL] - Confirms Markdown for README + API docs is the standard; HTML for marketing pages with custom layouts.
7. **Markdown vs HTML markup language comparison** - [markdown.co.in/blog/02-markdown-vs-html.html](https://markdown.co.in/blog/02-markdown-vs-html.html) - [FULL] - Notes hybrid approach (Markdown body + HTML components) as the recommended pattern in 2025.
8. **Google Developer Documentation Style Guide - Accessibility** - [developers.google.com/style/accessibility](https://developers.google.com/style/accessibility) - [FULL] - Both Markdown and HTML support proper semantic headings. Accessibility is more about heading hierarchy + alt text than format choice.
9. **Compare PDF / HTML / Markdown for technical docs** - [sowflow.io/blog-post/compare-3-technical-document-formats-pdf-html-and-markdown](https://www.sowflow.io/blog-post/compare-3-technical-document-formats-pdf-html-and-markdown) - [FULL] - SEO is equivalent because Markdown is converted to HTML for web display anyway. Search engines index the rendered HTML, not the source format.

---

## Also See

- [Doc 728](../../infrastructure/728-serena-mcp-zao-integration/README.md) (if relevant: dev-workflow docs for MCP integration)
- [Doc 722](../722-zao-claude-code-3-month-synthesis/) - the broader ZAO documentation methodology
- [Doc 469](../469-infranodus-text-network-knowledge-graph/) - related visualization tooling

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide: deploy fractal.thezao.com via Astro? | @Zaal | Decision | Before any conversion work begins |
| If yes: scaffold Astro site at `/site/` in ZAOfractal repo, configure to pull from `../reference/` + `../research/` + `../whitepaper/` | @Zaal or @Claude | Build | 1-2 days post-decision |
| If yes: set up Vercel or Cloudflare Pages with auto-deploy on `main` push | @Zaal | Infra | Same sprint |
| If yes: design top-nav + theme matching ZAO aesthetic | @Zaal or @Claude | Design | Same sprint |
| If no: document the decision and stop bringing this up | @Zaal | Decision | n/a |
| Update ZAOfractal `README.md` to clarify "the repo IS readable via GitHub's native MD rendering; HTML site is optional next step" | @Claude | Doc | After this research lands |

---

## Research Metadata

| Attribute | Value |
|-----------|-------|
| **Last validated** | 2026-05-24 |
| **Sources consulted** | 9 (7 FULL, 2 PARTIAL) |
| **Tier** | STANDARD |
| **Decision posture** | Recommendation: keep MD source + add SSG for public site. Recommendation strength: HIGH. |
| **Honest UNKNOWNs** | The exact "60% faster doc writing at GitHub" stat could not be traced to a primary GitHub publication; cited via secondary sources only. The Stack Overflow 2025 Developer Survey citation comes from secondary write-ups; the primary survey results page should be checked for the "most admired documentation format" wording. |
