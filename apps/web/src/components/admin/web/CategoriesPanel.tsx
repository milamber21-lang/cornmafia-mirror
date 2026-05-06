//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/CategoriesPanel.tsx                                                   ////
//// Language: TSX                                                                                                 ////
//// Category editor with rank-safe policy submission and dynamic effective summaries                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DropdownMenuSingle, ReadOnlyInput } from "@/components/ui";
import IconRender from "@/components/ui/IconRender";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	findRankByRoleId,
	findRoleIdByRank,
	formatPublicDefaultSummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";
import { slugifyLoose } from "@/lib/helpers/slug";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

type IconMedia = {
	id: string;
	url?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
};

type IconRef = {
	id: string;
	key?: string | null;
	label?: string | null;
	source?: "lucide" | "media" | null;
	lucideName?: string | null;
	iconMedia?: IconMedia | string | null;
};

type ColorRef = {
	id: string;
	key?: string | null;
	label?: string | null;
	preview?: string | null;
};

type TemplateRef = { id: string; key: string; label: string };

const CATEGORY_READ_POLICY_OPTIONS = sortAdminPickerOptions([
	{ value: "rank_equal", label: "Exact rank" },
	{ value: "rank_at_least", label: "Minimum rank" },
	{ value: "public", label: "Public" },
]);

const CATEGORY_WRITE_POLICY_OPTIONS = sortAdminPickerOptions([
	{ value: "rank_equal", label: "Exact rank" },
	{ value: "rank_at_least", label: "Minimum rank" },
]);

const CATEGORY_NAV_OPTIONS = sortAdminPickerOptions([
	{ value: "explicit_hidden", label: "Hidden" },
	{ value: "explicit_visible", label: "Visible" },
]);

export type CategoryItem = {
	id: string;
	title: string;
	slug: string;
	navHidden: boolean;
	readPolicy: "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	writePolicy: "rank_at_least" | "rank_equal";
	writeMinRank: number;
	iconKey: IconRef | null;
	iconColor: ColorRef | null;
	allowedTemplates: string[];
};

