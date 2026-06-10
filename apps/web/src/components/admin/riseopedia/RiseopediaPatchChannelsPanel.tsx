//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaPatchChannelsPanel.tsx                                      ////
//// Language: TSX                                                                                               ////
//// Dedicated Riseopedia patch channel panel.                                                             ////
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
	buildRiseopediaPanelFieldDef,
	buildRiseopediaPanelRows,
} from "./RiseopediaAdminPanelHelpers";
import {
	buildRiseopediaPatchChannelFields,
} from "./RiseopediaAdminPanelFieldBuilders";
import type {
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
} from "./RiseopediaAdminTypes";

export interface RiseopediaPatchChannelsPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaPatchChannelsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: RiseopediaPatchChannelsPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() => buildRiseopediaPatchChannelFields(),
		[],
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
				const response = await fetch("/api/admin/riseopedia/patch-channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "upsert",
						id: mode === "edit" && row ? row["patch_publication_channel_id"] : null,
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
		[fields, mode, row],
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
			title={mode === "create" ? "Create patch publication channel" : "Edit patch publication channel"}
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

export { RiseopediaPatchChannelsPanel };
