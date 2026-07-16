# Session handoff - 2026-07-15 17:21
> from Mac (ZAO OS V1, multiple ws/ branches) -> to the ZOE Claude in the `zoe` tmux session on the VPS (~/zao-os)
> doc: research/events/session-2026-07-15-zoe-soul-multimodel-terminal/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You are the persistent Claude Code session running on the VPS in `~/zao-os` (the LIVE ZOE deploy clone). You just received a handoff. Do NOT start work yet:

1. Read ALL sections below before acting.
2. Build a TODO list from Section A.
3. Use Section B as your "why" - do not re-litigate settled decisions.
4. HARD RULE for you specifically (you are on the live VPS clone): code changes go on a branch + PR, NEVER push to main, never leave the clone dirty (a stray `git checkout` reverts uncommitted work + can disturb the running bot). Never self-edit `.claude/settings.json`. Deploys/keys/on-chain/outbound stay Zaal-gated.
5. When done reading, reply: "Ingested handoff, N tasks queued, ready."

## Repos to use (START HERE)
- Primary: `bettercallzaal/ZAOOS` - you are already in its clone at `~/zao-os`. ZOE code = `bot/src/zoe/`. Research = `research/`. Rules = `.claude/rules/` (read agent-loops.md, secret-hygiene.md).
- Secondary: `bettercallzaal/zol` (ZOL + the merged DreamLoops framework). If unsure which repo, it is ZAOOS.

## Capability boundary (you on the VPS)
- You HAVE: claude, git, the ZOE code, systemctl (zoe-bot), journalctl, and now `~/.claude/skills/` (65 skills synced - Mac-specific ones like clipboard/meeting/socials will NOT work on Linux; ignore those).
- You do NOT have: the Mac's clipboard browser, mlx-whisper, osascript, Zaal's local `~/.zao/private` secrets in full, or his real accounts. When a task needs those, STOP and ask Zaal to do it on his Mac. Continue with everything you CAN do.

## A. Tasks to absorb
- [ ] Review + merge the session's open PRs (Zaal reviews scope+build first): SEO #1403, red-team #1402, legal #1405, LinkedIn #1406, roadmap #1407, AI-models #1408, platform #1409, trycua #1412, repo-audit #1413, Palantir/tweet #1414, meeting-recap #1415. (ZOE soul #1410 + multi-model #1411 are already MERGED.)
- [ ] Enable multi-model when Zaal is ready: add `XAI_API_KEY` + `OPENAI_API_KEY` + `MODEL_ROUTING_ENABLED=1` to `bot/.env` (Zaal supplies keys), restart zoe-bot. Then she routes Claude/Grok/GPT + tells him which+why.
- [ ] Work the repo-audit roadmap (doc 1115, PR #1413) top-down: (1) unblock Bonfire read + finish zao-mcp gating = the context layer; (2) land hermes-orchestrator PR3/PR4 (50-day stall = biggest loop risk); (3) graft DreamLoops+multi-model onto farscout+zaocowork.
- [ ] Cloudinary fix (COC uploads down since 2026-07-03, key perms) - Zaal's 2-min console fix; blocks COC #7.
- [ ] Zaal to SEND (clipboards ready on his Mac): the Brandon reply + the Empire Builder recap (to Adrian+Jordan). Not yours to send.
- [ ] DreamLoops -> Pi: merged to zol main but DORMANT (flag off). Zaal test-deploys to the Pi himself; do not enable without him.

## B. Why - decisions + friction (do not re-discover)
- ZOE soul is DEPLOYED + LIVE. Mechanism: `seedFile` is skip-if-exists, and the live `~/.zao/zoe/persona.md` had DIVERGED to 204 lines of accumulated rules - a blind re-seed would have wiped months of rules. Fixed via a surgical patch (backup at persona.md.bak-20260715). So: the code `PERSONA_DEFAULT` and the live persona.md are permanently out of sync; edit the LIVE file for behavior changes.
- Sparkz (creator-coin product): word is "back the album" NOT "coin"; configurable launcher + AI advisor (creator sets split/governance/utility, smart defaults); memecoin is LEGALLY safer than a utility-token (doc 1108) - goes to counsel (Greg). ZAO ~25% locked stake, governance default = hybrid (option C).
- Brandon (DreamLoops author): YES to the DreamNet trust/verification-layer jam (complements Bonfire). NO to the clawdchat engagement-swarm (bot-farming likes = off-brand + Farcaster ToS + kills the credibility Sparkz/GEO need). His own trust layer is the antidote to his own botting idea.
- ZOE routing: questions -> Zaal DM via `zao-ask-dm`; status -> ZAALBOTS group via `zao-status`; single rolling pin (only top question pinned, unpins on answer).
- FRICTION: (a) the auto-mode classifier BLOCKS prod-VPS writes/restarts/deploys - Zaal must run those himself or explicitly authorize; (b) doc-numbering collisions when 2 agents scan main at once (two grabbed 1109) - pick next+gap; (c) the pre-commit research-index guard blocks commits missing a folder-README row, and piping `git commit` to `tail` MASKS its exit code (falsely prints "committed"); (d) never self-write `.claude/settings.json` (the settings self-write boundary).

## C. Git state
- Many ws/ branches pushed as the PRs listed in Section A (all committed + pushed). Meeting recap (doc 1118) = PR #1415 on ws/meetings-jul14. Repo audit (doc 1115) = PR #1413 on ws/research-repo-audit.
- Working tree currently on a research branch with ~1 agent-leftover dirty file; no critical uncommitted work. `git reset --hard origin/main` on the VPS clone if you need a clean deployed-truth tree (but check nothing local is lost first).

## D. In-flight
- Background jobs: none running (all subagents + bg bash completed).
- Scheduled wakeups: none. Open AskUserQuestion: none.

## E. Cold-start map
- ZOE state: soul LIVE (persona.md patched); multi-model MERGED but OFF (needs keys+flag); DreamLoops MERGED to zol main but DORMANT (not on Pi); GROQ voice LIVE (voice-in works).
- New tools this session (on the Mac, some synced): `zao-ask-dm` (DM button-questions), `zao-status` (group status), `zao-set-groq` (drop-in key deploy), `/terminals` skill (this persistent-terminal setup).
- Memory writes (Mac, ~/.claude/.../memory/): feedback_never_wait_terminal_poll_tg, feedback_zoe_dm_questions_group_status, feedback_iman_tag_zaal_telegram_bridge, feedback_vibe_detailed_reports, project_sparkz_configurable_ai_advisor, project_brandon_dreamloops_zol (updated), reference_pi_phone_terminal_blink.
- Mental model: Just finished a huge day - deployed ZOE's soul, merged multi-model + DreamLoops, audited 37 repos (doc 1115 = the forward roadmap), processed the Empire Builder meeting, and set up this persistent VPS terminal. Next is executing the audit roadmap (context layer first) + enabling multi-model, all PR-only + Zaal-gated.
- Open questions for Zaal: which audit move to start (default: unblock Bonfire read), and when to enable multi-model (needs his keys).

## Inline copy-paste block (for fast receiver paste)

```
Read ~/zao-os/research/events/session-2026-07-15-zoe-soul-multimodel-terminal/README.md and follow the receiver instructions at the top. 6 tasks to absorb. You are the live VPS ZOE clone - branch+PR only, never push to main.
```
