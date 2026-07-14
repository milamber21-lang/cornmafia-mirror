//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/discord/DiscordUsersPanel.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Admin panel for viewing Discord user details and editing notes                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Textarea } from "@/components/ui";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";

type JsonRecord = Record<string, unknown>;
type Values = Record<string, unknown>;

export type DiscordUserItem = {
	id: string;
	discordId: string;
	username: string;
};

type RoleDoc = {
	roleId: string;
	name: string;
};

type LoadedDoc = {
	id: string;
	discordId: string;
	username: string;
	globalName: string | null;
	isMember: boolean;
	joinedDt: string | null;
	rolesSyncedDt: string | null;
	lastLoginAt: string | null;
	isRoleRefreshDue: boolean;
	notes: string;
	roles: RoleDoc[];
};

export interface DiscordUsersPanelProps {
	open: boolean;
	mode: "edit";
	user: DiscordUserItem | null;
	onClose: () => void;
	onSaved: () => void;
}

function isObject(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function mapLoadedDoc(value: unknown): LoadedDoc | null {
	if (!isObject(value)) {
		return null;
	}

	const id =
		typeof value.id === "string" || typeof value.id === "number"
			? String(value.id)
			: "";
	const discordId = typeof value.discordId === "string" ? value.discordId : "";
	const username = typeof value.username === "string" ? value.username : "";

	if (!id || !discordId || !username) {
		return null;
	}

	const roles = Array.isArray(value.roles)
		? value.roles
				.filter(isObject)
				.map((role) => ({
					roleId: typeof role.roleId === "string" ? role.roleId : "",
					name: typeof role.name === "string" ? role.name : "",
				}))
				.filter((role) => role.roleId.length > 0 || role.name.length > 0)
		: [];

	return {
		id,
		discordId,
		username,
		globalName: typeof value.globalName === "string" ? value.globalName : null,
		isMember: value.isMember === true,
		joinedDt: typeof value.joinedDt === "string" ? value.joinedDt : null,
		rolesSyncedDt:
			typeof value.rolesSyncedDt === "string" ? value.rolesSyncedDt : null,
		lastLoginAt: typeof value.lastLoginAt === "string" ? value.lastLoginAt : null,
		isRoleRefreshDue: value.isRoleRefreshDue === true,
		notes: typeof value.notes === "string" ? value.notes : "",
		roles,
	};
}

function prettyDate(value: unknown): string {
	if (typeof value !== "string" || !value) {
		return "—";
	}

	const dateValue = new Date(value);
	return Number.isNaN(dateValue.getTime()) ? value : dateValue.toLocaleString();
}

export default function DiscordUsersPanel({
	open,
	mode,
	user,
	onClose,
	onSaved,
}: DiscordUsersPanelProps): JSX.Element | null {
	const [loadedDoc, setLoadedDoc] = useState<LoadedDoc | null>(null);
	const [detailError, setDetailError] = useState("");
	const [saveError, setSaveError] = useState("");
	const [detailLoading, setDetailLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const topError = saveError || detailError;

	useEffect(() => {
		let cancelled = false;

		async function loadDoc(): Promise<void> {
			if (!open || !user?.id) {
				setLoadedDoc(null);
				setDetailError("");
				setSaveError("");
				setDetailLoading(false);
				return;
			}

			setLoadedDoc(null);
			setDetailLoading(true);
			setDetailError("");
			setSaveError("");

			try {
				const response = await fetch(
					`/api/admin/discord/users/${encodeURIComponent(user.id)}`,
					{
						cache: "no-store",
					},
				);
				const json = (await response.json().catch(() => null)) as unknown;

				if (!response.ok) {
					throw new Error(
						isObject(json) && typeof json.message === "string"
							? json.message
							: isObject(json) && typeof json.error === "string"
								? json.error
								: `Request failed (${response.status})`,
					);
				}

				const nextDoc = isObject(json) ? mapLoadedDoc(json.doc) : null;
				if (!nextDoc) {
					throw new Error("Failed to load user.");
				}

				if (!cancelled) {
					setLoadedDoc(nextDoc);
				}
			} catch (error: unknown) {
				if (!cancelled) {
					setLoadedDoc(null);
					setDetailError(
						error instanceof Error ? error.message : "Failed to load user.",
					);
				}
			} finally {
				if (!cancelled) {
					setDetailLoading(false);
				}
			}
		}

		void loadDoc();

		return () => {
			cancelled = true;
		};
	}, [open, user?.id]);

	const defaultValues = useMemo<Values>(() => {
		const rolesText =
			loadedDoc && loadedDoc.roles.length > 0
				? loadedDoc.roles.map((role) => role.name || role.roleId).join("\n")
				: "—";

		return {
			discordId: loadedDoc?.discordId ?? user?.discordId ?? "",
			username: loadedDoc?.username ?? user?.username ?? "",
			globalName: loadedDoc?.globalName ?? "",
			isMember: loadedDoc ? (loadedDoc.isMember ? "Yes" : "No") : "—",
			joinedDt: loadedDoc?.joinedDt ?? "",
			rolesSyncedDt: loadedDoc?.rolesSyncedDt ?? "",
			lastLoginAt: loadedDoc?.lastLoginAt ?? "",
			isRoleRefreshDue: loadedDoc
				? loadedDoc.isRoleRefreshDue
					? "Yes"
					: "No"
				: "—",
			rolesText,
			notes: loadedDoc?.notes ?? "",
		};
	}, [loadedDoc, user?.discordId, user?.username]);

	const fields = useMemo<FieldDef[]>(
		() => [
			{ type: "readonly", name: "discordId", label: "Discord ID" },
			{ type: "readonly", name: "username", label: "Username" },
			{ type: "readonly", name: "globalName", label: "Global name" },
			{ type: "readonly", name: "isMember", label: "Guild member" },
			{
				type: "readonly",
				name: "joinedDt",
				label: "Joined guild",
				format: prettyDate,
			},
			{
				type: "readonly",
				name: "rolesSyncedDt",
				label: "Roles synced",
				format: prettyDate,
			},
			{
				type: "readonly",
				name: "lastLoginAt",
				label: "Last login",
				format: prettyDate,
			},
			{ type: "readonly", name: "isRoleRefreshDue", label: "Role refresh due" },
			{
				type: "custom",
				name: "notes",
				label: "Notes",
				render: ({ value, setValue, readOnly }) => (
					<Textarea
						rows={5}
						uiSize="md"
						value={toStringValue(value)}
						onChange={(event) => setValue(event.target.value)}
						disabled={readOnly || detailLoading || detailError.trim().length > 0}
					/>
				),
				helpText:
					"Admin-local field. Discord identity and role membership remain system-owned.",
			},
			{
				type: "custom",
				name: "rolesText",
				label: "Cached roles",
				render: ({ value }) => (
					<Textarea
						rows={6}
						uiSize="md"
						className="form-control--mono"
						value={toStringValue(value)}
						readOnly
						disabled
					/>
				),
			},
		],
		[detailError, detailLoading],
	);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "discordId", span: 6 },
				{ field: "username", span: 6 },
			],
			[
				{ field: "globalName", span: 6 },
				{ field: "isMember", span: 6 },
			],
			[
				{ field: "joinedDt", span: 4 },
				{ field: "rolesSyncedDt", span: 4 },
				{ field: "lastLoginAt", span: 4 },
			],
			[{ field: "isRoleRefreshDue", span: 12 }],
			[{ field: "notes" }],
			[{ field: "rolesText" }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values) => {
			if (!user?.id) {
				throw new Error("Missing discord user id.");
			}

			setSaveError("");
			setSubmitting(true);

			try {
				const response = await fetch("/api/admin/discord/users", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						op: "update",
						id: user.id,
						data: {
							notes: toStringValue(values.notes),
						},
					}),
				});
				const json = (await response.json().catch(() => null)) as unknown;

				if (!response.ok) {
					throw new Error(
						isObject(json) && typeof json.message === "string"
							? json.message
							: isObject(json) && typeof json.error === "string"
								? json.error
								: `Request failed (${response.status})`,
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save notes.";
				setSaveError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[user?.id],
	);

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setLoadedDoc(null);
				setDetailError("");
				setSaveError("");
				onClose();
			}}
			title={mode === "edit" ? "Edit Discord User Notes" : "Discord User"}
			width="50%"
			showSave={!detailLoading && detailError.trim().length === 0}
			mode="edit"
			defaultValues={defaultValues}
			fields={fields}
			rows={rows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setSaveError("");
				onSaved();
				onClose();
			}}
			submitting={submitting || detailLoading}
			error={topError}
			dirtyGuard={true}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
