//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/icons/page.tsx                                                               ////
//// Language: TSX                                                                                                 ////
//// Admin page for managing web icons                                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";
import Link from "next/link";

import IconsTable from "@/components/admin/web/IconsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import { listIconsAdmin } from "@/lib/data/icons";

export const dynamic = "force-dynamic";

export default async function IconsAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Icons</h1>
					<p className="admin-guard-message">You need to sign in to access the admin area.</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Icons</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="neutral">
					Go back
				</ButtonLink>
			</div>
		);
	}

	const icons = await listIconsAdmin();

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Icons</h1>
				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="neutral">
						Go back
					</ButtonLink>
				</div>
			</div>

			<IconsTable initialRows={icons} />
		</section>
	);
}
