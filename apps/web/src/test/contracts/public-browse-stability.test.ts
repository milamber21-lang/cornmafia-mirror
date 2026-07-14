//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/public-browse-stability.test.ts                                           ////
//// Language: TS                                                                                                ////
//// Locks browse rhythm, card/filter parity, icon scale, panel padding, hydration safety, and favicon output.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const uiCss = readFileSync(resolve(APP_ROOT, "src/styles/ui.css"), "utf8");
const publicCss = readFileSync(
	resolve(APP_ROOT, "src/styles/public.css"),
	"utf8",
);
const hydratedPublicComponents = [
	"src/components/public/PublicCategoryHub.tsx",
	"src/components/public/PublicCollectionHub.tsx",
	"src/components/public/PublicContentCard.tsx",
	"src/components/public/PublicSeriesPage.tsx",
].map((path) => readFileSync(resolve(APP_ROOT, path), "utf8"));

describe("public browse stability", () => {
	it("reserves the same fixed header rhythm with or without a description", () => {
		expect(uiCss).toContain("min-height: 11.5rem;");
		expect(uiCss).toContain(
			"grid-template-rows: minmax(1rem, auto) minmax(3rem, auto) minmax(3rem, auto);",
		);
		expect(uiCss).toMatch(
			/\.browse-page-header,\s*\.browse-page-header--with-description\s*\{[\s\S]*?min-height:\s*12\.5rem;/,
		);
	});

	it("keeps overview headers away from the fixed site chrome", () => {
		expect(publicCss).toMatch(
			/\.public-directory-shell,[\s\S]*?\.public-series-page-shell\s*\{[\s\S]*?padding-block:\s*var\(--page-pt\) var\(--page-pb\);/,
		);
	});

	it("prevents card-backed Riseopedia pages from adding a second page inset", () => {
		expect(publicCss).toMatch(
			/\.public-collection-page\.card\s*\{[\s\S]*?padding:\s*0;/,
		);
	});

	it("prevents global content-link hover styles from underlining result cards", () => {
		expect(uiCss).toMatch(
			/\.main a\.browse-result-card:hover[\s\S]*?text-decoration-line:\s*none;/,
		);
	});

	it("keeps public browse cards equal-height across every grid row", () => {
		expect(publicCss).toMatch(
			/\.public-directory-grid,[\s\S]*?\.public-series-episode-grid\s*\{[\s\S]*?grid-auto-rows:\s*1fr;/,
		);
		expect(publicCss).toMatch(
			/\.public-content-browse-card,[\s\S]*?height:\s*100%;/,
		);
	});

	it("matches public app-icon and search geometry to the Riseopedia browse rhythm", () => {
		expect(uiCss).toMatch(
			/\.app-icon-visual--card\s*\{[\s\S]*?--app-icon-visual-glyph-size:\s*75%;[\s\S]*?width:\s*4rem;[\s\S]*?height:\s*4rem;/,
		);
		expect(uiCss).toMatch(
			/\.app-icon-visual--card > img\.app-icon-visual__icon\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;/,
		);
		expect(publicCss).toMatch(
			/\.public-collection-controls:not\(\.riseopedia-filter-bar\)[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*nowrap;/,
		);
		expect(publicCss).toMatch(
			/\.public-browse-filter-search\s*\{[\s\S]*?flex:\s*1 2 16rem;/,
		);
		expect(publicCss).toMatch(
			/\.public-browse-filter-search \.ui-input\s*\{[\s\S]*?height:\s*100%;/,
		);
		expect(publicCss).toMatch(
			/\.public-category-filter-panel,[\s\S]*?\.public-series-results-panel\s*\{[\s\S]*?padding:\s*var\(--space-6\);/,
		);
	});

	it("avoids locale-dependent text generation during public hydration", () => {
		for (const source of hydratedPublicComponents) {
			expect(source).not.toContain("toLocaleDateString");
			expect(source).not.toContain("Intl.DateTimeFormat");
			expect(source).not.toContain("localeCompare(");
		}
	});

	it("serves the conventional favicon path", () => {
		expect(existsSync(resolve(APP_ROOT, "public/favicon.ico"))).toBe(true);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
