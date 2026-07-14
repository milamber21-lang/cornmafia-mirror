//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/section-rules/page.tsx                                                       ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia section classification rules.                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaSectionRulesTable from "@/components/admin/riseopedia/RiseopediaSectionRulesTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function SectionRulesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Section Rules" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Section Rules"
			description="Map canonical game classifications into Riseopedia sections."
		>
			<RiseopediaAdminNav active="section-rules" />
			<RiseopediaSectionRulesTable
				initialRows={rows.classificationRules}
				sections={rows.sections}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
