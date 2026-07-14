//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/RichTextLinkNode.ts                                    ////
//// Language: TS                                                                                                 ////
//// Extends Lexical links with durable typed RichText target metadata.                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	$isLinkNode,
	LinkNode,
	type LinkAttributes,
	type SerializedLinkNode,
} from "@lexical/link";
import {
	$applyNodeReplacement,
	$getSelection,
	$isRangeSelection,
	type EditorConfig,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type Spread,
} from "lexical";

import {
	normalizeRichTextLinkTarget,
	richTextLinkTargetOpensNewTab,
	richTextLinkTargetsEqual,
	type RichTextLinkTarget,
} from "@/lib/editors/richtext/rich-text-link-targets";

export type SerializedRichTextLinkNode = Spread<
	{
		type: "richtext-link";
		version: 1;
		linkTarget?: RichTextLinkTarget;
	},
	SerializedLinkNode
>;

export class RichTextLinkNode extends LinkNode {
	__linkTarget?: RichTextLinkTarget;

	static getType(): string {
		return "richtext-link";
	}

	static clone(node: RichTextLinkNode): RichTextLinkNode {
		return new RichTextLinkNode(
			node.__url,
			{
				target: node.__target,
				rel: node.__rel,
				title: node.__title,
			},
			node.__linkTarget,
			node.__key,
		);
	}

	constructor(
		url = "",
		attributes: LinkAttributes = {},
		linkTarget?: RichTextLinkTarget | null,
		key?: NodeKey,
	) {
		super(url, attributes, key);
		this.__linkTarget =
			normalizeRichTextLinkTarget(linkTarget, {
				href: url,
				newTab: attributes.target === "_blank",
			}) ?? undefined;
	}

	afterCloneFrom(prevNode: this): void {
		super.afterCloneFrom(prevNode);
		this.__linkTarget = prevNode.__linkTarget;
	}

	static importJSON(
		serializedNode: SerializedRichTextLinkNode,
	): RichTextLinkNode {
		return new RichTextLinkNode().updateFromJSON(serializedNode);
	}

	updateFromJSON(
		serializedNode: LexicalUpdateJSON<SerializedRichTextLinkNode>,
	): this {
		super.updateFromJSON(serializedNode);
		return this.setLinkTarget(
			normalizeRichTextLinkTarget(serializedNode.linkTarget, {
				href: serializedNode.url,
				newTab: serializedNode.target === "_blank",
			}),
		);
	}

	exportJSON(): SerializedRichTextLinkNode {
		const serializedNode = super.exportJSON() as SerializedLinkNode;
		const linkTarget = this.getLinkTarget();

		return {
			...serializedNode,
			type: "richtext-link",
			version: 1,
			...(linkTarget ? { linkTarget } : {}),
		};
	}

	createDOM(config: EditorConfig): HTMLAnchorElement | HTMLSpanElement {
		const element = super.createDOM(config);
		this.updateTargetDOM(element);
		return element;
	}

	updateDOM(
		prevNode: this,
		element: HTMLAnchorElement | HTMLSpanElement,
		config: EditorConfig,
	): boolean {
		const shouldReplace = super.updateDOM(prevNode, element, config);
		this.updateTargetDOM(element);
		return shouldReplace;
	}

	private updateTargetDOM(element: HTMLAnchorElement | HTMLSpanElement): void {
		const linkTarget = this.getLinkTarget();
		if (linkTarget) {
			element.setAttribute("data-richtext-link-kind", linkTarget.kind);
			return;
		}

		element.removeAttribute("data-richtext-link-kind");
	}

	getLinkTarget(): RichTextLinkTarget | null {
		return this.getLatest().__linkTarget ?? null;
	}

	setLinkTarget(linkTarget: RichTextLinkTarget | null | undefined): this {
		const writable = this.getWritable();
		writable.__linkTarget =
			normalizeRichTextLinkTarget(linkTarget, {
				href: writable.__url,
				newTab: writable.__target === "_blank",
			}) ?? undefined;
		return writable;
	}

	shouldMergeAdjacentLink(otherLink: LinkNode): boolean {
		if (!super.shouldMergeAdjacentLink(otherLink)) {
			return false;
		}

		return richTextLinkTargetsEqual(
			this.getLinkTarget(),
			$isRichTextLinkNode(otherLink) ? otherLink.getLinkTarget() : null,
		);
	}
}

export function $createRichTextLinkNode(
	url = "",
	attributes: LinkAttributes = {},
	linkTarget?: RichTextLinkTarget | null,
): RichTextLinkNode {
	return $applyNodeReplacement(
		new RichTextLinkNode(url, attributes, linkTarget),
	);
}

export function $isRichTextLinkNode(
	node: LexicalNode | null | undefined,
): node is RichTextLinkNode {
	return node instanceof RichTextLinkNode;
}

export function convertLinkNodeToRichTextLinkNode(
	node: LinkNode,
	linkTarget?: RichTextLinkTarget | null,
): RichTextLinkNode {
	return new RichTextLinkNode(
		node.getURL(),
		{
			target: node.getTarget(),
			rel: node.getRel(),
			title: node.getTitle(),
		},
		linkTarget ??
			normalizeRichTextLinkTarget(null, {
				href: node.getURL(),
				newTab: node.getTarget() === "_blank",
			}),
	);
}

export function $setRichTextLinkTargetOnSelection(
	linkTarget: RichTextLinkTarget | null,
): boolean {
	const selection = $getSelection();
	if (!$isRangeSelection(selection)) {
		return false;
	}

	const visitedKeys = new Set<string>();
	let updated = false;

	for (const node of selection.getNodes()) {
		const parent = node.getParent();
		const candidate = $isLinkNode(node)
			? node
			: $isLinkNode(parent)
				? parent
				: null;

		if (!candidate || visitedKeys.has(candidate.getKey())) {
			continue;
		}

		visitedKeys.add(candidate.getKey());
		let richTextLink: RichTextLinkNode;
		if ($isRichTextLinkNode(candidate)) {
			richTextLink = candidate;
		} else {
			richTextLink = $createRichTextLinkNode(
				candidate.getURL(),
				{
					target: candidate.getTarget(),
					rel: candidate.getRel(),
					title: candidate.getTitle(),
				},
				linkTarget,
			);
			candidate.replace(richTextLink, true);
		}

		richTextLink.setLinkTarget(linkTarget);
		if (linkTarget && richTextLinkTargetOpensNewTab(linkTarget)) {
			richTextLink.setTarget("_blank");
		} else if (
			linkTarget?.kind === "internal_content" ||
			linkTarget?.kind === "riseopedia_entity"
		) {
			richTextLink.setTarget(null);
		}
		updated = true;
	}

	return updated;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
