//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/game-recipes.ts                                                              ////
//// Language: TS                                                                                             ////
//// DB-first public game recipe list and detail helpers for the game wiki API.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import type { GameMediaRef } from "@/lib/data/game-assets";
import { buildGameMediaFileUrl } from "@/lib/helpers/game-media-files";

export type GameRecipeDoc = {
	id: string;
	recipeKey: string;
	name: string;
	slug: string;
	statusCode: string;
	benchCode: string | null;
	benchName: string | null;
	craftingTier: number | null;
	requiredPerkSourceKey: string | null;
	durationSeconds: number | null;
	xpValue: number | null;
	lastSeenPatchCode: string | null;
	updatedAt: string | null;
};

export type GameRecipeAssetRef = {
	assetId: string;
	canonicalAssetKey: string;
	assetName: string;
	assetSlug: string;
	assetClassCode: string;
	assetClassName: string;
	quantityValue: number | null;
	quantityText: string | null;
	primary: boolean | null;
	iconMedia: GameMediaRef | null;
};

export type GameRecipeListFilters = {
	search: string | null;
	benchCode: string | null;
	page: number;
	pageSize: number;
};

export type GameRecipeListResult = {
	rows: GameRecipeDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type GameRecipeRow = {
	recipe_id: string | number;
	recipe_key: string;
	recipe_name: string;
	recipe_slug: string;
	recipe_status_code: string;
	bench_code: string | null;
	bench_name: string | null;
	crafting_tier: number | null;
	required_perk_source_key: string | null;
	duration_seconds: string | number | null;
	xp_value: string | number | null;
	last_seen_patch_code: string | null;
	updated_dt: Date | string | null;
	total_count?: string | number;
};

type GameRecipeAssetRefRow = {
	asset_id: string | number;
	canonical_asset_key: string;
	asset_name: string;
	asset_slug: string;
	asset_class_code: string;
	asset_class_name: string;
	quantity_value: string | number | null;
	quantity_text: string | null;
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
}): GameMediaRef | null {
	if (args.mediaId === null) {
		return null;
	}

	const mediaId = String(args.mediaId);

	return {
		mediaId,
		url: buildGameMediaFileUrl(mediaId),
		width: args.width,
		height: args.height,
		mimeType: args.mimeType,
	};
}

function normalizeSearch(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized ? `%${normalized}%` : null;
}

function mapRecipeRow(row: GameRecipeRow): GameRecipeDoc {
	return {
		id: String(row.recipe_id),
		recipeKey: row.recipe_key,
		name: row.recipe_name,
		slug: row.recipe_slug,
		statusCode: row.recipe_status_code,
		benchCode: row.bench_code,
		benchName: row.bench_name,
		craftingTier: row.crafting_tier,
		requiredPerkSourceKey: row.required_perk_source_key,
		durationSeconds: toNullableNumber(row.duration_seconds),
		xpValue: toNullableNumber(row.xp_value),
		lastSeenPatchCode: row.last_seen_patch_code,
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapRecipeAssetRefRow(row: GameRecipeAssetRefRow): GameRecipeAssetRef {
	return {
		assetId: String(row.asset_id),
		canonicalAssetKey: row.canonical_asset_key,
		assetName: row.asset_name,
		assetSlug: row.asset_slug,
		assetClassCode: row.asset_class_code,
		assetClassName: row.asset_class_name,
		quantityValue: toNullableNumber(row.quantity_value),
		quantityText: row.quantity_text,
		primary: row.primary_flag,
		iconMedia: mapMediaRef({
			mediaId: row.icon_media_id,
			width: row.icon_media_width_px,
			height: row.icon_media_height_px,
			mimeType: row.icon_media_mime_type,
		}),
	};
}

export async function listGameRecipes(
	filters: GameRecipeListFilters,
): Promise<GameRecipeListResult> {
	const offset = (filters.page - 1) * filters.pageSize;
	const result = await query<GameRecipeRow>(
		`SELECT recipe_id,
				recipe_key,
				recipe_name,
				recipe_slug,
				recipe_status_code,
				bench_code,
				bench_name,
				crafting_tier,
				required_perk_source_key,
				duration_seconds,
				xp_value,
				last_seen_patch_code,
				updated_dt,
				COUNT(*) OVER() AS total_count
		 FROM web_view.game_recipes
		 WHERE ($1::text IS NULL OR recipe_name ILIKE $1 OR recipe_key ILIKE $1)
		   AND ($2::text IS NULL OR bench_code = $2)
		 ORDER BY recipe_name,
				  recipe_id
		 LIMIT $3
		 OFFSET $4`,
		[normalizeSearch(filters.search), filters.benchCode, filters.pageSize, offset],
	);

	const totalDocs = result.rows[0]?.total_count
		? toNumber(result.rows[0].total_count)
		: 0;

	return {
		rows: result.rows.map(mapRecipeRow),
		page: filters.page,
		pageSize: filters.pageSize,
		totalDocs,
		totalPages: totalDocs > 0 ? Math.ceil(totalDocs / filters.pageSize) : 0,
	};
}

export async function findGameRecipeBySlug(
	slug: string,
): Promise<GameRecipeDoc | null> {
	const result = await query<GameRecipeRow>(
		`SELECT recipe_id,
				recipe_key,
				recipe_name,
				recipe_slug,
				recipe_status_code,
				bench_code,
				bench_name,
				crafting_tier,
				required_perk_source_key,
				duration_seconds,
				xp_value,
				last_seen_patch_code,
				updated_dt
		 FROM web_view.game_recipes
		 WHERE recipe_slug = $1
		 LIMIT 1`,
		[slug],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRecipeRow(row) : null;
}

export async function listGameRecipeComponents(
	recipeId: string,
): Promise<GameRecipeAssetRef[]> {
	const result = await query<GameRecipeAssetRefRow>(
		`SELECT a.asset_id,
				a.canonical_asset_key,
				a.asset_name,
				a.asset_slug,
				a.asset_class_code,
				a.asset_class_name,
				used.quantity_value,
				used.quantity_text,
				NULL::boolean AS primary_flag,
				a.icon_media_id,
				a.icon_media_width_px,
				a.icon_media_height_px,
				a.icon_media_mime_type
		 FROM web_view.game_asset_used_in_recipes used
		 JOIN web_view.game_assets a
		   ON a.asset_id = used.asset_id
		 WHERE used.recipe_id = $1::bigint
		 ORDER BY a.asset_name,
				  a.asset_id`,
		[recipeId],
	);

	return result.rows.map(mapRecipeAssetRefRow);
}

export async function listGameRecipeOutputs(
	recipeId: string,
): Promise<GameRecipeAssetRef[]> {
	const result = await query<GameRecipeAssetRefRow>(
		`SELECT a.asset_id,
				a.canonical_asset_key,
				a.asset_name,
				a.asset_slug,
				a.asset_class_code,
				a.asset_class_name,
				crafted.quantity_value,
				crafted.quantity_text,
				crafted.primary_flag,
				a.icon_media_id,
				a.icon_media_width_px,
				a.icon_media_height_px,
				a.icon_media_mime_type
		 FROM web_view.game_asset_crafted_by_recipes crafted
		 JOIN web_view.game_assets a
		   ON a.asset_id = crafted.asset_id
		 WHERE crafted.recipe_id = $1::bigint
		 ORDER BY crafted.primary_flag DESC,
				  a.asset_name,
				  a.asset_id`,
		[recipeId],
	);

	return result.rows.map(mapRecipeAssetRefRow);
}
