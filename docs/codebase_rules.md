<!-- FILE: docs/codebase_rules.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia Codebase Rules

## Purpose

This file defines how Corn Mafia code, SQL, routes, UI surfaces, helper layers, scripts, and AI-generated work should be designed, formatted, reviewed, and discussed.

Use this file together with:

- `docs/project_definition.md` for architecture and non-negotiable project boundaries
- `docs/style_system.md` for CSS, visual styling, brand, tokens, and inline style exceptions
- `docs/roadmap.md` for future sequencing

If this file conflicts with `docs/project_definition.md`, the project definition controls architecture, privilege, and scope.

---

## 1. Source of truth

Follow the current real repository and current live SQL first.

Before making changes that depend on current behavior:

- inspect actual file contents
- inspect real imports and usage
- inspect current SQL definitions when DB contracts matter
- do not assume old issues still exist
- do not invent unknown file contents
- ask for the missing file or SQL when a required source is not available

Do not use old external snapshot URLs as source of truth.

---

## 2. Working mindset

The preferred working mindset is:

- practical
- incremental
- project-specific
- readable
- manually maintainable
- architecture-aware
- security-aware
- respectful of existing working logic

The goal is not the shortest code. The goal is code that fits the real Corn Mafia platform direction and can continue evolving without architectural backtracking.

---

## 3. Generated output rules

When generating code or config files:

- generate full files, not patches
- output each file separately
- include a file path header inside every generated file
- use strict TypeScript
- never use `any`
- never use `any[]`
- never use `Record<string, any>`
- prefer `unknown` and narrow with type guards
- do not invent unknown file contents
- do not simplify existing code unless necessary for the task
- preserve working logic unless the requested change requires a local change
- prefer minimal local refactors over conceptual rewrites
- finish whole-file mechanical renames if touching naming
- keep imports syntactically clean
- fix touched route/client contracts together in the same pass
- do not output diff format unless explicitly requested
- do not output partial snippets unless explicitly requested
- do not generate helper scripts unless explicitly requested
- keep files UTF-8 safe

When generating downloadable artifacts, prefer a `.zip` or `.tar.gz` that extracts directly into the repository root. Do not add an extra wrapper folder unless the user asks for one.

---

## 4. TypeScript strictness

Never use:

```ts
any
any[]
Record<string, any>
```

Prefer:

```ts
unknown
unknown[]
Record<string, unknown>
```

When consuming unknown data:

- narrow with `typeof`
- narrow with `Array.isArray`
- use custom type guards
- use runtime validation where helpful
- cast only after narrowing or validation

Event handlers and callbacks should use concrete types where known. If unknown input is unavoidable, accept `unknown` and narrow before use.

Do not use unsafe catch handling such as:

```ts
e as Error;
```

Prefer helper functions that safely extract messages from `unknown`.

---

## 5. File headers

Use a boxed header at the top of TS, TSX, JS, MJS, and config files where practical.

Example:

```ts
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/example/file.ts                                                                         ////
//// Language: TS                                                                                               ////
//// Short description of file purpose.                                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
```

Rules:

- include `FILE:` row
- include `Language:` row
- include one short purpose row
- keep spacing neat and consistent
- do not duplicate extra file comments below the main header
- remove stale comments that no longer describe real behavior

Markdown docs may use this form:

```md
<!-- FILE: docs/example.md -->
```

---

## 6. Import rules

When editing imports:

- do not insert a new import into the middle of an existing multiline import block
- after import edits, verify the final import section as plain syntax
- remove unused imports when touching a file
- do not keep compatibility imports after the current flow no longer uses them
- keep server-only imports out of client components
- keep client-only imports out of server-only helpers

---

## 7. Naming rules

Use explicit names.

Avoid vague names like:

```text
data2
temp
thing
stuff
```

For admin tables and panels, prefer:

```text
rows
row
search
page
pageSize
loading
error
busyId
panelOpen
panelMode
```

Do not arbitrarily alternate between `items`, `docs`, `records`, and family-specific collection names in equivalent admin list components.

Domain-specific names are allowed when they materially improve clarity, but list rendering code should default to `rows` and `row`.

---

## 8. DB-first app boundary rules

The project direction is DB-first.

