<!-- FILE: docs/game_data_handling.md -->
# Corn Mafia Game Data Handling

## Purpose

This document defines how Corn Mafia imports, transforms, validates, publishes, and operates game data for Riseopedia and future game-data features.

It is the durable source of truth for game data handling. It should be read with:

- `docs/project_definition.md`
- `docs/codebase_rules.md`
- `docs/game_patch_runbook.md`
- `docs/game_data_quality.md`

If this document conflicts with old prompts, one-off SQL patches, or historical assumptions, this document controls unless the user explicitly overrides it for a specific task.

---

## 1. Core model

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
	private rebuild/promotion/revalidation functions
	private business logic

web_view
	public/member/admin app read contracts

web_api
	guarded app-callable actions
	guarded admin wrappers for sensitive analytics
	guarded revalidation triggers where needed

web_analytics
	QA views
	audit views
	validation summaries
	data-quality diagnostics
	admin/operational analytics surfaces
```

Sensitive analytics are accessed through guarded `web_api` functions when the app/admin UI needs them.

`web_analytics` is not a normal public app read contract.

---

## 3. Game-domain taxonomy

```text
game_asset_*    = assets and asset-specific dimensions
game_entity_*   = cross-entity identity, release state, and relationships
game_media_*    = media and media mappings
game_recipe_*   = recipes, components, outputs, benches, catalysts, and requirement groups
game_quest_*    = quests and quest-specific relationships
game_vendor_*   = vendors and shop data
game_npc_*      = NPCs and drops
game_location_* = locations, map/resource locations, and location relationships
game_transform_* = source transformation, classification, identity, naming, ref-resolution, and relationship rules
```

Current decisions:

- crafting benches are assets
- brands belong under `game_asset_brand*`
- rarities belong under `game_asset_rarity*` and source-mapping/variant identity
- release states, entity types, and relationships belong under `game_entity_*`
- relationship results use `game_entity_relationships_r`
- generic recipe resources use `game_recipe_requirement_groups*`, not asset grouping

---

## 4. Patch lifecycle

A new game patch should follow this lifecycle:

```text
1. create backup / restore point
2. register the patch/import batch
3. import raw source files into game_data
4. register source files and source file roles
5. apply game_data.game_transform_* rules
6. rebuild canonical web_priv.game_* truth
7. populate history/snapshot tables where required
8. refresh web_analytics QA/audit surfaces
9. review QA before public exposure
10. expose stable data through web_view read contracts
11. trigger guarded revalidation through web_priv/web_api functions when needed
```

Do not bypass QA when source files change shape.

---

## 5. Raw source handling

Raw source payloads must remain available for traceability.

Rules:

- preserve raw payloads in `game_data` import rows
- keep source file code and import row identity stable enough for rebuild diagnostics
- do not rewrite raw source payloads as a cleanup strategy
- normalize only in transform rules and canonical outputs
- do not expose raw payloads directly to public app surfaces

---

## 6. Transform rules

Transform/config rules belong under `game_data.game_transform_*`.

Examples:

```text
game_transform_source_files_c
game_transform_asset_classification_rules_c
game_transform_asset_identity_rules_c
game_transform_asset_variant_rules_c
game_transform_asset_naming_rules_c
game_transform_asset_relationship_rules_c
game_transform_recipe_ref_resolution_rules_c
game_transform_recipe_classification_rules_c
game_transform_recipe_requirement_group_aliases_c
```

Rules:

- transform rules decide how source data becomes canonical truth
- transform rules should be data-driven where practical
- source-specific exceptions belong in transform rules, not UI code
- do not invent broad regex rules when explicit source evidence is required
- risky grouping or classification rules must have QA coverage

---

## 7. Canonical game truth

Canonical current truth lives in `web_priv.game_*` tables.

Canonical truth is what app read contracts and Riseopedia should be built from.

Examples:

```text
web_priv.game_assets
web_priv.game_asset_source_mappings_r
web_priv.game_asset_property_values
web_priv.game_entity_relationships_r
web_priv.game_recipes
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
web_priv.game_recipe_requirement_groups_c
web_priv.game_media
```

Do not treat raw import rows as canonical truth.

---

## 8. Asset identity, grouping, and naming

Asset identity must not be based on display name alone.

Asset grouping should consider:

```text
asset class
source identity
explicit identity rules
variant rules
rarity rules
source file role
known aliases
explicit no-group guards
```

Examples of grouping dimensions:

- rarity
- color
- denomination
- edition
- building set
- material finish
- body/slot/equipment variant

Examples of no-group signals:

- different class
- dev/test/internal source rows
- display-name collisions with different source identity
- source rows with different meshes/costs/equipment behavior

---

## 9. Property handling

`game_asset_property_values` should store transformed, queryable property values.

Raw source payloads are evidence, not normal asset properties.

Rules:

- keep useful scalar values as atomic rows
- explode useful objects into child rows or atomic values when analytics/display needs it
- explode arrays only when item meaning is known or useful for QA
- preserve source mapping, rarity, and variant context when grouped assets have source-row-specific properties
- do not store source payload snapshots as normal public properties
- do not store source file roles as normal public properties
- do not store media paths as normal public properties
- do not store brands as long-term generic properties
- do not store rarity as an unrelated generic property

Good atomic property examples:

```text
Attributes.Weight -> weight
Attributes.Nutrition -> nutrition
ItemSlotSize.X -> slot_width
ItemSlotSize.Y -> slot_height
AddedSlots -> added_slots
VehicleBrand -> vehicle_brand
VehicleModel -> vehicle_model
CargoSpace -> cargo_space
Year -> year
```

Structured examples that should be exploded when useful:

```text
JetpackLaunchVelocity.X/Y/Z
Color.R/G/B/A/Hex
Materials[]
MaterialsRep[]
PerformanceValues[]
RequiredRoles[]
TagPrefix[]
```

Media paths from fields such as `ItemIconSquare`, `ItemIconSpatial`, `Icon`, `BigPicture`, and `BrandLogo` belong in media tables/mappings.

---

## 10. Media handling

Media belongs in `game_media*` and linking tables.

Rules:

- source icon/mesh/image paths should be transformed into media or media evidence rows
- asset display should use `game_asset_media*` or approved media read views
- media selection should preserve source evidence and role, such as icon, spatial icon, large image, mesh, brand logo, or physical bench media
- do not leave public media display dependent on raw source JSON paths

---

## 11. Recipe handling

Recipe exact inputs and outputs belong in recipe relationship tables:

```text
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
```

Generic recipe resources belong in:

```text
web_priv.game_recipe_requirement_groups_c
web_priv.game_recipe_requirement_group_connections_r
```

Transform/ref-resolution rules belong in `game_data.game_transform_recipe_*`.

Recipe refs may resolve to:

- exact asset input
- exact asset output
- generic input requirement group
- generic output requirement group
- bench requirement
- physical bench asset
- catalyst/processor requirement

Riseopedia recipe views should dedupe grouped source rows into canonical display rows.

---

## 12. Entity relationships

Cross-domain relationships use `web_priv.game_entity_relationships_r`.

Relationship metadata and transform rules should be separated:

```text
game_data.game_transform_relationship_types_c
game_data.game_transform_relationship_endpoint_roles_c
game_data.game_transform_asset_relationship_rules_c
web_priv.game_entity_relationships_r
web_priv.game_entity_relationships_r_h
```

Relationship results are not asset-only. They may connect recipes, assets, vendors, quests, NPCs, locations, requirement groups, and other entities.

---

## 13. QA and analytics

QA/audit diagnostics belong in `web_analytics`.

Use `web_analytics` for:

- asset classification coverage
- asset grouping checks
- property coverage
- media coverage
- recipe resolution coverage
- entity relationship coverage
- release state checks
- import/source field shape checks

Sensitive analytics should be exposed to the app only through guarded `web_api` functions.

---

## 14. Release state and publication

Release state and website publication are related but not identical.

Use `game_entity_*` concepts for:

- entity types
- release states
- release evidence
- first/last seen patch
- patch coverage
- active/deprecated state

Public display should be controlled by approved views/functions, not raw presence in import data.

---

## 15. Rebuild and revalidation

Promotion/rebuild logic should live under `web_priv`.

Rules:

- rebuild functions may read `game_data` transform rules
- rebuild functions write canonical `web_priv.game_*` truth
- app-callable revalidation should be a guarded function path
- expose app/admin triggers through `web_api` only when needed
- avoid procedures for app-triggered revalidation; use functions returning status rows/JSON instead
- procedures are acceptable for explicit manual operator workflows when documented

---

## 16. Deprecated object policy

Do not drop old objects just because a new naming convention exists.

Deprecation flow:

```text
1. identify current references
2. migrate or replace callers
3. add compatibility only when needed
4. verify rebuild and app surfaces
5. drop deprecated objects intentionally
6. update docs and runbook
```

During active development, destructive cleanup is allowed when the user explicitly accepts it, but it should still be documented and verifiable.
