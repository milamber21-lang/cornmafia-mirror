//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/profile-bindings/page.tsx                                            ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia display profile bindings.                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfileBindingsTable from "@/components/admin/riseopedia/RiseopediaProfileBindingsTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaProfileBindingsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Bindings" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Profile Bindings"
		>
			<RiseopediaProfileBindingsTable
				initialRows={rows.bindings}
				displayProfiles={rows.profiles}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
