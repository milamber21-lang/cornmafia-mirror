//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/section-items/page.tsx                                               ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia manual section items.                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaSectionItemsTable from "@/components/admin/riseopedia/RiseopediaSectionItemsTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaSectionItemsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Riseopedia Manual Items" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Riseopedia Manual Items"
		>
			<RiseopediaSectionItemsTable
				initialRows={rows.items}
				sections={rows.sections}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
