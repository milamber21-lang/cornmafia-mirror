//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/authoring/ContentAuthoringWorkspace.tsx                                       ////
//// Language: TSX                                                                                               ////
//// Shared admin/member fields, split preview, viewport, and fullscreen authoring workspace.                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { Columns2, Expand, Monitor, Pencil, Smartphone, X } from "lucide-react";

import ContentFieldInputs, {
	type ContentFieldInputsProps,
} from "@/components/admin/web/ContentFieldInputs";
import { Button } from "@/components/ui";
import type { ContentPreviewRequest } from "@/lib/helpers/content-preview";

import ContentLivePreview, {
	type ContentPreviewViewport,
} from "./ContentLivePreview";

type ContentAuthoringMode = "fields" | "preview" | "split";

export type ContentAuthoringWorkspaceProps = {
	fieldInputProps: ContentFieldInputsProps;
	previewEndpoint: string;
	previewDraft: ContentPreviewRequest;
	title?: string;
};

function modeButtonVariant(
	current: ContentAuthoringMode,
	mode: ContentAuthoringMode,
): "primary" | "secondary" {
	return current === mode ? "primary" : "secondary";
}

function viewportButtonVariant(
	current: ContentPreviewViewport,
	viewport: ContentPreviewViewport,
): "primary" | "secondary" {
	return current === viewport ? "primary" : "secondary";
}

export default function ContentAuthoringWorkspace({
	fieldInputProps,
	previewEndpoint,
	previewDraft,
	title = "Template Fields",
}: ContentAuthoringWorkspaceProps): React.JSX.Element {
	const [mode, setMode] = React.useState<ContentAuthoringMode>("fields");
	const [viewport, setViewport] =
		React.useState<ContentPreviewViewport>("desktop");
	const [fullscreen, setFullscreen] = React.useState(false);
	const previewActive = mode !== "fields" || fullscreen;

	React.useEffect(() => {
		if (!fullscreen) {
			return;
		}
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === "Escape") {
				setFullscreen(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [fullscreen]);

	const preview = (
		<ContentLivePreview
			active={previewActive}
			endpoint={previewEndpoint}
			draft={previewDraft}
			viewport={viewport}
		/>
	);

	return (
		<section className="content-authoring-workspace">
			<div className="content-authoring-workspace__toolbar">
				<div className="content-authoring-workspace__heading">
					<h2>{title}</h2>
					<p>Edit fields and compare the unsaved page with the real renderer.</p>
				</div>
				<div className="content-authoring-workspace__controls">
					<div
						className="content-authoring-workspace__control-group"
						aria-label="Authoring mode"
					>
						<Button
							size="sm"
							variant={modeButtonVariant(mode, "fields")}
							leftIcon={<Pencil size={16} aria-hidden="true" />}
							onClick={() => setMode("fields")}
						>
							Fields
						</Button>
						<Button
							size="sm"
							variant={modeButtonVariant(mode, "preview")}
							leftIcon={<Monitor size={16} aria-hidden="true" />}
							onClick={() => setMode("preview")}
						>
							Preview
						</Button>
						<Button
							size="sm"
							variant={modeButtonVariant(mode, "split")}
							leftIcon={<Columns2 size={16} aria-hidden="true" />}
							onClick={() => setMode("split")}
						>
							Split
						</Button>
					</div>
					<div
						className="content-authoring-workspace__control-group"
						aria-label="Preview viewport"
					>
						<Button
							size="sm"
							variant={viewportButtonVariant(viewport, "desktop")}
							leftIcon={<Monitor size={16} aria-hidden="true" />}
							onClick={() => setViewport("desktop")}
						>
							Desktop
						</Button>
						<Button
							size="sm"
							variant={viewportButtonVariant(viewport, "mobile")}
							leftIcon={<Smartphone size={16} aria-hidden="true" />}
							onClick={() => setViewport("mobile")}
						>
							Mobile
						</Button>
						<Button
							size="sm"
							variant="secondary"
							leftIcon={<Expand size={16} aria-hidden="true" />}
							onClick={() => setFullscreen(true)}
						>
							Full screen
						</Button>
					</div>
				</div>
			</div>

			<div
				className={`content-authoring-workspace__body content-authoring-workspace__body--${mode}`}
				data-content-authoring-mode={mode}
			>
				{mode !== "preview" ? (
					<div className="content-authoring-workspace__fields">
						<ContentFieldInputs {...fieldInputProps} />
					</div>
				) : null}
				{mode !== "fields" && !fullscreen ? (
					<div className="content-authoring-workspace__preview">{preview}</div>
				) : null}
			</div>

			{fullscreen ? (
				<div
					className="content-authoring-preview-fullscreen"
					role="dialog"
					aria-modal="true"
					aria-label="Full-screen content preview"
				>
					<div className="content-authoring-preview-fullscreen__toolbar">
						<div className="content-authoring-workspace__control-group">
							<Button
								size="sm"
								variant={viewportButtonVariant(viewport, "desktop")}
								onClick={() => setViewport("desktop")}
							>
								Desktop
							</Button>
							<Button
								size="sm"
								variant={viewportButtonVariant(viewport, "mobile")}
								onClick={() => setViewport("mobile")}
							>
								Mobile
							</Button>
						</div>
						<Button
							size="sm"
							variant="secondary"
							leftIcon={<X size={16} aria-hidden="true" />}
							onClick={() => setFullscreen(false)}
						>
							Close
						</Button>
					</div>
					<div className="content-authoring-preview-fullscreen__body">{preview}</div>
				</div>
			) : null}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
