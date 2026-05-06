//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/plugins/RichTextSelectionTrackerPlugin.tsx                    ////
//// Language: TSX                                                                                                ////
//// Lexical plugin that reports current toolbar selection state.                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";

import type { SelectionSummary } from "../RichTextEditorToolbar";

function hasMethod<T extends string>(obj: unknown, name: T): boolean {
	return !!obj && typeof (obj as Record<T, unknown>)[name] === "function";
}

function call0<R>(obj: unknown, name: string): R | null {
	try {
		const f = (obj as Record<string, unknown>)[name];
		if (typeof f === "function") {
			return (f as (this: unknown) => R).call(obj);
		}
	} catch {}
	return null;
}

function getTypeName(node: unknown): string | null {
	return call0<string>(node, "getType");
}

function getParent(node: unknown): unknown | null {
	return call0<unknown>(node, "getParent");
}

function getHeadingTag(node: unknown): string | null {
	return call0<string>(node, "getTag");
}

function getListKind(node: unknown): "bullet" | "number" | "check" | null {
	const t = call0<unknown>(node, "getListType");
	return t === "bullet" || t === "number" || t === "check"
		? (t as "bullet" | "number" | "check")
		: null;
}

function getTopLevelElement(node: unknown): unknown | null {
	if (hasMethod(node, "getTopLevelElementOrThrow")) {
		try {
			const out = call0<unknown>(node, "getTopLevelElementOrThrow");
			if (out) return out;
		} catch {}
	}
	let cur: unknown | null = node ?? null;
	let hops = 0;
	while (cur && hops < 24) {
		const p = getParent(cur);
		if (!p) break;
		const pt = getTypeName(p);
		if (pt === "root") break;
		cur = p;
		hops++;
	}
	return cur;
}

function selHasFormat(sel: unknown, name: string): boolean {
	try {
		const fn = (sel as { hasFormat?: (n: string) => boolean }).hasFormat;
		if (typeof fn === "function") {
			return !!(fn as (this: unknown, n: string) => boolean).call(sel, name);
		}
	} catch {}
	return false;
}

function nearestTextFormats(node: unknown) {
	const out = {
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
		code: false,
		subscript: false,
		superscript: false,
	};
	if (getTypeName(node) !== "text") return out;
	try {
		const has = (node as { hasFormat?: (t: string) => boolean }).hasFormat;
		if (typeof has === "function") {
			const bound = has as (this: unknown, t: string) => boolean;
			out.bold = !!bound.call(node, "bold");
			out.italic = !!bound.call(node, "italic");
			out.underline = !!bound.call(node, "underline");
			out.strikethrough = !!bound.call(node, "strikethrough");
			out.code = !!bound.call(node, "code");
			out.subscript = !!bound.call(node, "subscript");
			out.superscript = !!bound.call(node, "superscript");
		}
	} catch {}
	return out;
}

function chooseSeedNode(sel: unknown): unknown | null {
	const anchor = (sel as { anchor?: { getNode?: () => unknown } }).anchor;
	if (anchor && typeof anchor.getNode === "function") {
		const n = anchor.getNode();
		if (n) return n as unknown;
	}
	const focus = (sel as { focus?: { getNode?: () => unknown } }).focus;
	if (focus && typeof focus.getNode === "function") {
		const n = focus.getNode();
		if (n) return n as unknown;
	}
	const getNodes = (sel as { getNodes?: () => unknown[] }).getNodes;
	if (typeof getNodes === "function") {
		try {
			const arr = ((getNodes as (this: unknown) => unknown[]).call(sel) ??
				[]) as unknown[];
			if (arr.length > 0) return arr[0] ?? null;
		} catch {}
	}
	return null;
}

function selectionContainsType(
	sel: unknown,
	predicate: (t: string | null) => boolean,
): boolean {
	const getNodes = (sel as { getNodes?: () => unknown[] }).getNodes;
	if (typeof getNodes !== "function") return false;
	try {
		const nodes = ((getNodes as (this: unknown) => unknown[]).call(sel) ??
			[]) as unknown[];
		for (const n of nodes) {
			const t = getTypeName(n);
			if (predicate(t)) return true;
		}
	} catch {}
	return false;
}

export function RichTextSelectionTrackerPlugin({
	onSelection,
}: {
	onSelection: (s: SelectionSummary) => void;
}) {
	const [editor] = useLexicalComposerContext();

	const collect = React.useCallback(() => {
		try {
			const snap: SelectionSummary = {
				formats: {
					bold: false,
					italic: false,
					underline: false,
					strikethrough: false,
					code: false,
					subscript: false,
					superscript: false,
				},
				block: null,
				list: null,
				hasLink: false,
				at: { hr: false, image: false },
			};

			editor.getEditorState().read(() => {
				const sel = $getSelection();
				if (!sel) {
					snap.block = "paragraph";
					return;
				}

				snap.formats.bold = selHasFormat(sel, "bold");
				snap.formats.italic = selHasFormat(sel, "italic");
				snap.formats.underline = selHasFormat(sel, "underline");
				snap.formats.strikethrough = selHasFormat(sel, "strikethrough");
				snap.formats.code = selHasFormat(sel, "code");
				snap.formats.subscript = selHasFormat(sel, "subscript");
				snap.formats.superscript = selHasFormat(sel, "superscript");

				const seed = chooseSeedNode(sel);
				const tf = nearestTextFormats(seed);
				snap.formats = { ...snap.formats, ...tf };

				const top = getTopLevelElement(seed);
				const topType = getTypeName(top);
				if (topType === "heading") {
					const tag = getHeadingTag(top);
					snap.block =
						tag && /^h[1-6]$/.test(tag)
							? (tag as SelectionSummary["block"])
							: "paragraph";
				} else if (topType === "quote") {
					snap.block = "quote";
				} else {
					snap.block = "paragraph";
				}

				let cur: unknown | null = seed;
				let hops = 0;
				while (cur && hops < 24) {
					const ct = getTypeName(cur);
					if (ct === "link") snap.hasLink = true;
					if (ct === "list" && snap.list === null) {
						const k = getListKind(cur);
						if (k) snap.list = k;
					}
					if (ct === "horizontalrule") snap.at.hr = true;
					if (ct === "resizable-image" || ct === "image") snap.at.image = true;
					cur = getParent(cur);
					hops++;
				}

				if (!snap.at.hr)
					snap.at.hr = selectionContainsType(sel, (t) => t === "horizontalrule");
				if (!snap.at.image)
					snap.at.image = selectionContainsType(
						sel,
						(t) => t === "resizable-image" || t === "image",
					);

				if (!snap.block) snap.block = "paragraph";
			});

			onSelection(snap);
		} catch {}
	}, [editor, onSelection]);

	React.useEffect(() => {
		const unregisterUpdate = editor.registerUpdateListener(() => collect());
		const unregisterSel = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				collect();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		collect();
		return () => {
			try {
				unregisterUpdate();
			} catch {}
			try {
				unregisterSel();
			} catch {}
		};
	}, [editor, collect]);

	return null;
}
