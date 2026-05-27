//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ContentFieldInputs.tsx                                                ////
//// Language: TSX                                                                                                ////
//// Field-type-aware dynamic admin content inputs with centered selected-media preview rows                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

"use client";

import * as React from "react";

import RichTextEditor, {
	type RichTextEditorMediaContext,
} from "@/components/editors/richtext/RichTextEditor";
import type {
	RichTextEditorCanvasLayoutMode,
} from "@/components/editors/richtext/RichTextEditorTypes";
import FilePreview from "@/components/ui/basic-elements/FilePreview";
import {
	Checkbox,
	Input,
	Label,
	Textarea,
} from "@/components/ui";
import DropdownMenuSingle, {
	type SingleOption,
} from "@/components/ui/basic-elements/DropdownMenuSingle";
import {
	createEmptyRichTextJson,
	isRichTextJsonEmpty,
} from "@/lib/editors/richtext/rich-text-json";
import type {
	ContentMediaOption,
	ContentSeriesOption,
	ContentTemplateField,
	ContentTemplateFieldOption,
} from "@/lib/data/content";

type Values = Record<string, unknown>;

type ContentFieldInputsProps = {
	fields: ContentTemplateField[];
	fieldOptions: ContentTemplateFieldOption[];
	media: ContentMediaOption[];
	series?: ContentSeriesOption[];
	values: Values;
	categoryId: string;
	subcategoryId: string;
	editorSessionKey: string;
	editorMediaContext?: RichTextEditorMediaContext;
	onChange: (templateFieldId: string, value: unknown) => void;
	readOnly?: boolean;
};

function fieldId(field: ContentTemplateField): string {
	return String(field.templateFieldId);
}

function valueAsString(value: unknown): string {
	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	return "";
}

function valueAsBoolean(value: unknown): boolean {
	if (typeof value === "boolean") {
		return value;
	}

	if (typeof value === "string") {
		return value.trim().toLowerCase() === "true";
	}

	return false;
}

function optionsForField(
	field: ContentTemplateField,
	fieldOptions: ContentTemplateFieldOption[],
): SingleOption[] {
	return fieldOptions
		.filter((option) => option.fieldListId === field.fieldListId)
		.sort((left, right) => {
			if (left.displayOrder !== right.displayOrder) {
				return left.displayOrder - right.displayOrder;
			}

			return left.label.localeCompare(right.label);
		})
		.map((option) => ({
			value: option.optionKey,
			label: option.label,
		}));
}

function mediaOptions(rows: ContentMediaOption[]): SingleOption[] {
	return rows.map((row) => ({
		value: row.id,
		label: row.label,
	}));
}

function seriesOptions(rows: ContentSeriesOption[]): SingleOption[] {
	return rows.map((row) => ({
		value: row.id,
		label: row.subcategoryId === null
			? `${row.title} (category-level)`
			: row.title,
	}));
}

function isSeriesLatestField(field: ContentTemplateField): boolean {
	return (
		field.valueColumnName === "value_integer" &&
		field.fieldListCode === "series_latest_series_id"
	);
}

function classNames(...values: Array<string | undefined | false>): string {
	return values.filter((value): value is string => Boolean(value)).join(" ");
}

function fieldSpan(field: ContentTemplateField): string {
	if (
		field.valueColumnName === "value_long_text" ||
		field.valueColumnName === "value_rich_text_json" ||
		field.fieldTypeCode === "long_text" ||
		field.fieldTypeCode === "rich_text" ||
		field.fieldTypeCode === "youtube_url"
	) {
		return "admin-content-field--span-wide";
	}

	return "admin-content-field--span-default";
}

function hasRenderableInputValue(
	field: ContentTemplateField,
	value: unknown,
): boolean {
	if (value === null || typeof value === "undefined") {
		return false;
	}

	if (
		field.valueColumnName === "value_rich_text_json" ||
		field.fieldTypeCode === "rich_text"
	) {
		return !isRichTextJsonEmpty(value);
	}

	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	return true;
}

function isAsideDestination(field: ContentTemplateField): boolean {
	return (
		field.renderDestinationCode === "right" ||
		field.renderDestinationCode === "left"
	);
}

function getRichTextEditorCanvasLayoutMode(
	field: ContentTemplateField,
	hasRenderableAsideFields: boolean,
): RichTextEditorCanvasLayoutMode {
	if (isAsideDestination(field)) {
		return "aside";
	}

	if (field.renderDestinationCode === "main") {
		return hasRenderableAsideFields ? "main-with-aside" : "main-full";
	}

	return "full";
}

function EmptyFieldsMessage(): React.JSX.Element {
	return (
		<div className="admin-content-fields-empty-message">
			Select a template to show its fields.
		</div>
	);
}

function FieldLabel({ field }: { field: ContentTemplateField }): React.JSX.Element {
	return (
		<Label>
			{field.label}
			{field.isRequired ? " *" : ""}
			{field.isEnabled ? null : (
				<span className="admin-content-field-disabled-note">
					(saved disabled field)
				</span>
			)}
		</Label>
	);
}

function FieldShell({
	field,
	children,
}: {
	field: ContentTemplateField;
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<div className={classNames("admin-content-field-shell", fieldSpan(field))}>
			<FieldLabel field={field} />
			{children}
		</div>
	);
}

function findSelectedMedia(
	media: ContentMediaOption[],
	value: unknown,
): ContentMediaOption | null {
	const selectedMediaId = valueAsString(value).trim();
	if (selectedMediaId.length === 0) {
		return null;
	}

	return media.find((row) => row.id === selectedMediaId) ?? null;
}

