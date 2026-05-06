//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/RichTextFieldRenderer.tsx                             ////
//// Language: TSX                                                                                                ////
//// Renders safe rich-text content fields through the shared rich-text renderer.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RichTextRenderer from "@/components/renderers/richtext/RichTextRenderer";

import ContentFieldFrame from "../ContentFieldFrame";
import { hasRenderableValue } from "../field-utils";
import type { ContentRenderField, ContentRenderModel } from "../types";

type RichTextFieldRendererProps = {
	field: ContentRenderField;
	model: ContentRenderModel;
	showLabel?: boolean;
};

export default async function RichTextFieldRenderer({
	field,
	model,
	showLabel = true,
}: RichTextFieldRendererProps): Promise<JSX.Element | null> {
	if (!hasRenderableValue(field.value)) {
		return null;
	}

	return (
		<ContentFieldFrame
			field={field}
			showLabel={showLabel}
			className="content-field-frame content-field-frame--richtext"
			valueTextClassName="content-field-value"
		>
			<RichTextRenderer
				value={field.value}
				externalLinkSurfaceScope={model.surfaceScope}
				mediaRouteScope={model.mediaRouteScope}
			/>
		</ContentFieldFrame>
	);
}
