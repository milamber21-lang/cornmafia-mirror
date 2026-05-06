//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/public-content.ts                                                              ////
//// Language: TS                                                                                                ////
//// DB-first public content path resolver and field bucketing for public render routes                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAppMediaFileUrl } from "@/lib/helpers/media-url";

export type PublicRoutePrefix = "map" | "tool" | "app" | "event" | "custom" | "video";
export type PublicRendererCode =
	| "page"
	| "map"
	| "tool"
	| "app"
	| "event"
	| "custom"
	| "youtube"
	| "stream"
	| "calendar";
export type PublicFieldRenderDestinationCode =
	| "seo"
	| "hero"
	| "top"
	| "left"
	| "main"
	| "right"
	| "bottom"
	| "hidden";

export type PublicContentSeriesEpisode = {
	id: string;
	title: string;
	slug: string;
	partNo: number | null;
	categorySlug: string;
	subcategorySlug: string;
	publicRoutePrefix: PublicRoutePrefix | null;
	rendererCode: PublicRendererCode;
	href: string;
	publishedAt: string | null;
};

export type PublicContentSeries = {
	id: string;
	title: string;
	slug: string;
	partNo: number | null;
	previousEpisode: PublicContentSeriesEpisode | null;
	nextEpisode: PublicContentSeriesEpisode | null;
};

export type PublicContentDoc = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	contentKindCode: string;
	contentKindLabel: string;
	publicRoutePrefix: PublicRoutePrefix | null;
	rendererCode: PublicRendererCode;
	publishedAt: string | null;
	series: PublicContentSeries | null;
};

export type PublicFieldLayoutWidthCode = "full" | "half" | "third";

export type PublicFieldLayoutAlignCode = "left" | "center" | "right" | "stretch";

export type PublicFieldLabelStyleCode = "title" | "label" | "text" | "muted";

export type PublicFieldLabelPositionCode = "above" | "inline";

export type PublicFieldLabelSeparatorCode = "none" | "colon" | "dash";

