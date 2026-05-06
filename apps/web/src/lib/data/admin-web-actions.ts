//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/admin-web-actions.ts                                                          ////
//// Language: TS                                                                                              ////
//// DB-first admin web mutation helpers extracted from route handlers.                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

type IdRow<T extends string> = {
	[K in T]: number | string;
};

function toPositiveInt(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
	}

	return null;
}

export type AdminReadPolicyCode = "public" | "min_rank" | "equal_rank";
export type AdminInheritedReadPolicyCode =
	| "inherit"
	| "public"
	| "min_rank"
	| "equal_rank";
export type AdminWritePolicyCode = "min_rank" | "equal_rank";
export type AdminInheritedWritePolicyCode =
	| "inherit"
	| "min_rank"
	| "equal_rank";
export type AdminNavHiddenModeCode = "inherit" | "explicit";
export type AdminIconSourceCode = "lucide" | "media";
export type AdminTemplateSurfaceScopeCode = "admin" | "public";
export type AdminTemplateFieldRenderDestinationCode =
	| "seo"
	| "hero"
	| "top"
	| "left"
	| "main"
	| "right"
	| "bottom"
	| "hidden";
export type AdminTemplateFieldLayoutWidthCode = "full" | "half" | "third";
export type AdminTemplateFieldLayoutAlignCode = "left" | "center" | "right" | "stretch";
export type AdminTemplateFieldLabelStyleCode = "title" | "label" | "text" | "muted";
export type AdminTemplateFieldLabelPositionCode = "above" | "inline";
export type AdminTemplateFieldLabelSeparatorCode = "none" | "colon" | "dash";

export async function deleteCategoryAdmin(
	actorDiscordId: string,
	categoryId: number,
): Promise<void> {
	await query(`SELECT * FROM web_api.web_category_delete($1, $2)`, [
		actorDiscordId,
		categoryId,
	]);
}

export async function toggleCategoryNavHiddenAdmin(
	actorDiscordId: string,
	categoryId: number,
): Promise<void> {
	await query(`SELECT * FROM web_api.web_category_toggle_nav_hidden($1, $2)`, [
		actorDiscordId,
		categoryId,
	]);
}

export async function createCategoryAdmin(args: {
	actorDiscordId: string;
	title: string;
	slug: string;
	navHidden: boolean;
	readPolicyCode: AdminReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminWritePolicyCode;
	writeRank: number;
	iconKeyId: number;
	iconColorId: number;
	templateIds: number[];
}): Promise<number | null> {
	const result = await query<IdRow<"category_id">>(
		`SELECT * FROM web_api.web_category_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			args.actorDiscordId,
			args.title,
			args.slug,
			args.navHidden,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.iconKeyId,
			args.iconColorId,
			args.templateIds,
		],
	);

	return toPositiveInt(result.rows[0]?.category_id);
}

export async function updateCategoryAdmin(args: {
	actorDiscordId: string;
	categoryId: number;
	title: string;
	slug: string;
	navHidden: boolean;
	readPolicyCode: AdminReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminWritePolicyCode;
	writeRank: number;
	iconKeyId: number;
	iconColorId: number;
	templateIds: number[];
}): Promise<void> {
	await query<IdRow<"category_id">>(
		`SELECT * FROM web_api.web_category_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		[
			args.actorDiscordId,
			args.categoryId,
			args.title,
			args.slug,
			args.navHidden,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.iconKeyId,
			args.iconColorId,
			args.templateIds,
		],
	);
}

export async function deleteSubcategoryAdmin(
	actorDiscordId: string,
	subcategoryId: number,
): Promise<void> {
	await query(`SELECT * FROM web_api.web_subcategory_delete($1, $2)`, [
		actorDiscordId,
		subcategoryId,
	]);
}

