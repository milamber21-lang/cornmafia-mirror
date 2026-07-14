//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/media/upload/route.ts                                                    ////
//// Language: TS                                                                                                  ////
//// Admin media upload compatibility route with explicit shared app-side guard                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { requireActorDiscordId } from "@/lib/server/admin-route";

import { handleMediaUploadForActor } from "../media-admin-route";

export async function POST(request: Request): Promise<NextResponse> {
	const actorDiscordIdOrResponse = await requireActorDiscordId();
	if (typeof actorDiscordIdOrResponse !== "string") {
		return actorDiscordIdOrResponse;
	}

	return handleMediaUploadForActor(request, actorDiscordIdOrResponse);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
