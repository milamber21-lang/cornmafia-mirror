//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/templates/template-admin-route.ts                                        ////
//// Language: TS                                                                                                  ////
//// Template-family admin route helpers built on shared server admin route utilities                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	classifyAdminMutationError,
	type AdminRouteError,
} from "@/lib/server/admin-route";

export {
	jsonError,
	normalizeCode,
	normalizeNullableString,
	normalizeNonEmptyString,
	parseBoolean,
	parseNonNegativeInt,
	parsePositiveInt,
	parseRequiredBoolean,
	requireActorDiscordId,
	requireAdminResponse,
	type ApiErrorCode,
} from "@/lib/server/admin-route";

export function classifyTemplateAdminError(
	error: unknown,
	fallbackMessage: string,
): AdminRouteError {
	return classifyAdminMutationError(error, fallbackMessage);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
