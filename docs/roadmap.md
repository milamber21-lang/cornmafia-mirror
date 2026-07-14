<!-- FILE: docs/roadmap.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia Roadmap

## Purpose

This roadmap reflects the post-schema-split, post-cleanup V1 repository. Architecture rules live in `docs/project_definition.md`; implementation rules live in `docs/codebase_rules.md`; Riseopedia truth lives in `docs/riseopedia.md`.

---

## 1. Current baseline

Completed:

- DB-first Next.js 16 / React 19 app;
- stable `web_api` and `web_view` application contracts;
- private schema split into `web_game`, `web_riseopedia`, and platform-only `web_priv`;
- legacy façade and duplicated private-object cleanup;
- entity-first canonical model for asset, recipe, location, mechanic, perk, POI, and quest;
- deterministic full-patch sync convergence for the current patch;
- Riseopedia/Mafiosopedia materialized read models populated and app-connected;
- public category/collection/content/series/internal-page surfaces;
- member profile/content/media/series authoring and preview;
- admin Discord, CMS, templates, navigation, media, and Riseopedia configuration;
- template-driven Hero/Top/Main rendering and live preview parity;
- shared public browse/material visual system.

The foundation is deliverable as V1. Current work should harden repository integrity, operational confidence, product quality, and future feature breadth.

---

## 2. Priority 0 — repository and runtime integrity

### Private-schema guard updates

Update:

```text
apps/web/src/test/contracts/app-db-boundary.test.ts
apps/web/src/test/contracts/runtime-db-boundary.test.ts
scripts/security-posture-check.mjs
```

so the forbidden/private schema set includes:

```text
game_data
web_game
web_riseopedia
web_priv
web_analytics
```

Acceptance:

- static production-source checks reject all private-schema references;
- live `cm_client` tests verify no usage/table/function privileges on either new private schema;
- live API/view contract checks still pass.

### Bootstrap integrity

The deploy script, Compose files, environment templates, and DB test fixture reference `infra/bootstrap` and `infra/postgres-init`, but those directories are absent from the current snapshot.

Decide and implement one of:

- restore the repo-owned bootstrap payload and verification scripts; or
- deliberately remove/replace the bootstrap integration and update deploy scripts.

Acceptance:

- a clean host can follow one documented deployment path;
- referenced bootstrap files exist;
- restore order, roles, grants, sequences, media verification, and runtime smoke are reproducible.

### Full quality run

After dependencies and bootstrap assets are available, run:

```text
format:check
watermark:verify
lint
typecheck:web
test:web
test:security
audit:web:prod
build:web
```

---

## 3. Priority 1 — product completion and editorial quality

- review and finalize DB-backed homepage, terms, privacy, and unavailable content;
- finish the currently empty Riseopedia admin sub-navigation or remove the placeholder component deliberately;
- replace the content-reference renderer placeholder with resolved safe link metadata;
- continue member authoring UX, empty-state, validation, and error-path polish;
- verify all public content kinds and template destinations on desktop/mobile;
- review series, category, collection, footer, and internal-page editorial flow.

---

## 4. Priority 2 — Riseopedia operations and regression confidence

- add a permanent idempotency regression test for two identical `web_game.game_sync_patch` runs;
- add regression coverage for continuation POIs, source mappings, coordinate links, vendor loot, property IDs, relationship provenance, and alias retargeting;
- profile the canonical sync and `web_riseopedia.game_sync_01_view_refresh` with current data;
- add owner/operator QA summaries under `web_analytics` instead of ad-hoc result files;
- test all seven entity types across hub, browse, detail, media, body blocks, and release behavior;
- verify Riseopedia and Mafiosopedia channel differences remain deliberate.

---

## 5. Priority 3 — editor and content hardening

- rich-text image insertion, resizing, movement, persistence, and rendering;
- internal/Riseopedia link-picker behavior and resolved content-reference rendering;
- paste cleanup and sanitizer review;
- stored formatting and runtime CSS-variable security review;
- admin/member preview parity and failure paths;
- YouTube metadata/allowlist error handling.

---

## 6. Priority 4 — automated test expansion

Add integration/E2E coverage for:

- Discord login failure and role refresh due/failure;
- public navigation/content first render;
- admin and member API guards;
- content, media, series, templates, and navigation mutations;
- member ownership rules;
- Riseopedia/Mafiosopedia routes, previews, media, release overrides, and admin configuration;
- materialized-view refresh after restore;
- deployment/bootstrap and runtime-role smoke.

---

## 7. Priority 5 — maps and interactive apps

The current `/maps/[map]` route is transitional:

- tiles are discovered from filesystem paths;
- overlays are sample hardcoded features;
- `FEATURE_MAPS` is passed through deployment configuration but is not currently enforced in app source;
- no `web_apps` schema exists.

Before creating `web_apps` or a dedicated maps schema, define a real persistent domain for layer definitions, canonical-game imports, manual/user features, access, and geometry. Canonical locations/POIs/coordinates remain in `web_game`.

---

## 8. Current next move

The next repository change should be the Priority 0 hardening pass:

1. expand private-schema tests and security scans;
2. restore or resolve the missing bootstrap payload;
3. run the complete quality/build/runtime suite;
4. then continue product/editor work.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
