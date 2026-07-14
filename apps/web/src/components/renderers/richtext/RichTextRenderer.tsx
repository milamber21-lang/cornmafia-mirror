//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/richtext/RichTextRenderer.tsx                                        ////
//// Language: TSX                                                                                                ////
//// RichText renderer for stored editor state with hardened URL handling.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import React from "react";
import Image from "next/image";

import { validateExternalLinkUrl } from "@/lib/data/external-link-hosts";
import {
	normalizeRichTextLexicalRoot,
	type LexicalNode,
	type LexicalRoot,
} from "@/lib/editors/richtext/rich-text-types";
import {
	normalizeRichTextLinkTarget,
	richTextLinkTargetOpensNewTab,
	type RichTextLinkTarget,
} from "@/lib/editors/richtext/rich-text-link-targets";
import {
	normalizeMediaUrlToRouteScope,
	type MediaRouteScope,
} from "@/lib/helpers/media-url";
import { normalizeStoredRichTextLinkHref } from "@/lib/links/link-policy";

const MAX_IMAGE_DIMENSION = 4096;
const FALLBACK_IMAGE_WIDTH = 1200;
const FALLBACK_IMAGE_HEIGHT = 800;
const EXTERNAL_LINK_SURFACE_SCOPES = new Set(["admin", "public"]);

type ExternalLinkSurfaceScope = "admin" | "public";
type ImageFrameStyle = "none" | "border";

type RenderContext = {
	allowedExternalHrefs: Set<string>;
	mediaRouteScope: MediaRouteScope;
};

function isObj(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function asStr(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

function asBool(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function normalizeImageFrameStyle(
	frameStyle: unknown,
	legacyBorder: unknown,
): ImageFrameStyle {
	return frameStyle === "border" || legacyBorder === true ? "border" : "none";
}

function asNum(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNumLike(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string") {
		const trimmedValue = value.trim();

		if (/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
			const parsedValue = Number(trimmedValue);
			return Number.isFinite(parsedValue) ? parsedValue : null;
		}
	}

	return null;
}

function hasControlCharacters(value: string): boolean {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);

		if ((code >= 0 && code <= 31) || code === 127) {
			return true;
		}
	}

	return false;
}

function hasWhitespace(value: string): boolean {
	return /\s/.test(value);
}

function hasBlockedEncodedPath(value: string): boolean {
	return /%2e|%2f|%5c|%00/i.test(value);
}

function normalizeStoredUrl(value: string): string | null {
	const trimmedValue = value.trim();

	if (
		trimmedValue.length === 0 ||
		hasControlCharacters(trimmedValue) ||
		hasWhitespace(trimmedValue)
	) {
		return null;
	}

	return trimmedValue;
}

function getLinkHrefFromNode(node: LexicalNode): string | null {
	const rawFields = (node as { fields?: unknown }).fields;
	const fields = isObj(rawFields)
		? (rawFields as Record<string, unknown>)
		: undefined;

	return asStr(fields?.url);
}

function getStructuredLinkTargetFromNode(
	node: LexicalNode,
): RichTextLinkTarget | null {
	const rawFields = (node as { fields?: unknown }).fields;
	const fields = isObj(rawFields)
		? (rawFields as Record<string, unknown>)
		: undefined;
	const rawTarget = fields?.linkTarget ?? node.linkTarget;

	return normalizeRichTextLinkTarget(rawTarget);
}

function collectExternalHrefCandidates(
	node: LexicalNode,
	candidates: Set<string>,
): void {
	const structuredTarget = getStructuredLinkTargetFromNode(node);
	const rawHref = structuredTarget?.href ?? getLinkHrefFromNode(node);

	if (
		node.type === "link" ||
		node.type === "image" ||
		node.type === "resizable-image"
	) {
		const candidate = normalizeStoredRichTextLinkHref(rawHref);

		if (candidate.ok && candidate.kind === "external") {
			candidates.add(candidate.href);
		}
	}

	const kids = (node as { children?: unknown }).children;
	const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];

	for (const child of children) {
		collectExternalHrefCandidates(child, candidates);
	}
}

