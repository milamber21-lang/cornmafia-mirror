//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/richtext-editor-width-parity.test.ts                                      ////
//// Language: TS                                                                                                 ////
//// Locks shared destination geometry, prose styling, canvas widths, and editor scroll ownership.                ////
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

const tokensCss = readSource("src/styles/tokens.css");
const editorCss = readSource("src/styles/editor.css");
const publicCss = readSource("src/styles/public.css");
const proseCss = readSource("src/styles/content-prose.css");
const editorShell = readSource(
	"src/components/editors/richtext/RichTextEditorShell.tsx",
);
const renderer = readSource(
	"src/components/renderers/richtext/RichTextRenderer.tsx",
);

function readRuleBlock(source: string, selector: string): string {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = source.match(
		new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`),
	);
	return match?.[1] ?? "";
}

describe("rich-text editor and renderer parity", () => {
	it("derives editor and public widths from the same content geometry tokens", () => {
		expect(tokensCss).toContain("--content-page-max-width: 1236px;");
		expect(tokensCss).toContain("--content-destination-panel-padding: 24px;");
		expect(tokensCss).toContain("--content-layout-gap: 24px;");
		expect(publicCss).toContain("max-width: var(--content-page-max-width);");
		expect(editorCss).toContain("var(--content-page-max-width)");
		expect(editorCss).toContain("var(--content-destination-panel-padding)");
		expect(editorCss).toContain("var(--content-layout-gap)");
	});

	it("models all sidebar combinations and template field widths", () => {
		expect(editorCss).toContain(
			'data-richtext-editor-canvas-layout="main-with-left"',
		);
		expect(editorCss).toContain(
			'data-richtext-editor-canvas-layout="main-with-right"',
		);
		expect(editorCss).toContain(
			'data-richtext-editor-canvas-layout="main-with-both"',
		);
		expect(editorCss).toContain(
			'data-richtext-editor-canvas-layout="left-aside"',
		);
		expect(editorCss).toContain(
			'data-richtext-editor-canvas-layout="right-aside"',
		);
		expect(editorCss).toContain('data-richtext-editor-canvas-width="half"');
		expect(editorCss).toContain('data-richtext-editor-canvas-width="third"');
	});

	it("uses the shared prose classes in both editable and rendered content", () => {
		expect(editorShell).toContain("content-prose");
		expect(editorShell).toContain("content-prose--main");
		expect(editorShell).toContain("content-prose--aside");
		expect(renderer).toContain("content-prose");
		expect(renderer).toContain("content-prose--main");
		expect(renderer).toContain("content-prose--aside");
		expect(proseCss).toContain(".content-prose--main");
		expect(proseCss).toContain(".content-prose--aside");
	});

	it("reserves editor chrome outside the preview-width canvas", () => {
		expect(editorCss).toContain(
			"--richtext-editor-shell-inline-chrome-reserve: 38px;",
		);
		expect(editorCss).toContain(
			"var(--richtext-editor-canvas-preview-max-width) +",
		);
		expect(editorCss).toContain(
			"var(--richtext-editor-shell-inline-chrome-reserve)",
		);
	});

	it("keeps vertical scrolling on the shell instead of shrinking the canvas", () => {
		const shellBlock = readRuleBlock(editorCss, ".richtext-shell");
		const canvasBlock = readRuleBlock(editorCss, ".richtext-editor-canvas");
		const editableBlock = readRuleBlock(
			editorCss,
			".richtext-editor-canvas--editable",
		);

		expect(shellBlock).toContain("overflow-y: auto;");
		expect(shellBlock).toContain("scrollbar-gutter: stable;");
		expect(canvasBlock).toContain(
			"width: min(100%, var(--richtext-editor-canvas-preview-max-width));",
		);
		expect(canvasBlock).toContain(
			"max-width: var(--richtext-editor-canvas-preview-max-width);",
		);
		expect(canvasBlock).toContain("margin-inline: auto;");
		expect(editableBlock).not.toContain("overflow-y:");
		expect(editableBlock).not.toContain("padding-inline:");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
