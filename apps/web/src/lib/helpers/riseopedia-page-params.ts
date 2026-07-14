//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/riseopedia-page-params.ts                                                  ////
//// Language: TS                                                                                               ////
//// Shared parser helpers for Riseopedia URL search params.                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RiseopediaSearchParamValue = string | string[] | undefined;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 24;
const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;

export function firstSearchParam(
	value: RiseopediaSearchParamValue,
): string | null {
	const raw = Array.isArray(value) ? value[0] : value;
	const normalized = raw?.trim();
	return normalized && normalized.length > 0 ? normalized : null;
}

export function parsePositiveInt(
	value: string | null,
	fallback: number,
): number {
	if (!value || !/^\d+$/.test(value)) {
		return fallback;
	}

	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parsePageSize(value: string | null): number {
	const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
	return PAGE_SIZE_OPTIONS.some((option) => option === parsed)
		? parsed
		: DEFAULT_PAGE_SIZE;
}

export function parsePage(value: string | null): number {
	return parsePositiveInt(value, DEFAULT_PAGE);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
