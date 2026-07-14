//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-classification.ts                                                 ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia classification directory helpers for /info overview pages.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import { buildRiseopediaInfoPath } from "@/lib/helpers/riseopedia-entity-links";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaClassificationFilterOption = {
	value: string;
	label: string;
	count?: number;
};

export type RiseopediaClassificationDirectoryFilters = {
	section: string | null;
	entityClassCode: string | null;
	categorySlug: string | null;
};

type RiseopediaClassificationDirectoryRow = {
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

type RiseopediaClassificationOptionRow = {
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
}): RiseopediaHubDirectoryCardDoc["media"] {
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

function directoryHref(row: RiseopediaClassificationDirectoryRow): string {
	if (row.node_type_code === "section") {
		return buildRiseopediaInfoPath({ family: "sections", slug: row.node_slug });
	}

	if (row.node_type_code === "class") {
		return buildRiseopediaInfoPath({ family: "classes", slug: row.node_slug });
	}

	if (row.node_type_code === "category") {
		return buildRiseopediaInfoPath({ family: "categories", slug: row.node_slug });
	}

	return buildRiseopediaInfoPath({
		family: "subcategories",
		slug: row.node_slug,
	});
}

function mapDirectoryRow(
	row: RiseopediaClassificationDirectoryRow,
): RiseopediaHubDirectoryCardDoc {
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

function mapOptionRow(
	row: RiseopediaClassificationOptionRow,
): RiseopediaClassificationFilterOption {
	return {
		value: row.value_code,
		label: row.display_name,
		count: toNumber(row.item_count),
	};
}

type RiseopediaMaterializedDirectoryViewName =
	| "web_view.riseopedia_hub_sections"
	| "web_view.riseopedia_hub_classes"
	| "web_view.riseopedia_hub_categories"
	| "web_view.riseopedia_hub_subcategories";

async function listRiseopediaMaterializedDirectoryCards(
	viewName: RiseopediaMaterializedDirectoryViewName,
): Promise<RiseopediaHubDirectoryCardDoc[]> {
	const result = await query<RiseopediaClassificationDirectoryRow>(
		`SELECT node_type_code,
			node_id,
			node_code,
			node_slug,
			node_name,
			description,
			item_count,
			asset_count,
			recipe_count,
			section_count,
			sort_order,
			updated_dt,
			sample_entity_type_code,
			sample_entity_name,
			sample_entity_slug,
			sample_media_id,
			sample_media_width_px,
			sample_media_height_px,
			sample_media_mime_type
		 FROM ${viewName}
		 WHERE item_count > 0
		 ORDER BY sort_order,
			node_name,
			node_id`,
	);

	return result.rows.map(mapDirectoryRow);
}

async function listRiseopediaMaterializedClassificationOptions(args: {
	viewName:
		| "web_view.riseopedia_hub_classes"
		| "web_view.riseopedia_hub_categories"
		| "web_view.riseopedia_hub_subcategories";
	valueColumn: "node_code" | "node_name";
}): Promise<RiseopediaClassificationFilterOption[]> {
	const result = await query<RiseopediaClassificationOptionRow>(
		`SELECT ${args.valueColumn} AS value_code,
			node_name AS display_name,
			item_count
		 FROM ${args.viewName}
		 WHERE item_count > 0
		 ORDER BY sort_order,
			node_name,
			node_id`,
	);

	return result.rows.map(mapOptionRow);
}

const BASE_ENTITY_CTE = `WITH filtered_entities AS (
			SELECT detail.entity_id,
				   detail.entity_type_code,
				   detail.entity_slug,
				   detail.entity_name,
				   detail.entity_code,
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
				   media.mime_type,
				   class_media.media_file_id AS class_media_file_id,
				   class_media.width_px AS class_media_width_px,
				   class_media.height_px AS class_media_height_px,
				   class_media.mime_type AS class_media_mime_type,
				   category_media.media_file_id AS category_media_file_id,
				   category_media.width_px AS category_media_width_px,
				   category_media.height_px AS category_media_height_px,
				   category_media.mime_type AS category_media_mime_type,
				   subcategory_media.media_file_id AS subcategory_media_file_id,
				   subcategory_media.width_px AS subcategory_media_width_px,
				   subcategory_media.height_px AS subcategory_media_height_px,
				   subcategory_media.mime_type AS subcategory_media_mime_type,
		   entity_type_media.media_file_id AS entity_type_media_file_id,
		   entity_type_media.width_px AS entity_type_media_width_px,
		   entity_type_media.height_px AS entity_type_media_height_px,
		   entity_type_media.mime_type AS entity_type_media_mime_type
			FROM web_view.riseopedia_entity_detail detail
			LEFT JOIN LATERAL (SELECT media_row.media_file_id,
							 media_row.width_px,
							 media_row.height_px,
							 media_row.mime_type
						  FROM web_view.riseopedia_entity_detail_media media_row
						  WHERE media_row.entity_id = detail.entity_id
						    AND media_row.public_display_flag = true
						    AND media_row.media_role_code IN ('icon'::text, 'thumbnail'::text, 'brand_logo'::text)
						  ORDER BY CASE WHEN media_row.media_file_id = detail.primary_icon_media_file_id THEN 0 ELSE 1 END,
							   media_row.selected_icon_rank,
							   media_row.selected_header_rank,
							   media_row.primary_flag DESC,
							   media_row.sort_order,
							   media_row.entity_media_id
						  LIMIT 1) media ON true
			LEFT JOIN LATERAL (SELECT class_media_row.media_file_id,
							 class_media_row.width_px,
							 class_media_row.height_px,
							 class_media_row.mime_type
						  FROM web_view.riseopedia_classification_media_lookup class_media_row
						  WHERE class_media_row.target_level_code = 'class'::text
						    AND class_media_row.entity_type_code = detail.entity_type_code
						    AND class_media_row.entity_class_code = detail.entity_class_code
						  ORDER BY class_media_row.sort_order,
							   class_media_row.classification_media_id
						  LIMIT 1) class_media ON true
			LEFT JOIN LATERAL (SELECT media_candidate.media_file_id,
							 media_candidate.width_px,
							 media_candidate.height_px,
							 media_candidate.mime_type
						  FROM (VALUES
							(10, 'category'::text, detail.entity_class_code,
								CASE WHEN detail.entity_type_code = 'location'::text AND detail.entity_code LIKE 'district_%'::text THEN 'district'::text ELSE detail.entity_category_code END,
								NULL::text),
							(20, 'class'::text, detail.entity_class_code, NULL::text, NULL::text),
							(30, 'entity_type'::text, NULL::text, NULL::text, NULL::text)
						  ) candidate(rank_order, target_level_code, entity_class_code, entity_category_code, entity_subcategory_code)
						  JOIN web_view.riseopedia_classification_media_lookup media_candidate
						    ON media_candidate.target_level_code = candidate.target_level_code
						   AND media_candidate.entity_type_code = detail.entity_type_code
						   AND media_candidate.entity_class_code IS NOT DISTINCT FROM candidate.entity_class_code
						   AND media_candidate.entity_category_code IS NOT DISTINCT FROM candidate.entity_category_code
						   AND media_candidate.entity_subcategory_code IS NOT DISTINCT FROM candidate.entity_subcategory_code
						  ORDER BY candidate.rank_order,
							   media_candidate.sort_order,
							   media_candidate.classification_media_id
						  LIMIT 1) category_media ON true
			LEFT JOIN LATERAL (SELECT media_candidate.media_file_id,
							 media_candidate.width_px,
							 media_candidate.height_px,
							 media_candidate.mime_type
						  FROM (VALUES
							(10, 'subcategory'::text, detail.entity_class_code,
								CASE WHEN detail.entity_type_code = 'location'::text AND detail.entity_code LIKE 'town_%'::text THEN 'district'::text ELSE detail.entity_category_code END,
								CASE WHEN detail.entity_type_code = 'location'::text AND detail.entity_code LIKE 'town_%'::text THEN 'town'::text
								     WHEN detail.entity_type_code = 'location'::text AND detail.entity_code LIKE '%skyscraper%'::text THEN 'skyscraper'::text
								     ELSE detail.entity_subcategory_code END),
							(20, 'category'::text, detail.entity_class_code,
								CASE WHEN detail.entity_type_code = 'location'::text AND detail.entity_code LIKE 'district_%'::text THEN 'district'::text ELSE detail.entity_category_code END,
								NULL::text),
							(30, 'class'::text, detail.entity_class_code, NULL::text, NULL::text),
							(40, 'entity_type'::text, NULL::text, NULL::text, NULL::text)
						  ) candidate(rank_order, target_level_code, entity_class_code, entity_category_code, entity_subcategory_code)
						  JOIN web_view.riseopedia_classification_media_lookup media_candidate
						    ON media_candidate.target_level_code = candidate.target_level_code
						   AND media_candidate.entity_type_code = detail.entity_type_code
						   AND media_candidate.entity_class_code IS NOT DISTINCT FROM candidate.entity_class_code
						   AND media_candidate.entity_category_code IS NOT DISTINCT FROM candidate.entity_category_code
						   AND media_candidate.entity_subcategory_code IS NOT DISTINCT FROM candidate.entity_subcategory_code
						  ORDER BY candidate.rank_order,
							   media_candidate.sort_order,
							   media_candidate.classification_media_id
						  LIMIT 1) subcategory_media ON true
			LEFT JOIN LATERAL (SELECT entity_type_media_row.media_file_id,
							 entity_type_media_row.width_px,
							 entity_type_media_row.height_px,
							 entity_type_media_row.mime_type
						  FROM web_view.riseopedia_classification_media_lookup entity_type_media_row
						  WHERE entity_type_media_row.target_level_code = 'entity_type'::text
						    AND entity_type_media_row.entity_type_code = detail.entity_type_code
						  ORDER BY entity_type_media_row.sort_order,
							   entity_type_media_row.classification_media_id
						  LIMIT 1) entity_type_media ON true
			WHERE detail.public_visible_flag = true
			  AND detail.detail_visible_flag = true
			  AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
			  AND ($2::text IS NULL OR detail.entity_class_code = $2)
			  AND ($3::text IS NULL
				OR detail.entity_category_slug = $3
				OR lower(btrim(detail.entity_category_name)) = lower(btrim($3)))
		)`;

function filterValues(
	filters: RiseopediaClassificationDirectoryFilters,
): [string | null, string | null, string | null] {
	return [filters.section, filters.entityClassCode, filters.categorySlug];
}

export async function listRiseopediaSectionDirectoryCards(): Promise<
	RiseopediaHubDirectoryCardDoc[]
> {
	return listRiseopediaMaterializedDirectoryCards(
		"web_view.riseopedia_hub_sections",
	);
}

export async function listRiseopediaClassDirectoryCards(
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section">,
): Promise<RiseopediaHubDirectoryCardDoc[]> {
	if (!filters.section) {
		return listRiseopediaMaterializedDirectoryCards(
			"web_view.riseopedia_hub_classes",
		);
	}

	const result = await query<RiseopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_class_code ORDER BY (filtered_entities.class_media_file_id IS NULL), (filtered_entities.media_file_id IS NULL), filtered_entities.entity_category_name, filtered_entities.entity_subcategory_name, filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
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
			   COALESCE(MAX(class_media_file_id) FILTER (WHERE sample_rank = 1), MAX(media_file_id) FILTER (WHERE sample_rank = 1)) AS sample_media_id,
			   COALESCE(MAX(class_media_width_px) FILTER (WHERE sample_rank = 1), MAX(width_px) FILTER (WHERE sample_rank = 1)) AS sample_media_width_px,
			   COALESCE(MAX(class_media_height_px) FILTER (WHERE sample_rank = 1), MAX(height_px) FILTER (WHERE sample_rank = 1)) AS sample_media_height_px,
			   COALESCE(MAX(class_media_mime_type) FILTER (WHERE sample_rank = 1), MAX(mime_type) FILTER (WHERE sample_rank = 1)) AS sample_media_mime_type
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

export async function listRiseopediaCategoryDirectoryCards(
	filters: Pick<
		RiseopediaClassificationDirectoryFilters,
		"section" | "entityClassCode"
	>,
): Promise<RiseopediaHubDirectoryCardDoc[]> {
	if (!filters.section && !filters.entityClassCode) {
		return listRiseopediaMaterializedDirectoryCards(
			"web_view.riseopedia_hub_categories",
		);
	}

	const result = await query<RiseopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_category_slug ORDER BY (filtered_entities.category_media_file_id IS NULL), (filtered_entities.media_file_id IS NULL), filtered_entities.entity_subcategory_name, filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
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
			   COALESCE(MAX(category_media_file_id) FILTER (WHERE sample_rank = 1), MAX(media_file_id) FILTER (WHERE sample_rank = 1)) AS sample_media_id,
			   COALESCE(MAX(category_media_width_px) FILTER (WHERE sample_rank = 1), MAX(width_px) FILTER (WHERE sample_rank = 1)) AS sample_media_width_px,
			   COALESCE(MAX(category_media_height_px) FILTER (WHERE sample_rank = 1), MAX(height_px) FILTER (WHERE sample_rank = 1)) AS sample_media_height_px,
			   COALESCE(MAX(category_media_mime_type) FILTER (WHERE sample_rank = 1), MAX(mime_type) FILTER (WHERE sample_rank = 1)) AS sample_media_mime_type
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

export async function listRiseopediaSubcategoryDirectoryCards(
	filters: RiseopediaClassificationDirectoryFilters = {
		section: null,
		entityClassCode: null,
		categorySlug: null,
	},
): Promise<RiseopediaHubDirectoryCardDoc[]> {
	if (!filters.section && !filters.entityClassCode && !filters.categorySlug) {
		return listRiseopediaMaterializedDirectoryCards(
			"web_view.riseopedia_hub_subcategories",
		);
	}

	const result = await query<RiseopediaClassificationDirectoryRow>(
		`${BASE_ENTITY_CTE}, ranked_entities AS (
			SELECT filtered_entities.*,
				   row_number() OVER (PARTITION BY filtered_entities.entity_subcategory_slug ORDER BY (filtered_entities.subcategory_media_file_id IS NULL), (filtered_entities.media_file_id IS NULL), filtered_entities.entity_name, filtered_entities.entity_id) AS sample_rank
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
			   COALESCE(MAX(subcategory_media_file_id) FILTER (WHERE sample_rank = 1), MAX(media_file_id) FILTER (WHERE sample_rank = 1)) AS sample_media_id,
			   COALESCE(MAX(subcategory_media_width_px) FILTER (WHERE sample_rank = 1), MAX(width_px) FILTER (WHERE sample_rank = 1)) AS sample_media_width_px,
			   COALESCE(MAX(subcategory_media_height_px) FILTER (WHERE sample_rank = 1), MAX(height_px) FILTER (WHERE sample_rank = 1)) AS sample_media_height_px,
			   COALESCE(MAX(subcategory_media_mime_type) FILTER (WHERE sample_rank = 1), MAX(mime_type) FILTER (WHERE sample_rank = 1)) AS sample_media_mime_type
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

export async function listRiseopediaClassFilterOptions(
	filters: Pick<RiseopediaClassificationDirectoryFilters, "section">,
): Promise<RiseopediaClassificationFilterOption[]> {
	if (!filters.section) {
		return listRiseopediaMaterializedClassificationOptions({
			viewName: "web_view.riseopedia_hub_classes",
			valueColumn: "node_code",
		});
	}

	const result = await query<RiseopediaClassificationOptionRow>(
		`SELECT detail.entity_class_code AS value_code,
			   MIN(detail.entity_class_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.riseopedia_entity_detail detail
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

export async function listRiseopediaCategoryFilterOptions(
	filters: Pick<
		RiseopediaClassificationDirectoryFilters,
		"section" | "entityClassCode"
	>,
): Promise<RiseopediaClassificationFilterOption[]> {
	if (!filters.section && !filters.entityClassCode) {
		return listRiseopediaMaterializedClassificationOptions({
			viewName: "web_view.riseopedia_hub_categories",
			valueColumn: "node_name",
		});
	}

	const result = await query<RiseopediaClassificationOptionRow>(
		`SELECT MIN(detail.entity_category_name) AS value_code,
			   MIN(detail.entity_category_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND detail.entity_category_slug IS NOT NULL
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		 GROUP BY lower(btrim(detail.entity_category_name))
		 ORDER BY MIN(detail.entity_category_name) NULLS LAST`,
		[filters.section, filters.entityClassCode],
	);

	return result.rows.map(mapOptionRow);
}

export async function listRiseopediaSubcategoryFilterOptions(
	filters: RiseopediaClassificationDirectoryFilters,
): Promise<RiseopediaClassificationFilterOption[]> {
	if (!filters.section && !filters.entityClassCode && !filters.categorySlug) {
		return listRiseopediaMaterializedClassificationOptions({
			viewName: "web_view.riseopedia_hub_subcategories",
			valueColumn: "node_name",
		});
	}

	const result = await query<RiseopediaClassificationOptionRow>(
		`SELECT MIN(detail.entity_subcategory_name) AS value_code,
			   MIN(detail.entity_subcategory_name) AS display_name,
			   COUNT(*) AS item_count
		 FROM web_view.riseopedia_entity_detail detail
		 WHERE detail.public_visible_flag = true
		   AND detail.detail_visible_flag = true
		   AND detail.entity_subcategory_slug IS NOT NULL
		   AND ($1::text IS NULL OR detail.section_code = $1 OR detail.section_slug = $1)
		   AND ($2::text IS NULL OR detail.entity_class_code = $2)
		   AND ($3::text IS NULL
			OR detail.entity_category_slug = $3
			OR lower(btrim(detail.entity_category_name)) = lower(btrim($3)))
		 GROUP BY lower(btrim(detail.entity_subcategory_name))
		 ORDER BY MIN(detail.entity_subcategory_name) NULLS LAST`,
		filterValues(filters),
	);

	return result.rows.map(mapOptionRow);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
