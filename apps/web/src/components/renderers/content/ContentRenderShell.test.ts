//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentRenderShell.test.ts                                   ////
//// Language: TS                                                                                                 ////
//// Verifies deterministic body layouts so absent destinations never reserve columns around populated regions.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import { getContentBodyLayoutCode } from "./ContentRenderShell";

describe("getContentBodyLayoutCode", () => {
	it("prioritizes the full three-region layout", () => {
		expect(
			getContentBodyLayoutCode({
				hasLeft: true,
				hasMain: true,
				hasRight: true,
			}),
		).toBe("left-main-right");
	});

	it("supports each two-region combination", () => {
		expect(
			getContentBodyLayoutCode({
				hasLeft: true,
				hasMain: true,
				hasRight: false,
			}),
		).toBe("left-main");
		expect(
			getContentBodyLayoutCode({
				hasLeft: false,
				hasMain: true,
				hasRight: true,
			}),
		).toBe("main-right");
		expect(
			getContentBodyLayoutCode({
				hasLeft: true,
				hasMain: false,
				hasRight: true,
			}),
		).toBe("left-right");
	});

	it("collapses each single populated destination to one full-width region", () => {
		expect(
			getContentBodyLayoutCode({
				hasLeft: false,
				hasMain: true,
				hasRight: false,
			}),
		).toBe("main");
		expect(
			getContentBodyLayoutCode({
				hasLeft: true,
				hasMain: false,
				hasRight: false,
			}),
		).toBe("left");
		expect(
			getContentBodyLayoutCode({
				hasLeft: false,
				hasMain: false,
				hasRight: true,
			}),
		).toBe("right");
	});

	it("returns none when every body destination is empty", () => {
		expect(
			getContentBodyLayoutCode({
				hasLeft: false,
				hasMain: false,
				hasRight: false,
			}),
		).toBe("none");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
