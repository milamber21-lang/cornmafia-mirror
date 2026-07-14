//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/plugins/RichTextSemanticPasteCleanupPlugin.tsx                ////
//// Language: TSX                                                                                                ////
//// Lexical plugin that converts pasted HTML/text into supported rich-text nodes.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$insertNodes,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
	type LexicalNode,
} from "lexical";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";

type InlineFormatMap = {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
	code: boolean;
	subscript: boolean;
	superscript: boolean;
};

const EMPTY_FORMATS: InlineFormatMap = {
	bold: false,
	italic: false,
	underline: false,
	strikethrough: false,
	code: false,
	subscript: false,
	superscript: false,
};

function cloneFormats(formats: InlineFormatMap): InlineFormatMap {
	return { ...formats };
}

function applyElementFormat(
	formats: InlineFormatMap,
	element: Element,
): InlineFormatMap {
	const tagName = element.tagName.toLowerCase();
	const next = cloneFormats(formats);

	if (tagName === "strong" || tagName === "b") next.bold = true;
	if (tagName === "em" || tagName === "i") next.italic = true;
	if (tagName === "u") next.underline = true;
	if (tagName === "s" || tagName === "strike" || tagName === "del") {
		next.strikethrough = true;
	}
	if (tagName === "code" || tagName === "pre") next.code = true;
	if (tagName === "sub") next.subscript = true;
	if (tagName === "sup") next.superscript = true;

	return next;
}

function createFormattedTextNode(
	text: string,
	formats: InlineFormatMap,
): LexicalNode | null {
	if (text.length === 0) {
		return null;
	}

	const node = $createTextNode(text);
	if (formats.bold) node.toggleFormat("bold");
	if (formats.italic) node.toggleFormat("italic");
	if (formats.underline) node.toggleFormat("underline");
	if (formats.strikethrough) node.toggleFormat("strikethrough");
	if (formats.code) node.toggleFormat("code");
	if (formats.subscript) node.toggleFormat("subscript");
	if (formats.superscript) node.toggleFormat("superscript");
	return node;
}

function isBlockElement(element: Element): boolean {
	const tagName = element.tagName.toLowerCase();
	return [
		"address",
		"article",
		"aside",
		"blockquote",
		"div",
		"footer",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"header",
		"li",
		"main",
		"ol",
		"p",
		"pre",
		"section",
		"ul",
	].includes(tagName);
}

function createInlineNodesFromDom(
	node: ChildNode,
	formats: InlineFormatMap,
): LexicalNode[] {
	if (node.nodeType === Node.TEXT_NODE) {
		const textNode = createFormattedTextNode(node.textContent ?? "", formats);
		return textNode ? [textNode] : [];
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return [];
	}

	const element = node as Element;
	const tagName = element.tagName.toLowerCase();

	if (tagName === "br") {
		return [$createLineBreakNode()];
	}

	if (tagName === "img" || tagName === "script" || tagName === "style") {
		return [];
	}

	const nextFormats = applyElementFormat(formats, element);
	const inlineNodes: LexicalNode[] = [];

	for (const child of Array.from(element.childNodes)) {
		if (
			child.nodeType === Node.ELEMENT_NODE &&
			isBlockElement(child as Element)
		) {
			continue;
		}
		inlineNodes.push(...createInlineNodesFromDom(child, nextFormats));
	}

	return inlineNodes;
}

function appendChildrenToNode(
	target: { append: (...nodes: LexicalNode[]) => unknown },
	nodes: LexicalNode[],
): void {
	if (nodes.length > 0) {
		target.append(...nodes);
	}
}

function createParagraphNodeFromElement(element: Element): LexicalNode {
	const paragraph = $createParagraphNode();
	const inlineNodes: LexicalNode[] = [];

	for (const child of Array.from(element.childNodes)) {
		inlineNodes.push(...createInlineNodesFromDom(child, EMPTY_FORMATS));
	}

	appendChildrenToNode(paragraph, inlineNodes);
	return paragraph;
}

function createHeadingNodeFromElement(element: Element): LexicalNode {
	const tagName = element.tagName.toLowerCase();
	const tag = /^h[1-6]$/.test(tagName)
		? (tagName as "h1" | "h2" | "h3" | "h4" | "h5" | "h6")
		: "h2";
	const heading = $createHeadingNode(tag);
	const inlineNodes: LexicalNode[] = [];

	for (const child of Array.from(element.childNodes)) {
		inlineNodes.push(...createInlineNodesFromDom(child, EMPTY_FORMATS));
	}

	appendChildrenToNode(heading, inlineNodes);
	return heading;
}

