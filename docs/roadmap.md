<!-- FILE: docs/roadmap.md -->
# Corn Mafia Roadmap

## Purpose

This file defines the current post-cleanup roadmap for Corn Mafia.

Architecture and non-negotiable rules live in `docs/project_definition.md`. TypeScript, app-surface, route, helper, SQL, and generation rules live in `docs/codebase_rules.md`. Styling rules live in `docs/style_system.md`. Riseopedia/Mafiosopedia product, transform model, source-data handling, sync pipeline, patch runbook, and read-model truth lives in `docs/riseopedia.md`.

---

## 1. Current baseline

Corn Mafia is in V1 delivery and feature-expansion mode.

Current baseline:

- DB-first web app
- Next.js 16
- React 19
- Turbopack build path
- ESLint 9 flat config
- Docker runtime with web and database
- DB bootstrap support
- operator and security scripts
- DB-backed Discord identity and role-aware access
- DB-backed admin families
- DB-backed public navigation and content routing
- DB-backed member profile, media, series, and authoring surfaces
- DB-backed YouTube channel allowlist support
- clean entity-first game-data canonical sync through `web_priv.game_sync_patch`
- variant/source/alias/brand/rarity cleanup complete in canonical `web_priv`
- property mapping/catalog/value pipeline complete enough for app read models
- crafting bench taxonomy/source/property linkage fixed
- recipe classification materialized from resolved outputs and bench tier/family logic
- vehicle subcategory prefix issue fixed
- variant family history added and wired through the sync wrapper

The foundation is deliverable as V1. Future work should improve UX, product depth, observability, automation, and feature breadth without restarting the architecture.

---

## 2. Completed cleanup milestones

The following are complete at the canonical DB layer:

```text
asset aliases               -> entity variant aliases
asset source maps           -> entity variant source mappings
asset brands                -> entity brands
asset rarities              -> entity variant rarity values
recipe generic reqs         -> recipe generic groups/connections
recipe catalysts            -> recipe catalysts
game_variant_*              -> game_entity_variant_*
variant history             -> added and wired
property history            -> preserves variant/source links
crafting_bench entity type  -> removed; benches remain assets
recipe class                -> output-derived helper logic
recipe category/subcategory -> bench family and tier/no_tier_required
vehicle subcategory         -> raw brand/source value, no class prefix
property expectations       -> retired in favor of mapping rules + catalog
crafting bench properties   -> source-linked across dt_craft_benches variants
```

Do not describe these as active cleanup work unless a new audit finds a concrete regression.

---

## 3. Current Priority 0 - Riseopedia/web read-model rebuild

Goal: make Riseopedia and Mafiosopedia app-facing pages read from durable, release-aware `web_view` contracts over the clean `web_priv.game_*` truth.

Scope:

- audit actual app usage of `web_view.riseopedia_*`, `web_view.mafiosopedia_*`, and related game read views
- build an app/view contract matrix
- rebuild missing/stale views
- replace temporary compatibility views with durable read models
- fix `riseopedia_hub_counts` and `mafiosopedia_hub_counts`
- fix media-safe recipe previews and asset media fields
- rebuild asset browse/detail/read surfaces
- preserve true crafting bench folding
- verify default rarity/variant behavior does not invent `common`
- verify recipe relationship rows and graph-derived views
- expose property catalog/value read models for detail pages
- align route/data helper expectations with final SQL contracts
- remove `web_view` compatibility columns only after app usage is updated

Acceptance:

- no app logs for missing `web_view.riseopedia_*` or `web_view.mafiosopedia_*` relations
- no app media safety errors from invalid media IDs
- hub counts are non-zero and release-aware
- crafting bench assets remain folded correctly
- higher-rarity-only assets do not display fake common/default variants
- recipe used-in/crafted-by surfaces are populated and release-aware
- property detail surfaces are driven by `game_entity_properties_c` and `game_entity_property_values` views
- no direct app reads from `web_priv` or `game_data`
- first server-rendered menu/content responses use freshly synced or freshly verified role cache before gated access is granted

Rules:

- start with read-only audit
- inspect app files before changing view columns
- app reads must remain through `web_view` or approved read functions
- do not grant `cm_client` broad access to `game_data`

---

## 4. Priority 1 - Product surface polish

Goal: make the public and member-facing V1 feel intentional for real users after read models are stable.

Scope:

- homepage design
- category page design
- subcategory page design
- public collection hubs
- Riseopedia page UX once read models are stable
- footer and exploration flows
- member dashboard polish
- member content creation UX polish
- member media and series UX polish
- empty states and unavailable states
- terms and privacy final copy

---

## 5. Priority 2 - Editor hardening

Goal: make rich text and content authoring reliable enough for heavier content expansion.

Scope:

- rich text authoring smoke tests
- stored rich text rendering review
- image insert/resize/move behavior
- link picker behavior
- media picker behavior
- semantic paste cleanup
- renderer safety
- inline style exceptions in editor/runtime geometry
- member authoring editor experience

---

## 6. Priority 3 - Automated testing expansion

Goal: turn the current manual/security baseline into repeatable confidence.

Candidate tests:

- auth login behavior
- admin guards
- member guards
- same-origin mutation protection
- public content access
- navigation panels
- content admin CRUD
- member content create/edit
- member media upload/update/delete
- member series create/update/delete
- templates family
- media upload/render
- SVG sanitization
- rich text render
- Riseopedia hub/browse/detail pages
- Mafiosopedia/info hub/browse/detail pages
- first-render menu/content access after Discord login and after role-refresh-due states
- game sync wrapper SQL smoke test
- API error paths

---

## 7. Priority 4 - Maps and interactive features

Goal: evolve the transitional map viewer into a first-class feature family only when the domain is ready.

Rules:

- do not create a new DB prefix until the feature family is real
- do not create empty admin domains for symmetry
- keep map storage and tile handling explicit
- avoid using public/static files for private or governed media

---

## 8. Current next move

Next session should start from `docs/riseopedia.md` and continue **Riseopedia/Mafiosopedia read-model contract audit, verification, and UX polish**, not destructive game-data SQL.

Minimum first deliverable:

```text
view/app contract matrix:
- app file / function
- queried web_view object
- expected columns
- current object exists yes/no
- current row count
- media safety status
- bench folding status
- rarity/default variant status
- recipe relationship status
- property read-model status
- proposed final contract action
```
