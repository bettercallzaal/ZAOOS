# Obsidian Bases YAML

Bases are Obsidian's database-view feature. A `.base` file is a YAML doc that defines filters and views over notes that share frontmatter properties.

## Version compat

Obsidian Bases shipped (general availability) in mid-2025 and the YAML format has shifted in minor ways since. This skill targets the **v1 syntax** as it stabilized:

```yaml
filters:
  and:
    - type == "risk"
views:
  - type: table
    name: All Risks
    order:
      - file.name
      - severity
      - status
```

If the user's Obsidian version rejects this syntax, the most common adjustments are:

- Older versions used `properties:` blocks at the top level — pre-v1 spec, mostly obsolete
- Some older versions used `displayName:` differently — drop it if rejected
- Filter expressions in older versions used `note.<prop>` instead of bare `<prop>` — try prefixing if filters fail

## Filter syntax

Filters are boolean expressions over note frontmatter. Combine with `and:` / `or:`:

```yaml
filters:
  and:
    - type == "risk"
    - status != "mitigated"
```

```yaml
filters:
  or:
    - severity == "critical"
    - severity == "high"
```

Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`. String values must be quoted.

For dates (relative):

```yaml
filters:
  and:
    - observed_at >= date("today") - "30d"
```

## View types

`table`, `cards`, and `list` are the main view types.

### Table

```yaml
views:
  - type: table
    name: All Risks
    order:
      - file.name
      - severity
      - likelihood
      - status
      - owner
    sort:
      - property: severity
        direction: ASC
```

`order` is the column order. `sort` is multi-key sort (apply in order).

### Cards

```yaml
views:
  - type: cards
    name: Project Cards
    image: file.icon
    order:
      - file.name
      - status
      - phase
      - owner
```

`image` references a frontmatter field (or `file.icon` for the file's emoji-icon if one is set).

## Per-view filter overrides

Each view can add its own `filters:` block that AND-combines with the top-level filter:

```yaml
filters:
  and:
    - type == "risk"
views:
  - type: table
    name: Open / Unmitigated
    filters:
      and:
        - status != "mitigated"
        - status != "resolved"
    order: [...]
```

## The four default Bases the scaffolder writes

### `_Bases/Open Questions.base`
Filters: `type == "open-question"`. Views: All / High Priority / Resolved.

### `_Bases/Project Tracker.base`
Filters: `type == "project"`. Views: All / Active.

### `_Bases/Risks.base`
Filters: `type == "risk"`. Views: All / Critical & High / Open & Unmitigated.

### `_Bases/Signals.base`
Filters: `type == "signal"`. Views: All / Bullish / Bearish.

The full content of each is in `scripts/scaffold_vault.py` (the `BASE_FILES` constant), so changes there propagate to every new vault scaffolded.

## When a base view shows nothing

Common causes, in order of likelihood:

1. **No notes with matching `type:` exist yet.** Open `_Bases/Risks.base` in a fresh vault and it's empty — that's correct, there are no risks.
2. **Frontmatter typo.** `type: Risk` (capital R) doesn't match `type == "risk"`. The skill writes lowercase canonical values; keep it consistent.
3. **YAML syntax mismatch with the user's Obsidian version.** Check the version compat notes above.
4. **Frontmatter not parsed.** Open the note and confirm the YAML opens with `---` on its own line and closes with `---` on its own line. Stray characters before `---` break parsing.

## Adding new Bases

To add a new Base (say, "Signals" for Forge but extended with a "by source" view), edit `_Bases/Signals.base` directly — Bases live alongside notes and are normal vault files. The scaffolder writes initial Bases but doesn't manage them after creation.

If you find yourself wanting Bases for new types, add the `type:` value to `frontmatter_schema.md` first so the convention is documented, then write the corresponding `.base` file.
