//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/themes/route.ts                                                               ////
//// Language: TS                                                                                                ////
//// Member profile CSS theme style options for signed-in users.                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { listMemberThemeOptions } from "@/lib/data/member-profile";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const actorDiscordId = await getCurrentActorDiscordId();

	if (!actorDiscordId) {
		return NextResponse.json(
			{ ok: false, message: "Sign in required." },
			{ status: 401 },
		);
	}

	const search = req.nextUrl.searchParams.get("q")?.trim() ?? "";

	try {
		const options = await listMemberThemeOptions(search);
		return NextResponse.json({ ok: true, options });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to fetch themes.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
