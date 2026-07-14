//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/content-destination-layout.test.ts                                         ////
//// Language: TS                                                                                                 ////
//// Locks destination collapse and full-width Main behavior in the public content layout CSS contract.           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const publicCss = readFileSync(
	resolve(APP_ROOT, "src/styles/public.css"),
	"utf8",
);

function readRuleBlock(source: string, selector: string): string {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(
		new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`),
	);
	return match?.[1] ?? "";
}

describe("public content destination layout", () => {
	it("uses one flexible base column so absent destinations reserve no width", () => {
		const layoutBlock = readRuleBlock(publicCss, ".public-content-layout");

		expect(layoutBlock).toContain("grid-template-columns: minmax(0, 1fr);");
	});

	it("keeps every rendered destination region at the full width of its assigned track", () => {
		const regionBlock = readRuleBlock(publicCss, ".public-content-region");

		expect(regionBlock).toContain("width: 100%;");
		expect(regionBlock).toContain("min-width: 0;");
	});

	it("does not cap a full-width Main rich-text field at the readable-measure token", () => {
		expect(publicCss).not.toContain(
			".public-content-destination--main .content-field-frame--richtext {\n  max-width: var(--measure-readable);",
		);
		expect(publicCss).toMatch(
			/\.public-content-destination--main[\s\S]*?\.content-field-frame--richtext\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*none;/,
		);
	});

	it("defines explicit single-region desktop areas for Main, Left, and Right", () => {
		expect(publicCss).toMatch(
			/\.public-content-layout--main\s*\{[\s\S]*?grid-template-areas:\s*"main";/,
		);
		expect(publicCss).toMatch(
			/\.public-content-layout--left\s*\{[\s\S]*?grid-template-areas:\s*"left";/,
		);
		expect(publicCss).toMatch(
			/\.public-content-layout--right\s*\{[\s\S]*?grid-template-areas:\s*"right";/,
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
