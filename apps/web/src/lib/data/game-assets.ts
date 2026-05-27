//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/game-assets.ts                                                               ////
//// Language: TS                                                                                             ////
//// DB-first public game asset list and detail helpers for the game wiki API.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildGameMediaFileUrl } from "@/lib/helpers/game-media-files";

export type GameMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type GameAssetDoc = {
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
	rarityCode: string | null;
	stackSize: number | null;
	slotWidth: number | null;
	slotHeight: number | null;
	valueAmount: number | null;
	lastSeenPatchCode: string | null;
	iconMedia: GameMediaRef | null;
	detailMedia: GameMediaRef | null;
	updatedAt: string | null;
};

export type GameAssetProperty = {
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

export type GameAssetRecipeRef = {
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

export type GameAssetListFilters = {
	search: string | null;
	assetClassCode: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	brandCode: string | null;
	page: number;
	pageSize: number;
};

export type GameAssetListResult = {
	rows: GameAssetDoc[];
	page: number;
	pageSize: number;
	totalDocs: number;
	totalPages: number;
};

type GameAssetRow = {
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

type GameAssetPropertyRow = {
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

type GameAssetRecipeRefRow = {
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

const GAME_ASSET_SELECT_COLUMNS = `asset_id,
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

function mapAssetRow(row: GameAssetRow): GameAssetDoc {
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

function mapPropertyRow(row: GameAssetPropertyRow): GameAssetProperty {
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

function mapAssetRecipeRefRow(row: GameAssetRecipeRefRow): GameAssetRecipeRef {
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

function normalizeSearch(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized ? `%${normalized}%` : null;
}

export async function listGameAssets(
	filters: GameAssetListFilters,
): Promise<GameAssetListResult> {
	const offset = (filters.page - 1) * filters.pageSize;
	const result = await query<GameAssetRow>(
		`SELECT ${GAME_ASSET_SELECT_COLUMNS},
				COUNT(*) OVER() AS total_count
		 FROM web_view.game_assets
		 WHERE ($1::text IS NULL OR asset_name ILIKE $1 OR canonical_asset_key ILIKE $1)
		   AND ($2::text IS NULL OR asset_class_code = $2)
		   AND ($3::text IS NULL OR asset_category_slug = $3)
		   AND ($4::text IS NULL OR asset_subcategory_slug = $4)
		   AND ($5::text IS NULL OR primary_brand_code = $5)
		 ORDER BY asset_name,
				  asset_id
		 LIMIT $6
		 OFFSET $7`,
		[
			normalizeSearch(filters.search),
			filters.assetClassCode,
			filters.categorySlug,
			filters.subcategorySlug,
			filters.brandCode,
			filters.pageSize,
			offset,
		],
	);

	const totalDocs = result.rows[0]?.total_count
		? toNumber(result.rows[0].total_count)
		: 0;

	return {
		rows: result.rows.map(mapAssetRow),
		page: filters.page,
		pageSize: filters.pageSize,
		totalDocs,
		totalPages: totalDocs > 0 ? Math.ceil(totalDocs / filters.pageSize) : 0,
	};
}

export async function findGameAssetBySlug(
	slug: string,
): Promise<GameAssetDoc | null> {
	const result = await query<GameAssetRow>(
		`SELECT ${GAME_ASSET_SELECT_COLUMNS}
		 FROM web_view.game_assets
		 WHERE asset_slug = $1
		 LIMIT 1`,
		[slug],
	);

	const row = result.rows[0] ?? null;
	return row ? mapAssetRow(row) : null;
}

export async function listGameAssetProperties(
	assetId: string,
): Promise<GameAssetProperty[]> {
	const result = await query<GameAssetPropertyRow>(
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
		 FROM web_view.game_asset_properties
		 WHERE asset_id = $1::bigint
		 ORDER BY render_group_code,
				  property_name,
				  property_code`,
		[assetId],
	);

	return result.rows.map(mapPropertyRow);
}

export async function listRecipesUsingGameAsset(
	assetId: string,
): Promise<GameAssetRecipeRef[]> {
	const result = await query<GameAssetRecipeRefRow>(
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
		 FROM web_view.game_asset_used_in_recipes
		 WHERE asset_id = $1::bigint
		 ORDER BY recipe_name,
				  recipe_id`,
		[assetId],
	);

	return result.rows.map(mapAssetRecipeRefRow);
}

export async function listRecipesCraftingGameAsset(
	assetId: string,
): Promise<GameAssetRecipeRef[]> {
	const result = await query<GameAssetRecipeRefRow>(
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
		 FROM web_view.game_asset_crafted_by_recipes
		 WHERE asset_id = $1::bigint
		 ORDER BY primary_flag DESC,
				  recipe_name,
				  recipe_id`,
		[assetId],
	);

	return result.rows.map(mapAssetRecipeRefRow);
}
