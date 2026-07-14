//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/image-node-helpers.test.ts                             ////
//// Language: TS                                                                                                 ////
//// Verifies rich-text image resize limits follow the actual editor canvas width.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
	IMAGE_FALLBACK_MAX_WIDTH,
	resolveMaxResizeWidth,
} from "./image-node-helpers";

function setElementWidth(element: HTMLElement, width: number): void {
	element.getBoundingClientRect = () =>
		({
			bottom: 0,
			height: 0,
			left: 0,
			right: width,
			top: 0,
			width,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}) as DOMRect;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe("resolveMaxResizeWidth", () => {
	it.each([1236, 924, 280])(
		"uses the measured editor canvas width %ipx",
		(width) => {
			const canvas = document.createElement("div");
			canvas.className = "richtext richtext-editor-canvas";
			const host = document.createElement("span");
			canvas.append(host);
			document.body.append(canvas);
			setElementWidth(canvas, width);

			expect(resolveMaxResizeWidth(host)).toBe(width);
		},
	);

	it("falls back to the public full-content width before mounting", () => {
		expect(resolveMaxResizeWidth(null)).toBe(IMAGE_FALLBACK_MAX_WIDTH);
		expect(IMAGE_FALLBACK_MAX_WIDTH).toBe(1236);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
