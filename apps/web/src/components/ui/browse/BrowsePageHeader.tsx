//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/browse/BrowsePageHeader.tsx                                                 ////
//// Language: TSX                                                                                                 ////
//// Shared Riseopedia-derived header and breadcrumb grammar for overview, directory, and content pages.          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ \t \t\t \t\t\t \t\t \t\t\t\t\t \t\t\t\t \t\t\t \t\t\t\t \t\t\t   \t   \t\t \t \t\t\t\t\t    \t      \t    \t \t \t\t\t\t   \t\t  \t\t\t\t \t \t\t\t  \t\t\t\t   \t\t\t \t]WE
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { HTMLAttributes, JSX, ReactNode } from "react";
import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

export type BrowsePageHeaderBreadcrumbItem = {
	label: string;
	href?: string;
};

export type BrowsePageBreadcrumbsProps = {
	breadcrumbs: BrowsePageHeaderBreadcrumbItem[];
	ariaLabel?: string;
	className?: string;
};

export type BrowsePageHeaderProps = Omit<
	HTMLAttributes<HTMLElement>,
	"children" | "title"
> & {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	breadcrumbs?: BrowsePageHeaderBreadcrumbItem[];
	actions?: ReactNode;
	breadcrumbLabel?: string;
};

function hasBreadcrumbs(
	breadcrumbs: BrowsePageHeaderBreadcrumbItem[] | undefined,
): breadcrumbs is BrowsePageHeaderBreadcrumbItem[] {
	return Array.isArray(breadcrumbs) && breadcrumbs.length > 0;
}

function hasRenderableNode(value: ReactNode): boolean {
	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	return value !== null && value !== undefined && value !== false;
}

export function BrowsePageBreadcrumbs({
	breadcrumbs,
	ariaLabel = "Breadcrumb",
	className,
}: BrowsePageBreadcrumbsProps): JSX.Element | null {
	if (!hasBreadcrumbs(breadcrumbs)) {
		return null;
	}

	return (
		<nav
			className={cn("browse-page-header__breadcrumbs", className)}
			aria-label={ariaLabel}
		>
			{breadcrumbs.map((item, index) => {
				const isCurrent = index === breadcrumbs.length - 1;

				return (
					<Fragment key={`${item.href ?? "current"}:${item.label}:${index}`}>
						{item.href ? (
							<Link href={item.href}>{item.label}</Link>
						) : (
							<span aria-current={isCurrent ? "page" : undefined}>
								{item.label}
							</span>
						)}
						{!isCurrent ? (
							<span
								className="browse-page-header__breadcrumb-separator"
								aria-hidden
							>
								/
							</span>
						) : null}
					</Fragment>
				);
			})}
		</nav>
	);
}

function BrowseHeaderTopLine({
	breadcrumbs,
	eyebrow,
	breadcrumbLabel,
}: {
	breadcrumbs?: BrowsePageHeaderBreadcrumbItem[];
	eyebrow?: ReactNode;
	breadcrumbLabel: string;
}): JSX.Element | null {
	if (hasBreadcrumbs(breadcrumbs)) {
		return (
			<BrowsePageBreadcrumbs
				breadcrumbs={breadcrumbs}
				ariaLabel={breadcrumbLabel}
			/>
		);
	}

	if (hasRenderableNode(eyebrow)) {
		return <div className="browse-page-header__eyebrow">{eyebrow}</div>;
	}

	return null;
}

export default function BrowsePageHeader({
	title,
	description,
	eyebrow,
	breadcrumbs,
	actions,
	breadcrumbLabel = "Breadcrumb",
	className,
	...rest
}: BrowsePageHeaderProps): JSX.Element {
	const showDescription = hasRenderableNode(description);
	const showActions = hasRenderableNode(actions);

	return (
		<header
			{...rest}
			className={cn(
				"browse-page-header",
				showDescription && "browse-page-header--with-description",
				className,
			)}
		>
			<div className="browse-page-header__content">
				<BrowseHeaderTopLine
					breadcrumbs={breadcrumbs}
					eyebrow={eyebrow}
					breadcrumbLabel={breadcrumbLabel}
				/>

				<div className="browse-page-header__main">
					<h1 className="browse-page-header__title">{title}</h1>
					{showActions ? (
						<div className="browse-page-header__actions">{actions}</div>
					) : null}
				</div>

				{showDescription ? (
					<div className="browse-page-header__description">{description}</div>
				) : null}
			</div>
		</header>
	);
}

// WE[ \t \t\t \t\t\t \t\t \t\t\t\t\t \t\t\t\t \t\t\t \t\t\t\t \t\t\t   \t   \t\t \t \t\t\t\t\t    \t      \t    \t \t \t\t\t\t   \t\t  \t\t\t\t \t \t\t\t  \t\t\t\t   \t\t\t \t]WE

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
