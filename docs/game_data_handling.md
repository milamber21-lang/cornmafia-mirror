<!-- FILE: docs/game_data_handling.md -->
# Corn Mafia Game Data Handling

## Purpose

This document defines how Corn Mafia imports, transforms, validates, publishes, and exposes game data for Riseopedia and future game-data features.

It is the durable source of truth for game data handling and should be read with:

- `docs/project_definition.md`
- `docs/codebase_rules.md`
- `docs/game_sync_pipeline.md`
- `docs/game_patch_runbook.md`
- `docs/riseopedia_read_model_plan.md`

If this document conflicts with old prompts, one-off SQL patches, or historical assumptions, this document controls unless the user explicitly overrides it for a specific task.

---

## 1. Core architecture

Game data uses a source-to-canonical model.

```text
source files / raw imports
	-> game_data import rows and source metadata
	-> game_data.game_transform_* rules
	-> web_priv.game_* canonical truth
	-> web_analytics QA/audit diagnostics
	-> web_view app read contracts
	-> guarded web_api actions/revalidation where needed
```

Do not solve source transformation problems in app components or route handlers.

---

## 2. Schema ownership

```text
game_data
	raw source imports
	patch/import batch metadata
	source file metadata
	game_transform_* rule/config tables
	import evidence used by rebuild logic

web_priv
	canonical current game truth
	private rebuild/sync functions
	private business logic
	private helper functions

web_view
	public/member/admin app read contracts
	lookup surfaces
	Riseopedia read surfaces

web_api
	guarded app-callable actions
	guarded admin wrappers
	guarded revalidation triggers where needed

web_analytics
	QA views
	audit views
	validation summaries
	data-quality diagnostics
	admin/operational analytics surfaces
```

`cm` is the owner/migration role. `cm_client` is the runtime app role.

The app must not read raw `game_data` or private `web_priv` truth directly except through approved functions/views. App writes must go through `web_api`.

---

## 3. Game-domain taxonomy

```text
game_asset_*     = assets, asset classification, aliases, brands, source mappings, variants
game_entity_*    = cross-domain entity identity, release decisions, evidence, relationships
game_media_*     = media and media variants
game_recipe_*    = recipes, components, outputs, benches, catalysts, generic requirements
game_transform_* = source transformation, classification, identity, naming, property, release, and relationship rules
```

Current project decisions:

- Crafting benches are assets and are also recipe-capability entities.
- Recipe references to exact material-like aliases such as `MetalIngot` and `WoodPlanks` can resolve to generic requirement groups, not fake exact assets.
- Entity graph edges live in `web_priv.game_entity_relationships_r`.
- Release/publication decisions live in `web_priv.game_entity_release_decisions_f` with evidence in `web_priv.game_entity_release_evidence_f`.
- App-facing Riseopedia reads must be rebuilt from `web_priv.game_*` through `web_view` or approved read functions.

---

## 4. Current sync pipeline

The current canonical rebuild is performed by:

```text
web_priv.game_sync_patch(p_patch_code text)
```

The wrapper is re-entrant. It calls:

```text
1. web_priv.game_reset_patch_generated_state(p_patch_code)
2. web_priv.game_sync_patch_assets(p_patch_code)
3. web_priv.game_sync_patch_asset_properties(p_patch_code)
4. web_priv.game_sync_patch_media(p_patch_code)
5. web_priv.game_sync_patch_recipes(p_patch_code)
6. web_priv.game_sync_patch_entity_relationships(p_patch_code)
7. web_priv.game_sync_patch_release_decisions(p_patch_code)
```

`game_sync_patch_assets` owns/delegates reference-data sync. Do not call reference sync separately inside the wrapper before asset sync.

Detailed function order, counts, and QA expectations are documented in `docs/game_sync_pipeline.md`.

---

## 5. Rebuildable reference data

The following reference/code tables are generated from transform/source rules and are safe to rebuild from rules during development:

```text
web_priv.game_asset_classes_c
web_priv.game_asset_categories_c
web_priv.game_asset_subcategories_c
web_priv.game_asset_brands_c
web_priv.game_recipe_classes_c
web_priv.game_recipe_categories_c
web_priv.game_recipe_subcategories_c
web_priv.game_entity_properties_c
web_priv.game_entity_property_expectation_rules_c
```

Generated tables and generated history/snapshot rows can be reset during development when rebuilding from source.

Do not nuke manually curated rule/control tables unless the task explicitly says to recreate those rules:

```text
game_data.game_transform_* rules
web_priv.game_entity_release_states_c
web_priv.game_entity_types_c
web_priv.game_recipe_generic_requirement_group_types_c
web_priv.game_recipe_generic_requirement_groups_c
web_priv.game_patch_publication_* control tables
manual overrides / admin curation tables
```

---

## 6. Asset identity and variants

Asset sync creates canonical asset rows from source files and source mappings.

Current verified behavior:

```text
game_assets: 1413
crafting_bench assets: 12
game_asset_bench_tier_variants_r: 44
game_asset_aliases: 6360
```

Asset source mapping rules must preserve:

- source row provenance
- source file role
- rarity context
- variant context
- canonical source identity
- asset alias coverage

### Rarity and default variant rule

Do not invent `common` as a display/default variant when an asset only exists at higher rarities.

`default_rarity_code = common` in a transform rule is a fallback for missing source rarity context, not permission to fabricate a common variant in Riseopedia.

Read models must choose default display rarity/variant from actual available source mappings and property values. If common is absent, the display default must use the correct available/primary/lowest source-backed rarity according to source mapping and variant rules.

Audit these when working on Riseopedia read models:

