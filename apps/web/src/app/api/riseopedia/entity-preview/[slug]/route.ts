//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/entity-preview/[slug]/route.ts                                      ////
//// Language: TS                                                                                               ////
//// Public Riseopedia entity-link preview API backed by the configured preview full-card read contract.        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { findOpediaEntityLinkPreview } from "@/lib/data/opedia-entity-preview";

export const dynamic = "force-dynamic";

type RiseopediaEntityPreviewRouteContext = {
	params: Promise<{
		slug: string;
	}>;
};

export async function GET(
	_request: Request,
	{ params }: RiseopediaEntityPreviewRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const doc = await findOpediaEntityLinkPreview({
			wikiCode: "riseopedia",
			entitySlug: resolvedParams.slug,
		});

		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		return NextResponse.json({ doc }, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load the Riseopedia entity preview.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
