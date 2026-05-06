//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/OptionFieldRenderer.tsx                               ////
//// Language: TSX                                                                                                ////
//// Renders option fields using the resolved option label when available.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { formatPrimitiveValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type OptionFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

export default function OptionFieldRenderer({
	field,
	showLabel = true,
}: OptionFieldRendererProps): JSX.Element | null {
	const formattedValue = formatPrimitiveValue(field);
	if (!formattedValue) {
		return null;
	}

	return (
		<ContentFieldFrame field={field} showLabel={showLabel} valueTextClassName="content-field-value--compact">
			<span className="content-field-pill">
				{formattedValue}
			</span>
		</ContentFieldFrame>
	);
}
