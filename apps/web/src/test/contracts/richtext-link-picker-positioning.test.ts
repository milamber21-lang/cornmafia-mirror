//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/richtext-link-picker-positioning.test.ts                                  ////
//// Language: TS                                                                                                ////
//// Locks the RichText link picker to a viewport-centered, screen-constrained modal layout.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const editorCss = readFileSync(
	resolve(APP_ROOT, "src/styles/editor.css"),
	"utf8",
);
const popupSource = readFileSync(
	resolve(APP_ROOT, "src/components/editors/richtext/nodes/LinkPickerPopup.tsx"),
	"utf8",
);
const toolbarSource = readFileSync(
	resolve(APP_ROOT, "src/components/editors/richtext/RichTextEditorToolbar.tsx"),
	"utf8",
);

function readRuleBlock(source: string, selector: string): string {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(
		new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`),
	);
	return match?.[1] ?? "";
}

describe("RichText link picker viewport positioning", () => {
	it("centers the popup through a fixed viewport modal", () => {
		const modalBlock = readRuleBlock(editorCss, ".editor-link-picker-modal");
		const popupBlock = readRuleBlock(editorCss, ".editor-link-picker-popup");

		expect(modalBlock).toContain("position: fixed;");
		expect(modalBlock).toContain("inset: 0;");
		expect(modalBlock).toContain("place-items: center;");
		expect(modalBlock).toContain("overflow: hidden;");
		expect(popupBlock).toContain("position: relative;");
		expect(popupBlock).toContain("max-height: 100%;");
		expect(popupBlock).not.toContain("transform:");
	});

	it("does not derive popup coordinates from an editor selection anchor", () => {
		expect(popupSource).not.toContain("getPopupPosition");
		expect(popupSource).not.toContain("anchorRect");
		expect(toolbarSource).not.toContain("anchorRect=");
		expect(popupSource).toContain('aria-modal="true"');
	});

	it("keeps the dialog body and result list usable on short viewports", () => {
		const bodyBlock = readRuleBlock(editorCss, ".editor-link-picker-body");
		const tabbedBodyBlock = readRuleBlock(
			editorCss,
			".editor-link-picker-body--tabbed",
		);
		const resultsBlock = readRuleBlock(editorCss, ".editor-link-picker-results");

		expect(bodyBlock).toContain("min-height: 0;");
		expect(bodyBlock).toContain("overflow-y: auto;");
		expect(tabbedBodyBlock).toContain("min-height: 0;");
		expect(resultsBlock).toContain("38dvh");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
