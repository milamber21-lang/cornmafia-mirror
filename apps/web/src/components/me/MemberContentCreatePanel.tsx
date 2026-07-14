//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/me/MemberContentCreatePanel.tsx                                                ////
//// Language: TSX                                                                                               ////
//// Member-context content create and edit panel using the shared admin panel visual shell.                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";

import ContentAuthoringWorkspace from "@/components/authoring/ContentAuthoringWorkspace";
import {
	AlertBanner,
	Button,
	DropdownMenuSingle,
	Input,
	Label,
	Panel,
	ReadOnlyInput,
	Textarea,
} from "@/components/ui";
import type {
	ContentMediaOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
	ContentTemplateOption,
} from "@/lib/data/content";

type MemberContentPanelMode = "create" | "edit";

type MemberContentCreatePanelProps = {
	open: boolean;
	mode?: MemberContentPanelMode;
	contentId?: string | null;
	categorySlug?: string;
	subcategorySlug?: string;
	collectionPath?: string | null;
	memberManagePath?: string | null;
	onClose: () => void;
};

type MemberAuthoringCollection = {
	categoryId: string;
	categoryTitle: string;
	categorySlug: string;
	subcategoryId: string;
	subcategoryTitle: string;
	subcategorySlug: string;
	label: string;
};

type MemberContentCreateSeriesOption = {
	id: string;
	title: string;
	slug: string;
	description: string;
	categoryId: string;
	subcategoryId: string;
	nextPartNo: number;
};

type MemberContentEditDoc = {
	id: string;
	title: string;
	slug: string;
	summary: string;
	statusCode: "draft" | "published" | "archived";
	templateId: string;
	seriesId: string | null;
	seriesPartNo: number | null;
	fieldValues: Record<string, unknown>;
};

type MemberContentPanelMeta = {
	collection: MemberAuthoringCollection;
	doc: MemberContentEditDoc | null;
	templates: ContentTemplateOption[];
	fields: ContentTemplateField[];
	fieldOptions: ContentTemplateFieldOption[];
	media: ContentMediaOption[];
	series: MemberContentCreateSeriesOption[];
};

type MetaResponse = {
	meta?: unknown;
	message?: unknown;
};

type MutationResponse = {
	ok?: unknown;
	contentId?: unknown;
	message?: unknown;
};

type SelectOption = {
	value: string;
	label: string;
};

const NO_SERIES_VALUE = "__none";
const NEW_SERIES_VALUE = "__new";
const STATUS_OPTIONS_CREATE: SelectOption[] = [
	{ value: "draft", label: "Draft" },
	{ value: "published", label: "Published" },
];
const STATUS_OPTIONS_EDIT: SelectOption[] = [
	{ value: "draft", label: "Draft" },
	{ value: "published", label: "Published" },
	{ value: "archived", label: "Archived" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
	const value = record[key];
	return typeof value === "string" ? value : "";
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
	const value = record[key];
	return typeof value === "boolean" ? value : false;
}

function readNumber(
	record: Record<string, unknown>,
	key: string,
): number | null {
	const value = record[key];
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function readNullableString(
	record: Record<string, unknown>,
	key: string,
): string | null {
	const value = readString(record, key).trim();
	return value ? value : null;
}

function readMessage(value: unknown, fallback: string): string {
	return isRecord(value) && typeof value.message === "string"
		? value.message
		: fallback;
}

function mapCollection(value: unknown): MemberAuthoringCollection | null {
	if (!isRecord(value)) {
		return null;
	}

	const categoryId = readString(value, "categoryId");
	const categoryTitle = readString(value, "categoryTitle");
	const categorySlug = readString(value, "categorySlug");
	const subcategoryId = readString(value, "subcategoryId");
	const subcategoryTitle = readString(value, "subcategoryTitle");
	const subcategorySlug = readString(value, "subcategorySlug");

	if (!categoryId || !subcategoryId || !categorySlug || !subcategorySlug) {
		return null;
	}

	return {
		categoryId,
		categoryTitle,
		categorySlug,
		subcategoryId,
		subcategoryTitle,
		subcategorySlug,
		label: readString(value, "label") || `${categoryTitle} / ${subcategoryTitle}`,
	};
}

function mapTemplate(value: unknown): ContentTemplateOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const code = readString(value, "code");
	const label = readString(value, "label");
	const contentKindCode = readString(value, "contentKindCode");
	const surfaceScopeCode = readString(value, "surfaceScopeCode");
	const rendererCode = readString(value, "rendererCode") || contentKindCode;

	if (
		!id ||
		!code ||
		!label ||
		!contentKindCode ||
		!rendererCode ||
		!surfaceScopeCode
	) {
		return null;
	}

	return {
		id,
		code,
		key: readString(value, "key") || code,
		label,
		contentKindCode,
		contentKindLabel: readString(value, "contentKindLabel"),
		publicRoutePrefix: readNullableString(value, "publicRoutePrefix"),
		rendererCode,
		surfaceScopeCode,
		allowsSeries: readBoolean(value, "allowsSeries"),
	};
}

function isContentTemplateField(value: unknown): value is ContentTemplateField {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.templateId === "string"
	);
}

