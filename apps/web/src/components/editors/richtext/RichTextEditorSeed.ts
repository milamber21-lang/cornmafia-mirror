//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditorSeed.ts                                         ////
//// Language: TS                                                                                                 ////
//// Safely seeds Lexical editor state from normalized stored RichText JSON.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import {
	isFunction,
	isObject,
	LexicalRootJSON,
	UnknownRecord,
} from "./RichTextEditorTypes";

const asObj = (v: unknown): Record<string, unknown> | null =>
	typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asStr = (v: unknown): string | null => (typeof v === "string" ? v : null);
const asNum = (v: unknown): number | null =>
	typeof v === "number" && Number.isFinite(v) ? v : null;
const asBool = (v: unknown): boolean | null =>
	typeof v === "boolean" ? v : null;

export function extractPlainText(node: unknown): string {
	const out: string[] = [];
	function walk(n: unknown) {
		const o = asObj(n);
		if (!o) return;
		const type = asStr(o.type) ?? "";
		if (type === "text" && typeof o.text === "string") out.push(String(o.text));
		for (const c of asArr(o.children)) walk(c);
	}
	const rootObj = asObj(node);
	if (rootObj) {
		if (asObj((rootObj as { root?: unknown }).root))
			walk((rootObj as { root: unknown }).root);
		else walk(node);
	}
	return out.join(" ").replace(/\s+/g, " ").trim();
}

export type SeederFactories = {
	createResizableImageNode?: (
		src: string,
		opts?: {
			mediaId?: string;
			alt?: string;
			width?: number;
			height?: number;
			align?: string;
			wrap?: string;
		},
	) => unknown;
	createHorizontalRuleNode?: () => unknown;
};

type LexNS = UnknownRecord | null;

function jsonLooksSkeleton(root: Record<string, unknown>): boolean {
	return asArr(root.children).length === 0;
}

/** Detect stored editor node shapes that need structured seeding. */
function hasStoredEditorNodeShapes(json: LexicalRootJSON): boolean {
	const root = asObj(json.root);
	if (!root) return false;

	let found = false;
	const stack: Record<string, unknown>[] = [root];
	while (stack.length && !found) {
		const cur = stack.pop() as Record<string, unknown>;
		const t = (asStr(cur.type) ?? "").toLowerCase();
		const f = asObj((cur as { fields?: unknown }).fields ?? null);

		if (t === "link" && f && typeof f.url === "string") {
			found = true;
			break;
		}
		if (
			(t === "image" || t === "resizable-image") &&
			f &&
			(typeof f.src === "string" || typeof f.url === "string")
		) {
			found = true;
			break;
		}
		const kids = asArr((cur as { children?: unknown[] }).children);
		for (const k of kids) if (asObj(k)) stack.push(k as Record<string, unknown>);
	}
	return found;
}

