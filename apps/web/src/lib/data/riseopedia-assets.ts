//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-assets.ts                                                          ////
//// Language: TS                                                                                             ////
//// DB-first public Riseopedia asset list and detail helpers for the public API.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import {
	mapEntitySectionRefRow,
	type RiseopediaEntitySectionRef,
	type RiseopediaEntitySectionRefRow,
} from "@/lib/data/riseopedia-sections";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type RiseopediaAssetDoc = {
	id: string;
	canonicalAssetKey: string;
	name: string;
	slug: string;
	summary: string | null;
	description: string | null;
	assetClassCode: string;
	assetClassName: string;
	categoryCode: string | null;
	categoryName: string | null;
	categorySlug: string | null;
	subcategoryCode: string | null;
	subcategoryName: string | null;
	subcategorySlug: string | null;
	primaryBrandCode: string | null;
	primaryBrandName: string | null;
	sourceStatusCode: string;
	assetStatusCode: string;
	visibilityCode: string;
	effectiveVisibilityCode: string;
	listable: boolean;
	detailAllowed: boolean;
	searchable: boolean;
	rarityCode: string | null;
	stackSize: number | null;
	slotWidth: number | null;
	slotHeight: number | null;
	valueAmount: number | null;
	lastSeenPatchCode: string | null;
	iconMedia: RiseopediaMediaRef | null;
	detailMedia: RiseopediaMediaRef | null;
	updatedAt: string | null;
};

export type RiseopediaAssetProperty = {
	assetId: string;
	canonicalAssetKey: string;
	propertyCode: string;
	propertyName: string;
	dataTypeCode: string;
	renderGroupCode: string;
	filterModeCode: string;
	isFilterable: boolean;
	valueText: string | null;
	valueInteger: number | null;
	valueNumeric: number | null;
	valueBoolean: boolean | null;
	valueJson: unknown;
	displayValue: string | null;
	unitCode: string | null;
	sourceFieldPath: string | null;
	updatedAt: string | null;
};

export type RiseopediaAssetRarity = {
	assetId: string;
	canonicalAssetKey: string;
	rarityCode: string;
	rarityName: string;
	raritySlug: string;
	sortOrder: number;
	sourceRowCount: number;
	variantCount: number;
	hasPrimarySource: boolean;
};

export type RiseopediaAssetStateProperty = {
	assetId: string;
	canonicalAssetKey: string;
	rarityCode: string;
	rarityName: string;
	variantKey: string;
	variantLabel: string | null;
	displayProfileId: string;
	displayProfileCode: string;
	displayProfileName: string;
	displayProfilePropertyId: string;
	propertyCatalogId: string;
	propertyCode: string;
	displayLabel: string;
	propertyName: string;
	description: string | null;
	propertyOriginCode: string;
	dataTypeCode: string;
	unitCode: string | null;
	displaySlotCode: string;
	displaySlotName: string;
	groupCode: string;
	sortOrder: number;
	compact: boolean;
	featured: boolean;
	valueText: string | null;
	displayValue: string;
};

export type RiseopediaAssetRecipeRef = {
	assetId: string;
	canonicalAssetKey: string;
	recipeId: string;
	recipeKey: string;
	recipeName: string;
	recipeSlug: string;
	benchCode: string | null;
	benchName: string | null;
	craftingTier: number | null;
	durationSeconds: number | null;
	xpValue: number | null;
	quantityValue: number | null;
	quantityText: string | null;
	primary: boolean | null;
};

export type RiseopediaAssetVariant = {
	assetVariantId: string;
	variantKey: string;
	variantStateSlug: string;
	variantRoleCode: string;
	variantLabel: string | null;
	sortOrder: number;
	parentAssetId: string;
	parentCanonicalAssetKey: string;
	parentName: string;
	parentSlug: string;
	variantAssetId: string;
	variantCanonicalAssetKey: string;
	variantName: string;
	variantSlug: string;
	variantRarityCode: string | null;
	isCurrentAsset: boolean;
	iconMedia: RiseopediaMediaRef | null;
	detailMedia: RiseopediaMediaRef | null;
};