Use these database layers:

```text
game_data       = raw imports, patch/source metadata, discovery evidence, and game_transform_* rules
web_game        = canonical transformed game truth, history, relationships, media, properties, release facts, and sync internals
web_riseopedia  = Riseopedia/Mafiosopedia publication, sections, display policy, presentation mappings, and refresh internals
web_priv        = auth, Discord, CMS, member, navigation, media, template, access, and platform-private truth
web_api         = app-callable business functions, writes, approved actions, and guarded admin wrappers
web_view        = app read surfaces and admin/member/public read contracts
web_analytics   = QA, audit, validation, data-quality, and operator analytics
```

Application contract:

- app reads from `web_view` or approved DB read functions
- sensitive admin analytics are exposed through guarded `web_api` functions when app access is needed
- `web_analytics` is not a public read contract and must not replace `web_view`
- app writes through `web_api`
- app must not directly perform CRUD on `web_priv`, `web_game`, or `web_riseopedia`
- app must not directly perform CRUD on `game_data` import or transform tables
- app code must not make the runtime user behave like the owner
- `public` must not be reintroduced as the main project schema
- new schema families require explicit architectural agreement and documentation updates

Runtime and ownership:

```text
cm_client = runtime app user
cm        = owner / migration user
```

## 9. App contexts

Context model:

```text
/admin/*     = admin context
/api/admin/* = admin API context
/me/*        = member context
/api/me/*    = member API context
everything else = public or public-content context unless a route explicitly requires auth
```

Do not collapse admin and member workflows into one generic API, form, or object when:

- fields differ
- permissions differ
- media visibility differs
- policy controls differ
- ownership behavior differs
- validation differs
- error handling differs

Safe reuse:

- UI primitives
- renderers
- pure helpers
- validation helpers
- DB-filtered read helpers

Unsafe reuse:

- broad all-context mutation bodies
- admin panels reused directly for member workflows
- route handlers that infer context from optional fields instead of route context

---

## 10. Guard rules

### Page guard first

For admin and member pages that render privileged or context-shaped data:

- guard at page level first when practical
- load only the data needed for the initial surface
- avoid rendering a shell that then fails because the user was never allowed to see it

### API guard always

Even when a page is guarded:

- API routes must guard themselves
- route handlers must not trust hidden buttons or client-side conditions
- route handlers must validate actor context before business operations

Security comes from:

- route guards
- server-only code paths
- same-origin mutation protection
- rate limiting where needed
- database permissions
- `web_view` and `web_api` boundaries
- DB-backed access evaluation

---

## 11. Admin route rules

Use shared admin route plumbing from:

```text
apps/web/src/lib/server/admin-route.ts
```

Use shared helpers for:

- JSON success/error response shape
- admin and admin-or-editor denial responses
- actor Discord ID extraction
- parse helpers
- string/int/boolean normalization
- baseline error classification

Do not redeclare route-local guard or actor extraction helpers when the shared helper already covers the case.

Response naming:

- list GET routes return `rows`
- single-row GET routes return `doc`
- successful mutations return `ok: true`
- mutations may return `doc` only when the changed row is needed by the client
- server-driven list routes may also return `page`, `pageSize`, `totalDocs`, and `totalPages`

When normalizing route response names, finish the rename through the whole touched flow:

- loaded variable declaration
- derived lookups
- returned JSON shape
- client-side reader
- singular vs collection state naming

Do not half-normalize a route/client pair.

Do not fix DB function contract bugs by hiding them in route code when the correct fix belongs at the DB boundary.

---

## 12. Admin table normalization

Admin lists use two main normalization tracks.

### Small-list pattern

Use for compact dictionaries, code-table-style admin families, and low-volume reference families:

- Riseopedia patch/publication/display-profile rule families when the route returns compact dictionary-style rows
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
- `onSaved -> refresh`
- row-level busy guard such as `busyId`
- inline error banner for load/mutation failures

Small-list GET routes usually return:

```text
{ rows }
```

They should not pretend to be server-driven paginated routes unless real data volume and workflow require it.

### Server-driven pattern

Use for operational, larger, or governed families:

- Discord roles
- Discord users
- content
- media
- series
- navigation panels
- Riseopedia operational/admin families when route pagination/filtering is needed

