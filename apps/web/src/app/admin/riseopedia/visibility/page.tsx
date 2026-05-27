//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/visibility/page.tsx                                                  ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia item visibility overrides.                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaVisibilityTable from "@/components/admin/riseopedia/RiseopediaVisibilityTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminVisibility,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaVisibilityAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Item Visibility Overrides" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminVisibility({ search: null, entityTypeCode: null, limit: 1000 }),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Item Visibility Overrides"
		>
			<RiseopediaVisibilityTable initialRows={rows.overrides} entities={rows.entities} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
