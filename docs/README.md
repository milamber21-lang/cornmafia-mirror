<!-- FILE: docs/README.md -->
# Corn Mafia Documentation

Corn Mafia is a DB-first Next.js 16 / React 19 / PostgreSQL guild platform with Discord-backed identity, role-aware access, admin tooling, member authoring, public content surfaces, and Riseopedia/game-data workflows.

Durable project truth lives in `docs/`. Current repo files, current SQL dump, and current SQL runner output override older prompts or historical notes.

## Start here

- `docs/project_definition.md` - architecture, schema boundaries, runtime roles, and non-negotiable constraints.
- `docs/codebase_rules.md` - code, SQL, route, helper, artifact, and implementation rules.
- `docs/style_system.md` - CSS, tokens, component styling, brand rules, and inline-style exceptions.
- `docs/auth_access_model.md` - Discord login, role sync, fresh actor, menu/content access, and fail-closed behavior.
- `docs/riseopedia.md` - unified Riseopedia/Mafiosopedia purpose, architecture, transform model, source-data handling, sync pipeline, patch runbook, admin, app, read-model, channel, and operations reference.
- `docs/roadmap.md` - active roadmap and sequencing.

## Current project state

Corn Mafia is in V1 delivery and feature-expansion mode.

The canonical game-data cleanup pass is complete at the `web_priv` layer. The current model is entity-first, variant-aware, property-ready, and read-model-ready:

```text
game_data imports/rules -> web_priv canonical truth -> web_view app read contracts -> apps/web
```

The current game-data foundation is rebuilt by:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Current completed cleanup decisions:

```text
asset aliases               -> entity variant aliases
asset source maps           -> entity variant source mappings
asset brands                -> entity brands
asset rarities              -> entity variant rarity values
recipe generic reqs         -> recipe generic groups/connections
recipe catalysts            -> recipe catalysts
game_variant_*              -> game_entity_variant_*
crafting_bench entity type  -> removed; benches remain asset entities
recipe class                -> resolved from recipe outputs
recipe category             -> resolved from required bench family
recipe subcategory          -> resolved from minimum required tier / no_tier_required
vehicle subcategory         -> raw brand value, no class prefix
property expectations table -> retired; mapping rules define expected coverage
property catalog            -> `game_entity_properties_c` metadata, no destructive wipe
property values             -> variant/source-linked materialized values
```

Current canonical state is suitable for Riseopedia/Mafiosopedia web app reconnection. `docs/riseopedia.md` is the single durable Riseopedia-family overview and should be read before changing Riseopedia/Mafiosopedia routes, admin screens, app-facing views, display profiles, transform rules, release rules, source-data handling, sync functions, patch runbooks, or materialized read models.

Generated docs are convenience snapshots only:

```text
docs/_files.md
docs/_snapshot.md
docs/_db.md
```

If these generated docs disagree with durable docs, current repo files, or the current SQL dump, regenerate them before using them as evidence.

## Source-of-truth rule

When a task touches DB contracts, game data, routes, or read models, read these first:

1. `docs/project_definition.md`
2. `docs/codebase_rules.md`
3. `docs/riseopedia.md` when Riseopedia, Mafiosopedia, game source data, transform model, sync pipeline, patch runbook, game read models, `/info` wiki routes, display profiles, release rules, or wiki media are involved
4. `docs/auth_access_model.md` when auth, role cache, menus, content access, or actor helpers are involved
5. the current SQL dump or live schema
6. actual app route/helper usage

Never assume table, function, route, view, or config contents from old prompts. Use the current repo snapshot, current schema dump, current SQL runner outputs, and actual source files.
