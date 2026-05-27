//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-properties/page.tsx                                          ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia display profile property placements.                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfilePropertiesTable from "@/components/admin/riseopedia/RiseopediaProfilePropertiesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
	listRiseopediaAdminProperties,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaProfilePropertiesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Riseopedia Profile Properties" reason={guard.reason} />;
	}

	const [meta, displayRows, propertyRows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
		listRiseopediaAdminProperties({ entityTypeCode: null, search: null, limit: 2000 }),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Profile Properties"
		>
			<RiseopediaProfilePropertiesTable
				initialRows={displayRows.properties}
				displayProfiles={displayRows.profiles}
				propertyCatalog={propertyRows.catalog}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
