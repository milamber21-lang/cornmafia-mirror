//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/media/route.ts                                                               ////
//// Language: TS                                                                                               ////
//// Member API route for owned/manageable media list, uploads, metadata updates, and deletes.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	findMemberAuthorableCollection,
	listMemberAuthorableCollections,
} from "@/lib/data/member-authoring";
import {
	deleteMemberMedia,
	insertMemberUploadedMedia,
	listMemberMedia,
	updateMemberMediaMeta,
} from "@/lib/data/member-media";
import {
	buildMediaStorageRelativePath,
	createStoredFilename,
	deleteMediaFileIfExists,
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
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

type MutationBody = {
	op?: unknown;
	id?: unknown;
	data?: unknown;
};

const MAX_MEMBER_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEMBER_IMAGE_MIME_TYPES = new Set<VerifiedMediaMimeType>([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

async function readBody(request: NextRequest): Promise<MutationBody | null> {
	try {
		return (await request.json()) as MutationBody;
	} catch {
		return null;
	}
}

export async function GET(): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	try {
		const [rows, collections] = await Promise.all([
			listMemberMedia(actorDiscordId),
			listMemberAuthorableCollections(actorDiscordId),
		]);
		return NextResponse.json({ rows, collections });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load member media.";
		return NextResponse.json({ message }, { status: 500 });
	}
}

async function handleUpload(
	request: NextRequest,
	actorDiscordId: string,
): Promise<Response> {
	const formData = await request.formData();
	const fileValue = formData.get("file");
	if (!(typeof File !== "undefined" && fileValue instanceof File)) {
		return NextResponse.json(
			{ message: 'Field "file" is required.' },
			{ status: 400 },
		);
	}

	let validatedFile: ValidatedUploadFile;
	try {
		validatedFile = await validateUploadedMediaFile({
			file: fileValue,
			maxBytes: MAX_MEMBER_UPLOAD_BYTES,
			allowedMimeTypes: ALLOWED_MEMBER_IMAGE_MIME_TYPES,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unsupported upload content.";
		const status = error instanceof UploadValidationError ? error.status : 400;
		return NextResponse.json({ message }, { status });
	}

	const categoryId = readString(formData.get("categoryId"));
	const subcategoryId = readString(formData.get("subcategoryId"));
	const alt = sanitizeFreeText(readString(formData.get("alt")), 500);
	const credit = sanitizeFreeText(readString(formData.get("credit")), 500) ?? "";

	if (!categoryId || !subcategoryId) {
		return NextResponse.json(
			{ message: "Collection is required." },
			{ status: 400 },
		);
	}

	if (!alt) {
		return NextResponse.json(
			{ message: "Alt text is required." },
			{ status: 400 },
		);
	}

	const collections = await listMemberAuthorableCollections(actorDiscordId);
	const placement = findMemberAuthorableCollection({
		collections,
		categoryId,
		subcategoryId,
	});
	if (!placement) {
		return NextResponse.json(
			{ message: "You cannot upload media for that collection." },
			{ status: 403 },
		);
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
		isShared: false,
		ownerDiscordId: actorDiscordId,
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
		return NextResponse.json({ message }, { status: 500 });
	}

	try {
		await insertMemberUploadedMedia({
			actorDiscordId,
			categoryId,
			subcategoryId,
			filename: generated.filename,
			originalFilename: generated.originalFilename,
			storageRelPath,
			mimeType: validatedFile.mimeType,
			sizeBytes: validatedFile.sizeBytes,
			width: dimensions.width,
			height: dimensions.height,
			alt,
			credit,
		});
		const rows = await listMemberMedia(actorDiscordId);
		return NextResponse.json({ ok: true, rows });
	} catch (error: unknown) {
		await deleteMediaFileIfExists(storageRelPath);
		const message =
			error instanceof Error ? error.message : "Failed to persist media metadata.";
		return NextResponse.json({ message }, { status: 400 });
	}
}

async function handleJsonMutation(
	request: NextRequest,
	actorDiscordId: string,
): Promise<Response> {
	const body = await readBody(request);
	if (!body) {
		return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
	}

	const op = readString(body.op);
	const id = readString(body.id);
	const data = isRecord(body.data) ? body.data : {};

	if (!id) {
		return NextResponse.json(
			{ message: "Media id is required." },
			{ status: 400 },
		);
	}

	try {
		if (op === "update") {
			const alt = sanitizeFreeText(readString(data.alt), 500);
			const credit = sanitizeFreeText(readString(data.credit), 500) ?? "";
			if (!alt) {
				return NextResponse.json(
					{ message: "Alt text is required." },
					{ status: 400 },
				);
			}
			await updateMemberMediaMeta({ actorDiscordId, mediaId: id, alt, credit });
			const rows = await listMemberMedia(actorDiscordId);
			return NextResponse.json({ ok: true, rows });
		}

		if (op === "delete") {
			const storageRelPath = await deleteMemberMedia({
				actorDiscordId,
				mediaId: id,
			});
			if (storageRelPath) {
				await deleteMediaFileIfExists(storageRelPath);
			}
			const rows = await listMemberMedia(actorDiscordId);
			return NextResponse.json({ ok: true, rows });
		}

		return NextResponse.json(
			{ message: 'Operation must be "update" or "delete".' },
			{ status: 400 },
		);
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to process media request.";
		return NextResponse.json({ message }, { status: 400 });
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
	const isUpload = contentType.includes("multipart/form-data");
	const rateLimitResponse = await checkRateLimit({
		request,
		bucket: isUpload ? "member:media:upload" : "member:media:mutation",
		identity: actorDiscordId,
		limit: isUpload ? 12 : 60,
		windowMs: isUpload ? 300_000 : 60_000,
	});
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	if (isUpload) {
		return handleUpload(request, actorDiscordId);
	}

	return handleJsonMutation(request, actorDiscordId);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
