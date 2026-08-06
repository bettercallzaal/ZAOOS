#!/usr/bin/env python3
"""
scaffold_vault.py — generate the deterministic boilerplate for a PARA-style
Obsidian project vault.

Reads a JSON config (see references/config_schema.md) and writes:
  - Folder layout
  - _Bases/*.base files
  - _Templates/*.md files (frontmatter scaffolding)
  - 00_Index/HOME.md, 00_Index/AGENTS.md, 00_Index/MOCs/<Project> MOC.md
  - 10_Projects/<Project>/Project Charter.md (shell)
  - 10_Projects/<Project>/Week 1/Milestone 1.md (shell)

Idempotent: existing files are not overwritten unless --force is passed.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from textwrap import dedent

# ─── Constants ──────────────────────────────────────────────────────────────

DEFAULT_TOP_FOLDERS = [
    "00_Index",
    "10_Projects",
    "30_Resources",
    "40_Archive",
    "_Attachments",
    "_Bases",
    "_Templates",
    "docs",
]

DEFAULT_PROJECT_SUBFOLDERS = [
    "Architecture",
    "Brief",
    "Contracts",
    "Data Sources",
    "Open Questions",
    "People",
    "Phases",
    "Plans",
    "Reference",
    "Risks",
    "Specs",
    "Sprints",
    "Week 1",
    "Work Batches",
]

DEFAULT_TOP_FOLDER_SUBPATHS = {
    "00_Index": ["MOCs"],
    "30_Resources": ["Reference", "Sources", "Technologies", "UI References"],
}

DEFAULT_BASES = ["Open Questions", "Project Tracker", "Risks", "Signals"]
DEFAULT_TEMPLATES = [
    "Project",
    "Open Question",
    "Risk",
    "Spec Section",
    "Person",
    "Sprint",
    "Signal",
    "Note",
]


# ─── Base file authors ──────────────────────────────────────────────────────

BASE_FILES: dict[str, str] = {
    "Open Questions": dedent("""\
        filters:
          and:
            - type == "open-question"
        views:
          - type: table
            name: All Open Questions
            order:
              - file.name
              - priority
              - status
              - needs_resolution_by
              - owner
              - project
            sort:
              - property: priority
                direction: ASC
              - property: needs_resolution_by
                direction: ASC

          - type: table
            name: High Priority
            filters:
              and:
                - priority == "high"
                - status == "open"
            order:
              - file.name
              - needs_resolution_by
              - owner
              - project

          - type: table
            name: Resolved
            filters:
              and:
                - status == "resolved"
            order:
              - file.name
              - project
              - owner
        """),

    "Project Tracker": dedent("""\
        filters:
          and:
            - type == "project"
        views:
          - type: table
            name: All Projects
            order:
              - file.name
              - status
              - phase
              - owner
              - target_launch
            sort:
              - property: status
                direction: ASC

          - type: table
            name: Active
            filters:
              and:
                - status == "active"
            order:
              - file.name
              - phase
              - owner
              - target_launch
        """),

    "Risks": dedent("""\
        filters:
          and:
            - type == "risk"
        views:
          - type: table
            name: All Risks
            order:
              - file.name
              - severity
              - likelihood
              - status
              - owner
              - project
            sort:
              - property: severity
                direction: ASC

          - type: table
            name: Critical & High
            filters:
              or:
                - severity == "critical"
                - severity == "high"
            order:
              - file.name
              - severity
              - likelihood
              - status
              - owner
              - project

          - type: table
            name: Open / Unmitigated
            filters:
              and:
                - status != "mitigated"
                - status != "resolved"
            order:
              - file.name
              - severity
              - status
              - owner
        """),

    "Signals": dedent("""\
        filters:
          and:
            - type == "signal"
        views:
          - type: table
            name: All Signals
            order:
              - file.name
              - signal_type
              - direction
              - source
              - observed_at
              - project
            sort:
              - property: observed_at
                direction: DESC

          - type: table
            name: Bullish
            filters:
              and:
                - direction == "bullish"
            order:
              - file.name
              - signal_type
              - source
              - observed_at

          - type: table
            name: Bearish
            filters:
              and:
                - direction == "bearish"
            order:
              - file.name
              - signal_type
              - source
              - observed_at
        """),
}


# ─── Template file authors ──────────────────────────────────────────────────

TEMPLATE_FILES: dict[str, str] = {
    "Project": dedent("""\
        ---
        type: project
        project:
        status: active
        phase:
        version: 0.1.0
        owner:
        entity:
        started:
        target_launch:
        tags: [project]
        ---

        # {{title}} — Project Charter

        > One-line pitch.

        ## One-Line Pitch

        ## Why It Works

        ## Phase I Scope

        ## Phase I Non-Goals

        ## Key Documents

        ## Status
        """),

    "Open Question": dedent("""\
        ---
        type: open-question
        project:
        status: open
        priority: medium
        needs_resolution_by:
        owner:
        tags: [open-question]
        ---

        # {{title}}

        > One-line summary of what needs to be decided.

        ## Why It Matters

        ## Options

        | Option | Pros | Cons |
        |--------|------|------|
        |  |  |  |
        |  |  |  |

        ## Path Forward

        ## Decision Needed By

        ## See Also
        """),

    "Risk": dedent("""\
        ---
        type: risk
        project:
        severity: medium
        likelihood: medium
        status: open
        owner:
        tags: [risk]
        ---

        # Risk — {{title}}

        > One-line statement of the risk.

        ## Impact

        - **Severity**:
        - **Blast radius**:

        ## Mitigation

        ## Detection

        ## See Also
        """),

    "Spec Section": dedent("""\
        ---
        type: spec
        project:
        section:
        spec_section:
        tags: [spec]
        ---

        # {{title}}

        ## Overview

        ## Details

        ## See Also
        """),

    "Person": dedent("""\
        ---
        type: person
        project:
        role:
        org:
        email:
        tags: [people]
        ---

        # {{title}}

        ## Role

        ## Decision Authority

        ## Adjacent Projects

        ## Notes
        """),

    "Sprint": dedent("""\
        ---
        type: sprint
        project:
        sprint: {{sprint}}
        milestone: {{milestone}}
        status: not-started
        tags: [sprint]
        ---

        # {{title}}

        ## Tasks

        - [ ]

        ## Daily Log

        ### Day 1 — _date_
        -

        ## Risks Surfaced

        ## Decisions Made

        ## See Also
        """),

    "Signal": dedent("""\
        ---
        type: signal
        project:
        signal_type:
        direction:
        source:
        observed_at:
        confidence: medium
        tags: [signal]
        ---

        # {{title}}

        ## Observation

        ## Implication

        ## Action

        ## See Also
        """),

    "Note": dedent("""\
        ---
        type: note
        project:
        tags: [note]
        ---

        # {{title}}

        ##

        ## See Also
        """),
}


# ─── Index / charter / sprint authors ───────────────────────────────────────

def home_md(project_name: str, has_bases: bool, bases: list[str]) -> str:
    bases_section = ""
    if has_bases and bases:
        items = "\n".join(f"- [[{b}.base|{b}]]" for b in bases)
        bases_section = f"\n## Bases (database views)\n\n{items}\n"

    body = dedent(f"""\
        ---
        type: index
        tags: [home, index]
        ---

        # HOME

        Vault landing page.

        ## Active Projects

        - [[Project Charter|{project_name}]]

        ## Maps of Content

        - [[{project_name} MOC]] — every {project_name} note, organized by domain
        """)

    conventions = dedent("""\
        ## Vault Conventions

        - **Folders are PARA-ish**:
          - `00_Index/` — this folder, plus MOCs and AGENTS
          - `10_Projects/` — active projects, each in its own subfolder
          - `30_Resources/` — domain-agnostic reference material
          - `40_Archive/` — completed or deprecated content
          - `_Templates/` — note templates (frontmatter scaffolding for Bases)
          - `_Bases/` — Obsidian Bases (database views over notes)
          - `_Attachments/` — images and other binaries
          - `docs/` — vault-meta documentation
        - **Frontmatter `type` is the queryable identity** (`project`, `spec`, `risk`, `open-question`, `signal`, `person`, etc.) — Bases filter on it.
        - **Atomicity**: one concept per note.

        See: [[AGENTS]] for AI/agent context.
        """)

    return body + bases_section + "\n" + conventions


def agents_md(project_name: str, multi_project: bool = False) -> str:
    """Generate AGENTS.md. Use multi_project=True when 2+ projects exist in the vault."""
    if multi_project:
        what = "A PARA-style Obsidian vault hosting multiple projects under `10_Projects/`."
        spec_loc = "Each project's canonical spec lives in `10_Projects/<Project>/Specs/` (if one exists). It is the source of truth for that project."
        new_thing = (
            "- **A risk** → `10_Projects/<Project>/Risks/` using `_Templates/Risk.md`. Frontmatter `type: risk` for the Risks Base view.\n"
            "- **An open question** → `10_Projects/<Project>/Open Questions/` using `_Templates/Open Question.md`. Frontmatter `type: open-question`.\n"
            "- **A market or business signal** → `_Templates/Signal.md`. Frontmatter `type: signal`.\n"
            "- **A spec change** → update the canonical spec AND the relevant atomized note.\n"
            "- **A new technology to evaluate** → `30_Resources/Technologies/`."
        )
        project_field = "`project` — the project this note belongs to (matches the `10_Projects/<Project>/` folder name)."
        see_also = "- [[HOME]]"
    else:
        what = f"A PARA-style Obsidian vault for the {project_name} project."
        spec_loc = f"The canonical spec lives in `10_Projects/{project_name}/Specs/` (if a spec exists). It is the source of truth."
        new_thing = (
            f"- **A risk** → create a note in `10_Projects/{project_name}/Risks/` using `_Templates/Risk.md`. Frontmatter `type: risk` is required for the Risks Base view.\n"
            f"- **An open question** → `10_Projects/{project_name}/Open Questions/` using `_Templates/Open Question.md`. Frontmatter `type: open-question`.\n"
            "- **A market or business signal** → use `_Templates/Signal.md`. Frontmatter `type: signal`.\n"
            "- **A spec change** → update the canonical spec AND the relevant atomized note.\n"
            "- **A new technology to evaluate** → `30_Resources/Technologies/`."
        )
        project_field = f"`project` — usually `{project_name}`."
        see_also = f"- [[HOME]]\n- [[{project_name} MOC]]"

    # Build the file as plain concatenation to avoid dedent-on-multiline-variable issues
    header = (
        "---\n"
        "type: agents\n"
        "tags: [agents, ai, context]\n"
        "---\n\n"
        "# AGENTS\n\n"
        "Context for AI agents (Claude, etc.) working in this vault.\n\n"
        "## What This Vault Is\n\n"
        f"{what}\n\n"
        "## How To Operate Here\n\n"
        "### When asked to update the spec\n"
        f"- {spec_loc}\n"
        "- When changing a section, update the canonical spec AND the corresponding atomized note. Do not silently diverge.\n\n"
        "### When the user mentions something new\n"
        f"{new_thing}\n\n"
        "### Frontmatter conventions\n"
        "Every note should have:\n"
        "- `type` — drives Bases filtering. One of: `project`, `phase`, `plan`, `spec`, `architecture`, `brief`, `contract`, `data-source`, `reference`, `risk`, `open-question`, `signal`, `person`, `sprint`, `technology`, `note`, `index`, `agents`, `moc`.\n"
        f"- {project_field}\n"
        "- `tags` — optional, for cross-cutting search.\n\n"
        "Risks add: `severity`, `likelihood`, `status`, `owner`.\n"
        "Open Questions add: `priority`, `status`, `needs_resolution_by`, `owner`.\n"
        "Signals add: `signal_type`, `direction`, `source`, `observed_at`, `confidence`.\n\n"
        "### Folder roles inside a project\n"
        "- `Plans/` — milestone definitions (the \"what\")\n"
        "- `Sprints/` and `Week N/` — execution logs (the \"doing\")\n"
        "- `Specs/` — canonical spec + atomized spec sections\n"
        "- `Brief/`, `Architecture/`, `Reference/`, `Contracts/`, `Data Sources/`, `People/`, `Open Questions/`, `Risks/`, `Phases/` — one concept per note\n\n"
        "### Don'ts\n"
        "- Don't create new top-level folders without checking with the user.\n"
        "- Don't dump multiple concepts into a single note. Atomize.\n"
        "- Don't paraphrase the canonical spec into a parallel doc that drifts.\n\n"
        "## See Also\n"
        f"{see_also}\n"
    )
    return header


def moc_md(project_name: str) -> str:
    return dedent(f"""\
        ---
        type: moc
        project: {project_name}
        tags: [moc, map-of-content]
        ---

        # {project_name} — Map of Content

        Every {project_name} note, organized for navigation.

        ## Anchor

        - [[Project Charter]]

        ## Brief

        ## Architecture

        ## Specs

        ## Phases & Plans

        ## Reference

        ## Open Questions

        ## Risks

        ## People

        ## Sprints
        """)


def project_charter_md(project_name: str, charter_seed: str = "") -> str:
    """Render the Project Charter. If `charter_seed` is provided, use it as the One-Line Pitch and the opening blockquote.

    The seed is whatever one-sentence description the user gave (in a brief, in the prompt, etc.).
    Empty seed → blank shell for the user to fill in (true skeleton mode).
    """
    if charter_seed:
        blockquote = charter_seed
        one_liner = charter_seed
    else:
        blockquote = "One-line pitch (fill in)."
        one_liner = ""

    return dedent(f"""\
        ---
        type: project
        project: {project_name}
        status: active
        phase:
        version: 0.1.0
        owner:
        started:
        target_launch:
        tags: [project, charter]
        ---

        # {project_name} — Project Charter

        > {blockquote}

        ## One-Line Pitch

        {one_liner}

        ## Why It Works

        ## Phase I Scope

        ## Phase I Non-Goals

        ## Key Documents

        ## Status
        """)


def milestone_md(project_name: str) -> str:
    return dedent(f"""\
        ---
        type: sprint
        project: {project_name}
        sprint: Week 1
        milestone: M1
        status: not-started
        tags: [sprint, week-1]
        ---

        # Week 1 — Milestone 1

        ## Tasks

        - [ ]

        ## Daily Log

        ### Day 1 — _date_
        -

        ## Risks Surfaced

        ## Decisions Made
        """)


# ─── File system helpers ────────────────────────────────────────────────────

def write_file(path: Path, content: str, force: bool, created: list[str], skipped: list[str]) -> None:
    """Write `content` to `path`. Skip if exists unless `force`. Track outcome."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not force:
        skipped.append(str(path))
        return
    path.write_text(content)
    created.append(str(path))