async function buildAllowedExternalHrefSet(args: {
	value: LexicalRoot;
	surfaceScopeCode: ExternalLinkSurfaceScope;
}): Promise<Set<string>> {
	const candidates = new Set<string>();
	collectExternalHrefCandidates(args.value.root, candidates);

	if (candidates.size === 0) {
		return new Set<string>();
	}

	const allowedHrefs = new Set<string>();
	await Promise.all(
		Array.from(candidates).map(async (href) => {
			const candidate = normalizeStoredRichTextLinkHref(href);
			if (!candidate.ok || candidate.kind !== "external") {
				return;
			}

			const result = await validateExternalLinkUrl({
				rawUrl: candidate.validationInput,
				surfaceScopeCode: args.surfaceScopeCode,
			});

			if (!result.isAllowed || !result.normalizedUrl) {
				return;
			}

			const normalizedAllowedHref = normalizeStoredRichTextLinkHref(
				result.normalizedUrl,
			);

			if (normalizedAllowedHref.ok && normalizedAllowedHref.kind === "external") {
				allowedHrefs.add(normalizedAllowedHref.href);
			}
		}),
	);

	return allowedHrefs;
}

function sanitizeRichTextHref(
	value: string | null,
	context: RenderContext,
): string | null {
	const candidate = normalizeStoredRichTextLinkHref(value);

	if (!candidate.ok) {
		return null;
	}

	if (candidate.kind === "internal") {
		return candidate.href;
	}

	return context.allowedExternalHrefs.has(candidate.href)
		? candidate.href
		: null;
}

function isAllowedMediaRoute(value: string): boolean {
	return (
		value.startsWith("/api/media/file/") ||
		value.startsWith("/api/admin/web/media/file/")
	);
}

function sanitizeImageSrc(
	value: string | null,
	context: RenderContext,
): string | null {
	if (!value) {
		return null;
	}

	const normalizedValue = normalizeStoredUrl(value);

	if (!normalizedValue) {
		return null;
	}

	if (
		normalizedValue.includes("?") ||
		normalizedValue.includes("#") ||
		normalizedValue.includes("\\") ||
		hasBlockedEncodedPath(normalizedValue) ||
		/(^|\/)\.\.(\/|$)/.test(normalizedValue)
	) {
		return null;
	}

	try {
		const scopedUrl = normalizeMediaUrlToRouteScope(
			normalizedValue,
			context.mediaRouteScope,
		);

		if (isAllowedMediaRoute(scopedUrl)) {
			return scopedUrl;
		}
	} catch {
		return null;
	}

	return null;
}

function isExternalHref(href: string): boolean {
	return href.startsWith("https://");
}

function clampImageDimension(value: number | null): number | null {
	if (value === null) {
		return null;
	}

	const roundedValue = Math.round(value);

	if (roundedValue <= 0) {
		return null;
	}

	return Math.min(roundedValue, MAX_IMAGE_DIMENSION);
}

type AlignKeyword =
	| "left"
	| "right"
	| "center"
	| "start"
	| "end"
	| "justify"
	| "";
type ResolvedAlign = "left" | "right" | "center" | "justify";
type WrapValue = "wrap" | "no-wrap";

type RuntimeCssVariables = React.CSSProperties &
	Partial<
		Record<
			| "--richtext-rendered-img-width"
			| "--richtext-rendered-img-height"
			| "--rt-indent-size",
			string
		>
	>;

function getBlockAlign(node: LexicalNode): ResolvedAlign | undefined {
	const format = (node as { format?: unknown }).format;

	if (typeof format !== "string") {
		return undefined;
	}

	const value = format as AlignKeyword;

	if (value === "left" || value === "start" || value === "") {
		return "left";
	}

	if (value === "right" || value === "end") {
		return "right";
	}

	if (value === "center") {
		return "center";
	}

	if (value === "justify") {
		return "justify";
	}

	return undefined;
}

function alignClassForBlocks(node: LexicalNode): string | undefined {
	const align = getBlockAlign(node);

	if (!align) {
		return undefined;
	}

	if (align === "left") {
		return "rt-align-left";
	}

	if (align === "right") {
		return "rt-align-right";
	}

	if (align === "center") {
		return "rt-align-center";
	}

	if (align === "justify") {
		return "rt-align-justify";
	}

	return undefined;
}

function getBlockIndentLevel(node: LexicalNode): number {
	const level = asNum((node as { indent?: unknown }).indent) ?? 0;
	return level > 0 ? level : 0;
}

function indentClassForBlocks(node: LexicalNode): string | undefined {
	return getBlockIndentLevel(node) > 0 ? "rt-indent" : undefined;
}

function indentStyleForBlocks(
	node: LexicalNode,
): React.CSSProperties | undefined {
	const level = getBlockIndentLevel(node);

	if (level === 0) {
		return undefined;
	}

	const style: RuntimeCssVariables = {
		"--rt-indent-size": `${level * 1.5}rem`,
	};
	return style;
}

