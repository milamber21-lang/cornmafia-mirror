//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-sections.ts                                                       ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia section helpers for public hub, filters, media samples, and section detail pages.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaSectionDoc = {
	id: string;
	code: string;
	slug: string;
	name: string;
	description: string | null;
	modeCode: string;
	modeName: string;
	publicVisible: boolean;
	showWhenEmpty: boolean;
	sortOrder: number;
	itemCount: number;
	updatedAt: string | null;
};

export type RiseopediaEntitySectionRef = {
	id: string;
	code: string;
	slug: string;
	name: string;
	sortOrder: number;
	ruleSortOrder: number;
};

export type RiseopediaSectionMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type RiseopediaSectionMediaSample = {
	sectionCode: string;
	sectionSlug: string;
	entityTypeCode: string;
	entityName: string;
	entitySlug: string;
	media: RiseopediaSectionMediaRef;
};

export type RiseopediaSectionItemDoc = {
	sectionId: string;
	sectionCode: string;
	sectionSlug: string;
	sectionName: string;
	entityTypeCode: string;
	entityKey: string;
	entityId: string;
	entityName: string;
	entitySlug: string;
	entitySubtitle: string | null;
	assetClassCode: string | null;
	assetClassName: string | null;
	benchCode: string | null;
	benchName: string | null;
	media: RiseopediaSectionMediaRef | null;
	itemSortOrder: number;
	pinned: boolean;
	featured: boolean;
	sourceCode: string;
	effectiveVisibilityCode: string;
};

export type RiseopediaSectionItemListFilters = {
	section: string;
	search: string | null;
	page: number;
	pageSize: number;
};

