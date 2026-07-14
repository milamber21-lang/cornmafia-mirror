//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/me/content/[category]/[subcategory]/page.tsx                                        ////
//// Language: TSX                                                                                              ////
//// Member route for managing actor-owned content inside one authorable collection.                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import { notFound } from "next/navigation";

import { findMemberContentCollectionByPath } from "@/lib/data/member-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import LoginClient from "@/components/login/LoginClient";
import MemberCollectionContentDashboard from "@/components/me/MemberCollectionContentDashboard";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{
		category: string;
		subcategory: string;
	}>;
};

export default async function MyCollectionContentPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const actorDiscordId = await getCurrentActorDiscordId();

	if (!actorDiscordId) {
		return (
			<section className="card member-page-card">
				<h1 className="member-page-title">My content</h1>
				<p>You are not signed in.</p>
				<LoginClient session={null} />
			</section>
		);
	}

	const resolvedParams = await params;
	const categorySlug = resolvedParams.category.trim();
	const subcategorySlug = resolvedParams.subcategory.trim();

	if (!categorySlug || !subcategorySlug) {
		notFound();
	}

	const collectionResult = await findMemberContentCollectionByPath({
		actorDiscordId,
		categorySlug,
		subcategorySlug,
	});

	if (!collectionResult) {
		notFound();
	}

	return (
		<MemberCollectionContentDashboard
			collection={collectionResult.collection}
			initialRows={collectionResult.rows}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