function classNames(
	...values: Array<string | undefined | false>
): string | undefined {
	const classes = values.filter((value): value is string => Boolean(value));
	return classes.length > 0 ? classes.join(" ") : undefined;
}

function renderedImageStyle(
	width: number | null,
	height: number | null,
): React.CSSProperties | undefined {
	if (width === null && height === null) {
		return undefined;
	}

	const style: RuntimeCssVariables = {};

	if (width !== null) {
		style["--richtext-rendered-img-width"] = `${width}px`;
	}

	if (height !== null) {
		style["--richtext-rendered-img-height"] = `${height}px`;
	}

	return style;
}

function renderInline(
	node: LexicalNode,
	context: RenderContext,
): React.ReactNode {
	if (node.type === "text") {
		const text = (node as { text?: unknown }).text;
		const rawText = typeof text === "string" ? text : "";
		const format = asNum((node as { format?: unknown }).format) ?? 0;

		let element: React.ReactNode = rawText;

		if ((format & 1) === 1) {
			element = <strong className="rt-bold">{element}</strong>;
		}

		if ((format & 2) === 2) {
			element = <em className="rt-italic">{element}</em>;
		}

		if ((format & 8) === 8) {
			element = <u className="rt-underline">{element}</u>;
		}

		if ((format & 4) === 4) {
			element = <s className="rt-strike">{element}</s>;
		}

		if ((format & 16) === 16) {
			element = <code className="rt-code">{element}</code>;
		}

		if ((format & 32) === 32) {
			element = <sub className="rt-sub">{element}</sub>;
		}

		if ((format & 64) === 64) {
			element = <sup className="rt-sup">{element}</sup>;
		}

		return element;
	}

	if (node.type === "linebreak") {
		return <br className="rt-br" />;
	}

	if (node.type === "link") {
		const rawFields = (node as { fields?: unknown }).fields;
		const fields = isObj(rawFields)
			? (rawFields as Record<string, unknown>)
			: undefined;
		const href = sanitizeRichTextHref(asStr(fields?.url), context);
		const newTab = asBool(fields?.newTab) === true;
		const kids = (node as { children?: unknown }).children;
		const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];
		const renderedChildren = children.map((child, index) => (
			<span key={index}>{renderInline(child, context)}</span>
		));

		if (!href) {
			return <span className="rt-link rt-link-unsafe">{renderedChildren}</span>;
		}

		const externalHref = isExternalHref(href);
		const target = newTab ? "_blank" : undefined;
		const rel = newTab || externalHref ? "noopener noreferrer" : undefined;
		const referrerPolicy = externalHref
			? "strict-origin-when-cross-origin"
			: undefined;

		return (
			<a
				href={href}
				target={target}
				rel={rel}
				referrerPolicy={referrerPolicy}
				className="rt-link"
			>
				{renderedChildren}
			</a>
		);
	}

	const kids = (node as { children?: unknown }).children;
	const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];

	return children.map((child, index) => (
		<span key={index}>{renderInline(child, context)}</span>
	));
}

