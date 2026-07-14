//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-properties/page.tsx                                                  ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia display profile property placements.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaProfileElementsTable from "@/components/admin/riseopedia/RiseopediaProfileElementsTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminDisplayProfiles,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function ProfilePropertiesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Profile Properties" reason={guard.reason} />
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Profile Properties"
			description="Place canonical game properties into detail-page display slots."
		>
			<RiseopediaAdminNav active="profile-properties" />
			<RiseopediaProfileElementsTable
				initialRows={rows.properties}
				displayProfiles={rows.profiles}
				meta={meta}
				allBindings={rows.bindings}
				bodyBlocks={rows.bodyBlocks}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