def ensure_dir(path: Path, created: list[str]) -> None:
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
        created.append(f"{path}/")


def count_existing_projects(vault: Path) -> int:
    """Count subdirectories under 10_Projects/ that look like projects (have content)."""
    projects_dir = vault / "10_Projects"
    if not projects_dir.is_dir():
        return 0
    count = 0
    for entry in projects_dir.iterdir():
        if entry.is_dir() and any(entry.iterdir()):
            count += 1
    return count


def update_home_md(vault: Path, project_name: str) -> tuple[bool, str]:
    """Idempotently inject a new project entry into HOME.md's Active Projects + Maps of Content lists.

    Returns (was_modified, message).
    Designed for existing-vault mode where HOME.md already exists with other projects.
    """
    home = vault / "00_Index" / "HOME.md"
    if not home.exists():
        return False, "HOME.md does not exist; nothing to update"

    content = home.read_text()
    project_link = f"- [[Project Charter|{project_name}]]"
    moc_link = f"- [[{project_name} MOC]] — every {project_name} note, organized by domain"

    modified = False

    # Inject under Active Projects (if not already present)
    if project_link not in content and f"[[{project_name}" not in content.split("## Maps of Content")[0]:
        content = _inject_under_header(content, "## Active Projects", project_link)
        modified = True

    # Inject under Maps of Content
    moc_section = content.split("## Maps of Content")[-1].split("## ")[0] if "## Maps of Content" in content else ""
    if f"[[{project_name} MOC]]" not in moc_section:
        content = _inject_under_header(content, "## Maps of Content", moc_link)
        modified = True

    if modified:
        home.write_text(content)
        return True, f"Updated HOME.md with {project_name}"
    return False, f"HOME.md already references {project_name}"


