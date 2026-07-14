//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/svg-sanitizer.ts                                                               ////
//// Language: TS                                                                                                  ////
//// Strict SVG sanitization and inline loading helpers for client and server surfaces                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type SanitizeOptions = {
	maxBytes?: number;
	cacheTtlMs?: number;
	colorMode?: "keep" | "currentColor";
	debug?: boolean;
};

type CacheEntry = {
	value: string;
	expiresAt: number;
};

type SvgAttribute = {
	name: string;
	value: string;
};

type SvgNode = {
	kind: "element";
	name: string;
	attributes: SvgAttribute[];
	children: SvgChild[];
};

type SvgTextNode = {
	kind: "text";
	value: string;
};

type SvgChild = SvgNode | SvgTextNode;

type ParsedTag = {
	name: string;
	attributes: SvgAttribute[];
	selfClosing: boolean;
	nextIndex: number;
};

class SimpleCache {
	private store = new Map<string, CacheEntry>();

	get(key: string): string | undefined {
		const hit = this.store.get(key);
		if (!hit) {
			return undefined;
		}

		if (Date.now() > hit.expiresAt) {
			this.store.delete(key);
			return undefined;
		}

		return hit.value;
	}

	set(key: string, value: string, ttlMs: number): void {
		this.store.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) });
	}
}

const CACHE = new SimpleCache();

const ELEMENT_NAME_MAP: Record<string, string> = {
	svg: "svg",
	g: "g",
	path: "path",
	circle: "circle",
	ellipse: "ellipse",
	rect: "rect",
	line: "line",
	polyline: "polyline",
	polygon: "polygon",
	defs: "defs",
	clippath: "clipPath",
	mask: "mask",
	lineargradient: "linearGradient",
	radialgradient: "radialGradient",
	stop: "stop",
	title: "title",
	desc: "desc",
	symbol: "symbol",
	use: "use",
};

const BLOCKED_ELEMENTS = new Set<string>([
	"script",
	"foreignobject",
	"iframe",
	"audio",
	"video",
	"object",
	"embed",
	"link",
	"meta",
]);

const LEAF_SHAPES = new Set<string>([
	"path",
	"circle",
	"ellipse",
	"rect",
	"line",
	"polyline",
	"polygon",
]);

const BASE_ATTRIBUTE_MAP: Record<string, string> = {
	id: "id",
	class: "class",
	style: "style",
	transform: "transform",
	fill: "fill",
	stroke: "stroke",
	"stroke-width": "stroke-width",
	"stroke-linecap": "stroke-linecap",
	"stroke-linejoin": "stroke-linejoin",
	opacity: "opacity",
	viewbox: "viewBox",
	width: "width",
	height: "height",
	x: "x",
	y: "y",
	xmlns: "xmlns",
	"xmlns:xlink": "xmlns:xlink",
	"aria-hidden": "aria-hidden",
	"aria-label": "aria-label",
	"aria-labelledby": "aria-labelledby",
	"aria-describedby": "aria-describedby",
	focusable: "focusable",
	role: "role",
	preserveaspectratio: "preserveAspectRatio",
	"vector-effect": "vector-effect",
	"clip-path": "clip-path",
	mask: "mask",
	"fill-rule": "fill-rule",
	"stroke-miterlimit": "stroke-miterlimit",
	"stroke-dasharray": "stroke-dasharray",
	"stroke-dashoffset": "stroke-dashoffset",
	"data-name": "data-name",
};

const EXTRA_ATTRIBUTES_BY_ELEMENT: Record<string, Record<string, string>> = {
	path: { d: "d" },
	circle: { cx: "cx", cy: "cy", r: "r" },
	ellipse: { cx: "cx", cy: "cy", rx: "rx", ry: "ry" },
	rect: { x: "x", y: "y", rx: "rx", ry: "ry", width: "width", height: "height" },
	line: { x1: "x1", y1: "y1", x2: "x2", y2: "y2" },
	polyline: { points: "points" },
	polygon: { points: "points" },
	lineargradient: {
		x1: "x1",
		y1: "y1",
		x2: "x2",
		y2: "y2",
		gradientunits: "gradientUnits",
		gradienttransform: "gradientTransform",
		spreadmethod: "spreadMethod",
	},
	radialgradient: {
		cx: "cx",
		cy: "cy",
		r: "r",
		fx: "fx",
		fy: "fy",
		gradientunits: "gradientUnits",
		gradienttransform: "gradientTransform",
		spreadmethod: "spreadMethod",
	},
	stop: {
		offset: "offset",
		"stop-color": "stop-color",
		"stop-opacity": "stop-opacity",
	},
	clippath: { clippathunits: "clipPathUnits" },
	mask: {
		maskunits: "maskUnits",
		maskcontentunits: "maskContentUnits",
		x: "x",
		y: "y",
		width: "width",
		height: "height",
	},
	use: { href: "href", "xlink:href": "xlink:href" },
	svg: {
		xmlns: "xmlns",
		"xmlns:xlink": "xmlns:xlink",
		viewbox: "viewBox",
		width: "width",
		height: "height",
	},
	g: {},
	title: {},
	desc: {},
	symbol: { viewbox: "viewBox", preserveaspectratio: "preserveAspectRatio" },
};

