//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-classification.ts                                                 ////
//// Language: TS                                                                                             ////
//// DB-first Mafiosopedia classification directory helpers for /info overview pages.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type { MafiosopediaHubDirectoryCardDoc } from "@/lib/data/mafiosopedia-hub";
import { buildMafiosopediaInfoPath } from "@/lib/helpers/mafiosopedia-entity-links";
import { buildMafiosopediaMediaFileUrl } from "@/lib/helpers/mafiosopedia-media-files";

export type MafiosopediaClassificationFilterOption = {
	value: string;
	label: string;
	count?: number;
};

export type MafiosopediaClassificationDirectoryFilters = {
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
};

type MafiosopediaClassificationDirectoryRow = {
	node_type_code: "section" | "class" | "category" | "subcategory";
	node_id: string | number;
	node_code: string;
	node_slug: string;
	node_name: string;
	description: string | null;
	item_count: string | number;
	asset_count: string | number;
	recipe_count: string | number;
	section_count: string | number;
	sort_order: string | number;
	updated_dt: Date | string | null;
	sample_entity_type_code: string | null;
	sample_entity_name: string | null;
	sample_entity_slug: string | null;
	sample_media_id: string | number | null;
	sample_media_width_px: number | null;
	sample_media_height_px: number | null;
	sample_media_mime_type: string | null;
};

type MafiosopediaClassificationOptionRow = {
	value_code: string;
	display_name: string;
	item_count: string | number;
};

