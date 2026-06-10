<!-- FILE: docs/project_definition.md -->
# Corn Mafia Project Definition

## Purpose

This file is the main project-definition document for Corn Mafia.

It defines:

- platform intent
- V1 delivery status
- technical baseline
- DB-first architecture
- runtime and ownership boundaries
- security and access model
- admin, member, and public context separation
- active admin and member/public surfaces
- current normalization model
- bootstrap and operations baseline
- rules that must not be violated in future work

If another planning note, historical prompt, or older document conflicts with this file, this file controls unless the user explicitly overrides a specific point for a specific task.

---

## 1. Current status

Corn Mafia is in V1 delivery and feature-expansion mode.

The project has passed the foundation phase. The current baseline includes:

- DB-first web app
- Next.js 16
- React 19
- Turbopack build path
- ESLint 9 flat config
- strict TypeScript
- PostgreSQL-backed business rules and read surfaces
- Docker runtime with web and database services
- DB bootstrap support
- operator and security scripts
- Discord-backed identity and role-aware access
- admin, public, member, and member-authoring surfaces
- DB-backed navigation, content routing, media, series, templates, and YouTube channel allowlist support

Future work should improve, extend, and harden this V1 baseline. Do not restart the architecture.


---

## 1A. Current game-data baseline

The canonical game-data foundation is ready for Riseopedia/web app read-model work.

Current decisions that future work must preserve:

```text
entities are asset or recipe
crafting benches are assets, not a separate entity type
rarity is represented as entity variant values
brands are entity-level
aliases are resolver evidence only
source mappings are variant evidence only
recipe class is resolved from outputs
recipe category/subcategory come from bench family and tier/no_tier_required
vehicle subcategories use raw brand/source values without category prefixes
properties are defined by game_data mapping rules and materialized through web_priv values
web_priv.game_entity_properties_c is a preserved metadata catalog
web_priv.game_entity_property_expectations_r is retired
```

The next major work is not another destructive canonical game-data cleanup. The next major work is rebuilding/auditing `web_view.riseopedia_*`, `web_view.mafiosopedia_*`, and related game read contracts so `apps/web` can safely consume the cleaned canonical truth. Durable Riseopedia-family product, channel, app, admin, and read-model rules live in `docs/riseopedia.md`.

---

## 2. Platform intent

Corn Mafia is a guild platform with Discord-first identity and role-aware access.

The platform supports:

- guild website content
- Discord-only identity and login
- role-gated content and actions
- guides, tutorials, media, tools, and apps
- maps and interactive features
- events and community systems
- admin-managed content workflows
- V1 member-side authoring workflows
- future reward, distribution, or value-aware workflows handled carefully and explicitly

The goal is to keep the platform expandable without rebuilding the foundation for each feature family.

---

## 3. Technical baseline

Current runtime baseline:

- one active web app under `apps/web`
- Next.js 16
- React 19
- Turbopack build path
- ESLint 9 flat config
- strict TypeScript
- PostgreSQL
- Docker Compose runtime with `cm-web` and `cm-db`

Current app architecture:

- the database owns current truth and business rules where migrated
- app reads use `web_view` or clearly approved read functions
- app writes use `web_api`
- app code must not directly CRUD private truth tables
- admin, member, and public workflows remain separate when contracts differ
- runtime code must not require owner privileges

---

## 4. Required database architecture

Use these database layers deliberately:

```text
game_data
	raw game imports
	game patch/source-file metadata
	game_transform_* rule/config tables
	source-to-canonical transformation rules
	import evidence used by promotion/rebuild logic

web_priv
	canonical current truth
	private tables
	private helpers
	trigger helpers
	validation helpers
	sync helpers
	access helpers
	business internals
	private promotion/rebuild/revalidation functions

web_api
	app-callable business functions
	app-callable write functions
	approved action functions
	approved app resolver functions where intentionally exposed
	guarded admin wrappers for sensitive analytics access

web_view
	app read surfaces
	lookup surfaces
	admin read contracts
	member read contracts
	public read contracts

web_analytics
	QA views
	audit views
	validation summaries
	data-quality diagnostics
	admin/operational analytics surfaces
```

Application contract:

