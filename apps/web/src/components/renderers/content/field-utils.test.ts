//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/field-utils.test.ts                                          ////
//// Language: TS                                                                                                 ////
//// Verifies public-safe field renderability and admin-only diagnostics for unresolved field values.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	hasRenderableValue,
	isContentFieldDisplayable,
	isContentFieldRenderable,
} from "./field-utils";
import type { ContentRenderField, ContentRenderModel } from "./types";

function createField(
	overrides: Partial<ContentRenderField> = {},
): ContentRenderField {
	return {
		id: "field-1",
		fieldListCode: "body_text",
		label: "Body",
		helpText: null,
		fieldTypeCode: "text",
		renderDestinationCode: "main",
		layoutWidthCode: "full",
		layoutAlignCode: "stretch",
		showLabel: true,
		labelStyleCode: "label",
		labelPositionCode: "above",
		labelSeparatorCode: "none",
		valueColumnName: "value_text",
		displayOrder: 1,
		value: "Example",
		optionLabel: null,
		media: null,
		contentLink: null,
		...overrides,
	};
}

function createModel(surfaceScope: "admin" | "public"): ContentRenderModel {
	return {
		surfaceScope,
		mediaRouteScope: surfaceScope === "admin" ? "admin" : "app",
		doc: {
			id: "content-1",
			title: "Example",
			slug: "example",
			summary: null,
			categoryTitle: null,
			categorySlug: null,
			subcategoryTitle: null,
			subcategorySlug: null,
			contentKindCode: "page",
			contentKindLabel: "Page",
			templateLabel: null,
			seriesTitle: null,
			series: null,
			authorUsername: null,
			publishedAt: null,
			updatedAt: null,
			rendererCode: "page",
			publicHref: null,
			iconKey: null,
			iconColor: null,
		},
		fields: [],
		fieldsByDestination: {
			seo: [],
			hero: [],
			top: [],
			left: [],
			main: [],
			right: [],
			bottom: [],
			hidden: [],
		},
	};
}

describe("hasRenderableValue", () => {
	it("preserves valid false and zero values", () => {
		expect(hasRenderableValue(false)).toBe(true);
		expect(hasRenderableValue(0)).toBe(true);
	});
});

describe("content field renderability", () => {
	it("suppresses unresolved media on public surfaces", () => {
		const field = createField({
			fieldTypeCode: "media_id",
			value: "42",
			media: null,
		});

		expect(isContentFieldDisplayable(field)).toBe(false);
		expect(isContentFieldRenderable(field, createModel("public"))).toBe(false);
	});

	it("keeps unresolved media available as an admin diagnostic", () => {
		const field = createField({
			fieldTypeCode: "media_id",
			value: "42",
			media: null,
		});

		expect(isContentFieldRenderable(field, createModel("admin"))).toBe(true);
	});

	it("suppresses invalid YouTube fields publicly and preserves admin diagnostics", () => {
		const field = createField({
			fieldTypeCode: "youtube_url",
			value: "not-a-video-url",
		});

		expect(isContentFieldDisplayable(field)).toBe(false);
		expect(isContentFieldRenderable(field, createModel("public"))).toBe(false);
		expect(isContentFieldRenderable(field, createModel("admin"))).toBe(true);
	});

	it("accepts safely resolved media", () => {
		const field = createField({
			fieldTypeCode: "media_id",
			value: "42",
			media: {
				id: "42",
				label: "Header",
				originalFilename: "header.webp",
				altText: "Header image",
				url: "/api/riseopedia/media/42",
				mimeType: "image/webp",
				sizeBytes: null,
				width: 1280,
				height: 720,
			},
		});

		expect(isContentFieldDisplayable(field)).toBe(true);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
