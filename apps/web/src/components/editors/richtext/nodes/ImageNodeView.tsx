//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/ImageNodeView.tsx                                      ////
//// Language: TSX                                                                                                ////
//// Editor-facing rendered view for the rich-text image node, including resize and move controls.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import type { LexicalNode } from "lexical";
import {
	$createParagraphNode,
	$getNodeByKey,
	$getRoot,
	CLICK_COMMAND,
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	KEY_ENTER_COMMAND,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { Button } from "@/components/ui/basic-elements/Button";
import IconRender from "@/components/ui/IconRender";
import {
	IMAGE_MIN_WIDTH,
	applyMoveMode,
	calculateHeight,
	clamp,
	isImageNodeWritable,
	isPositiveFiniteNumber,
	normalizeImageSize,
	readDisplayWidth,
	readMoveLabel,
	readRenderedImageSize,
	resolveMaxResizeWidth,
	resolveMoveDropPreview,
	resolveMovePreviewBoxStyle,
} from "./image-node-helpers";
import type {
	ImageAlign,
	ImageFrameStyle,
	ImageMoveDropPreview,
	ImageNodeViewProps,
	ImageSize,
	ImageWrap,
	ResizeEdge,
	ResizeSession,
} from "./image-node-types";

/** narrow helper shapes for optional Lexical node capabilities */
type InsertAfterCapable = { insertAfter?: (node: LexicalNode) => void };
type SelectCapable = { select?: () => void };
type NextSiblingCapable = { getNextSibling?: () => LexicalNode | null };

type ImageNodeRuntimeStyle = React.CSSProperties & {
	"--richtext-img-width"?: string;
	"--richtext-img-height"?: string;
	"--richtext-drop-guide-left"?: string;
	"--richtext-drop-guide-top"?: string;
	"--richtext-drop-guide-width"?: string;
	"--richtext-drop-preview-left"?: string;
	"--richtext-drop-preview-top"?: string;
	"--richtext-drop-preview-width"?: string;
	"--richtext-drop-preview-height"?: string;
};

function formatCssLength(
	value: number | string | undefined,
): string | undefined {
	if (typeof value === "number") {
		return `${value}px`;
	}

	if (typeof value === "string") {
		return value;
	}

	return undefined;
}

function buildImageRuntimeStyle(displaySize: ImageSize): ImageNodeRuntimeStyle {
	return {
		"--richtext-img-width": formatCssLength(displaySize.width),
		"--richtext-img-height": formatCssLength(displaySize.height) ?? "auto",
	};
}

function buildDropGuideRuntimeStyle(
	preview: ImageMoveDropPreview,
): ImageNodeRuntimeStyle {
	return {
		"--richtext-drop-guide-left": `${preview.rootLeft}px`,
		"--richtext-drop-guide-top": `${preview.lineTop}px`,
		"--richtext-drop-guide-width": `${preview.rootWidth}px`,
	};
}

function buildDropPreviewRuntimeStyle(
	preview: ImageMoveDropPreview,
	imageSize: { width: number; height: number },
): ImageNodeRuntimeStyle {
	const style = resolveMovePreviewBoxStyle(preview, imageSize);

	return {
		"--richtext-drop-preview-left": formatCssLength(style.left),
		"--richtext-drop-preview-top": formatCssLength(style.top),
		"--richtext-drop-preview-width": formatCssLength(style.width),
		"--richtext-drop-preview-height": formatCssLength(style.height),
	};
}

export function ImageNodeView(props: ImageNodeViewProps): React.ReactElement {
	const {
		src,
		mediaId,
		alt,
		width,
		height,
		align = "center",
		wrap = "no-wrap",
		frameStyle = "none",
		linkTarget,
		nodeKey,
	} = props;

	const containerRef = React.useRef<HTMLSpanElement | null>(null);
	const activeHandleRef = React.useRef<HTMLDivElement | null>(null);
	const resizeSessionRef = React.useRef<ResizeSession | null>(null);
	const moveDropPreviewRef = React.useRef<ImageMoveDropPreview | null>(null);
	const animationFrameRef = React.useRef<number | null>(null);
	const pendingSizeRef = React.useRef<ImageSize | null>(null);
	const [displaySize, setDisplaySize] = React.useState<ImageSize>(() =>
		normalizeImageSize(width, height),
	);
	const [dragging, setDragging] = React.useState(false);
	const [moving, setMoving] = React.useState(false);
	const [moveDropPreview, setMoveDropPreview] =
		React.useState<ImageMoveDropPreview | null>(null);
	const [editor] = useLexicalComposerContext();

	const movePreviewSize = readRenderedImageSize(
		containerRef.current,
		displaySize,
	);

	const [isSelected, setSelected, clearSelection] =
		useLexicalNodeSelection(nodeKey);

	const editable = React.useMemo(() => {
		try {
			return (
				(editor as unknown as { isEditable?: () => boolean }).isEditable?.() ?? true
			);
		} catch {
			return true;
		}
	}, [editor]);

	const effectiveWrap: ImageWrap = align === "center" ? "no-wrap" : wrap;

	const displaySizeRef = React.useRef<ImageSize>(displaySize);
	React.useEffect(() => {
		displaySizeRef.current = displaySize;
	}, [displaySize]);

	React.useEffect(() => {
		if (!resizeSessionRef.current) {
			setDisplaySize(normalizeImageSize(width, height));
		}
	}, [height, width]);

	React.useEffect(() => {
		return () => {
			if (animationFrameRef.current !== null) {
				window.cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	React.useEffect(() => {
		const wrapper = containerRef.current;
		const parent = wrapper?.parentElement ?? null;

		return mergeRegister(
			editor.registerCommand<MouseEvent>(
				CLICK_COMMAND,
				(event) => {
					const t = event.target as Node | null;
					if (!t) return false;
					const hitWrapper = Boolean(wrapper && wrapper.contains(t));
					const hitParent = Boolean(parent && parent.contains(t));
					if (!hitWrapper && !hitParent) return false;

					if (!event.shiftKey) clearSelection();
					setSelected(true);
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_DELETE_COMMAND,
				(event) => {
					if (!isSelected) return false;
					const n = $getNodeByKey(nodeKey);
					if (n) {
						event.preventDefault();
						n.remove();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_BACKSPACE_COMMAND,
				(event) => {
					if (!isSelected) return false;
					const n = $getNodeByKey(nodeKey);
					if (n) {
						event.preventDefault();
						n.remove();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand<KeyboardEvent>(
				KEY_ENTER_COMMAND,
				(event) => {
					if (!isSelected) return false;
					event.preventDefault();
					editor.update(() => {
						const n =
							($getNodeByKey(nodeKey) as
								| (LexicalNode & InsertAfterCapable & SelectCapable)
								| null) ?? null;
						if (!n) return;
						const p = $createParagraphNode();
						n.insertAfter?.(p);
						p.select?.();
					});
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}, [editor, nodeKey, isSelected, clearSelection, setSelected]);

	React.useEffect(() => {
		const parent = containerRef.current?.parentElement ?? null;
		if (!parent) return;
		if (isSelected) parent.classList.add("is-selected");
		else parent.classList.remove("is-selected");
	}, [isSelected]);

	React.useEffect(() => {
		if (!editable || !isSelected) return;
		editor.update(() => {
			const node =
				($getNodeByKey(nodeKey) as
					| (LexicalNode & NextSiblingCapable & InsertAfterCapable & SelectCapable)
					| null) ?? null;
			if (!node) return;
			const next = node.getNextSibling?.() ?? null;
			if (!next) {
				const p = $createParagraphNode();
				node.insertAfter?.(p);
				p.select?.();
			}
		});
	}, [editable, isSelected, editor, nodeKey]);

	const resizeEdge: ResizeEdge = align === "right" ? "left" : "right";

	const wrapperClass = React.useMemo(() => {
		const parts: string[] = ["richtext-img"];
		if (effectiveWrap === "wrap") parts.push("is-wrap");
		if (align === "left") parts.push("is-left");
		else if (align === "right") parts.push("is-right");
		else parts.push("is-center");
		if (isSelected) parts.push("is-selected");
		if (frameStyle === "border") parts.push("has-border");
		if (linkTarget) parts.push("is-linked");
		if (moving) parts.push("is-moving");
		return parts.join(" ");
	}, [align, effectiveWrap, frameStyle, isSelected, linkTarget, moving]);

	const resizeHandleClass = `richtext-img-resize-handle is-${resizeEdge}${
		dragging ? " is-dragging" : ""
	}`;

	const scheduleDisplaySize = React.useCallback((nextSize: ImageSize) => {
		pendingSizeRef.current = nextSize;

		if (animationFrameRef.current !== null) {
			return;
		}

		animationFrameRef.current = window.requestAnimationFrame(() => {
			animationFrameRef.current = null;
			const pending = pendingSizeRef.current;
			pendingSizeRef.current = null;

			if (pending) {
				setDisplaySize(pending);
			}
		});
	}, []);

	const onPointerDownHandle = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}

			const host = containerRef.current;
			const startWidth = readDisplayWidth(host, displaySizeRef.current.width);
			const startHeight = displaySizeRef.current.height;
			const aspectRatio =
				isPositiveFiniteNumber(startHeight) && startWidth > 0
					? startHeight / startWidth
					: undefined;

			resizeSessionRef.current = {
				pointerId: event.pointerId,
				startClientX: event.clientX,
				startWidth,
				aspectRatio,
				maxWidth: resolveMaxResizeWidth(host),
				edge: resizeEdge,
			};

			activeHandleRef.current = event.currentTarget;
			event.currentTarget.setPointerCapture(event.pointerId);
			setDragging(true);
			event.preventDefault();
			event.stopPropagation();
		},
		[resizeEdge],
	);

	const updateMovePreview = React.useCallback(
		(clientX: number, clientY: number): void => {
			const rootElement =
				(
					editor as unknown as { getRootElement?: () => HTMLElement | null }
				).getRootElement?.() ?? null;
			const nextPreview = resolveMoveDropPreview(rootElement, clientX, clientY);

			moveDropPreviewRef.current = nextPreview;
			setMoveDropPreview(nextPreview);
		},
		[editor],
	);

	const onPointerDownMove = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}

			clearSelection();
			setSelected(true);
			activeHandleRef.current = event.currentTarget;
			event.currentTarget.setPointerCapture(event.pointerId);
			setMoving(true);
			updateMovePreview(event.clientX, event.clientY);
			event.preventDefault();
			event.stopPropagation();
		},
		[clearSelection, setSelected, updateMovePreview],
	);

	React.useEffect(() => {
		if (!moving) {
			return;
		}

		const finishMove = (event: PointerEvent): void => {
			const handle = activeHandleRef.current;
			activeHandleRef.current = null;

			if (handle?.hasPointerCapture(event.pointerId)) {
				handle.releasePointerCapture(event.pointerId);
			}

			const preview = moveDropPreviewRef.current;
			moveDropPreviewRef.current = null;
			setMoveDropPreview(null);
			setMoving(false);

			if (!preview) {
				return;
			}

			editor.update(() => {
				const node = $getNodeByKey(nodeKey);

				if (!isImageNodeWritable(node)) {
					return;
				}

				applyMoveMode(node, preview.mode);

				const root = $getRoot();
				const children = root.getChildren();
				const currentIndex = children.findIndex(
					(child) => child.getKey() === nodeKey,
				);
				const remaining = children.filter((child) => child.getKey() !== nodeKey);
				let nextIndex = Math.min(Math.max(0, preview.dropIndex), remaining.length);

				if (currentIndex >= 0 && currentIndex < preview.dropIndex) {
					nextIndex = Math.max(0, nextIndex - 1);
				}

				const target = remaining[nextIndex] ?? null;

				if (target) {
					target.insertBefore(node);
				} else {
					root.append(node);
				}
			});
		};

		const moveImage = (event: PointerEvent): void => {
			updateMovePreview(event.clientX, event.clientY);
			event.preventDefault();
		};

		window.addEventListener("pointermove", moveImage);
		window.addEventListener("pointerup", finishMove);
		window.addEventListener("pointercancel", finishMove);

		return () => {
			window.removeEventListener("pointermove", moveImage);
			window.removeEventListener("pointerup", finishMove);
			window.removeEventListener("pointercancel", finishMove);
		};
	}, [editor, moving, nodeKey, updateMovePreview]);

	React.useEffect(() => {
		if (!dragging) {
			return;
		}

		const finishResize = (event: PointerEvent): void => {
			const session = resizeSessionRef.current;

			if (!session || event.pointerId !== session.pointerId) {
				return;
			}

			resizeSessionRef.current = null;
			setDragging(false);

			const handle = activeHandleRef.current;
			activeHandleRef.current = null;

			if (handle?.hasPointerCapture(event.pointerId)) {
				handle.releasePointerCapture(event.pointerId);
			}

			const latest = pendingSizeRef.current ?? displaySizeRef.current;
			const latestWidth = latest.width;
			const latestHeight = latest.height;
			pendingSizeRef.current = null;

			if (animationFrameRef.current !== null) {
				window.cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}

			setDisplaySize(latest);

			if (typeof latestWidth === "number") {
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if (isImageNodeWritable(node)) {
						if (typeof latestHeight === "number") {
							node.setSize(latestWidth, latestHeight);
						} else {
							node.setSize(latestWidth);
						}
					}
				});
			}
		};

		const moveResize = (event: PointerEvent): void => {
			const session = resizeSessionRef.current;

			if (!session || event.pointerId !== session.pointerId) {
				return;
			}

			const delta = event.clientX - session.startClientX;
			const signedDelta = session.edge === "left" ? -delta : delta;
			const nextWidth = Math.floor(
				clamp(session.startWidth + signedDelta, IMAGE_MIN_WIDTH, session.maxWidth),
			);
			const nextHeight = calculateHeight(nextWidth, session.aspectRatio);

			scheduleDisplaySize({ width: nextWidth, height: nextHeight });
			event.preventDefault();
		};

		window.addEventListener("pointermove", moveResize);
		window.addEventListener("pointerup", finishResize);
		window.addEventListener("pointercancel", finishResize);

		return () => {
			window.removeEventListener("pointermove", moveResize);
			window.removeEventListener("pointerup", finishResize);
			window.removeEventListener("pointercancel", finishResize);
		};
	}, [dragging, editor, nodeKey, scheduleDisplaySize]);

	const applyAlign = React.useCallback(
		(next: ImageAlign) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (isImageNodeWritable(node)) {
					if (next === "center") {
						node.setWrap("no-wrap");
					}

					node.setAlign(next);
				}
			});
		},
		[editor, nodeKey],
	);

	const applyWrap = React.useCallback(
		(next: ImageWrap) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (isImageNodeWritable(node)) {
					if (next === "wrap" && align === "center") {
						node.setAlign("left");
					}

					node.setWrap(next);
				}
			});
		},
		[editor, nodeKey, align],
	);

	const applyFrameStyle = React.useCallback(
		(next: ImageFrameStyle) => {
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if (isImageNodeWritable(node)) {
					node.setFrameStyle(next);
				}
			});
		},
		[editor, nodeKey],
	);

	const toolbarClassName = `richtext-img-toolbar richtext-img-toolbar--${align}`;
	const imageRuntimeStyle = buildImageRuntimeStyle(displaySize);

	if (!src) {
		return (
			<span
				ref={containerRef}
				className="richtext-img is-center"
				data-lexical-image="container"
				data-node-type="resizable-image"
				data-node-key={String(nodeKey)}
				data-media-id={mediaId ?? undefined}
				data-align={align}
				data-wrap={effectiveWrap}
				data-frame-style={frameStyle}
				data-richtext-link-kind={linkTarget?.kind}
				contentEditable={false}
				tabIndex={0}
			>
				<span className="richtext-img-missing">Missing image</span>
			</span>
		);
	}

	return (
		<span
			ref={containerRef}
			className={wrapperClass}
			data-lexical-image="container"
			data-node-type="resizable-image"
			data-node-key={String(nodeKey)}
			data-media-id={mediaId ?? undefined}
			data-align={align}
			data-wrap={effectiveWrap}
			data-frame-style={frameStyle}
			data-richtext-link-kind={linkTarget?.kind}
			contentEditable={false}
			tabIndex={0}
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				clearSelection();
				setSelected(true);
			}}
			data-editable={editable ? "true" : "false"}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt ?? ""}
				className="richtext-img__image"
				style={imageRuntimeStyle}
				draggable={false}
			/>

			{linkTarget ? (
				<span
					className="richtext-img-link-badge"
					title={`Linked to ${linkTarget.href}`}
					aria-label="Image has an active link"
				>
					<IconRender fallback={{ lucideName: "Link2" }} size={13} />
					<span>Linked</span>
				</span>
			) : null}

			{editable && isSelected ? (
				<div
					className={`richtext-img-move-handle${moving ? " is-moving" : ""}`}
					onPointerDown={onPointerDownMove}
					role="button"
					aria-label="Move image"
					title="Drag to move image"
				/>
			) : null}

			{editable ? (
				<div
					className={resizeHandleClass}
					onPointerDown={onPointerDownHandle}
					role="button"
					aria-label="Resize image"
				/>
			) : null}

			{editable && moving && moveDropPreview ? (
				<div
					className="richtext-img-drop-guide"
					style={buildDropGuideRuntimeStyle(moveDropPreview)}
				>
					<div className="richtext-img-drop-guide-line" />
					<div className="richtext-img-drop-guide-label">
						{readMoveLabel(moveDropPreview.mode)}
					</div>
				</div>
			) : null}

			{editable && moving && moveDropPreview ? (
				<div
					className="richtext-img-drop-preview"
					style={buildDropPreviewRuntimeStyle(moveDropPreview, movePreviewSize)}
				>
					<div className="richtext-img-drop-preview-size">
						{movePreviewSize.width} × {movePreviewSize.height}
					</div>
				</div>
			) : null}

			{editable && isSelected ? (
				<div
					role="toolbar"
					aria-label="Image alignment, wrapping, and border"
					className={toolbarClassName}
					onMouseDown={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<Button
						size="xs"
						variant={align === "left" ? "primary" : "secondary"}
						onClick={() => applyAlign("left")}
						title="Align left"
					>
						L
					</Button>
					<Button
						size="xs"
						variant={
							align === "center" && effectiveWrap === "no-wrap"
								? "primary"
								: "secondary"
						}
						onClick={() => applyAlign("center")}
						title="Align center and disable text wrap"
					>
						C
					</Button>
					<Button
						size="xs"
						variant={align === "right" ? "primary" : "secondary"}
						onClick={() => applyAlign("right")}
						title="Align right"
					>
						R
					</Button>

					<span className="richtext-img-toolbar__separator" aria-hidden="true" />

					<Button
						size="xs"
						variant={effectiveWrap === "wrap" ? "primary" : "secondary"}
						onClick={() => applyWrap("wrap")}
						title="Text wraps"
					>
						Wrap
					</Button>
					<Button
						size="xs"
						variant={effectiveWrap === "no-wrap" ? "primary" : "secondary"}
						onClick={() => applyWrap("no-wrap")}
						title="No text wrap"
					>
						No wrap
					</Button>

					<span className="richtext-img-toolbar__separator" aria-hidden="true" />

					<Button
						size="xs"
						variant={frameStyle === "border" ? "primary" : "secondary"}
						onClick={() =>
							applyFrameStyle(frameStyle === "border" ? "none" : "border")
						}
						title={
							frameStyle === "border" ? "Remove image border" : "Add image border"
						}
						aria-pressed={frameStyle === "border"}
					>
						Border
					</Button>

					{linkTarget ? (
						<>
							<span className="richtext-img-toolbar__separator" aria-hidden="true" />
							<span className="richtext-img-toolbar__link-status">
								<IconRender fallback={{ lucideName: "Link2" }} size={12} />
								Linked
							</span>
						</>
					) : null}
				</div>
			) : null}
		</span>
	);
}
ImageNodeView.displayName = "ImageNodeView";

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
