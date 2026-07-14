//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/overview-card-elements/page.tsx                                  ////
//// Language: TSX                                                                                           ////
//// Redirects unscoped overview-card element administration to overview-card rule sets.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OverviewCardElementsAdminPage(): never {
	redirect("/admin/riseopedia/overview-card-rules");
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
