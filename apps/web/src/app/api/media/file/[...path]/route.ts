//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/media/file/[...path]/route.ts                                                     ////
//// Language: TS                                                                                                  ////
//// Streams public/member media only after DB-backed actor/content access resolution                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { findReadableMediaFileByPath } from "@/lib/data/media-file";
import {
	assertSafeMediaRelativePath,
	resolveMediaAbsolutePath,
} from "@/lib/helpers/media-files";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

const MIME_BY_EXTENSION: Record<string, string> = {
	".gif": "image/gif",
	".jpeg": "image/jpeg",
	".jpg": "image/jpeg",
	".mp4": "video/mp4",
	".png": "image/png",
	".svg": "image/svg+xml",
	".txt": "text/plain; charset=utf-8",
	".webm": "video/webm",
	".webp": "image/webp",
	".xml": "application/xml; charset=utf-8",
};

function getMimeTypeFromPath(storageRelPath: string): string {
	const extension = path.posix.extname(storageRelPath).toLowerCase();
	return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}

function getStatusFromError(error: unknown): number {
	if (!(error instanceof Error)) {
		return 500;
	}

	if (
		error.message.includes("must not be absolute") ||
		error.message.includes("inside WEB_MEDIA_ROOT") ||
		error.message.includes("escaped WEB_MEDIA_ROOT")
	) {
		return 403;
	}

	return 404;
}

function getSafeResponseMimeType(args: {
	mimeType: string;
	storageRelPath: string;
}): string {
	const dbMimeType = args.mimeType.trim();
	return dbMimeType.length > 0
		? dbMimeType
		: getMimeTypeFromPath(args.storageRelPath);
}

type MediaFileRouteContext = {
	params: Promise<{
		path?: string[];
	}>;
};

export async function GET(
	_request: Request,
	{ params }: MediaFileRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const rawSegments = Array.isArray(resolvedParams.path)
			? resolvedParams.path
			: [];
		const requestedRelativePath = assertSafeMediaRelativePath(
			rawSegments.join("/"),
		);
		const actorDiscordId = await getCurrentActorDiscordId();
		const mediaFile = await findReadableMediaFileByPath({
			actorDiscordId,
			storageRelPath: requestedRelativePath,
		});

		if (!mediaFile) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const safeResolvedPath = assertSafeMediaRelativePath(
			mediaFile.storageRelPath,
		);
		const absolutePath = resolveMediaAbsolutePath(safeResolvedPath);
		const fileBuffer = await readFile(absolutePath);

		return new Response(fileBuffer, {
			headers: {
				"Content-Type": getSafeResponseMimeType({
					mimeType: mediaFile.mimeType,
					storageRelPath: safeResolvedPath,
				}),
				"Content-Length": String(fileBuffer.byteLength),
				"Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error: unknown) {
		const status = getStatusFromError(error);

		return NextResponse.json(
			{ message: status === 403 ? "Forbidden" : "Not Found" },
			{ status },
		);
	}
}
