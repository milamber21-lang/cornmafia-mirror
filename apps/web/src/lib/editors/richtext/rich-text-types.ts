//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/editors/richtext/rich-text-types.ts                                                   ////
//// Language: TS                                                                                                 ////
//// Shared RichText Lexical JSON types and root normalization helpers.                                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { RichTextLinkTarget } from "./rich-text-link-targets";

export type RichTextLexicalNode = {
	type: string;
	text?: string;
	tag?: string;
	listType?: "bullet" | "number" | "check";
	format?: string | number;
	version?: number;
	linkTarget?: RichTextLinkTarget;
	mediaId?: string | number;
	media_id?: string | number;
	mediaID?: string | number;
	src?: string;
	url?: string;
	target?: string;
	rel?: string;
	alt?: string;
	caption?: string;
	width?: number | string;
	height?: number | string;
	align?: "left" | "right" | "center" | "justify" | "start" | "end" | "";
	wrap?: "wrap" | "no-wrap";
	fields?: {
		url?: string;
		href?: string;
		linkType?: string;
		newTab?: boolean;
		linkTarget?: RichTextLinkTarget;
		mediaId?: string | number;
		media_id?: string | number;
		mediaID?: string | number;
		alt?: string;
		caption?: string;
		src?: string;
		width?: number | string;
		height?: number | string;
		align?: "left" | "right" | "center";
		wrap?: "wrap" | "no-wrap";
	} | null;
	children?: RichTextLexicalNode[];
};

export type RichTextLexicalRoot = { root: RichTextLexicalNode };
export type MaybeRichTextLexicalRoot =
	| RichTextLexicalRoot
	| { root?: unknown }
	| null
	| undefined;

export type LexicalNode = RichTextLexicalNode;
export type LexicalRoot = RichTextLexicalRoot;
export type MaybeLexical = MaybeRichTextLexicalRoot;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function hasKey<T extends object, K extends PropertyKey>(
	obj: T,
	key: K,
): obj is T & Record<K, unknown> {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

export function normalizeRichTextLexicalRoot(
	input: unknown,
): RichTextLexicalRoot | null {
	if (!input || !isObject(input)) {
		return null;
	}

	if (!hasKey(input, "root")) {
		return null;
	}

	const rootUnknown = input.root;

	if (!isObject(rootUnknown)) {
		return null;
	}

	return { root: rootUnknown as RichTextLexicalNode };
}

export function normalizeLexical(input: unknown): LexicalRoot | null {
	return normalizeRichTextLexicalRoot(input);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
