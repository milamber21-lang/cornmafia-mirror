<!-- FILE: docs/game_data_quality.md -->
# Corn Mafia Game Data Quality

## Purpose

This document defines QA and analytics conventions for game data.

`web_analytics` is the home for QA/audit/validation views and summaries.

---

## 1. Schema purpose

```text
web_analytics
	QA views
	audit views
	validation summaries
	data-quality diagnostics
	admin/operational analytics surfaces
```

`web_analytics` is separate from `web_view` because it has a different purpose.

- `web_view` is the app read contract.
- `web_analytics` is the admin/QA diagnostic surface.
- sensitive analytics are exposed to the app through guarded `web_api` functions.

---

## 2. Naming conventions

Preferred QA naming families:

```text
web_analytics.game_qa_source_*
web_analytics.game_qa_asset_classification_*
web_analytics.game_qa_asset_grouping_*
web_analytics.game_qa_property_coverage_*
web_analytics.game_qa_media_coverage_*
web_analytics.game_qa_recipe_resolution_*
web_analytics.game_qa_entity_relationships_*
web_analytics.game_qa_release_state_*
web_analytics.riseopedia_qa_*
```

Use `riseopedia_qa_*` only when the check is specifically about Riseopedia-facing behavior.

Use `game_qa_*` when the check applies to canonical game data generally.

---

## 3. Required QA categories

### Source coverage

Checks should show:

- imported source files
- row counts
- recognized/unrecognized source files
- source payload key profiles
- files present but unused by transform rules

### Asset classification

Checks should show:

- asset counts by class/category/subcategory
- assets with null category/subcategory where not expected
- source rows that fell back to generic class
- suspicious source/class mismatches

### Asset grouping and naming

Checks should show:

- duplicate display names by class
- grouped source mapping counts
- variant counts by group
- explicit aliases used
- no-group guard hits
- dev/test/internal assets

### Property coverage

Checks should show:

- property presence by asset class
- raw structured properties still stored as JSON
- duplicated properties by asset/source/variant/rarity
- source payload fields not transformed into canonical rows
- properties hidden from public display

### Media coverage

Checks should show:

- assets with/without media
- media by source role
- raw source media paths not linked to media rows
- physical bench media coverage
- missing icons for public assets

### Recipe resolution

Checks should show:

- unresolved recipe inputs
- unresolved recipe outputs
- generic requirement group usage
- duplicate display rows after grouping
- bench requirement resolution
- catalyst/processor resolution

### Entity relationships

Checks should show:

- candidates by relationship type
- resolved/missing counts
- target class coverage
- confidence ranges
- ambiguous target matches

### Release state

Checks should show:

- first seen / last seen patch coverage
- active/deprecated state
- release confidence
- publication readiness

---

## 4. Access model

Default posture:

- no broad public access to `web_analytics`
- no normal public app reads from `web_analytics`
- grant direct SELECT only when intentionally safe
- use guarded `web_api` wrappers for sensitive admin diagnostics

---

## 5. QA result expectations

A QA view should make it clear whether a row is:

```text
resolved
missing
ambiguous
ignored
hidden
source_only
expected_null
needs_rule
needs_source_fix
```

Avoid views that only dump raw rows without a status column when the purpose is validation.

---

## 6. Patch review standard

A patch is not ready for public Riseopedia exposure until QA confirms:

- no unexpected missing source files
- no major class/category fallback spikes
- no unsafe duplicate identity groups
- public assets have expected media
- recipe components/outputs are resolved or intentionally generic
- core relationships are resolved or intentionally missing
- release/publication state is clear
