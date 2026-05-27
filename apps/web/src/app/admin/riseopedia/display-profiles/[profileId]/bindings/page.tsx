//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/display-profiles/[profileId]/bindings/page.tsx                      ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for managing bindings for one Riseopedia display profile.                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfileBindingsTable from "@/components/admin/riseopedia/RiseopediaProfileBindingsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

type RiseopediaProfileBindingsScopedPageProps = {
	params: Promise<{
		profileId: string;
	}>;
};

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function RiseopediaProfileBindingsScopedPage({
	params,
}: RiseopediaProfileBindingsScopedPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Bindings" reason={guard.reason} />;
	}

	const resolvedParams = await params;
	const profileId = parsePositiveInt(resolvedParams.profileId);
	if (!profileId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Display profile not found</h1>
				<p className="admin-state-message">The display profile id in the URL is invalid.</p>
				<div>
					<ButtonLink href="/admin/riseopedia/display-profiles" variant="neutral">
						Display Profiles
					</ButtonLink>
				</div>
			</section>
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
	]);
	const displayProfile = rows.profiles.find((row) => String(row.display_profile_id ?? "") === String(profileId)) ?? null;
	if (!displayProfile) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Display profile not found</h1>
				<p className="admin-state-message">No Riseopedia display profile exists for id {profileId}.</p>
				<div>
					<ButtonLink href="/admin/riseopedia/display-profiles" variant="neutral">
						Display Profiles
					</ButtonLink>
				</div>
			</section>
		);
	}

	const scopedBindings = rows.bindings.filter((row) => String(row.display_profile_id ?? "") === String(profileId));

	return (
		<RiseopediaAdminPageChrome
			title={`Profile Bindings: ${String(displayProfile.display_profile_name ?? displayProfile.display_profile_code ?? profileId)}`}
			backHref="/admin/riseopedia/display-profiles"
			backLabel="Display Profiles"
		>
			<RiseopediaProfileBindingsTable
				initialRows={scopedBindings}
				displayProfiles={rows.profiles}
				meta={meta}
				displayProfile={displayProfile}
				allBindings={rows.bindings}
			/>
		</RiseopediaAdminPageChrome>
	);
}
