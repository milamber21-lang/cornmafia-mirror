//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/media/page.tsx                                                               ////
//// Language: TSX                                                                                                 ////
//// Admin page for managing web media                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";

import MediaTable from "@/components/admin/web/MediaTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import { getMediaTaxonomyOptions } from "@/lib/data/media";

export default async function MediaAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Media Files</h1>
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
				<h1 className="admin-guard-title">Media Files</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const taxonomy = await getMediaTaxonomyOptions();
	const categories = taxonomy.categories.map((row) => ({
		id: row.id,
		name: row.label,
	}));
	const subcategories = taxonomy.subcategories.map((row) => ({
		id: row.id,
		name: row.label,
		categoryId: row.categoryId,
	}));

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Media Files</h1>
				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="secondary">
						Go back
					</ButtonLink>
				</div>
			</div>

			<MediaTable categories={categories} subcategories={subcategories} />
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
