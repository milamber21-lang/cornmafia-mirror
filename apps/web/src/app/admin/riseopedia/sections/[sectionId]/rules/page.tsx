//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/sections/[sectionId]/rules/page.tsx                                 ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for managing automatic Riseopedia rules for one section.                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaSectionRulesTable from "@/components/admin/riseopedia/RiseopediaSectionRulesTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaAdminSections,
} from "@/lib/data/riseopedia-admin";

export const dynamic = "force-dynamic";

type RiseopediaSectionRulesScopedPageProps = {
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

export default async function RiseopediaSectionRulesScopedPage({
	params,
}: RiseopediaSectionRulesScopedPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Section Rules" reason={guard.reason} />;
	}

	const resolvedParams = await params;
	const sectionId = parsePositiveInt(resolvedParams.sectionId);
	if (!sectionId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Section not found</h1>
				<p className="admin-state-message">The section id in the URL is invalid.</p>
				<div>
					<ButtonLink href="/admin/riseopedia/sections" variant="secondary">
						Sections
					</ButtonLink>
				</div>
			</section>
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaAdminSections(),
	]);
	const section =
		rows.sections.find(
			(row) => String(row.section_id ?? "") === String(sectionId),
		) ?? null;
	if (!section) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Section not found</h1>
				<p className="admin-state-message">
					No Riseopedia section exists for id {sectionId}.
				</p>
				<div>
					<ButtonLink href="/admin/riseopedia/sections" variant="secondary">
						Sections
					</ButtonLink>
				</div>
			</section>
		);
	}

	const scopedRules = rows.classificationRules.filter(
		(row: { [key: string]: unknown }) =>
			String(row.section_id ?? "") === String(sectionId),
	);

	return (
		<RiseopediaAdminPageChrome
			title={`Section Rules: ${String(section.section_name ?? section.section_code ?? sectionId)}`}
			backHref="/admin/riseopedia/sections"
			backLabel="Sections"
		>
			<RiseopediaSectionRulesTable
				initialRows={scopedRules}
				sections={rows.sections}
				meta={meta}
				section={section}
			/>
		</RiseopediaAdminPageChrome>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
