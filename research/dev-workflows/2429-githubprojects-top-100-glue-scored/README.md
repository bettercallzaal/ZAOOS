---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-28
superseded-by:
related-docs: "2081, 2411, 2282, 2273, 601, 603, 528, 790, 441, 297, 801, 2158"
original-query: "https://x.com/githubprojects/status/2093269874193879119?s=46 go do research on this x account and find the top 100 OS repos"
tier: DEEP
---

# 2429 - @githubprojects: 1,291 repos found, the top 100 by stars scored against the glue-first ladder

> **Goal:** Take the X account @githubprojects (the seed post is fnm), recover as much of its posting history as the fetch ladder allows, resolve every linked repo on the GitHub API, rank the top 100 by stars, and score each one for The ZAO under `~/zao-vault/notes/glue-first-standard.md` - which stack layer, which rung, ADOPT-CANDIDATE / WATCH / NOT-FOR-US.

**X itself is walled from this machine** (x.com 307s to login, the syndication endpoint served one page then 429'd, nitter is 410, xcancel returns an empty shell). Coverage below therefore comes from three mirrors the account itself runs: its Bluesky cross-post (800 posts, public API), its own site `opensourceprojects.dev` (every post links a repo), and the Wayback Machine's archive of that site for posts the site has since deleted. Every method, count and failure is in Sources.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Add a PDF/DOCX path to `~/bin/zao-ingest.sh` using **docling** (MIT, IBM-backed, rank 90) | ADOPT-CANDIDATE - spike behind a flag | `grep -ciE 'pdf\|docx\|epub' ~/bin/zao-ingest.sh` = 0 on 2026-08-28. Sponsor decks, venue contracts and grant PDFs never reach the vault today. Rung 2: pip install, point at a file, get markdown |
| Give the VPS and Pi loops a browser with **browser-use** (MIT, rank 41) | ADOPT-CANDIDATE - test on the VPS first | `/browse` has never been built (doc 2411) and claude-in-chrome needs Zaal's Chrome, so no unattended loop can read a JS page. browser-use is a Python library over Playwright that runs headless |
| Put **NocoDB** (rank 94) in front of the cowork Supabase project | ADOPT-CANDIDATE - the standard already names it | Section 4 of the glue standard lists "NocoDB/Baserow over Supabase" as evaluate-first for Forms/CRM. Licence read from LICENSE.md is the **Sustainable Use License**, not AGPL as the API's NOASSERTION might suggest; internal use is allowed, reselling is not |
| Ship the **Remotion** recap-video spike doc 790 asked for (rank 111 - just outside the 100, kept because the decision predates this doc) | ADOPT-CANDIDATE - carry-over, not new | Doc 790 said "spike a Remotion + Claude Code template for a 30-60s ZAO recap video". It did not ship. The ECC plugin already carries a `remotion-video-creation` skill. LICENSE.md: free for individuals and small companies; BCZ Strategies LLC qualifies |
| Re-adopt **OpenClaw** because it is now 387k stars and MIT | NO - WATCH | Doc 601 retired it for a recorded reason (Minimax brain + 60 plugins + sqlite embeddings = brittle). Stars do not change that; a re-try must answer the recorded reason first |
| Treat **Agent-Reach** as the fix for the Reddit/X wall (doc 2282) | NO - WATCH | Its README says Reddit has no zero-config path (anonymous API blocked; needs browser login state or rdt-cli + cookie). It routes around the same wall with the same credential doc 2273 already asks Zaal for |
| 11 of the top 100 are already in the estate | Nothing to do, record it | React, Claude Code, Codex, ECC, ponytail, caveman, graphify, playwright, ripgrep, ffmpeg, llama.cpp (via Ollama). The account is feeding a stream we are already drinking from |
| 68 of the top 100 are NOT-FOR-US | Expected | Most of the account's star-count leaders are reading lists, awesome-lists, interview guides and tutorials - content, not software. The account is a broadsheet, not a stack |

## What the account is

`@githubprojects` ("GitHub Projects Community"), 334,289 followers, 4,866 media posts, joined 2020-10-12, X-verified, description "We're sharing/showcasing best of @github projects/repos... UNOFFICIAL, but followed by github" (fxtwitter API, 2026-08-28). It funds itself via Ko-fi and a sponsor page. Since at least July 2025 every post links through the `osp.fyi` shortener to a write-up on its own site, `opensourceprojects.dev` ("A broadsheet for software that doesn't ask for your email"), which is a Next.js app with a sitemap, an RSS feed, a Bluesky mirror (`githubprojects.bsky.social`) and a GitHub org (`githubpr0jects`: deals-for-devs at 51 stars, a repo-recommender "vibe coded via MiniMax M2.1", the site itself). Cadence measured: 240 site posts between 2026-07-28 and 2026-08-28 (about 8 a day); 800 Bluesky posts between 2026-03-01 and 2026-08-28 (about 4.4 a day).

The seed post (2026-08-28 09:30 UTC) is a six-second video plus one line about **fnm** (`Schniz/fnm`, a Rust Node version manager). It links `osp.fyi/fnm`, which 301s to `opensourceprojects.dev/post/fnm`. That redirect is what opened the whole archive.

## Method - what was fetched, by what, and what it yielded

| Step | Method | Result |
|---|---|---|
| Seed post | `api.fxtwitter.com/githubprojects/status/2093269874193879119` (JSON) | FULL - text, author card, media, link facets |
| X timeline, direct | `curl` with a browser UA to `x.com/githubprojects` | FAILED - 307 to login |
| X timeline, syndication | `syndication.twitter.com/srv/timeline-profile/screen-name/githubprojects` | PARTIAL - one 200 with a `__NEXT_DATA__` blob of 99 tweets dated 2024-07-19 to 2025-10-25 (an older sample, not the recent feed); every later call 429. 66 of the 99 carried `t.co` links and all 66 resolved to the tweet's own photo/video, not to a repo |
| X timeline, mirrors | `nitter.net` (410), `nitter.privacydev.net` (connection refused), `nitter.poast.org` (no DNS), `xcancel.com` (200, 321-byte shell) | FAILED |
| Bluesky mirror | `public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed`, 8 pages of 100 | FULL - 800 posts, 2026-03-01 to 2026-08-28. 114 carry a link (102 `osp.fyi`, 6 direct GitHub, 6 other); 686 are text + image/video with no link |
| The site's sitemap | `opensourceprojects.dev/sitemap.xml` | FULL - 240 `/post/` URLs, all fetched, all 240 resolve a GitHub repo in the page |
| Shortlink resolution | `curl -w %{redirect_url}` on the 102 `osp.fyi` links | 101 resolved to site posts (all inside the sitemap set), 1 dead (`osp.fyi/verba`) |
| Older site posts | Wayback CDX `url=opensourceprojects.dev/post/*` | 2,603 archive rows collapsing to 1,737 unique post URLs. Fetched live: 1,168 returned a post, 2 returned 404, 569 returned the site's "Project Not Found" page |
| Deleted posts | Wayback `web.archive.org/web/<ts>id_/<url>` for the 569 dead ones | 348 recovered, 221 failed after 3 tries (Wayback 429s and timeouts, 3 threads, 20s backoff) |
| Repo resolution | `gh api repos/<owner>/<repo>` for every `github.com/owner/repo` link in every page (1,309 after stripping `.git` clone-URL duplicates) | 1,298 resolved; 8 404 (renamed or deleted); 3 HTTP 451 (DMCA-blocked); deduped on canonical `full_name` to **1,291** repos |
| Top 100 checklist | `~/.claude/skills/glue-first/bin/glue-check <owner/repo>` x 100, plus a direct read of each LICENSE/COPYING file | 100/100 returned; contributors unmeasurable via API for torvalds/linux ("history too large") |

Rate limit: the core REST bucket never reported below 5,000 remaining during the run; no 403 was hit, so no pause was needed.

## What the pool looks like

- **1,291 repos** resolved from 1,309 distinct `owner/repo` links across 1,516 posts (1,168 live site pages + 348 Wayback-recovered pages), posts dated 2025-07-10 to 2026-08-28 (the site's own date stamps).
- Median stars **7,247**; 48 repos over 100k stars, 128 over 50k, 557 over 10k, 1097 over 1k, 32 under 100. The account posts across the whole range - it is not a top-charts feed.
- 1,189 of 1,291 (92%) were pushed in 2026; 19 are archived.
- Top-100 verdicts: 3 ADOPT-CANDIDATE, 11 IN-USE, 18 WATCH, 68 NOT-FOR-US. 60 of the 100 serve no stack layer at all (reading lists, awesome-lists, tutorials, interview prep).
- Top-100 layers with a candidate: Ingest / research (11), Telegram agent (7), Sites (5), Watcher / drafts (5), Cron / loops (4), Memory (3), Knowledge graph (2), Estate hygiene (2), Forms / CRM (1).

## The top 100, ranked by stars, scored for The ZAO

Legend - **Layer** is the row of section 4 of the glue standard the repo could serve ("-" = it serves none; it is content). **Rung** is where adopting it would sit on the ladder (1 platform-native, 2 OSS configured, 3 skill/prompt/config glue, 4 thin adapter). **Verdict**: ADOPT-CANDIDATE needs a named component of ours it would replace or a named gap it fills; IN-USE means it is already glued in and there is nothing to decide; WATCH means a real slot but no current gap; NOT-FOR-US is the default. Licence is read from the file, never from the API field (Hard Requirement 13). "180d commits" is capped at 100 by the API page size.

| # | Repo | Stars | Licence (from file) | Last push | 180d commits | Contributors / top | Layer | Rung | Verdict | Why |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [public-apis/public-apis](https://github.com/public-apis/public-apis) | 471,983 | MIT | 2026-08-26 | 100 | 100 / matheusfelipeog | - | - | NOT-FOR-US | List of free APIs |
| 2 | [EbookFoundation/free-programming-books](https://github.com/EbookFoundation/free-programming-books) | 395,407 | CC BY 4.0 | 2026-08-18 | 100 | 100 / vhf | - | - | NOT-FOR-US | Reading list, not software |
| 3 | [openclaw/openclaw](https://github.com/openclaw/openclaw) | 387,886 | MIT | 2026-08-28 | 100 | 100 / steipete | Telegram agent | 2 | WATCH | Retired 2026-05-04 (doc 601: wrong brain, Minimax + 60 plugins + sqlite embeddings was brittle); now an MIT Foundation project at 387k stars. Re-try only against the recorded reason, never by default |
| 4 | [nilbuild/developer-roadmap](https://github.com/nilbuild/developer-roadmap) | 365,745 | NO LICENSE FILE | 2026-08-21 | 100 | 100 / nilbuild | - | - | NOT-FOR-US | Learning content; no LICENSE file = all rights reserved |
| 5 | [jwasham/coding-interview-university](https://github.com/jwasham/coding-interview-university) | 359,884 | CC BY-SA 4.0 | 2025-08-28 | 0 | 100 / jwasham | - | - | NOT-FOR-US | Study plan, 0 commits in 180d |
| 6 | [vinta/awesome-python](https://github.com/vinta/awesome-python) | 316,619 | CC BY 4.0 | 2026-08-25 | 100 | 100 / vinta | - | - | NOT-FOR-US | Awesome list |
| 7 | [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) | 315,681 | CC BY-SA | 2026-08-27 | 100 | 100 / nodiscc | Ingest / research | 3 | WATCH | A list, CC BY-SA 3.0, but it is the search index section 3 of the glue standard asks a lane to name before writing code (rung-2 candidates by category); use it as the lookup, never as a dependency |
| 8 | [practical-tutorials/project-based-learning](https://github.com/practical-tutorials/project-based-learning) | 281,143 | MIT | 2026-08-24 | 31 | 100 / tuvtran | - | - | NOT-FOR-US | Tutorial list |
| 9 | [react/react](https://github.com/react/react) | 247,995 | MIT | 2026-08-26 | 100 | 100 / sebmarkbage | Sites | 1 | IN-USE | ZAOOS runs React 19 (package.json); nothing to decide |
| 10 | [torvalds/linux](https://github.com/torvalds/linux) | 244,784 | GPL-2.0 (COPYING) | 2026-08-27 | 100 | too large for API / - | - | - | NOT-FOR-US | The VPS and the Pi run it; not an adoptable project |
| 11 | [affaan-m/ECC](https://github.com/affaan-m/ECC) | 243,840 | MIT | 2026-08-28 | 100 | 100 / affaan-m | Ingest / research | 3 | IN-USE | Installed as the everything-claude-code plugin (~/.claude/plugins), doc 441; typescript-hygiene.md is cherry-picked from it |
| 12 | [TheAlgorithms/Python](https://github.com/TheAlgorithms/Python) | 224,073 | MIT | 2026-08-28 | 50 | 100 / harshildarji | - | - | NOT-FOR-US | Algorithms in Python |
| 13 | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | 201,258 | MIT | 2026-08-27 | 100 | 29 / tianyicui | Telegram agent | 2 | WATCH | Everything-is-a-plugin agent harness, 29 contributors; README says developer preview with breaking changes. Re-check when it leaves preview |
| 14 | [trekhleb/javascript-algorithms](https://github.com/trekhleb/javascript-algorithms) | 196,574 | MIT | 2026-07-26 | 19 | 100 / trekhleb | - | - | NOT-FOR-US | Teaching repo |
| 15 | [ohmyzsh/ohmyzsh](https://github.com/ohmyzsh/ohmyzsh) | 189,417 | MIT | 2026-08-25 | 100 | 100 / mcornella | - | - | NOT-FOR-US | Shell framework; ~/.zshrc does not use it and no lane depends on it |
| 16 | [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | 186,960 | MIT + Polyform Shield (dual, per LICENSE) | 2026-08-28 | 100 | 100 / Auto-GPT-Bot | Telegram agent | 2 | NOT-FOR-US | Full agent platform; ZOE already is the orchestrator (bot/src/zoe/), no named gap it fills |
| 17 | [getify/You-Dont-Know-JS](https://github.com/getify/You-Dont-Know-JS) | 184,747 | CC BY-NC-ND 4.0 | 2026-02-15 | 0 | 100 / getify | - | - | NOT-FOR-US | Book, CC BY-NC-ND |
| 18 | [avelino/awesome-go](https://github.com/avelino/awesome-go) | 182,491 | MIT | 2026-08-27 | 100 | 100 / avelino | - | - | NOT-FOR-US | Awesome list |
| 19 | [anthropics/skills](https://github.com/anthropics/skills) | 172,165 | NO LICENSE FILE | 2026-08-21 | 31 | 15 / rlancemartin | Ingest / research | 3 | WATCH | Canonical Agent Skills examples, but NO LICENSE FILE, so it cannot be vendored the way gstack was; read, do not copy |
| 20 | [f/prompts.chat](https://github.com/f/prompts.chat) | 168,103 | MIT code / CC0 prompts (dual) | 2026-08-28 | 100 | 100 / f | Telegram agent | 3 | NOT-FOR-US | Prompt library; ZOE persona lives in ~/.zao/zoe/persona.md, no gap |
| 21 | [Snailclimb/JavaGuide](https://github.com/Snailclimb/JavaGuide) | 158,096 | Apache-2.0 | 2026-08-28 | 100 | 100 / Snailclimb | - | - | NOT-FOR-US | Java interview guide |
| 22 | [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | 148,564 | MIT | 2026-08-26 | 100 | 89 / msitarzewski | Telegram agent | 3 | WATCH | Library of agent personas (MIT, 89 contributors); could seed .claude/agents definitions but the ZAO tiered team (zao-build-orchestrator/builder/evaluator) already exists |
| 23 | [airbnb/javascript](https://github.com/airbnb/javascript) | 148,140 | MIT | 2026-04-16 | 0 | 100 / ljharb | - | - | NOT-FOR-US | Style guide; biome enforces ours |
| 24 | [anthropics/claude-code](https://github.com/anthropics/claude-code) | 143,246 | all rights reserved (LICENSE.md) | 2026-08-28 | 100 | 53 / actions-user | Watcher / drafts | 1 | IN-USE | The harness every lane runs in; all rights reserved, not adoptable, just used |
| 25 | [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | 143,198 | GPL-3.0 | 2026-08-11 | 42 | 30 / x1xhlol | - | - | NOT-FOR-US | Leaked-prompt archive, GPL-3.0 |
| 26 | [clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) | 140,670 | GPL-3.0 | 2026-08-28 | 100 | 100 / zzzgydi | - | - | NOT-FOR-US | Proxy GUI client |
| 27 | [ripienaar/free-for-dev](https://github.com/ripienaar/free-for-dev) | 135,672 | NO LICENSE FILE | 2026-08-28 | 100 | 100 / ripienaar | - | - | NOT-FOR-US | List of free tiers; useful when the glue checklist asks for cost, not adoptable |
| 28 | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | 134,782 | Apache-2.0 | 2026-08-22 | 100 | 95 / Shubhamsaboo | - | - | NOT-FOR-US | Example apps collection |
| 29 | [farion1231/cc-switch](https://github.com/farion1231/cc-switch) | 129,854 | MIT | 2026-08-28 | 100 | 100 / farion1231 | Cron / loops | 2 | WATCH | Desktop switcher for Claude Code / Codex / OpenCode providers; the fleet failover (claude -> codex -> openrouter -> ollama) is already scripted, this is the GUI version of it |
| 30 | [krahets/hello-algo](https://github.com/krahets/hello-algo) | 129,648 | CC BY-NC-SA 4.0 | 2026-08-17 | 28 | 100 / krahets | - | - | NOT-FOR-US | Algorithms tutorial, CC BY-NC-SA |
| 31 | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | 126,040 | MIT | 2026-08-28 | 100 | 100 / ggerganov | Cron / loops | 2 | IN-USE | Indirect: Ollama on the VPS (:11434) bundles it. Nothing to adopt directly |
| 32 | [electron/electron](https://github.com/electron/electron) | 122,760 | MIT | 2026-08-28 | 100 | 100 / zcbenz | - | - | NOT-FOR-US | No desktop app in the estate |
| 33 | [openai/codex](https://github.com/openai/codex) | 119,422 | Apache-2.0 | 2026-08-28 | 100 | 100 / jif-oai | Watcher / drafts | 1 | IN-USE | Codex is the $20 fallback tier in claude-usage.md and the second rung of the fleet failover (claude -> codex -> openrouter -> ollama); the /codex skill is installed |
| 34 | [Hack-with-Github/Awesome-Hacking](https://github.com/Hack-with-Github/Awesome-Hacking) | 119,222 | CC0 | 2026-07-26 | 15 | 29 / 0xbadshah | - | - | NOT-FOR-US | Awesome list |
| 35 | [mrdoob/three.js](https://github.com/mrdoob/three.js) | 114,871 | MIT | 2026-08-28 | 100 | 100 / mrdoob | - | - | NOT-FOR-US | No 3D surface |
| 36 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 114,645 | MIT | 2026-08-07 | 100 | 63 / DietrichGebert | Watcher / drafts | 3 | IN-USE | Adopted as .claude/rules/code-restraint.md (doc 2081) |
| 37 | [d3/d3](https://github.com/d3/d3) | 113,575 | ISC | 2026-05-28 | 1 | 100 / mbostock | - | - | NOT-FOR-US | Charting library; the dataviz skill covers what we render, 1 commit in 180d |
| 38 | [immich-app/immich](https://github.com/immich-app/immich) | 112,849 | AGPL-3.0 | 2026-08-28 | 100 | 100 / alextran1502 | - | - | NOT-FOR-US | Self-hosted photos, AGPL; no festival-photo archive is in scope for the stack table |
| 39 | [jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) | 111,989 | CC0 | 2026-08-28 | 100 | 100 / jaywcjlove | - | - | NOT-FOR-US | macOS software list |
| 40 | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | 111,747 | Apache-2.0 | 2026-08-28 | 100 | 100 / safishamsi | Knowledge graph | 2 | IN-USE | The /graphify skill pip-installs it (doc 297); Apache-2.0 from the file |
| 41 | [browser-use/browser-use](https://github.com/browser-use/browser-use) | 111,524 | MIT | 2026-08-28 | 100 | 100 / MagMueller | Ingest / research | 2 | ADOPT-CANDIDATE | Named gap: /browse (gstack) has never been built (doc 2411) and claude-in-chrome needs Zaal's Chrome, so VPS and Pi loops have no browser at all. MIT, 100 contributors, pushed today; a Python lib over Playwright that runs headless where the loops run |
| 42 | [fatedier/frp](https://github.com/fatedier/frp) | 109,078 | Apache-2.0 | 2026-08-28 | 100 | 100 / fatedier | Cron / loops | 2 | WATCH | Reverse proxy to expose Pi services (fleet dashboard ansuz:8090, ZOL) without opening ports; only if the ssh-tunnel pattern in use stops being enough |
| 43 | [papers-we-love/papers-we-love](https://github.com/papers-we-love/papers-we-love) | 109,053 | NO LICENSE FILE | 2026-08-24 | 7 | 100 / zeeshanlakhani | - | - | NOT-FOR-US | Paper archive, no LICENSE file |
| 44 | [goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices) | 105,604 | CC BY-SA 4.0 | 2026-06-15 | 1 | 100 / goldbergyoni | - | - | NOT-FOR-US | Best-practice list |
| 45 | [rasbt/LLMs-from-scratch](https://github.com/rasbt/LLMs-from-scratch) | 103,932 | Apache-2.0 | 2026-08-26 | 33 | 65 / rasbt | - | - | NOT-FOR-US | Textbook code |
| 46 | [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) | 101,980 | Unlicense | 2026-08-25 | 100 | 100 / Anduin2017 | - | - | NOT-FOR-US | Recipes |
| 47 | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | 101,526 | MIT (scope note excludes Engine-linked parts) | 2026-08-27 | 100 | 33 / JuliusBrussee | Watcher / drafts | 3 | IN-USE | Installed plugin, active on this very session's SessionStart hook (docs 357/362/1028). Licence file is MIT with a scope note excluding Engine-linked parts, and the API field reads it as BSL - read the file |
| 48 | [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | 101,493 | Apache-2.0 | 2026-07-18 | 100 | 19 / Yijia-Xiao | Telegram agent | 3 | WATCH | Doc 603 already lifted the debate pattern for ZOE social/PM decisions; the software itself targets trading, and src/lib/agents/ bots are not being extended (agent trading params are ask-first) |
| 49 | [earendil-works/pi](https://github.com/earendil-works/pi) | 98,562 | MIT | 2026-08-28 | 100 | 100 / badlogic | Telegram agent | 2 | WATCH | Doc 528 decided: NO as Claude Code replacement (Max plan flat auth beats metered keys), YES-BACKLOG as the multi-provider escape hatch, and steal message-queuing + session export. 98k stars and 100 contributors since; the backlog item stands |
| 50 | [puppeteer/puppeteer](https://github.com/puppeteer/puppeteer) | 95,515 | Apache-2.0 | 2026-08-28 | 100 | 100 / OrKoN | Ingest / research | 2 | WATCH | Chrome/Firefox automation, Apache-2.0; the playwright MCP is already connected and browser-use sits on Playwright, so this is the same slot, second choice |
| 51 | [microsoft/playwright](https://github.com/microsoft/playwright) | 95,285 | Apache-2.0 | 2026-08-28 | 100 | 100 / pavelfeldman | Ingest / research | 2 | IN-USE | Connected as the playwright MCP server in this session |
| 52 | [iluwatar/java-design-patterns](https://github.com/iluwatar/java-design-patterns) | 94,630 | MIT | 2026-08-25 | 74 | 100 / iluwatar | - | - | NOT-FOR-US | Java patterns |
| 53 | [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 92,926 | MIT | 2026-08-27 | 100 | 100 / punkpeye | - | - | NOT-FOR-US | Directory; doc 801 already audited the MCP estate and found ten servers with zero calls |
| 54 | [3b1b/manim](https://github.com/3b1b/manim) | 92,136 | MIT | 2026-08-18 | 100 | 100 / 3b1b | Sites | 2 | WATCH | Explainer-video engine; the ECC plugin ships a manim-video skill, so it is one prompt away if a ZABAL Gamez explainer ever needs it |
| 55 | [ruvnet/RuView](https://github.com/ruvnet/RuView) | 91,884 | MIT | 2026-08-28 | 100 | 31 / ruvnet | - | - | NOT-FOR-US | WiFi sensing |
| 56 | [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | 90,802 | MIT (portions differ) | 2026-08-28 | 100 | 100 / Frooodle | - | - | NOT-FOR-US | PDF editor; no PDF workflow in the stack table |
| 57 | [sherlock-project/sherlock](https://github.com/sherlock-project/sherlock) | 90,481 | MIT | 2026-08-28 | 35 | 100 / sdushantha | - | - | NOT-FOR-US | Username OSINT; pii-hygiene.md makes this the wrong tool for a music community |
| 58 | [gohugoio/hugo](https://github.com/gohugoio/hugo) | 89,562 | Apache-2.0 | 2026-08-27 | 100 | 100 / bep | Sites | 2 | NOT-FOR-US | Static-site generator; every ZAO site is Next.js on Vercel, no reason to add a second framework |
| 59 | [localsend/localsend](https://github.com/localsend/localsend) | 89,560 | Apache-2.0 | 2026-08-27 | 100 | 100 / Tienisto | - | - | NOT-FOR-US | AirDrop alternative |
| 60 | [infiniflow/ragflow](https://github.com/infiniflow/ragflow) | 89,470 | Apache-2.0 | 2026-08-28 | 100 | 100 / cike8899 | Memory | 2 | WATCH | RAG engine, Apache-2.0; Bonfire is the corpus of record and its VPS posting path is down as of 2026-08-26, but a full RAG stack is heavier than that outage warrants |
| 61 | [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | 88,386 | Apache-2.0 | 2026-07-22 | 90 | 100 / LDOUBLEV | - | - | NOT-FOR-US | OCR toolkit; no OCR need named anywhere in the stack table |
| 62 | [sveltejs/svelte](https://github.com/sveltejs/svelte) | 88,008 | MIT | 2026-08-28 | 100 | 100 / Rich-Harris | Sites | 2 | NOT-FOR-US | Every ZAO site is Next.js on Vercel; a second framework is a maintenance line, not a gap |
| 63 | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 85,385 | MIT | 2026-08-28 | 100 | 100 / dependabot[bot] | Watcher / drafts | 2 | WATCH | Autonomous coding agent (MIT, 100 contributors); the estate runs Claude Code with Codex as fallback, and doc 528 already ruled the same way for pi. Re-check only if the Max cap forces a third backend |
| 64 | [koala73/worldmonitor](https://github.com/koala73/worldmonitor) | 84,622 | AGPL-3.0 | 2026-08-28 | 100 | 100 / koala73 | - | - | NOT-FOR-US | Geopolitics dashboard, AGPL |
| 65 | [junegunn/fzf](https://github.com/junegunn/fzf) | 82,689 | MIT | 2026-08-26 | 100 | 100 / junegunn | - | - | NOT-FOR-US | Personal CLI fuzzy finder; not installed, no lane depends on it |
| 66 | [bytedance/deer-flow](https://github.com/bytedance/deer-flow) | 81,047 | MIT | 2026-08-28 | 100 | 100 / MagicCube | Ingest / research | 2 | WATCH | Long-horizon research harness (MIT, ByteDance); the cheap research loops run on OpenRouter today and doc 2188's tiered team covers escalation. Re-check if a loop needs a multi-step web researcher |
| 67 | [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) | 80,818 | MIT | 2026-08-26 | 100 | 58 / Lum1104 | Knowledge graph | 2 | NOT-FOR-US | Code-to-graph tool that overlaps graphify, which is already in use |
| 68 | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | 79,842 | MIT | 2026-07-31 | 1 | 100 / dependabot[bot] | - | - | NOT-FOR-US | README badge generator |
| 69 | [coder/code-server](https://github.com/coder/code-server) | 79,097 | MIT | 2026-08-27 | 100 | 100 / code-asher | - | - | NOT-FOR-US | VS Code in the browser; phone access is Blink + mosh to the Pi, and lanes are terminal-first |
| 70 | [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) | 77,859 | MIT | 2026-03-11 | 1 | 100 / omarsar | - | - | NOT-FOR-US | Guide, 1 commit in 180d |
| 71 | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 76,210 | MIT | 2026-08-25 | 100 | 36 / Panniantong | Ingest / research | 2 | WATCH | Router over per-platform scrapers. Its own README says Reddit has no zero-config path (anonymous API blocked; needs browser login state or rdt-cli + cookie), which is exactly the wall in doc 2282, so it does not remove the credential doc 2273 asks for |
| 72 | [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | 76,022 | AGPL-3.0 | 2026-08-28 | 2 | 100 / appflowy | Memory | 2 | NOT-FOR-US | Notion alternative; the Obsidian vault is the memory layer and is a keep in the standard |
| 73 | [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) | 75,357 | CC BY-NC-SA 4.0 | 2026-08-18 | 100 | 90 / jjyaoao | - | - | NOT-FOR-US | Tutorial, CC BY-NC-SA |
| 74 | [caddyserver/caddy](https://github.com/caddyserver/caddy) | 75,272 | Apache-2.0 | 2026-08-28 | 100 | 100 / mholt | Cron / loops | 2 | WATCH | Reverse proxy with automatic HTTPS, Apache-2.0; would front VPS services (fleet dashboard, ZOE webhooks) if they ever need a public TLS endpoint, which today they reach over ssh |
| 75 | [Eugeny/tabby](https://github.com/Eugeny/tabby) | 74,186 | MIT | 2026-08-28 | 100 | 100 / Eugeny | - | - | NOT-FOR-US | Terminal emulator |
| 76 | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | 73,753 | NO LICENSE FILE | 2026-08-10 | 24 | 28 / Prat011 | Ingest / research | 3 | WATCH | Skill directory, no LICENSE file; useful as a search index for skills to evaluate, not as a source to copy |
| 77 | [NationalSecurityAgency/ghidra](https://github.com/NationalSecurityAgency/ghidra) | 73,089 | Apache-2.0 | 2026-08-25 | 100 | 100 / ryanmkurtz | - | - | NOT-FOR-US | Reverse engineering |
| 78 | [fffaraz/awesome-cpp](https://github.com/fffaraz/awesome-cpp) | 72,975 | MIT | 2026-08-22 | 70 | 100 / fffaraz | - | - | NOT-FOR-US | Awesome list |
| 79 | [juliangarnier/anime](https://github.com/juliangarnier/anime) | 72,480 | MIT | 2026-08-21 | 8 | 54 / juliangarnier | Sites | 2 | NOT-FOR-US | JS animation library; no site has asked for it, 8 commits in 180d |
| 80 | [OpenBB-finance/OpenBB](https://github.com/OpenBB-finance/OpenBB) | 72,395 | AGPL-3.0 | 2026-07-30 | 60 | 100 / jmaslek | - | - | NOT-FOR-US | Finance data platform, AGPL; src/lib/agents/ trading bots are frozen behind ask-first |
| 81 | [Asabeneh/30-Days-Of-Python](https://github.com/Asabeneh/30-Days-Of-Python) | 72,071 | NO LICENSE FILE | 2026-08-27 | 99 | 83 / Asabeneh | - | - | NOT-FOR-US | Tutorial, no LICENSE file |
| 82 | [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | 71,968 | MIT + AGPL split (LICENSE) | 2026-08-28 | 100 | 100 / darkskygit | Memory | 2 | NOT-FOR-US | Notion/Miro alternative; vault is the keep |
| 83 | [protocolbuffers/protobuf](https://github.com/protocolbuffers/protobuf) | 71,825 | BSD-3 | 2026-08-28 | 100 | 100 / protobuf-github-bot | - | - | NOT-FOR-US | Serialization library |
| 84 | [nektos/act](https://github.com/nektos/act) | 71,675 | MIT | 2026-08-09 | 12 | 100 / dependabot[bot] | Estate hygiene | 2 | WATCH | Runs GitHub Actions locally; would let a lane run the research-index and doc-collision guards before pushing instead of after. MIT, 12 commits in 180d, not installed |
| 85 | [santifer/career-ops](https://github.com/santifer/career-ops) | 69,004 | MIT | 2026-08-28 | 100 | 100 / santifer | - | - | NOT-FOR-US | Job-search agent |
| 86 | [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | 68,458 | custom split (LICENSE.md) | 2026-08-28 | 100 | 100 / code-yeongyu | - | - | NOT-FOR-US | Alternative coding-agent harness; the estate is Claude Code + Codex fallback |
| 87 | [openinterpreter/openinterpreter](https://github.com/openinterpreter/openinterpreter) | 68,175 | Apache-2.0 | 2026-08-20 | 100 | 100 / jif-oai | - | - | NOT-FOR-US | Coding agent for open models; same slot, same answer |
| 88 | [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep) | 67,657 | Unlicense OR MIT (COPYING) | 2026-08-04 | 78 | 100 / BurntSushi | Estate hygiene | 1 | IN-USE | rg is installed on this Mac (command -v rg) and every lane greps with it |
| 89 | [LadybirdBrowser/ladybird](https://github.com/LadybirdBrowser/ladybird) | 65,868 | BSD-2 | 2026-08-28 | 100 | 100 / awesomekling | - | - | NOT-FOR-US | Browser engine |
| 90 | [docling-project/docling](https://github.com/docling-project/docling) | 65,679 | MIT | 2026-08-28 | 100 | 100 / dolfim-ibm | Ingest / research | 2 | ADOPT-CANDIDATE | Named gap: ~/bin/zao-ingest.sh has zero PDF/DOCX/PPTX handling (grep -ciE pdf|docx|epub = 0), so sponsor decks and venue contracts never reach the vault. MIT, IBM-backed, 100 contributors, pushed today; python, runs on the Mac |
| 91 | [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | 65,281 | MIT | 2026-08-28 | 100 | 5 / claude | - | - | NOT-FOR-US | Guide; top contributor is a bot account named claude with 1,081 commits, 5 humans |
| 92 | [tw93/Mole](https://github.com/tw93/Mole) | 65,160 | GPL-3.0 | 2026-08-28 | 100 | 100 / tw93 | - | - | NOT-FOR-US | Mac cleaner, GPL |
| 93 | [localstack/localstack](https://github.com/localstack/localstack) | 65,143 | Apache-2.0 | 2026-03-23 | 17 | 100 / whummer | - | - | NOT-FOR-US | Local AWS emulator; the estate has no AWS |
| 94 | [nocodb/nocodb](https://github.com/nocodb/nocodb) | 64,769 | Sustainable Use License (LICENSE.md) | 2026-08-28 | 100 | 100 / o1lab | Forms / CRM | 2 | ADOPT-CANDIDATE | Named in glue-first-standard.md section 4 as evaluate-first for Forms/CRM (NocoDB/Baserow over Supabase). Would replace the hand-rolled cowork board UI and the flag-gated public forms. Licence is the Sustainable Use License from LICENSE.md, NOT AGPL (API field says NOASSERTION); internal use is permitted, reselling is not |
| 95 | [traefik/traefik](https://github.com/traefik/traefik) | 64,625 | MIT | 2026-08-27 | 100 | 100 / ldez | - | - | NOT-FOR-US | Cloud-native proxy; the VPS runs systemd units, not a container mesh |
| 96 | [warpdotdev/warp](https://github.com/warpdotdev/warp) | 64,587 | LICENSE-MIT for parts; app proprietary | 2026-08-28 | 100 | 100 / warp-agent-staging[bot] | - | - | NOT-FOR-US | Terminal; only LICENSE-MIT for parts, app is proprietary |
| 97 | [ryanoasis/nerd-fonts](https://github.com/ryanoasis/nerd-fonts) | 64,442 | MIT patcher; fonts per-font (LICENSE) | 2026-08-22 | 100 | 100 / Finii | - | - | NOT-FOR-US | Fonts |
| 98 | [NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) | 63,963 | Non-Commercial Learning License 1.1 | 2026-08-14 | 67 | 73 / NanmiCoder | - | - | NOT-FOR-US | Chinese-platform scraper under a NON-COMMERCIAL LEARNING LICENSE |
| 99 | [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | 63,725 | LGPL-2.1 / GPL (LICENSE.md) | 2026-08-28 | 100 | 100 / michaelni | Ingest / research | 1 | IN-USE | ffmpeg is installed and zao-ingest.sh and the measurement-traps rule both depend on it |
| 100 | [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | 63,713 | CC0 | 2026-08-27 | 100 | 24 / asgeirtj | - | - | NOT-FOR-US | Leaked prompts, CC0 |

## Top 10 for The ZAO - the shortlist

Ranked by what they would change here, not by stars.

**1. docling-project/docling (65,679 stars, MIT, rank 90).** "Get your documents ready for gen AI": PDF, DOCX, PPTX, HTML, images to structured markdown, with table and layout recovery. The gap is measured, not guessed: `zao-ingest.sh` handles Spotify, YouTube, RSS, mp3 and transcript pages and has no line that mentions pdf, docx or epub. Every sponsor deck Jay forwards, every venue contract for ZAOstock, every grant PDF is either summarised by hand or lost. Rung 2: `pip install docling`, `docling <file>`, pipe the markdown into the existing transcript path. 100 contributors, IBM Research behind it, pushed 2026-08-28. Runs on the Mac; the Pi is not needed.

**2. browser-use/browser-use (111,524 stars, MIT, rank 41).** Doc 2411 measured that `/browse` cannot run because `gstack/browse/dist/` was never built, and that lanes route around it with claude-in-chrome 1,786 times in 30 days - which only works where Zaal's Chrome is. The VPS research loops and the Pi have no browser path at all, which is why the Reddit ladder in doc 2282 dead-ends. browser-use is a Python library over Playwright with an agent loop already written; rung 2 on the VPS. The risk is the same one the liveness-probe rule records for gstack browse: a headless browser supervisor that misreads busy as dead. Test one fetch from the VPS before anything else.

**3. nocodb/nocodb (64,769 stars, Sustainable Use License, rank 94).** The glue standard's own section 4 names it for the Forms/CRM row. It attaches to an existing Postgres - the cowork Supabase project - and gives a spreadsheet UI, forms, and an API over tables we already have, which is the hand-rolled cowork board UI and the flag-gated public forms. The licence is the part to read: LICENSE.md ("Updated on: January 29, 2026") puts master and develop under the Sustainable Use License, which permits internal business use and forbids offering it as a service to third parties. For a board and forms we use ourselves that is fine; the API's licence field says NOASSERTION and would have hidden this.

**4. openai/codex (119,422 stars, Apache-2.0, rank 33).** "Lightweight coding agent that runs in your terminal." Already the second rung of the fleet failover (claude -> codex -> openrouter -> ollama) and the $20 tier in `claude-usage.md` for well-specified mechanical code; the `/codex` skill is installed. Nothing to adopt. It is on the shortlist because it is the one entrant from the Wayback backfill that changes the picture: the account's recent months skew hard toward agent harnesses (codex, OpenHands, deer-flow, pi, deepseek-harness, openclaw, oh-my-openagent, openinterpreter - eight of the top 100), and this estate has already chosen its two.

**5. earendil-works/pi (98,562 stars, MIT, rank 49).** Mario Zechner's agent toolkit: unified LLM API, agent loop, TUI, coding-agent CLI. Doc 528 evaluated it in June and decided NO as a Claude Code replacement (Max plan flat auth beats metered keys), YES-BACKLOG as the multi-provider escape hatch when the cap bites, and "steal" for message-queuing and session export. Since then it has gone from a solo project to 100 contributors and 98k stars. The backlog item is still the right verdict; what changed is that "single-author is a rung-4 risk" no longer applies.

**6. caddyserver/caddy (75,272 stars, Apache-2.0, rank 74).** A web server and reverse proxy with automatic HTTPS. Today every VPS and Pi service (fleet dashboard on ansuz:8090, ZOE's Telegram polling, the bots board) is reached over `ssh vps` or a Telegram long-poll, so nothing needs a public TLS endpoint. The day one does - a webhook receiver, a public status page, the Cal.com or Lu.ma integrations calling back - caddy is the rung-2 answer: one Caddyfile, certificates handled. WATCH, and cheaper than frp (rank 42) for the same job because it does not need a relay host.

**7. nektos/act (71,675 stars, MIT, rank 84).** Runs GitHub Actions locally. Two guards in this repo fail PRs after the push - the research-index guard and the doc-collision guard - and the zao-research skill's Step 7.5 exists because lanes keep finding out after. `act` would run those workflows in the worktree before `git push`. Not installed today. 12 commits in 180 days is slower than the rest of the shortlist; it is mature, not dead.

**8. openclaw/openclaw (387,886 stars, MIT, rank 3).** The most-starred piece of software in the pool and the one this estate already retired. Doc 601, 2026-05-04: "the right idea with the wrong brain" - Minimax M2.7, 60+ extension plugins, sqlite for embeddings. It is now an OpenClaw Foundation project with 100 contributors. The glue standard says "retired once - record why before re-trying"; the why is recorded, so a re-try is allowed but only as an answer to it: does the current OpenClaw let ZOE keep the Claude brain and the persona blocks, or does it replace them? That is a grill question for Zaal, not a lane's call.

**9. bytedance/deer-flow (81,047 stars, MIT, rank 66).** A long-horizon research harness ("researches, codes, and creates"). The cheap research loops on the VPS run on OpenRouter with a hand-written loop; deer-flow is the packaged version of that loop with web search, crawling and report writing built in. WATCH: the loops are also the ones code-over-inference.md measured writing zero files in seven days, so the fix there is a smaller loop, not a bigger harness.

**10. OpenHands/OpenHands (85,385 stars, MIT, rank 63).** "AI-Driven Development" - an autonomous coding agent with a sandboxed runtime and a web UI, 100 contributors, pushed today. Same slot as pi (doc 528) and the same answer: the estate runs Claude Code on the Max plan with Codex as the fallback, and a third backend only earns its place if the weekly cap forces it. WATCH. The one thing worth lifting without adopting is its evaluation harness, which is the public benchmark most of these agents report against.

**Just outside the 100, still worth naming.** usememos/memos (rank 102, MIT) is a self-hosted quick-capture tool with a Telegram integration - structurally the capture door, which is locked to `todo` + ZOE, so WATCH. RVC-Boss/GPT-SoVITS (rank 106, MIT) is the strongest open few-shot TTS in the pool and the obvious engine candidate when ZOE voice-OUT reaches that decision; it wants a GPU, so the Mac, not the Pi. remotion-dev/remotion (rank 111) is in Key Decisions above. makeplane/plane (rank 109, AGPL) and twentyhq/twenty (rank 117, AGPL) are the board and CRM alternatives the standard ranks behind GitHub Projects, Linear and NocoDB.

## Adoption candidates

One line each in the format section 5 of the glue standard asks for. These are for the orchestrator to copy into `~/zao-vault/notes/adoption-candidates.md`; this lane does not write the vault.

| Name | Licence (from file) | What it replaces / the gap | Who maintains it |
|---|---|---|---|
| docling-project/docling | MIT | the missing PDF/DOCX path in `~/bin/zao-ingest.sh` | IBM Research + 100 contributors, pushed 2026-08-28 |
| browser-use/browser-use | MIT | no browser for VPS/Pi loops (`/browse` unbuilt, doc 2411) | 100 contributors, pushed 2026-08-28 |
| nocodb/nocodb | Sustainable Use License | hand-rolled cowork board UI + flag-gated public forms over Supabase | 100 contributors, pushed 2026-08-28 |
| remotion-dev/remotion (rank 111, outside the 100; carried from doc 790) | Remotion License (free at BCZ's size) | the doc-790 recap-video spike; `zao_video_editor` engine | 100 contributors, pushed 2026-08-28 |

Already in the estate, for the record (not new adoptions): react/react, anthropics/claude-code, openai/codex, affaan-m/ECC, DietrichGebert/ponytail, JuliusBrussee/caveman, Graphify-Labs/graphify, microsoft/playwright, BurntSushi/ripgrep, FFmpeg/FFmpeg, ggml-org/llama.cpp (through Ollama).

## Also See

- [Doc 2081](../2081-ponytail-agent-restraint/) - ponytail, adopted as code-restraint.md
- [Doc 2411](../2411-tool-usage-audit-measured/) - the measured tool audit; /browse dead, claude-in-chrome 1,786 calls
- [Doc 528](../528-pi-dev-coding-agent-mario-zechner/) - pi.dev evaluated; NO as replacement, YES-BACKLOG as escape hatch
- [Doc 790](../790-agentic-coding-workflows-claudemd-swarms-vibecoding/) - the Remotion spike recommendation
- [Doc 441](../441-everything-claude-code-integration/) - ECC provenance
- [Doc 601](../../agents/601-agent-stack-cleanup-decision/) - why OpenClaw was retired
- [Doc 603](../../agents/603-tradingagents-pattern-for-social-pm/) - TradingAgents debate pattern lifted for ZOE
- [Doc 2282](../../business/2282-reddit-as-oss-outreach-channel/) - the Reddit wall Agent-Reach does not remove
- `~/zao-vault/notes/glue-first-standard.md` - the ladder and the layer table every verdict above uses (vault, not repo)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Copy the four Adoption-candidate rows into `~/zao-vault/notes/adoption-candidates.md` (done when the four lines exist there) | orchestrator lane (Zaal taps) | vault edit | 2026-08-31 |
| docling spike: `zao-ingest.sh <file.pdf>` prints a transcript path behind a `ZAO_INGEST_PDF=1` flag, one PR to zaal-dotfiles (done when the PR is open and one real sponsor PDF round-trips) | Zaal, or the ingest lane he assigns | PR | 2026-09-04 |
| browser-use test on the VPS: one headless fetch of a JS-rendered page logged from `ssh vps`, result appended to doc 2411's ladder (done when the log line exists) | agentic-infra lane | measurement | 2026-09-04 |
| NocoDB read-only over the cowork Supabase project in Docker on the Mac, screenshot of the board table (done when the screenshot is in the vault daily) | Zaal (decides), Iman (can run it) | spike | 2026-09-07 |
| Remotion recap template, 30-60s, one render of the ZABAL S1 finale week (done when an mp4 exists) - carry-over from doc 790 | Zaal | spike | 2026-09-15 |
| Grill question: does current OpenClaw let ZOE keep the Claude brain + persona blocks? Add to GRILL-QUEUE.md (done when the card exists) | orchestrator lane | grill card | 2026-08-31 |
| Re-run this ranking as part of the quarterly glue map (standard section 6.4); rerun `build_table.py` against a fresh `ranked.json` (done when doc 2429 gets a dated follow-through note) | agentic-infra lane | re-research | 2026-11-28 |

## Sources

All fetched 2026-08-28. Method stated per line so a reader can tell a verbatim quote from a reconstructed one.

- [FULL, JSON API] Seed post via fxtwitter: https://api.fxtwitter.com/githubprojects/status/2093269874193879119 - text, author card (334,289 followers, 4,866 media, joined 2020-10-12), link facet to `osp.fyi/fnm`
- [FAILED, curl + browser UA] https://x.com/githubprojects/status/2093269874193879119 - HTTP 307 to login
- [PARTIAL, curl] https://syndication.twitter.com/srv/timeline-profile/screen-name/githubprojects - one 200 (99 tweets, 2024-07-19 to 2025-10-25, `__NEXT_DATA__` parsed), then 429 on every retry; the 66 `t.co` links in it resolve to the tweets' own media
- [FAILED, curl] nitter.net (410 Gone), nitter.privacydev.net (connection refused), nitter.poast.org (NXDOMAIN), xcancel.com (200 with a 321-byte shell)
- [FULL, JSON API] https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=githubprojects.bsky.social - 8 pages, 800 posts, 2026-03-01 to 2026-08-28
- [FULL, curl] https://www.opensourceprojects.dev/sitemap.xml - 247 URLs, 240 posts; https://www.opensourceprojects.dev/rss - 12 items; https://www.opensourceprojects.dev/ - site nav, Bluesky and GitHub org links
- [FULL, curl] https://osp.fyi/fnm - 301 to https://www.opensourceprojects.dev/post/fnm; 101 of 102 Bluesky `osp.fyi` links resolved the same way; `osp.fyi/verba` is dead
- [FULL, curl] 1,168 live post pages on opensourceprojects.dev (each page server-renders the repo's GitHub URL; extracted by regex, `.git` clone-URL duplicates stripped)
- [PARTIAL, Wayback CDX + id_ fetch] http://web.archive.org/cdx/search/cdx?url=opensourceprojects.dev/post/* - 2,603 rows; 348 of 569 deleted posts recovered from snapshots, 221 failed
- [FULL, JSON API] `gh api repos/<owner>/<repo>` x 1,309 - stars, pushed_at, archived, description; licence field recorded but NOT used
- [FULL, JSON API + base64] `gh api repos/<owner>/<repo>/contents/LICENSE|LICENSE.md|LICENSE.txt|LICENCE|COPYING` x 100 - the licence column
- [FULL, gh via glue-check] `~/.claude/skills/glue-first/bin/glue-check` x 100 - lines 1-3 (licence file head, last push + 180d commits, contributors + top two)
- [FULL, gh api readme] Panniantong/Agent-Reach README (Chinese) - the Reddit row: no zero-config path, browser login state or rdt-cli + cookie; nocodb/nocodb LICENSE.md (Sustainable Use License, updated 2026-01-29); remotion-dev/remotion LICENSE.md (Free License / Company License); deepseek-ai/deepseek-harness README (developer preview, breaking changes); githubpr0jects org repos
- [FULL, local] `~/zao-vault/notes/glue-first-standard.md` (101 lines, 2026-08-27); `~/bin/zao-ingest.sh` (grep for pdf/docx/epub = 0); `~/.claude/plugins/` (caveman, everything-claude-code installed); `command -v rg ffmpeg` (present), `fzf hugo act frp code-server memos docling` (absent)
- [FULL, local] ZAOOS docs 601, 603, 528, 790, 2081, 2411, 2282, 441, 297 - read for the verdicts that cite them
- Community source (Hard Requirement 7): the Bluesky feed and the account's own site are the community surface here; Reddit and HN were not searched because the question is "what does this account post", not "what do people think of it"