export type RiseopediaAssetListFilters = {
	search: string | null;
	section: string | null;
	assetClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	brandCode: string | null;
	page: number;
	pageSize: number;
};

export type RiseopediaAssetListResult = {
	rows: RiseopediaAssetDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type RiseopediaAssetRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	asset_name: string;
	asset_slug: string;
	summary: string | null;
	description: string | null;
	asset_class_code: string;
	asset_class_name: string;
	asset_category_code: string | null;
	asset_category_name: string | null;
	asset_category_slug: string | null;
	asset_subcategory_code: string | null;
	asset_subcategory_name: string | null;
	asset_subcategory_slug: string | null;
	primary_brand_code: string | null;
	primary_brand_name: string | null;
	source_status_code: string;
	asset_status_code: string;
	visibility_code: string;
	effective_visibility_code: string;
	listable_flag: boolean;
	detail_allowed_flag: boolean;
	searchable_flag: boolean;
	rarity_code: string | null;
	stack_size: number | null;
	slot_width: number | null;
	slot_height: number | null;
	value_amount: string | number | null;
	last_seen_patch_code: string | null;
	icon_media_id: string | number | null;
	icon_media_width_px: number | null;
	icon_media_height_px: number | null;
	icon_media_mime_type: string | null;
	detail_media_id: string | number | null;
	detail_media_width_px: number | null;
	detail_media_height_px: number | null;
	detail_media_mime_type: string | null;
	updated_dt: Date | string | null;
	total_count?: string | number;
};

type RiseopediaAssetPropertyRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	property_code: string;
	property_name: string;
	data_type_code: string;
	render_group_code: string;
	filter_mode_code: string;
	is_filterable: boolean;
	value_text: string | null;
	value_integer: number | null;
	value_numeric: string | number | null;
	value_boolean: boolean | null;
	value_json: unknown;
	display_value: string | null;
	unit_code: string | null;
	source_field_path: string | null;
	updated_dt: Date | string | null;
};

type RiseopediaAssetRecipeRefRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	recipe_id: string | number;
	recipe_key: string;
	recipe_name: string;
	recipe_slug: string;
	bench_code: string | null;
	bench_name: string | null;
	crafting_tier: number | null;
	duration_seconds: string | number | null;
	xp_value: string | number | null;
	quantity_value: string | number | null;
	quantity_text: string | null;
	primary_flag?: boolean | null;
};

type RiseopediaAssetRarityRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	rarity_code: string;
	rarity_name: string;
	rarity_slug: string;
	sort_order: string | number;
	source_row_count: string | number;
	variant_count: string | number;
	has_primary_source_flag: boolean;
};

type RiseopediaAssetStatePropertyRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	rarity_code: string;
	rarity_name: string;
	variant_key: string | null;
	variant_label: string | null;
	display_profile_id: string | number;
	display_profile_code: string;
	display_profile_name: string;
	display_profile_property_id: string | number;
	property_catalog_id: string | number;
	property_code: string;
	display_label: string;
	property_name: string;
	description: string | null;
	property_origin_code: string;
	data_type_code: string;
	unit_code: string | null;
	display_slot_code: string;
	display_slot_name: string;
	group_code: string;
	sort_order: string | number;
	compact_flag: boolean;
	featured_flag: boolean;
	value_text: string | null;
	display_value: string;
};

