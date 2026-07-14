//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/browse/BrowsePrimitives.test.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Verifies modular shared browse headers, panels, cards, and global application icon visuals.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IconVisual from "@/components/ui/IconVisual";
import BrowsePageHeader from "@/components/ui/browse/BrowsePageHeader";
import BrowseResultCard from "@/components/ui/browse/BrowseResultCard";
import {
	BrowseFilterPanel,
	BrowsePanelHeader,
	BrowseResultsPanel,
} from "@/components/ui/browse/BrowseSurfaces";

describe("BrowsePageHeader", () => {
	it("omits the empty description element while retaining the shared header structure", () => {
		const { container } = render(
			<BrowsePageHeader
				title="About Us"
				breadcrumbs={[{ label: "Guild", href: "/guild" }, { label: "About Us" }]}
				actions={<span>4 entries</span>}
			/>,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "About Us" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Guild" })).toHaveAttribute(
			"href",
			"/guild",
		);
		expect(screen.getByText("4 entries")).toBeInTheDocument();
		expect(screen.getByText("About Us")).toHaveAttribute("aria-current", "page");
		expect(
			container.querySelector(".browse-page-header__breadcrumb-separator"),
		).not.toBeNull();
		expect(
			container.querySelector(".browse-page-header__description"),
		).toBeNull();
		expect(
			container.querySelector(".browse-page-header--with-description"),
		).toBeNull();
	});

	it("adds the description element only when a real description is supplied", () => {
		const { container } = render(
			<BrowsePageHeader
				title="Locations"
				description="Public geography, towns, districts, and POIs."
			/>,
		);

		expect(
			screen.getByText("Public geography, towns, districts, and POIs."),
		).toBeInTheDocument();
		expect(
			container.querySelector(".browse-page-header--with-description"),
		).not.toBeNull();
	});
});

describe("browse surfaces", () => {
	it("applies the shared filter, results, and section-header contracts", () => {
		const { container } = render(
			<>
				<BrowseFilterPanel>Filters</BrowseFilterPanel>
				<BrowseResultsPanel>
					<BrowsePanelHeader title="Results" actions={<span>12 entries</span>} />
				</BrowseResultsPanel>
			</>,
		);

		expect(container.querySelector(".browse-filter-panel")).not.toBeNull();
		expect(container.querySelector(".browse-results-panel")).not.toBeNull();
		expect(
			screen.getByRole("heading", { level: 2, name: "Results" }),
		).toBeInTheDocument();
		expect(screen.getByText("12 entries")).toBeInTheDocument();
	});
});

describe("BrowseResultCard", () => {
	it("renders only populated optional slots and adds the destination affordance for links", () => {
		const { container } = render(
			<BrowseResultCard
				href="/guild/about-us/welcome"
				eyebrow="Page"
				title="Welcome"
				summary=""
			/>,
		);

		expect(screen.getByRole("link", { name: /Welcome/i })).toHaveAttribute(
			"href",
			"/guild/about-us/welcome",
		);
		expect(container.querySelector(".browse-result-card__summary")).toBeNull();
		expect(container.querySelector(".browse-result-card__arrow")).not.toBeNull();
		expect(
			container.querySelector(".browse-result-card--interactive"),
		).not.toBeNull();
	});
});

describe("IconVisual", () => {
	it("uses IconRender inside the global visual shell", () => {
		const { container } = render(
			<IconVisual
				fallback={{ lucideName: "FolderOpen" }}
				size="card"
				title="Collection"
			/>,
		);

		expect(container.querySelector(".app-icon-visual--card")).not.toBeNull();
		expect(container.querySelector(".app-icon-visual__icon")).not.toBeNull();
		expect(screen.getByRole("img", { name: "Collection" })).toBeInTheDocument();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
