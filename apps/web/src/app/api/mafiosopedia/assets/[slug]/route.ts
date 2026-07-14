//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/assets/[slug]/route.ts                                              ////
//// Language: TS                                                                                             ////
//// Public Mafiosopedia asset detail API backed by entity-first public detail read models.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { findMafiosopediaEntityDetailBySlug } from "@/lib/data/mafiosopedia-entity-detail";

export const dynamic = "force-dynamic";

type MafiosopediaAssetDetailRouteContext = {
	params: Promise<{
		slug: string;
	}>;
};

export async function GET(
	_request: Request,
	{ params }: MafiosopediaAssetDetailRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const detail = await findMafiosopediaEntityDetailBySlug({
			slug: resolvedParams.slug,
			entityTypeCode: "asset",
		});

		if (!detail) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		return NextResponse.json(detail, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load Mafiosopedia asset.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
