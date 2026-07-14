//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/ui/RiseopediaPageHeader.tsx                                          ////
//// Language: TSX                                                                                                 ////
//// Compatibility wrapper routing Riseopedia overview headers through the shared browse-page header.              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import BrowsePageHeader, {
	type BrowsePageHeaderBreadcrumbItem,
} from "@/components/ui/browse/BrowsePageHeader";

export type RiseopediaPageHeaderBreadcrumbItem = BrowsePageHeaderBreadcrumbItem;

export type RiseopediaPageHeaderProps = {
	title: string;
	description?: string | null;
	eyebrow?: string | null;
	breadcrumbs?: RiseopediaPageHeaderBreadcrumbItem[];
	actions?: ReactNode;
};

export default function RiseopediaPageHeader({
	title,
	description = null,
	eyebrow = null,
	breadcrumbs,
	actions = null,
}: RiseopediaPageHeaderProps): JSX.Element {
	return (
		<BrowsePageHeader
			className="riseopedia-page-hero"
			title={title}
			description={description}
			eyebrow={eyebrow}
			breadcrumbs={breadcrumbs}
			actions={actions}
			breadcrumbLabel="Riseopedia breadcrumb"
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