function SelectedMediaPreviewRow({
	media,
}: {
	media: ContentMediaOption | null;
}): React.JSX.Element | null {
	if (!media) {
		return null;
	}

	return (
		<div className="media-selected-preview-row admin-content-field--span-wide">
			<FilePreview
				src={media.url}
				filename={media.originalFilename}
				mimeType={media.mimeType}
				sizeBytes={media.sizeBytes}
				alt={media.altText ?? media.originalFilename}
				width={280}
				showMeta
				href={media.url}
				targetBlank
			/>
		</div>
	);
}

export default function ContentFieldInputs({
	fields,
	fieldOptions,
	media,
	series = [],
	values,
	categoryId,
	subcategoryId,
	editorSessionKey,
	editorMediaContext = "admin",
	onChange,
	readOnly = false,
}: ContentFieldInputsProps): React.JSX.Element {
	if (fields.length === 0) {
		return <EmptyFieldsMessage />;
	}

	const hasRenderableAsideFields = fields.some((field) => {
		if (!isAsideDestination(field)) {
			return false;
		}

		return hasRenderableInputValue(field, values[fieldId(field)]);
	});

	return (
		<div className="admin-content-fields-grid">
			{fields.map((field) => {
				const id = fieldId(field);
				const value = values[id];
				const fieldReadOnly = readOnly || !field.isEnabled;

				if (field.valueColumnName === "value_text") {
					const isYoutubeField = field.fieldTypeCode === "youtube_url";

					return (
						<FieldShell key={id} field={field}>
							<Input
								type={isYoutubeField ? "url" : "text"}
								value={valueAsString(value)}
								onChange={(event) => onChange(id, event.target.value)}
								placeholder={
									isYoutubeField
										? "https://www.youtube.com/watch?v=..."
										: undefined
								}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_long_text") {
					return (
						<FieldShell key={id} field={field}>
							<Textarea
								value={valueAsString(value)}
								onChange={(event) => onChange(id, event.target.value)}
								rows={5}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (isSeriesLatestField(field)) {
					return (
						<FieldShell key={id} field={field}>
							<DropdownMenuSingle
								className="admin-content-field-select"
								options={seriesOptions(series)}
								value={valueAsString(value)}
								onChange={(nextValue) => onChange(id, nextValue)}
								placeholder={series.length === 0 ? "No series available" : "Select series"}
								disabled={fieldReadOnly || series.length === 0}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_integer") {
					return (
						<FieldShell key={id} field={field}>
							<Input
								type="number"
								step={1}
								value={valueAsString(value)}
								onChange={(event) => onChange(id, event.target.value)}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_numeric") {
					return (
						<FieldShell key={id} field={field}>
							<Input
								type="number"
								value={valueAsString(value)}
								onChange={(event) => onChange(id, event.target.value)}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_option_key") {
					return (
						<FieldShell key={id} field={field}>
							<DropdownMenuSingle
								className="admin-content-field-select"
								options={optionsForField(field, fieldOptions)}
								value={valueAsString(value)}
								onChange={(nextValue) => onChange(id, nextValue)}
								placeholder="Select option"
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_media_id") {
					const selectedMedia = findSelectedMedia(media, value);

					return (
						<React.Fragment key={id}>
							<FieldShell field={field}>
								<DropdownMenuSingle
									className="admin-content-field-select"
									options={mediaOptions(media)}
									value={valueAsString(value)}
									onChange={(nextValue) => onChange(id, nextValue)}
									placeholder="Select media"
									disabled={fieldReadOnly}
								/>
							</FieldShell>
							<SelectedMediaPreviewRow media={selectedMedia} />
						</React.Fragment>
					);
				}

				if (field.valueColumnName === "value_boolean") {
					return (
						<div key={id} className={fieldSpan(field)}>
							<div className="admin-content-field-checkbox-shell">
								<Checkbox
									checked={valueAsBoolean(value)}
									onChange={(event) =>
										onChange(id, event.currentTarget.checked)
									}
									label={`${field.label}${field.isRequired ? " *" : ""}`}
									block
									disabled={fieldReadOnly}
								/>
							</div>
						</div>
					);
				}

				if (field.valueColumnName === "value_date") {
					return (
						<FieldShell key={id} field={field}>
							<Input
								type="date"
								value={valueAsString(value).slice(0, 10)}
								onChange={(event) => onChange(id, event.target.value)}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_timestamp") {
					return (
						<FieldShell key={id} field={field}>
							<Input
								type="datetime-local"
								value={valueAsString(value).slice(0, 16)}
								onChange={(event) => onChange(id, event.target.value)}
								disabled={fieldReadOnly}
							/>
						</FieldShell>
					);
				}

				if (field.valueColumnName === "value_rich_text_json") {
					return (
						<FieldShell key={id} field={field}>
							<RichTextEditor
								value={value ?? createEmptyRichTextJson()}
								onChange={(nextValue) => onChange(id, nextValue)}
								categoryId={categoryId}
								subcategoryId={subcategoryId}
								readOnly={fieldReadOnly}
								editorSessionKey={`${editorSessionKey}:${id}`}
								allowedToolCodes={field.fieldToolCodes}
								mediaContext={editorMediaContext}
								canvasLayoutMode={getRichTextEditorCanvasLayoutMode(
									field,
									hasRenderableAsideFields,
								)}
							/>
						</FieldShell>
					);
				}

				return (
					<div
						key={id}
						className={classNames(
							"admin-content-field-unsupported",
							fieldSpan(field),
						)}
					>
						{field.label} uses unsupported field type {field.fieldTypeCode}.
					</div>
				);
			})}
		</div>
	);
}
