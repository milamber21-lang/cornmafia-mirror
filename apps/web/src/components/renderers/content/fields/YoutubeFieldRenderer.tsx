//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/YoutubeFieldRenderer.tsx                              ////
//// Language: TSX                                                                                               ////
//// Renders validated YouTube video URL fields as safe responsive embeds.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import { parseYoutubeVideoUrl } from "@/lib/helpers/youtube-url";

import ContentFieldFrame from "../ContentFieldFrame";
import type { ContentRenderField, ContentRenderModel } from "../types";

type YoutubeFieldRendererProps = {
	field: ContentRenderField;
	model: ContentRenderModel;
	showLabel?: boolean;
};

export default function YoutubeFieldRenderer({
	field,
	model,
	showLabel = true,
}: YoutubeFieldRendererProps): JSX.Element | null {
	const parsed = parseYoutubeVideoUrl(field.value);
	if (!parsed) {
		if (model.surfaceScope === "admin") {
			return (
				<ContentFieldFrame field={field} showLabel={showLabel}>
					<p className="content-field-warning">
						This field does not contain a valid YouTube video URL.
					</p>
				</ContentFieldFrame>
			);
		}

		return null;
	}

	return (
		<ContentFieldFrame field={field} showLabel={showLabel}>
			<div className="content-field-youtube-frame">
				<iframe
					className="content-field-youtube-iframe"
					src={parsed.embedUrl}
					title={field.label || "YouTube video"}
					loading="lazy"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerPolicy="strict-origin-when-cross-origin"
					allowFullScreen
				/>
			</div>
		</ContentFieldFrame>
	);
}
