//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-sanitize.ts                                                             ////
//// Language: TS                                                                                                 ////
//// Media filename and text sanitization helpers                                                                 ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function replaceControlCharacters(input: string): string {
	let output = "";

	for (const char of input) {
		const code = char.charCodeAt(0);
		output += code <= 31 || code === 127 ? " " : char;
	}

	return output;
}

export function sanitizeDisplayFilename(
	input: string,
	fallback = "file",
): string {
	const normalized = input.normalize("NFKC");
	const withoutControls = replaceControlCharacters(normalized);
	const withoutSeparators = withoutControls.replace(/[\\/]+/g, "-");
	const collapsed = withoutSeparators.replace(/\s+/g, " ").trim();
	const cropped = collapsed.slice(0, 180).trim();
	return cropped.length > 0 ? cropped : fallback;
}

export function sanitizeFreeText(
	input: string,
	maxLength: number,
): string | null {
	const normalized = input.normalize("NFKC");
	const withoutControls = replaceControlCharacters(normalized);
	const collapsed = withoutControls.replace(/\s+/g, " ").trim();
	if (collapsed.length === 0) {
		return null;
	}
	return collapsed.slice(0, maxLength).trim();
}

export function sanitizeStorageSegment(
	input: string,
	fallback: string,
): string {
	const normalized = input.normalize("NFKC").toLowerCase();
	const cleaned = normalized
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-_.]+/, "")
		.replace(/[-_.]+$/, "")
		.trim();
	return cleaned.length > 0 ? cleaned : fallback;
}

export function getSafeExtension(displayFilename: string): string {
	const lastDotIndex = displayFilename.lastIndexOf(".");
	if (lastDotIndex <= 0 || lastDotIndex === displayFilename.length - 1) {
		return "";
	}

	const extension = displayFilename.slice(lastDotIndex + 1).toLowerCase();
	if (!/^[a-z0-9]{1,10}$/.test(extension)) {
		return "";
	}

	return `.${extension}`;
}
