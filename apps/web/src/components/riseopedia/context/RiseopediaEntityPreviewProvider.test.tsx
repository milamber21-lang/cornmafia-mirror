/** @vitest-environment jsdom */
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/context/RiseopediaEntityPreviewProvider.test.tsx                  ////
//// Language: TSX                                                                                               ////
//// Verifies normal public-content Riseopedia links reuse the delegated entity hover-preview behavior.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RiseopediaEntityPreviewProvider from "./RiseopediaEntityPreviewProvider";

vi.mock("@/components/riseopedia/browse/cards/RiseopediaEntityCard", () => ({
	default: () => <div>Preview card</div>,
}));

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("RiseopediaEntityPreviewProvider", () => {
	it("requests the existing entity-preview endpoint for normal public-content links", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn(
			async () =>
				new Response(JSON.stringify({ ok: false }), {
					headers: { "Content-Type": "application/json" },
					status: 404,
				}),
		);
		vi.stubGlobal("fetch", fetchMock);

		render(
			<RiseopediaEntityPreviewProvider wikiCode="riseopedia">
				<a href="/info/riseopedia/entity/hover-preview-test">Hover target</a>
			</RiseopediaEntityPreviewProvider>,
		);

		fireEvent.pointerOver(screen.getByRole("link", { name: "Hover target" }), {
			pointerType: "mouse",
		});
		await act(async () => {
			vi.advanceTimersByTime(221);
			await Promise.resolve();
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/riseopedia/entity-preview/hover-preview-test",
			expect.objectContaining({
				method: "GET",
				headers: { Accept: "application/json" },
			}),
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
