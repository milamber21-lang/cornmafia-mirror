//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentFieldFrame.test.tsx                                   ////
//// Language: TSX                                                                                                ////
//// Verifies semantic published-field presentation classes without changing template-controlled field content.   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ContentFieldFrame from "./ContentFieldFrame";
import type { ContentRenderField } from "./types";

function createField(
	overrides: Partial<ContentRenderField> = {},
): ContentRenderField {
	return {
		id: "field-1",
		fieldListCode: "plain_text",
		label: "Field label",
		helpText: null,
		fieldTypeCode: "text",
		renderDestinationCode: "main",
		layoutWidthCode: "full",
		layoutAlignCode: "stretch",
		showLabel: true,
		labelStyleCode: "label",
		labelPositionCode: "above",
		labelSeparatorCode: "colon",
		valueColumnName: "value_text",
		displayOrder: 1,
		value: "Value",
		optionLabel: null,
		media: null,
		contentLink: null,
		...overrides,
	};
}

describe("ContentFieldFrame", () => {
	it("adds destination and fact presentation classes for normal values", () => {
		const { container } = render(
			<ContentFieldFrame field={createField()}>
				<p>Value</p>
			</ContentFieldFrame>,
		);

		expect(container.querySelector("section")).toHaveClass(
			"content-field-frame",
			"content-field-frame--presentation-fact",
			"content-field-frame--destination-main",
			"content-field-frame--with-label",
			"content-field-frame--label-label",
			"content-field-frame--label-position-above",
		);
	});

	it("recognizes URL-like text fields as link presentation", () => {
		const { container } = render(
			<ContentFieldFrame
				field={createField({
					fieldListCode: "external_url",
					valueColumnName: "value_text",
				})}
			>
				<a href="https://example.com">Example</a>
			</ContentFieldFrame>,
		);

		expect(container.querySelector("section")).toHaveClass(
			"content-field-frame--presentation-link",
		);
	});

	it("keeps hidden labels out of the rendered structure and class contract", () => {
		const { container } = render(
			<ContentFieldFrame
				field={createField({
					fieldTypeCode: "rich_text",
					renderDestinationCode: "top",
				})}
				showLabel={false}
			>
				<div>Introduction</div>
			</ContentFieldFrame>,
		);

		expect(container.querySelector("section")).toHaveClass(
			"content-field-frame--presentation-prose",
			"content-field-frame--destination-top",
			"content-field-frame--without-label",
		);
		expect(screen.queryByText("Field label:")).not.toBeInTheDocument();
	});

	it("preserves title labels as semantic headings", () => {
		render(
			<ContentFieldFrame
				field={createField({
					label: "Requirements",
					labelStyleCode: "title",
					labelSeparatorCode: "none",
					fieldTypeCode: "option",
				})}
			>
				<span>Advanced</span>
			</ContentFieldFrame>,
		);

		expect(
			screen.getByRole("heading", { level: 2, name: "Requirements" }),
		).toBeInTheDocument();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
