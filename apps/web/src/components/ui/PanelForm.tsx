//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/ui/PanelForm.tsx                                                               ////
//// Language: TSX                                                                                                 ////
//// Shared schema-driven panel form renderer for admin and utility surfaces                                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Panel from "./Panel";
import AlertBanner from "./basic-elements/AlertBanner";
import { Button } from "./basic-elements/Button";
import Checkbox from "./basic-elements/Checkbox";
import DateTimeInput from "./basic-elements/DateTimeInput";
import DropdownMenuMulti from "./basic-elements/DropdownMenuMulti";
import DropdownMenuSingle from "./basic-elements/DropdownMenuSingle";
import FieldError from "./basic-elements/FieldError";
import FilePreview from "./basic-elements/FilePreview";
import Input from "./basic-elements/Input";
import Label from "./basic-elements/Label";
import MoneyInput from "./basic-elements/MoneyInput";
import type { Currency } from "./basic-elements/MoneyInput";
import ReadOnlyCheckbox from "./basic-elements/ReadOnlyCheckbox";
import ReadOnlyInput from "./basic-elements/ReadOnlyInput";
import ReadOnlyTextarea from "./basic-elements/ReadOnlyTextarea";
import Textarea from "./basic-elements/Textarea";
import Upload from "./basic-elements/Upload";

/**
 * OPTION & FIELD TYPES
 */
export type Option = { value: string; label: string };
type Values = Record<string, unknown>;

type BaseFieldDef = {
	name: string;
	label?: string;
	placeholder?: string;
	readOnly?: boolean;
	isDisabled?: (values: Values) => boolean;
	validate?: (value: unknown, values: Values) => string | undefined;
	visible?: (values: Values) => boolean;
	helpText?: string;
};

export type FieldDefText = BaseFieldDef & { type: "text" };

export type FieldDefDate = BaseFieldDef & {
	type: "date";
	minValue?: string | null;
	maxValue?: string | null;
};

export type FieldDefDateTime = BaseFieldDef & {
	type: "datetime";
	minValue?: string | null;
	maxValue?: string | null;
	step?: number;
};

export type FieldDefTextarea = BaseFieldDef & {
	type: "textarea";
	rows?: number;
};

export type FieldDefReadonly = BaseFieldDef & {
	type: "readonly";
	multiline?: boolean;
	rows?: number;
	format?: (value: unknown, values: Values) => React.ReactNode;
};

export type FieldDefCheckbox = BaseFieldDef & { type: "checkbox" };

export type FieldDefMoney = BaseFieldDef & {
	type: "money";
	currencyField?: string;
	defaultCurrency?: Currency;
};

export type FieldDefSelectSingle = BaseFieldDef & {
	type: "select-single";
	options?: Option[] | ((values: Values) => Option[]);
	loadOptions?: (query: string) => Promise<Option[]>;
	isDisabled?: (values: Values) => boolean;
	allowClear?: boolean;
	clearLabel?: string;
	onChange?: (args: {
		value: string;
		values: Values;
		setValue: (name: string, v: unknown) => void;
	}) => void;
};

export type FieldDefSelectMulti = BaseFieldDef & {
	type: "select-multi";
	options?: Option[] | ((values: Values) => Option[]);
	loadOptions?: (query: string) => Promise<Option[]>;
	isDisabled?: (values: Values) => boolean;
};

export type FieldDefUpload = BaseFieldDef & {
	type: "upload";
	accept?: string;
	multiple?: boolean;
	buttonText?: string;
	title?: string;
	description?: string;
};

export type FieldDefPreview = BaseFieldDef & {
	type: "preview";
	width?: number;
	showMeta?: boolean;
	kind?: "image" | "file";
	filenameField?: string;
	mimeTypeField?: string;
	sizeBytesField?: string;
	altField?: string;
	hrefField?: string;
	targetBlank?: boolean;
};

export type FieldDefCustom = BaseFieldDef & {
	type: "custom";
	render: (args: {
		value: unknown;
		setValue: (v: unknown) => void;
		values: Values;
		readOnly: boolean;
	}) => React.ReactNode;
};

export type FieldDef =
	| FieldDefText
	| FieldDefDate
	| FieldDefDateTime
	| FieldDefTextarea
	| FieldDefCheckbox
	| FieldDefReadonly
	| FieldDefMoney
	| FieldDefSelectSingle
	| FieldDefSelectMulti
	| FieldDefUpload
	| FieldDefPreview
	| FieldDefCustom;

