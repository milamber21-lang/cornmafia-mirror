//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/ImageNodeSerialization.test.ts                         ////
//// Language: TS                                                                                                 ////
//// Verifies rich-text image link and frame metadata survives Lexical JSON serialization.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { $getRoot, createEditor } from "lexical";
import { describe, expect, it } from "vitest";

import { $createImageNode, $isImageNode, ImageNode } from "./ImageNode";

function createTestEditor() {
	return createEditor({
		namespace: "rich-text-image-node-test",
		nodes: [ImageNode],
		onError(error: Error) {
			throw error;
		},
	});
}

describe("ImageNode serialization", () => {
	it("preserves optional frame and Riseopedia link targets through JSON", () => {
		const editor = createTestEditor();
		editor.update(
			() => {
				$getRoot().append(
					$createImageNode("/api/media/1000000001", {
						mediaId: "1000000001",
						alt: "Vehicle",
						width: 320,
						height: 320,
						frameStyle: "border",
						linkTarget: {
							kind: "riseopedia_entity",
							entityId: "1000000002",
							href: "/info/riseopedia/entity/vehicle",
						},
					}),
				);
			},
			{ discrete: true },
		);

		const serialized = editor.getEditorState().toJSON();
		expect(serialized.root.children[0]).toMatchObject({
			type: "resizable-image",
			version: 3,
			frameStyle: "border",
			linkTarget: {
				kind: "riseopedia_entity",
				entityId: "1000000002",
				href: "/info/riseopedia/entity/vehicle",
			},
		});

		const restoredEditor = createTestEditor();
		restoredEditor.setEditorState(
			restoredEditor.parseEditorState(JSON.stringify(serialized)),
		);
		restoredEditor.getEditorState().read(() => {
			const image = $getRoot().getFirstChild();
			expect($isImageNode(image)).toBe(true);
			if ($isImageNode(image)) {
				expect(image.getFrameStyle()).toBe("border");
				expect(image.getLinkTarget()).toEqual({
					kind: "riseopedia_entity",
					entityId: "1000000002",
					href: "/info/riseopedia/entity/vehicle",
				});
			}
		});
	});

	it("defaults older images to the borderless presentation", () => {
		const editor = createTestEditor();
		editor.setEditorState(
			editor.parseEditorState(
				JSON.stringify({
					root: {
						type: "root",
						version: 1,
						format: "",
						indent: 0,
						direction: null,
						children: [
							{
								type: "resizable-image",
								version: 2,
								src: "/api/media/1000000001",
							},
						],
					},
				}),
			),
		);

		editor.getEditorState().read(() => {
			const image = $getRoot().getFirstChild();
			expect($isImageNode(image)).toBe(true);
			if ($isImageNode(image)) {
				expect(image.getFrameStyle()).toBe("none");
			}
		});
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
