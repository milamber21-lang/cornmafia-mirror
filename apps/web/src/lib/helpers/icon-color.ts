//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/icon-color.ts                                                                  ////
//// Language: TS                                                                                                  ////
//// Shared helpers for icon color preview values and no-tint icon rendering behavior                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ICON_NO_TINT_PREVIEW = "currentColor";

export function isNoTintIconColor(value?: string | null): boolean {
	return value?.trim().toLowerCase() === ICON_NO_TINT_PREVIEW.toLowerCase();
}

export function cssColorFromThemePreview(value?: string | null): string | undefined {
	if (!value) {
		return undefined;
	}

	const preview = value.trim();
	if (!preview) {
		return undefined;
	}

	if (preview.startsWith("--")) {
		return `var(${preview})`;
	}

	return preview;
}

export function validateThemeColorPreviewValue(value: unknown): string | undefined {
	const preview = String(value ?? "").trim();

	if (!preview) {
		return "Preview is required.";
	}

	if (isNoTintIconColor(preview)) {
		return undefined;
	}

	if (/^#[0-9a-fA-F]{6}$/.test(preview)) {
		return undefined;
	}

	if (/^--[a-z0-9-]+$/.test(preview)) {
		return undefined;
	}

	if (/^var\(--[a-z0-9-]+\)$/.test(preview)) {
		return undefined;
	}

	return "Use #RRGGBB, currentColor, --theme-name, or var(--theme-name).";
}
