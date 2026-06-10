<!-- FILE: docs/chatgpt_project_instructions.md -->
# ChatGPT Project Instructions For Corn Mafia

Use this text as the durable ChatGPT project behavior baseline.

## Source of truth

The current repository and current SQL are the source of truth.

When a repository snapshot is provided, inspect these docs first:

```text
docs/project_definition.md
docs/codebase_rules.md
docs/riseopedia.md
docs/auth_access_model.md
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

Riseopedia/Mafiosopedia game-data work is DB-first and uses the current transform model, game-data schema, sync pipeline, and read-model standard. `docs/riseopedia.md` is the durable unified Riseopedia-family overview when a task touches `/info` wiki routes, admin Riseopedia surfaces, display profiles, release rules, media, or read models.

## Architecture rules

- App reads come from `web_view` or approved DB read functions.
- App writes go through `web_api`.
- App code must not directly CRUD `web_priv`.
- App code must not directly CRUD `game_data` import or transform tables.
- Runtime app role is `cm_client`.
- Owner/migration role is `cm`.
- Admin, member, and public workflows remain separate when behavior differs.
- Discord login must fail closed if login-time guild/member/role sync cannot complete.
- Actor-sensitive public menus/content should use a fresh server-side actor helper before granting gated access.
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
- Brands belong under `game_entity_brand*`; brand assignment is entity-only.
- Rarities belong under entity variant values: `game_entity_variant_groups_c`, `game_entity_variant_value_codes_c`, and `game_entity_variant_values_r`.
- Release states, entity types, and cross-entity relationships belong under `game_entity_*`.
- Relationship results use `game_entity_relationships_r`.
- Recipe generic resources use `game_recipe_generic_group_types_c`, `game_recipe_generic_groups_c`, and `game_recipe_generic_connections_r`, not asset grouping.
- Source payloads, entity variant source mappings, and aliases are evidence/resolution data, not normal public asset properties or canonical links.
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
docs/riseopedia.md
docs/auth_access_model.md
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


## Current game-data cleanup state

Do not recreate retired game tables/functions unless explicitly requested for rollback:

```text
web_priv.game_asset_aliases
web_priv.game_asset_source_mappings_r
web_priv.game_asset_brands_c
web_priv.game_asset_brand_links_r
web_priv.game_asset_rarities_c
web_priv.game_variant_groups_c
web_priv.game_variant_values_c
web_priv.game_recipe_generic_requirement_* tables
web_priv.game_recipe_catalyst_requirements_* tables
web_priv.game_sync_patch_asset_brand_links(text)
web_priv.game_sync_recipe_requirement_group_connections(text)
```

Current replacements:

```text
web_priv.game_entity_variant_aliases
web_priv.game_entity_variant_source_mappings_r
web_priv.game_entity_brands_c
web_priv.game_entity_brand_links_r
web_priv.game_entity_variant_groups_c
web_priv.game_entity_variant_value_codes_c
web_priv.game_recipe_generic_* tables
web_priv.game_recipe_catalysts_r
web_priv.game_sync_recipe_generic_connections(text)
```
