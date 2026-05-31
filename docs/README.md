<!-- FILE: docs/README.md -->
# Corn Mafia

Corn Mafia is a DB-first Next.js / React / PostgreSQL platform with Discord-backed identity, role-aware access, admin tooling, member authoring, public content surfaces, and Riseopedia/game-data workflows.

## Documentation

Durable project documentation lives in the `docs/` directory, not as scattered root-level notes.

Start here:

- `docs/project_definition.md` — architecture, schema boundaries, project constraints, and source-of-truth rules.
- `docs/codebase_rules.md` — code, SQL, route, generation, and implementation rules.
- `docs/style_system.md` — CSS, tokens, component styling, and inline-style exceptions.
- `docs/game_data_handling.md` — game import, transformation, canonical truth, QA, and patch handling rules.
- `docs/game_patch_runbook.md` — operator checklist for importing future game patches.
- `docs/game_data_quality.md` — QA and analytics view standards.
- `docs/roadmap.md` — current sequencing and next work.

When a task touches DB contracts or game data, read `docs/project_definition.md`, `docs/codebase_rules.md`, and `docs/game_data_handling.md` first.
