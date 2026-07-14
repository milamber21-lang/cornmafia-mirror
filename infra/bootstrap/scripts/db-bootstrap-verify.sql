--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
--//// FILE: infra/bootstrap/scripts/db-bootstrap-verify.sql                                                     ////
--//// Language: SQL                                                                                             ////
--//// Verifies the DB-first bootstrap security boundary and imported current data shape.                         ////
--//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

DO $$
DECLARE
	v_count integer;
BEGIN
	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_namespace
	WHERE nspname IN ('web_priv', 'web_api', 'web_view')
	;

	IF v_count <> 3 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: expected web_priv, web_api, and web_view schemas, found %.', v_count;
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_namespace
	WHERE nspname IN ('web_priv', 'web_api', 'web_view')
	  AND pg_catalog.pg_get_userbyid(nspowner) <> 'cm'
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: one or more project schemas are not owned by cm.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_type typ
	JOIN pg_catalog.pg_namespace ns ON ns.oid = typ.typnamespace
	WHERE ns.nspname = 'public'
	  AND typ.typname = 'enum_discord_roles_source'
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: legacy public.enum_discord_roles_source still exists.';
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'cm') THEN
		RAISE EXCEPTION 'Bootstrap verification failed: owner role cm does not exist.';
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'cm_client') THEN
		RAISE EXCEPTION 'Bootstrap verification failed: runtime role cm_client does not exist.';
	END IF;

	IF pg_catalog.has_schema_privilege('cm_client', 'web_priv', 'USAGE') THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client must not have USAGE on web_priv.';
	END IF;

	IF NOT pg_catalog.has_schema_privilege('cm_client', 'web_api', 'USAGE') THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client must have USAGE on web_api.';
	END IF;

	IF NOT pg_catalog.has_schema_privilege('cm_client', 'web_view', 'USAGE') THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client must have USAGE on web_view.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_class cls
	JOIN pg_catalog.pg_namespace ns ON ns.oid = cls.relnamespace
	WHERE ns.nspname = 'web_priv'
	  AND cls.relkind IN ('r', 'p', 'v', 'm')
	  AND (pg_catalog.has_table_privilege('cm_client', cls.oid, 'SELECT')
		OR pg_catalog.has_table_privilege('cm_client', cls.oid, 'INSERT')
		OR pg_catalog.has_table_privilege('cm_client', cls.oid, 'UPDATE')
		OR pg_catalog.has_table_privilege('cm_client', cls.oid, 'DELETE'))
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client has direct table privileges in web_priv.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_class cls
	JOIN pg_catalog.pg_namespace ns ON ns.oid = cls.relnamespace
	WHERE ns.nspname = 'web_view'
	  AND cls.relkind IN ('r', 'p', 'v', 'm')
	  AND NOT pg_catalog.has_table_privilege('cm_client', cls.oid, 'SELECT')
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client is missing SELECT on one or more web_view relations.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_proc proc
	JOIN pg_catalog.pg_namespace ns ON ns.oid = proc.pronamespace
	WHERE ns.nspname = 'web_api'
	  AND NOT pg_catalog.has_function_privilege('cm_client', proc.oid, 'EXECUTE')
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: cm_client is missing EXECUTE on one or more web_api functions.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_proc proc
	JOIN pg_catalog.pg_namespace ns ON ns.oid = proc.pronamespace
	WHERE ns.nspname = 'web_api'
	  AND EXISTS (SELECT 1
				  FROM pg_catalog.aclexplode(COALESCE(proc.proacl,
												 pg_catalog.acldefault('f', proc.proowner))) acl
				  WHERE acl.grantee = 0::oid
					AND acl.privilege_type = 'EXECUTE')
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: PUBLIC can execute one or more web_api functions.';
	END IF;

	SELECT COUNT(*)
	INTO v_count
	FROM pg_catalog.pg_proc proc
	JOIN pg_catalog.pg_namespace ns ON ns.oid = proc.pronamespace
	WHERE ns.nspname IN ('web_priv', 'web_api', 'web_view')
	  AND proc.prosecdef = true
	  AND NOT EXISTS (SELECT 1
				  FROM pg_catalog.unnest(COALESCE(proc.proconfig, ARRAY[]::text[])) cfg(value)
				  WHERE cfg.value = 'search_path=pg_catalog')
	;

	IF v_count <> 0 THEN
		RAISE EXCEPTION 'Bootstrap verification failed: one or more SECURITY DEFINER functions lack fixed search_path=pg_catalog.';
	END IF;

	RAISE NOTICE 'Bootstrap verification passed.';
END;
$$;

-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
