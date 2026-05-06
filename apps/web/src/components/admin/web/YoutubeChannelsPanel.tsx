//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/YoutubeChannelsPanel.tsx                                            ////
//// Language: TSX                                                                                              ////
//// Admin panel for creating and editing YouTube channel allowlist rows                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { YoutubeChannelAdminItem } from "@/lib/data/youtube-channels";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

export interface YoutubeChannelsPanelProps {
	open: boolean;
	mode: Mode;
	row?: YoutubeChannelAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const CHANNEL_HANDLE_PATTERN = /^@[A-Za-z0-9._-]{3,64}$/;

function normalizeHandleInput(value: unknown): string {
	const normalized = String(value ?? "").trim();
	if (!normalized) {
		return "";
	}

	return normalized.startsWith("@") ? normalized : `@${normalized}`;
}

function validateChannelUrl(value: unknown): string | undefined {
	const normalized = String(value ?? "").trim();
	if (!normalized) {
		return undefined;
	}

	try {
		const url = new URL(normalized);
		return url.protocol === "https:" ? undefined : "Use a valid https URL.";
	} catch {
		return "Use a valid https URL.";
	}
}

export default function YoutubeChannelsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: YoutubeChannelsPanelProps): JSX.Element {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				channelExternalId: row.channelExternalId,
				channelHandle: row.channelHandle ?? "",
				channelTitle: row.channelTitle,
				channelUrl: row.channelUrl ?? "",
				comment: row.comment ?? "",
				enabled: row.enabled,
			};
		}

		return {
			channelExternalId: "",
			channelHandle: "",
			channelTitle: "",
			channelUrl: "",
			comment: "",
			enabled: true,
		};
	}, [mode, row]);

	const fields: FieldDef[] = useMemo(
		() => [
			{
				type: "text",
				name: "channelExternalId",
				label: "Channel ID",
				placeholder: "UC...",
				readOnly: mode === "edit",
				validate: (value) => {
					if (mode === "edit") {
						return undefined;
					}

					const channelExternalId = String(value ?? "").trim();
					if (!channelExternalId) {
						return "Channel ID is required.";
					}

					return CHANNEL_ID_PATTERN.test(channelExternalId)
						? undefined
						: "Use a stable YouTube UC... channel ID.";
				},
			},
			{
				type: "text",
				name: "channelHandle",
				label: "Handle",
				placeholder: "@CornMafiaGuild",
				validate: (value) => {
					const channelHandle = normalizeHandleInput(value);
					if (!channelHandle) {
						return undefined;
					}

					return CHANNEL_HANDLE_PATTERN.test(channelHandle)
						? undefined
						: "Use @ plus 3-64 letters, numbers, dots, dashes, or underscores.";
				},
			},
			{
				type: "text",
				name: "channelTitle",
				label: "Title",
				placeholder: "Corn Mafia Guild",
				validate: (value) => {
					const title = String(value ?? "").trim();
					return title ? undefined : "Title is required.";
				},
			},
			{
				type: "text",
				name: "channelUrl",
				label: "Channel URL",
				placeholder: "https://www.youtube.com/channel/UC...",
				validate: validateChannelUrl,
			},
			{
				type: "textarea",
				name: "comment",
				label: "Comment",
				placeholder: "Optional admin note",
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
		],
		[mode],
	);

	const rows: RowDef[] = useMemo(
		() => [
			[{ field: "channelExternalId" }],
			[
				{ field: "channelHandle", span: 6 },
				{ field: "channelTitle", span: 6 },
			],
			[{ field: "channelUrl" }],
			[{ field: "comment" }],
			[{ field: "enabled" }],
		],
		[],
	);

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [open]);

	async function handleSubmit(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			if (mode === "edit" && !row) {
				throw new Error("YouTube channel was not found.");
			}

			const body =
				mode === "create"
					? {
							op: "create",
							data: {
								channelExternalId: String(values.channelExternalId ?? "").trim(),
								channelHandle: normalizeHandleInput(values.channelHandle),
								channelTitle: String(values.channelTitle ?? "").trim(),
								channelUrl: String(values.channelUrl ?? "").trim(),
								comment: String(values.comment ?? "").trim(),
								enabled: Boolean(values.enabled),
							},
						}
					: {
							op: "update",
							id: row?.id,
							data: {
								channelHandle: normalizeHandleInput(values.channelHandle),
								channelTitle: String(values.channelTitle ?? "").trim(),
								channelUrl: String(values.channelUrl ?? "").trim(),
								comment: String(values.comment ?? "").trim(),
								enabled: Boolean(values.enabled),
							},
						};

			const response = await fetch("/api/admin/web/youtube-channels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save YouTube channel."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save YouTube channel.";
			setTopError(message);
			throw new Error(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				onClose();
			}}
			title={mode === "create" ? "Add YouTube Channel" : "Edit YouTube Channel"}
			width="50%"
			showSave
			mode={mode}
			defaultValues={defaults}
			fields={fields}
			rows={rows}
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