export type PublicContentMedia = {
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

export type PublicContentField = {
	id: string;
	fieldListCode: string;
	label: string;
	fieldTypeCode: string;
	renderDestinationCode: PublicFieldRenderDestinationCode;
	layoutWidthCode: PublicFieldLayoutWidthCode;
	layoutAlignCode: PublicFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: PublicFieldLabelStyleCode;
	labelPositionCode: PublicFieldLabelPositionCode;
	labelSeparatorCode: PublicFieldLabelSeparatorCode;
	valueColumnName: string;
	displayOrder: number;
	value: unknown;
	optionLabel: string | null;
	media: PublicContentMedia | null;
};

export type PublicContentResult = {
	doc: PublicContentDoc;
	fields: PublicContentField[];
	fieldsByDestination: Record<PublicFieldRenderDestinationCode, PublicContentField[]>;
};

export type PublicContentRedirectResult = {
	redirectPath: string;
	contentId: string;
	title: string | null;
	redirectTypeCode: string;
};

export type PublicCollectionDoc = {
	id: string;
	title: string;
	slug: string;
};

export type PublicCollectionActions = {
	canCreate: boolean;
	hasManageableContent: boolean;
};

export type PublicCollectionIconMedia = {
	id: string;
	url: string | null;
	filename: string | null;
	originalFilename: string | null;
	mimeType: string | null;
	storageRelPath: string | null;
};

export type PublicCollectionIconKey = {
	key: string | null;
	label: string | null;
	source: "lucide" | "media" | null;
	lucideName: string | null;
	iconMedia: PublicCollectionIconMedia | null;
};

export type PublicCollectionIconColor = {
	preview: string | null;
};

export type PublicCollectionContentCard = {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	templateId: string;
	templateLabel: string;
	contentKindCode: string;
	contentKindLabel: string;
	rendererCode: PublicRendererCode;
	publicHref: string | null;
	publishedAt: string | null;
	updatedAt: string | null;
	iconKey: PublicCollectionIconKey | null;
	iconColor: PublicCollectionIconColor | null;
};

export type PublicCollectionResult = {
	category: PublicCollectionDoc;
	collection: PublicCollectionDoc;
	actions: PublicCollectionActions;
	content: PublicCollectionContentCard[];
};

type PublicContentDbRow = {
	doc: unknown;
};

type PublicCollectionDbRow = {
	doc: unknown;
};

type PublicContentRedirectDbRow = {
	doc: unknown;
};

const RENDER_DESTINATIONS: PublicFieldRenderDestinationCode[] = [
	"seo",
	"hero",
	"top",
	"left",
	"main",
	"right",
	"bottom",
	"hidden",
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" && fieldValue.trim().length > 0
		? fieldValue
		: null;
}

function getNullableString(value: Record<string, unknown>, key: string): string | null {
	const fieldValue = value[key];
	return typeof fieldValue === "string" ? fieldValue : null;
}

function getNumber(value: Record<string, unknown>, key: string): number | null {
	const fieldValue = value[key];
	if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
		return fieldValue;
	}

	if (typeof fieldValue === "string" && fieldValue.trim().length > 0) {
		const parsed = Number(fieldValue.trim());
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function getArray(value: Record<string, unknown>, key: string): unknown[] {
	const fieldValue = value[key];
	return Array.isArray(fieldValue) ? fieldValue : [];
}

function buildPublicPathFromParts(args: {
	publicRoutePrefix: PublicRoutePrefix | null;
	categorySlug: string;
	subcategorySlug: string;
	contentSlug: string;
}): string {
	const categorySlug = args.categorySlug.trim().toLowerCase();
	const subcategorySlug = args.subcategorySlug.trim().toLowerCase();
	const contentSlug = args.contentSlug.trim().toLowerCase();

	if (args.publicRoutePrefix) {
		return `/${args.publicRoutePrefix}/${categorySlug}/${subcategorySlug}/${contentSlug}`;
	}

	return `/${categorySlug}/${subcategorySlug}/${contentSlug}`;
}

function normalizeRoutePrefix(value: unknown): PublicRoutePrefix | null {
	return value === "map" ||
		value === "tool" ||
		value === "app" ||
		value === "event" ||
		value === "custom" ||
		value === "video"
		? value
		: null;
}

function normalizeRendererCode(value: unknown): PublicRendererCode | null {
	return value === "page" ||
		value === "map" ||
		value === "tool" ||
		value === "app" ||
		value === "event" ||
		value === "custom" ||
		value === "youtube" ||
		value === "stream" ||
		value === "calendar"
		? value
		: null;
}

function normalizeLayoutWidth(value: unknown): PublicFieldLayoutWidthCode {
	return value === "half" || value === "third" || value === "full" ? value : "full";
}

function normalizeLayoutAlign(value: unknown): PublicFieldLayoutAlignCode {
	return value === "left" || value === "center" || value === "right" || value === "stretch"
		? value
		: "stretch";
}

function normalizeLabelStyle(value: unknown): PublicFieldLabelStyleCode {
	return value === "title" || value === "text" || value === "muted" || value === "label"
		? value
		: "label";
}

function normalizeLabelPosition(args: {
	value: unknown;
	labelStyleCode: PublicFieldLabelStyleCode;
}): PublicFieldLabelPositionCode {
	if (args.labelStyleCode === "title") {
		return "above";
	}

	return args.value === "inline" ? "inline" : "above";
}

function normalizeLabelSeparator(value: unknown): PublicFieldLabelSeparatorCode {
	if (value === "none" || value === "dash") {
		return value;
	}

	return "colon";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function normalizeDestination(value: unknown): PublicFieldRenderDestinationCode {
	return value === "seo" ||
		value === "hero" ||
		value === "top" ||
		value === "left" ||
		value === "right" ||
		value === "bottom" ||
		value === "hidden"
		? value
		: "main";
}

function createFieldBuckets(): Record<PublicFieldRenderDestinationCode, PublicContentField[]> {
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

function mapSeriesEpisode(value: unknown): PublicContentSeriesEpisode | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");
	const categorySlug = getString(value, "categorySlug");
	const subcategorySlug = getString(value, "subcategorySlug");
	const rendererCode = normalizeRendererCode(value.rendererCode);
	const href = getString(value, "href");

	if (!id || !title || !slug || !categorySlug || !subcategorySlug || !rendererCode || !href) {
		return null;
	}

	return {
		id,
		title,
		slug,
		partNo: getNumber(value, "partNo"),
		categorySlug,
		subcategorySlug,
		publicRoutePrefix: normalizeRoutePrefix(value.publicRoutePrefix),
		rendererCode,
		href,
		publishedAt: getNullableString(value, "publishedAt"),
	};
}

function mapSeries(value: unknown): PublicContentSeries | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");

	if (!id || !title || !slug) {
		return null;
	}

	return {
		id,
		title,
		slug,
		partNo: getNumber(value, "partNo"),
		previousEpisode: mapSeriesEpisode(value.previousEpisode),
		nextEpisode: mapSeriesEpisode(value.nextEpisode),
	};
}

function mapDoc(value: unknown): PublicContentDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");
	const categoryId = getString(value, "categoryId");
	const categoryTitle = getString(value, "categoryTitle");
	const categorySlug = getString(value, "categorySlug");
	const subcategoryId = getString(value, "subcategoryId");
	const subcategoryTitle = getString(value, "subcategoryTitle");
	const subcategorySlug = getString(value, "subcategorySlug");
	const contentKindCode = getString(value, "contentKindCode");
	const contentKindLabel = getString(value, "contentKindLabel");
	const rendererCode = normalizeRendererCode(value.rendererCode);

	if (
		!id ||
		!title ||
		!slug ||
		!categoryId ||
		!categoryTitle ||
		!categorySlug ||
		!subcategoryId ||
		!subcategoryTitle ||
		!subcategorySlug ||
		!contentKindCode ||
		!contentKindLabel ||
		!rendererCode
	) {
		return null;
	}

	return {
		id,
		title,
		slug,
		summary: getNullableString(value, "summary"),
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		contentKindCode,
		contentKindLabel,
		publicRoutePrefix: normalizeRoutePrefix(value.publicRoutePrefix),
		rendererCode,
		publishedAt: getNullableString(value, "publishedAt"),
		series: mapSeries(value.series),
	};
}

function mapMedia(value: unknown): PublicContentMedia | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const originalFilename = getString(value, "originalFilename");
	const storageRelPath = getString(value, "storageRelPath");
	if (!id || !originalFilename || !storageRelPath) {
		return null;
	}

	const altText = getNullableString(value, "altText");

	return {
		id,
		label: altText?.trim() ? `${originalFilename} - ${altText}` : originalFilename,
		originalFilename,
		altText,
		url: buildAppMediaFileUrl(storageRelPath),
		mimeType: getNullableString(value, "mimeType"),
		sizeBytes: getNumber(value, "sizeBytes"),
		width: getNumber(value, "width"),
		height: getNumber(value, "height"),
	};
}

