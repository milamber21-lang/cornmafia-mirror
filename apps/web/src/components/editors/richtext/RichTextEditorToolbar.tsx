//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditorToolbar.tsx                                     ////
//// Language: TSX                                                                                                ////
//// RichText editor toolbar with grouped content tools and right-side editor UI actions.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { Button } from "../../ui/basic-elements/Button";
import LinkPickerPopup, {
	type LinkApplyValue,
	type LinkTogglePayload,
	type RichTextLinkPickerContext,
} from "./nodes/LinkPickerPopup";
import { prefetchRichTextLinkPickerContext } from "./nodes/richtext-link-picker-cache";

export type SelectionSummary = {
	formats: {
		bold: boolean;
		italic: boolean;
		underline: boolean;
		strikethrough: boolean;
		code: boolean;
		subscript: boolean;
		superscript: boolean;
	};
	block: "paragraph" | "quote" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | null;
	list: "bullet" | "number" | "check" | null;
	hasLink: boolean;
	at: { hr: boolean; image: boolean };
};

export type ToolbarFeatures = {
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	code?: boolean;
	subscript?: boolean;
	superscript?: boolean;
	headingLevels?: Array<1 | 2 | 3 | 4 | 5 | 6>;
	paragraph?: boolean;
	quote?: boolean;
	list_bullet?: boolean;
	list_number?: boolean;
	list_remove?: boolean;
	list_check?: boolean;
	indent?: boolean;
	outdent?: boolean;
	align_left?: boolean;
	align_center?: boolean;
	align_right?: boolean;
	align_justify?: boolean;
	link_toggle?: boolean;
	undo?: boolean;
	redo?: boolean;
	image?: boolean;
	horizontal_rule?: boolean;
	clear_format?: boolean;
};

type BlockType =
	| "paragraph"
	| "quote"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6";

export type ToolbarItem =
	| "bold"
	| "italic"
	| "underline"
	| "strikethrough"
	| "code"
	| "subscript"
	| "superscript"
	| "clear_format"
	| "paragraph"
	| "quote"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "list_check"
	| "list_number"
	| "list_bullet"
	| "indent"
	| "outdent"
	| "align_left"
	| "align_center"
	| "align_right"
	| "align_justify"
	| "link_toggle"
	| "image"
	| "horizontal_rule"
	| "sep"
	| "undo"
	| "redo";

type HeadingToolbarItem = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type NonSeparatorToolbarItem = Exclude<ToolbarItem, "sep">;

export const INLINE_FORMAT_TOOLBAR_ITEMS: ToolbarItem[] = [
	"bold",
	"italic",
	"underline",
	"strikethrough",
	"code",
	"subscript",
	"superscript",
	"clear_format",
];

export const BLOCK_STYLE_TOOLBAR_ITEMS: ToolbarItem[] = [
	"paragraph",
	"quote",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
];

export const ALIGNMENT_TOOLBAR_ITEMS: ToolbarItem[] = [
	"align_left",
	"align_center",
	"align_right",
	"align_justify",
];

export const HISTORY_TOOLBAR_ITEMS: ToolbarItem[] = ["undo", "redo"];

export const BASE_TOOLBAR_LAYOUT: ToolbarItem[] = buildToolbarLayout([
	INLINE_FORMAT_TOOLBAR_ITEMS,
	BLOCK_STYLE_TOOLBAR_ITEMS,
	ALIGNMENT_TOOLBAR_ITEMS,
	HISTORY_TOOLBAR_ITEMS,
]);

export const DEFAULT_TOOLBAR_LAYOUT = BASE_TOOLBAR_LAYOUT;

export function buildToolbarLayout(groups: ToolbarItem[][]): ToolbarItem[] {
	const items: ToolbarItem[] = [];

	for (const group of groups) {
		const normalizedGroup = normalizeToolbarLayout(group);
		if (normalizedGroup.length === 0) {
			continue;
		}

		if (items.length > 0 && items[items.length - 1] !== "sep") {
			items.push("sep");
		}

		items.push(...normalizedGroup);
	}

	return normalizeToolbarLayout(items);
}

