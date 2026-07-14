//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/richtext-image-frame.test.ts                                              ////
//// Language: TS                                                                                                 ////
//// Contract checks for borderless editorial images and explicit Rich Text image framing.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");
const read = (relativePath: string): string =>
	readFileSync(resolve(root, relativePath), "utf8");

describe("editorial image frame contracts", () => {
	it("stores the explicit frame style in version three image nodes", () => {
		const node = read("components/editors/richtext/nodes/ImageNode.tsx");
		expect(node).toContain("version: 3");
		expect(node).toContain("frameStyle: this.__frameStyle");
		expect(node).toContain("setFrameStyle(frameStyle: ImageFrameStyle)");
	});

	it("provides an explicit selected-image border toggle", () => {
		const view = read("components/editors/richtext/nodes/ImageNodeView.tsx");
		expect(view).toContain("applyFrameStyle");
		expect(view).toContain('aria-pressed={frameStyle === "border"}');
		expect(view).toContain("Remove image border");
		expect(view).toContain("Add image border");
	});

	it("uses the same semantic frame class in editor and renderer", () => {
		const renderer = read("components/renderers/richtext/RichTextRenderer.tsx");
		const editorCss = read("styles/editor.css");
		expect(renderer).toContain('classes.push("has-border")');
		expect(renderer).toContain("data-frame-style={frameStyle}");
		expect(editorCss).toContain(
			".richtext .richtext-img.has-border .richtext-img__image",
		);
	});

	it("keeps editorial and standalone template images borderless by default", () => {
		const editorCss = read("styles/editor.css");
		const publicCss = read("styles/public.css");
		expect(editorCss).toContain("border: 0;");
		expect(editorCss).toContain("box-shadow: none;");
		expect(publicCss).toContain(".content-field-media-frame {");
		expect(publicCss).toContain("overflow: visible;");
		expect(publicCss).not.toContain(
			".public-content-destination--main .richtext .richtext-img__image",
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
