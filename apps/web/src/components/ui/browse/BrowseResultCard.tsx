//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/browse/BrowseResultCard.tsx                                                 ////
//// Language: TSX                                                                                                 ////
//// Shared browse-card geometry for app directories, content collections, and series entries.                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { HTMLAttributes, JSX, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/cn";

export type BrowseResultCardDensity = "compact" | "standard" | "detailed";

export type BrowseResultCardProps = Omit<
	HTMLAttributes<HTMLElement>,
	"children" | "title"
> & {
	href?: string | null;
	visual?: ReactNode;
	eyebrow?: ReactNode;
	title: ReactNode;
	summary?: ReactNode;
	details?: ReactNode;
	endAdornment?: ReactNode;
	density?: BrowseResultCardDensity;
};

function hasRenderableNode(value: ReactNode): boolean {
	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	return value !== null && value !== undefined && value !== false;
}

function BrowseResultCardContent({
	visual,
	eyebrow,
	title,
	summary,
	details,
	endAdornment,
	hasHref,
}: Pick<
	BrowseResultCardProps,
	"visual" | "eyebrow" | "title" | "summary" | "details" | "endAdornment"
> & {
	hasHref: boolean;
}): JSX.Element {
	return (
		<>
			{hasRenderableNode(visual) ? (
				<span className="browse-result-card__visual">{visual}</span>
			) : null}

			<span className="browse-result-card__body">
				{hasRenderableNode(eyebrow) ? (
					<span className="browse-result-card__eyebrow">{eyebrow}</span>
				) : null}
				<span className="browse-result-card__title">{title}</span>
				{hasRenderableNode(summary) ? (
					<span className="browse-result-card__summary">{summary}</span>
				) : null}
				{hasRenderableNode(details) ? (
					<span className="browse-result-card__details">{details}</span>
				) : null}
			</span>

			{hasRenderableNode(endAdornment) ? (
				<span className="browse-result-card__end">{endAdornment}</span>
			) : hasHref ? (
				<ArrowRight aria-hidden className="browse-result-card__arrow" />
			) : null}
		</>
	);
}

export default function BrowseResultCard({
	href = null,
	visual,
	eyebrow,
	title,
	summary,
	details,
	endAdornment,
	density = "standard",
	className,
	...rest
}: BrowseResultCardProps): JSX.Element {
	const classes = cn(
		"browse-result-card",
		`browse-result-card--${density}`,
		href && "browse-result-card--interactive",
		className,
	);
	const content = (
		<BrowseResultCardContent
			visual={visual}
			eyebrow={eyebrow}
			title={title}
			summary={summary}
			details={details}
			endAdornment={endAdornment}
			hasHref={Boolean(href)}
		/>
	);

	if (href) {
		return (
			<Link {...rest} className={classes} href={href}>
				{content}
			</Link>
		);
	}

	return (
		<article {...rest} className={classes}>
			{content}
		</article>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
