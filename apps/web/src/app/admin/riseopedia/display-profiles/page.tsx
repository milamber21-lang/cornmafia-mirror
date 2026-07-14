//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/display-profiles/page.tsx                                                    ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia display profiles.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaDisplayProfilesTable from "@/components/admin/riseopedia/RiseopediaDisplayProfilesTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminDisplayProfiles,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function DisplayProfilesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Display Profiles" reason={guard.reason} />
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Display Profiles"
			description="Configure profile roots used by Riseopedia detail pages."
		>
			<RiseopediaAdminNav active="display-profiles" />
			<RiseopediaDisplayProfilesTable initialRows={rows.profiles} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
