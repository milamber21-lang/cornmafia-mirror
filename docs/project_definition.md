<!-- FILE: docs/project_definition.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia Project Definition

## Purpose

This is the controlling architecture document for Corn Mafia. It defines current product scope, database ownership, runtime boundaries, active app surfaces, security rules, and constraints future work must preserve.

If another note conflicts with this file, the current repository and current SQL dump control first; this file should then be corrected.

---

## 1. Current status

Corn Mafia is in V1 delivery and feature-expansion mode.

The current baseline includes:

- one active Next.js 16 / React 19 app under `apps/web`;
- strict TypeScript, ESLint 9 flat config, Vitest, and Turbopack build flow;
- PostgreSQL 16 with DB-owned read/write contracts;
- Discord OAuth identity, guild membership, role cache, and fail-closed freshness checks;
- public CMS content, categories, collections, series, media, navigation, and prefixed content routes;
- admin Discord, web/CMS, template, navigation, media, and Riseopedia configuration surfaces;
- member profile, content, media, series, preview, and authoring workflows;
- Riseopedia and Mafiosopedia over a shared canonical game model;
- entity-first canonical game data for assets, recipes, locations, mechanics, perks, POIs, and quests;
- completed private-schema split from the old overloaded `web_priv` model.

Do not restart the architecture or merge the private schemas back together.

---

## 2. Platform intent

Corn Mafia is a Discord-first guild platform for:

- guild information and public content;
- role-aware navigation and content access;
- guides, chronicles, tutorials, tips, videos, and series;
- member-owned authoring and media;
- game knowledge through Riseopedia and Mafiosopedia;
- future maps, calculators, tools, and interactive apps;
- admin-managed publication, content, and game-display configuration.

The platform should grow by adding deliberate domain ownership behind stable `web_api` and `web_view` contracts.

---

## 3. Runtime baseline

```text
apps/web               Next.js application
cm                     database owner / migration / operator role
cm_client              runtime application role
cm-db                   PostgreSQL Compose service
cm-web                  hardened non-root web Compose service
```

The Docker runtime is read-only except for declared cache/media mounts and tmpfs paths. The web container drops Linux capabilities and uses `no-new-privileges`.

The Compose and deployment scripts expect repository-owned bootstrap assets under `infra/bootstrap` and `infra/postgres-init`. Those directories are absent from the current snapshot, so bootstrap/deploy cannot be considered fully verifiable from this snapshot alone.

---

## 4. Required database architecture

### `game_data`

Owns source-side evidence and interpretation rules:

- patches and import batches/files/rows/messages/media;
- source-file registration and aliases;
- source identifier fields;
- identity, variant, naming, classification, brand, coordinate, media, property, relationship, loot, progression, and release-evidence rules;
- shared value maps and discovery tables;
- owner/operator discovery procedures.

`game_data` is not canonical app truth and is not readable by `cm_client`.

### `web_game`

Owns canonical transformed game truth:

- entities and taxonomy;
- variants, variant values, source mappings, aliases, and brands;
- properties and exact property-value links;
- media and media files;
- relationships, coordinates, route points, spawn areas, placements, loot, and progression;
- recipe, quest, mechanic, and history facts;
- release evidence, release decisions, overrides, and patch changes;
- deterministic transform candidate functions and canonical sync functions.

`web_game` must not depend upward on `web_riseopedia` or `web_view`.

### `web_riseopedia`

Owns Riseopedia/Mafiosopedia product policy and presentation:

- rendering channels;
- publication channels, patch publications, and scope overrides;
- sections and classification rules;
- display profiles, bindings, profile properties, body blocks, and variant selectors;
- overview-card rule sets/elements/placements/slots;
- semantic display and relationship-display rules;
- classification and app-misc media mappings;
- Riseopedia/Mafiosopedia materialized-view refresh functions.

It may read canonical `web_game` truth. It must not become a second canonical game store.

### `web_priv`

Owns private platform truth:

- auth users and accounts;
- Discord users, roles, and role cache;
- categories, subcategories, content, templates, fields, series, and redirects;
- navigation panels and trees;
- web media, icons, theme colors, YouTube channels, and rate-limit buckets;
- member profiles and platform-private validation/access helpers.

It no longer owns canonical `game_*` or Riseopedia configuration tables.

### `web_api`

Stable app-callable façade for:

- guarded auth and Discord actions;
- admin/member/public content and media actions;
- navigation, template, series, and validation actions;
- guarded Riseopedia administration.

Functions may call the approved private schemas, but signatures are app contracts.

### `web_view`

Stable app-facing read façade for:

- auth/Discord lookups;
- public/member/admin CMS reads;
- Riseopedia/Mafiosopedia public and admin read models.

The current dump contains 171 standard views and 83 materialized views.

### `web_analytics`

Owner/operator QA and diagnostics. It is not a runtime app contract.

---

## 5. Application contract

- App reads come from `web_view` or a deliberately approved read function.
- App writes and callable actions go through `web_api`.
- Production app source must not reference `game_data`, `web_game`, `web_riseopedia`, `web_priv`, or `web_analytics` directly.
- `cm_client` has schema usage on `web_api` and `web_view`, execute on approved API functions, and select on approved read relations.
- `cm_client` has no private-schema usage, direct private-table grants, or private-function execution.
- Route handlers validate input and context; they do not own database business rules.

---

## 6. Current canonical game model

Current entity types:

```text
asset
recipe
location
mechanic
perk
poi
quest
```

Durable identity:

```text
entity_id          canonical cross-domain identity
entity_variant_id  canonical concrete variant identity
```

