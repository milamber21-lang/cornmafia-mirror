//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/navigation-panels/content-picker/route.ts                              ////
//// Language: TS                                                                                               ////
//// Admin navigation designer content picker route with server-driven filtering and pagination.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listNavigationContentPickerAdmin } from "@/lib/data/navigation";
import {
	classifyAdminMutationError,
	jsonError,
	normalizeCode,
	parsePageParam,
	parsePageSizeParam,
	parsePositiveInt,
	requireAdminResponse,
} from "@/lib/server/admin-route";

export const dynamic = "force-dynamic";

function parseExcludedContentIds(value: string | null): string[] {
	if (!value) {
		return [];
	}

	return value
		.split(",")
		.map((item) => parsePositiveInt(item))
		.filter((item): item is number => item !== null)
		.map((item) => String(item));
}

export async function GET(request: Request): Promise<NextResponse> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	const { searchParams } = new URL(request.url);
	const categoryId = parsePositiveInt(searchParams.get("categoryId"));
	const subcategoryId = parsePositiveInt(searchParams.get("subcategoryId"));

	if (categoryId === null || subcategoryId === null) {
		return jsonError(
			"VALIDATION_REQUIRED",
			"Category and subcategory are required.",
			400,
		);
	}

	try {
		const result = await listNavigationContentPickerAdmin({
			categoryId,
			subcategoryId,
			search: searchParams.get("search") ?? "",
			contentKindCode: normalizeCode(searchParams.get("contentKindCode")),
			statusCode: normalizeCode(searchParams.get("statusCode")),
			excludedContentIds: parseExcludedContentIds(
				searchParams.get("excludedContentIds"),
			),
			page: parsePageParam(searchParams.get("page"), 1),
			pageSize: parsePageSizeParam(searchParams.get("pageSize"), {
				defaultPageSize: 20,
				maxPageSize: 50,
			}),
		});

		return NextResponse.json(result);
	} catch (error: unknown) {
		const classified = classifyAdminMutationError(
			error,
			"Failed to load navigation content picker.",
		);
		return jsonError(classified.code, classified.message, classified.status);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
