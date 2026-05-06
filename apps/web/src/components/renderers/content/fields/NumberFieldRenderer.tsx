//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/NumberFieldRenderer.tsx                               ////
//// Language: TSX                                                                                                ////
//// Renders numeric content fields.                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { formatPrimitiveValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type NumberFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

const valueTextClassName = "content-field-value content-field-value--numeric";

export default function NumberFieldRenderer({
	field,
	showLabel = true,
}: NumberFieldRendererProps): JSX.Element | null {
	const formattedValue = formatPrimitiveValue(field);
	if (!formattedValue) {
		return null;
	}

	return (
		<ContentFieldFrame
			field={field}
			showLabel={showLabel}
			valueTextClassName={valueTextClassName}
		>
			<p className={valueTextClassName}>{formattedValue}</p>
		</ContentFieldFrame>
	);
}