def _inject_under_header(content: str, header: str, new_line: str) -> str:
    """Insert `new_line` after the last existing list item under `header`, or directly after the header if no list items exist."""
    lines = content.split("\n")
    if header not in content:
        return content  # Bail if section missing; don't fabricate it

    out: list[str] = []
    i = 0
    while i < len(lines):
        out.append(lines[i])
        if lines[i].strip() == header.strip():
            # Find end of this section's list (next blank line followed by non-list, or next header)
            j = i + 1
            last_list_idx = i  # If no list items, insert right after header (with blank line above)
            while j < len(lines):
                line = lines[j]
                if line.startswith("## ") or line.startswith("# "):
                    break
                if line.startswith("- ") or line.startswith("* "):
                    last_list_idx = j
                out.append(line)
                j += 1
            # Insert new_line after last_list_idx within `out`
            # out currently has [0..j-1] appended; we want to insert at position (last_list_idx + 1) in out
            insert_at = len(out) - (j - last_list_idx - 1)
            out.insert(insert_at, new_line)
            i = j
            continue
        i += 1

    return "\n".join(out)


CANONICAL_TYPES = {
    "project", "phase", "plan", "spec", "architecture", "brief",
    "contract", "data-source", "reference", "risk", "open-question",
    "signal", "person", "sprint", "technology", "note",
    "index", "agents", "moc",
}


