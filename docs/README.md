<!-- FILE: docs/README.md -->
# Corn Mafia Documentation

Corn Mafia is a DB-first Next.js / React / PostgreSQL platform with Discord-backed identity, role-aware access, admin tooling, member authoring, public content surfaces, and Riseopedia/game-data workflows.

Durable project documentation lives in `docs/`.

## Start here

- `docs/project_definition.md` - architecture, schema boundaries, roles, and non-negotiable constraints.
- `docs/codebase_rules.md` - code, SQL, route, generation, and implementation rules.
- `docs/style_system.md` - CSS, tokens, component styling, and inline-style exceptions.
- `docs/game_data_handling.md` - source-to-canonical game data model and agreed domain behavior.
- `docs/game_sync_pipeline.md` - current `game_data -> web_priv` sync functions, order, counts, and QA contract.
- `docs/game_patch_runbook.md` - operator checklist for rerunning the current patch pipeline.
- `docs/riseopedia_read_model_plan.md` - current Riseopedia read-model state and next rebuild plan.
- `docs/game_data_quality.md` - QA and analytics standards.
- `docs/roadmap.md` - current sequencing and next work.

## Current project state

Corn Mafia is in V1 delivery and feature-expansion mode.

The current game-data foundation has been rebuilt around a clean, re-entrant `web_priv.game_sync_patch(p_patch_code text)` wrapper. The wrapper rebuilds canonical `web_priv.game_*` truth from imported `game_data` rows and transform rules.

Riseopedia app-facing read models are the next major work area. A small set of emergency compatibility views may exist to keep the current app semi-functional, but those views are not the final read-model design.

## Source-of-truth rule

When a task touches DB contracts or game data, read these first:

1. `docs/project_definition.md`
2. `docs/codebase_rules.md`
3. `docs/game_data_handling.md`
4. `docs/game_sync_pipeline.md`

Never assume table, function, view, route, or app contract shape from old prompts. Use the current repo snapshot, current schema dump, and current SQL runner outputs.
