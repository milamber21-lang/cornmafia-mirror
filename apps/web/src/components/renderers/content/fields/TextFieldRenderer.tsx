//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/TextFieldRenderer.tsx                                 ////
//// Language: TSX                                                                                                ////
//// Renders plain text, long text, discord id, and fallback primitive content fields.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentFieldFrame from "../ContentFieldFrame";
import { formatPrimitiveValue } from "../field-utils";
import type { ContentRenderField } from "../types";

type TextFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

const valueTextClassName = "content-field-value";

export default function TextFieldRenderer({
	field,
	showLabel = true,
}: TextFieldRendererProps): JSX.Element | null {
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
			<p className="content-field-value content-field-value--prewrap">
				{formattedValue}
			</p>
		</ContentFieldFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
