//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/SeriesPanel.tsx                                                       ////
//// Language: TSX                                                                                                 ////
//// Series editor with rank-safe policy submission and dynamic effective summaries                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";

import { DropdownMenuSingle, ReadOnlyInput } from "@/components/ui";
import IconRender from "@/components/ui/IconRender";
import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
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

export type SeriesCategoryMeta = {
	id: string;
	title: string;
	slug: string;
	readPolicy: "public" | "rank_at_least" | "rank_equal";
	readMinRank: number | null;
	writePolicy: "rank_at_least" | "rank_equal";
	writeMinRank: number | null;
};

export type SeriesSubcategoryMeta = {
	id: string;
	title: string;
	categoryId: string;
	readEffectivePolicy: "public" | "rank_at_least" | "rank_equal";
	readEffectiveMinRank: number | null;
	writeEffectivePolicy: "rank_at_least" | "rank_equal";
	writeEffectiveMinRank: number | null;
};

export type SeriesIconMediaMeta = {
	id: string;
	url?: string | null;
	filename?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
} | null;

export type SeriesIconMeta = {
	id: string;
	key: string | null;
	label: string | null;
	source: "lucide" | "media";
	lucideName: string | null;
	iconMedia: SeriesIconMediaMeta;
};

export type SeriesColorTokenMeta = {
	id: string;
	key: string | null;
	label: string | null;
	preview: string | null;
};

export type SeriesMetaBundle = {
	roles: PolicyRoleRef[];
	categories: SeriesCategoryMeta[];
	subcategories: SeriesSubcategoryMeta[];
	icons: SeriesIconMeta[];
	colors: SeriesColorTokenMeta[];
	error: string | null;
};

