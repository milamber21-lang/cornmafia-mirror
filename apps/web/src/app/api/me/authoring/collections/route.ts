//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/me/authoring/collections/route.ts                                                ////
//// Language: TS                                                                                               ////
//// Member API route returning authorable collection placements.                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const actorDiscordId = await getCurrentActorDiscordId();
	if (!actorDiscordId) {
		return NextResponse.json({ message: "Sign in required." }, { status: 401 });
	}

	try {
		const rows = await listMemberAuthorableCollections(actorDiscordId);
		return NextResponse.json({ rows });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load authorable collections.";
		return NextResponse.json({ message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