Target shape:

- query-param-driven `search`, `page`, `pageSize`, and filters where applicable
- route returns current page only
- current query context preserved after mutation
- parent-owned panel lifecycle
- `onSaved -> refresh` through normal parent-controlled flow
- row-level busy guard such as `busyId`
- inline error banner for load/mutation failures

Server-driven list GET routes usually return:

```text
{
	rows,
	page,
	pageSize,
	totalDocs,
	totalPages
}
```

### All admin tables

All admin tables should:

- prefer `rows` for collections
- prefer `row` for the current rendered/edited/deleted item
- use clear row-level busy guards such as `busyId`
- keep destructive confirmation behavior consistent
- keep error banner handling consistent
- avoid raw browser `alert` calls
- use shared icon rendering where real render parity matters
- refresh the current list state after mutation
- preserve current query context for server-driven lists
- avoid custom browser events for normal refresh

---

## 13. Panel rules

Use a named exported `*PanelProps` interface for admin panels.

Parent owns:

- `open`
- `mode`
- selected item
- `onClose`
- `onSaved`

Panel owns:

- field state
- validation
- submit lifecycle
- metadata/detail loading where needed

Separate state names:

```text
topError     = submit/save failures
metaError    = metadata/detail loading failures
submitting   = submit state
metaLoading  = metadata/detail loading state
```

Panel rules:

- failed save must not trigger success callbacks
- failed save must not auto-close the panel
- manual close remains allowed
- closing/reopening a panel should clear stale banner errors
- field-level validation belongs under the relevant inputs
- metadata loading text should not be pushed through submit error banner state
- keep shared `PanelForm` usage where equivalent panels already use it

---

## 14. Meta loading patterns

Use one of these patterns intentionally.

### Page-preloaded meta

Use when:

- the page always needs the data
- the option set is light and stable

Examples:

- category options
- role policy options
- small icon/theme option sets

### Panel-lazy meta

Use when:

- only the panel needs the data
- loading it at page start is wasteful
- detail loading depends on selected row

### Dedicated meta API route

Use when:

- multiple client components need the same reference data
- reference data must refresh independently
- panel reference data is separate from main list data
- a form needs a coherent option bundle

Admin `meta` routes are for reference data and form option bundles, not for main list CRUD.

Do not scatter the same meta fetch across multiple child components without reason.

---

## 15. Data helper rules

Data helpers should:

- preserve DB-first boundaries
- keep `web_view` reads and `web_api` writes
- avoid direct private table CRUD
- use stable app-facing types
- keep mapper helpers private unless genuinely shared
- return UI-ready option shapes when practical
- avoid forcing page-level remapping when the helper can return a stable app contract
- normalize formatting and exposed surfaces
- keep strict TypeScript
- never use `any`

Verb conventions:

- `list*` for collections
- `find*` for nullable single lookup
- `get*` only when computed, derived, or guaranteed retrieval is intended
- `create*`, `update*`, `delete*`, `replace*`, `save*` for business/write actions matching DB function meaning

---

## 16. Navigation surface rules

Navigation admin is an active DB-first admin family.

Navigation panel admin should support:

- panel list
- create/edit panel metadata
- delete where allowed
- open designer for selected panel
- clear enabled/default/slot behavior
- inline load/save errors

Navigation designer should support:

- full-tree local editing
- categories
- subcategories
- content targets
- drag/drop where useful
- picker rows from DB lookup surfaces
- stale saved rows visible until removed or replaced
- one save action replacing the full panel tree through DB business function

Do not directly CRUD private navigation child tables from app code.

Public navigation should:

- request a slot
- use DB-resolved panel structure
- resolve a fresh server-side actor before passing actor identity to navigation DB functions
- render readable saved branches according to current DB result
- avoid duplicating business access rules in client components

---

## 17. Content surface rules

Content admin is an active DB-first admin family.

Content admin should remain server-driven unless a future audit proves a different need.

Content routes should:

- use the shared DB content resolver path
- respect category, subcategory, content, route prefix, status, and access checks
- use renderer dispatch by content kind renderer code
- avoid special-case page assumptions in public routes
- not render a content item under the wrong public route prefix
- not render unreadable or non-renderable content

