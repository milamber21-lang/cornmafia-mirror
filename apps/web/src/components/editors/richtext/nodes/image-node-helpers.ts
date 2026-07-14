//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/image-node-helpers.ts                                  ////
//// Language: TS                                                                                                 ////
//// Pure helpers for rich-text image sizing, moving, preview, and writable-node narrowing.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { CSSProperties } from "react";
import type { LexicalNode } from "lexical";
import type {
	ImageAlign,
	ImageFrameStyle,
	ImageMoveDropPreview,
	ImageMoveMode,
	ImageSize,
	ImageWrap,
} from "./image-node-types";

export const IMAGE_MIN_WIDTH = 80;
export const IMAGE_FALLBACK_MAX_WIDTH = 1236;

export type ImageNodeWritable = LexicalNode & {
	setAlign: (align: ImageAlign) => void;
	setWrap: (wrap: ImageWrap) => void;
	setFrameStyle: (frameStyle: ImageFrameStyle) => void;
	setSize: (width: number, height?: number) => void;
};

export function isImageNodeWritable(
	node: LexicalNode | null | undefined,
): node is ImageNodeWritable {
	return (
		Boolean(node) &&
		typeof (node as { setAlign?: unknown }).setAlign === "function" &&
		typeof (node as { setWrap?: unknown }).setWrap === "function" &&
		typeof (node as { setFrameStyle?: unknown }).setFrameStyle === "function" &&
		typeof (node as { setSize?: unknown }).setSize === "function"
	);
}

export function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

export function isPositiveFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function normalizeImageSize(width: unknown, height: unknown): ImageSize {
	return {
		width: isPositiveFiniteNumber(width) ? Math.floor(width) : undefined,
		height: isPositiveFiniteNumber(height) ? Math.floor(height) : undefined,
	};
}

export function readDisplayWidth(
	host: HTMLElement | null,
	fallback: number | undefined,
): number {
	if (host) {
		const image = host.querySelector("img");
		const measured = image?.getBoundingClientRect().width ?? 0;

		if (measured > 0) {
			return Math.floor(measured);
		}
	}

	return isPositiveFiniteNumber(fallback) ? Math.floor(fallback) : 200;
}

export function resolveMaxResizeWidth(host: HTMLElement | null): number {
	if (!host) {
		return IMAGE_FALLBACK_MAX_WIDTH;
	}

	const editorCanvas = host.closest(".richtext-editor-canvas");
	const editorCanvasWidth = editorCanvas?.getBoundingClientRect().width ?? 0;

	if (editorCanvasWidth > 0) {
		return Math.max(IMAGE_MIN_WIDTH, Math.floor(editorCanvasWidth));
	}

	const richTextHost = host.closest(".richtext");
	const richTextWidth = richTextHost?.getBoundingClientRect().width ?? 0;

	if (richTextWidth > 0) {
		return Math.max(IMAGE_MIN_WIDTH, Math.floor(richTextWidth));
	}

	const parentWidth = host.parentElement?.getBoundingClientRect().width ?? 0;

	if (parentWidth > 0) {
		return Math.max(IMAGE_MIN_WIDTH, Math.floor(parentWidth));
	}

	return IMAGE_FALLBACK_MAX_WIDTH;
}

export function calculateHeight(
	width: number,
	aspectRatio: number | undefined,
): number | undefined {
	if (!isPositiveFiniteNumber(aspectRatio)) {
		return undefined;
	}

	return Math.max(1, Math.round(width * aspectRatio));
}

export function resolveMoveMode(
	rootRect: DOMRect,
	clientX: number,
): ImageMoveMode {
	const safeWidth = Math.max(1, rootRect.width);
	const ratio = (clientX - rootRect.left) / safeWidth;

	if (ratio < 0.34) {
		return "left-wrap";
	}

	if (ratio > 0.66) {
		return "right-wrap";
	}

	return "center-block";
}

export function resolveMoveDropPreview(
	rootElement: HTMLElement | null,
	clientX: number,
	clientY: number,
): ImageMoveDropPreview | null {
	if (!rootElement) {
		return null;
	}

	const rootRect = rootElement.getBoundingClientRect();
	const childElements = Array.from(rootElement.children).filter(
		(child): child is HTMLElement => child instanceof HTMLElement,
	);
	const mode = resolveMoveMode(rootRect, clientX);

	if (childElements.length === 0) {
		return {
			mode,
			dropIndex: 0,
			rootLeft: rootRect.left,
			rootWidth: rootRect.width,
			lineTop: rootRect.top + 8,
		};
	}

	for (let index = 0; index < childElements.length; index += 1) {
		const rect = childElements[index].getBoundingClientRect();

		if (clientY < rect.top + rect.height / 2) {
			return {
				mode,
				dropIndex: index,
				rootLeft: rootRect.left,
				rootWidth: rootRect.width,
				lineTop: rect.top,
			};
		}
	}

	const lastRect =
		childElements[childElements.length - 1].getBoundingClientRect();
	return {
		mode,
		dropIndex: childElements.length,
		rootLeft: rootRect.left,
		rootWidth: rootRect.width,
		lineTop: lastRect.bottom,
	};
}

export function applyMoveMode(
	node: ImageNodeWritable,
	mode: ImageMoveMode,
): void {
	if (mode === "center-block") {
		node.setAlign("center");
		node.setWrap("no-wrap");
		return;
	}

	if (mode === "right-wrap") {
		node.setAlign("right");
		node.setWrap("wrap");
		return;
	}

	node.setAlign("left");
	node.setWrap("wrap");
}

export function readMoveLabel(mode: ImageMoveMode): string {
	if (mode === "center-block") {
		return "Center block";
	}

	if (mode === "right-wrap") {
		return "Right wrap";
	}

	return "Left wrap";
}

export function readRenderedImageSize(
	host: HTMLElement | null,
	fallback: ImageSize,
): { width: number; height: number } {
	const image = host?.querySelector("img");
	const rect = image?.getBoundingClientRect();
	const measuredWidth = rect?.width ?? 0;
	const measuredHeight = rect?.height ?? 0;

	if (measuredWidth > 0 && measuredHeight > 0) {
		return {
			width: Math.max(1, Math.floor(measuredWidth)),
			height: Math.max(1, Math.floor(measuredHeight)),
		};
	}

	const width = isPositiveFiniteNumber(fallback.width)
		? Math.max(1, Math.floor(fallback.width))
		: 200;
	const height = isPositiveFiniteNumber(fallback.height)
		? Math.max(1, Math.floor(fallback.height))
		: Math.max(1, Math.round(width * 0.67));

	return { width, height };
}

export function resolveMovePreviewBoxStyle(
	preview: ImageMoveDropPreview,
	imageSize: { width: number; height: number },
): CSSProperties {
	const outerPadding = 16;
	const availableWidth = Math.max(
		IMAGE_MIN_WIDTH,
		Math.floor(preview.rootWidth - outerPadding * 2),
	);
	const width = Math.max(
		IMAGE_MIN_WIDTH,
		Math.min(imageSize.width, availableWidth),
	);
	const height = Math.max(40, imageSize.height);
	let left = preview.rootLeft + outerPadding;

	if (preview.mode === "center-block") {
		left =
			preview.rootLeft +
			Math.max(outerPadding, Math.floor((preview.rootWidth - width) / 2));
	} else if (preview.mode === "right-wrap") {
		left =
			preview.rootLeft +
			Math.max(outerPadding, Math.floor(preview.rootWidth - width - outerPadding));
	}

	return {
		left,
		top: preview.lineTop + 12,
		width,
		height,
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
