//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/content-preview.ts                                                           ////
//// Language: TS                                                                                                ////
//// Builds deterministic in-memory content render models for unsaved admin and member authoring previews.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	isContentSystemFieldListCode,
	resolveContentSystemFieldValue,
} from "@/lib/helpers/content-system-fields";
import type {
	ContentMediaOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
	ContentTemplateOption,
} from "@/lib/data/content";
import type { MediaRouteScope } from "@/lib/helpers/media-url";
import type {
	ContentRenderDestinationCode,
	ContentRenderDoc,
	ContentRenderField,
	ContentRenderFieldBuckets,
	ContentRenderModel,
	ContentRenderSeries,
	ContentRenderSurfaceScope,
} from "@/components/renderers/content/types";

export type ContentPreviewRequest = {
	contentId?: string | null;
	templateId: string;
	title: string;
	slug?: string;
	summary?: string;
	categoryId?: string;
	categorySlug?: string;
	subcategoryId?: string | null;
	subcategorySlug?: string | null;
	seriesId?: string | null;
	seriesPartNo?: string | number | null;
	fieldValues: Record<string, unknown>;
};

export type ContentPreviewResolvedDoc = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	categoryTitle: string | null;
	categorySlug: string | null;
	subcategoryTitle: string | null;
	subcategorySlug: string | null;
	seriesId: string | null;
	seriesTitle: string | null;
	seriesSlug: string | null;
	seriesPartNo: number | null;
	authorUsername: string | null;
	publishedAt: string | null;
	updatedAt: string | null;
};

type CreateDraftContentRenderModelArgs = {
	surfaceScope: ContentRenderSurfaceScope;
	mediaRouteScope: MediaRouteScope;
	doc: ContentPreviewResolvedDoc;
	template: ContentTemplateOption;
	fields: ContentTemplateField[];
	fieldOptions: ContentTemplateFieldOption[];
	media: ContentMediaOption[];
	fieldValues: Record<string, unknown>;
};

const RENDER_DESTINATIONS: ContentRenderDestinationCode[] = [
	"seo",
	"hero",
	"top",
	"left",
	"main",
	"right",
	"bottom",
	"hidden",
];

function createFieldBuckets(): ContentRenderFieldBuckets {
	return {
		seo: [],
		hero: [],
		top: [],
		left: [],
		main: [],
		right: [],
		bottom: [],
		hidden: [],
	};
}

function compareText(left: string, right: string): number {
	if (left < right) {
		return -1;
	}
	if (left > right) {
		return 1;
	}
	return 0;
}

function sortFields(fields: ContentRenderField[]): ContentRenderField[] {
	return [...fields].sort((left, right) => {
		if (left.displayOrder !== right.displayOrder) {
			return left.displayOrder - right.displayOrder;
		}
		return compareText(left.label, right.label);
	});
}

function bucketFields(fields: ContentRenderField[]): ContentRenderFieldBuckets {
	const buckets = createFieldBuckets();
	for (const field of fields) {
		buckets[field.renderDestinationCode].push(field);
	}
	for (const destination of RENDER_DESTINATIONS) {
		buckets[destination] = sortFields(buckets[destination]);
	}
	return buckets;
}

function normalizeDestination(value: string): ContentRenderDestinationCode {
	return RENDER_DESTINATIONS.includes(value as ContentRenderDestinationCode)
		? (value as ContentRenderDestinationCode)
		: "main";
}

function normalizeSeries(args: {
	seriesId: string | null;
	seriesTitle: string | null;
	seriesSlug: string | null;
	seriesPartNo: number | null;
}): ContentRenderSeries | null {
	if (!args.seriesId || !args.seriesTitle || !args.seriesSlug) {
		return null;
	}
	return {
		id: args.seriesId,
		title: args.seriesTitle,
		slug: args.seriesSlug,
		partNo: args.seriesPartNo,
		previousEpisode: null,
		nextEpisode: null,
	};
}

function optionLabelForField(args: {
	field: ContentTemplateField;
	value: unknown;
	fieldOptions: ContentTemplateFieldOption[];
}): string | null {
	if (typeof args.value !== "string" || args.value.trim().length === 0) {
		return null;
	}
	return (
		args.fieldOptions.find(
			(option) =>
				option.fieldListId === args.field.fieldListId &&
				option.optionKey === args.value,
		)?.label ?? null
	);
}

