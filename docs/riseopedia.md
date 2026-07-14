<!-- FILE: docs/riseopedia.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Riseopedia And Mafiosopedia

## Purpose

Riseopedia is the official release-aware Cornucopias knowledge channel. Mafiosopedia is the role-locked latest/review channel. Both use one canonical game foundation, one product-policy schema, mirrored read models, and one shared React component family.

This document owns current wiki architecture, canonical/source boundaries, sync behavior, publication, display configuration, app/admin surfaces, read-model operations, and QA.

---

## 1. Current data flow

```text
game_data imports and game_transform_* rules
    -> web_game canonical game truth
    -> web_riseopedia publication and presentation policy
    -> web_view riseopedia_* / mafiosopedia_* read contracts
    -> apps/web /info routes, APIs, previews, rich-text pickers, and admin
```

Runtime reads never bypass `web_view`; app mutations never bypass `web_api`.

---

## 2. Channels

```text
riseopedia
    official release-aware channel
    category read policy currently min_rank 60

mafiosopedia
    latest/review-preparation channel
    category read policy currently min_rank 75
```

Rendering channels are not patch publication channels.

Patch publication channels currently include:

```text
new
stable
stale
```

`stable` is the public source of truth; `new` is review/preparation; `stale` is retained historical/previous state.

---

## 3. Schema ownership

### `game_data`

Owns raw imports, patch metadata, source discovery, and table-driven transform configuration.

Current transform families include:

```text
classification
identity
variant
name and overrides
brand
coordinate
source links and keys
relationship taxonomy/connections
media and cascade
property targets/rules/null/link rules
loot tables
experience progression
release evidence
shared value maps
```

### `web_game`

Owns canonical game truth and the universal sync engine.

Current dump totals:

```text
71 tables
112 functions
63 sequences
```

### `web_riseopedia`

Owns product/publication/display policy.

Current dump totals:

```text
29 tables
7 functions
23 sequences
```

### `web_view`

Current wiki read layer:

```text
Riseopedia standard/source views      42
Riseopedia materialized views         42
Mafiosopedia standard/source views    40
Mafiosopedia materialized views       41
Riseopedia admin views                41
```

The complete `web_view` schema also includes platform/auth/Discord reads.

---

## 4. Canonical entity model

Current entity types:

```text
asset
recipe
location
mechanic
perk
poi
quest
```

`web_game.game_entities.entity_id` is canonical cross-domain identity. The current model intentionally has no separate current-state `game_assets` or `game_recipes` table.

Core canonical families:

```text
game_entities and game_entities_h
game_entity_types_c/classes_c/categories_c/subcategories_c
game_entity_variants_r and histories
game_entity_variant_values_r and histories
game_entity_variant_source_mappings_r and histories
game_entity_variant_aliases
game_entity_brands_c and game_entity_brand_links_r
game_entity_properties_c and game_entity_property_values
game_entity_property_value_links_r
game_media, game_media_files, game_entity_media_r and histories
game_entity_relationships_r and history
game_coordinates, game_entity_coordinates, game_entity_coordinates_r
game_entity_route_points, game_spawn_areas, game_container_placements_r
game_loot_tables, game_loot_table_entries_r, game_entity_loot_tables_r
game_recipe_components_r/outputs_r/generic_connections_r/catalysts_r
game_quest_* facts and histories
game_experience_level_thresholds_r
game_mechanic_effect_modifiers_r
game_entity_release_evidence_f/decisions_f/overrides
game_entity_patch_changes_f
```

---

## 5. Canonical decisions

- crafting benches are assets, not entity types;
- rarity is an entity variant value;
- brands are entity-level;
- source mappings and aliases are evidence/resolution only;
- recipes derive class from outputs and category/subcategory from bench/tier policy;
- recipe returned tools use catalysts rather than duplicated input/output relationships;
- locations, POIs, mechanics, perks, and quests are first-class entities;
- POIs link to the lowest valid canonical location;
- map route points, spawn areas, placements, terminals, vendors, resources, quest markers, and related facts are canonical game facts;
- raw source payload/path identity is not normal public property data;
- unresolved source evidence remains QA-visible through XNA/XER and release evidence;
- generated IDs must be stable across identical syncs.

Retired families must not return:

```text
domain_entity_id
game_asset_aliases
game_asset_source_mappings_r
game_asset_brands_c / game_asset_brand_links_r
game_asset_rarities_c
game_variant_groups_c / game_variant_values_c
game_recipe_generic_requirement_*
game_recipe_catalyst_requirements_*
game_entity_property_expectations_r
```

---

## 6. Source model

`game_data.game_transform_source_files_c` defines how imported files participate.

Common roles:

