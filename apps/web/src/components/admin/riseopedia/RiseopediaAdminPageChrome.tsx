//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaAdminPageChrome.tsx                                ////
//// Language: TSX                                                                                               ////
//// Shared guarded page chrome for Riseopedia admin pages.                                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX, ReactNode } from "react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui";

export interface RiseopediaAdminGuardProps {
	title: string;
	reason:
		| "not-authenticated"
		| "not-authorized"
		| "not-admin"
		| "not-editor"
		| "not-admin-or-editor"
		| "role-refresh-failed";
}

export interface RiseopediaAdminPageChromeProps {
	title: string;
	description?: string;
	children: ReactNode;
}

export function RiseopediaAdminGuard({
	title,
	reason,
}: RiseopediaAdminGuardProps): JSX.Element {
	if (reason === "not-authenticated") {
		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">{title}</h1>
				<p className="admin-guard-message">You need to sign in to access the admin area.</p>
				<Link href="/login" className="admin-guard-link">
					Go to login
				</Link>
			</div>
		);
	}

	return (
		<div className="admin-guard-shell">
			<h1 className="admin-guard-title">{title}</h1>
			<p className="admin-guard-message">Admin access is required.</p>
			<ButtonLink href="/admin" variant="neutral">
				Go back
			</ButtonLink>
		</div>
	);
}

export default function RiseopediaAdminPageChrome({
	title,
	children,
}: RiseopediaAdminPageChromeProps): JSX.Element {
	return (
		<section className="card">
			<div className="admin-page-card-header">
				<div>
					<h1 className="admin-page-card-title">{title}</h1>
				</div>
				<div className="admin-page-card-actions">
					<ButtonLink href="/admin" variant="neutral">
						Go back
					</ButtonLink>
				</div>
			</div>

			{children}
		</section>
	);
}
