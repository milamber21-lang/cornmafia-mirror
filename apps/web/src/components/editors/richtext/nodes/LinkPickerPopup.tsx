//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/LinkPickerPopup.tsx                                     //
//// Language: TSX                                                                                                //
//// Tabbed actor-readable internal, Riseopedia, and admin external RichText link picker.                         //
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
} from "lexical";

import { Button, DropdownMenuSingle, Input } from "@/components/ui";
import Checkbox from "../../../ui/basic-elements/Checkbox";
import type { IconRenderProps } from "@/components/ui/IconRender";
import type { RiseopediaEntityVisualMedia } from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import RichTextLinkPickerResultRow from "./RichTextLinkPickerResultRow";
import {
	loadRichTextPickerPayload,
	readCachedRichTextPickerPayload,
	richTextLinkPickerBasePath,
	type RichTextLinkPickerContext,
} from "./richtext-link-picker-cache";
import { distinctRichTextLinkPickerOptions } from "@/lib/helpers/richtext-link-picker-options";
import { readRichTextPickerJson } from "@/lib/helpers/richtext-picker-response";
import {
	normalizeRichTextLinkTarget,
	richTextLinkTargetOpensNewTab,
	type RichTextLinkTarget,
} from "@/lib/editors/richtext/rich-text-link-targets";
import { stripHttpsProtocol } from "../../../../lib/links/link-policy";

export type LinkTogglePayload = {
	url: string;
	target: "_blank" | null;
	rel: string | null;
	linkTarget?: RichTextLinkTarget;
};

export type LinkApplyValue = {
	payload: LinkTogglePayload;
	label?: string;
};

export type { RichTextLinkPickerContext } from "./richtext-link-picker-cache";

type Props = {
	open: boolean;
	onApply: (value: LinkApplyValue | null) => void;
	onClose: () => void;
	mediaContext: RichTextLinkPickerContext;
	className?: string;
	style?: React.CSSProperties;
};

type PickerTab = "internal" | "riseopedia" | "external";
type LinkSelectionKind = "text" | "image";

type LinkSnapshot = {
	target: RichTextLinkTarget | null;
	url: string;
	newTab: boolean;
	hasLink: boolean;
	selectionCollapsed: boolean;
	selectionKind: LinkSelectionKind;
};

const EMPTY_LINK_SNAPSHOT: LinkSnapshot = {
	target: null,
	url: "",
	newTab: false,
	hasLink: false,
	selectionCollapsed: true,
	selectionKind: "text",
};

