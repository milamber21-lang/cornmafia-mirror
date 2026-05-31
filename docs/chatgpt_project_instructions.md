<!-- FILE: docs/chatgpt_project_instructions.md -->
# ChatGPT Project Instructions For Corn Mafia

Use this text as the durable ChatGPT project behavior baseline.

## Source of truth

The current repository and current SQL are the source of truth.

When a repository snapshot is provided, inspect these docs first:

```text
docs/project_definition.md
docs/codebase_rules.md
docs/game_data_handling.md
docs/game_patch_runbook.md
docs/game_data_quality.md
docs/style_system.md
docs/roadmap.md
docs/README.md
```

The documentation is expected to live under `docs/`. Do not report documentation as missing only because it is not in the repository root.

If those docs conflict with older prompt memory, old uploaded files, or old external snapshot links, trust the current repository docs and current code.

Do not use old external snapshot URLs as source of truth.

If a required file, route, component, SQL object, script, or config is missing from the provided context, ask for it instead of assuming its contents.

## Current project state

Corn Mafia is in V1 delivery and feature-expansion mode.

It is a DB-first Next.js 16 / React 19 / PostgreSQL app with Docker runtime, Discord identity, role-aware access, admin surfaces, public content/navigation surfaces, member profile/media/series/content authoring, DB bootstrap, and operator/security scripts.

Member authoring is V1 active.

YouTube channel allowlist/admin management is an active web-domain admin family.

Riseopedia/game-data work is DB-first and uses the current game-data schema standard.

## Architecture rules

- App reads come from `web_view` or approved DB read functions.
- App writes go through `web_api`.
- App code must not directly CRUD `web_priv`.
- App code must not directly CRUD `game_data` import or transform tables.
- Runtime app role is `cm_client`.
- Owner/migration role is `cm`.
- Admin, member, and public workflows remain separate when behavior differs.
- Do not move business-rule ownership into route handlers.
- Do not restart the architecture from scratch.

Approved schema responsibilities:

```text
game_data
	raw game imports
	patch/source metadata
	game_transform_* rules

web_priv
	canonical current truth
	private business/rebuild/revalidation functions

web_api
	guarded app-callable actions, writes, and sensitive admin wrappers

web_view
	public/member/admin read contracts

web_analytics
	QA/audit/admin analytics views
```

Game-domain decisions:

- `game_*` is an approved first-class domain prefix.
- Crafting benches are assets.
- Brands belong under `game_asset_brand*`.
- Rarities belong under `game_asset_rarity*` and source-mapping/variant identity.
- Release states, entity types, and cross-entity relationships belong under `game_entity_*`.
- Relationship results use `game_entity_relationships_r`.
- Recipe generic resources use `game_recipe_requirement_groups*`, not asset grouping.
- Source payloads are evidence, not normal public asset properties.
- Media paths belong under `game_media*` / `game_asset_media*`, not normal asset properties.

## Code generation rules

When generating code, output full files as separate code blocks or downloadable files.

Every generated code file must include a file path header inside the file itself.

For TypeScript and TSX:

- use strict TypeScript
- never use `any`
- never use `any[]`
- never use `Record<string, any>`
- prefer `unknown` and narrow with type guards
- preserve existing working logic unless the requested change requires a local change
- do not simplify existing code unless necessary for the task
- do not invent unknown file contents
- do not output patches or diffs unless explicitly requested

For SQL:

- inspect current SQL definitions when available
- generate full object definitions when requested
- use project SQL style from `docs/codebase_rules.md`
- schema-qualify references
- use fixed `search_path` in `SECURITY DEFINER` functions
- keep app reads/writes inside the approved DB layer model
- place transform rules in `game_data.game_transform_*`
- place canonical current truth in `web_priv.game_*`
- place QA/audit views in `web_analytics`

## Styling rules

Use `docs/style_system.md`.

- TS/TSX owns structure, state, data, and composition.
- CSS owns visual styling.
- Reusable styled UI belongs in `components/ui`.
- Inline style is forbidden except for documented computed-value exceptions.
- Current CSS color architecture is approved:
  - `base-colors.css` owns raw brand/base palette values
  - `themes.css` owns theme role mapping
  - `tokens.css` owns non-color design tokens

## Audit behavior

When the user asks for audit or analysis only:

- generate no code unless explicitly requested after findings are reviewed
- do not rewrite files
- do not redesign architecture
- do not suggest generic abstractions
- be mechanical and project-specific
- check actual real files and SQL contracts where relevant

## Artifact behavior

The user usually prefers downloadable files for generated project files.

When generating an archive, build it so extraction happens directly into the repository root. Do not include an extra wrapper folder.

Correct archive shape:

```text
docs/README.md
docs/project_definition.md
docs/codebase_rules.md
docs/game_data_handling.md
docs/game_patch_runbook.md
docs/game_data_quality.md
docs/style_system.md
docs/roadmap.md
apps/...
infra/...
scripts/...
```

Incorrect archive shape:

```text
cornmafia-update/docs/README.md
cornmafia-update/docs/...
```

## ChatGPT project file setup

For best future behavior, keep the real docs committed in the repository and also upload the current consolidated docs as ChatGPT project files when the project UI supports persistent project files.

The repo docs remain authoritative when a snapshot is provided. Uploaded project files are only a convenience for conversations where no current snapshot is attached.
