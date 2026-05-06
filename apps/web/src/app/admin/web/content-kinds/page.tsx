//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/content-kinds/page.tsx                                                       ////
//// Language: TSX                                                                                                ////
//// Admin page for DB-first content kinds with page-level admin guard and direct server preload                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import Link from "next/link";

import ContentKindsTable from "@/components/admin/web/ContentKindsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import { listContentKindsAdmin } from "@/lib/data/content-kinds";

export const dynamic = "force-dynamic";

export default async function ContentKindsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Content Kinds</h1>
					<p className="admin-guard-message">You need to sign in to access the admin area.</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Content Kinds</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="neutral">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const rows = await listContentKindsAdmin();

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Content Kinds</h1>
				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="neutral">
						Go back
					</ButtonLink>
				</div>
			</div>

			<ContentKindsTable initialRows={rows} />
		</section>
	);
}
