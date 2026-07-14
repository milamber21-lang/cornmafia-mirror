//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-variant-selectors/page.tsx                                           ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia display profile variant selectors.                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaProfileVariantSelectorsTable from "@/components/admin/riseopedia/RiseopediaProfileVariantSelectorsTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminDisplayProfiles,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function ProfileVariantSelectorsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Variant Selectors" reason={guard.reason} />
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Variant Selectors"
			description="Choose which canonical variant group appears as the detail-page selector for each profile."
		>
			<RiseopediaAdminNav active="profile-variant-selectors" />
			<RiseopediaProfileVariantSelectorsTable
				initialRows={rows.variantSelectors}
				displayProfiles={rows.profiles}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
