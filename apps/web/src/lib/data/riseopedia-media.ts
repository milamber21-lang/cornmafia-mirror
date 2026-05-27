//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/riseopedia-media.ts                                                        ////
//// Language: TS                                                                                           ////
//// DB-first Riseopedia media resolver for safe media-id app-side streaming.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type RiseopediaMediaFile = {
	mediaId: string;
	mediaKey: string;
	mediaRelPath: string;
	formatCode: string;
	mimeType: string;
	width: number;
	height: number;
	sizeBytes: number | null;
	hashSha256: string | null;
	sourceRelPath: string;
	sourceFormatCode: string | null;
	lastSeenPatchCode: string;
	updatedAt: string | null;
};

type RiseopediaMediaFileRow = {
	media_file_id: string | number;
	media_key: string;
	media_rel_path: string;
	format_code: string;
	mime_type: string;
	width_px: number;
	height_px: number;
	size_bytes: string | number | null;
	hash_sha256: string | null;
	source_rel_path: string;
	source_format_code: string | null;
	last_seen_patch_code: string | null;
	updated_dt: Date | string | null;
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

function mapRiseopediaMediaFileRow(
	row: RiseopediaMediaFileRow,
): RiseopediaMediaFile | null {
	if (!row.last_seen_patch_code) {
		return null;
	}

	return {
		mediaId: String(row.media_file_id),
		mediaKey: row.media_key,
		mediaRelPath: row.media_rel_path,
		formatCode: row.format_code,
		mimeType: row.mime_type,
		width: row.width_px,
		height: row.height_px,
		sizeBytes: toNullableNumber(row.size_bytes),
		hashSha256: row.hash_sha256,
		sourceRelPath: row.source_rel_path,
		sourceFormatCode: row.source_format_code,
		lastSeenPatchCode: row.last_seen_patch_code,
		updatedAt: toIsoString(row.updated_dt),
	};
}

export async function findActiveRiseopediaMediaFileById(
	mediaId: string,
): Promise<RiseopediaMediaFile | null> {
	const result = await query<RiseopediaMediaFileRow>(
		`SELECT media_file_id,
				media_key,
				media_rel_path,
				format_code,
				mime_type,
				width_px,
				height_px,
				size_bytes,
				hash_sha256,
				source_rel_path,
				source_format_code,
				last_seen_patch_code,
				updated_dt
		 FROM web_view.riseopedia_media_files
		 WHERE media_file_id = $1::bigint
		 LIMIT 1`,
		[mediaId],
	);

	const row = result.rows[0] ?? null;
	return row ? mapRiseopediaMediaFileRow(row) : null;
}
