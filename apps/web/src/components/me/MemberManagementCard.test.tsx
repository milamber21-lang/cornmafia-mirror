//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberManagementCard.test.tsx                                              ////
//// Language: TSX                                                                                                ////
//// Verifies the shared member-management card geometry and action placement.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MemberManagementCard from "@/components/me/MemberManagementCard";
import { Button } from "@/components/ui";

describe("MemberManagementCard", () => {
	it("uses the shared browse-card shell and keeps management actions outside links", () => {
		const { container } = render(
			<MemberManagementCard
				visual={<span data-testid="visual">V</span>}
				eyebrow="Collection"
				title="Managed item"
				summary="Summary"
				details={<span>Updated today</span>}
				actions={<Button size="sm">Edit</Button>}
			/>,
		);

		expect(container.querySelector("article.browse-result-card")).not.toBeNull();
		expect(container.querySelector("a.browse-result-card")).toBeNull();
		expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
		expect(screen.getByTestId("visual")).toBeInTheDocument();
		expect(
			container.querySelector(".member-management-card__actions"),
		).not.toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
