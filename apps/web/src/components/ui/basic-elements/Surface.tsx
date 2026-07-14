//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Surface.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Shared material surfaces, page headers, media wells, metadata, and state primitives.                           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	Children,
	isValidElement,
	type HTMLAttributes,
	type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export type SurfaceTone =
	| "default"
	| "muted"
	| "subtle"
	| "success"
	| "warning"
	| "danger"
	| "info";

export type SurfaceDensity = "compact" | "comfortable" | "spacious";
export type SurfaceMaterial = "plain" | "module" | "structure" | "inset";
export type SurfaceStateKind =
	| "empty"
	| "loading"
	| "error"
	| "success"
	| "info";
export type SurfaceAlign = "start" | "center";
export type SurfaceMediaAspect =
	| "auto"
	| "square"
	| "portrait"
	| "landscape"
	| "wide";
export type SurfaceMetaSeparator = "dot" | "divider" | "none";

export type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
	tone?: SurfaceTone;
	density?: SurfaceDensity;
	material?: SurfaceMaterial;
	interactive?: boolean;
};

export type SurfacePanelProps = HTMLAttributes<HTMLElement> & {
	tone?: SurfaceTone;
	density?: SurfaceDensity;
	material?: SurfaceMaterial;
};

export type IconWellProps = HTMLAttributes<HTMLSpanElement> & {
	tone?: SurfaceTone;
	size?: "sm" | "md" | "lg" | "xl";
	children: ReactNode;
};

export type StatusPillProps = HTMLAttributes<HTMLSpanElement> & {
	tone?: SurfaceTone;
	size?: "xs" | "sm" | "md";
	children: ReactNode;
};

export type PageHeroProps = Omit<
	HTMLAttributes<HTMLElement>,
	"children" | "title"
> & {
	breadcrumbs?: ReactNode;
	eyebrow?: ReactNode;
	title: ReactNode;
	summary?: ReactNode;
	metadata?: ReactNode;
	actions?: ReactNode;
	icon?: ReactNode;
	media?: ReactNode;
	children?: ReactNode;
	density?: SurfaceDensity;
};

export type SectionHeaderProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
	eyebrow?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	headingLevel?: 2 | 3 | 4;
	divider?: boolean;
};

export type MediaWellProps = HTMLAttributes<HTMLDivElement> & {
	aspect?: SurfaceMediaAspect;
	children: ReactNode;
};

export type SurfaceMetaRowProps = Omit<
	HTMLAttributes<HTMLDivElement>,
	"children"
> & {
	children: ReactNode;
	separator?: SurfaceMetaSeparator;
	size?: "sm" | "md";
};

export type SurfaceStateProps = Omit<
	HTMLAttributes<HTMLElement>,
	"children" | "title"
> & {
	kind?: SurfaceStateKind;
	align?: SurfaceAlign;
	density?: SurfaceDensity;
	icon?: ReactNode;
	title?: ReactNode;
	description: ReactNode;
	actions?: ReactNode;
};

function getToneClass(baseClass: string, tone: SurfaceTone): string {
	return `${baseClass}--${tone}`;
}

function getDensityClass(baseClass: string, density: SurfaceDensity): string {
	return `${baseClass}--${density}`;
}

function getMaterialClass(
	baseClass: string,
	material: SurfaceMaterial,
): string {
	return `${baseClass}--material-${material}`;
}

function getSectionHeadingTag(
	headingLevel: SectionHeaderProps["headingLevel"],
): "h2" | "h3" | "h4" {
	if (headingLevel === 3) {
		return "h3";
	}
	if (headingLevel === 4) {
		return "h4";
	}
	return "h2";
}

function getMetaItemKey(item: ReactNode, index: number): string {
	if (isValidElement(item) && item.key !== null) {
		return String(item.key);
	}
	return `surface-meta-item-${index}`;
}

function hasRenderableMetaItem(item: ReactNode): boolean {
	if (typeof item === "string") {
		return item.trim().length > 0;
	}
	return item !== null && item !== undefined && item !== false;
}

export function SurfaceCard({
	tone = "default",
	density = "comfortable",
	material = "plain",
	interactive = false,
	className,
	...rest
}: SurfaceCardProps): React.JSX.Element {
	return (
		<div
			{...rest}
			className={cn(
				"surface-card",
				getToneClass("surface-card", tone),
				getDensityClass("surface-card", density),
				getMaterialClass("surface-card", material),
				interactive && "surface-card--interactive",
				className,
			)}
		/>
	);
}

export function SurfacePanel({
	tone = "default",
	density = "comfortable",
	material = "plain",
	className,
	...rest
}: SurfacePanelProps): React.JSX.Element {
	return (
		<section
			{...rest}
			className={cn(
				"surface-panel",
				getToneClass("surface-panel", tone),
				getDensityClass("surface-panel", density),
				getMaterialClass("surface-panel", material),
				className,
			)}
		/>
	);
}

export function IconWell({
	tone = "default",
	size = "md",
	className,
	children,
	...rest
}: IconWellProps): React.JSX.Element {
	return (
		<span
			{...rest}
			className={cn(
				"surface-icon-well",
				getToneClass("surface-icon-well", tone),
				`surface-icon-well--${size}`,
				className,
			)}
		>
			{children}
		</span>
	);
}

