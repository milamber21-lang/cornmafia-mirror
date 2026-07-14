//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/templates/[templateId]/page.tsx                                              ////
//// Language: TSX                                                                                                 ////
//// Grouped admin page for per-template field placements                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import TemplateFieldsTable from "@/components/admin/web/TemplateFieldsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	findTemplateAdminById,
	listTemplateFieldsAdminByTemplateId,
} from "@/lib/data/templates";

export const dynamic = "force-dynamic";

type TemplateFieldsPageProps = {
	params: Promise<{
		templateId: string;
	}>;
};

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default async function TemplateFieldsAdminPage({
	params,
}: TemplateFieldsPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Template Fields</h1>
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
				<h1 className="admin-guard-title">Template Fields</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const resolvedParams = await params;
	const templateId = parsePositiveInt(resolvedParams.templateId);
	if (!templateId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Template not found</h1>
				<p className="admin-state-message">
					The template id in the URL is invalid.
				</p>
				<div>
					<ButtonLink href="/admin/web/templates" variant="secondary">
						Templates
					</ButtonLink>
				</div>
			</section>
		);
	}

	const template = await findTemplateAdminById(templateId);
	if (!template) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Template not found</h1>
				<p className="admin-state-message">
					No template exists for id {templateId}.
				</p>
				<div>
					<ButtonLink href="/admin/web/templates" variant="secondary">
						Templates
					</ButtonLink>
				</div>
			</section>
		);
	}

	const templateFields = await listTemplateFieldsAdminByTemplateId(templateId);

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Template Fields</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin/web/templates" variant="secondary">
						Templates
					</ButtonLink>
				</div>
			</div>

			<TemplateFieldsTable
				templateId={template.id}
				templateLabel={template.label}
				templateCode={template.templateCode}
				initialRows={templateFields}
			/>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
