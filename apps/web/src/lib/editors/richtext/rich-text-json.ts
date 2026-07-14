//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/editors/richtext/rich-text-json.ts                                                    ////
//// Language: TS                                                                                                 ////
//// Shared RichText stored-document contract, normalization, and reference extraction helpers.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	normalizeRichTextLinkTarget,
	richTextLinkTargetHref,
	richTextLinkTargetOpensNewTab,
	type RichTextLinkTarget,
} from "./rich-text-link-targets";

export type RichTextJsonRecord = Record<string, unknown>;

export type RichTextJsonNode = RichTextJsonRecord & {
	type?: string;
	text?: string;
	tag?: string;
	listType?: "bullet" | "number" | "check";
	format?: string | number;
	version?: number;
	fields?: RichTextJsonRecord | null;
	children?: unknown[];
};

export type RichTextJson = {
	root: RichTextJsonNode & {
		type: "root";
		children: unknown[];
		version: number;
	};
};

export type RichTextMediaReference = {
	mediaId: number | null;
	source: string | null;
	caption: string | null;
	displayOrder: number;
};

export type RichTextLinkReference = {
	rawUrl: string;
	linkText: string | null;
	displayOrder: number;
	sourceKind: "text" | "image";
	target: RichTextLinkTarget;
};

function isRecord(value: unknown): value is RichTextJsonRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asChildren(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function normalizeString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizePositiveInteger(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string" && /^\d+$/.test(value.trim())) {
		const parsedValue = Number(value.trim());
		return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
	}

	return null;
}

function readNodeType(node: RichTextJsonRecord): string {
	return (asString(node.type) ?? "").trim().toLowerCase();
}

function readNodeFields(node: RichTextJsonRecord): RichTextJsonRecord | null {
	return isRecord(node.fields) ? node.fields : null;
}

function readNodeChildren(node: RichTextJsonRecord): unknown[] {
	return asChildren(node.children);
}

function readTextFromNode(node: RichTextJsonRecord): string {
	if (readNodeType(node) === "text") {
		return asString(node.text) ?? "";
	}

	return readNodeChildren(node)
		.map((child) => (isRecord(child) ? readTextFromNode(child) : ""))
		.join("");
}

function readImageMediaId(node: RichTextJsonRecord): number | null {
	const directMediaId =
		normalizePositiveInteger(node.mediaId) ??
		normalizePositiveInteger(node.media_id) ??
		normalizePositiveInteger(node.mediaID);

	if (directMediaId !== null) {
		return directMediaId;
	}

	const fields = readNodeFields(node);
	if (!fields) {
		return null;
	}

	return (
		normalizePositiveInteger(fields.mediaId) ??
		normalizePositiveInteger(fields.media_id) ??
		normalizePositiveInteger(fields.mediaID)
	);
}

function readImageSource(node: RichTextJsonRecord): string | null {
	const directSource = normalizeString(node.src) ?? normalizeString(node.url);

	if (directSource !== null) {
		return directSource;
	}

	const fields = readNodeFields(node);
	if (!fields) {
		return null;
	}

	return normalizeString(fields.src) ?? normalizeString(fields.url);
}

function readImageCaption(node: RichTextJsonRecord): string | null {
	const directCaption =
		normalizeString(node.alt) ?? normalizeString(node.caption);

	if (directCaption !== null) {
		return directCaption;
	}

	const fields = readNodeFields(node);
	if (!fields) {
		return null;
	}

	return normalizeString(fields.alt) ?? normalizeString(fields.caption);
}

function hasNonEmptyMediaSource(node: RichTextJsonRecord): boolean {
	return readImageSource(node) !== null || readImageMediaId(node) !== null;
}

function isNodeVisuallyEmpty(value: unknown): boolean {
	if (!isRecord(value)) {
		return true;
	}

	const nodeType = readNodeType(value);

	if (nodeType === "text") {
		return (asString(value.text) ?? "").trim().length === 0;
	}

	if (nodeType === "linebreak") {
		return true;
	}

	if (nodeType === "horizontalrule") {
		return false;
	}

	if (nodeType === "image" || nodeType === "resizable-image") {
		return !hasNonEmptyMediaSource(value);
	}

	const children = readNodeChildren(value);
	if (children.length === 0) {
		return true;
	}

	return children.every((child) => isNodeVisuallyEmpty(child));
}

