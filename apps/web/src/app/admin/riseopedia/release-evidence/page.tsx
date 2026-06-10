//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/release-evidence/page.tsx                                           ////
//// Language: TSX                                                                                               ////
//// Read-only admin page for Riseopedia entity release evidence.                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaReleaseEvidenceTable from "@/components/admin/riseopedia/RiseopediaReleaseEvidenceTable";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaReleaseAdmin,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

export interface ReleaseEvidenceAdminPageProps {
	searchParams?: Promise<{
		entityId?: string;
		returnTo?: string;
	}>;
}

function readSafeDecisionReturnHref(value: string | undefined): string {
	if (typeof value !== "string" || !value.startsWith("/admin/riseopedia/release-decisions")) {
		return "/admin/riseopedia/release-decisions";
	}

	return value;
}

export default async function ReleaseEvidenceAdminPage({ searchParams }: ReleaseEvidenceAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Release Evidence" reason={guard.reason} />;
	}

	const resolvedSearchParams = searchParams ? await searchParams : {};
	const entityId = typeof resolvedSearchParams.entityId === "string" ? resolvedSearchParams.entityId : "";
	const [meta, rows] = await Promise.all([listRiseopediaAdminMeta(), listRiseopediaReleaseAdmin()]);
	const evidenceRows = entityId
		? rows.evidence.filter((row) => String(row.entity_id ?? "") === entityId)
		: rows.evidence;

	return (
		<RiseopediaAdminPageChrome
			title="Release Evidence"
			backHref={readSafeDecisionReturnHref(resolvedSearchParams.returnTo)}
			backLabel="Entity Decisions"
		>
			<RiseopediaReleaseEvidenceTable initialRows={evidenceRows} />
		</RiseopediaAdminPageChrome>
	);
}
