---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-17
related-docs: 660, 661, 662, 663
tier: STANDARD
parent-doc: 663
---

# 663a — /zao-research Cross-Repo Search Upgrade

> **Goal:** Extend /zao-research skill to search across ZAO ecosystem repos (bettercallzaal org) by default, not just local research/ library.

## Current State

The /zao-research skill at `~/.claude/skills/zao-research/SKILL.md` executes a three-tier research workflow (QUICK/STANDARD/DEEP) with mandatory community sources (Reddit, HN, GitHub, X). Step 2 ("Search Codebase + Existing Research") only searches:

- Local: `/Users/zaalpanthaki/Documents/ZAO OS V1/research/` library
- Local: `/Users/zaalpanthaki/Documents/ZAO OS V1/src/` codebase
- Config: `community.config.ts`

**Gap:** When researching topics relevant to WaveWarZ, COC Concertz, Zlank, BetterCallZaal website, or other ZAO ecosystem projects, the skill does NOT search their source code, README files, or research docs. Users must manually invoke `gh search` or repo-specific tools.

**Impact:** 30+ active bettercallzaal org repos are invisible to /zao-research. Researchers miss patterns, decisions, implementations living in sibling projects.

## Canonical ZAO Ecosystem Repos (Public + Active)

### Core Operating System
- `ZAOOS` - Farcaster client, ZAO OS main repo
- `zaostock` - Festival operations, team coordination bot

### Artist Communities + Events
- `CoCConcertZ` - COC Concertz concert promotion, virtual events
- `ZAONEXUS` - Community directory, member profiles
- `zao-101` - Onboarding docs, ZAO brand positioning

### Agent / Autonomous Systems
- `zlank` - Farcaster Snap builder ("no-code deploy")
- `Aurdour` - DJ platform, Flow Mode auto-DJ
- `fractalbotapril2026`, `fractalbotmarch2026`, `fractalbotfeb2026` - Fractal process bots (historical variants)
- `crownvics` - Historical record (Ellsworth car culture reference)

### Music / Audio
- `wavewarzapp` - WaveWarZ spectator app, Solana battle alerts
- `wwbase` - WaveWarZ production code, Base L2 agentic battles
- `mixer` - Audio utilities, mixing DSP
- `zaomusicbot` - Music bot (legacy)
- `ZOUNZ` - Farcaster music mini app, AI generation + Audius discovery + Zora minting

### Web3 / Tokenomics
- `zabalsnap1` - ZABAL token snap/interface
- `zabalbot` - ZABAL bot (legacy)
- `bettercallzaalwebsite` - Main BCZ portfolio + ecosystem hub

### Snap Templates + Infrastructure
- `zlank-snap-template` - Starter template for Farcaster Snaps (Hono + Vercel + @farcaster/snap)
- `ltaesnap` - Long-tail artist economy snap
- `duodo-snap` - Duodo snap (marketplace or community)
- `nouns-snap` - Nouns integration snap

### Brand / Content
- `bcz-journal` - Zaal's public building journal
- `bcz-yapz` - YapZ graduated product (now separate repo + bczyapz.com)
- `bettercallzaal-coding-hub` - GitHub hub aggregator with embedded READMEs
- `zabalnewsletter` - Newsletter automation

### Other Active
- `fishbowlz` - Audio rooms (paused 2026-04-16 for Juke partnership, but code lives on)
- `Zaal-s-Birthday` - Zaal birthday button (reference utility)
- `imanprojects` - Iman portfolio / projects
- `uvrintrobot` - Bot/automation utility
- `riverside-group-demo` - Riverside landscaping website (Zaal consulting project)
- `chat` - Web interface for agentic record label
- `tasks` - Task management interface
- `zski` - Utility (unspecified)
- `textsplitter` - Text processing utility
- `ZAOVideoEditor` - Video editing tool
- `ZAO-Video-Editor` - (variant of above?)
- `B-ZBUILD2` - Build system or build documentation
- `ZAOFlights` - Flights coordination (ZAO events)
- `songjam-site` - SongJam leaderboard site
- `zaoprojects` - Project registry
- `ethboulderjournal` - ETH Boulder event documentation
- `Viz1` - Visualization utility
- `Newsletterbot1` - Newsletter bot
- `WARZAI` - WaveWarZ AI (related to battles)