function stripRootEditorOnlyFlags(
	root: RichTextJsonRecord,
): RichTextJsonRecord {
	const next: RichTextJsonRecord = { ...root };
	delete next.textFormat;
	delete next.textStyle;
	return next;
}

function normalizeLinkNode(
	node: RichTextJsonRecord,
): RichTextJsonRecord | RichTextJsonRecord[] {
	const rawChildren = readNodeChildren(node);
	const normalizedChildren: unknown[] = [];

	for (const child of rawChildren) {
		if (!isRecord(child)) {
			normalizedChildren.push(child);
			continue;
		}

		const normalizedChild = normalizeStoredNode(child);
		if (Array.isArray(normalizedChild)) {
			normalizedChildren.push(...normalizedChild);
		} else {
			normalizedChildren.push(normalizedChild);
		}
	}

	const fields = readNodeFields(node);
	const rawUrl =
		normalizeString(fields?.url) ??
		normalizeString(node.url) ??
		normalizeString(node.href);
	const opensNewTab =
		normalizeString(node.target) === "_blank" ||
		asBoolean(fields?.newTab) === true;
	const linkTarget = normalizeRichTextLinkTarget(
		fields?.linkTarget ?? node.linkTarget,
		{ href: rawUrl, newTab: opensNewTab },
	);

	if (!linkTarget) {
		return normalizedChildren.filter(isRecord);
	}

	const nextFields: RichTextJsonRecord = {
		url: richTextLinkTargetHref(linkTarget),
		linkType: linkTarget.kind,
		linkTarget,
	};

	if (richTextLinkTargetOpensNewTab(linkTarget)) {
		nextFields.newTab = true;
	}

	const nextNode: RichTextJsonRecord = {
		...node,
		type: "link",
		version: asNumber(node.version) ?? 4,
		fields: nextFields,
		children: normalizedChildren,
	};

	delete nextNode.url;
	delete nextNode.href;
	delete nextNode.target;
	delete nextNode.rel;
	delete nextNode.linkTarget;

	return nextNode;
}

function normalizeImageNode(node: RichTextJsonRecord): RichTextJsonRecord {
	const fields = readNodeFields(node);
	const linkTarget = normalizeRichTextLinkTarget(
		fields?.linkTarget ?? node.linkTarget,
	);
	const frameStyle =
		fields?.frameStyle === "border" ||
		node.frameStyle === "border" ||
		asBoolean(fields?.border ?? node.border) === true
			? "border"
			: "none";
	const nextNode: RichTextJsonRecord = {
		...node,
		version: Math.max(asNumber(node.version) ?? 1, 3),
		frameStyle,
	};

	delete nextNode.border;

	if (linkTarget) {
		nextNode.linkTarget = linkTarget;
	} else {
		delete nextNode.linkTarget;
	}

	if (fields) {
		const nextFields = { ...fields };
		delete nextFields.linkTarget;
		delete nextFields.frameStyle;
		delete nextFields.border;

		if (Object.keys(nextFields).length > 0) {
			nextNode.fields = nextFields;
		} else {
			delete nextNode.fields;
		}
	}

	return nextNode;
}

function normalizeStoredNode(
	node: RichTextJsonRecord,
): RichTextJsonRecord | RichTextJsonRecord[] {
	const nodeType = readNodeType(node);

	if (nodeType === "link" || nodeType === "richtext-link") {
		return normalizeLinkNode(node);
	}

	if (nodeType === "image" || nodeType === "resizable-image") {
		return normalizeImageNode(node);
	}

	const rawChildren = readNodeChildren(node);
	if (rawChildren.length === 0) {
		return { ...node };
	}

	const normalizedChildren: unknown[] = [];
	for (const child of rawChildren) {
		if (!isRecord(child)) {
			normalizedChildren.push(child);
			continue;
		}

		const normalizedChild = normalizeStoredNode(child);
		if (Array.isArray(normalizedChild)) {
			normalizedChildren.push(...normalizedChild);
		} else {
			normalizedChildren.push(normalizedChild);
		}
	}

	return {
		...node,
		children: normalizedChildren,
	};
}

export function createEmptyRichTextJson(): RichTextJson {
	return {
		root: {
			type: "root",
			children: [],
			version: 1,
		},
	};
}

