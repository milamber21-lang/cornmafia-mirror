//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/patch-publications/page.tsx                                         ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia patch publication state.                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaPatchPublicationsTable from "@/components/admin/riseopedia/RiseopediaPatchPublicationsTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaPatchAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function PatchPublicationsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Patch Publications" reason={guard.reason} />
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaPatchAdmin(),
	]);

	return (
		<RiseopediaAdminPageChrome title="Patch Publications">
			<RiseopediaPatchPublicationsTable
				initialRows={rows.publications}
				channels={rows.channels}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
