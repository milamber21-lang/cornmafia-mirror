//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/editors/richtext/rich-text-link-targets.test.ts                                      ////
//// Language: TS                                                                                                 ////
//// Verifies durable RichText link-target normalization and legacy compatibility.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	createLegacyRichTextLinkTarget,
	normalizeRichTextLinkTarget,
	richTextLinkTargetOpensNewTab,
	richTextLinkTargetsEqual,
} from "./rich-text-link-targets";

describe("rich-text link targets", () => {
	it("normalizes durable internal and Riseopedia identifiers as strings", () => {
		expect(
			normalizeRichTextLinkTarget({
				kind: "internal_content",
				contentId: 1000000001,
				href: "/learn/guides/example",
			}),
		).toEqual({
			kind: "internal_content",
			contentId: "1000000001",
			href: "/learn/guides/example",
		});

		expect(
			normalizeRichTextLinkTarget({
				kind: "riseopedia_entity",
				entityId: "01000000002",
				href: "/info/riseopedia/entity/example",
			}),
		).toEqual({
			kind: "riseopedia_entity",
			entityId: "1000000002",
			href: "/info/riseopedia/entity/example",
		});
	});

	it("falls back to a legacy URL target for existing stored links", () => {
		const target = normalizeRichTextLinkTarget(null, {
			href: "https://example.test/guide",
			newTab: true,
		});

		expect(target).toEqual({
			kind: "legacy",
			href: "https://example.test/guide",
			newTab: true,
		});
		expect(target ? richTextLinkTargetOpensNewTab(target) : false).toBe(true);
	});

	it("compares target identity rather than object identity", () => {
		const left = createLegacyRichTextLinkTarget("/example", false);
		const right = createLegacyRichTextLinkTarget("/example", false);

		expect(richTextLinkTargetsEqual(left, right)).toBe(true);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
