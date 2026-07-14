//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicContentCard.test.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Verifies shared public browse cards, the global icon visual, and optional metadata collapse.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicContentCard from "@/components/public/PublicContentCard";
import type { PublicContentCardDoc } from "@/lib/data/public-content";

function createCard(
	overrides: Partial<PublicContentCardDoc> = {},
): PublicContentCardDoc {
	return {
		id: "content-1",
		title: "Storage Tutorial",
		slug: "storage-tutorial",
		summary: null,
		contentKindCode: "page",
		contentKindLabel: "Guide",
		rendererCode: "page",
		publicHref: "/guides/tutorials/storage-tutorial",
		publishedAt: null,
		updatedAt: null,
		iconKey: null,
		iconColor: null,
		...overrides,
	};
}

describe("PublicContentCard", () => {
	it("uses the global browse-card and icon-visual contracts without empty optional slots", () => {
		const { container } = render(<PublicContentCard card={createCard()} />);

		expect(
			screen.getByRole("link", { name: /Storage Tutorial/i }),
		).toHaveAttribute("href", "/guides/tutorials/storage-tutorial");
		expect(container.querySelector(".browse-result-card")).not.toBeNull();
		expect(container.querySelector(".app-icon-visual--card")).not.toBeNull();
		expect(screen.queryByText("No date")).toBeNull();
		expect(container.querySelector(".browse-result-card__summary")).toBeNull();
	});

	it("adds collection context and a valid publication date without empty separators", () => {
		const container = render(
			<PublicContentCard
				card={createCard({ publishedAt: "2026-07-13T12:00:00.000Z" })}
				context="Tutorials"
			/>,
		).container;

		expect(screen.getByText("Tutorials")).toBeInTheDocument();
		expect(screen.getByText("Jul 13, 2026")).toBeInTheDocument();
		expect(
			container.querySelectorAll(".public-browse-card-meta__item"),
		).toHaveLength(3);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
