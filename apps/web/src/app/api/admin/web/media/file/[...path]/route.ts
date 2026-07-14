//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/media/file/[...path]/route.ts                                            ////
//// Language: TS                                                                                                  ////
//// Admin file-serving route for stored media previews                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFile } from "fs/promises";
import path from "path";

import {
	assertSafeMediaRelativePath,
	resolveMediaAbsolutePath,
} from "@/lib/helpers/media-files";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

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

type MediaFileRouteContext = {
	params: Promise<{
		path?: string[];
	}>;
};

export async function GET(
	_request: Request,
	{ params }: MediaFileRouteContext,
): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const resolvedParams = await params;
		const rawSegments = Array.isArray(resolvedParams.path)
			? resolvedParams.path
			: [];
		const safeRelativePath = assertSafeMediaRelativePath(rawSegments.join("/"));
		const absolutePath = resolveMediaAbsolutePath(safeRelativePath);
		const fileBuffer = await readFile(absolutePath);

		return new Response(fileBuffer, {
			headers: {
				"Content-Type": getMimeTypeFromPath(safeRelativePath),
				"Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error: unknown) {
		const status = getStatusFromError(error);
		return status === 403
			? jsonError("PERMISSION_DENIED", "Forbidden", 403)
			: jsonError("NOT_FOUND", "Not found.", status === 404 ? 404 : 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