const ALLOWED_STYLE_PROPERTIES = new Set<string>([
	"fill",
	"stroke",
	"stroke-width",
	"stroke-linecap",
	"stroke-linejoin",
	"opacity",
	"fill-rule",
	"stroke-miterlimit",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stop-color",
	"stop-opacity",
	"clip-path",
	"mask",
]);

function cacheKey(url: string, opts?: SanitizeOptions): string {
	const ttl = opts?.cacheTtlMs ?? 60_000;
	return `${url}::${ttl}::${opts?.colorMode ?? "keep"}`;
}

export function isLikelySvgUrlish(src: unknown): boolean {
	if (typeof src !== "string") {
		return false;
	}

	const value = src.toLowerCase();
	return (
		value.includes(".svg") ||
		value.startsWith("data:image/svg") ||
		value.includes("image/svg+xml")
	);
}

function isWhitespaceChar(char: string): boolean {
	return (
		char === " " ||
		char === "\n" ||
		char === "\r" ||
		char === "\t" ||
		char === "\f"
	);
}

function isNameStartChar(char: string): boolean {
	return /[A-Za-z_:]/.test(char);
}

function isNameChar(char: string): boolean {
	return /[A-Za-z0-9_.:-]/.test(char);
}

function skipWhitespace(input: string, index: number): number {
	let nextIndex = index;
	while (nextIndex < input.length && isWhitespaceChar(input[nextIndex])) {
		nextIndex += 1;
	}
	return nextIndex;
}

function readName(
	input: string,
	index: number,
): { name: string; nextIndex: number } | null {
	if (index >= input.length || !isNameStartChar(input[index])) {
		return null;
	}

	let nextIndex = index + 1;
	while (nextIndex < input.length && isNameChar(input[nextIndex])) {
		nextIndex += 1;
	}

	return {
		name: input.slice(index, nextIndex),
		nextIndex,
	};
}

function findTokenEnd(input: string, index: number, token: string): number {
	const found = input.indexOf(token, index);
	return found >= 0 ? found : -1;
}

function parseOpeningTag(input: string, startIndex: number): ParsedTag | null {
	let index = startIndex + 1;
	const tagNameResult = readName(input, index);
	if (!tagNameResult) {
		return null;
	}

	const attributes: SvgAttribute[] = [];
	let selfClosing = false;
	index = tagNameResult.nextIndex;

	while (index < input.length) {
		index = skipWhitespace(input, index);
		if (index >= input.length) {
			return null;
		}

		const char = input[index];
		if (char === ">") {
			return {
				name: tagNameResult.name,
				attributes,
				selfClosing,
				nextIndex: index + 1,
			};
		}

		if (char === "/" && input[index + 1] === ">") {
			selfClosing = true;
			return {
				name: tagNameResult.name,
				attributes,
				selfClosing,
				nextIndex: index + 2,
			};
		}

		const attrNameResult = readName(input, index);
		if (!attrNameResult) {
			return null;
		}
		index = skipWhitespace(input, attrNameResult.nextIndex);
		if (input[index] !== "=") {
			return null;
		}
		index = skipWhitespace(input, index + 1);

		const quote = input[index];
		if (quote !== '"' && quote !== "'") {
			return null;
		}
		index += 1;
		const valueStart = index;
		const valueEnd = input.indexOf(quote, valueStart);
		if (valueEnd < 0) {
			return null;
		}

		attributes.push({
			name: attrNameResult.name,
			value: input.slice(valueStart, valueEnd),
		});
		index = valueEnd + 1;
	}

	return null;
}

