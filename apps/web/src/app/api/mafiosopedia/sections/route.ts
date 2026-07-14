//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/mafiosopedia/sections/route.ts                                                 ////
//// Language: TS                                                                                           ////
//// Public Mafiosopedia section hub API backed by web_view Mafiosopedia section contracts.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import { listMafiosopediaSections } from "@/lib/data/mafiosopedia-sections";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	try {
		const rows = await listMafiosopediaSections();
		return NextResponse.json({ rows }, { status: 200 });
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: "Failed to load Mafiosopedia sections.";
		return NextResponse.json({ ok: false, message }, { status: 500 });
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
