//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/riseopedia/asset-classes/route.ts                                           ////
//// Language: TS                                                                                           ////
//// Public Riseopedia asset class list API backed by web_view Riseopedia read contracts.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listRiseopediaAssetClasses } from "@/lib/data/riseopedia-asset-classes";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const rows = await listRiseopediaAssetClasses();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load Riseopedia asset classes.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
