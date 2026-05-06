//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/navigation.ts                                                                    ////
//// Language: TS                                                                                                ////
//// DB-first admin navigation panel read, mutation, tree, and lookup helpers                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type { IconShape } from "@/lib/helpers/icons";

export type NavigationPanelTypeCode = "header" | "footer" | "mobile" | "custom";
export type NavigationPanelReadPolicyCode = "public" | "min_rank" | "equal_rank";
export type NavigationRendererCode =
	| "page"
	| "map"
	| "tool"
	| "app"
	| "event"
	| "custom"
	| "external_link"
	| "youtube"
	| "stream"
	| "calendar";

export type NavigationTreeIcon = Pick<
	IconShape,
	"id" | "key" | "label" | "source" | "lucideName" | "iconMedia"
>;

export type NavigationTreeIconColor = {
	preview: string | null;
};

export type NavigationPanelAdminItem = {
	id: string;
	panelKey: string;
	label: string;
	panelTypeCode: NavigationPanelTypeCode;
	panelSlotCode: string;
	isDefault: boolean;
	selectionOrder: number;
	readPolicyCode: NavigationPanelReadPolicyCode;
	readRank: number | null;
	maxCategories: number | null;
	maxSubcategoriesPerCategory: number | null;
	maxTargetsPerSubcategory: number | null;
	enabled: boolean;
	createdAt: string;
	updatedAt: string;
	categoryCount: number;
	subcategoryCount: number;
	targetCount: number;
};

export type NavigationPanelTreePanel = Omit<
	NavigationPanelAdminItem,
	"createdAt" | "updatedAt" | "categoryCount" | "subcategoryCount" | "targetCount"
>;

export type NavigationTreeTarget = {
	id: string;
	contentId: string;
	title: string;
	slug: string;
	summary: string | null;
	statusCode: string;
	isEnabled: boolean;
	isSelectable: boolean;
	contentKindCode: string;
	contentKindLabel: string;
	publicRoutePrefix: string | null;
	rendererCode: NavigationRendererCode;
};

export type NavigationTreeSubcategory = {
	id: string;
	subcategoryId: string;
	title: string;
	slug: string;
	isEnabled: boolean;
	isSelectable: boolean;
	content: NavigationTreeTarget[];
};

export type NavigationTreeCategory = {
	id: string;
	categoryId: string;
	title: string;
	slug: string;
	isEnabled: boolean;
	isSelectable: boolean;
	subcategories: NavigationTreeSubcategory[];
};

export type NavigationPanelTree = {
	panel: NavigationPanelTreePanel;
	items: NavigationTreeCategory[];
};

export type NavigationCategoryLookupItem = {
	categoryId: string;
	title: string;
	slug: string;
	isSelectable: boolean;
	readPolicyCode: string;
	readRank: number | null;
	iconKey: NavigationTreeIcon | null;
	iconColor: NavigationTreeIconColor | null;
};

export type NavigationSubcategoryLookupItem = {
	subcategoryId: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	title: string;
	slug: string;
	isSelectable: boolean;
	readPolicyCode: string;
	readRank: number | null;
	iconKey: NavigationTreeIcon | null;
	iconColor: NavigationTreeIconColor | null;
};

export type NavigationContentLookupItem = {
	contentId: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	title: string;
	slug: string;
	summary: string | null;
	statusCode: string;
	isSelectable: boolean;
	readPolicyCode: string;
	readRank: number | null;
	contentKindCode: string;
	contentKindLabel: string;
	publicRoutePrefix: string | null;
	rendererCode: NavigationRendererCode;
	iconKey: NavigationTreeIcon | null;
	iconColor: NavigationTreeIconColor | null;
};

export type NavigationPickerFilterOption = {
	value: string;
	label: string;
};

