//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/basic-elements/AlertBanner.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Shared alert banner with optional dismiss and opt-in auto-hide behavior                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { useEffect, useState } from "react";

import { cn } from "../../../lib/cn";

type Props = {
	tone?: "warning" | "error" | "info" | "success";
	children: React.ReactNode;
	dismissible?: boolean;
	className?: string;
	/** Auto-hide after this many milliseconds. Defaults to disabled. Set to a positive value to enable. */
	autoHideMs?: number;
};

export default function AlertBanner({
	tone = "warning",
	children,
	dismissible,
	className,
	autoHideMs = 0,
}: Props): React.JSX.Element | null {
	const [open, setOpen] = useState(true);

	useEffect(() => {
		setOpen(true);
	}, [children, tone, className, autoHideMs]);

	useEffect(() => {
		if (!open) {
			return;
		}
		if (typeof autoHideMs !== "number" || autoHideMs <= 0) {
			return;
		}
		const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
			setOpen(false);
		}, autoHideMs);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [autoHideMs, open]);

	if (!open) {
		return null;
	}

	return (
		<div
			role="status"
			className={cn("ui-alert-banner", `ui-alert-banner--${tone}`, className)}
		>
			<div className="container alert-banner-inner">
				<div className="ui-alert-banner__content">{children}</div>
				{dismissible ? (
					<button
						className="ui-alert-banner__dismiss"
						onClick={() => setOpen(false)}
						aria-label="Dismiss"
						title="Dismiss"
					>
						×
					</button>
				) : null}
			</div>
		</div>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
