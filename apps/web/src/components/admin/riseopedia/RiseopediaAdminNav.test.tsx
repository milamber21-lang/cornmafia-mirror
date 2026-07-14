//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminNav.test.tsx                                  ////
//// Language: TSX                                                                                                ////
//// Verifies Riseopedia admin navigation exposes active product-management routes.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RiseopediaAdminNav from "./RiseopediaAdminNav";

describe("RiseopediaAdminNav", () => {
	it("renders the active route and core admin families", () => {
		render(<RiseopediaAdminNav active="properties" />);

		expect(
			screen.getByRole("navigation", { name: "Riseopedia administration" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Properties" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("link", { name: "Sections" })).toHaveAttribute(
			"href",
			"/admin/riseopedia/sections",
		);
		expect(
			screen.getByRole("link", { name: "Release Evidence" }),
		).toHaveAttribute("href", "/admin/riseopedia/release-evidence");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
