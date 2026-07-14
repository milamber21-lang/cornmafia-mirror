//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/not-found.tsx                                                                        ////
//// Language: TSX                                                                                               ////
//// Generic public unavailable route rendered from internal DB content with a safe fallback.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import PublicInternalContentPageRoute from "@/components/public/PublicInternalContentPageRoute";
import PublicUnavailablePage from "@/components/public/PublicUnavailablePage";

export default function NotFound() {
	return (
		<PublicInternalContentPageRoute
			pageSlug="unavailable"
			fallback={<PublicUnavailablePage />}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
