//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/RichTextEditorShell.tsx                                       ////
//// Language: TSX                                                                                                ////
//// Lexical editor shell with toolbar, plugins, and page-width editing surface.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import * as React from "react";
import { normalizeRichTextEditorOutput } from "@/lib/editors/richtext/rich-text-json";

import type {
	RichTextEditorCanvasLayoutMode,
	UnknownRecord,
} from "./RichTextEditorTypes";
import type { SelectionSummary } from "./RichTextEditorToolbar";
import {
	RichTextLinkClickTrackerPlugin,
	type AnchorRect,
} from "./plugins/RichTextLinkClickTrackerPlugin";
import { RichTextSelectionTrackerPlugin } from "./plugins/RichTextSelectionTrackerPlugin";
import { RichTextSemanticPasteCleanupPlugin } from "./plugins/RichTextSemanticPasteCleanupPlugin";

type Props = {
	deps: {
		LexicalComposer: unknown;
		RichTextPlugin: unknown;
		ContentEditable: unknown;
		HistoryPlugin: unknown | null;
		OnChangePlugin: unknown;
		ListPlugin: unknown | null;
		CheckListPlugin?: unknown | null;
		LinkPlugin: unknown | null;
		HorizontalRulePlugin?: unknown | null;
		LexicalErrorBoundary?: unknown | null;
	};
	lexicalNS?: UnknownRecord | null;
	theme: UnknownRecord;
	nodes: unknown[];
	editable: boolean;
	fullscreenActive?: boolean;
	canvasLayoutMode?: RichTextEditorCanvasLayoutMode;
	editorSessionKey: string;
	onChange: (json: unknown) => void;
	init: (editor: unknown) => void;
	renderToolbar?: (api: {
		dispatch?: (cmd: unknown, payload?: unknown) => void;
		formatTextCommand?: unknown;
		withUpdate?: (fn: () => void) => void;
		selection?: SelectionSummary | null;
		linkOpenSignal?: number;
		linkAnchor?: AnchorRect | null;
	}) => React.ReactNode;
	onRuntimeError?: (err: unknown) => void;
};

type ComposerProps = {
	initialConfig: UnknownRecord;
	children?: React.ReactNode;
};
type ErrorBoundaryProps = { children?: React.ReactNode };
type RTPProps = {
	contentEditable: React.ReactNode;
	placeholder?: React.ReactNode;
	ErrorBoundary?: React.ComponentType<ErrorBoundaryProps>;
};
type ContentEditableProps = { className?: string };
type HistoryPluginProps = Record<string, unknown>;
type ListPluginProps = Record<string, unknown>;
type CheckListPluginProps = Record<string, unknown>;
type LinkPluginProps = Record<string, unknown>;
type HRPluginProps = Record<string, unknown>;
type OnChangeProps = { onChange: (s: unknown) => void };

function asComponent<P>(x: unknown): React.ComponentType<P> | null {
	if (!x) return null;
	if (typeof x === "function") return x as unknown as React.ComponentType<P>;
	if (
		typeof x === "object" &&
		x !== null &&
		(x as { $$typeof?: unknown }).$$typeof
	) {
		return x as unknown as React.ComponentType<P>;
	}
	return null;
}