export interface SeriesPanelProps {
	open: boolean;
	mode: Mode;
	row: SeriesItem | null;
	meta: SeriesMetaBundle;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

export type SeriesItem = {
	id?: string;
	title?: string;
	slug?: string;
	description?: string | null;
	categoryId?: string;
	subcategoryId?: string | null;
	readPolicy?: "inherit" | "public" | "rank_at_least" | "rank_equal";
	readMinRank?: number | null;
	readEffectivePolicy?: "public" | "rank_at_least" | "rank_equal";
	readEffectiveMinRank?: number | null;
	writePolicy?: "inherit" | "rank_at_least" | "rank_equal";
	writeMinRank?: number | null;
	writeEffectivePolicy?: "rank_at_least" | "rank_equal";
	writeEffectiveMinRank?: number | null;
	authorUsername?: string | null;
	iconKeyId?: string | null;
	iconColorId?: string | null;
	iconKey?: { id: string } | null;
	iconColor?: { id: string } | null;
};

function findCategory(
	categories: SeriesCategoryMeta[],
	categoryId: unknown,
): SeriesCategoryMeta | null {
	const normalizedCategoryId = typeof categoryId === "string" ? categoryId : "";
	return (
		categories.find((category) => category.id === normalizedCategoryId) ?? null
	);
}

function findSubcategory(
	subcategories: SeriesSubcategoryMeta[],
	categoryId: unknown,
	subcategoryId: unknown,
): SeriesSubcategoryMeta | null {
	const normalizedCategoryId = typeof categoryId === "string" ? categoryId : "";
	const normalizedSubcategoryId =
		typeof subcategoryId === "string" ? subcategoryId : "";
	return (
		subcategories.find(
			(subcategory) =>
				subcategory.id === normalizedSubcategoryId &&
				subcategory.categoryId === normalizedCategoryId,
		) ?? null
	);
}

function buildCategoryLabel(category: SeriesCategoryMeta): string {
	return category.title || category.slug || category.id;
}

function buildSubcategoryLabel(subcategory: SeriesSubcategoryMeta): string {
	return subcategory.title || subcategory.id;
}

function readSummary(
	values: Values,
	categories: SeriesCategoryMeta[],
	subcategories: SeriesSubcategoryMeta[],
	roles: PolicyRoleRef[],
): string {
	const readPolicy =
		values.readPolicy === "inherit"
			? "inherit"
			: values.readPolicy === "public"
				? "public"
				: values.readPolicy === "rank_equal"
					? "rank_equal"
					: "rank_at_least";

	if (readPolicy === "public") {
		return formatPublicDefaultSummary(roles);
	}

	if (readPolicy === "inherit") {
		const selectedSubcategory = findSubcategory(
			subcategories,
			values.categoryId,
			values.subcategoryId,
		);
		if (selectedSubcategory) {
			if (selectedSubcategory.readEffectivePolicy === "public") {
				return formatPublicDefaultSummary(roles);
			}
			return formatRankPolicySummary(
				selectedSubcategory.readEffectivePolicy,
				selectedSubcategory.readEffectiveMinRank,
				roles,
			);
		}

		const selectedCategory = findCategory(categories, values.categoryId);
		if (!selectedCategory) {
			return formatPublicDefaultSummary(roles);
		}

		if (selectedCategory.readPolicy === "public") {
			return formatPublicDefaultSummary(roles);
		}

		return formatRankPolicySummary(
			selectedCategory.readPolicy,
			selectedCategory.readMinRank,
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
	categories: SeriesCategoryMeta[],
	subcategories: SeriesSubcategoryMeta[],
	roles: PolicyRoleRef[],
): string {
	const writePolicy =
		values.writePolicy === "inherit"
			? "inherit"
			: values.writePolicy === "rank_equal"
				? "rank_equal"
				: "rank_at_least";

	if (writePolicy === "inherit") {
		const selectedSubcategory = findSubcategory(
			subcategories,
			values.categoryId,
			values.subcategoryId,
		);
		if (selectedSubcategory) {
			return formatRankPolicySummary(
				selectedSubcategory.writeEffectivePolicy,
				selectedSubcategory.writeEffectiveMinRank,
				roles,
			);
		}

		const selectedCategory = findCategory(categories, values.categoryId);
		if (!selectedCategory) {
			return "-";
		}

		return formatRankPolicySummary(
			selectedCategory.writePolicy,
			selectedCategory.writeMinRank,
			roles,
		);
	}

	return formatRankPolicySummary(
		writePolicy,
		findRankByRoleId(roles, String(values.writeRoleId ?? "")),
		roles,
	);
}

export default function SeriesPanel(
	props: SeriesPanelProps,
): React.JSX.Element | null {
	const { open, mode, row, meta, onClose, onSaved } = props;
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");
	const roles = meta.roles;
	const categories = meta.categories;
	const subcategories = meta.subcategories;
	const icons = meta.icons;
	const colors = meta.colors;
	const metaError = meta.error ?? "";

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [open]);

	const defaultValues = useMemo<Values>(
		() => ({
			title: row?.title ?? "",
			slug: row?.slug ?? "",
			description: row?.description ?? "",
			categoryId: row?.categoryId ?? "",
			subcategoryId: row?.subcategoryId ?? "",
			readPolicy: row?.readPolicy ?? "inherit",
			readRoleId: findRoleIdByRank(roles, row?.readMinRank),
			writePolicy: row?.writePolicy ?? "inherit",
			writeRoleId: findRoleIdByRank(roles, row?.writeMinRank),
			authorUsernameRO: row?.authorUsername ?? "",
			iconKeyId: row?.iconKeyId ?? row?.iconKey?.id ?? "",
			iconColorId: row?.iconColorId ?? row?.iconColor?.id ?? "",
		}),
		[roles, row],
	);

	const categoryOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				categories.map((category) => ({
					value: category.id,
					label: buildCategoryLabel(category),
				})),
			),
		[categories],
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
					label: `${icon.label ?? icon.key ?? icon.id}`,
				})),
			),
		[icons],
	);
	const colorOptions = useMemo(
		() =>
			sortAdminPickerOptions(
				colors.map((color) => ({
					value: color.id,
					label: color.label ?? color.key ?? color.id,
				})),
			),
		[colors],
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
				name: "categoryId",
				label: "Category",
				options: categoryOptions,
				onChange: ({ value, values, setValue }) => {
					const selectedSubcategory = findSubcategory(
						subcategories,
						value,
						values.subcategoryId,
					);
					if (!selectedSubcategory) {
						setValue("subcategoryId", "");
					}
				},
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Category is required.",
			},
			{
				type: "select-single",
				name: "subcategoryId",
				label: "Subcategory",
				isDisabled: (values) => String(values.categoryId ?? "").trim().length === 0,
				options: (values) => {
					const selectedCategoryId = String(values.categoryId ?? "").trim();
					if (selectedCategoryId.length === 0) {
						return [];
					}

					return sortAdminPickerOptions(
						subcategories
							.filter(
								(subcategory) =>
									subcategory.categoryId === selectedCategoryId,
							)
							.map((subcategory) => ({
								value: subcategory.id,
								label: buildSubcategoryLabel(subcategory),
							})),
					);
				},
			},
			{
				type: "select-single",
				name: "readPolicy",
				label: "Read policy",
				options: [
					{ value: "inherit", label: "Inherit" },
					{ value: "public", label: "Public" },
					{ value: "rank_at_least", label: "Minimum rank" },
					{ value: "rank_equal", label: "Exact rank" },
				],
			},
			{
				type: "custom",
				name: "readRoleId",
				label: "Read value",
				render: ({ value, setValue, values, readOnly }) => {
					if (values.readPolicy === "inherit" || values.readPolicy === "public") {
						return (
							<ReadOnlyInput
								value={readSummary(values, categories, subcategories, roles)}
							/>
						);
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
				options: [
					{ value: "inherit", label: "Inherit" },
					{ value: "rank_at_least", label: "Minimum rank" },
					{ value: "rank_equal", label: "Exact rank" },
				],
			},
			{
				type: "custom",
				name: "writeRoleId",
				label: "Write value",
				render: ({ value, setValue, values, readOnly }) => {
					if (values.writePolicy === "inherit") {
						return (
							<ReadOnlyInput
								value={writeSummary(values, categories, subcategories, roles)}
							/>
						);
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
			{ type: "readonly", name: "authorUsernameRO", label: "Author" },
			{ type: "textarea", name: "description", label: "Description", rows: 3 },
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
						icons.find((icon) => icon.id === selectedIconId) ?? null;
					const selectedColor =
						colors.find((color) => color.id === selectedColorId) ?? null;

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
			categories,
			categoryOptions,
			colorOptions,
			colors,
			iconOptions,
			icons,
			roleOptions,
			roles,
			subcategories,
		],
	);

	const rows: RowDef[] = useMemo(
		() => [
			[
				{ field: "title", span: 6 },
				{ field: "slug", span: 6 },
			],
			[
				{ field: "categoryId", span: 6 },
				{ field: "subcategoryId", span: 6 },
			],
			[
				{ field: "readPolicy", span: 6 },
				{ field: "readRoleId", span: 6 },
			],
			[
				{ field: "writePolicy", span: 6 },
				{ field: "writeRoleId", span: 6 },
			],
			[{ field: "authorUsernameRO", span: 12 }],
			[{ field: "description", span: 12 }],
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
					title: String(values.title ?? "").trim(),
					slug:
						String(values.slug ?? "").trim() ||
						slugifyLoose(String(values.title ?? "")),
					description: String(values.description ?? ""),
					categoryId: String(values.categoryId ?? "").trim(),
					subcategoryId: String(values.subcategoryId ?? "").trim(),
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
					iconKeyId: String(values.iconKeyId ?? "").trim(),
					iconColorId: String(values.iconColorId ?? "").trim(),
				},
			};

			const response = await fetch("/api/admin/web/series", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save series."),
				);
			}
		} catch (submitError: unknown) {
			const message =
				submitError instanceof Error
					? submitError.message
					: "Failed to save series.";
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
				onClose();
			}}
			title={mode === "create" ? "Create Series" : "Edit Series"}
			width="50%"
			showSave={metaError.length === 0}
			mode={mode}
			defaultValues={defaultValues}
			fields={fields}
			rows={rows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				onSaved();
				onClose();
			}}
			submitting={submitting}
			error={topError}
			metaError={metaError}
		/>
	);
}
