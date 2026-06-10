//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-assets.ts                                                          ////
//// Language: TS                                                                                              ////
//// DB-first public Mafiosopedia asset list and detail helpers for public and card-rule driven overviews.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import {
	mapMafiosopediaCardProperties,
	normalizeMafiosopediaCardMode,
	type MafiosopediaCardProperty,
	type MafiosopediaOverviewCardMode,
} from "@/lib/data/mafiosopedia-card-properties";
import { query } from "@/lib/data/pg";
import {
	mapEntitySectionRefRow,
	type MafiosopediaEntitySectionRef,
	type MafiosopediaEntitySectionRefRow,
} from "@/lib/data/mafiosopedia-sections";
import { buildMafiosopediaMediaFileUrl } from "@/lib/helpers/mafiosopedia-media-files";

export type MafiosopediaMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type { MafiosopediaCardProperty, MafiosopediaOverviewCardMode };

export type MafiosopediaAssetDoc = {
	id: string;
	entityId: string | null;
	entityTypeCode: string;
	entityTypeName: string | null;
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
	iconMedia: MafiosopediaMediaRef | null;
	detailMedia: MafiosopediaMediaRef | null;
	cardMode: MafiosopediaOverviewCardMode;
	cardProperties: MafiosopediaCardProperty[];
	updatedAt: string | null;
};

export type MafiosopediaAssetListFilters = {
	search: string | null;
	section: string | null;
	assetClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	brandCode: string | null;
	cardPlacementCode?: string | null;
	page: number;
	pageSize: number;
};

