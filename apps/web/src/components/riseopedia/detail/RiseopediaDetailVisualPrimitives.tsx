//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaDetailVisualPrimitives.tsx                             ////
//// Language: TSX                                                                                             ////
//// Supplies shared visual-family primitives for Riseopedia configured detail blocks.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import RiseopediaEmptyState from "@/components/riseopedia/ui/RiseopediaEmptyState";

type RiseopediaHierarchyTreeVariant = "active_navigation" | "neutral" | "empty";

type RiseopediaDetailTableVariant =
	| "standard"
	| "numbered_entity_rows"
	| "grouped_mechanics"
	| "definition";

export type RiseopediaHierarchyTreeProps = {
	children: ReactNode;
	className?: string;
	label?: string;
	rootConnectors?: boolean;
	variant: RiseopediaHierarchyTreeVariant;
};

export function RiseopediaHierarchyTree({
	children,
	className,
	label,
	rootConnectors = false,
	variant,
}: RiseopediaHierarchyTreeProps): JSX.Element {
	const classNames = [
		"riseopedia-hierarchy-tree",
		`riseopedia-hierarchy-tree--${variant}`,
		rootConnectors ? "riseopedia-hierarchy-tree--root-connectors" : null,
		className,
	]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<ul aria-label={label} className={classNames}>
			{children}
		</ul>
	);
}

export type RiseopediaHierarchyTreeItemProps = {
	children: ReactNode;
	className?: string;
	current?: boolean;
	hasChildren?: boolean;
};

export function RiseopediaHierarchyTreeItem({
	children,
	className,
	current = false,
	hasChildren = false,
}: RiseopediaHierarchyTreeItemProps): JSX.Element {
	const classNames = ["riseopedia-hierarchy-tree__item", className]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<li
			className={classNames}
			data-current={current ? "true" : "false"}
			data-has-children={hasChildren ? "true" : "false"}
		>
			{children}
		</li>
	);
}

export type RiseopediaHierarchyTreeChildrenProps = {
	children: ReactNode;
	className?: string;
	label?: string;
};

export function RiseopediaHierarchyTreeChildren({
	children,
	className,
	label,
}: RiseopediaHierarchyTreeChildrenProps): JSX.Element {
	const classNames = ["riseopedia-hierarchy-tree__children", className]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<ul aria-label={label} className={classNames}>
			{children}
		</ul>
	);
}

export type RiseopediaHierarchyTreeGroupProps = {
	children: ReactNode;
	className?: string;
	label: string;
	meta?: ReactNode;
};

export function RiseopediaHierarchyTreeGroup({
	children,
	className,
	label,
	meta,
}: RiseopediaHierarchyTreeGroupProps): JSX.Element {
	const classNames = ["riseopedia-hierarchy-tree__group", className]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<section className={classNames}>
			<h3 className="riseopedia-hierarchy-tree__group-label">
				<span>{label}</span>
				{meta ? (
					<span className="riseopedia-hierarchy-tree__group-meta">{meta}</span>
				) : null}
			</h3>
			{children}
		</section>
	);
}

export type RiseopediaHierarchyTreeEmptyStateProps = {
	message: string;
};

export function RiseopediaHierarchyTreeEmptyState({
	message,
}: RiseopediaHierarchyTreeEmptyStateProps): JSX.Element {
	return <RiseopediaEmptyState message={message} />;
}

export type RiseopediaDetailTableProps = {
	children: ReactNode;
	className?: string;
	variant: RiseopediaDetailTableVariant;
};

export function RiseopediaDetailTable({
	children,
	className,
	variant,
}: RiseopediaDetailTableProps): JSX.Element {
	const classNames = [
		"riseopedia-detail-table",
		`riseopedia-detail-table--${variant}`,
		className,
	]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return <div className={classNames}>{children}</div>;
}

export type RiseopediaDetailNumberBadgeProps = {
	children: ReactNode;
	className?: string;
	label: string;
};

export function RiseopediaDetailNumberBadge({
	children,
	className,
	label,
}: RiseopediaDetailNumberBadgeProps): JSX.Element {
	const classNames = ["riseopedia-detail-number-badge", className]
		.filter((value): value is string => Boolean(value))
		.join(" ");

	return (
		<span aria-label={label} className={classNames}>
			{children}
		</span>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