```text
web_priv.game_asset_source_mappings_r.rarity_code
web_priv.game_asset_source_mapping_variants_r
web_priv.game_entity_property_values.rarity_code
web_priv.game_assets canonical row
web_view.riseopedia_* variant/default selection logic
```

---

## 7. Crafting bench logic

Crafting benches have special but first-class behavior.

Agreed model:

- Crafting benches are assets/entities.
- Crafting benches are also recipe-capability entities.
- Physical/source bench rows are folded into canonical bench family assets.
- Source/tier rows are preserved as variant/capability rows, not as separate public asset rows.
- `game_assets` contains only canonical bench assets, not one asset row per tier/source bench.
- `game_asset_bench_tier_variants_r` preserves the 44 bench source/tier variants.
- Recipe bench requirements use canonical bench family plus minimum tier behavior.
- A recipe requiring tier X can be satisfied by tier X and above.

Current verified result:

```text
canonical crafting bench assets: 12
bench source/tier variant rows: 44
hidden/fake bench asset rows: 0
```

Do not reintroduce a post-process visibility hack for benches. True folding belongs inside asset sync and source mapping behavior.

---

## 8. Asset properties

Asset property sync fills `web_priv.game_entity_property_values` from source payloads using `game_data.game_transform_asset_property_rules_c` and synced property definitions.

Current verified result:

```text
asset property values: 17735
distinct asset properties: 38
assets with properties: 1413
```

`ammo_type` is an example of a property that needed both render/display rule coverage and extraction rule coverage. Render rules alone do not create values.

Weapon `ammo_type` is extracted from:

```text
source_file_code = dtweapondetails
source_field_path = AmmoType
asset_property_code = ammo_type
value_transform_code = enum_tail
```

---

## 9. Media

Media sync fills:

```text
web_priv.game_media
web_priv.game_media_variants
web_priv.game_entity_media_r
```

Current verified result:

```text
game_media: 1873
game_media_variants: 7492
game_entity_media_r: 1925
assets with media: 1405
```

Riseopedia read models must expose media IDs/paths in the exact shape expected by the app. The app has media safety checks; do not invent media ID column names or path formats.

---

## 10. Recipes and generic requirements

Recipe sync fills:

```text
web_priv.game_recipes
web_priv.game_recipe_outputs_r
web_priv.game_recipe_components_r
web_priv.game_recipe_bench_requirements_r
web_priv.game_recipe_catalyst_requirements_r
web_priv.game_recipe_generic_requirement_connections_r
```

Current verified result:

```text
game_recipes: 439
recipe outputs: 455
recipe components: 939
recipe bench requirements: 395
recipe catalyst requirements: 40
generic requirement connections: 79
hidden recipe rows skipped by render policy: 44
fake recipe-ref assets: 0
```

Generic material requirements should remain generic requirement connections where appropriate. Do not create fake assets for generic refs.

---

## 11. Entity relationships

`web_priv.game_entity_relationships_r` is a graph projection from already-built domain facts. It is rebuilt once after assets, properties, media, and recipes are complete.

It is not filled piece-by-piece by each earlier sync stage.

Current verified graph families:

```text
recipe_produces_output: 378
crafted_by_recipe: 378
recipe_uses_input: 882
used_in_recipe: 882
recipe_requires_bench: 363
bench_can_craft_recipe: 363
bench_uses_input: 360
used_by_bench: 360
bench_produces_output: 331
produced_by_bench: 331
uses_ammunition: 17
used_by_weapon: 17
```

Current verified graph integrity:

```text
entity relationships: 4662
orphan endpoints: 0
duplicate graph rows: 0
source_import_row FK gaps: 0
```

Weapon/ammunition relationships are rule-backed through explicit ammo type lookup rules. Do not use fuzzy substring matching for ammo.

---

## 12. Release decisions

Release/publication decisions are produced after entity relationships.

Current verified result:

```text
game_entity_release_decisions_f: 1852
game_entity_release_evidence_f: 10171
asset decisions: 1413 / 1413
recipe decisions: 439 / 439
```

Current release state summary:

```text
assets confirmed_live: 1413
recipes confirmed_live: 318
recipes needs_review: 77
recipes blocked: 44
```

Read models should use release decisions to decide public/listable/detail visibility, not raw table presence alone.

---

## 13. Riseopedia read models

Riseopedia is the next active work area.

The current emergency compatibility views are not final:

```text
web_view.riseopedia_hub_counts
web_view.riseopedia_hub_recipe_previews
web_view.riseopedia_asset_used_in_recipe_rows
web_view.riseopedia_asset_crafted_by_recipe_rows
```

They were restored only to keep the existing app semi-functional after old views were dropped.

Final Riseopedia read models must be rebuilt from:

```text
web_priv.game_assets
web_priv.game_recipes
web_priv.game_entity_media_r
web_priv.game_media
web_priv.game_media_variants
web_priv.game_entity_property_values
web_priv.game_entity_relationships_r
web_priv.game_entity_release_decisions_f
```

See `docs/riseopedia_read_model_plan.md` for the next audit/rebuild plan.

---

## 14. Hard rules for future game-data work

- Do not assume file, script, function, table, column, view, route, or SQL contents.
- Use current repo snapshot, schema dump, docs, and SQL runner outputs.
- Ask for missing files/data when needed.
- Do not expose `web_priv` or `game_data` directly to app runtime unless through approved SECURITY DEFINER functions or `web_view` contracts.
- Do not grant `cm_client` broad access to `game_data` to fix app errors.
- Do not create fake assets for generic recipe refs.
- Do not reintroduce old asset-only property/media tables.
- Do not let Riseopedia read models invent common rarity variants.
- Do not hardcode visual tokens in TS/TSX when app work begins.
