//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/templates/field-options/page.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Grouped admin page for DB-first template field options                                                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import TemplateFieldOptionsTable from "@/components/admin/web/TemplateFieldOptionsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	findTemplateFieldListAdminById,
	listTemplateFieldOptionsAdminByFieldListId,
} from "@/lib/data/templates";

export const dynamic = "force-dynamic";

type TemplateFieldOptionsAdminPageProps = {
	searchParams: Promise<{
		fieldListId?: string;
	}>;
};

function parsePositiveInt(value: string | undefined): number | null {
	if (!value || !/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function TemplateFieldOptionsAdminPage({
	searchParams,
}: TemplateFieldOptionsAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Field Options</h1>
					<p className="admin-guard-message">
						You need to sign in to access the admin area.
					</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Field Options</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const resolvedSearchParams = await searchParams;
	const fieldListId = parsePositiveInt(resolvedSearchParams.fieldListId);

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Field Options</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin/web/templates/field-list" variant="secondary">
						Field list
					</ButtonLink>
				</div>
			</div>

			{fieldListId ? <ResolvedFieldOptions fieldListId={fieldListId} /> : null}
		</section>
	);
}

type ResolvedFieldOptionsProps = {
	fieldListId: number;
};

async function ResolvedFieldOptions({
	fieldListId,
}: ResolvedFieldOptionsProps): Promise<JSX.Element> {
	const fieldList = await findTemplateFieldListAdminById(fieldListId);

	if (!fieldList) {
		return (
			<p className="admin-state-message">The selected field list was not found.</p>
		);
	}

	const fieldOptions =
		await listTemplateFieldOptionsAdminByFieldListId(fieldListId);

	return (
		<TemplateFieldOptionsTable initialRows={fieldOptions} fieldList={fieldList} />
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
