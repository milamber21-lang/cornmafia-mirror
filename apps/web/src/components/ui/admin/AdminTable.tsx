//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/admin/AdminTable.tsx                                                       ////
//// Language: TSX                                                                                               ////
//// Shared admin table frame and search primitives for table surfaces                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";

import Input from "../basic-elements/Input";
import { cn } from "../../../lib/cn";

type AdminTableSearchWidth = "default" | "large" | "wide";
type AdminTableSearchAlign = "center" | "start";

export type AdminTableFrameProps = {
	children: React.ReactNode;
	className?: string;
};

export type AdminTableSearchInputProps = Omit<
	React.ComponentProps<typeof Input>,
	"className"
> & {
	className?: string;
	width?: AdminTableSearchWidth;
	align?: AdminTableSearchAlign;
};

export function AdminTableFrame({
	children,
	className,
}: AdminTableFrameProps): React.JSX.Element {
	return <div className={cn("admin-table-frame", className)}>{children}</div>;
}

export function AdminTableSearchInput({
	className,
	width = "default",
	align = "center",
	...rest
}: AdminTableSearchInputProps): React.JSX.Element {
	return (
		<Input
			{...rest}
			className={cn(
				"admin-table-search",
				`admin-table-search--${width}`,
				`admin-table-search--${align}`,
				className,
			)}
		/>
	);
}