export default function RichTextEditorShell({
	deps,
	theme,
	nodes,
	editable,
	fullscreenActive = false,
	canvasLayoutMode = "full",
	editorSessionKey,
	onChange,
	init,
	renderToolbar,
	onRuntimeError,
}: Props) {
	const Composer = asComponent<ComposerProps>(deps.LexicalComposer);
	const RTP = asComponent<RTPProps>(deps.RichTextPlugin);
	const ContentEditableComp = asComponent<ContentEditableProps>(
		deps.ContentEditable,
	);
	const HistoryPluginComp = deps.HistoryPlugin
		? asComponent<HistoryPluginProps>(deps.HistoryPlugin)
		: null;
	const OnChangePluginComp = asComponent<OnChangeProps>(deps.OnChangePlugin);
	const ListPluginComp = deps.ListPlugin
		? asComponent<ListPluginProps>(deps.ListPlugin)
		: null;
	const CheckListPluginComp = deps.CheckListPlugin
		? asComponent<CheckListPluginProps>(deps.CheckListPlugin)
		: null;
	const LinkPluginComp = deps.LinkPlugin
		? asComponent<LinkPluginProps>(deps.LinkPlugin)
		: null;
	const HRPluginComp = deps.HorizontalRulePlugin
		? asComponent<HRPluginProps>(deps.HorizontalRulePlugin)
		: null;
	const LexicalErrorBoundaryComp = deps.LexicalErrorBoundary
		? asComponent<ErrorBoundaryProps>(deps.LexicalErrorBoundary)
		: null;

	const [LazyCheckList, setLazyCheckList] =
		React.useState<React.ComponentType<CheckListPluginProps> | null>(null);
	React.useEffect(() => {
		let mounted = true;
		if (!CheckListPluginComp) {
			(async () => {
				try {
					const mod: unknown = await import(
						"@lexical/react/LexicalCheckListPlugin"
					);
					const C = asComponent<CheckListPluginProps>(
						(mod as { default?: unknown }).default,
					);
					if (mounted) setLazyCheckList(C);
				} catch {}
			})();
		}
		return () => {
			mounted = false;
		};
	}, [CheckListPluginComp]);

	const editorRef = React.useRef<unknown>(null);
	const [selection, setSelection] = React.useState<SelectionSummary | null>(
		null,
	);
	const [linkAnchor, setLinkAnchor] = React.useState<AnchorRect | null>(null);
	const [linkSignal, setLinkSignal] = React.useState(0);

	const onEditorChange = (editorState: unknown) => {
		if (
			typeof editorState === "object" &&
			editorState &&
			"toJSON" in (editorState as object)
		) {
			const toJSON = (editorState as { toJSON?: () => unknown }).toJSON;
			if (typeof toJSON === "function") {
				try {
					const jsonRaw = toJSON.call(editorState);
					onChange(normalizeRichTextEditorOutput(jsonRaw));
				} catch (e) {
					onRuntimeError?.(e);
				}
			}
		}
	};

	const initialConfig: UnknownRecord = React.useMemo(
		() => ({
			namespace: `cm-admin-${editorSessionKey}`,
			editable,
			theme,
			nodes,
			onError: (err: unknown) => {
				onRuntimeError?.(err);
			},
			editorState: (editor: unknown) => {
				if (!editorRef.current) editorRef.current = editor;
				init(editor);
			},
		}),
		[editable, theme, nodes, init, onRuntimeError, editorSessionKey],
	);

	const dispatch = React.useCallback((cmd: unknown, payload?: unknown) => {
		const r = editorRef.current as {
			dispatchCommand?: (c: unknown, p?: unknown) => void;
		} | null;
		if (r?.dispatchCommand && typeof r.dispatchCommand === "function")
			r.dispatchCommand(cmd, payload);
	}, []);

	const withUpdate = React.useCallback((fn: () => void) => {
		const r = editorRef.current as { update?: (f: () => void) => void } | null;
		if (r?.update) r.update(fn);
	}, []);

	const formatTextCommand = React.useMemo(() => undefined as unknown, []);

	if (!Composer || !RTP || !ContentEditableComp || !OnChangePluginComp) {
		return (
			<div className="richtext richtext-editor-unavailable">
				Required editor pieces are not available. Check that{" "}
				<code>@lexical/react</code> packages are installed and loadable.
			</div>
		);
	}

	const CheckListComponent = CheckListPluginComp ?? LazyCheckList;

	const shellFrameClassName = fullscreenActive
		? "richtext-editor-shell-frame richtext-editor-shell-frame--fullscreen"
		: "richtext-editor-shell-frame";
	const shellInnerClassName = fullscreenActive
		? "richtext-editor-shell-inner richtext-editor-shell-inner--fullscreen"
		: "richtext-editor-shell-inner";
	const richTextShellClassName = fullscreenActive
		? "richtext-shell richtext-shell--fullscreen"
		: "richtext-shell";
	const editorCanvasClassName =
		"richtext richtext-editor-canvas richtext-editor-canvas--editable";

	return (
		<div
			className={shellFrameClassName}
			data-richtext-editor-canvas-layout={canvasLayoutMode}
		>
			<div className={shellInnerClassName}>
				<Composer initialConfig={initialConfig}>
					<RichTextSelectionTrackerPlugin onSelection={setSelection} />
					<RichTextLinkClickTrackerPlugin
						onOpen={(r) => {
							setLinkAnchor(r);
							setLinkSignal((s) => s + 1);
						}}
					/>
					<RichTextSemanticPasteCleanupPlugin />

					{renderToolbar
						? renderToolbar({
								dispatch,
								formatTextCommand,
								withUpdate,
								selection,
								linkOpenSignal: linkSignal,
								linkAnchor,
							})
						: null}

					<div className={richTextShellClassName}>
						<RTP
							contentEditable={
								<ContentEditableComp className={editorCanvasClassName} />
							}
							ErrorBoundary={LexicalErrorBoundaryComp ?? undefined}
						/>
					</div>

					{HistoryPluginComp ? <HistoryPluginComp /> : null}
					{ListPluginComp ? <ListPluginComp /> : null}
					{CheckListComponent ? <CheckListComponent /> : null}
					{LinkPluginComp ? <LinkPluginComp /> : null}
					{HRPluginComp ? <HRPluginComp /> : null}

					<OnChangePluginComp onChange={onEditorChange} />
				</Composer>
			</div>
		</div>
	);
}
