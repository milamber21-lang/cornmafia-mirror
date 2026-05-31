<!-- FILE: docs/roadmap.md -->
# Corn Mafia Roadmap

## Purpose

This file defines the current post-foundation roadmap for Corn Mafia.

It is a sequencing document. Architecture and non-negotiable rules live in `docs/project_definition.md`. TypeScript, app-surface, route, helper, SQL, and generation rules live in `docs/codebase_rules.md`. Styling, token, brand, and inline-style exception rules live in `docs/style_system.md`.

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
- placeholder public landing and collection surfaces waiting for final product design
- editor system active and available for admin and member authoring flows

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

Do not describe these as active foundation work unless a new audit finds a concrete regression.

---

## 3. Current V1 delivery focus

Goal: make the current platform easy to ship, operate, explain, and continue from.

Work items:

- keep `docs/README.md` short and V1 accurate
- keep durable docs under `docs/`
- keep bootstrap docs aligned with current env taxonomy
- keep security posture scripts passing on the real repository
- keep root archive/snapshot generation secret-safe
- keep deployment assumptions explicit
- keep member authoring documented as V1 active
- keep YouTube channel allowlist documented as active admin family
- keep placeholder public surfaces clearly separated from final product design

Acceptance:

- docs match the current repo and SQL
- generated docs no longer describe foundation work as future work
- future ChatGPT sessions can understand the current baseline without old prompt memory

---

## 4. Priority 1 - Product surface polish

Goal: make the public and member-facing V1 feel intentional for real users.

Scope:

- homepage design
- category page design
- subcategory page design
- public collection hubs
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
- category/subcategory behavior
- YouTube channel allowlist and URL validation
- API error paths
- SQL function edge cases

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
- DB bootstrap verification improvements
- media storage verification improvements
- health and readiness checks
- structured app logging strategy
- production error reporting strategy
- rate limit tuning
- dependency audit tracking
- Docker/runtime hardening reviews

Rules:

- scripts should be small and understandable
- destructive scripts require clear names and confirmations
- do not hide destructive behavior behind generic helpers
- document assumptions instead of relying on unavailable local state

---


---

## 10. Game data and Riseopedia foundation track

Goal: make imported game data reliable, auditable, and ready for Riseopedia without chasing one-off source issues in the app layer.

Current completed / mostly completed work:

- building item and building material imports are functioning
- building set property exists for imported building-item files
- asset grouping and naming have been cleaned enough to proceed
- duplicate asset-name problems have been reduced to specific display/source-quality cases
- entity relationship storage has been rebuilt around `game_entity_relationships_r`
- `uses_ammunition` relationships resolve through the new entity relationship path

Next sequence:

```text
7B7A Documentation and schema standardization
7B7B Move QA/audit views to web_analytics
7B7C Move game_transform_* rules to game_data
7B7D Property model standardization
7B8  Categories/subcategories cleanup
7B9  Recipe display dedupe and bench wiring QA
7C   Building item material/cost relationships
7D   Riseopedia app wiring
7E   Deprecated object cleanup
```

Rules:

- document architecture decisions before structural SQL migrations
- move transform rules to `game_data`, not app code
- move QA/read-only diagnostics to `web_analytics`
- use guarded `web_api` wrappers for sensitive/admin analytics access
- do not expose `web_analytics` as public app read contracts
- keep canonical truth in `web_priv.game_*`
- preserve raw source evidence in `game_data`
- do not treat raw source payloads as normal public asset properties
- keep Riseopedia UI wiring after data identity, properties, categories, and relationships are stable

## 11. Working rule for roadmap updates

When updating this roadmap:

- work from current real files and current SQL
- do not describe completed foundation phases as active work
- keep future work separate from current implementation facts
- avoid generic product-roadmap language that does not help implementation
- keep the roadmap useful as a prompt handoff document
- ask before removing already implemented behavior from scope
