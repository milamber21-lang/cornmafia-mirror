//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/[category]/page.tsx                                                                  ////
//// Language: TSX                                                                                               ////
//// Public category landing route for DB-resolved collection and content discovery.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { notFound } from "next/navigation";

import PublicCategoryHub from "@/components/public/PublicCategoryHub";
import { findPublicCategoryByPath } from "@/lib/data/public-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
	}>;
};

export default async function CategoryLandingPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const categorySlug = resolvedParams.category.trim();

	if (!categorySlug) {
		notFound();
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	const category = await findPublicCategoryByPath({
		actorDiscordId,
		categorySlug,
	});

	if (!category) {
		notFound();
	}

	return <PublicCategoryHub category={category} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
