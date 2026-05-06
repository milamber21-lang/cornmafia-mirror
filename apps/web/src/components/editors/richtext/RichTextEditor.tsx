//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditor.tsx                                            ////
//// Language: TSX                                                                                                ////
//// RichText editor wrapper with media insertion and toolbar command wiring.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ImagePickerPopup from "./nodes/ImagePickerPopup";
import type { LinkTogglePayload } from "./nodes/LinkPickerPopup";
import RichTextEditorToolbar, {
	type ToolbarFeatures,
	type ToolbarItem,
	DEFAULT_TOOLBAR_LAYOUT,
	mergeToolbarLayout,
} from "./RichTextEditorToolbar";
import RichTextEditorShell from "./RichTextEditorShell";
import {
	coerceRoot,
	isFunction,
	isObject,
	type LexicalRootJSON,
	type RichTextEditorCanvasLayoutMode,
	type UnknownRecord,
	type LexicalNodeJSON,
} from "./RichTextEditorTypes";
import { loadLexicalDeps, type LoadedDeps } from "./RichTextEditorLoader";
import { seedEditorSafely } from "./RichTextEditorSeed";
import {
	ImageNode,
	$createImageNode,
	type ImageAlign,
	type ImageWrap,
} from "./nodes/ImageNode";
import {
	HorizontalRuleNode,
	$createHorizontalRuleNode,
} from "./nodes/HorizontalRuleNode";
import Textarea from "@/components/ui/basic-elements/Textarea";

const DEFAULT_INSERT_IMAGE_WIDTH = 200;
const EDITOR_FULLSCREEN_OPEN_ATTRIBUTE = "data-richtext-editor-fullscreen-open";

const RICH_TEXT_EXTRA_TOOLBAR_ITEMS: ToolbarItem[] = [
	"list_check",
	"list_number",
	"list_bullet",
	"sep",
	"indent",
	"outdent",
	"sep",
	"image",
	"link_toggle",
	"horizontal_rule",
];

const TOOL_CODE_TO_TOOLBAR_ITEM: Partial<Record<string, ToolbarItem>> = {
	bold: "bold",
	italic: "italic",
	underline: "underline",
	strikethrough: "strikethrough",
	code: "code",
	subscript: "subscript",
	superscript: "superscript",
	clear_format: "clear_format",
	paragraph: "paragraph",
	quote: "quote",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	h4: "h4",
	h5: "h5",
	h6: "h6",
	align_left: "align_left",
	align_center: "align_center",
	align_right: "align_right",
	align_justify: "align_justify",
	list_check: "list_check",
	list_number: "list_number",
	list_bullet: "list_bullet",
	indent: "indent",
	outdent: "outdent",
	image: "image",
	link_toggle: "link_toggle",
	horizontal_rule: "horizontal_rule",
};

function createToolbarLayoutFromToolCodes(
	allowedToolCodes: string[],
): ToolbarItem[] {
	const items: ToolbarItem[] = [];
	const usedItems = new Set<ToolbarItem>();

	for (const toolCode of allowedToolCodes) {
		const item = TOOL_CODE_TO_TOOLBAR_ITEM[toolCode];
		if (!item || usedItems.has(item)) {
			continue;
		}

		items.push(item);
		usedItems.add(item);
	}

	return mergeToolbarLayout(items, []);
}

function createDefaultToolbarFeatures(): ToolbarFeatures {
	return {
		undo: true,
		redo: true,
		bold: true,
		italic: true,
		underline: true,
		strikethrough: true,
		code: true,
		subscript: true,
		superscript: true,
		paragraph: true,
		quote: true,
		headingLevels: [1, 2, 3, 4, 5, 6],
		list_bullet: true,
		list_number: true,
		list_check: true,
		indent: true,
		outdent: true,
		align_left: true,
		align_center: true,
		align_right: true,
		align_justify: true,
		link_toggle: true,
		image: true,
		horizontal_rule: true,
		clear_format: true,
	};
}

