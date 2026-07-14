//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/types.ts                                                     ////
//// Language: TS                                                                                                 ////
//// Shared content render model types for admin preview, public pages, listings, and renderer dispatch.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { MediaRouteScope } from "@/lib/helpers/media-url";

export type ContentRenderSurfaceScope = "admin" | "member" | "public";

export type ContentRendererCode =
	| "page"
	| "map"
	| "tool"
	| "app"
	| "event"
	| "custom"
	| "youtube"
	| "stream"
	| "calendar"
	| string;

export type ContentRenderDestinationCode =
	| "seo"
	| "hero"
	| "top"
	| "left"
	| "main"
	| "right"
	| "bottom"
	| "hidden";

export type ContentRenderLayoutWidthCode = "full" | "half" | "third";

export type ContentRenderLayoutAlignCode =
	| "left"
	| "center"
	| "right"
	| "stretch";

export type ContentRenderLabelStyleCode = "title" | "label" | "text" | "muted";

export type ContentRenderLabelPositionCode = "above" | "inline";

export type ContentRenderLabelSeparatorCode = "none" | "colon" | "dash";

export type ContentRenderIconMedia = {
	id: string;
	url: string | null;
	filename: string | null;
	originalFilename: string | null;
	mimeType: string | null;
	storageRelPath: string | null;
};

export type ContentRenderIconKey = {
	key: string | null;
	label: string | null;
	source: "lucide" | "media" | null;
	lucideName: string | null;
	iconMedia: ContentRenderIconMedia | null;
};

export type ContentRenderIconColor = {
	preview: string | null;
};

export type ContentRenderSeriesEpisode = {
	id: string;
	title: string;
	slug: string;
	partNo: number | null;
	categorySlug: string;
	subcategorySlug: string;
	publicRoutePrefix: string | null;
	rendererCode: ContentRendererCode;
	href: string;
	publishedAt: string | null;
};

export type ContentRenderSeries = {
	id: string;
	title: string;
	slug: string;
	partNo: number | null;
	previousEpisode: ContentRenderSeriesEpisode | null;
	nextEpisode: ContentRenderSeriesEpisode | null;
};

export type ContentRenderDoc = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	categoryTitle: string | null;
	categorySlug: string | null;
	subcategoryTitle: string | null;
	subcategorySlug: string | null;
	contentKindCode: string;
	contentKindLabel: string;
	templateLabel: string | null;
	seriesTitle: string | null;
	series: ContentRenderSeries | null;
	authorUsername: string | null;
	publishedAt: string | null;
	updatedAt: string | null;
	rendererCode: ContentRendererCode;
	publicHref: string | null;
	iconKey: ContentRenderIconKey | null;
	iconColor: ContentRenderIconColor | null;
};

export type ContentRenderMedia = {
	id: string;
	label: string;
	originalFilename: string;
	altText: string | null;
	url: string | null;
	mimeType: string | null;
	sizeBytes: number | null;
	width: number | null;
	height: number | null;
};

export type ContentRenderContentLink = {
	id: string;
	title: string;
	href: string;
};

export type ContentRenderField = {
	id: string;
	fieldListCode: string;
	label: string;
	helpText: string | null;
	fieldTypeCode: string;
	renderDestinationCode: ContentRenderDestinationCode;
	layoutWidthCode: ContentRenderLayoutWidthCode;
	layoutAlignCode: ContentRenderLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: ContentRenderLabelStyleCode;
	labelPositionCode: ContentRenderLabelPositionCode;
	labelSeparatorCode: ContentRenderLabelSeparatorCode;
	valueColumnName: string;
	displayOrder: number;
	value: unknown;
	optionLabel: string | null;
	media: ContentRenderMedia | null;
	contentLink: ContentRenderContentLink | null;
};

export type ContentRenderFieldBuckets = Record<
	ContentRenderDestinationCode,
	ContentRenderField[]
>;

export type ContentRenderModel = {
	surfaceScope: ContentRenderSurfaceScope;
	mediaRouteScope: MediaRouteScope;
	doc: ContentRenderDoc;
	fields: ContentRenderField[];
	fieldsByDestination: ContentRenderFieldBuckets;
};

export type ContentRenderCardModel = Pick<
	ContentRenderDoc,
	| "id"
	| "title"
	| "summary"
	| "categoryTitle"
	| "subcategoryTitle"
	| "contentKindLabel"
	| "publishedAt"
	| "publicHref"
	| "iconKey"
	| "iconColor"
>;

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
