//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicTaxonomyIcon.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Compatibility wrapper around the global application icon visual for public taxonomy surfaces.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import { IconVisual, type IconVisualSize } from "@/components/ui";
import { cn } from "@/lib/cn";
import type {
	PublicCollectionIconColor,
	PublicCollectionIconKey,
} from "@/lib/data/public-content";

type PublicTaxonomyIconProps = {
	iconKey: PublicCollectionIconKey | null;
	iconColor: PublicCollectionIconColor | null;
	title: string;
	size?: "md" | "lg" | "xl";
	iconSize?: number;
	fallbackLucideName?: string;
	className?: string;
};

function iconVisualSize(size: PublicTaxonomyIconProps["size"]): IconVisualSize {
	if (size === "md") {
		return "compact";
	}

	if (size === "xl") {
		return "large";
	}

	return "card";
}

export default function PublicTaxonomyIcon({
	iconKey,
	iconColor,
	title,
	size = "lg",
	fallbackLucideName = "FolderOpen",
	className,
}: PublicTaxonomyIconProps): JSX.Element {
	return (
		<IconVisual
			iconKey={iconKey}
			iconColor={iconColor}
			fallback={{ lucideName: fallbackLucideName }}
			mediaRouteScope="app"
			size={iconVisualSize(size)}
			title={title}
			className={cn("public-taxonomy-icon", className)}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
