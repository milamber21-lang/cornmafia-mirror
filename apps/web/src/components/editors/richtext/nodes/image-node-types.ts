//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/image-node-types.ts                                    ////
//// Language: TS                                                                                                 ////
//// Shared types for the rich-text image Lexical node and editor image view.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { NodeKey, SerializedLexicalNode, Spread } from "lexical";
import type { RichTextLinkTarget } from "@/lib/editors/richtext/rich-text-link-targets";

export type ImageAlign = "left" | "center" | "right";
export type ImageWrap = "wrap" | "no-wrap";
export type ImageFrameStyle = "none" | "border";

export type ImageNodeOptions = {
	mediaId?: string;
	alt?: string;
	width?: number;
	height?: number;
	align?: ImageAlign;
	wrap?: ImageWrap;
	frameStyle?: ImageFrameStyle;
	linkTarget?: RichTextLinkTarget;
};

export type SerializedImageNode = Spread<
	{
		type: "resizable-image";
		version: 3;
		src: string;
		mediaId?: string;
		alt?: string;
		width?: number;
		height?: number;
		align?: ImageAlign;
		wrap?: ImageWrap;
		frameStyle?: ImageFrameStyle;
		linkTarget?: RichTextLinkTarget;
	},
	SerializedLexicalNode
>;

export type ImageNodeViewProps = ImageNodeOptions & {
	src: string;
	nodeKey: NodeKey;
};

export type ImageSize = {
	width?: number;
	height?: number;
};

export type ResizeEdge = "left" | "right";

export type ResizeSession = {
	pointerId: number;
	startClientX: number;
	startWidth: number;
	aspectRatio?: number;
	maxWidth: number;
	edge: ResizeEdge;
};

export type ImageMoveMode = "left-wrap" | "center-block" | "right-wrap";

export type ImageMoveDropPreview = {
	mode: ImageMoveMode;
	dropIndex: number;
	rootLeft: number;
	rootWidth: number;
	lineTop: number;
};

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
