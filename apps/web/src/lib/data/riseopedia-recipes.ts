//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-recipes.ts                                                         ////
//// Language: TS                                                                                             ////
//// DB-first public Riseopedia recipe list and detail helpers for the public API.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type { RiseopediaMediaRef } from "@/lib/data/riseopedia-assets";
import {
	mapEntitySectionRefRow,
	type RiseopediaEntitySectionRef,
	type RiseopediaEntitySectionRefRow,
} from "@/lib/data/riseopedia-sections";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaRecipeDoc = {
	id: string;
	recipeKey: string;
	name: string;
	slug: string;
	statusCode: string;
	effectiveVisibilityCode: string;
	listable: boolean;
	detailAllowed: boolean;
	searchable: boolean;
	benchCode: string | null;
	benchName: string | null;
	craftingTier: number | null;
	requiredPerkSourceKey: string | null;
	durationSeconds: number | null;
	xpValue: number | null;
	lastSeenPatchCode: string | null;
	primaryMedia: RiseopediaMediaRef | null;
	primaryMediaSourceCode: string | null;
	primaryMediaResolutionReasonCode: string | null;
	primaryMediaOutputAssetId: string | null;
	primaryMediaOutputAssetName: string | null;
	outputAssetId: string | null;
	outputCanonicalAssetKey: string | null;
	outputAssetName: string | null;
	outputAssetSlug: string | null;
	outputIconMedia: RiseopediaMediaRef | null;
	updatedAt: string | null;
};

export type RiseopediaRecipeAssetRef = {
	assetId: string;
	canonicalAssetKey: string;
	assetName: string;
	assetSlug: string;
	assetClassCode: string;
	assetClassName: string;
	quantityValue: number | null;
	quantityText: string | null;
	unitCode: string | null;
	sourceRefValue: string;
	resolutionStatusCode: string;
	isPlaceholder: boolean;
	primary: boolean | null;
	iconMedia: RiseopediaMediaRef | null;
};

export type RiseopediaRecipeListFilters = {
	search: string | null;
	section: string | null;
	benchCode: string | null;
	page: number;
	pageSize: number;
};

export type RiseopediaRecipeListResult = {
	rows: RiseopediaRecipeDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type RiseopediaRecipeRow = {
	recipe_id: string | number;
	recipe_key: string;
	recipe_name: string;
	recipe_slug: string;
	recipe_status_code: string;
	effective_visibility_code: string;
	listable_flag: boolean;
	detail_allowed_flag: boolean;
	searchable_flag: boolean;
	bench_code: string | null;
	bench_name: string | null;
	crafting_tier: number | null;
	required_perk_source_key: string | null;
	duration_seconds: string | number | null;
	xp_value: string | number | null;
	last_seen_patch_code: string | null;
	primary_media_id: string | number | null;
	primary_media_width_px: number | null;
	primary_media_height_px: number | null;
	primary_media_mime_type: string | null;
	primary_media_source_code: string | null;
	primary_media_resolution_reason_code: string | null;
	primary_media_output_asset_id: string | number | null;
	primary_media_output_asset_name: string | null;
	updated_dt: Date | string | null;
	total_count?: string | number;
};

type RiseopediaRecipeAssetRefRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	asset_name: string;
	asset_slug: string;
	asset_class_code: string;
	asset_class_name: string;
	quantity_value: string | number | null;
	quantity_text: string | null;
	unit_code: string | null;
	source_ref_value: string;
	resolution_status_code: string;
	asset_is_placeholder: boolean;
	primary_flag: boolean | null;
	icon_media_id: string | number | null;
	icon_media_width_px: number | null;
	icon_media_height_px: number | null;
	icon_media_mime_type: string | null;
};

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

function normalizeSearch(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized ? `%${normalized}%` : null;
}