export function normalizeToolbarLayout(layout: ToolbarItem[]): ToolbarItem[] {
	const normalized: ToolbarItem[] = [];
	const seenItems = new Set<NonSeparatorToolbarItem>();

	for (const item of layout) {
		if (item === "sep") {
			if (normalized.length === 0 || normalized[normalized.length - 1] === "sep") {
				continue;
			}

			normalized.push(item);
			continue;
		}

		if (seenItems.has(item)) {
			continue;
		}

		seenItems.add(item);
		normalized.push(item);
	}

	while (normalized[normalized.length - 1] === "sep") {
		normalized.pop();
	}

	return normalized;
}

export function mergeToolbarLayout(
	base: ToolbarItem[],
	extras?: ToolbarItem[],
): ToolbarItem[] {
	const core = stripTrailingHistoryItems(normalizeToolbarLayout(base));
	const normalizedExtras = normalizeToolbarLayout(extras ?? []);
	const mergedGroups =
		normalizedExtras.length > 0
			? [core, normalizedExtras, HISTORY_TOOLBAR_ITEMS]
			: [core, HISTORY_TOOLBAR_ITEMS];

	return buildToolbarLayout(mergedGroups);
}

export type ToolbarUiFeatures = {
	fullscreen?: boolean;
};

type Props = {
	disabled?: boolean;
	features: ToolbarFeatures;
	uiFeatures?: ToolbarUiFeatures;
	layout?: ToolbarItem[];
	selection?: SelectionSummary | null;
	dispatch?: (cmd: unknown, payload?: unknown) => void;
	commands?: {
		FORMAT_TEXT_COMMAND?: unknown;
		FORMAT_ELEMENT_COMMAND?: unknown;
		INDENT_CONTENT_COMMAND?: unknown;
		OUTDENT_CONTENT_COMMAND?: unknown;
		INSERT_UNORDERED_LIST_COMMAND?: unknown;
		INSERT_ORDERED_LIST_COMMAND?: unknown;
		REMOVE_LIST_COMMAND?: unknown;
		INSERT_CHECK_LIST_COMMAND?: unknown;
		INSERT_HORIZONTAL_RULE_COMMAND?: unknown;
		TOGGLE_LINK_COMMAND?: unknown;
		UNDO_COMMAND?: unknown;
		REDO_COMMAND?: unknown;
	};
	onChooseImage?: () => void;
	onInsertHorizontalRule?: () => void;
	onClearFormatting?: () => void;
	onInsertLinkLabel?: (payload: LinkTogglePayload, label: string) => boolean;
	onApplyLinkTarget?: (payload: LinkTogglePayload) => void;
	onApplyImageLinkTarget?: (payload: LinkTogglePayload | null) => void;
	linkPickerContext?: RichTextLinkPickerContext;
	onToggleFullscreen?: () => void;
	setBlockType?: (type: BlockType) => void;
	fullscreenActive?: boolean;
	openLinkOnSignal?: number;
};

function stripTrailingHistoryItems(layout: ToolbarItem[]): ToolbarItem[] {
	const core = [...layout];
	while (core.length > 0 && isTrailingToolbarItem(core[core.length - 1])) {
		core.pop();
	}

	return normalizeToolbarLayout(core);
}

function isTrailingToolbarItem(item: ToolbarItem | undefined): boolean {
	return item === "undo" || item === "redo" || item === "sep";
}

function levelToHeading(level: 1 | 2 | 3 | 4 | 5 | 6): BlockType {
	return `h${level}` as BlockType;
}

function isHeadingItem(item: ToolbarItem): item is HeadingToolbarItem {
	return (
		item === "h1" ||
		item === "h2" ||
		item === "h3" ||
		item === "h4" ||
		item === "h5" ||
		item === "h6"
	);
}

