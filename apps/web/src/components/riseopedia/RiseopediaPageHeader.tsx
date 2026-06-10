//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaPageHeader.tsx                                          ////
//// Language: TSX                                                                                              ////
//// Shared public Riseopedia header shell for hub, classification, and entity-list pages.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";
import Link from "next/link";

export type RiseopediaPageHeaderBreadcrumbItem = {
	label: string;
	href?: string;
};

export type RiseopediaPageHeaderProps = {
	title: string;
	description?: string | null;
	eyebrow?: string | null;
	breadcrumbs?: RiseopediaPageHeaderBreadcrumbItem[];
	actions?: ReactNode;
};

function hasBreadcrumbs(
	breadcrumbs: RiseopediaPageHeaderBreadcrumbItem[] | undefined,
): breadcrumbs is RiseopediaPageHeaderBreadcrumbItem[] {
	return Array.isArray(breadcrumbs) && breadcrumbs.length > 0;
}

function RiseopediaHeaderTopLine({
	breadcrumbs,
	eyebrow,
}: {
	breadcrumbs?: RiseopediaPageHeaderBreadcrumbItem[];
	eyebrow?: string | null;
}): JSX.Element | null {
	if (hasBreadcrumbs(breadcrumbs)) {
		return (
			<nav className="riseopedia-breadcrumb" aria-label="Riseopedia breadcrumb">
				{breadcrumbs.map((item) =>
					item.href ? (
						<Link href={item.href} key={item.label}>
							{item.label}
						</Link>
					) : (
						<span key={item.label}>{item.label}</span>
					),
				)}
			</nav>
		);
	}

	if (eyebrow && eyebrow.trim().length > 0) {
		return <div className="riseopedia-breadcrumb riseopedia-breadcrumb--eyebrow">{eyebrow}</div>;
	}

	return null;
}

export default function RiseopediaPageHeader({
	title,
	description = null,
	eyebrow = null,
	breadcrumbs,
	actions = null,
}: RiseopediaPageHeaderProps): JSX.Element {
	return (
		<header className="riseopedia-page-hero">
			<div className="riseopedia-page-hero__content">
				<RiseopediaHeaderTopLine breadcrumbs={breadcrumbs} eyebrow={eyebrow} />
				<div className="riseopedia-page-hero__main">
					<h1 className="riseopedia-page-hero__title">{title}</h1>
					{actions ? <div className="riseopedia-page-hero__actions">{actions}</div> : null}
				</div>
				<p
					className="riseopedia-page-hero__description"
					aria-hidden={description ? undefined : true}
				>
					{description ?? ""}
				</p>
			</div>
		</header>
	);
}