type PickerOption = { value: string; label: string; parentValue?: string };
type PickerIconKey = IconRenderProps["iconKey"];
type PickerIconColor = IconRenderProps["iconColor"];
type InternalRow = {
	id: string;
	title: string;
	summary: string | null;
	categoryId: string;
	categoryLabel: string;
	subcategoryId: string;
	subcategoryLabel: string;
	contentKindCode: string;
	contentKindLabel: string;
	href: string;
	iconKey: PickerIconKey;
	iconColor: PickerIconColor;
};
type RiseopediaRow = {
	id: string;
	name: string;
	href: string;
	entityTypeCode: string;
	entityTypeLabel: string;
	classCode: string | null;
	classLabel: string | null;
	categoryCode: string | null;
	categoryLabel: string | null;
	subcategoryCode: string | null;
	subcategoryLabel: string | null;
	iconMedia: RiseopediaEntityVisualMedia | null;
};
type LinkPickerMetaResponse = {
	internal?: unknown;
	riseopedia?: unknown;
	message?: unknown;
};
type InternalResponse = {
	rows?: unknown;
	message?: unknown;
};
type RiseopediaResponse = {
	rows?: unknown;
	message?: unknown;
};
const EDITOR_PICKER_OPEN_ATTRIBUTE = "data-richtext-editor-picker-open";
const EDITOR_PICKER_CLOSE_EVENT = "richtext-editor-picker-close";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
function readBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null;
}
function readNumber(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function readArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}
function isFn(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}
function markEditorPickerOpen(open: boolean): void {
	if (typeof document === "undefined") return;
	if (open) document.body.setAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE, "true");
	else document.body.removeAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE);
}
function stopEscapeAtSource(event: KeyboardEvent): void {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
}
function nodeType(node: unknown): string {
	const method = isRecord(node) ? node.getType : null;
	return isFn(method) ? String(method.call(node)) : "";
}
function nodeParent(node: unknown): unknown | null {
	const method = isRecord(node) ? node.getParent : null;
	return isFn(method) ? (method.call(node) ?? null) : null;
}
function nodeLinkTarget(
	node: unknown,
	fallbackUrl = "",
	fallbackNewTab = false,
): RichTextLinkTarget | null {
	const method = isRecord(node) ? node.getLinkTarget : null;
	const value = isFn(method) ? method.call(node) : null;
	return normalizeRichTextLinkTarget(value, {
		href: fallbackUrl,
		newTab: fallbackNewTab,
	});
}
function readSelectionNodes(selection: unknown): unknown[] {
	const method = isRecord(selection) ? selection.getNodes : null;
	const value = isFn(method) ? method.call(selection) : [];
	return Array.isArray(value) ? value : [];
}
function readCurrentLinkSnapshot(): LinkSnapshot {
	const selection = $getSelection();
	const selectionCollapsed = $isRangeSelection(selection)
		? selection.isCollapsed()
		: true;
	const nodes = readSelectionNodes(selection);

	const imageNode = nodes.find((node) => nodeType(node) === "resizable-image");
	if (imageNode) {
		const target = nodeLinkTarget(imageNode);
		return {
			target,
			url: target?.href ?? "",
			newTab: target ? richTextLinkTargetOpensNewTab(target) : false,
			hasLink: target !== null,
			selectionCollapsed: true,
			selectionKind: "image",
		};
	}

	let linkNode: unknown | null = null;
	for (const node of nodes) {
		if (nodeType(node) === "link" || nodeType(node) === "richtext-link") {
			linkNode = node;
			break;
		}
		const parent = nodeParent(node);
		if (nodeType(parent) === "link" || nodeType(parent) === "richtext-link") {
			linkNode = parent;
			break;
		}
	}

	if (!linkNode) {
		return {
			target: null,
			url: "",
			newTab: false,
			hasLink: false,
			selectionCollapsed,
			selectionKind: "text",
		};
	}
	const getURL = isRecord(linkNode) ? linkNode.getURL : null;
	const getTarget = isRecord(linkNode) ? linkNode.getTarget : null;
	const url = isFn(getURL) ? String(getURL.call(linkNode)) : "";
	const rawTarget = isFn(getTarget) ? getTarget.call(linkNode) : null;
	const newTab = rawTarget === "_blank";
	const target = nodeLinkTarget(linkNode, url, newTab);
	return {
		target,
		url,
		newTab,
		hasLink: true,
		selectionCollapsed,
		selectionKind: "text",
	};
}

function optionFrom(value: unknown): PickerOption | null {
	if (!isRecord(value)) return null;
	const optionValue = readString(value.value);
	const label = readString(value.label);
	if (!optionValue || !label) return null;
	const parentValue = readString(value.parentValue);
	return { value: optionValue, label, ...(parentValue ? { parentValue } : {}) };
}

function pickerIconFrom(value: unknown): PickerIconKey {
	if (!isRecord(value)) return null;
	const id = readString(value.id);
	const source = readString(value.source);
	if (!id || (source !== "lucide" && source !== "media")) return null;

	const rawMedia = isRecord(value.iconMedia) ? value.iconMedia : null;
	const mediaId = rawMedia ? readString(rawMedia.id) : null;

	return {
		id,
		key: readString(value.key),
		label: readString(value.label),
		source,
		lucideName: readString(value.lucideName),
		iconMedia:
			rawMedia && mediaId
				? {
						id: mediaId,
						url: readString(rawMedia.url),
						filename: readString(rawMedia.filename),
						originalFilename: readString(rawMedia.originalFilename),
						mimeType: readString(rawMedia.mimeType),
						storageRelPath: readString(rawMedia.storageRelPath),
						thumbnailURL: readString(rawMedia.thumbnailURL),
					}
				: null,
	};
}

function pickerIconColorFrom(value: unknown): PickerIconColor {
	if (!isRecord(value)) return null;
	return { preview: readString(value.preview) };
}

function riseopediaMediaFrom(
	value: unknown,
): RiseopediaEntityVisualMedia | null {
	if (!isRecord(value)) return null;
	const url = readString(value.url);
	if (!url) return null;

	return {
		url,
		width: readNumber(value.width),
		height: readNumber(value.height),
		mimeType: readString(value.mimeType),
	};
}

