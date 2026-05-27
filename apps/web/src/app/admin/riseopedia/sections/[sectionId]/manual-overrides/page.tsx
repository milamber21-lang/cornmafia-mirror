//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/sections/[sectionId]/manual-overrides/page.tsx                      ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for managing manual Riseopedia section overrides.                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaSectionItemsTable from "@/components/admin/riseopedia/RiseopediaSectionItemsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminEntities,
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

type RiseopediaSectionOverridesScopedPageProps = {
	params: Promise<{
		sectionId: string;
	}>;
};

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function RiseopediaSectionOverridesScopedPage({
	params,
}: RiseopediaSectionOverridesScopedPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Section Manual Overrides" reason={guard.reason} />;
	}

	const resolvedParams = await params;
	const sectionId = parsePositiveInt(resolvedParams.sectionId);
	if (!sectionId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Section not found</h1>
				<p className="admin-state-message">The section id in the URL is invalid.</p>
				<div>
					<ButtonLink href="/admin/riseopedia/sections" variant="neutral">
						Sections
					</ButtonLink>
				</div>
			</section>
		);
	}

	const [meta, rows, entities] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
		listRiseopediaAdminEntities({ search: null, entityTypeCode: null, limit: 3000 }),
	]);
	const section = rows.sections.find((row) => String(row.section_id ?? "") === String(sectionId)) ?? null;
	if (!section) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Section not found</h1>
				<p className="admin-state-message">No Riseopedia section exists for id {sectionId}.</p>
				<div>
					<ButtonLink href="/admin/riseopedia/sections" variant="neutral">
						Sections
					</ButtonLink>
				</div>
			</section>
		);
	}

	const scopedItems = rows.items.filter((row) => String(row.section_id ?? "") === String(sectionId));

	return (
		<RiseopediaAdminPageChrome
			title={`Section Manual Overrides: ${String(section.section_name ?? section.section_code ?? sectionId)}`}
			backHref="/admin/riseopedia/sections"
			backLabel="Sections"
		>
			<RiseopediaSectionItemsTable
				initialRows={scopedItems}
				sections={rows.sections}
				entities={entities}
				meta={meta}
				section={section}
			/>
		</RiseopediaAdminPageChrome>
	);
}
