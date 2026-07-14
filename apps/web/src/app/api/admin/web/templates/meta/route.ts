//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/meta/route.ts                                                  ////
//// Language: TS                                                                                                  ////
//// Admin meta route for template form option bundles                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listEnabledContentKindOptions } from "@/lib/data/content-kinds";
import { listEnabledIconOptions } from "@/lib/data/icons";
import { listEnabledThemeColorOptions } from "@/lib/data/theme-colors";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

const surfaceScopes = [
	{ code: "admin", label: "Admin" },
	{ code: "public", label: "Public" },
] as const;

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const [icons, colors, contentKinds] = await Promise.all([
			listEnabledIconOptions(),
			listEnabledThemeColorOptions(),
			listEnabledContentKindOptions(),
		]);

		return NextResponse.json({ icons, colors, contentKinds, surfaceScopes });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Failed to load template metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