export interface CategoriesPanelProps {
	open: boolean;
	mode: Mode;
	row: CategoryItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function navModeLabel(mode: unknown): string {
	return mode === "explicit_hidden" ? "Hidden" : "Visible";
}

function buildIconLabel(icon: IconRef): string {
	const label = icon.label ?? icon.key ?? icon.id;
	return `${label}${icon.key ? ` (${icon.key})` : ""}`;
}

function buildColorLabel(color: ColorRef): string {
	const label = color.label ?? color.key ?? color.id;
	return `${label}${color.key ? ` (${color.key})` : ""}`;
}

export default function CategoriesPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: CategoriesPanelProps): React.JSX.Element | null {
	const [roles, setRoles] = useState<PolicyRoleRef[]>([]);
	const [icons, setIcons] = useState<IconRef[]>([]);
	const [colors, setColors] = useState<ColorRef[]>([]);
	const [templates, setTemplates] = useState<TemplateRef[]>([]);
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
				const response = await fetch("/api/admin/web/categories/meta", {
					cache: "no-store",
				});
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load category metadata."),
					);
				}

				const json = (await response.json()) as {
					roles?: PolicyRoleRef[];
					icons?: IconRef[];
					colors?: ColorRef[];
					templates?: TemplateRef[];
				};

				if (cancelled) {
					return;
				}

				setRoles(Array.isArray(json.roles) ? json.roles : []);
				setIcons(Array.isArray(json.icons) ? json.icons : []);
				setColors(Array.isArray(json.colors) ? json.colors : []);
				setTemplates(Array.isArray(json.templates) ? json.templates : []);
			} catch (error: unknown) {
				if (!cancelled) {
					setMetaError(
						error instanceof Error
							? error.message
							: "Failed to load category metadata.",
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

	const initialDefaults = useMemo<Values>(
		() => ({
			title: row?.title ?? "",
			slug: row?.slug ?? "",
			readPolicy: row?.readPolicy ?? "public",
			readRoleId: findRoleIdByRank(roles, row?.readMinRank ?? null),
			writePolicy: row?.writePolicy ?? "rank_at_least",
			writeRoleId: findRoleIdByRank(roles, row?.writeMinRank ?? null),
			navMode: row?.navHidden === true ? "explicit_hidden" : "explicit_visible",
			iconKeyId: row?.iconKey?.id ?? "",
			iconColorId: row?.iconColor?.id ?? "",
			allowedTemplates: Array.isArray(row?.allowedTemplates)
				? row.allowedTemplates
				: [],
			navEffectiveSummary: "",
		}),
		[roles, row],
	);

	const roleOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				roles.map((role) => ({
					value: role.id,
					label: `${role.name} (${role.rank})`,
				})),
			),
		[roles],
	);
	const iconOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				icons.map((icon) => ({
					value: icon.id,
					label: buildIconLabel(icon),
				})),
			),
		[icons],
	);
	const colorOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				colors.map((color) => ({
					value: color.id,
					label: buildColorLabel(color),
				})),
			),
		[colors],
	);
	const templateOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				templates.map((template) => ({
					value: template.id,
					label: template.label || template.key,
				})),
			),
		[templates],
	);

	const fields: FieldDef[] = useMemo(
		() => [
			{
				type: "text",
				name: "title",
				label: "Title",
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Title is required.",
			},
			{
				type: "text",
				name: "slug",
				label: "Slug",
				helpText: "Leave blank to generate from title.",
			},
			{
				type: "select-single",
				name: "readPolicy",
				label: "Read policy",
				options: CATEGORY_READ_POLICY_OPTIONS,
			},
			{
				type: "custom",
				name: "readRoleId",
				label: "Read value",
				render: ({ value, setValue, values, readOnly }) => {
					const readPolicy =
						values.readPolicy === "rank_equal"
							? "rank_equal"
							: values.readPolicy === "rank_at_least"
								? "rank_at_least"
								: "public";
					if (readPolicy === "public") {
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
					const readPolicy =
						values.readPolicy === "rank_equal"
							? "rank_equal"
							: values.readPolicy === "rank_at_least"
								? "rank_at_least"
								: "public";
					if (readPolicy === "public") {
						return undefined;
					}
					return String(value ?? "").trim().length > 0
						? undefined
						: "Read role is required.";
				},
			},
			{
				type: "select-single",
				name: "writePolicy",
				label: "Write policy",
				options: CATEGORY_WRITE_POLICY_OPTIONS,
			},
			{
				type: "select-single",
				name: "writeRoleId",
				label: "Write role",
				options: roleOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Write role is required.",
			},
			{
				type: "select-single",
				name: "navMode",
				label: "Navigation",
				options: CATEGORY_NAV_OPTIONS,
			},
			{
				type: "readonly",
				name: "navEffectiveSummary",
				label: "Effective navigation",
				format: (_value, values) => navModeLabel(values.navMode),
			},
			{
				type: "select-multi",
				name: "allowedTemplates",
				label: "Templates",
				options: templateOptions,
				helpText:
					templates.length === 0
						? "No templates exist yet, but selection is wired."
						: undefined,
			},
			{
				type: "select-single",
				name: "iconKeyId",
				label: "Icon",
				options: iconOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Icon is required.",
			},
			{
				type: "select-single",
				name: "iconColorId",
				label: "Icon color",
				options: colorOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Icon color is required.",
			},
			{
				type: "custom",
				name: "iconPreview",
				render: ({ values }) => {
					const selectedIconId = String(values.iconKeyId ?? "").trim();
					const selectedColorId = String(values.iconColorId ?? "").trim();
					const selectedIcon =
						icons.find((icon) => icon.id === selectedIconId) ?? row?.iconKey ?? null;
					const selectedColor =
						colors.find((color) => color.id === selectedColorId) ??
						row?.iconColor ??
						null;

					return (
						<div className="media-icon-preview-row">
							<div
								className="media-icon-preview-frame"
							>
								{selectedIcon && selectedColor ? (
									<IconRender
										iconKey={selectedIcon}
										iconColor={selectedColor}
										size={180}
										mediaRouteScope="admin"
									/>
								) : (
									<span className="media-icon-preview-empty">Choose icon and color</span>
								)}
							</div>
						</div>
					);
				},
			},
		],
		[
			colorOptions,
			colors,
			iconOptions,
			icons,
			roleOptions,
			roles,
			row?.iconColor,
			row?.iconKey,
			templateOptions,
			templates.length,
		],
	);

	const rows: RowDef[] = useMemo(
		() => [
			[
				{ field: "title", span: 6 },
				{ field: "slug", span: 6 },
			],
			[
				{ field: "readPolicy", span: 6 },
				{ field: "readRoleId", span: 6 },
			],
			[
				{ field: "writePolicy", span: 6 },
				{ field: "writeRoleId", span: 6 },
			],
			[
				{ field: "navMode", span: 6 },
				{ field: "navEffectiveSummary", span: 6 },
			],
			[{ field: "allowedTemplates", span: 12 }],
			[
				{ field: "iconKeyId", span: 6 },
				{ field: "iconColorId", span: 6 },
			],
			[{ field: "iconPreview", span: 12 }],
		],
		[],
	);

	const handleSubmit = useCallback(
		async (values: Values): Promise<void> => {
			try {
				setSubmitting(true);
				setTopError("");

				const readRoleId = String(values.readRoleId ?? "").trim();
				const writeRoleId = String(values.writeRoleId ?? "").trim();
				const readPolicy =
					values.readPolicy === "rank_equal"
						? "rank_equal"
						: values.readPolicy === "rank_at_least"
							? "rank_at_least"
							: "public";
				const writePolicy =
					values.writePolicy === "rank_equal" ? "rank_equal" : "rank_at_least";

				const body = {
					op: mode === "create" ? "create" : "update",
					id: row?.id,
					data: {
						title: String(values.title ?? "").trim(),
						slug:
							String(values.slug ?? "").trim() ||
							slugifyLoose(String(values.title ?? "")),
						navHidden: values.navMode === "explicit_hidden",
						readPolicy,
						readMinRank:
							readPolicy === "public"
								? null
								: findRankByRoleId(roles, readRoleId),
						writePolicy,
						writeMinRank: findRankByRoleId(roles, writeRoleId),
						iconKeyId: String(values.iconKeyId ?? "").trim(),
						iconColorId: String(values.iconColorId ?? "").trim(),
						allowedTemplates: Array.isArray(values.allowedTemplates)
							? values.allowedTemplates
							: [],
					},
				};

				const response = await fetch("/api/admin/web/categories", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to save category."),
					);
				}
			} catch (error: unknown) {
				const message =
					error instanceof Error ? error.message : "Failed to save category.";
				setTopError(message);
				throw new Error(message);
			} finally {
				setSubmitting(false);
			}
		},
		[mode, roles, row?.id],
	);

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
			title={mode === "create" ? "Create Category" : "Edit Category"}
			width="50%"
			showSave={!metaLoading && metaError.length === 0}
			mode={mode}
			defaultValues={initialDefaults}
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
			metaError={metaError}
		/>
	);
}
