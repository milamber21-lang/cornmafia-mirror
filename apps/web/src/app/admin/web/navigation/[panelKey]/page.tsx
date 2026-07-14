//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/navigation/[panelKey]/page.tsx                                              ////
//// Language: TSX                                                                                               ////
//// Admin page for designing one DB-first navigation panel tree                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import NavigationPanelDesigner from "@/components/admin/web/NavigationPanelDesigner";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	findNavigationPanelAdminByKey,
	findNavigationPanelTreeAdmin,
	listNavigationCategoriesLookupAdmin,
	listNavigationContentLookupAdmin,
	listNavigationSubcategoriesLookupAdmin,
} from "@/lib/data/navigation";

export const dynamic = "force-dynamic";

type PageContext = {
	params: Promise<{
		panelKey?: string;
	}>;
};

function normalizePanelKey(value: string | undefined): string | null {
	if (!value) {
		return null;
	}

	const normalized = decodeURIComponent(value).trim().toLowerCase();
	return normalized.length > 0 ? normalized : null;
}

export default async function NavigationPanelDesignerPage({
	params,
}: PageContext): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Navigation Designer</h1>
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
				<h1 className="admin-guard-title">Navigation Designer</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin/web/navigation" variant="secondary">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const resolvedParams = await params;
	const panelKey = normalizePanelKey(resolvedParams.panelKey);
	if (!panelKey) {
		notFound();
	}

	const [panel, doc, categories, subcategories, content] = await Promise.all([
		findNavigationPanelAdminByKey(panelKey),
		findNavigationPanelTreeAdmin(panelKey),
		listNavigationCategoriesLookupAdmin(),
		listNavigationSubcategoriesLookupAdmin(),
		listNavigationContentLookupAdmin(),
	]);

	if (!panel || !doc) {
		notFound();
	}

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<div>
					<h1 className="admin-page-card-title">Navigation Designer</h1>
				</div>
				<ButtonLink href="/admin/web/navigation" variant="secondary">
					Panels
				</ButtonLink>
			</div>

			<NavigationPanelDesigner
				initialDoc={doc}
				initialCategories={categories}
				initialSubcategories={subcategories}
				initialContent={content}
			/>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
