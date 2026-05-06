--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
--//// FILE: infra/bootstrap/scripts/db-reset-sequences.sql                                                                      ////
--//// Language: SQL                                                                                             ////
--//// Resets identity and serial sequences after an ID-preserving bootstrap import.                              ////
--//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
--//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

DO $$
DECLARE v_row record;
DECLARE v_max_value bigint;
DECLARE v_start_value bigint;
DECLARE v_set_value bigint;
BEGIN
	FOR v_row IN
		SELECT table_ns.nspname AS table_schema,
			   table_rel.relname AS table_name,
			   attr.attname AS column_name,
			   pg_catalog.pg_get_serial_sequence(pg_catalog.format('%I.%I', table_ns.nspname, table_rel.relname), attr.attname) AS sequence_name
		FROM pg_catalog.pg_class table_rel
		JOIN pg_catalog.pg_namespace table_ns ON table_ns.oid = table_rel.relnamespace
		JOIN pg_catalog.pg_attribute attr ON attr.attrelid = table_rel.oid
		WHERE table_ns.nspname IN ('web_priv')
		  AND table_rel.relkind IN ('r', 'p')
		  AND attr.attnum > 0
		  AND attr.attisdropped = false
		  AND pg_catalog.pg_get_serial_sequence(pg_catalog.format('%I.%I', table_ns.nspname, table_rel.relname), attr.attname) IS NOT NULL
		ORDER BY table_ns.nspname,
			 table_rel.relname,
			 attr.attname
	LOOP
		EXECUTE pg_catalog.format('SELECT MAX(%I)::bigint FROM %I.%I',
						  v_row.column_name,
						  v_row.table_schema,
						  v_row.table_name)
		INTO v_max_value;

		SELECT seq.seqstart
		INTO v_start_value
		FROM pg_catalog.pg_sequence seq
		WHERE seq.seqrelid = v_row.sequence_name::regclass
		;

		IF v_max_value IS NULL THEN
			EXECUTE pg_catalog.format('SELECT pg_catalog.setval(%L::regclass, %s, false)',
							  v_row.sequence_name,
							  v_start_value);
			RAISE NOTICE 'Reset empty sequence % to start %.', v_row.sequence_name, v_start_value;
		ELSE
			v_set_value := pg_catalog.GREATEST(v_max_value, v_start_value);
			EXECUTE pg_catalog.format('SELECT pg_catalog.setval(%L::regclass, %s, true)',
							  v_row.sequence_name,
							  v_set_value);
			RAISE NOTICE 'Reset sequence % after %.%.% to %.',
				v_row.sequence_name,
				v_row.table_schema,
				v_row.table_name,
				v_row.column_name,
				v_set_value;
		END IF;
	END LOOP;
END;
$$;
