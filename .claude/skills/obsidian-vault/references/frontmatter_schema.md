# Frontmatter Schema

The `type:` field is the queryable identity of every note. Bases filter on it. Without it, the database views in `_Bases/` see nothing.

## Required fields on every note

```yaml
---
type: <one of the types below>
project: <project name, usually the same across the vault>
tags: [...]
---
```

## Type-specific schemas

### `project`
Project Charter or top-level project doc.

```yaml
type: project
project: Forge
status: active            # active | paused | shipped | shelved
phase: Phase I MVP
version: 0.1.0
owner: Nick Saponaro
entity: LiberEx Engineering
started: 2026-05
target_launch: 2026-07
tags: [project]
```

### `phase`
A project phase (Phase I, Phase II, etc.).

```yaml
type: phase
project: Forge
phase: Phase I
status: pre-implementation   # pre-implementation | active | shipped | deferred
target_weeks: 8
tags: [phase, mvp]
```

### `plan`
Implementation plan, milestone breakdown.

```yaml
type: plan
project: Forge
phase: Phase I
status: pre-implementation
tags: [plan, milestones]
```

### `spec`
A spec section (atomized) or the canonical spec itself.

```yaml
type: spec
project: Forge
section: shadeform-integration   # short slug for the section
spec_section: 5                  # number from canonical spec (optional)
tags: [spec]
```

For the canonical spec only, additionally:

```yaml
status: draft
version: 0.1.0
phase: Phase I MVP
date: 2026-05
author: <name>
```

### `architecture`
Architecture-level note (topology, design principles, services, stack).

```yaml
type: architecture
project: Forge
tags: [architecture]
```

### `brief`
Brief / executive summary content.

```yaml
type: brief
project: Forge
tags: [brief]
```

### `contract`
API contract, payload schema, request/response example.

```yaml
type: contract
project: Forge
tags: [contract]
```

### `data-source`
Upstream data source / external API provider.

```yaml
type: data-source
project: Forge
provider: Shadeform
auth_method: API key
tags: [data-source]
```

### `reference`
Quick reference, cheat sheet, status mapping.

```yaml
type: reference
project: Forge
tags: [reference]
```

### `risk`
A discrete risk. **Severity and likelihood are required for the Risks Base view.**

```yaml
type: risk
project: Forge
severity: high              # critical | high | medium | low
likelihood: medium          # high | medium | low
status: open                # open | mitigation-planned | mitigated | accepted-for-mvp | resolved | monitoring
owner: <name>
tags: [risk]
```

### `open-question`
A discrete open question. **Priority and status are required for the Open Questions Base view.**

```yaml
type: open-question
project: Forge
status: open                # open | in-progress | resolved
priority: high              # high | medium | low
needs_resolution_by: M2     # milestone or date
owner: <name>
tags: [open-question]
```

### `signal`
A market or business signal. Bullish/bearish/neutral. Optional but useful for projects where you're tracking competitive or external signals.

```yaml
type: signal
project: Forge
signal_type: competitive    # competitive | regulatory | technical | macro
direction: bullish          # bullish | bearish | neutral
source: <where it came from>
observed_at: 2026-05-09
confidence: medium          # high | medium | low
tags: [signal]
```

### `person`
Stakeholder, team member, decision-maker.

```yaml
type: person
project: Forge
role: Lead Engineer
org: LiberEx
email: <if relevant>
tags: [people]
```

### `sprint`
Sprint or weekly milestone tracking.

```yaml
type: sprint
project: Forge
sprint: Week 1
milestone: M1 Foundation
status: not-started         # not-started | in-progress | complete
tags: [sprint]
```

### `technology`
A technology in the stack (in `30_Resources/Technologies/`).

```yaml
type: technology
category: backend           # backend | frontend | data | infrastructure | payments | compliance | upstream-provider
tags: [technology]
```

### `note`
Generic catch-all. Avoid if a more specific type fits.

```yaml
type: note
project: Forge
tags: [note]
```

### `index`, `agents`, `moc`
Reserved for the Index/Agents/MOC files in `00_Index/`. The scaffolder writes these.

```yaml
type: index    # 00_Index/HOME.md
type: agents   # 00_Index/AGENTS.md
type: moc      # 00_Index/MOCs/*.md
```

## Why these specific fields?

The fields aren't arbitrary — each one corresponds to a Base view that needs to query against it:

- `severity` + `likelihood` on risks → `Risks.base` "Critical & High" view
- `priority` + `status` on open questions → `Open Questions.base` "High Priority" view
- `direction` on signals → `Signals.base` "Bullish" / "Bearish" views
- `status` everywhere → general "what's open" filtering

Adding a field beyond these is fine, but only do it if you'll actually query against it. Frontmatter that nothing queries is just clutter.
