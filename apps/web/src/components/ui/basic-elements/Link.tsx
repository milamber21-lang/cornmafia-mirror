//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Link.tsx                                                      ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Link primitive                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export default function Link({
	className,
	...rest
}: LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>) {
	return <NextLink {...rest} className={cn(className)} />;
}
