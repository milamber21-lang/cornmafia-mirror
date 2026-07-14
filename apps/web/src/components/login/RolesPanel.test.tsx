//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/login/RolesPanel.test.tsx                                                      ////
//// Language: TSX                                                                                                ////
//// Verifies guild access roles render as compact rows with runtime Discord color swatches.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import RolesPanel from "@/components/login/RolesPanel";

function createJsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

describe("RolesPanel", () => {
	beforeEach(() => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				createJsonResponse({
					ok: true,
					roles: [
						{
							id: "role-admin",
							name: "Godfather",
							source: "discord",
							colorHex: "cc262d",
							isAdmin: true,
						},
						{
							id: "role-member",
							name: "Mafia Guild Member",
							source: "virtual",
							isAuthenticatedDefault: true,
						},
					],
				}),
			),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("uses compact role rows instead of full role cards", async () => {
		const { container } = render(<RolesPanel />);

		await screen.findByText("Godfather");
		expect(screen.getByText("Mafia Guild Member")).toBeInTheDocument();
		expect(screen.getByText("Member access")).toBeInTheDocument();
		expect(container.querySelectorAll(".member-role-row")).toHaveLength(2);
		expect(container.querySelector(".member-role-card")).toBeNull();

		const swatch = container.querySelector<HTMLElement>(".member-role-swatch");
		expect(swatch?.style.getPropertyValue("--role-color")).toBe("#cc262d");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
