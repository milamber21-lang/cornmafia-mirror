//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Badge.tsx                                                     ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Badge primitive                                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { HTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

type Variant = "neutral" | "accent" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
	variant?: Variant;
};

export default function Badge({
	variant = "neutral",
	className,
	...rest
}: BadgeProps) {
	return (
		<span
			{...rest}
			className={cn("ui-badge", `ui-badge--${variant}`, className)}
		/>
	);
}
