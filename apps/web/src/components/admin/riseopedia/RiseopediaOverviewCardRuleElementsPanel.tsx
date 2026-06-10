//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaOverviewCardRuleElementsPanel.tsx                           ////
//// Language: TSX                                                                                               ////
//// Dedicated Riseopedia overview card rule element panel.                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm from "@/components/ui/PanelForm";
import { readResponseMessage } from "@/lib/helpers/http-response";

import {
	buildInitialValues,
	buildPayloadData,
} from "./RiseopediaAdminHelpers";
import {
	idText,
} from "./RiseopediaAdminConfigHelpers";
import {
	buildRiseopediaPanelFieldDef,
	buildRiseopediaPanelRows,
} from "./RiseopediaAdminPanelHelpers";
import {
	buildRiseopediaOverviewCardRuleElementFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import type {
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminMeta,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaOverviewCardRuleElementsPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	ruleSets: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	ruleSet?: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRows;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaOverviewCardRuleElementsPanel({
	open,
	mode,
	row,
	ruleSets,
	meta,
	ruleSet,
	rows,
	onClose,
	onSaved,
}: RiseopediaOverviewCardRuleElementsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const scopedRuleSetId = ruleSet ? idText(ruleSet.overview_card_rule_set_id) : "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() => buildRiseopediaOverviewCardRuleElementFields({ ruleSets, ruleSet, meta, row, rows }),
		[meta, row, rows, ruleSet, ruleSets],
	);

	const defaultValues = useMemo(
		() => buildInitialValues(fields, row),
		[fields, row],
	);

	const visibleFields = useMemo(
		() => fields.filter((field) => field.hidden !== true),
		[fields],
	);

	const panelFields = useMemo(
		() => visibleFields.map((field) => buildRiseopediaPanelFieldDef(field, mode)),
		[mode, visibleFields],
	);

	const panelRows = useMemo(() => buildRiseopediaPanelRows(fields), [fields]);

	const handleSubmit = useCallback(
		async (values: { [key: string]: unknown }): Promise<void> => {
			setSubmitting(true);
			setTopError("");

			try {
				const response = await fetch(ruleSet ? `/api/admin/riseopedia/overview-card-rule-elements?ruleSetId=${scopedRuleSetId}` : "/api/admin/riseopedia/overview-card-rule-elements", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: mode === "edit" && row ? row["overview_card_rule_element_id"] : null,
						data: buildPayloadData(fields, values),
					}),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save Riseopedia row."),
					);
				}
			} catch (errorValue: unknown) {
				const message =
					errorValue instanceof Error
						? errorValue.message
						: "Failed to save Riseopedia row.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[fields, mode, row, scopedRuleSetId],
	);

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				onClose();
			}}
			title={mode === "create" ? "Add overview card element" : "Edit overview card element"}
			width="50%"
			showSave={true}
			mode={mode}
			defaultValues={defaultValues}
			fields={panelFields}
			rows={panelRows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				void onSaved();
				onClose();
			}}
			submitting={submitting}
			error={topError}
			dirtyGuard
		/>
	);
}

export { RiseopediaOverviewCardRuleElementsPanel };