def verify_vault(vault: Path) -> tuple[int, list[str]]:
    """Check every note has a valid `type:` frontmatter value.

    Returns (problem_count, problem_messages). Templates are excluded.
    """
    problems: list[str] = []
    md_files = [p for p in vault.rglob("*.md") if "_Templates" not in p.parts]
    for md in md_files:
        try:
            head = md.read_text(errors="replace")[:2000]
        except OSError:
            problems.append(f"{md}: could not read")
            continue
        # Find type: line in frontmatter
        if not head.startswith("---"):
            problems.append(f"{md}: no frontmatter")
            continue
        type_line = None
        for line in head.split("\n")[1:30]:
            if line.startswith("type:"):
                type_line = line
                break
            if line.strip() == "---":
                break
        if type_line is None:
            problems.append(f"{md}: missing `type:` field in frontmatter")
            continue
        type_value = type_line.split(":", 1)[1].strip().strip('"').strip("'")
        if type_value not in CANONICAL_TYPES:
            problems.append(f"{md}: invalid type `{type_value}` (must be one of {sorted(CANONICAL_TYPES)})")
    return len(problems), problems


# ─── Main ────────────────────────────────────────────────────────────────────

def scaffold(config: dict, force: bool = False) -> tuple[list[str], list[str], list[str]]:
    """Apply the scaffold per `config`. Returns (created, skipped, updated) path lists.

    `updated` tracks files that were modified in-place (e.g., HOME.md splices in existing-vault mode)
    rather than newly created.
    """
    vault = Path(config["vault_path"]).expanduser().resolve()
    project_name = config["project_name"]
    charter_seed = config.get("charter_seed", "")

    if not vault.exists():
        vault.mkdir(parents=True, exist_ok=True)

    top_folders = config.get("include_top_folders", DEFAULT_TOP_FOLDERS)
    project_subfolders = config.get("project_subfolders", DEFAULT_PROJECT_SUBFOLDERS)
    bases = config.get("bases", DEFAULT_BASES)
    templates = config.get("templates", DEFAULT_TEMPLATES)
    create_home = config.get("create_home", True)
    create_agents = config.get("create_agents_md", True)
    create_moc = config.get("create_moc", True)
    create_charter = config.get("create_project_charter", True)
    create_milestone = config.get("create_first_milestone", True)

    created: list[str] = []
    skipped: list[str] = []
    updated: list[str] = []

    # Detect existing-vault mode by counting projects BEFORE we create the new one
    existing_project_count = count_existing_projects(vault)
    is_multi_project_after = existing_project_count >= 1  # We're adding one, so 1+ existing → multi

    # Top folders + their default subpaths
    for folder in top_folders:
        ensure_dir(vault / folder, created)
        for sub in DEFAULT_TOP_FOLDER_SUBPATHS.get(folder, []):
            ensure_dir(vault / folder / sub, created)

    # Project subfolders
    if "10_Projects" in top_folders:
        project_root = vault / "10_Projects" / project_name
        ensure_dir(project_root, created)
        for sub in project_subfolders:
            ensure_dir(project_root / sub, created)

    # Bases
    if "_Bases" in top_folders:
        for base in bases:
            if base not in BASE_FILES:
                print(f"warning: no template for base '{base}', skipping", file=sys.stderr)
                continue
            write_file(vault / "_Bases" / f"{base}.base", BASE_FILES[base], force, created, skipped)

    # Templates
    if "_Templates" in top_folders:
        for tpl in templates:
            if tpl not in TEMPLATE_FILES:
                print(f"warning: no template for '{tpl}', skipping", file=sys.stderr)
                continue
            write_file(vault / "_Templates" / f"{tpl}.md", TEMPLATE_FILES[tpl], force, created, skipped)

    # Index files
    if "00_Index" in top_folders:
        home_path = vault / "00_Index" / "HOME.md"
        if create_home:
            if home_path.exists() and not force:
                # Existing vault: try to splice the new project into HOME
                was_modified, msg = update_home_md(vault, project_name)
                if was_modified:
                    updated.append(str(home_path))
                skipped.append(str(home_path) + f" (existed; {msg})")
            else:
                write_file(
                    home_path,
                    home_md(project_name, "_Bases" in top_folders, bases),
                    force, created, skipped,
                )

        if create_agents:
            agents_path = vault / "00_Index" / "AGENTS.md"
            # If AGENTS.md already exists and we're adding a second project, rewrite it as project-agnostic
            if agents_path.exists() and is_multi_project_after and not force:
                agents_path.write_text(agents_md(project_name, multi_project=True))
                updated.append(str(agents_path) + " (rewritten as project-agnostic)")
            else:
                write_file(
                    agents_path,
                    agents_md(project_name, multi_project=is_multi_project_after),
                    force, created, skipped,
                )

        if create_moc:
            write_file(
                vault / "00_Index" / "MOCs" / f"{project_name} MOC.md",
                moc_md(project_name),
                force, created, skipped,
            )

    # Project root files
    if "10_Projects" in top_folders:
        project_root = vault / "10_Projects" / project_name
        if create_charter:
            write_file(
                project_root / "Project Charter.md",
                project_charter_md(project_name, charter_seed=charter_seed),
                force, created, skipped,
            )
        if create_milestone and "Week 1" in project_subfolders:
            write_file(
                project_root / "Week 1" / "Milestone 1.md",
                milestone_md(project_name),
                force, created, skipped,
            )

    return created, skipped, updated


