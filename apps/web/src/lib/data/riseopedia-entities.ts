//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-entities.ts                                                       ////
//// Language: TS                                                                                             ////
//// DB-first public Riseopedia entity list helpers for overview and classification result cards.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import {
	mapRiseopediaCardProperties,
	normalizeRiseopediaCardMode,
	type RiseopediaCardProperty,
	type RiseopediaOverviewCardMode,
} from "@/lib/data/riseopedia-card-properties";
import { query } from "@/lib/data/pg";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaEntityMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type RiseopediaEntityCardProperty = RiseopediaCardProperty;

export type RiseopediaEntityDoc = {
	entityId: string;
	entityTypeCode: string;
	entityTypeName: string | null;
	entityKey: string;
	entityName: string;
	entitySlug: string;
	sectionCode: string | null;
	sectionName: string | null;
	entityClassCode: string | null;
	entityClassName: string | null;
	categoryCode: string | null;
	categoryName: string | null;
	categorySlug: string | null;
	subcategoryCode: string | null;
	subcategoryName: string | null;
	subcategorySlug: string | null;
	categorySubcategoryLabel: string | null;
	classificationPathLabel: string | null;
	releaseStateCode: string | null;
	releaseStateName: string | null;
	media: RiseopediaEntityMediaRef | null;
	cardMode: RiseopediaOverviewCardMode;
	cardProperties: RiseopediaEntityCardProperty[];
};

export type RiseopediaEntityCardPlacementCode = "hub" | "section" | "class" | "category" | "subcategory";

export type RiseopediaEntityListFilters = {
	search: string | null;
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	page: number;
	pageSize: number;
	cardPlacementCode?: RiseopediaEntityCardPlacementCode;
};