```text
owner
    creates canonical identity/variant/source evidence

enricher
    attaches properties/media/names to another owner

recipe_source
    creates recipe identity and connections

relationship_source
    provides reference/relationship targets

ignored
    registered but intentionally not materialized
```

Shared value maps own aliases, dirty source values, enum cleanup, and explicit exceptions. Do not add a bespoke alias table when value maps or source-link rules support the case.

Sentinels:

```text
XNA / -1  missing, unavailable, or not applicable
XER / -2  source existed but could not be resolved
1900-01-01 low/default date
2999-12-31 open-ended date
```

`uncategorized` is a valid taxonomy value, not an error sentinel.

---

## 7. Sync engine

Main entry point:

```sql
SELECT web_game.game_sync_patch(
    '<patch_code>',
    NULL,
    NULL,
    true,
    true
);
```

Signature:

```text
game_sync_patch(
    p_patch_code,
    p_entity_type_code default null,
    p_source_file_code default null,
    p_include_history default true,
    p_include_patch_changes default true
)
```

A full run uses the current universal order, broadly:

1. sentinel anchors and source-link candidate cache;
2. entities, variants, source mappings, aliases, names, brands, and media for each entity type;
3. recipe connections and media cascade;
4. final classifications;
5. properties;
6. coordinates and relationships;
7. map/POI child facts and post-processing;
8. exact property-value links;
9. mechanic, progression, and quest child facts;
10. loot and final relationships;
11. release evidence and decisions;
12. history and patch changes when enabled.

Current sync stability rules include:

- continuation-selected POI survivors retain durable identity;
- superseded owner mappings remain ignored and cannot reclaim identity;
- evidence-only POIs retain source canonical keys while public facts are deactivated;
- coordinate/source/media/relationship candidates use deterministic natural keys and tie-breakers;
- media cascade updates existing assignments rather than deleting/reinserting;
- slug aliases are retargeted in place when possible;
- relationship provenance selection is deterministic;
- property and loot facts follow the canonical survivor.

Partial syncs are development/operator tools. Do not generate complete history or publication claims from a partial run.

---

## 8. History and patch changes

Canonical histories live in `web_game` `_h` tables. Full-run history is produced by:

```sql
SELECT web_game.game_sync_patch_history('<patch_code>');
```

Patch-note facts are rebuilt with:

```sql
SELECT web_game.game_sync_patch_entity_patch_changes('<patch_code>');
```

Patch changes compare canonical history, not raw import row-change markers.

Variant/source/property-specific facts retain their canonical IDs where known.

---

## 9. Release and publication

### Canonical release readiness — `web_game`

- typed release-evidence rules in `game_data`;
- generated evidence facts;
- generated decisions;
- manual entity release overrides and reasons;
- blocker score `-1000` for hard blockers.

### Wiki publication — `web_riseopedia`

- publication channels;
- patch publications;
- scope overrides;
- rendering channels.

Canonical existence does not automatically mean public Riseopedia visibility.

Mafiosopedia may expose latest/review facts according to its own channel policy.

---

## 10. Product configuration

`web_riseopedia` owns:

### Sections

```text
riseopedia_sections
riseopedia_section_classification_rules
```

Sections are manually governed browse groupings resolved through read models.

### Display profiles

```text
riseopedia_display_profiles
riseopedia_display_profile_bindings
riseopedia_display_profile_properties
riseopedia_display_profile_body_blocks
riseopedia_display_profile_body_block_sections
riseopedia_display_profile_variant_selectors
```

Bindings choose the most specific profile by channel/entity scope. Profile elements and body blocks determine detail-page structure.

### Body-block dictionaries

```text
riseopedia_body_renderers_c
riseopedia_body_block_renderers_c
riseopedia_body_block_data_sources_c
riseopedia_body_block_empty_behaviors_c
riseopedia_builtin_display_fields_c
riseopedia_display_element_source_types_c
riseopedia_display_slots_c
```

Body blocks support configured prose, definition, data-table, numbered-row, grouped-mechanics, hierarchy, special-visualization, and state families.

### Overview cards

```text
riseopedia_overview_card_rule_sets
riseopedia_overview_card_rule_elements
riseopedia_overview_card_placements_c
riseopedia_overview_card_display_slots_c
riseopedia_overview_card_modes_c
```

### Semantic and relationship display

```text
riseopedia_semantic_display_rules_c
game_entity_relationship_display_rules_c
```

These own display labels, icons, blocks, perspectives, actions, and fallback semantics. Do not hardcode source-specific display vocabularies in React components when a semantic rule exists.

### Presentation media

```text
game_classification_media_r
game_app_misc_media_r
game_media_surface_derivative_preferences_c
```

Canonical media remains in `web_game`; wiki presentation mappings live here.

---

## 11. Read models

