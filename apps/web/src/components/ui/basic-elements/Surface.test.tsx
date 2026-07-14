//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Surface.test.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Verifies conditional shared material surfaces and accessibility state behavior.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	PageHero,
	SurfaceCard,
	SurfaceMetaRow,
	SurfaceState,
} from "@/components/ui/basic-elements/Surface";

describe("PageHero", () => {
	it("omits optional wrappers when their slots are absent", () => {
		const { container } = render(<PageHero title="Profile" />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Profile" }),
		).toBeInTheDocument();
		expect(container.querySelector(".surface-page-hero__breadcrumbs")).toBeNull();
		expect(container.querySelector(".surface-page-hero__summary")).toBeNull();
		expect(container.querySelector(".surface-page-hero__footer")).toBeNull();
		expect(container.querySelector(".surface-page-hero__media")).toBeNull();
		expect(container.querySelector(".surface-page-hero--with-media")).toBeNull();
	});

	it("keeps breadcrumbs inside the copy column above the title", () => {
		const { container } = render(
			<PageHero title="Guide" breadcrumbs={<nav>Guides / Tutorial</nav>} />,
		);

		expect(
			container.querySelector(
				".surface-page-hero__copy > .surface-page-hero__breadcrumbs",
			),
		).not.toBeNull();
		expect(
			container.querySelector(
				".surface-page-hero > .surface-page-hero__breadcrumbs",
			),
		).toBeNull();
	});

	it("adds the media layout only when media is provided", () => {
		const { container } = render(
			<PageHero
				title="Guide"
				media={<div aria-label="Guide cover" role="img" />}
			/>,
		);

		expect(screen.getByRole("img", { name: "Guide cover" })).toBeInTheDocument();
		expect(
			container.querySelector(".surface-page-hero--with-media"),
		).not.toBeNull();
		expect(container.querySelector(".surface-page-hero__media")).not.toBeNull();
	});
});

describe("SurfaceMetaRow", () => {
	it("renders nothing when all metadata values are empty", () => {
		const { container } = render(
			<SurfaceMetaRow>
				{null}
				{false}
				{"   "}
			</SurfaceMetaRow>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("preserves valid zero values while removing empty values", () => {
		render(
			<SurfaceMetaRow>
				{null}
				{0}
				{"Tutorial"}
			</SurfaceMetaRow>,
		);

		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByText("Tutorial")).toBeInTheDocument();
	});
});

describe("SurfaceState", () => {
	it("uses alert semantics for errors", () => {
		render(
			<SurfaceState kind="error" description="The content could not be loaded." />,
		);

		expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
	});

	it("marks loading states as busy", () => {
		render(<SurfaceState kind="loading" description="Loading content…" />);

		expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
	});
});

describe("SurfaceCard", () => {
	it("maps material and interaction props to semantic classes", () => {
		render(
			<SurfaceCard material="module" interactive data-testid="card">
				Open
			</SurfaceCard>,
		);

		expect(screen.getByTestId("card")).toHaveClass(
			"surface-card--material-module",
			"surface-card--interactive",
		);
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
