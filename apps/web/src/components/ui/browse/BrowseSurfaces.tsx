//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/browse/BrowseSurfaces.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Shared filter, results, and section-header surfaces for browse-oriented public pages.                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { HTMLAttributes, JSX, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BrowseSurfaceProps = HTMLAttributes<HTMLElement>;

export type BrowsePanelHeaderProps = Omit<
	HTMLAttributes<HTMLDivElement>,
	"children" | "title"
> & {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	actions?: ReactNode;
	headingLevel?: 2 | 3;
};

function hasRenderableNode(value: ReactNode): boolean {
	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	return value !== null && value !== undefined && value !== false;
}

export function BrowseFilterPanel({
	className,
	...rest
}: BrowseSurfaceProps): JSX.Element {
	return (
		<section
			{...rest}
			className={cn("public-collection-panel", "browse-filter-panel", className)}
		/>
	);
}

export function BrowseResultsPanel({
	className,
	...rest
}: BrowseSurfaceProps): JSX.Element {
	return (
		<section
			{...rest}
			className={cn("public-collection-panel", "browse-results-panel", className)}
		/>
	);
}

export function BrowsePanelHeader({
	title,
	description,
	eyebrow,
	actions,
	headingLevel = 2,
	className,
	...rest
}: BrowsePanelHeaderProps): JSX.Element {
	const Heading = headingLevel === 3 ? "h3" : "h2";
	const showDescription = hasRenderableNode(description);
	const showEyebrow = hasRenderableNode(eyebrow);
	const showActions = hasRenderableNode(actions);

	return (
		<div {...rest} className={cn("browse-panel-header", className)}>
			<div className="browse-panel-header__copy">
				{showEyebrow ? (
					<div className="browse-panel-header__eyebrow">{eyebrow}</div>
				) : null}
				<Heading className="browse-panel-header__title">{title}</Heading>
				{showDescription ? (
					<div className="browse-panel-header__description">{description}</div>
				) : null}
			</div>
			{showActions ? (
				<div className="browse-panel-header__actions">{actions}</div>
			) : null}
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