function createQuoteNodeFromElement(element: Element): LexicalNode {
	const quote = $createQuoteNode();
	const inlineNodes: LexicalNode[] = [];

	for (const child of Array.from(element.childNodes)) {
		inlineNodes.push(...createInlineNodesFromDom(child, EMPTY_FORMATS));
	}

	appendChildrenToNode(quote, inlineNodes);
	return quote;
}

function createListNodeFromElement(element: Element): LexicalNode {
	const tagName = element.tagName.toLowerCase();
	const listType = tagName === "ol" ? "number" : "bullet";
	const list = $createListNode(listType);

	for (const child of Array.from(element.children)) {
		if (child.tagName.toLowerCase() !== "li") continue;

		const item = $createListItemNode();
		const inlineNodes: LexicalNode[] = [];
		for (const itemChild of Array.from(child.childNodes)) {
			if (itemChild.nodeType === Node.ELEMENT_NODE) {
				const itemElement = itemChild as Element;
				const itemTag = itemElement.tagName.toLowerCase();
				if (itemTag === "ul" || itemTag === "ol") {
					const nested = createListNodeFromElement(itemElement);
					item.append(nested);
					continue;
				}
			}
			inlineNodes.push(...createInlineNodesFromDom(itemChild, EMPTY_FORMATS));
		}
		appendChildrenToNode(item, inlineNodes);
		list.append(item);
	}

	return list;
}

function createCleanNodesFromElement(element: Element): LexicalNode[] {
	const tagName = element.tagName.toLowerCase();

	if (tagName === "script" || tagName === "style" || tagName === "img") {
		return [];
	}

	if (tagName === "hr") {
		return [];
	}

	if (/^h[1-6]$/.test(tagName)) {
		return [createHeadingNodeFromElement(element)];
	}

	if (tagName === "blockquote") {
		return [createQuoteNodeFromElement(element)];
	}

	if (tagName === "ul" || tagName === "ol") {
		return [createListNodeFromElement(element)];
	}

	if (
		tagName === "p" ||
		tagName === "div" ||
		tagName === "section" ||
		tagName === "article" ||
		tagName === "pre"
	) {
		const nestedBlocks = Array.from(element.children).filter((child) =>
			isBlockElement(child),
		);
		if (nestedBlocks.length > 0 && !["p", "pre"].includes(tagName)) {
			const nodes: LexicalNode[] = [];
			for (const child of nestedBlocks) {
				nodes.push(...createCleanNodesFromElement(child));
			}
			return nodes;
		}
		return [createParagraphNodeFromElement(element)];
	}

	return [createParagraphNodeFromElement(element)];
}

function createCleanNodesFromHtml(html: string): LexicalNode[] {
	const parser = new DOMParser();
	const documentNode = parser.parseFromString(html, "text/html");
	const nodes: LexicalNode[] = [];

	for (const child of Array.from(documentNode.body.childNodes)) {
		if (child.nodeType === Node.ELEMENT_NODE) {
			nodes.push(...createCleanNodesFromElement(child as Element));
		} else {
			const inlineNodes = createInlineNodesFromDom(child, EMPTY_FORMATS);
			if (inlineNodes.length > 0) {
				const paragraph = $createParagraphNode();
				appendChildrenToNode(paragraph, inlineNodes);
				nodes.push(paragraph);
			}
		}
	}

	return nodes;
}

function createCleanNodesFromText(text: string): LexicalNode[] {
	const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	const blocks = normalized.split(/\n{2,}/g);
	const nodes: LexicalNode[] = [];

	for (const block of blocks) {
		const paragraph = $createParagraphNode();
		const lines = block.split("\n");
		lines.forEach((line, index) => {
			const textNode = createFormattedTextNode(line, EMPTY_FORMATS);
			if (textNode) paragraph.append(textNode);
			if (index < lines.length - 1) paragraph.append($createLineBreakNode());
		});
		nodes.push(paragraph);
	}

	return nodes;
}

export function RichTextSemanticPasteCleanupPlugin(): null {
	const [editor] = useLexicalComposerContext();

	React.useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(event) => {
				if (!(event instanceof ClipboardEvent)) {
					return false;
				}

				const clipboard = event.clipboardData;
				if (!clipboard) {
					return false;
				}

				const html = clipboard.getData("text/html").trim();
				const text = clipboard.getData("text/plain");
				if (html.length === 0 && text.length === 0) {
					return false;
				}

				const nodes =
					html.length > 0
						? createCleanNodesFromHtml(html)
						: createCleanNodesFromText(text);

				if (nodes.length === 0) {
					return false;
				}

				event.preventDefault();
				$insertNodes(nodes);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor]);

	return null;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
