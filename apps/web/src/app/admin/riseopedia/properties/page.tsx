//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/properties/page.tsx                                                  ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia display property catalog.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaPropertiesTable from "@/components/admin/riseopedia/RiseopediaPropertiesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminProperties,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaPropertiesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Riseopedia Properties" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminProperties({ entityTypeCode: null, search: null, limit: 2000 }),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Properties"
		>
			<RiseopediaPropertiesTable initialRows={rows.catalog} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
