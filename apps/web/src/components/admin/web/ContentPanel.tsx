//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ContentPanel.tsx                                                     ////
//// Language: TSX                                                                                               ////
//// Full-width admin content panel with placement-aware templates and preserved saved field values                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import ContentAuthoringWorkspace from "@/components/authoring/ContentAuthoringWorkspace";
import IconRender from "@/components/ui/IconRender";
import {
	AlertBanner,
	DropdownMenuSingle,
	Input,
	ReadOnlyInput,
} from "@/components/ui";
import PanelForm, {
	type FieldDef,
	type Option,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { IconLookupItem } from "@/lib/data/icons";
import type { ThemeColorOption } from "@/lib/data/theme-colors";
import type {
	ContentAdminDetail,
	ContentCategoryOption,
	ContentMediaOption,
	ContentIconModeCode,
	ContentNavModeCode,
	ContentPolicyCode,
	ContentSeriesOption,
	ContentStatusCode,
	ContentSubcategoryOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
	ContentTemplateOption,
} from "@/lib/data/content";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";
import {
	findRankByRoleId,
	findRoleIdByRank,
	formatPublicDefaultSummary,
	formatRankPolicySummary,
	type PolicyRoleRef,
} from "@/lib/helpers/rank-policy";
import { slugifyLoose } from "@/lib/helpers/slug";

type PanelMode = "create" | "edit";
type Values = Record<string, unknown>;

export interface ContentPanelProps {
	open: boolean;
	mode: PanelMode;
	contentId: string | null;
	onClose: () => void;
	onSaved: () => void;
}

type MetaPayload = {
	categories?: ContentCategoryOption[];
	subcategories?: ContentSubcategoryOption[];
	roles?: PolicyRoleRef[];
	templates?: ContentTemplateOption[];
	series?: ContentSeriesOption[];
	media?: ContentMediaOption[];
	icons?: IconLookupItem[];
	colors?: ThemeColorOption[];
	templateFields?: ContentTemplateField[];
	fieldOptions?: ContentTemplateFieldOption[];
};

type DetailPayload = {
	doc?: ContentAdminDetail;
};

type MetaUpdateScope = "all" | "placement" | "template";

type MetaLoadArgs = {
	contentId?: string | null;
	categoryId?: string | null;
	subcategoryId?: string | null;
	templateId?: string | null;
};

function toOptions(
	rows: Array<{ id: string; title?: string; label?: string; slug?: string }>,
): Option[] {
	return sortAdminPickerOptions(
		rows.map((row) => ({
			value: row.id,
			label: row.title ?? row.label ?? row.slug ?? row.id,
		})),
	);
}

function templateOptions(rows: ContentTemplateOption[]): Option[] {
	return sortAdminPickerOptions(
		rows.map((row) => ({
			value: row.id,
			label: `${row.label} (${row.contentKindLabel})`,
		})),
	);
}

function roleOptions(rows: PolicyRoleRef[]): Option[] {
	return sortAdminPickerOptions(
		rows.map((row) => ({
			value: row.id,
			label: `${row.name} (${row.rank})`,
		})),
	);
}

function parsePolicy(
	value: unknown,
	fallback: ContentPolicyCode,
): ContentPolicyCode {
	if (
		value === "inherit" ||
		value === "public" ||
		value === "rank_at_least" ||
		value === "rank_equal"
	) {
		return value;
	}

	return fallback;
}

function parseStatus(value: unknown): ContentStatusCode {
	if (value === "published" || value === "archived") {
		return value;
	}

	return "draft";
}

function parseNavMode(value: unknown): ContentNavModeCode {
	if (value === "explicit_visible" || value === "explicit_hidden") {
		return value;
	}

	return "inherit";
}

function parseIconMode(value: unknown): ContentIconModeCode {
	return value === "explicit" ? "explicit" : "template_default";
}

function normalizeFieldValues(value: unknown): Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function navigationSummary(
	value: unknown,
	doc: ContentAdminDetail | null,
): string {
	const navMode = parseNavMode(value);

	if (navMode === "explicit_visible") {
		return "Visible";
	}

	if (navMode === "explicit_hidden") {
		return "Hidden";
	}

	if (doc) {
		return doc.navHiddenEffective ? "Hidden" : "Visible";
	}

	return "Inherited from placement";
}

function readPolicySummary(
	values: Values,
	roles: PolicyRoleRef[],
	doc: ContentAdminDetail | null,
): string {
	const readPolicyCode = parsePolicy(values.readPolicyCode, "inherit");
	if (readPolicyCode === "inherit") {
		return doc
			? formatRankPolicySummary(
					doc.readEffectivePolicyCode === "rank_equal"
						? "rank_equal"
						: doc.readEffectivePolicyCode === "rank_at_least"
							? "rank_at_least"
							: "public",
					doc.readEffectiveRank,
					roles,
				)
			: "Inherited from placement";
	}

	if (readPolicyCode === "public") {
		return formatPublicDefaultSummary(roles);
	}

	const rank = findRankByRoleId(roles, String(values.readRoleId ?? ""));
	return rank === null
		? "Select role"
		: formatRankPolicySummary(readPolicyCode, rank, roles);
}

function writePolicySummary(
	values: Values,
	roles: PolicyRoleRef[],
	doc: ContentAdminDetail | null,
): string {
	const writePolicyCode = parsePolicy(values.writePolicyCode, "inherit");
	if (writePolicyCode === "inherit") {
		return doc
			? formatRankPolicySummary(
					doc.writeEffectivePolicyCode === "rank_equal"
						? "rank_equal"
						: "rank_at_least",
					doc.writeEffectiveRank,
					roles,
				)
			: "Inherited from placement";
	}

	const rank = findRankByRoleId(roles, String(values.writeRoleId ?? ""));
	return rank === null
		? "Select role"
		: formatRankPolicySummary(
				writePolicyCode === "rank_equal" ? "rank_equal" : "rank_at_least",
				rank,
				roles,
			);
}

function templateAllowsSeries(
	templates: ContentTemplateOption[],
	templateId: unknown,
): boolean {
	const selectedTemplate = templates.find(
		(template) => template.id === String(templateId ?? ""),
	);

	return selectedTemplate?.allowsSeries ?? false;
}

function findSeriesOptionById(
	series: ContentSeriesOption[],
	seriesId: unknown,
): ContentSeriesOption | null {
	const normalizedSeriesId = String(seriesId ?? "").trim();
	if (normalizedSeriesId.length === 0) {
		return null;
	}

	return series.find((row) => row.id === normalizedSeriesId) ?? null;
}

function shouldAutofillSeriesPart(values: Values): boolean {
	return String(values.seriesPartNo ?? "").trim().length === 0;
}

function formatNextSeriesPartNo(
	series: ContentSeriesOption[],
	seriesId: unknown,
): string {
	const selectedSeries = findSeriesOptionById(series, seriesId);

	return selectedSeries ? String(selectedSeries.nextPartNo) : "";
}

function valueToString(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	return "";
}

function appendParam(
	params: URLSearchParams,
	key: string,
	value: string | null | undefined,
): void {
	if (typeof value === "string" && value.trim().length > 0) {
		params.set(key, value.trim());
	}
}

export default function ContentPanel({
	open,
	mode,
	contentId,
	onClose,
	onSaved,
}: ContentPanelProps): React.JSX.Element | null {
	const [submitting, setSubmitting] = React.useState(false);
	const [topError, setTopError] = React.useState("");
	const [metaError, setMetaError] = React.useState("");
	const [metaLoading, setMetaLoading] = React.useState(false);
	const [doc, setDoc] = React.useState<ContentAdminDetail | null>(null);
	const [categories, setCategories] = React.useState<ContentCategoryOption[]>(
		[],
	);
	const [subcategories, setSubcategories] = React.useState<
		ContentSubcategoryOption[]
	>([]);
	const [roles, setRoles] = React.useState<PolicyRoleRef[]>([]);
	const [templates, setTemplates] = React.useState<ContentTemplateOption[]>([]);
	const [series, setSeries] = React.useState<ContentSeriesOption[]>([]);
	const [media, setMedia] = React.useState<ContentMediaOption[]>([]);
	const [icons, setIcons] = React.useState<IconLookupItem[]>([]);
	const [colors, setColors] = React.useState<ThemeColorOption[]>([]);
	const [templateFields, setTemplateFields] = React.useState<
		ContentTemplateField[]
	>([]);
	const [fieldOptions, setFieldOptions] = React.useState<
		ContentTemplateFieldOption[]
	>([]);
	const [editorSessionSeq, setEditorSessionSeq] = React.useState(0);

	const loadMeta = React.useCallback(
		async (args: MetaLoadArgs, scope: MetaUpdateScope = "all"): Promise<void> => {
			const params = new URLSearchParams();
			appendParam(params, "contentId", args.contentId);
			appendParam(params, "categoryId", args.categoryId);
			appendParam(params, "subcategoryId", args.subcategoryId);
			appendParam(params, "templateId", args.templateId);

			const response = await fetch(
				`/api/admin/web/content/meta${params.toString() ? `?${params.toString()}` : ""}`,
				{ cache: "no-store", credentials: "include" },
			);

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to load content metadata."),
				);
			}

			const payload = (await response.json()) as MetaPayload;
			const nextTemplateFields = Array.isArray(payload.templateFields)
				? payload.templateFields
				: [];
			const nextFieldOptions = Array.isArray(payload.fieldOptions)
				? payload.fieldOptions
				: [];

			if (scope === "all") {
				setCategories(Array.isArray(payload.categories) ? payload.categories : []);
				setSubcategories(
					Array.isArray(payload.subcategories) ? payload.subcategories : [],
				);
				setRoles(Array.isArray(payload.roles) ? payload.roles : []);
				setIcons(Array.isArray(payload.icons) ? payload.icons : []);
				setColors(Array.isArray(payload.colors) ? payload.colors : []);
			}

			if (scope === "all" || scope === "placement") {
				setTemplates(Array.isArray(payload.templates) ? payload.templates : []);
				setSeries(Array.isArray(payload.series) ? payload.series : []);
				setMedia(Array.isArray(payload.media) ? payload.media : []);
			}

			setTemplateFields(nextTemplateFields);
			setFieldOptions(nextFieldOptions);
		},
		[],
	);

	const loadMetaWithState = React.useCallback(
		async (args: MetaLoadArgs, scope: MetaUpdateScope): Promise<void> => {
			setMetaLoading(true);
			setMetaError("");

			try {
				await loadMeta(args, scope);
			} catch (error: unknown) {
				setMetaError(
					error instanceof Error
						? error.message
						: "Failed to load content metadata.",
				);
			} finally {
				setMetaLoading(false);
			}
		},
		[loadMeta],
	);

	React.useEffect(() => {
		if (!open) {
			return;
		}

		let active = true;
		setEditorSessionSeq((current) => current + 1);

		async function loadPanel(): Promise<void> {
			setMetaLoading(true);
			setTopError("");
			setMetaError("");
			setDoc(null);

			try {
				let nextDoc: ContentAdminDetail | null = null;
				if (mode === "edit" && contentId) {
					const response = await fetch(`/api/admin/web/content/${contentId}`, {
						cache: "no-store",
						credentials: "include",
					});

					if (!response.ok) {
						throw new Error(
							await readResponseMessage(response, "Failed to load content."),
						);
					}

					const payload = (await response.json()) as DetailPayload;
					nextDoc = payload.doc ?? null;
				}

				await loadMeta(
					{
						contentId: nextDoc?.id ?? null,
						categoryId: nextDoc?.categoryId ?? null,
						subcategoryId: nextDoc?.subcategoryId ?? null,
						templateId: nextDoc?.templateId ?? null,
					},
					"all",
				);

				if (active) {
					setDoc(nextDoc);
				}
			} catch (error: unknown) {
				if (active) {
					setMetaError(
						error instanceof Error ? error.message : "Failed to load content panel.",
					);
				}
			} finally {
				if (active) {
					setMetaLoading(false);
				}
			}
		}

		void loadPanel();

		return () => {
			active = false;
		};
	}, [contentId, loadMeta, mode, open]);

	const categoryOptions = React.useMemo(
		() => toOptions(categories),
		[categories],
	);
	const roleSelectOptions = React.useMemo(() => roleOptions(roles), [roles]);
	const contentTemplateOptions = React.useMemo(
		() => templateOptions(templates),
		[templates],
	);
	const seriesOptions = React.useMemo(() => toOptions(series), [series]);
	const iconOptions = React.useMemo<Option[]>(
		() =>
			sortAdminPickerOptions(
				icons.map((icon) => ({
					value: icon.id,
					label: icon.label ?? icon.key ?? icon.id,
				})),
			),
		[icons],
	);
	const colorOptions = React.useMemo<Option[]>(
		() =>
			sortAdminPickerOptions(
				colors.map((color) => ({
					value: color.id,
					label: color.label,
				})),
			),
		[colors],
	);

	const editorSessionKey = React.useMemo(
		() =>
			[
				mode,
				contentId ?? "new",
				doc?.id ?? "pending",
				doc?.templateId ?? "no-template",
				editorSessionSeq,
			].join(":"),
		[contentId, doc?.id, doc?.templateId, editorSessionSeq, mode],
	);

	const panelFormSessionKey = React.useMemo(
		() => `content-panel:${editorSessionKey}`,
		[editorSessionKey],
	);

	const defaultValues = React.useMemo<Values>(
		() => ({
			categoryId: doc?.categoryId ?? "",
			subcategoryId: doc?.subcategoryId ?? "",
			templateId: doc?.templateId ?? "",
			statusCode: doc?.statusCode ?? "draft",
			title: doc?.title ?? "",
			slug: doc?.slug ?? "",
			seriesId: doc?.allowsSeries ? (doc.seriesId ?? "") : "",
			seriesPartNo:
				doc?.allowsSeries &&
				doc.seriesPartNo !== null &&
				typeof doc?.seriesPartNo !== "undefined"
					? String(doc.seriesPartNo)
					: "",
			readPolicyCode: doc?.readPolicyCode ?? "inherit",
			readRoleId: findRoleIdByRank(roles, doc?.readRank),
			writePolicyCode: doc?.writePolicyCode ?? "inherit",
			writeRoleId: findRoleIdByRank(roles, doc?.writeRank),
			navHiddenModeCode: doc?.navHiddenModeCode ?? "inherit",
			iconModeCode: doc?.iconModeCode ?? "template_default",
			iconKeyId: doc?.iconModeCode === "explicit" ? (doc.iconKeyId ?? "") : "",
			iconColorModeCode: doc?.iconColorModeCode ?? "template_default",
			iconColorId:
				doc?.iconColorModeCode === "explicit" ? (doc.iconColorId ?? "") : "",
			summary: doc?.summary ?? "",
			fieldValues: doc?.fieldValues ?? {},
			metaStatus: "",
		}),
		[doc, roles],
	);

	const fields: FieldDef[] = React.useMemo(
		() => [
			{
				type: "custom",
				name: "metaStatus",
				visible: () => metaLoading || metaError.length > 0,
				render: () => {
					if (metaError.length > 0) {
						return <AlertBanner tone="error">{metaError}</AlertBanner>;
					}

					if (metaLoading) {
						return <AlertBanner tone="info">Loading content metadata...</AlertBanner>;
					}

					return null;
				},
			},
			{
				type: "select-single",
				name: "categoryId",
				label: "Category",
				options: categoryOptions,
				onChange: ({ value, setValue }) => {
					setValue("subcategoryId", "");
					setValue("templateId", "");
					setValue("seriesId", "");
					setValue("seriesPartNo", "");
					setValue("fieldValues", {});
					void loadMetaWithState(
						{
							categoryId: value,
							subcategoryId: null,
							templateId: null,
						},
						"placement",
					);
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
				options: ({ categoryId }) => {
					const currentCategoryId = String(categoryId ?? "").trim();
					return toOptions(
						subcategories.filter(
							(subcategory) => subcategory.categoryId === currentCategoryId,
						),
					);
				},
				isDisabled: (values) => String(values.categoryId ?? "").trim().length === 0,
				onChange: ({ value, values, setValue }) => {
					setValue("templateId", "");
					setValue("seriesId", "");
					setValue("seriesPartNo", "");
					setValue("fieldValues", {});
					void loadMetaWithState(
						{
							categoryId: String(values.categoryId ?? ""),
							subcategoryId: value,
							templateId: null,
						},
						"placement",
					);
				},
			},
			{
				type: "select-single",
				name: "templateId",
				label: "Template",
				options: contentTemplateOptions,
				isDisabled: (values) => String(values.categoryId ?? "").trim().length === 0,
				onChange: ({ value, values, setValue }) => {
					setValue("fieldValues", {});

					if (!templateAllowsSeries(templates, value)) {
						setValue("seriesId", "");
						setValue("seriesPartNo", "");
					}

					void loadMetaWithState(
						{
							contentId,
							categoryId: String(values.categoryId ?? ""),
							subcategoryId: String(values.subcategoryId ?? ""),
							templateId: value,
						},
						"template",
					);
				},
				validate: (value) =>
					String(value ?? "").trim().length > 0
						? undefined
						: "Template is required.",
			},
			{
				type: "select-single",
				name: "statusCode",
				label: "Status",
				options: [
					{ value: "draft", label: "Draft" },
					{ value: "published", label: "Published" },
					{ value: "archived", label: "Archived" },
				],
			},
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
				name: "seriesId",
				label: "Series",
				options: seriesOptions,
				helpText: "Optional when the selected template allows series.",
				allowClear: true,
				clearLabel: "No series",
				isDisabled: (values) => !templateAllowsSeries(templates, values.templateId),
				onChange: ({ value, values, setValue }) => {
					const nextPartNo = formatNextSeriesPartNo(series, value);
					if (
						mode === "create" &&
						nextPartNo.length > 0 &&
						shouldAutofillSeriesPart(values)
					) {
						setValue("seriesPartNo", nextPartNo);
					}
				},
			},
			{
				type: "custom",
				name: "seriesPartNo",
				label: "Series Part",
				helpText:
					"Create mode auto-fills the next available number after a series is selected.",
				render: ({ value, setValue, values, readOnly }) => {
					if (!templateAllowsSeries(templates, values.templateId)) {
						return <ReadOnlyInput value="Series disabled in template" />;
					}

					if (String(values.seriesId ?? "").trim().length === 0) {
						return <ReadOnlyInput value="Select a series to set its part number" />;
					}

					return (
						<Input
							type="number"
							step={1}
							min={1}
							value={valueToString(value)}
							onChange={(event) => setValue(event.target.value)}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) =>
					templateAllowsSeries(templates, values.templateId) &&
					String(values.seriesId ?? "").trim().length > 0 &&
					String(value ?? "").trim().length === 0
						? "Series part number is required when a series is selected."
						: undefined,
			},
			{
				type: "select-single",
				name: "readPolicyCode",
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
					const policy = parsePolicy(values.readPolicyCode, "inherit");
					if (policy === "inherit" || policy === "public") {
						return <ReadOnlyInput value={readPolicySummary(values, roles, doc)} />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={roleSelectOptions}
							value={typeof value === "string" ? value : ""}
							onChange={setValue}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) => {
					const policy = parsePolicy(values.readPolicyCode, "inherit");
					return policy === "rank_at_least" || policy === "rank_equal"
						? String(value ?? "").trim().length > 0
							? undefined
							: "Read role is required."
						: undefined;
				},
			},
			{
				type: "select-single",
				name: "writePolicyCode",
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
					const policy = parsePolicy(values.writePolicyCode, "inherit");
					if (policy === "inherit") {
						return <ReadOnlyInput value={writePolicySummary(values, roles, doc)} />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={roleSelectOptions}
							value={typeof value === "string" ? value : ""}
							onChange={setValue}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) => {
					const policy = parsePolicy(values.writePolicyCode, "inherit");
					return policy === "rank_at_least" || policy === "rank_equal"
						? String(value ?? "").trim().length > 0
							? undefined
							: "Write role is required."
						: undefined;
				},
			},
			{
				type: "select-single",
				name: "navHiddenModeCode",
				label: "Navigation",
				options: [
					{ value: "inherit", label: "Inherit" },
					{ value: "explicit_visible", label: "Visible" },
					{ value: "explicit_hidden", label: "Hidden" },
				],
			},
			{
				type: "readonly",
				name: "effectiveNavigation",
				label: "Effective navigation",
				format: (_value, values) =>
					navigationSummary(values.navHiddenModeCode, doc),
			},
			{
				type: "textarea",
				name: "summary",
				label: "Summary",
				rows: 4,
			},
			{
				type: "select-single",
				name: "iconModeCode",
				label: "Icon",
				options: [
					{ value: "template_default", label: "Template default" },
					{ value: "explicit", label: "Explicit" },
				],
				onChange: ({ value, setValue }) => {
					if (value !== "explicit") {
						setValue("iconKeyId", "");
					}
				},
			},
			{
				type: "custom",
				name: "iconKeyId",
				label: "Icon value",
				render: ({ value, setValue, values, readOnly }) => {
					if (parseIconMode(values.iconModeCode) === "template_default") {
						return <ReadOnlyInput value="Template default" />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={iconOptions}
							value={typeof value === "string" ? value : ""}
							onChange={setValue}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) =>
					parseIconMode(values.iconModeCode) === "explicit" &&
					String(value ?? "").trim().length === 0
						? "Icon value is required."
						: undefined,
			},
			{
				type: "select-single",
				name: "iconColorModeCode",
				label: "Icon color",
				options: [
					{ value: "template_default", label: "Template default" },
					{ value: "explicit", label: "Explicit" },
				],
				onChange: ({ value, setValue }) => {
					if (value !== "explicit") {
						setValue("iconColorId", "");
					}
				},
			},
			{
				type: "custom",
				name: "iconColorId",
				label: "Icon color value",
				render: ({ value, setValue, values, readOnly }) => {
					if (parseIconMode(values.iconColorModeCode) === "template_default") {
						return <ReadOnlyInput value="Template default" />;
					}

					return (
						<DropdownMenuSingle
							className="ui-dropdown--full"
							options={colorOptions}
							value={typeof value === "string" ? value : ""}
							onChange={setValue}
							disabled={readOnly}
						/>
					);
				},
				validate: (value, values) =>
					parseIconMode(values.iconColorModeCode) === "explicit" &&
					String(value ?? "").trim().length === 0
						? "Icon color value is required."
						: undefined,
			},
			{
				type: "custom",
				name: "iconPreview",
				render: ({ values }) => {
					const iconMode = parseIconMode(values.iconModeCode);
					const colorMode = parseIconMode(values.iconColorModeCode);
					const selectedIconId = String(values.iconKeyId ?? "").trim();
					const selectedColorId = String(values.iconColorId ?? "").trim();
					const selectedIcon =
						iconMode === "explicit"
							? (icons.find((icon) => icon.id === selectedIconId) ?? null)
							: doc?.iconKeyId
								? (icons.find((icon) => icon.id === doc.iconKeyId) ?? null)
								: null;
					const selectedColor =
						colorMode === "explicit"
							? (colors.find((color) => color.id === selectedColorId) ?? null)
							: doc?.iconColorId
								? (colors.find((color) => color.id === doc.iconColorId) ?? null)
								: null;

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
									<span className="media-icon-preview-empty">
										Choose explicit icon and color
									</span>
								)}
							</div>
						</div>
					);
				},
			},
			{
				type: "custom",
				name: "fieldValues",
				render: ({ value, setValue, values, readOnly }) => {
					const currentFieldValues = normalizeFieldValues(value);

					return (
						<ContentAuthoringWorkspace
							previewEndpoint="/api/admin/web/content/preview"
							previewDraft={{
								contentId,
								templateId: String(values.templateId ?? ""),
								title: String(values.title ?? ""),
								slug: String(values.slug ?? ""),
								summary: String(values.summary ?? ""),
								categoryId: String(values.categoryId ?? ""),
								subcategoryId: String(values.subcategoryId ?? "") || null,
								seriesId: String(values.seriesId ?? "") || null,
								seriesPartNo: valueToString(values.seriesPartNo) || null,
								fieldValues: currentFieldValues,
							}}
							fieldInputProps={{
								fields: templateFields,
								fieldOptions,
								media,
								series,
								values: currentFieldValues,
								categoryId: String(values.categoryId ?? ""),
								subcategoryId: String(values.subcategoryId ?? ""),
								onChange: (templateFieldId, nextValue) => {
									setValue({
										...currentFieldValues,
										[templateFieldId]: nextValue,
									});
								},
								editorSessionKey,
								readOnly,
							}}
						/>
					);
				},
			},
		],
		[
			categoryOptions,
			colorOptions,
			colors,
			contentId,
			contentTemplateOptions,
			doc,
			editorSessionKey,
			fieldOptions,
			iconOptions,
			icons,
			loadMetaWithState,
			media,
			mode,
			metaError,
			metaLoading,
			roleSelectOptions,
			roles,
			series,
			seriesOptions,
			subcategories,
			templateFields,
			templates,
		],
	);

	const rows: RowDef[] = React.useMemo(
		() => [
			[{ field: "metaStatus", span: 12 }],
			[
				{ field: "categoryId", span: 6 },
				{ field: "subcategoryId", span: 6 },
			],
			[
				{ field: "templateId", span: 6 },
				{ field: "statusCode", span: 6 },
			],
			[
				{ field: "title", span: 6 },
				{ field: "slug", span: 6 },
			],
			[
				{ field: "seriesId", span: 6 },
				{ field: "seriesPartNo", span: 6 },
			],
			[
				{ field: "readPolicyCode", span: 6 },
				{ field: "readRoleId", span: 6 },
			],
			[
				{ field: "writePolicyCode", span: 6 },
				{ field: "writeRoleId", span: 6 },
			],
			[
				{ field: "navHiddenModeCode", span: 6 },
				{ field: "effectiveNavigation", span: 6 },
			],
			[{ field: "summary", span: 12 }],
			[
				{ field: "iconModeCode", span: 3 },
				{ field: "iconKeyId", span: 3 },
				{ field: "iconColorModeCode", span: 3 },
				{ field: "iconColorId", span: 3 },
			],
			[{ field: "iconPreview", span: 12 }],
			[{ field: "fieldValues", span: 12 }],
		],
		[],
	);

	async function handleSubmit(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			const title = String(values.title ?? "").trim();
			const allowsSeries = templateAllowsSeries(templates, values.templateId);
			const selectedSeriesId = allowsSeries
				? String(values.seriesId ?? "").trim()
				: "";
			const body = {
				templateId: String(values.templateId ?? "").trim(),
				statusCode: parseStatus(values.statusCode),
				title,
				slug: String(values.slug ?? "").trim() || slugifyLoose(title),
				summary: String(values.summary ?? "").trim(),
				categoryId: String(values.categoryId ?? "").trim(),
				subcategoryId: String(values.subcategoryId ?? "").trim(),
				seriesId: selectedSeriesId,
				seriesPartNo:
					selectedSeriesId.length > 0
						? String(values.seriesPartNo ?? "").trim()
						: "",
				readPolicyCode: parsePolicy(values.readPolicyCode, "inherit"),
				readRank: findRankByRoleId(roles, String(values.readRoleId ?? "")),
				writePolicyCode: parsePolicy(values.writePolicyCode, "inherit"),
				writeRank: findRankByRoleId(roles, String(values.writeRoleId ?? "")),
				navHiddenModeCode: parseNavMode(values.navHiddenModeCode),
				iconModeCode: parseIconMode(values.iconModeCode),
				iconKeyId: String(values.iconKeyId ?? "").trim(),
				iconColorModeCode: parseIconMode(values.iconColorModeCode),
				iconColorId: String(values.iconColorId ?? "").trim(),
				fieldValues: normalizeFieldValues(values.fieldValues),
			};

			const response = await fetch(
				mode === "create"
					? "/api/admin/web/content"
					: `/api/admin/web/content/${contentId ?? ""}`,
				{
					method: mode === "create" ? "POST" : "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				},
			);

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save content."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Failed to save content.";
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
			key={panelFormSessionKey}
			open={open}
			onClose={() => {
				setTopError("");
				setMetaError("");
				onClose();
			}}
			title={mode === "create" ? "Create Content" : "Edit Content"}
			width="100%"
			contentMaxWidthPx={1274}
			showSave={!metaLoading && metaError.length === 0}
			mode={mode}
			defaultValues={defaultValues}
			fields={fields}
			rows={rows}
			onSubmit={handleSubmit}
			onSaved={() => {
				setTopError("");
				void onSaved();
			}}
			submitting={submitting}
			error={topError}
			dirtyGuard
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