function toolbarItemIsEnabled(
	item: ToolbarItem,
	features: ToolbarFeatures,
): boolean {
	if (item === "sep") {
		return true;
	}

	if (isHeadingItem(item)) {
		return (
			Array.isArray(features.headingLevels) &&
			features.headingLevels.includes(
				Number(item.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6,
			)
		);
	}

	return readBooleanFeature(item, features);
}

function readBooleanFeature(
	item: NonSeparatorToolbarItem,
	features: ToolbarFeatures,
): boolean {
	switch (item) {
		case "undo":
			return !!features.undo;
		case "redo":
			return !!features.redo;
		case "bold":
			return !!features.bold;
		case "italic":
			return !!features.italic;
		case "underline":
			return !!features.underline;
		case "strikethrough":
			return !!features.strikethrough;
		case "code":
			return !!features.code;
		case "subscript":
			return !!features.subscript;
		case "superscript":
			return !!features.superscript;
		case "clear_format":
			return !!features.clear_format;
		case "paragraph":
			return !!features.paragraph;
		case "quote":
			return !!features.quote;
		case "h1":
		case "h2":
		case "h3":
		case "h4":
		case "h5":
		case "h6":
			return false;
		case "list_bullet":
			return !!features.list_bullet;
		case "list_number":
			return !!features.list_number;
		case "list_check":
			return !!features.list_check;
		case "indent":
			return !!features.indent;
		case "outdent":
			return !!features.outdent;
		case "align_left":
			return !!features.align_left;
		case "align_center":
			return !!features.align_center;
		case "align_right":
			return !!features.align_right;
		case "align_justify":
			return !!features.align_justify;
		case "link_toggle":
			return !!features.link_toggle;
		case "image":
			return !!features.image;
		case "horizontal_rule":
			return !!features.horizontal_rule;
	}
}

function toolbarHint(
	label: string,
	shortcut?: string,
): { title: string; "aria-label": string } {
	const title = shortcut ? `${label} - ${shortcut}` : label;
	return {
		title,
		"aria-label": title,
	};
}

export default function RichTextEditorToolbar({
	disabled,
	features,
	uiFeatures,
	layout = DEFAULT_TOOLBAR_LAYOUT,
	selection,
	dispatch,
	commands,
	onChooseImage,
	onInsertHorizontalRule,
	onClearFormatting,
	onInsertLinkLabel,
	onApplyLinkTarget,
	onApplyImageLinkTarget,
	linkPickerContext = "admin",
	onToggleFullscreen,
	setBlockType,
	fullscreenActive,
	openLinkOnSignal,
}: Props): React.JSX.Element {
	const [linkOpen, setLinkOpen] = React.useState(false);
	const lastSignal = React.useRef<number | undefined>(openLinkOnSignal);

	const prefetchLinkPicker = React.useCallback(() => {
		prefetchRichTextLinkPickerContext(linkPickerContext);
	}, [linkPickerContext]);

	React.useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		type IdleWindow = Window & {
			requestIdleCallback?: (
				callback: () => void,
				options?: { timeout: number },
			) => number;
			cancelIdleCallback?: (handle: number) => void;
		};
		const idleWindow = window as IdleWindow;
		if (!idleWindow.requestIdleCallback) {
			return;
		}

		const handle = idleWindow.requestIdleCallback(prefetchLinkPicker, {
			timeout: 1600,
		});
		return () => idleWindow.cancelIdleCallback?.(handle);
	}, [prefetchLinkPicker]);

	React.useEffect(() => {
		if (openLinkOnSignal === undefined) return;
		if (openLinkOnSignal === lastSignal.current) return;
		lastSignal.current = openLinkOnSignal;
		setLinkOpen(true);
	}, [openLinkOnSignal]);

	function doCommand(command?: unknown, payload?: unknown): void {
		if (!dispatch || !command) return;
		dispatch(command, payload);
	}

	function onLinkApply(value: LinkApplyValue | null): void {
		if (selection?.at.image) {
			onApplyImageLinkTarget?.(value?.payload ?? null);
			return;
		}

		if (!value) {
			doCommand(commands?.TOGGLE_LINK_COMMAND, null);
			return;
		}

		if (value.label && value.label.trim().length > 0) {
			const inserted = onInsertLinkLabel?.(value.payload, value.label.trim());
			if (inserted) {
				return;
			}
		}

		doCommand(commands?.TOGGLE_LINK_COMMAND, value.payload);
		onApplyLinkTarget?.(value.payload);
	}

	function buttonProps(_key: string, active: boolean | undefined) {
		return {
			size: "xs" as const,
			disabled,
			variant: active ? ("primary" as const) : ("secondary" as const),
			"aria-pressed": Boolean(active),
			"data-active": active ? "true" : "false",
			className: "richtext-toolbar-button",
		};
	}

	function renderItem(item: ToolbarItem, index: number): React.ReactNode {
		if (!toolbarItemIsEnabled(item, features)) return null;

		if (item === "sep") {
			return (
				<span key={`sep-${index}`} className="richtext-toolbar-separator">
					|
				</span>
			);
		}

		if (item === "undo") {
			return (
				<Button
					{...buttonProps("undo", false)}
					onClick={() => doCommand(commands?.UNDO_COMMAND)}
					{...toolbarHint("Undo", "Ctrl/Cmd+Z")}
				>
					Undo
				</Button>
			);
		}

		if (item === "redo") {
			return (
				<Button
					{...buttonProps("redo", false)}
					onClick={() => doCommand(commands?.REDO_COMMAND)}
					{...toolbarHint("Redo", "Ctrl/Cmd+Y")}
				>
					Redo
				</Button>
			);
		}

		if (item === "bold") {
			return (
				<Button
					{...buttonProps("bold", selection?.formats.bold)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "bold")}
					{...toolbarHint("Bold", "Ctrl/Cmd+B")}
				>
					<span className="richtext-toolbar-mark--strong">B</span>
				</Button>
			);
		}

		if (item === "italic") {
			return (
				<Button
					{...buttonProps("italic", selection?.formats.italic)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "italic")}
					{...toolbarHint("Italic", "Ctrl/Cmd+I")}
				>
					<span className="richtext-toolbar-mark--italic">I</span>
				</Button>
			);
		}

		if (item === "underline") {
			return (
				<Button
					{...buttonProps("underline", selection?.formats.underline)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "underline")}
					{...toolbarHint("Underline", "Ctrl/Cmd+U")}
				>
					<span className="richtext-toolbar-mark--underline">U</span>
				</Button>
			);
		}

		if (item === "strikethrough") {
			return (
				<Button
					{...buttonProps("strikethrough", selection?.formats.strikethrough)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "strikethrough")}
					{...toolbarHint("Strikethrough")}
				>
					<span className="richtext-toolbar-mark--strike">S</span>
				</Button>
			);
		}

		if (item === "code") {
			return (
				<Button
					{...buttonProps("code", selection?.formats.code)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "code")}
					{...toolbarHint("Inline code")}
				>
					<span className="richtext-toolbar-mark--code">&lt;/&gt;</span>
				</Button>
			);
		}

		if (item === "subscript") {
			return (
				<Button
					{...buttonProps("sub", selection?.formats.subscript)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "subscript")}
					{...toolbarHint("Subscript")}
				>
					<span className="richtext-toolbar-mark--baseline">
						x<sub>2</sub>
					</span>
				</Button>
			);
		}

		if (item === "superscript") {
			return (
				<Button
					{...buttonProps("sup", selection?.formats.superscript)}
					onClick={() => doCommand(commands?.FORMAT_TEXT_COMMAND, "superscript")}
					{...toolbarHint("Superscript")}
				>
					<span className="richtext-toolbar-mark--baseline">
						x<sup>2</sup>
					</span>
				</Button>
			);
		}

		if (item === "clear_format") {
			return (
				<Button
					{...buttonProps("clear-format", false)}
					onClick={() => onClearFormatting?.()}
					{...toolbarHint("Clear selected formatting")}
				>
					Tx
				</Button>
			);
		}

		if (item === "paragraph") {
			return (
				<Button
					{...buttonProps("p", selection?.block === "paragraph")}
					onClick={() => setBlockType?.("paragraph")}
					{...toolbarHint("Paragraph")}
				>
					¶
				</Button>
			);
		}

		if (item === "quote") {
			return (
				<Button
					{...buttonProps("quote", selection?.block === "quote")}
					onClick={() => setBlockType?.("quote")}
					{...toolbarHint("Blockquote")}
				>
					❝
				</Button>
			);
		}

		if (isHeadingItem(item)) {
			const level = Number(item.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6;
			return (
				<Button
					{...buttonProps(item, selection?.block === item)}
					onClick={() => setBlockType?.(levelToHeading(level))}
					{...toolbarHint(`Heading ${level}`)}
				>
					<span className="richtext-toolbar-mark--strong">H{level}</span>
				</Button>
			);
		}

		if (item === "list_bullet") {
			return (
				<Button
					{...buttonProps("ul", selection?.list === "bullet")}
					onClick={() => doCommand(commands?.INSERT_UNORDERED_LIST_COMMAND)}
					{...toolbarHint("Bulleted list")}
				>
					•
				</Button>
			);
		}

		if (item === "list_number") {
			return (
				<Button
					{...buttonProps("ol", selection?.list === "number")}
					onClick={() => doCommand(commands?.INSERT_ORDERED_LIST_COMMAND)}
					{...toolbarHint("Numbered list")}
				>
					1.
				</Button>
			);
		}

		if (item === "list_check") {
			return (
				<Button
					{...buttonProps("list-check", selection?.list === "check")}
					onClick={() =>
						doCommand(
							commands?.INSERT_CHECK_LIST_COMMAND ??
								commands?.INSERT_UNORDERED_LIST_COMMAND,
						)
					}
					{...toolbarHint("Checklist")}
				>
					☑︎
				</Button>
			);
		}

		if (item === "indent") {
			return (
				<Button
					{...buttonProps("indent", false)}
					onClick={() => doCommand(commands?.INDENT_CONTENT_COMMAND)}
					{...toolbarHint("Indent")}
				>
					→
				</Button>
			);
		}

		if (item === "outdent") {
			return (
				<Button
					{...buttonProps("outdent", false)}
					onClick={() => doCommand(commands?.OUTDENT_CONTENT_COMMAND)}
					{...toolbarHint("Outdent")}
				>
					←
				</Button>
			);
		}

		if (item === "align_left") {
			return (
				<Button
					{...buttonProps("al", false)}
					onClick={() => doCommand(commands?.FORMAT_ELEMENT_COMMAND, "left")}
					{...toolbarHint("Align left")}
				>
					⟸
				</Button>
			);
		}

		if (item === "align_center") {
			return (
				<Button
					{...buttonProps("ac", false)}
					onClick={() => doCommand(commands?.FORMAT_ELEMENT_COMMAND, "center")}
					{...toolbarHint("Align center")}
				>
					⇔
				</Button>
			);
		}

		if (item === "align_right") {
			return (
				<Button
					{...buttonProps("ar", false)}
					onClick={() => doCommand(commands?.FORMAT_ELEMENT_COMMAND, "right")}
					{...toolbarHint("Align right")}
				>
					⟹
				</Button>
			);
		}

		if (item === "align_justify") {
			return (
				<Button
					{...buttonProps("aj", false)}
					onClick={() => doCommand(commands?.FORMAT_ELEMENT_COMMAND, "justify")}
					{...toolbarHint("Justify")}
				>
					≡
				</Button>
			);
		}

		if (item === "link_toggle") {
			return (
				<React.Fragment key="link-toggle">
					<Button
						{...buttonProps("link", selection?.hasLink)}
						onPointerEnter={prefetchLinkPicker}
						onFocus={prefetchLinkPicker}
						onClick={() => setLinkOpen((isOpen) => !isOpen)}
						{...toolbarHint(selection?.hasLink ? "Edit link" : "Add link")}
					>
						Link
					</Button>
					{linkOpen && typeof document !== "undefined"
						? createPortal(
								<LinkPickerPopup
									open
									onApply={onLinkApply}
									mediaContext={linkPickerContext}
									onClose={() => setLinkOpen(false)}
								/>,
								document.body,
							)
						: null}
				</React.Fragment>
			);
		}

		if (item === "image") {
			return (
				<Button
					{...buttonProps("image", Boolean(selection?.at.image))}
					onClick={() => onChooseImage?.()}
					{...toolbarHint("Insert image")}
				>
					Image
				</Button>
			);
		}

		if (item === "horizontal_rule") {
			return (
				<Button
					{...buttonProps("hr", Boolean(selection?.at.hr))}
					onClick={() => {
						if (commands?.INSERT_HORIZONTAL_RULE_COMMAND) {
							doCommand(commands.INSERT_HORIZONTAL_RULE_COMMAND);
							return;
						}
						onInsertHorizontalRule?.();
					}}
					{...toolbarHint("Horizontal rule")}
				>
					HR
				</Button>
			);
		}

		return null;
	}

	function renderFullscreenButton(): React.ReactNode {
		if (!uiFeatures?.fullscreen || !onToggleFullscreen) {
			return null;
		}

		return (
			<Button
				type="button"
				size="xs"
				disabled={disabled}
				variant={fullscreenActive ? "primary" : "secondary"}
				aria-pressed={Boolean(fullscreenActive)}
				data-active={fullscreenActive ? "true" : "false"}
				className="richtext-toolbar-button richtext-toolbar-button--icon"
				onClick={() => onToggleFullscreen()}
				{...toolbarHint(fullscreenActive ? "Exit full screen" : "Full screen")}
			>
				{fullscreenActive ? <CollapseIcon /> : <ExpandIcon />}
			</Button>
		);
	}

	const visibleLayout = normalizeToolbarLayout(
		layout.filter((item) => toolbarItemIsEnabled(item, features)),
	);
	const fullscreenButton = renderFullscreenButton();

	return (
		<div className="richtext-toolbar-wrap">
			<div className="richtext-toolbar">
				<div className="richtext-toolbar__items">
					{visibleLayout.map((item, index) => (
						<React.Fragment key={`${item}-${index}`}>
							{renderItem(item, index)}
						</React.Fragment>
					))}
				</div>
				{fullscreenButton ? (
					<div className="richtext-toolbar__fullscreen">{fullscreenButton}</div>
				) : null}
			</div>
		</div>
	);
}

function ExpandIcon(): React.JSX.Element {
	return (
		<svg
			aria-hidden="true"
			className="richtext-toolbar-icon"
			viewBox="0 0 16 16"
			fill="none"
		>
			<path
				d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.5 2.5 6 6M13.5 2.5 10 6M2.5 13.5 6 10M13.5 13.5 10 10"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function CollapseIcon(): React.JSX.Element {
	return (
		<svg
			aria-hidden="true"
			className="richtext-toolbar-icon"
			viewBox="0 0 16 16"
			fill="none"
		>
			<path
				d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M6 6 2.5 2.5M10 6l3.5-3.5M6 10l-3.5 3.5M10 10l3.5 3.5"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
			/>
		</svg>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