export function StatusPill({
	tone = "default",
	size = "sm",
	className,
	children,
	...rest
}: StatusPillProps): React.JSX.Element {
	return (
		<span
			{...rest}
			className={cn(
				"surface-status-pill",
				getToneClass("surface-status-pill", tone),
				`surface-status-pill--${size}`,
				className,
			)}
		>
			{children}
		</span>
	);
}

export function PageHero({
	breadcrumbs,
	eyebrow,
	title,
	summary,
	metadata,
	actions,
	icon,
	media,
	children,
	density = "spacious",
	className,
	...rest
}: PageHeroProps): React.JSX.Element {
	return (
		<section
			{...rest}
			className={cn(
				"surface-page-hero",
				getDensityClass("surface-page-hero", density),
				media && "surface-page-hero--with-media",
				icon && "surface-page-hero--with-icon",
				className,
			)}
		>
			<div className="surface-page-hero__layout">
				<div className="surface-page-hero__content">
					<div className="surface-page-hero__intro">
						{icon ? <div className="surface-page-hero__icon">{icon}</div> : null}

						<div className="surface-page-hero__copy">
							{breadcrumbs ? (
								<div className="surface-page-hero__breadcrumbs">
									{breadcrumbs}
								</div>
							) : null}
							{eyebrow ? (
								<div className="surface-page-hero__eyebrow">{eyebrow}</div>
							) : null}
							<h1 className="surface-page-hero__title">{title}</h1>
							{summary ? (
								<div className="surface-page-hero__summary">{summary}</div>
							) : null}
						</div>
					</div>

					{children ? (
						<div className="surface-page-hero__body">{children}</div>
					) : null}

					{metadata || actions ? (
						<div className="surface-page-hero__footer">
							{metadata ? (
								<div className="surface-page-hero__metadata">{metadata}</div>
							) : null}
							{actions ? (
								<div className="surface-page-hero__actions">{actions}</div>
							) : null}
						</div>
					) : null}
				</div>

				{media ? <div className="surface-page-hero__media">{media}</div> : null}
			</div>
		</section>
	);
}

export function SectionHeader({
	eyebrow,
	title,
	description,
	action,
	headingLevel = 2,
	divider = true,
	className,
	...rest
}: SectionHeaderProps): React.JSX.Element {
	const HeadingTag = getSectionHeadingTag(headingLevel);

	return (
		<header
			{...rest}
			className={cn(
				"surface-section-header",
				divider && "surface-section-header--divider",
				className,
			)}
		>
			<div className="surface-section-header__copy">
				{eyebrow ? (
					<div className="surface-section-header__eyebrow">{eyebrow}</div>
				) : null}
				<HeadingTag className="surface-section-header__title">{title}</HeadingTag>
				{description ? (
					<div className="surface-section-header__description">{description}</div>
				) : null}
			</div>
			{action ? (
				<div className="surface-section-header__action">{action}</div>
			) : null}
		</header>
	);
}

export function MediaWell({
	aspect = "auto",
	className,
	children,
	...rest
}: MediaWellProps): React.JSX.Element {
	return (
		<div
			{...rest}
			className={cn(
				"surface-media-well",
				`surface-media-well--${aspect}`,
				className,
			)}
		>
			{children}
		</div>
	);
}

export function SurfaceMetaRow({
	children,
	separator = "dot",
	size = "sm",
	className,
	...rest
}: SurfaceMetaRowProps): React.JSX.Element | null {
	const items = Children.toArray(children).filter(hasRenderableMetaItem);

	if (items.length === 0) {
		return null;
	}

	return (
		<div
			{...rest}
			className={cn(
				"surface-meta-row",
				`surface-meta-row--${separator}`,
				`surface-meta-row--${size}`,
				className,
			)}
		>
			{items.map((item, index) => (
				<span className="surface-meta-row__item" key={getMetaItemKey(item, index)}>
					{item}
				</span>
			))}
		</div>
	);
}

export function SurfaceState({
	kind = "empty",
	align = "start",
	density = "comfortable",
	icon,
	title,
	description,
	actions,
	className,
	role,
	"aria-live": ariaLive,
	...rest
}: SurfaceStateProps): React.JSX.Element {
	const resolvedRole = role ?? (kind === "error" ? "alert" : "status");
	const resolvedAriaLive =
		ariaLive ?? (kind === "error" ? "assertive" : "polite");

	return (
		<section
			{...rest}
			role={resolvedRole}
			aria-live={resolvedAriaLive}
			aria-busy={kind === "loading" ? true : undefined}
			className={cn(
				"surface-state",
				`surface-state--${kind}`,
				`surface-state--align-${align}`,
				getDensityClass("surface-state", density),
				className,
			)}
		>
			{icon ? <div className="surface-state__icon">{icon}</div> : null}
			<div className="surface-state__copy">
				{title ? <h2 className="surface-state__title">{title}</h2> : null}
				<div className="surface-state__description">{description}</div>
			</div>
			{actions ? <div className="surface-state__actions">{actions}</div> : null}
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