Riseopedia and Mafiosopedia mirror the same conceptual contract families.

### Hub/directory/browse

```text
*_hub_counts
*_hub_sections
*_hub_classes
*_hub_categories
*_hub_subcategories
*_section_directory_rows
*_section_item_browse_rows
*_asset_class_directory_rows
*_asset_browse_rows
*_asset_browse_section_memberships
```

### Entity detail

```text
*_entity_detail
*_entity_detail_media
*_entity_detail_variants
*_entity_detail_variant_values
*_entity_detail_sections
*_entity_detail_profile_elements
*_entity_detail_body_blocks
*_entity_detail_variant_selectors
*_entity_detail_relationship_blocks
*_entity_detail_dependency_rows
*_entity_detail_patch_note_rows
```

### Domain detail

```text
*_entity_detail_recipe_outputs
*_entity_detail_recipe_requirements
*_entity_detail_asset_recipe_links
*_entity_detail_location_tree
*_entity_detail_location_pois
*_entity_detail_poi_location_context
*_entity_detail_poi_vendor_stock
*_entity_detail_poi_resource_yields
*_entity_detail_poi_container_loot
*_entity_detail_poi_transport_stops
*_entity_detail_poi_public_bench_links
*_entity_detail_poi_related_quests
*_entity_detail_poi_summary_facts
*_entity_detail_quest_flow
*_entity_detail_quest_objectives
*_entity_detail_quest_requirements
*_entity_detail_quest_rewards
*_entity_detail_perk_tree
*_entity_detail_need_effects
*_entity_detail_effect_modifiers
*_entity_detail_experience_progression
*_entity_detail_experience_levels
*_entity_detail_experience_level_unlocks
```

### Cards/media/pickers

```text
*_entity_overview_card_resolved_rules
*_entity_overview_card_elements
*_classification_media_lookup
*_media_files
riseopedia_entity_link_picker_rows
```

App code should consume stable read contracts, not reproduce release, taxonomy, variant, or presentation logic.

---

## 12. Materialized-view refresh

After canonical changes or restore:

```sql
SELECT web_riseopedia.game_sync_01_view_refresh();
```

Channel-specific alternatives:

```sql
SELECT web_riseopedia.game_sync_01_riseopedia_view_refresh();
SELECT web_riseopedia.game_sync_01_mafiosopedia_view_refresh();
```

Refresh functions own dependency order. Do not issue random individual refreshes unless debugging a known contract.

---

## 13. Public app routes

```text
/info/riseopedia
/info/riseopedia/browse
/info/riseopedia/browse/[slug]
/info/riseopedia/sections
/info/riseopedia/sections/[slug]
/info/riseopedia/classes
/info/riseopedia/classes/[slug]
/info/riseopedia/categories
/info/riseopedia/categories/[slug]
/info/riseopedia/subcategories
/info/riseopedia/subcategories/[slug]
/info/riseopedia/entity/[slug]
```

Mafiosopedia mirrors these routes under `/info/mafiosopedia`.

The route dispatcher supports only approved wiki categories. DB content rows register/access-gate the `/info` channel pages before the wiki UI renders.

---

## 14. Public APIs

Both channel families expose:

```text
asset-classes
assets
assets/[slug]
recipes/[slug]
sections
entity-preview/[slug]
media/[mediaId]
```

These APIs read through channel-specific `web_view` contracts. Media IDs are validated and served through safe media helpers.

---

## 15. App data/component architecture

Shared dispatch:

```text
apps/web/src/lib/data/opedia-wiki.ts
```

Channel helpers:

```text
apps/web/src/lib/data/riseopedia-*.ts
apps/web/src/lib/data/mafiosopedia-*.ts
```

Shared component family:

```text
apps/web/src/components/riseopedia/context
apps/web/src/components/riseopedia/browse
apps/web/src/components/riseopedia/detail
apps/web/src/components/riseopedia/ui
```

The shared component family deliberately retains the Riseopedia name while rendering either channel through explicit configuration.

Entity-preview links are provided through `RiseopediaEntityPreviewProvider` and the `entity-preview` APIs. Rich-text link pickers use `web_view.riseopedia_entity_link_picker_rows` and guarded `web_api` picker functions.

---

## 16. Admin domain

Current admin families:

- sections and section rules;
- display profiles;
- profile bindings;
- profile properties/elements;
- profile body blocks and sections;
- profile variant selectors;
- overview-card rule sets and elements;
- patch publication channels/publications/scope overrides;
- release evidence, decisions, and overrides;
- relationship display rules;
- canonical property inspection/options.

Admin reads use `web_view.riseopedia_admin_*`. Writes use guarded `web_api.riseopedia_*` functions.