export type RiseopediaEntityListResult = {
	rows: RiseopediaEntityDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

export type RiseopediaEntityFilterOption = {
	value: string;
	label: string;
	count?: number;
};

export type RiseopediaEntityFilterOptionFilters = {
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
};

type RiseopediaEntityRow = {
	entity_id: string | number;
	entity_type_code: string;
	entity_type_name: string | null;
	entity_code: string;
	entity_name: string;
	entity_slug: string;
	section_code: string | null;
	section_name: string | null;
	entity_class_code: string | null;
	entity_class_name: string | null;
	entity_category_code: string | null;
	entity_category_name: string | null;
	entity_category_slug: string | null;
	entity_subcategory_code: string | null;
	entity_subcategory_name: string | null;
	entity_subcategory_slug: string | null;
	category_subcategory_label: string | null;
	classification_path_label: string | null;
	release_state_code: string | null;
	release_state_name: string | null;
	media_id: string | number | null;
	media_width_px: number | null;
	media_height_px: number | null;
	media_mime_type: string | null;
	resolved_card_mode_code: string | null;
	card_properties: unknown;
};

type CountRow = {
	total_count: string | number;
};

type RiseopediaFilterOptionRow = {
	option_value: string;
	option_label: string;
	option_count: string | number;
};

const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_CARD_PLACEMENT: RiseopediaEntityCardPlacementCode = "hub";

const ENTITY_FILTER_WHERE = `detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND ($1::text IS NULL
				OR detail.entity_name ILIKE $1
				OR detail.entity_code ILIKE $1
				OR detail.entity_type_name ILIKE $1
				OR detail.entity_class_name ILIKE $1
				OR detail.entity_category_name ILIKE $1
				OR detail.entity_subcategory_name ILIKE $1)
		   AND ($2::text IS NULL OR detail.section_code = $2 OR detail.section_slug = $2)
		   AND ($3::text IS NULL OR detail.entity_class_code = $3)
		   AND ($4::text IS NULL OR detail.entity_category_slug = $4)
		   AND ($5::text IS NULL OR detail.entity_subcategory_slug = $5)`;

const ENTITY_SCOPE_WHERE = `detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		   AND ($3::text IS NULL OR detail.entity_category_slug = $3)
		   AND ($4::text IS NULL OR detail.entity_subcategory_slug = $4)`;

function toNumber(value: string | number): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedPageSize(pageSize: number): number {
	return Number.isInteger(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
}

function totalPages(totalDocs: number, pageSize: number): number {
	return totalDocs > 0 ? Math.ceil(totalDocs / pageSize) : 0;
}

function normalizedPage(page: number, pageCount: number): number {
	if (!Number.isInteger(page) || page < 1) {
		return 1;
	}

	return pageCount > 0 ? Math.min(page, pageCount) : 1;
}

function normalizedSearch(search: string | null): string | null {
	const trimmed = search?.trim();
	return trimmed && trimmed.length > 0 ? `%${trimmed}%` : null;
}

function offsetForPage(page: number, pageSize: number): number {
	return (page - 1) * pageSize;
}

function normalizedPlacement(
	placementCode: RiseopediaEntityCardPlacementCode | undefined,
): RiseopediaEntityCardPlacementCode {
	return placementCode ?? DEFAULT_CARD_PLACEMENT;
}

function filterValues(filters: RiseopediaEntityListFilters): [
	string | null,
	string | null,
	string | null,
	string | null,
	string | null,
] {
	return [
		normalizedSearch(filters.search),
		filters.section,
		filters.entityClassCode,
		filters.categorySlug,
		filters.subcategorySlug,
	];
}

function mapMediaRef(args: {
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): RiseopediaEntityMediaRef | null {
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

function mapEntityRow(row: RiseopediaEntityRow): RiseopediaEntityDoc {
	return {
		entityId: String(row.entity_id),
		entityTypeCode: row.entity_type_code,
		entityTypeName: row.entity_type_name,
		entityKey: row.entity_code,
		entityName: row.entity_name,
		entitySlug: row.entity_slug,
		sectionCode: row.section_code,
		sectionName: row.section_name,
		entityClassCode: row.entity_class_code,
		entityClassName: row.entity_class_name,
		categoryCode: row.entity_category_code,
		categoryName: row.entity_category_name,
		categorySlug: row.entity_category_slug,
		subcategoryCode: row.entity_subcategory_code,
		subcategoryName: row.entity_subcategory_name,
		subcategorySlug: row.entity_subcategory_slug,
		categorySubcategoryLabel: row.category_subcategory_label,
		classificationPathLabel: row.classification_path_label,
		releaseStateCode: row.release_state_code,
		releaseStateName: row.release_state_name,
		media: mapMediaRef({
			mediaId: row.media_id,
			width: row.media_width_px,
			height: row.media_height_px,
			mimeType: row.media_mime_type,
		}),
		cardMode: normalizeRiseopediaCardMode(row.resolved_card_mode_code),
		cardProperties: mapRiseopediaCardProperties(row.card_properties),
	};
}

function mapFilterOptionRow(row: RiseopediaFilterOptionRow): RiseopediaEntityFilterOption {
	return {
		value: row.option_value,
		label: row.option_label,
		count: toNumber(row.option_count),
	};
}

export async function listRiseopediaEntities(
	filters: RiseopediaEntityListFilters,
): Promise<RiseopediaEntityListResult> {
	const values = filterValues(filters);
	const pageSize = normalizedPageSize(filters.pageSize);
	const placementCode = normalizedPlacement(filters.cardPlacementCode);
	const countResult = await query<CountRow>(
		`SELECT COUNT(*)::bigint AS total_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE ${ENTITY_FILTER_WHERE}`,
		values,
	);
	const totalDocs = countResult.rows[0]
		? toNumber(countResult.rows[0].total_count)
		: 0;
	const pageCount = totalPages(totalDocs, pageSize);
	const page = normalizedPage(filters.page, pageCount);
	const offset = offsetForPage(page, pageSize);

	if (totalDocs <= 0) {
		return {
			rows: [],
			page: 1,
			pageSize,
			totalDocs: 0,
			totalPages: 0,
		};
	}

	const result = await query<RiseopediaEntityRow>(
		`SELECT detail.entity_id,
			detail.entity_type_code,
			detail.entity_type_name,
			detail.entity_code,
			detail.entity_name,
			detail.entity_slug,
			detail.section_code,
			detail.section_name,
			detail.entity_class_code,
			detail.entity_class_name,
			detail.entity_category_code,
			detail.entity_category_name,
			detail.entity_category_slug,
			detail.entity_subcategory_code,
			detail.entity_subcategory_name,
			detail.entity_subcategory_slug,
			detail.category_subcategory_label,
			detail.classification_path_label,
			detail.release_state_code,
			detail.release_state_name,
			media.media_file_id AS media_id,
			media.width_px AS media_width_px,
			media.height_px AS media_height_px,
			media.mime_type AS media_mime_type,
			COALESCE(resolved.card_mode_code, 'compact') AS resolved_card_mode_code,
			COALESCE(card_elements.card_properties, '[]'::jsonb) AS card_properties
		 FROM web_view.riseopedia_entity_detail detail
		 LEFT JOIN web_view.riseopedia_entity_overview_card_resolved_rules resolved
		   ON resolved.entity_id = detail.entity_id
		  AND resolved.placement_code = $8
		 LEFT JOIN LATERAL (SELECT media_row.media_file_id,
						  media_row.width_px,
						  media_row.height_px,
						  media_row.mime_type
				   FROM web_view.riseopedia_entity_detail_media media_row
				   WHERE media_row.entity_id = detail.entity_id
				     AND media_row.public_display_flag = true
				   ORDER BY CASE WHEN media_row.media_file_id = detail.primary_icon_media_file_id THEN 0 ELSE 1 END,
						media_row.selected_icon_rank,
						media_row.selected_header_rank,
						media_row.primary_flag DESC,
						media_row.sort_order,
						media_row.entity_media_id
				   LIMIT 1) media ON true
		 LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object(
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
						 ) ORDER BY element.sort_order, element.overview_card_rule_element_id) AS card_properties
				   FROM web_view.riseopedia_entity_overview_card_elements element
				   WHERE element.entity_id = detail.entity_id
				     AND element.placement_code = $8) card_elements ON true
		 WHERE ${ENTITY_FILTER_WHERE}
		 ORDER BY detail.section_name NULLS LAST,
			  detail.entity_class_name NULLS LAST,
			  detail.entity_category_name NULLS LAST,
			  detail.entity_subcategory_name NULLS LAST,
			  detail.entity_name,
			  detail.entity_type_code,
			  detail.entity_id
		 LIMIT $6
		 OFFSET $7`,
		[...values, pageSize, offset, placementCode],
	);

	return {
		rows: result.rows.map(mapEntityRow),
		page,
		pageSize,
		totalDocs,
		totalPages: pageCount,
	};
}

export async function listRiseopediaEntityClassFilterOptions(
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section">,
): Promise<RiseopediaEntityFilterOption[]> {
	const result = await query<RiseopediaFilterOptionRow>(
		`SELECT detail.entity_class_code AS option_value,
			detail.entity_class_name AS option_label,
			COUNT(*)::bigint AS option_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE detail.entity_class_code IS NOT NULL
		   AND detail.entity_class_name IS NOT NULL
		   AND detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		 GROUP BY detail.entity_class_code,
			  detail.entity_class_name
		 ORDER BY detail.entity_class_name,
			  detail.entity_class_code`,
		[filters.section],
	);

	return result.rows.map(mapFilterOptionRow);
}

export async function listRiseopediaEntityCategoryFilterOptions(
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section" | "entityClassCode">,
): Promise<RiseopediaEntityFilterOption[]> {
	const result = await query<RiseopediaFilterOptionRow>(
		`SELECT detail.entity_category_slug AS option_value,
			detail.entity_category_name AS option_label,
			COUNT(*)::bigint AS option_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE detail.entity_category_slug IS NOT NULL
		   AND detail.entity_category_name IS NOT NULL
		   AND detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		 GROUP BY detail.entity_category_slug,
			  detail.entity_category_name,
			  detail.section_name,
			  detail.entity_class_name
		 ORDER BY detail.section_name NULLS LAST,
			  detail.entity_class_name NULLS LAST,
			  detail.entity_category_name,
			  detail.entity_category_slug`,
		[filters.section, filters.entityClassCode],
	);

	return result.rows.map(mapFilterOptionRow);
}

export async function listRiseopediaEntitySubcategoryFilterOptions(
	filters: Pick<RiseopediaEntityFilterOptionFilters, "section" | "entityClassCode" | "categorySlug">,
): Promise<RiseopediaEntityFilterOption[]> {
	const result = await query<RiseopediaFilterOptionRow>(
		`SELECT detail.entity_subcategory_slug AS option_value,
			detail.entity_subcategory_name AS option_label,
			COUNT(*)::bigint AS option_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE detail.entity_subcategory_slug IS NOT NULL
		   AND detail.entity_subcategory_name IS NOT NULL
		   AND ${ENTITY_SCOPE_WHERE}
		 GROUP BY detail.entity_subcategory_slug,
			  detail.entity_subcategory_name,
			  detail.section_name,
			  detail.entity_class_name,
			  detail.entity_category_name
		 ORDER BY detail.section_name NULLS LAST,
			  detail.entity_class_name NULLS LAST,
			  detail.entity_category_name NULLS LAST,
			  detail.entity_subcategory_name,
			  detail.entity_subcategory_slug`,
		[filters.section, filters.entityClassCode, filters.categorySlug, null],
	);

	return result.rows.map(mapFilterOptionRow);
}
