//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/field-options/meta/route.ts                                    ////
//// Language: TS                                                                                                  ////
//// Admin meta route for contextual template field-option inputs                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { findTemplateFieldListAdminById } from "@/lib/data/templates";
import {
	jsonError,
	parsePositiveInt,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const fieldListId = parsePositiveInt(
		request.nextUrl.searchParams.get("fieldListId"),
	);
	if (!fieldListId) {
		return jsonError("VALIDATION_REQUIRED", "Field list is required.", 400);
	}

	try {
		const doc = await findTemplateFieldListAdminById(fieldListId);
		if (!doc) {
			return jsonError("NOT_FOUND", "Field list not found.", 404);
		}

		if (!doc.supportsOptions) {
			return jsonError(
				"VALIDATION_REQUIRED",
				"Selected field list does not support options.",
				400,
			);
		}

		return NextResponse.json({ doc });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load field option metadata.";
		return jsonError("SERVER_ERROR", message, 500);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
