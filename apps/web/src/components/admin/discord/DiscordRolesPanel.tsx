//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/discord/DiscordRolesPanel.tsx                                             ////
//// Language: TSX                                                                                                 ////
//// Admin panel for creating and editing Discord role config with split meta and save error handling             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type Option,
	type RowDef,
} from "@/components/ui/PanelForm";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type JsonRecord = Record<string, unknown>;
type FormValues = Record<string, unknown>;

type RoleItem = {
	id: string;
	name: string;
	source: "discord" | "virtual";
	roleId: string | null;
	rank: number;
	colorHex: string | null;
	isAccessRole: boolean;
	fullEditorialAccess: boolean;
	isAdmin: boolean;
	isPublicDefault: boolean;
	isAuthenticatedDefault: boolean;
};

type GuildRole = {
	id: string;
	name: string;
	colorHex: string | null;
};

type RolesResponse = {
	rows?: unknown[];
};

export interface DiscordRolesPanelProps {
	open: boolean;
	mode: Mode;
	role: RoleItem | null;
	onClose: () => void;
	onSaved: () => void;
}

function isObject(value: unknown): value is JsonRecord {
	return typeof value === "object" && value !== null;
}

function isGuildRole(value: unknown): value is GuildRole {
	return (
		isObject(value) &&
		typeof value.id === "string" &&
		typeof value.name === "string" &&
		(typeof value.colorHex === "string" ||
			value.colorHex === null ||
			value.colorHex === undefined)
	);
}

function isRoleDoc(value: unknown): value is RoleItem {
	return (
		isObject(value) &&
		typeof value.id === "string" &&
		typeof value.name === "string"
	);
}

function toHexOrEmpty(value: string | null | undefined): string {
	return typeof value === "string" ? value : "";
}

