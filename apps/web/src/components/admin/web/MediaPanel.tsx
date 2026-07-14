//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/MediaPanel.tsx                                                        ////
//// Language: TSX                                                                                                 ////
//// Admin media panel with separated metadata loading and normalized save lifecycle                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import * as React from "react";

import { AlertBanner } from "@/components/ui";
import PanelForm, {
	type FieldDef,
	type Option,
	type RowDef,
} from "@/components/ui/PanelForm";
import FilePreview from "@/components/ui/basic-elements/FilePreview";
import { compareAdminText } from "@/lib/helpers/admin-table-sorting";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Values = Record<string, unknown>;

type CategoryOption = {
	id: string;
	name: string;
};

type SubcategoryOption = {
	id: string;
	name: string;
	categoryId: string;
};

export type MediaPanelMode = "create" | "edit";

export interface MediaPanelProps {
	open: boolean;
	mode: MediaPanelMode;
	mediaId: string | null;
	categories: CategoryOption[];
	subcategories: SubcategoryOption[];
	onClose: () => void;
	onSaved: () => void;
}

type MediaDoc = {
	id: string;
	alt: string;
	credit: string;
	categoryId: string | null;
	subcategoryId: string | null;
	userDiscordId: string | null;
	ownerUsername: string | null;
	ownerGlobalName: string | null;
	shared: boolean;
	originalFilename: string;
	storedFilename: string;
	storageRelPath: string;
	mimeType: string;
	sizeBytes: number;
	width: number | null;
	height: number | null;
	url: string;
	createdAt: string;
	updatedAt: string;
};

type MediaDocResponse = {
	doc?: MediaDoc;
};

