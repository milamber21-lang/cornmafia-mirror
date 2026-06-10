//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBindingsPanel.tsx                                    ////
//// Language: TSX                                                                                               ////
//// Dedicated Riseopedia profile binding panel.                                                           ////
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
	buildRiseopediaProfileBindingFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import type {
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminMeta,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaProfileBindingsPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	displayProfiles: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaProfileBindingsPanel({
	open,
	mode,
	row,
	displayProfiles,
	meta,
	displayProfile,
	onClose,
	onSaved,
}: RiseopediaProfileBindingsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const scopedProfileId = displayProfile ? idText(displayProfile.display_profile_id) : "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() => buildRiseopediaProfileBindingFields({ displayProfiles, displayProfile, meta }),
		[displayProfile, displayProfiles, meta],
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
				const response = await fetch(displayProfile ? `/api/admin/riseopedia/profile-bindings?displayProfileId=${scopedProfileId}` : "/api/admin/riseopedia/profile-bindings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: mode === "edit" && row ? row["display_profile_binding_id"] : null,
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
			title={mode === "create" ? "Create profile binding" : "Edit profile binding"}
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

export { RiseopediaProfileBindingsPanel };
