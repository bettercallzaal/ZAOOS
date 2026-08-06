# Config Schema for `scaffold_vault.py`

The scaffolder takes a JSON config. This file documents every key.

## Required keys

| Key | Type | Description |
|---|---|---|
| `vault_path` | string | Absolute path to the vault root. Created if missing. `~` is expanded. |
| `project_name` | string | Folder name under `10_Projects/`. Used in HOME, AGENTS, MOC, Charter. |

## Optional keys (with defaults)

| Key | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `"new_vault"` | Informational only; the script auto-detects existing-vault mode by counting populated subfolders in `10_Projects/`. Use `"new_vault"` or `"existing_vault"` to document intent. |
| `charter_seed` | string | `""` | One-line description of the project. If provided, the scaffolder drops it into the Project Charter's blockquote and One-Line Pitch section. Use this for one-liner mode and for brief-driven mode (extract the first sentence). Leave empty for true skeleton mode or when you'll populate the Charter manually after atomization. |
| `include_top_folders` | string[] | All eight | Top-level folders to create. See defaults below. |
| `project_subfolders` | string[] | All fourteen | Subfolders inside `10_Projects/<Project>/`. |
| `bases` | string[] | All four | Base files to write in `_Bases/`. Must be a subset of supported names. |
| `templates` | string[] | All eight | Template files to write in `_Templates/`. Must be a subset of supported names. |
| `create_home` | bool | `true` | Write `00_Index/HOME.md`. |
| `create_agents_md` | bool | `true` | Write `00_Index/AGENTS.md`. |
| `create_moc` | bool | `true` | Write `00_Index/MOCs/<Project> MOC.md`. |
| `create_project_charter` | bool | `true` | Write `10_Projects/<Project>/Project Charter.md`. |
| `create_first_milestone` | bool | `true` | Write `10_Projects/<Project>/Week 1/Milestone 1.md`. |

## Defaults

```json
{
  "include_top_folders": [
    "00_Index", "10_Projects", "30_Resources", "40_Archive",
    "_Attachments", "_Bases", "_Templates", "docs"
  ],
  "project_subfolders": [
    "Architecture", "Brief", "Contracts", "Data Sources",
    "Open Questions", "People", "Phases", "Plans", "Reference",
    "Risks", "Specs", "Sprints", "Week 1", "Work Batches"
  ],
  "bases": ["Open Questions", "Project Tracker", "Risks", "Signals"],
  "templates": [
    "Project", "Open Question", "Risk", "Spec Section",
    "Person", "Sprint", "Signal", "Note"
  ]
}
```

## Supported Base names

Exactly: `Open Questions`, `Project Tracker`, `Risks`, `Signals`. Anything else triggers a warning and is skipped.

## Supported template names

Exactly: `Project`, `Open Question`, `Risk`, `Spec Section`, `Person`, `Sprint`, `Signal`, `Note`. Anything else triggers a warning and is skipped.

## Idempotency

The scaffolder skips files that already exist. Pass `--force` on the CLI to overwrite. Folders are always ensured (no error if they exist).

## Examples

### Full default scaffold (new vault)

```json
{
  "vault_path": "/Users/example/Documents/Obsidian/Forge",
  "project_name": "Forge"
}
```

### Adding a project to an existing vault, skip Bases

```json
{
  "vault_path": "/Users/example/Documents/Obsidian/MyVault",
  "project_name": "NewProject",
  "mode": "existing_vault",
  "bases": []
}
```

### Minimal scaffold (no Bases, no Templates, just folders + Charter)

```json
{
  "vault_path": "/tmp/sketch_vault",
  "project_name": "Sketch",
  "include_top_folders": ["00_Index", "10_Projects"],
  "bases": [],
  "templates": [],
  "create_agents_md": false,
  "create_moc": false,
  "create_first_milestone": false
}
```