export type RiseopediaSectionItemListResult = {
	rows: RiseopediaSectionItemDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type RiseopediaSectionRow = {
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	description: string | null;
	section_mode_code: string;
	section_mode_name: string;
	public_visible_flag: boolean;
	show_when_empty_flag: boolean;
	sort_order: string | number;
	item_count: string | number;
	updated_dt: Date | string | null;
};

export type RiseopediaEntitySectionRefRow = {
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	section_sort_order: string | number;
	rule_sort_order: string | number;
};

type RiseopediaSectionMediaSampleRow = {
	section_code: string;
	section_slug: string;
	entity_type_code: string;
	entity_name: string;
	entity_slug: string;
	icon_media_id: string | number;
	icon_media_width_px: number | null;
	icon_media_height_px: number | null;
	icon_media_mime_type: string | null;
};

type RiseopediaSectionItemRow = {
	section_id: string | number;
	section_code: string;
	section_slug: string;
	section_name: string;
	entity_type_code: string;
	entity_key: string;
	entity_id: string;
	entity_name: string;
	entity_slug: string;
	entity_subtitle: string | null;
	asset_class_code: string | null;
	asset_class_name: string | null;
	bench_code: string | null;
	bench_name: string | null;
	media_id: string | number | null;
	media_width_px: number | null;
	media_height_px: number | null;
	media_mime_type: string | null;
	item_sort_order: string | number;
	pinned_flag: boolean;
	featured_flag: boolean;
	source_code: string;
	effective_visibility_code: string;
};

type CountRow = {
	total_count: string | number;
};

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function toIsoString(value: Date | string | null): string | null {
	if (value === null) {
		return null;
	}

	return value instanceof Date ? value.toISOString() : value;
}

function totalPages(totalDocs: number, pageSize: number): number {
	return Math.max(1, Math.ceil(totalDocs / pageSize));
}

function normalizedPage(page: number, pageCount: number): number {
	if (!Number.isInteger(page) || page < 1) {
		return 1;
	}

	return Math.min(page, pageCount);
}

function normalizedPageSize(pageSize: number): number {
	return Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 24;
}

function normalizedSearch(search: string | null): string | null {
	const trimmed = search?.trim();
	return trimmed && trimmed.length > 0 ? trimmed : null;
}

function offsetForPage(page: number, pageSize: number): number {
	return (page - 1) * pageSize;
}

function mapSectionRow(row: RiseopediaSectionRow): RiseopediaSectionDoc {
	return {
		id: String(row.section_id),
		code: row.section_code,
		slug: row.section_slug,
		name: row.section_name,
		description: row.description,
		modeCode: row.section_mode_code,
		modeName: row.section_mode_name,
		publicVisible: row.public_visible_flag,
		showWhenEmpty: row.show_when_empty_flag,
		sortOrder: toNumber(row.sort_order),
		itemCount: toNumber(row.item_count),
		updatedAt: toIsoString(row.updated_dt),
	};
}

export function mapEntitySectionRefRow(
	row: RiseopediaEntitySectionRefRow,
): RiseopediaEntitySectionRef {
	return {
		id: String(row.section_id),
		code: row.section_code,
		slug: row.section_slug,
		name: row.section_name,
		sortOrder: toNumber(row.section_sort_order),
		ruleSortOrder: toNumber(row.rule_sort_order),
	};
}

function mapMediaRef(args: {
	mediaId: string | number | null;
	width: number | null;
	height: number | null;
	mimeType: string | null;
}): RiseopediaSectionMediaRef | null {
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

function mapSectionMediaSampleRow(
	row: RiseopediaSectionMediaSampleRow,
): RiseopediaSectionMediaSample {
	const media = mapMediaRef({
		mediaId: row.icon_media_id,
		width: row.icon_media_width_px,
		height: row.icon_media_height_px,
		mimeType: row.icon_media_mime_type,
	});

	if (!media) {
		throw new Error("Riseopedia section media sample row is missing media.");
	}

	return {
		sectionCode: row.section_code,
		sectionSlug: row.section_slug,
		entityTypeCode: row.entity_type_code,
		entityName: row.entity_name,
		entitySlug: row.entity_slug,
		media,
	};
}

function mapSectionItemRow(row: RiseopediaSectionItemRow): RiseopediaSectionItemDoc {
	return {
		sectionId: String(row.section_id),
		sectionCode: row.section_code,
		sectionSlug: row.section_slug,
		sectionName: row.section_name,
		entityTypeCode: row.entity_type_code,
		entityKey: row.entity_key,
		entityId: row.entity_id,
		entityName: row.entity_name,
		entitySlug: row.entity_slug,
		entitySubtitle: row.entity_subtitle,
		assetClassCode: row.asset_class_code,
		assetClassName: row.asset_class_name,
		benchCode: row.bench_code,
		benchName: row.bench_name,
		media: mapMediaRef({
			mediaId: row.media_id,
			width: row.media_width_px,
			height: row.media_height_px,
			mimeType: row.media_mime_type,
		}),
		itemSortOrder: toNumber(row.item_sort_order),
		pinned: row.pinned_flag,
		featured: row.featured_flag,
		sourceCode: row.source_code,
		effectiveVisibilityCode: row.effective_visibility_code,
	};
}

export async function listRiseopediaSections(): Promise<RiseopediaSectionDoc[]> {
	const result = await query<RiseopediaSectionRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				description,
				section_mode_code,
				section_mode_name,
				public_visible_flag,
				show_when_empty_flag,
				sort_order,
				item_count,
				updated_dt
		 FROM web_view.riseopedia_sections
		 ORDER BY sort_order,
				  section_name,
				  section_id`,
	);

	return result.rows.map(mapSectionRow);
}

export async function findRiseopediaSectionBySlug(
	sectionSlug: string,
): Promise<RiseopediaSectionDoc | null> {
	const result = await query<RiseopediaSectionRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				description,
				section_mode_code,
				section_mode_name,
				public_visible_flag,
				show_when_empty_flag,
				sort_order,
				item_count,
				updated_dt
		 FROM web_view.riseopedia_sections
		 WHERE section_slug = $1
		   AND (public_visible_flag = true OR show_when_empty_flag = true)
		 LIMIT 1`,
		[sectionSlug],
	);

	return result.rows[0] ? mapSectionRow(result.rows[0]) : null;
}

export async function listRiseopediaSectionMediaSamples(): Promise<
	RiseopediaSectionMediaSample[]
> {
	const result = await query<RiseopediaSectionMediaSampleRow>(
		`WITH item_media AS (
				SELECT items.section_code,
					   items.section_slug,
					   items.entity_type_code,
					   items.entity_key,
					   items.entity_name,
					   items.entity_slug,
					   items.icon_media_id,
					   items.icon_media_width_px,
					   items.icon_media_height_px,
					   items.icon_media_mime_type,
					   items.pinned_flag,
					   items.featured_flag,
					   items.item_sort_order,
					   0 AS output_sort_order
				FROM web_view.riseopedia_section_items items
				WHERE items.icon_media_id IS NOT NULL
				UNION ALL
				SELECT items.section_code,
					   items.section_slug,
					   items.entity_type_code,
					   items.entity_key,
					   items.entity_name,
					   items.entity_slug,
					   crafted.icon_media_id,
					   crafted.icon_media_width_px,
					   crafted.icon_media_height_px,
					   crafted.icon_media_mime_type,
					   items.pinned_flag,
					   items.featured_flag,
					   items.item_sort_order,
					   crafted.sort_order AS output_sort_order
				FROM web_view.riseopedia_section_items items
				JOIN web_view.riseopedia_asset_crafted_by_recipes crafted
				  ON crafted.recipe_key = items.entity_key
				WHERE items.entity_type_code = 'recipe'
				  AND crafted.icon_media_id IS NOT NULL
			)
		 SELECT DISTINCT ON (section_code)
				section_code,
				section_slug,
				entity_type_code,
				entity_name,
				entity_slug,
				icon_media_id,
				icon_media_width_px,
				icon_media_height_px,
				icon_media_mime_type
		 FROM item_media
		 ORDER BY section_code,
				  featured_flag DESC,
				  pinned_flag DESC,
				  md5(entity_type_code || ':' || entity_key),
				  item_sort_order,
				  output_sort_order,
				  entity_name`,
	);

	return result.rows.map(mapSectionMediaSampleRow);
}

async function countRiseopediaSectionItems(args: {
	sectionSlug: string;
	search: string | null;
}): Promise<number> {
	const result = await query<CountRow>(
		`SELECT COUNT(*) AS total_count
		 FROM web_view.riseopedia_section_items items
		 WHERE items.section_slug = $1
		   AND ($2::text IS NULL
		        OR items.entity_name ILIKE ('%' || $2 || '%')
		        OR items.entity_subtitle ILIKE ('%' || $2 || '%')
		        OR items.asset_class_name ILIKE ('%' || $2 || '%')
		        OR items.bench_name ILIKE ('%' || $2 || '%'))`,
		[args.sectionSlug, args.search],
	);

	return result.rows[0] ? toNumber(result.rows[0].total_count) : 0;
}

export async function listRiseopediaSectionItems(
	filters: RiseopediaSectionItemListFilters,
): Promise<RiseopediaSectionItemListResult> {
	const pageSize = normalizedPageSize(filters.pageSize);
	const search = normalizedSearch(filters.search);
	const totalDocs = await countRiseopediaSectionItems({
		sectionSlug: filters.section,
		search,
	});
	const pageCount = totalPages(totalDocs, pageSize);
	const page = normalizedPage(filters.page, pageCount);
	const offset = offsetForPage(page, pageSize);

	if (totalDocs <= 0) {
		return {
			rows: [],
			page: 1,
			pageSize,
			totalDocs: 0,
			totalPages: 1,
		};
	}

	const result = await query<RiseopediaSectionItemRow>(
		`SELECT items.section_id,
				items.section_code,
				items.section_slug,
				items.section_name,
				items.entity_type_code,
				items.entity_key,
				items.entity_id,
				items.entity_name,
				items.entity_slug,
				items.entity_subtitle,
				items.asset_class_code,
				items.asset_class_name,
				items.bench_code,
				items.bench_name,
				COALESCE(items.icon_media_id, recipe_media.icon_media_id) AS media_id,
				COALESCE(items.icon_media_width_px, recipe_media.icon_media_width_px) AS media_width_px,
				COALESCE(items.icon_media_height_px, recipe_media.icon_media_height_px) AS media_height_px,
				COALESCE(items.icon_media_mime_type, recipe_media.icon_media_mime_type) AS media_mime_type,
				items.item_sort_order,
				items.pinned_flag,
				items.featured_flag,
				items.source_code,
				items.effective_visibility_code
		 FROM web_view.riseopedia_section_items items
		 LEFT JOIN LATERAL (
			SELECT crafted.icon_media_id,
				   crafted.icon_media_width_px,
				   crafted.icon_media_height_px,
				   crafted.icon_media_mime_type
			FROM web_view.riseopedia_asset_crafted_by_recipes crafted
			WHERE items.entity_type_code = 'recipe'
			  AND crafted.recipe_key = items.entity_key
			  AND crafted.icon_media_id IS NOT NULL
			ORDER BY crafted.primary_flag DESC NULLS LAST,
					 crafted.sort_order,
					 crafted.asset_name,
					 crafted.asset_id
			LIMIT 1
		 ) recipe_media ON true
		 WHERE items.section_slug = $1
		   AND ($2::text IS NULL
		        OR items.entity_name ILIKE ('%' || $2 || '%')
		        OR items.entity_subtitle ILIKE ('%' || $2 || '%')
		        OR items.asset_class_name ILIKE ('%' || $2 || '%')
		        OR items.bench_name ILIKE ('%' || $2 || '%'))
		 ORDER BY items.pinned_flag DESC,
				  items.featured_flag DESC,
				  items.item_sort_order,
				  items.entity_name,
				  items.entity_type_code,
				  items.entity_key
		 LIMIT $3
		 OFFSET $4`,
		[filters.section, search, pageSize, offset],
	);

	return {
		rows: result.rows.map(mapSectionItemRow),
		page,
		pageSize,
		totalDocs,
		totalPages: pageCount,
	};
}
