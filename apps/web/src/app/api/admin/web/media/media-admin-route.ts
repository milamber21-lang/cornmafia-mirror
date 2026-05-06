//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/media/media-admin-route.ts                                               ////
//// Language: TS                                                                                                  ////
//// Shared admin media mutation helpers for normalized route contracts and compatibility wrappers                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { NextResponse } from "next/server";

import {
	findMediaAdminItemById,
	getMediaPlacementLookup,
} from "@/lib/data/media";
import { query } from "@/lib/data/pg";
import {
	buildMediaStorageRelativePath,
	createStoredFilename,
	deleteMediaFileIfExists,
	moveMediaFile,
	restoreStagedMediaFile,
	stageDeleteMediaFile,
	writeUploadedMediaFile,
} from "@/lib/helpers/media-files";
import { getImageDimensionsFromBuffer } from "@/lib/helpers/media-dimensions";
import { sanitizeFreeText } from "@/lib/helpers/media-sanitize";
import {
	UploadValidationError,
	validateUploadedMediaFile,
	type ValidatedUploadFile,
	type VerifiedMediaMimeType,
} from "@/lib/helpers/media-upload-validation";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeNonEmptyString,
	parseBoolean,
	requireActorDiscordId,
} from "@/lib/server/admin-route";
import { checkRateLimit } from "@/lib/server/rate-limit";

type JsonRecord = Record<string, unknown>;

type InsertedMediaRow = {
	media_id: string | number;
	storage_rel_path: string;
	filename: string;
	original_filename: string;
};

type MutationBody = {
	op?: unknown;
	id?: unknown;
	data?: unknown;
	alt?: unknown;
	credit?: unknown;
	categoryId?: unknown;
	subcategoryId?: unknown;
	category?: unknown;
	subcategory?: unknown;
};

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_ADMIN_UPLOAD_MIME_TYPES = new Set<VerifiedMediaMimeType>([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"video/mp4",
	"video/webm",
]);

