//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/entity-preview/[slug]/route.ts                                    ////
//// Language: TS                                                                                               ////
//// Public Mafiosopedia entity-link preview API with current release-view filtering.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextRequest, NextResponse } from "next/server";

import { findOpediaEntityLinkPreview } from "@/lib/data/opedia-entity-preview";
import { parseMafiosopediaReleaseFilters } from "@/lib/data/mafiosopedia-release";

export const dynamic = "force-dynamic";

type MafiosopediaEntityPreviewRouteContext = {
	params: Promise<{
		slug: string;
	}>;
};

export async function GET(
	request: NextRequest,
	{ params }: MafiosopediaEntityPreviewRouteContext,
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const doc = await findOpediaEntityLinkPreview({
			wikiCode: "mafiosopedia",
			entitySlug: resolvedParams.slug,
			releaseFilters: parseMafiosopediaReleaseFilters(
				request.nextUrl.searchParams.get("release"),
			),
		});

		if (!doc) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		return NextResponse.json({ doc }, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load the Mafiosopedia entity preview.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
