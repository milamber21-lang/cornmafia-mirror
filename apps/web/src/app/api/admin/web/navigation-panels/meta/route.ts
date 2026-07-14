//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/navigation-panels/meta/route.ts                                          ////
//// Language: TS                                                                                                  ////
//// Admin meta route for navigation panel policy role inputs                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listDiscordRoleOptions } from "@/lib/data/discord-roles";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const roles = await listDiscordRoleOptions();
		return NextResponse.json({ roles });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load navigation panel metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