- public/member/admin app reads should come from `web_view` or a clearly approved read function
- writes and app-callable actions should go through `web_api`
- sensitive admin analytics should be exposed through guarded `web_api` functions, not as public `web_view` surfaces
- `web_analytics` is a separate admin/QA read surface, not a replacement for `web_view`
- private implementation details stay under `web_priv`
- raw imports and transform rules stay under `game_data`
- app code must not directly CRUD private truth tables
- direct table ownership must not move into route handlers
- app runtime must not require owner privileges
- `public` must not be reintroduced as the main project schema

Runtime roles:

```text
cm        = owner / migration role
cm_client = runtime app role
```

Do not design solutions that require `cm_client` to behave like `cm`.

## 5. DB object naming taxonomy

Current approved DB object prefixes:

- `actor_`
- `auth_`
- `discord_`
- `game_`
- `web_`

Meaning:

- `actor_` = current actor access evaluation and permission helpers
- `auth_` = authentication and account-linking concerns
- `discord_` = Discord-sourced identity and role sync concerns
- `game_` = canonical game/Riseopedia domain data, relationships, imports, and transformation outputs
- `web_` = current web platform families

Schema prefix rules:

```text
game_data may use game_transform_*, import_*, patch/source metadata helpers, and raw-import helper names
web_priv  may use actor_, auth_, discord_, game_, web_
web_api   may use auth_, discord_, game_, web_
web_view  may use auth_, discord_, game_, web_
web_analytics may use game_*, riseopedia_*, and QA/audit naming
```

Game domain taxonomy:

```text
game_asset_*    = assets and asset-specific dimensions
game_entity_*   = cross-entity identity, release state, and relationships
game_media_*    = game media and media mappings
game_recipe_*   = recipes, components, outputs, benches, catalysts, and generic requirement groups
game_quest_*    = quests and quest-specific relationships
game_vendor_*   = vendors and shop data
game_npc_*      = NPCs and drops
game_location_* = locations, map/resource locations, and location relationships
game_transform_* = source transformation, classification, identity, naming, ref-resolution, and relationship rules
```

Approved current game-domain decisions:

- canonical game truth is entity-first; `game_entities` owns cross-domain identity and `game_assets` / `game_recipes` are domain rows linked to that identity
- concrete asset variants live under `game_entity_variants_r`
- variant dimensions and values live under `game_entity_variant_groups_c`, `game_entity_variant_value_codes_c`, and `game_entity_variant_values_r`
- source/import evidence for concrete variants lives under `game_entity_variant_source_mappings_r`
- property metadata lives under `game_entity_properties_c`; materialized values live under `game_entity_property_values`
- crafting bench source rows from `dt_craft_benches` must map to canonical bench family/tier variants before property sync
- source mappings are evidence, not canonical identity
- recipe entity classification is output-derived and relationship-aware; do not force it into simple source-field rules
- resolver aliases live under `game_entity_variant_aliases`; aliases resolve messy source refs to `entity_variant_id` and must not become durable relationship targets
- brands are entity-level canonical data under `game_entity_brands_c` and `game_entity_brand_links_r`
- rarities are entity variant values, not an asset-level reference table; `game_asset_rarities_c` has been retired
- crafting benches are assets with `asset_class_code = 'crafting_bench'`; `entity_type_code = 'crafting_bench'` has been retired
- bench-specific details live as asset properties, media, relationships, and recipe/bench relationships unless a future profile table is justified
- release state, entity types, and cross-entity relationships belong under `game_entity_*`
- relationship results use `game_entity_relationships_r`, because relationships are not asset-only
- recipe generic resources are canonical recipe concepts under `game_recipe_generic_group_types_c`, `game_recipe_generic_groups_c`, and `game_recipe_generic_connections_r`
- recipe catalysts live under `game_recipe_catalysts_r`
- variant, variant value, and variant source mapping history is maintained under `_h` tables and wired through `game_sync_patch`
- `domain_entity_id` remains a compatibility bridge and must not be removed until the Riseopedia read models are stable

Future first-class feature families may receive their own prefix only when they become real standalone domains.

Potential future examples:

- `map_*`
- `event_*`

Do not create new naming families only for cosmetic symmetry.

## 6. Security and access model

Security requirements:

- `SECURITY DEFINER` functions must use fixed `search_path`
- SQL references should be schema-qualified
- runtime grants should expose only needed read and execute surfaces
- app routes must not depend on hidden buttons or client-only checks for security
- admin API routes must guard themselves even when pages are guarded
- member API routes must guard themselves even when pages are guarded
- mutation APIs should use same-origin protection unless explicitly exempted for a token-protected endpoint
- upload and media routes must validate file types, paths, and serving behavior
- SVG handling must remain sanitizer-controlled
- external links and embedded media must use approved validation paths
- revalidation must remain token-protected and should not accept secrets in URL parameters

