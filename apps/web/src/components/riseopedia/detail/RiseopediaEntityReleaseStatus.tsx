//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/detail/RiseopediaEntityReleaseStatus.tsx                                ////
//// Language: TSX                                                                                                ////
//// Mafiosopedia hero release-status display and guarded manual override panel.                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { useRouter } from "next/navigation";

import {
	AlertBanner,
	Button,
	DropdownMenuSingle,
	Panel,
	Textarea,
} from "@/components/ui";

export type RiseopediaEntityReleaseStatusValue = {
	entityId: string;
	entityTypeCode: string;
	publicPatchId: string | null;
	manualOverrideId: string | null;
	manualOverrideStateCode: string | null;
	manualOverrideReasonCode: string | null;
	manualOverrideReasonName: string | null;
	manualOverrideNote: string | null;
	automaticReleaseStateCode: string | null;
	automaticReleaseConfidenceScore: number | null;
	automaticBlockerEvidenceCode: string | null;
	publicationScopeActionCode: string | null;
	effectivePublished: boolean;
	effectiveVisibilitySourceCode: "published" | "patch" | "evidence" | "manual";
	effectiveStatusLabel: string;
	effectiveStatusDetail: string | null;
};

export type RiseopediaReleaseOverrideReasonOptionValue = {
	overrideReasonCode: string;
	overrideReasonName: string;
	description: string | null;
	hideAvailable: boolean;
	publishAvailable: boolean;
	noteRequired: boolean;
	sortOrder: number;
};

type OverrideMode = "hide" | "publish";

type ApiResponse = {
	ok?: unknown;
	message?: unknown;
};

function modeForStatus(
	status: RiseopediaEntityReleaseStatusValue,
): OverrideMode {
	return status.effectivePublished ? "hide" : "publish";
}

function overrideStateCode(
	mode: OverrideMode,
): "manual_hidden" | "manual_live" {
	return mode === "hide" ? "manual_hidden" : "manual_live";
}

function actionLabel(mode: OverrideMode): string {
	return mode === "hide" ? "Hide" : "Publish manually";
}

function reasonIsAvailableForMode(args: {
	reason: RiseopediaReleaseOverrideReasonOptionValue;
	mode: OverrideMode;
}): boolean {
	if (args.reason.overrideReasonCode === "manual") {
		return false;
	}

	return args.mode === "hide"
		? args.reason.hideAvailable
		: args.reason.publishAvailable;
}

function defaultReasonCode(args: {
	mode: OverrideMode;
	reasons: RiseopediaReleaseOverrideReasonOptionValue[];
	currentReasonCode: string | null;
}): string {
	const current = args.reasons.find(
		(reason) => reason.overrideReasonCode === args.currentReasonCode,
	);
	if (
		current &&
		reasonIsAvailableForMode({
			reason: current,
			mode: args.mode,
		})
	) {
		return current.overrideReasonCode;
	}

	const matching = args.reasons.find((reason) =>
		reasonIsAvailableForMode({ reason, mode: args.mode }),
	);
	return matching?.overrideReasonCode ?? "";
}

function readableApiError(value: unknown): string {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "The release-status action failed.";
	}

	const response = value as ApiResponse;
	return typeof response.message === "string" &&
		response.message.trim().length > 0
		? response.message
		: "The release-status action failed.";
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
	try {
		const payload: unknown = await response.json();
		return payload && typeof payload === "object" && !Array.isArray(payload)
			? (payload as ApiResponse)
			: {};
	} catch {
		return {};
	}
}

function hasOk(response: ApiResponse): boolean {
	return response.ok === true;
}

export type RiseopediaEntityReleaseStatusProps = {
	status: RiseopediaEntityReleaseStatusValue;
	canManage: boolean;
	reasons: RiseopediaReleaseOverrideReasonOptionValue[];
};

