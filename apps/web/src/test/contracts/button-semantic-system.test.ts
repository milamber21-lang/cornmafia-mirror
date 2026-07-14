//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/button-semantic-system.test.ts                                           ////
//// Language: TS                                                                                                ////
//// Locks the repository-wide semantic button API and removal of legacy color variants.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync, readdirSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const buttonSource = readFileSync(
	resolve(APP_ROOT, "src/components/ui/basic-elements/Button.tsx"),
	"utf8",
);
const uiCss = readFileSync(resolve(APP_ROOT, "src/styles/ui.css"), "utf8");
const BUTTON_TAGS = new Set([
	"Button",
	"ButtonLink",
	"TableButton",
	"TableButtonLink",
]);
const LEGACY_VARIANTS = ["neutral", "accent", "green", "ghost"];

function sourceFiles(root: string): string[] {
	return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
		const path = join(root, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
	});
}

function buttonVariantExpressions(path: string): string[] {
	const source = readFileSync(path, "utf8");
	const sourceFile = ts.createSourceFile(
		path,
		source,
		ts.ScriptTarget.Latest,
		true,
		path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
	);
	const variants: string[] = [];
	function visit(node: ts.Node): void {
		if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
			const opening = ts.isJsxElement(node) ? node.openingElement : node;
			if (BUTTON_TAGS.has(opening.tagName.getText(sourceFile))) {
				for (const attribute of opening.attributes.properties) {
					if (
						ts.isJsxAttribute(attribute) &&
						attribute.name.getText(sourceFile) === "variant" &&
						attribute.initializer
					) {
						variants.push(attribute.initializer.getText(sourceFile));
					}
				}
			}
		}
		ts.forEachChild(node, visit);
	}
	visit(sourceFile);
	return variants;
}

describe("semantic button system", () => {
	it("defines the semantic variants and loading contract", () => {
		for (const variant of [
			"primary",
			"secondary",
			"quiet",
			"danger",
			"success",
		]) {
			expect(buttonSource).toContain(`| "${variant}"`);
			expect(uiCss).toContain(`.ui-button--${variant}`);
		}
		expect(buttonSource).toContain('variant = "secondary"');
		expect(buttonSource).toContain("const isDisabled = disabled || loading");
		expect(buttonSource).toContain("aria-busy={loading || undefined}");
	});

	it("removes legacy CSS classes and shared button call-site variants", () => {
		for (const variant of LEGACY_VARIANTS)
			expect(uiCss).not.toContain(`.ui-button--${variant}`);
		const expressions = sourceFiles(resolve(APP_ROOT, "src")).flatMap(
			buttonVariantExpressions,
		);
		for (const expression of expressions) {
			for (const variant of LEGACY_VARIANTS)
				expect(expression).not.toContain(`"${variant}"`);
		}
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
