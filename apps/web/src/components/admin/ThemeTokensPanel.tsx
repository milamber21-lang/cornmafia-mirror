// FILE: apps/web/src/components/admin/ThemeTokensPanel.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import PanelForm, { FieldDef, RowDef } from "@/components/ui/PanelForm";

type ThemeToken = {
  id: string | number;
  key: string;
  label: string;
  preview?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

export interface ThemeTokensPanelProps {
  open: boolean;
  mode: Mode;
  token?: ThemeToken | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ThemeTokensPanel({
  open,
  mode,
  token,
  onClose,
  onSaved,
}: ThemeTokensPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string>("");

  // Prefill values based on mode
  const defaults = useMemo(() => {
    if (mode === "edit" && token) {
      return {
        key: token.key ?? "",
        label: token.label ?? "",
        preview: token.preview ?? "",
        enabled: !!token.enabled,
      };
    }
    return {
      key: "",
      label: "",
      preview: "",
      enabled: true,
    };
  }, [mode, token]);

  // Field validation parity with previous implementation
  const fields: FieldDef[] = useMemo(() => {
    // moved inside to avoid changing deps on every render
    const keyPattern = /^[a-z0-9._-]{1,64}$/;

    return [
      {
        type: "text",
        name: "key",
        label: "Key",
        placeholder: "e.g., theme.primary",
        readOnly: mode === "edit", // was disabled during edit
        validate: (v) => {
          if (mode === "edit") return undefined; // only validate key on create
          const s = String(v ?? "").trim();
          if (!s) return "Key is required.";
          if (!keyPattern.test(s)) return "Use a-z, 0-9, dot, dash, underscore (max 64).";
          return undefined;
        },
      },
      {
        type: "text",
        name: "label",
        label: "Label",
        placeholder: "Human readable name",
        validate: (v) => {
          const s = String(v ?? "").trim();
          if (!s) return "Label is required.";
          return undefined;
        },
      },
      {
        type: "text",
        name: "preview",
        label: "Preview (any raw value)",
        placeholder: "#00ff88, --color-accent, var(--color-accent), or text",
        validate: (v) => {
          const s = String(v ?? "");
          if (s && s.startsWith("#")) {
            const hex6 = /^#[0-9a-fA-F]{6}$/;
            if (!hex6.test(s)) return "Color must be #rrggbb (6 hex digits).";
          }
          return undefined;
        },
      },
      {
        type: "checkbox",
        name: "enabled",
        label: "Enabled",
        readOnly: false,
      },
    ];
  }, [mode]);

  // Layout: Row 1 (Key), Row 2 (Label + Preview), Row 3 (Enabled)
  const rows: RowDef[] = useMemo(() => {
    return [
      [{ field: "key" }],
      [
        { field: "label", span: 6 },
        { field: "preview", span: 6 },
      ],
      [{ field: "enabled" }],
    ];
  }, []);

  async function handleSubmit(values: Values) {
    setTopError("");
    setSubmitting(true);
    try {
      const body =
        mode === "create"
          ? {
              op: "create",
              data: {
                key: String(values.key ?? "").trim(),
                label: String(values.label ?? "").trim(),
                preview:
                  values.preview != null && String(values.preview).trim() !== ""
                    ? String(values.preview).trim()
                    : null,
                enabled: Boolean(values.enabled),
              },
            }
          : {
              op: "update",
              id: token?.id,
              data: {
                label: String(values.label ?? "").trim(),
                preview:
                  values.preview != null && String(values.preview).trim() !== ""
                    ? String(values.preview).trim()
                    : null,
                enabled: Boolean(values.enabled),
              },
            };

      const res = await fetch("/api/admin/theme-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed (${res.status})`);
      }

      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save changes.";
      setTopError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const panelTitle = mode === "create" ? "Create Theme Token" : "Edit Theme Token";

  // Ensure we reset top error when the panel re-opens
  useEffect(() => {
    if (open) setTopError("");
  }, [open]);

  return (
    <PanelForm
      open={open}
      onClose={onClose}
      title={panelTitle}
      width="50%"             // default per spec, can be overridden by callers if needed
      showSave={true}         // Toggle off to hide Save entirely for read-only panels
      mode={mode}
      defaultValues={defaults}
      fields={fields}
      rows={rows}
      onSubmit={handleSubmit}
      onSaved={onSaved}
      submitting={submitting}
      error={topError}
      dirtyGuard={false}       // Yes per your decision
    />
  );
}
