//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/scripts/setup-runtime-db-boundary-fixture.mjs                                               ////
//// Language: JS                                                                                                ////
//// Loads the self-contained PostgreSQL fixture used by CI runtime boundary and shared-contract tests.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { Client } from "pg";

const adminDatabaseUrl = process.env.CM_TEST_DATABASE_ADMIN_URL?.trim() ?? "";

if (!adminDatabaseUrl) {
  throw new Error("CM_TEST_DATABASE_ADMIN_URL is required.");
}

const fixturePath = fileURLToPath(
  new URL("../src/test/fixtures/runtime-db-boundary.sql", import.meta.url),
);
const fixtureSql = await readFile(fixturePath, "utf8");
const client = new Client({ connectionString: adminDatabaseUrl });

try {
  await client.connect();
  await client.query(fixtureSql);
  console.log(
    "Runtime DB boundary, rich-text picker, and shared rate-limit fixture initialized.",
  );
} finally {
  await client.end();
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