export async function createSubcategoryAdmin(args: {
	actorDiscordId: string;
	categoryId: number;
	title: string;
	slug: string;
	readPolicyCode: AdminInheritedReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminInheritedWritePolicyCode;
	writeRank: number | null;
	navHiddenModeCode: AdminNavHiddenModeCode;
	navHiddenValue: boolean | null;
	iconKeyId: number;
	iconColorId: number;
	templateIds: number[];
}): Promise<number | null> {
	const result = await query<IdRow<"subcategory_id">>(
		`SELECT * FROM web_api.web_subcategory_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		[
			args.actorDiscordId,
			args.categoryId,
			args.title,
			args.slug,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.navHiddenModeCode,
			args.navHiddenValue,
			args.iconKeyId,
			args.iconColorId,
			args.templateIds,
		],
	);

	return toPositiveInt(result.rows[0]?.subcategory_id);
}

export async function updateSubcategoryAdmin(args: {
	actorDiscordId: string;
	subcategoryId: number;
	categoryId: number;
	title: string;
	slug: string;
	readPolicyCode: AdminInheritedReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminInheritedWritePolicyCode;
	writeRank: number | null;
	navHiddenModeCode: AdminNavHiddenModeCode;
	navHiddenValue: boolean | null;
	iconKeyId: number;
	iconColorId: number;
	templateIds: number[];
}): Promise<void> {
	await query<IdRow<"subcategory_id">>(
		`SELECT * FROM web_api.web_subcategory_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		[
			args.actorDiscordId,
			args.subcategoryId,
			args.categoryId,
			args.title,
			args.slug,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.navHiddenModeCode,
			args.navHiddenValue,
			args.iconKeyId,
			args.iconColorId,
			args.templateIds,
		],
	);
}

export async function createIconAdmin(args: {
	actorDiscordId: string;
	key: string;
	label: string;
	source: AdminIconSourceCode;
	lucideName: string | null;
	mediaId: number | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT * FROM web_api.web_icon_create($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.key,
			args.label,
			args.source,
			args.lucideName,
			args.mediaId,
			args.enabled,
		],
	);
}

export async function updateIconAdmin(args: {
	actorDiscordId: string;
	iconId: number;
	label: string;
	source: AdminIconSourceCode;
	lucideName: string | null;
	mediaId: number | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT * FROM web_api.web_icon_update($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.iconId,
			args.label,
			args.source,
			args.lucideName,
			args.mediaId,
			args.enabled,
		],
	);
}

export async function deleteIconAdmin(
	actorDiscordId: string,
	iconId: number,
): Promise<void> {
	await query(`SELECT * FROM web_api.web_icon_delete($1, $2)`, [
		actorDiscordId,
		iconId,
	]);
}

