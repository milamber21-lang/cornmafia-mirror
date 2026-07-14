//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/HorizontalRuleNode.ts                                   ////
//// Language: TS                                                                                                 ////
//// Lexical horizontal rule node used by the RichText editor.                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import * as React from "react";
import type { ReactElement } from "react";
import {
	DecoratorNode,
	type EditorConfig,
	type LexicalEditor,
	type NodeKey,
	type SerializedLexicalNode,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	CLICK_COMMAND,
	$getNodeByKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";

export type SerializedHorizontalRuleNode = {
	type: "horizontalrule";
	version: 1;
	tag?: string | null;
} & SerializedLexicalNode;

export class HorizontalRuleNode extends DecoratorNode<ReactElement> {
	__tag: string | null;

	static getType(): string {
		return "horizontalrule";
	}

	static clone(node: HorizontalRuleNode): HorizontalRuleNode {
		return new HorizontalRuleNode(node.__tag, node.__key);
	}

	constructor(tag?: string | null, key?: NodeKey) {
		super(key);
		this.__tag = tag ?? null;
	}

	exportJSON(): SerializedHorizontalRuleNode {
		return {
			type: "horizontalrule",
			version: 1,
			tag: this.__tag,
		};
	}

	static importJSON(
		serialized: SerializedHorizontalRuleNode,
	): HorizontalRuleNode {
		return $createHorizontalRuleNode(serialized.tag ?? null);
	}

	getTag(): string | null {
		return this.__tag;
	}

	setTag(next: string | null): void {
		const writable = this.getWritable();
		(writable as HorizontalRuleNode).__tag = next;
	}

	isInline(): boolean {
		return false;
	}
	canInsertTextBefore(): boolean {
		return false;
	}
	canInsertTextAfter(): boolean {
		return false;
	}
	isIsolated(): boolean {
		return true;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const el = document.createElement("div");
		el.contentEditable = "false";
		el.style.display = "block";
		el.className = "rt-hr-block";
		el.setAttribute("data-node-type", "horizontalrule");
		el.setAttribute("data-node-key", String(this.getKey()));
		if (this.__tag) el.setAttribute("data-tag", this.__tag);
		el.tabIndex = 0;
		return el;
	}

	updateDOM(prev: HorizontalRuleNode, dom: HTMLElement): boolean {
		if (prev.__tag !== this.__tag) {
			if (this.__tag == null) dom.removeAttribute("data-tag");
			else dom.setAttribute("data-tag", this.__tag);
		}
		return false;
	}

	decorate(): ReactElement {
		const tag = this.__tag;
		const key = this.getKey();
		return React.createElement(HRDecoration, { nodeKey: key, tag });
	}
}

export function $createHorizontalRuleNode(
	tag?: string | null,
): HorizontalRuleNode {
	return new HorizontalRuleNode(tag ?? null);
}

export function $isHorizontalRuleNode(
	node: unknown,
): node is HorizontalRuleNode {
	return node instanceof HorizontalRuleNode;
}

type HRDecorationProps = { nodeKey: NodeKey; tag: string | null };

function HRDecoration(props: HRDecorationProps): ReactElement {
	const { nodeKey, tag } = props;
	const [editor] = useLexicalComposerContext() as unknown as [LexicalEditor];
	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);
	const ref = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		return mergeRegister(
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				(event) => {
					const wrapper = ref.current;
					const parent = wrapper?.parentElement ?? null;
					const target = event?.target as Node | null;
					if (!target) return false;

					const insideWrapper = Boolean(wrapper && wrapper.contains(target));
					const insideParent = Boolean(parent && parent.contains(target));
					if (!insideWrapper && !insideParent) return false;

					if (!event.shiftKey) clearSelection();
					setSelected(true);
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_DELETE_COMMAND,
				(event) => {
					if (!isSelected) return false;
					const n = $getNodeByKey(nodeKey);
					if (n) {
						event.preventDefault();
						n.remove();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_BACKSPACE_COMMAND,
				(event) => {
					if (!isSelected) return false;
					const n = $getNodeByKey(nodeKey);
					if (n) {
						event.preventDefault();
						n.remove();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [editor, isSelected, nodeKey, clearSelection, setSelected]);

	React.useEffect(() => {
		const p = ref.current?.parentElement ?? null;
		if (!p) return;
		if (isSelected) p.classList.add("is-selected");
		else p.classList.remove("is-selected");
	}, [isSelected]);

	const className = `rt-hr-wrap${isSelected ? " is-selected" : ""}`;

	return React.createElement(
		"div",
		{
			ref,
			role: "separator",
			tabIndex: 0,
			className,
			draggable: false,
			"data-node-type": "horizontalrule",
			"data-node-key": String(nodeKey),
			"data-tag": tag ?? undefined,
			onClick: (ev: React.MouseEvent<HTMLDivElement>) => {
				ev.preventDefault();
				ev.stopPropagation();
				clearSelection();
				setSelected(true);
			},
		} as Record<string, unknown>,
		React.createElement("hr", { className: "rt-hr" } as Record<string, unknown>),
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