function mapField(value: unknown): PublicContentField | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const fieldListCode = getString(value, "fieldListCode");
	const label = getString(value, "label");
	const fieldTypeCode = getString(value, "fieldTypeCode");
	const valueColumnName = getString(value, "valueColumnName");
	if (!id || !fieldListCode || !label || !fieldTypeCode || !valueColumnName) {
		return null;
	}

	const labelStyleCode = normalizeLabelStyle(value.labelStyleCode);

	return {
		id,
		fieldListCode,
		label,
		fieldTypeCode,
		renderDestinationCode: normalizeDestination(value.renderDestinationCode),
		layoutWidthCode: normalizeLayoutWidth(value.layoutWidthCode),
		layoutAlignCode: normalizeLayoutAlign(value.layoutAlignCode),
		showLabel: normalizeBoolean(value.showLabel, true),
		labelStyleCode,
		labelPositionCode: normalizeLabelPosition({
			value: value.labelPositionCode,
			labelStyleCode,
		}),
		labelSeparatorCode: normalizeLabelSeparator(value.labelSeparatorCode),
		valueColumnName,
		displayOrder: getNumber(value, "displayOrder") ?? 0,
		value: value.value ?? null,
		optionLabel: getNullableString(value, "optionLabel"),
		media: mapMedia(value.media),
	};
}

function mapPublicContentResult(value: unknown): PublicContentResult | null {
	if (!isRecord(value)) {
		return null;
	}

	const doc = mapDoc(value.doc);
	if (!doc) {
		return null;
	}

	const fields = getArray(value, "fields")
		.map(mapField)
		.filter((row): row is PublicContentField => row !== null)
		.sort((left, right) => left.displayOrder - right.displayOrder);

	const fieldsByDestination = createFieldBuckets();
	for (const field of fields) {
		fieldsByDestination[field.renderDestinationCode].push(field);
	}

	for (const destination of RENDER_DESTINATIONS) {
		fieldsByDestination[destination].sort(
			(left, right) => left.displayOrder - right.displayOrder,
		);
	}

	return {
		doc,
		fields,
		fieldsByDestination,
	};
}


function normalizeIconSource(value: unknown): "lucide" | "media" | null {
	return value === "lucide" || value === "media" ? value : null;
}

function mapCollectionDoc(value: unknown): PublicCollectionDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");

	if (!id || !title || !slug) {
		return null;
	}

	return {
		id,
		title,
		slug,
	};
}

function mapCollectionActions(value: unknown): PublicCollectionActions {
	if (!isRecord(value)) {
		return {
			canCreate: false,
			hasManageableContent: false,
		};
	}

	return {
		canCreate: normalizeBoolean(value.canCreate, false),
		hasManageableContent: normalizeBoolean(value.hasManageableContent, false),
	};
}

function mapCollectionIconMedia(value: unknown): PublicCollectionIconMedia | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	if (!id) {
		return null;
	}

	const storageRelPath = getNullableString(value, "storageRelPath");

	return {
		id,
		url: storageRelPath ? buildAppMediaFileUrl(storageRelPath) : null,
		filename: getNullableString(value, "filename"),
		originalFilename: getNullableString(value, "originalFilename"),
		mimeType: getNullableString(value, "mimeType"),
		storageRelPath,
	};
}

