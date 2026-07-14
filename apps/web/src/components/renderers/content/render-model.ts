//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/render-model.ts                                              ////
//// Language: TS                                                                                                 ////
//// Converts public and admin content data into the shared content render model.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { ContentAdminPreview } from "@/lib/data/content";
import type {
	PublicContentField,
	PublicContentResult,
} from "@/lib/data/public-content";

import type {
	ContentRenderContentLink,
	ContentRenderDestinationCode,
	ContentRenderDoc,
	ContentRenderField,
	ContentRenderFieldBuckets,
	ContentRenderIconKey,
	ContentRenderMedia,
	ContentRenderModel,
	ContentRenderSeries,
} from "./types";

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

function normalizeDestination(value: string): ContentRenderDestinationCode {
	return RENDER_DESTINATIONS.includes(value as ContentRenderDestinationCode)
		? (value as ContentRenderDestinationCode)
		: "main";
}

function sortFields(fields: ContentRenderField[]): ContentRenderField[] {
	return [...fields].sort((left, right) => {
		if (left.displayOrder !== right.displayOrder) {
			return left.displayOrder - right.displayOrder;
		}

		return left.label.localeCompare(right.label);
	});
}

function bucketFields(fields: ContentRenderField[]): ContentRenderFieldBuckets {
	const fieldsByDestination = createFieldBuckets();

	for (const field of fields) {
		fieldsByDestination[field.renderDestinationCode].push(field);
	}

	for (const destination of RENDER_DESTINATIONS) {
		fieldsByDestination[destination] = sortFields(
			fieldsByDestination[destination],
		);
	}

	return fieldsByDestination;
}

function buildPublicHref(args: {
	publicRoutePrefix: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	contentSlug: string;
}): string | null {
	if (!args.categorySlug || !args.subcategorySlug) {
		return null;
	}

	const routeParts = [
		args.publicRoutePrefix,
		args.categorySlug,
		args.subcategorySlug,
		args.contentSlug,
	].filter(
		(part): part is string => typeof part === "string" && part.length > 0,
	);

	return `/${routeParts.join("/")}`;
}

function mapPublicMedia(field: PublicContentField): ContentRenderMedia | null {
	if (!field.media) {
		return null;
	}

	return {
		id: field.media.id,
		label: field.media.label,
		originalFilename: field.media.originalFilename,
		altText: field.media.altText,
		url: field.media.url,
		mimeType: field.media.mimeType,
		sizeBytes: field.media.sizeBytes,
		width: field.media.width,
		height: field.media.height,
	};
}

function mapPublicField(field: PublicContentField): ContentRenderField {
	return {
		id: field.id,
		fieldListCode: field.fieldListCode,
		label: field.label,
		helpText: null,
		fieldTypeCode: field.fieldTypeCode,
		renderDestinationCode: normalizeDestination(field.renderDestinationCode),
		layoutWidthCode: field.layoutWidthCode,
		layoutAlignCode: field.layoutAlignCode,
		showLabel: field.showLabel,
		labelStyleCode: field.labelStyleCode,
		labelPositionCode: field.labelPositionCode,
		labelSeparatorCode: field.labelSeparatorCode,
		valueColumnName: field.valueColumnName,
		displayOrder: field.displayOrder,
		value: field.value,
		optionLabel: field.optionLabel,
		media: mapPublicMedia(field),
		contentLink: mapContentLink(field.contentLink),
	};
}

function mapContentLink(
	contentLink: { id: string; title: string; href: string } | null,
): ContentRenderContentLink | null {
	if (!contentLink) {
		return null;
	}

	return {
		id: contentLink.id,
		title: contentLink.title,
		href: contentLink.href,
	};
}

function mapPublicDoc(content: PublicContentResult): ContentRenderDoc {
	const { doc } = content;

	return {
		id: doc.id,
		title: doc.title,
		slug: doc.slug,
		summary: doc.summary,
		categoryTitle: doc.categoryTitle,
		categorySlug: doc.categorySlug,
		subcategoryTitle: doc.subcategoryTitle,
		subcategorySlug: doc.subcategorySlug,
		contentKindCode: doc.contentKindCode,
		contentKindLabel: doc.contentKindLabel,
		templateLabel: null,
		seriesTitle: doc.series?.title ?? null,
		series: doc.series,
		authorUsername: doc.authorUsername,
		publishedAt: doc.publishedAt,
		updatedAt: doc.updatedAt,
		rendererCode: doc.rendererCode,
		publicHref: buildPublicHref({
			publicRoutePrefix: doc.publicRoutePrefix,
			categorySlug: doc.categorySlug,
			subcategorySlug: doc.subcategorySlug,
			contentSlug: doc.slug,
		}),
		iconKey: null,
		iconColor: null,
	};
}

