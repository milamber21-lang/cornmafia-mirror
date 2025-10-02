// FILE: apps/web/src/components/ui/PanelForm.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Panel,
  AlertBanner,
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  Textarea,
  DropdownMenuSingle,
  DropdownMenuMulti,
  MoneyInput,
  Upload,
  ReadOnlyInput,
  ReadOnlyTextarea,
  ReadOnlyCheckbox,
} from "@/components/ui";
import FilePreview from "@/components/ui/basic-elements/FilePreview";
import type { Currency } from "@/components/ui/basic-elements/MoneyInput";

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
  validate?: (value: unknown, values: Values) => string | undefined;
  visible?: (values: Values) => boolean;
  helpText?: string;
};

export type FieldDefText = BaseFieldDef & { type: "text" };

export type FieldDefTextarea = BaseFieldDef & {
  type: "textarea";
  rows?: number;
};

/** Read-only view atoms */
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

/** file/image preview */
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
  mode?: "create" | "edit";
  defaultValues: Values;
  fields: FieldDef[];
  rows: RowDef[];
  onSubmit: (values: Values) => Promise<void> | void;
  onSaved?: () => void;
  submitting?: boolean;
  error?: string;
  dirtyGuard?: boolean;
}

/** Helpers */
function normalizeRow(row: RowDef): Required<RowCell>[] {
  const totalExplicit = row.reduce((sum, c) => sum + (c.span ?? 0), 0);
  const unspecified = row.filter((c) => !c.span).length;
  const remain = Math.max(0, 12 - totalExplicit);
  const auto = unspecified > 0 ? Math.max(1, Math.floor(remain / unspecified)) : 0;

  return row.map((c) => {
    const span = Math.min(12, Math.max(1, (c.span ?? auto) as number));
    return { field: c.field, span };
  });
}

const SPAN_CLASS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

