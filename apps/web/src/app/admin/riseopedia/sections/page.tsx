//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/sections/page.tsx                                                            ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia sections.                                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaSectionsTable from "@/components/admin/riseopedia/RiseopediaSectionsTable";
import {
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function SectionsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Sections" reason={guard.reason} />;
	}

	const rows = await listRiseopediaAdminSections();

	return (
		<RiseopediaAdminPageChrome
			title="Sections"
			description="Configure editorial Riseopedia sections. Membership is defined by classification rules."
		>
			<RiseopediaAdminNav active="sections" />
			<RiseopediaSectionsTable initialRows={rows.sections} />
		</RiseopediaAdminPageChrome>
	);
}
