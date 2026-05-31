<!-- FILE: docs/roadmap.md -->
# Corn Mafia Roadmap

## Purpose

This file defines the current post-foundation roadmap for Corn Mafia.

Architecture and non-negotiable rules live in `docs/project_definition.md`. TypeScript, app-surface, route, helper, SQL, and generation rules live in `docs/codebase_rules.md`. Styling, token, brand, and inline-style exception rules live in `docs/style_system.md`. Game-data sync details live in `docs/game_data_handling.md` and `docs/game_sync_pipeline.md`.

---

## 1. Current baseline

Corn Mafia is in V1 delivery and feature-expansion mode.

The current baseline is:

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
- clean `game_data -> web_priv` Riseopedia/game-data sync pipeline
- re-entrant `web_priv.game_sync_patch(p_patch_code text)` wrapper
- placeholder/temporary Riseopedia compatibility views pending final read-model rebuild

The foundation is deliverable as V1. Future work should improve UX, product depth, observability, automation, and feature breadth without restarting the architecture.

---

## 2. Completed foundation milestones

The following foundation phases are considered done for roadmap purposes:

- navigation panels and navigation designer foundation
- editor foundation
- admin panel surface foundation
- public surface foundation
- full project audit pass
- full security audit pass
- testing phase baseline
- DB bootstrap baseline
- help/operator script baseline
- style ownership migration baseline
- inline style exception registry baseline
- clean game-data canonical sync through `web_priv.game_sync_patch`
- release decision sync for game entities
- weapon/ammo relationship rule coverage
- crafting bench true folding in canonical game data

Do not describe these as active foundation work unless a new audit finds a concrete regression.

---

## 3. Current Priority 0 - Riseopedia read-model rebuild

Goal: make Riseopedia app-facing pages read from durable, release-aware `web_view` contracts over the new clean `web_priv.game_*` truth.

Scope:

- audit actual app usage of `web_view.riseopedia_*`
- rebuild missing/stale views
- replace temporary compatibility views with durable read models
- fix `riseopedia_hub_counts`
- fix media-safe recipe previews and asset media fields
- rebuild asset browse/detail/read surfaces
- preserve true crafting bench folding
- verify default rarity/variant behavior does not invent `common`
- verify recipe relationship rows and graph-derived views
- align route/data helper expectations with final SQL contracts

Acceptance:

- no app logs for missing `web_view.riseopedia_*` relations
- no app media safety errors from invalid media IDs
- hub counts are non-zero and release-aware
- browsable crafting bench assets count is 12
- higher-rarity-only assets do not display fake common/default variants
- recipe used-in/crafted-by surfaces are populated and release-aware

Rules:

- start with read-only audit
- inspect app files before changing view columns
- app reads must remain through `web_view` or approved read functions
- do not grant `cm_client` broad access to `game_data`

---

## 4. Priority 1 - Product surface polish

Goal: make the public and member-facing V1 feel intentional for real users.

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

Rules:

- do not move business rules into components
- keep public content routing DB-backed
- keep member authoring member-context only
- keep admin and member workflows separate where behavior differs
- use `docs/style_system.md` for visual ownership

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

Rules:

- preserve sanitizer boundaries
- preserve media path safety
- keep stored formatting constrained
- keep editor runtime geometry documented in `docs/style_system.md`

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
- game sync wrapper SQL smoke test
- API error paths

Rules:

- prioritize behavior-sensitive flows before cosmetic tests
- keep tests deterministic
- keep DB/bootstrap assumptions explicit

---

## 7. Priority 4 - Maps and interactive features

Goal: evolve the transitional map viewer into a first-class feature family only when the domain is ready.

Possible scope:

- map route model
- map layer model
- marker/entity model
- tile management
- public map content routing
- admin map management
- member map interactions if needed

Rules:

- do not create a new DB prefix until the feature family is real
- do not create empty admin domains for symmetry
- keep map storage and tile handling explicit
- avoid using public/static files for private or governed media

---

## 8. Priority 5 - Events, tools, apps, and custom feature families

Goal: expand content kinds into richer feature families without breaking the content routing model.

Candidate families:

- events
- tools
- apps
- custom content modules
- game systems
- interactive guides
- reward or value-aware workflows

Rules:

- start through existing content kind, template, renderer, and route prefix model where possible
- create a new DB prefix only when the domain becomes a standalone system
- treat reward/value-aware workflows as security-sensitive and product-sensitive
- keep member/admin workflows separate when actions differ

---

## 9. Priority 6 - Operations and observability

Goal: make production operation safer and easier.

Possible work:

- deployment runbook
- backup and restore runbook
- game patch import/rebuild checklist automation
- SQL smoke scripts for app-required views
- app log triage checklist
- security check automation
- release decision dashboard

---

## 10. Current next move

Next session should start with Riseopedia read-model audit, not destructive SQL.

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
```
