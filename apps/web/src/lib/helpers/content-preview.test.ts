//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-preview.test.ts                                                     ////
//// Language: TS                                                                                                 ////
//// Verifies unsaved authoring state becomes a deterministic destination-aware content render model.             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import type {
	ContentMediaOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
	ContentTemplateOption,
} from "@/lib/data/content";
import { createDraftContentRenderModel } from "@/lib/helpers/content-preview";

const template: ContentTemplateOption = {
	id: "1001",
	code: "tutorial",
	key: "tutorial",
	label: "Tutorial",
	contentKindCode: "page",
	contentKindLabel: "Page",
	publicRoutePrefix: null,
	rendererCode: "page",
	surfaceScopeCode: "member",
	allowsSeries: false,
};

function field(args: {
	id: number;
	code: string;
	label: string;
	destination: ContentTemplateField["renderDestinationCode"];
	valueColumnName?: string;
	displayOrder?: number;
	enabled?: boolean;
}): ContentTemplateField {
	return {
		id: String(args.id),
		templateId: template.id,
		templateCode: template.code,
		templateLabel: template.label,
		contentKindCode: template.contentKindCode,
		surfaceScopeCode: template.surfaceScopeCode,
		allowsSeries: template.allowsSeries,
		templateFieldId: args.id,
		fieldListId: String(args.id + 100),
		fieldListCode: args.code,
		label: args.label,
		helpText: null,
		fieldTypeCode:
			args.valueColumnName === "value_media_id" ? "media" : "short_text",
		fieldTypeLabel:
			args.valueColumnName === "value_media_id" ? "Media" : "Short text",
		renderDestinationCode: args.destination,
		layoutWidthCode: "full",
		layoutAlignCode: "stretch",
		showLabel: true,
		labelStyleCode: "label",
		labelPositionCode: "above",
		labelSeparatorCode: "none",
		valueColumnName: args.valueColumnName ?? "value_text",
		displayOrder: args.displayOrder ?? args.id,
		isRequired: false,
		isEnabled: args.enabled ?? true,
		optionCount: 0,
		fieldToolCodes: [],
	};
}

const fields: ContentTemplateField[] = [
	field({
		id: 2,
		code: "difficulty",
		label: "Difficulty",
		destination: "right",
	}),
	field({
		id: 3,
		code: "hero_media",
		label: "Hero media",
		destination: "hero",
		valueColumnName: "value_media_id",
	}),
	field({
		id: 4,
		code: "disabled_field",
		label: "Disabled",
		destination: "main",
		enabled: false,
	}),
	field({
		id: 5,
		code: "system_author_username",
		label: "By",
		destination: "top",
	}),
];

const fieldOptions: ContentTemplateFieldOption[] = [
	{
		id: "2001",
		fieldListId: "102",
		fieldListCode: "difficulty",
		optionKey: "advanced",
		label: "Advanced",
		displayOrder: 1,
	},
];

const media: ContentMediaOption[] = [
	{
		id: "3001",
		label: "Tutorial image",
		originalFilename: "tutorial.png",
		altText: "Tutorial image",
		url: "/api/me/media/3001",
		mimeType: "image/png",
		sizeBytes: 2048,
		width: 1280,
		height: 720,
		categoryId: "10",
		subcategoryId: "11",
	},
];

describe("createDraftContentRenderModel", () => {
	it("maps unsaved values into the real destination buckets and renderer contract", () => {
		const model = createDraftContentRenderModel({
			surfaceScope: "member",
			mediaRouteScope: "app",
			doc: {
				id: "preview",
				title: "  Storage tutorial  ",
				slug: "storage-tutorial",
				summary: "Build a storage network.",
				categoryTitle: "Guides",
				categorySlug: "guides",
				subcategoryTitle: "Building",
				subcategorySlug: "building",
				seriesId: "4001",
				seriesTitle: "Automation",
				seriesSlug: "automation",
				seriesPartNo: 4,
				authorUsername: "Author",
				publishedAt: "2026-07-13T12:00:00.000Z",
				updatedAt: "2026-07-13T13:00:00.000Z",
			},
			template,
			fields,
			fieldOptions,
			media,
			fieldValues: {
				"2": "advanced",
				"3": "3001",
				"4": "must stay hidden",
				"5": "Fake author",
			},
		});

		expect(model.surfaceScope).toBe("member");
		expect(model.mediaRouteScope).toBe("app");
		expect(model.doc.title).toBe("Storage tutorial");
		expect(model.doc.rendererCode).toBe("page");
		expect(model.doc.series).toMatchObject({
			id: "4001",
			title: "Automation",
			partNo: 4,
		});
		expect(model.fields).toHaveLength(3);
		expect(model.fieldsByDestination.hero).toHaveLength(1);
		expect(model.fieldsByDestination.top[0]).toMatchObject({
			fieldListCode: "system_author_username",
			value: "Author",
		});
		expect(model.fieldsByDestination.main).toHaveLength(0);
		expect(model.fieldsByDestination.right[0]).toMatchObject({
			fieldListCode: "difficulty",
			optionLabel: "Advanced",
		});
		expect(model.fieldsByDestination.hero[0]?.media).toMatchObject({
			id: "3001",
			url: "/api/me/media/3001",
		});
		expect(
			model.fields.every((renderField) => renderField.contentLink === null),
		).toBe(true);
	});

	it("uses a stable untitled fallback and omits incomplete series metadata", () => {
		const model = createDraftContentRenderModel({
			surfaceScope: "admin",
			mediaRouteScope: "admin",
			doc: {
				id: "preview",
				title: "   ",
				slug: "preview",
				summary: null,
				categoryTitle: null,
				categorySlug: null,
				subcategoryTitle: null,
				subcategorySlug: null,
				seriesId: "4001",
				seriesTitle: null,
				seriesSlug: null,
				seriesPartNo: null,
				authorUsername: null,
				publishedAt: null,
				updatedAt: null,
			},
			template,
			fields: [],
			fieldOptions: [],
			media: [],
			fieldValues: {},
		});

		expect(model.doc.title).toBe("Untitled content");
		expect(model.doc.series).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
