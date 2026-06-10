//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/properties/page.tsx                                                          ////
//// Language: TSX                                                                                               ////
//// Read-only admin page for canonical game properties available to Riseopedia.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaPropertiesTable from "@/components/admin/riseopedia/RiseopediaPropertiesTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminProperties,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function PropertiesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Canonical Properties" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([listRiseopediaAdminMeta(), listRiseopediaAdminProperties()]);

	return (
		<RiseopediaAdminPageChrome
			title="Canonical Properties"
			description="Inspect canonical game properties available to display profiles and card rules."
		>
			<RiseopediaAdminNav active="profile-properties" />
			<RiseopediaPropertiesTable initialRows={rows.catalog} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
