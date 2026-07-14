//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/templates.ts                                                                     ////
//// Language: TS                                                                                                 ////
//// DB-first template family read helpers for grouped web admin flows                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAdminMediaFileUrl } from "@/lib/helpers/media-url";

export type TemplateFieldRenderDestinationCode =
	| "seo"
	| "hero"
	| "top"
	| "left"
	| "main"
	| "right"
	| "bottom"
	| "hidden";

export const TEMPLATE_FIELD_RENDER_DESTINATION_OPTIONS: Array<{
	code: TemplateFieldRenderDestinationCode;
	label: string;
}> = [
	{ code: "seo", label: "SEO" },
	{ code: "hero", label: "Hero" },
	{ code: "top", label: "Top" },
	{ code: "left", label: "Left" },
	{ code: "main", label: "Main" },
	{ code: "right", label: "Right" },
	{ code: "bottom", label: "Bottom" },
	{ code: "hidden", label: "Hidden" },
];

export type TemplateFieldLayoutWidthCode = "full" | "half" | "third";

export type TemplateFieldLayoutAlignCode =
	| "left"
	| "center"
	| "right"
	| "stretch";

export type TemplateFieldLabelStyleCode = "title" | "label" | "text" | "muted";

export type TemplateFieldLabelPositionCode = "above" | "inline";

export type TemplateFieldLabelSeparatorCode = "none" | "colon" | "dash";

export const TEMPLATE_FIELD_LAYOUT_WIDTH_OPTIONS: Array<{
	code: TemplateFieldLayoutWidthCode;
	label: string;
}> = [
	{ code: "full", label: "Full row" },
	{ code: "half", label: "Half row" },
	{ code: "third", label: "Third row" },
];

export const TEMPLATE_FIELD_LAYOUT_ALIGN_OPTIONS: Array<{
	code: TemplateFieldLayoutAlignCode;
	label: string;
}> = [
	{ code: "stretch", label: "Stretch" },
	{ code: "left", label: "Left" },
	{ code: "center", label: "Center" },
	{ code: "right", label: "Right" },
];

export function getTemplateFieldLayoutWidthLabel(
	code: string | null | undefined,
): string {
	return (
		TEMPLATE_FIELD_LAYOUT_WIDTH_OPTIONS.find((option) => option.code === code)
			?.label ?? "Full row"
	);
}

export function getTemplateFieldLayoutAlignLabel(
	code: string | null | undefined,
): string {
	return (
		TEMPLATE_FIELD_LAYOUT_ALIGN_OPTIONS.find((option) => option.code === code)
			?.label ?? "Stretch"
	);
}

export function getTemplateFieldRenderDestinationLabel(
	code: string | null | undefined,
): string {
	return (
		TEMPLATE_FIELD_RENDER_DESTINATION_OPTIONS.find(
			(option) => option.code === code,
		)?.label ?? "Main"
	);
}

export type TemplateOption = {
	id: string;
	key: string;
	label: string;
	contentKindCode: string;
	contentKindLabel: string;
	surfaceScopeCode: string;
	allowsSeries: boolean;
	enabled: boolean;
};

type TemplateLookupDbRow = {
	template_id: number | string;
	template_key: string;
	label: string;
	content_kind_code: string;
	content_kind_label: string;
	surface_scope_code: string;
	allows_series: boolean;
	is_enabled: boolean;
};

