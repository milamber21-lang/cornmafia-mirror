//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/RenderDebugFrame.tsx                                         ////
//// Language: TSX                                                                                                ////
//// Debug frame with labeled colored borders for understanding preview layout, shells, destinations, and fields. ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

type RenderDebugVariant =
	| "page"
	| "page-header"
	| "page-preview"
	| "page-analytics"
	| "metric"
	| "warnings"
	| "route"
	| "distribution"
	| "inventory"
	| "shell"
	| "shell-header"
	| "shell-main-layout"
	| "shell-main"
	| "shell-aside"
	| "dest-hero"
	| "dest-top"
	| "dest-main"
	| "dest-right"
	| "dest-left"
	| "dest-bottom"
	| "field"
	| "generic";

type RenderDebugFrameProps = {
	enabled?: boolean;
	label: string;
	description?: string;
	variant?: RenderDebugVariant;
	className?: string;
	contentClassName?: string;
	children: ReactNode;
};

const DEBUG_TONES: Record<RenderDebugVariant, string> = {
	page: "render-debug-frame--rose",
	"page-header": "render-debug-frame--amber",
	"page-preview": "render-debug-frame--violet",
	"page-analytics": "render-debug-frame--emerald",
	metric: "render-debug-frame--teal",
	warnings: "render-debug-frame--danger",
	route: "render-debug-frame--cyan",
	distribution: "render-debug-frame--cyan",
	inventory: "render-debug-frame--fuchsia",
	shell: "render-debug-frame--indigo",
	"shell-header": "render-debug-frame--pink",
	"shell-main-layout": "render-debug-frame--purple",
	"shell-main": "render-debug-frame--cyan",
	"shell-aside": "render-debug-frame--sky",
	"dest-hero": "render-debug-frame--yellow",
	"dest-top": "render-debug-frame--lime",
	"dest-main": "render-debug-frame--cyan",
	"dest-right": "render-debug-frame--sky",
	"dest-left": "render-debug-frame--green",
	"dest-bottom": "render-debug-frame--emerald",
	field: "render-debug-frame--orange",
	generic: "render-debug-frame--slate",
};

export default function RenderDebugFrame({
	enabled = false,
	label,
	description,
	variant = "generic",
	className = "",
	contentClassName = "",
	children,
}: RenderDebugFrameProps): JSX.Element {
	if (!enabled) {
		return <>{children}</>;
	}

	const toneClassName = DEBUG_TONES[variant];
	const outerClassName = ["render-debug-frame", toneClassName, className]
		.filter((value) => value.trim().length > 0)
		.join(" ");
	const innerClassName = ["render-debug-frame__content", contentClassName]
		.filter((value) => value.trim().length > 0)
		.join(" ");

	return (
		<div className={outerClassName}>
			<div className="render-debug-frame__badge-position">
				<div className="render-debug-frame__badge">
					<span className="render-debug-frame__label">{label}</span>
					{description ? (
						<span className="render-debug-frame__description">{description}</span>
					) : null}
				</div>
			</div>
			<div className={innerClassName}>{children}</div>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
