//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/ContentLinkFieldRenderer.tsx                          ////
//// Language: TSX                                                                                                ////
//// Renders resolved content-reference fields without exposing raw internal content IDs.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import { Link } from "@/components/ui";

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
		<ContentFieldFrame
			field={field}
			showLabel={showLabel}
			valueTextClassName="content-field-value"
		>
			{field.contentLink ? (
				<Link className="content-field-link" href={field.contentLink.href}>
					{field.contentLink.title}
				</Link>
			) : (
				<p className="content-field-muted-message">
					Linked content is unavailable.
				</p>
			)}
		</ContentFieldFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