### EXCLUDE FROM DEFAULT SEARCH
**Private repos** (no public search access):
- `quad-sandbox` - QuadWork sandbox (internal)
- `zao-ui` - Design tokens (internal)
- `zao-mono` - ZAO monorepo with submodules (internal)
- `zaoos-workspace` - ZOE workspace + agent configs (internal)
- `budget2026` - Budget tracking (internal)
- `agencyweb3toolkit` - Internal toolkit
- `wwinfo1`, `wwtest1` - Test/info repos (private)
- `unifiedchatclient` - Internal (private)
- `loanz-platform-1` - Internal financial tool

**Archived or low-signal** (skip by default):
- `fractalbotv1old`, `fractalbotdec2025`, `fractalbotV3June2025`, `fractalbotnov2025`, `ZAO-FRACTAL-BOTV2` - Superceded by active fractal bot variants
- `Firsttimehomebuyers-guide` - One-off content (may have limited ecosystem relevance)
- `SidebySidev2`, `zaaltimelinev1.1`, `zaaltimelinev1`, `zaloraV1`, `ZAIV2`, `ZAIV1` - Version clones / prototypes
- `Agent2`, `eliza1` - Generic agent experiments (not ZAO-specific)

## Implementation Options: Cost/Signal Trade-off

| Option | Mechanism | Cost | Speed | Accuracy | Maintenance |
|--------|-----------|------|-------|----------|-------------|
| **A: Local Mirror** | Clone ~30 public repos to `~/zao-ecosystem-mirror/` on first run; grep across tree | 2-3GB disk, 15min clone time | ~500ms per query | High - native grep | Medium - sync weekly |
| **B: gh CLI** | `gh search code "query" --owner=bettercallzaal` | API rate limit (30 req/min, 60 per hour) | ~5-10s per query (network) | Medium - rank by stars/recency | Low - no maintenance |
| **C: MCP grep.app** | Call `mcp__grep__searchGitHub` with org scope | Included in session budget | ~2-3s per query | Medium - gh-backed, semantic | None - service-provided |

### Recommendation: Option C (MCP grep.app)

**Use `mcp__grep__searchGitHub` MCP tool.**

**Rationale:**
1. **No disk overhead** - grep.app is service-backed, no local clone needed. Disk stays under 1GB.
2. **Built-in to Claude Code** - no new skill dependency, no auth setup.
3. **Fast enough** - 2-3s per query is acceptable for research (not real-time interactive).
4. **Accurate filtering** - supports `repo:` and `owner:` filters, language filters, `--path=` for targeting specific files.
5. **Minimal maintenance** - GitHub backs the index; we just call the tool.
6. **Integrates with context budget** - counts against session token usage, not separate API quota.

**Fallback to Option B** if grep.app is unavailable: use `gh search code` in Bash.

## Exact Skill Modification: Insert into Step 2

**Location in SKILL.md:** Insert after line 89 (after "This grounds research in reality..."), before Step 3.

**Subsection to add:**

```markdown
### Step 2.5: Cross-Repo Search (ZAO Ecosystem)

After checking local research + codebase, search across ZAO ecosystem repos (30+ public repositories in bettercallzaal org):

#### Quick Check: Is the Topic Cross-Repo Relevant?

Use cross-repo search if researching:
- **Music tech:** player patterns, NFT tooling, distribution strategies (found in wwbase, Aurdour, ZOUNZ, CoCConcertZ)
- **Snap/Mini App:** builder patterns, deployment (found in zlank, zlank-snap-template, ltaesnap, duodo-snap, zabalsnap1)
- **Governance:** fractal bots, voting, member roles (found in fractalbotapril2026 variants, zaoprojects)
- **Web3 tokenomics:** ZABAL/SANG integration, contracts, analytics (found in wwbase, zabalsnap1, zabalbot)
- **Farcaster integration:** signer patterns, SIWN, XMTP, mini apps (found in ZAOOS, zlank, ZOUNZ, wavewarzapp)
- **Automation/bots:** agent framework, memory, task dispatch (found in fractalbots, zaomusicbot, zabalnewsletter)
- **Brand consistency:** design patterns, color palette, terminology (found in bettercallzaalwebsite, ZAONEXUS, bcz-journal)

#### Search Command

Use the MCP `mcp__grep__searchGitHub` tool with org scope:

```bash
# Example 1: Search for "Sonata" (music player) across ZAO repos
mcp__grep__searchGitHub(
  query='Sonata',
  repo='bettercallzaal/',
  language=['TypeScript', 'TSX', 'JavaScript']
)

