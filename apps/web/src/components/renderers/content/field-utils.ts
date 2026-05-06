//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/renderers/content/field-utils.ts                                               ////
//// Language: TS                                                                                                 ////
//// Shared value detection, formatting, and URL helpers for content field renderers.                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { isRichTextJsonEmpty } from "@/lib/editors/richtext/rich-text-json";

import type { ContentRenderField } from "./types";

function hasUnsafeUrlCharacter(value: string): boolean {
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (code <= 31 || code === 127 || /\s/u.test(character)) {
			return true;
		}
	}

	return false;
}

export function hasRenderableValue(value: unknown): boolean {
	if (value === null || typeof value === "undefined") {
		return false;
	}

	if (typeof value === "string") {
		return value.trim().length > 0;
	}

	if (typeof value === "object" && "root" in value) {
		return !isRichTextJsonEmpty(value);
	}

	return true;
}

export function hasRenderableFields(fields: readonly ContentRenderField[]): boolean {
	return fields.some((field) => hasRenderableValue(field.value));
}

export function isUrlLikeField(field: ContentRenderField): boolean {
	const listCode = field.fieldListCode.trim().toLowerCase();
	const columnName = field.valueColumnName.trim().toLowerCase();
	return listCode.includes("url") || columnName.includes("url");
}

export function formatDateValue(value: unknown): string | null {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("en", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(parsed);
}

export function formatDateTimeValue(value: unknown): string | null {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("en", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(parsed);
}

export function formatNumberValue(value: unknown): string | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return new Intl.NumberFormat("en").format(value);
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value.trim());
		return Number.isFinite(parsed) ? new Intl.NumberFormat("en").format(parsed) : value;
	}

	return null;
}

export function formatPrimitiveValue(field: ContentRenderField): string | null {
	const { value } = field;

	if (!hasRenderableValue(value)) {
		return null;
	}

	if (field.fieldTypeCode === "boolean") {
		return value === true ? "Yes" : "No";
	}

	if (field.fieldTypeCode === "date") {
		return formatDateValue(value);
	}

	if (field.fieldTypeCode === "timestamp") {
		return formatDateTimeValue(value);
	}

	if (field.fieldTypeCode === "integer" || field.fieldTypeCode === "numeric") {
		return formatNumberValue(value);
	}

	if (field.fieldTypeCode === "option") {
		return field.optionLabel ?? (typeof value === "string" ? value : null);
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return String(value);
	}

	return null;
}

export type NormalizedRenderableUrl = {
	href: string;
	isExternal: boolean;
};

export function normalizeRenderableUrl(value: unknown): NormalizedRenderableUrl | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0 || hasUnsafeUrlCharacter(trimmed)) {
		return null;
	}

	if (trimmed.startsWith("/")) {
		if (
			trimmed.startsWith("//") ||
			trimmed.includes("\\") ||
			/(^|\/)\.\.(\/|$)/.test(trimmed)
		) {
			return null;
		}

		return {
			href: trimmed,
			isExternal: false,
		};
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "https:") {
			return null;
		}

		return {
			href: parsed.toString(),
			isExternal: true,
		};
	} catch {
		return null;
	}
}