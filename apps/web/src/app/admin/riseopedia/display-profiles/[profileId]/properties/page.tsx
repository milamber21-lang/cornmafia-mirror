//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/display-profiles/[profileId]/properties/page.tsx                    ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for managing property placements for one Riseopedia display profile.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaProfilePropertiesTable from "@/components/admin/riseopedia/RiseopediaProfilePropertiesTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminDisplayProfiles,
	listRiseopediaAdminMeta,
	listRiseopediaAdminProperties,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

type RiseopediaProfilePropertiesScopedPageProps = {
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

export default async function RiseopediaProfilePropertiesScopedPage({
	params,
}: RiseopediaProfilePropertiesScopedPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Profile Properties" reason={guard.reason} />;
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

	const [meta, displayRows, propertyRows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminDisplayProfiles(),
		listRiseopediaAdminProperties({ entityTypeCode: null, search: null, limit: 3000 }),
	]);
	const displayProfile = displayRows.profiles.find((row) => String(row.display_profile_id ?? "") === String(profileId)) ?? null;
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

	const scopedProperties = displayRows.properties.filter((row) => String(row.display_profile_id ?? "") === String(profileId));

	return (
		<RiseopediaAdminPageChrome
			title={`Profile Properties: ${String(displayProfile.display_profile_name ?? displayProfile.display_profile_code ?? profileId)}`}
			backHref="/admin/riseopedia/display-profiles"
			backLabel="Display Profiles"
		>
			<RiseopediaProfilePropertiesTable
				initialRows={scopedProperties}
				displayProfiles={displayRows.profiles}
				propertyCatalog={propertyRows.catalog}
				meta={meta}
				displayProfile={displayProfile}
			/>
		</RiseopediaAdminPageChrome>
	);
}
