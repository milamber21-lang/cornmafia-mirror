//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/opedia-channel-parity.test.ts                                             //
//// Language: TS                                                                                                //
//// Prevents channel-neutral Riseopedia and Mafiosopedia helper copies from silently drifting apart.           //
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const DATA_ROOT = resolve(process.cwd(), "src", "lib", "data");
const PARITY_PAIRS = [
	["riseopedia-asset-classes.ts", "mafiosopedia-asset-classes.ts"],
	["riseopedia-assets.ts", "mafiosopedia-assets.ts"],
	["riseopedia-card-properties.ts", "mafiosopedia-card-properties.ts"],
	["riseopedia-sections.ts", "mafiosopedia-sections.ts"],
	["riseopedia-entity-detail.ts", "mafiosopedia-entity-detail.ts"],
] as const;

function normalizeChannelNeutralSource(source: string): string {
	return source
		.replaceAll("Riseopedia", "Opedia")
		.replaceAll("Mafiosopedia", "Opedia")
		.replaceAll("riseopedia", "opedia")
		.replaceAll("mafiosopedia", "opedia")
		.replaceAll("RISEOPEDIA", "OPEDIA")
		.replaceAll("MAFIOSOPEDIA", "OPEDIA")
		.replace(/\s+/g, "")
		.replaceAll(",)", ")");
}

describe("Riseopedia and Mafiosopedia channel-neutral helper parity", () => {
	for (const [riseopediaFile, mafiosopediaFile] of PARITY_PAIRS) {
		it(`${riseopediaFile} stays mechanically aligned with ${mafiosopediaFile}`, () => {
			const riseopediaSource = readFileSync(
				resolve(DATA_ROOT, riseopediaFile),
				"utf8",
			);
			const mafiosopediaSource = readFileSync(
				resolve(DATA_ROOT, mafiosopediaFile),
				"utf8",
			);

			expect(normalizeChannelNeutralSource(riseopediaSource)).toBe(
				normalizeChannelNeutralSource(mafiosopediaSource),
			);
		});
	}
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
