//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/richtext-links/internal/route.ts                                       ////
//// Language: TS                                                                                                ////
//// Admin/editor actor-readable Internal Page rows for the cached rich-text picker.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listRichTextInternalLinkPickerRows } from "@/lib/data/richtext-link-picker";
import {
	classifyAdminMutationError,
	jsonError,
	requireActorDiscordId,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const actorDiscordId = await requireActorDiscordId({
		allowAdminOrEditor: true,
	});
	if (typeof actorDiscordId !== "string") {
		return actorDiscordId;
	}

	try {
		const params = request.nextUrl.searchParams;
		const result = await listRichTextInternalLinkPickerRows({
			actorDiscordId,
			categoryId: params.get("categoryId"),
			subcategoryId: params.get("subcategoryId"),
			search: params.get("q"),
			limit: 20,
		});

		return NextResponse.json({ ok: true, ...result });
	} catch (error: unknown) {
		console.error("[richtext-link-picker][admin][internal]", error);
		const classified = classifyAdminMutationError(
			error,
			"Failed to load internal link targets.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