function createToolbarFeaturesFromToolCodes(
	allowedToolCodes: string[],
): ToolbarFeatures {
	const codes = new Set(allowedToolCodes);
	const headingLevels: Array<1 | 2 | 3 | 4 | 5 | 6> = [];
	if (codes.has("h1")) headingLevels.push(1);
	if (codes.has("h2")) headingLevels.push(2);
	if (codes.has("h3")) headingLevels.push(3);
	if (codes.has("h4")) headingLevels.push(4);
	if (codes.has("h5")) headingLevels.push(5);
	if (codes.has("h6")) headingLevels.push(6);

	return {
		undo: true,
		redo: true,
		bold: codes.has("bold"),
		italic: codes.has("italic"),
		underline: codes.has("underline"),
		strikethrough: codes.has("strikethrough"),
		code: codes.has("code"),
		subscript: codes.has("subscript"),
		superscript: codes.has("superscript"),
		paragraph: codes.has("paragraph"),
		quote: codes.has("quote"),
		headingLevels,
		list_bullet: codes.has("list_bullet"),
		list_number: codes.has("list_number"),
		list_check: codes.has("list_check"),
		indent: codes.has("indent"),
		outdent: codes.has("outdent"),
		align_left: codes.has("align_left"),
		align_center: codes.has("align_center"),
		align_right: codes.has("align_right"),
		align_justify: codes.has("align_justify"),
		link_toggle: codes.has("link_toggle"),
		image: codes.has("image"),
		horizontal_rule: codes.has("horizontal_rule"),
		clear_format: codes.has("clear_format"),
	};
}

export type RichTextEditorUiFeatures = {
	fullscreen?: boolean;
};

type PickedImageItem = {
	id: string;
	url?: string | null;
	alt?: string | null;
	width?: number | null;
	height?: number | null;
};

type Props = {
	value: unknown;
	onChange: (next: unknown) => void;
	categoryId: string;
	subcategoryId: string;
	readOnly?: boolean;
	showDiagnostics?: boolean;
	features?: ToolbarFeatures;
	uiFeatures?: RichTextEditorUiFeatures;
	allowedToolCodes?: string[];
	editorSessionKey?: string;
	maxImageMB?: number;
	sourceLabel?: string;
	sourceValue?: unknown;
	toolbarLayout?: ToolbarItem[];
	canvasLayoutMode?: RichTextEditorCanvasLayoutMode;
};

type JSONNode = { type?: unknown; children?: unknown; [k: string]: unknown };
const isObj = (v: unknown): v is Record<string, unknown> =>
	typeof v === "object" && v !== null;
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function getObjectMethod(value: unknown, methodName: string): unknown {
	if (!isObject(value)) {
		return undefined;
	}

	return (value as UnknownRecord)[methodName];
}

function callNodeMethod(
	value: unknown,
	methodName: string,
	...args: unknown[]
): void {
	const method = getObjectMethod(value, methodName);
	if (!isFunction(method)) {
		return;
	}

	method.apply(value, args);
}

function readNodeType(value: unknown): string {
	const method = getObjectMethod(value, "getType");
	if (!isFunction(method)) {
		return "";
	}

	const nodeType = method.call(value);
	return typeof nodeType === "string" ? nodeType : "";
}

function readNodeParent(value: unknown): unknown | null {
	const method = getObjectMethod(value, "getParent");
	if (!isFunction(method)) {
		return null;
	}

	const parent = method.call(value);
	return parent ?? null;
}

function readNodeChildren(value: unknown): unknown[] {
	const method = getObjectMethod(value, "getChildren");
	if (!isFunction(method)) {
		return [];
	}

	const children = method.call(value);
	return Array.isArray(children) ? children : [];
}

function appendChildrenToNode(target: unknown, children: unknown[]): void {
	const method = getObjectMethod(target, "append");
	if (!isFunction(method) || children.length === 0) {
		return;
	}

	method.apply(target, children);
}

function replaceNode(currentNode: unknown, nextNode: unknown): void {
	const method = getObjectMethod(currentNode, "replace");
	if (!isFunction(method)) {
		return;
	}

	method.call(currentNode, nextNode);
}

function readSelectionNodes(selection: unknown): unknown[] {
	const method = getObjectMethod(selection, "getNodes");
	if (!isFunction(method)) {
		return [];
	}

	const nodes = method.call(selection);
	return Array.isArray(nodes) ? nodes : [];
}

function collectNodeWithChildren(node: unknown, nodes: Set<unknown>): void {
	if (!node || nodes.has(node)) {
		return;
	}

	nodes.add(node);
	for (const child of readNodeChildren(node)) {
		collectNodeWithChildren(child, nodes);
	}
}