function toNumber(value: string | number): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
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
}): MafiosopediaHubDirectoryCardDoc["media"] {
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

function directoryHref(row: MafiosopediaClassificationDirectoryRow): string {
	if (row.node_type_code === "section") {
		return buildMafiosopediaInfoPath({ family: "sections", slug: row.node_slug });
	}

	if (row.node_type_code === "class") {
		return buildMafiosopediaInfoPath({ family: "classes", slug: row.node_slug });
	}

	if (row.node_type_code === "category") {
		return buildMafiosopediaInfoPath({ family: "categories", slug: row.node_slug });
	}

	return buildMafiosopediaInfoPath({ family: "subcategories", slug: row.node_slug });
}

function mapDirectoryRow(row: MafiosopediaClassificationDirectoryRow): MafiosopediaHubDirectoryCardDoc {
	return {
		id: String(row.node_id),
		nodeTypeCode: row.node_type_code,
		code: row.node_code,
		slug: row.node_slug,
		name: row.node_name,
		description: row.description,
		href: directoryHref(row),
		itemCount: toNumber(row.item_count),
		assetCount: toNumber(row.asset_count),
		recipeCount: toNumber(row.recipe_count),
		sectionCount: toNumber(row.section_count),
		sortOrder: toNumber(row.sort_order),
		updatedAt: toIsoString(row.updated_dt),
		sampleEntityTypeCode: row.sample_entity_type_code,
		sampleEntityName: row.sample_entity_name,
		sampleEntitySlug: row.sample_entity_slug,
		media: mapMediaRef({
			mediaId: row.sample_media_id,
			width: row.sample_media_width_px,
			height: row.sample_media_height_px,
			mimeType: row.sample_media_mime_type,
		}),
	};
}

function mapOptionRow(row: MafiosopediaClassificationOptionRow): MafiosopediaClassificationFilterOption {
	return {
		value: row.value_code,
		label: row.display_name,
		count: toNumber(row.item_count),
	};
}

const BASE_ENTITY_CTE = `WITH filtered_entities AS (
		SELECT detail.entity_id,
			   detail.entity_type_code,
			   detail.entity_slug,
			   detail.entity_name,
			   detail.section_code,
			   detail.section_slug,
			   detail.section_name,
			   detail.entity_class_id,
			   detail.entity_class_code,
			   detail.entity_class_name,
			   detail.entity_category_id,
			   detail.entity_category_code,
			   detail.entity_category_name,
			   detail.entity_category_slug,
			   detail.entity_subcategory_id,
			   detail.entity_subcategory_code,
			   detail.entity_subcategory_name,
			   detail.entity_subcategory_slug,
			   media.media_file_id,
			   media.width_px,
			   media.height_px,
			   media.mime_type
		FROM web_view.mafiosopedia_entity_detail detail
		LEFT JOIN LATERAL (SELECT media_row.media_file_id,
							 media_row.width_px,
							 media_row.height_px,
							 media_row.mime_type
					  FROM web_view.mafiosopedia_entity_detail_media media_row
					  WHERE media_row.entity_id = detail.entity_id
					    AND media_row.public_display_flag = true
					  ORDER BY CASE WHEN media_row.media_file_id = detail.primary_icon_media_file_id THEN 0 ELSE 1 END,
							   media_row.selected_icon_rank,
							   media_row.selected_header_rank,
							   media_row.primary_flag DESC,
							   media_row.sort_order,
							   media_row.entity_media_id
					  LIMIT 1) media ON true
		WHERE detail.public_visible_flag = true
		  AND detail.detail_visible_flag = true
		  AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		  AND ($2::text IS NULL OR detail.entity_class_code = $2)
		  AND ($3::text IS NULL OR detail.entity_category_slug = $3)
	)`;

function filterValues(
	filters: MafiosopediaClassificationDirectoryFilters,
): [string | null, string | null, string | null] {
	return [filters.section, filters.entityClassCode, filters.categorySlug];
}


export async function listMafiosopediaSectionDirectoryCards(): Promise<MafiosopediaHubDirectoryCardDoc[]> {
	const result = await query<MafiosopediaClassificationDirectoryRow>(
		`SELECT 'section'::text AS node_type_code,
				section_row.section_id AS node_id,
				section_row.section_code AS node_code,
				section_row.section_slug AS node_slug,
				section_row.section_name AS node_name,
				section_row.description,
				section_row.item_count,
				COALESCE(counts.asset_count, 0) AS asset_count,
				COALESCE(counts.recipe_count, 0) AS recipe_count,
				1 AS section_count,
				section_row.sort_order,
				section_row.updated_dt,
				sample.entity_type_code AS sample_entity_type_code,
				sample.entity_name AS sample_entity_name,
				sample.entity_slug AS sample_entity_slug,
				sample.media_file_id AS sample_media_id,
				sample.width_px AS sample_media_width_px,
				sample.height_px AS sample_media_height_px,
				sample.mime_type AS sample_media_mime_type
		 FROM web_view.mafiosopedia_section_directory_rows section_row
		 LEFT JOIN LATERAL (SELECT COUNT(*) FILTER (WHERE detail.entity_type_code = 'asset') AS asset_count,
							  COUNT(*) FILTER (WHERE detail.entity_type_code = 'recipe') AS recipe_count
					   FROM web_view.mafiosopedia_entity_detail detail
					   WHERE detail.public_visible_flag = true
					     AND detail.detail_visible_flag = true
					     AND detail.section_slug = section_row.section_slug) counts ON true
		 LEFT JOIN LATERAL (SELECT detail.entity_type_code,
							  detail.entity_name,
							  detail.entity_slug,
							  media.media_file_id,
							  media.width_px,
							  media.height_px,
							  media.mime_type
					   FROM web_view.mafiosopedia_entity_detail detail
					   LEFT JOIN LATERAL (SELECT media_row.media_file_id,
												media_row.width_px,
												media_row.height_px,
												media_row.mime_type
									 FROM web_view.mafiosopedia_entity_detail_media media_row
									 WHERE media_row.entity_id = detail.entity_id
									   AND media_row.public_display_flag = true
									 ORDER BY CASE WHEN media_row.media_file_id = detail.primary_icon_media_file_id THEN 0 ELSE 1 END,
											  media_row.selected_icon_rank,
											  media_row.selected_header_rank,
											  media_row.primary_flag DESC,
											  media_row.sort_order,
											  media_row.entity_media_id
									 LIMIT 1) media ON true
					   WHERE detail.public_visible_flag = true
					     AND detail.detail_visible_flag = true
					     AND detail.section_slug = section_row.section_slug
					   ORDER BY (media.media_file_id IS NULL),
								detail.entity_name,
								detail.entity_id
					   LIMIT 1) sample ON true
		 WHERE section_row.public_visible_flag = true
		    OR section_row.show_when_empty_flag = true
		 ORDER BY section_row.section_name,
				  section_row.section_id`,
	);

	return result.rows.map(mapDirectoryRow);
}

export async function listMafiosopediaClassDirectoryCards(
	filters: Pick<MafiosopediaClassificationDirectoryFilters, "section">,
): Promise<MafiosopediaHubDirectoryCardDoc[]> {
	const result = await query<MafiosopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_class_code ORDER BY (filtered_entities.media_file_id IS NULL), filtered_entities.entity_category_name, filtered_entities.entity_subcategory_name, filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
			FROM filtered_entities
			WHERE filtered_entities.entity_class_code IS NOT NULL
		)
		SELECT 'class'::text AS node_type_code,
			   entity_class_id AS node_id,
			   entity_class_code AS node_code,
			   entity_class_code AS node_slug,
			   MIN(entity_class_name) AS node_name,
			   NULL::text AS description,
			   COUNT(*) AS item_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'asset') AS asset_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'recipe') AS recipe_count,
			   COUNT(DISTINCT section_code) FILTER (WHERE section_code IS NOT NULL) AS section_count,
			   MIN(entity_class_name) AS sort_label,
			   row_number() OVER (ORDER BY MIN(section_name) NULLS LAST, MIN(entity_class_name) NULLS LAST, entity_class_code)::integer AS sort_order,
			   NULL::timestamp with time zone AS updated_dt,
			   MAX(entity_type_code) FILTER (WHERE sample_rank = 1) AS sample_entity_type_code,
			   MAX(entity_name) FILTER (WHERE sample_rank = 1) AS sample_entity_name,
			   MAX(entity_slug) FILTER (WHERE sample_rank = 1) AS sample_entity_slug,
			   MAX(media_file_id) FILTER (WHERE sample_rank = 1) AS sample_media_id,
			   MAX(width_px) FILTER (WHERE sample_rank = 1) AS sample_media_width_px,
			   MAX(height_px) FILTER (WHERE sample_rank = 1) AS sample_media_height_px,
			   MAX(mime_type) FILTER (WHERE sample_rank = 1) AS sample_media_mime_type
		FROM ranked_entities
		GROUP BY entity_class_id,
				 entity_class_code
		ORDER BY MIN(section_name) NULLS LAST,
				 MIN(entity_class_name) NULLS LAST,
				 entity_class_code`,
		[filters.section, null, null],
	);

	return result.rows.map(mapDirectoryRow);
}

export async function listMafiosopediaCategoryDirectoryCards(
	filters: Pick<MafiosopediaClassificationDirectoryFilters, "section" | "entityClassCode">,
): Promise<MafiosopediaHubDirectoryCardDoc[]> {
	const result = await query<MafiosopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_category_slug ORDER BY (filtered_entities.media_file_id IS NULL), filtered_entities.entity_subcategory_name, filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
			FROM filtered_entities
			WHERE filtered_entities.entity_category_slug IS NOT NULL
		)
		SELECT 'category'::text AS node_type_code,
			   MIN(entity_category_id) AS node_id,
			   MIN(entity_category_code) AS node_code,
			   entity_category_slug AS node_slug,
			   MIN(entity_category_name) AS node_name,
			   NULL::text AS description,
			   COUNT(*) AS item_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'asset') AS asset_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'recipe') AS recipe_count,
			   COUNT(DISTINCT section_code) FILTER (WHERE section_code IS NOT NULL) AS section_count,
			   row_number() OVER (ORDER BY MIN(section_name) NULLS LAST, MIN(entity_class_name) NULLS LAST, MIN(entity_category_name) NULLS LAST, entity_category_slug)::integer AS sort_order,
			   NULL::timestamp with time zone AS updated_dt,
			   MAX(entity_type_code) FILTER (WHERE sample_rank = 1) AS sample_entity_type_code,
			   MAX(entity_name) FILTER (WHERE sample_rank = 1) AS sample_entity_name,
			   MAX(entity_slug) FILTER (WHERE sample_rank = 1) AS sample_entity_slug,
			   MAX(media_file_id) FILTER (WHERE sample_rank = 1) AS sample_media_id,
			   MAX(width_px) FILTER (WHERE sample_rank = 1) AS sample_media_width_px,
			   MAX(height_px) FILTER (WHERE sample_rank = 1) AS sample_media_height_px,
			   MAX(mime_type) FILTER (WHERE sample_rank = 1) AS sample_media_mime_type
		FROM ranked_entities
		GROUP BY entity_category_slug
		ORDER BY MIN(section_name) NULLS LAST,
				 MIN(entity_class_name) NULLS LAST,
				 MIN(entity_category_name) NULLS LAST,
				 entity_category_slug`,
		[filters.section, filters.entityClassCode, null],
	);

	return result.rows.map(mapDirectoryRow);
}

