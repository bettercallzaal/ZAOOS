# Vendored: obsidian-vault-scaffolder

Vendored into ZAOOS from **github.com/99darwin/obsidian-vault-scaffolder** (MIT),
by **Nick Saponaro / nickysap** (nick, @nickysap, FID 269091, building diviswap.com).
Credited per `.claude/rules/credit-attribution.md`; the upstream MIT `LICENSE` is
kept in this directory, unchanged.

## What it is

A Claude skill: turn a software project spec/brief into a navigable **PARA-style
Obsidian vault** - atomized notes (one per risk / open question / architecture
section), Obsidian **Bases** (database views), note templates, an index, and an
`AGENTS.md` briefing for future AI sessions. "47 atomized notes from a 286-line
spec." Serves Zaal's second brain ([[project_obsidian_second_brain]] - memory as a
`[[wikilinks]]` vault) and doc 2205's nickysap-OSS adopt-list.

## Use in ZAO

Trigger by intent - "set up an Obsidian vault for `<project>`", "turn this spec
into a navigable structure", "scaffold a PARA vault" - or invoke the skill
directly. Under the hood it runs:

```
python3 .claude/skills/obsidian-vault/scripts/scaffold_vault.py scaffold --config <cfg.json>
python3 .claude/skills/obsidian-vault/scripts/scaffold_vault.py verify <vault-path>
```

Follow `SKILL.md` for the full interview -> config -> scaffold -> atomize -> verify
flow. Reference docs the skill reads live in `references/`.

## Provenance

- **Upstream:** github.com/99darwin/obsidian-vault-scaffolder (MIT, (c) 2026 Nick Saponaro)
- **Vendored:** 2026-08-06 - functional parts only (`SKILL.md` + `scripts/` +
  `references/` + `LICENSE`). Upstream `docs/`, `benchmarks/`, `examples/`, `dist/`
  omitted (not needed to run the skill).
- **Precedent:** gstack ([[project_gstack_vendored]]) - the ZAO vendored-with-
  attribution pattern this follows.
