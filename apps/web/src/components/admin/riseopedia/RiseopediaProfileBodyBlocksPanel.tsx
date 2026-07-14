//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/riseopedia/RiseopediaProfileBodyBlocksPanel.tsx                       ////
//// Language: TSX                                                                                              ////
//// Dedicated Riseopedia display profile body-block configuration panel.                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm from "@/components/ui/PanelForm";
import { readResponseMessage } from "@/lib/helpers/http-response";

import { idText } from "./RiseopediaAdminConfigHelpers";
import { buildInitialValues, buildPayloadData } from "./RiseopediaAdminHelpers";
import { buildRiseopediaProfileBodyBlockFields } from "./RiseopediaAdminPanelFieldBuilders";
import {
	buildRiseopediaPanelFieldDef,
	buildRiseopediaPanelRows,
} from "./RiseopediaAdminPanelHelpers";
import type {
	RiseopediaAdminMeta,
	RiseopediaAdminPanelMode,
	RiseopediaAdminRow,
	RiseopediaAdminRows,
} from "./RiseopediaAdminTypes";

export interface RiseopediaProfileBodyBlocksPanelProps {
	open: boolean;
	mode: RiseopediaAdminPanelMode;
	row: RiseopediaAdminRow | null;
	displayProfiles: RiseopediaAdminRows;
	meta: RiseopediaAdminMeta;
	displayProfile?: RiseopediaAdminRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export default function RiseopediaProfileBodyBlocksPanel({
	open,
	mode,
	row,
	displayProfiles,
	meta,
	displayProfile,
	onClose,
	onSaved,
}: RiseopediaProfileBodyBlocksPanelProps): JSX.Element | null {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const scopedProfileId = displayProfile
		? idText(displayProfile.display_profile_id)
		: "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [mode, open, row]);

	const fields = useMemo(
		() =>
			buildRiseopediaProfileBodyBlockFields({
				displayProfiles,
				displayProfile,
				meta,
			}),
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
				const response = await fetch(
					displayProfile
						? `/api/admin/riseopedia/profile-body-blocks?displayProfileId=${scopedProfileId}`
						: "/api/admin/riseopedia/profile-body-blocks",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							op: "upsert",
							id: mode === "edit" && row ? row["display_profile_body_block_id"] : null,
							data: buildPayloadData(fields, values),
						}),
					},
				);

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save Riseopedia block."),
					);
				}
			} catch (errorValue: unknown) {
				const message =
					errorValue instanceof Error
						? errorValue.message
						: "Failed to save Riseopedia block.";
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
			title={mode === "create" ? "Add block" : "Edit block"}
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

export { RiseopediaProfileBodyBlocksPanel };

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
