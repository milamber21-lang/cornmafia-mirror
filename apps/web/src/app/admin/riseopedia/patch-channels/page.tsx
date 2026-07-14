//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/patch-channels/page.tsx                                                      ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia patch publication channels.                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaPatchChannelsTable from "@/components/admin/riseopedia/RiseopediaPatchChannelsTable";
import { listRiseopediaPatchAdmin } from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function PatchChannelsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Patch Channels" reason={guard.reason} />;
	}

	const rows = await listRiseopediaPatchAdmin();

	return (
		<RiseopediaAdminPageChrome
			title="Patch Channels"
			description="Configure publication channels used by Riseopedia release/listability rules."
		>
			<RiseopediaAdminNav active="patch-channels" />
			<RiseopediaPatchChannelsTable initialRows={rows.channels} />
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