type TemplateAdminDbRow = {
	template_id: number | string;
	template_code: string;
	template_key: string;
	label: string;
	description: string | null;
	content_kind_code: string;
	content_kind_label: string;
	surface_scope_code: string;
	allows_series: boolean;
	default_icon_key_id: number | string | null;
	default_icon_key_key: string | null;
	default_icon_key_label: string | null;
	default_icon_key_source_code: "lucide" | "media" | null;
	default_icon_key_lucide_name: string | null;
	default_icon_media_id: number | string | null;
	default_icon_media_storage_rel_path: string | null;
	default_icon_media_filename: string | null;
	default_icon_media_original_filename: string | null;
	default_icon_media_mime_type: string | null;
	default_icon_color_id: number | string | null;
	default_icon_color_key: string | null;
	default_icon_color_label: string | null;
	default_icon_color_preview: string | null;
	schema_version_no: number;
	is_enabled: boolean;
	field_count: number;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldTypeAdminDbRow = {
	field_type_code: string;
	label: string;
	value_column_name: string;
	description: string | null;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldToolAdminDbRow = {
	field_tool_code: string;
	field_type_code: string;
	field_type_label: string;
	value_column_name: string;
	label: string;
	tool_group_code: string;
	display_order: number;
	description: string | null;
	is_enabled: boolean;
	field_list_usage_count: number | string;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldListAdminDbRow = {
	field_list_id: number | string;
	field_list_code: string;
	label: string;
	help_text: string | null;
	field_type_code: string;
	field_type_label: string;
	render_destination_code: TemplateFieldRenderDestinationCode;
	value_column_name: string;
	is_enabled: boolean;
	template_usage_count: number;
	option_count: number;
	tool_count: number | string;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldOptionAdminDbRow = {
	field_option_id: number | string;
	field_list_id: number | string;
	field_list_code: string;
	field_list_label: string;
	field_type_code: string;
	field_type_label: string;
	option_key: string;
	label: string;
	display_order: number;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldListToolAdminDbRow = {
	field_list_tool_id: number | string;
	field_list_id: number | string;
	field_list_code: string;
	field_list_label: string;
	field_type_code: string;
	field_type_label: string;
	value_column_name: string;
	field_tool_code: string;
	field_tool_label: string;
	tool_group_code: string;
	display_order: number;
	description: string | null;
	field_tool_enabled: boolean;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

type TemplateFieldAdminDbRow = {
	template_field_id: number | string;
	template_id: number | string;
	template_code: string;
	template_label: string;
	field_list_id: number | string;
	field_list_code: string;
	field_list_label: string;
	field_list_help_text: string | null;
	field_type_code: string;
	field_type_label: string;
	render_destination_code: TemplateFieldRenderDestinationCode;
	layout_width_code: TemplateFieldLayoutWidthCode;
	layout_align_code: TemplateFieldLayoutAlignCode;
	show_label_flag: boolean;
	label_style_code: TemplateFieldLabelStyleCode;
	label_position_code: TemplateFieldLabelPositionCode;
	label_separator_code: TemplateFieldLabelSeparatorCode;
	value_column_name: string;
	label_override: string | null;
	help_text_override: string | null;
	display_order: number;
	is_required: boolean;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
};

export type TemplateAdminItem = {
	id: string;
	templateCode: string;
	key: string;
	label: string;
	description: string | null;
	contentKindCode: string;
	contentKindLabel: string;
	surfaceScopeCode: string;
	allowsSeries: boolean;
	defaultIconKey: {
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
		} | null;
	} | null;
	defaultIconColor: {
		id: string;
		key: string | null;
		label: string | null;
		preview: string | null;
	} | null;
	schemaVersionNo: number;
	enabled: boolean;
	fieldCount: number;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldTypeAdminItem = {
	id: string;
	fieldTypeCode: string;
	label: string;
	valueColumnName: string;
	description: string | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldToolAdminItem = {
	id: string;
	fieldToolCode: string;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	valueColumnName: string;
	label: string;
	toolGroupCode: string;
	displayOrder: number;
	description: string | null;
	enabled: boolean;
	fieldListUsageCount: number;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldListAdminItem = {
	id: string;
	fieldListCode: string;
	label: string;
	helpText: string | null;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	renderDestinationCode: TemplateFieldRenderDestinationCode;
	valueColumnName: string;
	supportsOptions: boolean;
	enabled: boolean;
	templateUsageCount: number;
	optionCount: number;
	toolCount: number;
	supportsTools: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldOptionAdminItem = {
	id: string;
	fieldListId: string;
	fieldListCode: string;
	fieldListLabel: string;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	optionKey: string;
	label: string;
	displayOrder: number;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldListToolAdminItem = {
	id: string;
	fieldListId: string;
	fieldListCode: string;
	fieldListLabel: string;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	valueColumnName: string;
	fieldToolCode: string;
	fieldToolLabel: string;
	toolGroupCode: string;
	displayOrder: number;
	description: string | null;
	fieldToolEnabled: boolean;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TemplateFieldAdminItem = {
	id: string;
	templateId: string;
	templateCode: string;
	templateLabel: string;
	fieldListId: string;
	fieldListCode: string;
	fieldListLabel: string;
	fieldListHelpText: string | null;
	fieldTypeCode: string;
	fieldTypeLabel: string;
	renderDestinationCode: TemplateFieldRenderDestinationCode;
	layoutWidthCode: TemplateFieldLayoutWidthCode;
	layoutAlignCode: TemplateFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: TemplateFieldLabelStyleCode;
	labelPositionCode: TemplateFieldLabelPositionCode;
	labelSeparatorCode: TemplateFieldLabelSeparatorCode;
	valueColumnName: string;
	labelOverride: string | null;
	helpTextOverride: string | null;
	displayOrder: number;
	required: boolean;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date
		? value.toISOString()
		: new Date(value).toISOString();
}

type TemplateIconMedia = {
	id: string;
	url: string | null;
	filename: string | null;
	originalFilename: string | null;
	mimeType: string | null;
	storageRelPath: string | null;
} | null;

function mapTemplateMedia(row: TemplateAdminDbRow): TemplateIconMedia {
	if (row.default_icon_media_id == null) {
		return null;
	}

	const storageRelPath = row.default_icon_media_storage_rel_path ?? null;

	return {
		id: String(row.default_icon_media_id),
		url: storageRelPath ? buildAdminMediaFileUrl(storageRelPath) : null,
		filename: row.default_icon_media_filename ?? null,
		originalFilename: row.default_icon_media_original_filename ?? null,
		mimeType: row.default_icon_media_mime_type ?? null,
		storageRelPath,
	};
}

function mapTemplateRow(row: TemplateAdminDbRow): TemplateAdminItem {
	return {
		id: String(row.template_id),
		templateCode: row.template_code,
		key: row.template_key,
		label: row.label,
		description: row.description,
		contentKindCode: row.content_kind_code,
		contentKindLabel: row.content_kind_label,
		surfaceScopeCode: row.surface_scope_code,
		allowsSeries: row.allows_series,
		defaultIconKey:
			row.default_icon_key_id == null
				? null
				: {
						id: String(row.default_icon_key_id),
						key: row.default_icon_key_key,
						label: row.default_icon_key_label,
						source: row.default_icon_key_source_code === "media" ? "media" : "lucide",
						lucideName: row.default_icon_key_lucide_name,
						iconMedia: mapTemplateMedia(row),
					},
		defaultIconColor:
			row.default_icon_color_id == null
				? null
				: {
						id: String(row.default_icon_color_id),
						key: row.default_icon_color_key,
						label: row.default_icon_color_label,
						preview: row.default_icon_color_preview,
					},
		schemaVersionNo: row.schema_version_no,
		enabled: row.is_enabled,
		fieldCount: row.field_count,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldTypeRow(
	row: TemplateFieldTypeAdminDbRow,
): TemplateFieldTypeAdminItem {
	return {
		id: row.field_type_code,
		fieldTypeCode: row.field_type_code,
		label: row.label,
		valueColumnName: row.value_column_name,
		description: row.description,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldToolRow(
	row: TemplateFieldToolAdminDbRow,
): TemplateFieldToolAdminItem {
	return {
		id: row.field_tool_code,
		fieldToolCode: row.field_tool_code,
		fieldTypeCode: row.field_type_code,
		fieldTypeLabel: row.field_type_label,
		valueColumnName: row.value_column_name,
		label: row.label,
		toolGroupCode: row.tool_group_code,
		displayOrder: row.display_order,
		description: row.description,
		enabled: row.is_enabled,
		fieldListUsageCount: Number(row.field_list_usage_count) || 0,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldListRow(
	row: TemplateFieldListAdminDbRow,
): TemplateFieldListAdminItem {
	return {
		id: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		label: row.label,
		helpText: row.help_text,
		fieldTypeCode: row.field_type_code,
		fieldTypeLabel: row.field_type_label,
		renderDestinationCode: row.render_destination_code,
		valueColumnName: row.value_column_name,
		supportsOptions: row.value_column_name === "value_option_key",
		enabled: row.is_enabled,
		templateUsageCount: row.template_usage_count,
		optionCount: row.option_count,
		toolCount: Number(row.tool_count) || 0,
		supportsTools: (Number(row.tool_count) || 0) > 0,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldOptionRow(
	row: TemplateFieldOptionAdminDbRow,
): TemplateFieldOptionAdminItem {
	return {
		id: String(row.field_option_id),
		fieldListId: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		fieldListLabel: row.field_list_label,
		fieldTypeCode: row.field_type_code,
		fieldTypeLabel: row.field_type_label,
		optionKey: row.option_key,
		label: row.label,
		displayOrder: row.display_order,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapFieldListToolRow(
	row: TemplateFieldListToolAdminDbRow,
): TemplateFieldListToolAdminItem {
	return {
		id: String(row.field_list_tool_id),
		fieldListId: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		fieldListLabel: row.field_list_label,
		fieldTypeCode: row.field_type_code,
		fieldTypeLabel: row.field_type_label,
		valueColumnName: row.value_column_name,
		fieldToolCode: row.field_tool_code,
		fieldToolLabel: row.field_tool_label,
		toolGroupCode: row.tool_group_code,
		displayOrder: row.display_order,
		description: row.description,
		fieldToolEnabled: row.field_tool_enabled,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapTemplateFieldRow(
	row: TemplateFieldAdminDbRow,
): TemplateFieldAdminItem {
	return {
		id: String(row.template_field_id),
		templateId: String(row.template_id),
		templateCode: row.template_code,
		templateLabel: row.template_label,
		fieldListId: String(row.field_list_id),
		fieldListCode: row.field_list_code,
		fieldListLabel: row.field_list_label,
		fieldListHelpText: row.field_list_help_text,
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
		labelOverride: row.label_override,
		helpTextOverride: row.help_text_override,
		displayOrder: row.display_order,
		required: row.is_required,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function listTemplateOptions(): Promise<TemplateOption[]> {
	const result = await query<TemplateLookupDbRow>(
		`
      SELECT
        template_id,
        template_key,
        label,
        content_kind_code,
        content_kind_label,
        surface_scope_code,
        allows_series,
        is_enabled
      FROM web_view.web_templates_lookup
      ORDER BY template_key ASC, template_id ASC
    `,
	);

	return result.rows.map((row: TemplateLookupDbRow) => ({
		id: String(row.template_id),
		key: row.template_key,
		label: row.label,
		contentKindCode: row.content_kind_code,
		contentKindLabel: row.content_kind_label,
		surfaceScopeCode: row.surface_scope_code,
		allowsSeries: row.allows_series,
		enabled: row.is_enabled,
	}));
}

export async function listTemplatesAdmin(): Promise<TemplateAdminItem[]> {
	const result = await query<TemplateAdminDbRow>(
		`
      SELECT
        template_id,
        template_code,
        template_key,
        label,
        description,
        content_kind_code,
        content_kind_label,
        surface_scope_code,
        allows_series,
        default_icon_key_id,
        default_icon_key_key,
        default_icon_key_label,
        default_icon_key_source_code,
        default_icon_key_lucide_name,
        default_icon_media_id,
        default_icon_media_storage_rel_path,
        default_icon_media_filename,
        default_icon_media_original_filename,
        default_icon_media_mime_type,
        default_icon_color_id,
        default_icon_color_key,
        default_icon_color_label,
        default_icon_color_preview,
        schema_version_no,
        is_enabled,
        field_count,
        created_dt,
        updated_dt
      FROM web_view.web_templates_admin
      ORDER BY template_code ASC, template_id ASC
    `,
	);

	return result.rows.map(mapTemplateRow);
}

export async function findTemplateAdminById(
	templateId: number,
): Promise<TemplateAdminItem | null> {
	const result = await query<TemplateAdminDbRow>(
		`
      SELECT
        template_id,
        template_code,
        template_key,
        label,
        description,
        content_kind_code,
        content_kind_label,
        surface_scope_code,
        allows_series,
        default_icon_key_id,
        default_icon_key_key,
        default_icon_key_label,
        default_icon_key_source_code,
        default_icon_key_lucide_name,
        default_icon_media_id,
        default_icon_media_storage_rel_path,
        default_icon_media_filename,
        default_icon_media_original_filename,
        default_icon_media_mime_type,
        default_icon_color_id,
        default_icon_color_key,
        default_icon_color_label,
        default_icon_color_preview,
        schema_version_no,
        is_enabled,
        field_count,
        created_dt,
        updated_dt
      FROM web_view.web_templates_admin
      WHERE template_id = $1
      LIMIT 1
    `,
		[templateId],
	);

	const row = result.rows[0];
	return row ? mapTemplateRow(row) : null;
}

export async function listTemplateFieldTypesAdmin(): Promise<
	TemplateFieldTypeAdminItem[]
> {
	const result = await query<TemplateFieldTypeAdminDbRow>(
		`
      SELECT
        field_type_code,
        label,
        value_column_name,
        description,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_types_admin
      ORDER BY field_type_code ASC
    `,
	);

	return result.rows.map(mapFieldTypeRow);
}

export async function listTemplateFieldToolsAdmin(): Promise<
	TemplateFieldToolAdminItem[]
> {
	const result = await query<TemplateFieldToolAdminDbRow>(
		`
      SELECT
        field_tool_code,
        field_type_code,
        field_type_label,
        value_column_name,
        label,
        tool_group_code,
        display_order,
        description,
        is_enabled,
        field_list_usage_count,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_tools_admin
      ORDER BY field_type_code ASC, display_order ASC, field_tool_code ASC
    `,
	);

	return result.rows.map(mapFieldToolRow);
}

export async function listTemplateFieldToolsAdminByFieldTypeCode(
	fieldTypeCode: string,
): Promise<TemplateFieldToolAdminItem[]> {
	const result = await query<TemplateFieldToolAdminDbRow>(
		`
      SELECT
        field_tool_code,
        field_type_code,
        field_type_label,
        value_column_name,
        label,
        tool_group_code,
        display_order,
        description,
        is_enabled,
        field_list_usage_count,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_tools_admin
      WHERE field_type_code = $1
        AND is_enabled = true
      ORDER BY display_order ASC, field_tool_code ASC
    `,
		[fieldTypeCode],
	);

	return result.rows.map(mapFieldToolRow);
}

export async function findTemplateFieldToolAdminByCode(
	fieldToolCode: string,
): Promise<TemplateFieldToolAdminItem | null> {
	const result = await query<TemplateFieldToolAdminDbRow>(
		`
      SELECT
        field_tool_code,
        field_type_code,
        field_type_label,
        value_column_name,
        label,
        tool_group_code,
        display_order,
        description,
        is_enabled,
        field_list_usage_count,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_tools_admin
      WHERE field_tool_code = $1
      LIMIT 1
    `,
		[fieldToolCode],
	);

	const row = result.rows[0];
	return row ? mapFieldToolRow(row) : null;
}

export async function listTemplateFieldListAdmin(): Promise<
	TemplateFieldListAdminItem[]
> {
	const result = await query<TemplateFieldListAdminDbRow>(
		`
      SELECT
        field_lists.field_list_id,
        field_lists.field_list_code,
        field_lists.label,
        field_lists.help_text,
        field_lists.field_type_code,
        field_lists.field_type_label,
        field_lists.render_destination_code,
        field_lists.value_column_name,
        field_lists.is_enabled,
        field_lists.template_usage_count,
        field_lists.option_count,
        (SELECT COUNT(*)
         FROM web_view.web_template_field_tools_lookup field_tools
         WHERE field_tools.field_type_code = field_lists.field_type_code) AS tool_count,
        field_lists.created_dt,
        field_lists.updated_dt
      FROM web_view.web_template_field_list_admin field_lists
      ORDER BY field_lists.field_list_code ASC, field_lists.field_list_id ASC
    `,
	);

	return result.rows.map(mapFieldListRow);
}

export async function findTemplateFieldListAdminById(
	fieldListId: number,
): Promise<TemplateFieldListAdminItem | null> {
	const result = await query<TemplateFieldListAdminDbRow>(
		`
      SELECT
        field_lists.field_list_id,
        field_lists.field_list_code,
        field_lists.label,
        field_lists.help_text,
        field_lists.field_type_code,
        field_lists.field_type_label,
        field_lists.render_destination_code,
        field_lists.value_column_name,
        field_lists.is_enabled,
        field_lists.template_usage_count,
        field_lists.option_count,
        (SELECT COUNT(*)
         FROM web_view.web_template_field_tools_lookup field_tools
         WHERE field_tools.field_type_code = field_lists.field_type_code) AS tool_count,
        field_lists.created_dt,
        field_lists.updated_dt
      FROM web_view.web_template_field_list_admin field_lists
      WHERE field_lists.field_list_id = $1
      LIMIT 1
    `,
		[fieldListId],
	);

	const row = result.rows[0];
	return row ? mapFieldListRow(row) : null;
}

export async function listAvailableTemplateFieldListsAdminByTemplateId(
	templateId: number,
	currentFieldListId?: number | null,
): Promise<TemplateFieldListAdminItem[]> {
	const result = await query<TemplateFieldListAdminDbRow>(
		`
      SELECT
        field_lists.field_list_id,
        field_lists.field_list_code,
        field_lists.label,
        field_lists.help_text,
        field_lists.field_type_code,
        field_lists.field_type_label,
        field_lists.render_destination_code,
        field_lists.value_column_name,
        field_lists.is_enabled,
        field_lists.template_usage_count,
        field_lists.option_count,
        (SELECT COUNT(*)
         FROM web_view.web_template_field_tools_lookup field_tools
         WHERE field_tools.field_type_code = field_lists.field_type_code) AS tool_count,
        field_lists.created_dt,
        field_lists.updated_dt
      FROM web_view.web_template_field_list_admin AS field_lists
      WHERE
        field_lists.field_list_id = $2
        OR NOT EXISTS (
          SELECT 1
          FROM web_view.web_template_fields_admin AS template_fields
          WHERE template_fields.template_id = $1
            AND template_fields.field_list_id = field_lists.field_list_id
        )
      ORDER BY field_lists.field_list_code ASC, field_lists.field_list_id ASC
    `,
		[templateId, currentFieldListId ?? null],
	);

	return result.rows.map(mapFieldListRow);
}

export async function listTemplateFieldOptionsAdmin(): Promise<
	TemplateFieldOptionAdminItem[]
> {
	const result = await query<TemplateFieldOptionAdminDbRow>(
		`
      SELECT
        field_option_id,
        field_list_id,
        field_list_code,
        field_list_label,
        field_type_code,
        field_type_label,
        option_key,
        label,
        display_order,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_options_admin
      ORDER BY field_list_code ASC, display_order ASC, field_option_id ASC
    `,
	);

	return result.rows.map(mapFieldOptionRow);
}

export async function listTemplateFieldOptionsAdminByFieldListId(
	fieldListId: number,
): Promise<TemplateFieldOptionAdminItem[]> {
	const result = await query<TemplateFieldOptionAdminDbRow>(
		`
      SELECT
        field_option_id,
        field_list_id,
        field_list_code,
        field_list_label,
        field_type_code,
        field_type_label,
        option_key,
        label,
        display_order,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_options_admin
      WHERE field_list_id = $1
      ORDER BY display_order ASC, option_key ASC, field_option_id ASC
    `,
		[fieldListId],
	);

	return result.rows.map(mapFieldOptionRow);
}

export async function listTemplateFieldListToolsAdminByFieldListId(
	fieldListId: number,
): Promise<TemplateFieldListToolAdminItem[]> {
	const result = await query<TemplateFieldListToolAdminDbRow>(
		`
      SELECT
        field_list_tool_id,
        field_list_id,
        field_list_code,
        field_list_label,
        field_type_code,
        field_type_label,
        value_column_name,
        field_tool_code,
        field_tool_label,
        tool_group_code,
        display_order,
        description,
        field_tool_enabled,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_template_field_list_tools_admin
      WHERE field_list_id = $1
      ORDER BY display_order ASC, field_tool_code ASC, field_list_tool_id ASC
    `,
		[fieldListId],
	);

	return result.rows.map(mapFieldListToolRow);
}

export async function listTemplateFieldsAdminByTemplateId(
	templateId: number,
): Promise<TemplateFieldAdminItem[]> {
	const result = await query<TemplateFieldAdminDbRow>(
		`
      SELECT
        template_field_id,
        template_id,
        template_code,
        template_label,
        field_list_id,
        field_list_code,
        field_list_label,
        field_list_help_text,
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
        label_override,
        help_text_override,
        display_order,
        is_required,
        is_enabled,
        created_dt,
        updated_dt
      FROM web_view.web_template_fields_admin
      WHERE template_id = $1
      ORDER BY display_order ASC, template_field_id ASC
    `,
		[templateId],
	);

	return result.rows.map(mapTemplateFieldRow);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
