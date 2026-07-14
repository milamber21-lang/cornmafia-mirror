//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/runtime-db-boundary.test.ts                                               ////
//// Language: TS                                                                                                ////
//// Live PostgreSQL checks for runtime isolation plus durable rate-limit and rich-text picker contracts.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { createHash, randomUUID } from "node:crypto";

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.CM_TEST_DATABASE_URL?.trim() ?? "";
const expectedRuntimeUser =
	process.env.CM_TEST_DATABASE_USER?.trim() || "cm_client";

let pool: Pool | null = null;

beforeAll(() => {
	if (databaseUrl) {
		pool = new Pool({ connectionString: databaseUrl, max: 1 });
	}
});

afterAll(async () => {
	await pool?.end();
	pool = null;
});

function requirePool(): Pool {
	if (!pool) {
		throw new Error(
			"CM_TEST_DATABASE_URL is required for live runtime DB boundary tests.",
		);
	}

	return pool;
}

describe.skipIf(!databaseUrl)("live cm_client database boundary", () => {
	it("connects as the expected runtime role", async () => {
		const result = await requirePool().query<{ current_user: string }>(
			"SELECT current_user",
		);

		expect(result.rows[0]?.current_user).toBe(expectedRuntimeUser);
	});

	it("has app-facing schema usage and no private-schema usage", async () => {
		const result = await requirePool().query<{
			schema_name: string;
			has_usage: boolean;
		}>(
			`
				SELECT schema_name,
				       has_schema_privilege(current_user, schema_name, 'USAGE') AS has_usage
				FROM unnest(ARRAY[
					'web_view',
					'web_api',
					'web_priv',
					'web_game',
					'web_riseopedia',
					'game_data',
					'web_analytics'
				]) AS schema_name
				ORDER BY schema_name
			`,
		);

		const privileges = new Map(
			result.rows.map((row) => [row.schema_name, row.has_usage]),
		);

		expect(privileges.get("web_view")).toBe(true);
		expect(privileges.get("web_api")).toBe(true);
		expect(privileges.get("web_priv")).toBe(false);
		expect(privileges.get("web_game")).toBe(false);
		expect(privileges.get("web_riseopedia")).toBe(false);
		expect(privileges.get("game_data")).toBe(false);
		expect(privileges.get("web_analytics")).toBe(false);
	});

	it("has no direct table privileges in private schemas", async () => {
		const result = await requirePool().query<{
			privileged_table_count: number | string;
		}>(
			`
				SELECT count(*) AS privileged_table_count
				FROM information_schema.tables
				WHERE table_schema IN ('web_priv', 'web_game', 'web_riseopedia', 'game_data', 'web_analytics')
				  AND (
					has_table_privilege(
						current_user,
						quote_ident(table_schema) || '.' || quote_ident(table_name),
						'SELECT'
					)
					OR has_table_privilege(
						current_user,
						quote_ident(table_schema) || '.' || quote_ident(table_name),
						'INSERT'
					)
					OR has_table_privilege(
						current_user,
						quote_ident(table_schema) || '.' || quote_ident(table_name),
						'UPDATE'
					)
					OR has_table_privilege(
						current_user,
						quote_ident(table_schema) || '.' || quote_ident(table_name),
						'DELETE'
					)
				  )
			`,
		);

		expect(Number(result.rows[0]?.privileged_table_count ?? -1)).toBe(0);
	});

	it("exposes the durable rich-text picker contracts", async () => {
		const result = await requirePool().query<{
			picker_view: string | null;
			can_read_picker_view: boolean;
			meta_function: string | null;
			rows_function: string | null;
			can_execute_meta: boolean;
			can_execute_rows: boolean;
		}>(
			`SELECT to_regclass('web_view.riseopedia_entity_link_picker_rows')::text AS picker_view,
			        has_table_privilege(
				        current_user,
				        'web_view.riseopedia_entity_link_picker_rows',
				        'SELECT'
			        ) AS can_read_picker_view,
			        to_regprocedure(
				        'web_api.web_richtext_internal_link_picker_meta(character varying)'
			        )::text AS meta_function,
			        to_regprocedure(
				        'web_api.web_richtext_internal_link_picker_rows(character varying,bigint,bigint,text,integer)'
			        )::text AS rows_function,
			        has_function_privilege(
				        current_user,
				        'web_api.web_richtext_internal_link_picker_meta(character varying)',
				        'EXECUTE'
			        ) AS can_execute_meta,
			        has_function_privilege(
				        current_user,
				        'web_api.web_richtext_internal_link_picker_rows(character varying,bigint,bigint,text,integer)',
				        'EXECUTE'
			        ) AS can_execute_rows`,
		);

		const row = result.rows[0];
		expect(row?.picker_view).toBe("web_view.riseopedia_entity_link_picker_rows");
		expect(row?.can_read_picker_view).toBe(true);
		expect(row?.meta_function).toContain(
			"web_richtext_internal_link_picker_meta",
		);
		expect(row?.rows_function).toContain(
			"web_richtext_internal_link_picker_rows",
		);
		expect(row?.can_execute_meta).toBe(true);
		expect(row?.can_execute_rows).toBe(true);
	});

	it("can consume the guarded shared rate limit without private table access", async () => {
		const identityHash = createHash("sha256")
			.update(randomUUID(), "utf8")
			.digest("hex");
		const results: Array<{
			allowed_flag: boolean;
			request_count: number;
			retry_after_seconds: number;
		}> = [];

		for (let attempt = 0; attempt < 3; attempt += 1) {
			const result = await requirePool().query<{
				allowed_flag: boolean;
				request_count: number;
				retry_after_seconds: number;
			}>(
				`
					SELECT allowed_flag,
					       request_count,
					       retry_after_seconds
					FROM web_api.web_consume_rate_limit($1, $2, $3, $4)
				`,
				["ci:shared-rate-limit", identityHash, 2, 60000],
			);
			const row = result.rows[0];
			if (!row) {
				throw new Error("Shared rate-limit function returned no row.");
			}
			results.push(row);
		}

		expect(results.map((row) => row.allowed_flag)).toEqual([true, true, false]);
		expect(results.map((row) => Number(row.request_count))).toEqual([1, 2, 3]);
		expect(Number(results[2]?.retry_after_seconds ?? 0)).toBeGreaterThan(0);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