function internalFallbackIcon(contentKindCode: string): string {
	switch (contentKindCode) {
		case "youtube":
		case "video":
			return "Video";
		case "external_link":
			return "ExternalLink";
		case "map":
			return "Map";
		case "tool":
		case "app":
			return "Wrench";
		case "event":
			return "CalendarDays";
		default:
			return "FileText";
	}
}

function riseopediaFallbackIcon(entityTypeCode: string): string {
	switch (entityTypeCode) {
		case "recipe":
			return "ChefHat";
		case "quest":
			return "ScrollText";
		case "location":
			return "MapPin";
		case "poi":
			return "Landmark";
		case "perk":
			return "Sparkles";
		case "mechanic":
			return "Cog";
		case "npc":
			return "UserRound";
		case "vendor":
			return "Store";
		default:
			return "Package";
	}
}
function internalRowFrom(value: unknown): InternalRow | null {
	if (!isRecord(value)) return null;
	const id = readString(value.id);
	const title = readString(value.title);
	const href = readString(value.href);
	const categoryId = readString(value.categoryId);
	const categoryLabel = readString(value.categoryLabel);
	const subcategoryId = readString(value.subcategoryId);
	const subcategoryLabel = readString(value.subcategoryLabel);
	const contentKindCode = readString(value.contentKindCode);
	const contentKindLabel = readString(value.contentKindLabel);
	if (
		!id ||
		!title ||
		!href ||
		!categoryId ||
		!categoryLabel ||
		!subcategoryId ||
		!subcategoryLabel ||
		!contentKindCode ||
		!contentKindLabel
	)
		return null;
	return {
		id,
		title,
		href,
		categoryId,
		categoryLabel,
		subcategoryId,
		subcategoryLabel,
		contentKindCode,
		contentKindLabel,
		summary: readString(value.summary),
		iconKey: pickerIconFrom(value.iconKey),
		iconColor: pickerIconColorFrom(value.iconColor),
	};
}
function riseopediaRowFrom(value: unknown): RiseopediaRow | null {
	if (!isRecord(value)) return null;
	const id = readString(value.id);
	const name = readString(value.name);
	const href = readString(value.href);
	const entityTypeCode = readString(value.entityTypeCode);
	const entityTypeLabel = readString(value.entityTypeLabel);
	if (!id || !name || !href || !entityTypeCode || !entityTypeLabel) return null;
	return {
		id,
		name,
		href,
		entityTypeCode,
		entityTypeLabel,
		classCode: readString(value.classCode),
		classLabel: readString(value.classLabel),
		categoryCode: readString(value.categoryCode),
		categoryLabel: readString(value.categoryLabel),
		subcategoryCode: readString(value.subcategoryCode),
		subcategoryLabel: readString(value.subcategoryLabel),
		iconMedia: riseopediaMediaFrom(value.iconMedia),
	};
}
function createPayload(target: RichTextLinkTarget): LinkTogglePayload {
	const newTab = richTextLinkTargetOpensNewTab(target);
	return {
		url: target.href,
		target: newTab ? "_blank" : null,
		rel: newTab ? "noopener noreferrer" : null,
		linkTarget: target,
	};
}

