//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/richtext-link-picker-options.test.ts                                          ////
//// Language: TS                                                                                                 ////
//// Verifies distinct and parent-aware option normalization for editor link picker filters.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import { distinctRichTextLinkPickerOptions } from "./richtext-link-picker-options";

describe("distinctRichTextLinkPickerOptions", () => {
	it("returns one sorted option per visible label", () => {
		expect(
			distinctRichTextLinkPickerOptions([
				{ value: "weapon", label: "Weapon", parentValue: "asset" },
				{ value: "ammo", label: "Ammunition", parentValue: "asset" },
				{ value: "weapon-alt", label: "Weapon", parentValue: "recipe" },
			]),
		).toEqual([
			{ value: "ammo", label: "Ammunition", parentValue: "asset" },
			{ value: "weapon", label: "Weapon", parentValue: "asset" },
		]);
	});

	it("scopes options to the selected parent before deduplicating", () => {
		expect(
			distinctRichTextLinkPickerOptions(
				[
					{ value: "shared", label: "Shared Asset", parentValue: "asset" },
					{ value: "shared", label: "Shared Recipe", parentValue: "recipe" },
					{ value: "recipe-only", label: "Recipe Only", parentValue: "recipe" },
				],
				"recipe",
			),
		).toEqual([
			{ value: "recipe-only", label: "Recipe Only", parentValue: "recipe" },
			{ value: "shared", label: "Shared Recipe", parentValue: "recipe" },
		]);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