function parseClosingTag(
	input: string,
	startIndex: number,
): { name: string; nextIndex: number } | null {
	let index = skipWhitespace(input, startIndex + 2);
	const tagNameResult = readName(input, index);
	if (!tagNameResult) {
		return null;
	}

	index = skipWhitespace(input, tagNameResult.nextIndex);
	if (input[index] !== ">") {
		return null;
	}

	return {
		name: tagNameResult.name,
		nextIndex: index + 1,
	};
}

function appendText(stack: SvgNode[], text: string): void {
	if (text.length === 0 || stack.length === 0) {
		return;
	}

	stack[stack.length - 1].children.push({
		kind: "text",
		value: text,
	});
}

function parseSvgDocument(input: string): SvgNode | null {
	const trimmed = input.trim();
	if (
		!trimmed ||
		trimmed.includes("<!DOCTYPE") ||
		trimmed.includes("<!doctype") ||
		trimmed.includes("<!ENTITY") ||
		trimmed.includes("<!entity")
	) {
		return null;
	}

	const stack: SvgNode[] = [];
	let root: SvgNode | null = null;
	let index = 0;

	while (index < trimmed.length) {
		const nextOpen = trimmed.indexOf("<", index);
		if (nextOpen < 0) {
			appendText(stack, trimmed.slice(index));
			break;
		}

		appendText(stack, trimmed.slice(index, nextOpen));

		if (trimmed.startsWith("<!--", nextOpen)) {
			const commentEnd = findTokenEnd(trimmed, nextOpen + 4, "-->");
			if (commentEnd < 0) {
				return null;
			}
			index = commentEnd + 3;
			continue;
		}

		if (trimmed.startsWith("<?xml", nextOpen)) {
			const declarationEnd = findTokenEnd(trimmed, nextOpen + 5, "?>");
			if (declarationEnd < 0) {
				return null;
			}
			index = declarationEnd + 2;
			continue;
		}

		if (
			trimmed.startsWith("<?", nextOpen) ||
			trimmed.startsWith("<!", nextOpen)
		) {
			return null;
		}

		if (trimmed.startsWith("</", nextOpen)) {
			const closingTag = parseClosingTag(trimmed, nextOpen);
			if (!closingTag || stack.length === 0) {
				return null;
			}

			const current = stack.pop();
			if (!current || current.name !== closingTag.name) {
				return null;
			}

			index = closingTag.nextIndex;
			continue;
		}

		const openingTag = parseOpeningTag(trimmed, nextOpen);
		if (!openingTag) {
			return null;
		}

		const node: SvgNode = {
			kind: "element",
			name: openingTag.name,
			attributes: openingTag.attributes,
			children: [],
		};

		if (stack.length === 0) {
			if (root !== null) {
				return null;
			}
			root = node;
		} else {
			stack[stack.length - 1].children.push(node);
		}

		if (!openingTag.selfClosing) {
			stack.push(node);
		}

		index = openingTag.nextIndex;
	}

	return root && stack.length === 0 ? root : null;
}

