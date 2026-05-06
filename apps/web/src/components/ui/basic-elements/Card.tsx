//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/Card.tsx                                                      ////
//// Language: TSX                                                                                                 ////
//// Exports the shared Card primitive                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { HTMLAttributes } from "react";

import { cn } from "../../../lib/cn";

export default function Card({
	className,
	...rest
}: HTMLAttributes<HTMLDivElement>) {
	return <div {...rest} className={cn("card", className)} />;
}
