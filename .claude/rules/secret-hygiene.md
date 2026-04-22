---
description: Secret hygiene guards for agent ship pipelines, adapted from clawdbotatg/fifth-builder (doc 473)
globs: "scripts/**,infra/**,.github/workflows/**,*.sh,*.mjs"
---

# Secret Hygiene

Copy-paste from `github.com/clawdbotatg/fifth-builder` after a documented incident where an agent leaked a deployer private key into `AUDIT_REPORT.md` on a public repo. Adopt these five guards on every autonomous ship pipeline, PR creation, or agent-driven commit.

## 1. Stub keys on disk, real keys only at execution time

In any build dir an agent touches, `.env` gets a STUB deployer key (public anvil account 0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`). Real key is injected at the CLI only, at the moment it is needed:

```
forge script --private-key "$DEPLOYER_PRIVATE_KEY" ...
```

Never write the real key to any file, even temporarily.

## 2. Pre-commit staged-diff scan

Before any `git commit` in an agent pipeline:

- `.env` MUST be gitignored. Assert via `grep -qxF '.env' .gitignore`.
- No `PRIVATE_KEY=` substring in the staged diff.
- No 64-char hex string in the staged diff. Regex: `[0-9a-fA-F]{64}`.
- No `.env` file path in `git diff --cached --name-only`.

If any check fails: hard-abort the commit. Do not fix silently.

## 3. Post-edit scan of HEAD

After every fix cycle (auditor -> fixer loop), before declaring the cycle clean, scan `HEAD`:

- 64-char hex: `git grep -E '[0-9a-fA-F]{64}' HEAD`
- PEM blocks: `git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' HEAD`
- GitHub PAT: `git grep -E 'ghp_[A-Za-z0-9]{36}' HEAD`
- Anthropic key: `git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}' HEAD`
- OpenAI key: `git grep -E 'sk-[A-Za-z0-9]{32,}' HEAD`

On any match: hard-abort the job. Never "clean up" by force-pushing; the secret is already in the remote history.

## 4. Pre-complete repository scan

Before marking an agent job complete (post-audit, pre-deploy, pre-PR):

- Recursively grep the entire repo (not just staged files) for the patterns in step 3.
- Also grep for the WORKER's own `ETH_PRIVATE_KEY` / `ANTHROPIC_API_KEY` literal value. Agent should NEVER reproduce its own secrets.
- On match: abort, quarantine the repo, page the operator.

## 5. Prompt-level enforcement

In auditor + fixer + builder agent prompts, include verbatim:

> NEVER reproduce secret values anywhere in output. If you need to reference a secret, use `[REDACTED]` as the placeholder. Do not write real keys, tokens, hashes, or connection strings into any file, comment, PR description, or audit report.

## Applicability in ZAO OS

| Path | Apply |
|------|-------|
| `scripts/**/*.sh` | All five guards |
| `infra/portal/bin/bots/**` | Guards 1-4 before any bot commit |
| `src/lib/agents/**` | Guards 3-5 before agent writes files |
| `/ship` skill pipeline | All five guards as pre-flight checks |
| `/zao-research` output | Guards 3 + 4 before the final commit |
| GitHub Actions workflows | Guards 2 + 3 on every push to main |

## Enforcement

- Add a pre-commit hook at `.husky/pre-commit` (or equivalent) that runs the step-2 checks.
- `/ship` skill runs step-4 before push.
- Agent prompts include the step-5 language verbatim.

## Source

- Doc 473 - `research/agents/473-clawdbotatg-apr21-updates-zoe-openclaw/`
- `github.com/clawdbotatg/fifth-builder` - secret hygiene section of the README
