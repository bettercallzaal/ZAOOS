# Retracted claims - the canonical ledger

`retracted.tsv` is the single source of truth for claims that must not appear in
any ZAO surface. It is read by `zao-claims-check`, which runs in `.husky/pre-commit`
here, in `.githooks/pre-commit` in `zao-nyc`, and in CI (`.github/workflows/claims-check.yml`).

## Why it lives in ZAOOS and not in the vault

It started in `~/zao-vault/claims/` on 2026-09-08 and moved here the same day, for
two reasons.

**CI cannot read the vault.** A pre-commit hook only protects commits made locally,
by someone who ran `git config core.hooksPath`. GitHub web edits, merge commits and
fresh clones all bypass it. That is the majority of the ways a claim can get in.

**And `zao-nyc/CLAUDE.md` already decided this:** *"ZAOOS is upstream. This repo is
downstream... Never fix a fact only in this repo: two AI-readable surfaces
disagreeing is the worst possible outcome."* Vendoring a copy of the ledger into
each repo would build exactly that. One canonical file, every repo reads it.

## How the tool finds it

In order, first hit wins:

1. `--ledger <path>`
2. `$ZAO_CLAIMS_LEDGER`
3. `<git root>/research/identity/claims/retracted.tsv` - this file, in CI
4. `~/Documents/ZAO OS V1/research/identity/claims/retracted.tsv` - canonical, from other repos
5. `~/zao-vault/claims/retracted.tsv` - legacy, kept so old checkouts keep working

## Adding a claim

Six tab-separated fields: `id`, `pattern`, `allow`, `scope`, `retracted_on`, `why`.

`scope=all` means the claim is **false** and must not survive anywhere.
`scope=new` means it is **true history** that must not be written fresh - retired
partners, where the instruction is "do not reference it again", not "scrub the
archive". Getting this wrong is not theoretical: a whole-tree ban on the retired
partners produced 2146 hits across the research library and made the check
unusable for about ten minutes.

Write the `why` for someone who does not remember the incident. It is printed
verbatim when the check fails, and it is the only thing standing between a
correct failure and someone deleting the row to get their commit through.

## Quoting a retracted claim on purpose

Exemptions are **line**-scoped, never file-scoped, so retracting a claim in one
paragraph never blesses it in the next. A line passes if it is struck (`~~...~~`),
labelled `RETRACTED`, phrased as a prohibition, or carries
`[CLAIM-OK: <id> <why>]`. The id is required, so the escape hatch cannot become a
blanket mute.
