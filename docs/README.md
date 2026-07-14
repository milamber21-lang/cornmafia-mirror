<!-- FILE: docs/README.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia Documentation

> [!IMPORTANT]
> **Publicly viewable proprietary source**
>
> The Corn Mafia repository is public for inspection and transparency only.
> It is not open-source software.
>
> Use, execution, building, testing, deployment, hosting, modification,
> redistribution, mirroring, or commercial exploitation requires prior express
> written permission from WoodenElf.
>
> See [`docs/LICENSE.md`](LICENSE.md) for the documentation copy and the
> repository-root [`LICENSE.md`](../LICENSE.md) for the authoritative terms.

Corn Mafia is a DB-first Next.js 16 / React 19 / PostgreSQL guild platform with Discord-backed identity, role-aware access, admin tooling, member authoring, public content surfaces, and Riseopedia/Mafiosopedia game knowledge.

Durable project truth lives in `docs/`. Current repository files, the current SQL dump, and current SQL runner output override historical prompts and generated snapshots.

## Start here

- `docs/LICENSE.md` — documentation-local summary and copy of the proprietary source terms; root `LICENSE.md` remains authoritative.
- `docs/project_definition.md` — current architecture, schema boundaries, active product surfaces, roles, and non-negotiable constraints.
- `docs/codebase_rules.md` — code, SQL, route, helper, artifact, audit, and implementation rules.
- `docs/style_system.md` — CSS ownership, tokens, component styling, visual primitives, and inline-style exceptions.
- `docs/auth_access_model.md` — Discord login, role freshness, fresh-actor behavior, and fail-closed access.
- `docs/content_templates.md` — current template, optional-series, system-field, Hero, Top, and member-authoring model.
- `docs/riseopedia.md` — current Riseopedia/Mafiosopedia architecture, canonical game model, source transforms, sync, publication, read models, admin, routes, and runbook.
- `docs/Risopedia_Icon_System.md` — production rules for Riseopedia-family icon assets.
- `docs/roadmap.md` — current priorities after the schema split and read-model stabilization.

## Current architecture

```text
game_data
    raw imports, patch/source metadata, discovery evidence, game_transform_* rules

web_game
    canonical transformed game truth, histories, relationships, media, properties,
    release evidence/decisions, and canonical sync functions

web_riseopedia
    Riseopedia/Mafiosopedia publication policy, sections, display profiles,
    overview-card rules, semantic display rules, and read-model refresh helpers

web_priv
    auth, Discord, CMS content, member data, navigation, web media,
    templates, themes, rate limits, and platform-private helpers

web_api
    stable guarded app-callable actions and writes

web_view
    stable app-facing public/member/admin read contracts

web_analytics
    owner/operator QA and diagnostics
```

Application runtime uses `cm_client`; migrations and owner operations use `cm`.

The app reads through `web_view` and writes/calls actions through `web_api`. Production app source must not directly reference `game_data`, `web_game`, `web_riseopedia`, `web_priv`, or `web_analytics`.

## Current game-data baseline

The schema split and legacy cleanup are complete. Canonical game truth is entity-first and currently supports:

```text
asset
recipe
location
mechanic
perk
poi
quest
```

There are no separate current-state `game_assets` or `game_recipes` tables. Cross-domain identity is `web_game.game_entities.entity_id`; domain detail is represented through taxonomy, variants, source mappings, properties, media, relationships, recipe tables, quest tables, progression tables, coordinates, routes, spawn areas, loot, and placement facts.

The full canonical sync entry point is:

```sql
SELECT web_game.game_sync_patch('0.4.2H');
```

Use a real patch code from `game_data.patches`. Refresh both wiki channels after canonical changes with:

```sql
SELECT web_riseopedia.game_sync_01_view_refresh();
```

## Current app baseline

The active app includes:

- DB-backed homepage, terms, privacy, category, collection, content, series, and prefixed content routes;
- public Riseopedia and Mafiosopedia hubs, directories, browse pages, entity details, previews, and media APIs;
- admin Discord, web/CMS, template, navigation, and Riseopedia configuration surfaces;
- member profile, content, media, series, authoring, preview, and rich-text link-picker workflows;
- a transitional filesystem-tile map viewer with sample overlays, not yet a DB-backed app domain.

## Generated files

Ignore generated documentation when determining durable truth:

```text
docs/_files.md
docs/_snapshot.md
docs/_db.md
```

Regenerate them after durable docs and schema dumps are updated.

## Known repository follow-ups

The current snapshot is internally consistent at the app/DB contract level, but two repository-hardening items remain:

- runtime/static private-schema tests must include `web_game` and `web_riseopedia` alongside `web_priv`, `game_data`, and `web_analytics`;
- deploy/bootstrap scripts and Compose reference `infra/bootstrap` and `infra/postgres-init`, but those directories are absent from this snapshot and must be restored or deliberately removed before bootstrap is considered self-contained.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
