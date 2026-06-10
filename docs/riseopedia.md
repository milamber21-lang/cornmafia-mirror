<!-- FILE: docs/riseopedia.md -->
# Riseopedia And Mafiosopedia

## Purpose

Riseopedia is the Corn Mafia game-knowledge system.

It turns imported Cornucopias game data into stable, release-aware, media-safe, browseable web knowledge. It covers assets, recipes, classifications, sections, variants, properties, media, patch visibility, patch notes, recipe dependencies, and relationship blocks.

Mafiosopedia is the sibling/latest-review channel that uses the same canonical game-data foundation and the same UI component family, but reads from the `web_view.mafiosopedia_*` read models. It exists so the platform can expose or review newer/latest-known game knowledge separately from the official public Riseopedia channel.

This document is the single durable Riseopedia-family overview. It replaces the older standalone Riseopedia read-model planning notes. Use it together with:

```text
docs/project_definition.md
docs/codebase_rules.md
docs/style_system.md
docs/auth_access_model.md
```

This file owns the Riseopedia-family product, architecture, transform model, source-data handling, sync pipeline, operator runbook, app surfaces, admin surfaces, read-model shape, and operational expectations. The old standalone Riseopedia source-data, transform-model, sync-pipeline, patch-runbook, and read-model planning docs are merged into this document.

---

## 1. Scope

Riseopedia-family scope includes:

```text
canonical game identity
entity and variant browse/detail pages
asset and recipe display
section/class/category/subcategory directories
media-safe image/file rendering
display profiles and detail-page layout rules
overview cards and browse-card fields
relationship/dependency blocks
recipe requirement and output trees
patch publication channels
release decisions and release evidence
patch notes/change display
admin configuration for the above
```

Riseopedia-family scope does not include:

```text
raw source-file editing in app code
manual CRUD against web_priv from routes
manual CRUD against game_data from routes
generic CMS content authoring
Discord role ownership
map tile storage
future game domains that are not modeled yet
```

---

## 2. Names and channels

The Riseopedia-family currently has two app-facing wiki channels:

```text
riseopedia   = official/public/release-aware game knowledge
mafiosopedia = latest-known/review-prep game knowledge channel
```

Both channels use the same conceptual model:

```text
game_data imports/rules
	-> web_priv canonical game truth
	-> web_view channel-specific read models
	-> apps/web /info routes and APIs
```

The channel split is deliberate. Do not collapse Riseopedia and Mafiosopedia into one route, view, or configuration family when release behavior, visibility behavior, display rules, or review behavior differs.

Relevant DB channel/config objects include:

```text
web_priv.riseopedia_rendering_channel_c
web_priv.riseopedia_display_profiles
web_priv.riseopedia_overview_card_rule_sets
web_priv.game_patch_publication_channels_c
```

`riseopedia` and `mafiosopedia` are rendering/read-model channels. Patch publication channel codes such as `new`, `stable`, and `stale` describe patch visibility/status policy and should not be confused with the rendering channel code.

---

## 3. Non-negotiable boundaries

Riseopedia is DB-first.

App reads must use:

```text
web_view
approved read functions
```

App writes/actions must use:

```text
web_api
```

App code must not directly CRUD or join:

```text
web_priv
game_data
web_analytics
```

Runtime role:

```text
cm_client
```

Owner/migration role:

```text
cm
```

`cm_client` must not receive broad grants on private canonical game truth or raw import/transform tables.

---

## 4. Layer model

Riseopedia-family data flows through these layers:

```text
game_data
	raw game imports
	patch/source metadata
	game_transform_* source-to-canonical rules
	manual source-resolution rules
	import evidence used by rebuild logic

web_priv
	canonical current game truth
	canonical history snapshots
	private sync/rebuild/revalidation helpers
	private Riseopedia configuration tables
	private release/review evidence and decisions

web_api
	guarded app-callable admin mutations
	guarded actions for Riseopedia admin surfaces
	approved action wrappers when app runtime needs to trigger private behavior

web_view
	public/member/admin app-facing read contracts
	Riseopedia public/release-aware read models
	Mafiosopedia latest/review read models
	Riseopedia admin lookup/list contracts

web_analytics
	QA/audit/read-only diagnostics
	data-quality and operator evidence views
```

The app must not move business-rule ownership into route handlers. Route handlers validate input, guard context, and call the approved DB contract.

---

## 5. Canonical game foundation

The canonical game foundation is entity-first and variant-aware.

Current durable truths:

```text
entities are asset or recipe
crafting benches are assets, not entity types
rarity is a variant value, not an asset table
brands are entity-level
aliases are resolver evidence only
source mappings are variant evidence only
media lives under game media tables, not normal properties
properties come from mapping rules and materialized values
recipes get class from resolved outputs
recipe category/subcategory come from bench family and tier/no_tier_required
vehicle subcategories use raw brand/source values without class prefixes
```

Important canonical objects:

```text
web_priv.game_entities
web_priv.game_assets
web_priv.game_recipes
web_priv.game_entity_variants_r
web_priv.game_entity_variant_groups_c
web_priv.game_entity_variant_value_codes_c
web_priv.game_entity_variant_values_r
web_priv.game_entity_variant_source_mappings_r
web_priv.game_entity_variant_aliases
web_priv.game_entity_brands_c
web_priv.game_entity_brand_links_r
web_priv.game_entity_properties_c
web_priv.game_entity_property_values
web_priv.game_entity_media_r
web_priv.game_media
web_priv.game_media_files
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
web_priv.game_recipe_generic_connections_r
web_priv.game_recipe_catalysts_r
web_priv.game_entity_relationships_r
```

Retired concepts must not be recreated:

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
web_priv.game_entity_property_expectations_r
```

---

## 6. Source imports and transform rules

Raw source files and source-to-canonical mapping rules live under `game_data`.

Transform/config tables use the `game_data.game_transform_*` family. These rules resolve source identity, classification, naming, variants, relationships, recipe references, generic groups, source links, media, and properties before canonical truth is promoted into `web_priv`.

Rules:

```text
do not encode source mistakes in UI code
do not put transform rules in app routes
do not use raw source row names as durable app identity
do preserve entity_id and entity_variant_id across syncs when the logical row is unchanged
do preserve patch/source evidence for QA and review
do keep XNA/XER sentinel behavior visible to QA instead of hiding unresolved data in routes
```

Sentinel meanings:

```text
XNA / -1 = source value missing or not applicable
XER / -2 = source value exists but could not be resolved
1900-01-01 = low/default missing date
2999-12-31 = open-ended validity date
```

---

## 7. Sync pipeline

The main canonical sync entry point is:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Signature:

```sql
web_priv.game_sync_patch(
	p_patch_code text,
	p_entity_type_code text DEFAULT NULL,
	p_source_file_code text DEFAULT NULL,
	p_include_history boolean DEFAULT true,
	p_include_patch_changes boolean DEFAULT true
)
```

High-level sync order:

```text
1. asset identity, variants, source mappings, aliases
2. asset names, classifications, brands, media, properties
3. recipe identity, variants, source mappings, aliases
4. recipe names, classifications, brands, media, properties
5. recipe connections
6. entity relationships
7. exact property-value links
8. release evidence
9. release decisions and rollups
10. patch history
11. patch-change rows
12. Riseopedia/Mafiosopedia read-model refresh when needed
```

Asset sync runs before recipe sync because recipes depend on resolved asset identity, variants, source mappings, benches, components, outputs, catalysts, and relationship targets.

Partial syncs are allowed through `p_entity_type_code` and `p_source_file_code`, but partial runs are not a substitute for full patch history/change generation.

ID-stability rule:

```text
same logical entity keeps entity_id
same logical variant keeps entity_variant_id
same logical recipe connection keeps recipe_*_id
same logical relationship keeps entity_relationship_id
same logical property value keeps entity_property_value_id
same exact property-value link keeps entity_property_value_link_id
```

Sync functions should use update/insert/delete-missing patterns, not delete-all/reinsert patterns, for generated canonical rows that the app may link to.

---

## 8. Release model

Riseopedia public output is release-aware.

Release decisions are generated from evidence and can be influenced by guarded admin overrides. The public channel must not simply expose every canonical row just because it exists.

Important ideas:

```text
release evidence = why an entity is ready, blocked, hidden, review-needed, or otherwise classified
release decision = effective row-level visibility/readiness result
patch publication = which patch is considered public/stable/current for a channel
scope override = classification-level publication exception or policy override
entity override = entity-level release decision override
```

Admin surfaces include:

```text
release evidence
release decisions
release overrides
patch publication channels
patch publications
patch scope overrides
```

Public/read-model acceptance:

```text
hub counts are non-zero and release-aware
public Riseopedia does not expose blocked/unreleased entities as normal public entries
Mafiosopedia may intentionally show latest/review rows according to its channel rules
patch notes are generated from canonical history/change facts, not raw source row_change_code alone
```

---

## 9. Read models

Riseopedia and Mafiosopedia app reads use `web_view` source views and materialized views.

Riseopedia public/read models use the `web_view.riseopedia_*` prefix.
Mafiosopedia public/read models use the `web_view.mafiosopedia_*` prefix.
Riseopedia admin reads use the `web_view.riseopedia_admin_*` prefix.

The app-facing family is entity-centric. Do not reintroduce old asset-detail compatibility names unless an actual app usage audit proves they are still required.

Core app-facing read models:

```text
web_view.riseopedia_hub_counts
web_view.riseopedia_hub_sections
web_view.riseopedia_hub_classes
web_view.riseopedia_hub_categories
web_view.riseopedia_section_directory_rows
web_view.riseopedia_section_item_browse_rows
web_view.riseopedia_asset_class_directory_rows
web_view.riseopedia_asset_browse_rows
web_view.riseopedia_asset_browse_section_memberships
web_view.riseopedia_entity_detail
web_view.riseopedia_entity_detail_media
web_view.riseopedia_entity_detail_variants
web_view.riseopedia_entity_detail_variant_values
web_view.riseopedia_entity_detail_variant_selectors
web_view.riseopedia_entity_detail_profile_elements
web_view.riseopedia_entity_detail_recipe_outputs
web_view.riseopedia_entity_detail_recipe_requirements
web_view.riseopedia_entity_detail_asset_recipe_links
web_view.riseopedia_entity_detail_relationship_blocks
web_view.riseopedia_entity_detail_dependency_rows
web_view.riseopedia_entity_detail_patch_note_rows
web_view.riseopedia_entity_overview_card_resolved_rules
web_view.riseopedia_entity_overview_card_elements
web_view.riseopedia_media_files
```

Mafiosopedia mirrors this same shape under `web_view.mafiosopedia_*`.

Read-model rules:

```text
read models expose stable app contracts, not raw transform internals
read models must be release/channel-aware
media fields must be safe for the app media helper
common/default variants must not be fabricated
crafting benches must stay folded as asset entities
recipe relationships must come from canonical recipe and relationship tables
properties should be display-ready and driven by game_entity_properties_c + game_entity_property_values
```

---

## 10. Materialized view refresh

Many Riseopedia-family app reads are materialized for performance. After canonical sync changes, after restoring a dump where materialized views were created `WITH NO DATA`, or before UI smoke tests on a freshly restored DB, refresh the relevant read models.

Operator commands:

```sql
SELECT web_priv.game_sync_01_riseopedia_view_refresh();
SELECT web_priv.game_sync_01_mafiosopedia_view_refresh();
```

A combined compatibility wrapper may also be available:

```sql
SELECT web_priv.game_sync_01_view_refresh();
```

Refresh rules:

```text
refresh after canonical sync when the wrapper did not already refresh
refresh before app smoke tests after restore
refresh both channels when shared canonical truth changed
keep refresh order dependency-safe
prefer the provided refresh functions instead of ad-hoc manual REFRESH commands
```

---

## 11. Public app routes

The current public wiki route family is:

```text
/info/riseopedia
/info/riseopedia/browse
/info/riseopedia/sections
/info/riseopedia/sections/[slug]
/info/riseopedia/classes
/info/riseopedia/classes/[slug]
/info/riseopedia/categories
/info/riseopedia/categories/[slug]
/info/riseopedia/subcategories
/info/riseopedia/subcategories/[slug]
/info/riseopedia/entity/[slug]

