//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Button.test.tsx                                             ////
//// Language: TSX                                                                                               ////
//// Verifies semantic variants, safe form behavior, and stable loading/disabled interactions.                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		children,
		...props
	}: ComponentProps<"a"> & { children: ReactNode }) => (
		<a {...props}>{children}</a>
	),
}));

import { Button, ButtonLink } from "@/components/ui/basic-elements/Button";

describe("Button", () => {
	it("defaults to a secondary type=button without submitting a form", () => {
		const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
			event.preventDefault(),
		);
		render(
			<form onSubmit={onSubmit}>
				<Button>Open picker</Button>
			</form>,
		);
		const button = screen.getByRole("button", { name: "Open picker" });
		expect(button).toHaveAttribute("type", "button");
		expect(button).toHaveClass("ui-button--secondary");
		fireEvent.click(button);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("preserves an explicit submit type", () => {
		const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) =>
			event.preventDefault(),
		);
		render(
			<form onSubmit={onSubmit}>
				<Button type="submit" variant="primary">
					Save
				</Button>
			</form>,
		);
		const button = screen.getByRole("button", { name: "Save" });
		fireEvent.click(button);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("preserves label width while exposing a disabled loading state", () => {
		render(
			<Button loading variant="primary">
				Save changes
			</Button>,
		);
		const button = screen.getByRole("button", { name: "Loading" });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
		expect(button.querySelector(".ui-button__label")).toHaveTextContent(
			"Save changes",
		);
	});

	it.each(["primary", "secondary", "quiet", "danger", "success"] as const)(
		"renders the %s semantic variant",
		(variant) => {
			render(<Button variant={variant}>{variant}</Button>);
			expect(screen.getByRole("button", { name: variant })).toHaveClass(
				`ui-button--${variant}`,
			);
		},
	);
});

describe("ButtonLink", () => {
	it("keeps link navigation semantics", () => {
		render(<ButtonLink href="/info/riseopedia">Riseopedia</ButtonLink>);
		expect(screen.getByRole("link", { name: "Riseopedia" })).toHaveAttribute(
			"href",
			"/info/riseopedia",
		);
	});

	it("prevents a loading link from navigating", () => {
		const onClick = vi.fn();
		render(
			<ButtonLink href="/admin" loading onClick={onClick}>
				Open admin
			</ButtonLink>,
		);
		const link = screen.getByRole("link", { name: "Loading" });
		expect(link).toHaveAttribute("aria-disabled", "true");
		expect(link).toHaveAttribute("tabindex", "-1");
		fireEvent.click(link);
		expect(onClick).not.toHaveBeenCalled();
	});
});

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
