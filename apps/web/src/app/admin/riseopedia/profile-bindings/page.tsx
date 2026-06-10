//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-bindings/page.tsx                                                    ////
//// Language: TSX                                                                                               ////
//// Admin page for rebuilt Riseopedia display profile bindings.                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaAdminNav from "@/components/admin/riseopedia/RiseopediaAdminNav";
import { requireAdmin } from "@/lib/auth/authz";
import RiseopediaProfileBindingsTable from "@/components/admin/riseopedia/RiseopediaProfileBindingsTable";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminDisplayProfiles,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function ProfileBindingsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Bindings" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([listRiseopediaAdminMeta(), listRiseopediaAdminDisplayProfiles()]);

	return (
		<RiseopediaAdminPageChrome
			title="Profile Bindings"
			description="Map canonical game classifications to display profiles."
		>
			<RiseopediaAdminNav active="profile-bindings" />
			<RiseopediaProfileBindingsTable initialRows={rows.bindings} displayProfiles={rows.profiles} meta={meta} />
		</RiseopediaAdminPageChrome>
	);
}
