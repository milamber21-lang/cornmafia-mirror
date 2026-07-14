<!-- FILE: docs/chatgpt_project_instructions.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# ChatGPT Project Instructions For Corn Mafia

Use this file as the durable AI-working baseline for Corn Mafia.

## Source of truth

Use, in order:

1. current repository files;
2. current SQL dump/live schema;
3. current SQL runner or test output;
4. durable docs under `docs/`;
5. older prompts only when still consistent.

Ignore generated documentation files beginning with `_` until regenerated.

Do not use old external snapshots as source of truth unless explicitly requested. If a required file/object is absent, say so rather than inventing it.

## Current project state

Corn Mafia is a DB-first Next.js 16 / React 19 / PostgreSQL V1 platform with Discord identity, role-aware navigation/content, admin CMS, member content/media/series authoring, template-driven rendering, and Riseopedia/Mafiosopedia.

The private schema split and legacy cleanup are complete:

```text
game_data       source imports and game_transform_* rules
web_game        canonical game truth and canonical sync
web_riseopedia  wiki publication/display policy and read-model refresh
web_priv        platform/auth/Discord/CMS/member private truth
web_api         guarded app-callable actions and writes
web_view        app-facing read contracts
web_analytics   owner/operator QA
```

Current canonical entity types:

```text
asset, recipe, location, mechanic, perk, poi, quest
```

## Architecture rules

- App reads use `web_view` or an explicitly approved read function.
- App writes/actions use `web_api`.
- Production app source must not directly reference `game_data`, `web_game`, `web_riseopedia`, `web_priv`, or `web_analytics`.
- `cm_client` is runtime; `cm` is owner/migration/operator.
- `web_game` must not depend upward on `web_riseopedia` or `web_view`.
- `web_riseopedia` may consume canonical `web_game` truth but must not duplicate canonical identity.
- Admin, member, and public workflows remain separate when behavior differs.
- Discord login and role-refresh behavior fail closed.
- Route handlers validate and guard; database functions own migrated business rules.

## Game-data rules

- Reuse existing `game_data.game_transform_*` rule families, value maps, source links, relationship connections, and rule parts.
- Do not create a new transform-rule family without an explicit audit and approval.
- Canonical current/history tables and sync functions live in `web_game`.
- Riseopedia/Mafiosopedia publication, sections, display profiles, body blocks, cards, and semantic display rules live in `web_riseopedia`.
- Source mappings and aliases are evidence, not durable public identity.
- `entity_id` and `entity_variant_id` are durable canonical IDs.
- Sync generated rows with update-existing, insert-missing, delete/deactivate-stale behavior; avoid delete/reinsert churn.
- Crafting benches are assets; rarity is a variant value; brands are entity-level.
- Do not recreate `domain_entity_id`, asset alias/source/rarity families, or retired recipe requirement names.

Before generating SQL, audit the current dump and state:

1. existing universal objects to reuse;
2. new objects explicitly allowed;
3. new objects forbidden;
4. existing functions requiring changes.

## Code generation

- Generate full files unless the user explicitly requests a patch/snippet.
- Put the file path inside every generated code/config file.
- Keep UTF-8 safe.
- Preserve working behavior unless change is required.
- Do not delete or rename active behavior without checking imports/routes/contracts.
- Fix route/client/DB contracts together.
- Prefer root-clean `.tar.gz` or `.zip` archives for multi-file output.

TypeScript:

```text
never any / any[] / Record<string, any>
prefer unknown and narrow
use concrete event/callback types
handle catch values as unknown
keep server-only imports out of client components
```

SQL:

- use uppercase keywords, lowercase objects, tabs, schema-qualified references;
- mirror current header, delimiter, owner, grant, and fixed-search-path patterns;
- generate full object definitions;
- keep runtime grants narrow;
- put canonical game facts/functions in `web_game`;
- put wiki product policy/functions in `web_riseopedia`;
- put platform private truth in `web_priv`;
- put app façades in `web_api`/`web_view`;
- put QA in `web_analytics`.

## App conventions

- list responses use `rows`;
- single-row responses use `doc`;
- mutations return `ok: true`, and `doc` only when needed;
- APIs guard themselves;
- panels separate `topError`, `metaError`, `submitting`, and `metaLoading`;
- failed saves do not close or call `onSaved`;
- no static visual tokens in TS/TSX;
- CSS owns visuals except documented runtime/computed exceptions.

## Audit behavior

For analysis-only requests:

- generate no code;
- inspect real files, imports, routes, SQL contracts, grants, and tests;
- classify findings by P0/P1/P2/P3 where useful;
- distinguish source truth from inference;
- do not report generated `_*.md` files as durable documentation.

## Artifact behavior

Archives must extract directly into the repository root:

```text
docs/...
apps/...
scripts/...
infra/...
```

Never add an unnecessary wrapper directory.

## Current known repository gaps

- private-schema static/live tests still need `web_game` and `web_riseopedia` added to their forbidden schema set;
- `infra/bootstrap` and `infra/postgres-init` are referenced but absent from the current snapshot;
- the map viewer remains transitional and has hardcoded sample overlays;
- Riseopedia admin sub-navigation and generic content-reference rendering still contain explicit placeholders.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
