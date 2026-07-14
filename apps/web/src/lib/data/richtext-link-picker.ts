//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/richtext-link-picker.ts                                                        ////
//// Language: TS                                                                                                ////
//// Cached metadata and fast DB-first rows for actor-readable internal and public Riseopedia link pickers.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";

export type RichTextLinkPickerOption = {
	value: string;
	label: string;
	parentValue?: string;
	slug?: string;
};

export type RichTextLinkPickerIcon = {
	id: string;
	key: string | null;
	label: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
	iconMedia: {
		id: string;
		url: string | null;
		filename: string | null;
		originalFilename: string | null;
		mimeType: string | null;
		storageRelPath: string | null;
		thumbnailURL: string | null;
	} | null;
};

export type RichTextLinkPickerIconColor = {
	preview: string | null;
};

export type RichTextInternalLinkPickerRow = {
	id: string;
	title: string;
	summary: string | null;
	categoryId: string;
	categoryLabel: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryLabel: string;
	subcategorySlug: string;
	contentKindCode: string;
	contentKindLabel: string;
	href: string;
	iconKey: RichTextLinkPickerIcon | null;
	iconColor: RichTextLinkPickerIconColor | null;
};

export type RichTextInternalLinkPickerMeta = {
	categories: RichTextLinkPickerOption[];
	subcategories: RichTextLinkPickerOption[];
};

export type RichTextInternalLinkPickerRows = {
	rows: RichTextInternalLinkPickerRow[];
};

export type RichTextInternalLinkPickerResult = RichTextInternalLinkPickerMeta &
	RichTextInternalLinkPickerRows;

export type RichTextRiseopediaLinkPickerMedia = {
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type RichTextRiseopediaLinkPickerRow = {
	id: string;
	name: string;
	slug: string;
	href: string;
	entityTypeCode: string;
	entityTypeLabel: string;
	classCode: string | null;
	classLabel: string | null;
	categoryCode: string | null;
	categoryLabel: string | null;
	subcategoryCode: string | null;
	subcategoryLabel: string | null;
	iconMedia: RichTextRiseopediaLinkPickerMedia | null;
};

export type RichTextRiseopediaLinkPickerMeta = {
	entityTypes: RichTextLinkPickerOption[];
	classes: RichTextLinkPickerOption[];
	categories: RichTextLinkPickerOption[];
	subcategories: RichTextLinkPickerOption[];
};

export type RichTextRiseopediaLinkPickerRows = {
	rows: RichTextRiseopediaLinkPickerRow[];
};

export type RichTextRiseopediaLinkPickerResult =
	RichTextRiseopediaLinkPickerMeta & RichTextRiseopediaLinkPickerRows;

type JsonPayloadRow = {
	payload: unknown;
};

type RiseopediaRowDbRow = {
	entity_id: string | number;
	entity_name: string;
	entity_slug: string;
	entity_type_code: string;
	entity_type_name: string | null;
	entity_class_code: string | null;
	entity_class_name: string | null;
	entity_category_code: string | null;
	entity_category_name: string | null;
	entity_subcategory_code: string | null;
	entity_subcategory_name: string | null;
	icon_media_file_id: string | number | null;
	icon_media_width_px: number | null;
	icon_media_height_px: number | null;
	icon_media_mime_type: string | null;
};

const EXCLUDED_INTERNAL_WIKI_SLUGS = new Set(["riseopedia", "mafiosopedia"]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
	record: Record<string, unknown>,
	key: string,
): string | null {
	const value = record[key];
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function readArray(record: Record<string, unknown>, key: string): unknown[] {
	const value = record[key];
	return Array.isArray(value) ? value : [];
}

function mapOption(value: unknown): RichTextLinkPickerOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const optionValue =
		readString(value, "id") ??
		readString(value, "value") ??
		readString(value, "optionValue");
	const label = readString(value, "label") ?? readString(value, "optionLabel");
	if (!optionValue || !label) {
		return null;
	}

	const parentValue =
		readString(value, "categoryId") ??
		readString(value, "parentValue") ??
		readString(value, "parent_value");
	const slug = readString(value, "slug");

	return {
		value: optionValue,
		label,
		...(parentValue ? { parentValue } : {}),
		...(slug ? { slug } : {}),
	};
}

function mapPickerIcon(value: unknown): RichTextLinkPickerIcon | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const source = readString(value, "source");
	if (!id || (source !== "lucide" && source !== "media")) {
		return null;
	}

	const rawMedia = isRecord(value.iconMedia) ? value.iconMedia : null;
	const mediaId = rawMedia ? readString(rawMedia, "id") : null;

	return {
		id,
		key: readString(value, "key"),
		label: readString(value, "label"),
		source,
		lucideName: readString(value, "lucideName"),
		iconMedia:
			rawMedia && mediaId
				? {
						id: mediaId,
						url: readString(rawMedia, "url"),
						filename: readString(rawMedia, "filename"),
						originalFilename: readString(rawMedia, "originalFilename"),
						mimeType: readString(rawMedia, "mimeType"),
						storageRelPath: readString(rawMedia, "storageRelPath"),
						thumbnailURL: readString(rawMedia, "thumbnailURL"),
					}
				: null,
	};
}

