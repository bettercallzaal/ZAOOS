# Secret Hygiene

Five guards on every autonomous ship pipeline, PR creation, or agent-driven commit. Adopted from `github.com/clawdbotatg/fifth-builder` (doc 473) after an agent leaked a deployer key into a public audit report. History: `research/dev-workflows/2649-rules-history/archive/secret-hygiene.md`.

1. **Stub keys on disk, real keys only at execution time.** `.env` in any agent build dir gets the public anvil account 0 stub key (`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`). Inject the real key at the CLI only (`forge script --private-key "$DEPLOYER_PRIVATE_KEY" ...`). Never write a real key to any file, even temporarily.
2. **Pre-commit staged-diff scan:** `.env` is gitignored (`grep -qxF '.env' .gitignore`); no `PRIVATE_KEY=` in the staged diff; no 64-char hex (`[0-9a-fA-F]{64}`); no `.env` path in `git diff --cached --name-only`. Any failure = hard-abort; do not fix silently.
3. **Post-edit scan of HEAD** after every fix cycle: `git grep -E '[0-9a-fA-F]{64}' HEAD`; `git grep -E 'BEGIN (RSA |EC |)PRIVATE KEY' HEAD`; `git grep -E 'ghp_[A-Za-z0-9]{36}' HEAD`; `git grep -E 'sk-ant-[A-Za-z0-9_-]{20,}' HEAD`; `git grep -E 'sk-[A-Za-z0-9]{32,}' HEAD`. Any match = hard-abort; never "clean up" by force-pushing.
4. **Pre-complete repository scan** before marking a job complete: grep the whole repo for the step-3 patterns plus the worker's own `ETH_PRIVATE_KEY` / `ANTHROPIC_API_KEY` literal values - an agent never reproduces its own secrets. Match = abort, quarantine, page the operator.
5. **Prompt-level enforcement** - auditor, fixer and builder prompts include verbatim:
   > NEVER reproduce secret values anywhere in output. If you need to reference a secret, use `[REDACTED]` as the placeholder. Do not write real keys, tokens, hashes, or connection strings into any file, comment, PR description, or audit report.

| Path | Apply |
|------|-------|
| `scripts/**/*.sh` | All five |
| `infra/portal/bin/bots/**` | 1-4 before any bot commit |
| `src/lib/agents/**` | 3-5 before agent writes files |
| `/ship` skill pipeline | All five as pre-flight; step 4 before push |
| `/zao-research` output | 3 + 4 before the final commit |
| GitHub Actions workflows | 2 + 3 on every push to main |

Enforcement: a pre-commit hook (`.husky/pre-commit` or equivalent) runs the step-2 checks.
