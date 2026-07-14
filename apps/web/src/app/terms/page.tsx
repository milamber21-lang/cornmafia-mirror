//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/terms/page.tsx                                                                       ////
//// Language: TSX                                                                                               ////
//// Public terms route rendered from DB-backed internal page content.                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { Metadata } from "next";

import PublicInternalContentPageRoute from "@/components/public/PublicInternalContentPageRoute";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Terms",
};

export default function TermsPage() {
	return <PublicInternalContentPageRoute pageSlug="terms" />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