function mapPickerIconColor(
	value: unknown,
): RichTextLinkPickerIconColor | null {
	if (!isRecord(value)) {
		return null;
	}

	return {
		preview: readString(value, "preview"),
	};
}

function mapInternalRow(value: unknown): RichTextInternalLinkPickerRow | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const categoryId = readString(value, "categoryId");
	const categoryLabel = readString(value, "categoryLabel");
	const categorySlug = readString(value, "categorySlug");
	const subcategoryId = readString(value, "subcategoryId");
	const subcategoryLabel = readString(value, "subcategoryLabel");
	const subcategorySlug = readString(value, "subcategorySlug");
	const contentKindCode = readString(value, "contentKindCode");
	const contentKindLabel = readString(value, "contentKindLabel");
	const href = readString(value, "href");

	if (
		!id ||
		!title ||
		!categoryId ||
		!categoryLabel ||
		!categorySlug ||
		!subcategoryId ||
		!subcategoryLabel ||
		!subcategorySlug ||
		!contentKindCode ||
		!contentKindLabel ||
		!href
	) {
		return null;
	}

	return {
		id,
		title,
		summary: readString(value, "summary"),
		categoryId,
		categoryLabel,
		categorySlug,
		subcategoryId,
		subcategoryLabel,
		subcategorySlug,
		contentKindCode,
		contentKindLabel,
		href,
		iconKey: mapPickerIcon(value.iconKey),
		iconColor: mapPickerIconColor(value.iconColor),
	};
}

function mapInternalMetaPayload(
	value: unknown,
): RichTextInternalLinkPickerMeta {
	if (!isRecord(value)) {
		return { categories: [], subcategories: [] };
	}

	return {
		categories: readArray(value, "categories")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
		subcategories: readArray(value, "subcategories")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
	};
}

function mapInternalRowsPayload(
	value: unknown,
): RichTextInternalLinkPickerRows {
	if (!isRecord(value)) {
		return { rows: [] };
	}

	return {
		rows: readArray(value, "rows")
			.map(mapInternalRow)
			.filter((row): row is RichTextInternalLinkPickerRow => row !== null),
	};
}

function isExcludedWikiHref(href: string): boolean {
	return /^\/info\/(?:riseopedia|mafiosopedia)(?:\/|$)/i.test(href);
}

function filterInternalMeta(
	result: RichTextInternalLinkPickerMeta,
): RichTextInternalLinkPickerMeta {
	const excludedCategoryIds = new Set(
		result.categories
			.filter((option) =>
				option.slug
					? EXCLUDED_INTERNAL_WIKI_SLUGS.has(option.slug.toLowerCase())
					: false,
			)
			.map((option) => option.value),
	);

	return {
		categories: result.categories.filter(
			(option) => !excludedCategoryIds.has(option.value),
		),
		subcategories: result.subcategories.filter(
			(option) =>
				!option.parentValue || !excludedCategoryIds.has(option.parentValue),
		),
	};
}

function filterInternalRows(
	result: RichTextInternalLinkPickerRows,
): RichTextInternalLinkPickerRows {
	return {
		rows: result.rows.filter(
			(row) =>
				!EXCLUDED_INTERNAL_WIKI_SLUGS.has(row.categorySlug.toLowerCase()) &&
				!isExcludedWikiHref(row.href),
		),
	};
}