function isObject(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function coerceOptionalId(value: unknown): string | null {
	return normalizeNonEmptyString(value);
}

function readMutationData(body: MutationBody): JsonRecord {
	return isObject(body.data) ? body.data : (body as JsonRecord);
}

async function readJsonBody(request: Request): Promise<MutationBody | NextResponse> {
	try {
		return (await request.json()) as MutationBody;
	} catch {
		return jsonError("VALIDATION_REQUIRED", "Body must be valid JSON.", 400);
	}
}

export async function handleMediaUploadForActor(
	request: Request,
	actorDiscordId: string,
): Promise<NextResponse> {
	const rateLimitResponse = checkRateLimit({
		request,
		bucket: "admin:media:upload",
		identity: actorDiscordId,
		limit: 20,
		windowMs: 60_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const formData = await request.formData();
	const fileValue = formData.get("file");
	if (!(typeof File !== "undefined" && fileValue instanceof File)) {
		return jsonError("VALIDATION_REQUIRED", 'Field "file" is required.', 400);
	}

	let validatedFile: ValidatedUploadFile;
	try {
		validatedFile = await validateUploadedMediaFile({
			file: fileValue,
			maxBytes: MAX_UPLOAD_BYTES,
			allowedMimeTypes: ALLOWED_ADMIN_UPLOAD_MIME_TYPES,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unsupported upload content.";
		const status = error instanceof UploadValidationError ? error.status : 400;
		return jsonError("VALIDATION_REQUIRED", message, status);
	}

	const categoryId = coerceOptionalId(
		formData.get("categoryId") ?? formData.get("category"),
	);
	const subcategoryId = coerceOptionalId(
		formData.get("subcategoryId") ?? formData.get("subcategory"),
	);
	const isShared = parseBoolean(formData.get("shared"), true);
	const ownerDiscordId = isShared ? null : actorDiscordId;
	const altText = sanitizeFreeText(
		typeof formData.get("alt") === "string" ? String(formData.get("alt")) : "",
		500,
	);
	const creditText = sanitizeFreeText(
		typeof formData.get("credit") === "string"
			? String(formData.get("credit"))
			: "",
		500,
	);

	let placement;
	try {
		placement = await getMediaPlacementLookup({
			categoryId,
			subcategoryId,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Invalid category or subcategory.";
		return jsonError("VALIDATION_REQUIRED", message, 400);
	}

	const generated = createStoredFilename(
		fileValue.name,
		validatedFile.extension,
	);
	const dimensions = getImageDimensionsFromBuffer(
		validatedFile.buffer,
		validatedFile.mimeType,
	);
	const storageRelPath = buildMediaStorageRelativePath({
		categorySlug: placement.categorySlug,
		subcategorySlug: placement.subcategorySlug,
		isShared,
		ownerDiscordId,
		filename: generated.filename,
	});

	try {
		await writeUploadedMediaFile({
			storageRelPath,
			buffer: validatedFile.buffer,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to write uploaded file.";
		return jsonError("SERVER_ERROR", message, 500);
	}

	try {
		const insertedResult = await query<InsertedMediaRow>(
			[
				`SELECT media_id, storage_rel_path, filename, original_filename`,
				`FROM web_api.web_media_insert_uploaded(`,
				`  $1,`,
				`  $2::bigint,`,
				`  $3::bigint,`,
				`  $4::boolean,`,
				`  $5,`,
				`  $6,`,
				`  $7,`,
				`  $8,`,
				`  $9,`,
				`  $10::bigint,`,
				`  $11::integer,`,
				`  $12::integer,`,
				`  $13,`,
				`  $14`,
				`)`,
			].join("\n"),
			[
				actorDiscordId,
				categoryId,
				subcategoryId,
				isShared,
				ownerDiscordId,
				generated.filename,
				generated.originalFilename,
				storageRelPath,
				validatedFile.mimeType,
				validatedFile.sizeBytes,
				dimensions.width,
				dimensions.height,
				altText,
				creditText,
			],
		);

		const inserted = insertedResult.rows[0] ?? null;
		if (!inserted) {
			throw new Error("web_media_insert_uploaded did not return a row.");
		}

		const doc = await findMediaAdminItemById(String(inserted.media_id));
		if (!doc) {
			throw new Error("Uploaded media could not be reloaded.");
		}

		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		await deleteMediaFileIfExists(storageRelPath);
		const failure = classifyAdminMutationError(
			error,
			"Failed to persist media metadata.",
		);
		return jsonError(failure.code, failure.message, failure.status);
	}
}

export async function handleMediaUpload(request: Request): Promise<NextResponse> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (typeof actorDiscordIdOrResponse !== "string") {
		return actorDiscordIdOrResponse;
	}

	return handleMediaUploadForActor(request, actorDiscordIdOrResponse);
}

async function handleMediaUpdateBody(
	actorDiscordId: string,
	body: MutationBody,
): Promise<NextResponse> {
	const data = readMutationData(body);
	const mediaId = normalizeNonEmptyString(body.id) ?? "";
	if (mediaId.length === 0) {
		return jsonError("VALIDATION_REQUIRED", 'Field "id" is required.', 400);
	}

	const existing = await findMediaAdminItemById(mediaId);
	if (!existing) {
		return jsonError("NOT_FOUND", "Media item not found.", 404);
	}

	const categoryId = coerceOptionalId(data.categoryId ?? data.category);
	const subcategoryId = coerceOptionalId(data.subcategoryId ?? data.subcategory);
	const isShared = existing.shared;
	const ownerDiscordId = isShared ? null : existing.userDiscordId;
	if (!isShared && (!ownerDiscordId || ownerDiscordId.trim().length === 0)) {
		return jsonError(
			"SERVER_ERROR",
			"Owned media item is missing an owner.",
			500,
		);
	}

	const altText = sanitizeFreeText(
		typeof data.alt === "string" ? data.alt : "",
		500,
	);
	const creditText = sanitizeFreeText(
		typeof data.credit === "string" ? data.credit : "",
		500,
	);

	let placement;
	try {
		placement = await getMediaPlacementLookup({
			categoryId,
			subcategoryId,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Invalid category or subcategory.";
		return jsonError("VALIDATION_REQUIRED", message, 400);
	}

	const nextStorageRelPath = buildMediaStorageRelativePath({
		categorySlug: placement.categorySlug,
		subcategorySlug: placement.subcategorySlug,
		isShared,
		ownerDiscordId,
		filename: existing.storedFilename,
	});
	const pathChanged = nextStorageRelPath !== existing.storageRelPath;

	try {
		if (pathChanged) {
			await moveMediaFile(existing.storageRelPath, nextStorageRelPath);
			try {
				await query(
					[
						`SELECT * FROM web_api.web_media_relocate(`,
						`  $1,`,
						`  $2::bigint,`,
						`  $3::bigint,`,
						`  $4::bigint,`,
						`  $5::boolean,`,
						`  $6,`,
						`  $7,`,
						`  $8,`,
						`  $9,`,
						`  $10`,
						`)`,
					].join("\n"),
					[
						actorDiscordId,
						mediaId,
						categoryId,
						subcategoryId,
						isShared,
						ownerDiscordId,
						existing.storedFilename,
						nextStorageRelPath,
						altText,
						creditText,
					],
				);
			} catch (error: unknown) {
				await moveMediaFile(nextStorageRelPath, existing.storageRelPath);
				throw error;
			}
		} else {
			await query(
				`SELECT * FROM web_api.web_media_update_meta($1, $2::bigint, $3, $4)`,
				[actorDiscordId, mediaId, altText, creditText],
			);
		}

		const doc = await findMediaAdminItemById(mediaId);
		if (!doc) {
			return jsonError("NOT_FOUND", "Media item not found after update.", 404);
		}

		return NextResponse.json({ ok: true, doc });
	} catch (error: unknown) {
		const failure = classifyAdminMutationError(error, "Failed to update media.");
		return jsonError(failure.code, failure.message, failure.status);
	}
}

async function handleMediaDeleteBody(
	actorDiscordId: string,
	body: MutationBody,
): Promise<NextResponse> {
	const mediaId = normalizeNonEmptyString(body.id) ?? "";
	if (mediaId.length === 0) {
		return jsonError("VALIDATION_REQUIRED", 'Field "id" is required.', 400);
	}

	const existing = await findMediaAdminItemById(mediaId);
	if (!existing) {
		return jsonError("NOT_FOUND", "Media item not found.", 404);
	}

	let stagedRelativePath: string | null = null;
	try {
		stagedRelativePath = await stageDeleteMediaFile(existing.storageRelPath);
		await query(`SELECT * FROM web_api.web_media_delete($1, $2::bigint)`, [
			actorDiscordId,
			mediaId,
		]);
		if (stagedRelativePath) {
			await deleteMediaFileIfExists(stagedRelativePath);
		}

		return NextResponse.json({ ok: true });
	} catch (error: unknown) {
		if (stagedRelativePath) {
			try {
				await restoreStagedMediaFile(stagedRelativePath, existing.storageRelPath);
			} catch {
				// keep the original DB failure; the staged file can be repaired manually if needed
			}
		}

		const failure = classifyAdminMutationError(error, "Failed to delete media.");
		return jsonError(failure.code, failure.message, failure.status);
	}
}

export async function handleMediaUpdate(request: Request): Promise<NextResponse> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (typeof actorDiscordIdOrResponse !== "string") {
		return actorDiscordIdOrResponse;
	}

	const rateLimitResponse = checkRateLimit({
		request,
		bucket: "admin:media:update",
		identity: actorDiscordIdOrResponse,
		limit: 60,
		windowMs: 60_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const bodyResult = await readJsonBody(request);
	if (bodyResult instanceof NextResponse) {
		return bodyResult;
	}

	return handleMediaUpdateBody(actorDiscordIdOrResponse, bodyResult);
}

export async function handleMediaDelete(request: Request): Promise<NextResponse> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (typeof actorDiscordIdOrResponse !== "string") {
		return actorDiscordIdOrResponse;
	}

	const rateLimitResponse = checkRateLimit({
		request,
		bucket: "admin:media:delete",
		identity: actorDiscordIdOrResponse,
		limit: 60,
		windowMs: 60_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const bodyResult = await readJsonBody(request);
	if (bodyResult instanceof NextResponse) {
		return bodyResult;
	}

	return handleMediaDeleteBody(actorDiscordIdOrResponse, bodyResult);
}

export async function handleMediaMutation(request: Request): Promise<NextResponse> {
	const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
	if (contentType.includes("multipart/form-data")) {
		return handleMediaUpload(request);
	}

	const bodyResult = await readJsonBody(request);
	if (bodyResult instanceof NextResponse) {
		return bodyResult;
	}

	const op = normalizeNonEmptyString(bodyResult.op) ?? "";
	if (op === "update") {
		const actorDiscordIdOrResponse = await requireActorDiscordId();
		if (typeof actorDiscordIdOrResponse !== "string") {
			return actorDiscordIdOrResponse;
		}

		const rateLimitResponse = checkRateLimit({
			request,
			bucket: "admin:media:update",
			identity: actorDiscordIdOrResponse,
			limit: 60,
			windowMs: 60_000,
		});
		if (rateLimitResponse) {
			return rateLimitResponse;
		}

		return handleMediaUpdateBody(actorDiscordIdOrResponse, bodyResult);
	}

	if (op === "delete") {
		const actorDiscordIdOrResponse = await requireActorDiscordId();
		if (typeof actorDiscordIdOrResponse !== "string") {
			return actorDiscordIdOrResponse;
		}

		const rateLimitResponse = checkRateLimit({
			request,
			bucket: "admin:media:delete",
			identity: actorDiscordIdOrResponse,
			limit: 60,
			windowMs: 60_000,
		});
		if (rateLimitResponse) {
			return rateLimitResponse;
		}

		return handleMediaDeleteBody(actorDiscordIdOrResponse, bodyResult);
	}

	return jsonError(
		"VALIDATION_REQUIRED",
		'Field "op" must be "update" or "delete" for JSON media mutations.',
		400,
	);
}