function seedStructured(
	ed: { update?: (f: () => void) => void },
	json: LexicalRootJSON,
	L: LexNS,
	fx: SeederFactories = {},
): boolean {
	if (!isFunction(ed.update) || !L) return false;

	const $getRoot = (L?.$getRoot as (() => unknown) | undefined) ?? (() => ({}));
	const $createParagraphNode =
		(L?.$createParagraphNode as (() => unknown) | undefined) ?? (() => ({}));
	const $createTextNode =
		(L?.$createTextNode as ((t: string) => unknown) | undefined) ??
		((t: string) => t as unknown);
	const $createHeadingNode = L?.$createHeadingNode as
		| ((tag: string) => unknown)
		| undefined;
	const $createQuoteNode = L?.$createQuoteNode as (() => unknown) | undefined;
	const $createLineBreakNode = L?.$createLineBreakNode as
		| (() => unknown)
		| undefined;

	const $createListNode = L?.$createListNode as
		| ((type: "number" | "bullet" | "check") => unknown)
		| undefined;
	const $createListItemNode = L?.$createListItemNode as
		| (() => unknown)
		| undefined;

	// Exposed via RichTextEditorLoader
	const linkFactoryAny = L?.$createLinkNode as unknown;

	const call = <T>(
		obj: unknown,
		key: string,
		...args: unknown[]
	): T | undefined => {
		const o = asObj(obj);
		const fn = o?.[key];
		if (o && isFunction(fn)) {
			try {
				return (fn as (...xs: unknown[]) => T).apply(o, args);
			} catch {}
		}
		return undefined;
	};

	function makeLink(url: string, target: string | null): unknown {
		if (!linkFactoryAny) {
			return $createTextNode("");
		}

		// Try modern signature first
		try {
			const maybe = (
				linkFactoryAny as (u: string, attrs?: Record<string, unknown>) => unknown
			)(url, target ? { target } : undefined);
			if (maybe && typeof (maybe as { append?: unknown }).append !== "undefined") {
				return maybe;
			}
		} catch {}

		// Legacy/object signature
		try {
			const maybe = (
				linkFactoryAny as (payload: Record<string, unknown>) => unknown
			)({ url, target });
			if (maybe && typeof (maybe as { append?: unknown }).append !== "undefined") {
				return maybe;
			}
		} catch {}

		return $createTextNode("");
	}

	function buildInline(node: Record<string, unknown>): unknown {
		const type = (asStr(node.type) ?? "").toLowerCase();

		if (type === "text") {
			const text = asStr(node.text) ?? "";
			const fmt = asNum(node.format) ?? 0;
			const t = $createTextNode(text);

			const formats: Array<
				[
					(
						| "bold"
						| "italic"
						| "underline"
						| "strikethrough"
						| "code"
						| "subscript"
						| "superscript"
					),
					number,
				]
			> = [
				["bold", 1],
				["italic", 2],
				["underline", 8],
				["strikethrough", 4],
				["code", 16],
				["subscript", 32],
				["superscript", 64],
			];
			for (const [label, bit] of formats)
				if ((fmt & bit) === bit) call(t, "toggleFormat", label);
			return t;
		}

		if (type === "linebreak" && $createLineBreakNode) {
			return $createLineBreakNode();
		}

		if (type === "link") {
			// Accept stored field-shaped (fields.url/newTab) and native-shaped (url/target)
			const f = (asObj((node as { fields?: unknown }).fields) ?? {}) as Record<
				string,
				unknown
			>;
			const url = (
				asStr(f.url) ??
				asStr((node as { url?: unknown }).url) ??
				""
			).trim();

			if (!url) {
				// Unwrap blank link nodes so empty URLs are not persisted
				const span = $createTextNode("");
				for (const c of asArr(node.children)) {
					const built = asObj(c) ? buildInline(c as Record<string, unknown>) : null;
					if (built) call(span, "append", built);
				}
				return span;
			}

			const explicitTarget = (node as { target?: unknown }).target;
			const newTabFlag = asBool(f.newTab);
			const target: string | null =
				typeof explicitTarget === "string"
					? explicitTarget
					: newTabFlag
						? "_blank"
						: null;

			const link = makeLink(url, target);
			for (const c of asArr(node.children)) {
				const built = asObj(c) ? buildInline(c as Record<string, unknown>) : null;
				if (built) call(link, "append", built);
			}
			return link;
		}

		if (
			(type === "image" || type === "resizable-image") &&
			fx.createResizableImageNode
		) {
			const fields = (asObj(node.fields) ?? node) as Record<string, unknown>;
			const src = asStr(fields.src) ?? asStr(fields.url) ?? "";
			const mediaId = asStr(fields.mediaId) ?? asStr(fields.media_id) ?? undefined;
			const alt = asStr(fields.alt) ?? undefined;
			const width = asNum(fields.width) ?? undefined;
			const height = asNum(fields.height) ?? undefined;
			const align = asStr(fields.align) ?? undefined;
			const wrap = asStr(fields.wrap) ?? undefined;
			if (src)
				return fx.createResizableImageNode(src, {
					mediaId,
					alt,
					width,
					height,
					align,
					wrap,
				});
		}

		// Generic inline container
		const span = $createTextNode("");
		for (const c of asArr(node.children)) {
			const built = asObj(c) ? buildInline(c as Record<string, unknown>) : null;
			if (built) call(span, "append", built);
		}
		return span;
	}

	function buildBlock(node: Record<string, unknown>): unknown {
		const type = (asStr(node.type) ?? "").toLowerCase();

		if (type === "paragraph") {
			const kids = asArr(node.children).filter((c) => !!asObj(c));
			const onlyChild =
				kids.length === 1 ? (kids[0] as Record<string, unknown>) : null;
			const onlyType = onlyChild
				? (asStr(onlyChild.type) ?? "").toLowerCase()
				: "";
			if (onlyChild && (onlyType === "resizable-image" || onlyType === "image")) {
				const img = buildInline(onlyChild);
				return img ?? $createParagraphNode();
			}
		}

		switch (type) {
			case "paragraph": {
				const p = $createParagraphNode();
				for (const c of asArr(node.children)) {
					const co = asObj(c);
					if (!co) continue;
					const built = buildInline(co);
					if (built) call(p, "append", built);
				}
				return p;
			}
			case "heading": {
				const tag = (asStr(node.tag) ?? "h2").toLowerCase();
				const hdr = $createHeadingNode
					? $createHeadingNode(tag)
					: $createParagraphNode();
				for (const c of asArr(node.children)) {
					const built = asObj(c) ? buildInline(c as Record<string, unknown>) : null;
					if (built) call(hdr, "append", built);
				}
				return hdr;
			}
			case "quote": {
				const q = $createQuoteNode ? $createQuoteNode() : $createParagraphNode();
				for (const c of asArr(node.children)) {
					const built = asObj(c) ? buildInline(c as Record<string, unknown>) : null;
					if (built) call(q, "append", built);
				}
				return q;
			}
			case "horizontalrule": {
				if (isFunction(fx.createHorizontalRuleNode))
					return fx.createHorizontalRuleNode();
				return $createParagraphNode();
			}
			case "list": {
				const tag = (asStr(node.tag) ?? "").toLowerCase();
				const lt = asStr(node.listType) ?? "";
				const listType: "number" | "bullet" | "check" =
					lt === "check"
						? "check"
						: tag === "ol" || lt === "number"
							? "number"
							: "bullet";
				const list = $createListNode
					? $createListNode(listType)
					: $createParagraphNode();
				if ($createListNode) call(list, "setListType", listType);
				const start = asNum(node.start);
				if (typeof start === "number" && start > 1) call(list, "setStart", start);

				for (const li of asArr(node.children)) {
					const liObj = asObj(li);
					if (!liObj) continue;
					if ((asStr(liObj.type) ?? "").toLowerCase() !== "listitem") continue;

					const item = $createListItemNode
						? $createListItemNode()
						: $createParagraphNode();
					const checked = asBool(liObj.checked);
					if (checked !== null) call(item, "setChecked", checked);

					for (const liChild of asArr(liObj.children)) {
						const co = asObj(liChild);
						if (!co) continue;
						if ((asStr(co.type) ?? "").toLowerCase() === "list") {
							const nestedList = buildBlock(co);
							if (nestedList) call(item, "append", nestedList);
							continue;
						}
						const built = buildInline(co);
						if (built) call(item, "append", built);
					}
					call(list, "append", item);
				}
				return list;
			}
			case "image":
			case "resizable-image": {
				return buildInline(node);
			}
			default: {
				const p = $createParagraphNode();
				for (const c of asArr(node.children)) {
					const built =
						asObj(c) &&
						(asStr((c as Record<string, unknown>).type) ?? "").toLowerCase() ===
							"paragraph"
							? buildBlock(c as Record<string, unknown>)
							: asObj(c)
								? buildInline(c as Record<string, unknown>)
								: null;
					if (built) call(p, "append", built);
				}
				return p;
			}
		}
	}

	const rootIn = asObj(json.root);
	if (!rootIn) return false;

	ed.update(() => {
		const root = $getRoot();
		call(root, "clear");

		const children = asArr(rootIn.children);
		if (children.length === 0) {
			call(root, "append", $createParagraphNode());
			return;
		}
		for (const child of children) {
			const co = asObj(child);
			if (!co) continue;
			const built = buildBlock(co);
			if (built) call(root, "append", built);
		}
	});

	return true;
}

