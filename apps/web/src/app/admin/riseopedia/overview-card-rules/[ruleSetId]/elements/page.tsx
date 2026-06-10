//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/admin/riseopedia/overview-card-rules/[ruleSetId]/elements/page.tsx                   ////
//// Language: TSX                                                                                               ////
//// Scoped admin page for Riseopedia overview-card rule elements.                                               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";

import RiseopediaAdminPageChrome, {
	RiseopediaAdminGuard,
} from "@/components/admin/riseopedia/RiseopediaAdminPageChrome";
import RiseopediaOverviewCardRuleElementsTable from "@/components/admin/riseopedia/RiseopediaOverviewCardRuleElementsTable";
import { ButtonLink } from "@/components/ui";
import { requireAdmin } from "@/lib/auth/authz";
import {
	listRiseopediaAdminMeta,
	listRiseopediaOverviewCardAdmin,
} from "@/lib/data/riseopedia-admin";
import type { RiseopediaAdminRow } from "@/components/admin/riseopedia/RiseopediaAdminTypes";

export const dynamic = "force-dynamic";

interface PageProps {
	params: Promise<{ ruleSetId: string }>;
}

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value.trim())) {
		return null;
	}

	const parsed = Number(value.trim());
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function findRuleSet(rows: RiseopediaAdminRow[], ruleSetId: number): RiseopediaAdminRow | null {
	return rows.find((row) => Number(row.overview_card_rule_set_id) === ruleSetId) ?? null;
}

export default async function RiseopediaOverviewCardRuleElementsScopedPage({
	params,
}: PageProps): Promise<JSX.Element> {
	const guard = await requireAdmin();
	if (!guard.allowed) {
		return <RiseopediaAdminGuard title="Overview Card Elements" reason={guard.reason} />;
	}

	const resolvedParams = await params;
	const ruleSetId = parsePositiveInt(resolvedParams.ruleSetId);
	if (!ruleSetId) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Rule set not found</h1>
				<p className="admin-state-message">The rule set id in the URL is invalid.</p>
				<ButtonLink href="/admin/riseopedia/overview-card-rules" variant="neutral">Rule sets</ButtonLink>
			</section>
		);
	}

	const [meta, rows] = await Promise.all([
		listRiseopediaAdminMeta(),
		listRiseopediaOverviewCardAdmin(),
	]);
	const ruleSet = findRuleSet(rows.ruleSets, ruleSetId);
	if (!ruleSet) {
		return (
			<section className="card admin-state-card">
				<h1 className="admin-page-card-title">Rule set not found</h1>
				<p className="admin-state-message">No Riseopedia overview-card rule set exists for id {ruleSetId}.</p>
				<ButtonLink href="/admin/riseopedia/overview-card-rules" variant="neutral">Rule sets</ButtonLink>
			</section>
		);
	}

	const scopedRows = rows.ruleElements.filter((row) => String(row.overview_card_rule_set_id ?? "") === String(ruleSetId));

	return (
		<RiseopediaAdminPageChrome
			title={`Overview Card Elements: ${String(ruleSet.rule_set_label ?? ruleSet.placement_name ?? ruleSetId)}`}
			backHref="/admin/riseopedia/overview-card-rules"
			backLabel="Rule sets"
		>
			<RiseopediaOverviewCardRuleElementsTable
				initialRows={scopedRows}
				ruleSets={rows.ruleSets}
				meta={meta}
				ruleSet={ruleSet}
			/>
		</RiseopediaAdminPageChrome>
	);
}
