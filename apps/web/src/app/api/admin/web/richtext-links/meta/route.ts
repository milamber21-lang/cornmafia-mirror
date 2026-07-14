//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/richtext-links/meta/route.ts                                           ////
//// Language: TS                                                                                                ////
//// Admin/editor cached filter metadata for Internal Page and Riseopedia rich-text link pickers.                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import {
	getRichTextInternalLinkPickerMeta,
	getRichTextRiseopediaLinkPickerMeta,
} from "@/lib/data/richtext-link-picker";
import {
	classifyAdminMutationError,
	jsonError,
	requireActorDiscordId,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
	const actorDiscordId = await requireActorDiscordId({
		allowAdminOrEditor: true,
	});
	if (typeof actorDiscordId !== "string") {
		return actorDiscordId;
	}

	try {
		const [internal, riseopedia] = await Promise.all([
			getRichTextInternalLinkPickerMeta({ actorDiscordId }),
			getRichTextRiseopediaLinkPickerMeta(),
		]);

		return NextResponse.json({ ok: true, internal, riseopedia });
	} catch (error: unknown) {
		console.error("[richtext-link-picker][admin][meta]", error);
		const classified = classifyAdminMutationError(
			error,
			"Failed to load link-picker metadata.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