type RiseopediaAssetVariantRow = {
	asset_variant_id: string | number;
	variant_key: string;
	variant_state_slug: string;
	variant_role_code: string;
	variant_label: string | null;
	sort_order: string | number;
	parent_asset_id: string | number;
	parent_canonical_asset_key: string;
	parent_asset_name: string;
	parent_asset_slug: string;
	variant_asset_id: string | number;
	variant_canonical_asset_key: string;
	variant_asset_name: string;
	variant_asset_slug: string;
	variant_rarity_code: string | null;
	is_current_asset: boolean;
	icon_media_id: string | number | null;
	icon_media_width_px: number | null;
	icon_media_height_px: number | null;
	icon_media_mime_type: string | null;
	detail_media_id: string | number | null;
	detail_media_width_px: number | null;
	detail_media_height_px: number | null;
	detail_media_mime_type: string | null;
};

const RISEOPEDIA_ASSET_SELECT_COLUMNS = `asset_id,
		canonical_asset_key,
		asset_name,
		asset_slug,
		summary,
		description,
		asset_class_code,
		asset_class_name,
		asset_category_code,
		asset_category_name,
		asset_category_slug,
		asset_subcategory_code,
		asset_subcategory_name,
		asset_subcategory_slug,
		primary_brand_code,
		primary_brand_name,
		source_status_code,
		asset_status_code,
		visibility_code,
		effective_visibility_code,
		listable_flag,
		detail_allowed_flag,
		searchable_flag,
		rarity_code,
		stack_size,
		slot_width,
		slot_height,
		value_amount,
		last_seen_patch_code,
		icon_media_id,
		icon_media_width_px,
		icon_media_height_px,
		icon_media_mime_type,
		detail_media_id,
		detail_media_width_px,
		detail_media_height_px,
		detail_media_mime_type,
		updated_dt`;

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function toNullableNumber(value: string | number | null): number | null {
	if (value === null) {
		return null;
	}

	const parsed = toNumber(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function toIsoString(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function mapMediaRef(args: {
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): RiseopediaMediaRef | null {
	if (args.mediaId === null) {
		return null;
	}

	const mediaId = String(args.mediaId);

	return {
		mediaId,
		url: buildRiseopediaMediaFileUrl(mediaId),
		width: args.width,
		height: args.height,
		mimeType: args.mimeType,
	};
}

function mapAssetRow(row: RiseopediaAssetRow): RiseopediaAssetDoc {
	return {
		id: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		name: row.asset_name,
		slug: row.asset_slug,
		summary: row.summary,
		description: row.description,
		assetClassCode: row.asset_class_code,
		assetClassName: row.asset_class_name,
		categoryCode: row.asset_category_code,
		categoryName: row.asset_category_name,
		categorySlug: row.asset_category_slug,
		subcategoryCode: row.asset_subcategory_code,
		subcategoryName: row.asset_subcategory_name,
		subcategorySlug: row.asset_subcategory_slug,
		primaryBrandCode: row.primary_brand_code,
		primaryBrandName: row.primary_brand_name,
		sourceStatusCode: row.source_status_code,
		assetStatusCode: row.asset_status_code,
		visibilityCode: row.visibility_code,
		effectiveVisibilityCode: row.effective_visibility_code,
		listable: row.listable_flag,
		detailAllowed: row.detail_allowed_flag,
		searchable: row.searchable_flag,
		rarityCode: row.rarity_code,
		stackSize: row.stack_size,
		slotWidth: row.slot_width,
		slotHeight: row.slot_height,
		valueAmount: toNullableNumber(row.value_amount),
		lastSeenPatchCode: row.last_seen_patch_code,
		iconMedia: mapMediaRef({
			mediaId: row.icon_media_id,
			width: row.icon_media_width_px,
			height: row.icon_media_height_px,
			mimeType: row.icon_media_mime_type,
		}),
		detailMedia: mapMediaRef({
			mediaId: row.detail_media_id,
			width: row.detail_media_width_px,
			height: row.detail_media_height_px,
			mimeType: row.detail_media_mime_type,
		}),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapPropertyRow(row: RiseopediaAssetPropertyRow): RiseopediaAssetProperty {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		propertyCode: row.property_code,
		propertyName: row.property_name,
		dataTypeCode: row.data_type_code,
		renderGroupCode: row.render_group_code,
		filterModeCode: row.filter_mode_code,
		isFilterable: row.is_filterable,
		valueText: row.value_text,
		valueInteger: row.value_integer,
		valueNumeric: toNullableNumber(row.value_numeric),
		valueBoolean: row.value_boolean,
		valueJson: row.value_json,
		displayValue: row.display_value,
		unitCode: row.unit_code,
		sourceFieldPath: row.source_field_path,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapAssetRarityRow(row: RiseopediaAssetRarityRow): RiseopediaAssetRarity {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		rarityCode: row.rarity_code,
		rarityName: row.rarity_name,
		raritySlug: row.rarity_slug,
		sortOrder: toNumber(row.sort_order),
		sourceRowCount: toNumber(row.source_row_count),
		variantCount: toNumber(row.variant_count),
		hasPrimarySource: row.has_primary_source_flag,
	};
}

function mapAssetStatePropertyRow(
	row: RiseopediaAssetStatePropertyRow,
): RiseopediaAssetStateProperty {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		rarityCode: row.rarity_code,
		rarityName: row.rarity_name,
		variantKey: row.variant_key ?? "base",
		variantLabel: row.variant_label,
		displayProfileId: String(row.display_profile_id),
		displayProfileCode: row.display_profile_code,
		displayProfileName: row.display_profile_name,
		displayProfilePropertyId: String(row.display_profile_property_id),
		propertyCatalogId: String(row.property_catalog_id),
		propertyCode: row.property_code,
		displayLabel: row.display_label,
		propertyName: row.property_name,
		description: row.description,
		propertyOriginCode: row.property_origin_code,
		dataTypeCode: row.data_type_code,
		unitCode: row.unit_code,
		displaySlotCode: row.display_slot_code,
		displaySlotName: row.display_slot_name,
		groupCode: row.group_code,
		sortOrder: toNumber(row.sort_order),
		compact: row.compact_flag,
		featured: row.featured_flag,
		valueText: row.value_text,
		displayValue: row.display_value,
	};
}

function mapAssetRecipeRefRow(row: RiseopediaAssetRecipeRefRow): RiseopediaAssetRecipeRef {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		recipeId: String(row.recipe_id),
		recipeKey: row.recipe_key,
		recipeName: row.recipe_name,
		recipeSlug: row.recipe_slug,
		benchCode: row.bench_code,
		benchName: row.bench_name,
		craftingTier: row.crafting_tier,
		durationSeconds: toNullableNumber(row.duration_seconds),
		xpValue: toNullableNumber(row.xp_value),
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		primary: row.primary_flag ?? null,
	};
}

function mapAssetVariantRow(row: RiseopediaAssetVariantRow): RiseopediaAssetVariant {
	return {
		assetVariantId: String(row.asset_variant_id),
		variantKey: row.variant_key,
		variantStateSlug: row.variant_state_slug,
		variantRoleCode: row.variant_role_code,
		variantLabel: row.variant_label,
		sortOrder: toNumber(row.sort_order),
		parentAssetId: String(row.parent_asset_id),
		parentCanonicalAssetKey: row.parent_canonical_asset_key,
		parentName: row.parent_asset_name,
		parentSlug: row.parent_asset_slug,
		variantAssetId: String(row.variant_asset_id),
		variantCanonicalAssetKey: row.variant_canonical_asset_key,
		variantName: row.variant_asset_name,
		variantSlug: row.variant_asset_slug,
		variantRarityCode: row.variant_rarity_code,
		isCurrentAsset: row.is_current_asset,
		iconMedia: mapMediaRef({
			mediaId: row.icon_media_id,
			width: row.icon_media_width_px,
			height: row.icon_media_height_px,
			mimeType: row.icon_media_mime_type,
		}),
		detailMedia: mapMediaRef({
			mediaId: row.detail_media_id,
			width: row.detail_media_width_px,
			height: row.detail_media_height_px,
			mimeType: row.detail_media_mime_type,
		}),
	};
}

function normalizeSearch(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized ? `%${normalized}%` : null;
}

export async function listRiseopediaAssets(
	filters: RiseopediaAssetListFilters,
): Promise<RiseopediaAssetListResult> {
	const filterValues = [
		normalizeSearch(filters.search),
		filters.section,
		filters.assetClassCode,
		filters.categorySlug,
		filters.subcategorySlug,
		filters.brandCode,
	];
	const countResult = await query<{ total_count: string | number }>(
		`SELECT COUNT(*)::bigint AS total_count
		 FROM web_view.riseopedia_asset_browse_rows assets
		 WHERE ($1::text IS NULL OR assets.asset_name ILIKE $1 OR assets.canonical_asset_key ILIKE $1)
		   AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.riseopedia_asset_browse_section_memberships membership
				WHERE membership.asset_id = assets.asset_id
				  AND (membership.section_code = $2 OR membership.section_slug = $2)
			))
		   AND ($3::text IS NULL OR assets.asset_class_code = $3)
		   AND ($4::text IS NULL OR assets.asset_category_slug = $4)
		   AND ($5::text IS NULL OR assets.asset_subcategory_slug = $5)
		   AND ($6::text IS NULL OR assets.primary_brand_code = $6)`,
		filterValues,
	);
	const totalDocs = countResult.rows[0]
		? toNumber(countResult.rows[0].total_count)
		: 0;
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / filters.pageSize) : 0;
	const page = totalPages > 0 ? Math.min(filters.page, totalPages) : filters.page;
	const offset = (page - 1) * filters.pageSize;
	const result = await query<RiseopediaAssetRow>(
		`SELECT ${RISEOPEDIA_ASSET_SELECT_COLUMNS}
		 FROM web_view.riseopedia_asset_browse_rows assets
		 WHERE ($1::text IS NULL OR assets.asset_name ILIKE $1 OR assets.canonical_asset_key ILIKE $1)
		   AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.riseopedia_asset_browse_section_memberships membership
				WHERE membership.asset_id = assets.asset_id
				  AND (membership.section_code = $2 OR membership.section_slug = $2)
			))
		   AND ($3::text IS NULL OR assets.asset_class_code = $3)
		   AND ($4::text IS NULL OR assets.asset_category_slug = $4)
		   AND ($5::text IS NULL OR assets.asset_subcategory_slug = $5)
		   AND ($6::text IS NULL OR assets.primary_brand_code = $6)
		 ORDER BY assets.asset_name,
				  assets.asset_id
		 LIMIT $7
		 OFFSET $8`,
		[...filterValues, filters.pageSize, offset],
	);

	return {
		rows: result.rows.map(mapAssetRow),
		page,
		pageSize: filters.pageSize,
		totalDocs,
		totalPages,
	};
}

export async function findRiseopediaAssetBySlug(
	slug: string,
): Promise<RiseopediaAssetDoc | null> {
	const result = await query<RiseopediaAssetRow>(
		`SELECT ${RISEOPEDIA_ASSET_SELECT_COLUMNS}
		 FROM web_view.riseopedia_asset_browse_rows
		 WHERE asset_slug = $1
		 LIMIT 1`,
		[slug],
	);

	const row = result.rows[0] ?? null;
	return row ? mapAssetRow(row) : null;
}

export async function listRiseopediaAssetSections(
	assetId: string,
): Promise<RiseopediaEntitySectionRef[]> {
	const result = await query<RiseopediaEntitySectionRefRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				section_sort_order,
				rule_sort_order
		 FROM web_view.riseopedia_asset_browse_section_memberships
		 WHERE asset_id = $1::bigint
		 ORDER BY section_sort_order,
				  rule_sort_order,
				  section_name,
				  section_id`,
		[assetId],
	);

	return result.rows.map(mapEntitySectionRefRow);
}

export async function listRiseopediaAssetRarities(
	assetId: string,
): Promise<RiseopediaAssetRarity[]> {
	const result = await query<RiseopediaAssetRarityRow>(
		`SELECT asset_id,
				canonical_asset_key,
				rarity_code,
				rarity_name,
				rarity_slug,
				sort_order,
				source_row_count,
				variant_count,
				has_primary_source_flag
		 FROM web_view.riseopedia_asset_detail_rarity_rows
		 WHERE asset_id = $1::bigint
		 ORDER BY sort_order,
				  rarity_name`,
		[assetId],
	);

	return result.rows.map(mapAssetRarityRow);
}

export async function listRiseopediaAssetProperties(
	assetId: string,
): Promise<RiseopediaAssetProperty[]> {
	const result = await query<RiseopediaAssetPropertyRow>(
		`SELECT asset_id,
				canonical_asset_key,
				property_code,
				property_name,
				data_type_code,
				render_group_code,
				filter_mode_code,
				is_filterable,
				value_text,
				value_integer,
				value_numeric,
				value_boolean,
				value_json,
				display_value,
				unit_code,
				source_field_path,
				updated_dt
		 FROM web_view.riseopedia_asset_detail_property_rows
		 WHERE asset_id = $1::bigint
		 ORDER BY render_group_code,
				  property_name,
				  property_code`,
		[assetId],
	);

	return result.rows.map(mapPropertyRow);
}

export async function listRiseopediaAssetStateProperties(
	assetId: string,
): Promise<RiseopediaAssetStateProperty[]> {
	const result = await query<RiseopediaAssetStatePropertyRow>(
		`SELECT asset_id,
				canonical_asset_key,
				rarity_code,
				rarity_name,
				variant_key,
				variant_label,
				display_profile_id,
				display_profile_code,
				display_profile_name,
				display_profile_property_id,
				property_catalog_id,
				property_code,
				display_label,
				property_name,
				description,
				property_origin_code,
				data_type_code,
				unit_code,
				display_slot_code,
				display_slot_name,
				group_code,
				sort_order,
				compact_flag,
				featured_flag,
				value_text,
				display_value
		 FROM web_view.riseopedia_asset_detail_state_property_rows
		 WHERE asset_id = $1::bigint
		 ORDER BY rarity_sort_order,
				  variant_key,
				  display_slot_code,
				  group_code,
				  sort_order,
				  display_label,
				  property_code`,
		[assetId],
	);

	return result.rows.map(mapAssetStatePropertyRow);
}

export async function listRiseopediaAssetVariants(
	assetId: string,
): Promise<RiseopediaAssetVariant[]> {
	const result = await query<RiseopediaAssetVariantRow>(
		`SELECT variants.asset_variant_id,
				variants.variant_key,
				variants.variant_state_slug,
				variants.variant_role_code,
				variants.variant_label,
				variants.sort_order,
				variants.parent_asset_id,
				variants.parent_canonical_asset_key,
				variants.parent_asset_name,
				variants.parent_asset_slug,
				variants.variant_asset_id,
				variants.variant_canonical_asset_key,
				variants.variant_asset_name,
				variants.variant_asset_slug,
				variants.variant_rarity_code,
				(variants.variant_asset_id = $1::bigint) AS is_current_asset,
				variants.icon_media_id,
				variants.icon_media_width_px,
				variants.icon_media_height_px,
				variants.icon_media_mime_type,
				variants.detail_media_id,
				variants.detail_media_width_px,
				variants.detail_media_height_px,
				variants.detail_media_mime_type
		 FROM web_view.riseopedia_asset_detail_variant_rows variants
		 WHERE variants.parent_asset_id IN (
				SELECT $1::bigint AS parent_asset_id
				UNION
				SELECT related.parent_asset_id
				FROM web_view.riseopedia_asset_detail_variant_rows related
				WHERE related.variant_asset_id = $1::bigint
			)
		 ORDER BY variants.variant_asset_id,
				  variants.variant_role_code,
				  variants.sort_order,
				  variants.variant_asset_name,
				  variants.asset_variant_id`,
		[assetId],
	);

	return result.rows
		.map(mapAssetVariantRow)
		.sort((left, right) => {
			if (left.sortOrder !== right.sortOrder) {
				return left.sortOrder - right.sortOrder;
			}

			const nameCompare = left.variantName.localeCompare(right.variantName);
			if (nameCompare !== 0) {
				return nameCompare;
			}

			return left.assetVariantId.localeCompare(right.assetVariantId);
		});
}

export async function listRecipesUsingRiseopediaAsset(
	assetId: string,
): Promise<RiseopediaAssetRecipeRef[]> {
	const result = await query<RiseopediaAssetRecipeRefRow>(
		`SELECT asset_id,
				canonical_asset_key,
				recipe_id,
				recipe_key,
				recipe_name,
				recipe_slug,
				bench_code,
				bench_name,
				crafting_tier,
				duration_seconds,
				xp_value,
				quantity_value,
				quantity_text,
				NULL::boolean AS primary_flag
		 FROM web_view.riseopedia_asset_used_in_recipe_rows
		 WHERE asset_id = $1::bigint
		 ORDER BY recipe_name,
				  recipe_id`,
		[assetId],
	);

	return result.rows.map(mapAssetRecipeRefRow);
}

export async function listRecipesCraftingRiseopediaAsset(
	assetId: string,
): Promise<RiseopediaAssetRecipeRef[]> {
	const result = await query<RiseopediaAssetRecipeRefRow>(
		`SELECT asset_id,
				canonical_asset_key,
				recipe_id,
				recipe_key,
				recipe_name,
				recipe_slug,
				bench_code,
				bench_name,
				crafting_tier,
				duration_seconds,
				xp_value,
				quantity_value,
				quantity_text,
				primary_flag
		 FROM web_view.riseopedia_asset_crafted_by_recipe_rows
		 WHERE asset_id = $1::bigint
		 ORDER BY primary_flag DESC,
				  recipe_name,
				  recipe_id`,
		[assetId],
	);

	return result.rows.map(mapAssetRecipeRefRow);
}


export async function listRecipesCraftingRiseopediaAssets(
	assetIds: string[],
): Promise<Map<string, RiseopediaAssetRecipeRef[]>> {
	const uniqueAssetIds = Array.from(
		new Set(assetIds.filter((assetId) => /^\d+$/.test(assetId))),
	);
	const rowsByAssetId = new Map<string, RiseopediaAssetRecipeRef[]>();

	for (const assetId of uniqueAssetIds) {
		rowsByAssetId.set(assetId, []);
	}

	if (uniqueAssetIds.length === 0) {
		return rowsByAssetId;
	}

	const result = await query<RiseopediaAssetRecipeRefRow>(
		`SELECT asset_id,
				canonical_asset_key,
				recipe_id,
				recipe_key,
				recipe_name,
				recipe_slug,
				bench_code,
				bench_name,
				crafting_tier,
				duration_seconds,
				xp_value,
				quantity_value,
				quantity_text,
				primary_flag
		 FROM web_view.riseopedia_asset_crafted_by_recipe_rows
		 WHERE asset_id = ANY($1::bigint[])
		 ORDER BY asset_id,
				  primary_flag DESC,
				  recipe_name,
				  recipe_id`,
		[uniqueAssetIds],
	);

	for (const row of result.rows) {
		const assetId = String(row.asset_id);
		const rows = rowsByAssetId.get(assetId) ?? [];
		rows.push(mapAssetRecipeRefRow(row));
		rowsByAssetId.set(assetId, rows);
	}

	return rowsByAssetId;
}
