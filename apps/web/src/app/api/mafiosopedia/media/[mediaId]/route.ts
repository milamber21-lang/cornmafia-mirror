//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/media/[mediaId]/route.ts                                          ////
//// Language: TS                                                                                           ////
//// Streams generated Mafiosopedia media files after DB-backed media-id resolution.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { findActiveMafiosopediaMediaFileById } from "@/lib/data/mafiosopedia-media";
import {
	assertSafeMafiosopediaMediaId,
	resolveMafiosopediaMediaAbsolutePath,
} from "@/lib/helpers/mafiosopedia-media-files";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MafiosopediaMediaRouteContext = {
	params: Promise<{
		mediaId: string;
	}>;
};

function getErrorCode(error: unknown): string | null {
	if (typeof error === "object" && error !== null && "code" in error) {
		const value = (error as { code?: unknown }).code;
		return typeof value === "string" ? value : null;
	}

	return null;
}

function classifyMediaError(error: unknown): number {
	if (getErrorCode(error) === "ENOENT") {
		return 404;
	}

	if (!(error instanceof Error)) {
		return 500;
	}

	if (
		error.message.includes("safe for filesystem") ||
		error.message.includes("safe for lookup") ||
		error.message.includes("must not be absolute") ||
		error.message.includes("inside WEB_MEDIA_ROOT") ||
		error.message.includes("escaped GAME_DATA_PATCHES_ROOT")
	) {
		return 403;
	}

	return 404;
}

export async function GET(
	_request: Request,
	{ params }: MafiosopediaMediaRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const mediaId = assertSafeMafiosopediaMediaId(resolvedParams.mediaId);
		const mediaFile = await findActiveMafiosopediaMediaFileById(mediaId);
		if (!mediaFile) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const absolutePath = resolveMafiosopediaMediaAbsolutePath({
			lastSeenPatchCode: mediaFile.lastSeenPatchCode,
			mediaRelPath: mediaFile.mediaRelPath,
			sourceRootCode: mediaFile.sourceRootCode,
		});
		const fileBuffer = await readFile(absolutePath);

		return new Response(fileBuffer, {
			headers: {
				"Content-Type": mediaFile.mimeType,
				"Content-Length": String(fileBuffer.byteLength),
				"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error: unknown) {
		const status = classifyMediaError(error);
		return NextResponse.json(
			{ message: status === 403 ? "Forbidden" : "Not Found" },
			{ status },
		);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
