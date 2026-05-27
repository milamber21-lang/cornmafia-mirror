//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/section-rules/page.tsx                                               ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia automatic section rules.                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaSectionRulesTable from "@/components/admin/riseopedia/RiseopediaSectionRulesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaSectionRulesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Riseopedia Section Rules" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Section Rules"
		>
			<RiseopediaSectionRulesTable
				initialRows={rows.rules}
				sections={rows.sections}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
