//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/richtext-picker-response.ts                                                  ////
//// Language: TS                                                                                                ////
//// Reads rich-text picker API responses while preserving safe server error details and HTTP context.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function isHtmlResponse(text: string): boolean {
	const normalized = text.trim().toLowerCase();
	return (
		normalized.startsWith("<!doctype html") || normalized.startsWith("<html")
	);
}

function compactText(text: string, maxLength = 500): string | null {
	const normalized = text.replace(/\s+/g, " ").trim();
	if (!normalized || isHtmlResponse(normalized)) return null;
	return normalized.length <= maxLength
		? normalized
		: `${normalized.slice(0, maxLength - 1)}…`;
}

export function formatRichTextPickerError(args: {
	status: number;
	fallbackMessage: string;
	payload: unknown;
	rawText: string;
}): string {
	const record = isRecord(args.payload) ? args.payload : null;
	const message =
		readNonEmptyString(record?.message) ??
		readNonEmptyString(record?.error) ??
		readNonEmptyString(record?.detail) ??
		compactText(args.rawText) ??
		args.fallbackMessage;
	const code = readNonEmptyString(record?.code);
	const context = code ? `${code}; HTTP ${args.status}` : `HTTP ${args.status}`;
	return `${message} [${context}]`;
}

export async function readRichTextPickerJson(
	response: Response,
	fallbackMessage: string,
): Promise<unknown> {
	const rawText = await response.text();
	let payload: unknown = null;

	if (rawText.trim().length > 0) {
		try {
			payload = JSON.parse(rawText) as unknown;
		} catch {
			payload = null;
		}
	}

	if (!response.ok) {
		throw new Error(
			formatRichTextPickerError({
				status: response.status,
				fallbackMessage,
				payload,
				rawText,
			}),
		);
	}

	if (payload === null) {
		throw new Error(
			`${fallbackMessage} The server returned an empty or non-JSON response. [HTTP ${response.status}]`,
		);
	}

	return payload;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
