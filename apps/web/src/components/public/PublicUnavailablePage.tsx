//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicUnavailablePage.tsx                                               ////
//// Language: TSX                                                                                               ////
//// Shared public unavailable page for missing, unpublished, or unreadable public content routes                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

export default function PublicUnavailablePage(): JSX.Element {
	return (
		<section className="card public-unavailable">
			<p className="public-unavailable-eyebrow">Unavailable</p>

			<h1 className="public-unavailable-title">This page is unavailable.</h1>

			<p className="public-unavailable-message">
				The page may not exist, may not be published, or you may not have access.
			</p>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