YouTube content must use the approved YouTube URL, channel, and metadata validation helpers. Admin-managed YouTube channel rows are an active web-domain admin family.

External links must use approved host validation. Internal links must use approved internal link validation.

---

## 18. Member authoring rules

Member authoring is V1 scope.

Member surfaces live under:

```text
apps/web/src/app/me/*
apps/web/src/app/api/me/*
apps/web/src/components/me/*
apps/web/src/lib/data/member-*.ts
```

Member authoring must remain member-context code.

Rules:

- guard member pages and APIs
- enforce actor ownership through route and DB boundaries
- do not reuse admin mutation contracts directly when ownership, visible fields, policy, or validation differs
- use member-specific DB functions for member content, member media, member series, and member profiles
- keep member media visibility and ownership separate from admin media behavior
- keep member content creation constrained by authorable collection metadata
- keep member series behavior separate from admin series management when fields or permissions differ

Safe reuse:

- renderers
- UI primitives
- pure validators
- media URL helpers
- DB-filtered lookup helpers

Unsafe reuse:

- admin panels as member panels
- admin content mutation bodies as member mutation bodies
- broad all-context save functions

---

## 19. Security coding rules

Security-sensitive code must stay explicit and boring.

Required patterns:

- API mutations use same-origin proof unless explicitly exempted
- token-protected endpoints must not accept secrets in URL parameters
- route handlers validate input before calling DB functions
- Discord sign-in performs required guild/member/role sync in the `signIn` callback and returns `false` when that sync cannot complete
- server-rendered actor-sensitive public surfaces refresh due role caches before granting gated navigation/content/media access
- file uploads validate declared MIME and binary signatures where applicable
- media paths must remain safe relative storage paths
- SVG serving must use sanitizer-controlled paths
- external links must use allowlist validation
- YouTube URLs/channels must use approved validation helpers
- central security headers belong in Next config
- rate limiting should be used on abuse-sensitive endpoints
- server-only helpers should import `server-only` where appropriate
- Docker runtime should remain non-root and hardened
- runtime should not receive broad table grants

---

## 20. SQL core mindset

SQL in this codebase should feel deliberate and manually maintainable.

Prefer:

- readable SQL over clever SQL
- explicit logic over compact logic
- project-specific continuation over generic rewrites
- stable naming over novelty
- `LEFT JOIN`-based readability over dense CTE chains
- simple subselects when they keep logic local
- `WITH` only when it clearly improves readability, reuse, recursion, or optimization
- schema-qualified object references
- DWH/audit-friendly structures
- current-state tables plus separate history where needed
- plural table names
- uppercase SQL keywords
- tabs for indentation

Avoid:

- generic ORM-looking SQL
- unnecessary `WITH` clauses
- clever compression
- unexplained architecture changes
- changing existing working logic just for style preference
- introducing new naming families without agreement

---

## 21. SQL naming conventions

Use lowercase names for:

- schemas
- tables
- columns
- aliases
- functions
- procedures
- sequences
- constraints

Use uppercase only for SQL keywords and existing legacy names that already require it.

Use plural table names by default.

Table suffixes:

| Suffix    | Meaning                                                  |
| --------- | -------------------------------------------------------- |
| no suffix | current-state table                                      |
| `_f`      | fact / log-style table                                   |
| `_h`      | history / SCD2 / historized table                        |
| `_c`      | code / reference table                                   |
| `_r`      | many-to-many relationship table                          |
| `_r_h`    | historized relationship table                            |
| `_l`      | lookup / source-resolution / lightweight reference table |

Current-state tables store the current truth only.

History tables use `_h` and commonly include:

```sql
valid_from
valid_to
del_flag
audt_dt
audt_proc_id
audt_user
```

Open-ended validity should use:

```sql
valid_to = '2999-12-31'
```

Low/default historical date should use:

```sql
valid_from = '1900-01-01'
```

Code/reference tables use `_c`.

Relationship tables use `_r`; relationship history uses `_r_h`.

Lookup/source-resolution tables use `_l`.

Project-specific schema and naming rules:

```text
game_data.game_transform_*_c = source transformation/configuration rules
web_game.game_*              = canonical game current/history/relationship facts and sync internals
web_riseopedia.riseopedia_*  = wiki product configuration
web_riseopedia.game_*        = wiki publication/presentation mappings
web_priv.auth_/discord_/web_*= platform-private truth
web_analytics.*              = QA/read-only analytics views and summaries
```

Game-domain object families:

```text
game_asset_*    = assets and asset-specific dimensions
game_entity_*   = cross-entity identity, release state, and relationships
game_media_*    = game media and media mappings
game_recipe_*   = recipes and recipe-specific dimensions
game_quest_*    = quests and quest-specific dimensions
game_transform_* = import/source transformation and resolution rules
```

Transform/config tables belong in `game_data` unless there is a specific reason they must be canonical current truth.
Canonical game truth belongs in `web_game`; platform-private truth belongs in `web_priv`; wiki product policy belongs in `web_riseopedia`.
QA and audit diagnostics belong in `web_analytics`.

---

## 22. SQL column conventions

Audit columns:

```sql
audt_dt
audt_proc_id
audt_user
```

Source tracking columns:

```sql
src_id
src_sys_id
```

Validity columns:

```sql
valid_from
valid_to
valid_date
```

Logical delete flag:

```sql
del_flag
```

Prefer `_flag` for project-defined flags.

Use `_flg` only when mirroring existing legacy/source naming or an existing table style.

---

## 23. SQL sentinel values

Preserve the project sentinel convention.

| Value        | Meaning                                                  |
| ------------ | -------------------------------------------------------- |
| `XNA`        | source value missing / not available                     |
| `XER`        | source value exists but cannot be resolved / error state |
| `-1`         | missing / not available numeric value                    |
| `-2`         | unresolved / error numeric value                         |
| `1900-01-01` | low/default missing date                                 |
| `2999-12-31` | open-ended validity date                                 |

Common helper functions may include:

```sql
xnan
xnad
xnat
xnac
xern
xerc
flg
```

When existing helper functions are available, prefer them instead of inventing new sentinel-handling logic.

---

## 24. SQL procedure and function naming

Use package-style procedure names for DWH/ETL-style procedures.

Pattern:

```text
pckg_<layer>_<entity_plural>_<suffix>_<source_or_action>
```

Examples:

```sql
pckg_l1_card_groups_c_ekv0
pckg_l1_card_groups_c_mis0_ini
pckg_l1_cards_h
pckg_l1_addresses_l_reg0
pckg_l0_reg0_del_job
```

For DB-first app-facing functions and views, use subject-first naming with the approved domain-prefix taxonomy.

Current approved prefixes:

- `actor_`
- `auth_`
- `discord_`
- `game_`
- `web_`

Verb meanings:

| Verb          | Meaning                                        |
| ------------- | ---------------------------------------------- |
| `assert`      | validate required condition and raise if false |
| `find`        | lookup helper, nullable is acceptable          |
| `get`         | return computed result                         |
| `insert`      | create only                                    |
| `update`      | update only                                    |
| `upsert`      | insert-or-update for current synced truth      |
| `replace`     | replace full set                               |
| `sync`        | external truth to DB synchronization           |
| `recalculate` | derived values                                 |
| `record`      | audit/history action                           |

---

## 25. SQL formatting rules

Always use uppercase SQL keywords.

Use tabs for indentation. Spaces may be used for fine visual alignment after indentation.

SQL clause keywords should start with their first meaningful expression on the same row when readable.

Applies to:

- `SELECT`
- `INSERT INTO`
- `UPDATE`
- `SET`
- `FROM`
- `WHERE`
- `DELETE FROM`
- `VALUES`
- `RETURNING`
- `CALL`
- `PERFORM`
- `IF`
- `ELSIF`
- `CASE WHEN`
- `EXISTS`
- `NOT EXISTS`
- inline subselects

Short rule:

```text
Keyword + first expression on the same row.
Continuation lines visually aligned.
Operators vertically aligned when practical.
```

Preferred `SELECT` shape:

```sql
SELECT src.card_group_id,
	   src.card_group_name,
	   src.src_id,
	   src.src_sys_id
FROM l0_ekv0.l0_ekv0_card_groups src
WHERE src.del_flag = 0
  AND src.valid_to = '2999-12-31'
;
```