function renderInlineImage(
	node: LexicalNode,
	key: React.Key | undefined,
	context: RenderContext,
): React.ReactNode {
	const rawFields = (node as { fields?: unknown }).fields;
	const fields = isObj(rawFields)
		? (rawFields as Record<string, unknown>)
		: (node as unknown as Record<string, unknown>);

	const src = sanitizeImageSrc(asStr(fields.src) ?? asStr(fields.url), context);

	if (!src) {
		return null;
	}

	const alt = asStr(fields.alt) ?? "";
	const savedWidth = clampImageDimension(asNumLike(fields.width));
	const savedHeight = clampImageDimension(asNumLike(fields.height));
	const rawAlign = asStr(fields.align);
	const align: "left" | "right" | "center" =
		rawAlign === "left" || rawAlign === "right" ? rawAlign : "center";
	const rawWrap = asStr(fields.wrap);
	const frameStyle = normalizeImageFrameStyle(fields.frameStyle, fields.border);
	const wrap: WrapValue =
		rawWrap === "wrap" || rawWrap === "no-wrap"
			? rawWrap
			: align === "center"
				? "no-wrap"
				: "wrap";
	const classes: string[] = ["richtext-img"];

	if (wrap === "wrap") {
		classes.push("is-wrap");
	}

	classes.push(
		align === "left" ? "is-left" : align === "right" ? "is-right" : "is-center",
	);

	if (frameStyle === "border") {
		classes.push("has-border");
	}

	const intrinsicWidth = savedWidth ?? FALLBACK_IMAGE_WIDTH;
	const intrinsicHeight = savedHeight ?? FALLBACK_IMAGE_HEIGHT;
	const imageStyle = renderedImageStyle(savedWidth, savedHeight);
	const sizesAttribute = savedWidth ? `${savedWidth}px` : "100vw";
	const linkTarget = getStructuredLinkTargetFromNode(node);
	const linkHref = linkTarget
		? sanitizeRichTextHref(linkTarget.href, context)
		: null;
	const openInNewTab = linkTarget
		? richTextLinkTargetOpensNewTab(linkTarget)
		: false;
	const externalHref = linkHref ? isExternalHref(linkHref) : false;
	const image = (
		<Image
			unoptimized
			src={src}
			alt={alt}
			width={intrinsicWidth}
			height={intrinsicHeight}
			sizes={sizesAttribute}
			priority={false}
			draggable={false}
			className="richtext-img__image"
			style={imageStyle}
		/>
	);

	return (
		<span
			key={key}
			className={classes.join(" ")}
			data-lexical-image="container"
			data-frame-style={frameStyle}
			data-richtext-link-kind={linkTarget?.kind}
			contentEditable={false}
		>
			{linkHref ? (
				<a
					href={linkHref}
					target={openInNewTab ? "_blank" : undefined}
					rel={openInNewTab || externalHref ? "noopener noreferrer" : undefined}
					referrerPolicy={
						externalHref ? "strict-origin-when-cross-origin" : undefined
					}
					className="richtext-img__link"
				>
					{image}
				</a>
			) : (
				image
			)}
		</span>
	);
}

function hasMeaningfulInline(inlineNodes: LexicalNode[]): boolean {
	for (const node of inlineNodes) {
		if (node.type === "text") {
			const text = (node as { text?: unknown }).text;

			if (typeof text === "string" && text.trim().length > 0) {
				return true;
			}
		}

		if (node.type === "link") {
			const kids = (node as { children?: unknown }).children;

			if (Array.isArray(kids) && kids.length > 0) {
				return true;
			}
		}
	}

	return false;
}

function renderListItem(
	node: LexicalNode,
	isChecklist: boolean,
	key: React.Key | undefined,
	context: RenderContext,
): React.ReactNode {
	const rawKids = (node as { children?: unknown }).children;
	const kids = Array.isArray(rawKids) ? (rawKids as LexicalNode[]) : [];
	const inlineNodes: LexicalNode[] = [];
	const nestedLists: LexicalNode[] = [];

	for (const child of kids) {
		if (isObj(child) && (child as LexicalNode).type === "list") {
			nestedLists.push(child as LexicalNode);
		} else {
			inlineNodes.push(child as LexicalNode);
		}
	}

	const inlineHasText = hasMeaningfulInline(inlineNodes);
	const inlineContent = inlineHasText ? (
		<span className="rt-li-content">
			{inlineNodes.map((child, index) => (
				<span key={index}>{renderInline(child, context)}</span>
			))}
		</span>
	) : null;
	const nestedContent = nestedLists.map((listNode, index) => (
		<React.Fragment key={`nested-list-${index}`}>
			{renderBlock(listNode, undefined, context)}
		</React.Fragment>
	));

	if (isChecklist) {
		const checked = asBool((node as { checked?: unknown }).checked) ?? false;
		const classes = [
			"rt-li",
			checked ? "rt-li-checked" : "rt-li-unchecked",
			!inlineHasText ? "rt-li-empty" : "",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<li
				key={key}
				className={classNames(classes, "rt-li-no-marker")}
				role="listitem"
				data-checked={checked ? "true" : "false"}
			>
				{inlineContent}
				{nestedContent}
			</li>
		);
	}

	return (
		<li
			key={key}
			className={classNames(
				"rt-li",
				!inlineHasText && "rt-li-empty",
				!inlineHasText && "rt-li-no-marker",
			)}
			role="listitem"
		>
			{inlineContent}
			{nestedContent}
		</li>
	);
}

