//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileVariantSelectorsPanel.tsx                            ////
//// Language: TSX                                                                                               ////
//// Dedicated Riseopedia profile variant selector panel.                                                  ////
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
	buildRiseopediaProfileVariantSelectorFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import type {
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminMeta,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaProfileVariantSelectorsPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	displayProfiles: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
	rows: RiseopediaAdminRows;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaProfileVariantSelectorsPanel({
	open,
	mode,
	row,
	displayProfiles,
	meta,
	displayProfile,
	rows,
	onClose,
	onSaved,
}: RiseopediaProfileVariantSelectorsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const scopedProfileId = displayProfile ? idText(displayProfile.display_profile_id) : "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() => buildRiseopediaProfileVariantSelectorFields({ displayProfiles, displayProfile, meta, row, rows }),
		[displayProfile, displayProfiles, meta, row, rows],
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
				const response = await fetch(displayProfile ? `/api/admin/riseopedia/profile-variant-selectors?displayProfileId=${scopedProfileId}` : "/api/admin/riseopedia/profile-variant-selectors", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: mode === "edit" && row ? row["display_profile_variant_selector_id"] : null,
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
		[displayProfile, fields, mode, row, scopedProfileId],
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
			title={mode === "create" ? "Add variant selector" : "Edit variant selector"}
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

export { RiseopediaProfileVariantSelectorsPanel };
