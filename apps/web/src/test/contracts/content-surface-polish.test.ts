//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/content-surface-polish.test.ts                                             ////
//// Language: TS                                                                                                 ////
//// Locks destination material roles, shared prose variants, and unchanged destination-panel padding ownership.  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();

function readSource(path: string): string {
	return readFileSync(resolve(APP_ROOT, path), "utf8");
}

function readRuleBlock(source: string, selector: string): string {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(
		new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`),
	);
	return match?.[1] ?? "";
}

const destinationPanel = readSource(
	"src/components/renderers/content/ContentDestinationPanel.tsx",
);
const publicCss = readSource("src/styles/public.css");
const proseCss = readSource("src/styles/content-prose.css");

describe("normal content surface polish", () => {
	it("uses structure for Main, inset for sidebars, and module for full-width supporting destinations", () => {
		expect(destinationPanel).toContain('destination === "main"');
		expect(destinationPanel).toContain('return "structure";');
		expect(destinationPanel).toContain("isSidebarDestination(destination)");
		expect(destinationPanel).toContain('return "inset";');
		expect(destinationPanel).toContain('return "module";');
	});

	it("does not override the existing destination padding values", () => {
		for (const destination of ["main", "top", "bottom", "left", "right"]) {
			const block = readRuleBlock(
				publicCss,
				`.public-content-destination--${destination}`,
			);
			expect(block).not.toMatch(/padding\s*:/);
		}
	});

	it("defines shared prose treatment for Main, default, and sidebar destinations", () => {
		expect(proseCss).toContain(".content-prose--main");
		expect(proseCss).toContain(".content-prose--default");
		expect(proseCss).toContain(".content-prose--aside");
		expect(proseCss).toContain(".content-prose .rt-link");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
