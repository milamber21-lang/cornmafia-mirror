//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/content.ts                                                                       ////
//// Language: TS                                                                                                  ////
//// DB-first admin content read helpers, placement metadata loaders, and mutation callers                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { pg, query } from "@/lib/data/pg";
import type { QueryResult, QueryResultRow } from "pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";
import type { ExtractedContentMediaReference } from "@/lib/helpers/content-media-references";
import {
	isContentSystemFieldListCode,
	resolveContentSystemFieldValue,
} from "@/lib/helpers/content-system-fields";
import type {
	ContentFieldLabelPositionCode,
	ContentFieldLabelSeparatorCode,
	ContentFieldLabelStyleCode,
	ContentFieldLayoutAlignCode,
	ContentFieldLayoutWidthCode,
	ContentFieldRenderDestinationCode,
	ContentExternalLinkDbInput,
	ContentFieldValueDbInput,
	ContentTemplateFieldDefinition,
} from "@/lib/helpers/content-field-values";

export type ContentStatusCode = "draft" | "published" | "archived";
export type ContentPolicyCode =
	| "inherit"
	| "public"
	| "rank_at_least"
	| "rank_equal";
export type ContentNavModeCode =
	| "inherit"
	| "explicit_visible"
	| "explicit_hidden";
export type ContentIconModeCode = "template_default" | "explicit";
export type ContentAdminSortBy =
	| "title"
	| "slug"
	| "kind"
	| "category"
	| "subcategory"
	| "template";
export type ContentAdminSortDir = "asc" | "desc";

type ContentReadPolicyDbCode = "inherit" | "public" | "min_rank" | "equal_rank";
type ContentWritePolicyDbCode = "inherit" | "min_rank" | "equal_rank";
type ContentEffectiveReadPolicyDbCode = "public" | "min_rank" | "equal_rank";
type ContentEffectiveWritePolicyDbCode = "min_rank" | "equal_rank";
type ContentNavModeDbCode = "inherit" | "explicit";

export type ContentAdminItem = {
	id: string;
	templateId: string;
	templateCode: string;
	templateLabel: string;
	contentKindCode: string;
	contentKindLabel: string;
	publicRoutePrefix: string | null;
	rendererCode: string;
	surfaceScopeCode: string;
	allowsSeries: boolean;
	templateSchemaVersionNo: number;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string | null;
	subcategoryTitle: string | null;
	subcategorySlug: string | null;
	seriesId: string | null;
	seriesTitle: string | null;
	seriesSlug: string | null;
	seriesPartNo: number | null;
	authorDiscordId: string | null;
	authorUsername: string | null;
	statusCode: ContentStatusCode;
	publishedAt: string | null;
	archivedAt: string | null;
	readPolicyCode: ContentPolicyCode;
	readRank: number | null;
	readEffectivePolicyCode: Exclude<ContentPolicyCode, "inherit">;
	readEffectiveRank: number | null;
	writePolicyCode: Exclude<ContentPolicyCode, "public">;
	writeRank: number | null;
	writeEffectivePolicyCode: "rank_at_least" | "rank_equal";
	writeEffectiveRank: number | null;
	navHiddenModeCode: ContentNavModeCode;
	navHidden: boolean | null;
	navHiddenEffective: boolean;
	iconModeCode: ContentIconModeCode;
	iconKeyId: string | null;
	iconKeyKey: string | null;
	iconKeyLabel: string | null;
	iconKeySourceCode: string | null;
	iconKeyLucideName: string | null;
	iconMediaId: string | null;
	iconMediaUrl: string | null;
	iconColorModeCode: ContentIconModeCode;
	iconColorId: string | null;
	iconColorKey: string | null;
	iconColorLabel: string | null;
	iconColorPreview: string | null;
	createdByDiscordId: string | null;
	createdAt: string;
	updatedByDiscordId: string | null;
	updatedAt: string;
};

export type ContentAdminDetail = ContentAdminItem & {
	fieldValues: Record<string, unknown>;
};

