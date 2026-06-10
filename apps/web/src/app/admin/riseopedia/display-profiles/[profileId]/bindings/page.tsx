//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/display-profiles/[profileId]/bindings/page.tsx                      ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for Riseopedia display profile bindings.                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfileBindingsTable from "@/components/admin/riseopedia/RiseopediaProfileBindingsTable";
import type { RiseopediaAdminRow } from "@/components/admin/riseopedia/RiseopediaAdminTypes";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

interface PageProps {
	params: Promise<{ profileId: string }>;
}

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function findProfile(rows: RiseopediaAdminRow[], profileId: number): RiseopediaAdminRow | null {
	return rows.find((row) => Number(row.display_profile_id) === profileId) ?? null;
}

export default async function RiseopediaProfileBindingsScopedPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Bindings" reason={guard.reason} />;
	}

	const resolvedParams = await params;
	const profileId = parsePositiveInt(resolvedParams.profileId);
	if (!profileId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Profile not found</h1>
				<p className="admin-state-message">The profile id in the URL is invalid.</p>
				<ButtonLink href="/admin/riseopedia/display-profiles" variant="neutral">Profiles</ButtonLink>
			</section>
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);
	const profile = findProfile(rows.profiles, profileId);
	if (!profile) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Profile not found</h1>
				<p className="admin-state-message">No Riseopedia display profile exists for id {profileId}.</p>
				<ButtonLink href="/admin/riseopedia/display-profiles" variant="neutral">Profiles</ButtonLink>
			</section>
		);
	}

	const scopedRows = rows.bindings.filter((row) => String(row.display_profile_id ?? "") === String(profileId));

	return (
		<RiseopediaAdminPageChrome
			title={`Profile Bindings: ${String(profile.display_profile_name ?? profile.display_profile_code ?? profileId)}`}
			backHref="/admin/riseopedia/display-profiles"
			backLabel="Profiles"
		>
			<RiseopediaProfileBindingsTable
				initialRows={scopedRows}
				displayProfiles={rows.profiles}
				meta={meta}
				displayProfile={profile}
			/>
		</RiseopediaAdminPageChrome>
	);
}