function isContentTemplateFieldOption(
	value: unknown,
): value is ContentTemplateFieldOption {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.fieldListId === "string"
	);
}

function isContentMediaOption(value: unknown): value is ContentMediaOption {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.originalFilename === "string"
	);
}

function mapSeries(value: unknown): MemberContentCreateSeriesOption | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const slug = readString(value, "slug");
	const categoryId = readString(value, "categoryId");
	const subcategoryId = readString(value, "subcategoryId");

	if (!id || !title || !categoryId || !subcategoryId) {
		return null;
	}

	return {
		id,
		title,
		slug,
		description: readString(value, "description"),
		categoryId,
		subcategoryId,
		nextPartNo: Math.max(1, readNumber(value, "nextPartNo") ?? 1),
	};
}

function mapEditDoc(value: unknown): MemberContentEditDoc | null {
	if (!isRecord(value)) {
		return null;
	}

	const id = readString(value, "id");
	const title = readString(value, "title");
	const slug = readString(value, "slug");
	const statusCode = readString(value, "statusCode");
	const templateId = readString(value, "templateId");

	if (!id || !title || !slug || !templateId) {
		return null;
	}

	return {
		id,
		title,
		slug,
		summary: readString(value, "summary"),
		statusCode:
			statusCode === "published" || statusCode === "archived"
				? statusCode
				: "draft",
		templateId,
		seriesId: readNullableString(value, "seriesId"),
		seriesPartNo: readNumber(value, "seriesPartNo"),
		fieldValues: isRecord(value.fieldValues) ? value.fieldValues : {},
	};
}

function mapArray<T>(value: unknown, mapper: (item: unknown) => T | null): T[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => {
		const mapped = mapper(item);
		return mapped ? [mapped] : [];
	});
}

function mapMeta(
	value: unknown,
	mode: MemberContentPanelMode,
): MemberContentPanelMeta | null {
	if (!isRecord(value)) {
		return null;
	}

	const collection = mapCollection(value.collection);
	if (!collection) {
		return null;
	}

	const doc = mapEditDoc(value.doc);
	if (mode === "edit" && !doc) {
		return null;
	}

	return {
		collection,
		doc,
		templates: mapArray(value.templates, mapTemplate),
		fields: mapArray(value.fields, (item) =>
			isContentTemplateField(item) ? item : null,
		),
		fieldOptions: mapArray(value.fieldOptions, (item) =>
			isContentTemplateFieldOption(item) ? item : null,
		),
		media: mapArray(value.media, (item) =>
			isContentMediaOption(item) ? item : null,
		),
		series: mapArray(value.series, mapSeries),
	};
}

function templateOptions(templates: ContentTemplateOption[]): SelectOption[] {
	return templates.map((template) => ({
		value: template.id,
		label: `${template.label} (${template.contentKindLabel || template.contentKindCode})`,
	}));
}

function seriesOptions(
	series: MemberContentCreateSeriesOption[],
): SelectOption[] {
	return [
		{ value: NO_SERIES_VALUE, label: "No series" },
		...series.map((row) => ({
			value: row.id,
			label: `${row.title} - next part ${row.nextPartNo}`,
		})),
		{ value: NEW_SERIES_VALUE, label: "Create new series" },
	];
}

function nextPartNoForSeries(
	series: MemberContentCreateSeriesOption[],
	seriesId: string,
): number {
	return series.find((row) => row.id === seriesId)?.nextPartNo ?? 1;
}

