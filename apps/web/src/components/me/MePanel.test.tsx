//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MePanel.test.tsx                                                            ////
//// Language: TSX                                                                                                ////
//// Verifies member profile save failures remain open and do not emit success callbacks.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MePanel from "@/components/me/MePanel";

function createJsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function getRequestUrl(input: RequestInfo | URL): string {
	if (typeof input === "string") {
		return input;
	}
	if (input instanceof URL) {
		return input.toString();
	}
	return input.url;
}

describe("MePanel", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("keeps the shared panel open when the member profile save fails", async () => {
		const onClose = vi.fn();
		const onSaved = vi.fn();
		const fetchMock = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
				const url = getRequestUrl(input);
				if (url === "/api/me/themes") {
					return createJsonResponse({
						options: [
							{ value: "vintage", label: "Vintage", className: "cm-vintage" },
						],
					});
				}
				if (url === "/api/me" && init?.method === "PATCH") {
					return createJsonResponse({ error: "Profile save rejected." }, 400);
				}
				throw new Error(`Unexpected request: ${url}`);
			},
		);
		vi.stubGlobal("fetch", fetchMock);

		render(
			<MePanel
				open
				onClose={onClose}
				onSaved={onSaved}
				initial={{
					gameUsername: "WoodenElf",
					alias: "Wooden",
					theme: "vintage",
					notes: null,
				}}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		expect(await screen.findByText("Profile save rejected.")).toBeInTheDocument();
		expect(onSaved).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