export type ContentAdminListPage = {
	rows: ContentAdminItem[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

export type ContentCategoryOption = {
	id: string;
	title: string;
	slug: string;
};

export type ContentSubcategoryOption = {
	id: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	title: string;
	slug: string;
};

export type ContentTemplateOption = {
	id: string;
	code: string;
	key: string;
	label: string;
	contentKindCode: string;
	contentKindLabel: string;
	publicRoutePrefix: string | null;
	rendererCode: string;
	surfaceScopeCode: string;
	allowsSeries: boolean;
};

export type ContentTemplateFieldOption = {
	id: string;
	fieldListId: string;
	fieldListCode: string;
	optionKey: string;
	label: string;
	displayOrder: number;
};

export type ContentTemplateField = ContentTemplateFieldDefinition & {
	id: string;
	templateId: string;
	templateCode: string;
	templateLabel: string;
	contentKindCode: string;
	surfaceScopeCode: string;
	allowsSeries: boolean;
	fieldListId: string;
	fieldListCode: string;
	label: string;
	helpText: string | null;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	renderDestinationCode: ContentFieldRenderDestinationCode;
	layoutWidthCode: ContentFieldLayoutWidthCode;
	layoutAlignCode: ContentFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: ContentFieldLabelStyleCode;
	labelPositionCode: ContentFieldLabelPositionCode;
	labelSeparatorCode: ContentFieldLabelSeparatorCode;
	valueColumnName: string;
	displayOrder: number;
	isRequired: boolean;
	isEnabled: boolean;
	optionCount: number;
	fieldToolCodes: string[];
};

export type ContentSeriesOption = {
	id: string;
	title: string;
	slug: string;
	categoryId: string;
	subcategoryId: string | null;
	nextPartNo: number;
};

export type ContentMediaOption = {
	id: string;
	label: string;
	originalFilename: string;
	altText: string | null;
	url: string | null;
	mimeType: string | null;
	sizeBytes: number | null;
	width: number | null;
	height: number | null;
	categoryId: string | null;
	subcategoryId: string | null;
};

export type ContentReferencePreview = {
	id: string;
	title: string;
	href: string;
	statusCode: ContentStatusCode;
};

export type ContentAdminPreviewField = ContentTemplateField & {
	value: unknown;
	optionLabel: string | null;
	media: ContentMediaOption | null;
	contentLink: ContentReferencePreview | null;
};

export type ContentAdminPreview = {
	doc: ContentAdminDetail;
	fields: ContentAdminPreviewField[];
	fieldsByDestination: Record<
		ContentFieldRenderDestinationCode,
		ContentAdminPreviewField[]
	>;
};

const CONTENT_FIELD_RENDER_DESTINATIONS: ContentFieldRenderDestinationCode[] = [
	"seo",
	"hero",
	"top",
	"left",
	"main",
	"right",
	"bottom",
	"hidden",
];

type CountRow = {
	total_count: string | number;
};

type ContentAdminDbRow = {
	content_id: number | string;
	template_id: number | string;
	template_code: string;
	template_label: string;
	content_kind_code: string;
	content_kind_label: string;
	public_route_prefix: string | null;
	renderer_code: string;
	surface_scope_code: string;
	allows_series: boolean;
	template_schema_version_no: number;
	title: string;
	slug: string;
	summary: string | null;
	category_id: number | string;
	category_title: string;
	category_slug: string;
	subcategory_id: number | string | null;
	subcategory_title: string | null;
	subcategory_slug: string | null;
	series_id: number | string | null;
	series_title: string | null;
	series_slug: string | null;
	series_part_no: number | null;
	author_discord_id: string | null;
	author_username: string | null;
	status_code: ContentStatusCode;
	published_dt: string | Date | null;
	archived_dt: string | Date | null;
	read_policy_code: ContentReadPolicyDbCode;
	read_rank: number | null;
	read_effective_policy_code: ContentEffectiveReadPolicyDbCode;
	read_effective_rank: number | null;
	write_policy_code: ContentWritePolicyDbCode;
	write_rank: number | null;
	write_effective_policy_code: ContentEffectiveWritePolicyDbCode;
	write_effective_rank: number | null;
	nav_hidden_mode_code: ContentNavModeDbCode;
	nav_hidden: boolean | null;
	nav_hidden_effective: boolean;
	icon_mode_code: ContentIconModeCode;
	icon_key_id: number | string | null;
	icon_key_key: string | null;
	icon_key_label: string | null;
	icon_key_source_code: string | null;
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
	icon_media_filename: string | null;
	icon_media_original_filename: string | null;
	icon_media_mime_type: string | null;
	icon_color_mode_code: ContentIconModeCode;
	icon_color_id: number | string | null;
	icon_color_key: string | null;
	icon_color_label: string | null;
	icon_color_preview: string | null;
	created_by_discord_id: string | null;
	created_dt: string | Date;
	updated_by_discord_id: string | null;
	updated_dt: string | Date;
};

type ContentCategoryDbRow = {
	category_id: number | string;
	title: string;
	slug: string;
};

type ContentSubcategoryDbRow = {
	subcategory_id: number | string;
	category_id: number | string;
	category_title: string;
	category_slug: string;
	title: string;
	slug: string;
};

type ContentTemplateDbRow = {
	template_id: number | string;
	template_code: string;
	template_key: string;
	label: string;
	content_kind_code: string;
	content_kind_label: string;
	public_route_prefix: string | null;
	renderer_code: string;
	surface_scope_code: string;
	allows_series: boolean;
	is_enabled: boolean;
};

type ContentTemplateFieldDbRow = {
	template_field_id: number | string;
	template_id: number | string;
	template_code: string;
	template_label: string;
	content_kind_code: string;
	surface_scope_code: string;
	allows_series: boolean;
	field_list_id: number | string;
	field_list_code: string;
	label: string;
	help_text: string | null;
	field_type_code: string;
	field_type_label: string;
	render_destination_code: ContentFieldRenderDestinationCode;
	layout_width_code: ContentFieldLayoutWidthCode;
	layout_align_code: ContentFieldLayoutAlignCode;
	show_label_flag: boolean;
	label_style_code: ContentFieldLabelStyleCode;
	label_position_code: ContentFieldLabelPositionCode;
	label_separator_code: ContentFieldLabelSeparatorCode;
	value_column_name: string;
	display_order: number;
	is_required: boolean;
	is_enabled: boolean;
	option_count: number | string;
};

type ContentTemplateFieldOptionDbRow = {
	field_option_id: number | string;
	field_list_id: number | string;
	field_list_code: string;
	option_key: string;
	label: string;
	display_order: number;
	is_enabled: boolean;
};

type ContentTemplateFieldToolLookupDbRow = {
	field_list_id: number | string;
	field_tool_code: string;
	display_order: number;
};

type ContentFieldValueDbRow = {
	template_field_id: number | string;
	value_column_name: string;
	value_text: string | null;
	value_long_text: string | null;
	value_integer: number | null;
	value_numeric: string | number | null;
	value_boolean: boolean | null;
	value_date: string | Date | null;
	value_timestamp: string | Date | null;
	value_discord_id: string | null;
	value_media_id: number | string | null;
	value_content_id: number | string | null;
	value_option_key: string | null;
	value_rich_text_json: unknown;
};

type ContentSeriesDbRow = {
	series_id: number | string;
	title: string;
	slug: string;
	category_id: number | string;
	subcategory_id: number | string | null;
	next_part_no: number | string | null;
};

type ContentMediaDbRow = {
	media_id: number | string;
	original_filename: string;
	filename: string;
	storage_rel_path: string | null;
	mime_type: string | null;
	size_bytes: number | string | null;
	width_px: number | null;
	height_px: number | null;
	alt_text: string | null;
	category_id: number | string | null;
	subcategory_id: number | string | null;
};

type ContentReferenceDbRow = {
	content_id: number | string;
	title: string;
	slug: string;
	status_code: ContentStatusCode;
	category_slug: string;
	subcategory_slug: string | null;
	public_route_prefix: string | null;
};

type ContentMediaPathDbRow = {
	media_id: number | string;
	storage_rel_path: string;
};

type ContentMediaReferenceDbInput = {
	media_id: number;
	usage_code: string;
	display_order: number;
	caption: string | null;
};

type DbExecutor = {
	query<Row extends QueryResultRow>(
		text: string,
		params?: unknown[],
	): Promise<QueryResult<Row>>;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

function toNullableIsoString(value: string | Date | null): string | null {
	return value === null ? null : toIsoString(value);
}

function mapReadPolicyCode(
	value: ContentEffectiveReadPolicyDbCode,
): Exclude<ContentPolicyCode, "inherit"> {
	if (value === "equal_rank") {
		return "rank_equal";
	}

	if (value === "min_rank") {
		return "rank_at_least";
	}

	return "public";
}

function mapWritePolicyCode(
	value: ContentEffectiveWritePolicyDbCode,
): "rank_at_least" | "rank_equal" {
	return value === "equal_rank" ? "rank_equal" : "rank_at_least";
}

function mapExplicitReadPolicyCode(
	value: ContentReadPolicyDbCode,
): ContentPolicyCode {
	if (value === "inherit") {
		return "inherit";
	}

	return mapReadPolicyCode(value);
}

function mapExplicitWritePolicyCode(
	value: ContentWritePolicyDbCode,
): Exclude<ContentPolicyCode, "public"> {
	if (value === "inherit") {
		return "inherit";
	}

	return mapWritePolicyCode(value);
}

function mapNavModeCode(
	modeCode: ContentNavModeDbCode,
	navHidden: boolean | null,
): ContentNavModeCode {
	if (modeCode === "inherit") {
		return "inherit";
	}

	return navHidden === true ? "explicit_hidden" : "explicit_visible";
}

function toReadPolicyDbCode(value: ContentPolicyCode): ContentReadPolicyDbCode {
	if (value === "rank_equal") {
		return "equal_rank";
	}

	if (value === "rank_at_least") {
		return "min_rank";
	}

	return value;
}

function toWritePolicyDbCode(
	value: ContentPolicyCode,
): ContentWritePolicyDbCode {
	return value === "rank_equal"
		? "equal_rank"
		: value === "rank_at_least"
			? "min_rank"
			: "inherit";
}

function toNavModeDbCode(value: ContentNavModeCode): ContentNavModeDbCode {
	return value === "inherit" ? "inherit" : "explicit";
}

function mapContentRow(row: ContentAdminDbRow): ContentAdminItem {
	const iconStorageRelPath = row.icon_media_storage_rel_path ?? null;

	return {
		id: String(row.content_id),
		templateId: String(row.template_id),
		templateCode: row.template_code,
		templateLabel: row.template_label,
		contentKindCode: row.content_kind_code,
		contentKindLabel: row.content_kind_label,
		publicRoutePrefix: row.public_route_prefix,
		rendererCode: row.renderer_code,
		surfaceScopeCode: row.surface_scope_code,
		allowsSeries: row.allows_series,
		templateSchemaVersionNo: row.template_schema_version_no,
		title: row.title,
		slug: row.slug,
		summary: row.summary,
		categoryId: String(row.category_id),
		categoryTitle: row.category_title,
		categorySlug: row.category_slug,
		subcategoryId:
			row.subcategory_id === null ? null : String(row.subcategory_id),
		subcategoryTitle: row.subcategory_title,
		subcategorySlug: row.subcategory_slug,
		seriesId: row.series_id === null ? null : String(row.series_id),
		seriesTitle: row.series_title,
		seriesSlug: row.series_slug,
		seriesPartNo: row.series_part_no,
		authorDiscordId: row.author_discord_id,
		authorUsername: row.author_username,
		statusCode: row.status_code,
		publishedAt: toNullableIsoString(row.published_dt),
		archivedAt: toNullableIsoString(row.archived_dt),
		readPolicyCode: mapExplicitReadPolicyCode(row.read_policy_code),
		readRank: row.read_rank,
		readEffectivePolicyCode: mapReadPolicyCode(row.read_effective_policy_code),
		readEffectiveRank: row.read_effective_rank,
		writePolicyCode: mapExplicitWritePolicyCode(row.write_policy_code),
		writeRank: row.write_rank,
		writeEffectivePolicyCode: mapWritePolicyCode(row.write_effective_policy_code),
		writeEffectiveRank: row.write_effective_rank,
		navHiddenModeCode: mapNavModeCode(row.nav_hidden_mode_code, row.nav_hidden),
		navHidden: row.nav_hidden,
		navHiddenEffective: row.nav_hidden_effective,
		iconModeCode: row.icon_mode_code,
		iconKeyId: row.icon_key_id === null ? null : String(row.icon_key_id),
		iconKeyKey: row.icon_key_key,
		iconKeyLabel: row.icon_key_label,
		iconKeySourceCode: row.icon_key_source_code,
		iconKeyLucideName: row.icon_key_lucide_name,
		iconMediaId: row.icon_media_id === null ? null : String(row.icon_media_id),
		iconMediaUrl: iconStorageRelPath
			? buildAdminMediaFileUrl(iconStorageRelPath)
			: null,
		iconColorModeCode: row.icon_color_mode_code,
		iconColorId: row.icon_color_id === null ? null : String(row.icon_color_id),
		iconColorKey: row.icon_color_key,
		iconColorLabel: row.icon_color_label,
		iconColorPreview: row.icon_color_preview,
		createdByDiscordId: row.created_by_discord_id,
		createdAt: toIsoString(row.created_dt),
		updatedByDiscordId: row.updated_by_discord_id,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldValue(row: ContentFieldValueDbRow): unknown {
	switch (row.value_column_name) {
		case "value_text":
			return row.value_text;
		case "value_long_text":
			return row.value_long_text;
		case "value_integer":
			return row.value_integer;
		case "value_numeric":
			return row.value_numeric === null ? null : Number(row.value_numeric);
		case "value_boolean":
			return row.value_boolean;
		case "value_date":
			return toNullableIsoString(row.value_date);
		case "value_timestamp":
			return toNullableIsoString(row.value_timestamp);
		case "value_discord_id":
			return row.value_discord_id;
		case "value_media_id":
			return row.value_media_id === null ? null : String(row.value_media_id);
		case "value_content_id":
			return row.value_content_id === null ? null : String(row.value_content_id);
		case "value_option_key":
			return row.value_option_key;
		case "value_rich_text_json":
			return row.value_rich_text_json;
		default:
			return null;
	}
}

function mapTemplateRow(row: ContentTemplateDbRow): ContentTemplateOption {
	return {
		id: String(row.template_id),
		code: row.template_code,
		key: row.template_key,
		label: row.label,
		contentKindCode: row.content_kind_code,
		contentKindLabel: row.content_kind_label,
		publicRoutePrefix: row.public_route_prefix,
		rendererCode: row.renderer_code,
		surfaceScopeCode: row.surface_scope_code,
		allowsSeries: row.allows_series,
	};
}

function mapTemplateFieldRow(
	row: ContentTemplateFieldDbRow,
	fieldToolCodes: string[] = [],
): ContentTemplateField {
	return {
		id: String(row.template_field_id),
		templateFieldId: Number(row.template_field_id),
		templateId: String(row.template_id),
		templateCode: row.template_code,
		templateLabel: row.template_label,
		contentKindCode: row.content_kind_code,
		surfaceScopeCode: row.surface_scope_code,
		allowsSeries: row.allows_series,
		fieldListId: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		label: row.label,
		helpText: row.help_text,
		fieldTypeCode: row.field_type_code,
		fieldTypeLabel: row.field_type_label,
		renderDestinationCode: row.render_destination_code,
		layoutWidthCode: row.layout_width_code,
		layoutAlignCode: row.layout_align_code,
		showLabel: row.show_label_flag,
		labelStyleCode: row.label_style_code,
		labelPositionCode: row.label_position_code,
		labelSeparatorCode: row.label_separator_code,
		valueColumnName: row.value_column_name,
		displayOrder: row.display_order,
		isRequired: row.is_required,
		isEnabled: row.is_enabled,
		optionCount: Number(row.option_count ?? 0),
		fieldToolCodes,
	};
}

function mapTemplateFieldOptionRow(
	row: ContentTemplateFieldOptionDbRow,
): ContentTemplateFieldOption {
	return {
		id: String(row.field_option_id),
		fieldListId: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		optionKey: row.option_key,
		label: row.label,
		displayOrder: row.display_order,
	};
}

async function listContentTemplateFieldToolCodesByFieldListIds(
	fieldListIds: string[],
): Promise<Map<string, string[]>> {
	if (fieldListIds.length === 0) {
		return new Map<string, string[]>();
	}

	const result = await query<ContentTemplateFieldToolLookupDbRow>(
		`
			SELECT
				field_list_id,
				field_tool_code,
				display_order
			FROM web_view.web_template_field_list_tools_lookup
			WHERE field_list_id = ANY($1::bigint[])
			ORDER BY field_list_id ASC, display_order ASC, field_tool_code ASC
		`,
		[fieldListIds],
	);

	const rowsByFieldListId = new Map<string, string[]>();
	for (const row of result.rows) {
		const fieldListId = String(row.field_list_id);
		const fieldToolCodes = rowsByFieldListId.get(fieldListId) ?? [];
		fieldToolCodes.push(row.field_tool_code);
		rowsByFieldListId.set(fieldListId, fieldToolCodes);
	}

	return rowsByFieldListId;
}

function uniqueFieldListIds(rows: ContentTemplateFieldDbRow[]): string[] {
	return Array.from(new Set(rows.map((row) => String(row.field_list_id))));
}

function mapTemplateFieldRowsWithTools(
	rows: ContentTemplateFieldDbRow[],
	fieldToolCodesByFieldListId: Map<string, string[]>,
): ContentTemplateField[] {
	return rows.map((row) =>
		mapTemplateFieldRow(
			row,
			fieldToolCodesByFieldListId.get(String(row.field_list_id)) ?? [],
		),
	);
}

function mapNullableNumber(value: number | string | null): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function mapPositiveNumber(value: number | string | null): number {
	const mapped = mapNullableNumber(value);

	return mapped !== null && mapped >= 1 ? Math.trunc(mapped) : 1;
}

function mapMediaOptionRow(row: ContentMediaDbRow): ContentMediaOption {
	return {
		id: String(row.media_id),
		label: row.alt_text?.trim()
			? `${row.original_filename} - ${row.alt_text}`
			: row.original_filename,
		originalFilename: row.original_filename,
		altText: row.alt_text,
		url: row.storage_rel_path
			? buildAdminMediaFileUrl(row.storage_rel_path)
			: null,
		mimeType: row.mime_type,
		sizeBytes: mapNullableNumber(row.size_bytes),
		width: row.width_px,
		height: row.height_px,
		categoryId: row.category_id === null ? null : String(row.category_id),
		subcategoryId:
			row.subcategory_id === null ? null : String(row.subcategory_id),
	};
}

function buildContentReferenceHref(row: ContentReferenceDbRow): string {
	if (row.status_code !== "published" || !row.subcategory_slug) {
		return `/admin/web/content/${String(row.content_id)}/show`;
	}

	const routeParts = [
		row.public_route_prefix,
		row.category_slug,
		row.subcategory_slug,
		row.slug,
	].filter(
		(part): part is string => typeof part === "string" && part.length > 0,
	);

	return `/${routeParts.join("/")}`;
}

function mapContentReferenceRow(
	row: ContentReferenceDbRow,
): ContentReferencePreview {
	return {
		id: String(row.content_id),
		title: row.title,
		href: buildContentReferenceHref(row),
		statusCode: row.status_code,
	};
}

async function listContentReferencesByIds(
	contentIds: number[],
): Promise<ContentReferencePreview[]> {
	const normalizedContentIds = Array.from(
		new Set(
			contentIds.filter(
				(contentId) => Number.isInteger(contentId) && contentId > 0,
			),
		),
	);

	if (normalizedContentIds.length === 0) {
		return [];
	}

	const result = await query<ContentReferenceDbRow>(
		`
			SELECT content_row.content_id,
				   content_row.title,
				   content_row.slug,
				   content_row.status_code,
				   content_row.category_slug,
				   content_row.subcategory_slug,
				   kind_row.public_route_prefix
			FROM web_view.web_content_lookup content_row
			JOIN web_view.web_content_kind_lookup kind_row
				ON kind_row.content_kind_code = content_row.content_kind_code
			WHERE content_row.content_id = ANY($1::bigint[])
			ORDER BY content_row.title ASC,
					 content_row.content_id ASC
		`,
		[normalizedContentIds],
	);

	return result.rows.map(mapContentReferenceRow);
}

function createPreviewFieldBuckets(): Record<
	ContentFieldRenderDestinationCode,
	ContentAdminPreviewField[]
> {
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

function parsePositiveIntegerValue(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

const CONTENT_ADMIN_SELECT = `
	SELECT
		content_id,
		template_id,
		template_code,
		template_label,
		content_kind_code,
		content_kind_label,
		public_route_prefix,
		renderer_code,
		surface_scope_code,
		allows_series,
		template_schema_version_no,
		title,
		slug,
		summary,
		category_id,
		category_title,
		category_slug,
		subcategory_id,
		subcategory_title,
		subcategory_slug,
		series_id,
		series_title,
		series_slug,
		series_part_no,
		author_discord_id,
		author_username,
		status_code,
		published_dt,
		archived_dt,
		read_policy_code,
		read_rank,
		read_effective_policy_code,
		read_effective_rank,
		write_policy_code,
		write_rank,
		write_effective_policy_code,
		write_effective_rank,
		nav_hidden_mode_code,
		nav_hidden,
		nav_hidden_effective,
		icon_mode_code,
		icon_key_id,
		icon_key_key,
		icon_key_label,
		icon_key_source_code,
		icon_key_lucide_name,
		icon_media_id,
		icon_media_storage_rel_path,
		icon_media_filename,
		icon_media_original_filename,
		icon_media_mime_type,
		icon_color_mode_code,
		icon_color_id,
		icon_color_key,
		icon_color_label,
		icon_color_preview,
		created_by_discord_id,
		created_dt,
		updated_by_discord_id,
		updated_dt
	FROM web_view.web_content_admin
`;

const CONTENT_ADMIN_SEARCH_WHERE = `
	WHERE (
		$1 = ''
		OR title ILIKE '%' || $1 || '%'
		OR slug ILIKE '%' || $1 || '%'
		OR COALESCE(summary, '') ILIKE '%' || $1 || '%'
		OR category_title ILIKE '%' || $1 || '%'
		OR COALESCE(subcategory_title, '') ILIKE '%' || $1 || '%'
		OR template_label ILIKE '%' || $1 || '%'
	)
	AND ($2::bigint IS NULL OR category_id = $2)
	AND ($3::bigint IS NULL OR subcategory_id = $3)
`;

function normalizeContentAdminSortDir(
	sortDir: ContentAdminSortDir | undefined,
): ContentAdminSortDir {
	return sortDir === "desc" ? "desc" : "asc";
}

function buildContentAdminOrderBy(
	sortBy: ContentAdminSortBy | undefined,
	sortDir: ContentAdminSortDir | undefined,
): string {
	const direction = normalizeContentAdminSortDir(sortDir).toUpperCase();
	const nulls = direction === "ASC" ? "NULLS LAST" : "NULLS FIRST";

	switch (sortBy) {
		case "slug":
			return `ORDER BY slug ${direction}, title ${direction}, content_id ASC`;
		case "kind":
			return `ORDER BY content_kind_label ${direction}, title ${direction}, content_id ASC`;
		case "category":
			return `ORDER BY category_title ${direction}, title ${direction}, content_id ASC`;
		case "subcategory":
			return `ORDER BY subcategory_title ${direction} ${nulls}, title ${direction}, content_id ASC`;
		case "template":
			return `ORDER BY template_label ${direction}, title ${direction}, content_id ASC`;
		case "title":
		default:
			return `ORDER BY title ${direction}, content_id ASC`;
	}
}

export async function listContentAdminPage(args: {
	search?: string;
	page?: number;
	pageSize?: number;
	categoryId?: number | null;
	subcategoryId?: number | null;
	sortBy?: ContentAdminSortBy;
	sortDir?: ContentAdminSortDir;
}): Promise<ContentAdminListPage> {
	const normalizedSearch = (args.search ?? "").trim();
	const page = Number.isFinite(args.page)
		? Math.max(1, Math.floor(args.page ?? 1))
		: 1;
	const pageSize = Number.isFinite(args.pageSize)
		? Math.min(Math.max(Math.floor(args.pageSize ?? 20), 1), 100)
		: 20;
	const categoryId = args.categoryId ?? null;
	const subcategoryId = args.subcategoryId ?? null;
	const offset = (page - 1) * pageSize;
	const orderBy = buildContentAdminOrderBy(args.sortBy, args.sortDir);

	const [countResult, rowsResult] = await Promise.all([
		query<CountRow>(
			`
				SELECT COUNT(*)::bigint AS total_count
				FROM web_view.web_content_admin
				${CONTENT_ADMIN_SEARCH_WHERE}
			`,
			[normalizedSearch, categoryId, subcategoryId],
		),
		query<ContentAdminDbRow>(
			`
				${CONTENT_ADMIN_SELECT}
				${CONTENT_ADMIN_SEARCH_WHERE}
				${orderBy}
				LIMIT $4 OFFSET $5
			`,
			[normalizedSearch, categoryId, subcategoryId, pageSize, offset],
		),
	]);

	const totalDocs = Number(countResult.rows[0]?.total_count ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 1;

	return {
		rows: rowsResult.rows.map(mapContentRow),
		page,
		pageSize,
		totalDocs,
		totalPages,
	};
}

export async function findContentAdminById(
	contentId: number,
): Promise<ContentAdminItem | null> {
	const result = await query<ContentAdminDbRow>(
		`
			${CONTENT_ADMIN_SELECT}
			WHERE content_id = $1
			LIMIT 1
		`,
		[contentId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapContentRow(row) : null;
}

export async function findContentAdminDetailById(
	contentId: number,
): Promise<ContentAdminDetail | null> {
	const doc = await findContentAdminById(contentId);
	if (!doc) {
		return null;
	}

	const valuesResult = await query<ContentFieldValueDbRow>(
		`
			SELECT
				template_field_id,
				value_column_name,
				value_text,
				value_long_text,
				value_integer,
				value_numeric,
				value_boolean,
				value_date,
				value_timestamp,
				value_discord_id,
				value_media_id,
				value_content_id,
				value_option_key,
				value_rich_text_json
			FROM web_view.web_content_field_values_admin
			WHERE content_id = $1
			ORDER BY template_field_id ASC, value_seq_no ASC
		`,
		[contentId],
	);

	const fieldValues: Record<string, unknown> = {};
	for (const row of valuesResult.rows) {
		fieldValues[String(row.template_field_id)] = mapFieldValue(row);
	}

	return { ...doc, fieldValues };
}

export async function listContentCategories(): Promise<
	ContentCategoryOption[]
> {
	const result = await query<ContentCategoryDbRow>(
		`
			SELECT
				category_id,
				title,
				slug
			FROM web_view.web_categories_lookup
			ORDER BY title ASC, category_id ASC
		`,
	);

	return result.rows.map((row) => ({
		id: String(row.category_id),
		title: row.title,
		slug: row.slug,
	}));
}

export async function listContentSubcategories(): Promise<
	ContentSubcategoryOption[]
> {
	const result = await query<ContentSubcategoryDbRow>(
		`
			SELECT
				subcategory_id,
				category_id,
				category_title,
				category_slug,
				title,
				slug
			FROM web_view.web_subcategories_lookup
			ORDER BY category_title ASC, title ASC, subcategory_id ASC
		`,
	);

	return result.rows.map((row) => ({
		id: String(row.subcategory_id),
		categoryId: String(row.category_id),
		categoryTitle: row.category_title,
		categorySlug: row.category_slug,
		title: row.title,
		slug: row.slug,
	}));
}

export async function listContentTemplatesForPlacement(args: {
	categoryId: number;
	subcategoryId?: number | null;
	surfaceScopeCode?: string | null;
	currentTemplateId?: number | null;
}): Promise<ContentTemplateOption[]> {
	const surfaceScopeCode = (args.surfaceScopeCode ?? "admin")
		.trim()
		.toLowerCase();
	const currentTemplateId = args.currentTemplateId ?? null;
	const surfaceScopeCodes =
		surfaceScopeCode === "admin"
			? ["admin", "public"]
			: surfaceScopeCode
				? [surfaceScopeCode]
				: [];

	if (surfaceScopeCodes.length === 0) {
		return [];
	}

	const result = await query<ContentTemplateDbRow>(
		`
			SELECT DISTINCT
				t.template_id,
				t.template_code,
				t.template_key,
				t.label,
				t.content_kind_code,
				t.content_kind_label,
				ck.public_route_prefix,
				ck.renderer_code,
				t.surface_scope_code,
				t.allows_series,
				t.is_enabled
			FROM web_view.web_templates_admin t
			JOIN web_view.web_content_kind_lookup ck
				ON ck.content_kind_code = t.content_kind_code
			WHERE t.surface_scope_code = ANY($3::text[])
			  AND (
				(
					t.is_enabled = true
					AND (
						EXISTS (
							SELECT 1
							FROM web_view.web_category_template_admin r
							WHERE r.category_id = $1
							  AND r.template_id = t.template_id
							  AND r.is_enabled = true
						)
						OR (
							$2::bigint IS NOT NULL
							AND EXISTS (
								SELECT 1
								FROM web_view.web_subcategory_template_admin sr
								WHERE sr.subcategory_id = $2
								  AND sr.template_id = t.template_id
								  AND sr.is_enabled = true
							)
						)
					)
				)
				OR ($4::bigint IS NOT NULL AND t.template_id = $4)
			  )
			ORDER BY t.label ASC, t.template_id ASC
		`,
		[
			args.categoryId,
			args.subcategoryId ?? null,
			surfaceScopeCodes,
			currentTemplateId,
		],
	);

	return result.rows.map(mapTemplateRow);
}

export async function listContentTemplateFields(
	templateId: number,
): Promise<ContentTemplateField[]> {
	const result = await query<ContentTemplateFieldDbRow>(
		`
			SELECT
				template_field_id,
				template_id,
				template_code,
				template_label,
				content_kind_code,
				surface_scope_code,
				allows_series,
				field_list_id,
				field_list_code,
				label,
				help_text,
				field_type_code,
				field_type_label,
				render_destination_code,
				layout_width_code,
				layout_align_code,
				show_label_flag,
				label_style_code,
				label_position_code,
				label_separator_code,
				value_column_name,
				display_order,
				is_required,
				is_enabled,
				option_count
			FROM web_view.web_content_template_fields_lookup
			WHERE template_id = $1
			ORDER BY display_order ASC, template_field_id ASC
		`,
		[templateId],
	);

	const fieldToolCodesByFieldListId =
		await listContentTemplateFieldToolCodesByFieldListIds(
			uniqueFieldListIds(result.rows),
		);

	return mapTemplateFieldRowsWithTools(result.rows, fieldToolCodesByFieldListId);
}

export async function listContentTemplateFieldsForContent(args: {
	contentId: number;
	templateId: number;
}): Promise<ContentTemplateField[]> {
	const result = await query<ContentTemplateFieldDbRow>(
		`
			SELECT
				template_field_id,
				template_id,
				template_code,
				template_label,
				content_kind_code,
				surface_scope_code,
				allows_series,
				field_list_id,
				field_list_code,
				label,
				help_text,
				field_type_code,
				field_type_label,
				render_destination_code,
				layout_width_code,
				layout_align_code,
				show_label_flag,
				label_style_code,
				label_position_code,
				label_separator_code,
				value_column_name,
				display_order,
				is_required,
				is_enabled,
				option_count
			FROM web_view.web_content_template_fields_lookup
			WHERE template_id = $2

			UNION ALL

			SELECT DISTINCT
				v.template_field_id,
				v.template_id,
				v.template_code,
				c.template_label,
				c.content_kind_code,
				c.surface_scope_code,
				c.allows_series,
				v.field_list_id,
				v.field_list_code,
				v.field_label AS label,
				NULL::text AS help_text,
				v.field_type_code,
				v.field_type_code AS field_type_label,
				v.render_destination_code,
				v.layout_width_code,
				v.layout_align_code,
				v.show_label_flag,
				v.label_style_code,
				v.label_position_code,
				v.label_separator_code,
				v.value_column_name,
				100000 AS display_order,
				false AS is_required,
				false AS is_enabled,
				(
					SELECT count(*)
					FROM web_view.web_template_field_options_lookup o
					WHERE o.field_list_id = v.field_list_id
				) AS option_count
			FROM web_view.web_content_field_values_admin v
			JOIN web_view.web_content_admin c ON c.content_id = v.content_id
			WHERE v.content_id = $1
			  AND v.template_id = $2
			  AND NOT EXISTS (
				SELECT 1
				FROM web_view.web_content_template_fields_lookup f
				WHERE f.template_field_id = v.template_field_id
			  )
			ORDER BY display_order ASC, template_field_id ASC
		`,
		[args.contentId, args.templateId],
	);

	const fieldToolCodesByFieldListId =
		await listContentTemplateFieldToolCodesByFieldListIds(
			uniqueFieldListIds(result.rows),
		);

	return mapTemplateFieldRowsWithTools(result.rows, fieldToolCodesByFieldListId);
}

export async function listContentTemplateFieldOptions(
	templateId: number,
): Promise<ContentTemplateFieldOption[]> {
	const result = await query<ContentTemplateFieldOptionDbRow>(
		`
			SELECT
				o.field_option_id,
				o.field_list_id,
				o.field_list_code,
				o.option_key,
				o.label,
				o.display_order,
				o.is_enabled
			FROM web_view.web_template_field_options_lookup o
			WHERE EXISTS (
				SELECT 1
				FROM web_view.web_content_template_fields_lookup f
				WHERE f.template_id = $1
				  AND f.field_list_id = o.field_list_id
			)
			ORDER BY o.field_list_code ASC, o.display_order ASC, o.option_key ASC
		`,
		[templateId],
	);

	return result.rows.map(mapTemplateFieldOptionRow);
}

export async function listContentTemplateFieldOptionsForContent(args: {
	contentId: number;
	templateId: number;
}): Promise<ContentTemplateFieldOption[]> {
	const result = await query<ContentTemplateFieldOptionDbRow>(
		`
			SELECT
				o.field_option_id,
				o.field_list_id,
				o.field_list_code,
				o.option_key,
				o.label,
				o.display_order,
				o.is_enabled
			FROM web_view.web_template_field_options_lookup o
			WHERE EXISTS (
				SELECT 1
				FROM web_view.web_content_template_fields_lookup f
				WHERE f.template_id = $2
				  AND f.field_list_id = o.field_list_id
			)
			OR EXISTS (
				SELECT 1
				FROM web_view.web_content_field_values_admin v
				WHERE v.content_id = $1
				  AND v.template_id = $2
				  AND v.field_list_id = o.field_list_id
			)

			UNION ALL

			SELECT DISTINCT
				(-1 * v.template_field_id)::bigint AS field_option_id,
				v.field_list_id,
				v.field_list_code,
				v.value_option_key AS option_key,
				v.value_option_key AS label,
				100000 AS display_order,
				false AS is_enabled
			FROM web_view.web_content_field_values_admin v
			WHERE v.content_id = $1
			  AND v.template_id = $2
			  AND v.value_option_key IS NOT NULL
			  AND NOT EXISTS (
				SELECT 1
				FROM web_view.web_template_field_options_lookup o
				WHERE o.field_list_id = v.field_list_id
				  AND o.option_key = v.value_option_key
			)
			ORDER BY field_list_code ASC, display_order ASC, option_key ASC
		`,
		[args.contentId, args.templateId],
	);

	return result.rows.map(mapTemplateFieldOptionRow);
}

export async function listContentSeriesOptions(args: {
	categoryId: number;
	subcategoryId?: number | null;
}): Promise<ContentSeriesOption[]> {
	const result = await query<ContentSeriesDbRow>(
		`
			SELECT
				series_id,
				title,
				slug,
				category_id,
				subcategory_id,
				next_part_no
			FROM web_view.web_series_lookup
			WHERE category_id = $1
			  AND (
				$2::bigint IS NULL
				OR subcategory_id IS NULL
				OR subcategory_id = $2
			  )
			ORDER BY title ASC, series_id ASC
		`,
		[args.categoryId, args.subcategoryId ?? null],
	);

	return result.rows.map((row) => ({
		id: String(row.series_id),
		title: row.title,
		slug: row.slug,
		categoryId: String(row.category_id),
		subcategoryId:
			row.subcategory_id === null ? null : String(row.subcategory_id),
		nextPartNo: mapPositiveNumber(row.next_part_no),
	}));
}

export async function listContentMediaOptions(args: {
	categoryId?: number | null;
	subcategoryId?: number | null;
	limit?: number;
}): Promise<ContentMediaOption[]> {
	const limit = Math.min(Math.max(Math.floor(args.limit ?? 200), 1), 500);

	const result = await query<ContentMediaDbRow>(
		`
			SELECT
				media_id,
				original_filename,
				filename,
				storage_rel_path,
				mime_type,
				size_bytes,
				width_px,
				height_px,
				alt_text,
				category_id,
				subcategory_id
			FROM web_view.web_media_admin
			WHERE (
				$1::bigint IS NULL
				OR category_id IS NULL
				OR category_id = $1
			)
			  AND (
				$2::bigint IS NULL
				OR subcategory_id IS NULL
				OR subcategory_id = $2
			)
			ORDER BY original_filename ASC, media_id ASC
			LIMIT $3
		`,
		[args.categoryId ?? null, args.subcategoryId ?? null, limit],
	);

	return result.rows.map(mapMediaOptionRow);
}

export async function listContentMediaOptionsByIds(
	mediaIds: number[],
): Promise<ContentMediaOption[]> {
	const normalizedMediaIds = Array.from(
		new Set(
			mediaIds.filter((mediaId) => Number.isInteger(mediaId) && mediaId > 0),
		),
	);

	if (normalizedMediaIds.length === 0) {
		return [];
	}

	const result = await query<ContentMediaDbRow>(
		`
			SELECT
				media_id,
				original_filename,
				filename,
				storage_rel_path,
				mime_type,
				size_bytes,
				width_px,
				height_px,
				alt_text,
				category_id,
				subcategory_id
			FROM web_view.web_media_admin
			WHERE media_id = ANY($1::bigint[])
			ORDER BY original_filename ASC, media_id ASC
		`,
		[normalizedMediaIds],
	);

	return result.rows.map(mapMediaOptionRow);
}

export async function findContentAdminPreviewById(
	contentId: number,
): Promise<ContentAdminPreview | null> {
	const doc = await findContentAdminDetailById(contentId);
	if (!doc) {
		return null;
	}

	const [fields, options] = await Promise.all([
		listContentTemplateFieldsForContent({
			contentId,
			templateId: Number(doc.templateId),
		}),
		listContentTemplateFieldOptionsForContent({
			contentId,
			templateId: Number(doc.templateId),
		}),
	]);

	const optionLabelByKey = new Map<string, string>();
	for (const option of options) {
		optionLabelByKey.set(
			`${option.fieldListId}:${option.optionKey}`,
			option.label,
		);
	}

	const mediaIds = fields
		.filter((field) => field.valueColumnName === "value_media_id")
		.map((field) => doc.fieldValues[String(field.templateFieldId)])
		.map(parsePositiveIntegerValue)
		.filter((mediaId): mediaId is number => mediaId !== null);
	const contentIds = fields
		.filter((field) => field.valueColumnName === "value_content_id")
		.map((field) => doc.fieldValues[String(field.templateFieldId)])
		.map(parsePositiveIntegerValue)
		.filter(
			(linkedContentId): linkedContentId is number => linkedContentId !== null,
		);
	const [mediaRows, contentReferenceRows] = await Promise.all([
		listContentMediaOptionsByIds(mediaIds),
		listContentReferencesByIds(contentIds),
	]);
	const mediaById = new Map(mediaRows.map((media) => [media.id, media]));
	const contentReferenceById = new Map(
		contentReferenceRows.map((contentReference) => [
			contentReference.id,
			contentReference,
		]),
	);

	const previewFields = fields
		.filter((field) => field.isEnabled)
		.map((field): ContentAdminPreviewField => {
			const value = isContentSystemFieldListCode(field.fieldListCode)
				? resolveContentSystemFieldValue({
						fieldListCode: field.fieldListCode,
						doc,
					})
				: (doc.fieldValues[String(field.templateFieldId)] ?? null);
			const optionKey =
				field.valueColumnName === "value_option_key" && typeof value === "string"
					? value
					: null;
			const mediaId =
				field.valueColumnName === "value_media_id"
					? parsePositiveIntegerValue(value)
					: null;
			const linkedContentId =
				field.valueColumnName === "value_content_id"
					? parsePositiveIntegerValue(value)
					: null;

			return {
				...field,
				value,
				optionLabel:
					optionKey === null
						? null
						: (optionLabelByKey.get(`${field.fieldListId}:${optionKey}`) ?? null),
				media: mediaId === null ? null : (mediaById.get(String(mediaId)) ?? null),
				contentLink:
					linkedContentId === null
						? null
						: (contentReferenceById.get(String(linkedContentId)) ?? null),
			};
		});

	const fieldsByDestination = createPreviewFieldBuckets();
	for (const field of previewFields) {
		fieldsByDestination[field.renderDestinationCode].push(field);
	}

	for (const destinationCode of CONTENT_FIELD_RENDER_DESTINATIONS) {
		fieldsByDestination[destinationCode].sort((left, right) => {
			if (left.displayOrder !== right.displayOrder) {
				return left.displayOrder - right.displayOrder;
			}

			return left.templateFieldId - right.templateFieldId;
		});
	}

	return {
		doc,
		fields: previewFields,
		fieldsByDestination,
	};
}

function normalizeContentMediaReference(
	reference: ExtractedContentMediaReference,
	resolvedMediaId: number,
): ContentMediaReferenceDbInput | null {
	const usageCode = reference.usageCode.trim().toLowerCase();
	if (!usageCode || !Number.isInteger(resolvedMediaId) || resolvedMediaId <= 0) {
		return null;
	}

	return {
		media_id: resolvedMediaId,
		usage_code: usageCode,
		display_order: Math.max(1, Math.floor(reference.displayOrder)),
		caption: reference.caption,
	};
}

async function resolveContentMediaReferencePayload(
	executor: DbExecutor,
	mediaReferences: ExtractedContentMediaReference[] | undefined,
): Promise<ContentMediaReferenceDbInput[]> {
	if (!mediaReferences || mediaReferences.length === 0) {
		return [];
	}

	const storageRelPaths = Array.from(
		new Set(
			mediaReferences
				.map((reference) => reference.storageRelPath)
				.filter(
					(value): value is string =>
						typeof value === "string" && value.trim().length > 0,
				)
				.map((value) => value.trim()),
		),
	);

	const mediaIdByPath = new Map<string, number>();
	if (storageRelPaths.length > 0) {
		const result = await executor.query<ContentMediaPathDbRow>(
			`
				SELECT
					media_id,
					storage_rel_path
				FROM web_view.web_media_admin
				WHERE storage_rel_path = ANY($1::text[])
			`,
			[storageRelPaths],
		);

		for (const row of result.rows) {
			mediaIdByPath.set(row.storage_rel_path, Number(row.media_id));
		}
	}

	const payload: ContentMediaReferenceDbInput[] = [];
	for (const reference of mediaReferences) {
		const storageRelPath = reference.storageRelPath?.trim() ?? null;
		const resolvedMediaId =
			reference.mediaId ??
			(storageRelPath === null
				? null
				: (mediaIdByPath.get(storageRelPath) ?? null));

		if (resolvedMediaId === null) {
			if (storageRelPath !== null) {
				throw new Error(`Media path could not be resolved: ${storageRelPath}.`);
			}

			continue;
		}

		const normalized = normalizeContentMediaReference(reference, resolvedMediaId);
		if (normalized) {
			payload.push(normalized);
		}
	}

	const byKey = new Map<string, ContentMediaReferenceDbInput>();
	for (const reference of payload) {
		byKey.set(`${reference.media_id}:${reference.usage_code}`, reference);
	}

	return Array.from(byKey.values()).sort((left, right) => {
		if (left.display_order !== right.display_order) {
			return left.display_order - right.display_order;
		}

		if (left.media_id !== right.media_id) {
			return left.media_id - right.media_id;
		}

		return left.usage_code.localeCompare(right.usage_code);
	});
}

async function replaceContentMediaReferencesAdmin(
	executor: DbExecutor,
	args: {
		actorDiscordId: string;
		contentId: number;
		mediaReferences?: ExtractedContentMediaReference[];
	},
): Promise<void> {
	const mediaPayload = await resolveContentMediaReferencePayload(
		executor,
		args.mediaReferences,
	);

	await executor.query(
		`
			SELECT content_id
			FROM web_api.web_content_media_replace_admin($1, $2, $3::jsonb)
		`,
		[args.actorDiscordId, args.contentId, JSON.stringify(mediaPayload)],
	);
}

export async function createContentAdmin(args: {
	actorDiscordId: string;
	templateId: number;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: number;
	subcategoryId: number | null;
	seriesId: number | null;
	seriesPartNo: number | null;
	statusCode: ContentStatusCode;
	readPolicyCode: ContentPolicyCode;
	readRank: number | null;
	writePolicyCode: ContentPolicyCode;
	writeRank: number | null;
	navHiddenModeCode: ContentNavModeCode;
	navHidden: boolean | null;
	iconModeCode: ContentIconModeCode;
	iconKeyId: number | null;
	iconColorModeCode: ContentIconModeCode;
	iconColorId: number | null;
	fieldValues: ContentFieldValueDbInput[];
	externalLinks?: ContentExternalLinkDbInput[];
	mediaReferences?: ExtractedContentMediaReference[];
}): Promise<number> {
	const readPolicyCode = toReadPolicyDbCode(args.readPolicyCode);
	const writePolicyCode = toWritePolicyDbCode(args.writePolicyCode);
	const navHiddenModeCode = toNavModeDbCode(args.navHiddenModeCode);

	const client = await pg.connect();

	try {
		await client.query("BEGIN");

		const result = await client.query<{ content_id: number | string }>(
			`
				SELECT content_id
				FROM web_api.web_content_create_admin(
					$1,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9,
					$10,
					NULL,
					NULL,
					$11,
					$12,
					$13,
					$14,
					$15,
					$16,
					$17,
					$18,
					$19,
					$20,
					$21::jsonb,
					$22::jsonb
				)
			`,
			[
				args.actorDiscordId,
				args.templateId,
				args.title,
				args.slug,
				args.summary,
				args.categoryId,
				args.subcategoryId,
				args.seriesId,
				args.seriesPartNo,
				args.statusCode,
				readPolicyCode,
				args.readRank,
				writePolicyCode,
				args.writeRank,
				navHiddenModeCode,
				args.navHidden,
				args.iconModeCode,
				args.iconKeyId,
				args.iconColorModeCode,
				args.iconColorId,
				JSON.stringify(args.fieldValues),
				JSON.stringify(args.externalLinks ?? []),
			],
		);

		const contentId = Number(result.rows[0]?.content_id);
		await replaceContentMediaReferencesAdmin(client, {
			actorDiscordId: args.actorDiscordId,
			contentId,
			mediaReferences: args.mediaReferences,
		});

		await client.query("COMMIT");
		return contentId;
	} catch (error: unknown) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
}

export async function updateContentAdmin(args: {
	actorDiscordId: string;
	contentId: number;
	templateId: number;
	title: string;
	slug: string;
	summary: string | null;
	categoryId: number;
	subcategoryId: number | null;
	seriesId: number | null;
	seriesPartNo: number | null;
	statusCode: ContentStatusCode;
	readPolicyCode: ContentPolicyCode;
	readRank: number | null;
	writePolicyCode: ContentPolicyCode;
	writeRank: number | null;
	navHiddenModeCode: ContentNavModeCode;
	navHidden: boolean | null;
	iconModeCode: ContentIconModeCode;
	iconKeyId: number | null;
	iconColorModeCode: ContentIconModeCode;
	iconColorId: number | null;
	fieldValues: ContentFieldValueDbInput[];
	externalLinks?: ContentExternalLinkDbInput[];
	mediaReferences?: ExtractedContentMediaReference[];
}): Promise<number> {
	const readPolicyCode = toReadPolicyDbCode(args.readPolicyCode);
	const writePolicyCode = toWritePolicyDbCode(args.writePolicyCode);
	const navHiddenModeCode = toNavModeDbCode(args.navHiddenModeCode);

	const client = await pg.connect();

	try {
		await client.query("BEGIN");

		const result = await client.query<{ content_id: number | string }>(
			`
				SELECT content_id
				FROM web_api.web_content_update_admin(
					$1,
					$2,
					$3,
					$4,
					$5,
					$6,
					$7,
					$8,
					$9,
					$10,
					$11,
					NULL,
					NULL,
					$12,
					$13,
					$14,
					$15,
					$16,
					$17,
					$18,
					$19,
					$20,
					$21,
					$22::jsonb,
					$23::jsonb
				)
			`,
			[
				args.actorDiscordId,
				args.contentId,
				args.templateId,
				args.title,
				args.slug,
				args.summary,
				args.categoryId,
				args.subcategoryId,
				args.seriesId,
				args.seriesPartNo,
				args.statusCode,
				readPolicyCode,
				args.readRank,
				writePolicyCode,
				args.writeRank,
				navHiddenModeCode,
				args.navHidden,
				args.iconModeCode,
				args.iconKeyId,
				args.iconColorModeCode,
				args.iconColorId,
				JSON.stringify(args.fieldValues),
				JSON.stringify(args.externalLinks ?? []),
			],
		);

		const contentId = Number(result.rows[0]?.content_id);
		await replaceContentMediaReferencesAdmin(client, {
			actorDiscordId: args.actorDiscordId,
			contentId,
			mediaReferences: args.mediaReferences,
		});

		await client.query("COMMIT");
		return contentId;
	} catch (error: unknown) {
		await client.query("ROLLBACK").catch(() => undefined);
		throw error;
	} finally {
		client.release();
	}
}

export async function setContentStatusAdmin(args: {
	actorDiscordId: string;
	contentId: number;
	statusCode: ContentStatusCode;
}): Promise<number> {
	const result = await query<{ content_id: number | string }>(
		`
			SELECT content_id
			FROM web_api.web_content_set_status_admin($1, $2, $3)
		`,
		[args.actorDiscordId, args.contentId, args.statusCode],
	);

	return Number(result.rows[0]?.content_id);
}

export async function deleteContentAdmin(args: {
	actorDiscordId: string;
	contentId: number;
}): Promise<number> {
	const result = await query<{ content_id: number | string }>(
		`
			SELECT content_id
			FROM web_api.web_content_delete_admin($1, $2)
		`,
		[args.actorDiscordId, args.contentId],
	);

	return Number(result.rows[0]?.content_id);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
