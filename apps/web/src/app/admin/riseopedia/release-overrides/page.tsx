//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/release-overrides/page.tsx                                         ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia entity release overrides.                                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAccessControlNav from "@/components/admin/riseopedia/RiseopediaAccessControlNav";
import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaReleaseOverridesTable from "@/components/admin/riseopedia/RiseopediaReleaseOverridesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaReleaseAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export interface ReleaseOverridesAdminPageProps {
	searchParams?: Promise<{
		entityId?: string;
		returnTo?: string;
	}>;
}

function readSafeDecisionReturnHref(value: string | undefined): string {
	if (
		typeof value !== "string" ||
		!value.startsWith("/admin/riseopedia/release-decisions")
	) {
		return "/admin";
	}

	return value;
}

export default async function ReleaseOverridesAdminPage({
	searchParams,
}: ReleaseOverridesAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return (
			<RiseopediaAdminGuard title="Release Overrides" reason={guard.reason} />
		);
	}

	const resolvedSearchParams = searchParams ? await searchParams : {};
	const entityId =
		typeof resolvedSearchParams.entityId === "string"
			? resolvedSearchParams.entityId
			: "";
	const returnHref = readSafeDecisionReturnHref(resolvedSearchParams.returnTo);
	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaReleaseAdmin(),
	]);
	const overrideRows = entityId
		? rows.overrides.filter((row) => String(row.entity_id ?? "") === entityId)
		: rows.overrides;

	return (
		<RiseopediaAdminPageChrome
			title="Release Overrides"
			backHref={returnHref}
			backLabel={
				returnHref.startsWith("/admin/riseopedia/release-decisions")
					? "Entity Decisions"
					: "Go back"
			}
		>
			<RiseopediaAccessControlNav active="decisions" />
			<RiseopediaReleaseOverridesTable initialRows={overrideRows} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
