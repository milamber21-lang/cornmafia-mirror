//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/templates/field-types/page.tsx                                               ////
//// Language: TSX                                                                                                 ////
//// Grouped admin page for DB-first template field types                                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import TemplateFieldTypesTable from "@/components/admin/web/TemplateFieldTypesTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import { listTemplateFieldTypesAdmin } from "@/lib/data/templates";

export const dynamic = "force-dynamic";

export default async function TemplateFieldTypesAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Field Types</h1>
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
				<h1 className="admin-guard-title">Field Types</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const fieldTypes = await listTemplateFieldTypesAdmin();

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Field Types</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="secondary">
						Go back
					</ButtonLink>
				</div>
			</div>

			<TemplateFieldTypesTable initialRows={fieldTypes} />
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
