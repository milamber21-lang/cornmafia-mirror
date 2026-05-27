//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/visibility/page.tsx                                                  ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia entity visibility overrides.                                                      ////
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
		return <RiseopediaAdminGuard title="Riseopedia Visibility" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminVisibility({ search: null, entityTypeCode: null, limit: 1000 }),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Visibility"
		>
			<RiseopediaVisibilityTable initialRows={rows.overrides} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
