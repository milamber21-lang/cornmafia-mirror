//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/media-file.ts                                                                    ////
//// Language: TS                                                                                                  ////
//// DB-backed public media file resolver used before streaming protected media bytes                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

export type ResolvedMediaFile = {
	mediaId: string;
	storageRelPath: string;
	filename: string;
	originalFilename: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	alt: string | null;
	credit: string | null;
};

type MediaFileResolveRow = {
	media_id: string | number;
	storage_rel_path: string;
	filename: string;
	original_filename: string;
	mime_type: string;
	size_bytes: string | number;
	width_px: number | null;
	height_px: number | null;
	alt_text: string | null;
	credit_text: string | null;
};

type EnabledIconMediaResolveRow = {
	media_id: string | number;
	media_storage_rel_path: string;
	media_filename: string;
	media_original_filename: string;
	media_mime_type: string;
};

function toNumber(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function mapMediaFileResolveRow(row: MediaFileResolveRow): ResolvedMediaFile {
	return {
		mediaId: String(row.media_id),
		storageRelPath: row.storage_rel_path,
		filename: row.filename,
		originalFilename: row.original_filename,
		mimeType: row.mime_type,
		sizeBytes: toNumber(row.size_bytes),
		width: row.width_px,
		height: row.height_px,
		alt: row.alt_text,
		credit: row.credit_text,
	};
}

function mapEnabledIconMediaResolveRow(
	row: EnabledIconMediaResolveRow,
): ResolvedMediaFile {
	return {
		mediaId: String(row.media_id),
		storageRelPath: row.media_storage_rel_path,
		filename: row.media_filename,
		originalFilename: row.media_original_filename,
		mimeType: row.media_mime_type,
		sizeBytes: 0,
		width: null,
		height: null,
		alt: null,
		credit: null,
	};
}

export async function findReadableMediaFileByPath(args: {
	actorDiscordId: string | null;
	storageRelPath: string;
}): Promise<ResolvedMediaFile | null> {
	const result = await query<MediaFileResolveRow>(
		`SELECT media_id,
				storage_rel_path,
				filename,
				original_filename,
				mime_type,
				size_bytes,
				width_px,
				height_px,
				alt_text,
				credit_text
		 FROM web_api.web_media_file_resolve_for_actor($1, $2)
		 LIMIT 1`,
		[args.actorDiscordId, args.storageRelPath],
	);

	const row = result.rows[0] ?? null;
	return row ? mapMediaFileResolveRow(row) : null;
}

export async function findEnabledIconMediaFileByPath(args: {
	storageRelPath: string;
}): Promise<ResolvedMediaFile | null> {
	const result = await query<EnabledIconMediaResolveRow>(
		`SELECT media_id,
				media_storage_rel_path,
				media_filename,
				media_original_filename,
				media_mime_type
		 FROM web_view.web_icons_lookup
		 WHERE source_code = 'media'
		   AND is_enabled = true
		   AND media_storage_rel_path = $1
		 LIMIT 1`,
		[args.storageRelPath],
	);

	const row = result.rows[0] ?? null;
	return row ? mapEnabledIconMediaResolveRow(row) : null;
}
