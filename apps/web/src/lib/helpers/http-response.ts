//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/http-response.ts                                                               ////
//// Language: TS                                                                                                  ////
//// Shared response text reader for admin and member fetch error handling                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export async function readResponseMessage(
	response: Response,
	fallbackMessage: string,
): Promise<string> {
	const text = await response.text();

	if (!text) {
		return `${fallbackMessage} (${response.status})`;
	}

	try {
		const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };

		if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
			return parsed.message;
		}

		if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
			return parsed.error;
		}
	} catch {
		return text;
	}

	return text;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
