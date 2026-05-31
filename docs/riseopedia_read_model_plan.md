<!-- FILE: docs/riseopedia_read_model_plan.md -->
# Riseopedia Read Model Plan

## Purpose

This document records the current Riseopedia state and the next agreed rebuild plan.

The `game_data -> web_priv` sync pipeline is now stable. Riseopedia must now be rebuilt as app-facing `web_view` contracts over the new clean `web_priv.game_*` truth.

---

## 1. Current state

The canonical game-data pipeline now works through:

```text
game assets
asset properties
media
recipes
entity relationships
release decisions
```

The current app is only semi-functional because some old `web_view.riseopedia_*` views were dropped during DB cleanup and emergency compatibility views were restored later.

Temporary compatibility views include:

```text
web_view.riseopedia_hub_counts
web_view.riseopedia_hub_recipe_previews
web_view.riseopedia_asset_used_in_recipe_rows
web_view.riseopedia_asset_crafted_by_recipe_rows
```

These views are not the final contract.

---

## 2. Source tables for final read models

Final Riseopedia read models should be built from:

```text
web_priv.game_assets
web_priv.game_recipes
web_priv.game_entity_media_r
web_priv.game_media
web_priv.game_media_variants
web_priv.game_entity_property_values
web_priv.game_entity_relationships_r
web_priv.game_entity_release_decisions_f
web_priv.game_entity_release_evidence_f
web_priv.game_asset_source_mappings_r
web_priv.game_asset_source_mapping_variants_r
web_priv.game_asset_bench_tier_variants_r
web_priv.game_asset_classes_c
web_priv.game_asset_categories_c
web_priv.game_asset_subcategories_c
web_priv.game_recipe_categories_c
```

Do not build final read models from raw `game_data` or old deprecated asset/recipe property/media tables.

---

## 3. App contract audit comes first

Before generating final Riseopedia SQL, inspect the current app usage.

Required audit questions:

1. Which `web_view.riseopedia_*` objects does `apps/web` query?
2. Which columns does each route/component/data helper expect?
3. Which media ID/path shape does `RiseopediaMediaFrame` and the media lookup helper expect?
4. Which views are list surfaces, detail surfaces, relationship surfaces, or hub summary surfaces?
5. Which existing views are temporary compatibility shims and which are final enough to preserve?

Do not guess view columns from memory.

---

## 4. Priority read surfaces

Likely high-priority surfaces:

```text
web_view.riseopedia_hub_counts
web_view.riseopedia_hub_recipe_previews
web_view.riseopedia_assets
web_view.riseopedia_assets_dynamic
web_view.riseopedia_asset_browse_rows
web_view.riseopedia_asset_browse_rows_dynamic
web_view.riseopedia_asset_detail
web_view.riseopedia_asset_detail_dynamic
web_view.riseopedia_asset_media
web_view.riseopedia_asset_used_in_recipe_rows
web_view.riseopedia_asset_crafted_by_recipe_rows
web_view.riseopedia_asset_section_memberships
web_view.riseopedia_asset_browse_section_memberships
```

The exact required list must be confirmed from app source and current logs.

---

## 5. Hub counts

`riseopedia_hub_counts` must be rebuilt from release-aware game truth.

Expected conceptual fields:

```text
asset_count
recipe_count
section_count
asset_class_count
```

Counts should use release decisions and app listability rules, not only raw row counts.

Temporary hub counts previously existed but returned zeros; this is not acceptable for the final read model.

---

## 6. Media contract

The app has media safety checks and can throw:

```text
Riseopedia media ID is not safe for lookup.
```

Final views must expose the exact columns expected by the current app data layer.

Do not invent media column names. Confirm from `apps/web` before generating final SQL.

Potential fields seen during compatibility work:

```text
primary_media_id
primary_media_width_px
primary_media_height_px
primary_media_mime_type
primary_media_source_code
primary_media_resolution_reason_code
```

The correct shape must be verified against the app source.

Do not expose unsafe or arbitrary path values if the app expects internal media ID lookup.

---

## 7. Bench folding in read models

Read models must preserve true bench folding.

Expected behavior:

```text
public/listable crafting bench assets: 12
bench source/tier variants: exposed only as variant/capability details if needed
no separate public asset rows for tier/source bench variants
```

Views should not resurrect old rows such as separate Tier 2/Tier 3 physical bench assets as browsable assets.

Recipe bench requirements should point to canonical bench family assets and minimum tier/capability metadata.

---

## 8. Rarity and default variant behavior

This is a required audit target.

Problem to prevent:

```text
an item that only exists in higher rarities gets displayed as if it has a common/default variant
```

Rules:

- `default_rarity_code = common` is only a missing-context fallback during extraction.
- Riseopedia default display rarity must be chosen from actual available source mappings/variants.
- If common is absent, the read model must choose a source-backed available rarity.
- Do not create or display a fake common row for assets that only have higher-rarity data.

Audit sources:

```text
web_priv.game_asset_source_mappings_r.rarity_code
web_priv.game_asset_source_mapping_variants_r
web_priv.game_entity_property_values.rarity_code
web_priv.game_assets
```

Expected final behavior:

```text
available_rarities = actual source-backed rarities
default_rarity = source-backed selected rarity, never fabricated common
variant properties/media = pulled from matching source-backed rarity/variant context when available
```

---

## 9. Recipe relationship surfaces

Recipe relationship surfaces should be rebuilt from the graph and/or local relationship tables.

Current compatibility views:

```text
web_view.riseopedia_asset_used_in_recipe_rows: 882 rows
web_view.riseopedia_asset_crafted_by_recipe_rows: 378 rows
```

Final design should decide whether these come from:

```text
web_priv.game_entity_relationships_r
```

or directly from:

```text
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
```

Either is acceptable if the contract is stable, release-aware, and matches app usage.

---

## 10. Release decisions in read models

Use `web_priv.game_entity_release_decisions_f` for listability/detail eligibility.

Current release summary:

```text
assets confirmed_live: 1413
recipes confirmed_live: 318
recipes needs_review: 77
recipes blocked: 44
```

Read models should not show blocked recipe rows as normal public recipes unless an admin/debug surface explicitly wants them.

---

## 11. Suggested Riseopedia rebuild sequence

1. Audit app source for all `riseopedia_*` queries and expected columns.
2. Capture live definitions of any existing `web_view.riseopedia_*` views.
3. Build a compatibility matrix: view name, app route/helper, required columns, current status.
4. Rebuild `riseopedia_hub_counts` correctly.
5. Rebuild media-safe recipe preview/hub views.
6. Rebuild asset browse/detail views with bench folding and rarity/default variant logic.
7. Rebuild recipe relationship views.
8. Add QA views/scripts for:
   - missing app-required views
   - missing expected columns
   - bench folding leaks
   - fake common/default rarity leaks
   - media ID safety/nulls
   - release-state coverage
9. Only then update app code if the existing app contract is wrong.

---

## 12. Rules for the next ChatGPT session

- Start in audit mode.
- Do not generate destructive SQL first.
- Check actual app files and SQL definitions.
- Ask for missing files or query results when needed.
- Avoid repeating compatibility shim work as final design.
- Preserve the clean `game_sync_patch` pipeline.