function panelTitle(
	mode: MemberContentPanelMode,
	meta: MemberContentPanelMeta | null,
): string {
	if (mode === "edit") {
		return meta?.doc?.title ? `Edit Content - ${meta.doc.title}` : "Edit Content";
	}
	return meta?.collection.label
		? `Create Content - ${meta.collection.label}`
		: "Create Content";
}

export default function MemberContentCreatePanel({
	open,
	mode = "create",
	contentId = null,
	categorySlug = "",
	subcategorySlug = "",
	collectionPath = null,
	memberManagePath = null,
	onClose,
}: MemberContentCreatePanelProps): JSX.Element | null {
	const router = useRouter();
	const [meta, setMeta] = React.useState<MemberContentPanelMeta | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const [dirty, setDirty] = React.useState(false);
	const [templateId, setTemplateId] = React.useState("");
	const [statusCode, setStatusCode] = React.useState("draft");
	const [title, setTitle] = React.useState("");
	const [summary, setSummary] = React.useState("");
	const [fieldValues, setFieldValues] = React.useState<Record<string, unknown>>(
		{},
	);
	const [seriesChoice, setSeriesChoice] = React.useState("");
	const [seriesPartNo, setSeriesPartNo] = React.useState("1");
	const [newSeriesTitle, setNewSeriesTitle] = React.useState("");
	const [newSeriesDescription, setNewSeriesDescription] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);
		setMeta(null);
		setTemplateId("");
		setStatusCode("draft");
		setTitle("");
		setSummary("");
		setFieldValues({});
		setSeriesChoice("");
		setSeriesPartNo("1");
		setNewSeriesTitle("");
		setNewSeriesDescription("");
		setDirty(false);

		const url =
			mode === "edit" && contentId
				? `/api/me/content/${encodeURIComponent(contentId)}`
				: `/api/me/content/create?${new URLSearchParams({ categorySlug, subcategorySlug }).toString()}`;

		fetch(url, { cache: "no-store", credentials: "include" })
			.then(async (response) => {
				const body = (await response.json().catch(() => ({}))) as MetaResponse;
				if (!response.ok) {
					throw new Error(readMessage(body, "Failed to load content form."));
				}

				const mapped = mapMeta(body.meta, mode);
				if (!mapped) {
					throw new Error("Content form response was incomplete.");
				}
				return mapped;
			})
			.then((mapped) => {
				if (cancelled) {
					return;
				}

				setMeta(mapped);
				const initialTemplate = mapped.doc
					? (mapped.templates.find(
							(template) => template.id === mapped.doc?.templateId,
						) ??
						mapped.templates[0] ??
						null)
					: (mapped.templates[0] ?? null);
				const initialTemplateId = initialTemplate?.id ?? "";
				setTemplateId(initialTemplateId);
				setStatusCode(mapped.doc?.statusCode ?? "draft");
				setTitle(mapped.doc?.title ?? "");
				setSummary(mapped.doc?.summary ?? "");
				setFieldValues(mapped.doc?.fieldValues ?? {});

				if (initialTemplate?.allowsSeries) {
					const existingSeries = mapped.doc?.seriesId
						? (mapped.series.find((row) => row.id === mapped.doc?.seriesId) ?? null)
						: null;
					const selectedSeries = existingSeries;
					setSeriesChoice(selectedSeries?.id ?? NO_SERIES_VALUE);
					setSeriesPartNo(
						String(mapped.doc?.seriesPartNo ?? selectedSeries?.nextPartNo ?? 1),
					);
				}
			})
			.catch((fetchError: unknown) => {
				if (!cancelled) {
					setError(
						fetchError instanceof Error
							? fetchError.message
							: "Failed to load content form.",
					);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [categorySlug, contentId, mode, open, subcategorySlug]);

	const selectedTemplate = React.useMemo(
		() => meta?.templates.find((template) => template.id === templateId) ?? null,
		[meta?.templates, templateId],
	);

	const selectedFields = React.useMemo(
		() => meta?.fields.filter((field) => field.templateId === templateId) ?? [],
		[meta?.fields, templateId],
	);

	function markDirty(): void {
		setDirty(true);
	}

	function closePanel(): void {
		onClose();
		if (collectionPath) {
			router.push(collectionPath);
		}
	}

	function changeTemplate(nextTemplateId: string): void {
		const nextTemplate =
			meta?.templates.find((template) => template.id === nextTemplateId) ?? null;
		setTemplateId(nextTemplateId);
		setFieldValues({});
		markDirty();

		if (nextTemplate?.allowsSeries) {
			setSeriesChoice(NO_SERIES_VALUE);
			setSeriesPartNo("1");
		} else {
			setSeriesChoice("");
			setSeriesPartNo("1");
			setNewSeriesTitle("");
			setNewSeriesDescription("");
		}
	}

	function changeSeries(nextValue: string): void {
		setSeriesChoice(nextValue);
		setSeriesPartNo(
			String(
				nextValue === NEW_SERIES_VALUE || nextValue === NO_SERIES_VALUE
					? 1
					: nextPartNoForSeries(meta?.series ?? [], nextValue),
			),
		);
		markDirty();
	}

	async function submit(): Promise<void> {
		if (!meta || !selectedTemplate || submitting) {
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const endpoint =
				mode === "edit" && contentId
					? `/api/me/content/${encodeURIComponent(contentId)}`
					: "/api/me/content/create";
			const method = mode === "edit" ? "PATCH" : "POST";
			const response = await fetch(endpoint, {
				method,
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					categorySlug,
					subcategorySlug,
					templateId,
					statusCode,
					title,
					summary,
					fieldValues,
					seriesMode:
						!selectedTemplate.allowsSeries || seriesChoice === NO_SERIES_VALUE
							? "none"
							: seriesChoice === NEW_SERIES_VALUE
								? "new"
								: "existing",
					seriesId:
						selectedTemplate.allowsSeries &&
						seriesChoice !== NEW_SERIES_VALUE &&
						seriesChoice !== NO_SERIES_VALUE
							? seriesChoice
							: null,
					seriesPartNo,
					newSeriesTitle,
					newSeriesDescription,
				}),
			});
			const body = (await response.json().catch(() => ({}))) as MutationResponse;
			if (!response.ok) {
				throw new Error(
					readMessage(
						body,
						mode === "edit"
							? "Failed to update content."
							: "Failed to create content.",
					),
				);
			}

			setDirty(false);
			onClose();
			if (memberManagePath) {
				router.push(memberManagePath);
			}
			router.refresh();
		} catch (submitError: unknown) {
			setError(
				submitError instanceof Error
					? submitError.message
					: mode === "edit"
						? "Failed to update content."
						: "Failed to create content.",
			);
		} finally {
			setSubmitting(false);
		}
	}

	if (!open) {
		return null;
	}

	const statusOptions =
		mode === "edit" ? STATUS_OPTIONS_EDIT : STATUS_OPTIONS_CREATE;
	const saveLabel = submitting
		? "Saving..."
		: mode === "edit"
			? "Save changes"
			: "Create";

	return (
		<Panel
			open={open}
			onClose={closePanel}
			width="100%"
			title={panelTitle(mode, meta)}
			showSave={!loading && Boolean(meta) && Boolean(selectedTemplate)}
			contentMaxWidthPx={1274}
			dirtyGuard={dirty}
			renderSave={() => (
				<Button
					type="button"
					variant="primary"
					onClick={() => void submit()}
					disabled={submitting || loading || !meta || !selectedTemplate}
					loading={submitting}
				>
					{saveLabel}
				</Button>
			)}
		>
			<div className="member-content-panel">
				{error ? (
					<AlertBanner
						tone="error"
						autoHideMs={0}
						className="member-content-panel__banner"
					>
						{error}
					</AlertBanner>
				) : null}

				{loading ? (
					<AlertBanner
						tone="info"
						autoHideMs={0}
						className="member-content-panel__banner"
					>
						Loading content form...
					</AlertBanner>
				) : null}

				{meta ? (
					<div className="member-content-panel__stack">
						<div className="member-content-panel__grid">
							<div className="member-content-panel__cell member-content-panel__cell--half">
								<div className="member-content-panel__field">
									<Label>Collection</Label>
									<ReadOnlyInput value={meta.collection.label} />
								</div>
							</div>
							<div className="member-content-panel__cell member-content-panel__cell--half">
								<div className="member-content-panel__field">
									<Label>Status</Label>
									<DropdownMenuSingle
										className="member-control-full"
										options={statusOptions}
										value={statusCode}
										onChange={(value) => {
											setStatusCode(
												value === "published" || value === "archived" ? value : "draft",
											);
											markDirty();
										}}
									/>
								</div>
							</div>
						</div>

						<div className="member-content-panel__grid">
							<div className="member-content-panel__cell member-content-panel__cell--half">
								<div className="member-content-panel__field">
									<Label>Template</Label>
									<DropdownMenuSingle
										className="member-control-full"
										options={templateOptions(meta.templates)}
										value={templateId}
										onChange={changeTemplate}
										placeholder="Select template"
										disabled={mode === "edit"}
									/>
								</div>
							</div>
							<div className="member-content-panel__cell member-content-panel__cell--half">
								<div className="member-content-panel__field">
									<Label>Title</Label>
									<Input
										value={title}
										onChange={(event) => {
											setTitle(event.currentTarget.value);
											markDirty();
										}}
										placeholder="Content title"
									/>
								</div>
							</div>
						</div>

						{selectedTemplate?.allowsSeries ? (
							<div className="member-content-panel__grid">
								<div className="member-content-panel__cell member-content-panel__cell--half">
									<div className="member-content-panel__field">
										<Label>Series</Label>
										<DropdownMenuSingle
											className="member-control-full"
											options={seriesOptions(meta.series)}
											value={seriesChoice}
											onChange={changeSeries}
											placeholder="Select series"
										/>
									</div>
								</div>
								{seriesChoice !== NO_SERIES_VALUE ? (
									<div className="member-content-panel__cell member-content-panel__cell--half">
										<div className="member-content-panel__field">
											<Label>Series Part</Label>
											<Input
												type="number"
												min={1}
												step={1}
												value={seriesPartNo}
												onChange={(event) => {
													setSeriesPartNo(event.currentTarget.value);
													markDirty();
												}}
											/>
										</div>
									</div>
								) : null}
								{seriesChoice === NEW_SERIES_VALUE ? (
									<>
										<div className="member-content-panel__cell member-content-panel__cell--half">
											<div className="member-content-panel__field">
												<Label>New series title</Label>
												<Input
													value={newSeriesTitle}
													onChange={(event) => {
														setNewSeriesTitle(event.currentTarget.value);
														markDirty();
													}}
													placeholder="Series title"
												/>
											</div>
										</div>
										<div className="member-content-panel__cell member-content-panel__cell--half">
											<div className="member-content-panel__field">
												<Label>New series description</Label>
												<Textarea
													value={newSeriesDescription}
													onChange={(event) => {
														setNewSeriesDescription(event.currentTarget.value);
														markDirty();
													}}
													rows={3}
												/>
											</div>
										</div>
									</>
								) : null}
							</div>
						) : null}

						<div className="member-content-panel__grid">
							<div className="member-content-panel__cell">
								<div className="member-content-panel__field">
									<Label>Summary</Label>
									<Textarea
										value={summary}
										onChange={(event) => {
											setSummary(event.currentTarget.value);
											markDirty();
										}}
										placeholder="Short summary shown in collection cards"
										rows={4}
									/>
								</div>
							</div>
						</div>

						<div className="member-content-panel__fields">
							<ContentAuthoringWorkspace
								previewEndpoint="/api/me/content/preview"
								previewDraft={{
									contentId,
									templateId,
									title,
									summary,
									categorySlug: meta.collection.categorySlug,
									subcategorySlug: meta.collection.subcategorySlug,
									seriesId:
										selectedTemplate?.allowsSeries &&
										seriesChoice !== NEW_SERIES_VALUE &&
										seriesChoice !== NO_SERIES_VALUE
											? seriesChoice
											: null,
									seriesPartNo,
									fieldValues,
								}}
								fieldInputProps={{
									fields: selectedFields,
									fieldOptions: meta.fieldOptions,
									media: meta.media,
									values: fieldValues,
									categoryId: meta.collection.categoryId,
									subcategoryId: meta.collection.subcategoryId,
									editorSessionKey: `member-content:${mode}:${meta.collection.categoryId}:${meta.collection.subcategoryId}:${contentId ?? "new"}:${templateId}`,
									editorMediaContext: "member",
									onChange: (fieldId, value) => {
										setFieldValues((current) => ({ ...current, [fieldId]: value }));
										markDirty();
									},
								}}
							/>
						</div>
					</div>
				) : null}
			</div>
		</Panel>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
