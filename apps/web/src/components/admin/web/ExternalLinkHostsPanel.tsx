//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/admin/web/ExternalLinkHostsPanel.tsx                                          ////
//// Language: TSX                                                                                              ////
//// Admin panel for creating and editing external link host and path whitelist rows                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";

import PanelForm, {
	type FieldDef,
	type RowDef,
} from "@/components/ui/PanelForm";
import type { ExternalLinkHostAdminItem } from "@/lib/data/external-link-hosts";
import { sortAdminPickerOptions } from "@/lib/helpers/admin-picker-options";
import { readResponseMessage } from "@/lib/helpers/http-response";

type Mode = "create" | "edit";
type Values = Record<string, unknown>;

const HOST_MATCH_OPTIONS = sortAdminPickerOptions([
	{ value: "exact_host", label: "Exact host" },
]);

const PATH_MATCH_OPTIONS = sortAdminPickerOptions([
	{ value: "any_path", label: "Any path" },
	{ value: "exact_path", label: "Exact path" },
	{ value: "path_prefix", label: "Path prefix" },
]);

const SURFACE_SCOPE_OPTIONS = sortAdminPickerOptions([
	{ value: "admin", label: "Admin" },
	{ value: "all", label: "All" },
	{ value: "public", label: "Public" },
]);

export interface ExternalLinkHostsPanelProps {
	open: boolean;
	mode: Mode;
	row?: ExternalLinkHostAdminItem | null;
	onClose: () => void;
	onSaved: () => void | Promise<void>;
}

