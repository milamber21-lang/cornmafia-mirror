//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberManagementCard.tsx                                                   ////
//// Language: TSX                                                                                                ////
//// Shared member-management card built on the global browse-card geometry.                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import { BrowseResultCard } from "@/components/ui";
import { cn } from "@/lib/cn";

export type MemberManagementCardProps = {
	visual?: ReactNode;
	eyebrow?: ReactNode;
	title: ReactNode;
	summary?: ReactNode;
	details?: ReactNode;
	actions?: ReactNode;
	className?: string;
};

export default function MemberManagementCard({
	visual,
	eyebrow,
	title,
	summary,
	details,
	actions,
	className,
}: MemberManagementCardProps): JSX.Element {
	return (
		<BrowseResultCard
			visual={visual}
			eyebrow={eyebrow}
			title={title}
			summary={summary}
			details={details}
			endAdornment={
				actions ? (
					<span className="member-management-card__actions">{actions}</span>
				) : undefined
			}
			density="detailed"
			className={cn("member-management-card", className)}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