`RiseopediaAdminNav.tsx` is currently an intentionally empty placeholder even though pages import it. Treat this as a product-polish item, not a security boundary.

---

## 17. Media

Canonical media:

```text
web_game.game_media
web_game.game_media_files
web_game.game_entity_media_r
```

Product presentation mappings:

```text
web_riseopedia.game_classification_media_r
web_riseopedia.game_app_misc_media_r
web_riseopedia.game_media_surface_derivative_preferences_c
```

Rules:

- source paths are evidence, not public identity;
- public URLs are built from validated media-file IDs;
- optimized derivatives are preferred according to configured surface rules;
- variant/source linkage is retained;
- inherited/cascade assignments preserve IDs on rerun;
- raw unsafe paths are never exposed to the app.

---

## 18. Variants, properties, and relationships

Variant groups include body, color, cut, denomination, edition, rarity, and tier.

Do not fabricate `common` or another default variant. Read models may choose a real available source-backed variant but must not invent one.

Properties are typed canonical facts. Null handling is rule/property/source scoped; zero is not globally null.

Exact property-value links require one unambiguous canonical target.

Relationships are canonical graph facts with deterministic natural keys and provenance tie-breakers. Equivalent candidates must not cause metadata or IDs to alternate across reruns.

---

## 19. POI, map-derived, quest, mechanic, and perk facts

Current canonical sync includes:

- semantic POI identities and location relationships;
- continuation handling for MAP actors and durable legacy identities;
- evidence-only actor suppression;
- vendors and stock/loot links;
- resource yields;
- public crafting benches and tiers;
- transport stops and ordered routes;
- spawn areas and container placements;
- quest markers, flows, objectives, requirements, rewards, and target relationships;
- perk trees;
- need/effect mechanics and effect modifiers;
- experience progression and level thresholds.

The transitional public map viewer does not yet consume these canonical facts as DB-backed layers. That is future app work; it does not justify moving canonical coordinates out of `web_game`.

---

## 20. Access behavior

Wiki routes are actor-sensitive DB-gated public content routes.

- login-time Discord sync must complete;
- fresh server actor resolution runs before gated access;
- due/failed role refresh falls back to public/anonymous behavior;
- Mafiosopedia remains role locked by its category/content policies;
- admin APIs guard themselves independently of page guards.

See `docs/auth_access_model.md`.

---

## 21. Styling

Primary wiki styles:

```text
apps/web/src/styles/riseopedia.css
apps/web/src/styles/riseopedia-detail-visual-system.css
```

`riseopedia.css` owns general wiki structure and visuals. `riseopedia-detail-visual-system.css` owns configured detail body-block visual families, hierarchy trees, compact empty states, and specialized detail layouts.

TS/TSX owns data, state, semantics, and composition; CSS owns visual styling. Runtime preview popup coordinates are an allowed documented computed-style exception.

---

## 22. Operator runbook

### Preflight

```sql
SELECT current_user;
SELECT web_game.game_helper_patch_id_from_code('<patch_code>');
```

Run as `cm`, not `cm_client`.

### Full sync

```sql
SELECT web_game.game_sync_patch('<patch_code>');
```

### Refresh both channels

```sql
SELECT web_riseopedia.game_sync_01_view_refresh();
```

### Targeted development run

```sql
SELECT web_game.game_sync_patch(
    '<patch_code>',
    'poi',
    NULL,
    false,
    false
);
```

Targeted runs are not publication builds.

### Destructive rebuild helper

```sql
SELECT *
FROM web_game.game_sync_99_danger_wipe_game_data_tables(
    'latest_patch',
    '<patch_code>',
    false
);
```

Owner-only and dangerous. Never expose through runtime API.

---

## 23. Minimum QA

Expected zero:

```text
orphan patch-change rows
relationship source/target orphans
duplicate active property-value link roles
crafting_bench entity-type rows
active continuation-superseded POI duplicates
resolved owner mappings on superseded POIs
unpopulated live wiki materialized views
fake displayed common without a real common variant
```

Expected non-zero:

```text
Riseopedia hub entity count
Mafiosopedia hub entity count
asset/recipe/location/mechanic/perk/poi/quest browse/detail coverage where published
```

Double-run stability:

- identical source input must preserve row counts and canonical IDs;
- current-state semantic rows must converge;
- downstream properties, loot, aliases, coordinates, media, and relationships must not churn because of upstream identity changes.

---

## 24. Current limitations and next work

- private-schema tests/security scans must add `web_game` and `web_riseopedia`;
- refresh and full-sync performance should be profiled and regression tracked;
- Riseopedia admin sub-navigation is empty;
- broader integration/E2E coverage is still needed;
- the map viewer remains filesystem/sample-overlay based;
- generated `_db.md`/`_snapshot.md` must be regenerated after this architecture change.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