Source mappings and aliases are evidence/resolution data, not public identity.

Current canonical decisions:

- crafting benches are assets with `entity_class_code = 'crafting_bench'`;
- rarity is a variant value;
- brands are entity-level;
- recipes use connection/output/catalyst tables rather than a separate current-state recipe table;
- locations and POIs are distinct entity types with canonical relationships and coordinate facts;
- mechanics, perks, and quests are first-class entities;
- map-derived route, spawn, placement, vendor, resource, quest-marker, and POI facts are canonical `web_game` facts;
- raw source payloads remain evidence, not normal display properties;
- `domain_entity_id` and retired asset-level alias/source/rarity families must not return.

---

## 7. Riseopedia and Mafiosopedia

```text
riseopedia    official release-aware channel
mafiosopedia  role-locked latest/review channel
```

Both channels share:

- canonical `web_game` truth;
- product configuration in `web_riseopedia`;
- one React component family under `apps/web/src/components/riseopedia`;
- mirrored `web_view.riseopedia_*` / `web_view.mafiosopedia_*` read contracts.

They must remain separate where publication, visibility, release, or display behavior differs.

---

## 8. Security and access model

Discord is the source for guild identity and roles. PostgreSQL stores the app-facing role cache and access summaries.

Required behavior:

- login fails closed when guild/member/role synchronization cannot complete;
- actor-sensitive server rendering refreshes role state when due;
- failed refresh causes public/anonymous behavior rather than stale elevated access;
- admin and member APIs guard themselves;
- mutation routes use same-origin protection unless explicitly token-protected;
- token secrets are not accepted in query parameters;
- media paths, MIME types, signatures, SVGs, and external hosts are validated;
- `SECURITY DEFINER` functions use fixed `search_path` and schema-qualified references.

Context model:

```text
/admin/*      admin context
/api/admin/*  admin API context
/me/*         member context
/api/me/*     member API context
other routes  public/public-content unless explicitly guarded
```

Admin and member mutation contracts remain separate when ownership, visibility, validation, or permissions differ.

---

## 9. Active app surfaces

### Public

- DB-backed homepage, terms, privacy, and unavailable internal pages;
- category and collection hubs;
- normal content routes and prefixed `/map`, `/tool`, `/app`, `/event`, `/custom`, `/video` routes;
- series route;
- Riseopedia/Mafiosopedia hub, browse, section, class, category, subcategory, and entity routes;
- public media and wiki media endpoints;
- transitional `/maps/[map]` filesystem-tile viewer with sample overlays.

### Member

- profile and role/access summary;
- authorable collection lookup;
- content list/create/edit/preview;
- media list/upload/update/delete and picker;
- series list/create/update/delete;
- theme and rich-text link-picker support.

### Admin

```text
discord
    roles, guild-role refresh, users

web
    categories, subcategories, content kinds, content, media, icons,
    themes, navigation, series, YouTube channels, external hosts,
    templates, field types/tools/lists/options/fields

riseopedia
    sections and rules, display profiles/bindings/properties/body blocks/selectors,
    overview-card rules/elements, publication channels/publications/scope overrides,
    release evidence/decisions/overrides, relationship display rules, property inspection
```

---

## 10. Content and navigation

Navigation is DB-first and panel-based. Public rendering selects a panel slot, then applies category/subcategory/content access.

Content routing is controlled by:

```text
content_kind_code
public_route_prefix
renderer_code
category/subcategory/content access
```

Wrong-prefix, unreadable, unpublished, invalid external-link, invalid YouTube, or non-renderable content must not render.

Template-driven content uses configured Hero/Top/Left/Main/Right/Bottom/Hidden/SEO destinations. Member authoring uses member-specific DB functions and ownership rules.

---

## 11. Normalization conventions

- compact dictionaries use the small-list admin pattern;
- operational families use server-driven search/page/filter contracts;
- navigation designer owns a local editable tree and replaces it through one DB function;
- member authoring remains member-context code;
- list routes return `rows`;
- single-row routes return `doc`;
- mutations return `ok: true` and `doc` only when needed;
- panels separate `topError`, `metaError`, `submitting`, and `metaLoading`;
- failed saves do not close or call success callbacks.

---

## 12. Tooling and verification

Repository scripts cover formatting, watermark verification, lint, TypeScript checking, Vitest, production dependency audit, and security posture checks.

Current static audit findings:

- production app source contains no direct private-schema references;
- production TypeScript contains no `any`, `any[]`, `Record<string, any>`, direct private-table mutations, or browser `alert` calls;
- app DB references resolve to `web_view` and `web_api` objects in the current dump.

Known test-hardening gap:

- `runtime-db-boundary.test.ts`, `app-db-boundary.test.ts`, and `security-posture-check.mjs` still enumerate the old private schema set and must add `web_game` and `web_riseopedia`.

The snapshot does not include installed dependencies, so lint, typecheck, tests, and build were not rerun during this documentation audit.

---

## 13. Non-negotiable constraints

Do not:

- move canonical game truth back into `web_priv`;
- put Riseopedia publication/display policy into `web_game`;
- give `cm_client` private-schema access;
- directly query private schemas from app code;
- make route handlers own canonical business rules;
- merge admin and member writes into a broad generic mutation contract;
- recreate retired game identity/alias/rarity families;
- invent new transform rule families when existing value maps, source links, relationship connections, or rule-part systems support the need;
- create `web_apps` or a maps schema merely for symmetry;
- call bootstrap self-contained while required `infra` payloads are absent;
- treat generated `_*.md` files as durable truth.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