function mapRecipeRow(row: RiseopediaRecipeRow): RiseopediaRecipeDoc {
	const primaryMedia = mapMediaRef({
		mediaId: row.primary_media_id,
		width: row.primary_media_width_px,
		height: row.primary_media_height_px,
		mimeType: row.primary_media_mime_type,
	});
	const outputAssetId = row.primary_media_output_asset_id === null
		? null
		: String(row.primary_media_output_asset_id);

	return {
		id: String(row.recipe_id),
		recipeKey: row.recipe_key,
		name: row.recipe_name,
		slug: row.recipe_slug,
		statusCode: row.recipe_status_code,
		effectiveVisibilityCode: row.effective_visibility_code,
		listable: row.listable_flag,
		detailAllowed: row.detail_allowed_flag,
		searchable: row.searchable_flag,
		benchCode: row.bench_code,
		benchName: row.bench_name,
		craftingTier: row.crafting_tier,
		requiredPerkSourceKey: row.required_perk_source_key,
		durationSeconds: toNullableNumber(row.duration_seconds),
		xpValue: toNullableNumber(row.xp_value),
		lastSeenPatchCode: row.last_seen_patch_code,
		primaryMedia,
		primaryMediaSourceCode: row.primary_media_source_code,
		primaryMediaResolutionReasonCode: row.primary_media_resolution_reason_code,
		primaryMediaOutputAssetId: outputAssetId,
		primaryMediaOutputAssetName: row.primary_media_output_asset_name,
		outputAssetId,
		outputCanonicalAssetKey: null,
		outputAssetName: row.primary_media_output_asset_name,
		outputAssetSlug: null,
		outputIconMedia: primaryMedia,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapRecipeAssetRefRow(row: RiseopediaRecipeAssetRefRow): RiseopediaRecipeAssetRef {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		assetName: row.asset_name,
		assetSlug: row.asset_slug,
		assetClassCode: row.asset_class_code,
		assetClassName: row.asset_class_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		unitCode: row.unit_code,
		sourceRefValue: row.source_ref_value,
		resolutionStatusCode: row.resolution_status_code,
		isPlaceholder: row.asset_is_placeholder,
		primary: row.primary_flag,
		iconMedia: mapMediaRef({
			mediaId: row.icon_media_id,
			width: row.icon_media_width_px,
			height: row.icon_media_height_px,
			mimeType: row.icon_media_mime_type,
		}),
	};
}

export async function listRiseopediaRecipes(
	filters: RiseopediaRecipeListFilters,
): Promise<RiseopediaRecipeListResult> {
	const filterValues = [
		normalizeSearch(filters.search),
		filters.section,
		filters.benchCode,
	];
	const countResult = await query<{ total_count: string | number }>(
		`SELECT COUNT(*)::bigint AS total_count
		 FROM web_view.riseopedia_recipe_browse_rows recipes
		 WHERE ($1::text IS NULL OR recipes.recipe_name ILIKE $1 OR recipes.recipe_key ILIKE $1)
		   AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.riseopedia_recipe_browse_section_memberships membership
				WHERE membership.recipe_id = recipes.recipe_id
				  AND (membership.section_code = $2 OR membership.section_slug = $2)
			))
		   AND ($3::text IS NULL OR recipes.bench_code = $3)`,
		filterValues,
	);
	const totalDocs = countResult.rows[0]
		? toNumber(countResult.rows[0].total_count)
		: 0;
	const totalPages = totalDocs > 0 ? Math.ceil(totalDocs / filters.pageSize) : 0;
	const page = totalPages > 0 ? Math.min(filters.page, totalPages) : filters.page;
	const offset = (page - 1) * filters.pageSize;
	const result = await query<RiseopediaRecipeRow>(
		`SELECT recipes.recipe_id,
				recipes.recipe_key,
				recipes.recipe_name,
				recipes.recipe_slug,
				recipes.recipe_status_code,
				recipes.effective_visibility_code,
				recipes.listable_flag,
				recipes.detail_allowed_flag,
				recipes.searchable_flag,
				recipes.bench_code,
				recipes.bench_name,
				recipes.crafting_tier,
				recipes.required_perk_source_key,
				recipes.duration_seconds,
				recipes.xp_value,
				recipes.last_seen_patch_code,
				recipes.primary_media_id,
				recipes.primary_media_width_px,
				recipes.primary_media_height_px,
				recipes.primary_media_mime_type,
				recipes.primary_media_source_code,
				recipes.primary_media_resolution_reason_code,
				recipes.primary_media_output_asset_id,
				recipes.primary_media_output_asset_name,
				recipes.updated_dt
		 FROM web_view.riseopedia_recipe_browse_rows recipes
		 WHERE ($1::text IS NULL OR recipes.recipe_name ILIKE $1 OR recipes.recipe_key ILIKE $1)
		   AND ($2::text IS NULL OR EXISTS (
				SELECT 1
				FROM web_view.riseopedia_recipe_browse_section_memberships membership
				WHERE membership.recipe_id = recipes.recipe_id
				  AND (membership.section_code = $2 OR membership.section_slug = $2)
			))
		   AND ($3::text IS NULL OR recipes.bench_code = $3)
		 ORDER BY recipes.recipe_name,
				  recipes.recipe_id
		 LIMIT $4
		 OFFSET $5`,
		[...filterValues, filters.pageSize, offset],
	);

	return {
		rows: result.rows.map(mapRecipeRow),
		page,
		pageSize: filters.pageSize,
		totalDocs,
		totalPages,
	};
}

export async function findRiseopediaRecipeBySlug(
	slug: string,
): Promise<RiseopediaRecipeDoc | null> {
	const result = await query<RiseopediaRecipeRow>(
		`SELECT recipes.recipe_id,
				recipes.recipe_key,
				recipes.recipe_name,
				recipes.recipe_slug,
				recipes.recipe_status_code,
				recipes.effective_visibility_code,
				recipes.listable_flag,
				recipes.detail_allowed_flag,
				recipes.searchable_flag,
				recipes.bench_code,
				recipes.bench_name,
				recipes.crafting_tier,
				recipes.required_perk_source_key,
				recipes.duration_seconds,
				recipes.xp_value,
				recipes.last_seen_patch_code,
				recipes.primary_media_id,
				recipes.primary_media_width_px,
				recipes.primary_media_height_px,
				recipes.primary_media_mime_type,
				recipes.primary_media_source_code,
				recipes.primary_media_resolution_reason_code,
				recipes.primary_media_output_asset_id,
				recipes.primary_media_output_asset_name,
				recipes.updated_dt
		 FROM web_view.riseopedia_recipe_browse_rows recipes
		 WHERE recipes.recipe_slug = $1
		 LIMIT 1`,
		[slug],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRecipeRow(row) : null;
}

export async function listRiseopediaRecipeSections(
	recipeId: string,
): Promise<RiseopediaEntitySectionRef[]> {
	const result = await query<RiseopediaEntitySectionRefRow>(
		`SELECT section_id,
				section_code,
				section_slug,
				section_name,
				section_sort_order,
				rule_sort_order
		 FROM web_view.riseopedia_recipe_browse_section_memberships
		 WHERE recipe_id = $1::bigint
		 ORDER BY section_sort_order,
				  rule_sort_order,
				  section_name,
				  section_id`,
		[recipeId],
	);

	return result.rows.map(mapEntitySectionRefRow);
}

export async function listRiseopediaRecipeComponents(
	recipeId: string,
): Promise<RiseopediaRecipeAssetRef[]> {
	const result = await query<RiseopediaRecipeAssetRefRow>(
		`SELECT asset_id,
				canonical_asset_key,
				asset_name,
				asset_slug,
				asset_class_code,
				asset_class_name,
				quantity_value,
				quantity_text,
				unit_code,
				source_ref_value,
				resolution_status_code,
				asset_is_placeholder,
				NULL::boolean AS primary_flag,
				icon_media_id,
				icon_media_width_px,
				icon_media_height_px,
				icon_media_mime_type
		 FROM web_view.riseopedia_recipe_component_rows
		 WHERE recipe_id = $1::bigint
		 ORDER BY sort_order,
				  asset_name,
				  asset_id`,
		[recipeId],
	);

	return result.rows.map(mapRecipeAssetRefRow);
}

export async function listRiseopediaRecipeOutputs(
	recipeId: string,
): Promise<RiseopediaRecipeAssetRef[]> {
	const result = await query<RiseopediaRecipeAssetRefRow>(
		`SELECT asset_id,
				canonical_asset_key,
				asset_name,
				asset_slug,
				asset_class_code,
				asset_class_name,
				quantity_value,
				quantity_text,
				unit_code,
				source_ref_value,
				resolution_status_code,
				asset_is_placeholder,
				primary_flag,
				icon_media_id,
				icon_media_width_px,
				icon_media_height_px,
				icon_media_mime_type
		 FROM web_view.riseopedia_recipe_output_rows
		 WHERE recipe_id = $1::bigint
		 ORDER BY primary_flag DESC,
				  sort_order,
				  asset_name,
				  asset_id`,
		[recipeId],
	);

	return result.rows.map(mapRecipeAssetRefRow);
}