export default function LinkPickerPopup({
	open,
	onApply,
	onClose,
	mediaContext,
	className,
	style,
}: Props) {
	const [editor] = useLexicalComposerContext();
	const [tab, setTab] = React.useState<PickerTab>("internal");
	const [snapshot, setSnapshot] =
		React.useState<LinkSnapshot>(EMPTY_LINK_SNAPSHOT);
	const [label, setLabel] = React.useState("");
	const [search, setSearch] = React.useState("");
	const [category, setCategory] = React.useState("");
	const [subcategory, setSubcategory] = React.useState("");
	const [entityType, setEntityType] = React.useState("");
	const [entityClass, setEntityClass] = React.useState("");
	const [entityCategory, setEntityCategory] = React.useState("");
	const [entitySubcategory, setEntitySubcategory] = React.useState("");
	const [externalUrl, setExternalUrl] = React.useState("");
	const [newTab, setNewTab] = React.useState(true);
	const [options, setOptions] = React.useState<{
		categories: PickerOption[];
		subcategories: PickerOption[];
		entityTypes: PickerOption[];
		classes: PickerOption[];
		entityCategories: PickerOption[];
		entitySubcategories: PickerOption[];
	}>({
		categories: [],
		subcategories: [],
		entityTypes: [],
		classes: [],
		entityCategories: [],
		entitySubcategories: [],
	});
	const [internalRows, setInternalRows] = React.useState<InternalRow[]>([]);
	const [riseopediaRows, setRiseopediaRows] = React.useState<RiseopediaRow[]>(
		[],
	);
	const [metaLoading, setMetaLoading] = React.useState(false);
	const [rowsLoading, setRowsLoading] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	const requiresLabel =
		snapshot.selectionKind === "text" &&
		snapshot.selectionCollapsed &&
		!snapshot.hasLink;
	const basePath = richTextLinkPickerBasePath(mediaContext);
	const internalCategories = React.useMemo(
		() => distinctRichTextLinkPickerOptions(options.categories),
		[options.categories],
	);
	const internalSubcategories = React.useMemo(
		() => distinctRichTextLinkPickerOptions(options.subcategories, category),
		[category, options.subcategories],
	);
	const riseopediaEntityTypes = React.useMemo(
		() => distinctRichTextLinkPickerOptions(options.entityTypes),
		[options.entityTypes],
	);
	const riseopediaClasses = React.useMemo(
		() => distinctRichTextLinkPickerOptions(options.classes, entityType),
		[entityType, options.classes],
	);
	const riseopediaCategories = React.useMemo(
		() =>
			distinctRichTextLinkPickerOptions(options.entityCategories, entityClass),
		[entityClass, options.entityCategories],
	);
	const riseopediaSubcategories = React.useMemo(
		() =>
			distinctRichTextLinkPickerOptions(
				options.entitySubcategories,
				entityCategory,
			),
		[entityCategory, options.entitySubcategories],
	);
	const currentInternalContentId =
		snapshot.target?.kind === "internal_content"
			? snapshot.target.contentId
			: null;
	const currentRiseopediaEntityId =
		snapshot.target?.kind === "riseopedia_entity"
			? snapshot.target.entityId
			: null;

	const applyMetaPayload = React.useCallback((payload: unknown) => {
		const data = (isRecord(payload) ? payload : {}) as LinkPickerMetaResponse;
		const internal = isRecord(data.internal) ? data.internal : {};
		const riseopedia = isRecord(data.riseopedia) ? data.riseopedia : {};

		setOptions({
			categories: readArray(internal.categories)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
			subcategories: readArray(internal.subcategories)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
			entityTypes: readArray(riseopedia.entityTypes)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
			classes: readArray(riseopedia.classes)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
			entityCategories: readArray(riseopedia.categories)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
			entitySubcategories: readArray(riseopedia.subcategories)
				.map(optionFrom)
				.filter((row): row is PickerOption => row !== null),
		});
	}, []);

	React.useEffect(() => {
		markEditorPickerOpen(open);
		return () => markEditorPickerOpen(false);
	}, [open]);
	React.useEffect(() => {
		if (!open) return;
		const sync = () =>
			editor.getEditorState().read(() => setSnapshot(readCurrentLinkSnapshot()));
		sync();
		const unregisterSelection = editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				sync();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		const unregisterUpdate = editor.registerUpdateListener(sync);
		return () => {
			unregisterSelection();
			unregisterUpdate();
		};
	}, [editor, open]);
	React.useEffect(() => {
		if (!open) return;

		try {
			const current = editor
				.getEditorState()
				.read(() => readCurrentLinkSnapshot());
			setSnapshot(current);
			setExternalUrl(stripHttpsProtocol(current.url));
			setNewTab(current.newTab || !current.url.startsWith("/"));
			setLabel("");
			setSearch("");
			setError(null);
			if (current.target?.kind === "riseopedia_entity") {
				setTab("riseopedia");
			} else if (
				(current.target?.kind === "external" ||
					current.target?.kind === "legacy") &&
				!current.url.startsWith("/") &&
				mediaContext === "admin"
			) {
				setTab("external");
			} else {
				setTab("internal");
			}
		} catch (value: unknown) {
			setSnapshot(EMPTY_LINK_SNAPSHOT);
			setError(
				value instanceof Error
					? `Unable to read the editor selection: ${value.message}`
					: "Unable to read the editor selection.",
			);
		}
	}, [editor, mediaContext, open]);
	React.useEffect(() => {
		if (!open) {
			return;
		}

		const url = `${basePath}/meta`;
		const cached = readCachedRichTextPickerPayload(url);
		let active = true;

		if (cached) {
			applyMetaPayload(cached.payload);
		}
		setMetaLoading(!cached?.fresh);

		void loadRichTextPickerPayload(url, "Failed to load link-picker metadata.")
			.then((payload) => {
				if (active) {
					applyMetaPayload(payload);
				}
			})
			.catch((value: unknown) => {
				if (active) {
					setError(
						value instanceof Error
							? value.message
							: "Failed to load link-picker metadata.",
					);
				}
			})
			.finally(() => {
				if (active) {
					setMetaLoading(false);
				}
			});

		return () => {
			active = false;
		};
	}, [applyMetaPayload, basePath, open]);

	React.useEffect(() => {
		if (!open || tab === "external") {
			return;
		}

		const params = new URLSearchParams();
		if (search.trim()) {
			params.set("q", search.trim());
		}
		if (tab === "internal") {
			if (category) {
				params.set("categoryId", category);
			}
			if (subcategory) {
				params.set("subcategoryId", subcategory);
			}
		} else {
			if (entityType) {
				params.set("entityType", entityType);
			}
			if (entityClass) {
				params.set("class", entityClass);
			}
			if (entityCategory) {
				params.set("category", entityCategory);
			}
			if (entitySubcategory) {
				params.set("subcategory", entitySubcategory);
			}
		}
		const queryString = params.toString();
		const url = `${basePath}/${tab}${queryString ? `?${queryString}` : ""}`;
		const cached = readCachedRichTextPickerPayload(url);
		let active = true;

		const applyRows = (payload: unknown) => {
			if (tab === "internal") {
				const data = (isRecord(payload) ? payload : {}) as InternalResponse;
				setInternalRows(
					readArray(data.rows)
						.map(internalRowFrom)
						.filter((row): row is InternalRow => row !== null),
				);
			} else {
				const data = (isRecord(payload) ? payload : {}) as RiseopediaResponse;
				setRiseopediaRows(
					readArray(data.rows)
						.map(riseopediaRowFrom)
						.filter((row): row is RiseopediaRow => row !== null),
				);
			}
		};

		if (cached) {
			applyRows(cached.payload);
		}

		const loadRows = () => {
			setRowsLoading(!cached?.fresh);
			setError(null);

			void loadRichTextPickerPayload(
				url,
				tab === "internal"
					? "Failed to load internal page targets."
					: "Failed to load Riseopedia targets.",
			)
				.then((payload) => {
					if (active) {
						applyRows(payload);
					}
				})
				.catch((value: unknown) => {
					if (active) {
						setError(
							value instanceof Error ? value.message : "Failed to load link targets.",
						);
					}
				})
				.finally(() => {
					if (active) {
						setRowsLoading(false);
					}
				});
		};

		const delayMs = search.trim() ? 250 : 0;
		const timeout = window.setTimeout(loadRows, delayMs);

		return () => {
			active = false;
			window.clearTimeout(timeout);
		};
	}, [
		basePath,
		category,
		entityCategory,
		entityClass,
		entitySubcategory,
		entityType,
		open,
		search,
		subcategory,
		tab,
	]);
	React.useEffect(() => {
		if (!open) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				stopEscapeAtSource(event);
				window.dispatchEvent(new CustomEvent(EDITOR_PICKER_CLOSE_EVENT));
				onClose();
			}
		};
		document.addEventListener("keydown", onKeyDown, true);
		return () => document.removeEventListener("keydown", onKeyDown, true);
	}, [onClose, open]);

	const applyTarget = React.useCallback(
		(target: RichTextLinkTarget, defaultLabel: string) => {
			onApply({
				payload: createPayload(target),
				...(requiresLabel ? { label: label.trim() || defaultLabel } : {}),
			});
			onClose();
		},
		[label, onApply, onClose, requiresLabel],
	);
	const applyExternal = React.useCallback(async () => {
		if (mediaContext !== "admin") return;
		if (requiresLabel && !label.trim()) {
			setError("Link text is required when no text is selected.");
			return;
		}
		const rawUrl = externalUrl.trim();
		if (!rawUrl) {
			setError("External URL is required.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const response = await fetch("/api/admin/web/external-link-hosts/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rawUrl, surfaceScopeCode: "admin" }),
				credentials: "include",
				cache: "no-store",
			});
			const payload = await readRichTextPickerJson(
				response,
				"Failed to validate external link.",
			);
			const doc = isRecord(payload) && isRecord(payload.doc) ? payload.doc : null;
			const allowed = doc ? readBoolean(doc.isAllowed) === true : false;
			const href = doc ? readString(doc.normalizedUrl) : null;
			if (!allowed || !href)
				throw new Error(
					doc
						? (readString(doc.errorMessage) ?? "External link is not whitelisted.")
						: "External link is not whitelisted.",
				);
			applyTarget({ kind: "external", href, newTab }, href);
		} catch (value: unknown) {
			setError(
				value instanceof Error
					? value.message
					: "Failed to validate external link.",
			);
		} finally {
			setSubmitting(false);
		}
	}, [applyTarget, externalUrl, label, mediaContext, newTab, requiresLabel]);

	if (!open) return null;
	const tabs: Array<{ value: PickerTab; label: string }> = [
		{ value: "internal", label: "Internal Page" },
		{ value: "riseopedia", label: "Riseopedia" },
		...(mediaContext === "admin"
			? [{ value: "external" as const, label: "External Link" }]
			: []),
	];
	return (
		<div className="editor-link-picker-modal" role="presentation">
			<div
				ref={containerRef}
				className={
					className ?? "editor-link-picker-popup editor-link-picker-popup--tabbed"
				}
				style={style}
				role="dialog"
				aria-modal="true"
				aria-label={snapshot.hasLink ? "Edit link" : "Create a link"}
			>
				<div className="editor-picker-header">
					<h3 className="editor-picker-title">
						{snapshot.selectionKind === "image"
							? "Image link"
							: snapshot.hasLink
								? "Edit link"
								: "Create a link"}
					</h3>
				</div>
				<div className="editor-link-picker-tabs" role="tablist">
					{tabs.map((item) => (
						<Button
							key={item.value}
							size="sm"
							variant={tab === item.value ? "primary" : "secondary"}
							onClick={() => {
								setTab(item.value);
								setSearch("");
								setError(null);
							}}
							aria-pressed={tab === item.value}
						>
							{item.label}
						</Button>
					))}
				</div>
				<div className="editor-picker-body editor-link-picker-body editor-link-picker-body--tabbed">
					{requiresLabel ? (
						<div className="editor-link-picker-field">
							<label className="editor-picker-label" htmlFor="richtext-link-label">
								Link text
							</label>
							<Input
								id="richtext-link-label"
								className="editor-link-picker-input"
								value={label}
								onChange={(event) => setLabel(event.target.value)}
								placeholder="Visible link text"
							/>
						</div>
					) : null}
					{tab !== "external" ? (
						<div className="editor-link-picker-field">
							<label className="editor-picker-label" htmlFor="richtext-link-search">
								Search
							</label>
							<Input
								id="richtext-link-search"
								className="editor-link-picker-input editor-link-picker-search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={
									tab === "internal"
										? "Search readable content"
										: "Search Riseopedia entities"
								}
							/>
						</div>
					) : null}
					{tab === "internal" ? (
						<>
							<div className="editor-link-picker-filter-grid">
								<DropdownMenuSingle
									className="editor-picker-control"
									value={category}
									onChange={(value) => {
										setCategory(value);
										setSubcategory("");
									}}
									options={internalCategories}
									placeholder="All categories"
									ariaLabel="Filter internal pages by category"
									allowClear
									clearLabel="All categories"
								/>
								<DropdownMenuSingle
									className="editor-picker-control"
									value={subcategory}
									onChange={setSubcategory}
									options={internalSubcategories}
									placeholder="All subcategories"
									ariaLabel="Filter internal pages by subcategory"
									allowClear
									clearLabel="All subcategories"
								/>
							</div>
							<div className="editor-link-picker-results" role="list">
								{internalRows.map((row) => (
									<RichTextLinkPickerResultRow
										key={row.id}
										iconKey={row.iconKey}
										iconColor={row.iconColor}
										fallbackIcon={internalFallbackIcon(row.contentKindCode)}
										title={row.title}
										classification={`${row.categoryLabel} / ${row.subcategoryLabel}`}
										detail={row.summary ?? row.href}
										badge={row.contentKindLabel}
										current={currentInternalContentId === row.id}
										onSelect={() =>
											applyTarget(
												{
													kind: "internal_content",
													contentId: row.id,
													href: row.href,
												},
												row.title,
											)
										}
									/>
								))}
							</div>
						</>
					) : null}
					{tab === "riseopedia" ? (
						<>
							<div className="editor-link-picker-filter-grid editor-link-picker-filter-grid--four">
								<DropdownMenuSingle
									className="editor-picker-control"
									value={entityType}
									onChange={(value) => {
										setEntityType(value);
										setEntityClass("");
										setEntityCategory("");
										setEntitySubcategory("");
									}}
									options={riseopediaEntityTypes}
									placeholder="All entity types"
									ariaLabel="Filter Riseopedia by entity type"
									allowClear
									clearLabel="All entity types"
								/>
								<DropdownMenuSingle
									className="editor-picker-control"
									value={entityClass}
									onChange={(value) => {
										setEntityClass(value);
										setEntityCategory("");
										setEntitySubcategory("");
									}}
									options={riseopediaClasses}
									placeholder="All classes"
									ariaLabel="Filter Riseopedia by class"
									allowClear
									clearLabel="All classes"
								/>
								<DropdownMenuSingle
									className="editor-picker-control"
									value={entityCategory}
									onChange={(value) => {
										setEntityCategory(value);
										setEntitySubcategory("");
									}}
									options={riseopediaCategories}
									placeholder="All categories"
									ariaLabel="Filter Riseopedia by category"
									allowClear
									clearLabel="All categories"
								/>
								<DropdownMenuSingle
									className="editor-picker-control"
									value={entitySubcategory}
									onChange={setEntitySubcategory}
									options={riseopediaSubcategories}
									placeholder="All subcategories"
									ariaLabel="Filter Riseopedia by subcategory"
									allowClear
									clearLabel="All subcategories"
								/>
							</div>
							<div className="editor-link-picker-results" role="list">
								{riseopediaRows.map((row) => (
									<RichTextLinkPickerResultRow
										key={row.id}
										riseopediaMedia={row.iconMedia}
										placeholderLabel={row.entityTypeLabel}
										fallbackIcon={riseopediaFallbackIcon(row.entityTypeCode)}
										title={row.name}
										classification={[
											row.classLabel,
											row.categoryLabel,
											row.subcategoryLabel,
										]
											.filter(Boolean)
											.join(" / ")}
										detail={row.href}
										badge={row.entityTypeLabel}
										current={currentRiseopediaEntityId === row.id}
										onSelect={() =>
											applyTarget(
												{
													kind: "riseopedia_entity",
													entityId: row.id,
													href: row.href,
												},
												row.name,
											)
										}
									/>
								))}
							</div>
						</>
					) : null}
					{tab === "external" && mediaContext === "admin" ? (
						<>
							<div className="editor-link-picker-field">
								<label className="editor-picker-label" htmlFor="richtext-link-external">
									External URL
								</label>
								<Input
									id="richtext-link-external"
									className="editor-link-picker-input"
									value={externalUrl}
									onChange={(event) => setExternalUrl(event.target.value)}
									placeholder="example.com/page"
									spellCheck={false}
								/>
							</div>
							<Checkbox
								size="md"
								variant="neutral"
								checked={newTab}
								onChange={(event) => setNewTab(event.currentTarget.checked)}
								label="Open in new tab"
							/>
						</>
					) : null}
					{tab !== "external" && (rowsLoading || metaLoading) ? (
						<div className="editor-link-picker-status">
							{rowsLoading
								? (tab === "internal" ? internalRows : riseopediaRows).length > 0
									? "Refreshing…"
									: "Loading…"
								: "Loading filters…"}
						</div>
					) : null}
					{!rowsLoading &&
					tab !== "external" &&
					(tab === "internal"
						? internalRows.length === 0
						: riseopediaRows.length === 0) ? (
						<div className="editor-link-picker-empty">No matching link targets.</div>
					) : null}
					{error ? (
						<div className="editor-picker-error editor-picker-error--boxed">
							{error}
						</div>
					) : null}
				</div>
				<div className="editor-picker-footer editor-picker-footer--three">
					<div className="editor-picker-footer__start">
						{snapshot.hasLink ? (
							<Button
								size="md"
								variant="danger"
								onClick={() => {
									onApply(null);
									onClose();
								}}
							>
								Remove link
							</Button>
						) : null}
					</div>
					<div className="editor-picker-footer__center">
						{tab === "external" ? (
							<Button
								size="md"
								variant="primary"
								onClick={() => void applyExternal()}
								disabled={submitting}
								loading={submitting}
							>
								Save external link
							</Button>
						) : null}
					</div>
					<div className="editor-picker-footer__end">
						<Button size="md" variant="secondary" onClick={onClose}>
							Close
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
