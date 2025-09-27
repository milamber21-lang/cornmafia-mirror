// FILE: apps/web/src/components/admin/media/MediaPanel.tsx
// Language: TSX
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PanelForm, {
  type FieldDef,
  type RowDef,
  type Option,
} from "@/components/ui/PanelForm";

/** ---------- Types ---------- */
type MediaDetail = {
  id: string;
  alt: string;
  url?: string | null;
  category?: string | null;
  subcategory?: string | null;
  userDiscordId?: string | null;
  ownerUsername?: string | null; // NEW
  ownerGlobalName?: string | null; // NEW
  filename?: string | null;
  credit?: string | null;
  tags?: Array<{ value: string }>;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  shared?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CategoriesProps = {
  categories?: Array<{ value: string; label: string }>;
  subcategories?: Array<{ value: string; label: string; categoryId: string }>;
};

type Values = Record<string, unknown>;

/** Narrower shape for API error envelope coming from /api/admin/media/upload */
type ApiErrorEnvelope = {
  ok?: boolean;
  code?: string;
  message?: string;
  traceId?: string;
  details?: unknown;
};

/** ---------- Simple module-level cache for meta ---------- */
type RawMeta = {
  categories: Array<{ id: string; name: string }>;
  subcategories: Array<{ id: string; name: string; category: string }>;
};
const metaCache: { data: RawMeta | null } = { data: null };

/** ---------- Utils ---------- */
function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}
function asString(x: unknown, fallback = ""): string {
  return isNonEmptyString(x) ? x : fallback;
}
function isFile(x: unknown): x is File {
  return typeof File !== "undefined" && x instanceof File;
}
function formatKb(bytes?: number | null): string {
  if (typeof bytes !== "number" || !isFinite(bytes) || bytes < 0) return "—";
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} kB`;
}

/** ---------- Component ---------- */
export default function MediaPanel() {
  const sp = useSearchParams();
  const router = useRouter();

  const mode = sp.get("mediaPanel"); // "upload" | "detail" | null
  const id = sp.get("id"); // for detail
  const isOpen = mode === "upload" || (mode === "detail" && !!id);

  const [detail, setDetail] = React.useState<MediaDetail | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  const [cats, setCats] = React.useState<CategoriesProps>({
    categories: [],
    subcategories: [],
  });

  const [topError, setTopError] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Derived (labels)
  const [categoryName, setCategoryName] = React.useState<string>("");
  const [subcategoryName, setSubcategoryName] = React.useState<string>("");

  function closePanel() {
    setTopError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("mediaPanel");
    url.searchParams.delete("id");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  }

  function closePanelAndReloadTable() {
    const url = new URL(window.location.href);
    url.searchParams.delete("mediaPanel");
    url.searchParams.delete("id");
    setTopError("");
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
    try {
      window.dispatchEvent(new CustomEvent("media:reload"));
    } catch {}
  }

  React.useEffect(() => {
    if (isOpen) setTopError("");
    if (!isOpen) setTopError("");
  }, [mode, id, isOpen]);

  /** Load DETAIL item (normalized + ownerUsername from server) */
  React.useEffect(() => {
    let active = true;
    async function run() {
      if (mode === "detail" && id) {
        setLoading(true);
        try {
          const u = new URL("/api/admin/media", window.location.origin);
          u.searchParams.set("id", id);
          const res = await fetch(u.toString(), { credentials: "include" });
          if (!res.ok) throw new Error("Failed");
          const raw = (await res.json()) as { item: Record<string, unknown> };
          const it = raw.item ?? {};

          const categoryId =
            typeof it["category"] === "string"
              ? (it["category"] as string)
              : typeof it["categoryId"] === "string"
              ? (it["categoryId"] as string)
              : null;
          const subcategoryId =
            typeof it["subcategory"] === "string"
              ? (it["subcategory"] as string)
              : typeof it["subcategoryId"] === "string"
              ? (it["subcategoryId"] as string)
              : null;

          const mimeType =
            typeof it["mimeType"] === "string"
              ? (it["mimeType"] as string)
              : typeof it["mime_type"] === "string"
              ? (it["mime_type"] as string)
              : null;

          const sizeBytes =
            typeof it["sizeBytes"] === "number" ? (it["sizeBytes"] as number) : null;

          const shared =
            typeof it["shared"] === "boolean" ? (it["shared"] as boolean) : null;

          const normalized: MediaDetail = {
            id: String(it["id"] ?? id),
            alt: typeof it["alt"] === "string" ? (it["alt"] as string) : "",
            url: typeof it["url"] === "string" ? (it["url"] as string) : null,
            category: categoryId,
            subcategory: subcategoryId,
            userDiscordId:
              typeof it["userDiscordId"] === "string" ? (it["userDiscordId"] as string) : null,
            ownerUsername:
              typeof it["ownerUsername"] === "string" ? (it["ownerUsername"] as string) : null,
            ownerGlobalName:
              typeof it["ownerGlobalName"] === "string" ? (it["ownerGlobalName"] as string) : null,
            filename: typeof it["filename"] === "string" ? (it["filename"] as string) : null,
            width: typeof it["width"] === "number" ? (it["width"] as number) : null,
            height: typeof it["height"] === "number" ? (it["height"] as number) : null,
            sizeBytes,
            shared,
            mimeType,
            createdAt: typeof it["createdAt"] === "string" ? (it["createdAt"] as string) : null,
            updatedAt: typeof it["updatedAt"] === "string" ? (it["updatedAt"] as string) : null,
          };

          if (active) setDetail(normalized);
        } catch {
          if (active) setDetail(null);
        } finally {
          if (active) setLoading(false);
        }
      } else {
        setDetail(null);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [mode, id]);

  /** Load meta (cached) */
  React.useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        if (!metaCache.data) {
          const res = await fetch("/api/admin/media?meta=all", { credentials: "include" });
          const json = (await res.json()) as RawMeta;
          metaCache.data = {
            categories: Array.isArray(json?.categories) ? json.categories : [],
            subcategories: Array.isArray(json?.subcategories) ? json.subcategories : [],
          };
        }
        if (!active || !metaCache.data) return;

        const catOpts: Option[] = metaCache.data.categories
          .map((c) => (c.id ? { value: String(c.id), label: c.name || String(c.id) } : null))
          .filter(Boolean) as Option[];

        const subOpts = metaCache.data.subcategories
          .map((s) => {
            const id = String(s.id || "");
            const name = s.name || id;
            const parentRaw = String(s.category || "");
            return id ? { value: id, label: name, categoryId: parentRaw } : null;
          })
          .filter(Boolean) as Array<{ value: string; label: string; categoryId: string }>;

        setCats({ categories: catOpts, subcategories: subOpts });
      } catch {
        if (!active) return;
        setCats({ categories: [], subcategories: [] });
      }
    }
    if (isOpen) loadOptions();
    return () => {
      active = false;
    };
  }, [isOpen]);

  /** Resolve category/subcategory labels */
  React.useEffect(() => {
    if (!detail) {
      setCategoryName("");
      setSubcategoryName("");
      return;
    }
    const catLabel =
      cats.categories?.find((c) => String(c.value) === String(detail.category ?? ""))?.label ?? "";
    const subLabel =
      cats.subcategories?.find((s) => String(s.value) === String(detail.subcategory ?? ""))?.label ?? "";
    setCategoryName(catLabel);
    setSubcategoryName(subLabel);
  }, [detail, cats.categories, cats.subcategories]);

  /** ---------- DETAIL (read-only) ---------- */
  const detailDefaults: Values = React.useMemo(() => {
    if (!detail) return {};
    const owner =
      (detail.ownerUsername && detail.ownerUsername.trim()) ||
      (detail.ownerGlobalName && detail.ownerGlobalName.trim()) ||
      (detail.userDiscordId ?? "") ||
      "";

    return {
      alt: detail.alt ?? "",
      category: categoryName || "—",
      subcategory: subcategoryName || "—",
      filename: detail.filename ?? "",
      owner,
      dimensions: detail.width && detail.height ? `${detail.width} × ${detail.height}` : "—",
      mimeType: detail.mimeType ?? "",
      shared: Boolean(detail.shared),
      sizeKb: formatKb(detail.sizeBytes ?? null),
      createdAt: detail.createdAt ?? "",
      updatedAt: detail.updatedAt ?? "",
      url: detail.url ?? "",
      tags: Array.isArray(detail.tags) ? detail.tags.map((t) => t.value).join(", ") : "",
      _filename: detail.filename ?? "",
      _mimeType: detail.mimeType ?? "",
      _sizeBytes: detail.sizeBytes ?? undefined,
      _url: detail.url ?? "",
    };
  }, [detail, categoryName, subcategoryName]);

  const detailFields: FieldDef[] = React.useMemo(() => {
    return [
      { type: "readonly", name: "alt", label: "Alt" },
      { type: "readonly", name: "category", label: "Category" },
      { type: "readonly", name: "subcategory", label: "Subcategory" },
      { type: "readonly", name: "filename", label: "Filename" },
      { type: "readonly", name: "owner", label: "Owner" },
      { type: "readonly", name: "dimensions", label: "Dimensions" },
      { type: "readonly", name: "mimeType", label: "Type" },
      { type: "checkbox", name: "shared", label: "Shared", readOnly: true },
      { type: "readonly", name: "sizeKb", label: "Size" },
      { type: "readonly", name: "createdAt", label: "Created" },
      { type: "readonly", name: "updatedAt", label: "Updated" },
      { type: "readonly", name: "url", label: "URL" },
      { type: "readonly", name: "tags", label: "Tags" },
      {
        type: "preview",
        name: "_url",
        label: "Preview",
        width: 360,
        showMeta: true,
        filenameField: "_filename",
        mimeTypeField: "_mimeType",
        sizeBytesField: "_sizeBytes",
        hrefField: "_url",
        targetBlank: true,
        kind: "image",
      },
    ];
  }, []);

  const detailRows: RowDef[] = React.useMemo(() => {
    return [
      [{ field: "alt" }],
      [{ field: "category", span: 6 }, { field: "subcategory", span: 6 }],
      [{ field: "filename", span: 6 }, { field: "owner", span: 6 }],
      [
        { field: "dimensions", span: 4 },
        { field: "mimeType", span: 4 },
        { field: "shared", span: 2 },
        { field: "sizeKb", span: 2 },
      ],
      [{ field: "createdAt", span: 6 }, { field: "updatedAt", span: 6 }],
      [{ field: "url" }],
      [{ field: "tags" }],
      [{ field: "_url" }],
    ];
  }, []);

  /** ---------- UPLOAD (form) ---------- */
  const uploadDefaults: Values = React.useMemo(
    () => ({ alt: "", category: "", subcategory: "", shared: true, file: null }),
    [],
  );

  const subBelongsToCat = React.useCallback(
    (catId: string, subId: string): boolean => {
      if (!catId || !subId) return false;
      const sc = (cats.subcategories ?? []).find((s) => String(s.value) === String(subId));
      return !!sc && String(sc.categoryId) === String(catId);
    },
    [cats.subcategories],
  );

  const uploadFields = React.useMemo<FieldDef[]>(() => {
    const categoryOptions: Option[] = [{ value: "", label: "—" }, ...(cats.categories ?? [])];

    return [
      {
        type: "text",
        name: "alt",
        label: "Alt (required)",
        placeholder: "Describe the image for accessibility",
        validate: (v) => (isNonEmptyString(v) ? undefined : "Alt is required."),
      },
      {
        type: "select-single",
        name: "category",
        label: "Category",
        options: categoryOptions,
      },
      {
        type: "select-single",
        name: "subcategory",
        label: "Subcategory",
        options: (values) => {
          const cat = asString(values.category);
          const filtered =
            (cats.subcategories ?? []).filter((s) => !cat || s.categoryId === cat) ?? [];
          const opts: Option[] = [
            { value: "", label: "—" },
            ...filtered.map((s) => ({ value: s.value, label: s.label })),
          ];
          return opts;
        },
        isDisabled: (values) => {
          const cat = asString(values.category);
          const filtered =
            (cats.subcategories ?? []).filter((s) => !cat || s.categoryId === cat) ?? [];
          return filtered.length === 0;
        },
      },
      { type: "checkbox", name: "shared", label: "Shared" },
      {
        type: "upload",
        name: "file",
        label: "File",
        accept: "image/*",
        multiple: false,
        title: "Upload image",
        description: "Drag & drop or click to browse.",
        buttonText: "Choose file",
        validate: (v) => (isFile(v) ? undefined : "Please choose a file to upload."),
      },
    ];
  }, [cats.categories, cats.subcategories]);

  const uploadRows: RowDef[] = React.useMemo(() => {
    return [
      [{ field: "alt" }],
      [{ field: "category", span: 5 }, { field: "subcategory", span: 5 }, { field: "shared", span: 2 }],
      [{ field: "file" }],
    ];
  }, []);

  /** Submit for upload (with cat/sub sanity check) */
  async function handleUpload(values: Values) {
    setTopError("");

    if (!isFile(values.file)) {
      setTopError("VALIDATION_REQUIRED");
      return;
    }
    if (!isNonEmptyString(values.alt)) {
      setTopError("VALIDATION_REQUIRED");
      return;
    }

    const cat = asString(values.category);
    let sub = asString(values.subcategory);
    const shared = Boolean(values.shared);

    if (isNonEmptyString(sub) && (!isNonEmptyString(cat) || !subBelongsToCat(cat, sub))) {
      sub = "";
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("file", values.file as File);
      fd.append("alt", values.alt as string);
      fd.append("shared", shared ? "true" : "false");
      if (isNonEmptyString(cat)) fd.append("category", cat);
      if (isNonEmptyString(sub)) fd.append("subcategory", sub);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        let code = "SERVER_ERROR";
        let msg = "";

        try {
          const data = (await res.json()) as ApiErrorEnvelope;
          if (data && typeof data === "object") {
            if (typeof data.code === "string" && data.code.trim()) code = data.code;
            if (typeof data.message === "string" && data.message.trim()) msg = data.message;
          }
        } catch {}

        setTopError(msg || code);
        setSubmitting(false);
        return;
      }

      setTopError("");
      setSubmitting(false);
      closePanelAndReloadTable();
      return;
    } catch {
      setTopError("NETWORK_UPSTREAM_FAILURE");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  if (mode === "detail") {
    return (
      <PanelForm
        open={isOpen}
        onClose={closePanel}
        title="Media details"
        width="50%"
        showSave={false}
        mode="edit"
        defaultValues={detailDefaults}
        fields={detailFields}
        rows={detailRows}
        onSubmit={() => undefined}
        onSaved={() => undefined}
        submitting={false}
        error={loading ? "" : topError || ""}
        dirtyGuard={false}
      />
    );
  }

  return (
    <PanelForm
      open={isOpen}
      onClose={closePanel}
      title="Upload media"
      width="50%"
      showSave={true}
      mode="create"
      defaultValues={uploadDefaults}
      fields={uploadFields}
      rows={uploadRows}
      onSubmit={handleUpload}
      onSaved={() => undefined}
      submitting={submitting}
      error={topError}
      dirtyGuard={false}
    />
  );
}
