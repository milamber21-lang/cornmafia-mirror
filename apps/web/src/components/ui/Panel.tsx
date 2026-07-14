//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/Panel.tsx                                                                   ////
//// Language: TSX                                                                                                ////
//// Slide-in panel shell with sticky header and close handling                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/basic-elements/Button";
import Separator from "@/components/ui/basic-elements/Separator";
import { confirmAction } from "@/lib/client/confirm-dialog";

type WidthPreset = "25%" | "50%" | "75%" | "100%";

type PanelConstrainedStyle = React.CSSProperties & {
	"--ui-panel-content-max-width"?: string;
};

const EDITOR_PICKER_OPEN_ATTRIBUTE = "data-richtext-editor-picker-open";
const EDITOR_FULLSCREEN_OPEN_ATTRIBUTE = "data-richtext-editor-fullscreen-open";

function isEditorPickerOpen(): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	return document.body.getAttribute(EDITOR_PICKER_OPEN_ATTRIBUTE) === "true";
}

function isEditorFullscreenOpen(): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	return document.body.getAttribute(EDITOR_FULLSCREEN_OPEN_ATTRIBUTE) === "true";
}

function getPanelWidthClass(width: WidthPreset): string {
	switch (width) {
		case "25%":
			return "ui-panel-sheet--width-25";
		case "50%":
			return "ui-panel-sheet--width-50";
		case "75%":
			return "ui-panel-sheet--width-75";
		case "100%":
			return "ui-panel-sheet--width-100";
	}
}

export interface PanelProps {
	open: boolean;
	onClose: () => void;

	/** Sheet width (presets). Default "50%". */
	width?: WidthPreset;

	/** When true, clicking the backdrop will close (default true). */
	backdropClosable?: boolean;

	/** Disable interactions and close while busy. */
	loading?: boolean;

	/** Center Save button visibility (if provided). */
	showSave?: boolean;

	/** Header title (left). */
	title: React.ReactNode;

	/** Render a Save button in the center (you control its click + disabled state). */
	renderSave?: () => React.ReactNode;

	/** Right-side header content (default Close button). */
	renderRight?: () => React.ReactNode;

	/** Panel content (below the header + separator). */
	children?: React.ReactNode;

	/** If true, prevent close and ask for confirmation when attempting to close. */
	dirtyGuard?: boolean;

	/** Optional aria-label/id wiring */
	labelledById?: string;

	/**
	 * Constrain the inner content width and center it.
	 * - Provide a pixel value (e.g., 960) to center content and cap its width.
	 * - If `null` or `undefined`, content uses the full panel width.
	 */
	contentMaxWidthPx?: number | null;
}

export default function Panel({
	open,
	onClose,
	width = "50%",
	backdropClosable = true,
	loading = false,
	showSave = true,
	title,
	renderSave,
	renderRight,
	children,
	dirtyGuard = false,
	labelledById,
	contentMaxWidthPx,
}: PanelProps) {
	const previouslyFocused = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (open) {
			previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
			setTimeout(() => {
				const el = document.getElementById("__panel_root");
				el?.focus();
			}, 0);
		} else {
			previouslyFocused.current?.focus?.();
		}
	}, [open]);

	useEffect(() => {
		if (!open) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				if (isEditorFullscreenOpen()) {
					return;
				}

				if (isEditorPickerOpen()) {
					e.stopPropagation();
					return;
				}

				e.stopPropagation();
				void attemptClose();
			}
		}
		document.addEventListener("keydown", onKey, true);
		return () => document.removeEventListener("keydown", onKey, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, loading, dirtyGuard]);

	async function attemptClose(): Promise<void> {
		if (loading) return;
		if (dirtyGuard) {
			const ok = await confirmAction({
				title: "Discard unsaved changes?",
				message: "You have unsaved changes. Discard them and close?",
				confirmLabel: "Discard",
				destructive: true,
			});
			if (!ok) return;
		}
		onClose();
	}

	const constrain =
		typeof contentMaxWidthPx === "number" && contentMaxWidthPx > 0;
	const constrainedStyle: PanelConstrainedStyle | undefined = constrain
		? { "--ui-panel-content-max-width": `${contentMaxWidthPx}px` }
		: undefined;

	return (
		<div
			aria-hidden={!open}
			className={
				open
					? "ui-panel-root ui-panel-root--open"
					: "ui-panel-root ui-panel-root--closed"
			}
		>
			{/* Backdrop */}
			<div
				className={
					open
						? "ui-panel-backdrop ui-panel-backdrop--open"
						: "ui-panel-backdrop ui-panel-backdrop--closed"
				}
				onClick={() => {
					if (!open) return;
					if (!backdropClosable) return;
					void attemptClose();
				}}
			/>

			{/* Panel */}
			<div
				id="__panel_root"
				tabIndex={-1}
				role="dialog"
				aria-modal="true"
				aria-labelledby={labelledById}
				className={
					open
						? `ui-panel-sheet ui-panel-sheet--open ${getPanelWidthClass(width)}`
						: `ui-panel-sheet ui-panel-sheet--closed ${getPanelWidthClass(width)}`
				}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header (sticky) */}
				<div className="ui-panel-header">
					<div className="ui-panel-header__grid">
						<div className="ui-panel-header__title-slot">
							<h2 id={labelledById} className="ui-panel-title">
								{title}
							</h2>
						</div>

						<div className="ui-panel-header__save-slot">
							{showSave && typeof renderSave === "function" ? renderSave() : null}
						</div>

						<div className="ui-panel-header__right-slot">
							{typeof renderRight === "function" ? (
								renderRight()
							) : (
								<Button
									variant="secondary"
									onClick={() => {
										void attemptClose();
									}}
									disabled={loading}
									aria-label="Close panel"
								>
									Close
								</Button>
							)}
						</div>
					</div>

					<Separator />
				</div>

				{/* Body — the ONLY scroll container */}
				<div className="ui-panel-body ui-scroll sb-stable">
					{constrain ? (
						<div className="ui-panel-body__constrained" style={constrainedStyle}>
							{children}
						</div>
					) : (
						children
					)}
				</div>
			</div>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