# Example 2: Search for RLS pattern (Supabase) in API routes
mcp__grep__searchGitHub(
  query='rls_enabled|row_level_security',
  repo='bettercallzaal/',
  useRegexp=true,
  language=['TypeScript']
)

# Example 3: Search for agent framework usage
mcp__grep__searchGitHub(
  query='LettaAgent|OpenClaw|agentkit',
  repo='bettercallzaal/',
  language=['Python', 'TypeScript', 'JavaScript']
)
```

#### Rate Limits + Graceful Degradation

- **GitHub API limit:** 30 requests per minute, 60 per hour (enforced by grep.app).
- **Per [STANDARD] tier:** budget 2-3 cross-repo searches. For [DEEP] tier, budget up to 5.
- **Hit the limit?** Note "rate-limited at X of Y planned searches" in doc. Resume next day or use fallback:
  - `gh search code "query" --owner=bettercallzaal --limit=20` (Bash, same limits but shows results)
  - Manual: browse key repo READMEs on GitHub web UI
  
#### What to Do With Results

1. **High signal (exact match):** Include in doc with repo name + file path. Example: "WaveWarZ uses Sonata for player at `wwbase/src/components/SonataPlayer.tsx`."
2. **No hits (zero results):** Document it. "Pattern not found across 30 ZAO repos; pattern is novel or only in ZAOOS." Valuable negative signal.
3. **Deduplication:** If the same pattern appears in 3+ repos, extract it as "Standard ZAO pattern: [name]" + link representative repo.
4. **Private repos:** Remind user that private repos (zao-ui, zao-mono, quad-sandbox) are not searchable this way. Mention if relevant.

#### Excluded Repos (Skip in Default Search)

Do NOT search these by default (archived, private, or low-signal):

**Private (no public search):**
- quad-sandbox, zao-ui, zao-mono, zaoos-workspace, budget2026, agencyweb3toolkit, wwinfo1, wwtest1, unifiedchatclient, loanz-platform-1

**Archived or superceded (optional to search):**
- fractalbotv1old, fractalbotdec2025, fractalbotV3June2025, fractalbotnov2025, ZAO-FRACTAL-BOTV2, Firsttimehomebuyers-guide, SidebySidev2, zaaltimelinev1.1, zaaltimelinev1, zaloraV1, ZAIV2, ZAIV1, Agent2, eliza1

```

## Edge Cases + Troubleshooting

| Scenario | Handling |
|----------|----------|
| **Repo has 0 hits for query** | Log "no implementations in 30-repo scan; pattern may be novel or internal." Include in "Also See" as negative evidence. |
| **Same pattern in 3+ repos** | Extract as "Standard pattern" + link representative repo (prefer ZAOOS, wwbase, zlank as canonical). |
| **Private repo relevant but unsearchable** | Note: "[Note: zao-ui design tokens are private; not searched. Contact @Zaal for internal reference.]" |
| **Rate limit hit mid-research** | Stop gracefully. Flag: "Rate-limited after 3 of 5 planned searches. Resuming tomorrow or via manual GitHub search." Do NOT retry in loop. |
| **URL to repo file** | Provide full GitHub.com URL, not rel path. Format: `github.com/bettercallzaal/REPO/blob/main/src/...` |

## Implementation Checklist

- [ ] Add Step 2.5 subsection to `~/.claude/skills/zao-research/SKILL.md` (after line 89)
- [ ] Verify `mcp__grep__searchGitHub` is callable (test with 1 query)
- [ ] Document excluded repos in skill (copy table above)
- [ ] Test on 1 real research task (e.g., "search for Sonata usage across ZAO repos")
- [ ] Update skill version to 2.2.0 + changelog note in frontmatter
- [ ] Ship PR with updated skill

## Sources

- GitHub Actions API: `gh search code` - [docs.github.com/en/search-github/searching-on-github/searching-code](https://docs.github.com/en/search-github/searching-on-github/searching-code)
- Context7 MCP grep.app: local installed tool, supports `owner=` scoping
- bettercallzaal org repo list: verified 2026-05-17 via `gh repo list bettercallzaal --limit 100`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Modify ~/.claude/skills/zao-research/SKILL.md to add Step 2.5 | Claude Code (this session) | Code | 2026-05-17 |
| Test cross-repo search on 1 task (WaveWarZ music player pattern?) | Next /zao-research user | Manual | 2026-05-18 |
| Collect user feedback on speed + signal quality | @Zaal | Review | After first 3 uses |
| Bump skill version to 2.2.0 + update frontmatter | Next session | Maintenance | 2026-05-25 |