async function fetchGuildRoles(): Promise<GuildRole[]> {
	const response = await fetch("/api/admin/discord/guild-roles", {
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error(
			await readResponseMessage(response, "Failed to load guild roles."),
		);
	}

	const json = (await response.json()) as unknown;
	const rows = isObject(json) && Array.isArray(json.rows) ? json.rows : [];
	return rows.filter(isGuildRole);
}

async function fetchConfiguredRoleState(currentRole: RoleItem | null): Promise<{
	usedDiscordRoleIds: Set<string>;
	usedVirtualRoleNames: Set<string>;
	publicDefaultRoleId: string | null;
	authenticatedDefaultRoleId: string | null;
}> {
	const response = await fetch("/api/admin/discord/roles?page=1&pageSize=1000", {
		method: "GET",
		cache: "no-store",
	});
	if (!response.ok) {
		throw new Error(
			await readResponseMessage(response, "Failed to load configured roles."),
		);
	}

	const json = (await response.json()) as unknown;
	const payload = (isObject(json) ? json : {}) as RolesResponse;
	const rows = Array.isArray(payload.rows) ? payload.rows.filter(isRoleDoc) : [];

	const usedDiscordRoleIds = new Set<string>();
	const usedVirtualRoleNames = new Set<string>();
	let publicDefaultRoleId: string | null = null;
	let authenticatedDefaultRoleId: string | null = null;

	for (const configuredRole of rows) {
		if (configuredRole.source === "discord" && configuredRole.roleId) {
			if (currentRole?.roleId !== configuredRole.roleId) {
				usedDiscordRoleIds.add(configuredRole.roleId);
			}
		}

		if (
			configuredRole.source === "virtual" &&
			configuredRole.id !== currentRole?.id &&
			configuredRole.name.trim().length > 0
		) {
			usedVirtualRoleNames.add(configuredRole.name.trim());
		}

		if (configuredRole.isPublicDefault) {
			publicDefaultRoleId = configuredRole.id;
		}
		if (configuredRole.isAuthenticatedDefault) {
			authenticatedDefaultRoleId = configuredRole.id;
		}
	}

	return {
		usedDiscordRoleIds,
		usedVirtualRoleNames,
		publicDefaultRoleId,
		authenticatedDefaultRoleId,
	};
}

export default function DiscordRolesPanel({
	open,
	mode,
	role,
	onClose,
	onSaved,
}: DiscordRolesPanelProps): React.JSX.Element | null {
	const editing = mode === "edit";
	const [guildRoles, setGuildRoles] = useState<GuildRole[]>([]);
	const [usedDiscordRoleIds, setUsedDiscordRoleIds] = useState<Set<string>>(
		new Set(),
	);
	const [usedVirtualRoleNames, setUsedVirtualRoleNames] = useState<Set<string>>(
		new Set(),
	);
	const [publicDefaultRoleId, setPublicDefaultRoleId] = useState<string | null>(
		null,
	);
	const [authenticatedDefaultRoleId, setAuthenticatedDefaultRoleId] = useState<
		string | null
	>(null);
	const [metaLoading, setMetaLoading] = useState(false);
	const [metaError, setMetaError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [saveError, setSaveError] = useState("");

	useEffect(() => {
		if (!open) {
			return;
		}

		let active = true;

		async function loadMeta(): Promise<void> {
			setGuildRoles([]);
			setUsedDiscordRoleIds(new Set());
			setUsedVirtualRoleNames(new Set());
			setPublicDefaultRoleId(null);
			setAuthenticatedDefaultRoleId(null);
			setMetaLoading(true);
			setMetaError("");
			setSaveError("");

			try {
				const [nextGuildRoles, configuredState] = await Promise.all([
					fetchGuildRoles(),
					fetchConfiguredRoleState(editing ? role : null),
				]);

				if (!active) {
					return;
				}

				setGuildRoles(nextGuildRoles);
				setUsedDiscordRoleIds(configuredState.usedDiscordRoleIds);
				setUsedVirtualRoleNames(configuredState.usedVirtualRoleNames);
				setPublicDefaultRoleId(configuredState.publicDefaultRoleId);
				setAuthenticatedDefaultRoleId(configuredState.authenticatedDefaultRoleId);
			} catch (error: unknown) {
				if (active) {
					setMetaError(
						error instanceof Error ? error.message : "Failed to load role metadata.",
					);
				}
			} finally {
				if (active) {
					setMetaLoading(false);
				}
			}
		}

		void loadMeta();

		return () => {
			active = false;
		};
	}, [editing, open, role]);

	const defaultValues = useMemo<FormValues>(() => {
		if (editing && role) {
			return {
				source: role.source,
				name: role.name,
				nameDisplay: role.name,
				roleId: role.roleId ?? "",
				rank: role.rank,
				colorHex: toHexOrEmpty(role.colorHex),
				isAccessRole: role.isAccessRole,
				fullEditorialAccess: role.fullEditorialAccess,
				isAdmin: role.isAdmin,
				isPublicDefault: role.isPublicDefault,
				isAuthenticatedDefault: role.isAuthenticatedDefault,
			};
		}

		return {
			source: "discord" as const,
			name: "",
			nameDisplay: "",
			roleId: "",
			rank: 0,
			colorHex: "",
			isAccessRole: false,
			fullEditorialAccess: false,
			isAdmin: false,
			isPublicDefault: false,
			isAuthenticatedDefault: false,
		};
	}, [editing, role]);

	const discordOptions: Option[] = useMemo(() => {
		if (metaLoading) {
			return [{ value: "", label: "Loading..." }];
		}
		if (metaError) {
			return [{ value: "", label: "Failed to load roles" }];
		}

		const availableRoles = guildRoles.filter(
			(guildRole) =>
				guildRole.id === role?.roleId || !usedDiscordRoleIds.has(guildRole.id),
		);
		if (availableRoles.length === 0) {
			return [{ value: "", label: "No roles available" }];
		}

		return availableRoles.map((guildRole) => ({
			value: guildRole.id,
			label: guildRole.name,
		}));
	}, [guildRoles, metaError, metaLoading, role?.roleId, usedDiscordRoleIds]);

	const findGuildRole = useCallback(
		(value: unknown): GuildRole | null => {
			const roleId = typeof value === "string" ? value : "";
			return roleId
				? (guildRoles.find((guildRole) => guildRole.id === roleId) ?? null)
				: null;
		},
		[guildRoles],
	);

	const fields = useMemo<FieldDef[]>(
		() => [
			{
				type: "select-single",
				name: "source",
				label: "Source",
				options: [
					{ label: "Discord", value: "discord" },
					{ label: "Virtual (no Discord role)", value: "virtual" },
				],
				isDisabled: () => editing,
			},
			{
				type: "select-single",
				name: "roleId",
				label: "Discord Role",
				options: () => discordOptions,
				visible: (values) => values.source === "discord",
				isDisabled: () => editing || metaLoading || metaError.length > 0,
				validate: (value, values) => {
					if (values.source !== "discord") {
						return undefined;
					}
					return typeof value === "string" && value.trim().length > 0
						? undefined
						: "Discord Role is required.";
				},
			},
			{
				type: "text",
				name: "name",
				label: "Name",
				visible: (values) => values.source === "virtual" && !editing,
				validate: (value, values) => {
					if (values.source !== "virtual") {
						return undefined;
					}
					const normalizedName = typeof value === "string" ? value.trim() : "";
					if (!normalizedName) {
						return "Name is required.";
					}
					return usedVirtualRoleNames.has(normalizedName)
						? "A virtual role with this name already exists."
						: undefined;
				},
			},
			{
				type: "readonly",
				name: "nameDisplay",
				label: "Name",
				visible: (values) => editing || values.source === "discord",
				format: (_value, values) => {
					if (editing && role) {
						return role.name;
					}
					return findGuildRole(values.roleId)?.name ?? "-";
				},
			},
			{ type: "text", name: "rank", label: "Rank", placeholder: "Number" },
			{
				type: "text",
				name: "colorHex",
				label: "Color Hex",
				placeholder: "#RRGGBB",
			},
			{
				type: "checkbox",
				name: "isAccessRole",
				label: "Participates in access system",
			},
			{
				type: "checkbox",
				name: "fullEditorialAccess",
				label: "Full editorial access",
			},
			{ type: "checkbox", name: "isAdmin", label: "Admin access" },
			{
				type: "checkbox",
				name: "isPublicDefault",
				label: "Public default",
				visible: () =>
					(!editing && publicDefaultRoleId === null) ||
					(editing &&
						(!!role?.isPublicDefault ||
							publicDefaultRoleId === null ||
							publicDefaultRoleId === role?.id)),
			},
			{
				type: "checkbox",
				name: "isAuthenticatedDefault",
				label: "Authenticated default",
				visible: () =>
					(!editing && authenticatedDefaultRoleId === null) ||
					(editing &&
						(!!role?.isAuthenticatedDefault ||
							authenticatedDefaultRoleId === null ||
							authenticatedDefaultRoleId === role?.id)),
			},
		],
		[
			authenticatedDefaultRoleId,
			discordOptions,
			editing,
			findGuildRole,
			metaError,
			metaLoading,
			publicDefaultRoleId,
			role,
			usedVirtualRoleNames,
		],
	);

	const rows = useMemo<RowDef[]>(
		() => [
			[
				{ field: "source", span: 6 },
				{ field: "roleId", span: 6 },
			],
			[{ field: "name", span: 12 }],
			[{ field: "nameDisplay", span: 12 }],
			[
				{ field: "rank", span: 6 },
				{ field: "colorHex", span: 6 },
			],
			[{ field: "isAccessRole", span: 12 }],
			[
				{ field: "fullEditorialAccess", span: 6 },
				{ field: "isAdmin", span: 6 },
			],
			[
				{ field: "isPublicDefault", span: 6 },
				{ field: "isAuthenticatedDefault", span: 6 },
			],
		],
		[],
	);

	const onSubmit = useCallback(
		async (values: Record<string, unknown>) => {
			setSaveError("");
			setSubmitting(true);

			try {
				if (metaLoading) {
					throw new Error("Role metadata is still loading.");
				}

				if (metaError.length > 0) {
					throw new Error(metaError);
				}

				const source = values.source === "virtual" ? "virtual" : "discord";
				const selectedGuildRole = findGuildRole(values.roleId);
				const finalName =
					source === "discord"
						? (selectedGuildRole?.name ?? "")
						: typeof values.name === "string"
							? values.name.trim()
							: "";
				if (!finalName) {
					throw new Error(
						source === "discord"
							? "Please select a Discord role."
							: "Name is required.",
					);
				}

				if (source === "virtual" && usedVirtualRoleNames.has(finalName)) {
					throw new Error("A virtual role with this name already exists.");
				}

				const requestBody: Record<string, unknown> = {
					op: editing ? "update" : "create",
					...(editing ? { id: role?.id } : {}),
					data: {
						source,
						name: finalName,
						roleId:
							source === "discord"
								? typeof values.roleId === "string"
									? values.roleId
									: ""
								: null,
						rank:
							typeof values.rank === "number"
								? values.rank
								: Number(typeof values.rank === "string" ? values.rank : 0),
						colorHex:
							typeof values.colorHex === "string" && values.colorHex.trim()
								? values.colorHex.trim()
								: source === "discord"
									? (selectedGuildRole?.colorHex ?? null)
									: null,
						isAccessRole: values.isAccessRole === true,
						fullEditorialAccess: values.fullEditorialAccess === true,
						isAdmin: values.isAdmin === true,
						isPublicDefault: values.isPublicDefault === true,
						isAuthenticatedDefault: values.isAuthenticatedDefault === true,
					},
				};

				const response = await fetch("/api/admin/discord/roles", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(requestBody),
				});
				if (!response.ok) {
					throw new Error(await readResponseMessage(response, "Save failed."));
				}
			} catch (errorValue: unknown) {
				const message =
					errorValue instanceof Error ? errorValue.message : "Save failed.";
				setSaveError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[
			editing,
			findGuildRole,
			metaError,
			metaLoading,
			role?.id,
			usedVirtualRoleNames,
		],
	);

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setSaveError("");
				setMetaError("");
				setGuildRoles([]);
				setUsedDiscordRoleIds(new Set());
				setUsedVirtualRoleNames(new Set());
				setPublicDefaultRoleId(null);
				setAuthenticatedDefaultRoleId(null);
				onClose();
			}}
			title={editing ? "Edit Role" : "Create Role"}
			mode={editing ? "edit" : "create"}
			defaultValues={defaultValues}
			fields={fields}
			rows={rows}
			onSubmit={onSubmit}
			onSaved={() => {
				setSaveError("");
				onSaved();
				onClose();
			}}
			showSave={!metaLoading && metaError.length === 0}
			submitting={submitting}
			error={saveError}
			metaError={metaError}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