export async function createThemeColorAdmin(args: {
	actorDiscordId: string;
	key: string;
	label: string;
	preview: string;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<IdRow<"theme_color_id">>(
		`SELECT theme_color_id FROM web_api.web_theme_color_create($1, $2, $3, $4, $5)`,
		[args.actorDiscordId, args.key, args.label, args.preview, args.enabled],
	);

	return toPositiveInt(result.rows[0]?.theme_color_id);
}

export async function updateThemeColorAdmin(args: {
	actorDiscordId: string;
	themeColorId: number;
	label: string;
	preview: string;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT theme_color_id FROM web_api.web_theme_color_update($1, $2, $3, $4, $5)`,
		[
			args.actorDiscordId,
			args.themeColorId,
			args.label,
			args.preview,
			args.enabled,
		],
	);
}

export async function deleteThemeColorAdmin(
	actorDiscordId: string,
	themeColorId: number,
): Promise<void> {
	await query(`SELECT web_api.web_theme_color_delete($1, $2)`, [
		actorDiscordId,
		themeColorId,
	]);
}

export async function deleteSeriesAdmin(
	actorDiscordId: string,
	seriesId: number,
): Promise<void> {
	await query(`SELECT * FROM web_api.web_series_delete($1, $2)`, [
		actorDiscordId,
		seriesId,
	]);
}

export async function createSeriesAdmin(args: {
	actorDiscordId: string;
	title: string;
	slug: string;
	description: string;
	categoryId: number;
	subcategoryId: number | null;
	readPolicyCode: AdminInheritedReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminInheritedWritePolicyCode;
	writeRank: number | null;
	iconKeyId: number;
	iconColorId: number;
}): Promise<number | null> {
	const result = await query<IdRow<"series_id">>(
		`SELECT * FROM web_api.web_series_create($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		[
			args.actorDiscordId,
			args.title,
			args.slug,
			args.description,
			args.categoryId,
			args.subcategoryId,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.iconKeyId,
			args.iconColorId,
		],
	);

	return toPositiveInt(result.rows[0]?.series_id);
}

export async function updateSeriesAdmin(args: {
	actorDiscordId: string;
	seriesId: number;
	title: string;
	slug: string;
	description: string;
	categoryId: number;
	subcategoryId: number | null;
	readPolicyCode: AdminInheritedReadPolicyCode;
	readRank: number | null;
	writePolicyCode: AdminInheritedWritePolicyCode;
	writeRank: number | null;
	iconKeyId: number;
	iconColorId: number;
}): Promise<void> {
	await query<IdRow<"series_id">>(
		`SELECT * FROM web_api.web_series_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		[
			args.actorDiscordId,
			args.seriesId,
			args.title,
			args.slug,
			args.description,
			args.categoryId,
			args.subcategoryId,
			args.readPolicyCode,
			args.readRank,
			args.writePolicyCode,
			args.writeRank,
			args.iconKeyId,
			args.iconColorId,
		],
	);
}

export async function createTemplateAdmin(args: {
	actorDiscordId: string;
	templateCode: string;
	label: string;
	description: string | null;
	contentKindCode: string;
	surfaceScopeCode: AdminTemplateSurfaceScopeCode;
	requiresSeries: boolean;
	defaultIconKeyId: number;
	defaultIconColorId: number;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<IdRow<"template_id">>(
		`SELECT template_id FROM web_api.web_template_insert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		[
			args.actorDiscordId,
			args.templateCode,
			args.label,
			args.description,
			args.contentKindCode,
			args.surfaceScopeCode,
			args.requiresSeries,
			args.defaultIconKeyId,
			args.defaultIconColorId,
			args.enabled,
		],
	);

	return toPositiveInt(result.rows[0]?.template_id);
}

export async function updateTemplateAdmin(args: {
	actorDiscordId: string;
	templateId: number;
	templateCode: string;
	label: string;
	description: string | null;
	contentKindCode: string;
	surfaceScopeCode: AdminTemplateSurfaceScopeCode;
	requiresSeries: boolean;
	defaultIconKeyId: number;
	defaultIconColorId: number;
	enabled: boolean;
}): Promise<void> {
	await query<IdRow<"template_id">>(
		`SELECT template_id FROM web_api.web_template_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		[
			args.actorDiscordId,
			args.templateId,
			args.templateCode,
			args.label,
			args.description,
			args.contentKindCode,
			args.surfaceScopeCode,
			args.requiresSeries,
			args.defaultIconKeyId,
			args.defaultIconColorId,
			args.enabled,
		],
	);
}


export async function deleteTemplateAdmin(
	actorDiscordId: string,
	templateId: number,
): Promise<void> {
	await query(
		`SELECT template_id FROM web_api.web_template_delete($1, $2)`,
		[actorDiscordId, templateId],
	);
}

export async function deleteTemplateFieldListAdmin(
	actorDiscordId: string,
	fieldListId: number,
): Promise<void> {
	await query(
		`SELECT field_list_id FROM web_api.web_template_field_list_delete($1, $2)`,
		[actorDiscordId, fieldListId],
	);
}

export async function createTemplateFieldListAdmin(args: {
	actorDiscordId: string;
	fieldListCode: string;
	label: string;
	helpText: string | null;
	fieldTypeCode: string;
	renderDestinationCode: AdminTemplateFieldRenderDestinationCode;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<IdRow<"field_list_id">>(
		`SELECT field_list_id FROM web_api.web_template_field_list_insert($1, $2, $3, $4, $5, $6, $7)`,
		[
			args.actorDiscordId,
			args.fieldListCode,
			args.label,
			args.helpText,
			args.fieldTypeCode,
			args.renderDestinationCode,
			args.enabled,
		],
	);

	return toPositiveInt(result.rows[0]?.field_list_id);
}

export async function updateTemplateFieldListAdmin(args: {
	actorDiscordId: string;
	fieldListId: number;
	fieldListCode: string;
	label: string;
	helpText: string | null;
	fieldTypeCode: string;
	renderDestinationCode: AdminTemplateFieldRenderDestinationCode;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_list_id FROM web_api.web_template_field_list_update($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.fieldListId,
			args.fieldListCode,
			args.label,
			args.helpText,
			args.fieldTypeCode,
			args.renderDestinationCode,
			args.enabled,
		],
	);
}

export async function deleteTemplateFieldTypeAdmin(
	actorDiscordId: string,
	fieldTypeCode: string,
): Promise<void> {
	await query(
		`SELECT field_type_code FROM web_api.web_template_field_type_delete($1, $2)`,
		[actorDiscordId, fieldTypeCode],
	);
}

export async function createTemplateFieldTypeAdmin(args: {
	actorDiscordId: string;
	fieldTypeCode: string;
	label: string;
	valueColumnName: string;
	description: string | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_type_code FROM web_api.web_template_field_type_insert($1, $2, $3, $4, $5, $6)`,
		[
			args.actorDiscordId,
			args.fieldTypeCode,
			args.label,
			args.valueColumnName,
			args.description,
			args.enabled,
		],
	);
}

export async function updateTemplateFieldTypeAdmin(args: {
	actorDiscordId: string;
	fieldTypeCode: string;
	label: string;
	valueColumnName: string;
	description: string | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_type_code FROM web_api.web_template_field_type_update($1, $2, $3, $4, $5, $6)`,
		[
			args.actorDiscordId,
			args.fieldTypeCode,
			args.label,
			args.valueColumnName,
			args.description,
			args.enabled,
		],
	);
}

export async function deleteTemplateFieldToolAdmin(
	actorDiscordId: string,
	fieldToolCode: string,
): Promise<void> {
	await query(
		`SELECT field_tool_code FROM web_api.web_template_field_tool_delete($1, $2)`,
		[actorDiscordId, fieldToolCode],
	);
}

export async function createTemplateFieldToolAdmin(args: {
	actorDiscordId: string;
	fieldToolCode: string;
	fieldTypeCode: string;
	label: string;
	toolGroupCode: string;
	displayOrder: number;
	description: string | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_tool_code FROM web_api.web_template_field_tool_insert($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.fieldToolCode,
			args.fieldTypeCode,
			args.label,
			args.toolGroupCode,
			args.displayOrder,
			args.description,
			args.enabled,
		],
	);
}

export async function updateTemplateFieldToolAdmin(args: {
	actorDiscordId: string;
	fieldToolCode: string;
	fieldTypeCode: string;
	label: string;
	toolGroupCode: string;
	displayOrder: number;
	description: string | null;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_tool_code FROM web_api.web_template_field_tool_update($1, $2, $3, $4, $5, $6, $7, $8)`,
		[
			args.actorDiscordId,
			args.fieldToolCode,
			args.fieldTypeCode,
			args.label,
			args.toolGroupCode,
			args.displayOrder,
			args.description,
			args.enabled,
		],
	);
}

export async function deleteTemplateFieldOptionAdmin(
	actorDiscordId: string,
	fieldOptionId: number,
): Promise<void> {
	await query(
		`SELECT field_option_id FROM web_api.web_template_field_option_delete($1, $2)`,
		[actorDiscordId, fieldOptionId],
	);
}

export async function createTemplateFieldOptionAdmin(args: {
	actorDiscordId: string;
	fieldListId: number;
	optionKey: string;
	label: string;
	displayOrder: number;
	enabled: boolean;
}): Promise<number | null> {
	const result = await query<IdRow<"field_option_id">>(
		`SELECT field_option_id FROM web_api.web_template_field_option_insert($1, $2, $3, $4, $5, $6)`,
		[
			args.actorDiscordId,
			args.fieldListId,
			args.optionKey,
			args.label,
			args.displayOrder,
			args.enabled,
		],
	);

	return toPositiveInt(result.rows[0]?.field_option_id);
}

export async function updateTemplateFieldOptionAdmin(args: {
	actorDiscordId: string;
	fieldOptionId: number;
	optionKey: string;
	label: string;
	displayOrder: number;
	enabled: boolean;
}): Promise<void> {
	await query(
		`SELECT field_option_id FROM web_api.web_template_field_option_update($1, $2, $3, $4, $5, $6)`,
		[
			args.actorDiscordId,
			args.fieldOptionId,
			args.optionKey,
			args.label,
			args.displayOrder,
			args.enabled,
		],
	);
}

export async function replaceTemplateFieldListToolsAdmin(args: {
	actorDiscordId: string;
	fieldListId: number;
	fieldToolCodes: string[];
}): Promise<void> {
	await query(
		`SELECT field_list_id FROM web_api.web_template_field_list_tools_replace($1, $2, $3::text[])`,
		[args.actorDiscordId, args.fieldListId, args.fieldToolCodes],
	);
}

export async function deleteTemplateFieldAdmin(args: {
	actorDiscordId: string;
	templateFieldId: number;
	force: boolean;
}): Promise<void> {
	await query(
		args.force
			? `SELECT template_field_id FROM web_api.web_template_field_force_delete($1, $2)`
			: `SELECT template_field_id FROM web_api.web_template_field_delete($1, $2)`,
		[args.actorDiscordId, args.templateFieldId],
	);
}

export async function createTemplateFieldAdmin(args: {
	actorDiscordId: string;
	templateId: number;
	fieldListId: number;
	labelOverride: string | null;
	helpTextOverride: string | null;
	displayOrder: number;
	required: boolean;
	enabled: boolean;
	layoutWidthCode: AdminTemplateFieldLayoutWidthCode;
	layoutAlignCode: AdminTemplateFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: AdminTemplateFieldLabelStyleCode;
	labelPositionCode: AdminTemplateFieldLabelPositionCode;
	labelSeparatorCode: AdminTemplateFieldLabelSeparatorCode;
}): Promise<number | null> {
	const result = await query<IdRow<"template_field_id">>(
		`SELECT template_field_id FROM web_api.web_template_field_insert($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		[
			args.actorDiscordId,
			args.templateId,
			args.fieldListId,
			args.labelOverride,
			args.helpTextOverride,
			args.displayOrder,
			args.required,
			args.enabled,
			args.layoutWidthCode,
			args.layoutAlignCode,
			args.showLabel,
			args.labelStyleCode,
			args.labelPositionCode,
			args.labelSeparatorCode,
		],
	);

	return toPositiveInt(result.rows[0]?.template_field_id);
}

export async function updateTemplateFieldAdmin(args: {
	actorDiscordId: string;
	templateFieldId: number;
	fieldListId: number;
	labelOverride: string | null;
	helpTextOverride: string | null;
	displayOrder: number;
	required: boolean;
	enabled: boolean;
	layoutWidthCode: AdminTemplateFieldLayoutWidthCode;
	layoutAlignCode: AdminTemplateFieldLayoutAlignCode;
	showLabel: boolean;
	labelStyleCode: AdminTemplateFieldLabelStyleCode;
	labelPositionCode: AdminTemplateFieldLabelPositionCode;
	labelSeparatorCode: AdminTemplateFieldLabelSeparatorCode;
}): Promise<void> {
	await query(
		`SELECT template_field_id FROM web_api.web_template_field_update($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		[
			args.actorDiscordId,
			args.templateFieldId,
			args.fieldListId,
			args.labelOverride,
			args.helpTextOverride,
			args.displayOrder,
			args.required,
			args.enabled,
			args.layoutWidthCode,
			args.layoutAlignCode,
			args.showLabel,
			args.labelStyleCode,
			args.labelPositionCode,
			args.labelSeparatorCode,
		],
	);
}
