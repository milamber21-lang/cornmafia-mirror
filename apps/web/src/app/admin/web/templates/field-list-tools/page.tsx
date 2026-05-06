//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/web/templates/field-list-tools/page.tsx                                         ////
//// Language: TSX                                                                                                 ////
//// Grouped admin page for selected template field-list editor tools                                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import type { JSX } from "react";
import Link from "next/link";

import TemplateFieldListToolsTable from "@/components/admin/web/TemplateFieldListToolsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	findTemplateFieldListAdminById,
	listTemplateFieldListToolsAdminByFieldListId,
	listTemplateFieldToolsAdminByFieldTypeCode,
} from "@/lib/data/templates";

export const dynamic = "force-dynamic";

type TemplateFieldListToolsAdminPageProps = {
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

export default async function TemplateFieldListToolsAdminPage({
	searchParams,
}: TemplateFieldListToolsAdminPageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		if (guard.reason === "not-authenticated") {
			return (
				<div className="admin-guard-shell">
					<h1 className="admin-guard-title">Field List Tools</h1>
					<p className="admin-guard-message">You need to sign in to access the admin area.</p>
					<Link href="/login" className="admin-guard-link">
						Go to login
					</Link>
				</div>
			);
		}

		return (
			<div className="admin-guard-shell">
				<h1 className="admin-guard-title">Field List Tools</h1>
				<p className="admin-guard-message">Admin access is required.</p>
				<ButtonLink href="/admin" variant="neutral">
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
				<h1 className="admin-page-card-title">Field List Tools</h1>

				<div className="admin-page-card-actions">
					<ButtonLink href="/admin/web/templates/field-list" variant="neutral">
						Field list
					</ButtonLink>
				</div>
			</div>

			{fieldListId ? <ResolvedFieldListTools fieldListId={fieldListId} /> : null}
		</section>
	);
}

type ResolvedFieldListToolsProps = {
	fieldListId: number;
};

async function ResolvedFieldListTools({
	fieldListId,
}: ResolvedFieldListToolsProps): Promise<JSX.Element> {
	const fieldList = await findTemplateFieldListAdminById(fieldListId);

	if (!fieldList) {
		return (
			<p className="admin-state-message">
				The selected field list was not found.
			</p>
		);
	}

	if (!fieldList.supportsTools) {
		return (
			<p className="admin-state-message">
				The selected field list does not support toolbar tools.
			</p>
		);
	}

	const [selectedTools, availableTools] = await Promise.all([
		listTemplateFieldListToolsAdminByFieldListId(fieldListId),
		listTemplateFieldToolsAdminByFieldTypeCode(fieldList.fieldTypeCode),
	]);

	return (
		<TemplateFieldListToolsTable
			initialRows={selectedTools}
			availableTools={availableTools}
			fieldList={fieldList}
		/>
	);
}