function collectNodeParents(node: unknown, nodes: Set<unknown>): void {
	let current = readNodeParent(node);
	let depth = 0;

	while (current && depth < 32) {
		const nodeType = readNodeType(current);
		if (nodeType === "root") {
			return;
		}

		nodes.add(current);
		current = readNodeParent(current);
		depth += 1;
	}
}

function hasListAncestor(node: unknown): boolean {
	let current = readNodeParent(node);
	let depth = 0;

	while (current && depth < 32) {
		const nodeType = readNodeType(current);
		if (nodeType === "list" || nodeType === "listitem") {
			return true;
		}
		if (nodeType === "root") {
			return false;
		}

		current = readNodeParent(current);
		depth += 1;
	}

	return false;
}

function isBlockFormatNode(nodeType: string): boolean {
	return ["paragraph", "heading", "quote", "list", "listitem"].includes(
		nodeType,
	);
}

function getInsertedImageHeight(
	width: unknown,
	height: unknown,
): number | undefined {
	if (
		typeof width !== "number" ||
		!Number.isFinite(width) ||
		width <= 0 ||
		typeof height !== "number" ||
		!Number.isFinite(height) ||
		height <= 0
	) {
		return undefined;
	}

	return Math.max(1, Math.round((height / width) * DEFAULT_INSERT_IMAGE_WIDTH));
}

function isType(node: JSONNode | null | undefined, t: string): boolean {
	if (!node) return false;
	const tt = (node.type ?? "").toString().toLowerCase();
	return tt === t.toLowerCase();
}

function needsBlockImageMigration(root: unknown): boolean {
	const r = isObj(root) ? (root as JSONNode) : null;
	if (!r) return false;
	for (const child of asArr(r.children)) {
		const c = isObj(child) ? (child as JSONNode) : null;
		if (!c) continue;
		if (isType(c, "paragraph")) {
			const kids = asArr(c.children).filter(isObj) as JSONNode[];
			if (kids.length === 1) {
				const k = kids[0];
				if (isType(k, "resizable-image") || isType(k, "image")) return true;
			}
		}
	}
	return false;
}

function migrateBlockImages(json: LexicalRootJSON): LexicalRootJSON {
	const root = isObj(json.root)
		? (json.root as JSONNode)
		: { type: "root", children: [] };
	const nextChildren: unknown[] = [];
	for (const child of asArr(root.children)) {
		const c = isObj(child) ? (child as JSONNode) : null;
		if (!c || !isType(c, "paragraph")) {
			nextChildren.push(child);
			continue;
		}
		const kids = asArr(c.children).filter(isObj) as JSONNode[];
		if (kids.length === 1) {
			const k = kids[0];
			if (isType(k, "resizable-image") || isType(k, "image")) {
				nextChildren.push(k, { type: "paragraph", children: [] });
				continue;
			}
		}
		nextChildren.push(child);
	}
	return {
		root: { ...(root as Record<string, unknown>), children: nextChildren },
	} as LexicalRootJSON;
}

