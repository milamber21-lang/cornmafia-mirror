//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-list/meta/route.ts                                       ////
//// Language: TS                                                                                                  ////
//// Admin meta route for template field-list form options                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listTemplateFieldTypesAdmin } from "@/lib/data/templates";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

const renderDestinations = [
	{ code: "seo", label: "SEO" },
	{ code: "hero", label: "Hero" },
	{ code: "top", label: "Top" },
	{ code: "left", label: "Left" },
	{ code: "main", label: "Main" },
	{ code: "right", label: "Right" },
	{ code: "bottom", label: "Bottom" },
	{ code: "hidden", label: "Hidden" },
];

export async function GET(): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const fieldTypes = await listTemplateFieldTypesAdmin();
		return NextResponse.json({ fieldTypes, renderDestinations });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load field list metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
