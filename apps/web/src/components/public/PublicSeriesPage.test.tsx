//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicSeriesPage.test.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Verifies the shared series header, external filters, sorting controls, shared cards, and empty-state collapse.////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PublicSeriesPage from "@/components/public/PublicSeriesPage";
import type { PublicSeriesResult } from "@/lib/data/public-series";

function createSeriesResult(
	overrides: Partial<PublicSeriesResult> = {},
): PublicSeriesResult {
	return {
		series: {
			id: "series-1",
			title: "Factory Automation",
			slug: "factory-automation",
			description: null,
			categoryId: "category-1",
			categoryTitle: "Guides",
			categorySlug: "guides",
			subcategoryId: "subcategory-1",
			subcategoryTitle: "Tutorials",
			subcategorySlug: "tutorials",
			href: "/series/factory-automation",
			iconKey: null,
			iconColor: null,
		},
		episodes: [
			{
				id: "content-1",
				title: "Automated Storage",
				slug: "automated-storage",
				summary: "Build a storage network that scales with your factory.",
				partNo: 1,
				templateId: "template-1",
				templateLabel: "Tutorial",
				contentKindCode: "page",
				contentKindLabel: "Guide",
				rendererCode: "page",
				publicRoutePrefix: null,
				categoryId: "category-1",
				categoryTitle: "Guides",
				categorySlug: "guides",
				subcategoryId: "subcategory-1",
				subcategoryTitle: "Tutorials",
				subcategorySlug: "tutorials",
				href: "/guides/tutorials/automated-storage",
				publishedAt: "2026-07-13T12:00:00.000Z",
				updatedAt: null,
				iconKey: null,
				iconColor: null,
			},
			{
				id: "content-2",
				title: "Power Routing",
				slug: "power-routing",
				summary: null,
				partNo: 2,
				templateId: "template-1",
				templateLabel: "Tutorial",
				contentKindCode: "page",
				contentKindLabel: "Guide",
				rendererCode: "page",
				publicRoutePrefix: null,
				categoryId: "category-1",
				categoryTitle: "Guides",
				categorySlug: "guides",
				subcategoryId: "subcategory-1",
				subcategoryTitle: "Tutorials",
				subcategorySlug: "tutorials",
				href: "/guides/tutorials/power-routing",
				publishedAt: "2026-07-14T12:00:00.000Z",
				updatedAt: null,
				iconKey: null,
				iconColor: null,
			},
		],
		...overrides,
	};
}

describe("PublicSeriesPage", () => {
	it("uses the shared browse header, separate filter and results panels, and shared cards", () => {
		const { container } = render(
			<PublicSeriesPage series={createSeriesResult()} />,
		);

		expect(
			screen.getByRole("heading", { name: "Factory Automation", level: 1 }),
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
		expect(
			screen.getByRole("button", { name: "Sort series episodes" }),
		).toBeInTheDocument();
		expect(screen.getByText("2 matching episodes")).toBeInTheDocument();
	});

	it("filters episodes without leaving the results panel or an empty card shell", () => {
		const { container } = render(
			<PublicSeriesPage series={createSeriesResult()} />,
		);

		fireEvent.change(screen.getByRole("searchbox", { name: "Search episodes" }), {
			target: { value: "power" },
		});

		expect(screen.getByText("Power Routing")).toBeInTheDocument();
		expect(screen.queryByText("Automated Storage")).toBeNull();
		expect(screen.getByText("1 matching episode")).toBeInTheDocument();
		expect(container.querySelector(".browse-results-panel")).not.toBeNull();
	});

	it("uses the shared empty state while keeping the optional series description", () => {
		const { container } = render(
			<PublicSeriesPage
				series={createSeriesResult({
					episodes: [],
					series: {
						...createSeriesResult().series,
						description: "A practical factory tutorial sequence.",
					},
				})}
			/>,
		);

		expect(
			screen.getByText("A practical factory tutorial sequence."),
		).toBeInTheDocument();
		expect(screen.getByText("No published episodes yet")).toBeInTheDocument();
		expect(container.querySelector(".public-series-episode-grid")).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
