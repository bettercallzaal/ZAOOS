---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-05
superseded-by:
related-docs: 441, 442, 836
original-query: "give this info into ZAOOS and do dev/env files that this is how we want to do things - documenting the multi-machine Claude Code brain-sync + env convention established 2026-07-05"
tier: STANDARD
---

# 971 - Portable Claude Brain: multi-machine setup + env convention

> **Goal:** The canonical "how we do things" for running Claude Code across multiple machines (Mac, PC)
> with one shared brain (skills, memory, rules) and machine-local secrets. Established 2026-07-05 when
> Zaal moved work to a second computer.

## Key Decisions

| Decision | Rule |
|----------|------|
| **The brain is a private dotfiles repo** | `github.com/bettercallzaal/zaal-dotfiles` (PRIVATE). It holds `claude/skills/`, `claude/CLAUDE.md`, `claude/settings.json`, `claude/memory/zaoos/`, plus `bin/` and shell files. Every machine clones it and symlinks it into `~/.claude`. |
| **Memory syncs, secrets do NOT** | Project memory (the `~/.claude/projects/<key>/memory/` markdown) lives in the repo and is symlinked back, so a new memory written on any machine is committable. Secrets NEVER enter this repo (or any synced repo). |
| **Machine-local secrets live in `~/.zao/zao.env`** | Real API keys, tokens, service-role keys, wallet keys go in `~/.zao/zao.env` (chmod 600) on each machine, set by hand, never committed. `~/.zao/` is gitignored everywhere. |
| **Keep the dotfiles repo PRIVATE forever** | Memory carries third-party PII (people, business detail). Private is the only safe home. Secret-scan before every push. |
| **Sync is git pull / push** | Start a machine: `git pull` the dotfiles repo. End a session that wrote memory: `git commit && git push`. |

## Why this shape

- Claude Code's usefulness on a machine = its skills + memory + rules + settings. On a fresh machine none
  of that exists. Cloning code repos alone gives you zero brain.
- A private dotfiles repo with symlinks (the standard dotfiles pattern) makes the brain one `git clone`
  away, version-controlled, and bidirectional (edits on any machine flow back).
- Secrets and the brain have opposite sync needs: the brain WANTS to travel, secrets must NEVER travel.
  So they live in separate places: brain in the repo, secrets in machine-local `~/.zao/zao.env`.

## What is in the dotfiles repo (verified 2026-07-05)

```
zaal-dotfiles/
  bootstrap.sh          # symlinks everything into ~/.claude and ~ (macOS)
  README.md             # setup + the Windows "Memory sync" junction steps
  .gitignore            # blocks *.env, *.key, *.pem, .credentials*, **/.zao/
  claude/
    CLAUDE.md           # global rules (no emoji, no em dash, brand glossary)
    settings.json       # Claude Code settings (has some machine-specific paths - see caveat)
    skills/             # all custom skills (clipboard, zao-research, meeting, pi, ...)
    memory/zaoos/       # 284 ZAOOS project-memory files + MEMORY.md index
  bin/                  # helper scripts (zao-fetch-*, zao-scrape-*, ...)
  shell/                # .zshrc / .zprofile / .zshenv (macOS)
```

## The env / secret convention (the "denv" part)

| Where | What | Committed? |
|-------|------|------------|
| `~/.zao/zao.env` (chmod 600) | real secrets: API keys, tokens, `SUPABASE_SERVICE_ROLE_KEY`, `NEYNAR_API_KEY`, `APP_SIGNER_PRIVATE_KEY`, wallet keys, Telegram bot tokens | NEVER |
| Repo `.env.example` | the template: every var name with a placeholder value, so a new machine knows what to set | YES |
| Machine `.env` (per project, e.g. ZAOOS) | the real values for that project, copied from `.env.example` and filled from `~/.zao/zao.env` | NEVER (gitignored) |
| `zaal-dotfiles` repo | the brain: skills, memory, rules, settings | YES (private repo, secret-scanned) |

Rule of thumb: if a string would let someone act as you or as a ZAO service, it goes in `~/.zao/zao.env`
and nowhere else. Everything else (how-we-work, what-we-know) is brain and belongs in the private repo.
This mirrors `.claude/rules/secret-hygiene.md` (stub keys on disk, real keys at execution time only).

## New-machine setup

macOS:
```bash
cd ~/Documents && git clone https://github.com/bettercallzaal/zaal-dotfiles.git
cd zaal-dotfiles && ./bootstrap.sh        # symlinks skills, CLAUDE.md, settings, memory, bin, shell
# then create ~/.zao/zao.env by hand with the machine's secrets (chmod 600)
```

Windows (PowerShell, Junctions need no admin):
```powershell
cd $HOME\Documents
git clone https://github.com/bettercallzaal/zaal-dotfiles.git
$repo = "$HOME\Documents\zaal-dotfiles"
New-Item -ItemType Junction -Path "$HOME\.claude\skills" -Target "$repo\claude\skills"
Copy-Item "$repo\claude\CLAUDE.md" "$HOME\.claude\CLAUDE.md"
# memory junction: see the "Memory sync" section of the dotfiles README for the project-key step
# create %USERPROFILE%\.zao\zao.env by hand with the machine's secrets
```

## Caveats (learned in setup)

- **settings.json is partly machine-specific.** It carries paths (statusline command, plugin locations)
  that are macOS-absolute. Do NOT blindly copy it to a PC; start the PC fresh or fix the paths.
- **The project-memory dir key differs per OS** (it is the project path with slashes turned to dashes).
  macOS `bootstrap.sh` handles the ZAOOS key automatically; Windows needs the manual junction in the
  dotfiles README. For non-ZAOOS work the memory files are still readable in the cloned repo.
- **Embedded skill repos do not sync.** Novelty skills that are their own git repos (claude-creativity,
  claude-is-tripping, drunk-claude) are gitignored in dotfiles; reinstall them per machine if wanted.
- **Secret-scan before every push** to the dotfiles repo: 64-char hex, `sk-ant-`, `ghp_`, `BEGIN ...
  PRIVATE KEY`, `sk-` 32+, and any `*.env`/`*.key`/`*.pem` staged. Abort on any hit.

## Also See

- `.claude/rules/secret-hygiene.md` - the five secret guards (stub keys, pre-commit scan, HEAD scan)
- `.claude/rules/pii-hygiene.md` - why third-party PII stays default-private (dotfiles repo = its home)
- [Doc 441/442](../441-everything-claude-code-integration/) - the rules-as-files pattern this extends
- [Doc 836](../../infrastructure/836-zaoos-repo-estate-census/) - the repo estate this brain sits beside

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run the Windows setup on the PC + create its `~/.zao/zao.env` | @Zaal | Setup | Before working on the PC |
| After any memory-writing session, `git commit && git push` the dotfiles repo | @Zaal | Habit | Ongoing |
| Consider a tiny `~/.claude/skills` or shell alias `brain-sync` = pull+push wrapper | @Zaal | Nice-to-have | Later |

## Sources

- **[FULL]** Live inspection of `~/Documents/zaal-dotfiles` (git remote, `.gitignore`, `bootstrap.sh`,
  tracked tree) and `~/.claude` structure, 2026-07-05.
- **[FULL]** The secret + PII scan run over the 284 memory files before syncing (no keys found; PII
  present, hence private-repo-only).
- **[FULL]** `.claude/rules/secret-hygiene.md` and `.claude/rules/pii-hygiene.md` (the sibling conventions).
