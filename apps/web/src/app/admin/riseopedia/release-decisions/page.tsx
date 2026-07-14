//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/release-decisions/page.tsx                                         ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia entity release decisions.                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaReleaseDecisionsTable from "@/components/admin/riseopedia/RiseopediaReleaseDecisionsTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaReleaseAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export interface ReleaseDecisionsAdminPageProps {
	searchParams?: Promise<{
		search?: string;
		entityType?: string;
		entityClass?: string;
		entityCategory?: string;
		patch?: string;
		releaseState?: string;
		overrideSource?: string;
	}>;
}

function readSearchParam(value: string | undefined): string {
	return typeof value === "string" ? value : "";
}

export default async function ReleaseDecisionsAdminPage({
	searchParams,
}: ReleaseDecisionsAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Entity Decisions" reason={guard.reason} />
		);
	}

	const resolvedSearchParams = searchParams ? await searchParams : {};
	const initialFilterState = {
		entityType: readSearchParam(resolvedSearchParams.entityType),
		entityClass: readSearchParam(resolvedSearchParams.entityClass),
		entityCategory: readSearchParam(resolvedSearchParams.entityCategory),
		patch: readSearchParam(resolvedSearchParams.patch),
		releaseState: readSearchParam(resolvedSearchParams.releaseState),
		overrideSource: readSearchParam(resolvedSearchParams.overrideSource),
	};
	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaReleaseAdmin(),
	]);

	return (
		<RiseopediaAdminPageChrome title="Entity Decisions">
			<RiseopediaReleaseDecisionsTable
				initialRows={rows.decisions}
				meta={meta}
				initialSearch={readSearchParam(resolvedSearchParams.search)}
				initialFilterState={initialFilterState}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