export function isRichTextJsonRoot(value: unknown): value is RichTextJson {
	return (
		isRecord(value) &&
		isRecord(value.root) &&
		value.root.type === "root" &&
		Array.isArray(value.root.children)
	);
}

export function isRichTextJsonEmpty(value: unknown): boolean {
	if (!isRecord(value)) {
		return true;
	}

	const root = value.root;
	if (!isRecord(root)) {
		return true;
	}

	const children = readNodeChildren(root);
	if (children.length === 0) {
		return true;
	}

	return children.every((child) => isNodeVisuallyEmpty(child));
}

export function normalizeRichTextJson(value: unknown): RichTextJson | null {
	if (!isRecord(value)) {
		return null;
	}

	const root = isRecord(value.root)
		? stripRootEditorOnlyFlags(value.root)
		: null;
	if (!root) {
		return null;
	}

	const children = readNodeChildren(root);
	const normalized: RichTextJson = {
		root: {
			...root,
			type: "root",
			children,
			version: asNumber(root.version) ?? 1,
		},
	};

	return isRichTextJsonEmpty(normalized) ? null : normalized;
}

export function normalizeRichTextEditorOutput(
	value: unknown,
): RichTextJson | null {
	if (!isRecord(value)) {
		return null;
	}

	const root = isRecord(value.root)
		? stripRootEditorOnlyFlags(value.root)
		: null;
	if (!root) {
		return null;
	}

	const normalizedRoot = normalizeStoredNode(root);
	if (Array.isArray(normalizedRoot)) {
		return null;
	}

	return normalizeRichTextJson({
		...value,
		root: normalizedRoot,
	});
}

export function extractRichTextMediaReferences(
	value: unknown,
): RichTextMediaReference[] {
	const references: RichTextMediaReference[] = [];
	let imageIndex = 0;

	function visit(node: unknown): void {
		if (!isRecord(node)) {
			return;
		}

		const nodeType = readNodeType(node);
		if (nodeType === "image" || nodeType === "resizable-image") {
			imageIndex += 1;
			const mediaId = readImageMediaId(node);
			const source = readImageSource(node);

			if (mediaId !== null || source !== null) {
				references.push({
					mediaId,
					source,
					caption: readImageCaption(node),
					displayOrder: imageIndex,
				});
			}
		}

		for (const child of readNodeChildren(node)) {
			visit(child);
		}
	}

	if (isRecord(value) && isRecord(value.root)) {
		visit(value.root);
	} else {
		visit(value);
	}

	return references;
}

export function extractRichTextLinkReferences(
	value: unknown,
): RichTextLinkReference[] {
	const references: RichTextLinkReference[] = [];
	let linkIndex = 0;

	function appendReference(
		target: RichTextLinkTarget | null,
		linkText: string | null,
		sourceKind: "text" | "image",
	): void {
		if (!target) {
			return;
		}

		linkIndex += 1;
		references.push({
			rawUrl: richTextLinkTargetHref(target),
			linkText,
			displayOrder: linkIndex,
			sourceKind,
			target,
		});
	}

	function visit(node: unknown): void {
		if (!isRecord(node)) {
			return;
		}

		const nodeType = readNodeType(node);
		const fields = readNodeFields(node);

		if (nodeType === "link" || nodeType === "richtext-link") {
			const rawUrl =
				normalizeString(fields?.url) ??
				normalizeString(node.url) ??
				normalizeString(node.href);
			appendReference(
				normalizeRichTextLinkTarget(fields?.linkTarget ?? node.linkTarget, {
					href: rawUrl,
					newTab:
						normalizeString(node.target) === "_blank" ||
						asBoolean(fields?.newTab) === true,
				}),
				normalizeString(readTextFromNode(node)),
				"text",
			);
		}

		if (nodeType === "image" || nodeType === "resizable-image") {
			appendReference(
				normalizeRichTextLinkTarget(fields?.linkTarget ?? node.linkTarget),
				readImageCaption(node),
				"image",
			);
		}

		for (const child of readNodeChildren(node)) {
			visit(child);
		}
	}

	if (isRecord(value) && isRecord(value.root)) {
		visit(value.root);
	} else {
		visit(value);
	}

	return references;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
