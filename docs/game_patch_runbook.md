<!-- FILE: docs/game_patch_runbook.md -->
# Corn Mafia Game Patch Runbook

## Purpose

This runbook defines the operator checklist for rebuilding and validating a game patch.

Architecture and durable rules live in:

- `docs/game_data_handling.md`
- `docs/game_sync_pipeline.md`
- `docs/codebase_rules.md`

---

## 1. Before running a rebuild

Confirm:

- target database
- target patch code
- current repo snapshot
- current schema dump if contract work is needed
- backup/restore point
- app runtime state

Do not run destructive import/rebuild work against production without an explicit backup and confirmation.

---

## 2. Source import prerequisites

Before a canonical sync, source import must already be complete.

Confirm:

- patch exists in `game_data.patches`
- scan/import batch exists and completed
- media derivative batch exists and completed where media is expected
- source file rules recognize the imported files
- row counts by source file look plausible

Current patch `0.4.0` has been validated with imported source rows and media derivatives.

---

## 3. Canonical rebuild command

The current canonical rebuild is one function:

```sql
SELECT web_priv.game_sync_patch('0.4.0');
```

This function is re-entrant. It resets generated state for the patch and rebuilds canonical `web_priv.game_*` truth.

Do not call internal stages manually unless debugging a specific failure.

---

## 4. Internal stage order

The wrapper order is:

```text
1. game_reset_patch_generated_state
2. game_sync_patch_assets
3. game_sync_patch_asset_properties
4. game_sync_patch_media
5. game_sync_patch_recipes
6. game_sync_patch_entity_relationships
7. game_sync_patch_release_decisions
```

Reference sync is delegated to `game_sync_patch_assets`.

---

## 5. Expected stable counts for 0.4.0

After the wrapper, expected counts are:

```text
game_assets: 1413
crafting bench assets: 12
bench tier/source variants: 44
asset aliases: 6360
asset property values: 17735
media: 1873
media variants: 7492
entity media links: 1925
recipes: 439
recipe outputs: 455
recipe components: 939
recipe bench requirements: 395
recipe catalyst requirements: 40
generic requirement connections: 79
entity relationships: 4662
release decisions: 1852
release evidence: 10171
```

---

## 6. Minimum QA guards

Run or reproduce QA checks for:

```text
fake recipe-ref assets = 0
orphan relationship endpoints = 0
duplicate graph rows = 0
source_import_row FK gaps = 0
weapon ammo relationships = 17 / 17
asset release coverage = 1413 / 1413
recipe release coverage = 439 / 439
bench asset count = 12
bench variant row count = 44
```

If any guard fails, stop and debug the stage that owns the fact.

---

## 7. Common failure modes

### Duplicate reference sync temp table

If `tmp_game_asset_reference_source_rows already exists`, do not call reference sync separately before asset sync in the same wrapper/session. Asset sync delegates reference sync.

### FK failure deleting assets

If asset sync cannot delete `game_assets` because downstream generated rows still reference them, the wrapper did not reset generated state first. Use `game_sync_patch`, not manual `game_sync_patch_assets`, unless debugging.

### Identity column insert failure

Do not insert generated identity columns such as `entity_relationship_id`. Let PostgreSQL generate them.

### Source import row FK failure

For derived graph rows, source import row ID can be NULL. Do not insert fake IDs such as `-1`.

### Permission denied for `game_data`

Do not grant `cm_client` broad `game_data` access. Use `SECURITY DEFINER` helper functions with fixed `search_path` or expose through `web_view`.

---

## 8. Riseopedia app compatibility after rebuild

The game sync pipeline rebuilds `web_priv` truth. It does not guarantee current app-facing `web_view.riseopedia_*` compatibility.

After a rebuild, app errors may reveal missing/stale `web_view` contracts. Compatibility views may be restored temporarily, but final work should rebuild durable Riseopedia read models from clean `web_priv.game_*` truth.

Known temporary compatibility views:

```text
web_view.riseopedia_hub_counts
web_view.riseopedia_hub_recipe_previews
web_view.riseopedia_asset_used_in_recipe_rows
web_view.riseopedia_asset_crafted_by_recipe_rows
```

These are not final read models.

---

## 9. Next operator phase

After game sync QA passes, move to Riseopedia read-model work:

```text
1. inspect app queries under apps/web
2. list required web_view.riseopedia_* contracts
3. compare expected columns with live views
4. rebuild views from game_* truth
5. verify media safety expectations
6. verify bench folding and rarity/default variant behavior
7. run app smoke tests
```