export function seedEditorSafely(
	ed: {
		parseEditorState?: (s: string) => unknown;
		setEditorState?: (s: unknown) => void;
		update?: (fn: () => void) => void;
	},
	currentJSON: LexicalRootJSON,
	lexicalNS: UnknownRecord | null,
	factories?: SeederFactories,
): boolean {
	const stringify = (value: unknown): string => {
		try {
			return JSON.stringify(value ?? {}, null, 2);
		} catch {
			return "{}";
		}
	};

	const rootObj = asObj(currentJSON.root) ?? { type: "root", children: [] };
	const skeleton = jsonLooksSkeleton(rootObj);
	const hasStoredShapes = hasStoredEditorNodeShapes(currentJSON);

	// Only use Lexical's native parser for plain native-shaped JSON.
	if (
		!hasStoredShapes &&
		!skeleton &&
		isFunction(ed.parseEditorState) &&
		isFunction(ed.setEditorState)
	) {
		const src = stringify(currentJSON);
		try {
			const parsed = ed.parseEditorState(src);
			ed.setEditorState?.(parsed);
			return true;
		} catch {
			/* fall through to structured seed */
		}
	}

	if (seedStructured(ed, currentJSON, lexicalNS, factories ?? {})) {
		return true;
	}

	try {
		if (isFunction(ed.update)) {
			const text = extractPlainText(currentJSON);
			const $getRoot = isFunction(lexicalNS?.$getRoot)
				? (lexicalNS?.$getRoot as () => unknown)
				: () => ({});
			const $createParagraphNode = isFunction(lexicalNS?.$createParagraphNode)
				? (lexicalNS?.$createParagraphNode as () => unknown)
				: () => ({});
			const $createTextNode = isFunction(lexicalNS?.$createTextNode)
				? (lexicalNS?.$createTextNode as (t: string) => unknown)
				: (t: string) => t as unknown;

			ed.update(() => {
				const root = $getRoot();
				const p = $createParagraphNode();
				const t = $createTextNode(text || "");
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
				maybeClear(root);
				maybeAppend(p, t);
				maybeAppend(root, p);
			});
			return true;
		}
	} catch {}

	return false;
}
