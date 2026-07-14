//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/editors/richtext/rich-text-json.test.ts                                             //
//// Language: TS                                                                                                //
//// Verifies stored rich-text normalization and deterministic media/link reference extraction.                //
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	extractRichTextLinkReferences,
	extractRichTextMediaReferences,
	isRichTextJsonEmpty,
	normalizeRichTextEditorOutput,
	normalizeRichTextJson,
} from "@/lib/editors/richtext/rich-text-json";

describe("stored rich-text JSON", () => {
	it("normalizes legacy link fields and extracts stable references", () => {
		const normalized = normalizeRichTextJson({
			root: {
				type: "root",
				version: 1,
				children: [
					{
						type: "link",
						url: "https://example.test/guide",
						children: [{ type: "text", text: "Guide" }],
					},
					{
						type: "image",
						mediaId: "1000000001",
						src: "/api/media/1000000001",
						alt: "Example",
					},
				],
			},
		});

		expect(normalized).not.toBeNull();
		expect(extractRichTextLinkReferences(normalized)).toEqual([
			{
				rawUrl: "https://example.test/guide",
				linkText: "Guide",
				displayOrder: 1,
				sourceKind: "text",
				target: {
					kind: "legacy",
					href: "https://example.test/guide",
					newTab: false,
				},
			},
		]);
		expect(extractRichTextMediaReferences(normalized)).toEqual([
			{
				mediaId: 1000000001,
				source: "/api/media/1000000001",
				caption: "Example",
				displayOrder: 1,
			},
		]);
	});

	it("preserves structured text and image targets", () => {
		const normalized = normalizeRichTextEditorOutput({
			root: {
				type: "root",
				version: 1,
				children: [
					{
						type: "link",
						url: "/old/path",
						linkTarget: {
							kind: "internal_content",
							contentId: 1000000001,
							href: "/learn/guides/example",
						},
						children: [{ type: "text", text: "Guide" }],
					},
					{
						type: "resizable-image",
						version: 1,
						src: "/api/media/1000000001",
						alt: "Vehicle",
						linkTarget: {
							kind: "riseopedia_entity",
							entityId: "1000000002",
							href: "/info/riseopedia/entity/vehicle",
						},
					},
				],
			},
		});

		expect(normalized).not.toBeNull();
		expect(normalized?.root.children[1]).toMatchObject({
			type: "resizable-image",
			version: 3,
			frameStyle: "none",
		});
		expect(extractRichTextLinkReferences(normalized)).toEqual([
			{
				rawUrl: "/learn/guides/example",
				linkText: "Guide",
				displayOrder: 1,
				sourceKind: "text",
				target: {
					kind: "internal_content",
					contentId: "1000000001",
					href: "/learn/guides/example",
				},
			},
			{
				rawUrl: "/info/riseopedia/entity/vehicle",
				linkText: "Vehicle",
				displayOrder: 2,
				sourceKind: "image",
				target: {
					kind: "riseopedia_entity",
					entityId: "1000000002",
					href: "/info/riseopedia/entity/vehicle",
				},
			},
		]);
	});

	it("normalizes legacy image borders into the current frame style", () => {
		const normalized = normalizeRichTextEditorOutput({
			root: {
				type: "root",
				version: 1,
				children: [
					{
						type: "resizable-image",
						version: 2,
						src: "/api/media/1000000001",
						border: true,
					},
				],
			},
		});

		expect(normalized?.root.children[0]).toMatchObject({
			type: "resizable-image",
			version: 3,
			frameStyle: "border",
		});
		expect(normalized?.root.children[0]).not.toHaveProperty("border");
	});

	it("recognizes visually empty stored documents", () => {
		expect(
			isRichTextJsonEmpty({
				root: {
					type: "root",
					version: 1,
					children: [
						{
							type: "paragraph",
							children: [{ type: "text", text: "   " }],
						},
					],
				},
			}),
		).toBe(true);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
