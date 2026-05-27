//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/blocks/page.tsx                                                      ////
//// Language: TSX                                                                                               ////
//// Admin page for Riseopedia relationship, dependency, and changelog blocks.                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaBlocksTable from "@/components/admin/riseopedia/RiseopediaBlocksTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export default async function RiseopediaBlocksAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Blocks" reason={guard.reason} />;
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);

	return (
		<RiseopediaAdminPageChrome
			title="Profile Blocks"
		>
			<RiseopediaBlocksTable
				initialRows={rows.relationshipBlocks}
				displayProfiles={rows.profiles}
				meta={meta}
			/>
		</RiseopediaAdminPageChrome>
	);
}