function normalizeIconSource(value: string | null): "lucide" | "media" | null {
	if (value === "lucide" || value === "media") {
		return value;
	}

	return null;
}

function mapAdminIconKey(
	content: ContentAdminPreview,
): ContentRenderIconKey | null {
	const { doc } = content;
	if (
		!doc.iconKeyId &&
		!doc.iconKeyKey &&
		!doc.iconKeyLucideName &&
		!doc.iconMediaId
	) {
		return null;
	}

	return {
		key: doc.iconKeyKey,
		label: doc.iconKeyLabel,
		source: normalizeIconSource(doc.iconKeySourceCode),
		lucideName: doc.iconKeyLucideName,
		iconMedia: doc.iconMediaId
			? {
					id: doc.iconMediaId,
					url: doc.iconMediaUrl,
					filename: doc.iconMediaUrl,
					originalFilename: null,
					mimeType: null,
					storageRelPath: null,
				}
			: null,
	};
}

function mapAdminMedia(
	media: ContentAdminPreview["fields"][number]["media"],
): ContentRenderMedia | null {
	if (!media) {
		return null;
	}

	return {
		id: media.id,
		label: media.label,
		originalFilename: media.originalFilename,
		altText: media.altText,
		url: media.url,
		mimeType: media.mimeType,
		sizeBytes: media.sizeBytes,
		width: media.width,
		height: media.height,
	};
}

function mapAdminSeries(
	content: ContentAdminPreview,
): ContentRenderSeries | null {
	const { doc } = content;

	if (!doc.seriesId || !doc.seriesTitle || !doc.seriesSlug) {
		return null;
	}

	return {
		id: doc.seriesId,
		title: doc.seriesTitle,
		slug: doc.seriesSlug,
		partNo: doc.seriesPartNo,
		previousEpisode: null,
		nextEpisode: null,
	};
}

function mapAdminField(
	field: ContentAdminPreview["fields"][number],
): ContentRenderField {
	return {
		id: field.id,
		fieldListCode: field.fieldListCode,
		label: field.label,
		helpText: field.helpText,
		fieldTypeCode: field.fieldTypeCode,
		renderDestinationCode: normalizeDestination(field.renderDestinationCode),
		layoutWidthCode: field.layoutWidthCode,
		layoutAlignCode: field.layoutAlignCode,
		showLabel: field.showLabel,
		labelStyleCode: field.labelStyleCode,
		labelPositionCode: field.labelPositionCode,
		labelSeparatorCode: field.labelSeparatorCode,
		valueColumnName: field.valueColumnName,
		displayOrder: field.displayOrder,
		value: field.value,
		optionLabel: field.optionLabel,
		media: mapAdminMedia(field.media),
		contentLink: mapContentLink(field.contentLink),
	};
}

function mapAdminDoc(content: ContentAdminPreview): ContentRenderDoc {
	const { doc } = content;

	return {
		id: doc.id,
		title: doc.title,
		slug: doc.slug,
		summary: doc.summary,
		categoryTitle: doc.categoryTitle,
		categorySlug: doc.categorySlug,
		subcategoryTitle: doc.subcategoryTitle,
		subcategorySlug: doc.subcategorySlug,
		contentKindCode: doc.contentKindCode,
		contentKindLabel: doc.contentKindLabel,
		templateLabel: doc.templateLabel,
		seriesTitle: doc.seriesTitle,
		series: mapAdminSeries(content),
		authorUsername: doc.authorUsername,
		publishedAt: doc.publishedAt,
		updatedAt: doc.updatedAt,
		rendererCode: doc.rendererCode,
		publicHref: buildPublicHref({
			publicRoutePrefix: doc.publicRoutePrefix,
			categorySlug: doc.categorySlug,
			subcategorySlug: doc.subcategorySlug,
			contentSlug: doc.slug,
		}),
		iconKey: mapAdminIconKey(content),
		iconColor: doc.iconColorPreview ? { preview: doc.iconColorPreview } : null,
	};
}

export function createPublicContentRenderModel(
	content: PublicContentResult,
): ContentRenderModel {
	const fields = sortFields(content.fields.map(mapPublicField));

	return {
		surfaceScope: "public",
		mediaRouteScope: "app",
		doc: mapPublicDoc(content),
		fields,
		fieldsByDestination: bucketFields(fields),
	};
}

export function createAdminContentRenderModel(
	content: ContentAdminPreview,
): ContentRenderModel {
	const fields = sortFields(content.fields.map(mapAdminField));

	return {
		surfaceScope: "admin",
		mediaRouteScope: "admin",
		doc: mapAdminDoc(content),
		fields,
		fieldsByDestination: bucketFields(fields),
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
