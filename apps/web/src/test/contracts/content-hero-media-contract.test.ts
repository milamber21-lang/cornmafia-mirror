//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/content-hero-media-contract.test.ts                                      ////
//// Language: TS                                                                                                 ////
//// Locks Riseopedia-style content Hero geometry, breadcrumbs, ratio-preserving media, and panel rhythm.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");
const read = (relativePath: string): string =>
	readFileSync(resolve(root, relativePath), "utf8");

describe("content Hero editorial media contract", () => {
	it("matches the Riseopedia overview height and reserves breadcrumb, title, and two summary lines", () => {
		const publicCss = read("styles/public.css");

		expect(publicCss).toContain("min-height: 11.5rem;");
		expect(publicCss).toContain("min-height: 12.5rem;");
		expect(publicCss).toContain("min-height: 8.5rem;");
		expect(publicCss).toContain(
			"grid-template-rows: minmax(1rem, auto) minmax(3rem, auto) minmax(3rem, auto);",
		);
		expect(publicCss).toContain("min-height: 3rem;");
		expect(publicCss).toContain("-webkit-line-clamp: 2;");
		expect(publicCss).not.toContain("--content-hero-media-height");
	});

	it("removes desktop Hero media from grid sizing while preserving horizontal padding", () => {
		const publicCss = read("styles/public.css");

		expect(publicCss).toContain("position: relative;");
		expect(publicCss).toContain("position: absolute;");
		expect(publicCss).toContain("grid-column: 2 / 3;");
		expect(publicCss).toContain("grid-row: 1 / 2;");
		expect(publicCss).toContain("inset: 0;");
		expect(publicCss).toContain(
			"--public-content-hero-media-overlap: calc(",
		);
		expect(publicCss).toContain(
			"margin-block: calc(-1 * var(--public-content-hero-media-overlap));",
		);
		expect(publicCss).toContain("margin-inline: 0;");
		expect(publicCss).not.toContain(
			"min-height: calc(8.5rem + (2 * var(--public-content-hero-padding)));",
		);
		expect(publicCss).not.toContain(
			"margin-inline-end: calc(-1 * var(--public-content-hero-padding));",
		);
	});

	it("scales the complete Hero image proportionally and places the border on the rendered image box", () => {
		const publicCss = read("styles/public.css");

		expect(publicCss).toContain(
			".public-content-hero__media-fields .content-field-media-frame",
		);
		expect(publicCss).toContain(
			".public-content-hero__media-fields .content-field-media-image",
		);
		expect(publicCss).toContain("min-height: 0;");
		expect(publicCss).toContain("width: auto;");
		expect(publicCss).toContain("height: 100%;");
		expect(publicCss).toContain("max-width: 100%;");
		expect(publicCss).toContain("max-height: 100%;");
		expect(publicCss).toContain("object-fit: contain;");
		expect(publicCss).toContain("object-position: center;");
		expect(publicCss).toContain("border: 1px solid var(--theme-border);");
		expect(publicCss).toContain("border-radius: var(--radius-hero, 1.5rem);");
		expect(publicCss).toContain("background: var(--theme-surface-ink-soft);");
		expect(publicCss).toContain("box-shadow: var(--shadow-media-inset);");
	});

	it("uses the same 24px rhythm between content destination panels", () => {
		const publicCss = read("styles/public.css");

		expect(publicCss).toContain(".public-content-article {");
		expect(publicCss).toContain("gap: var(--content-layout-gap);");
		expect(publicCss).not.toContain(
			"gap: clamp(var(--space-5), 3vw, var(--space-8));",
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
