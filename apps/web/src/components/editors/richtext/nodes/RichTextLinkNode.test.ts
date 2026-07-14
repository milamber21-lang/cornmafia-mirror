//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/RichTextLinkNode.test.ts                               ////
//// Language: TS                                                                                                 ////
//// Verifies typed RichText link-node JSON round trips beside native Lexical links.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { $createLinkNode, LinkNode } from "@lexical/link";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	createEditor,
} from "lexical";
import { describe, expect, it } from "vitest";

import {
	$createRichTextLinkNode,
	$isRichTextLinkNode,
	$setRichTextLinkTargetOnSelection,
	RichTextLinkNode,
} from "./RichTextLinkNode";

function createTestEditor() {
	return createEditor({
		namespace: "rich-text-link-node-test",
		nodes: [LinkNode, RichTextLinkNode],
		onError(error: Error) {
			throw error;
		},
	});
}

describe("RichTextLinkNode", () => {
	it("preserves structured targets through Lexical JSON", () => {
		const editor = createTestEditor();

		editor.update(
			() => {
				const paragraph = $createParagraphNode();
				const link = $createRichTextLinkNode(
					"/learn/guides/example",
					{},
					{
						kind: "internal_content",
						contentId: "1000000001",
						href: "/learn/guides/example",
					},
				);
				link.append($createTextNode("Example"));
				paragraph.append(link);
				$getRoot().append(paragraph);
			},
			{ discrete: true },
		);

		const serialized = editor.getEditorState().toJSON();
		const paragraph = serialized.root.children[0] as {
			children?: Array<Record<string, unknown>>;
		};
		expect(paragraph.children?.[0]?.type).toBe("richtext-link");
		expect(paragraph.children?.[0]?.linkTarget).toEqual({
			kind: "internal_content",
			contentId: "1000000001",
			href: "/learn/guides/example",
		});

		const restoredEditor = createTestEditor();
		restoredEditor.setEditorState(
			restoredEditor.parseEditorState(JSON.stringify(serialized)),
		);
		restoredEditor.getEditorState().read(() => {
			const paragraphNode = $getRoot().getFirstChild();
			const restoredLink = $isElementNode(paragraphNode)
				? paragraphNode.getFirstChild()
				: null;
			expect($isRichTextLinkNode(restoredLink)).toBe(true);
			if ($isRichTextLinkNode(restoredLink)) {
				expect(restoredLink.getLinkTarget()).toEqual({
					kind: "internal_content",
					contentId: "1000000001",
					href: "/learn/guides/example",
				});
			}
		});
	});
	it("upgrades a selected native Lexical link when target metadata is applied", () => {
		const editor = createTestEditor();
		editor.update(
			() => {
				const paragraph = $createParagraphNode();
				const link = $createLinkNode("https://example.test/guide");
				const text = $createTextNode("Guide");
				link.append(text);
				paragraph.append(link);
				$getRoot().append(paragraph);
				text.select(0, text.getTextContentSize());

				expect(
					$setRichTextLinkTargetOnSelection({
						kind: "external",
						href: "https://example.test/guide",
						newTab: true,
					}),
				).toBe(true);
			},
			{ discrete: true },
		);

		editor.getEditorState().read(() => {
			const paragraph = $getRoot().getFirstChild();
			const link = $isElementNode(paragraph) ? paragraph.getFirstChild() : null;
			expect($isRichTextLinkNode(link)).toBe(true);
			if ($isRichTextLinkNode(link)) {
				expect(link.getTarget()).toBe("_blank");
				expect(link.getLinkTarget()).toEqual({
					kind: "external",
					href: "https://example.test/guide",
					newTab: true,
				});
			}
		});
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
