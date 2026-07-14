//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/display-format.ts                                                            ////
//// Language: TS                                                                                                ////
//// Deterministic display formatting helpers for server-prerendered client surfaces.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

const SHORT_MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

function normalizeDisplayText(value: string): string {
	return value.normalize("NFKD").toLowerCase();
}

export function compareDisplayText(left: string, right: string): number {
	const normalizedLeft = normalizeDisplayText(left);
	const normalizedRight = normalizeDisplayText(right);

	if (normalizedLeft < normalizedRight) {
		return -1;
	}

	if (normalizedLeft > normalizedRight) {
		return 1;
	}

	if (left < right) {
		return -1;
	}

	if (left > right) {
		return 1;
	}

	return 0;
}

export function formatDisplayInteger(value: number): string {
	if (!Number.isFinite(value)) {
		return "0";
	}

	const integerValue = Math.trunc(value);
	return String(integerValue).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatDisplayDate(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const month = SHORT_MONTH_NAMES[date.getUTCMonth()];
	return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
