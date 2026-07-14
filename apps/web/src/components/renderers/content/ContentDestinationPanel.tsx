//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/ContentDestinationPanel.tsx                                  ////
//// Language: TSX                                                                                                ////
//// Renders populated template destinations with role-specific shared material surfaces and field groups.        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import { SurfacePanel } from "@/components/ui";
import { cn } from "@/lib/cn";

import ContentFieldGroup from "./ContentFieldGroup";
import { hasRenderableFields } from "./field-utils";
import RenderDebugFrame from "./RenderDebugFrame";
import type {
	ContentRenderDestinationCode,
	ContentRenderField,
	ContentRenderModel,
} from "./types";

type VisibleContentDestination = Extract<
	ContentRenderDestinationCode,
	"top" | "left" | "main" | "right" | "bottom"
>;

type ContentDestinationPanelProps = {
	destination: VisibleContentDestination;
	fields: ContentRenderField[];
	model: ContentRenderModel;
	debug?: boolean;
	className?: string;
};

type DestinationMaterial = "module" | "structure" | "inset";

const DESTINATION_LABELS: Record<VisibleContentDestination, string> = {
	top: "Top",
	left: "Left",
	main: "Main",
	right: "Right",
	bottom: "Bottom",
};

const DESTINATION_DESCRIPTIONS: Record<VisibleContentDestination, string> = {
	top: "Full-width introductory content",
	left: "Left supporting content",
	main: "Primary page content",
	right: "Right supporting content",
	bottom: "Full-width closing content",
};

const DESTINATION_DEBUG_VARIANTS: Record<
	VisibleContentDestination,
	"dest-top" | "dest-left" | "dest-main" | "dest-right" | "dest-bottom"
> = {
	top: "dest-top",
	left: "dest-left",
	main: "dest-main",
	right: "dest-right",
	bottom: "dest-bottom",
};

function isSidebarDestination(destination: VisibleContentDestination): boolean {
	return destination === "left" || destination === "right";
}

function destinationMaterial(
	destination: VisibleContentDestination,
): DestinationMaterial {
	if (destination === "main") {
		return "structure";
	}

	if (isSidebarDestination(destination)) {
		return "inset";
	}

	return "module";
}

export default function ContentDestinationPanel({
	destination,
	fields,
	model,
	debug = false,
	className,
}: ContentDestinationPanelProps): JSX.Element | null {
	if (!hasRenderableFields(fields, model)) {
		return null;
	}

	const destinationLabel = DESTINATION_LABELS[destination];

	return (
		<RenderDebugFrame
			enabled={debug}
			label={`Destination / ${destinationLabel}`}
			description={DESTINATION_DESCRIPTIONS[destination]}
			variant={DESTINATION_DEBUG_VARIANTS[destination]}
		>
			<SurfacePanel
				material={destinationMaterial(destination)}
				density={isSidebarDestination(destination) ? "compact" : "comfortable"}
				className={cn(
					"public-content-destination",
					`public-content-destination--${destination}`,
					className,
				)}
			>
				<ContentFieldGroup
					fields={fields}
					model={model}
					className={cn(
						"content-field-group",
						isSidebarDestination(destination) && "content-field-group--sidebar",
					)}
					debug={debug}
					debugLabel={`Fields / ${destinationLabel}`}
					debugDescription={`${destinationLabel} destination fields`}
					debugVariant={DESTINATION_DEBUG_VARIANTS[destination]}
				/>
			</SurfacePanel>
		</RenderDebugFrame>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
