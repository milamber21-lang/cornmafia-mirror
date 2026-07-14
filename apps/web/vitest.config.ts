//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/vitest.config.ts                                                                            ////
//// Language: TS                                                                                                ////
//// Vitest configuration for server helpers, route contracts, and focused React component tests.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const sourceRoot = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(
	new URL("./src/test/mocks/server-only.ts", import.meta.url),
);

export default defineConfig({
	root: appRoot,
	resolve: {
		alias: {
			"@": sourceRoot,
			"server-only": serverOnlyStub,
		},
	},
	test: {
		clearMocks: true,
		pool: "forks",
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		restoreMocks: true,
		setupFiles: ["./src/test/setup.ts"],
		testTimeout: 10_000,
	},
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
