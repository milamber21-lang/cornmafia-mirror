//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-body-blocks/page.tsx                                        ////
//// Language: TSX                                                                                              ////
//// Admin page for Riseopedia display profile block configuration.                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfileBodyBlocksTable from "@/components/admin/riseopedia/RiseopediaProfileBodyBlocksTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function ProfileBodyBlocksAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Blocks" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Profile Blocks"
			description="Configure logical blocks for Riseopedia-family display profiles."
		>
			<RiseopediaAdminNav active="profile-body-blocks" />
			<RiseopediaProfileBodyBlocksTable
				initialRows={rows.bodyBlocks}
				displayProfiles={rows.profiles}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
