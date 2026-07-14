//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/series/[slug]/page.tsx                                                              ////
//// Language: TSX                                                                                              ////
//// Public DB-first series landing route that lists readable published episodes by series slug.                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { notFound } from "next/navigation";

import PublicSeriesPage from "@/components/public/PublicSeriesPage";
import { findPublicSeriesBySlug } from "@/lib/data/public-series";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function Page({
	params,
}: PageProps): Promise<JSX.Element> {
	const resolvedParams = await params;
	const seriesSlug = resolvedParams.slug.trim();

	if (!seriesSlug) {
		notFound();
	}

	const actorDiscordId = await getCurrentActorDiscordId();
	const series = await findPublicSeriesBySlug({
		actorDiscordId,
		seriesSlug,
	});

	if (!series) {
		notFound();
	}

	return <PublicSeriesPage series={series} />;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