function mapRiseopediaRow(
	row: RiseopediaRowDbRow,
): RichTextRiseopediaLinkPickerRow {
	const mediaFileId =
		row.icon_media_file_id === null ? null : String(row.icon_media_file_id);

	return {
		id: String(row.entity_id),
		name: row.entity_name,
		slug: row.entity_slug,
		href: `/info/riseopedia/entity/${row.entity_slug}`,
		entityTypeCode: row.entity_type_code,
		entityTypeLabel: row.entity_type_name ?? row.entity_type_code,
		classCode: row.entity_class_code,
		classLabel: row.entity_class_name,
		categoryCode: row.entity_category_code,
		categoryLabel: row.entity_category_name,
		subcategoryCode: row.entity_subcategory_code,
		subcategoryLabel: row.entity_subcategory_name,
		iconMedia: mediaFileId
			? {
					url: `/api/riseopedia/media/${mediaFileId}`,
					width: row.icon_media_width_px,
					height: row.icon_media_height_px,
					mimeType: row.icon_media_mime_type,
				}
			: null,
	};
}

function mapRiseopediaMetaPayload(
	value: unknown,
): RichTextRiseopediaLinkPickerMeta {
	if (!isRecord(value)) {
		return {
			entityTypes: [],
			classes: [],
			categories: [],
			subcategories: [],
		};
	}

	return {
		entityTypes: readArray(value, "entityTypes")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
		classes: readArray(value, "classes")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
		categories: readArray(value, "categories")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
		subcategories: readArray(value, "subcategories")
			.map(mapOption)
			.filter((row): row is RichTextLinkPickerOption => row !== null),
	};
}

export async function getRichTextInternalLinkPickerMeta(args: {
	actorDiscordId: string;
}): Promise<RichTextInternalLinkPickerMeta> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_richtext_internal_link_picker_meta($1) AS payload`,
		[args.actorDiscordId],
	);

	return filterInternalMeta(mapInternalMetaPayload(result.rows[0]?.payload));
}

export async function listRichTextInternalLinkPickerRows(args: {
	actorDiscordId: string;
	categoryId?: string | null;
	subcategoryId?: string | null;
	search?: string | null;
	limit?: number;
}): Promise<RichTextInternalLinkPickerRows> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_richtext_internal_link_picker_rows($1, $2, $3, $4, $5) AS payload`,
		[
			args.actorDiscordId,
			args.categoryId ?? null,
			args.subcategoryId ?? null,
			args.search?.trim() || null,
			Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 20),
		],
	);

	return filterInternalRows(mapInternalRowsPayload(result.rows[0]?.payload));
}

export async function listRichTextInternalLinkPicker(args: {
	actorDiscordId: string;
	categoryId?: string | null;
	subcategoryId?: string | null;
	search?: string | null;
	limit?: number;
}): Promise<RichTextInternalLinkPickerResult> {
	const [meta, rows] = await Promise.all([
		getRichTextInternalLinkPickerMeta({
			actorDiscordId: args.actorDiscordId,
		}),
		listRichTextInternalLinkPickerRows(args),
	]);

	return { ...meta, ...rows };
}

export async function getRichTextRiseopediaLinkPickerMeta(): Promise<RichTextRiseopediaLinkPickerMeta> {
	const result = await query<JsonPayloadRow>(
		`SELECT pg_catalog.jsonb_build_object(
			'entityTypes', COALESCE((
				SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
					'value', option_row.entity_type_code,
					'label', option_row.entity_type_label
				) ORDER BY option_row.entity_type_label,
						 option_row.entity_type_code)
				FROM (SELECT picker_row.entity_type_code,
							 COALESCE(MIN(picker_row.entity_type_name), picker_row.entity_type_code) AS entity_type_label
					  FROM web_view.riseopedia_entity_link_picker_rows picker_row
					  GROUP BY picker_row.entity_type_code) option_row
			), '[]'::jsonb),
			'classes', COALESCE((
				SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
					'value', option_row.option_value,
					'label', option_row.option_label,
					'parentValue', option_row.parent_value
				) ORDER BY option_row.option_label,
						 option_row.option_value,
						 option_row.parent_value)
				FROM (SELECT picker_row.entity_class_filter AS option_value,
							 MIN(picker_row.entity_class_name) AS option_label,
							 picker_row.entity_type_code AS parent_value
					  FROM web_view.riseopedia_entity_link_picker_rows picker_row
					  WHERE picker_row.entity_class_filter IS NOT NULL
					  GROUP BY picker_row.entity_type_code,
							   picker_row.entity_class_filter) option_row
			), '[]'::jsonb),
			'categories', COALESCE((
				SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
					'value', option_row.option_value,
					'label', option_row.option_label,
					'parentValue', option_row.parent_value
				) ORDER BY option_row.option_label,
						 option_row.option_value,
						 option_row.parent_value)
				FROM (SELECT picker_row.entity_category_filter AS option_value,
							 MIN(picker_row.entity_category_name) AS option_label,
							 picker_row.entity_class_filter AS parent_value
					  FROM web_view.riseopedia_entity_link_picker_rows picker_row
					  WHERE picker_row.entity_category_filter IS NOT NULL
					  GROUP BY picker_row.entity_class_filter,
							   picker_row.entity_category_filter) option_row
			), '[]'::jsonb),
			'subcategories', COALESCE((
				SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
					'value', option_row.option_value,
					'label', option_row.option_label,
					'parentValue', option_row.parent_value
				) ORDER BY option_row.option_label,
						 option_row.option_value,
						 option_row.parent_value)
				FROM (SELECT picker_row.entity_subcategory_filter AS option_value,
							 MIN(picker_row.entity_subcategory_name) AS option_label,
							 picker_row.entity_category_filter AS parent_value
					  FROM web_view.riseopedia_entity_link_picker_rows picker_row
					  WHERE picker_row.entity_subcategory_filter IS NOT NULL
					  GROUP BY picker_row.entity_category_filter,
							   picker_row.entity_subcategory_filter) option_row
			), '[]'::jsonb)
		) AS payload`,
	);

	return mapRiseopediaMetaPayload(result.rows[0]?.payload);
}

