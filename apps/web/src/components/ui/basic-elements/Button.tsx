//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Button.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Exports semantic shared button and button-link primitives with stable loading behavior.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import Link from "next/link";
import type {
	ComponentProps,
	MouseEvent as ReactMouseEvent,
	ReactNode,
} from "react";

import { cn } from "../../../lib/cn";

export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonVariant =
	| "primary"
	| "secondary"
	| "quiet"
	| "danger"
	| "success";

type BaseProps = {
	size?: ButtonSize;
	variant?: ButtonVariant;
	pill?: boolean;
	block?: boolean;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
	loading?: boolean;
};

function sizeClass(size: ButtonSize): string {
	return `ui-button--${size}`;
}

function variantClass(variant: ButtonVariant): string {
	return `ui-button--${variant}`;
}

function buttonClassName(args: {
	size: ButtonSize;
	variant: ButtonVariant;
	pill?: boolean;
	block?: boolean;
	className?: string;
}): string {
	return cn(
		"ui-button",
		sizeClass(args.size),
		variantClass(args.variant),
		args.pill && "ui-button--pill",
		args.block && "ui-button--block",
		args.className,
	);
}

function ButtonContent({
	children,
	leftIcon,
	rightIcon,
	loading,
}: Pick<BaseProps, "leftIcon" | "rightIcon" | "loading"> & {
	children: ReactNode;
}) {
	return (
		<>
			<span
				className="ui-button__content"
				aria-hidden={loading ? true : undefined}
			>
				{leftIcon ? (
					<span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>
				) : null}
				<span className="ui-button__label">{children}</span>
				{rightIcon ? (
					<span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>
				) : null}
			</span>
			{loading ? (
				<span className="ui-button__loading" role="status">
					<span className="ui-button__spinner" aria-hidden="true" />
					<span className="sr-only">Loading</span>
				</span>
			) : null}
		</>
	);
}

export function Button({
	size = "md",
	variant = "secondary",
	pill,
	block,
	leftIcon,
	rightIcon,
	loading = false,
	disabled = false,
	type = "button",
	className,
	children,
	...rest
}: BaseProps & Omit<ComponentProps<"button">, "color">) {
	const isDisabled = disabled || loading;

	return (
		<button
			{...rest}
			type={type}
			className={buttonClassName({ size, variant, pill, block, className })}
			disabled={isDisabled}
			aria-busy={loading || undefined}
			data-loading={loading ? "true" : undefined}
		>
			<ButtonContent leftIcon={leftIcon} rightIcon={rightIcon} loading={loading}>
				{children}
			</ButtonContent>
		</button>
	);
}

export function ButtonLink({
	size = "md",
	variant = "secondary",
	pill,
	block,
	leftIcon,
	rightIcon,
	loading = false,
	disabled = false,
	href,
	className,
	children,
	onClick,
	tabIndex,
	...rest
}: BaseProps &
	Omit<ComponentProps<typeof Link>, "href" | "className"> & {
		href: string;
		className?: string;
		disabled?: boolean;
	}) {
	const ariaDisabled = rest["aria-disabled"];
	const isDisabled =
		disabled || loading || ariaDisabled === true || ariaDisabled === "true";

	function handleClick(event: ReactMouseEvent<HTMLAnchorElement>): void {
		if (isDisabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		onClick?.(event);
	}

	return (
		<Link
			{...rest}
			href={href}
			className={cn(
				"ui-btn",
				buttonClassName({ size, variant, pill, block, className }),
			)}
			aria-busy={loading || undefined}
			aria-disabled={isDisabled || undefined}
			data-loading={loading ? "true" : undefined}
			tabIndex={isDisabled ? -1 : tabIndex}
			onClick={handleClick}
		>
			<ButtonContent leftIcon={leftIcon} rightIcon={rightIcon} loading={loading}>
				{children}
			</ButtonContent>
		</Link>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
