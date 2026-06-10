//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/relationship-display-rules/page.tsx                                ////
//// Language: TSX                                                                                              ////
//// Admin page for Riseopedia relationship display rules.                                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaRelationshipDisplayRulesTable from "@/components/admin/riseopedia/RiseopediaRelationshipDisplayRulesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaRelationshipDisplayRuleAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RelationshipDisplayRulesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Relationship Display Rules" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaRelationshipDisplayRuleAdmin(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Relationship Display Rules"
			description="Control which canonical entity relationships appear as Obtained from, Used for, or hidden on Riseopedia detail pages."
		>
			<RiseopediaAdminNav active="relationship-display-rules" />
			<RiseopediaRelationshipDisplayRulesTable initialRows={rows.rules} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
