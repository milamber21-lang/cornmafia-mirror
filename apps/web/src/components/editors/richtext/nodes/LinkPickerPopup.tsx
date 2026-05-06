//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/LinkPickerPopup.tsx                                     ////
//// Language: TSX                                                                                                ////
//// Canvas-centered editor popup for DB-validated internal and whitelisted external RichText links.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";

import { Button } from "../../../ui/basic-elements/Button";
import Checkbox from "../../../ui/basic-elements/Checkbox";
import { readResponseMessage } from "../../../../lib/helpers/http-response";
import {
	looksLikeInternalLinkInput,
	normalizeRichTextLinkAuthorInput,
	stripHttpsProtocol,
} from "../../../../lib/links/link-policy";

export type LinkTogglePayload = {
	url: string;
	target: "_blank" | null;
	rel: string | null;
};

export type LinkApplyValue = {
	payload: LinkTogglePayload;
	label?: string;
};

type AnchorRect = {
	top: number;
	left: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
};

type Props = {
	open: boolean;
	onApply: (value: LinkApplyValue | null) => void;
	onClose: () => void;
	anchorRect?: AnchorRect | null;
	className?: string;
	style?: React.CSSProperties;
};

type LinkSnapshot = {
	url: string;
	newTab: boolean;
	hasLink: boolean;
	selectionCollapsed: boolean;
};

type ValidationDoc = {
	isAllowed?: unknown;
	normalizedUrl?: unknown;
	normalizedPath?: unknown;
	errorMessage?: unknown;
};

type ValidationResponse = {
	doc?: unknown;
	message?: unknown;
	error?: unknown;
};

type PopupPosition = {
	top: number;
	left: number;
};

const POPUP_WIDTH = 720;
const VIEWPORT_PADDING = 12;
const FALLBACK_TOP = 120;
const LINK_HELP_LINES = [
	"Use internal paths like /category/subcategory/page, with optional ?query and #anchor.",
	"External links must omit https:// here and must be approved in External Link Hosts.",
	"YouTube-style query strings and anchors are allowed after the base link target is safe.",
	"Contact links, raw media links, admin paths, API paths, credentials, ports, and unsafe protocols are not allowed.",
	"External links are saved as secure https links automatically.",
	"Internal links must exist and be readable by you before they can be saved.",
];

const EDITOR_PICKER_OPEN_ATTRIBUTE = "data-richtext-editor-picker-open";
const EDITOR_PICKER_CLOSE_EVENT = "richtext-editor-picker-close";

function markEditorPickerOpen(open: boolean): void {
	if (typeof document === "undefined") {
		return;
	}

	if (open) {
		document.body.setAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE, "true");
		return;
	}

	document.body.removeAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE);
}

function stopEscapeAtSource(event: KeyboardEvent): void {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}


function isFn(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

function getBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}

function readPayloadMessage(value: unknown, fallbackMessage: string): string {
	if (!isRecord(value)) {
		return fallbackMessage;
	}

	const message = getString(value.message);
	if (message && message.trim().length > 0) {
		return message;
	}

	const error = getString(value.error);
	if (error && error.trim().length > 0) {
		return error;
	}

	return fallbackMessage;
}

function readValidationDoc(value: unknown): ValidationDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	const response = value as ValidationResponse;
	return isRecord(response.doc) ? (response.doc as ValidationDoc) : null;
}


function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function readCurrentLinkSnapshot(): LinkSnapshot {
	const selection = $getSelection();
	const selectionCollapsed = $isRangeSelection(selection)
		? selection.isCollapsed()
		: true;
	const getNodes = (selection as { getNodes?: () => unknown[] } | null)?.getNodes;

	if (!isFn(getNodes)) {
		return {
			url: "",
			newTab: false,
			hasLink: false,
			selectionCollapsed,
		};
	}

	const nodes = getNodes.call(selection) ?? [];
	let linkNode: unknown | null = null;

	for (const node of nodes) {
		const type = isFn((node as { getType?: () => string }).getType)
			? (node as { getType: () => string }).getType()
			: "";

		if (type === "link") {
			linkNode = node;
			break;
		}

		const parent = isFn((node as { getParent?: () => unknown }).getParent)
			? (node as { getParent: () => unknown }).getParent()
			: null;
		const parentType =
			parent && isFn((parent as { getType?: () => string }).getType)
				? (parent as { getType: () => string }).getType()
				: "";

		if (parent && parentType === "link") {
			linkNode = parent;
			break;
		}
	}

	if (!linkNode) {
		return {
			url: "",
			newTab: false,
			hasLink: false,
			selectionCollapsed,
		};
	}

	const url = isFn((linkNode as { getURL?: () => string }).getURL)
		? String((linkNode as { getURL: () => string }).getURL())
		: "";
	const target = isFn((linkNode as { getTarget?: () => string | null }).getTarget)
		? (linkNode as { getTarget: () => string | null }).getTarget()
		: null;

	return {
		url,
		newTab: target === "_blank",
		hasLink: true,
		selectionCollapsed,
	};
}

