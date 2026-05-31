<!-- FILE: docs/game_sync_pipeline.md -->
# Corn Mafia Game Sync Pipeline

## Purpose

This document records the agreed and verified `game_data -> web_priv` sync pipeline for Corn Mafia game data.

It documents the current function surface, execution order, verified counts, relationship behavior, and QA expectations after the May 2026 game-data rebuild.

Use this with:

- `docs/game_data_handling.md`
- `docs/game_patch_runbook.md`
- `docs/codebase_rules.md`
- `docs/riseopedia_read_model_plan.md`

---

## 1. Current wrapper

The primary rebuild entrypoint is:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Function:

```text
web_priv.game_sync_patch(p_patch_code text) RETURNS jsonb
```

The wrapper is re-entrant. It resets generated downstream state before rebuilding the patch.

Current implementation label:

```text
clean_game_sync_patch_wrapper_reentrant
```

---

## 2. Wrapper order

The wrapper order is:

```text
1. web_priv.game_reset_patch_generated_state(p_patch_code)
2. web_priv.game_sync_patch_assets(p_patch_code)
3. web_priv.game_sync_patch_asset_properties(p_patch_code)
4. web_priv.game_sync_patch_media(p_patch_code)
5. web_priv.game_sync_patch_recipes(p_patch_code)
6. web_priv.game_sync_patch_entity_relationships(p_patch_code)
7. web_priv.game_sync_patch_release_decisions(p_patch_code)
```

Important: `game_sync_patch_assets` delegates reference sync. Do not call `game_sync_patch_reference_data` separately before asset sync inside the wrapper.

---

## 3. Reset behavior

The wrapper calls:

```text
web_priv.game_reset_patch_generated_state(p_patch_code text)
```

This clears generated rows in dependency order so asset sync can delete and rebuild canonical assets without FK failures.

The reset removes generated state such as:

```text
release evidence
release decisions
entity relationships
entity media links
entity property values
recipe outputs
recipe components
recipe bench requirements
recipe catalyst requirements
recipe generic requirement connections
recipes and recipe entities
asset aliases
asset source mappings
asset source mapping variants
bench tier variants
asset brand links
```

It preserves source imports, transform rules, curated generic requirement groups, release state code tables, entity type codes, and manual/admin control data.

---

## 4. Reference sync

Reference sync is produced from transform/source rules and current patch source data.

Functions:

```text
web_priv.game_sync_patch_reference_data(p_patch_code text)
web_priv.game_sync_patch_asset_reference_data(p_patch_code text)
web_priv.game_sync_patch_recipe_reference_data(p_patch_code text)
web_priv.game_sync_patch_entity_property_reference_data(p_patch_code text)
```

The wrapper does not call reference sync directly. Asset sync calls it as part of asset rebuild.

Current synced reference families:

```text
asset brands
asset classes
asset categories
asset subcategories
recipe classes
recipe categories
recipe subcategories
entity properties
entity property expectation rules
```

---

## 5. Asset sync

Function:

```text
web_priv.game_sync_patch_assets(p_patch_code text)
```

Responsibilities:

- sync reference data
- stage promotable source rows
- create canonical asset entities and asset rows
- create source mappings
- create aliases
- preserve rarity/variant source mapping context
- true-fold crafting benches into canonical bench family assets
- populate bench tier/source variant rows

Verified output for patch `0.4.0`:

```text
game_assets: 1413
crafting bench assets: 12
game_asset_bench_tier_variants_r: 44
game_asset_aliases: 6360
game_asset_source_mappings_r: 2076
game_asset_source_mapping_variants_r: 109
```

### Crafting bench folding

The current model is true folding, not hidden duplicate asset rows.

```text
canonical bench assets: 12
bench source/tier variants: 44
hidden tier asset rows: 0
```

Bench source/tier variants remain in `game_asset_bench_tier_variants_r` and source mapping tables. They are not separate public `game_assets` rows.

---

## 6. Asset property sync

Function:

```text
web_priv.game_sync_patch_asset_properties(p_patch_code text)
```

Responsibilities:

- read source payload values through `game_data.game_transform_asset_property_rules_c`
- populate `web_priv.game_entity_property_values`
- preserve rarity/variant/source mapping context
- type values into the correct value column
- avoid invalid multi-value shape

Verified output for patch `0.4.0`:

```text
asset property values: 17735
distinct asset properties: 38
assets with properties: 1413
```

Important properties:

```text
slot_width and slot_height have no unit
weapon ammo_type is extracted from dtweapondetails.AmmoType
```

---

## 7. Media sync

Function:

```text
web_priv.game_sync_patch_media(p_patch_code text)
```

Responsibilities:

- promote media rows
- promote media variants
- link media to asset entities
- choose preferred variants through media role rules

Verified output for patch `0.4.0`:

```text
game_media: 1873
game_media_variants: 7492
game_entity_media_r: 1925
assets with media: 1405
```

Known benign gaps:

```text
some simple benches such as Crafting Bench, Electronics Bench, Sawmill, and Smelter may have no media source
```

---

## 8. Recipe sync

Function:

```text
web_priv.game_sync_patch_recipes(p_patch_code text)
```

Responsibilities:

- create recipe entities and domain rows
- create outputs
- create components
- create bench requirements
- create catalyst requirements
- create generic requirement group connections
- suppress generic component rows where generic group connections are the correct representation
- avoid creating fake assets for unresolved recipe refs

Verified output for patch `0.4.0`:

```text
game_recipes: 439
recipe outputs: 455
recipe components: 939
recipe bench requirements: 395
recipe catalyst requirements: 40
generic requirement connections: 79
hidden-policy recipe rows: 44
fake recipe-ref assets: 0
```

Generic refs such as `MetalIngot` and `WoodPlanks` are generic requirement group connections where appropriate.

---

## 9. Entity relationship sync

Function:

```text
web_priv.game_sync_patch_entity_relationships(p_patch_code text)
```

Responsibilities:

- project recipe/output/component/bench facts into graph edges
- project bench capability edges
- project weapon/ammunition compatibility edges
- use live `game_data.game_transform_relationship_types_c` endpoint roles and directions
- omit generated identity columns from insert
- validate source import row FK by inserting NULL where no real import row exists

Verified output for patch `0.4.0`:

```text
game_entity_relationships_r: 4662
```

Relationship family counts:

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

Integrity:

```text
orphan source/target endpoints: 0
duplicate graph rows: 0
source_import_row FK gaps: 0
```

### Ammo rule layer

Weapon/ammunition relationships are rule-backed.

Current rule objects:

```text
web_priv.game_relationship_ref_lookup_codes(...)
game_data.game_transform_ammo_type_lookup_rules_c
```

The ammo lookup rules resolve 13 distinct `AmmoType` enum values and 17 weapon relationships.

Do not replace this with fuzzy substring matching.

---

## 10. Release decision sync

Function:

```text
web_priv.game_sync_patch_release_decisions(p_patch_code text)
```

Responsibilities:

- create release evidence rows
- create release decision rows
- respect manual overrides when present
- use release state code table and evidence rules

Verified output for patch `0.4.0`:

```text
game_entity_release_decisions_f: 1852
game_entity_release_evidence_f: 10171
```

Decision coverage:

```text
assets: 1413 / 1413
recipes: 439 / 439
```

Release summary:

```text
assets confirmed_live: 1413
recipes confirmed_live: 318
recipes needs_review: 77
recipes blocked: 44
```

Integrity:

```text
decision_missing_state_fk: 0
duplicate_decision_rows: 0
duplicate_evidence_rows: 0
evidence_missing_rule_fk: 0
```

---

## 11. Stable QA expectations

After running:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Expected stable counts are:

```text
game_assets: 1413
game_assets_crafting_bench: 12
game_asset_bench_tier_variants_r: 44
game_entity_property_values_asset: 17735
game_media: 1873
game_media_variants: 7492
game_entity_media_r: 1925
game_recipes: 439
game_recipe_outputs_r: 455
game_recipe_components_r: 939
game_recipe_bench_requirements_r: 395
game_recipe_catalyst_requirements_r: 40
game_recipe_generic_requirement_connections_r: 79
game_entity_relationships_r: 4662
game_entity_release_decisions_f: 1852
game_entity_release_evidence_f: 10171
```

Required guards:

```text
fake recipe-ref assets: 0
orphan relationship source/target: 0
duplicate relationship rows: 0
release decision duplicate rows: 0
source_import_row FK gaps: 0
weapon ammo unresolved: 0
asset release coverage: 1413 / 1413
recipe release coverage: 439 / 439
```

---

## 12. Known next work

The game sync pipeline is complete through `web_priv` canonical truth.

Next active work is Riseopedia read-model rebuild:

- audit app-required `web_view.riseopedia_*` contracts
- rebuild `web_view` surfaces from `web_priv.game_*`
- ensure media ID/path shape matches app safety helpers
- ensure bench folding remains visible in app-facing views
- ensure item default rarity/variant uses actual available source variants, not invented common
- replace emergency compatibility views with durable read contracts
