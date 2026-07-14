//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-upload-validation.test.ts                                             //
//// Language: TS                                                                                                //
//// Verifies binary signature, declared MIME compatibility, and upload-size enforcement.                       //
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	UploadValidationError,
	validateUploadedMediaFile,
	type VerifiedMediaMimeType,
} from "@/lib/helpers/media-upload-validation";

const PNG_BYTES = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const PNG_ONLY = new Set<VerifiedMediaMimeType>(["image/png"]);

describe("media upload validation", () => {
	it("accepts a supported file when declared MIME and bytes agree", async () => {
		const result = await validateUploadedMediaFile({
			file: new File([PNG_BYTES], "image.png", { type: "image/png" }),
			maxBytes: 1024,
			allowedMimeTypes: PNG_ONLY,
		});

		expect(result.mimeType).toBe("image/png");
		expect(result.extension).toBe(".png");
		expect(result.sizeBytes).toBe(PNG_BYTES.length);
	});

	it("rejects a declared MIME type that does not match the file bytes", async () => {
		await expect(
			validateUploadedMediaFile({
				file: new File([PNG_BYTES], "image.jpg", { type: "image/jpeg" }),
				maxBytes: 1024,
				allowedMimeTypes: PNG_ONLY,
			}),
		).rejects.toThrow("File content does not match the declared MIME type.");
	});

	it("rejects files above the configured size limit", async () => {
		await expect(
			validateUploadedMediaFile({
				file: new File([PNG_BYTES], "image.png", { type: "image/png" }),
				maxBytes: 4,
				allowedMimeTypes: PNG_ONLY,
			}),
		).rejects.toBeInstanceOf(UploadValidationError);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