function getCanvasRect(anchorRect?: AnchorRect | null): DOMRect | null {
	if (typeof document === "undefined") {
		return null;
	}

	const anchorX = anchorRect
		? clamp(anchorRect.left + anchorRect.width / 2, 0, window.innerWidth - 1)
		: null;
	const anchorY = anchorRect
		? clamp(anchorRect.top + anchorRect.height / 2, 0, window.innerHeight - 1)
		: null;
	const anchorElement =
		anchorX !== null && anchorY !== null
			? document.elementFromPoint(anchorX, anchorY)
			: null;
	const activeElement = document.activeElement;
	const canvas =
		anchorElement?.closest(".richtext-editor-canvas") ??
		(activeElement instanceof Element
			? activeElement.closest(".richtext-editor-canvas")
			: null) ??
		document.querySelector(".richtext-editor-canvas");

	return canvas instanceof HTMLElement ? canvas.getBoundingClientRect() : null;
}

function getPopupPosition(anchorRect?: AnchorRect | null): PopupPosition {
	if (typeof window === "undefined") {
		return { top: FALLBACK_TOP, left: POPUP_WIDTH / 2 + VIEWPORT_PADDING };
	}

	const popupWidth = Math.min(POPUP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
	const canvasRect = getCanvasRect(anchorRect);
	const targetLeft = canvasRect
		? canvasRect.left + canvasRect.width / 2
		: window.innerWidth / 2;
	const minLeft = VIEWPORT_PADDING + popupWidth / 2;
	const maxLeft = window.innerWidth - VIEWPORT_PADDING - popupWidth / 2;
	const left = clamp(targetLeft, minLeft, Math.max(minLeft, maxLeft));
	const targetTop = anchorRect
		? anchorRect.bottom + 10
		: canvasRect
			? canvasRect.top + 40
			: FALLBACK_TOP;
	const top = clamp(
		targetTop,
		VIEWPORT_PADDING,
		Math.max(VIEWPORT_PADDING, window.innerHeight - 240),
	);

	return { top, left };
}

async function postValidation(
	url: string,
	body: Record<string, string>,
	fallbackMessage: string,
): Promise<ValidationDoc> {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		cache: "no-store",
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(await readResponseMessage(response, fallbackMessage));
	}

	const payload = (await response.json().catch(() => null)) as unknown;
	const doc = readValidationDoc(payload);
	if (!doc) {
		throw new Error(readPayloadMessage(payload, fallbackMessage));
	}

	return doc;
}

async function validateInternalLink(rawPath: string): Promise<string> {
	const doc = await postValidation(
		"/api/admin/web/internal-links/validate",
		{ rawPath },
		"Failed to validate internal link.",
	);
	const isAllowed = getBoolean(doc.isAllowed) === true;
	const normalizedPath = getString(doc.normalizedPath);
	if (isAllowed && normalizedPath && normalizedPath.trim().length > 0) {
		return normalizedPath;
	}

	const errorMessage = getString(doc.errorMessage);
	throw new Error(
		errorMessage && errorMessage.trim().length > 0
			? errorMessage
			: "Internal link target was not found or you do not have access.",
	);
}

async function validateExternalLink(rawUrl: string): Promise<string> {
	const doc = await postValidation(
		"/api/admin/web/external-link-hosts/validate",
		{ rawUrl, surfaceScopeCode: "admin" },
		"Failed to validate external link.",
	);
	const isAllowed = getBoolean(doc.isAllowed) === true;
	const normalizedUrl = getString(doc.normalizedUrl);
	if (isAllowed && normalizedUrl && normalizedUrl.trim().length > 0) {
		return normalizedUrl;
	}

	const errorMessage = getString(doc.errorMessage);
	throw new Error(
		errorMessage && errorMessage.trim().length > 0
			? errorMessage
			: "External link is not whitelisted.",
	);
}

