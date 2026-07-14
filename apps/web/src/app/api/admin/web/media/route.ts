//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/media/route.ts                                                           ////
//// Language: TS                                                                                                  ////
//// Admin media list, detail, and normalized mutation API for the server-driven media family                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import {
	findMediaAdminItemById,
	listMediaAdmin,
	type MediaAdminSortBy,
	type MediaAdminSortDir,
} from "@/lib/data/media";
import {
	jsonError,
	parsePageParam,
	parsePageSizeParam,
	requireAdminResponse,
} from "@/lib/server/admin-route";

import { handleMediaMutation } from "./media-admin-route";

const MEDIA_SORT_BY_VALUES = new Set<MediaAdminSortBy>([
	"alt",
	"originalFilename",
	"category",
	"subcategory",
	"owner",
]);

function normalizeMediaSortBy(value: string | null): MediaAdminSortBy {
	return value && MEDIA_SORT_BY_VALUES.has(value as MediaAdminSortBy)
		? (value as MediaAdminSortBy)
		: "alt";
}

function normalizeSortDir(value: string | null): MediaAdminSortDir {
	return value === "desc" ? "desc" : "asc";
}

export async function GET(request: Request): Promise<NextResponse> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(request.url);

	try {
		const id = (searchParams.get("id") ?? "").trim();
		if (id.length > 0) {
			const doc = await findMediaAdminItemById(id);
			if (!doc) {
				return jsonError("NOT_FOUND", "Media item not found.", 404);
			}

			return NextResponse.json({ doc });
		}

		const result = await listMediaAdmin({
			page: parsePageParam(searchParams.get("page"), 1),
			pageSize: parsePageSizeParam(searchParams.get("pageSize"), {
				defaultPageSize: 20,
				maxPageSize: 100,
				minPageSize: 1,
			}),
			categoryId: (searchParams.get("categoryId") ?? "").trim(),
			subcategoryId: (searchParams.get("subcategoryId") ?? "").trim(),
			search: (searchParams.get("search") ?? "").trim(),
			kind: (searchParams.get("kind") ?? "").trim(),
			source: (searchParams.get("source") ?? "").trim(),
			sortBy: normalizeMediaSortBy(searchParams.get("sortBy")),
			sortDir: normalizeSortDir(searchParams.get("sortDir")),
		});

		return NextResponse.json({ ...result });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load media.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

export async function POST(request: Request): Promise<NextResponse> {
	return handleMediaMutation(request);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
