//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/editors/richtext/nodes/RichTextLinkPickerResultRow.tsx                       ////
//// Language: TSX                                                                                               ////
//// Dense, icon-led result row shared by Internal Page and Riseopedia rich-text link picker tabs.               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import RiseopediaEntityVisual, {
	type RiseopediaEntityVisualMedia,
} from "@/components/riseopedia/ui/RiseopediaEntityVisual";
import IconRender, { type IconRenderProps } from "@/components/ui/IconRender";
import { IconWell, StatusPill } from "@/components/ui";

export type RichTextLinkPickerResultRowProps = {
	iconKey?: IconRenderProps["iconKey"];
	iconColor?: IconRenderProps["iconColor"];
	fallbackIcon: string;
	riseopediaMedia?: RiseopediaEntityVisualMedia | null;
	placeholderLabel?: string;
	title: string;
	classification: string;
	detail?: string | null;
	badge: string;
	current?: boolean;
	onSelect: () => void;
};

export default function RichTextLinkPickerResultRow({
	iconKey = null,
	iconColor = null,
	fallbackIcon,
	riseopediaMedia,
	placeholderLabel = "Entity",
	title,
	classification,
	detail = null,
	badge,
	current = false,
	onSelect,
}: RichTextLinkPickerResultRowProps): React.JSX.Element {
	const useRiseopediaVisual = riseopediaMedia !== undefined;

	return (
		<button
			type="button"
			className={`editor-link-picker-result${
				current ? " editor-link-picker-result--current" : ""
			}`}
			onClick={onSelect}
			aria-current={current ? "page" : undefined}
		>
			<span className="editor-link-picker-result__visual" aria-hidden="true">
				{useRiseopediaVisual ? (
					<RiseopediaEntityVisual
						media={riseopediaMedia ?? null}
						alt={title}
						placeholderLabel={placeholderLabel}
						size="picker"
						fit="contain"
						decorative
						className="editor-link-picker-result__riseopedia-visual"
					/>
				) : (
					<IconWell
						size="lg"
						tone={current ? "info" : "subtle"}
						className="editor-link-picker-result__icon"
					>
						<IconRender
							iconKey={iconKey}
							iconColor={iconColor}
							fallback={{ lucideName: fallbackIcon }}
							size={32}
							mediaRouteScope="app"
						/>
					</IconWell>
				)}
			</span>

			<span className="editor-link-picker-result__copy">
				<span className="editor-link-picker-result__heading">
					<strong>{title}</strong>
					{current ? (
						<StatusPill tone="success" size="xs">
							Current
						</StatusPill>
					) : null}
				</span>
				<span className="editor-link-picker-result__classification">
					{classification}
				</span>
				{detail ? (
					<small className="editor-link-picker-result__detail">{detail}</small>
				) : null}
			</span>

			<StatusPill
				tone={current ? "info" : "muted"}
				size="xs"
				className="editor-link-picker-result__badge"
			>
				{badge}
			</StatusPill>
		</button>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
