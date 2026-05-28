//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-asset-classes.ts                                                  ////
//// Language: TS                                                                                             ////
//// DB-first Riseopedia asset class helpers for hub cards and filters.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";
import { buildRiseopediaMediaFileUrl } from "@/lib/helpers/riseopedia-media-files";

export type RiseopediaAssetClassDoc = {
	id: string;
	code: string;
	name: string;
	description: string | null;
	sortOrder: number;
	assetCount: number;
	updatedAt: string | null;
};

export type RiseopediaAssetClassMediaRef = {
	mediaId: string;
	url: string;
	width: number | null;
	height: number | null;
	mimeType: string | null;
};

export type RiseopediaAssetClassMediaSample = {
	assetClassCode: string;
	assetName: string;
	assetSlug: string;
	media: RiseopediaAssetClassMediaRef;
};

type RiseopediaAssetClassRow = {
	asset_class_id: string | number;
	asset_class_code: string;
	asset_class_name: string;
	description: string | null;
	sort_order: string | number;
	asset_count: string | number;
	updated_dt: Date | string | null;
};

type RiseopediaAssetClassMediaSampleRow = {
	asset_class_code: string;
	asset_name: string;
	asset_slug: string;
	media_id: string | number;
	media_width_px: number | null;
	media_height_px: number | null;
	media_mime_type: string | null;
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

function mapAssetClassRow(row: RiseopediaAssetClassRow): RiseopediaAssetClassDoc {
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

function mapAssetClassMediaSampleRow(
	row: RiseopediaAssetClassMediaSampleRow,
): RiseopediaAssetClassMediaSample {
	const mediaId = String(row.media_id);

	return {
		assetClassCode: row.asset_class_code,
		assetName: row.asset_name,
		assetSlug: row.asset_slug,
		media: {
			mediaId,
			url: buildRiseopediaMediaFileUrl(mediaId),
			width: row.media_width_px,
			height: row.media_height_px,
			mimeType: row.media_mime_type,
		},
	};
}

export async function listRiseopediaAssetClasses(): Promise<
	RiseopediaAssetClassDoc[]
> {
	const result = await query<RiseopediaAssetClassRow>(
		`SELECT asset_class_id,
				asset_class_code,
				asset_class_name,
				description,
				sort_order,
				asset_count,
				updated_dt
		 FROM web_view.riseopedia_asset_classes
		 ORDER BY sort_order,
				  asset_class_name,
				  asset_class_id`,
	);

	return result.rows.map(mapAssetClassRow);
}


export async function listRiseopediaAssetClassMediaSamples(): Promise<
	RiseopediaAssetClassMediaSample[]
> {
	const result = await query<RiseopediaAssetClassMediaSampleRow>(
		`SELECT DISTINCT ON (asset_class_code)
				asset_class_code,
				asset_name,
				asset_slug,
				COALESCE(icon_media_id, detail_media_id) AS media_id,
				COALESCE(icon_media_width_px, detail_media_width_px) AS media_width_px,
				COALESCE(icon_media_height_px, detail_media_height_px) AS media_height_px,
				COALESCE(icon_media_mime_type, detail_media_mime_type) AS media_mime_type
		 FROM web_view.riseopedia_assets
		 WHERE COALESCE(icon_media_id, detail_media_id) IS NOT NULL
		 ORDER BY asset_class_code,
				  md5(canonical_asset_key),
				  asset_name,
				  asset_id`,
	);

	return result.rows.map(mapAssetClassMediaSampleRow);
}
