//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/richtext-links/meta/route.ts                                                  ////
//// Language: TS                                                                                                ////
//// Member cached filter metadata for Internal Page and Riseopedia rich-text link pickers.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import {
	getRichTextInternalLinkPickerMeta,
	getRichTextRiseopediaLinkPickerMeta,
} from "@/lib/data/richtext-link-picker";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

function signInRequired(): NextResponse {
	return NextResponse.json(
		{ ok: false, message: "Sign in required." },
		{ status: 401 },
	);
}

export async function GET(): Promise<NextResponse> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return signInRequired();
	}

	try {
		const [internal, riseopedia] = await Promise.all([
			getRichTextInternalLinkPickerMeta({ actorDiscordId }),
			getRichTextRiseopediaLinkPickerMeta(),
		]);

		return NextResponse.json({ ok: true, internal, riseopedia });
	} catch (error: unknown) {
		console.error("[richtext-link-picker][member][meta]", error);
		const message =
			error instanceof Error
				? error.message
				: "Failed to load link-picker metadata.";

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
