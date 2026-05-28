//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-hub.ts                                                            ////
//// Language: TS                                                                                             ////
//// Lightweight DB-first data loader for the public Riseopedia hub surface.                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import type {
	RiseopediaAssetClassDoc,
	RiseopediaAssetClassMediaSample,
} from "@/lib/data/riseopedia-asset-classes";
import type {
	RiseopediaAssetDoc,
	RiseopediaAssetListResult,
	RiseopediaMediaRef,
} from "@/lib/data/riseopedia-assets";
import { query } from "@/lib/data/pg";
import type {
	RiseopediaRecipeDoc,
	RiseopediaRecipeListResult,
} from "@/lib/data/riseopedia-recipes";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaHubData = {
	assets: RiseopediaAssetListResult;
	recipes: RiseopediaRecipeListResult;
	sections: RiseopediaSectionDoc[];
	assetClasses: RiseopediaAssetClassDoc[];
	sectionMediaSamples: RiseopediaSectionMediaSample[];
	assetClassMediaSamples: RiseopediaAssetClassMediaSample[];
};

type RiseopediaHubCountsRow = {
	asset_count: string | number;
	recipe_count: string | number;
	section_count: string | number;
	asset_class_count: string | number;
};

type RiseopediaHubAssetPreviewRow = {
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
};

type RiseopediaHubRecipePreviewRow = {
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
};

type RiseopediaHubSectionRow = {
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
	sample_entity_type_code: string | null;
	sample_entity_name: string | null;
	sample_entity_slug: string | null;
	sample_media_id: string | number | null;
	sample_media_width_px: number | null;
	sample_media_height_px: number | null;
	sample_media_mime_type: string | null;
};

type RiseopediaHubAssetClassRow = {
	asset_class_id: string | number;
	asset_class_code: string;
	asset_class_name: string;
	description: string | null;
	sort_order: string | number;
	asset_count: string | number;
	updated_dt: Date | string | null;
	sample_asset_name: string | null;
	sample_asset_slug: string | null;
	sample_media_id: string | number | null;
	sample_media_width_px: number | null;
	sample_media_height_px: number | null;
	sample_media_mime_type: string | null;
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

function mapAssetPreviewRow(row: RiseopediaHubAssetPreviewRow): RiseopediaAssetDoc {
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

function mapRecipePreviewRow(row: RiseopediaHubRecipePreviewRow): RiseopediaRecipeDoc {
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

function mapHubSectionRow(row: RiseopediaHubSectionRow): RiseopediaSectionDoc {
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

function mapHubSectionSampleRow(
	row: RiseopediaHubSectionRow,
): RiseopediaSectionMediaSample | null {
	const media = mapMediaRef({
		mediaId: row.sample_media_id,
		width: row.sample_media_width_px,
		height: row.sample_media_height_px,
		mimeType: row.sample_media_mime_type,
	});

	if (
		media === null
		|| row.sample_entity_type_code === null
		|| row.sample_entity_name === null
		|| row.sample_entity_slug === null
	) {
		return null;
	}

	return {
		sectionCode: row.section_code,
		sectionSlug: row.section_slug,
		entityTypeCode: row.sample_entity_type_code,
		entityName: row.sample_entity_name,
		entitySlug: row.sample_entity_slug,
		media,
	};
}

function mapHubAssetClassRow(row: RiseopediaHubAssetClassRow): RiseopediaAssetClassDoc {
	return {
		id: String(row.asset_class_id),
		code: row.asset_class_code,
		name: row.asset_class_name,
		description: row.description,
		sortOrder: toNumber(row.sort_order),
		assetCount: toNumber(row.asset_count),
		updatedAt: toIsoString(row.updated_dt),
	};
}

function mapHubAssetClassSampleRow(
	row: RiseopediaHubAssetClassRow,
): RiseopediaAssetClassMediaSample | null {
	const media = mapMediaRef({
		mediaId: row.sample_media_id,
		width: row.sample_media_width_px,
		height: row.sample_media_height_px,
		mimeType: row.sample_media_mime_type,
	});

	if (media === null || row.sample_asset_name === null || row.sample_asset_slug === null) {
		return null;
	}

	return {
		assetClassCode: row.asset_class_code,
		assetName: row.sample_asset_name,
		assetSlug: row.sample_asset_slug,
		media,
	};
}

function emptyCounts(): RiseopediaHubCountsRow {
	return {
		asset_count: 0,
		recipe_count: 0,
		section_count: 0,
		asset_class_count: 0,
	};
}

function nonNull<T>(value: T | null): value is T {
	return value !== null;
}

export async function getRiseopediaHubData(): Promise<RiseopediaHubData> {
	const [
		countResult,
		assetPreviewResult,
		recipePreviewResult,
		sectionResult,
		assetClassResult,
	] = await Promise.all([
		query<RiseopediaHubCountsRow>(
			`SELECT asset_count,
					recipe_count,
					section_count,
					asset_class_count
			 FROM web_view.riseopedia_hub_counts
			 LIMIT 1`,
		),
		query<RiseopediaHubAssetPreviewRow>(
			`SELECT *
			 FROM web_view.riseopedia_hub_asset_previews`,
		),
		query<RiseopediaHubRecipePreviewRow>(
			`SELECT *
			 FROM web_view.riseopedia_hub_recipe_previews`,
		),
		query<RiseopediaHubSectionRow>(
			`SELECT *
			 FROM web_view.riseopedia_hub_sections`,
		),
		query<RiseopediaHubAssetClassRow>(
			`SELECT *
			 FROM web_view.riseopedia_hub_asset_classes`,
		),
	]);
	const counts = countResult.rows[0] ?? emptyCounts();

	return {
		assets: {
			rows: assetPreviewResult.rows.map(mapAssetPreviewRow),
			page: 1,
			pageSize: assetPreviewResult.rows.length,
			totalDocs: toNumber(counts.asset_count),
			totalPages: 1,
		},
		recipes: {
			rows: recipePreviewResult.rows.map(mapRecipePreviewRow),
			page: 1,
			pageSize: recipePreviewResult.rows.length,
			totalDocs: toNumber(counts.recipe_count),
			totalPages: 1,
		},
		sections: sectionResult.rows.map(mapHubSectionRow),
		assetClasses: assetClassResult.rows.map(mapHubAssetClassRow),
		sectionMediaSamples: sectionResult.rows
			.map(mapHubSectionSampleRow)
			.filter(nonNull),
		assetClassMediaSamples: assetClassResult.rows
			.map(mapHubAssetClassSampleRow)
			.filter(nonNull),
	};
}