export default function PanelForm({
  open,
  onClose,
  title,
  showSave = true,
  width = "50%",
  mode = "edit",
  defaultValues,
  fields,
  rows,
  onSubmit,
  onSaved,
  submitting = false,
  error = "",
  dirtyGuard = true,
}: PanelFormProps) {
  const [values, setValues] = useState<Values>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
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

  // Cleanup timers on unmount
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
    q: string
  ) {
    if (!field.loadOptions) return;
    const items = await field.loadOptions(q);
    setAsyncOptions((s) => ({ ...s, [field.name]: items }));
  }

  function debouncedLoadOptions(
    field: Extract<FieldDef, { type: "select-single" | "select-multi" }>,
    q: string
  ) {
    setQueryByField((s) => ({ ...s, [field.name]: q }));

    const timers = debounceTimersRef.current;
    const existing = timers[field.name];
    if (typeof existing === "number") clearTimeout(existing);

    timers[field.name] = window.setTimeout(() => {
      // fire and forget; errors handled inside field.loadOptions if needed
      void loadOptionsNow(field, q);
    }, DEBOUNCE_MS);
  }

  const CURRENCIES: readonly Currency[] = ["EUR", "USD", "ADA", "ETH", "BASE"] as const;
  function toCurrency(x: unknown, fallback: Currency = "EUR"): Currency {
    return CURRENCIES.includes(x as Currency) ? (x as Currency) : fallback;
  }

  function isFile(x: unknown): x is File {
    return typeof File !== "undefined" && x instanceof File;
  }

  /** Field renderer */
  function renderField(def: FieldDef) {
    const val = values[def.name];
    const visible = def.visible ? def.visible(values) : true;
    if (!visible) return null;

    switch (def.type) {
      case "text":
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <Input
              placeholder={def.placeholder}
              value={typeof val === "string" ? val : (val as string) ?? ""}
              onChange={(e) => setValue(def.name, e.target.value)}
              disabled={!!def.readOnly}
            />
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <Textarea
              placeholder={def.placeholder}
              rows={def.rows ?? 4}
              value={typeof val === "string" ? val : (val as string) ?? ""}
              onChange={(e) => setValue(def.name, e.target.value)}
              disabled={!!def.readOnly}
            />
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );

      case "checkbox": {
        const checked = Boolean(val);

        // a spacer that matches label height so the control lines up with other inputs
        const LabelSpacer = (
          <Label
            aria-hidden="true"
            className="opacity-0 pointer-events-none select-none"
          >
            &nbsp;
          </Label>
        );

        if (def.readOnly) {
          return (
            <div className="space-y-1.5 h-full flex flex-col">
              {LabelSpacer}
              <ReadOnlyCheckbox
                checked={checked}
                label={def.label ?? ""}
                size="md"
                className="w-full"
              />
              <FieldError message={fieldErrors[def.name]} />
            </div>
          );
        }

        return (
          <div className="space-y-1.5 h-full flex flex-col">
            {LabelSpacer}
            <Checkbox
              id={def.name}
              checked={checked}
              onChange={(e) => setValue(def.name, (e.target as HTMLInputElement).checked)}
              label={def.label ?? ""}
              size="md"
              block
              className="w-full"
            />
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );
      }

      case "readonly": {
        const formatted =
          typeof def.format === "function" ? def.format(val, values) : (val as React.ReactNode);
        const text =
          typeof formatted === "string" || typeof formatted === "number"
            ? String(formatted)
            : formatted;

        const wantsMultiline =
          def.multiline || (typeof text === "string" && text.includes("\n"));

        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            {wantsMultiline ? (
              <ReadOnlyTextarea
                value={typeof text === "string" ? text : undefined}
                rows={def.rows ?? 4}
              />
            ) : (
              <ReadOnlyInput value={typeof text === "string" ? text : undefined} />
            )}
          </div>
        );
      }

      case "money": {
        const currencyKey = def.currencyField ?? "currency";
        const amount = typeof val === "string" ? val : (val as string) ?? "";
        const currency = toCurrency(values[currencyKey], def.defaultCurrency ?? "EUR");
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <MoneyInput
              amount={amount}
              currency={currency}
              onAmountChange={(v: string) => setValue(def.name, v)}
              onCurrencyChange={(c: Currency) => setValue(currencyKey, c)}
              disabled={!!def.readOnly}
              className=""
            />
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );
      }

      case "select-single": {
        const base = typeof def.options === "function" ? def.options(values) : def.options ?? [];
        const loaded = asyncOptions[def.name] ?? [];
        const options = [...base, ...loaded];
        const disabled = !!def.readOnly || (def.isDisabled ? def.isDisabled(values) : false);
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <DropdownMenuSingle
              className="w-full"
              options={options}
              value={typeof val === "string" ? val : (val as string) ?? ""}
              onChange={(v: string) => setValue(def.name, v)}
              disabled={disabled}
            />
            {typeof def.loadOptions === "function" ? (
              <Input
                className="mt-2"
                placeholder="Search…"
                value={queryByField[def.name] ?? ""}
                onChange={(e) => debouncedLoadOptions(def, e.target.value)}
              />
            ) : null}
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );
      }

      case "select-multi": {
        const base = typeof def.options === "function" ? def.options(values) : def.options ?? [];
        const loaded = asyncOptions[def.name] ?? [];
        const options = [...base, ...loaded];
        const valueArray: unknown[] = Array.isArray(val) ? (val as unknown[]) : [];
        const disabled = !!def.readOnly || (def.isDisabled ? def.isDisabled(values) : false);
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <DropdownMenuMulti
              className="w-full"
              options={options}
              value={valueArray as string[]}
              onChange={(v: string[]) => setValue(def.name, v)}
              disabled={disabled}
            />
            {typeof def.loadOptions === "function" ? (
              <Input
                className="mt-2"
                placeholder="Search…"
                value={queryByField[def.name] ?? ""}
                onChange={(e) => debouncedLoadOptions(def, e.target.value)}
              />
            ) : null}
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );
      }

      case "upload": {
        const multiple = (def.multiple ?? false) === true;
        const disabled = !!def.readOnly;
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <Upload
              accept={def.accept}
              multiple={multiple}
              disabled={disabled}
              title={def.title ?? (multiple ? "Upload files" : "Upload file")}
              description={def.description ?? "Drag & drop or click to browse."}
              buttonText={def.buttonText ?? "Choose file"}
              selected={
                multiple
                  ? (Array.isArray(values[def.name]) ? (values[def.name] as File[]) : [])
                  : ((values[def.name] as File | null) ?? null)
              }
              onFilesSelected={(files) => {
                setValue(def.name, multiple ? files : files[0] ?? null);
              }}
            />
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );
      }

      case "preview": {
        const v = val;
        const file = isFile(v) ? v : null;
        const src = !file && typeof v === "string" ? v : null;

        const filename =
          (def.filenameField && typeof values[def.filenameField] === "string"
            ? (values[def.filenameField] as string)
            : file?.name) ?? null;
        const mimeType =
          (def.mimeTypeField && typeof values[def.mimeTypeField] === "string"
            ? (values[def.mimeTypeField] as string)
            : file?.type) ?? null;
        const sizeBytes =
          (def.sizeBytesField && typeof values[def.sizeBytesField] === "number"
            ? (values[def.sizeBytesField] as number)
            : file?.size) ?? null;
        const alt =
          (def.altField && typeof values[def.altField] === "string"
            ? (values[def.altField] as string)
            : filename ?? "") || "";
        const href =
          def.hrefField && typeof values[def.hrefField] === "string"
            ? (values[def.hrefField] as string)
            : src;

        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            <FilePreview
              file={file}
              src={src}
              filename={filename}
              mimeType={mimeType}
              sizeBytes={sizeBytes}
              alt={alt}
              width={def.width ?? 320}
              kind={def.kind}
              showMeta={def.showMeta ?? true}
              href={href ?? null}
              targetBlank={def.targetBlank ?? true}
            />
          </div>
        );
      }

      case "custom":
        return (
          <div className="space-y-1.5">
            {def.label ? <Label>{def.label}</Label> : null}
            {def.render({
              value: val,
              setValue: (v: unknown) => setValue(def.name, v),
              values,
              readOnly: !!def.readOnly,
            })}
            <FieldError message={fieldErrors[def.name]} />
          </div>
        );

      default:
        return null;
    }
  }

  const normalizedRows = rows.map(normalizeRow);

  return (
    <Panel
      open={open}
      onClose={onClose}
      width={width}
      title={title}
      showSave={showSave}
      dirtyGuard={dirtyGuard && dirty}
      renderSave={() => (
        <Button
          variant="green"
          onClick={handleSubmit}
          disabled={submitting}
          loading={submitting}
        >
          {submitting ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
        </Button>
      )}
    >
      {error ? <AlertBanner className="mb-4">{error}</AlertBanner> : null}

      <div className="space-y-4">
        {normalizedRows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-4">
            {row.map((cell, j) => {
              const def = fieldMap.get(cell.field);
              const spanClass = SPAN_CLASS[cell.span] ?? SPAN_CLASS[12];
              if (!def) return <div key={j} className={`${spanClass} min-w-0`} />;
              return (
                <div key={j} className={`${spanClass} min-w-0`}>
                  {renderField(def)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Panel>
  );
}
