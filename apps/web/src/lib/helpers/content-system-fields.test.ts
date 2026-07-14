//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-system-fields.test.ts                                                ////
//// Language: TS                                                                                                 ////
//// Verifies configured canonical content metadata resolves without becoming editable field values.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	CONTENT_SYSTEM_FIELD_LIST_CODES,
	isContentSystemFieldListCode,
	resolveContentSystemFieldValue,
} from "@/lib/helpers/content-system-fields";

const doc = {
	authorUsername: "WoodenElf",
	publishedAt: "2026-07-13T12:00:00.000Z",
	updatedAt: "2026-07-13T13:00:00.000Z",
	seriesTitle: "Building Basics",
	seriesPartNo: 2,
};

describe("content system fields", () => {
	it("recognizes only the approved canonical field-list codes", () => {
		for (const fieldListCode of CONTENT_SYSTEM_FIELD_LIST_CODES) {
			expect(isContentSystemFieldListCode(fieldListCode)).toBe(true);
		}

		expect(isContentSystemFieldListCode("main_body")).toBe(false);
		expect(isContentSystemFieldListCode("system_fake_value")).toBe(false);
	});

	it("resolves author, timestamps, and optional series metadata", () => {
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_author_username",
				doc,
			}),
		).toBe("WoodenElf");
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_published_at",
				doc,
			}),
		).toBe("2026-07-13T12:00:00.000Z");
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_updated_at",
				doc,
			}),
		).toBe("2026-07-13T13:00:00.000Z");
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_series_title",
				doc,
			}),
		).toBe("Building Basics");
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_series_part_no",
				doc,
			}),
		).toBe(2);
	});

	it("returns null for missing or non-system metadata", () => {
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "system_series_title",
				doc: { ...doc, seriesTitle: null },
			}),
		).toBeNull();
		expect(
			resolveContentSystemFieldValue({
				fieldListCode: "main_body",
				doc,
			}),
		).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