function mediaForField(args: {
	field: ContentTemplateField;
	value: unknown;
	media: ContentMediaOption[];
}): ContentMediaOption | null {
	if (args.field.valueColumnName !== "value_media_id") {
		return null;
	}
	const mediaId = typeof args.value === "string" ? args.value.trim() : "";
	if (mediaId.length === 0) {
		return null;
	}
	return args.media.find((row) => row.id === mediaId) ?? null;
}

function mapField(args: {
	doc: ContentPreviewResolvedDoc;
	field: ContentTemplateField;
	fieldOptions: ContentTemplateFieldOption[];
	media: ContentMediaOption[];
	fieldValues: Record<string, unknown>;
}): ContentRenderField {
	const fieldId = String(args.field.templateFieldId);
	const value = isContentSystemFieldListCode(args.field.fieldListCode)
		? resolveContentSystemFieldValue({
				fieldListCode: args.field.fieldListCode,
				doc: args.doc,
			})
		: args.fieldValues[fieldId];
	const media = mediaForField({
		field: args.field,
		value,
		media: args.media,
	});
	return {
		id: fieldId,
		fieldListCode: args.field.fieldListCode,
		label: args.field.label,
		helpText: args.field.helpText,
		fieldTypeCode: args.field.fieldTypeCode,
		renderDestinationCode: normalizeDestination(args.field.renderDestinationCode),
		layoutWidthCode: args.field.layoutWidthCode,
		layoutAlignCode: args.field.layoutAlignCode,
		showLabel: args.field.showLabel,
		labelStyleCode: args.field.labelStyleCode,
		labelPositionCode: args.field.labelPositionCode,
		labelSeparatorCode: args.field.labelSeparatorCode,
		valueColumnName: args.field.valueColumnName,
		displayOrder: args.field.displayOrder,
		value,
		optionLabel: optionLabelForField({
			field: args.field,
			value,
			fieldOptions: args.fieldOptions,
		}),
		media: media
			? {
					id: media.id,
					label: media.label,
					originalFilename: media.originalFilename,
					altText: media.altText,
					url: media.url,
					mimeType: media.mimeType,
					sizeBytes: media.sizeBytes,
					width: media.width,
					height: media.height,
				}
			: null,
		contentLink: null,
	};
}

function createDoc(args: CreateDraftContentRenderModelArgs): ContentRenderDoc {
	const series = normalizeSeries({
		seriesId: args.doc.seriesId,
		seriesTitle: args.doc.seriesTitle,
		seriesSlug: args.doc.seriesSlug,
		seriesPartNo: args.doc.seriesPartNo,
	});
	return {
		id: args.doc.id,
		title: args.doc.title.trim() || "Untitled content",
		slug: args.doc.slug,
		summary: args.doc.summary,
		categoryTitle: args.doc.categoryTitle,
		categorySlug: args.doc.categorySlug,
		subcategoryTitle: args.doc.subcategoryTitle,
		subcategorySlug: args.doc.subcategorySlug,
		contentKindCode: args.template.contentKindCode,
		contentKindLabel:
			args.template.contentKindLabel || args.template.contentKindCode,
		templateLabel: args.template.label,
		seriesTitle: series?.title ?? null,
		series,
		authorUsername: args.doc.authorUsername,
		publishedAt: args.doc.publishedAt,
		updatedAt: args.doc.updatedAt,
		rendererCode: args.template.rendererCode,
		publicHref: null,
		iconKey: null,
		iconColor: null,
	};
}

export function createDraftContentRenderModel(
	args: CreateDraftContentRenderModelArgs,
): ContentRenderModel {
	const fields = sortFields(
		args.fields
			.filter((field) => field.isEnabled)
			.map((field) =>
				mapField({
					doc: args.doc,
					field,
					fieldOptions: args.fieldOptions,
					media: args.media,
					fieldValues: args.fieldValues,
				}),
			),
	);
	return {
		surfaceScope: args.surfaceScope,
		mediaRouteScope: args.mediaRouteScope,
		doc: createDoc(args),
		fields,
		fieldsByDestination: bucketFields(fields),
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
