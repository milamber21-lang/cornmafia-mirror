//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/pg.ts                                                                         ////
//// Language: TS                                                                                               ////
//// Shared PostgreSQL pool and query helper for the web app.                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import {
	Pool,
	type PoolConfig,
	type QueryResult,
	type QueryResultRow,
} from "pg";

import {
	assertWebRuntimeEnvReady,
	getRuntimeDatabaseUrl,
} from "@/lib/server/env";

type GlobalWithPgPool = typeof globalThis & {
	__cmWebPgPool?: Pool;
};

const globalForPg = globalThis as GlobalWithPgPool;

function buildPoolConfig(): PoolConfig {
	if (process.env.NODE_ENV === "production") {
		assertWebRuntimeEnvReady();
	}

	return {
		connectionString: getRuntimeDatabaseUrl(),
	};
}

function createPool(): Pool {
	return new Pool(buildPoolConfig());
}

function getPgPool(): Pool {
	if (globalForPg.__cmWebPgPool) {
		return globalForPg.__cmWebPgPool;
	}

	const pool = createPool();
	globalForPg.__cmWebPgPool = pool;
	return pool;
}

const pgProxyHandler: ProxyHandler<Pool> = {
	get(_target, property, receiver) {
		const pool = getPgPool();
		const value = Reflect.get(pool, property, receiver) as unknown;

		if (typeof value === "function") {
			return value.bind(pool) as unknown;
		}

		return value;
	},
};

export const pg: Pool = new Proxy({} as Pool, pgProxyHandler);

export async function query<Row extends QueryResultRow>(
	text: string,
	params: readonly unknown[] = [],
): Promise<QueryResult<Row>> {
	return getPgPool().query<Row>(text, [...params]);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
