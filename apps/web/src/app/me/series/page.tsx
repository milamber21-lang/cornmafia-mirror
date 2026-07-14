//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/me/series/page.tsx                                                                  ////
//// Language: TSX                                                                                              ////
//// Member route for owned/manageable series management.                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import { listMemberSeries } from "@/lib/data/member-series";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import LoginClient from "@/components/login/LoginClient";
import MemberSeriesDashboard from "@/components/me/MemberSeriesDashboard";

export const dynamic = "force-dynamic";

export default async function MySeriesPage() {
	const actorDiscordId = await getCurrentActorDiscordId();

	if (!actorDiscordId) {
		return (
			<main className="card member-page-card">
				<h1 className="member-page-title">My series</h1>
				<p>You are not signed in.</p>
				<LoginClient session={null} />
			</main>
		);
	}

	const [rows, collections] = await Promise.all([
		listMemberSeries(actorDiscordId),
		listMemberAuthorableCollections(actorDiscordId),
	]);

	return (
		<MemberSeriesDashboard initialRows={rows} initialCollections={collections} />
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