function escapeText(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
	return escapeText(value).replace(/"/g, "&quot;");
}

function normalizeColorAttr(
	value: string,
	mode: "keep" | "currentColor",
): string | null {
	const normalizedValue = value.trim();
	if (!normalizedValue) {
		return null;
	}

	if (mode !== "currentColor") {
		if (normalizedValue.toLowerCase().includes("url(")) {
			return isLocalUrlReference(normalizedValue) ? normalizedValue : null;
		}

		return isSafeSvgValue(normalizedValue) ? normalizedValue : null;
	}

	if (normalizedValue === "currentColor") {
		return normalizedValue;
	}

	if (normalizedValue.toLowerCase() === "none") {
		return normalizedValue;
	}

	if (isLocalUrlReference(normalizedValue)) {
		return normalizedValue;
	}

	return "currentColor";
}

function isLocalUrlReference(value: string): boolean {
	const normalizedValue = value.trim();
	if (
		!normalizedValue.toLowerCase().startsWith("url(") ||
		!normalizedValue.endsWith(")")
	) {
		return false;
	}

	const innerValue = normalizedValue
		.slice(4, -1)
		.trim()
		.replace(/^['"]|['"]$/g, "");
	return (
		innerValue.startsWith("#") &&
		!innerValue.includes("<") &&
		!innerValue.includes(">") &&
		!innerValue.includes(":")
	);
}

function isSafeSvgValue(value: string): boolean {
	const normalizedValue = value.trim().toLowerCase();
	if (!normalizedValue) {
		return false;
	}

	return !(
		normalizedValue.includes("javascript:") ||
		normalizedValue.includes("data:") ||
		normalizedValue.includes("vbscript:") ||
		normalizedValue.includes("expression(") ||
		normalizedValue.includes("@import") ||
		normalizedValue.includes("<") ||
		normalizedValue.includes(">")
	);
}

function isEventAttr(name: string): boolean {
	return name.toLowerCase().startsWith("on");
}

function isHrefAttr(name: string): boolean {
	const normalizedName = name.toLowerCase();
	return normalizedName === "href" || normalizedName === "xlink:href";
}

function isExternalHref(value: string): boolean {
	const normalizedValue = value.trim();
	return normalizedValue.length > 0 && !normalizedValue.startsWith("#");
}

function isAriaAttr(name: string): boolean {
	return /^aria-[a-z-]+$/i.test(name);
}

function isDataAttr(name: string): boolean {
	return /^data-[a-z0-9-]+$/i.test(name);
}

function cleanStyle(value: string, colorMode: "keep" | "currentColor"): string {
	const parts = value
		.split(";")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
	const cleaned: string[] = [];

	for (const part of parts) {
		const separatorIndex = part.indexOf(":");
		if (separatorIndex <= 0) {
			continue;
		}

		const property = part.slice(0, separatorIndex).trim().toLowerCase();
		const rawValue = part.slice(separatorIndex + 1).trim();
		if (!ALLOWED_STYLE_PROPERTIES.has(property) || !isSafeSvgValue(rawValue)) {
			continue;
		}

		if (
			(property === "fill" || property === "stroke") &&
			colorMode === "currentColor"
		) {
			const normalizedColor = normalizeColorAttr(rawValue, colorMode);
			if (normalizedColor) {
				cleaned.push(`${property}: ${normalizedColor}`);
			}
			continue;
		}

		if (
			(property === "clip-path" || property === "mask") &&
			!isLocalUrlReference(rawValue)
		) {
			continue;
		}

		if (
			rawValue.toLowerCase().includes("url(") &&
			!isLocalUrlReference(rawValue)
		) {
			continue;
		}

		cleaned.push(`${property}: ${rawValue}`);
	}

	return cleaned.join("; ");
}

function canonicalElementName(name: string): string | null {
	return ELEMENT_NAME_MAP[name.toLowerCase()] ?? null;
}

function canonicalAttributeName(
	elementName: string,
	attrName: string,
): string | null {
	const lowerAttrName = attrName.toLowerCase();
	const lowerElementName = elementName.toLowerCase();
	const extraAttributes = EXTRA_ATTRIBUTES_BY_ELEMENT[lowerElementName] ?? {};
	return (
		extraAttributes[lowerAttrName] ?? BASE_ATTRIBUTE_MAP[lowerAttrName] ?? null
	);
}

function sanitizeAttributes(
	elementName: string,
	attributes: SvgAttribute[],
	colorMode: "keep" | "currentColor",
): SvgAttribute[] {
	const output: SvgAttribute[] = [];
	const seenNames = new Set<string>();

	for (const attr of attributes) {
		if (isEventAttr(attr.name)) {
			continue;
		}

		let attrName = canonicalAttributeName(elementName, attr.name);
		if (!attrName && isAriaAttr(attr.name)) {
			attrName = attr.name.toLowerCase();
		}
		if (!attrName && isDataAttr(attr.name)) {
			attrName = attr.name.toLowerCase();
		}
		if (!attrName || seenNames.has(attrName)) {
			continue;
		}

		const value = attr.value.trim();
		if (!value) {
			continue;
		}

		if (isHrefAttr(attrName)) {
			if (isExternalHref(value) || !isSafeSvgValue(value)) {
				continue;
			}
			output.push({ name: attrName, value });
			seenNames.add(attrName);
			continue;
		}

		if (attrName === "style") {
			const cleanedStyle = cleanStyle(value, colorMode);
			if (cleanedStyle) {
				output.push({ name: attrName, value: cleanedStyle });
				seenNames.add(attrName);
			}
			continue;
		}

		if (attrName === "fill" || attrName === "stroke") {
			const normalizedValue = normalizeColorAttr(value, colorMode);
			if (normalizedValue) {
				output.push({ name: attrName, value: normalizedValue });
				seenNames.add(attrName);
			}
			continue;
		}

		if (
			(attrName === "clip-path" || attrName === "mask") &&
			!isLocalUrlReference(value)
		) {
			continue;
		}

		if (!isSafeSvgValue(value)) {
			continue;
		}

		output.push({ name: attrName, value });
		seenNames.add(attrName);
	}

	return output;
}

function serializeAttributes(attributes: SvgAttribute[]): string {
	return attributes
		.map((attr) => ` ${attr.name}="${escapeAttribute(attr.value)}"`)
		.join("");
}

function sanitizeAndSerializeNode(
	node: SvgChild,
	colorMode: "keep" | "currentColor",
	parentElementName: string | null,
): string {
	if (node.kind === "text") {
		return parentElementName === "title" || parentElementName === "desc"
			? escapeText(node.value)
			: "";
	}

	const canonicalName = canonicalElementName(node.name);
	if (!canonicalName) {
		if (BLOCKED_ELEMENTS.has(node.name.toLowerCase())) {
			return "";
		}

		return node.children
			.map((child) =>
				sanitizeAndSerializeNode(child, colorMode, parentElementName),
			)
			.join("");
	}

	const attributes = sanitizeAttributes(
		canonicalName,
		node.attributes,
		colorMode,
	);
	const childParent = canonicalName;
	const children = LEAF_SHAPES.has(canonicalName)
		? ""
		: node.children
				.map((child) => sanitizeAndSerializeNode(child, colorMode, childParent))
				.join("");

	return `<${canonicalName}${serializeAttributes(attributes)}>${children}</${canonicalName}>`;
}

function ensureSvgImageNamespace(svg: string): string {
	let nextSvg = svg.trim();
	if (!/^<svg(?:\s|>)/i.test(nextSvg)) {
		return "";
	}

	if (!/\sxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(nextSvg)) {
		nextSvg = nextSvg.replace(
			/^<svg(\s|>)/i,
			(_match: string, suffix: string) =>
				`<svg xmlns="http://www.w3.org/2000/svg"${suffix}`,
		);
	}

	if (
		!/\sxmlns:xlink\s*=\s*["']http:\/\/www\.w3\.org\/1999\/xlink["']/i.test(
			nextSvg,
		)
	) {
		nextSvg = nextSvg.replace(
			/^<svg(\s|>)/i,
			(_match: string, suffix: string) =>
				`<svg xmlns:xlink="http://www.w3.org/1999/xlink"${suffix}`,
		);
	}

	return nextSvg;
}

export function sanitizeSvg(raw: string, opts?: SanitizeOptions): string {
	const colorMode = opts?.colorMode ?? "keep";
	const parsed = parseSvgDocument(String(raw ?? ""));
	if (!parsed || canonicalElementName(parsed.name) !== "svg") {
		return "";
	}

	return ensureSvgImageNamespace(
		sanitizeAndSerializeNode(parsed, colorMode, null),
	);
}

export function svgToDataUrl(sanitized: string): string {
	const text = sanitized.trim();
	const encoded = encodeURIComponent(text);
	return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export async function getInlineSvgForUrl(
	url: string,
	opts?: SanitizeOptions,
): Promise<string> {
	const key = cacheKey(url, opts);
	const hit = CACHE.get(key);
	if (typeof hit === "string") {
		return hit;
	}

	const maxBytes = opts?.maxBytes ?? 512 * 1024;
	const response = await fetch(url, {
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error(`Failed to load SVG (${response.status})`);
	}

	const reader = (
		response as { body?: ReadableStream<Uint8Array> }
	).body?.getReader?.();
	let buffer = "";

	if (reader) {
		let read = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			const chunk =
				typeof value === "string" ? value : new TextDecoder("utf-8").decode(value);
			read += chunk.length;
			if (read > maxBytes) {
				throw new Error("SVG too large");
			}
			buffer += chunk;
		}
	} else {
		const text = await response.text();
		if (text.length > maxBytes) {
			throw new Error("SVG too large");
		}
		buffer = text;
	}

	const sanitized = sanitizeSvg(buffer, opts);
	CACHE.set(key, sanitized || "", opts?.cacheTtlMs ?? 60_000);
	return sanitized || "";
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
