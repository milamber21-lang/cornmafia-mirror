//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditorTypes.ts                                        ////
//// Language: TS                                                                                                 ////
//// Shared editor-side JSON types and small guards without React imports.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { RichTextLinkTarget } from "@/lib/editors/richtext/rich-text-link-targets";

export type UnknownRecord = Record<string, unknown>;
export type MaybeModule = UnknownRecord | null;

export type RichTextEditorCanvasLayoutMode =
	| "full"
	| "main-full"
	| "main-with-left"
	| "main-with-right"
	| "main-with-both"
	| "main-with-aside"
	| "left-aside"
	| "right-aside"
	| "aside";

export type RichTextEditorCanvasWidthCode = "full" | "half" | "third";

export type LexicalNodeJSON = {
	type: string;
	text?: string;
	tag?: string;
	listType?: "bullet" | "number" | "check";
	format?: number;
	version?: number;
	linkTarget?: RichTextLinkTarget;
	fields?: {
		url?: string;
		mediaId?: string;
		newTab?: boolean;
		linkTarget?: RichTextLinkTarget;
		alt?: string;
		src?: string;
		width?: number;
		height?: number;
		align?: "left" | "right" | "center";
		wrap?: "wrap" | "no-wrap";
	} | null;
	children?: LexicalNodeJSON[];
	[k: string]: unknown;
};

export type LexicalRootJSON = { root: LexicalNodeJSON & { version?: number } };

export const isObject = (v: unknown): v is UnknownRecord =>
	typeof v === "object" && v !== null;
export const isFunction = (
	fn: unknown,
): fn is (...args: unknown[]) => unknown => typeof fn === "function";

/** Leaf nodes must not carry children in Lexical JSON */
const isLeafNodeType = (t: unknown): boolean => {
	if (typeof t !== "string") return false;
	const tt = t.toLowerCase();
	return (
		tt === "text" ||
		tt === "linebreak" ||
		tt === "horizontalrule" ||
		tt === "resizable-image" ||
		tt === "image"
	);
};

const normalizeNode = (
	node: LexicalNodeJSON,
	isRoot = false,
): LexicalNodeJSON => {
	const out: LexicalNodeJSON = { ...(node || {}) };
	if (isRoot) {
		out.type = typeof out.type === "string" ? out.type : "root";
	}
	const t = typeof out.type === "string" ? out.type.toLowerCase() : "";
	if (isLeafNodeType(t)) {
		if ("children" in out) {
			delete (out as { children?: LexicalNodeJSON[] }).children;
		}
		return out;
	}
	const kids = Array.isArray(out.children) ? out.children : [];
	out.children = kids.map((c) => normalizeNode({ ...(c || {}) }, false));
	return out;
};

export const coerceRoot = (v: unknown): LexicalRootJSON => {
	let root: LexicalNodeJSON = { type: "root" };
	if (isObject(v) && isObject((v as { root?: unknown }).root)) {
		const maybe = (v as { root: unknown }).root as UnknownRecord;
		root = {
			...(maybe as LexicalNodeJSON),
			type: typeof maybe.type === "string" ? (maybe.type as string) : "root",
			...(typeof (maybe as { version?: unknown }).version === "number"
				? { version: (maybe as { version?: number }).version as number }
				: {}),
		};
	}
	if (!Array.isArray(root.children)) {
		root.children = [];
	}
	root = normalizeNode(root, true);
	if (typeof root.version !== "number") {
		root.version = 1;
	}
	return { root };
};

export const stringify = (value: unknown): string => {
	try {
		return JSON.stringify(value ?? {}, null, 2);
	} catch {
		return "{}";
	}
};

export const parseJSON = (value: string): unknown => {
	try {
		return JSON.parse(value) as unknown;
	} catch {
		return {};
	}
};

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
