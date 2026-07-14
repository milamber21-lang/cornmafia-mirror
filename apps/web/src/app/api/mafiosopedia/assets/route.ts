//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/assets/route.ts                                                     ////
//// Language: TS                                                                                             ////
//// Public Mafiosopedia asset list API backed by override-aware web_view read contracts.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import {
	listMafiosopediaAssets,
	type MafiosopediaAssetListFilters,
} from "@/lib/data/mafiosopedia-assets";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 48;
const MAX_PAGE_SIZE = 120;

function parsePositiveInt(value: string | null, fallback: number): number {
	if (!value || !/^\d+$/.test(value.trim())) {
		return fallback;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeNullableParam(value: string | null): string | null {
	const normalized = value?.trim();
	return normalized && normalized.length > 0 ? normalized : null;
}

function parseFilters(request: NextRequest): MafiosopediaAssetListFilters {
	const searchParams = request.nextUrl.searchParams;
	const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
	const requestedPageSize = parsePositiveInt(
		searchParams.get("pageSize"),
		DEFAULT_PAGE_SIZE,
	);
	const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

	return {
		search: normalizeNullableParam(searchParams.get("q")),
		section: normalizeNullableParam(searchParams.get("section")),
		assetClassCode: normalizeNullableParam(searchParams.get("class")),
		categorySlug: normalizeNullableParam(searchParams.get("category")),
		subcategorySlug: normalizeNullableParam(searchParams.get("subcategory")),
		brandCode: normalizeNullableParam(searchParams.get("brand")),
		page,
		pageSize,
	};
}

export async function GET(request: NextRequest): Promise<Response> {
	try {
		const result = await listMafiosopediaAssets(parseFilters(request));
		return NextResponse.json(result, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load Mafiosopedia assets.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