export type NavigationContentPickerPage = {
	rows: NavigationContentLookupItem[];
	contentKinds: NavigationPickerFilterOption[];
	statuses: NavigationPickerFilterOption[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type NavigationPanelAdminDbRow = {
	navigation_panel_id: number | string;
	panel_key: string;
	label: string;
	panel_type_code: NavigationPanelTypeCode;
	panel_slot_code: string;
	is_default: boolean;
	selection_order: number;
	read_policy_code: NavigationPanelReadPolicyCode;
	read_rank: number | null;
	max_categories: number | null;
	max_subcategories_per_category: number | null;
	max_targets_per_subcategory: number | null;
	is_enabled: boolean;
	created_dt: string | Date;
	updated_dt: string | Date;
	category_count: number;
	subcategory_count: number;
	target_count: number;
};

type NavigationPanelMutationDbRow = {
	navigation_panel_id: number | string;
};

type NavigationPanelTreeDbRow = {
	doc: unknown;
};

type NavigationCategoryLookupDbRow = {
	category_id: number | string;
	title: string;
	slug: string;
	nav_hidden: boolean;
	read_effective_policy_code: string;
	read_effective_rank: number | null;
	icon_key_effective_id: number | string | null;
	icon_key_key: string | null;
	icon_key_label: string | null;
	icon_key_source_code: string | null;
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
	icon_color_preview: string | null;
};

type NavigationSubcategoryLookupDbRow = {
	subcategory_id: number | string;
	category_id: number | string;
	category_title: string;
	category_slug: string;
	title: string;
	slug: string;
	nav_hidden_effective: boolean;
	read_effective_policy_code: string;
	read_effective_rank: number | null;
	icon_key_effective_id: number | string | null;
	icon_key_key: string | null;
	icon_key_label: string | null;
	icon_key_source_code: string | null;
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
	icon_color_preview: string | null;
};

type NavigationContentLookupDbRow = {
	content_id: number | string;
	category_id: number | string;
	category_title: string;
	category_slug: string;
	subcategory_id: number | string | null;
	subcategory_title: string | null;
	subcategory_slug: string | null;
	title: string;
	slug: string;
	summary: string | null;
	status_code: string;
	nav_hidden_effective: boolean;
	read_effective_policy_code: string;
	read_effective_rank: number | null;
	content_kind_code: string;
	content_kind_label: string;
	public_route_prefix: string | null;
	renderer_code: NavigationRendererCode;
	icon_key_effective_id: number | string | null;
	icon_key_key: string | null;
	icon_key_label: string | null;
	icon_key_source_code: string | null;
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
	icon_color_preview: string | null;
};

type NavigationPickerCountDbRow = {
	total_count: string | number;
};

type NavigationPickerOptionDbRow = {
	value: string;
	label: string;
};

function toIsoString(value: string | Date): string {
	return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringField(row: Record<string, unknown>, key: string): string | null {
	const value = row[key];
	return typeof value === "string" ? value : null;
}

function getBooleanField(row: Record<string, unknown>, key: string): boolean | null {
	const value = row[key];
	return typeof value === "boolean" ? value : null;
}

function getNumberField(row: Record<string, unknown>, key: string): number | null {
	const value = row[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNullableNumberField(row: Record<string, unknown>, key: string): number | null {
	const value = row[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getArrayField(row: Record<string, unknown>, key: string): unknown[] {
	const value = row[key];
	return Array.isArray(value) ? value : [];
}

function normalizeRendererCode(value: unknown): NavigationRendererCode {
	return value === "map" ||
		value === "tool" ||
		value === "app" ||
		value === "event" ||
		value === "custom" ||
		value === "external_link" ||
		value === "youtube" ||
		value === "stream" ||
		value === "calendar"
		? value
		: "page";
}

function normalizePanelTypeCode(value: unknown): NavigationPanelTypeCode {
	return value === "footer" || value === "mobile" || value === "custom"
		? value
		: "header";
}

function normalizeReadPolicyCode(value: unknown): NavigationPanelReadPolicyCode {
	return value === "min_rank" || value === "equal_rank" ? value : "public";
}

function mapNavigationPanelRow(
	row: NavigationPanelAdminDbRow,
): NavigationPanelAdminItem {
	return {
		id: String(row.navigation_panel_id),
		panelKey: row.panel_key,
		label: row.label,
		panelTypeCode: row.panel_type_code,
		panelSlotCode: row.panel_slot_code,
		isDefault: row.is_default,
		selectionOrder: row.selection_order,
		readPolicyCode: row.read_policy_code,
		readRank: row.read_rank,
		maxCategories: row.max_categories,
		maxSubcategoriesPerCategory: row.max_subcategories_per_category,
		maxTargetsPerSubcategory: row.max_targets_per_subcategory,
		enabled: row.is_enabled,
		createdAt: toIsoString(row.created_dt),
		updatedAt: toIsoString(row.updated_dt),
		categoryCount: row.category_count,
		subcategoryCount: row.subcategory_count,
		targetCount: row.target_count,
	};
}

function mapTreeTarget(value: unknown): NavigationTreeTarget | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getStringField(value, "id");
	const contentId = getStringField(value, "contentId");
	const title = getStringField(value, "title");
	const slug = getStringField(value, "slug");
	const statusCode = getStringField(value, "statusCode");
	const contentKindCode = getStringField(value, "contentKindCode");
	const contentKindLabel = getStringField(value, "contentKindLabel");

	if (!id || !contentId || !title || !slug || !statusCode || !contentKindCode || !contentKindLabel) {
		return null;
	}

	return {
		id,
		contentId,
		title,
		slug,
		summary: getStringField(value, "summary"),
		statusCode,
		isEnabled: getBooleanField(value, "isEnabled") ?? true,
		isSelectable: getBooleanField(value, "isSelectable") ?? false,
		contentKindCode,
		contentKindLabel,
		publicRoutePrefix: getStringField(value, "publicRoutePrefix"),
		rendererCode: normalizeRendererCode(value.rendererCode),
	};
}

function mapTreeSubcategory(value: unknown): NavigationTreeSubcategory | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getStringField(value, "id");
	const subcategoryId = getStringField(value, "subcategoryId");
	const title = getStringField(value, "title");
	const slug = getStringField(value, "slug");

	if (!id || !subcategoryId || !title || !slug) {
		return null;
	}

	return {
		id,
		subcategoryId,
		title,
		slug,
		isEnabled: getBooleanField(value, "isEnabled") ?? true,
		isSelectable: getBooleanField(value, "isSelectable") ?? false,
		content: getArrayField(value, "content")
			.map(mapTreeTarget)
			.filter((row): row is NavigationTreeTarget => row !== null),
	};
}

function mapTreeCategory(value: unknown): NavigationTreeCategory | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getStringField(value, "id");
	const categoryId = getStringField(value, "categoryId");
	const title = getStringField(value, "title");
	const slug = getStringField(value, "slug");

	if (!id || !categoryId || !title || !slug) {
		return null;
	}

	return {
		id,
		categoryId,
		title,
		slug,
		isEnabled: getBooleanField(value, "isEnabled") ?? true,
		isSelectable: getBooleanField(value, "isSelectable") ?? false,
		subcategories: getArrayField(value, "subcategories")
			.map(mapTreeSubcategory)
			.filter((row): row is NavigationTreeSubcategory => row !== null),
	};
}

function mapTreePanel(value: unknown): NavigationPanelTreePanel | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = getStringField(value, "id");
	const panelKey = getStringField(value, "panelKey");
	const label = getStringField(value, "label");
	const panelSlotCode = getStringField(value, "panelSlotCode");

	if (!id || !panelKey || !label || !panelSlotCode) {
		return null;
	}

	return {
		id,
		panelKey,
		label,
		panelTypeCode: normalizePanelTypeCode(value.panelTypeCode),
		panelSlotCode,
		isDefault: getBooleanField(value, "isDefault") ?? false,
		selectionOrder: getNumberField(value, "selectionOrder") ?? 1,
		readPolicyCode: normalizeReadPolicyCode(value.readPolicyCode),
		readRank: getNullableNumberField(value, "readRank"),
		maxCategories: getNullableNumberField(value, "maxCategories"),
		maxSubcategoriesPerCategory: getNullableNumberField(
			value,
			"maxSubcategoriesPerCategory",
		),
		maxTargetsPerSubcategory: getNullableNumberField(
			value,
			"maxTargetsPerSubcategory",
		),
		enabled: getBooleanField(value, "enabled") ?? true,
	};
}

function mapNavigationTree(value: unknown): NavigationPanelTree | null {
	if (!isRecord(value)) {
		return null;
	}

	const panel = mapTreePanel(value.panel);
	if (!panel) {
		return null;
	}

	return {
		panel,
		items: getArrayField(value, "items")
			.map(mapTreeCategory)
			.filter((row): row is NavigationTreeCategory => row !== null),
	};
}

function mapIcon(row: {
	icon_key_effective_id: number | string | null;
	icon_key_key: string | null;
	icon_key_label: string | null;
	icon_key_source_code: string | null;
	icon_key_lucide_name: string | null;
	icon_media_id: number | string | null;
	icon_media_storage_rel_path: string | null;
}): NavigationTreeIcon | null {
	if (row.icon_key_effective_id === null) {
		return null;
	}

	const source = row.icon_key_source_code === "media" ? "media" : "lucide";

	return {
		id: String(row.icon_key_effective_id),
		key: row.icon_key_key,
		label: row.icon_key_label,
		source,
		lucideName: row.icon_key_lucide_name,
		iconMedia:
			source === "media" && row.icon_media_id !== null
				? {
						id: String(row.icon_media_id),
						storageRelPath: row.icon_media_storage_rel_path,
					}
				: null,
	};
}

function mapIconColor(preview: string | null): NavigationTreeIconColor | null {
	return preview ? { preview } : null;
}

function mapCategoryLookupRow(
	row: NavigationCategoryLookupDbRow,
): NavigationCategoryLookupItem {
	return {
		categoryId: String(row.category_id),
		title: row.title,
		slug: row.slug,
		isSelectable: !row.nav_hidden,
		readPolicyCode: row.read_effective_policy_code,
		readRank: row.read_effective_rank,
		iconKey: mapIcon(row),
		iconColor: mapIconColor(row.icon_color_preview),
	};
}

function mapSubcategoryLookupRow(
	row: NavigationSubcategoryLookupDbRow,
): NavigationSubcategoryLookupItem {
	return {
		subcategoryId: String(row.subcategory_id),
		categoryId: String(row.category_id),
		categoryTitle: row.category_title,
		categorySlug: row.category_slug,
		title: row.title,
		slug: row.slug,
		isSelectable: !row.nav_hidden_effective,
		readPolicyCode: row.read_effective_policy_code,
		readRank: row.read_effective_rank,
		iconKey: mapIcon(row),
		iconColor: mapIconColor(row.icon_color_preview),
	};
}

function mapContentLookupRow(
	row: NavigationContentLookupDbRow,
): NavigationContentLookupItem | null {
	if (row.subcategory_id === null || row.subcategory_title === null || row.subcategory_slug === null) {
		return null;
	}

	return {
		contentId: String(row.content_id),
		categoryId: String(row.category_id),
		categoryTitle: row.category_title,
		categorySlug: row.category_slug,
		subcategoryId: String(row.subcategory_id),
		subcategoryTitle: row.subcategory_title,
		subcategorySlug: row.subcategory_slug,
		title: row.title,
		slug: row.slug,
		summary: row.summary,
		statusCode: row.status_code,
		isSelectable: !row.nav_hidden_effective,
		readPolicyCode: row.read_effective_policy_code,
		readRank: row.read_effective_rank,
		contentKindCode: row.content_kind_code,
		contentKindLabel: row.content_kind_label,
		publicRoutePrefix: row.public_route_prefix,
		rendererCode: normalizeRendererCode(row.renderer_code),
		iconKey: mapIcon(row),
		iconColor: mapIconColor(row.icon_color_preview),
	};
}

export async function listNavigationPanelsAdmin(): Promise<
	NavigationPanelAdminItem[]
> {
	const result = await query<NavigationPanelAdminDbRow>(
		`
			SELECT navigation_panel_id,
				   panel_key,
				   label,
				   panel_type_code,
				   panel_slot_code,
				   is_default,
				   selection_order,
				   read_policy_code,
				   read_rank,
				   max_categories,
				   max_subcategories_per_category,
				   max_targets_per_subcategory,
				   is_enabled,
				   created_dt,
				   updated_dt,
				   category_count,
				   subcategory_count,
				   target_count
			FROM web_view.web_navigation_panels_admin
			ORDER BY panel_slot_code ASC,
					 is_default DESC,
					 selection_order ASC,
					 panel_key ASC
		`,
	);

	return result.rows.map(mapNavigationPanelRow);
}

export async function findNavigationPanelAdminByKey(
	panelKey: string,
): Promise<NavigationPanelAdminItem | null> {
	const result = await query<NavigationPanelAdminDbRow>(
		`
			SELECT navigation_panel_id,
				   panel_key,
				   label,
				   panel_type_code,
				   panel_slot_code,
				   is_default,
				   selection_order,
				   read_policy_code,
				   read_rank,
				   max_categories,
				   max_subcategories_per_category,
				   max_targets_per_subcategory,
				   is_enabled,
				   created_dt,
				   updated_dt,
				   category_count,
				   subcategory_count,
				   target_count
			FROM web_view.web_navigation_panels_admin
			WHERE panel_key = $1
			LIMIT 1
		`,
		[panelKey],
	);

	const row = result.rows[0];
	return row ? mapNavigationPanelRow(row) : null;
}

export async function findNavigationPanelTreeAdmin(
	panelKey: string,
): Promise<NavigationPanelTree | null> {
	const result = await query<NavigationPanelTreeDbRow>(
		`
			SELECT web_api.web_navigation_admin_get($1) AS doc
		`,
		[panelKey],
	);

	return mapNavigationTree(result.rows[0]?.doc ?? null);
}

export async function listNavigationCategoriesLookupAdmin(): Promise<
	NavigationCategoryLookupItem[]
> {
	const result = await query<NavigationCategoryLookupDbRow>(
		`
			SELECT category_id,
				   title,
				   slug,
				   nav_hidden,
				   read_effective_policy_code,
				   read_effective_rank,
				   icon_key_effective_id,
				   icon_key_key,
				   icon_key_label,
				   icon_key_source_code,
				   icon_key_lucide_name,
				   icon_media_id,
				   icon_media_storage_rel_path,
				   icon_color_preview
			FROM web_view.web_navigation_categories_lookup
			ORDER BY title ASC,
					 category_id ASC
		`,
	);

	return result.rows.map(mapCategoryLookupRow);
}

export async function listNavigationSubcategoriesLookupAdmin(): Promise<
	NavigationSubcategoryLookupItem[]
> {
	const result = await query<NavigationSubcategoryLookupDbRow>(
		`
			SELECT subcategory_id,
				   category_id,
				   category_title,
				   category_slug,
				   title,
				   slug,
				   nav_hidden_effective,
				   read_effective_policy_code,
				   read_effective_rank,
				   icon_key_effective_id,
				   icon_key_key,
				   icon_key_label,
				   icon_key_source_code,
				   icon_key_lucide_name,
				   icon_media_id,
				   icon_media_storage_rel_path,
				   icon_color_preview
			FROM web_view.web_navigation_subcategories_lookup
			ORDER BY category_title ASC,
					 title ASC,
					 subcategory_id ASC
		`,
	);

	return result.rows.map(mapSubcategoryLookupRow);
}

export async function listNavigationContentLookupAdmin(): Promise<
	NavigationContentLookupItem[]
> {
	const result = await query<NavigationContentLookupDbRow>(
		`
			SELECT content_id,
				   category_id,
				   category_title,
				   category_slug,
				   subcategory_id,
				   subcategory_title,
				   subcategory_slug,
				   title,
				   slug,
				   summary,
				   status_code,
				   nav_hidden_effective,
				   read_effective_policy_code,
				   read_effective_rank,
				   content_kind_code,
				   content_kind_label,
				   public_route_prefix,
				   renderer_code,
				   icon_key_effective_id,
				   icon_key_key,
				   icon_key_label,
				   icon_key_source_code,
				   icon_key_lucide_name,
				   icon_media_id,
				   icon_media_storage_rel_path,
				   icon_color_preview
			FROM web_view.web_navigation_content_lookup
			ORDER BY category_title ASC,
					 subcategory_title ASC,
					 title ASC,
					 content_id ASC
		`,
	);

	return result.rows
		.map(mapContentLookupRow)
		.filter((row): row is NavigationContentLookupItem => row !== null);
}

export async function listNavigationContentPickerAdmin(args: {
	categoryId: number;
	subcategoryId: number;
	search?: string;
	contentKindCode?: string | null;
	statusCode?: string | null;
	excludedContentIds?: string[];
	page?: number;
	pageSize?: number;
}): Promise<NavigationContentPickerPage> {
	const normalizedSearch = (args.search ?? "").trim();
	const contentKindCode = args.contentKindCode?.trim() || null;
	const statusCode = args.statusCode?.trim() || null;
	const page = Number.isFinite(args.page)
		? Math.max(1, Math.floor(args.page ?? 1))
		: 1;
	const pageSize = Number.isFinite(args.pageSize)
		? Math.min(Math.max(Math.floor(args.pageSize ?? 20), 1), 50)
		: 20;
	const offset = (page - 1) * pageSize;
	const excludedContentIds = args.excludedContentIds ?? [];

	const baseParams = [
		normalizedSearch,
		args.categoryId,
		args.subcategoryId,
		contentKindCode,
		statusCode,
		excludedContentIds,
	];

	const pickerWhere = `
		WHERE nav_hidden_effective = false
		  AND category_id = $2
		  AND subcategory_id = $3
		  AND NOT (content_id = ANY($6::bigint[]))
		  AND ($1 = '' OR title ILIKE '%' || $1 || '%' OR slug ILIKE '%' || $1 || '%')
		  AND ($4::text IS NULL OR content_kind_code = $4)
		  AND ($5::text IS NULL OR status_code = $5)
	`;

	const optionWhere = `
		WHERE nav_hidden_effective = false
		  AND category_id = $1
		  AND subcategory_id = $2
		  AND NOT (content_id = ANY($3::bigint[]))
	`;

	const [countResult, rowsResult, contentKindsResult, statusesResult] = await Promise.all([
		query<NavigationPickerCountDbRow>(
			`
				SELECT COUNT(*)::bigint AS total_count
				FROM web_view.web_navigation_content_lookup
				${pickerWhere}
			`,
			baseParams,
		),
		query<NavigationContentLookupDbRow>(
			`
				SELECT content_id,
					   category_id,
					   category_title,
					   category_slug,
					   subcategory_id,
					   subcategory_title,
					   subcategory_slug,
					   title,
					   slug,
					   summary,
					   status_code,
					   nav_hidden_effective,
					   read_effective_policy_code,
					   read_effective_rank,
					   content_kind_code,
					   content_kind_label,
					   public_route_prefix,
					   renderer_code,
					   icon_key_effective_id,
					   icon_key_key,
					   icon_key_label,
					   icon_key_source_code,
					   icon_key_lucide_name,
					   icon_media_id,
					   icon_media_storage_rel_path,
					   icon_color_preview
				FROM web_view.web_navigation_content_lookup
				${pickerWhere}
				ORDER BY LOWER(title) ASC,
						 content_id ASC
				LIMIT $7 OFFSET $8
			`,
			[...baseParams, pageSize, offset],
		),
		query<NavigationPickerOptionDbRow>(
			`
				SELECT content_kind_code AS value,
					   MAX(content_kind_label) AS label
				FROM web_view.web_navigation_content_lookup
				${optionWhere}
				GROUP BY content_kind_code
				ORDER BY MAX(content_kind_label) ASC,
						 content_kind_code ASC
			`,
			[args.categoryId, args.subcategoryId, excludedContentIds],
		),
		query<NavigationPickerOptionDbRow>(
			`
				SELECT status_code AS value,
					   status_code AS label
				FROM web_view.web_navigation_content_lookup
				${optionWhere}
				GROUP BY status_code
				ORDER BY status_code ASC
			`,
			[args.categoryId, args.subcategoryId, excludedContentIds],
		),
	]);

	const totalDocs = Number(countResult.rows[0]?.total_count ?? 0);
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 1;

	return {
		rows: rowsResult.rows
			.map(mapContentLookupRow)
			.filter((row): row is NavigationContentLookupItem => row !== null),
		contentKinds: contentKindsResult.rows.map((row) => ({
			value: row.value,
			label: row.label,
		})),
		statuses: statusesResult.rows.map((row) => ({
			value: row.value,
			label: row.label,
		})),
		page,
		pageSize,
		totalDocs,
		totalPages,
	};
}

export async function saveNavigationPanelAdmin(args: {
	actorDiscordId: string;
	panelKey: string;
	label: string;
	panelTypeCode: NavigationPanelTypeCode;
	panelSlotCode: string;
	isDefault: boolean;
	selectionOrder: number;
	readPolicyCode: NavigationPanelReadPolicyCode;
	readRank: number | null;
	maxCategories: number | null;
	maxSubcategoriesPerCategory: number | null;
	maxTargetsPerSubcategory: number | null;
	enabled: boolean;
}): Promise<string | null> {
	const result = await query<NavigationPanelMutationDbRow>(
		`
			SELECT navigation_panel_id
			FROM web_api.web_navigation_panel_save_admin(
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
			)
		`,
		[
			args.actorDiscordId,
			args.panelKey,
			args.label,
			args.panelTypeCode,
			args.panelSlotCode,
			args.isDefault,
			args.selectionOrder,
			args.readPolicyCode,
			args.readRank,
			args.maxCategories,
			args.maxSubcategoriesPerCategory,
			args.maxTargetsPerSubcategory,
			args.enabled,
		],
	);

	const navigationPanelId = result.rows[0]?.navigation_panel_id ?? null;
	return navigationPanelId === null ? null : String(navigationPanelId);
}

export async function replaceNavigationPanelTreeAdmin(args: {
	actorDiscordId: string;
	panelKey: string;
	items: unknown[];
}): Promise<string | null> {
	const result = await query<NavigationPanelMutationDbRow>(
		`
			SELECT navigation_panel_id
			FROM web_api.web_navigation_admin_replace_panel($1, $2, $3::jsonb)
		`,
		[args.actorDiscordId, args.panelKey, JSON.stringify(args.items)],
	);

	const navigationPanelId = result.rows[0]?.navigation_panel_id ?? null;
	return navigationPanelId === null ? null : String(navigationPanelId);
}

export async function deleteNavigationPanelAdmin(args: {
	actorDiscordId: string;
	panelKey: string;
}): Promise<void> {
	await query<NavigationPanelMutationDbRow>(
		`
			SELECT navigation_panel_id
			FROM web_api.web_navigation_panel_delete_admin($1, $2)
		`,
		[args.actorDiscordId, args.panelKey],
	);
}