function renderBlock(
	node: LexicalNode,
	key: React.Key | undefined,
	context: RenderContext,
): React.ReactNode {
	if (node.type === "image" || node.type === "resizable-image") {
		return renderInlineImage(node, key, context);
	}

	const style = node.type === "list" ? undefined : indentStyleForBlocks(node);

	switch (node.type) {
		case "root": {
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];

			return (
				<>
					{children.map((child, index) => (
						<div key={index}>{renderBlock(child, index, context)}</div>
					))}
				</>
			);
		}

		case "paragraph": {
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];
			const className = classNames(
				alignClassForBlocks(node),
				indentClassForBlocks(node),
			);

			return (
				<p key={key} className={className} style={style}>
					{children.map((child, index) => {
						if (child.type === "image" || child.type === "resizable-image") {
							return (
								<React.Fragment key={index}>
									{renderInlineImage(child, index, context)}
								</React.Fragment>
							);
						}

						return <span key={index}>{renderInline(child, context)}</span>;
					})}
				</p>
			);
		}

		case "horizontalrule":
			return (
				<hr
					key={key}
					className={classNames("rt-hr", indentClassForBlocks(node))}
					style={style}
				/>
			);

		case "heading": {
			const rawTag = (node as { tag?: unknown }).tag;
			const tag = typeof rawTag === "string" ? rawTag.toLowerCase() : "h2";
			const allowedTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
			const Tag: React.ElementType = allowedTags.has(tag)
				? (tag as React.ElementType)
				: "h2";
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];
			const className = classNames(
				alignClassForBlocks(node),
				indentClassForBlocks(node),
			);

			return React.createElement(
				Tag,
				{ key, className, style },
				children.map((child, index) => (
					<span key={index}>{renderInline(child, context)}</span>
				)),
			);
		}

		case "list": {
			const listType = asStr((node as { listType?: unknown }).listType) ?? "";
			const rawTag = asStr((node as { tag?: unknown }).tag) ?? "";
			const isChecklist = listType === "check";
			const isNumber = listType === "number" || rawTag === "ol";
			const start = asNum((node as { start?: unknown }).start) ?? 1;
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];

			if (isChecklist) {
				return (
					<ul key={key} className="rt-ul rt-ul-checklist" role="list">
						{children.map((listItem, index) =>
							renderListItem(listItem, true, index, context),
						)}
					</ul>
				);
			}

			if (isNumber) {
				const orderedListProps: React.OlHTMLAttributes<HTMLOListElement> = {
					className: "rt-ol",
					role: "list",
				};

				if (start && start !== 1) {
					orderedListProps.start = start;
				}

				return (
					<ol key={key} {...orderedListProps}>
						{children.map((listItem, index) =>
							renderListItem(listItem, false, index, context),
						)}
					</ol>
				);
			}

			return (
				<ul key={key} className="rt-ul" role="list">
					{children.map((listItem, index) =>
						renderListItem(listItem, false, index, context),
					)}
				</ul>
			);
		}

		case "listitem":
			return renderListItem(node, false, key, context);

		case "quote": {
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];

			return (
				<blockquote
					key={key}
					className={classNames("rt-quote", indentClassForBlocks(node))}
					style={style}
				>
					{children.map((child, index) => (
						<span key={index}>{renderInline(child, context)}</span>
					))}
				</blockquote>
			);
		}

		default: {
			const kids = (node as { children?: unknown }).children;
			const children = Array.isArray(kids) ? (kids as LexicalNode[]) : [];
			const className = classNames(
				alignClassForBlocks(node),
				indentClassForBlocks(node),
			);

			return (
				<div key={key} className={className} style={style}>
					{children.map((child, index) => (
						<span key={index}>{renderInline(child, context)}</span>
					))}
				</div>
			);
		}
	}
}

export type RichTextRendererProps = {
	value: unknown;
	externalLinkSurfaceScope?: ExternalLinkSurfaceScope;
	mediaRouteScope?: MediaRouteScope;
	proseVariant?: "main" | "aside" | "default";
};

export default async function RichTextRenderer({
	value,
	externalLinkSurfaceScope = "public",
	mediaRouteScope = "app",
	proseVariant = "default",
}: RichTextRendererProps) {
	const normalizedValue = normalizeRichTextLexicalRoot(value);
	if (!normalizedValue?.root) {
		return null;
	}

	const surfaceScope = EXTERNAL_LINK_SURFACE_SCOPES.has(externalLinkSurfaceScope)
		? externalLinkSurfaceScope
		: "public";
	const context: RenderContext = {
		allowedExternalHrefs: await buildAllowedExternalHrefSet({
			value: normalizedValue,
			surfaceScopeCode: surfaceScope,
		}),
		mediaRouteScope,
	};

	const proseClassName =
		proseVariant === "main"
			? "content-prose--main"
			: proseVariant === "aside"
				? "content-prose--aside"
				: "content-prose--default";

	return (
		<div className={`richtext content-prose ${proseClassName}`}>
			{renderBlock(normalizedValue.root, undefined, context)}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
