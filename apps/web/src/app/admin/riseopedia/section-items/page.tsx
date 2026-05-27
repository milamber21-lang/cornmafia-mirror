//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/section-items/page.tsx                                               ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia section manual overrides.                                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaSectionItemsTable from "@/components/admin/riseopedia/RiseopediaSectionItemsTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminEntities,
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaSectionItemsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Section Manual Overrides" reason={guard.reason} />;
	}

	const [meta, rows, entities] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
		listRiseopediaAdminEntities({ search: null, entityTypeCode: null, limit: 3000 }),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Section Manual Overrides"
		>
			<RiseopediaSectionItemsTable
				initialRows={rows.items}
				sections={rows.sections}
				entities={entities}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
