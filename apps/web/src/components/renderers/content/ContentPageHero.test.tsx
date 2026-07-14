//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentPageHero.test.tsx                                     ////
//// Language: TSX                                                                                                ////
//// Verifies content Hero breadcrumbs, retired overline behavior, and optional media-column collapse.            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ContentPageHero from "./ContentPageHero";
import type { ContentRenderField, ContentRenderModel } from "./types";

function createField(
	overrides: Partial<ContentRenderField> = {},
): ContentRenderField {
	return {
		id: "hero-field-1",
		fieldListCode: "hero_text",
		label: "Hero text",
		helpText: null,
		fieldTypeCode: "text",
		renderDestinationCode: "hero",
		layoutWidthCode: "full",
		layoutAlignCode: "stretch",
		showLabel: true,
		labelStyleCode: "label",
		labelPositionCode: "above",
		labelSeparatorCode: "none",
		valueColumnName: "value_text",
		displayOrder: 1,
		value: "",
		optionLabel: null,
		media: null,
		contentLink: null,
		...overrides,
	};
}

function createModel(
	heroFields: ContentRenderField[],
	overrides: Partial<ContentRenderModel> = {},
): ContentRenderModel {
	return {
		surfaceScope: "public",
		mediaRouteScope: "app",
		doc: {
			id: "content-1",
			title: "Storage Tutorial",
			slug: "storage-tutorial",
			summary: "Build a modular storage network.",
			categoryTitle: "Guides",
			categorySlug: "guides",
			subcategoryTitle: "Tutorials",
			subcategorySlug: "tutorials",
			contentKindCode: "page",
			contentKindLabel: "Page",
			templateLabel: null,
			seriesTitle: null,
			series: null,
			authorUsername: null,
			publishedAt: null,
			updatedAt: null,
			rendererCode: "page",
			publicHref: "/guides/tutorials/storage-tutorial",
			iconKey: null,
			iconColor: null,
		},
		fields: heroFields,
		fieldsByDestination: {
			seo: [],
			hero: heroFields,
			top: [],
			left: [],
			main: [],
			right: [],
			bottom: [],
			hidden: [],
		},
		...overrides,
	};
}

describe("ContentPageHero", () => {
	it("renders no header when the template has no Hero destination fields", () => {
		const { container } = render(<ContentPageHero model={createModel([])} />);

		expect(container.firstChild).toBeNull();
	});

	it("renders system-derived public breadcrumbs above the canonical title", () => {
		const { container } = render(
			<ContentPageHero model={createModel([createField()])} />,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "Storage Tutorial" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Build a modular storage network."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("navigation", { name: "Content breadcrumb" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute(
			"href",
			"/guides",
		);
		expect(screen.getByRole("link", { name: "Tutorials" })).toHaveAttribute(
			"href",
			"/guides/tutorials",
		);
		expect(screen.getByText("Storage Tutorial")).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(
			container.querySelector(
				".surface-page-hero__copy > .surface-page-hero__breadcrumbs",
			),
		).not.toBeNull();
		expect(container.querySelector(".surface-page-hero__body")).toBeNull();
	});

	it("renders preview breadcrumbs as non-linking context", () => {
		render(
			<ContentPageHero
				model={createModel([createField()], { surfaceScope: "member" })}
			/>,
		);

		expect(screen.queryByRole("link", { name: "Guides" })).toBeNull();
		expect(screen.getByText("Guides")).toBeInTheDocument();
		expect(screen.getByText("Tutorials")).toBeInTheDocument();
	});

	it("does not reserve a media column for unresolved Hero media", () => {
		const { container } = render(
			<ContentPageHero
				model={createModel([
					createField({
						fieldListCode: "hero_media_id",
						fieldTypeCode: "media_id",
						value: "42",
						media: null,
					}),
				])}
			/>,
		);

		expect(container.querySelector(".surface-page-hero__media")).toBeNull();
		expect(container.querySelector(".surface-page-hero--with-media")).toBeNull();
	});

	it("ignores legacy Hero overline values instead of rendering a replacement field", () => {
		const { container } = render(
			<ContentPageHero
				model={createModel([
					createField({
						fieldListCode: "hero_overline",
						value: "Advanced tutorial",
					}),
				])}
			/>,
		);

		expect(screen.queryByText("Advanced tutorial")).toBeNull();
		expect(container.querySelector(".surface-page-hero__eyebrow")).toBeNull();
		expect(container.querySelector(".surface-page-hero__body")).toBeNull();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
