//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicCollectionHub.test.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Verifies collection header parity, external filters, result cards, counts, and preserved authoring actions.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PublicCollectionHub from "@/components/public/PublicCollectionHub";
import type { PublicCollectionResult } from "@/lib/data/public-content";

vi.mock("@/components/me/MemberContentCreatePanel", () => ({
	default: ({ open }: { open: boolean }) =>
		open ? <div data-testid="create-panel">Create panel</div> : null,
}));

const COLLECTION: PublicCollectionResult = {
	category: {
		id: "category-1",
		title: "Guild",
		slug: "guild",
		iconKey: null,
		iconColor: null,
	},
	collection: {
		id: "subcategory-1",
		title: "About Us",
		slug: "about-us",
		iconKey: null,
		iconColor: null,
	},
	actions: {
		canCreate: true,
		hasManageableContent: true,
	},
	content: [
		{
			id: "content-1",
			title: "Welcome",
			slug: "welcome",
			summary: "A warm invitation.",
			contentKindCode: "page",
			contentKindLabel: "Page",
			rendererCode: "page",
			publicHref: "/guild/about-us/welcome",
			publishedAt: "2026-05-29T12:00:00.000Z",
			updatedAt: null,
			iconKey: null,
			iconColor: null,
			templateId: "template-1",
			templateLabel: "Standard page",
		},
		{
			id: "content-2",
			title: "Roles explained",
			slug: "roles-explained",
			summary: null,
			contentKindCode: "page",
			contentKindLabel: "Page",
			rendererCode: "page",
			publicHref: "/guild/about-us/roles-explained",
			publishedAt: "2026-05-27T12:00:00.000Z",
			updatedAt: null,
			iconKey: null,
			iconColor: null,
			templateId: "template-1",
			templateLabel: "Standard page",
		},
	],
};

describe("PublicCollectionHub", () => {
	it("uses the shared overview header and keeps filters outside the result panel", () => {
		const { container } = render(
			<PublicCollectionHub
				collection={COLLECTION}
				initialPage={1}
				initialSearch=""
				initialSort="newest"
				initialPageSize={9}
				initialCreateOpen={false}
			/>,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "About Us" }),
		).toBeInTheDocument();
		expect(container.querySelector(".browse-page-header")).not.toBeNull();
		expect(container.querySelector(".browse-filter-panel")).not.toBeNull();
		expect(container.querySelector(".browse-results-panel")).not.toBeNull();
		expect(container.querySelectorAll(".browse-result-card")).toHaveLength(2);
		expect(container.querySelectorAll(".app-icon-visual--card")).toHaveLength(2);
		expect(
			container.querySelector(".public-browse-filter-search"),
		).not.toBeNull();
		expect(screen.getByText("2 matching entries")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Manage" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Create" })).toBeInTheDocument();
	});

	it("updates the matching count and renders the differentiated filtered empty state", () => {
		render(
			<PublicCollectionHub
				collection={COLLECTION}
				initialPage={1}
				initialSearch=""
				initialSort="newest"
				initialPageSize={9}
				initialCreateOpen={false}
			/>,
		);

		fireEvent.change(screen.getByRole("searchbox", { name: "Search" }), {
			target: { value: "missing" },
		});

		expect(screen.getByText("0 matching entries")).toBeInTheDocument();
		expect(
			screen.getByText("No content matches these filters"),
		).toBeInTheDocument();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
