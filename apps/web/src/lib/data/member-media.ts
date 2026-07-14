//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/member-media.ts                                                                ////
//// Language: TS                                                                                               ////
//// DB-first member media list and mutation helpers for the /me workspace.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { query } from "@/lib/data/pg";
import { buildAppMediaFileUrl } from "@/lib/helpers/media-url";

type JsonPayloadRow = {
	payload: unknown;
};

type IdRow = {
	media_id: string | number;
	storage_rel_path?: string | null;
};

export type MemberMediaItem = {
	id: string;
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	filename: string;
	originalFilename: string;
	storageRelPath: string;
	url: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	alt: string;
	credit: string;
	createdAt: string;
	updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
	const value = record[key];
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		return Number(value.trim());
	}
	return 0;
}

function readNullableNumber(
	record: Record<string, unknown>,
	key: string,
): number | null {
	const value = record[key];
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		return Number(value.trim());
	}
	return null;
}

function readDateString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === "string") {
		return value;
	}
	return "";
}

function mapMedia(value: unknown): MemberMediaItem | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const categoryId = readString(value, "categoryId");
	const subcategoryId = readString(value, "subcategoryId");
	const storageRelPath = readString(value, "storageRelPath");
	const originalFilename = readString(value, "originalFilename");
	const mimeType = readString(value, "mimeType");

	if (
		!id ||
		!categoryId ||
		!subcategoryId ||
		!storageRelPath ||
		!originalFilename
	) {
		return null;
	}

	return {
		id,
		categoryId,
		categoryTitle: readString(value, "categoryTitle"),
		categorySlug: readString(value, "categorySlug"),
		subcategoryId,
		subcategoryTitle: readString(value, "subcategoryTitle"),
		subcategorySlug: readString(value, "subcategorySlug"),
		filename: readString(value, "filename"),
		originalFilename,
		storageRelPath,
		url: buildAppMediaFileUrl(storageRelPath),
		mimeType,
		sizeBytes: readNumber(value, "sizeBytes"),
		width: readNullableNumber(value, "width"),
		height: readNullableNumber(value, "height"),
		alt: readString(value, "alt"),
		credit: readString(value, "credit"),
		createdAt: readDateString(value, "createdAt"),
		updatedAt: readDateString(value, "updatedAt"),
	};
}

export async function listMemberMedia(
	actorDiscordId: string,
): Promise<MemberMediaItem[]> {
	const result = await query<JsonPayloadRow>(
		`SELECT web_api.web_member_media_list($1) AS payload`,
		[actorDiscordId],
	);
	const payload = result.rows[0]?.payload;
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.flatMap((value) => {
		const mapped = mapMedia(value);
		return mapped ? [mapped] : [];
	});
}

export async function insertMemberUploadedMedia(args: {
	actorDiscordId: string;
	categoryId: string;
	subcategoryId: string;
	filename: string;
	originalFilename: string;
	storageRelPath: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	alt: string;
	credit: string;
}): Promise<string | null> {
	const result = await query<IdRow>(
		[
			`SELECT * FROM web_api.web_member_media_insert_uploaded(`,
			`$1, $2::bigint, $3::bigint, $4, $5, $6, $7, $8::bigint, $9::integer, $10::integer, $11, $12`,
			`)`,
		].join("\n"),
		[
			args.actorDiscordId,
			args.categoryId,
			args.subcategoryId,
			args.filename,
			args.originalFilename,
			args.storageRelPath,
			args.mimeType,
			args.sizeBytes,
			args.width,
			args.height,
			args.alt,
			args.credit,
		],
	);
	const value = result.rows[0]?.media_id;
	return typeof value === "string" || typeof value === "number"
		? String(value)
		: null;
}

export async function updateMemberMediaMeta(args: {
	actorDiscordId: string;
	mediaId: string;
	alt: string;
	credit: string;
}): Promise<void> {
	await query(
		`SELECT * FROM web_api.web_member_media_update_meta($1, $2::bigint, $3, $4)`,
		[args.actorDiscordId, args.mediaId, args.alt, args.credit],
	);
}

export async function deleteMemberMedia(args: {
	actorDiscordId: string;
	mediaId: string;
}): Promise<string | null> {
	const result = await query<IdRow>(
		`SELECT * FROM web_api.web_member_media_delete($1, $2::bigint)`,
		[args.actorDiscordId, args.mediaId],
	);
	const value = result.rows[0]?.storage_rel_path;
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
