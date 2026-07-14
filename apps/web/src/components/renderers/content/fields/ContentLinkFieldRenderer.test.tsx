//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/ContentLinkFieldRenderer.test.tsx                     ////
//// Language: TSX                                                                                                ////
//// Verifies resolved content references render safe links and never expose raw internal IDs.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ContentLinkFieldRenderer from "./ContentLinkFieldRenderer";
import type { ContentRenderField } from "../types";

function createField(
	overrides: Partial<ContentRenderField> = {},
): ContentRenderField {
	return {
		id: "field-1",
		fieldListCode: "related_content",
		label: "Related guide",
		helpText: null,
		fieldTypeCode: "content_id",
		renderDestinationCode: "main",
		layoutWidthCode: "full",
		layoutAlignCode: "stretch",
		showLabel: true,
		labelStyleCode: "label",
		labelPositionCode: "above",
		labelSeparatorCode: "colon",
		valueColumnName: "value_content_id",
		displayOrder: 1,
		value: "123",
		optionLabel: null,
		media: null,
		contentLink: {
			id: "123",
			title: "Advanced farming",
			href: "/guides/farming/advanced-farming",
		},
		...overrides,
	};
}

describe("ContentLinkFieldRenderer", () => {
	it("renders the resolved title and href", () => {
		render(<ContentLinkFieldRenderer field={createField()} />);

		expect(
			screen.getByRole("link", { name: "Advanced farming" }),
		).toHaveAttribute("href", "/guides/farming/advanced-farming");
		expect(screen.queryByText(/123/)).not.toBeInTheDocument();
	});

	it("renders a neutral unavailable message when the target is unreadable", () => {
		render(
			<ContentLinkFieldRenderer field={createField({ contentLink: null })} />,
		);

		expect(
			screen.getByText("Linked content is unavailable."),
		).toBeInTheDocument();
		expect(screen.queryByText(/123/)).not.toBeInTheDocument();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
