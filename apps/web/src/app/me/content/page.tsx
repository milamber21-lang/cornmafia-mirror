//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/me/content/page.tsx                                                                  ////
//// Language: TSX                                                                                                ////
//// Member route for the global actor-owned content management workspace.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { listMemberAuthorableCollections } from "@/lib/data/member-authoring";
import { listMemberContent } from "@/lib/data/member-content";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";
import LoginClient from "@/components/login/LoginClient";
import MemberContentDashboard from "@/components/me/MemberContentDashboard";

export const dynamic = "force-dynamic";

export default async function MyContentPage() {
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

	const [rows, collections] = await Promise.all([
		listMemberContent(actorDiscordId),
		listMemberAuthorableCollections(actorDiscordId),
	]);

	return (
		<MemberContentDashboard initialRows={rows} initialCollections={collections} />
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