function mapCollectionIconKey(value: unknown): PublicCollectionIconKey | null {
	if (!isRecord(value)) {
		return null;
	}

	const key = getString(value, "key");
	const source = normalizeIconSource(value.source);

	if (!key || !source) {
		return null;
	}

	return {
		key,
		label: getNullableString(value, "label"),
		source,
		lucideName: getNullableString(value, "lucideName"),
		iconMedia: mapCollectionIconMedia(value.iconMedia),
	};
}

function mapCollectionIconColor(value: unknown): PublicCollectionIconColor | null {
	if (!isRecord(value)) {
		return null;
	}

	return {
		preview: getNullableString(value, "preview"),
	};
}

function mapCollectionContentCard(value: unknown): PublicCollectionContentCard | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getString(value, "id");
	const title = getString(value, "title");
	const slug = getString(value, "slug");
	const templateId = getString(value, "templateId");
	const templateLabel = getString(value, "templateLabel");
	const contentKindCode = getString(value, "contentKindCode");
	const contentKindLabel = getString(value, "contentKindLabel");
	const rendererCode = normalizeRendererCode(value.rendererCode);

	if (
		!id ||
		!title ||
		!slug ||
		!templateId ||
		!templateLabel ||
		!contentKindCode ||
		!contentKindLabel ||
		!rendererCode
	) {
		return null;
	}

	return {
		id,
		title,
		slug,
		summary: getNullableString(value, "summary"),
		templateId,
		templateLabel,
		contentKindCode,
		contentKindLabel,
		rendererCode,
		publicHref: getNullableString(value, "href"),
		publishedAt: getNullableString(value, "publishedAt"),
		updatedAt: getNullableString(value, "updatedAt"),
		iconKey: mapCollectionIconKey(value.iconKey),
		iconColor: mapCollectionIconColor(value.iconColor),
	};
}

function mapPublicCollectionResult(value: unknown): PublicCollectionResult | null {
	if (!isRecord(value)) {
		return null;
	}

	const category = mapCollectionDoc(value.category);
	const collection = mapCollectionDoc(value.collection);

	if (!category || !collection) {
		return null;
	}

	const content = getArray(value, "content")
		.map(mapCollectionContentCard)
		.filter((row): row is PublicCollectionContentCard => row !== null);

	return {
		category,
		collection,
		actions: mapCollectionActions(value.actions),
		content,
	};
}

function mapPublicContentRedirectResult(
	value: unknown,
): PublicContentRedirectResult | null {
	if (!isRecord(value)) {
		return null;
	}

	const redirectPath = getString(value, "redirectPath");
	const contentId = getString(value, "contentId");
	const redirectTypeCode = getString(value, "redirectTypeCode");

	if (!redirectPath || !contentId || !redirectTypeCode) {
		return null;
	}

	return {
		redirectPath,
		contentId,
		title: getNullableString(value, "title"),
		redirectTypeCode,
	};
}


export async function findPublicCollectionByPath(args: {
	actorDiscordId: string | null;
	categorySlug: string;
	subcategorySlug: string;
}): Promise<PublicCollectionResult | null> {
	const result = await query<PublicCollectionDbRow>(
		`
			SELECT web_api.web_content_public_list_subcategory($1, $2, $3) AS doc
		`,
		[args.actorDiscordId, args.categorySlug, args.subcategorySlug],
	);

	return mapPublicCollectionResult(result.rows[0]?.doc ?? null);
}

export async function findPublicContentByPath(args: {
	actorDiscordId: string | null;
	publicRoutePrefix: PublicRoutePrefix | null;
	categorySlug: string;
	subcategorySlug: string;
	contentSlug: string;
}): Promise<PublicContentResult | null> {
	const result = await query<PublicContentDbRow>(
		`
			SELECT web_api.web_content_public_find_by_path($1, $2, $3, $4, $5) AS doc
		`,
		[
			args.actorDiscordId,
			args.publicRoutePrefix,
			args.categorySlug,
			args.subcategorySlug,
			args.contentSlug,
		],
	);

	return mapPublicContentResult(result.rows[0]?.doc ?? null);
}

export async function findPublicContentRedirectByPath(args: {
	actorDiscordId: string | null;
	publicRoutePrefix: PublicRoutePrefix | null;
	categorySlug: string;
	subcategorySlug: string;
	contentSlug: string;
}): Promise<PublicContentRedirectResult | null> {
	const rawPath = buildPublicPathFromParts(args);
	const result = await query<PublicContentRedirectDbRow>(
		`
			SELECT web_api.web_content_public_find_redirect_by_path($1, $2) AS doc
		`,
		[args.actorDiscordId, rawPath],
	);

	return mapPublicContentRedirectResult(result.rows[0]?.doc ?? null);
}