function toDateFieldValue(value: string | null): string {
	if (!value) {
		return "";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function getPathMatchMode(values: Values): string {
	const value = values.pathMatchModeCode;
	return typeof value === "string" ? value : "any_path";
}

function validateHostPattern(value: unknown): string | undefined {
	const hostPattern = String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/\.$/, "");

	if (!hostPattern) {
		return "Host pattern is required.";
	}

	if (
		!/^[a-z0-9.-]{1,253}$/.test(hostPattern) ||
		hostPattern.startsWith(".") ||
		hostPattern.endsWith(".") ||
		hostPattern.includes("..") ||
		hostPattern.includes("/") ||
		hostPattern.includes(":") ||
		hostPattern.includes("@")
	) {
		return "Use an exact normalized host such as example.com.";
	}

	return undefined;
}

function validatePathPattern(
	value: unknown,
	values: Values,
): string | undefined {
	const pathMatchMode = getPathMatchMode(values);
	const pathPattern = String(value ?? "").trim();

	if (pathMatchMode === "any_path") {
		return pathPattern === "/"
			? undefined
			: "Any path rules must use / as the path pattern.";
	}

	if (!pathPattern) {
		return "Path pattern is required.";
	}

	if (pathPattern === "/") {
		return "Exact path and path prefix rules must use a path more specific than /.";
	}

	if (
		!pathPattern.startsWith("/") ||
		pathPattern.includes("?") ||
		pathPattern.includes("#") ||
		pathPattern.includes("\\") ||
		pathPattern.includes("//") ||
		pathPattern.includes("..") ||
		pathPattern.toLowerCase().includes("%2e") ||
		/\s/.test(pathPattern) ||
		pathPattern.endsWith("/")
	) {
		return "Use a clean path such as /@channel or /news/item.";
	}

	return undefined;
}

export default function ExternalLinkHostsPanel({
	open,
	mode,
	row,
	onClose,
	onSaved,
}: ExternalLinkHostsPanelProps): JSX.Element {
	const [submitting, setSubmitting] = useState(false);
	const [topError, setTopError] = useState("");

	const defaults = useMemo(() => {
		if (mode === "edit" && row) {
			return {
				hostPattern: row.hostPattern,
				hostMatchModeCode: row.hostMatchModeCode,
				pathPattern: row.pathPattern,
				pathMatchModeCode: row.pathMatchModeCode,
				allowedSurfaceScopeCode: row.allowedSurfaceScopeCode,
				comment: row.comment ?? "",
				validFrom: toDateFieldValue(row.validFrom),
				validTo: toDateFieldValue(row.validTo),
				enabled: row.enabled,
			};
		}

		return {
			hostPattern: "",
			hostMatchModeCode: "exact_host",
			pathPattern: "/",
			pathMatchModeCode: "any_path",
			allowedSurfaceScopeCode: "all",
			comment: "",
			validFrom: "",
			validTo: "",
			enabled: true,
		};
	}, [mode, row]);

	const fields: FieldDef[] = useMemo(
		() => [
			{
				type: "text",
				name: "hostPattern",
				label: "Host Pattern",
				placeholder: "example.com",
				validate: validateHostPattern,
			},
			{
				type: "select-single",
				name: "hostMatchModeCode",
				label: "Host Match",
				options: HOST_MATCH_OPTIONS,
			},
			{
				type: "select-single",
				name: "pathMatchModeCode",
				label: "Path Match",
				options: PATH_MATCH_OPTIONS,
				onChange: ({ value, setValue }) => {
					if (value === "any_path") {
						setValue("pathPattern", "/");
					}
				},
			},
			{
				type: "text",
				name: "pathPattern",
				label: "Path Pattern",
				placeholder: "/@known-channel",
				isDisabled: (values) => getPathMatchMode(values) === "any_path",
				validate: validatePathPattern,
			},
			{
				type: "select-single",
				name: "allowedSurfaceScopeCode",
				label: "Surface Scope",
				options: SURFACE_SCOPE_OPTIONS,
			},
			{
				type: "checkbox",
				name: "enabled",
				label: "Enabled",
			},
			{
				type: "date",
				name: "validFrom",
				label: "Valid From",
				placeholder: "Optional start date",
			},
			{
				type: "date",
				name: "validTo",
				label: "Valid To",
				placeholder: "Optional end date",
			},
			{
				type: "textarea",
				name: "comment",
				label: "Comment",
				placeholder:
					"Optional admin-facing reason, for example official partner site or source citation",
				rows: 4,
			},
		],
		[],
	);

	const rows: RowDef[] = useMemo(
		() => [
			[
				{ field: "hostPattern", span: 8 },
				{ field: "hostMatchModeCode", span: 4 },
			],
			[
				{ field: "pathPattern", span: 8 },
				{ field: "pathMatchModeCode", span: 4 },
			],
			[
				{ field: "allowedSurfaceScopeCode", span: 6 },
				{ field: "enabled", span: 6 },
			],
			[
				{ field: "validFrom", span: 6 },
				{ field: "validTo", span: 6 },
			],
			[{ field: "comment" }],
		],
		[],
	);

	useEffect(() => {
		if (open) {
			setTopError("");
		}
	}, [open]);

	async function handleSubmit(values: Values): Promise<void> {
		setSubmitting(true);
		setTopError("");

		try {
			if (mode === "edit" && !row) {
				throw new Error("External link rule was not found.");
			}

			const pathMatchModeCode = String(
				values.pathMatchModeCode ?? "any_path",
			).trim();
			const pathPattern =
				pathMatchModeCode === "any_path"
					? "/"
					: String(values.pathPattern ?? "").trim();
			const data = {
				hostPattern: String(values.hostPattern ?? "").trim(),
				hostMatchModeCode: String(values.hostMatchModeCode ?? "exact_host").trim(),
				pathPattern,
				pathMatchModeCode,
				allowedSurfaceScopeCode: String(
					values.allowedSurfaceScopeCode ?? "",
				).trim(),
				comment: String(values.comment ?? "").trim(),
				validFrom: String(values.validFrom ?? "").trim(),
				validTo: String(values.validTo ?? "").trim(),
				enabled: Boolean(values.enabled),
			};
			const body =
				mode === "create"
					? { op: "create", data }
					: { op: "update", id: row?.id, data };

			const response = await fetch("/api/admin/web/external-link-hosts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(
					await readResponseMessage(response, "Failed to save external link rule."),
				);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to save external link rule.";
			setTopError(message);
			throw new Error(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<PanelForm
			open={open}
			onClose={() => {
				setTopError("");
				onClose();
			}}
			title={
				mode === "create" ? "Create External Link Rule" : "Edit External Link Rule"
			}
			width="50%"
			showSave
			mode={mode}
			defaultValues={defaults}
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
			dirtyGuard={false}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