export default function RichTextEditor({
	value,
	onChange,
	categoryId,
	subcategoryId,
	readOnly = false,
	features,
	uiFeatures,
	allowedToolCodes,
	editorSessionKey,
	maxImageMB = 10,
	toolbarLayout = DEFAULT_TOOLBAR_LAYOUT,
	canvasLayoutMode = "full",
}: Props) {
	const [hydrated, setHydrated] = useState(false);
	useEffect(() => setHydrated(true), []);

	const [deps, setDeps] = useState<LoadedDeps>(() => ({
		lexical: null,
		LexicalComposer: null,
		RichTextPlugin: null,
		ContentEditable: null,
		HistoryPlugin: null,
		OnChangePlugin: null,
		ListPlugin: null,
		CheckListPlugin: null,
		LinkPlugin: null,
		HorizontalRulePlugin: null,
		LexicalErrorBoundary: null,

		ListNode: null,
		ListItemNode: null,
		HeadingNode: null,
		QuoteNode: null,
		LinkNode: null,

		HorizontalRuleNode: null,
		HorizontalRuleCreator: null,
	}));

	useEffect(() => {
		let isCancelled = false;
		if (!hydrated) return;
		(async () => {
			try {
				const d = await loadLexicalDeps();
				if (!isCancelled) setDeps(d);
			} catch {
				/* ignore */
			}
		})();
		return () => {
			isCancelled = true;
		};
	}, [hydrated]);

	const normalized: LexicalRootJSON = useMemo(() => coerceRoot(value), [value]);
	const effectiveEditorSessionKey = useMemo(
		() => editorSessionKey ?? "richtext-editor-default-session",
		[editorSessionKey],
	);

	const didMigrateRef = useRef(false);
	useEffect(() => {
		if (didMigrateRef.current) return;
		if (needsBlockImageMigration(normalized.root)) {
			const migrated = migrateBlockImages(normalized);
			didMigrateRef.current = true;
			onChange(migrated);
		}
	}, [normalized, onChange]);

	const [pickerOpen, setPickerOpen] = useState(false);
	const [fullscreenOpen, setFullscreenOpen] = useState(false);

	useEffect(() => {
		if (!fullscreenOpen || typeof document === "undefined") {
			return;
		}

		const previousBodyOverflow = document.body.style.overflow;
		const previousFullscreenOpen = document.body.getAttribute(
			EDITOR_FULLSCREEN_OPEN_ATTRIBUTE,
		);
		document.body.style.overflow = "hidden";
		document.body.setAttribute(EDITOR_FULLSCREEN_OPEN_ATTRIBUTE, "true");

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key !== "Escape") {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			setFullscreenOpen(false);
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = previousBodyOverflow;
			if (previousFullscreenOpen === null) {
				document.body.removeAttribute(EDITOR_FULLSCREEN_OPEN_ATTRIBUTE);
			} else {
				document.body.setAttribute(
					EDITOR_FULLSCREEN_OPEN_ATTRIBUTE,
					previousFullscreenOpen,
				);
			}
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [fullscreenOpen]);

	const lexicalNS = (deps.lexical as UnknownRecord) || null;

	const $getRoot = useMemo(
		() =>
			isFunction(lexicalNS?.$getRoot)
				? (lexicalNS.$getRoot as () => unknown)
				: () => ({}),
		[lexicalNS],
	);
	const $createParagraphNode = useMemo(
		() =>
			isFunction(lexicalNS?.$createParagraphNode)
				? (lexicalNS.$createParagraphNode as () => unknown)
				: () => ({}),
		[lexicalNS],
	);
	const $createTextNode = useMemo(
		() =>
			isFunction(lexicalNS?.$createTextNode)
				? (lexicalNS.$createTextNode as (t: string) => unknown)
				: (t: string) => t as unknown,
		[lexicalNS],
	);

	const $getSelection = useMemo(
		() =>
			isFunction(lexicalNS?.$getSelection)
				? (lexicalNS.$getSelection as () => unknown)
				: undefined,
		[lexicalNS],
	);
	const $isRangeSelection = useMemo(
		() =>
			isFunction(lexicalNS?.$isRangeSelection)
				? (lexicalNS.$isRangeSelection as (v: unknown) => boolean)
				: undefined,
		[lexicalNS],
	);
	const $insertNodes = useMemo(
		() =>
			isFunction(lexicalNS?.$insertNodes)
				? (lexicalNS.$insertNodes as (nodes: unknown[]) => void)
				: undefined,
		[lexicalNS],
	);

	const FORMAT_TEXT_COMMAND = lexicalNS?.FORMAT_TEXT_COMMAND ?? undefined;
	const FORMAT_ELEMENT_COMMAND = lexicalNS?.FORMAT_ELEMENT_COMMAND ?? undefined;
	const INDENT_CONTENT_COMMAND = lexicalNS?.INDENT_CONTENT_COMMAND ?? undefined;
	const OUTDENT_CONTENT_COMMAND =
		lexicalNS?.OUTDENT_CONTENT_COMMAND ?? undefined;
	const INSERT_UNORDERED_LIST_COMMAND =
		lexicalNS?.INSERT_UNORDERED_LIST_COMMAND ?? undefined;
	const INSERT_ORDERED_LIST_COMMAND =
		lexicalNS?.INSERT_ORDERED_LIST_COMMAND ?? undefined;
	const INSERT_CHECK_LIST_COMMAND =
		lexicalNS?.INSERT_CHECK_LIST_COMMAND ?? undefined;
	const INSERT_HORIZONTAL_RULE_COMMAND =
		lexicalNS?.INSERT_HORIZONTAL_RULE_COMMAND ?? undefined;
	const TOGGLE_LINK_COMMAND = lexicalNS?.TOGGLE_LINK_COMMAND ?? undefined;
	const UNDO_COMMAND = lexicalNS?.UNDO_COMMAND ?? undefined;
	const REDO_COMMAND = lexicalNS?.REDO_COMMAND ?? undefined;

	const nodes = useMemo<unknown[]>(() => {
		const out: unknown[] = [ImageNode];
		if (deps.ListNode) out.push(deps.ListNode);
		if (deps.ListItemNode) out.push(deps.ListItemNode);
		if (deps.HeadingNode) out.push(deps.HeadingNode);
		if (deps.QuoteNode) out.push(deps.QuoteNode);
		if (deps.LinkNode) out.push(deps.LinkNode);
		out.push(deps.HorizontalRuleNode ?? HorizontalRuleNode);
		return out;
	}, [
		deps.ListNode,
		deps.ListItemNode,
		deps.HeadingNode,
		deps.QuoteNode,
		deps.LinkNode,
		deps.HorizontalRuleNode,
	]);

	const theme = useMemo(
		() => ({
			paragraph: "",
			heading: { h1: "", h2: "", h3: "", h4: "", h5: "", h6: "" },
			list: {
				ul: "rt-ul",
				ol: "rt-ol",
				listitem: "rt-li",
				nested: { listitem: "rt-li" },
				checklist: "rt-ul-checklist",
				listitemChecked: "rt-li rt-li-checked",
				listitemUnchecked: "rt-li rt-li-unchecked",
			},
			quote: "rt-quote",
			link: "rt-link",
			text: {
				bold: "rt-bold",
				italic: "rt-italic",
				underline: "rt-underline",
				strikethrough: "rt-strike",
				code: "rt-code",
				superscript: "rt-sup",
				subscript: "rt-sub",
			},
			hr: "rt-hr",
		}),
		[],
	);

	const editorRef = useRef<unknown>(null);

	const asAlign = useCallback((v: unknown): ImageAlign | undefined => {
		return v === "left" || v === "right" || v === "center" ? v : undefined;
	}, []);
	const asWrap = useCallback((v: unknown): ImageWrap | undefined => {
		return v === "wrap" || v === "no-wrap" ? v : undefined;
	}, []);

	const initEditorState = useCallback(
		(editor: unknown) => {
			if (!isObject(editor)) return;
			if (!editorRef.current) editorRef.current = editor;

			const ed = editor as { update?: (fn: () => void) => void };

			const ok = seedEditorSafely(editor, normalized, lexicalNS, {
				createResizableImageNode: (src, opts) =>
					$createImageNode(src, {
						mediaId: typeof opts?.mediaId === "string" ? opts.mediaId : undefined,
						alt: opts?.alt,
						width: opts?.width,
						height: opts?.height,
						align: asAlign(opts?.align),
						wrap: asWrap(opts?.wrap),
					}),
				createHorizontalRuleNode:
					typeof deps.HorizontalRuleCreator === "function"
						? (deps.HorizontalRuleCreator as () => unknown)
						: undefined,
			});

			if (!ok && typeof ed.update === "function") {
				ed.update(() => {
					const r = $getRoot();
					const p = $createParagraphNode();
					const txt = $createTextNode("");
					const maybeAppend = (n: unknown, c: unknown) => {
						if (isObject(n) && isFunction((n as UnknownRecord).append)) {
							(n as { append: (child: unknown) => void }).append(c);
						}
					};
					const maybeClear = (n: unknown) => {
						if (isObject(n) && isFunction((n as UnknownRecord).clear)) {
							(n as { clear: () => void }).clear();
						}
					};
					maybeClear(r);
					maybeAppend(p, txt);
					maybeAppend(r, p);
				});
			}
		},
		[
			normalized,
			lexicalNS,
			deps.HorizontalRuleCreator,
			asAlign,
			asWrap,
			$getRoot,
			$createParagraphNode,
			$createTextNode,
		],
	);

	const runtimeLayout = useMemo(() => {
		if (Array.isArray(allowedToolCodes)) {
			return createToolbarLayoutFromToolCodes(allowedToolCodes);
		}

		return mergeToolbarLayout(
			toolbarLayout ?? DEFAULT_TOOLBAR_LAYOUT,
			RICH_TEXT_EXTRA_TOOLBAR_ITEMS,
		);
	}, [allowedToolCodes, toolbarLayout]);

	const toolbarFeatures: ToolbarFeatures = useMemo(() => {
		if (features) {
			return features;
		}

		if (Array.isArray(allowedToolCodes)) {
			return createToolbarFeaturesFromToolCodes(allowedToolCodes);
		}

		return createDefaultToolbarFeatures();
	}, [allowedToolCodes, features]);

	const toolbarUiFeatures = useMemo(
		() => ({
			fullscreen: uiFeatures?.fullscreen ?? true,
		}),
		[uiFeatures?.fullscreen],
	);

	useEffect(() => {
		if (toolbarUiFeatures.fullscreen) {
			return;
		}

		setFullscreenOpen(false);
	}, [toolbarUiFeatures.fullscreen]);

	const clearFormatting = useCallback(() => {
		const editor = editorRef.current as {
			update?: (fn: () => void) => void;
		} | null;

		if (!editor?.update || !$getSelection || !$isRangeSelection) {
			return;
		}

		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			}

			const selectedNodes = readSelectionNodes(selection);
			const nodesToClear = new Set<unknown>();
			const blockNodesToClear = new Set<unknown>();

			for (const node of selectedNodes) {
				collectNodeWithChildren(node, nodesToClear);
				collectNodeParents(node, blockNodesToClear);

				const nodeType = readNodeType(node);
				if (isBlockFormatNode(nodeType)) {
					blockNodesToClear.add(node);
				}
			}

			for (const node of nodesToClear) {
				if (readNodeType(node) !== "text") {
					continue;
				}

				callNodeMethod(node, "setFormat", 0);
				callNodeMethod(node, "setStyle", "");
			}

			for (const node of blockNodesToClear) {
				const nodeType = readNodeType(node);
				if (!isBlockFormatNode(nodeType)) {
					continue;
				}

				callNodeMethod(node, "setFormat", "");
				if (nodeType !== "list" && nodeType !== "listitem") {
					callNodeMethod(node, "setIndent", 0);
				}
			}

			for (const node of blockNodesToClear) {
				const nodeType = readNodeType(node);
				if (
					(nodeType !== "heading" && nodeType !== "quote") ||
					hasListAncestor(node)
				) {
					continue;
				}

				const paragraphNode = $createParagraphNode();
				appendChildrenToNode(paragraphNode, readNodeChildren(node));
				replaceNode(node, paragraphNode);
			}
		});
	}, [$createParagraphNode, $getSelection, $isRangeSelection]);

	const openMediaPicker = useCallback(() => setPickerOpen(true), []);

	const onInsertImage = useCallback(
		(doc: PickedImageItem) => {
			const ed = editorRef.current as {
				update?: (fn: () => void) => void;
			} | null;

			const insertedHeight = getInsertedImageHeight(doc.width, doc.height);

			if (ed?.update && $insertNodes && $getSelection && $isRangeSelection) {
				ed.update(() => {
					const sel = $getSelection();
					const imgNode = $createImageNode(doc.url || "", {
						mediaId: doc.id,
						alt: doc.alt || "",
						width: DEFAULT_INSERT_IMAGE_WIDTH,
						height: insertedHeight,
						align: "left",
						wrap: "wrap",
					});

					if ($isRangeSelection(sel)) {
						$insertNodes([imgNode]);
						const p = $createParagraphNode();
						$insertNodes([p]);
						return;
					}
					const root = $getRoot();
					if (isObject(root) && isFunction((root as UnknownRecord).append)) {
						(root as { append: (n: unknown) => void }).append(imgNode);
						const p = $createParagraphNode();
						(root as { append: (n: unknown) => void }).append(p);
					}
				});
				setPickerOpen(false);
				return;
			}

			// JSON fallback
			const imageNode: LexicalNodeJSON = {
				type: "resizable-image",
				src: doc.url || "",
				mediaId: doc.id,
				alt: doc.alt || "",
				width: DEFAULT_INSERT_IMAGE_WIDTH,
				height: insertedHeight,
				align: "left",
				wrap: "wrap",
				version: 1,
			};

			const next: LexicalRootJSON = {
				root: {
					...(isObject(normalized.root)
						? normalized.root
						: { type: "root", children: [] }),
					version: (normalized.root as UnknownRecord)?.version as number | undefined,
					children: [
						...(Array.isArray(normalized.root.children)
							? (normalized.root.children as LexicalNodeJSON[])
							: []),
						imageNode,
						{ type: "paragraph", children: [] },
					],
				},
			};
			onChange(next);
			setPickerOpen(false);
		},
		[
			normalized,
			onChange,
			$insertNodes,
			$getSelection,
			$isRangeSelection,
			$getRoot,
			$createParagraphNode,
		],
	);

	const insertLinkLabel = useCallback(
		(payload: LinkTogglePayload, label: string): boolean => {
			const editor = editorRef.current as {
				update?: (fn: () => void) => void;
			} | null;
			const createLinkNode = lexicalNS?.$createLinkNode;

			if (!editor?.update || !isFunction(createLinkNode) || !$insertNodes) {
				return false;
			}

			let didInsert = false;
			editor.update(() => {
				let linkNode: unknown | null = null;
				const linkAttributes: Record<string, unknown> = {};
				if (payload.target) {
					linkAttributes.target = payload.target;
				}
				if (payload.rel) {
					linkAttributes.rel = payload.rel;
				}

				try {
					linkNode = (
						createLinkNode as (
							url: string,
							attributes?: Record<string, unknown>,
						) => unknown
					)(payload.url, linkAttributes);
				} catch {
					try {
						linkNode = (createLinkNode as (args: Record<string, unknown>) => unknown)(
							{
								url: payload.url,
								...linkAttributes,
							},
						);
					} catch {
						linkNode = null;
					}
				}

				if (!linkNode) {
					return;
				}

				appendChildrenToNode(linkNode, [$createTextNode(label)]);
				$insertNodes([linkNode]);
				didInsert = true;
			});

			return didInsert;
		},
		[$createTextNode, $insertNodes, lexicalNS],
	);
	const setBlockType = useCallback(
		(type: "paragraph" | "quote" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
			const ref = editorRef.current as {
				update?: (fn: () => void) => void;
			} | null;
			if (!ref?.update) return;

			const $setBlocksType = lexicalNS?.$setBlocksType as
				| ((sel: unknown, cb: () => unknown) => void)
				| undefined;
			const $createParagraphNode2 = lexicalNS?.$createParagraphNode as
				| (() => unknown)
				| undefined;
			const $createQuoteNode = lexicalNS?.$createQuoteNode as
				| (() => unknown)
				| undefined;
			const $createHeadingNode = lexicalNS?.$createHeadingNode as
				| ((tag: string) => unknown)
				| undefined;

			if (!$setBlocksType || !$getSelection || !$isRangeSelection) return;

			ref.update(() => {
				const sel = $getSelection();
				if (!$isRangeSelection(sel)) return;

				switch (type) {
					case "paragraph":
						if ($createParagraphNode2)
							$setBlocksType(sel, () => $createParagraphNode2());
						break;
					case "quote":
						if ($createQuoteNode) $setBlocksType(sel, () => $createQuoteNode());
						break;
					default:
						if ($createHeadingNode)
							$setBlocksType(sel, () => $createHeadingNode(type));
						break;
				}
			});
		},
		[lexicalNS, $getSelection, $isRangeSelection],
	);

	const coreReady = useMemo(
		() =>
			hydrated &&
			!!deps.lexical &&
			!!deps.LexicalComposer &&
			!!deps.RichTextPlugin &&
			!!deps.ContentEditable &&
			!!deps.OnChangePlugin,
		[
			hydrated,
			deps.lexical,
			deps.LexicalComposer,
			deps.RichTextPlugin,
			deps.ContentEditable,
			deps.OnChangePlugin,
		],
	);

	const ready = coreReady;
	const editorFrameClassName = fullscreenOpen
		? "richtext-editor-fullscreen-frame"
		: undefined;
	const editorFrameContentClassName = fullscreenOpen
		? "richtext-editor-fullscreen-content"
		: undefined;
	return (
		<>
			<div
				className={editorFrameClassName}
				data-richtext-fullscreen={fullscreenOpen ? "true" : "false"}
				data-richtext-editor-canvas-layout={canvasLayoutMode}
			>
				<div className={editorFrameContentClassName}>
					{ready ? (
						<RichTextEditorShell
							key={effectiveEditorSessionKey}
							deps={{
								LexicalComposer: deps.LexicalComposer!,
								RichTextPlugin: deps.RichTextPlugin!,
								ContentEditable: deps.ContentEditable!,
								HistoryPlugin: deps.HistoryPlugin ?? null,
								OnChangePlugin: deps.OnChangePlugin!,
								ListPlugin: deps.ListPlugin,
								CheckListPlugin: deps.CheckListPlugin ?? null,
								LinkPlugin: deps.LinkPlugin,
								HorizontalRulePlugin: deps.HorizontalRulePlugin ?? null,
								LexicalErrorBoundary: deps.LexicalErrorBoundary ?? null,
							}}
							lexicalNS={lexicalNS}
							theme={theme}
							nodes={nodes}
							editable={!readOnly}
							fullscreenActive={fullscreenOpen}
							canvasLayoutMode={canvasLayoutMode}
							editorSessionKey={effectiveEditorSessionKey}
							onChange={onChange}
							init={initEditorState}
							renderToolbar={({
								dispatch,
								formatTextCommand,
								withUpdate,
								selection,
								linkOpenSignal,
								linkAnchor,
							}) => {
								const formatTextCmd = FORMAT_TEXT_COMMAND ?? formatTextCommand;
								return (
									<RichTextEditorToolbar
										disabled={readOnly}
										features={toolbarFeatures}
										uiFeatures={toolbarUiFeatures}
										layout={runtimeLayout}
										selection={selection}
										openLinkOnSignal={linkOpenSignal}
										linkAnchor={linkAnchor ?? undefined}
										dispatch={dispatch}
										commands={{
											FORMAT_TEXT_COMMAND: formatTextCmd,
											FORMAT_ELEMENT_COMMAND,
											INDENT_CONTENT_COMMAND,
											OUTDENT_CONTENT_COMMAND,
											INSERT_UNORDERED_LIST_COMMAND,
											INSERT_ORDERED_LIST_COMMAND,
											INSERT_CHECK_LIST_COMMAND,
											INSERT_HORIZONTAL_RULE_COMMAND,
											TOGGLE_LINK_COMMAND,
											UNDO_COMMAND,
											REDO_COMMAND,
										}}
										onChooseImage={openMediaPicker}
										onClearFormatting={clearFormatting}
										onInsertLinkLabel={insertLinkLabel}
										onInsertHorizontalRule={() => {
											if (!withUpdate) return;
											withUpdate(() => {
												if ($insertNodes && $getSelection && $isRangeSelection) {
													const sel = $getSelection();
													const hr = $createHorizontalRuleNode(null);
													if ($isRangeSelection(sel)) {
														$insertNodes([hr]);
														const p = $createParagraphNode();
														$insertNodes([p]);
														return;
													}
												}
												const root = $getRoot();
												const hr = $createHorizontalRuleNode(null);
												const p = $createParagraphNode();
												const maybeAppend = (n: unknown, c: unknown) => {
													if (isObject(n) && isFunction((n as UnknownRecord).append)) {
														(n as { append: (child: unknown) => void }).append(c);
													}
												};
												maybeAppend(root, hr);
												maybeAppend(root, p);
											});
										}}
										onToggleFullscreen={() => setFullscreenOpen((isOpen) => !isOpen)}
										fullscreenActive={fullscreenOpen}
										setBlockType={setBlockType}
									/>
								);
							}}
						/>
					) : (
						<div className="richtext-json-fallback">
							<div className="richtext-json-fallback__header">
								<div className="richtext-json-fallback__message">
									{coreReady ? (
										"Some Lexical features required by this content aren’t available. Using JSON editor fallback."
									) : (
										<>Lexical packages not found. Using JSON editor fallback.</>
									)}
								</div>
							</div>

							{/* Make the JSON fallback self-scrolling and tall */}
							<Textarea
								className="richtext-json-fallback__textarea"
								value={JSON.stringify(normalized, null, 2)}
								onChange={(e) => {
									try {
										const parsed = JSON.parse(e.target.value) as unknown;
										onChange(parsed);
									} catch {
										/* ignore parse errors while typing */
									}
								}}
								disabled={readOnly}
								spellCheck={false}
								uiSize="md"
							/>
						</div>
					)}
				</div>
			</div>

			<ImagePickerPopup
				open={pickerOpen}
				onClose={() => setPickerOpen(false)}
				onPick={onInsertImage}
				categoryId={categoryId}
				subcategoryId={subcategoryId}
				accept="image/*"
				maxSizeMB={maxImageMB}
				defaultShared={false}
			/>
		</>
	);
}