export default function LinkPickerPopup({
	open,
	onApply,
	onClose,
	anchorRect,
	className,
	style,
}: Props) {
	const [editor] = useLexicalComposerContext();

	const [url, setUrl] = React.useState("");
	const [label, setLabel] = React.useState("");
	const [newTab, setNewTab] = React.useState(true);
	const [selectionCollapsed, setSelectionCollapsed] = React.useState(true);
	const [hasCurrentLink, setHasCurrentLink] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [validating, setValidating] = React.useState(false);
	const [closeWarning, setCloseWarning] = React.useState(false);
	const [position, setPosition] = React.useState<PopupPosition>(() =>
		getPopupPosition(anchorRect),
	);

	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const lastSnapRef = React.useRef<LinkSnapshot | null>(null);
	const initialFormRef = React.useRef<{
		url: string;
		label: string;
		newTab: boolean;
	} | null>(null);
	const labelTouchedRef = React.useRef(false);


	React.useEffect(() => {
		markEditorPickerOpen(open);

		return () => markEditorPickerOpen(false);
	}, [open]);

	const requiresLabel = selectionCollapsed && !hasCurrentLink;
	const isInternal = looksLikeInternalLinkInput(url);
	const dirty = React.useMemo(() => {
		const initial = initialFormRef.current;
		if (!initial) {
			return false;
		}

		return (
			url.trim() !== initial.url.trim() ||
			label.trim() !== initial.label.trim() ||
			newTab !== initial.newTab
		);
	}, [label, newTab, url]);

	const requestClose = React.useCallback(() => {
		if (dirty) {
			if (!closeWarning) {
				setCloseWarning(true);
				setError(null);
				return;
			}
		}

		onClose();
	}, [closeWarning, dirty, onClose]);

	React.useEffect(() => {
		if (!open) return;

		const syncFromSelection = () => {
			editor.getEditorState().read(() => {
				const snap = readCurrentLinkSnapshot();
				setSelectionCollapsed(snap.selectionCollapsed);
				setHasCurrentLink(snap.hasLink);

				if (snap.hasLink) {
					const focused = document.activeElement === inputRef.current;
					const prev = lastSnapRef.current;
					const changed =
						!prev || prev.url !== snap.url || prev.newTab !== snap.newTab;

					if (changed || !focused) {
						const editableUrl = stripHttpsProtocol(snap.url || "");
						setUrl(editableUrl);
						setLabel("");
						setNewTab(!!snap.newTab);
						setError(null);
						setCloseWarning(false);
						initialFormRef.current = {
							url: editableUrl,
							label: "",
							newTab: !!snap.newTab,
						};
						lastSnapRef.current = snap;
					}
				} else {
					const focused = document.activeElement === inputRef.current;
					if (!focused || lastSnapRef.current?.hasLink) {
						setUrl("");
						setLabel("");
						setNewTab(true);
						setError(null);
						setCloseWarning(false);
						labelTouchedRef.current = false;
						initialFormRef.current = {
							url: "",
							label: "",
							newTab: true,
						};
					}
					lastSnapRef.current = snap;
				}
			});
		};

		syncFromSelection();

		const unregisterSelection = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				syncFromSelection();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		const unregisterUpdate = editor.registerUpdateListener(() =>
			syncFromSelection(),
		);

		return () => {
			try {
				unregisterSelection();
			} catch {}
			try {
				unregisterUpdate();
			} catch {}
		};
	}, [editor, open]);

	React.useEffect(() => {
		if (!open) return;
		setError(null);
		setCloseWarning(false);
		labelTouchedRef.current = false;
		const timeoutId = setTimeout(() => inputRef.current?.focus(), 0);
		return () => clearTimeout(timeoutId);
	}, [open]);

	React.useEffect(() => {
		if (!open) return;

		const updatePosition = () => setPosition(getPopupPosition(anchorRect));
		updatePosition();
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition, true);
		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition, true);
		};
	}, [anchorRect, open]);

	React.useEffect(() => {
		if (!open) return;

		const onDocumentMouseDown = (event: MouseEvent) => {
			const container = containerRef.current;
			if (container && container.contains(event.target as Node)) return;
			setTimeout(() => requestClose(), 0);
		};

		document.addEventListener("mousedown", onDocumentMouseDown, true);
		return () => {
			document.removeEventListener("mousedown", onDocumentMouseDown, true);
		};
	}, [open, requestClose]);

	React.useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			stopEscapeAtSource(event);
			window.dispatchEvent(new CustomEvent(EDITOR_PICKER_CLOSE_EVENT));
			requestClose();
		};

		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [open, requestClose]);

	const doApply = React.useCallback(async (): Promise<void> => {
		const trimmedUrl = url.trim();
		if (!trimmedUrl) {
			onApply(null);
			onClose();
			return;
		}

		const trimmedLabel = label.trim();
		if (requiresLabel && trimmedLabel.length === 0) {
			setError("Link text is required when no text is selected.");
			setCloseWarning(false);
			return;
		}

		const policyResult = normalizeRichTextLinkAuthorInput(trimmedUrl);
		if (!policyResult.ok) {
			setError(policyResult.message);
			setCloseWarning(false);
			return;
		}

		setError(null);
		setCloseWarning(false);
		setValidating(true);
		try {
			const finalUrl =
				policyResult.kind === "internal"
					? await validateInternalLink(policyResult.validationInput)
					: await validateExternalLink(policyResult.validationInput);
			const finalNewTab = finalUrl.startsWith("/") ? false : newTab;

			onApply({
				payload: {
					url: finalUrl,
					target: finalNewTab ? "_blank" : null,
					rel: finalNewTab ? "noopener noreferrer" : null,
				},
				...(requiresLabel ? { label: trimmedLabel } : {}),
			});
			onClose();
		} catch (errorValue: unknown) {
			setError(
				errorValue instanceof Error
					? errorValue.message
					: "Failed to validate link.",
			);
		} finally {
			setValidating(false);
		}
	}, [label, newTab, onApply, onClose, requiresLabel, url]);

	const doRemove = React.useCallback(() => {
		onApply(null);
		onClose();
	}, [onApply, onClose]);

	const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			void doApply();
		}
	};

	if (!open) return null;

	const title = hasCurrentLink ? "Edit link" : "Create a link";
	const closeButtonText = closeWarning ? "Discard" : "Close";
	const dialogClassName = className ?? "editor-link-picker-popup";
	const dialogStyle: React.CSSProperties = {
		top: position.top,
		left: position.left,
		...style,
	};

	return (
		<div
			ref={containerRef}
			className={dialogClassName}
			style={dialogStyle}
			role="dialog"
			aria-modal="false"
			aria-label={title}
		>
			<div className="editor-picker-header">
				<h3 className="editor-picker-title">
					{title}
				</h3>
			</div>

			<div className="editor-picker-body editor-link-picker-body">
				{requiresLabel ? (
					<div className="editor-link-picker-field">
						<label
							className="editor-picker-label"
							htmlFor="richtext-link-label"
						>
							Link text
						</label>
						<input
							id="richtext-link-label"
							type="text"
							value={label}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								labelTouchedRef.current = true;
								setLabel(event.target.value);
								setError(null);
								setCloseWarning(false);
							}}
							onKeyDown={onInputKeyDown}
							className="editor-link-picker-input"
							placeholder="Visible link text"
							spellCheck={false}
							disabled={validating}
						/>
					</div>
				) : null}

				<div className="editor-link-picker-target-row">
					<div>
						<label
							className="editor-picker-label"
							htmlFor="richtext-link-url"
						>
							Link target
						</label>
						<input
							id="richtext-link-url"
							ref={inputRef}
							type="text"
							value={url}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const nextUrl = event.target.value;
								setUrl(nextUrl);
								setError(null);
								setCloseWarning(false);
								if (requiresLabel && !labelTouchedRef.current) {
									setLabel(nextUrl);
								}
								if (looksLikeInternalLinkInput(nextUrl)) {
									setNewTab(false);
								} else if (!hasCurrentLink) {
									setNewTab(true);
								}
							}}
							onKeyDown={onInputKeyDown}
							className="editor-link-picker-input"
							placeholder="/category/subcategory/page"
							spellCheck={false}
							disabled={validating}
						/>
					</div>
					<div className="editor-link-picker-checkbox">
						<Checkbox
							size="md"
							variant="neutral"
							checked={!isInternal && newTab}
							onChange={(event) => {
								setNewTab(event.currentTarget.checked);
								setCloseWarning(false);
							}}
							label="Open in new tab"
							disabled={isInternal || validating}
						/>
					</div>
				</div>

				{error ? (
					<div className="editor-picker-error editor-picker-error--boxed">
						{error}
					</div>
				) : null}
				{closeWarning ? (
					<div className="editor-picker-error editor-picker-error--boxed">
						You have unsaved link changes. Click Discard or press Escape again to close without saving.
					</div>
				) : null}
			</div>

			<div className="editor-picker-help-panel">
				<div className="editor-picker-help-list">
					{LINK_HELP_LINES.map((line) => (
						<div key={line}>{line}</div>
					))}
				</div>
			</div>

			<div className="editor-picker-footer editor-picker-footer--three">
				<div className="editor-picker-footer__start">
					{hasCurrentLink ? (
						<Button
							size="md"
							variant="accent"
							onClick={doRemove}
							disabled={validating}
						>
							Delete
						</Button>
					) : null}
				</div>
				<div className="editor-picker-footer__center">
					<Button
						size="md"
						variant="green"
						onClick={() => void doApply()}
						disabled={validating}
						loading={validating}
					>
						Save
					</Button>
				</div>
				<div className="editor-picker-footer__end">
					<Button
						size="md"
						variant="neutral"
						onClick={requestClose}
						disabled={validating}
					>
						{closeButtonText}
					</Button>
				</div>
			</div>
		</div>
	);
}
