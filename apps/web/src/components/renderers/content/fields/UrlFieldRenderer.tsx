//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/fields/UrlFieldRenderer.tsx                                  ////
//// Language: TSX                                                                                                ////
//// Renders URL-like content fields with safe internal and external link handling.                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import ContentFieldFrame from "../ContentFieldFrame";
import { formatPrimitiveValue, normalizeRenderableUrl } from "../field-utils";
import type { ContentRenderField } from "../types";

type UrlFieldRendererProps = {
	field: ContentRenderField;
	showLabel?: boolean;
};

const valueTextClassName = "content-field-value";

export default function UrlFieldRenderer({
	field,
	showLabel = true,
}: UrlFieldRendererProps): JSX.Element | null {
	const formattedValue = formatPrimitiveValue(field);
	if (!formattedValue) {
		return null;
	}

	const normalizedUrl = normalizeRenderableUrl(field.value);

	return (
		<ContentFieldFrame
			field={field}
			showLabel={showLabel}
			valueTextClassName={valueTextClassName}
		>
			{normalizedUrl ? (
				normalizedUrl.isExternal ? (
					<a
						className="content-field-link"
						href={normalizedUrl.href}
						target="_blank"
						rel="noopener noreferrer"
					>
						{formattedValue}
					</a>
				) : (
					<Link className="content-field-link" href={normalizedUrl.href}>
						{formattedValue}
					</Link>
				)
			) : (
				<p className="content-field-value content-field-value--prewrap">
					{formattedValue}
				</p>
			)}
		</ContentFieldFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
