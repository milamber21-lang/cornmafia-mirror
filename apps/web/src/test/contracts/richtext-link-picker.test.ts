//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/test/contracts/richtext-link-picker.test.ts                                               ////
//// Language: TS                                                                                                 ////
//// Contract checks for tabbed editor link picker contexts, cached metadata, fast rows, and structured links.    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "src");
const read = (relativePath: string): string =>
	readFileSync(resolve(root, relativePath), "utf8");

describe("rich-text tabbed link picker contracts", () => {
	it("keeps admin and member picker routes separate", () => {
		const adminRoute = read("app/api/admin/web/richtext-links/internal/route.ts");
		expect(adminRoute).toContain("requireActorDiscordId({");
		expect(adminRoute).toContain("allowAdminOrEditor: true");
		expect(read("app/api/me/richtext-links/internal/route.ts")).toContain(
			"getCurrentActorDiscordId()",
		);
	});

	it("offers external links only in the admin picker context", () => {
		const source = read("components/editors/richtext/nodes/LinkPickerPopup.tsx");
		expect(source).toContain('mediaContext === "admin"');
		expect(source).toContain('label: "External Link"');
		expect(source).toContain("/api/admin/web/external-link-hosts/validate");
	});

	it("creates durable internal and Riseopedia targets", () => {
		const source = read("components/editors/richtext/nodes/LinkPickerPopup.tsx");
		expect(source).toContain('kind: "internal_content"');
		expect(source).toContain('kind: "riseopedia_entity"');
		expect(source).toContain("contentId: row.id");
		expect(source).toContain("entityId: row.id");
	});

	it("routes selected images through the same structured target picker", () => {
		const toolbar = read("components/editors/richtext/RichTextEditorToolbar.tsx");
		const editor = read("components/editors/richtext/RichTextEditor.tsx");
		expect(toolbar).toContain("selection?.at.image");
		expect(toolbar).toContain("onApplyImageLinkTarget");
		expect(editor).toContain("applyImageLinkTargetToSelection");
		expect(editor).toContain('readNodeType(node) !== "resizable-image"');
	});

	it("uses cached metadata, cached rows, hover prefetch, and a twenty-row maximum", () => {
		const popup = read("components/editors/richtext/nodes/LinkPickerPopup.tsx");
		const toolbar = read("components/editors/richtext/RichTextEditorToolbar.tsx");
		const cache = read(
			"components/editors/richtext/nodes/richtext-link-picker-cache.ts",
		);
		const internalRoute = read(
			"app/api/admin/web/richtext-links/internal/route.ts",
		);
		const riseopediaRoute = read(
			"app/api/admin/web/richtext-links/riseopedia/route.ts",
		);

		expect(popup).toContain("readCachedRichTextPickerPayload");
		expect(popup).toContain("loadRichTextPickerPayload");
		expect(popup).toContain("const delayMs = search.trim() ? 250 : 0");
		expect(toolbar).toContain("prefetchRichTextLinkPickerContext");
		expect(toolbar).toContain("onPointerEnter={prefetchLinkPicker}");
		expect(cache).toContain("const META_TTL_MS");
		expect(cache).toContain("const ROWS_TTL_MS");
		expect(internalRoute).toContain("limit: 20");
		expect(riseopediaRoute).toContain("limit: 20");
	});

	it("loads filter metadata separately from result rows", () => {
		const adminMeta = read("app/api/admin/web/richtext-links/meta/route.ts");
		const memberMeta = read("app/api/me/richtext-links/meta/route.ts");
		const helper = read("lib/data/richtext-link-picker.ts");

		expect(adminMeta).toContain("getRichTextInternalLinkPickerMeta");
		expect(adminMeta).toContain("getRichTextRiseopediaLinkPickerMeta");
		expect(memberMeta).toContain("getCurrentActorDiscordId()");
		expect(helper).toContain("web_richtext_internal_link_picker_meta");
		expect(helper).toContain("web_richtext_internal_link_picker_rows");
	});

	it("uses the durable release-aware Riseopedia picker contract", () => {
		const helper = read("lib/data/richtext-link-picker.ts");

		expect(helper).toContain("web_view.riseopedia_entity_link_picker_rows");
		expect(helper).toContain("picker_row.search_document");
		expect(helper).toContain("picker_row.icon_media_file_id");
		expect(helper).toContain("LIMIT $6");
	});

	it("uses shared controls, dense icon rows, and excludes wiki gates from Internal Page", () => {
		const popup = read("components/editors/richtext/nodes/LinkPickerPopup.tsx");
		const data = read("lib/data/richtext-link-picker.ts");
		expect(popup).toContain("DropdownMenuSingle");
		expect(popup).toContain("RichTextLinkPickerResultRow");
		expect(popup).not.toContain("<select");
		expect(data).toContain('new Set(["riseopedia", "mafiosopedia"])');
		expect(data).toContain("web_view.riseopedia_entity_link_picker_rows");
	});

	it("shows an explicit linked-image badge in the editor", () => {
		const imageView = read("components/editors/richtext/nodes/ImageNodeView.tsx");
		expect(imageView).toContain("richtext-img-link-badge");
		expect(imageView).toContain('parts.push("is-linked")');
		expect(imageView).toContain("Image has an active link");
	});

	it("uses distinct filters, compact Riseopedia derivatives, and public image anchors", () => {
		const popup = read("components/editors/richtext/nodes/LinkPickerPopup.tsx");
		const resultRow = read(
			"components/editors/richtext/nodes/RichTextLinkPickerResultRow.tsx",
		);
		const renderer = read("components/renderers/richtext/RichTextRenderer.tsx");

		expect(popup).toContain("distinctRichTextLinkPickerOptions");
		expect(resultRow).toContain('size="picker"');
		expect(renderer).toContain('className="richtext-img__link"');
		expect(renderer).toContain("getStructuredLinkTargetFromNode");
	});

	it("reuses Riseopedia entity hover previews on normal public content", () => {
		const renderer = read("components/renderers/content/ContentRenderer.tsx");
		const provider = read(
			"components/riseopedia/context/RiseopediaEntityPreviewProvider.tsx",
		);

		expect(renderer).toContain("RiseopediaEntityPreviewProvider");
		expect(renderer).toContain('model.surfaceScope !== "public"');
		expect(renderer).toContain('wikiCode="riseopedia"');
		expect(provider).toContain("currentEntitySlug?: string | null");
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
