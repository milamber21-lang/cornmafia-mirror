<!-- FILE: infra/bootstrap/README.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia DB bootstrap

This folder contains repo-owned bootstrap logic and bootstrap metadata only. It intentionally does not contain filled environment files or media payload data.

## Included

```text
infra/bootstrap/scripts/db-bootstrap.sh
infra/bootstrap/scripts/db-reset-sequences.sql
infra/bootstrap/scripts/db-bootstrap-verify.sql
infra/bootstrap/sql/cm_web.bootstrap.sql
infra/bootstrap/manifests/MANIFEST.tsv
```

## Manifest

The bootstrap manifest is stored inside the bootstrap folder:

```text
infra/bootstrap/manifests/MANIFEST.tsv
```

It lists repo-owned bootstrap files only. It does not list or package media payload files.

## Not included

```text
data/media/
.env
.env.bootstrap
```

Keep real secrets outside git. The script reads the existing Corn Mafia env taxonomy from one of these sources, in this order:

```text
CM_BOOTSTRAP_ENV=/path/to/env-file
repo-root .env.bootstrap
repo-root .env
```

Do not commit `.env.bootstrap` or real `.env` files.

## Env taxonomy used by the script

The script keeps the deployment env naming already used by the app and Docker setup.

```bash
POSTGRES_USER=cm
POSTGRES_PASSWORD=replace-with-owner-password
POSTGRES_DB=cm_web
POSTGRES_PORT_BIND=127.0.0.1:5432

CM_CLIENT_DB_USER=cm_client
CM_CLIENT_DB_PASSWORD=replace-with-runtime-password
WEB_DATABASE_URL=postgresql://cm_client:replace-with-runtime-password@cm-db:5432/cm_web
DATABASE_URL=${WEB_DATABASE_URL}
CM_OWNER_DATABASE_URL=postgresql://cm:replace-with-owner-password@cm-db:5432/cm_web

WEB_MEDIA_HOST_DIR=./data/media
WEB_MEDIA_ROOT=/app/data/media
```

Optional bootstrap-only overrides are still supported when needed:

```bash
CM_POSTGRES_HOST=localhost
CM_POSTGRES_PORT=5432
CM_POSTGRES_ADMIN_DB=postgres
CM_POSTGRES_ADMIN_USER=cm
CM_POSTGRES_ADMIN_PASSWORD=replace-with-owner-password

CM_DB_NAME=cm_web
CM_DB_OWNER=cm
CM_DB_APP_USER=cm_client
CM_DB_OWNER_PASSWORD=replace-with-owner-password
CM_DB_APP_PASSWORD=replace-with-runtime-password

CM_MEDIA_SOURCE="$PWD/data/media"
CM_MEDIA_TARGET="$PWD/data/media"
CM_COPY_MEDIA=1
CM_VERIFY_MEDIA=1
CM_BOOTSTRAP_MANIFEST="$PWD/infra/bootstrap/manifests/MANIFEST.tsv"
```

The normal path is to use the existing env taxonomy and avoid the optional overrides.

## Role policy

The role names are intentionally preserved:

```text
cm        = owner / migration role
cm_client = runtime app role
```

The database name is controlled by `POSTGRES_DB` or, if explicitly set, `CM_DB_NAME`. Imported IDs and media storage paths are preserved. Sequences are reset after import so future rows receive safe new IDs.

## Basic use

From the repo root:

```bash
chmod +x infra/bootstrap/scripts/db-bootstrap.sh
infra/bootstrap/scripts/db-bootstrap.sh
```

Or with a dedicated local env file:

```bash
CM_BOOTSTRAP_ENV="$PWD/.env.bootstrap" infra/bootstrap/scripts/db-bootstrap.sh
```

For shell-loaded env files, quote generated secrets if they contain characters that the shell treats specially.

## What the script does

```text
1. Loads the existing env taxonomy.
2. Checks if the target DB exists.
3. If missing, creates/updates original roles cm and cm_client with supplied passwords.
4. Creates the database owned by cm when needed.
5. Imports infra/bootstrap/sql/cm_web.bootstrap.sql as cm.
6. Preserves imported IDs.
7. Resets identity/serial sequences above imported rows.
8. Verifies DB-first security boundaries.
9. Copies media when source and target differ.
10. Verifies every web_priv.web_media.storage_rel_path has a real file.
```

If the DB already exists and already has `web_priv`, `web_api`, and `web_view`, the script skips import and runs verification/media checks only.

If the DB exists in a partial state, the script stops and requires manual review.

## App DATABASE_URL after bootstrap

```text
postgresql://cm_client:<CM_CLIENT_DB_PASSWORD>@<host>:5432/<POSTGRES_DB>
```

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
