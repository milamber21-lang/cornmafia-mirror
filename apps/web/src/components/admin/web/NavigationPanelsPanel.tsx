//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/NavigationPanelsPanel.tsx                                             ////
//// Language: TSX                                                                                                ////
//// Admin panel for creating and editing DB-first navigation panel definitions                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import {
	AlertBanner,
	DropdownMenuSingle,
	ReadOnlyInput,
} from "@/components/ui";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { NavigationPanelAdminItem } from "@/lib/data/navigation";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	findRankByRoleId,
	findRoleIdByRank,
	formatPublicDefaultSummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;
type NavigationPanelReadPolicyCode = "public" | "min_rank" | "equal_rank";

export interface NavigationPanelsPanelProps {
	open: boolean;
	mode: Mode;
	row?: NavigationPanelAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function validateCode(value: unknown, label: string): string | undefined {
	const code = String(value ?? "")
		.trim()
		.toLowerCase();

	if (!code) {
		return `${label} is required.`;
	}

	if (!/^[a-z0-9._-]{1,96}$/.test(code)) {
		return `${label} must use a-z, 0-9, dot, dash, or underscore.`;
	}

	return undefined;
}

function validateLabel(value: unknown): string | undefined {
	const label = String(value ?? "").trim();
	return label ? undefined : "Label is required.";
}

function validatePositiveInt(
	value: unknown,
	label: string,
): string | undefined {
	const raw = String(value ?? "").trim();
	if (!raw || !/^\d+$/.test(raw)) {
		return `${label} must be a positive integer.`;
	}

	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1
		? undefined
		: `${label} must be a positive integer.`;
}

function validateOptionalPositiveInt(
	value: unknown,
	label: string,
): string | undefined {
	const raw = String(value ?? "").trim();
	if (!raw) {
		return undefined;
	}

	if (!/^\d+$/.test(raw)) {
		return `${label} must be blank or a positive integer.`;
	}

	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 1
		? undefined
		: `${label} must be blank or a positive integer.`;
}

function normalizeReadPolicyCode(
	value: unknown,
): NavigationPanelReadPolicyCode {
	if (value === "equal_rank") {
		return "equal_rank";
	}

	if (value === "min_rank") {
		return "min_rank";
	}

	return "public";
}

function toOptionalNumber(value: unknown): number | null {
	const raw = String(value ?? "").trim();
	return raw ? Number(raw) : null;
}

function toRequiredNumber(value: unknown): number {
	return Number(String(value ?? "").trim());
}

function numberToFieldValue(value: number | null): string {
	return value === null ? "" : String(value);
}

export default function NavigationPanelsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: NavigationPanelsPanelProps): JSX.Element | null {
	const [roles, setRoles] = useState<PolicyRoleRef[]>([]);
	const [metaLoading, setMetaLoading] = useState(false);
	const [metaError, setMetaError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;

		async function run(): Promise<void> {
			try {
				setMetaLoading(true);
				setMetaError("");

				const response = await fetch("/api/admin/web/navigation-panels/meta", {
					cache: "no-store",
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to load navigation panel metadata.",
						),
					);
				}

				const json = (await response.json()) as { roles?: PolicyRoleRef[] };
				if (!cancelled) {
					setRoles(Array.isArray(json.roles) ? json.roles : []);
				}
			} catch (error: unknown) {
				if (!cancelled) {
					setMetaError(
						error instanceof Error
							? error.message
							: "Failed to load navigation panel metadata.",
					);
				}
			} finally {
				if (!cancelled) {
					setMetaLoading(false);
				}
			}
		}

		void run();
		return () => {
			cancelled = true;
		};
	}, [open]);

	const roleOptions = useMemo(
		() =>
			roles.map((role) => ({
				value: role.id,
				label: `${role.name} (${role.rank})`,
			})),
		[roles],
	);

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				panelKey: row.panelKey,
				label: row.label,
				panelTypeCode: row.panelTypeCode,
				panelSlotCode: row.panelSlotCode,
				readPolicyCode: row.isDefault ? "public" : row.readPolicyCode,
				readRoleId: row.isDefault ? "" : findRoleIdByRank(roles, row.readRank),
				enabled: row.enabled,
				isDefault: row.isDefault,
				selectionOrder: String(row.selectionOrder),
				maxCategories: numberToFieldValue(row.maxCategories),
				maxSubcategoriesPerCategory: numberToFieldValue(
					row.maxSubcategoriesPerCategory,
				),
				maxTargetsPerSubcategory: numberToFieldValue(row.maxTargetsPerSubcategory),
			};
		}

		return {
			panelKey: "",
			label: "",
			panelTypeCode: "header",
			panelSlotCode: "header_main",
			readPolicyCode: "public",
			readRoleId: "",
			enabled: true,
			isDefault: false,
			selectionOrder: "100",
			maxCategories: "4",
			maxSubcategoriesPerCategory: "4",
			maxTargetsPerSubcategory: "5",
		};
	}, [mode, roles, row]);

	const fields: FieldDef[] = useMemo(
		() => [
			{
				type: "custom",
				name: "metaStatus",
				render: () => {
					if (metaError) {
						return (
							<AlertBanner tone="error" autoHideMs={0}>
								{metaError}
							</AlertBanner>
						);
					}

					if (metaLoading) {
						return (
							<AlertBanner tone="info">
								Loading navigation panel metadata...
							</AlertBanner>
						);
					}

					return null;
				},
			},
			{
				type: "text",
				name: "panelKey",
				label: "Panel Key",
				placeholder: "e.g., header_main_default",
				readOnly: mode === "edit",
				validate: (value) => validateCode(value, "Panel key"),
			},
			{
				type: "text",
				name: "label",
				label: "Label",
				placeholder: "Admin-facing label",
				validate: validateLabel,
			},
			{
				type: "select-single",
				name: "panelTypeCode",
				label: "Panel Type",
				options: [
					{ value: "header", label: "Header" },
					{ value: "footer", label: "Footer" },
					{ value: "mobile", label: "Mobile" },
					{ value: "custom", label: "Custom" },
				],
			},
			{
				type: "text",
				name: "panelSlotCode",
				label: "Panel Slot Code",
				placeholder: "e.g., header_main",
				validate: (value) => validateCode(value, "Panel slot code"),
			},
			{
				type: "custom",
				name: "readPolicyCode",
				label: "Panel Read Policy",
				render: ({ value, setValue, values }) => {
					if (values.isDefault === true) {
						return <ReadOnlyInput value="Public (required for default panels)" />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={[
								{ value: "public", label: "Public" },
								{ value: "min_rank", label: "Minimum rank" },
								{ value: "equal_rank", label: "Exact rank" },
							]}
							value={normalizeReadPolicyCode(value)}
							onChange={setValue}
						/>
					);
				},
			},
			{
				type: "custom",
				name: "readRoleId",
				label: "Read Rank",
				render: ({ value, setValue, values, readOnly }) => {
					const readPolicyCode =
						values.isDefault === true
							? "public"
							: normalizeReadPolicyCode(values.readPolicyCode);
					if (readPolicyCode === "public") {
						return <ReadOnlyInput value={formatPublicDefaultSummary(roles)} />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={roleOptions}
							value={typeof value === "string" ? value : ""}
							onChange={setValue}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) => {
					const readPolicyCode =
						values.isDefault === true
							? "public"
							: normalizeReadPolicyCode(values.readPolicyCode);
					if (readPolicyCode === "public") {
						return undefined;
					}

					return String(value ?? "").trim().length > 0
						? undefined
						: "Read role is required.";
				},
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
			{
				type: "checkbox",
				name: "isDefault",
				label: "Default for slot",
			},
			{
				type: "text",
				name: "selectionOrder",
				label: "Selection Order",
				placeholder: "100",
				validate: (value) => validatePositiveInt(value, "Selection order"),
			},
			{
				type: "text",
				name: "maxCategories",
				label: "Max Categories",
				placeholder: "Optional",
				validate: (value) => validateOptionalPositiveInt(value, "Max categories"),
			},
			{
				type: "text",
				name: "maxSubcategoriesPerCategory",
				label: "Max Subcategories",
				placeholder: "Optional",
				validate: (value) =>
					validateOptionalPositiveInt(value, "Max subcategories"),
			},
			{
				type: "text",
				name: "maxTargetsPerSubcategory",
				label: "Max Targets",
				placeholder: "Optional",
				validate: (value) => validateOptionalPositiveInt(value, "Max targets"),
			},
		],
		[metaError, metaLoading, mode, roleOptions, roles],
	);

	const rows: RowDef[] = useMemo(() => {
		const formRows: RowDef[] = [
			[
				{ field: "panelKey", span: 6 },
				{ field: "label", span: 6 },
			],
			[
				{ field: "panelTypeCode", span: 6 },
				{ field: "panelSlotCode", span: 6 },
			],
			[
				{ field: "readPolicyCode", span: 6 },
				{ field: "readRoleId", span: 6 },
			],
			[
				{ field: "enabled", span: 4 },
				{ field: "isDefault", span: 4 },
				{ field: "selectionOrder", span: 4 },
			],
			[
				{ field: "maxCategories", span: 4 },
				{ field: "maxSubcategoriesPerCategory", span: 4 },
				{ field: "maxTargetsPerSubcategory", span: 4 },
			],
		];

		return metaError || metaLoading
			? [[{ field: "metaStatus", span: 12 }], ...formRows]
			: formRows;
	}, [metaError, metaLoading]);

	useEffect(() => {
		if (open) {
			setTopError("");
			setMetaError("");
		}
	}, [open]);

	async function handleSubmit(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			if (mode === "edit" && !row) {
				throw new Error("Navigation panel was not found.");
			}

			const isDefault = values.isDefault === true;
			const readPolicyCode = isDefault
				? "public"
				: normalizeReadPolicyCode(values.readPolicyCode);
			const readRoleId = isDefault ? "" : String(values.readRoleId ?? "").trim();
			const body =
				mode === "create"
					? {
							op: "create",
							data: {
								panelKey: String(values.panelKey ?? "").trim(),
								label: String(values.label ?? "").trim(),
								panelTypeCode: String(values.panelTypeCode ?? "header").trim(),
								panelSlotCode: String(values.panelSlotCode ?? "").trim(),
								isDefault,
								selectionOrder: toRequiredNumber(values.selectionOrder),
								readPolicyCode,
								readRank:
									readPolicyCode === "public"
										? null
										: findRankByRoleId(roles, readRoleId),
								maxCategories: toOptionalNumber(values.maxCategories),
								maxSubcategoriesPerCategory: toOptionalNumber(
									values.maxSubcategoriesPerCategory,
								),
								maxTargetsPerSubcategory: toOptionalNumber(
									values.maxTargetsPerSubcategory,
								),
								enabled: values.enabled === true,
							},
						}
					: {
							op: "update",
							id: row?.panelKey,
							data: {
								label: String(values.label ?? "").trim(),
								panelTypeCode: String(values.panelTypeCode ?? "header").trim(),
								panelSlotCode: String(values.panelSlotCode ?? "").trim(),
								isDefault,
								selectionOrder: toRequiredNumber(values.selectionOrder),
								readPolicyCode,
								readRank:
									readPolicyCode === "public"
										? null
										: findRankByRoleId(roles, readRoleId),
								maxCategories: toOptionalNumber(values.maxCategories),
								maxSubcategoriesPerCategory: toOptionalNumber(
									values.maxSubcategoriesPerCategory,
								),
								maxTargetsPerSubcategory: toOptionalNumber(
									values.maxTargetsPerSubcategory,
								),
								enabled: values.enabled === true,
							},
						};

			const response = await fetch("/api/admin/web/navigation-panels", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save navigation panel."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save navigation panel.";
			setTopError(message);
			throw new Error(message);
		} finally {
			setSubmitting(false);
		}
	}

	if (!open) {
		return null;
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				setMetaError("");
				onClose();
			}}
			title={
				mode === "create" ? "Create Navigation Panel" : "Edit Navigation Panel"
			}
			width="50%"
			showSave={!metaLoading && metaError.length === 0}
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
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
