//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/overview-card-rules/page.tsx                                                 ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia overview-card rule sets.                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaOverviewCardRuleSetsTable from "@/components/admin/riseopedia/RiseopediaOverviewCardRuleSetsTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaOverviewCardAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function OverviewCardRulesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Overview Card Rules" reason={guard.reason} />;
	}

	const [meta, overviewRows] = await Promise.all([listRiseopediaAdminMeta(), listRiseopediaOverviewCardAdmin()]);

	return (
		<RiseopediaAdminPageChrome title="Overview Card Rules">
			<RiseopediaAdminNav active="overview-card-rules" />
			<RiseopediaOverviewCardRuleSetsTable initialRows={overviewRows.ruleSets} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
