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

Use these database layers exactly:

```text
web_priv
	private tables
	private helpers
	trigger helpers
	validation helpers
	sync helpers
	access helpers
	business internals

web_api
	app-callable business functions
	app-callable write functions
	approved action functions
	approved app resolver functions where intentionally exposed

web_view
	app read surfaces
	lookup surfaces
	admin read contracts
	member read contracts
	public read contracts
```

Application contract:

- reads should come from `web_view` or a clearly approved read function
- writes should go through `web_api`
- private implementation details stay under `web_priv`
- direct table ownership must not move into route handlers
- app runtime must not require owner privileges
- `public` must not be reintroduced as the main project schema

Runtime roles:

```text
cm        = owner / migration role
cm_client = runtime app role
```

Do not design solutions that require `cm_client` to behave like `cm`.

---

## 5. DB object naming taxonomy

Current approved DB object prefixes:

- `actor_`
- `auth_`
- `discord_`
- `web_`

Meaning:

- `actor_` = current actor access evaluation and permission helpers
- `auth_` = authentication and account-linking concerns
- `discord_` = Discord-sourced identity and role sync concerns
- `web_` = current web platform families

Schema prefix rules:

```text
web_priv may use actor_, auth_, discord_, web_
web_api  may use auth_, discord_, web_
web_view may use auth_, discord_, web_
```

Future first-class feature families may receive their own prefix only when they become real standalone domains.

Potential future examples:

- `map_*`
- `event_*`
- `game_*`

Do not create new naming families only for cosmetic symmetry.

---

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
web
```

Examples:

```text
apps/web/src/app/api/admin/discord/*
apps/web/src/app/api/admin/web/*
apps/web/src/app/admin/discord/*
apps/web/src/app/admin/web/*
apps/web/src/components/admin/discord/*
apps/web/src/components/admin/web/*
```

Do not create empty domain folders for theoretical future features.

---

## 8. Active admin families

### Discord domain

- Discord roles
- Discord users

Discord-owned truth remains system-owned. Admin-local editing should stay narrow and explicit.

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
- `web_priv`, `web_api`, and `web_view` layering
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
