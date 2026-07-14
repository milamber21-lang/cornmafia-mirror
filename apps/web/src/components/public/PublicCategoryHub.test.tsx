//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicCategoryHub.test.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Verifies category overview header parity, separate filter/results surfaces, shared cards, and search collapse.////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicCategoryHub from "@/components/public/PublicCategoryHub";
import type { PublicCategoryResult } from "@/lib/data/public-content";

const CATEGORY: PublicCategoryResult = {
	category: {
		id: "category-1",
		title: "Guild",
		slug: "guild",
		iconKey: null,
		iconColor: null,
	},
	subcategories: [
		{
			id: "subcategory-1",
			title: "About Us",
			slug: "about-us",
			iconKey: null,
			iconColor: null,
			href: "/guild/about-us",
			contentCount: 4,
		},
		{
			id: "subcategory-2",
			title: "Rules",
			slug: "rules",
			iconKey: null,
			iconColor: null,
			href: "/guild/rules",
			contentCount: 2,
		},
	],
	content: [],
};

describe("PublicCategoryHub", () => {
	it("uses the shared header, separate filter and result panels, and shared collection cards", () => {
		const { container } = render(<PublicCategoryHub category={CATEGORY} />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Guild" }),
		).toBeInTheDocument();
		expect(container.querySelector(".browse-page-header")).not.toBeNull();
		expect(container.querySelector(".browse-filter-panel")).not.toBeNull();
		expect(container.querySelector(".browse-results-panel")).not.toBeNull();
		expect(container.querySelector(".surface-page-hero")).toBeNull();
		expect(container.querySelectorAll(".browse-result-card")).toHaveLength(2);
		expect(container.querySelectorAll(".app-icon-visual--card")).toHaveLength(2);
		expect(
			container.querySelector(".public-browse-filter-search"),
		).not.toBeNull();
		expect(screen.getByText("2 matching collections")).toBeInTheDocument();
	});

	it("filters collection cards and updates the header count without empty card shells", () => {
		const { container } = render(<PublicCategoryHub category={CATEGORY} />);

		fireEvent.change(
			screen.getByRole("searchbox", { name: "Search collections" }),
			{ target: { value: "rules" } },
		);

		expect(screen.getByText("Rules")).toBeInTheDocument();
		expect(screen.queryByText("About Us")).toBeNull();
		expect(screen.getByText("1 matching collection")).toBeInTheDocument();
		expect(container.querySelectorAll(".browse-result-card")).toHaveLength(1);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
