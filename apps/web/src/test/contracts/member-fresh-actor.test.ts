//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/member-fresh-actor.test.ts                                                ////
//// Language: TS                                                                                                ////
//// Locks member page and API entry points onto the shared fresh, fail-closed actor resolver.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const MEMBER_ENTRY_POINTS = [
	"src/app/me/content/page.tsx",
	"src/app/me/content/[category]/[subcategory]/page.tsx",
	"src/app/me/media/page.tsx",
	"src/app/me/series/page.tsx",
	"src/app/api/me/route.ts",
	"src/app/api/me/themes/route.ts",
] as const;

describe("member fresh actor entry points", () => {
	it.each(MEMBER_ENTRY_POINTS)(
		"uses getCurrentActorDiscordId in %s",
		(relativePath) => {
			const content = readFileSync(resolve(APP_ROOT, relativePath), "utf8");

			expect(content).toContain("getCurrentActorDiscordId");
			expect(content).toMatch(/await\s+getCurrentActorDiscordId\s*\(/);
		},
	);
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
