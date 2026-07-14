//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/icons/meta/route.ts                                                      ////
//// Language: TS                                                                                                  ////
//// Admin meta route for icon form media option inputs with used-media filtering                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listIconsAdmin } from "@/lib/data/icons";
import { listSvgMediaOptionsAdmin } from "@/lib/data/media";
import {
	jsonError,
	parsePositiveInt,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const currentIconId = parsePositiveInt(
			request.nextUrl.searchParams.get("currentIconId"),
		);
		const [allSvgMedia, icons] = await Promise.all([
			listSvgMediaOptionsAdmin(),
			listIconsAdmin(),
		]);
		const usedMediaIds = new Set<string>();

		for (const icon of icons) {
			if (currentIconId !== null && String(icon.id) === String(currentIconId)) {
				continue;
			}

			const mediaId = icon.iconMedia?.id?.trim() ?? "";
			if (icon.source === "media" && mediaId.length > 0) {
				usedMediaIds.add(mediaId);
			}
		}

		const svgMedia = allSvgMedia.filter((media) => !usedMediaIds.has(media.id));

		return NextResponse.json({ svgMedia });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load icon metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
