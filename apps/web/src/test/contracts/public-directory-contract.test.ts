//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/public-directory-contract.test.ts                                           ////
//// Language: TS                                                                                                  ////
//// Locks the DB-first directory routes and the shared browse header, filter, result-card, and icon contracts.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const APP_ROOT = process.cwd();
const categoryPage = readFileSync(
	resolve(APP_ROOT, "src/app/[category]/page.tsx"),
	"utf8",
);
const publicContentData = readFileSync(
	resolve(APP_ROOT, "src/lib/data/public-content.ts"),
	"utf8",
);
const categoryHub = readFileSync(
	resolve(APP_ROOT, "src/components/public/PublicCategoryHub.tsx"),
	"utf8",
);
const collectionHub = readFileSync(
	resolve(APP_ROOT, "src/components/public/PublicCollectionHub.tsx"),
	"utf8",
);
const seriesPage = readFileSync(
	resolve(APP_ROOT, "src/components/public/PublicSeriesPage.tsx"),
	"utf8",
);
const contentCard = readFileSync(
	resolve(APP_ROOT, "src/components/public/PublicContentCard.tsx"),
	"utf8",
);
const memberProfile = readFileSync(
	resolve(APP_ROOT, "src/components/me/MeTable.tsx"),
	"utf8",
);

describe("public directory route contract", () => {
	it("loads the category page through the existing actor-aware DB function", () => {
		expect(categoryPage).toContain("findPublicCategoryByPath");
		expect(categoryPage).toContain("getCurrentActorDiscordId");
		expect(categoryPage).toContain("<PublicCategoryHub category={category} />");
		expect(publicContentData).toContain(
			"SELECT web_api.web_content_public_list_category($1, $2) AS doc",
		);
	});

	it("uses the same browse header geometry across category, collection, series, and profile", () => {
		for (const source of [
			categoryHub,
			collectionHub,
			seriesPage,
			memberProfile,
		]) {
			expect(source).toContain("<BrowsePageHeader");
			expect(source).not.toContain("<PageHero");
		}
	});

	it("keeps filters outside result panels and gives series explicit sort controls", () => {
		expect(categoryHub).toContain("<BrowseFilterPanel");
		expect(categoryHub).toContain("<BrowseResultsPanel");
		expect(collectionHub).toContain("<BrowseFilterPanel");
		expect(collectionHub).toContain("<BrowseResultsPanel");
		expect(seriesPage).toContain("<BrowseFilterPanel");
		expect(seriesPage).toContain("<BrowseResultsPanel");
		expect(seriesPage).toContain('label: "Series order"');
		expect(seriesPage).toContain('label: "Newest"');
		expect(seriesPage).toContain('label: "Title A-Z"');
	});

	it("uses the global browse-card and application-icon visual contracts", () => {
		expect(categoryHub).toContain("<BrowseResultCard");
		expect(seriesPage).toContain("<BrowseResultCard");
		expect(contentCard).toContain("<BrowseResultCard");
		expect(contentCard).toContain("<IconVisual");
		expect(memberProfile).toContain("<IconVisual");
	});

	it("preserves collection authoring actions and differentiated empty states", () => {
		expect(collectionHub).toContain("MemberContentCreatePanel");
		expect(collectionHub).toContain("hasManageableContent");
		expect(collectionHub).toContain("No content matches these filters");
		expect(collectionHub).toContain("No visible content here yet");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
