//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/SubcategoriesPanel.tsx                                                ////
//// Language: TSX                                                                                                 ////
//// Subcategory editor with row-aligned props, shared error parsing, and inherited policy summaries               ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import { DropdownMenuSingle, ReadOnlyInput } from "@/components/ui";
import IconRender from "@/components/ui/IconRender";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { SubcategoryAdminItem } from "@/lib/data/subcategories";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";
import { slugifyLoose } from "@/lib/helpers/slug";
import {
	findRankByRoleId,
	findRoleIdByRank,
	formatPublicDefaultSummary,
	formatRankPolicySummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";

type Values = Record<string, unknown>;
type Mode = "create" | "edit";

type CategoryMeta = {
	id: string;
	title: string;
	slug: string;
	readPolicy: "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	writePolicy: "rank_at_least" | "rank_equal";
	writeMinRank: number;
	navHidden: boolean;
	allowedTemplates: string[];
};

type IconMediaMeta = {
	id: string;
	url?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
} | null;

type IconMeta = {
	id: string;
	key: string | null;
	label: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
	iconMedia: IconMediaMeta;
};

type ColorTokenMeta = {
	id: string;
	key: string | null;
	label: string | null;
	preview: string | null;
};

type TemplateRef = {
	id: string;
	key: string;
	label: string;
};

type MetaPayload = {
	roles?: PolicyRoleRef[];
	categories?: CategoryMeta[];
	icons?: IconMeta[];
	colors?: ColorTokenMeta[];
	templates?: TemplateRef[];
};

const SUBCATEGORY_READ_POLICY_OPTIONS = sortAdminPickerOptions([
	{ value: "rank_equal", label: "Exact rank" },
	{ value: "inherit", label: "Inherit" },
	{ value: "rank_at_least", label: "Minimum rank" },
	{ value: "public", label: "Public" },
]);

const SUBCATEGORY_WRITE_POLICY_OPTIONS = sortAdminPickerOptions([
	{ value: "rank_equal", label: "Exact rank" },
	{ value: "inherit", label: "Inherit" },
	{ value: "rank_at_least", label: "Minimum rank" },
]);

const SUBCATEGORY_NAV_OPTIONS = sortAdminPickerOptions([
	{ value: "explicit_hidden", label: "Hidden" },
	{ value: "inherit", label: "Inherit" },
	{ value: "explicit_visible", label: "Visible" },
]);

export type SubcategoriesPanelRow = SubcategoryAdminItem;

export interface SubcategoriesPanelProps {
	open: boolean;
	mode: Mode;
	row: SubcategoriesPanelRow | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function navSummary(mode: unknown, category: CategoryMeta | null): string {
	if (mode === "inherit") {
		return category?.navHidden === true ? "Hidden" : "Visible";
	}

	return mode === "explicit_hidden" ? "Hidden" : "Visible";
}

function findCategory(
	categories: CategoryMeta[],
	categoryId: unknown,
): CategoryMeta | null {
	const normalizedCategoryId = typeof categoryId === "string" ? categoryId : "";
	return (
		categories.find((category) => category.id === normalizedCategoryId) ?? null
	);
}

function readSummary(
	values: Values,
	categories: CategoryMeta[],
	roles: PolicyRoleRef[],
): string {
	const readPolicy =
		values.readPolicy === "inherit"
			? "inherit"
			: values.readPolicy === "rank_equal"
				? "rank_equal"
				: values.readPolicy === "rank_at_least"
					? "rank_at_least"
					: "public";

	if (readPolicy === "public") {
		return formatPublicDefaultSummary(roles);
	}

	if (readPolicy === "inherit") {
		const currentCategory = findCategory(categories, values.categoryId);
		if (!currentCategory) {
			return formatPublicDefaultSummary(roles);
		}

		if (currentCategory.readPolicy === "public") {
			return formatPublicDefaultSummary(roles);
		}

		return formatRankPolicySummary(
			currentCategory.readPolicy,
			currentCategory.readMinRank,
			roles,
		);
	}

	return formatRankPolicySummary(
		readPolicy,
		findRankByRoleId(roles, String(values.readRoleId ?? "")),
		roles,
	);
}

function writeSummary(
	values: Values,
	categories: CategoryMeta[],
	roles: PolicyRoleRef[],
): string {
	const writePolicy =
		values.writePolicy === "inherit"
			? "inherit"
			: values.writePolicy === "rank_equal"
				? "rank_equal"
				: "rank_at_least";

	if (writePolicy === "inherit") {
		const currentCategory = findCategory(categories, values.categoryId);
		if (!currentCategory) {
			return "Inherited from category";
		}

		return formatRankPolicySummary(
			currentCategory.writePolicy,
			currentCategory.writeMinRank,
			roles,
		);
	}

	return formatRankPolicySummary(
		writePolicy,
		findRankByRoleId(roles, String(values.writeRoleId ?? "")),
		roles,
	);
}

function buildIconLabel(icon: IconMeta): string {
	const label = icon.label ?? icon.key ?? icon.id;
	return `${label}${icon.key ? ` (${icon.key})` : ""}`;
}

function buildColorLabel(color: ColorTokenMeta): string {
	const label = color.label ?? color.key ?? color.id;
	return `${label}${color.key ? ` (${color.key})` : ""}`;
}

export default function SubcategoriesPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: SubcategoriesPanelProps): React.JSX.Element | null {
	const [submitting, setSubmitting] = React.useState(false);
	const [topError, setTopError] = React.useState("");
	const [metaLoading, setMetaLoading] = React.useState(false);
	const [metaError, setMetaError] = React.useState("");
	const [roles, setRoles] = React.useState<PolicyRoleRef[]>([]);
	const [categories, setCategories] = React.useState<CategoryMeta[]>([]);
	const [icons, setIcons] = React.useState<IconMeta[]>([]);
	const [colors, setColors] = React.useState<ColorTokenMeta[]>([]);
	const [templates, setTemplates] = React.useState<TemplateRef[]>([]);

	React.useEffect(() => {
		if (!open) {
			return;
		}

		let active = true;

		async function loadMeta(): Promise<void> {
			setMetaLoading(true);
			setMetaError("");

			try {
				const response = await fetch("/api/admin/web/subcategories/meta", {
					cache: "no-store",
					credentials: "include",
				});

				if (!response.ok) {
					throw new Error(
						await readResponseMessage(
							response,
							"Failed to load subcategory metadata.",
						),
					);
				}

				const payload = (await response.json()) as MetaPayload;
				if (!active) {
					return;
				}

				setRoles(Array.isArray(payload.roles) ? payload.roles : []);
				setCategories(Array.isArray(payload.categories) ? payload.categories : []);
				setIcons(Array.isArray(payload.icons) ? payload.icons : []);
				setColors(Array.isArray(payload.colors) ? payload.colors : []);
				setTemplates(Array.isArray(payload.templates) ? payload.templates : []);
			} catch (errorValue: unknown) {
				if (active) {
					setMetaError(
						errorValue instanceof Error
							? errorValue.message
							: "Failed to load subcategory metadata.",
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
	}, [open]);

	React.useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [open]);

	const defaultValues = React.useMemo<Values>(
		() => ({
			title: row?.title ?? "",
			slug: row?.slug ?? "",
			categoryId: row?.category.id ?? "",
			readPolicy: row?.readPolicy ?? "inherit",
			readRoleId: findRoleIdByRank(roles, row?.readMinRank),
			writePolicy: row?.writePolicy ?? "inherit",
			writeRoleId: findRoleIdByRank(roles, row?.writeMinRank),
			navMode: row?.navHiddenMode ?? "inherit",
			iconKeyId: row?.iconKey?.id ?? "",
			iconColorId: row?.iconColor?.id ?? "",
			allowedTemplates: Array.isArray(row?.allowedTemplates)
				? row.allowedTemplates
				: [],
			navEffectiveSummary: "",
		}),
		[roles, row],
	);

	const categoryOptions = React.useMemo(
		() =>
			sortAdminPickerOptions(
				categories.map((category) => ({
					value: category.id,
					label: category.title || category.slug || category.id,
				})),
			),
		[categories],
	);
	const roleOptions = React.useMemo(
		() =>
			sortAdminPickerOptions(
				roles.map((role) => ({
					value: role.id,
					label: `${role.name} (${role.rank})`,
				})),
			),
		[roles],
	);
	const iconOptions = React.useMemo(
		() =>
			sortAdminPickerOptions(
				icons.map((icon) => ({
					value: icon.id,
					label: buildIconLabel(icon),
				})),
			),
		[icons],
	);
	const colorOptions = React.useMemo(
		() =>
			sortAdminPickerOptions(
				colors.map((color) => ({
					value: color.id,
					label: buildColorLabel(color),
				})),
			),
		[colors],
	);
	const templateOptions = React.useMemo(
		() =>
			sortAdminPickerOptions(
				templates.map((template) => ({
					value: template.id,
					label: template.label || template.key,
				})),
			),
		[templates],
	);

	const fields: FieldDef[] = React.useMemo(
		() => [
			{
				type: "text",
				name: "title",
				label: "Title",
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Title is required.",
			},
			{
				type: "text",
				name: "slug",
				label: "Slug",
				helpText: "Leave blank to generate from title.",
			},
			{
				type: "select-single",
				name: "categoryId",
				label: "Category",
				options: categoryOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Category is required.",
			},
			{
				type: "select-single",
				name: "readPolicy",
				label: "Read policy",
				options: SUBCATEGORY_READ_POLICY_OPTIONS,
			},
			{
				type: "custom",
				name: "readRoleId",
				label: "Read value",
				render: ({ value, setValue, values, readOnly }) => {
					if (values.readPolicy === "inherit" || values.readPolicy === "public") {
						return <ReadOnlyInput value={readSummary(values, categories, roles)} />;
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
					if (values.readPolicy === "inherit" || values.readPolicy === "public") {
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
				options: SUBCATEGORY_WRITE_POLICY_OPTIONS,
			},
			{
				type: "custom",
				name: "writeRoleId",
				label: "Write value",
				render: ({ value, setValue, values, readOnly }) => {
					if (values.writePolicy === "inherit") {
						return <ReadOnlyInput value={writeSummary(values, categories, roles)} />;
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
					if (values.writePolicy === "inherit") {
						return undefined;
					}
					return String(value ?? "").trim().length > 0
						? undefined
						: "Write role is required.";
				},
			},
			{
				type: "select-single",
				name: "navMode",
				label: "Navigation",
				options: SUBCATEGORY_NAV_OPTIONS,
			},
			{
				type: "readonly",
				name: "navEffectiveSummary",
				label: "Effective navigation",
				format: (_value, values) =>
					navSummary(values.navMode, findCategory(categories, values.categoryId)),
			},
			{
				type: "select-multi",
				name: "allowedTemplates",
				label: "Templates",
				options: templateOptions,
			},
			{
				type: "select-single",
				name: "iconKeyId",
				label: "Icon",
				options: iconOptions,
				validate: (value) =>
					String(value ?? "").trim().length > 0 ? undefined : "Icon is required.",
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
							<div className="media-icon-preview-frame">
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
			categories,
			categoryOptions,
			colorOptions,
			colors,
			iconOptions,
			icons,
			roleOptions,
			roles,
			row?.iconColor,
			row?.iconKey,
			templateOptions,
		],
	);

	const rows: RowDef[] = React.useMemo(
		() => [
			[
				{ field: "title", span: 6 },
				{ field: "slug", span: 6 },
			],
			[{ field: "categoryId", span: 12 }],
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

	async function handleSubmit(values: Values): Promise<void> {
		try {
			setSubmitting(true);
			setTopError("");

			const readPolicy =
				values.readPolicy === "inherit"
					? "inherit"
					: values.readPolicy === "public"
						? "public"
						: values.readPolicy === "rank_equal"
							? "rank_equal"
							: "rank_at_least";

			const writePolicy =
				values.writePolicy === "inherit"
					? "inherit"
					: values.writePolicy === "rank_equal"
						? "rank_equal"
						: "rank_at_least";

			const body = {
				op: mode === "create" ? "create" : "update",
				id: row?.id,
				data: {
					categoryId: String(values.categoryId ?? "").trim(),
					title: String(values.title ?? "").trim(),
					slug:
						String(values.slug ?? "").trim() ||
						slugifyLoose(String(values.title ?? "")),
					readPolicy,
					readMinRank:
						readPolicy === "inherit" || readPolicy === "public"
							? null
							: findRankByRoleId(roles, String(values.readRoleId ?? "")),
					writePolicy,
					writeMinRank:
						writePolicy === "inherit"
							? null
							: findRankByRoleId(roles, String(values.writeRoleId ?? "")),
					navMode: values.navMode,
					iconKeyId: String(values.iconKeyId ?? "").trim(),
					iconColorId: String(values.iconColorId ?? "").trim(),
					allowedTemplates: Array.isArray(values.allowedTemplates)
						? values.allowedTemplates
						: [],
				},
			};

			const response = await fetch("/api/admin/web/subcategories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save subcategory."),
				);
			}
		} catch (errorValue: unknown) {
			const message =
				errorValue instanceof Error
					? errorValue.message
					: "Failed to save subcategory.";
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
			title={mode === "create" ? "Create Subcategory" : "Edit Subcategory"}
			width="50%"
			showSave={!metaLoading && metaError.length === 0}
			mode={mode}
			defaultValues={defaultValues}
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

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