export async function listMafiosopediaSubcategoryDirectoryCards(
	filters: MafiosopediaClassificationDirectoryFilters = {
		section: null,
		entityClassCode: null,
		categorySlug: null,
	},
): Promise<MafiosopediaHubDirectoryCardDoc[]> {
	const result = await query<MafiosopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_subcategory_slug ORDER BY (filtered_entities.media_file_id IS NULL), filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
			FROM filtered_entities
			WHERE filtered_entities.entity_subcategory_slug IS NOT NULL
		)
		SELECT 'subcategory'::text AS node_type_code,
			   MIN(entity_subcategory_id) AS node_id,
			   MIN(entity_subcategory_code) AS node_code,
			   entity_subcategory_slug AS node_slug,
			   MIN(entity_subcategory_name) AS node_name,
			   NULL::text AS description,
			   COUNT(*) AS item_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'asset') AS asset_count,
			   COUNT(*) FILTER (WHERE entity_type_code = 'recipe') AS recipe_count,
			   COUNT(DISTINCT section_code) FILTER (WHERE section_code IS NOT NULL) AS section_count,
			   row_number() OVER (ORDER BY MIN(section_name) NULLS LAST, MIN(entity_class_name) NULLS LAST, MIN(entity_category_name) NULLS LAST, MIN(entity_subcategory_name) NULLS LAST, entity_subcategory_slug)::integer AS sort_order,
			   NULL::timestamp with time zone AS updated_dt,
			   MAX(entity_type_code) FILTER (WHERE sample_rank = 1) AS sample_entity_type_code,
			   MAX(entity_name) FILTER (WHERE sample_rank = 1) AS sample_entity_name,
			   MAX(entity_slug) FILTER (WHERE sample_rank = 1) AS sample_entity_slug,
			   MAX(media_file_id) FILTER (WHERE sample_rank = 1) AS sample_media_id,
			   MAX(width_px) FILTER (WHERE sample_rank = 1) AS sample_media_width_px,
			   MAX(height_px) FILTER (WHERE sample_rank = 1) AS sample_media_height_px,
			   MAX(mime_type) FILTER (WHERE sample_rank = 1) AS sample_media_mime_type
		FROM ranked_entities
		GROUP BY entity_subcategory_slug
		ORDER BY MIN(section_name) NULLS LAST,
				 MIN(entity_class_name) NULLS LAST,
				 MIN(entity_category_name) NULLS LAST,
				 MIN(entity_subcategory_name) NULLS LAST,
				 entity_subcategory_slug`,
		filterValues(filters),
	);

	return result.rows.map(mapDirectoryRow);
}

export async function listMafiosopediaClassFilterOptions(
	filters: Pick<MafiosopediaClassificationDirectoryFilters, "section">,
): Promise<MafiosopediaClassificationFilterOption[]> {
	const result = await query<MafiosopediaClassificationOptionRow>(
		`SELECT detail.entity_class_code AS value_code,
			   MIN(detail.entity_class_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.mafiosopedia_entity_detail detail
		 WHERE detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND detail.entity_class_code IS NOT NULL
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		 GROUP BY detail.entity_class_code
		 ORDER BY MIN(detail.section_name) NULLS LAST,
				  MIN(detail.entity_class_name) NULLS LAST,
				  detail.entity_class_code`,
		[filters.section],
	);

	return result.rows.map(mapOptionRow);
}

export async function listMafiosopediaCategoryFilterOptions(
	filters: Pick<MafiosopediaClassificationDirectoryFilters, "section" | "entityClassCode">,
): Promise<MafiosopediaClassificationFilterOption[]> {
	const result = await query<MafiosopediaClassificationOptionRow>(
		`SELECT detail.entity_category_slug AS value_code,
			   MIN(detail.entity_category_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.mafiosopedia_entity_detail detail
		 WHERE detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND detail.entity_category_slug IS NOT NULL
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		 GROUP BY detail.entity_category_slug
		 ORDER BY MIN(detail.section_name) NULLS LAST,
				  MIN(detail.entity_class_name) NULLS LAST,
				  MIN(detail.entity_category_name) NULLS LAST,
				  detail.entity_category_slug`,
		[filters.section, filters.entityClassCode],
	);

	return result.rows.map(mapOptionRow);
}

export async function listMafiosopediaSubcategoryFilterOptions(
	filters: MafiosopediaClassificationDirectoryFilters,
): Promise<MafiosopediaClassificationFilterOption[]> {
	const result = await query<MafiosopediaClassificationOptionRow>(
		`SELECT detail.entity_subcategory_slug AS value_code,
			   MIN(detail.entity_subcategory_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.mafiosopedia_entity_detail detail
		 WHERE detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND detail.entity_subcategory_slug IS NOT NULL
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		   AND ($3::text IS NULL OR detail.entity_category_slug = $3)
		 GROUP BY detail.entity_subcategory_slug
		 ORDER BY MIN(detail.section_name) NULLS LAST,
			  MIN(detail.entity_class_name) NULLS LAST,
			  MIN(detail.entity_category_name) NULLS LAST,
			  MIN(detail.entity_subcategory_name) NULLS LAST,
			  detail.entity_subcategory_slug`,
		filterValues(filters),
	);

	return result.rows.map(mapOptionRow);
}