Access model:

- Discord is the source for identity and guild role membership
- role cache and access summary are DB-backed
- access can include public, authenticated, rank-based, editor, and admin behavior
- governed content and navigation visibility should use DB-backed access evaluation
- Discord login must fail closed when login-time guild/member/role sync cannot complete
- server-rendered actor-sensitive public surfaces must refresh due role caches before granting gated menu/content access
- if role verification is due and cannot complete, public surfaces render as public/anonymous instead of trusting stale elevated access
- admin capability does not make every normal surface behave as admin

Context model:

```text
/admin/*     = admin context
/api/admin/* = admin API context
/me/*        = member context
/api/me/*    = member API context
everything else = public or public-content context unless a route explicitly requires auth
```

Do not merge admin and member workflows into one generic workflow when:

- visible fields differ
- allowed actions differ
- media visibility differs
- policy controls differ
- ownership rules differ
- validation differs
- error or security behavior differs

---

## 7. Admin app taxonomy

Use domain-grouped folders for active admin work:

```text
apps/web/src/app/api/admin/<domain>/*
apps/web/src/app/admin/<domain>/*
apps/web/src/components/admin/<domain>/*
```

Current active admin domains:

```text
discord
riseopedia
web
```

Examples:

```text
apps/web/src/app/api/admin/discord/*
apps/web/src/app/api/admin/riseopedia/*
apps/web/src/app/api/admin/web/*
apps/web/src/app/admin/discord/*
apps/web/src/app/admin/riseopedia/*
apps/web/src/app/admin/web/*
apps/web/src/components/admin/discord/*
apps/web/src/components/admin/riseopedia/*
apps/web/src/components/admin/web/*
```

Do not create empty domain folders for theoretical future features.

---

## 8. Active admin families

### Discord domain

- Discord roles
- Discord users

Discord-owned truth remains system-owned. Admin-local editing should stay narrow and explicit.

### Riseopedia domain

- sections
- section classification rules
- patch publication channels
- patch publications
- patch scope overrides
- release evidence
- release decisions
- release overrides
- display profiles
- display profile bindings
- display profile properties/elements
- display profile variant selectors
- overview card rule sets
- overview card rule elements
- relationship display rules
- property catalog inspection/options

Riseopedia admin is game-domain administration over guarded `web_api.riseopedia_*` actions and `web_view.riseopedia_admin_*` read contracts. It must preserve the app/database boundary and must not directly CRUD `web_priv` or `game_data` from app code.

### Web domain

- theme colors
- icons
- categories
- subcategories
- content kinds
- content
- external link hosts
- media
- navigation panels
- navigation designer
- series
- YouTube channels
- templates family
  - templates
  - template field types
  - template field tools
  - template field list
  - template field list tools
  - template field options
  - per-template template fields

These families must respect the correct normalization pattern from `docs/codebase_rules.md`.

---

## 9. Active public and member surfaces

Current active public surfaces:

- public navigation menu
- public footer explore menu
- normal content route: `/<category>/<subcategory>/<content>`
- prefixed content routes:
  - `/map/<category>/<subcategory>/<content>`
  - `/tool/<category>/<subcategory>/<content>`
  - `/app/<category>/<subcategory>/<content>`
  - `/event/<category>/<subcategory>/<content>`
  - `/custom/<category>/<subcategory>/<content>`
  - `/video/<category>/<subcategory>/<content>`
- public series route: `/series/<slug>`
- Riseopedia/Mafiosopedia info routes under `/info/<category>`
- transitional map viewer route: `/maps/<map>`
- placeholder homepage
- placeholder category page
- placeholder subcategory page
- placeholder terms and privacy pages

Placeholder pages are intentionally active but not final product design.

Current active member surfaces:

- member profile page and API
- member role/access summary API
- member authoring collection lookup API
- member content dashboard
- member collection content dashboard
- member content create API
- member content edit/update API
- member media dashboard and API
- member series dashboard and API
- member theme lookup API

Member authoring is V1 scope. It must remain member-context code, not a clone of admin content admin.

---

## 10. Navigation and content rules

Navigation is DB-first.

Navigation panels:

