<!-- FILE: docs/game_patch_runbook.md -->
# Corn Mafia Game Patch Runbook

## Purpose

This runbook defines the operator checklist for importing and validating future game patches.

Architecture and durable rules live in `docs/game_data_handling.md`.

---

## 1. Before import

Confirm:

- target database
- target patch code
- source files to import
- backup location
- current branch/repo snapshot
- expected app/runtime state

Create a backup before destructive import or rebuild work.

Do not run patch import scripts against production without an explicit backup and confirmation.

---

## 2. Import source files

Expected flow:

```text
1. place/export source files
2. register import batch
3. import raw rows into game_data
4. register source file codes and source file roles
5. verify row counts by source file
```

QA checks should confirm:

- source files were recognized
- row counts look plausible
- important files are not missing
- source payload keys match expected shapes

---

## 3. Rebuild canonical truth

Canonical rebuild functions live under `web_priv`.

Expected conceptual order:

```text
1. source resolver / asset promotion
2. media promotion
3. recipe promotion
4. relationship promotion
5. release/history refresh
6. Riseopedia/web-view snapshot refresh where applicable
```

Use the current documented function names from the live database. Do not assume old patch function names are still current.

---

## 4. QA review

Review `web_analytics` diagnostics before exposing a patch publicly.

Minimum QA families:

- source file coverage
- asset classification coverage
- asset grouping/name duplicate checks
- property coverage
- media coverage
- recipe input/output resolution
- recipe bench/catalyst resolution
- entity relationship coverage
- release state coverage

Sensitive analytics should be accessed through guarded `web_api` functions if viewed from the app.

---

## 5. Common failure modes

Watch for:

- source file code normalization mismatches
- source files imported but not included in transform rules
- row names that changed between patches
- display names reused for different source rows
- source aliases split into duplicate assets
- broad regex rules grouping unrelated assets
- media paths stored only as raw properties
- generic recipe refs rendered as duplicate exact assets
- relationship candidates found but target aliases missing
- properties duplicated because source mapping/rarity/variant context was lost

---

## 6. Public exposure and revalidation

After QA passes:

```text
1. confirm public/admin read views return expected data
2. refresh relevant snapshots/materialized views if used
3. trigger guarded revalidation function
4. verify public routes and admin diagnostics
```

Do not expose `web_analytics` as a public read surface.

---

## 7. Rollback expectations

Rollback strategy depends on the import/rebuild scope.

Preferred recovery paths:

- restore pre-import backup for destructive failures
- disable a transform rule and rebuild for bad mapping logic
- patch aliases/rules and rebuild for resolution misses
- keep raw source imports available for forensic comparison

Do not manually edit canonical rows as a long-term fix when the issue belongs in transform rules.

---

## 8. Post-import notes

After each significant patch:

- record source files that changed shape
- record transform rules added or changed
- record remaining QA exceptions
- record deprecated objects that can be removed later
- update `docs/roadmap.md` when sequencing changes