For `INSERT INTO`, keep the table name, opening parenthesis, and first column on the same row.

Preferred:

```sql
INSERT INTO l1.l1_user_roles_c(user_role_id,
							   user_role_name,
							   src_id,
							   src_sys_id)
```

For inline subselects, keep the opening `SELECT` on the same row as the parenthesis.

Preferred:

```sql
FROM (SELECT DISTINCT user_role_name,
					 user_role_id AS src_id,
					 'mis0' AS src_sys_id
	  FROM l0_mis0.l0_mis0_user_roles
	  WHERE user_role_name IS NOT NULL) src
```

Prefer `LEFT JOIN` unless an inner join is semantically required.

Prefer aligned operators in multi-line `ON`, `WHERE`, `SET`, `CASE`, and assignment blocks when practical.

`WITH` is allowed but not preferred by default. Use it only when it improves readability, reuse, recursion, or optimization.

---

## 26. SQL Wooden Engine headers

Use boxed Wooden Engine comment headers in SQL definitions when the object supports comments inside its stored definition body or query text.

Preferred 5-row style:

```sql
--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
--//// PROCEDURE: l1.pckg_l1_example                                                                            ////
--//// PURPOSE: Loads examples into l1.l1_examples                                                              ////
--//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
```

For functions and procedures, place the header immediately after `AS $$`, `AS $_$`, or the opening dollar-quote/body delimiter.

If a DB object does not have a valid internal body where this header can live, do not invent invalid placement just for symmetry.

---

## 27. SQL DDL naming rules

Primary keys:

```text
<table_name>_pk
```

Unique constraints:

```text
<table_name>_uq
<table_name>_uq2
```

Sequences:

```text
<table_name>_id_seq
<table_name>_h_id_seq
```

ID-generating sequences should start at `1000000000` for uniformity.

Preferred sequence DDL shape:

```sql
CREATE SEQUENCE l1.l1_cards_id_seq
	START WITH 1000000000
	INCREMENT BY 1
	NO MINVALUE
	NO MAXVALUE
	CACHE 1
;
```

Do not alter existing sequence start values unless the task is specifically a sequence-normalization migration.

---

## 28. Generated SQL output rules

When generating SQL:

- generate full object definitions when requested, not fragments, unless the user asks for a patch only
- preserve existing working logic unless change is necessary
- inspect equivalent definitions in the current SQL dump first when available
- mirror the existing structural pattern for header placement, delimiter choice, `SECURITY DEFINER`, `search_path`, owner, and grants
- keep boxed function/procedure/view headers
- use readable join-based style
- schema-qualify references
- use fixed `search_path` in `SECURITY DEFINER` functions
- use tabs for indentation
- keep UTF-8 safe
- do not introduce unknown object names as facts

---

## 29. Audit working rules

When the user asks for audit or analysis only:

- generate no code unless explicitly asked for fixes after the audit
- do not rewrite files
- do not redesign architecture
- do not suggest generic abstractions
- do not simplify existing code unless it is part of a concrete standards finding
- use strict project-specific judgment
- be mechanical and exact
- finish whole-file reasoning when classifying a file
- check actual file contents
- check real import usage and live contracts where relevant

Inspect:

- admin pages
- admin API routes
- member pages
- member API routes
- public pages and content routes
- admin tables
- admin panels
- member dashboards and panels
- supporting data helpers
- server helpers
- DB-facing app helpers used by active families
- SQL contracts where needed
- package and tooling config

Check for:

- incomplete migration residue
- legacy compatibility leftovers
- response-shape drift
- helper naming drift
- panel contract drift
- query-state drift
- `row` / `rows` / `doc` naming drift
- mismatched props caused by half-applied normalization
- metadata loading mixed into submit error state
- server-driven families using local/client-owned list behavior incorrectly
- small-list families depending on query params for create/edit/list context without proven reason
- admin/member workflow flattening
- direct private-schema (`web_priv`, `web_game`, `web_riseopedia`, `game_data`, `web_analytics`) access from app source
- security-sensitive route mistakes
- stale or undocumented inline style exceptions

---

## 30. Warning cleanup priority

During stabilization or cleanup passes, prioritize warnings in this order:

1. `no-unused-expressions`
2. `react-hooks/exhaustive-deps`
3. unstable memo or callback dependency warnings
4. unused eslint-disable directives
5. unused imports, helpers, or local variables

Reason:

- the first three categories often hide behavior bugs
- unused declarations are usually lower risk but should still be cleaned before calling a pass finished

---

## 31. Game data and property handling rules

Game data uses a source-to-canonical-to-product model.

Authoritative placement:

```text
game_data
	raw imports, patch/source metadata, discovery evidence, game_transform_* rules

web_game
	canonical entities, variants, source mappings, properties, media, relationships,
	domain facts, histories, release facts, patch changes, transform candidates, and sync

web_riseopedia
	publication channels, sections, display profiles/body blocks/cards, semantic rules,
	presentation media mappings, and wiki read-model refresh

web_view
	app-facing channel/public/admin read contracts

web_analytics
	QA and operator diagnostics
```

Transform rules:

- source identity, naming, classification, variant, coordinate, relationship, media, property, loot, progression, and release rules belong in existing `game_data.game_transform_*` families;
- do not encode source mistakes in UI/routes;
- reuse value maps, source links, relationship connections, and rule parts before proposing a new rule family;
- candidate functions and canonical writers live in `web_game`;
- product display/publication policy lives in `web_riseopedia`;
- mappings and aliases are evidence, not canonical public identity.

Current canonical entity types:

```text
asset
recipe
location
mechanic
perk
poi
quest
```

Current canonical model:

- `web_game.game_entities` owns cross-domain identity;
- there are no separate current-state `game_assets` or `game_recipes` tables;
- concrete variants live in `web_game.game_entity_variants_r`;
- variant dimensions/values live in `game_entity_variant_groups_c`, `game_entity_variant_value_codes_c`, and `game_entity_variant_values_r`;
- source evidence lives in `game_entity_variant_source_mappings_r`;
- aliases resolve messy references and slugs but are not durable relationship targets;
- brands are entity-level;
- properties are typed, variant/source-aware values;
- media is canonical media/file/assignment data, not a normal property;
- recipes use component/output/generic/catalyst tables;
- quests, mechanics, progression, coordinates, routes, spawn areas, placements, and loot use their current canonical tables;
- relationships use deterministic natural keys and provenance tie-breakers.

ID-preserving sync:

1. build deterministic candidates;
2. update existing rows by natural key only when values differ;
3. insert missing rows;
4. delete/deactivate stale generated rows only when the candidate disappeared;
5. preserve manual/override rows;
6. identical input must converge without ID or semantic churn.

Property rules:

- raw payloads and source identity remain evidence;
- zero is not globally null;
- XNA/-1 means missing/not applicable and XER/-2 means unresolved/error;
- media, brands, rarity, and source paths are not generic display properties;
- arrays/objects are exploded only when meaning is known and useful;
- exact property-value links require one unambiguous canonical target.

Recipe rules:

- generic requirements use `web_game.game_recipe_generic_group_types_c`, `game_recipe_generic_groups_c`, and `game_recipe_generic_connections_r`;
- catalysts use `web_game.game_recipe_catalysts_r`;
- returned tools represented as catalysts must not also create false component/output relationships.

History and release:

- current-state tables store current truth;
- `_h` tables preserve patch snapshots;
- `web_game.game_sync_patch_history` creates histories;
- `web_game.game_sync_patch_entity_patch_changes` creates patch-note facts;
- canonical release evidence/decisions live in `web_game`;
- publication channels and wiki display policy live in `web_riseopedia`.

Revalidation and runtime:

- owner/operator sync functions stay private in `web_game`;
- runtime actions are exposed only through guarded `web_api` functions when intentionally needed;
- `cm_client` receives no direct private-schema usage or private-function execution;
- manual operator procedures are acceptable only when explicit and documented.

Retired concepts must not be recreated:

```text
domain_entity_id
game_asset_aliases
game_asset_source_mappings_r
game_asset_brands_c / game_asset_brand_links_r
game_asset_rarities_c
game_variant_groups_c / game_variant_values_c
game_recipe_generic_requirement_*
game_recipe_catalyst_requirements_*
game_entity_property_expectations_r
canonical game or Riseopedia configuration tables under web_priv
```

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
