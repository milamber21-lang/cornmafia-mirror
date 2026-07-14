//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentFieldGroup.tsx                                        ////
//// Language: TSX                                                                                                ////
//// Renders safely resolved destination fields as template-controlled responsive grids with debug support.       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import ContentFieldRenderer from "./ContentFieldRenderer";
import { getRenderableFields } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import type {
	ContentRenderField,
	ContentRenderLayoutAlignCode,
	ContentRenderLayoutWidthCode,
	ContentRenderModel,
} from "./types";

type ContentFieldGroupProps = {
	fields: ContentRenderField[];
	model: ContentRenderModel;
	className?: string;
	showLabels?: boolean;
	debug?: boolean;
	debugLabel?: string;
	debugDescription?: string;
	debugVariant?:
		| "dest-hero"
		| "dest-top"
		| "dest-main"
		| "dest-right"
		| "dest-left"
		| "dest-bottom"
		| "generic";
};

function getWidthClass(layoutWidthCode: ContentRenderLayoutWidthCode): string {
	if (layoutWidthCode === "third") {
		return "content-field-cell--width-third";
	}

	if (layoutWidthCode === "half") {
		return "content-field-cell--width-half";
	}

	return "content-field-cell--width-full";
}

function getAlignClass(layoutAlignCode: ContentRenderLayoutAlignCode): string {
	if (layoutAlignCode === "left") {
		return "content-field-cell--align-left";
	}

	if (layoutAlignCode === "center") {
		return "content-field-cell--align-center";
	}

	if (layoutAlignCode === "right") {
		return "content-field-cell--align-right";
	}

	return "content-field-cell--align-stretch";
}

function getFieldCellClassName(field: ContentRenderField): string {
	return [
		"content-field-cell",
		getWidthClass(field.layoutWidthCode),
		getAlignClass(field.layoutAlignCode),
	]
		.filter((value) => value.trim().length > 0)
		.join(" ");
}

export default function ContentFieldGroup({
	fields,
	model,
	className = "content-field-group",
	showLabels = true,
	debug = false,
	debugLabel = "Field group",
	debugDescription,
	debugVariant = "generic",
}: ContentFieldGroupProps): JSX.Element | null {
	const renderableFields = getRenderableFields(fields, model);
	if (renderableFields.length === 0) {
		return null;
	}

	return (
		<RenderDebugFrame
			enabled={debug}
			label={debugLabel}
			description={debugDescription ?? `${renderableFields.length} field(s)`}
			variant={debugVariant}
		>
			<div className={className}>
				{renderableFields.map((field) => (
					<div key={field.id} className={getFieldCellClassName(field)}>
						<ContentFieldRenderer
							field={field}
							model={model}
							showLabel={showLabels}
							debug={debug}
						/>
					</div>
				))}
			</div>
		</RenderDebugFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
