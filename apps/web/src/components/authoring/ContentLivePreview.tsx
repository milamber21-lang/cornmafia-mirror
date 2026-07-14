//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/authoring/ContentLivePreview.tsx                                              ////
//// Language: TSX                                                                                               ////
//// Debounced client shell for rendering unsaved content through the guarded server-side content renderer.      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import { SurfaceState } from "@/components/ui";
import type { ContentPreviewRequest } from "@/lib/helpers/content-preview";

type PreviewResponse = {
	html?: unknown;
	message?: unknown;
};

export type ContentPreviewViewport = "desktop" | "mobile";

export type ContentLivePreviewProps = {
	active: boolean;
	endpoint: string;
	draft: ContentPreviewRequest;
	viewport: ContentPreviewViewport;
};

function readMessage(value: unknown, fallback: string): string {
	if (
		typeof value === "object" &&
		value !== null &&
		"message" in value &&
		typeof (value as { message?: unknown }).message === "string"
	) {
		return (value as { message: string }).message;
	}
	return fallback;
}

export default function ContentLivePreview({
	active,
	endpoint,
	draft,
	viewport,
}: ContentLivePreviewProps): React.JSX.Element {
	const [html, setHtml] = React.useState("");
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState("");
	const requestKey = React.useMemo(() => JSON.stringify(draft), [draft]);

	React.useEffect(() => {
		if (!active) {
			return;
		}

		const controller = new AbortController();
		const timer = window.setTimeout(() => {
			setLoading(true);
			setError("");

			void fetch(endpoint, {
				method: "POST",
				credentials: "include",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: requestKey,
				signal: controller.signal,
			})
				.then(async (response) => {
					const body: unknown = await response.json().catch(() => ({}));
					if (!response.ok) {
						throw new Error(readMessage(body, "Failed to render preview."));
					}
					const payload = body as PreviewResponse;
					if (typeof payload.html !== "string") {
						throw new Error("Preview response was incomplete.");
					}
					setHtml(payload.html);
				})
				.catch((previewError: unknown) => {
					if (controller.signal.aborted) {
						return;
					}
					setError(
						previewError instanceof Error
							? previewError.message
							: "Failed to render preview.",
					);
				})
				.finally(() => {
					if (!controller.signal.aborted) {
						setLoading(false);
					}
				});
		}, 320);

		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	}, [active, endpoint, requestKey]);

	if (!active) {
		return (
			<div className="content-live-preview content-live-preview--inactive" />
		);
	}

	return (
		<div
			className={`content-live-preview content-live-preview--${viewport}`}
			data-content-preview-viewport={viewport}
		>
			{loading && html.length === 0 ? (
				<SurfaceState
					kind="loading"
					title="Rendering preview"
					description="Using the current unsaved form values."
				/>
			) : null}
			{error.length > 0 ? (
				<SurfaceState
					kind="error"
					title="Preview unavailable"
					description={error}
				/>
			) : null}
			{html.length > 0 ? (
				<div
					className="content-live-preview__html"
					onClickCapture={(event) => {
						const target = event.target;
						if (target instanceof Element && target.closest("a, button, form")) {
							event.preventDefault();
						}
					}}
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			) : null}
			{loading && html.length > 0 ? (
				<div className="content-live-preview__refreshing" role="status">
					Refreshing preview…
				</div>
			) : null}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