/**
 * LAYOUT
 */
export type RowCell = { field: string; span?: number };
export type RowDef = RowCell[];

export interface PanelFormProps {
	open: boolean;
	onClose: () => void;
	title: string;
	showSave?: boolean;
	width?: "25%" | "50%" | "75%" | "100%";
	contentMaxWidthPx?: number | null;
	mode?: "create" | "edit";
	defaultValues: Values;
	fields: FieldDef[];
	rows: RowDef[];
	onSubmit: (values: Values) => Promise<void> | void;
	onSaved?: () => void;
	submitting?: boolean;
	error?: string;
	metaError?: string;
	/** enable unsaved-changes guard (Panel confirm + beforeunload) */
	dirtyGuard?: boolean;
}

/** Helpers */
function normalizeRow(row: RowDef): Required<RowCell>[] {
	const totalExplicit = row.reduce((sum, c) => sum + (c.span ?? 0), 0);
	const unspecified = row.filter((c) => !c.span).length;
	const remain = Math.max(0, 12 - totalExplicit);
	const auto =
		unspecified > 0 ? Math.max(1, Math.floor(remain / unspecified)) : 0;

	return row.map((c) => {
		const span = Math.min(12, Math.max(1, (c.span ?? auto) as number));
		return { field: c.field, span };
	});
}

const SPAN_CLASS: Record<number, string> = {
	1: "panel-form-cell--span-1",
	2: "panel-form-cell--span-2",
	3: "panel-form-cell--span-3",
	4: "panel-form-cell--span-4",
	5: "panel-form-cell--span-5",
	6: "panel-form-cell--span-6",
	7: "panel-form-cell--span-7",
	8: "panel-form-cell--span-8",
	9: "panel-form-cell--span-9",
	10: "panel-form-cell--span-10",
	11: "panel-form-cell--span-11",
	12: "panel-form-cell--span-12",
};