/info/mafiosopedia
/info/mafiosopedia/browse
/info/mafiosopedia/sections
/info/mafiosopedia/sections/[slug]
/info/mafiosopedia/classes
/info/mafiosopedia/classes/[slug]
/info/mafiosopedia/categories
/info/mafiosopedia/categories/[slug]
/info/mafiosopedia/subcategories
/info/mafiosopedia/subcategories/[slug]
/info/mafiosopedia/entity/[slug]
```

The `/info/[category]` route only accepts supported wiki categories:

```text
riseopedia
mafiosopedia
```

Info routes are DB-gated content routes. They verify that the corresponding public collection/content route exists and is readable before rendering the wiki UI surface.

The shared app dispatcher lives in:

```text
apps/web/src/lib/data/opedia-wiki.ts
```

It dispatches between Riseopedia and Mafiosopedia data helpers while preserving one shared component family.

---

## 12. Public API routes

Current public API families:

```text
apps/web/src/app/api/riseopedia/asset-classes
apps/web/src/app/api/riseopedia/assets
apps/web/src/app/api/riseopedia/assets/[slug]
apps/web/src/app/api/riseopedia/recipes
apps/web/src/app/api/riseopedia/recipes/[slug]
apps/web/src/app/api/riseopedia/sections
apps/web/src/app/api/riseopedia/media/[mediaId]

