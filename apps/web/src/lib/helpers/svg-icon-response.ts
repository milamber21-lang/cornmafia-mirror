//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/svg-icon-response.ts                                                          ////
//// Language: TS                                                                                                  ////
//// Server helper for sanitized and colorized SVG icon responses                                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { readFile } from "fs/promises";
import path from "path";

import {
	assertSafeMediaRelativePath,
	resolveMediaAbsolutePath,
} from "@/lib/helpers/media-files";
import { isNoTintIconColor } from "@/lib/helpers/icon-color";
import { sanitizeSvg } from "@/lib/helpers/svg-sanitizer";

type SvgIconBuildResult = {
	body: string;
	byteLength: number;
};

const CSS_VARIABLE_COLOR_MAP: Record<string, string> = {
	"--theme-bg": "#0b0b0c",
	"--theme-surface": "#141416",
	"--theme-card": "#141416",
	"--theme-muted-bg": "#141416",
	"--theme-text": "#f5f6f7",
	"--theme-text-muted": "#b7b7b7",
	"--theme-border": "#2a2a2a",
	"--theme-accent": "#cc262d",
	"--theme-accent-strong": "#a11e24",
	"--theme-accent-contrast": "#ffffff",
	"--theme-focus": "#cc262d",
	"--theme-green": "#094201",
	"--theme-danger": "#ef4444",
	"--theme-success": "#22c55e",
	"--theme-warning": "#cea658",
	"--theme-info": "#38bdf8",
	"--theme-ink": "#000000",
	"--theme-contrast": "#ffffff",

	/* Legacy rows may still appear in old media records or history. */
	"--brand-red": "#cc262d",
	"--brand-green": "#094201",
	"--brand-red-strong": "#a11e24",
	"--color-bg": "#0b0b0c",
	"--color-surface": "#141416",
	"--color-text": "#f5f6f7",
	"--color-muted": "#b7b7b7",
	"--color-border": "#2a2a2a",
	"--color-accent": "#cc262d",
	"--color-green": "#094201",
	"--color-accent-contrast": "#ffffff",
	"--color-focus": "#cc262d",
};

function isSvgPath(storageRelPath: string): boolean {
	return path.posix.extname(storageRelPath).toLowerCase() === ".svg";
}

function unwrapCssVariable(value: string): string | null {
	const trimmed = value.trim();
	if (trimmed.startsWith("--")) {
		return trimmed;
	}

	const match = /^var\(\s*(--[a-z0-9_-]+)\s*\)$/i.exec(trimmed);
	return match?.[1] ?? null;
}

function resolveKnownCssVariable(value: string): string {
	const variableName = unwrapCssVariable(value);
	if (!variableName) {
		return value;
	}

	return CSS_VARIABLE_COLOR_MAP[variableName] ?? value;
}

function isSafeCssColor(value: string): boolean {
	const trimmed = value.trim();
	if (!trimmed) {
		return false;
	}

	if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
		return true;
	}

	if (
		/^rgba?\(\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*,\s*[0-9.]+%?(?:\s*,\s*(?:0|1|0?\.\d+|[0-9.]+%))?\s*\)$/i.test(
			trimmed,
		)
	) {
		return true;
	}

	if (
		/^hsla?\(\s*[0-9.]+(?:deg|rad|turn)?\s*,\s*[0-9.]+%\s*,\s*[0-9.]+%(?:\s*,\s*(?:0|1|0?\.\d+|[0-9.]+%))?\s*\)$/i.test(
			trimmed,
		)
	) {
		return true;
	}

	return /^(black|white|red|green|blue|gray|grey|transparent)$/i.test(trimmed);
}

function normalizeSvgIconColor(value: string | null): string | null {
	if (!value) {
		return null;
	}

	if (isNoTintIconColor(value)) {
		return null;
	}

	const resolved = resolveKnownCssVariable(value).trim();
	return isSafeCssColor(resolved) ? resolved : null;
}

function applyColorToCurrentColor(svg: string, color: string | null): string {
	if (!color) {
		return svg;
	}

	return svg.replace(/currentColor/g, color);
}

function ensureSvgImageNamespace(svg: string): string {
	const trimmed = svg.trim();
	if (!/^<svg(?:\s|>)/i.test(trimmed)) {
		return trimmed;
	}

	let nextSvg = trimmed;
	if (!/\sxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(nextSvg)) {
		nextSvg = nextSvg.replace(
			/^<svg(\s|>)/i,
			(_match: string, suffix: string) =>
				`<svg xmlns="http://www.w3.org/2000/svg"${suffix}`,
		);
	}

	if (!/\sxmlns:xlink\s*=\s*["']http:\/\/www\.w3\.org\/1999\/xlink["']/i.test(nextSvg)) {
		nextSvg = nextSvg.replace(
			/^<svg(\s|>)/i,
			(_match: string, suffix: string) =>
				`<svg xmlns:xlink="http://www.w3.org/1999/xlink"${suffix}`,
		);
	}

	return nextSvg;
}

export function isSvgMediaIconFile(args: {
	mimeType?: string | null;
	storageRelPath: string;
}): boolean {
	const mimeType = args.mimeType?.trim().toLowerCase() ?? "";
	return (
		mimeType === "image/svg+xml" ||
		mimeType.startsWith("image/svg") ||
		isSvgPath(args.storageRelPath)
	);
}

export async function buildColorizedSvgIcon(args: {
	storageRelPath: string;
	color: string | null;
}): Promise<SvgIconBuildResult> {
	const safeRelativePath = assertSafeMediaRelativePath(args.storageRelPath);
	if (!isSvgPath(safeRelativePath)) {
		throw new Error("Media icon route only supports SVG files.");
	}

	const absolutePath = resolveMediaAbsolutePath(safeRelativePath);
	const fileBuffer = await readFile(absolutePath);
	const rawSvg = fileBuffer.toString("utf8");
	const safeColor = normalizeSvgIconColor(args.color);
	const sanitizedSvg = sanitizeSvg(rawSvg, {
		colorMode: safeColor ? "currentColor" : "keep",
	});
	const colorizedSvg = applyColorToCurrentColor(sanitizedSvg, safeColor);
	const body = ensureSvgImageNamespace(colorizedSvg);

	return {
		body,
		byteLength: Buffer.byteLength(body, "utf8"),
	};
}

export function buildSvgIconResponse(args: {
	body: string;
	byteLength: number;
}): Response {
	return new Response(args.body, {
		headers: {
			"Content-Type": "image/svg+xml; charset=utf-8",
			"Content-Length": String(args.byteLength),
			"Cache-Control": "private, max-age=300, stale-while-revalidate=3600",
			"X-Content-Type-Options": "nosniff",
		},
	});
}
