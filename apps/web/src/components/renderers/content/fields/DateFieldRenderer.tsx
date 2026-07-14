//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/DateFieldRenderer.tsx                                 ////
//// Language: TSX                                                                                                ////
//// Renders date and timestamp content fields with consistent formatting.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { formatPrimitiveValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type DateFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

const valueTextClassName = "content-field-value content-field-value--numeric";

export default function DateFieldRenderer({
	field,
	showLabel = true,
}: DateFieldRendererProps): JSX.Element | null {
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
			<time className={valueTextClassName}>{formattedValue}</time>
		</ContentFieldFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
