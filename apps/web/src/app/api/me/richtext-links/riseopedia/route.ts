//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/richtext-links/riseopedia/route.ts                                            ////
//// Language: TS                                                                                                ////
//// Member fast release-aware Riseopedia rows for the cached rich-text picker.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listRichTextRiseopediaLinkPickerRows } from "@/lib/data/richtext-link-picker";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

function signInRequired(): NextResponse {
	return NextResponse.json(
		{ ok: false, message: "Sign in required." },
		{ status: 401 },
	);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return signInRequired();
	}

	try {
		const params = request.nextUrl.searchParams;
		const result = await listRichTextRiseopediaLinkPickerRows({
			entityTypeCode: params.get("entityType"),
			classFilter: params.get("class"),
			categoryFilter: params.get("category"),
			subcategoryFilter: params.get("subcategory"),
			search: params.get("q"),
			limit: 20,
		});

		return NextResponse.json({ ok: true, ...result });
	} catch (error: unknown) {
		console.error("[richtext-link-picker][member][riseopedia]", error);
		const message =
			error instanceof Error
				? error.message
				: "Failed to load Riseopedia link targets.";

		return NextResponse.json(
			{
				ok: false,
				code: "RICH_TEXT_LINK_PICKER_FAILED",
				message,
			},
			{ status: 500 },
		);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
