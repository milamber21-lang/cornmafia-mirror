//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/discord/users/page.tsx                                                           ////
//// Language: TSX                                                                                                 ////
//// Admin page for managing Discord users                                                                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";
import Link from "next/link";

import DiscordUsersTable from "@/components/admin/discord/DiscordUsersTable";
import { ButtonLink } from "@/components/ui/basic-elements/Button";
import { requireAdmin } from "@/lib/auth/authz";

export default async function DiscordUsersAdminPage(): Promise<JSX.Element> {
	const guard = await requireAdmin();

	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Discord Users</h1>
					<p className="admin-guard-message">You need to sign in to access the admin area.</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Discord Users</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="neutral">
					Go back
				</ButtonLink>
			</div>
		);
	}

	return (
		<section className="card">
			<div className="admin-page-card-header">
				<h1 className="admin-page-card-title">Discord Users</h1>
				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="neutral">
						Go back
					</ButtonLink>
				</div>
			</div>

			<DiscordUsersTable />
		</section>
	);
}
