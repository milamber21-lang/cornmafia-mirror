//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/ImageNode.tsx                                           ////
//// Language: TSX                                                                                                ////
//// Lexical decorator node definition for rich-text images with media-reference metadata.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import type {
	DOMExportOutput,
	EditorConfig,
	LexicalNode,
	NodeKey,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import { ImageNodeView } from "./ImageNodeView";
import {
	normalizeRichTextLinkTarget,
	type RichTextLinkTarget,
} from "@/lib/editors/richtext/rich-text-link-targets";
import type {
	ImageAlign,
	ImageFrameStyle,
	ImageNodeOptions,
	ImageWrap,
	SerializedImageNode,
} from "./image-node-types";

export type {
	ImageAlign,
	ImageFrameStyle,
	ImageNodeOptions,
	ImageWrap,
	SerializedImageNode,
} from "./image-node-types";

export class ImageNode extends DecoratorNode<React.ReactElement> {
	__src: string;
	__mediaId?: string;
	__alt?: string;
	__width?: number;
	__height?: number;
	__align?: ImageAlign;
	__wrap?: ImageWrap;
	__frameStyle: ImageFrameStyle;
	__linkTarget?: RichTextLinkTarget;

	static getType(): string {
		return "resizable-image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			{
				mediaId: node.__mediaId,
				alt: node.__alt,
				width: node.__width,
				height: node.__height,
				align: node.__align,
				wrap: node.__wrap,
				frameStyle: node.__frameStyle,
				linkTarget: node.__linkTarget,
			},
			node.__key,
		);
	}

	constructor(src: string, opts?: ImageNodeOptions, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__mediaId = opts?.mediaId;
		this.__alt = opts?.alt;
		this.__width = opts?.width;
		this.__height = opts?.height;
		this.__align = opts?.align ?? "left";
		this.__wrap = opts?.wrap ?? (this.__align === "center" ? "no-wrap" : "wrap");
		this.__frameStyle = opts?.frameStyle === "border" ? "border" : "none";
		this.__linkTarget =
			normalizeRichTextLinkTarget(opts?.linkTarget) ?? undefined;
	}

	static importJSON(serialized: SerializedImageNode): ImageNode {
		const {
			src,
			mediaId,
			alt,
			width,
			height,
			align,
			wrap,
			frameStyle,
			linkTarget,
		} = serialized;
		return $createImageNode(src, {
			mediaId,
			alt,
			width,
			height,
			align,
			wrap,
			frameStyle,
			linkTarget,
		});
	}

	exportJSON(): SerializedImageNode {
		return {
			type: "resizable-image",
			version: 3,
			src: this.__src,
			mediaId: this.__mediaId,
			alt: this.__alt,
			width: this.__width,
			height: this.__height,
			align: this.__align,
			wrap: this.__wrap,
			frameStyle: this.__frameStyle,
			linkTarget: this.__linkTarget,
		};
	}

	getTextContent(): string {
		return "";
	}

	isInline(): boolean {
		return false;
	}

	canInsertTextBefore(): boolean {
		return true;
	}
	canInsertTextAfter(): boolean {
		return true;
	}

	exportDOM(): DOMExportOutput {
		const img = document.createElement("img");
		img.src = this.__src;
		if (this.__mediaId) img.setAttribute("data-media-id", this.__mediaId);
		if (this.__alt) img.alt = this.__alt;
		if (typeof this.__width === "number")
			img.width = Math.max(1, Math.floor(this.__width));
		if (typeof this.__height === "number")
			img.height = Math.max(1, Math.floor(this.__height));
		img.setAttribute("data-align", this.__align ?? "left");
		img.setAttribute("data-wrap", this.__wrap ?? "wrap");
		img.setAttribute("data-frame-style", this.__frameStyle);
		img.setAttribute("data-lexical-type", "resizable-image");
		if (this.__linkTarget) {
			img.setAttribute("data-richtext-link-kind", this.__linkTarget.kind);
		}
		return { element: img };
	}

	createDOM(_config: EditorConfig): HTMLElement {
		void _config;
		const div = document.createElement("div");
		div.setAttribute("data-lexical-decorator", "resizable-image");
		div.setAttribute("data-node-type", "resizable-image");
		div.setAttribute("data-node-key", String(this.getKey()));
		if (this.__mediaId) div.setAttribute("data-media-id", this.__mediaId);
		div.setAttribute("data-align", this.__align ?? "left");
		div.setAttribute("data-wrap", this.__wrap ?? "wrap");
		div.setAttribute("data-frame-style", this.__frameStyle);
		if (this.__linkTarget) {
			div.setAttribute("data-richtext-link-kind", this.__linkTarget.kind);
		}
		div.contentEditable = "false";
		return div;
	}

	updateDOM(prev: ImageNode, dom: HTMLElement): boolean {
		if (prev.__align !== this.__align)
			dom.setAttribute("data-align", this.__align ?? "left");
		if (prev.__wrap !== this.__wrap)
			dom.setAttribute("data-wrap", this.__wrap ?? "wrap");
		if (prev.__frameStyle !== this.__frameStyle) {
			dom.setAttribute("data-frame-style", this.__frameStyle);
		}
		if (prev.__linkTarget?.kind !== this.__linkTarget?.kind) {
			if (this.__linkTarget) {
				dom.setAttribute("data-richtext-link-kind", this.__linkTarget.kind);
			} else {
				dom.removeAttribute("data-richtext-link-kind");
			}
		}
		return false;
	}

	decorate(): React.ReactElement {
		return (
			<ImageNodeView
				src={this.__src}
				mediaId={this.__mediaId}
				alt={this.__alt}
				width={this.__width}
				height={this.__height}
				align={this.__align}
				wrap={this.__wrap}
				frameStyle={this.__frameStyle}
				linkTarget={this.__linkTarget}
				nodeKey={this.getKey()}
			/>
		);
	}

	setWidth(w: number): void {
		(this.getWritable() as ImageNode).__width = w;
	}
	setSize(width: number, height?: number): void {
		const self = this.getWritable() as ImageNode;
		self.__width = width;

		if (typeof height === "number") {
			self.__height = height;
		} else {
			delete self.__height;
		}
	}
	setAlign(a: ImageAlign): void {
		const self = this.getWritable() as ImageNode;
		self.__align = a;
		self.__wrap = a === "center" ? "no-wrap" : (self.__wrap ?? "wrap");
	}
	setWrap(w: ImageWrap): void {
		(this.getWritable() as ImageNode).__wrap = w;
	}
	getFrameStyle(): ImageFrameStyle {
		return this.getLatest().__frameStyle;
	}
	setFrameStyle(frameStyle: ImageFrameStyle): void {
		(this.getWritable() as ImageNode).__frameStyle =
			frameStyle === "border" ? "border" : "none";
	}
	setAlt(alt: string | undefined): void {
		(this.getWritable() as ImageNode).__alt = alt;
	}
	getLinkTarget(): RichTextLinkTarget | null {
		return this.getLatest().__linkTarget ?? null;
	}
	setLinkTarget(linkTarget: RichTextLinkTarget | null | undefined): void {
		(this.getWritable() as ImageNode).__linkTarget =
			normalizeRichTextLinkTarget(linkTarget) ?? undefined;
	}
}

export function $createImageNode(
	src: string,
	opts?: ImageNodeOptions,
): ImageNode {
	return $applyNodeReplacement(new ImageNode(src, opts));
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