function RenderField(props: {
	def: FieldDef;
	values: Values;
	setValue: (name: string, v: unknown) => void;
	fieldErrors: Record<string, string | undefined>;
	asyncOptions: Record<string, Option[]>;
	queryByField: Record<string, string>;
	debouncedLoadOptions: (
		field: Extract<FieldDef, { type: "select-single" | "select-multi" }>,
		q: string,
	) => void;
}) {
	const {
		def,
		values,
		setValue,
		fieldErrors,
		asyncOptions,
		queryByField,
		debouncedLoadOptions,
	} = props;

	const val = values[def.name];
	const visible = def.visible ? def.visible(values) : true;
	if (!visible) return null;

	const disabled =
		!!def.readOnly ||
		(typeof def.isDisabled === "function" ? def.isDisabled(values) : false);

	const CURRENCIES: readonly Currency[] = [
		"EUR",
		"USD",
		"ADA",
		"ETH",
		"BASE",
	] as const;
	function toCurrency(x: unknown, fallback: Currency = "EUR"): Currency {
		return CURRENCIES.includes(x as Currency) ? (x as Currency) : fallback;
	}

	function isFile(x: unknown): x is File {
		return typeof File !== "undefined" && x instanceof File;
	}

	switch (def.type) {
		case "text":
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					<Input
						placeholder={def.placeholder}
						value={typeof val === "string" ? val : ((val as string) ?? "")}
						onChange={(e) => setValue(def.name, e.target.value)}
						disabled={disabled}
					/>
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);

		case "date":
		case "datetime": {
			const ddef = def as FieldDefDate | FieldDefDateTime;
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					<DateTimeInput
						mode={def.type === "date" ? "date" : "datetime"}
						placeholder={def.placeholder}
						value={typeof val === "string" ? val : null}
						onChange={(nextValue) => setValue(def.name, nextValue)}
						disabled={disabled}
						minValue={ddef.minValue}
						maxValue={ddef.maxValue}
						step={"step" in ddef ? ddef.step : undefined}
					/>
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);
		}
		case "textarea":
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					<Textarea
						placeholder={def.placeholder}
						rows={(def as FieldDefTextarea).rows ?? 4}
						value={typeof val === "string" ? val : ((val as string) ?? "")}
						onChange={(e) => setValue(def.name, e.target.value)}
						disabled={disabled}
					/>
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);

		case "checkbox": {
			const checked = Boolean(val);

			const LabelSpacer = (
				<Label aria-hidden="true" className="panel-form-label-spacer">
					&nbsp;
				</Label>
			);

			if (def.readOnly) {
				return (
					<div className="panel-form-field panel-form-field--checkbox">
						{LabelSpacer}
						<ReadOnlyCheckbox
							checked={checked}
							label={def.label ?? ""}
							size="md"
							className="panel-form-control-full"
						/>
						<FieldError message={fieldErrors[def.name]} />
					</div>
				);
			}

			return (
				<div className="panel-form-field panel-form-field--checkbox">
					{LabelSpacer}
					<Checkbox
						id={def.name}
						checked={checked}
						onChange={(e) =>
							setValue(def.name, (e.target as HTMLInputElement).checked)
						}
						label={def.label ?? ""}
						size="md"
						block
						className="panel-form-control-full"
						disabled={disabled}
					/>
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);
		}

		case "readonly": {
			const rdef = def as FieldDefReadonly;
			const formatted =
				typeof rdef.format === "function"
					? rdef.format(val, values)
					: (val as React.ReactNode);
			const text =
				typeof formatted === "string" || typeof formatted === "number"
					? String(formatted)
					: formatted;
			const wantsMultiline =
				rdef.multiline || (typeof text === "string" && text.includes("\n"));
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					{wantsMultiline ? (
						<ReadOnlyTextarea
							value={typeof text === "string" ? text : undefined}
							rows={rdef.rows ?? 4}
						/>
					) : (
						<ReadOnlyInput value={typeof text === "string" ? text : undefined} />
					)}
				</div>
			);
		}

		case "money": {
			const mdef = def as FieldDefMoney;
			const currencyKey = mdef.currencyField ?? "currency";
			const amount = typeof val === "string" ? val : ((val as string) ?? "");
			const currency = toCurrency(
				values[currencyKey],
				mdef.defaultCurrency ?? "EUR",
			);
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					<MoneyInput
						amount={amount}
						currency={currency}
						onAmountChange={(v: string) => setValue(def.name, v)}
						onCurrencyChange={(c: Currency) => setValue(currencyKey, c)}
						disabled={disabled}
						className=""
					/>
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);
		}

		case "select-single": {
			const sdef = def as FieldDefSelectSingle;
			const base =
				typeof sdef.options === "function"
					? sdef.options(values)
					: (sdef.options ?? []);
			const loaded = asyncOptions[sdef.name] ?? [];
			const options = [...base, ...loaded];
			return (
				<div className="panel-form-field">
					{sdef.label ? <Label>{sdef.label}</Label> : null}
					<DropdownMenuSingle
						className="panel-form-control-full"
						options={options}
						value={typeof val === "string" ? val : ((val as string) ?? "")}
						allowClear={sdef.allowClear === true}
						clearLabel={sdef.clearLabel}
						onChange={(v: string) => {
							setValue(sdef.name, v);
							if (typeof sdef.onChange === "function") {
								sdef.onChange({ value: v, values, setValue });
							}
						}}
						disabled={disabled}
					/>
					{typeof sdef.loadOptions === "function" ? (
						<Input
							className="panel-form-async-search"
							placeholder="Search..."
							value={queryByField[sdef.name] ?? ""}
							onChange={(e) => debouncedLoadOptions(sdef, e.target.value)}
							disabled={disabled}
						/>
					) : null}
					<FieldError message={fieldErrors[sdef.name]} />
				</div>
			);
		}

		case "select-multi": {
			const mdef = def as FieldDefSelectMulti;
			const base =
				typeof mdef.options === "function"
					? mdef.options(values)
					: (mdef.options ?? []);
			const loaded = asyncOptions[mdef.name] ?? [];
			const options = [...base, ...loaded];
			const valueArray: unknown[] = Array.isArray(val) ? (val as unknown[]) : [];
			return (
				<div className="panel-form-field">
					{mdef.label ? <Label>{mdef.label}</Label> : null}
					<DropdownMenuMulti
						className="panel-form-control-full"
						options={options}
						value={valueArray as string[]}
						onChange={(v: string[]) => setValue(mdef.name, v)}
						disabled={disabled}
					/>
					{typeof mdef.loadOptions === "function" ? (
						<Input
							className="panel-form-async-search"
							placeholder="Search..."
							value={queryByField[mdef.name] ?? ""}
							onChange={(e) => debouncedLoadOptions(mdef, e.target.value)}
							disabled={disabled}
						/>
					) : null}
					<FieldError message={fieldErrors[mdef.name]} />
				</div>
			);
		}

		case "upload": {
			const udef = def as FieldDefUpload;
			const multiple = (udef.multiple ?? false) === true;
			return (
				<div className="panel-form-field">
					{udef.label ? <Label>{udef.label}</Label> : null}
					<Upload
						accept={udef.accept}
						multiple={multiple}
						disabled={disabled}
						title={udef.title ?? (multiple ? "Upload files" : "Upload file")}
						description={udef.description ?? "Drag & drop or click to browse."}
						buttonText={udef.buttonText ?? "Choose file"}
						selected={
							multiple
								? Array.isArray(values[udef.name])
									? (values[udef.name] as File[])
									: []
								: ((values[udef.name] as File | null) ?? null)
						}
						onFilesSelected={(files) => {
							if (disabled) return;
							setValue(udef.name, multiple ? files : (files[0] ?? null));
						}}
					/>
					<FieldError message={fieldErrors[udef.name]} />
				</div>
			);
		}

		case "preview": {
			const pdef = def as FieldDefPreview;
			const v = val;
			const file = isFile(v) ? v : null;
			const src = !file && typeof v === "string" ? v : null;

			const filename =
				(pdef.filenameField && typeof values[pdef.filenameField] === "string"
					? (values[pdef.filenameField] as string)
					: file?.name) ?? null;
			const mimeType =
				(pdef.mimeTypeField && typeof values[pdef.mimeTypeField] === "string"
					? (values[pdef.mimeTypeField] as string)
					: file?.type) ?? null;
			const sizeBytes =
				(pdef.sizeBytesField && typeof values[pdef.sizeBytesField] === "number"
					? (values[pdef.sizeBytesField] as number)
					: file?.size) ?? null;
			const alt =
				(pdef.altField && typeof values[pdef.altField] === "string"
					? (values[pdef.altField] as string)
					: (filename ?? "")) || "";
			const href =
				pdef.hrefField && typeof values[pdef.hrefField] === "string"
					? (values[pdef.hrefField] as string)
					: src;

			return (
				<div className="panel-form-field">
					{pdef.label ? <Label>{pdef.label}</Label> : null}
					<FilePreview
						file={file}
						src={href ?? undefined}
						filename={filename ?? undefined}
						mimeType={mimeType ?? undefined}
						sizeBytes={sizeBytes ?? undefined}
						alt={alt}
						width={pdef.width ?? 320}
						kind={pdef.kind}
						showMeta={pdef.showMeta ?? true}
						href={href ?? null}
						targetBlank={pdef.targetBlank ?? true}
					/>
				</div>
			);
		}

		case "custom":
			return (
				<div className="panel-form-field">
					{def.label ? <Label>{def.label}</Label> : null}
					{(def as FieldDefCustom).render({
						value: val,
						setValue: (v: unknown) => setValue(def.name, v),
						values,
						readOnly: disabled,
					})}
					<FieldError message={fieldErrors[def.name]} />
				</div>
			);

		default:
			return null;
	}
}