export default function RiseopediaEntityReleaseStatus({
	status,
	canManage,
	reasons,
}: RiseopediaEntityReleaseStatusProps): JSX.Element {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reasonCode, setReasonCode] = useState("");
	const [note, setNote] = useState("");
	const [topError, setTopError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const mode = modeForStatus(status);

	const compatibleReasons = useMemo(
		() => reasons.filter((reason) => reasonIsAvailableForMode({ reason, mode })),
		[mode, reasons],
	);
	const selectedReason = useMemo(
		() =>
			compatibleReasons.find(
				(reason) => reason.overrideReasonCode === reasonCode,
			) ?? null,
		[compatibleReasons, reasonCode],
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		setReasonCode(
			defaultReasonCode({
				mode,
				reasons,
				currentReasonCode: status.manualOverrideReasonCode,
			}),
		);
		setNote(status.manualOverrideNote ?? "");
		setTopError(null);
	}, [
		mode,
		open,
		reasons,
		status.manualOverrideNote,
		status.manualOverrideReasonCode,
	]);

	function closePanel(): void {
		if (!submitting) {
			setOpen(false);
		}
	}

	function openPanel(): void {
		setOpen(true);
	}

	async function saveOverride(): Promise<void> {
		if (!selectedReason) {
			setTopError("Choose a manual release reason.");
			return;
		}

		if (selectedReason.noteRequired && note.trim().length === 0) {
			setTopError("This release reason requires a note.");
			return;
		}

		setSubmitting(true);
		setTopError(null);

		try {
			const response = await fetch("/api/admin/riseopedia/release-overrides", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					op: "upsert",
					id: status.manualOverrideId,
					data: {
						entityTypeCode: status.entityTypeCode,
						entityId: Number(status.entityId),
						patchId: status.publicPatchId ? Number(status.publicPatchId) : null,
						overrideStateCode: overrideStateCode(mode),
						overrideReasonCode: selectedReason.overrideReasonCode,
						overrideNote: selectedReason.noteRequired ? note.trim() || null : null,
						active: true,
					},
				}),
			});
			const payload = await readApiResponse(response);
			if (!response.ok || !hasOk(payload)) {
				setTopError(readableApiError(payload));
				return;
			}

			setOpen(false);
			router.refresh();
		} catch {
			setTopError("The release-status action failed.");
		} finally {
			setSubmitting(false);
		}
	}

	async function restoreInheritedPolicy(): Promise<void> {
		if (!status.manualOverrideId) {
			return;
		}

		setSubmitting(true);
		setTopError(null);

		try {
			const response = await fetch("/api/admin/riseopedia/release-overrides", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					op: "delete",
					id: Number(status.manualOverrideId),
				}),
			});
			const payload = await readApiResponse(response);
			if (!response.ok || !hasOk(payload)) {
				setTopError(readableApiError(payload));
				return;
			}

			setOpen(false);
			router.refresh();
		} catch {
			setTopError("The release-status action failed.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<>
			<div className="riseopedia-release-status">
				{canManage ? (
					<button
						aria-haspopup="dialog"
						className="riseopedia-state-toggle riseopedia-state-toggle--rarity"
						data-variant="mythic"
						type="button"
						onClick={openPanel}
					>
						Status
					</button>
				) : null}
				<span
					aria-label={status.effectiveStatusDetail ?? status.effectiveStatusLabel}
					className="riseopedia-state-toggle riseopedia-state-toggle--rarity riseopedia-release-status__value"
					data-variant={status.effectivePublished ? "uncommon" : "accent"}
					title={status.effectiveStatusDetail ?? status.effectiveStatusLabel}
				>
					{status.effectiveStatusLabel}
				</span>
			</div>

			{canManage ? (
				<Panel
					backdropClosable={!submitting}
					loading={submitting}
					open={open}
					title={
						status.manualOverrideId ? (
							<Button
								disabled={submitting}
								variant="secondary"
								onClick={() => {
									void restoreInheritedPolicy();
								}}
							>
								Restore Policy
							</Button>
						) : null
					}
					width="50%"
					onClose={closePanel}
					showSave
					renderSave={() => (
						<Button
							disabled={submitting || !selectedReason}
							loading={submitting}
							variant={mode === "hide" ? "danger" : "primary"}
							onClick={() => {
								void saveOverride();
							}}
						>
							{actionLabel(mode)}
						</Button>
					)}
				>
					<div className="riseopedia-release-status-panel">
						{topError ? <AlertBanner tone="error">{topError}</AlertBanner> : null}

						<section className="riseopedia-release-status-panel__summary">
							<h3 className="riseopedia-release-status-panel__title">
								Current status
							</h3>
							<span
								className="riseopedia-state-toggle riseopedia-state-toggle--rarity riseopedia-release-status__value"
								data-variant={status.effectivePublished ? "uncommon" : "accent"}
							>
								{status.effectiveStatusLabel}
							</span>
							{status.effectiveStatusDetail ? (
								<p className="riseopedia-release-status-panel__detail">
									{status.effectiveStatusDetail}
								</p>
							) : null}
							{status.automaticBlockerEvidenceCode ? (
								<p className="riseopedia-release-status-panel__meta">
									Automatic blocker: {status.automaticBlockerEvidenceCode}
								</p>
							) : null}
							{status.automaticReleaseConfidenceScore !== null ? (
								<p className="riseopedia-release-status-panel__meta">
									Automatic score: {status.automaticReleaseConfidenceScore}
								</p>
							) : null}
						</section>

						{compatibleReasons.length > 1 ? (
							<label className="riseopedia-release-status-panel__field">
								<span className="riseopedia-release-status-panel__field-label">
									Reason
								</span>
								<DropdownMenuSingle
									ariaLabel="Release override reason"
									options={compatibleReasons.map((reason) => ({
										value: reason.overrideReasonCode,
										label: reason.overrideReasonName,
									}))}
									placeholder="Choose reason"
									value={reasonCode}
									onChange={setReasonCode}
								/>
							</label>
						) : null}

						{selectedReason?.noteRequired ? (
							<label className="riseopedia-release-status-panel__field">
								<span className="riseopedia-release-status-panel__field-label">
									Note (required)
								</span>
								<Textarea
									disabled={submitting}
									placeholder="Explain this release decision..."
									value={note}
									onChange={(event) => setNote(event.target.value)}
								/>
							</label>
						) : null}
					</div>
				</Panel>
			) : null}
		</>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