- are editable admin-defined menu structures
- are selected by slot for app rendering
- should use `panel_slot_code` as the important app lookup key
- may use `panel_type_code` as broad surface/rendering family when useful
- save full-tree changes through a DB business function
- should not directly CRUD private navigation child tables from app code

Navigation access model:

- panel access chooses the menu structure
- category, subcategory, and content access choose what is visible inside that menu
- saved stale rows should remain visible in admin until removed or replaced
- public rendering should apply real access checks and preserve saved readable branches according to current DB behavior
- public rendering should resolve a fresh server-side actor before passing actor identity into DB navigation/content read functions

Content route model:

- content kind controls route and render behavior
- `public_route_prefix` controls public URL family
- `renderer_code` controls renderer dispatch
- direct URL rendering requires DB resolver success
- wrong prefix should not render the content
- unreadable or non-renderable content should not render
- YouTube content must use the approved YouTube validation and channel allowlist path
- external links must use the approved external host validation path
- internal links must use the approved internal link validation path

---

## 11. Normalization model

Admin lists use two main normalization tracks.

### Small-list admin pattern

Use for compact dictionaries, code-table-style admin families, and low-volume reference families:

- theme colors
- icons
- categories
- subcategories
- content kinds
- external link hosts
- YouTube channels
- templates family
  - templates
  - template field types
  - template field tools
  - template field list
  - template field list tools
  - template field options
  - per-template template fields

Target shape:

- local table-owned create/edit panel state
- local `rows`
- local `search`
- local pagination where useful
- parent-owned panel lifecycle
- panel `onSaved -> refresh`
- row-level `busyId`
- inline load and mutation error banners

Use boring names:

```text
rows
row
search
loading
error
busyId
panelOpen
panelMode
```

### Server-driven admin pattern

Use for operational, larger, or governed families:

- Discord roles
- Discord users
- content
- media
- series
- navigation panels

Target shape:

- query-param-driven `search`, `page`, `pageSize`, and filters where applicable
- route returns current page only
- current query context is preserved after mutation
- parent-owned panel lifecycle
- panel `onSaved -> refresh` through normal parent-controlled flow
- row-level `busyId`
- inline load and mutation error banners

Server-driven list routes usually return:

```text
{
	rows,
	page,
	pageSize,
	totalDocs,
	totalPages
}
```

### Navigation designer pattern

Navigation designer is not a generic table pattern.

It should use:

- server-backed initial panel load
- full-tree local editing
- DB lookup pickers
- drag/drop where useful
- stale saved rows visible until removed or replaced
- one save action that replaces the full panel tree through DB business logic

### Member-owned pattern

Member authoring surfaces are member-context workflows.

They may be server-backed and query-driven where useful, but they must not reuse admin mutation contracts directly when ownership, visibility, validation, or allowed actions differ.

---

## 12. Bootstrap and operations baseline

The repo contains V1 bootstrap and operator support.

Bootstrap ownership:

- `infra/bootstrap` contains repo-owned bootstrap logic and metadata
- `infra/postgres-init` contains database container init integration
- real `.env`, `.env.bootstrap`, secrets, media payloads, and deployment data are not repo-owned docs/code

Bootstrap should preserve:

- `cm` as owner/migration role
- `cm_client` as runtime app role
- `game_data`, `web_priv`, `web_api`, `web_view`, and `web_analytics` layering
- imported IDs where bootstrap data needs stable references
- sequence resets above imported rows
- security boundary verification
- media verification when configured

Operator scripts should be small, explicit, and safe to inspect. Destructive behavior must be clear from naming, prompts, or documentation.

Security and CI support includes:

- strict TypeScript checks through lint
- security posture script
- production dependency audit script
- Docker image pinning checks
- same-origin mutation guard checks
- security header checks
- upload and SVG posture checks
- secret and archive hygiene checks

---

## 13. What must not happen

Do not:

- restart the architecture from scratch
- move business-rule ownership into route handlers
- directly CRUD private truth tables from app code
- require runtime owner privileges
- merge admin and member workflows into a generic contract when their behavior differs
- replace working project-specific logic with generic abstractions
- use one list pattern for all admin families
- call a workflow complete if route/client/DB contracts are inconsistent
- delete active behavior without confirming imports, routes, and usage
- hide DB contract problems in route code when the correct fix belongs at the DB boundary
- use old external snapshot URLs as source of truth
