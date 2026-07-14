//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/riseopedia-number-format.ts                                                ////
//// Language: TS                                                                                               ////
//// Formats Riseopedia-family numeric display values with space-separated thousands groups.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RiseopediaNumberFormatOptions = {
	maximumFractionDigits?: number;
	minimumFractionDigits?: number;
};

const NUMERIC_TEXT_PATTERN =
	/^-?(?:\d{1,3}(?:[ ,\u00a0]\d{3})+|\d+)(?:\.\d+)?$/;

function normalizedNumericText(value: string): string | null {
	const trimmed = value.trim();
	if (!NUMERIC_TEXT_PATTERN.test(trimmed)) {
		return null;
	}

	return trimmed.replace(/[ ,\u00a0]/g, "");
}

export function formatRiseopediaNumber(
	value: number,
	options: RiseopediaNumberFormatOptions = {},
): string {
	if (!Number.isFinite(value)) {
		return "—";
	}

	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: options.maximumFractionDigits ?? 4,
		minimumFractionDigits: options.minimumFractionDigits,
	})
		.format(value)
		.replace(/,/g, " ");
}

export function formatRiseopediaNumericText(
	value: string,
	options: RiseopediaNumberFormatOptions = {},
): string {
	const normalized = normalizedNumericText(value);
	if (!normalized) {
		return value;
	}

	const parsed = Number(normalized);
	return Number.isFinite(parsed)
		? formatRiseopediaNumber(parsed, options)
		: value;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
