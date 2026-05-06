//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/BooleanFieldRenderer.tsx                              ////
//// Language: TSX                                                                                                ////
//// Renders boolean content fields as compact yes/no badges.                                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { hasRenderableValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type BooleanFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

export default function BooleanFieldRenderer({
	field,
	showLabel = true,
}: BooleanFieldRendererProps): JSX.Element | null {
	if (!hasRenderableValue(field.value)) {
		return null;
	}

	const enabled = field.value === true;

	return (
		<ContentFieldFrame field={field} showLabel={showLabel} valueTextClassName="content-field-value--compact">
			<span className="content-field-pill">
				{enabled ? "Yes" : "No"}
			</span>
		</ContentFieldFrame>
	);
}
