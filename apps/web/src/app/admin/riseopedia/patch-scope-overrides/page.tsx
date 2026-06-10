//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/patch-scope-overrides/page.tsx                                     ////
//// Language: TSX                                                                                               ////
//// Admin page for classification-level Riseopedia patch overrides.                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaPatchScopeOverridesTable from "@/components/admin/riseopedia/RiseopediaPatchScopeOverridesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaPatchAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function PatchScopeOverridesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Patch Overrides" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([listRiseopediaAdminMeta(), listRiseopediaPatchAdmin()]);

	return (
		<RiseopediaAdminPageChrome title="Patch Overrides">
			<RiseopediaPatchScopeOverridesTable initialRows={rows.scopeOverrides} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
