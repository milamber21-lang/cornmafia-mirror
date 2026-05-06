//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/FieldError.tsx                                                ////
//// Language: TSX                                                                                                 ////
//// Exports the shared field error primitive                                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { ReactNode } from "react";

import { cn } from "../../../lib/cn";

type Props = {
	children?: ReactNode;
	className?: string;
	message?: ReactNode;
};

export default function FieldError({ children, className, message }: Props) {
	const content = children ?? message;

	if (!content) {
		return null;
	}

	return <div className={cn("ui-field-error", className)}>{content}</div>;
}