/**
 * PanelForm (Panel owns the single scrollbar)
 * - Tracks dirtiness
 * - Passes dirtyGuard && dirty to Panel for confirm-on-close
 * - Adds window.beforeunload guard while dirty
 */
export default function PanelForm({
	open,
	onClose,
	title,
	showSave = true,
	width = "50%",
	contentMaxWidthPx = null,
	mode = "edit",
	defaultValues,
	fields,
	rows,
	onSubmit,
	onSaved,
	submitting = false,
	error = "",
	metaError = "",
	dirtyGuard = true,
}: PanelFormProps) {
	const [values, setValues] = useState<Values>({});
	const [fieldErrors, setFieldErrors] = useState<
		Record<string, string | undefined>
	>({});
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (!open) return;
		setValues({ ...(defaultValues ?? {}) });
		setFieldErrors({});
		setDirty(false);
	}, [open, defaultValues]);

	const fieldMap = useMemo(() => {
		const map = new Map<string, FieldDef>();
		for (const f of fields) map.set(f.name, f);
		return map;
	}, [fields]);

	function runValidation(next: Values): boolean {
		const errs: Record<string, string | undefined> = {};
		for (const f of fields) {
			if (f.visible && !f.visible(next)) continue;
			if (typeof f.validate === "function") {
				errs[f.name] = f.validate(next[f.name], next);
			}
		}
		setFieldErrors(errs);
		return Object.values(errs).every((m) => !m);
	}

	async function handleSubmit() {
		const ok = runValidation(values);
		if (!ok) return;
		await onSubmit(values);
		onSaved?.();
		setDirty(false);
	}

	function setValue(name: string, v: unknown) {
		setValues((prev) => {
			const next = { ...prev, [name]: v };
			if (!dirty) setDirty(true);
			return next;
		});
	}

	// Async options for selects (with 250ms debounce)
	const [queryByField, setQueryByField] = useState<Record<string, string>>({});
	const [asyncOptions, setAsyncOptions] = useState<Record<string, Option[]>>({});

	const debounceTimersRef = useRef<Record<string, number | undefined>>({});
	const DEBOUNCE_MS = 250;

	useEffect(() => {
		return () => {
			const timers = debounceTimersRef.current;
			for (const k of Object.keys(timers)) {
				const t = timers[k];
				if (typeof t === "number") clearTimeout(t);
			}
			debounceTimersRef.current = {};
		};
	}, []);

	async function loadOptionsNow(
		field: Extract<FieldDef, { type: "select-single" | "select-multi" }>,
		q: string,
	) {
		if (!field.loadOptions) return;
		const items = await field.loadOptions(q);
		setAsyncOptions((s) => ({ ...s, [field.name]: items }));
	}

	function debouncedLoadOptions(
		field: Extract<FieldDef, { type: "select-single" | "select-multi" }>,
		q: string,
	) {
		setQueryByField((s) => ({ ...s, [field.name]: q }));

		const timers = debounceTimersRef.current;
		const existing = timers[field.name];
		if (typeof existing === "number") clearTimeout(existing);

		timers[field.name] = window.setTimeout(() => {
			void loadOptionsNow(field, q);
		}, DEBOUNCE_MS);
	}

	const normalizedRows = rows.map(normalizeRow);

	function isFieldVisible(def: FieldDef | undefined): boolean {
		if (!def) return true;
		return def.visible ? def.visible(values) : true;
	}

	// ===== beforeunload guard for browser/tab close while dirty =====
	useEffect(() => {
		if (!dirtyGuard || !dirty) return;

		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = ""; // Chrome requires returnValue to be set
		};

		window.addEventListener("beforeunload", onBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", onBeforeUnload);
		};
	}, [dirtyGuard, dirty]);

	return (
		<Panel
			open={open}
			onClose={onClose}
			width={width}
			title={title}
			showSave={showSave}
			dirtyGuard={dirtyGuard && dirty}
			contentMaxWidthPx={contentMaxWidthPx}
			renderSave={() => (
				<Button
					variant="primary"
					onClick={handleSubmit}
					disabled={submitting}
					loading={submitting}
				>
					{submitting ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
				</Button>
			)}
		>
			<div className="panel-form-shell">
				{error ? (
					<AlertBanner tone="error" autoHideMs={0} className="panel-form-banner">
						{error}
					</AlertBanner>
				) : null}

				{metaError ? (
					<AlertBanner tone="error" autoHideMs={0} className="panel-form-banner">
						{metaError}
					</AlertBanner>
				) : null}

				<div className="panel-form-body">
					<div className="panel-form-rows">
						{normalizedRows.map((row, i) => {
							const visibleCells = row.filter((cell) =>
								isFieldVisible(fieldMap.get(cell.field)),
							);
							if (visibleCells.length === 0) return null;

							return (
								<div key={i} className="panel-form-row">
									{visibleCells.map((cell, j) => {
										const def = fieldMap.get(cell.field);
										const spanClass = SPAN_CLASS[cell.span] ?? SPAN_CLASS[12];
										if (!def)
											return <div key={j} className={`panel-form-cell ${spanClass}`} />;
										return (
											<div key={j} className={`panel-form-cell ${spanClass}`}>
												<RenderField
													def={def}
													values={values}
													setValue={setValue}
													fieldErrors={fieldErrors}
													asyncOptions={asyncOptions}
													queryByField={queryByField}
													debouncedLoadOptions={debouncedLoadOptions}
												/>
											</div>
										);
									})}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</Panel>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
