//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/richtext/RichTextRenderer.test.tsx                                  ////
//// Language: TSX                                                                                                ////
//// Verifies safe public rendering of structured text, image links, and optional image frames.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RichTextRenderer from "./RichTextRenderer";

describe("RichTextRenderer structured images", () => {
	it("renders a structured Riseopedia image target as a clickable image", async () => {
		const rendered = await RichTextRenderer({
			value: {
				root: {
					type: "root",
					children: [
						{
							type: "resizable-image",
							src: "/api/media/file/example.png",
							alt: "Linked example",
							width: 64,
							height: 64,
							linkTarget: {
								kind: "riseopedia_entity",
								entityId: "1000000001",
								href: "/info/riseopedia/entity/example",
							},
						},
					],
				},
			},
		});

		const markup = renderToStaticMarkup(rendered);
		expect(markup).toContain('href="/info/riseopedia/entity/example"');
		expect(markup).toContain('class="richtext-img__link"');
		expect(markup).toContain('data-richtext-link-kind="riseopedia_entity"');
		expect(markup).toContain('alt="Linked example"');
	});

	it("keeps an image unlinked when no structured target is stored", async () => {
		const rendered = await RichTextRenderer({
			value: {
				root: {
					type: "root",
					children: [
						{
							type: "resizable-image",
							src: "/api/media/file/example.png",
							alt: "Plain example",
						},
					],
				},
			},
		});

		const markup = renderToStaticMarkup(rendered);
		expect(markup).not.toContain('class="richtext-img__link"');
		expect(markup).toContain('alt="Plain example"');
	});

	it("renders legacy and new images without a frame by default", async () => {
		const rendered = await RichTextRenderer({
			value: {
				root: {
					type: "root",
					children: [
						{
							type: "resizable-image",
							src: "/api/media/file/example.png",
							alt: "Borderless example",
						},
					],
				},
			},
		});

		const markup = renderToStaticMarkup(rendered);
		expect(markup).toContain('data-frame-style="none"');
		expect(markup).not.toContain("has-border");
	});

	it("renders the shared border class only when explicitly requested", async () => {
		const rendered = await RichTextRenderer({
			value: {
				root: {
					type: "root",
					children: [
						{
							type: "resizable-image",
							src: "/api/media/file/example.png",
							alt: "Bordered example",
							frameStyle: "border",
						},
					],
				},
			},
		});

		const markup = renderToStaticMarkup(rendered);
		expect(markup).toContain('class="richtext-img is-center has-border"');
		expect(markup).toContain('data-frame-style="border"');
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