apps/web/src/app/api/mafiosopedia/asset-classes
apps/web/src/app/api/mafiosopedia/assets
apps/web/src/app/api/mafiosopedia/assets/[slug]
apps/web/src/app/api/mafiosopedia/recipes
apps/web/src/app/api/mafiosopedia/recipes/[slug]
apps/web/src/app/api/mafiosopedia/sections
apps/web/src/app/api/mafiosopedia/media/[mediaId]
```

Public API routes must read through the appropriate `web_view.riseopedia_*` or `web_view.mafiosopedia_*` contracts. Media endpoints must validate media IDs and serve through safe media helpers instead of exposing raw unsafe paths.

---

## 13. Data helpers and component family

Riseopedia data helpers live under:

```text
apps/web/src/lib/data/riseopedia-*.ts
apps/web/src/lib/data/mafiosopedia-*.ts
apps/web/src/lib/data/opedia-wiki.ts
```

Shared helpers live under:

```text
apps/web/src/lib/helpers/riseopedia-entity-links.ts
apps/web/src/lib/helpers/riseopedia-media-files.ts
apps/web/src/lib/helpers/riseopedia-page-params.ts
apps/web/src/lib/helpers/mafiosopedia-entity-links.ts
apps/web/src/lib/helpers/mafiosopedia-media-files.ts
```

Shared UI components live under:

```text
apps/web/src/components/riseopedia/*
```

The component family intentionally uses the Riseopedia name even when rendering Mafiosopedia. Channel-specific behavior should be passed through explicit wiki config/props, not by duplicating the whole component family.

Current main shared components include:

```text
RiseopediaHub
RiseopediaDirectoryPage
RiseopediaEntityBrowser
RiseopediaEntityCard
RiseopediaEntityDetailClient
RiseopediaEntityBodyContent
RiseopediaEntityRecipeTree
RiseopediaEntityFooterBlocks
RiseopediaOverviewTable
RiseopediaMediaFrame
RiseopediaFilterBar
RiseopediaSearchBox
RiseopediaPager
```

Deprecated compatibility component shells such as `RiseopediaAssetBrowser.tsx` and `RiseopediaSectionBrowser.tsx` should stay removed unless a real active import requires them.

---

## 14. Admin domain

Riseopedia admin is an active admin domain:

```text
apps/web/src/app/admin/riseopedia/*
apps/web/src/app/api/admin/riseopedia/*
apps/web/src/components/admin/riseopedia/*
apps/web/src/lib/data/riseopedia-admin.ts
apps/web/src/lib/server/riseopedia-admin-api.ts
```

Admin APIs must guard themselves, validate input, use same-origin mutation protection where applicable, and call guarded `web_api.riseopedia_*` functions for writes.

Admin reads use `web_view.riseopedia_admin_*` contracts.

Active admin families include:

```text
sections
section classification rules
display profiles
display profile bindings
display profile properties/elements
display profile variant selectors
overview card rule sets
overview card rule elements
overview card placements/display slots
relationship display rules
patch publication channels
patch publications
patch scope overrides
release decisions
release evidence
release overrides
property catalog inspection/options
metadata/lookup bundles
```

Riseopedia admin should follow the normal admin table/panel rules:

```text
list routes return rows
single-row routes return doc
successful mutations return ok: true
panels separate topError, metaError, submitting, and metaLoading
failed saves do not call onSaved or auto-close
small compact families may use local table-owned search/pagination
larger/operational families may use query-param/server-driven state
```

---

## 15. Sections

Sections are manually governed public grouping surfaces for wiki browsing.

Core objects:

```text
web_priv.riseopedia_sections
web_priv.riseopedia_section_classification_rules
web_view.riseopedia_admin_sections
web_view.riseopedia_admin_section_classification_rules
web_view.riseopedia_hub_sections
web_view.riseopedia_section_directory_rows
web_view.riseopedia_section_item_browse_rows
web_view.riseopedia_asset_browse_section_memberships
```

Section rules map entity type/class/category/subcategory combinations into browseable sections. Saved section behavior should be visible and manageable in admin; app-facing section output should be generated by read models, not by UI-side taxonomy logic.

---

## 16. Display profiles

Display profiles control detail-page presentation by channel and entity scope.

Core objects:

```text
web_priv.riseopedia_display_profiles
web_priv.riseopedia_display_profile_bindings
web_priv.riseopedia_display_profile_properties
web_priv.riseopedia_display_profile_variant_selectors
web_priv.riseopedia_display_slots_c
web_priv.riseopedia_builtin_display_fields_c
web_priv.riseopedia_display_element_source_types_c
web_view.riseopedia_entity_detail_profile_elements
web_view.riseopedia_entity_detail_variant_selectors
```

Display profile rules:

```text
profiles are channel-aware
bindings select the best profile for entity type/class/category/subcategory
properties/elements decide which built-in fields or property values render in detail slots
variant selectors decide which variant dimensions are exposed in the UI
property-backed elements come from canonical property catalog/value read models
missing/unresolved values should be handled intentionally, not hidden by route code
```

---

## 17. Overview cards

Overview cards control browse/hub card summary fields.

Core objects:

```text
web_priv.riseopedia_overview_card_rule_sets
web_priv.riseopedia_overview_card_rule_elements
web_priv.riseopedia_overview_card_placements_c
web_priv.riseopedia_overview_card_display_slots_c
web_priv.riseopedia_overview_card_modes_c
web_view.riseopedia_entity_overview_card_resolved_rules
web_view.riseopedia_entity_overview_card_elements
```

Rules:

```text
rule sets are channel-aware
placements define where rules apply, such as hub or browse surfaces
resolved rules choose the best matching rule set for an entity/context
card elements expose compact display-ready fields
browse components consume resolved read-model rows instead of hardcoding per-class card layouts
```

---

## 18. Properties

Properties are canonical, typed, queryable, displayable facts.

Property metadata lives in:

```text
web_priv.game_entity_properties_c
```

Property values live in:

```text
web_priv.game_entity_property_values
```

Riseopedia display reads use profile/profile-element read models over this canonical property foundation.

Property rules:

```text
raw source payloads are evidence, not normal public properties
media paths are not normal properties
brands are not generic properties
rarity is not a generic property
arrays/objects should be exploded only when meaningful for display/filtering/analytics
variant-specific source-derived properties should preserve entity_variant_id and source mapping linkage
XER/-2 values are review/error evidence, not normal user-facing values
```

---

## 19. Variants and rarity

Variants represent concrete source-backed versions of an entity.

Important variant dimensions include:

```text
body
color
cut
denomination
edition
rarity
tier
```

Rules:

```text
rarity is stored as an entity variant value
common is valid only when a real common variant exists
if common is absent, read models may choose a real available source-backed variant, but must not fabricate common
variant selectors expose user-meaningful dimensions on detail pages
variant-specific media/properties/relationships should stay attached to the relevant variant when known
```

Required QA idea:

```text
displayed common without common variant = 0
```

---

## 20. Media

Media is canonical game media, not a normal property.

Core objects:

```text
web_priv.game_entity_media_r
web_priv.game_media
web_priv.game_media_files
web_view.riseopedia_entity_detail_media
web_view.riseopedia_media_files
web_view.mafiosopedia_entity_detail_media
web_view.mafiosopedia_media_files
```

Rules:

```text
app media helpers build safe media URLs from media file IDs
raw source paths are not durable public identity
variant-specific media should preserve source mapping evidence
hero/detail media can prefer detail media first, then icon media, according to read-model ordering
media endpoints must validate IDs and serve only allowed files
```

---

## 21. Recipes and relationships

Recipes are first-class entities and also have recipe-domain rows.

Core recipe objects:

```text
web_priv.game_recipes
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
web_priv.game_recipe_generic_connections_r
web_priv.game_recipe_catalysts_r
```

Core relationship object:

```text
web_priv.game_entity_relationships_r
```

Read models:

```text
web_view.riseopedia_entity_detail_recipe_outputs
web_view.riseopedia_entity_detail_recipe_requirements
web_view.riseopedia_entity_detail_asset_recipe_links
web_view.riseopedia_entity_detail_relationship_blocks
web_view.riseopedia_entity_detail_dependency_rows
```

Rules:

```text
recipe class comes from resolved outputs
recipe category/subcategory come from bench family and minimum tier/no_tier_required
recipe generic resources use game_recipe_generic_* tables, not asset grouping
relationship blocks are generated from canonical relationships and display rules
used-in/crafted-by surfaces should be release/channel-aware
```

---

## 22. Patch notes and history

Patch notes come from canonical history/change facts.

Important objects include:

```text
web_priv.game_entity_patch_changes_f
web_view.riseopedia_entity_detail_patch_note_rows
web_view.mafiosopedia_entity_detail_patch_note_rows
```

Rules:

```text
patch changes should use history tables and canonical comparisons
patch changes should not double-count calculated/source-property reversals as two contradictory changes
patch notes should be entity/variant/source-aware where the underlying fact is variant/source-specific
first-patch introduced rows should be generated intentionally, not by raw source row markers alone
```

---

## 23. Access and first render behavior

Riseopedia and Mafiosopedia are rendered through DB-gated `/info` content routes.

Public surfaces must not rely on stale actor access. Current auth/access rules require:

```text
Discord login sync completes before a usable session is accepted
server-rendered menu/content routes refresh role cache when due before granting gated access
if role refresh is due and fails, gated access fails closed instead of trusting stale privileged access
```

Use `docs/auth_access_model.md` for the complete auth/access model.

---

## 24. Styling

Riseopedia UI structure/state/data lives in TS/TSX. Visual styling lives in CSS.

Main stylesheet:

```text
apps/web/src/styles/riseopedia.css
```

Rules:

```text
do not hardcode visual tokens in TS/TSX
inline style is forbidden except documented runtime/computed exceptions
shared reusable UI belongs in components/ui when it is not Riseopedia-specific
Riseopedia components may own Riseopedia-specific semantic structure and composition
```

---

## 25. Operator runbook

Typical full patch rebuild:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Refresh read models when needed:

```sql
SELECT web_priv.game_sync_01_riseopedia_view_refresh();
SELECT web_priv.game_sync_01_mafiosopedia_view_refresh();
```

After changes, verify at least:

```text
app DB references still use only web_view/web_api
no missing referenced web_view/web_api objects
materialized views are populated after restore
hub counts are non-zero and release-aware
media endpoints return safe files only
fake displayed common without common variant = 0
crafting_bench entity_type rows = 0
recipe relationship/read surfaces are populated
release blockers are visible in evidence/decision rows
public/info routes 404 when DB-gated route content is not readable
```

---

## 26. Acceptance checklist

Riseopedia-family work is acceptable when:

```text
no app logs for missing web_view.riseopedia_* or web_view.mafiosopedia_* relations
no app media safety errors from invalid media IDs
hub counts are non-zero and release-aware
crafting bench assets remain folded correctly
higher-rarity-only assets do not display fake common/default variants
recipe used-in/crafted-by surfaces are populated and release-aware
property detail surfaces are driven by game_entity_properties_c and game_entity_property_values
public Riseopedia and Mafiosopedia routes use DB-gated /info behavior
admin routes guard themselves and write through web_api.riseopedia_*
app code does not directly read web_priv/game_data/web_analytics
cm_client grants remain narrow and intentional
materialized views are refreshed after restore or canonical sync changes
```

---

## 27. Transform model reference

This section fully absorbs the former `docs/game_data_transform_model.md`. It defines how imported source metadata, transform configuration, value maps, identity rules, variants, source links, classifications, relationships, media, properties, names, brands, release evidence, canonical output tables, dependency flow, ID preservation, retired objects, and QA expectations work for Riseopedia/Mafiosopedia.

### Purpose

This document describes the current Corn Mafia / Riseopedia game-data transform model.

The game-data stack is DB-first and table-driven:

```text
game_data raw imports + transform configuration
	-> web_priv canonical private truth
	-> web_view app-facing read contracts
	-> web_analytics QA / audit surfaces
```

`game_data` is not final truth. It stores source metadata, source rows, discovery evidence, and transform rules. `web_priv` is the canonical private game model. App code must not directly CRUD `game_data` or `web_priv`; public/member/admin reads should use `web_view` or approved read functions, and app writes should use guarded `web_api` functions.

Use this file for transform-model design. Use `docs/riseopedia.md` for runnable sync functions, execution order, source-data handling rules, and operator commands.

---

### Current schemas and responsibilities

| Schema | Responsibility |
|---|---|
| `game_data` | Raw import metadata, source-file definitions, source discovery, transform rules, source-link resolver rules, value maps, and rule configuration. |
| `web_priv` | Canonical private truth: entities, variants, source mappings, taxonomy, recipes, relationships, media, properties, release facts, history, patch changes, and sync helpers. |
| `web_view` | App/public/admin read contracts. Riseopedia reads from this layer. |
| `web_api` | Guarded mutation surface for app/admin workflows. |
| `web_analytics` | QA, diagnostics, audits, and operational checks. |

The transform tables use the suffix `_c` because they are configuration/reference tables, not generated canonical facts.

---

### Current source-file model

`game_data.game_transform_source_files_c` declares imported source files and what each file is allowed to create or enrich.

Current source role families:

| Source role | Meaning |
|---|---|
| `owner` | Source rows can create canonical entities, variants, source mappings, properties, and media. |
| `enricher` | Source rows attach to an owner entity/variant through source links and add properties/media/names/brand data. |
| `recipe_source` | Source rows create recipe entities and recipe connection facts. |
| `relationship_source` | Source rows exist mainly as target/reference dictionaries for links and relationships. |
| `ignored` | Source file is registered but intentionally not materialized. |

Current active/materialized source files include:

```text
dt_inventory_items                 owner asset
dt_vehicle_data                    owner asset
dt_build_part_material_details     owner asset
dt_craft_benches                   owner asset
dt_building_items_modern           owner asset
dt_building_items_mountain_cabin   owner asset
dt_building_items_holiday_2025     owner asset
dt_building_items_fall_harvest_2025 owner asset
dt_building_items_neon_city        owner asset
dt_building_items_retro_pop        owner asset

dt_weapon_details                  enricher asset
dt_building_items_crafting_system  enricher asset
dt_consumable_details              enricher asset
dt_backpack_details                enricher asset
dt_outfit_details                  enricher asset
dt_avatar_cosmetics_outfit         enricher asset
dt_avatar_cosmetics_feet           enricher asset
dt_avatar_cosmetics_head           enricher asset

dt_craft_recipes                   recipe_source recipe

dt_effects                         relationship_source
dt_craft_perks                     relationship_source
```

Ignored source files are allowed to stay registered. They must not emit canonical rows unless their role and rules are deliberately changed.

---

### Global conventions

#### Sentinel values

| Sentinel | Numeric | Meaning |
|---|---:|---|
| `XNA` | `-1` | Source did not provide a usable value, or the value is intentionally unavailable. |
| `XER` | `-2` | Source provided a value or reference, but transform/resolution failed. |
| `uncategorized` | n/a | Valid taxonomy value. It is not an error sentinel. |

Rules:

```text
XNA/-1 = missing/not applicable/not available
XER/-2 = unresolved/error/failure
uncategorized = valid bucket, not a failure
```

Do not add family-specific missing/error columns just to restate `XNA` and `XER`. Executors should apply these sentinels consistently.

#### Value maps

All aliases, enum cleanup, dirty source values, source-row exceptions, and taxonomy/value translations should use:

```text
game_data.game_transform_value_maps_c
game_data.game_transform_value_map_entries_c
```

Do not reintroduce family-specific alias tables unless there is a strong reason. Rule families should reference `value_map_code`.

Use value maps for exceptions and vocabulary mismatches, not as giant duplicated lists of every valid source value.

#### Rule pattern

Most transform subsystems follow this grammar:

```text
rule header = what strategy is being applied
rule parts  = source fields, predicates, extraction pieces, filters, transforms, calculations, joins, or sort/aggregate behavior
value maps  = optional shared aliases/exceptions
priority    = functional rule order
active_flag = enable/disable
metadata_json = traceability only, not hidden execution logic
```

Do not hide executable rules in JSON when typed columns can express them.

---

### Current taxonomy model

#### Entity types

Current canonical entity types:

```text
asset
recipe
```

The old `crafting_bench` entity type is retired. Crafting benches are assets:

```text
entity_type_code = asset
entity_class_code = crafting_bench
```

#### Entity classes

Current class codes:

```text
xna
xer
ammunition
building_item
building_material
consumable
crafting_bench
currency
outfit
quest_item
resource
tool
uncategorized
vehicle
weapon
```

`xna` and `xer` are sentinel taxonomy rows. `uncategorized` is a normal taxonomy row.

#### Categories and subcategories

`web_priv.game_entity_categories_c` and `web_priv.game_entity_subcategories_c` contain canonical category/subcategory rows used by both assets and recipes.

Important behavior:

```text
building items use source set/furniture family taxonomy
crafting benches use asset class crafting_bench, category = bench family, subcategory = tier/no tier where applicable
vehicles use source vehicle class/category and raw vehicle brand/model-style subcategory where applicable
recipes derive class primarily from resolved output assets
recipes derive category/subcategory primarily from required bench/tier policy
```

Do not encode source-specific display prefixes into canonical subcategory codes unless it is a deliberate taxonomy change.

#### Variant groups

Current variant groups:

```text
body
color
cut
denomination
edition
rarity
tier
```

Rarity is a variant group, not an asset table. Do not recreate `game_asset_rarities_c`.

Rules:

```text
create concrete variants only when source/rules support them
do not invent fake common/default variants
use entity_variant_id for canonical variant links
use source mappings as evidence, not public identity
```

---

### Current `game_data` transform tables

#### Source metadata and source discovery

```text
game_transform_source_files_c
game_transform_source_file_aliases_c
game_transform_source_identifier_fields_c
game_transform_property_source_paths_c
game_transform_property_array_value_candidates_c
```

Purpose:

```text
register source files
normalize source file stems/aliases
identify source-row key fields
record discovered source property/media/relationship paths
record discovered array/object expansion candidates
```

Source discovery tables are evidence/review surfaces. They are not canonical output.

#### Shared value-map tables

```text
game_transform_value_maps_c
game_transform_value_map_entries_c
```

Used by identity, variants, source links, classification, media, names, brands, properties, and null handling.

#### Identity and variants

```text
game_transform_entity_identity_rules_c
game_transform_entity_identity_rule_parts_c
game_transform_entity_variant_rules_c
game_transform_entity_variant_rule_parts_c
```

Identity rules build canonical entity keys. Variant rules build concrete variant dimensions/values.

Identity is not naming. Identity answers:

```text
What canonical entity is this source row?
```

Naming answers:

```text
What should users see/search for?
```

#### Source links and entity groups

```text
game_transform_entity_groups_c
game_transform_entity_group_members_c
game_transform_source_links_c
game_transform_source_link_keys_c
game_transform_source_link_key_parts_c
```

Source links are the central resolver. They answer:

```text
Given source row A and source reference value X, what source row/entity/group does it reference?
```

Current link families:

```text
craft_bench_building_item_same_variant
craft_recipe_bench_ref
weapon_detail_inventory_weapon_same_entity
weapon_detail_ammo_entity_ref
consumable_detail_inventory_item_same_variant
consumable_detail_effect_ref
backpack_detail_inventory_item_same_variant
outfit_detail_inventory_item_same_entity
avatar_cosmetic_outfit_inventory_item_same_entity
avatar_cosmetic_feet_inventory_item_same_entity
avatar_cosmetic_head_inventory_item_same_entity
recipe_component_inventory_item_ref
recipe_component_entity_group_ref
recipe_output_inventory_item_ref
recipe_required_perk_ref
```

Every source-link attempt should resolve to one of:

```text
source_file
entity_group
valid_no_target
unresolved
```

`valid_no_target` means the source value is intentionally handled and should not create a relationship. `unresolved` means source input existed but resolution failed; use `XER` behavior and QA/release evidence where appropriate.

#### Classification

```text
game_transform_classifications_c
game_transform_classification_rules_c
game_transform_classification_rule_parts_c
```

Current classification targets:

```text
asset_class
asset_category
asset_subcategory
recipe_class
recipe_category
recipe_subcategory
```

Classification rules assign taxonomy by source fields, static file rules, resolved output assets, resolved bench/perk links, candidate pools, and fallback policy.

Recipe classification is relationship-aware:

```text
recipe class       = resolved from output asset classification
recipe category    = required bench family / bench policy
recipe subcategory = required bench tier or no-tier policy
```

Do not force recipe classification into simple source-field mapping if the output/bench relationship is the actual source of truth.

#### Relationship taxonomy and emit rules

```text
game_transform_relationship_types_c
game_transform_relationship_endpoint_roles_c
game_transform_relationship_connections_c
```

Relationship connections map resolved source links to canonical relationship facts. Source links resolve endpoints; relationship connections define what those endpoints mean.

Current relationship connection families:

```text
recipe_component_inventory_item_relationship
recipe_component_entity_group_relationship
recipe_output_inventory_item_relationship
craft_recipe_bench_relationship
recipe_required_perk_relationship
weapon_ammunition_relationship
consumable_effect_relationship
```

Do not emit canonical relationships from same-entity/enricher links unless a rule explicitly says the link is relationship-producing.

#### Media

```text
game_transform_source_media_rules_c
game_transform_source_media_rule_parts_c
game_transform_media_cascade_rules_c
```

Source media rules extract media references from owner/enricher source rows. Media cascade rules decide which media wins for app roles and how fallback/inheritance works.

Recipe media policy:

```text
1. direct recipe media if source provides it
2. one resolved output asset media
3. output asset media after excluding outputs also used as inputs
4. XNA when no usable media candidate exists
```

Do not duplicate media files when a recipe inherits output media. Reuse canonical media rows.

#### Properties

```text
game_transform_property_targets_c
game_transform_source_property_rules_c
game_transform_source_property_rule_parts_c
game_transform_property_null_rules_c
game_transform_property_value_link_rules_c
```

`game_transform_property_targets_c` defines canonical property catalog intent. Current property target codes include:

```text
added_inventory_slots
added_slots
ammo_type
attributes_comfort
attributes_nutrition
attributes_science
attributes_toxicity
base_damage
base_effective_range
base_firing_rate
base_mag_capacity
base_max_range
bench_type
build_part_cost
building_kit
bullet_spread
bullets_per_shot
cargo_space
color_name
consumed_ammo_per_shot
crafting_tier
description_localized_string
duration
effect_drinking
effect_drunk
effect_eating
effect_healing
effect_instant_damage
effect_restore_health
inventory_size
inventory_value
item_description_localized_string
item_slogan_text_localized_string
jetpack_drain_duration
jetpack_lift_multiplier
jetpack_recharge_duration
max_connected_players
performance_values_0
performance_values_1
performance_values_2
performance_values_3
required_perk
sell_value
specialisation_0
vehicle_class
vehicle_model
year
xp
```

Property rules can be direct source extraction, linked/enricher extraction, array/object expansion, or calculated from another property. The optimized current property candidate executor supports `cm.game_property_rule_mode`:

```text
all
base
source_property
```

The sync uses this to run base/direct properties first and calculated `source_property` rules second without rerunning the full property transform twice.

Property value links are intentionally exact-only. Current link rules:

```text
weapon_ammunition_property_link      ammo_type -> uses_ammunition target
craft_recipe_bench_type_property_link bench_type -> recipe_requires_bench target
```

If one property value resolves to multiple possible relationship targets, the link is skipped. Do not create multiple property-value links for one scalar property value.

#### Names and name overrides

```text
game_transform_entity_name_rules_c
game_transform_entity_name_rule_parts_c
game_transform_entity_name_overrides_c
```

Name rules build display/search names. Name overrides are explicit canonical-entity-key overrides.

Rules:

```text
identity keys are stable canonical keys, not display names
name rules should prefer explicit localized/display fields where available
fallback humanized source-row names are allowed but QA-visible
```

#### Brands

```text
game_transform_entity_brand_rules_c
```

Brand rules extract brand values from source fields and attach them to canonical entities. Use value maps for brand aliases and cleanup.

#### Release evidence

```text
game_transform_entity_release_evidence_rules_c
```

Release evidence rules define scoring and blocker semantics. Current evidence is defined for both `asset` and `recipe`.

Scoring convention:

```text
+30  very strong positive
+20  strong positive
+10  normal positive
+5   weak positive

-10  weak warning
-50  normal negative
-100 serious error
-250 strong dev/test/error signal
-1000 absolute blocker
```

All blockers must use `score_delta = -1000`.

Recipe input/output failures are hard blockers:

```text
recipe_input_asset_xna
recipe_input_asset_xer
recipe_output_asset_xna
recipe_output_asset_xer
recipe_missing_all_inputs
recipe_missing_all_outputs
```

`AllBenches + Tier1` policy can be valid no-target and must not be treated as missing/unresolved by itself.

---

### Current `web_priv` canonical output tables

#### Identity and domains

```text
game_entities
game_assets
game_recipes
```

`game_entities` is cross-domain identity. `game_assets` and `game_recipes` are domain detail tables.

Stable identity keys:

```text
game_entities: entity_type_code + canonical_entity_key
game_assets: canonical_asset_key / entity_id
game_recipes: recipe_key / entity_id
```

These tables must preserve IDs for the same logical element across reruns and patches.

#### Taxonomy

```text
game_entity_types_c
game_entity_classes_c
game_entity_categories_c
game_entity_subcategories_c
```

#### Variants and source mappings

```text
game_entity_variant_groups_c
game_entity_variant_value_codes_c
game_entity_variants_r
game_entity_variant_values_r
game_entity_variant_source_mappings_r
game_entity_variant_aliases
```

`game_entity_variant_source_mappings_r` is the bridge from source/import rows to canonical entity/variant IDs.

#### Names, brands, media, properties

```text
game_entity_brands_c
game_entity_brand_links_r
game_media
game_media_files
game_entity_media_r
game_entity_properties_c
game_entity_property_values
game_entity_property_value_links_r
```

`game_entity_properties_c` is the canonical property catalog/availability matrix. `game_entity_property_values` stores actual values. `game_entity_property_value_links_r` links exact scalar property values to canonical target entities/variants when there is exactly one target.

#### Recipes and relationships

```text
game_recipe_components_r
game_recipe_outputs_r
game_recipe_generic_connections_r
game_recipe_catalysts_r
game_recipe_generic_group_types_c
game_recipe_generic_groups_c
game_entity_relationships_r
```

Recipe connection tables are patch-scoped. Their unique identity must include `patch_id`, because the same recipe/component/output edge can legitimately appear in multiple patches.

`game_entity_relationships_r` is the canonical relationship graph derived from recipe connections and relationship-producing source links.

#### Release, history, patch changes

```text
game_entity_release_evidence_f
game_entity_release_decisions_f
game_entity_release_states_c
game_entity_release_overrides
game_patch_publications
game_patch_publication_channels_c
game_patch_publication_scope_overrides
game_*_h
game_entity_patch_changes_f
```

History tables are patch snapshots generated by `web_priv.game_sync_patch_history(...)`.

`game_entity_patch_changes_f` is generated from history tables, not raw `game_data.import_rows_f.row_change_code`.

---

### ID-preserving sync rule

All linkable/generated canonical tables must sync with this pattern:

```text
1. Build candidate set.
2. UPDATE existing generated rows by natural key when values changed.
3. INSERT only candidates not already represented by the natural key.
4. DELETE generated rows in scope only when no candidate remains.
5. Never delete/reinsert rows that still represent the same logical element.
```

This rule applies to:

```text
game_entities
game_assets
game_recipes
game_entity_variants_r
game_entity_variant_values_r
game_entity_variant_source_mappings_r
game_recipe_components_r
game_recipe_outputs_r
game_recipe_generic_connections_r
game_recipe_catalysts_r
game_entity_relationships_r
game_entity_property_values
game_entity_property_value_links_r
```

A row may be deleted only when the source candidate is genuinely missing in the scoped patch/source/rule run. Manual rows and overrides must not be removed by generated sync unless explicitly designed.

---

### Dependency flow

Safe full-patch materialization flow:

```text
1. Source rows / imports already loaded
2. Asset entities
3. Asset variants
4. Asset source mappings
5. Asset aliases / names / classifications / brands / media / properties
6. Recipe entities
7. Recipe variants
8. Recipe source mappings
9. Recipe aliases / names / classifications / brands / media / properties
10. Recipe connections
11. Entity relationships
12. Exact property-value links
13. Release evidence
14. Release decisions
15. Patch history
16. Entity patch changes
17. web_view materialized read models where required
```

Functional dependency rule:

```text
Recipe sync requires asset identities, variants, and source mappings first, because recipe components, outputs, benches, perks, and media/classification all resolve through asset/source-link state.
```

---

### Retired / replaced objects

Do not reintroduce these retired families:

```text
game_asset_aliases
game_asset_source_mappings_r
game_asset_brands_c
game_asset_brand_links_r
game_asset_rarities_c
game_variant_groups_c
game_variant_values_c
game_recipe_catalyst_requirements_r
game_recipe_generic_requirement_* tables
game_entity_property_expectations_r
game_transform_entity_ref_aliases_c
game_transform_entity_ref_resolution_rules_c
game_transform_entity_relationship_rules_c
game_transform_entity_source_merge_rules_c
game_transform_recipe_generic_ref_aliases_c
game_transform_recipe_output_semantic_rules_c
game_transform_entity_classification_rules_c
game_transform_classification_value_maps_c
game_transform_classification_value_map_entries_c
game_transform_source_link_key_part_aliases_c
game_transform_entity_identity_aliases_c
game_transform_media_reference_rules_c
game_transform_media_role_rules_c
game_transform_property_mapping_rules_c
game_transform_property_null_values_c
game_transform_property_value_text_rules_c
game_transform_calculation_rules_c
```

The replacements are shared value maps, source links, relationship connections, rule headers + rule parts, and canonical `game_entity_*` tables.

---

### QA expectations

Every transform family should have QA for:

```text
missing referenced source_file_code
missing referenced source_link_code
missing referenced value_map_code
inactive referenced maps/rules
rules without required parts
duplicate active rule codes
source links without unresolved fallback where unresolved is possible
relationship-producing source links without relationship connections
classification rules producing missing taxonomy values
property rules missing property targets
property values with duplicate scalar natural keys
property-value links with multiple rows per source property value/link role
recipe connection duplicate natural keys within a patch
recipe input/output XNA/XER blockers
media cascade missing candidate rules
release blockers not using -1000
orphan patch-change rows
history not populated for promoted patches
```

App UI should not directly query `game_data` transform tables.

---

## 28. Source-data handling reference

This section fully absorbs the former `docs/game_data_handling.md`. It defines how raw game imports, transform rules, canonical truth, read models, properties, media, recipes, relationships, release decisions, and history must be handled for Riseopedia/Mafiosopedia.

### Purpose

This section defines practical handling rules for Corn Mafia game-data imports, canonical materialization, Riseopedia read models, and future sync changes.

Use this unified document together with `docs/codebase_rules.md` for SQL/code style.

---

### 1. Boundary rule

The stack is source-to-canonical-to-read-model:

```text
game_data raw imports + transform rules
	-> web_priv canonical private game truth
	-> web_view app-facing read contracts
	-> web_analytics QA/audit surfaces
```

App code must not directly read/write `game_data` or directly CRUD `web_priv`.

Runtime role:

```text
cm_client
```

Owner/migration role:

```text
cm
```

---

### 2. Stable identity rule

Use these as durable canonical IDs:

```text
entity_id
entity_variant_id when a concrete variant is known
recipe_id within recipe-domain tables
asset_id within asset-domain tables
```

Do not use these as durable public identity:

```text
raw source row name
raw source file stem
source mapping id by itself
alias id
rarity code by itself
variant key by itself
media source path by itself
```

Generated rows that are linkable must preserve IDs by update/insert/delete-missing, not delete/reinsert.

---

### 3. Canonical entity model

Current entity types:

```text
asset
recipe
```

Retired:

```text
crafting_bench as entity type
```

Crafting benches are assets:

```text
entity_type_code = asset
entity_class_code = crafting_bench
```

`web_priv.game_entities` is the cross-domain identity table. `web_priv.game_assets` and `web_priv.game_recipes` are domain tables.

---

### 4. Taxonomy handling

Canonical taxonomy tables:

```text
web_priv.game_entity_classes_c
web_priv.game_entity_categories_c
web_priv.game_entity_subcategories_c
```

Current class codes:

```text
ammunition
building_item
building_material
consumable
crafting_bench
currency
outfit
quest_item
resource
tool
uncategorized
vehicle
weapon
xna
xer
```

Rules:

```text
uncategorized is valid taxonomy
xna means missing/not applicable source data
xer means unresolved/error source data
recipe class is derived from outputs
recipe category/subcategory are derived from bench/tier policy
vehicle subcategory should not be polluted with class/category prefixes
```

---

### 5. Variant handling

Variant tables:

```text
web_priv.game_entity_variant_groups_c
web_priv.game_entity_variant_value_codes_c
web_priv.game_entity_variants_r
web_priv.game_entity_variant_values_r
web_priv.game_entity_variant_source_mappings_r
web_priv.game_entity_variant_aliases
```

Current variant groups:

```text
body
color
cut
denomination
edition
rarity
tier
```

Rules:

```text
rarity is a variant value
no fake/common variants without source support
variant source mappings are evidence and resolver glue
variant-specific media/properties/relationships should carry entity_variant_id when known
```

---

### 6. Source-link handling

Source links resolve references and ownership before downstream systems use them.

Current source-link result modes:

```text
source_file
entity_group
valid_no_target
unresolved
```

Rules:

```text
valid_no_target is intentional and does not emit a relationship
unresolved must be visible to QA/release evidence
same-entity/enricher links attach data and usually do not emit relationships
relationship-producing links require game_transform_relationship_connections_c rows
```

---

### 7. Recipe handling

Recipe source:

```text
dt_craft_recipes
```

Recipe facts:

```text
game_recipe_components_r
game_recipe_outputs_r
game_recipe_generic_connections_r
game_recipe_catalysts_r
```

Rules:

```text
recipe connection rows are patch-scoped
same connection can exist in multiple patches
unique natural keys must include patch_id
component/output XNA/XER is a release blocker
AllBenches + Tier1 policy can be valid no-target
```

Recipe classification:

```text
class from resolved output asset classification
category/subcategory from required bench/tier policy
```

---

### 8. Relationship handling

Canonical graph table:

```text
web_priv.game_entity_relationships_r
```

Generated from:

```text
recipe connections
relationship-producing source links
relationship connection rules
```

Rules:

```text
preserve entity_relationship_id for unchanged logical edges
emit inverse relationships only when configured
source and target endpoint roles must match relationship type semantics
do not multiply broad/group relationships into property-value links unless the property link resolves exactly one target
```

---

### 9. Property handling

Catalog:

```text
web_priv.game_entity_properties_c
```

Values:

```text
web_priv.game_entity_property_values
```

Exact links:

```text
web_priv.game_entity_property_value_links_r
```

Transform sources:

```text
game_transform_property_targets_c
game_transform_source_property_rules_c
game_transform_source_property_rule_parts_c
game_transform_property_null_rules_c
game_transform_property_value_link_rules_c
```

Rules:

```text
0 is not globally null; null handling is property/source scoped
-1/XNA means not available/missing
-2/XER means transform or resolution failure
calculated properties can depend on existing source_property values
property sync must preserve entity_property_value_id
property-value links require exactly one target per property value + link role
```

---

### 10. Media handling

Canonical media tables:

```text
web_priv.game_media
web_priv.game_media_files
web_priv.game_entity_media_r
```

Rules:

```text
source media rules extract candidates
cascade rules decide role/fallback
recipe media can inherit from output asset media
media files should not be duplicated when a reference can be shared
variant media should preserve source mapping/variant evidence
```

---

### 11. Names and brands

Names:

```text
game_transform_entity_name_rules_c
game_transform_entity_name_rule_parts_c
game_transform_entity_name_overrides_c
```

Brands:

```text
game_transform_entity_brand_rules_c
web_priv.game_entity_brands_c
web_priv.game_entity_brand_links_r
```

Rules:

```text
names are display/search text, not identity
identity keys must not depend on mutable display strings
brand cleanup should use shared value maps
```

---

### 12. Release and publication handling

Evidence dictionary:

```text
game_transform_entity_release_evidence_rules_c
```

Facts and decisions:

```text
web_priv.game_entity_release_evidence_f
web_priv.game_entity_release_decisions_f
web_priv.game_entity_release_states_c
web_priv.game_entity_release_overrides
```

Rules:

```text
blockers override score
all blockers use score_delta = -1000
manual overrides stay separate from generated evidence
recipe input/output XNA/XER is blocker-grade
```

---

### 13. History and patch changes

History tables:

```text
game_entities_h
game_assets_h
game_recipes_h
game_media_h
game_media_files_h
game_entity_variants_r_h
game_entity_variant_values_r_h
game_entity_variant_source_mappings_r_h
game_entity_media_r_h
game_entity_relationships_r_h
game_recipe_generic_connections_r_h
game_recipe_catalysts_r_h
game_recipe_components_r_h
game_recipe_outputs_r_h
game_entity_property_values_h
```

Patch changes:

```text
web_priv.game_entity_patch_changes_f
web_view.riseopedia_entity_detail_patch_note_rows
```

Rules:

```text
history is generated from canonical current state after sync
patch changes are generated by comparing history snapshots
raw import row_change_code is not the source of truth for app patch notes
variant-scoped changes should carry entity_variant_id when the changed fact is variant-specific
```

---

### 14. Riseopedia read handling

Riseopedia app reads from `web_view`, especially materialized views such as:

```text
riseopedia_asset_browse_rows
riseopedia_entity_detail
riseopedia_entity_detail_media
riseopedia_entity_detail_variants
riseopedia_entity_detail_variant_values
riseopedia_entity_detail_profile_elements
riseopedia_entity_detail_recipe_outputs
riseopedia_entity_detail_recipe_requirements
riseopedia_entity_detail_relationship_blocks
riseopedia_entity_detail_dependency_rows
riseopedia_entity_detail_patch_note_rows
riseopedia_entity_overview_card_elements
riseopedia_section_item_browse_rows
riseopedia_media_files
```

Do not make components reach around `web_view` into private tables.

---

### 15. Do not do this

Do not:

```text
hardcode source-file-specific game rules in app code
silently drop unresolved source refs
use uncategorized as an error sentinel
recreate asset-specific retired tables
invent fake common/default variants
make recipes public when required input/output refs are XNA or XER
delete/reinsert ID-sensitive generated rows when unchanged
use metadata_json to hide executable transform logic
directly CRUD web_priv from app code
```

## 29. Source sync pipeline reference

This section fully absorbs the former `docs/game_sync_pipeline.md`. It defines the runnable `game_data -> web_priv -> web_view` pipeline, dependency order, granular functions, history, patch-change generation, profiling, and materialized view refresh expectations.

### Purpose

This section describes the current runnable game sync functions, dependency order, ID-preserving rules, historization, patch-change generation, and profiling expectations.

Transform-table design is included in the transform model reference above. Operator commands are included in the patch runbook section below.

---

### Main entry point

Canonical full sync entry point:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Signature:

```sql
web_priv.game_sync_patch(
	p_patch_code text,
	p_entity_type_code text DEFAULT NULL,
	p_source_file_code text DEFAULT NULL,
	p_include_history boolean DEFAULT true,
	p_include_patch_changes boolean DEFAULT true
)
```

Return shape is JSONB with:

```text
ok
patch_code
patch_id
full_patch_run
steps[]
```

The wrapper validates the patch code and entity type, runs granular functions in dependency order, and only runs history/patch-change generation for full patch runs unless explicitly changed later.

---

### Dependency order

The wrapper intentionally resolves assets before recipes.

Reason:

```text
Recipes reference assets as inputs, outputs, benches, required perks, and sometimes derived display/media/classification targets. Therefore recipe sync cannot be correct until asset identity, variants, and source mappings exist.
```

Current high-level order:

```text
1. asset entities
2. asset variants
3. asset source mappings
4. asset aliases
5. asset names
6. asset classifications
7. asset brands
8. asset media
9. asset properties
10. recipe entities
11. recipe variants
12. recipe source mappings
13. recipe aliases
14. recipe names
15. recipe classifications
16. recipe brands
17. recipe media
18. recipe properties
19. recipe connections
20. entity relationships
21. exact entity property-value links
22. entity release evidence
23. entity release decisions
24. release decision rollup
25. patch history
26. entity patch changes
```

Partial runs are supported through `p_entity_type_code` and `p_source_file_code`, but partial runs do not produce complete history/patch-change facts.

---

### Granular sync functions

### Identity and variants

```sql
web_priv.game_sync_patch_entities(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_variants(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_source_mappings(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_aliases(p_patch_code, p_entity_type_code, p_source_file_code)
```

Purpose:

```text
create/update canonical entity rows
create/update concrete variants
link source rows to canonical entity/variant IDs
maintain resolver aliases
```

Core identity rows are expected to be ID-stable by natural keys.

### Names, classifications, brands, media

```sql
web_priv.game_sync_patch_entity_names(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_classifications(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_brands(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_media(p_patch_code, p_entity_type_code, p_source_file_code)
```

Purpose:

```text
apply display/search names
assign taxonomy
link brand records
extract/direct/cascade media
```

Classification has both direct/source-field behavior and relationship-aware/candidate-pool behavior, especially for recipes.

### Recipe connections

```sql
web_priv.game_sync_patch_recipe_connections(p_patch_code, p_source_file_code)
```

Writes:

```text
game_recipe_components_r
game_recipe_outputs_r
game_recipe_generic_connections_r
game_recipe_catalysts_r
```

Current rules:

```text
recipe connections are patch-scoped
unique natural keys include patch_id
same edge in patch A and patch B is valid
sync must preserve recipe_component_id / recipe_output_id / recipe_generic_connection_id / recipe_catalyst_id for unchanged logical rows
```

Recipe connection sync must use update/insert/delete-missing, not delete-all/reinsert.

### Properties

```sql
web_priv.game_sync_patch_entity_property_catalog(p_patch_code, p_entity_type_code, p_source_file_code)
web_priv.game_sync_patch_entity_properties(p_patch_code, p_entity_type_code, p_source_file_code)
```

`game_sync_patch_entity_properties` calls/uses property catalog behavior and then materializes property values.

Current optimized transform behavior:

```text
base/direct property rules run first
calculated source_property rules run second
cm.game_property_rule_mode controls the property candidate function mode: all, base, source_property
```

Property values must preserve `entity_property_value_id` for the same logical property value.

### Relationships

```sql
web_priv.game_sync_patch_entity_relationships(p_patch_code, p_entity_type_code, p_source_file_code)
```

Writes:

```text
game_entity_relationships_r
```

Relationships are generated from relationship connections and resolved source links/recipe connections. The relationship sync must preserve `entity_relationship_id` for the same logical edge.

### Exact property-value links

```sql
web_priv.game_sync_patch_entity_property_value_links(p_patch_code, p_entity_type_code, p_source_file_code)
```

Writes:

```text
game_entity_property_value_links_r
```

Rules:

```text
links are generated from relationship-backed property-value link rules
one source property value + link role may produce at most one active generated link
ambiguous multiple-target source values are skipped
IDs are preserved for unchanged exact links
```

Current link roles:

```text
ammo_type_target
bench_type_target
```

### Release evidence and decisions

```sql
web_priv.game_sync_patch_entity_release_evidence(p_patch_code, p_entity_type_code)
web_priv.game_sync_patch_entity_release_decisions(p_patch_code, p_entity_type_code)
web_priv.game_sync_patch_release_decisions(p_patch_code)
```

Purpose:

```text
generate evidence facts
resolve entity-level release state
roll release decisions to patch/publication scope
```

Blockers beat score. All blockers use `score_delta = -1000` in the rule dictionary.

### History

```sql
web_priv.game_sync_patch_history(p_patch_code)
```

Purpose:

```text
snapshot current canonical tables into matching _h history tables for one patch
```

History tables use `change_code = 'snapshot'`. Change interpretation is done by the patch-change generator, not by the snapshot function itself.

Tables snapshotted include:

```text
game_entities -> game_entities_h
game_assets -> game_assets_h
game_recipes -> game_recipes_h
game_media -> game_media_h
game_media_files -> game_media_files_h
game_entity_variants_r -> game_entity_variants_r_h
game_entity_variant_values_r -> game_entity_variant_values_r_h
game_entity_variant_source_mappings_r -> game_entity_variant_source_mappings_r_h
game_entity_media_r -> game_entity_media_r_h
game_entity_relationships_r -> game_entity_relationships_r_h
game_recipe_generic_connections_r -> game_recipe_generic_connections_r_h
game_recipe_catalysts_r -> game_recipe_catalysts_r_h
game_recipe_components_r -> game_recipe_components_r_h
game_recipe_outputs_r -> game_recipe_outputs_r_h
game_entity_property_values -> game_entity_property_values_h
```

### Entity patch changes

```sql
web_priv.game_sync_patch_entity_patch_changes(p_patch_code DEFAULT NULL)
```

Purpose:

```text
build game_entity_patch_changes_f from history snapshots
```

Rules:

```text
compare from previous history patch to current patch
use canonical IDs and variant IDs from history tables
produce entity-level and variant-scoped change rows
never depend on raw import row_change_code
refresh riseopedia_entity_detail_patch_note_rows after generation
```

Passing `NULL` rebuilds all available patch changes. Passing a patch code scopes the rebuild to one patch.

---

### Transform candidate functions

Read-only transform candidate functions:

```sql
web_priv.game_transform_patch_source_rows(...)
web_priv.game_transform_entity_identity_candidates(...)
web_priv.game_transform_entity_variant_candidates(...)
web_priv.game_transform_source_link_candidates(...)
web_priv.game_transform_classification_candidates(...)
web_priv.game_transform_entity_name_candidates(...)
web_priv.game_transform_brand_candidates(...)
web_priv.game_transform_media_candidates(...)
web_priv.game_transform_property_candidates(...)
web_priv.game_transform_property_display_value_candidates(...)
web_priv.game_transform_recipe_connection_candidates(...)
```

These functions should return deterministic candidate rows. They should not mutate canonical truth.

Sync functions consume candidate functions and perform update/insert/delete-missing into `web_priv` tables.

---

### ID-preserving contract

For linkable canonical/generated tables, sync must behave as:

| Case | Required behavior |
|---|---|
| Candidate exists and values are unchanged | Keep row as-is; preserve ID. |
| Candidate exists and values changed | Update same row ID. |
| Candidate no longer exists in the scoped run | Delete generated row, or mark inactive only if table policy says so. |
| New candidate exists | Insert new row with new ID. |

Do not use delete-all/reinsert for ID-sensitive rows.

ID-sensitive generated rows include:

```text
game_recipe_components_r
game_recipe_outputs_r
game_recipe_generic_connections_r
game_recipe_catalysts_r
game_entity_relationships_r
game_entity_property_values
game_entity_property_value_links_r
```

Manual/override rows must not be deleted by generated sync.

---

### Dangerous wipe helper

```sql
web_priv.game_sync_99_danger_wipe_game_data_tables(
	p_mode text DEFAULT 'latest_patch',
	p_patch_code text DEFAULT NULL,
	p_run_sync_after_wipe boolean DEFAULT false
)
```

Purpose:

```text
wipe generated game-data state for a patch or full game-data reset
```

The helper must include all generated facts, including:

```text
game_entity_patch_changes_f
```

Use only as owner/migration role. Do not expose to app runtime role.

---

### Read model refreshes

Primary Riseopedia read models are materialized views under `web_view`, including:

```text
riseopedia_asset_browse_rows
riseopedia_entity_detail
riseopedia_entity_detail_media
riseopedia_entity_detail_variants
riseopedia_entity_detail_variant_values
riseopedia_entity_detail_profile_elements
riseopedia_entity_detail_recipe_outputs
riseopedia_entity_detail_recipe_requirements
riseopedia_entity_detail_relationship_blocks
riseopedia_entity_detail_dependency_rows
riseopedia_entity_detail_asset_recipe_links
riseopedia_entity_detail_patch_note_rows
riseopedia_entity_overview_card_elements
riseopedia_hub_counts
riseopedia_hub_sections
riseopedia_section_directory_rows
riseopedia_section_item_browse_rows
riseopedia_media_files
```

Sync functions may refresh the read models they directly own, but full read-model refresh policy should stay explicit in runbooks/scripts.

---

### Performance/profiling

Current runtime bottlenecks should be evaluated using the explain profile harness, not guessed.

Known slow areas from recent profiles:

```text
sync_entity_properties
sync_entity_classifications
sync_entity_relationships
```

Optimization rules:

```text
profile first
add indexes only around real join/delete/update hot paths
avoid update churn with IS DISTINCT FROM checks
ANALYZE large temp tables before joining them repeatedly
split property base/source_property passes instead of rerunning all property rules twice
preserve IDs while optimizing
```

Function-local `work_mem` can be used for heavy transform functions, but do not rely only on memory settings to fix structural joins.

## 30. Patch operator runbook

This section fully absorbs the former `docs/game_patch_runbook.md`. It is the current operator checklist for running, partially rerunning, profiling, validating, and refreshing Riseopedia/Mafiosopedia patch data.

### Purpose

This section is the operator checklist for rebuilding, profiling, and auditing the current game-data patch pipeline.

Primary command:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

The sync pipeline and transform model are included above in this unified document.

---

### 1. Preflight

Confirm you are connected as owner/migration role, not runtime app role:

```sql
SELECT current_user;
SELECT web_priv.game_helper_patch_id_from_code('0.4.0');
```

Confirm source/import rows are loaded for the patch before running sync.

Do not run destructive helpers unless the patch code and database are confirmed.

---

### 2. Normal full patch sync

Run:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

Expected:

```text
ok = true
full_patch_run = true
history step runs
entity_patch_changes step runs
```

For another patch:

```sql
SELECT web_priv.game_sync_patch('0.4.0H');
SELECT web_priv.game_sync_patch('0.4.0H2');
```

Use real patch codes present in `web_priv.game_patches_c` / current patch table.

---

### 3. Partial sync commands

Asset-only:

```sql
SELECT web_priv.game_sync_patch('0.4.0', 'asset', NULL, false, false);
```

Recipe-only:

```sql
SELECT web_priv.game_sync_patch('0.4.0', 'recipe', NULL, false, false);
```

Single source file:

```sql
SELECT web_priv.game_sync_patch('0.4.0', 'asset', 'dt_inventory_items', false, false);
```

Important:

```text
Partial syncs are for development and targeted fixes.
They should not be treated as complete publication builds.
History and patch-change generation should be disabled or skipped for partial runs.
```

---

### 4. Destructive rebuild helper

Patch-generated-state wipe:

```sql
SELECT *
FROM web_priv.game_sync_99_danger_wipe_game_data_tables(
	'latest_patch',
	'0.4.0',
	false
);
```

Full wipe is dangerous and should be used only in rebuild/test databases.

The wipe helper must remove generated rows from all generated sync surfaces, including:

```text
game_entity_patch_changes_f
```

Do not manually delete first-patch rows to fix cross-patch uniqueness. Patch-scoped tables must include `patch_id` in their natural keys instead.

---

### 5. Functional dependency checklist

Before recipe sync can be trusted, asset sync must have created:

```text
game_entities asset rows
game_assets rows
game_entity_variants_r asset variants
game_entity_variant_source_mappings_r asset source mappings
```

Recipe connections depend on resolved source links to assets/groups/bench/perk/effect targets.

Relationships depend on recipe connections and relationship source links.

Property-value links depend on properties and relationships.

Patch changes depend on history tables.

---

### 6. ID stability verification

Run a double-sync stability test inside a transaction when changing sync functions.

Expected behavior:

```text
same logical entity keeps entity_id
same logical variant keeps entity_variant_id
same logical recipe connection keeps recipe_*_id
same logical relationship keeps entity_relationship_id
same logical property value keeps entity_property_value_id
same exact property-value link keeps entity_property_value_link_id
```

Failure pattern to reject:

```text
DELETE generated rows in scope
INSERT all candidates again
```

Correct pattern:

```text
UPDATE existing rows by natural key
INSERT missing candidates
DELETE generated rows only when candidate disappeared
```

---

### 7. History and patch changes

After full sync:

```sql
SELECT web_priv.game_sync_patch_history('0.4.0');
SELECT web_priv.game_sync_patch_entity_patch_changes('0.4.0');
```

Normally the wrapper runs these for full-patch runs.

Patch-change generation uses history tables, not raw import `row_change_code`.

QA:

```sql
SELECT count(*) AS orphan_patch_change_rows
FROM web_priv.game_entity_patch_changes_f change_row
LEFT JOIN web_priv.game_entities entity_row
	ON entity_row.entity_id = change_row.entity_id
WHERE entity_row.entity_id IS NULL;
```

Expected:

```text
0
```

---

### 8. Post-run health checks

Minimum checks:

```sql
SELECT entity_type_code, count(*)
FROM web_priv.game_entities
GROUP BY entity_type_code
ORDER BY entity_type_code;

SELECT class_row.entity_class_code, count(*)
FROM web_priv.game_entities entity_row
LEFT JOIN web_priv.game_entity_classes_c class_row
	ON class_row.entity_class_id = entity_row.entity_class_id
GROUP BY class_row.entity_class_code
ORDER BY class_row.entity_class_code;

SELECT relationship_code, count(*)
FROM web_priv.game_entity_relationships_r
WHERE active_flag = true
GROUP BY relationship_code
ORDER BY relationship_code;

SELECT property_row.property_code, count(*)
FROM web_priv.game_entity_property_values value_row
JOIN web_priv.game_entity_properties_c property_row
	ON property_row.entity_property_id = value_row.entity_property_id
WHERE value_row.value_status_code = 'active'
GROUP BY property_row.property_code
ORDER BY property_row.property_code;
```

Critical expected zeros:

```text
orphan patch-change rows = 0
property-value links with duplicate source property value/link role = 0
recipe connection duplicate natural keys within a patch = 0
relationships with missing source entity = 0
relationships with missing target entity when target is required = 0
fake displayed common without common variant = 0
crafting_bench entity_type rows = 0
```

---

### 9. Release blockers

Hard recipe blockers must remain hard blockers:

```text
recipe_input_asset_xna
recipe_input_asset_xer
recipe_output_asset_xna
recipe_output_asset_xer
recipe_missing_all_inputs
recipe_missing_all_outputs
```

All blocker evidence must use:

```text
score_delta = -1000
```

`AllBenches + Tier1` valid no-target policy is not a failure by itself.

---

### 10. Profiling

Use the profile harness to capture function-level runtime:

```bash
DATABASE_URL="..." ./scripts/run_game_sync_pipeline_explain_profile.sh 0.4.0
```

Useful toggles:

```bash
PROFILE_WIPE=off ./scripts/run_game_sync_pipeline_explain_profile.sh 0.4.0
PROFILE_PATCH_CHANGES_ALL=off ./scripts/run_game_sync_pipeline_explain_profile.sh 0.4.0
PROFILE_REFRESH_READ_MODELS=on ./scripts/run_game_sync_pipeline_explain_profile.sh 0.4.0
```

Known bottlenecks to watch:

```text
sync_entity_properties
sync_entity_classifications
sync_entity_relationships
```

Optimization must not break ID preservation.

---

### 11. Read model refresh

Riseopedia and Mafiosopedia app reads use `web_view` materialized views and source views.

After canonical sync changes or after restoring a schema dump where materialized views were created `WITH NO DATA`, refresh the relevant materialized views before UI testing if the sync function did not already do it.

Operator refresh commands:

```sql
SELECT web_priv.game_sync_01_riseopedia_view_refresh();
SELECT web_priv.game_sync_01_mafiosopedia_view_refresh();
```

The combined compatibility wrapper may also be available:

```sql
SELECT web_priv.game_sync_01_view_refresh();
```

Key Riseopedia views include:

```text
web_view.riseopedia_entity_detail
web_view.riseopedia_entity_detail_media
web_view.riseopedia_entity_detail_variants
web_view.riseopedia_entity_detail_variant_values
web_view.riseopedia_entity_detail_recipe_outputs
web_view.riseopedia_entity_detail_recipe_requirements
web_view.riseopedia_entity_detail_relationship_blocks
web_view.riseopedia_entity_detail_dependency_rows
web_view.riseopedia_entity_detail_patch_note_rows
web_view.riseopedia_asset_browse_rows
web_view.riseopedia_section_item_browse_rows
```

Key Mafiosopedia views use the same app-facing read-model shape under the `web_view.mafiosopedia_*` prefix.

---

### 12. Retired object checks

These families should not come back:

```text
game_asset_aliases
game_asset_source_mappings_r
game_asset_brands_c
game_asset_brand_links_r
game_asset_rarities_c
game_variant_groups_c
game_variant_values_c
game_recipe_catalyst_requirements_r
game_recipe_generic_requirement_* tables
game_entity_property_expectations_r
```

Current replacements:

```text
game_entity_variant_aliases
game_entity_variant_source_mappings_r
game_entity_brands_c
game_entity_brand_links_r
game_entity_variant_groups_c
game_entity_variant_value_codes_c
game_recipe_generic_connections_r
game_recipe_catalysts_r
game_entity_properties_c
game_entity_property_values
```

## 31. Current next work

The current next Riseopedia-family work is not destructive canonical game-data cleanup.

The next work is app/read-model stabilization and product polish:

```text
1. keep the current app/view contract matrix current
2. verify populated row counts after materialized view refresh
3. verify hub/browse/detail pages for Riseopedia and Mafiosopedia
4. verify media-safe detail images and API media routes
5. verify patch notes and calculated-property changes
6. verify relationship/recipe dependency blocks
7. polish public UX after read models are stable
8. add automated tests for Riseopedia/Mafiosopedia hub, browse, detail, media, and first-render access behavior
```

When changing view SQL, always inspect actual app helper usage first. Do not guess required columns from older docs or old prompts.