export type MafiosopediaAssetListResult = {
	rows: MafiosopediaAssetDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type MafiosopediaAssetRow = {
	asset_id: string | number;
	entity_id: string | number | null;
	entity_type_code: string | null;
	entity_type_name: string | null;
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
	resolved_card_mode_code: string | null;
	card_properties: unknown;
	total_count?: string | number;
};

const MAFIOSOPEDIA_ASSET_SELECT_COLUMNS = `asset_id,
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

function toNullableStringId(value: string | number | null): string | null {
	return value === null ? null : String(value);
}

function mapMediaRef(args: {
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): MafiosopediaMediaRef | null {
	if (args.mediaId === null) {
		return null;
	}

	const mediaId = String(args.mediaId);

	return {
		mediaId,
		url: buildMafiosopediaMediaFileUrl(mediaId),
		width: args.width,
		height: args.height,
		mimeType: args.mimeType,
	};
}

function mapAssetRow(row: MafiosopediaAssetRow): MafiosopediaAssetDoc {
	return {
		id: String(row.asset_id),
		entityId: toNullableStringId(row.entity_id),
		entityTypeCode: row.entity_type_code ?? "asset",
		entityTypeName: row.entity_type_name,
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
		cardMode: normalizeMafiosopediaCardMode(row.resolved_card_mode_code),
		cardProperties: mapMafiosopediaCardProperties(row.card_properties),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function normalizeSearch(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized ? `%${normalized}%` : null;
}

function normalizePlacement(value: string | null | undefined): string {
	const normalized = value?.trim();
	return normalized && /^[a-z0-9][a-z0-9_]*$/.test(normalized) ? normalized : "hub";
}

export async function listMafiosopediaAssets(
	filters: MafiosopediaAssetListFilters,
): Promise<MafiosopediaAssetListResult> {
	const cardPlacementCode = normalizePlacement(filters.cardPlacementCode);
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
		 FROM web_view.mafiosopedia_asset_browse_rows assets
		 WHERE ($1::text IS NULL OR assets.asset_name ILIKE $1 OR assets.canonical_asset_key ILIKE $1)
		   AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.mafiosopedia_asset_browse_section_memberships membership
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
	const result = await query<MafiosopediaAssetRow>(
		`WITH filtered_assets AS (
			SELECT ${MAFIOSOPEDIA_ASSET_SELECT_COLUMNS}
			FROM web_view.mafiosopedia_asset_browse_rows assets
			WHERE ($1::text IS NULL OR assets.asset_name ILIKE $1 OR assets.canonical_asset_key ILIKE $1)
			  AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.mafiosopedia_asset_browse_section_memberships membership
				WHERE membership.asset_id = assets.asset_id
				  AND (membership.section_code = $2 OR membership.section_slug = $2)
			))
			  AND ($3::text IS NULL OR assets.asset_class_code = $3)
			  AND ($4::text IS NULL OR assets.asset_category_slug = $4)
			  AND ($5::text IS NULL OR assets.asset_subcategory_slug = $5)
			  AND ($6::text IS NULL OR assets.primary_brand_code = $6)
		), page_assets AS (
			SELECT *
			FROM filtered_assets
			ORDER BY asset_class_name NULLS LAST,
				 asset_category_name NULLS LAST,
				 asset_subcategory_name NULLS LAST,
				 asset_name,
				 asset_id
			LIMIT $7
			OFFSET $8
		)
		SELECT assets.*,
			   detail.entity_id,
			   detail.entity_type_code,
			   detail.entity_type_name,
			   COALESCE((SELECT resolved.card_mode_code
						 FROM web_view.mafiosopedia_entity_overview_card_resolved_rules resolved
						 WHERE resolved.entity_id = detail.entity_id
						   AND resolved.placement_code = $9
						 LIMIT 1), 'compact') AS resolved_card_mode_code,
			   COALESCE((SELECT jsonb_agg(jsonb_build_object(
							'placementCode', element.placement_code,
							'cardModeCode', element.card_mode_code,
							'displaySlotCode', element.display_slot_code,
							'displaySlotName', element.display_slot_name,
							'sourceTypeCode', element.source_type_code,
							'sourceCode', element.source_code,
							'displayLabel', element.display_label,
							'displayValue', element.display_value,
							'valueTypeCode', element.value_type_code,
							'sortOrder', element.sort_order
						 ) ORDER BY element.sort_order, element.overview_card_rule_element_id)
						 FROM web_view.mafiosopedia_entity_overview_card_elements element
						 WHERE element.entity_id = detail.entity_id
						   AND element.placement_code = $9), '[]'::jsonb) AS card_properties
		FROM page_assets assets
		LEFT JOIN web_view.mafiosopedia_entity_detail detail ON detail.asset_id = assets.asset_id
											 AND detail.entity_type_code = 'asset'
		ORDER BY assets.asset_class_name NULLS LAST,
			 assets.asset_category_name NULLS LAST,
			 assets.asset_subcategory_name NULLS LAST,
			 assets.asset_name,
			 assets.asset_id`,
		[...filterValues, filters.pageSize, offset, cardPlacementCode],
	);

	return {
		rows: result.rows.map(mapAssetRow),
		page,
		pageSize: filters.pageSize,
		totalDocs,
		totalPages,
	};
}

export async function findMafiosopediaAssetBySlug(
	slug: string,
): Promise<MafiosopediaAssetDoc | null> {
	const result = await query<MafiosopediaAssetRow>(
		`WITH selected_asset AS (
			SELECT ${MAFIOSOPEDIA_ASSET_SELECT_COLUMNS}
			FROM web_view.mafiosopedia_asset_browse_rows assets
			WHERE assets.asset_slug = $1
			LIMIT 1
		)
		SELECT assets.*,
			   detail.entity_id,
			   detail.entity_type_code,
			   detail.entity_type_name,
			   COALESCE((SELECT resolved.card_mode_code
						 FROM web_view.mafiosopedia_entity_overview_card_resolved_rules resolved
						 WHERE resolved.entity_id = detail.entity_id
						   AND resolved.placement_code = $2
						 LIMIT 1), 'compact') AS resolved_card_mode_code,
			   COALESCE((SELECT jsonb_agg(jsonb_build_object(
							'placementCode', element.placement_code,
							'cardModeCode', element.card_mode_code,
							'displaySlotCode', element.display_slot_code,
							'displaySlotName', element.display_slot_name,
							'sourceTypeCode', element.source_type_code,
							'sourceCode', element.source_code,
							'displayLabel', element.display_label,
							'displayValue', element.display_value,
							'valueTypeCode', element.value_type_code,
							'sortOrder', element.sort_order
						 ) ORDER BY element.sort_order, element.overview_card_rule_element_id)
						 FROM web_view.mafiosopedia_entity_overview_card_elements element
						 WHERE element.entity_id = detail.entity_id
						   AND element.placement_code = $2), '[]'::jsonb) AS card_properties
		FROM selected_asset assets
		LEFT JOIN web_view.mafiosopedia_entity_detail detail ON detail.asset_id = assets.asset_id
											 AND detail.entity_type_code = 'asset'`,
		[slug, "hub"],
	);

	const row = result.rows[0] ?? null;
	return row ? mapAssetRow(row) : null;
}

export async function listMafiosopediaAssetSections(
	assetId: string,
): Promise<MafiosopediaEntitySectionRef[]> {
	const result = await query<MafiosopediaEntitySectionRefRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				section_sort_order,
				rule_sort_order
		 FROM web_view.mafiosopedia_asset_browse_section_memberships
		 WHERE asset_id = $1::bigint
		 ORDER BY section_sort_order,
				  rule_sort_order,
				  section_name,
				  section_id`,
		[assetId],
	);

	return result.rows.map(mapEntitySectionRefRow);
}
