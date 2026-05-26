<!-- FILE: docs/game_data_import_design.md -->
# Game Data Import Design

## Purpose

This document locks the first design decisions for importing Infinity Rising game data into Corn Mafia.

It covers:

- curated patch dump ownership
- `game_data` staging schema purpose
- `web_priv.game_*` canonical table purpose
- app boundary rules
- patch lifecycle
- import lifecycle
- media lifecycle
- asset meaning
- first MVP scope
- non-goals and critical risks

This is a design document only. It does not define final SQL object DDL yet.

---

## 1. Agreed architecture

Corn Mafia remains DB-first.

The game data system uses one new import/staging schema and the existing app-facing schema boundaries:

```text
game_data
	Raw/source import schema for curated developer/data-mining dumps.
	Stores patch files, raw rows, media inventory, hashes, validation messages, generated derivative metadata, and import audit state.
	Normal app surfaces do not read from this schema.

web_priv.game_*
	First-class canonical game/wiki domain tables.
	Stores processed current truth and history for assets, properties, recipes, quest relationships, map relationships, perk relationships, media links, and later calculators.

web_api.game_*
	App-callable/import-callable action functions.
	Owns scan, validate, process, promote, and refresh/sync operations.

web_view.game_*
	App-readable/admin-readable/public-readable view contracts.
	Exposes current promoted data and admin import status without exposing raw staging tables directly.
```

There will not be separate `game_api`, `game_view`, or `game_priv` schemas.

`game_data` is allowed because it is not an app business schema. It is a source-dump warehouse and staging/audit area for imported game data.

---

## 2. Boundary rules

### 2.1 Normal app use

Normal public, member, and admin UI surfaces must not directly read or mutate `game_data` tables.

Normal app reads must use:

```text
web_view.game_*
```

Normal app writes/actions must use:

```text
web_api.game_*
```

Canonical game truth lives under:

```text
web_priv.game_*
```

### 2.2 Import/admin use

Admin import tooling may expose import status, validation summaries, and diffs, but only through approved surfaces:

```text
web_view.game_admin_import_*
web_api.game_import_*
web_api.game_patch_*
web_api.game_promote_*
```

The admin UI should not directly understand raw `game_data` table structure.

### 2.3 Server-side import job

The admin refresh/import action should trigger a guarded server-side job or script.

The DB should not literally scan directories by itself. A server-side import process scans allowlisted folders, reads files, generates media derivatives, writes raw import facts to `game_data`, then calls DB functions to validate/promote/sync canonical tables.

---

## 3. External data preparation workflow

The project assumes an external extractor/data-mining step before the web app import starts.

External tool responsibilities:

```text
1. New game patch is released.
2. Operator runs extractor/data-mining tool outside the web app.
3. Tool exports selected JSON data tables.
4. Tool reads JSON texture/media references.
5. Tool copies only directly needed images/media.
6. Tool preserves original relative folder paths.
7. Tool writes a manifest/report.
8. Operator copies the curated patch dump to the server.
```

The extractor should not copy every game texture. It should copy only media referenced by the selected data tables or otherwise needed by the wiki.

This saves disk space and prevents the web app from becoming a mirror of the whole game content tree.

---

## 4. Server folder layout

Patch dumps should preserve the original source folder tree.

Recommended server layout:

```text
./data/gamedata/patches/<patch_code>/source/...
./data/gamedata/patches/<patch_code>/derived/...
./data/gamedata/patches/<patch_code>/reports/...
```

Example source files:

```text
./data/gamedata/patches/<patch_code>/source/Content/PRO2/CharacterMenu/Inventory/DT_InventoryItems.json
./data/gamedata/patches/<patch_code>/source/Content/PRO2/CharacterMenu/Inventory/DT_OutfitDetails.json
./data/gamedata/patches/<patch_code>/source/Content/PRO2/CharacterMenu/Inventory/Textures/CornCredits.png
./data/gamedata/patches/<patch_code>/source/Plugins/CornNeeds/Content/Icons/NeedSatiationIcon.png
```

Generated web media belongs under `derived/`:

```text
./data/gamedata/patches/<patch_code>/derived/media/...
```

Import reports may be written under `reports/`:

```text
./data/gamedata/patches/<patch_code>/reports/manifest.json
./data/gamedata/patches/<patch_code>/reports/validation.json
```

Rules:

- `source/` is immutable after upload.
- `derived/` is generated and may be deleted/rebuilt.
- `reports/` contains extractor/import summaries and validation output.
- Original relative paths are stored in DB and should remain useful for repeatable imports and debugging.

---

## 5. Patch lifecycle

Patch lifecycle states should be explicit.

Recommended states:

```text
uploaded
scanned
validated
processed
ready_to_promote
promoted
failed
superseded
```

Meaning:

| State | Meaning |
|---|---|
| `uploaded` | Patch folder exists on server, but import has not scanned it yet. |
| `scanned` | Files, rows, media, hashes, and manifest facts have been loaded into `game_data`. |
| `validated` | Required files and known references were checked; warnings/errors were recorded. |
| `processed` | Web media derivatives and normalization candidates were generated. |
| `ready_to_promote` | Import passed required gates and can become current app data. |
| `promoted` | Canonical `web_priv.game_*` tables were synced for the current public/admin read model. |
| `failed` | Import failed and should not be promoted without correction. |
| `superseded` | Patch/import was replaced by a newer promoted patch. |

The admin UI may eventually expose a single Refresh button, but internally scan, validate, process, and promote should remain separate phases.

---

## 6. Import lifecycle

Recommended internal lifecycle:

```text
1. Admin chooses or confirms patch folder.
2. Server validates that folder is under the allowlisted game-data root.
3. Server scans selected JSON files and manifest.
4. Server writes file inventory to game_data.
5. Server writes raw data-table rows to game_data.
6. Server writes discovered media/source references to game_data.
7. Server verifies copied media files exist where expected.
8. Server generates optimized web derivatives.
9. Server writes derivative metadata to game_data.
10. DB validates required files, row shape, duplicate source identities, and unresolved references.
11. Admin reviews summary/diff.
12. Admin promotes patch.
13. DB syncs canonical web_priv.game_* tables.
14. web_view.game_* exposes current promoted data.
```

Import must be repeatable. Running scan/validate/process again for the same patch should not create duplicate canonical truth.

---

## 7. Source identity rules

The safest source identity is:

```text
source_rel_path + source_row_name
```

For JSON data tables, store at least:

```text
patch_code
source_rel_path
source_file_name
source_file_code
source_package_path
source_row_struct
source_row_name
source_identifier_value
source_payload_json
source_payload_hash
```

Do not rely only on a JSON row's internal identifier field.

Some source files can contain copied, stale, or mismatched identifiers. The import key should come from the actual file path plus row name first. Internal identifiers should be stored as attributes and aliases, not as the only primary identity.

---

## 8. Asset definition

In this design, an asset means an item-like game object.

Assets include things that can be:

```text
worn
used
ridden
crafted
placed
mined
looted
consumed
equipped
carried
stored in inventory
```

Examples:

```text
basic items
resources
consumables
weapons
backpacks
outfits
vehicles
building items
building materials
quest items
tools
currency
ammo
creature drop items
```

Assets are the central item/object hub for the wiki.

Recipes, quests, maps, perks, mining locations, skill calculators, and other systems are not assets themselves. They are systems that reference assets.

---

## 9. Canonical relationship model

Assets should tie wiki systems together, but not every fact should become a generic property.

Use asset properties for stats and attributes:

```text
stack size
slot size
value
rarity
durability
nutrition
toxicity
weapon damage
magazine size
firing rate
backpack added slots
jetpack drain duration
jetpack recharge duration
vehicle cargo space
vehicle performance values
```

Use relationship tables for graph facts:

```text
recipe components
recipe outputs
quest rewards
quest required items
quest objective items
perks that unlock assets
locations that produce assets
mining nodes that yield assets
vendors that sell assets
creatures that drop assets
```

Bad modeling:

```text
asset_property = used_in_recipe
asset_property = quest_reward
asset_property = found_at_location
```

Good modeling:

```text
game_recipe_components_r
game_recipe_outputs_r
game_quest_rewards_r
game_location_asset_drops_r
game_perk_asset_unlocks_r
```

---

## 10. Media lifecycle

Original copied media should be preserved exactly as source input.

Source media examples:

```text
Content/PRO2/CharacterMenu/Inventory/Textures/CornCredits.png
Content/ART/Textures/InventoryIcons/Resources/T_Blue_Spruce_Dye.png
Plugins/CornNeeds/Content/Icons/NeedSatiationIcon.png
```

The web app should serve optimized derivatives, not the original source image everywhere.

Recommended icon derivatives:

```text
32px or 48px = inline/table icon
64px         = compact list icon
128px        = card icon
256px        = item detail icon
512px        = zoom/high-density fallback
source       = archive/source only
```

Recommended format policy:

```text
source PNG = preserved untouched
WebP       = default web derivative format
PNG        = optional derivative/fallback when transparency or sharp UI edges look better
AVIF       = optional future optimization, not required for first pass
```

The media processor should not visually reinterpret the art. "Tone down" means resize, compress, and convert for web performance, not change the art direction.

---

## 11. Data model families

### 11.1 `game_data` staging/import family

Initial conceptual family:

```text
game_data.game_patches
game_data.game_import_batches
game_data.game_import_files
game_data.game_import_rows
game_data.game_import_row_refs
game_data.game_import_media_files
game_data.game_import_media_derivatives
game_data.game_import_messages
```

The exact names and columns should be finalized in the SQL design pass.

### 11.2 `web_priv.game_*` canonical MVP family

Initial conceptual family:

```text
web_priv.game_assets
web_priv.game_asset_classes_c
web_priv.game_asset_categories_c
web_priv.game_asset_subcategories_c
web_priv.game_asset_properties_c
web_priv.game_asset_class_properties_r
web_priv.game_asset_property_values
web_priv.game_asset_media_r
web_priv.game_brands
web_priv.game_asset_brands_r
```

### 11.3 Recipe MVP family

Recipes should be normalized early because they immediately power "crafted by" and "used in" asset pages.

Initial conceptual family:

```text
web_priv.game_crafting_benches
web_priv.game_recipes
web_priv.game_recipe_components_r
web_priv.game_recipe_outputs_r
web_priv.game_recipe_required_perks_r
```

### 11.4 Later system families

Later systems can be normalized after the asset/recipe loop is working:

```text
web_priv.game_quests
web_priv.game_quest_objectives
web_priv.game_quest_rewards_r
web_priv.game_quest_required_assets_r
web_priv.game_maps
web_priv.game_map_points
web_priv.game_location_asset_drops_r
web_priv.game_perks
web_priv.game_perk_edges_r
web_priv.game_perk_asset_unlocks_r
web_priv.game_needs
web_priv.game_effects
web_priv.game_creatures
```

---

## 12. Current source data observations

The current sample export includes 39 JSON data-table files.

Important source families include:

```text
DT_InventoryItems
DT_ConsumableDetails
DT_BackpackDetails
DT_OutfitDetails
DT_WeaponDetails
DT_VehicleData
DT_CraftRecipes
DT_CraftBenches
DT_Quest
DT_CraftPerks
DT_InfinityPerks
DT_AbilityPerks
DT_Experience
DT_Needs
DT_Effects
building item tables
navigation/map point tables
DT_Districts
DT_Towns
DT_Sectors
DT_Maps_New
DT_Emotes
DT_CreatureData
```

The imported file note marks `DT_ItemData` as old. Treat it as legacy/reference unless later evidence proves it is still active.

Approximate row counts from the provided sample:

| Source file | Rows |
|---|---:|
| `DT_InventoryItems.json` | 809 |
| `DT_CraftRecipes.json` | 439 |
| `DT_ConsumableDetails.json` | 353 |
| building item files combined | 632 |
| navigation/map point files combined | 474 |
| `DT_Quest.json` | 148 |
| `DT_VehicleData.json` | 70 |
| `DT_CraftBenches.json` | 44 |
| `DT_BackpackDetails.json` | 29 |
| `DT_WeaponDetails.json` | 17 |
| `DT_OutfitDetails.json` | 8 |

The source data already has enough structure to justify a first-class game/wiki domain.

---

## 13. First MVP scope

The first implementation should not try to build the full wiki.

Recommended first MVP:

```text
1. game_data schema and import tracking
2. patch scan/validate/process lifecycle
3. source file and row inventory
4. source media inventory and derivative tracking
5. canonical assets from item-like source data
6. canonical asset media links
7. canonical recipes and recipe component/output relationships
8. web_view asset detail read model
9. admin import summary read model
```

First public/wiki value target:

```text
asset detail page
asset icon/media
asset properties/stats
crafted by recipes
used in recipes
source patch
change status across patches
```

---

## 14. Non-goals for first pass

Do not implement these in the first SQL pass unless the scope changes:

```text
full public wiki UI
quest system normalization
map UI
skill calculator UI
vendor/shop system
creature drop system
full POA/blockchain audit model
manual admin editing of every canonical game row
background job dashboard
complex media CDN strategy
```

The first pass should create a safe import and canonical asset/recipe foundation.

---

## 15. Critical risks

### P0: Wrong source identity

Do not key canonical import identity only by an internal JSON identifier.

Use source file path plus source row name as the base source identity, and store internal identifiers as secondary data.

### P0: No raw import/audit layer

If the system imports straight into `web_priv.game_*` without preserving raw rows and hashes in `game_data`, patch diffs and repeatability become fragile.

### P1: Overusing property tables

Properties are correct for stats and attributes. They are not correct for recipes, quests, map drops, unlocks, and other graph relationships.

### P1: Serving raw source media directly

Raw source media should be preserved. Public UI should use DB-resolved safe media URLs and optimized derivatives.

### P1: One-click overwrite

Refresh should not blindly overwrite promoted wiki data. Scan, validate, process, and promote should remain separate internal states.

### P2: Too much first-pass scope

Trying to model quests, maps, perks, drops, and calculators before assets and recipes are stable will slow the project down and increase rework.

---

## 16. Next design step

The next step after this document is the SQL design pass for the `game_data` schema.

That pass should inspect the current SQL dump patterns and generate full SQL definitions for:

```text
game_data schema
game_data patch/import tables
required sequences and constraints
owner and grants following current project patterns
initial admin-facing web_view import summaries
initial web_api import/promote function contracts or placeholders, if needed
```

Canonical `web_priv.game_*` tables should follow after the import layer shape is approved.
