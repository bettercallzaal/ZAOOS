---
topic: community
type: comparison
status: research-complete
last-validated: 2026-11-07
superseded-by:
related-docs: "358, 577, 897, 732, 264, 2155"
original-query: "/zao-research https://github.com/naomimetzger?tab=repositories as much as we can"
tier: STANDARD
---

# 2731 - Naomi Metzger's public repos: what fits ZAO content and agent work

> **Goal:** Decide, repo by repo, what ZAO should USE, ADAPT or SKIP from Naomi Metzger's public GitHub repos (video creator and AI builder, 14 public repos as of 2026-11-07), checking each licence in its LICENSE file.

## Key Decisions

| Repo | Verdict | Reason (licence read from LICENSE file) |
|---|---|---|
| cookbook | USE (install locally for Zaal's own videos only; do not vendor into ZAOOS) | Custom licence "Copyright (c) 2026 Naomi Metzger": free for your own videos including paid work, not for resale or redistribution "as part of another tool". Blocks copying into a ZAO repo. Overlaps Flowstage (existing MCP) only for editing, not for the caption-style recipes. |
| viral-script | ADAPT (hook-first rule and formula families, with credit) | MIT, Copyright 2026 Naomi Metzger. Its hook-lock rule (3 hooks from 3 formula families, pick one before writing) is not yet in ZAO short-form work. Keep the MIT notice and credit her at the use site. |
| transcript | SKIP (no licence: all rights reserved) | No LICENSE file (GitHub returns 404). ZAO already transcribes with `~/bin/zao-ingest.sh`. The cut-by-transcript idea is worth a written question to her, not a copy. |
| brand-voice | SKIP (ZAO already has a stronger voice skill) | MIT. Its interview-once voice guide duplicates `~/.claude/skills/zaal-voice/SKILL.md`, which already carries the banned-word, casing and humanizer passes. |
| instagram-transcript | SKIP | MIT. Duplicates `~/bin/zao-ingest.sh` (YouTube, Spotify, RSS, direct media). It drives yt-dlp against Instagram reels; a ToS question ZAO has not ruled on. |
| content-cheat | SKIP | MIT. Reverse-engineers Instagram reels and depends on instagram-transcript. Instagram is not a ZAO publishing surface in the Paragraph/Farcaster/X set in `~/.claude/skills/socials/skill.md`. |
| linkedin-growth | SKIP for now | MIT. ZAO's LinkedIn playbook already exists at `research/business/264-linkedin-build-in-public-playbook/README.md`. Re-open only if LinkedIn becomes a named ZAO channel. |
| life-goal | SKIP | MIT. A personal goals and wellbeing tool. Not ZAO content work, and it would hold personal data outside the vault. |
| templateagent | SKIP | MIT, but the LICENSE copyright line reads "Copyright (c) 2026 Hugo Richard", and the README links to `vercel-labs/personal-agent-template`. A fork of someone else's template. ZOE and the Orca agent stack already cover agent building. |
| accountable | SKIP | No LICENSE file (404): all rights reserved. Its README text is the Fhenix CoFHE starter, not a description of the repo's purpose. |
| capsule-fhe | SKIP | No LICENSE file (404): all rights reserved. Its README is one line ("Encrypted group time capsule on Fhenix"). FHE work is outside the ZAO research topics checked here. |
| cofhe-hardhat-starter (fork) | SKIP | Fork of `fhenixprotocol/cofhe-hardhat-starter` (GitHub `fork: true`). No LICENSE file in the fork. The upstream LICENSE lookup returned 404, so upstream licence is UNVERIFIED. |

**Recommendation in one line:** install the cookbook recipes for Zaal's own videos, ADAPT the viral-script hook-first rule into ZAO short-form work with credit, and skip the rest.

## Findings

### 1. Where each repo stands today (as of 2026-11-07)

| Repo | Stars | Language | Last commit (committer date, UTC) | Commit subject | Licence (LICENSE file) |
|---|---|---|---|---|---|
| cookbook | 9 | Python | 2026-11-06T19:18:22Z | "Point to the cookbook site for customising" | Custom, see Key Decisions |
| transcript | 4 | HTML | 2026-10-27T01:13:38Z | "Protect adjacent speech at transcript cuts" | None (404) |
| brand-voice | 0 | Shell | 2026-08-04T21:56:38Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| viral-script | 0 | Shell | 2026-08-04T21:56:43Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| content-cheat | 0 | Shell | 2026-08-04T21:56:47Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| instagram-transcript | 0 | Python | 2026-08-04T21:57:05Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| linkedin-growth | 0 | Shell | 2026-08-04T21:56:52Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| life-goal | 0 | Shell | 2026-08-04T21:56:56Z | "Initial release of Claude skill package." | MIT, Copyright 2026 Naomi Metzger |
| templateagent | 0 | TypeScript | 2026-06-17T20:27:20Z | "Initial commit" | MIT, Copyright 2026 Hugo Richard |
| accountable | 0 | TypeScript | 2026-06-16T16:12:10Z | "feat: allow editing locked goals" | None (404) |
| capsule-fhe | 0 | Solidity | 2026-05-07T19:52:56Z | "Update TimeCapsule.sol" | None (404) |
| cofhe-hardhat-starter (fork) | 0 | TypeScript | 2026-05-22T14:18:55Z | "move footer up" | None (404) |

Counts: 14 public repos on the profile (`gh api users/naomimetzger`, `public_repos` = 14). This table covers 12 of them. The other two are `naomimetzger` (the profile repo, pushed 2026-10-19, 0 stars) and `NMSOCIAL` (Python, pushed 2026-03-12, no licence, 0 stars), which were not read in this run.

Caution on the star and date fields: they are a snapshot at the moment of the fetch (2026-11-07). Stars on the two repos with real traction are 9 (cookbook) and 4 (transcript); every other repo has 0.

### 2. What each recipe or skill does (from its README, fetched this run)

- **cookbook** (README, 1,973 bytes): five free editing recipes for Claude Code or ChatGPT Codex, run as slash commands: `/bigwords` (up to 3 huge words, each timed to the spoken word), `/midcaptions` (small bold captions at chest height), `/slideup`, `/titlestack`, `/clipsonwhite`. Needs Python 3 and ffmpeg. The README says the five recipes are free and points to naomimetzger.com/cookbook to preview, customise and copy prompts (it does not state prices, and the page was not fetched). It also links a `humanise` repo that is not in her list and was not fetched.
- **transcript** (README, 1,965 bytes): a Codex skill (`transcript-video-editor`) that transcribes locally with faster-whisper, lets you select words or sentences in chat, and renders the cut with FFmpeg. It states that cuts leave up to 0.06 s at each edge and can leave fragments.
- **brand-voice** (README, 1,861 bytes): interviews you once, writes a voice guide, then applies casing, banned words, emojis and one CTA per post.
- **viral-script** (README, 2,091 bytes): short-form scripts with 8 formats and 60+ coded hook formulas; the hook is locked first, and you get 3 options from 3 different formula families.
- **content-cheat** (README, 1,771 bytes): reverse-engineers an Instagram reel into an HTML cheat card and a remix script. Needs a transcript source.
- **instagram-transcript** (README, 2,113 bytes): transcribes a public Instagram reel locally with yt-dlp plus faster-whisper behind a localhost:7337 server.
- **linkedin-growth** (README, 1,808 bytes): LinkedIn system for creators: pillars, formats, a 30-day plan, profile audit.
- **life-goal** (README, 2,340 bytes): personal goals operating system (daily mode, weekly reset, 14-day sprint, decision filter).
- **templateagent** (README, 7,636 bytes): a Vercel template for a personal agent, cloned from `vercel-labs/personal-agent-template`.
- **accountable** (README, 7,894 bytes): the text is the Fhenix CoFHE Hardhat starter (install, `pnpm localcofhe:*` scripts), which does not describe the repo's name.
- **capsule-fhe** (README, 39 bytes): "Encrypted group time capsule on Fhenix".
- **cofhe-hardhat-starter** (README, 7,910 bytes): the Fhenix CoFHE starter, same text as the upstream README.

### 3. Comparison against what ZAO already has (3+ options)

| Option | Where it lives | What it covers | Gap that Naomi's repos would fill |
|---|---|---|---|
| Zaal voice skill | `~/.claude/skills/zaal-voice/SKILL.md` (with `humanizer/`) | Writing in Zaal's name, banned-word and de-AI passes, read-aloud test | None for voice. brand-voice (MIT) would duplicate it. |
| Socials skill | `~/.claude/skills/socials/skill.md` | Platform-specific posts (Farcaster/X, GCs, Telegram, Discord, LinkedIn, Facebook) | No hook-first structure for short-form video scripts. viral-script fills that. |
| Newsletter skill | `~/.claude/skills/newsletter/SKILL.md` | Paragraph newsletter editions, figures verified first | None for text. |
| Transcription engine | `~/bin/zao-ingest.sh` (prints a transcript path plus a `.meta.json`) | YouTube, Spotify (via free copy), Apple Podcasts, RSS, direct media | No cut-by-transcript editor. transcript (no licence) would fill that, but cannot be copied. |
| Flowstage MCP | `mcp__claude_ai_Flowstage__*` tools (video edits, posts, TikTok) | Short-form video editing and scheduling inside an aesthetic | Overlaps the cookbook caption recipes. Keep both: Flowstage posts, cookbook edits Zaal's own clips locally. |
| ZAO research on brand voice | `research/community/358-bettercallzaal-brand-voice-analysis/README.md` | Zaal's authentic voice from real samples | None. |
| ZAO research on viral and hooks | `research/community/577-viral-x-thread-patterns-humble-milestone-posts/README.md`, `research/dev-workflows/732-agentic-writing-deep/732f-hook-engineering-copywriting/README.md` | Viral X thread patterns, hook engineering | viral-script adds a concrete 60-formula library and the lock-the-hook-first rule. |
| ZAO social playbook | `research/community/897-zao-social-posting-playbook/README.md` | How to post flat announcements without reading like an event listing | None. |

Searches run this session, with results: `~/.claude/skills` for "brand voice" in zaal-voice, socials and newsletter (0 files; the check passed with a control match on "humaniz" in zaal-voice). `research/` in the origin/main snapshot for "brand voice" (80 files), "viral" (181), "transcript" (622). `research/` for "Naomi Metzger", "naomimetzger" or "afrochicksnft": 0 files. Not searched: the other repos in `~/zaal-dotfiles`, and Paragraph or Notion for content-pillar notes.

### 4. Community source (Step 4, X and Reddit)

- X (@afrochicksnft, the handle listed on her GitHub profile as `twitter_username`): FAILED. Method: WebSearch for her name with "Claude Code" and "afrochicksnft" returned no post, only search snippets; no X post URL was identified, so none was fetched. No claim here rests on an X post.
- Reddit: FAILED. Method: Arctic Shift (`arctic-shift.photon-reddit.com/api/posts/search`) with `subreddit=ClaudeAI&title=metzger`, and a control query `subreddit=ClaudeAI&title=claude skill`; both returned "Timeout. Maybe slow down a bit", so the route gave no signal either way.
- Hacker News: FULL, method: HN Algolia API (`hn.algolia.com/api/v1/search`). Query `naomimetzger` (story tag) returned nbHits 0; query `"Naomi Metzger"` (comment tag) returned nbHits 0. Control query `claude skills` returned nbHits 1229, so the endpoint was working. This is a real zero for those exact strings.

### 5. Identity and a discrepancy

- GitHub profile (`gh api users/naomimetzger`): name "Naomi Metzger", bio "11 x british triple jump champion ... video creator and ai builder".
- Sessionize speaker profile (`sessionize.com/naomi-metzger`, FULL, raw HTML, tags stripped): "Creator of AfroChicks NFT", "current 10x British Triple Jump Champion", degree in Politics and Quantitative Methods, published photographer.
- The bio says 11x and the speaker profile says 10x. This is UNVERIFIED which one is current. Do not quote a number from either without a dated source.

### 6. Licence notes

- The LICENSE files were read from `gh api repos/naomimetzger/<repo>/contents/LICENSE` (base64 decoded), not from the API licence field. The API field reported NOASSERTION for cookbook and "none" for transcript; the file read gives the actual terms above.
- No LICENSE file means all rights reserved, not public domain (`.claude/rules/credit-attribution.md`). Applied to transcript, accountable, capsule-fhe, cofhe-hardhat-starter.
- Any MIT repo that is adopted keeps its copyright line and an attribution comment at the use site (`.claude/rules/credit-attribution.md`).

### 7. Verified numbers (all as of 2026-11-07)

- 14 public repos on the profile (`public_repos`).
- cookbook: 9 stars, 5 recipes, 2 of them with licence text forbidding resale.
- 8 video formats and 60+ coded hook formulas in viral-script (its README).
- 12 repos read via LICENSE and README; 3 with no LICENSE file (transcript, accountable, capsule-fhe) plus the fork.
- HN: 0 hits for two exact-name queries; control 1229 hits.

## Sources

| # | Source | Method | Status |
|---|---|---|---|
| 1 | https://github.com/naomimetzger (profile, repo list, `public_repos` = 14) | `gh api users/naomimetzger`, `gh api users/naomimetzger/repos?sort=pushed` | FULL |
| 2 | https://github.com/naomimetzger/cookbook (README, LICENSE, commits) | `gh api .../contents/README.md` and `/contents/LICENSE` base64-decoded; `gh api .../commits?per_page=1` | FULL |
| 3 | https://github.com/naomimetzger/transcript | `gh api .../contents/README.md`; LICENSE returned 404 | FULL (README), FAILED (no licence exists to read) |
| 4 | https://github.com/naomimetzger/brand-voice | `gh api` README and LICENSE (MIT) | FULL |
| 5 | https://github.com/naomimetzger/viral-script | `gh api` README and LICENSE (MIT) | FULL |
| 6 | https://github.com/naomimetzger/content-cheat | `gh api` README and LICENSE (MIT) | FULL |
| 7 | https://github.com/naomimetzger/instagram-transcript | `gh api` README and LICENSE (MIT) | FULL |
| 8 | https://github.com/naomimetzger/linkedin-growth | `gh api` README and LICENSE (MIT) | FULL |
| 9 | https://github.com/naomimetzger/life-goal | `gh api` README and LICENSE (MIT) | FULL |
| 10 | https://github.com/naomimetzger/templateagent | `gh api` README and LICENSE (MIT, Hugo Richard) | FULL |
| 11 | https://github.com/naomimetzger/accountable | `gh api` README (FULL); LICENSE 404 | FULL (README), FAILED (no licence) |
| 12 | https://github.com/naomimetzger/capsule-fhe | `gh api` README (39 bytes); LICENSE 404 | FULL (README), FAILED (no licence) |
| 13 | https://github.com/naomimetzger/cofhe-hardhat-starter | `gh api` README; LICENSE 404 in fork; upstream `fhenixprotocol/cofhe-hardhat-starter` LICENSE 404 | PARTIAL (upstream licence UNVERIFIED) |
| 14 | https://sessionize.com/naomi-metzger | `curl -sL`, `<script>`/`<style>`/tags stripped with Python | FULL |
| 15 | https://hn.algolia.com/api/v1/search (queries naomimetzger, "Naomi Metzger", control "claude skills") | `curl -sL` JSON | FULL (zero hits for name, control passed) |
| 16 | X @afrochicksnft | WebSearch snippets only; no post URL fetched | FAILED |
| 17 | Reddit (Arctic Shift, r/ClaudeAI, title "metzger") | `curl` JSON; control and target both timed out | FAILED |
| 18 | ZAO local skills and research (`~/.claude/skills/zaal-voice/SKILL.md`, `~/.claude/skills/socials/skill.md`, `~/.claude/skills/newsletter/SKILL.md`, `~/bin/zao-ingest.sh`, research docs 358, 577, 897, 732f, 264) | local `grep`, `ls`, file reads | FULL |

## Also See

- [358 - BetterCallZaal brand voice analysis](../358-bettercallzaal-brand-voice-analysis/)
- [577 - Viral X thread patterns](../577-viral-x-thread-patterns-humble-milestone-posts/)
- [897 - ZAO social posting playbook](../897-zao-social-posting-playbook/)
- [732f - Hook engineering copywriting](../../dev-workflows/732-agentic-writing-deep/732f-hook-engineering-copywriting/)
- [264 - LinkedIn build-in-public playbook](../../business/264-linkedin-build-in-public-playbook/)
- [2155 - Per-brand identity kit](../../identity/2155-per-brand-identity-kit/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Install the five cookbook recipes into `~/.claude/skills/` on the Mac for Zaal's own videos (not vendored into ZAOOS); shipped = `/bigwords` run once on a test clip | Zaal | Local install | 2026-11-14 |
| ADAPT the viral-script hook-first rule (3 hooks from 3 formula families, lock one before writing) into ZAO short-form guidance, keeping the MIT copyright line and crediting Naomi Metzger (@afrochicksnft, github.com/naomimetzger); shipped = PR merged with the credit line | Zaal | PR | 2026-11-21 |
| Email Naomi Metzger asking whether the transcript-video-editor (no licence today) can be licensed for ZAO use, and whether her cookbook licence covers ZAO-produced clips; shipped = her written reply pasted into this doc's Sources | Zaal | Outbound (Zaal sends) | 2026-11-14 |
| Re-run the X and Reddit fetches with an authenticated route and resolve the 10x vs 11x champion discrepancy from a dated source; shipped = Sources rows 16 and 17 updated to FULL or left FAILED with the reason | Zaal | Research re-run | 2026-11-21 |

## Doc-number note

Reserved as 2731 with `zao-doc-next naomi-metzger-repos` from a clean worktree off origin/main (the shared checkout's HEAD carried inherited commits, so the reservation was refused there). Doc 2730's local tag was reset by Zaal to match origin.
