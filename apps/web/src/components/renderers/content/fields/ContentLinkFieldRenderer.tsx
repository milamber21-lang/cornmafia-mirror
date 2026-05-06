//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/ContentLinkFieldRenderer.tsx                          ////
//// Language: TSX                                                                                                ////
//// Renders content-reference fields with a safe placeholder until DB link metadata is exposed to the model.     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { hasRenderableValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type ContentLinkFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

export default function ContentLinkFieldRenderer({
	field,
	showLabel = true,
}: ContentLinkFieldRendererProps): JSX.Element | null {
	if (!hasRenderableValue(field.value)) {
		return null;
	}

	return (
		<ContentFieldFrame field={field} showLabel={showLabel} valueTextClassName="content-field-value">
			<div className="content-field-reference">
				Content reference id {String(field.value)}
			</div>
		</ContentFieldFrame>
	);
}
