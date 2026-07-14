//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/display-format.test.ts                                                       ////
//// Language: TS                                                                                                ////
//// Tests deterministic display formatting used by hydrated public browse surfaces.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { describe, expect, it } from "vitest";

import {
	compareDisplayText,
	formatDisplayDate,
	formatDisplayInteger,
} from "@/lib/helpers/display-format";

describe("display-format", () => {
	it("formats dates from UTC fields rather than the runtime time zone", () => {
		expect(formatDisplayDate("2026-05-29T23:30:00-10:00")).toBe("May 30, 2026");
	});

	it("returns null for missing or invalid dates", () => {
		expect(formatDisplayDate(null)).toBeNull();
		expect(formatDisplayDate("not-a-date")).toBeNull();
	});

	it("formats integers without relying on the runtime locale", () => {
		expect(formatDisplayInteger(1234567)).toBe("1,234,567");
	});

	it("compares display labels deterministically", () => {
		const values = ["Zulu", "alpha", "Beta"];
		expect(values.sort(compareDisplayText)).toEqual(["alpha", "Beta", "Zulu"]);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