def cmd_scaffold(args) -> int:
    config_path = Path(args.config).expanduser().resolve()
    if not config_path.exists():
        print(f"error: config not found at {config_path}", file=sys.stderr)
        return 2

    config = json.loads(config_path.read_text())

    required = ["vault_path", "project_name"]
    for key in required:
        if key not in config:
            print(f"error: config missing required key '{key}'", file=sys.stderr)
            return 2

    created, skipped, updated = scaffold(config, force=args.force)

    if args.summary_only:
        print(f"created {len(created)} paths, skipped {len(skipped)} (already existed), updated {len(updated)} in place")
    else:
        print(f"=== Created ({len(created)}) ===")
        for p in created:
            print(f"  + {p}")
        if updated:
            print(f"\n=== Updated in place ({len(updated)}) ===")
            for p in updated:
                print(f"  ~ {p}")
        if skipped:
            print(f"\n=== Skipped (already existed, {len(skipped)}) ===")
            for p in skipped:
                print(f"  · {p}")
        print(f"\nVault root: {Path(config['vault_path']).expanduser().resolve()}")
        print(f"Open: {Path(config['vault_path']).expanduser().resolve()}/00_Index/HOME.md")

    return 0


def cmd_verify(args) -> int:
    vault = Path(args.vault).expanduser().resolve()
    if not vault.exists():
        print(f"error: vault not found at {vault}", file=sys.stderr)
        return 2

    problem_count, problems = verify_vault(vault)
    if problem_count == 0:
        md_count = sum(1 for p in vault.rglob("*.md") if "_Templates" not in p.parts)
        print(f"OK — all {md_count} notes have valid `type:` frontmatter.")
        return 0

    print(f"FAIL — {problem_count} problems:")
    for p in problems:
        print(f"  ✗ {p}")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold or verify a PARA-style Obsidian vault.")
    sub = parser.add_subparsers(dest="cmd")

    # scaffold subcommand (default, backward-compatible)
    sc = sub.add_parser("scaffold", help="Create or extend a vault from a JSON config.")
    sc.add_argument("--config", required=True, help="Path to JSON config file.")
    sc.add_argument("--force", action="store_true", help="Overwrite existing files.")
    sc.add_argument("--summary-only", action="store_true", help="Print a count summary instead of every path.")
    sc.set_defaults(func=cmd_scaffold)

    # verify subcommand
    vr = sub.add_parser("verify", help="Check every note has a valid `type:` frontmatter value.")
    vr.add_argument("vault", help="Vault root path.")
    vr.set_defaults(func=cmd_verify)

    # Backward compat: --config at top level routes to scaffold
    parser.add_argument("--config", help=argparse.SUPPRESS)
    parser.add_argument("--force", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--summary-only", action="store_true", help=argparse.SUPPRESS)

    args = parser.parse_args()

    if args.cmd is None:
        if args.config:
            return cmd_scaffold(args)
        parser.print_help()
        return 2
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
