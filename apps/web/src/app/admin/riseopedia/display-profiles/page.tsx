//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/display-profiles/page.tsx                                            ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia display profiles.                                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaDisplayProfilesTable from "@/components/admin/riseopedia/RiseopediaDisplayProfilesTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaDisplayProfilesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Riseopedia Display Profiles" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Display Profiles"
		>
			<RiseopediaDisplayProfilesTable initialRows={rows.profiles} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
