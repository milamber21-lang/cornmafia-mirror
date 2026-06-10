//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaSectionRulesPanel.tsx                                       ////
//// Language: TSX                                                                                               ////
//// Dedicated Riseopedia section rule panel.                                                              ////
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
	buildRiseopediaSectionRuleFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import type {
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminMeta,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaSectionRulesPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	sections: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	section?: RiseopediaAdminRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaSectionRulesPanel({
	open,
	mode,
	row,
	sections,
	meta,
	section,
	onClose,
	onSaved,
}: RiseopediaSectionRulesPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const scopedSectionId = section ? idText(section.section_id) : "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() => buildRiseopediaSectionRuleFields({ sections, section, meta }),
		[meta, section, sections],
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
				const response = await fetch(section ? `/api/admin/riseopedia/section-rules?sectionId=${scopedSectionId}` : "/api/admin/riseopedia/section-rules", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: mode === "edit" && row ? row["section_classification_rule_id"] : null,
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
		[fields, mode, row, scopedSectionId],
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
			title={mode === "create" ? "Create section classification rule" : "Edit section classification rule"}
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

export { RiseopediaSectionRulesPanel };
