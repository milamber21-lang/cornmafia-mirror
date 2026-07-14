//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/richtext-picker-response.test.ts                                             ////
//// Language: TS                                                                                                ////
//// Verifies detailed but bounded rich-text picker API response diagnostics.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	formatRichTextPickerError,
	readRichTextPickerJson,
} from "./richtext-picker-response";

describe("rich-text picker API response diagnostics", () => {
	it("includes the API code and HTTP status for JSON failures", async () => {
		const response = new Response(
			JSON.stringify({
				ok: false,
				code: "SERVER_ERROR",
				message: "Picker database function is unavailable.",
			}),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);

		await expect(
			readRichTextPickerJson(response, "Failed to load link targets."),
		).rejects.toThrow(
			"Picker database function is unavailable. [SERVER_ERROR; HTTP 500]",
		);
	});

	it("keeps a bounded plain-text response when the server does not return JSON", () => {
		expect(
			formatRichTextPickerError({
				status: 502,
				fallbackMessage: "Failed to load link targets.",
				payload: null,
				rawText: "upstream picker service failed",
			}),
		).toBe("upstream picker service failed [HTTP 502]");
	});

	it("does not expose an HTML error document in the editor", () => {
		expect(
			formatRichTextPickerError({
				status: 500,
				fallbackMessage: "Failed to load Riseopedia targets.",
				payload: null,
				rawText: "<!doctype html><html><body>stack trace</body></html>",
			}),
		).toBe("Failed to load Riseopedia targets. [HTTP 500]");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
