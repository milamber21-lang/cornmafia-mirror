<!-- FILE: docs/riseopedia_cleanup_fixes.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Riseopedia Schema Cleanup — Completed History

## Purpose

This document is a completed historical record of the 2026 game/Riseopedia private-schema cleanup. It is not an active migration runbook.

## Completed result

The former overloaded `web_priv` layout was split into:

```text
web_game        canonical transformed game truth and sync
web_riseopedia  Riseopedia/Mafiosopedia publication/display policy
web_priv        platform/auth/Discord/CMS/member private truth
```

The migration completed with:

- ID-preserving copies and sequence synchronization;
- canonical-function migration to `web_game`;
- product refresh/validation functions in `web_riseopedia`;
- shadow `web_view`/`web_api` validation and atomic cutover;
- deterministic sync fixes for continuation POIs, source mappings, coordinates, media, aliases, loot, properties, and relationship provenance;
- legacy façade removal;
- deletion of duplicated old `web_priv.game_*` and `web_priv.riseopedia_*` objects;
- retained narrow `cm_client` access only to `web_api` and `web_view`.

## Current truth

Use:

```sql
SELECT web_game.game_sync_patch('<patch_code>');
SELECT web_riseopedia.game_sync_01_view_refresh();
```

Do not use historical `web_priv.game_sync_*` commands.

## Retired concepts

Do not recreate:

```text
domain_entity_id
asset-level aliases/source mappings/brands/rarities
game_variant_* legacy families
legacy recipe generic requirement/catalyst names
web_api_legacy
web_view_legacy
canonical game or Riseopedia tables under web_priv
```

## Reference

Current durable architecture and operations live in:

```text
docs/project_definition.md
docs/codebase_rules.md
docs/riseopedia.md
docs/roadmap.md
```

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