export async function listRichTextRiseopediaLinkPickerRows(args: {
	entityTypeCode?: string | null;
	classFilter?: string | null;
	categoryFilter?: string | null;
	subcategoryFilter?: string | null;
	search?: string | null;
	limit?: number;
}): Promise<RichTextRiseopediaLinkPickerRows> {
	const entityTypeCode = args.entityTypeCode?.trim() || null;
	const classFilter = args.classFilter?.trim().toLowerCase() || null;
	const categoryFilter = args.categoryFilter?.trim().toLowerCase() || null;
	const subcategoryFilter = args.subcategoryFilter?.trim().toLowerCase() || null;
	const search = args.search?.trim() || null;
	const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 20);

	const rows = await query<RiseopediaRowDbRow>(
		`SELECT picker_row.entity_id,
				picker_row.entity_name,
				picker_row.entity_slug,
				picker_row.entity_type_code,
				picker_row.entity_type_name,
				picker_row.entity_class_code,
				picker_row.entity_class_name,
				picker_row.entity_category_code,
				picker_row.entity_category_name,
				picker_row.entity_subcategory_code,
				picker_row.entity_subcategory_name,
				picker_row.icon_media_file_id,
				picker_row.icon_media_width_px,
				picker_row.icon_media_height_px,
				picker_row.icon_media_mime_type
		 FROM web_view.riseopedia_entity_link_picker_rows picker_row
		 CROSS JOIN LATERAL (SELECT CASE
				WHEN $5::text IS NULL THEN NULL::tsquery
				ELSE pg_catalog.websearch_to_tsquery('simple'::regconfig, $5::text)
			END AS search_query) search_value
		 WHERE ($1::text IS NULL OR picker_row.entity_type_code = $1)
		   AND ($2::text IS NULL OR picker_row.entity_class_filter = $2)
		   AND ($3::text IS NULL OR picker_row.entity_category_filter = $3)
		   AND ($4::text IS NULL OR picker_row.entity_subcategory_filter = $4)
		   AND ($5::text IS NULL
				OR picker_row.search_document @@ search_value.search_query
				OR picker_row.entity_name ILIKE '%' || $5 || '%'
				OR picker_row.entity_code ILIKE '%' || $5 || '%')
		 ORDER BY CASE
			WHEN search_value.search_query IS NULL THEN 0::real
			ELSE pg_catalog.ts_rank(picker_row.search_document, search_value.search_query)
		 END DESC,
		 picker_row.entity_name,
		 picker_row.entity_type_code,
		 picker_row.entity_id
		 LIMIT $6`,
		[
			entityTypeCode,
			classFilter,
			categoryFilter,
			subcategoryFilter,
			search,
			limit,
		],
	);

	return {
		rows: rows.rows.map(mapRiseopediaRow),
	};
}

export async function listRichTextRiseopediaLinkPicker(args: {
	entityTypeCode?: string | null;
	classFilter?: string | null;
	categoryFilter?: string | null;
	subcategoryFilter?: string | null;
	search?: string | null;
	limit?: number;
}): Promise<RichTextRiseopediaLinkPickerResult> {
	const [meta, rows] = await Promise.all([
		getRichTextRiseopediaLinkPickerMeta(),
		listRichTextRiseopediaLinkPickerRows(args),
	]);

	return { ...meta, ...rows };
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