function asString(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function isFile(value: unknown): value is File {
	return typeof File !== "undefined" && value instanceof File;
}

function formatKb(sizeBytes: number): string {
	return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function buildOwnerLabel(doc: MediaDoc): string {
	if (doc.shared) {
		return "Shared";
	}

	if (
		typeof doc.ownerGlobalName === "string" &&
		doc.ownerGlobalName.trim().length > 0
	) {
		return doc.ownerGlobalName.trim();
	}

	if (
		typeof doc.ownerUsername === "string" &&
		doc.ownerUsername.trim().length > 0
	) {
		return doc.ownerUsername.trim();
	}

	if (
		typeof doc.userDiscordId === "string" &&
		doc.userDiscordId.trim().length > 0
	) {
		return doc.userDiscordId.trim();
	}

	return "—";
}

export default function MediaPanel({
	open,
	mode,
	mediaId,
	categories,
	subcategories,
	onClose,
	onSaved,
}: MediaPanelProps): React.JSX.Element | null {
	const [doc, setDoc] = React.useState<MediaDoc | null>(null);
	const [metaLoading, setMetaLoading] = React.useState(false);
	const [metaError, setMetaError] = React.useState("");
	const [submitting, setSubmitting] = React.useState(false);
	const [topError, setTopError] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setDoc(null);
			setMetaLoading(false);
			setMetaError("");
			setSubmitting(false);
			setTopError("");
			return;
		}

		setTopError("");
		setMetaError("");

		if (mode !== "edit" || mediaId === null) {
			setDoc(null);
			setMetaLoading(false);
			return;
		}

		const currentMediaId = mediaId;
		let active = true;

		async function loadDoc(): Promise<void> {
			setMetaLoading(true);
			setMetaError("");

			try {
				const response = await fetch(
					`/api/admin/web/media?id=${encodeURIComponent(currentMediaId)}`,
					{
						cache: "no-store",
						credentials: "include",
					},
				);
				if (!response.ok) {
					throw new Error(
						await readResponseMessage(response, "Failed to load media detail."),
					);
				}

				const payload = (await response.json()) as MediaDocResponse;
				if (!active) {
					return;
				}

				if (!payload.doc) {
					throw new Error("Media detail response did not include a document.");
				}

				setDoc(payload.doc);
			} catch (loadError: unknown) {
				if (active) {
					setDoc(null);
					setMetaError(
						loadError instanceof Error
							? loadError.message
							: "Failed to load media detail.",
					);
				}
			} finally {
				if (active) {
					setMetaLoading(false);
				}
			}
		}

		void loadDoc();

		return () => {
			active = false;
		};
	}, [mediaId, mode, open]);

	const uploadDefaults = React.useMemo<Values>(
		() => ({
			alt: "",
			credit: "",
			categoryId: "",
			subcategoryId: "",
			file: null,
			metaStatus: "",
		}),
		[],
	);

	const editDefaults = React.useMemo<Values>(() => {
		if (!doc) {
			return { metaStatus: "" };
		}

		return {
			id: doc.id,
			alt: doc.alt,
			credit: doc.credit,
			categoryId: doc.categoryId ?? "",
			subcategoryId: doc.subcategoryId ?? "",
			sharing: doc.shared ? "Shared" : "Owned",
			owner: buildOwnerLabel(doc),
			originalFilename: doc.originalFilename,
			storedFilename: doc.storedFilename,
			storageRelPath: doc.storageRelPath,
			mimeType: doc.mimeType,
			sizeKb: formatKb(doc.sizeBytes),
			dimensions: doc.width && doc.height ? `${doc.width} × ${doc.height}` : "—",
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
			previewUrl: doc.url,
			metaStatus: "",
		};
	}, [doc]);

	const buildCategoryOptions = React.useCallback((): Option[] => {
		return [
			{ value: "", label: "—" },
			...categories
				.slice()
				.sort((left, right) => compareAdminText(left.name, right.name))
				.map((row) => ({ value: row.id, label: row.name })),
		];
	}, [categories]);

	const metaStatusField = React.useMemo<FieldDef>(
		() => ({
			type: "custom",
			name: "metaStatus",
			visible: () => metaLoading || metaError.length > 0,
			render: () => {
				if (metaError.length > 0) {
					return <AlertBanner tone="error">{metaError}</AlertBanner>;
				}

				if (metaLoading) {
					return <AlertBanner tone="info">Loading media detail...</AlertBanner>;
				}

				return null;
			},
		}),
		[metaError, metaLoading],
	);

	const uploadFields = React.useMemo<FieldDef[]>(
		() => [
			metaStatusField,
			{
				type: "text",
				name: "alt",
				label: "Alt (required)",
				validate: (value) =>
					asString(value).trim().length > 0 ? undefined : "Alt is required.",
			},
			{
				type: "text",
				name: "credit",
				label: "Credit",
			},
			{
				type: "select-single",
				name: "categoryId",
				label: "Category",
				options: buildCategoryOptions(),
				onChange: ({ setValue }) => setValue("subcategoryId", ""),
			},
			{
				type: "select-single",
				name: "subcategoryId",
				label: "Subcategory",
				options: (values) => {
					const selectedCategoryId = asString(values.categoryId);
					return [
						{ value: "", label: selectedCategoryId ? "—" : "Select category first" },
						...subcategories
							.filter(
								(row) =>
									selectedCategoryId.length > 0 && row.categoryId === selectedCategoryId,
							)
							.sort((left, right) => compareAdminText(left.name, right.name))
							.map((row) => ({ value: row.id, label: row.name })),
					];
				},
			},
			{
				type: "upload",
				name: "file",
				label: "File",
				accept: "image/*,video/mp4,video/webm,.svg,.xml",
				multiple: false,
				buttonText: "Choose file",
				title: "Upload media",
				description: "Drag and drop or click to browse.",
				validate: (value) => (isFile(value) ? undefined : "Please choose a file."),
			},
		],
		[buildCategoryOptions, metaStatusField, subcategories],
	);

	const uploadRows = React.useMemo<RowDef[]>(
		() => [
			[{ field: "metaStatus", span: 12 }],
			[{ field: "alt" }],
			[{ field: "credit" }],
			[
				{ field: "categoryId", span: 6 },
				{ field: "subcategoryId", span: 6 },
			],
			[{ field: "file" }],
		],
		[],
	);

	const editFields = React.useMemo<FieldDef[]>(
		() => [
			metaStatusField,
			{
				type: "text",
				name: "alt",
				label: "Alt (required)",
				validate: (value) =>
					asString(value).trim().length > 0 ? undefined : "Alt is required.",
			},
			{ type: "text", name: "credit", label: "Credit" },
			{
				type: "select-single",
				name: "categoryId",
				label: "Category",
				options: buildCategoryOptions(),
				onChange: ({ setValue }) => setValue("subcategoryId", ""),
			},
			{
				type: "select-single",
				name: "subcategoryId",
				label: "Subcategory",
				options: (values) => {
					const selectedCategoryId = asString(values.categoryId);
					return [
						{ value: "", label: selectedCategoryId ? "—" : "Select category first" },
						...subcategories
							.filter(
								(row) =>
									selectedCategoryId.length > 0 && row.categoryId === selectedCategoryId,
							)
							.sort((left, right) => compareAdminText(left.name, right.name))
							.map((row) => ({ value: row.id, label: row.name })),
					];
				},
			},
			{ type: "readonly", name: "sharing", label: "Placement" },
			{ type: "readonly", name: "owner", label: "Owner" },
			{
				type: "readonly",
				name: "originalFilename",
				label: "Original filename",
			},
			{ type: "readonly", name: "storedFilename", label: "Stored filename" },
			{ type: "readonly", name: "storageRelPath", label: "Storage path" },
			{ type: "readonly", name: "mimeType", label: "MIME type" },
			{ type: "readonly", name: "sizeKb", label: "Size" },
			{ type: "readonly", name: "dimensions", label: "Dimensions" },
			{ type: "readonly", name: "createdAt", label: "Created" },
			{ type: "readonly", name: "updatedAt", label: "Updated" },
			{
				type: "custom",
				name: "preview",
				label: "Preview",
				readOnly: true,
				render: ({ values }) => (
					<div className="media-selected-preview-row">
						<FilePreview
							src={asString(values.previewUrl) || undefined}
							filename={asString(values.originalFilename) || undefined}
							alt={asString(values.alt)}
							mimeType={asString(values.mimeType) || undefined}
							width={320}
							showMeta
						/>
					</div>
				),
			},
		],
		[buildCategoryOptions, metaStatusField, subcategories],
	);

	const editRows = React.useMemo<RowDef[]>(
		() => [
			[{ field: "metaStatus", span: 12 }],
			[{ field: "alt" }],
			[{ field: "credit" }],
			[
				{ field: "categoryId", span: 6 },
				{ field: "subcategoryId", span: 6 },
			],
			[
				{ field: "sharing", span: 6 },
				{ field: "owner", span: 6 },
			],
			[
				{ field: "originalFilename", span: 6 },
				{ field: "storedFilename", span: 6 },
			],
			[{ field: "storageRelPath" }],
			[
				{ field: "mimeType", span: 4 },
				{ field: "sizeKb", span: 4 },
				{ field: "dimensions", span: 4 },
			],
			[
				{ field: "createdAt", span: 6 },
				{ field: "updatedAt", span: 6 },
			],
			[{ field: "preview" }],
		],
		[],
	);

	async function handleUpload(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			const file = values.file;
			if (!isFile(file)) {
				throw new Error("Please choose a file.");
			}

			const formData = new FormData();
			formData.set("file", file, file.name);
			formData.set("alt", asString(values.alt));
			formData.set("credit", asString(values.credit));
			formData.set("shared", "true");

			if (asString(values.categoryId).trim().length > 0) {
				formData.set("categoryId", asString(values.categoryId));
			}

			if (asString(values.subcategoryId).trim().length > 0) {
				formData.set("subcategoryId", asString(values.subcategoryId));
			}

			const response = await fetch("/api/admin/web/media", {
				method: "POST",
				body: formData,
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(await readResponseMessage(response, "Upload failed."));
			}
		} catch (uploadError: unknown) {
			const message =
				uploadError instanceof Error ? uploadError.message : "Upload failed.";
			setTopError(message);
			throw new Error(message);
		} finally {
			setSubmitting(false);
		}
	}

	async function handleUpdate(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			if (!doc) {
				throw new Error("Media detail is not loaded.");
			}

			const response = await fetch("/api/admin/web/media", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					op: "update",
					id: doc.id,
					data: {
						alt: asString(values.alt),
						credit: asString(values.credit),
						categoryId: asString(values.categoryId),
						subcategoryId: asString(values.subcategoryId),
					},
				}),
			});

			if (!response.ok) {
				throw new Error(await readResponseMessage(response, "Update failed."));
			}
		} catch (updateError: unknown) {
			const message =
				updateError instanceof Error ? updateError.message : "Update failed.";
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
			title={
				mode === "create"
					? "Upload media"
					: metaLoading
						? "Loading media..."
						: "Edit media"
			}
			width="50%"
			showSave={
				mode === "create"
					? !metaLoading && metaError.length === 0
					: !metaLoading && metaError.length === 0 && doc !== null
			}
			mode={mode}
			defaultValues={mode === "create" ? uploadDefaults : editDefaults}
			fields={mode === "create" ? uploadFields : editFields}
			rows={mode === "create" ? uploadRows : editRows}
			onSubmit={mode === "create" ? handleUpload : handleUpdate}
			onSaved={() => {
				setTopError("");
				onSaved();
			}}
			submitting={submitting}
			error={topError}
			dirtyGuard={false}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
