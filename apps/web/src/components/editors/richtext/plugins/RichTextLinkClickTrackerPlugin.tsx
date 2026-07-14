//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/plugins/RichTextLinkClickTrackerPlugin.tsx                    ////
//// Language: TSX                                                                                                ////
//// Lexical plugin that opens link editing from clicked editor anchors.                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { CLICK_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";

export function RichTextLinkClickTrackerPlugin({
	onOpen,
}: {
	onOpen: () => void;
}) {
	const [editor] = useLexicalComposerContext();

	React.useEffect(() => {
		return editor.registerCommand(
			CLICK_COMMAND,
			(e: MouseEvent) => {
				try {
					const target = e.target as Node | null;
					let el: Element | null = null;
					if ((target as Node | null)?.nodeType === 3 /* TEXT_NODE */) {
						el = (target as Node).parentElement;
					} else {
						el = target as Element | null;
					}
					const a = el?.closest?.("a");
					if (a) {
						e.preventDefault();
						onOpen();
						return true;
					}
				} catch {}
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, onOpen]);

	return null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
