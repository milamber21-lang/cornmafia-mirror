//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/links/link-policy.ts                                                                 ////
//// Language: TS                                                                                               ////
//// Shared app-side link policy helpers for rich text, template, footer, and render surfaces.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type LinkPolicyKind = "internal" | "external";

export type LinkPolicySuccess = {
	ok: true;
	kind: LinkPolicyKind;
	href: string;
	validationInput: string;
	basePath: string | null;
	suffix: string;
};

export type LinkPolicyFailure = {
	ok: false;
	message: string;
	reasonCode:
		| "required"
		| "unsupported_protocol"
		| "protocol_relative"
		| "disallowed_protocol"
		| "disallowed_kind"
		| "unsafe_shape"
		| "invalid_internal_path"
		| "invalid_external_url";
};

export type LinkPolicyResult = LinkPolicySuccess | LinkPolicyFailure;

type InternalPathMode = "content_route" | "public_path";

type LinkPolicyOptions = {
	allowInternal: boolean;
	allowExternal: boolean;
	allowTypedHttpsProtocol: boolean;
	requireProtocolOmittedForExternal: boolean;
	allowQuery: boolean;
	allowHash: boolean;
	internalPathMode: InternalPathMode;
};

type HrefParts = {
	base: string;
	suffix: string;
};

const PUBLIC_ROUTE_PREFIXES = new Set(["map", "tool", "app", "event", "custom", "info", "video"]);
const BLOCKED_INTERNAL_FIRST_SEGMENTS = new Set([
	"admin",
	"api",
	"auth",
	"login",
	"logout",
	"_next",
	"media",
	"uploads",
]);

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
const UNSAFE_PATH_ENCODING_PATTERN = /%2e|%2f|%5c|%00/i;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

const RICH_TEXT_AUTHOR_OPTIONS: LinkPolicyOptions = {
	allowInternal: true,
	allowExternal: true,
	allowTypedHttpsProtocol: false,
	requireProtocolOmittedForExternal: true,
	allowQuery: true,
	allowHash: true,
	internalPathMode: "content_route",
};

const GENERAL_AUTHOR_OPTIONS: LinkPolicyOptions = {
	allowInternal: true,
	allowExternal: true,
	allowTypedHttpsProtocol: true,
	requireProtocolOmittedForExternal: false,
	allowQuery: true,
	allowHash: true,
	internalPathMode: "public_path",
};

const RENDER_OPTIONS: LinkPolicyOptions = {
	allowInternal: true,
	allowExternal: true,
	allowTypedHttpsProtocol: true,
	requireProtocolOmittedForExternal: false,
	allowQuery: true,
	allowHash: true,
	internalPathMode: "content_route",
};

function failure(
	reasonCode: LinkPolicyFailure["reasonCode"],
	message: string,
): LinkPolicyFailure {
	return {
		ok: false,
		reasonCode,
		message,
	};
}

function hasControlCharacters(value: string): boolean {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);

		if ((code >= 0 && code <= 31) || code === 127) {
			return true;
		}
	}

	return false;
}

function hasWhitespace(value: string): boolean {
	return /\s/.test(value);
}

function hasUnsafeShellCharacters(value: string): boolean {
	return /[<>"']/.test(value);
}

function hasUnsafeCommonShape(value: string): boolean {
	return (
		value.length === 0 ||
		hasControlCharacters(value) ||
		hasWhitespace(value) ||
		value.includes("\\") ||
		hasUnsafeShellCharacters(value)
	);
}

function splitHrefParts(value: string): HrefParts {
	const queryIndex = value.indexOf("?");
	const hashIndex = value.indexOf("#");
	const splitIndexes = [queryIndex, hashIndex].filter((index) => index >= 0);
	const splitIndex = splitIndexes.length > 0 ? Math.min(...splitIndexes) : -1;

	if (splitIndex < 0) {
		return {
			base: value,
			suffix: "",
		};
	}

	return {
		base: value.slice(0, splitIndex),
		suffix: value.slice(splitIndex),
	};
}

function validateSuffix(
	suffix: string,
	options: LinkPolicyOptions,
): LinkPolicyFailure | null {
	if (suffix.length === 0) {
		return null;
	}

	if (!options.allowQuery && suffix.includes("?")) {
		return failure("unsafe_shape", "Links cannot include query strings.");
	}

	if (!options.allowHash && suffix.includes("#")) {
		return failure("unsafe_shape", "Links cannot include anchors.");
	}

	if (hasUnsafeCommonShape(suffix)) {
		return failure(
			"unsafe_shape",
			"Link query strings and anchors cannot include whitespace, backslashes, control characters, or unsafe punctuation.",
		);
	}

	return null;
}

function safeDecodePathSegment(value: string): string | null {
	try {
		return decodeURIComponent(value);
	} catch {
		return null;
	}
}

function hasUnsafeDecodedSegment(value: string): boolean {
	const decodedValue = safeDecodePathSegment(value);

	if (decodedValue === null || decodedValue.length === 0) {
		return true;
	}

	return (
		decodedValue === "." ||
		decodedValue === ".." ||
		decodedValue.includes("/") ||
		decodedValue.includes("\\") ||
		hasControlCharacters(decodedValue) ||
		hasWhitespace(decodedValue)
	);
}

function normalizeInternalPath(value: string, mode: InternalPathMode): string | null {
	if (
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\") ||
		UNSAFE_PATH_ENCODING_PATTERN.test(value) ||
		/(^|\/)\.\.(\/|$)/.test(value)
	) {
		return null;
	}

	const withoutOuterSlashes = value.replace(/^\/+|\/+$/g, "");
	if (withoutOuterSlashes.length === 0) {
		return mode === "public_path" ? "/" : null;
	}

	const parts = withoutOuterSlashes.split("/");
	if (parts.some((part) => part.length === 0 || hasUnsafeDecodedSegment(part))) {
		return null;
	}

	const normalizedParts = parts.map((part) => part.toLowerCase());
	const firstSegment = normalizedParts[0] ?? "";

	if (BLOCKED_INTERNAL_FIRST_SEGMENTS.has(firstSegment)) {
		return null;
	}

	if (mode === "public_path") {
		return `/${normalizedParts.join("/")}`;
	}

	if (normalizedParts.length === 3) {
		return `/${normalizedParts.join("/")}`;
	}

	if (normalizedParts.length === 4 && PUBLIC_ROUTE_PREFIXES.has(firstSegment)) {
		return `/${normalizedParts.join("/")}`;
	}

	return null;
}

function normalizeInternalLink(
	value: string,
	options: LinkPolicyOptions,
): LinkPolicyResult {
	if (!options.allowInternal) {
		return failure("disallowed_kind", "Internal links are not allowed here.");
	}

	const { base, suffix } = splitHrefParts(value);
	const suffixError = validateSuffix(suffix, options);
	if (suffixError) {
		return suffixError;
	}

	const normalizedPath = normalizeInternalPath(base, options.internalPathMode);
	if (!normalizedPath) {
		return failure(
			"invalid_internal_path",
			options.internalPathMode === "content_route"
				? "Internal links must point to a content route such as /category/subcategory/page."
				: "Internal links must use a safe public path.",
		);
	}

	return {
		ok: true,
		kind: "internal",
		href: `${normalizedPath}${suffix}`,
		validationInput: `${normalizedPath}${suffix}`,
		basePath: normalizedPath,
		suffix,
	};
}

function normalizeExternalPath(value: string): string | null {
	if (value.length === 0) {
		return "/";
	}

	const normalizedPath = value.startsWith("/") ? value : `/${value}`;

	if (
		!/^\/[^\s?#]*$/.test(normalizedPath) ||
		normalizedPath.includes("\\") ||
		UNSAFE_PATH_ENCODING_PATTERN.test(normalizedPath) ||
		normalizedPath.includes("..") ||
		normalizedPath.includes("//")
	) {
		return null;
	}

	return normalizedPath;
}

function normalizeExternalLink(
	value: string,
	options: LinkPolicyOptions,
): LinkPolicyResult {
	if (!options.allowExternal) {
		return failure("disallowed_kind", "External links are not allowed here.");
	}

	if (value.startsWith("//")) {
		return failure(
			"protocol_relative",
			"Protocol-relative links are not allowed. Use a normal HTTPS link target.",
		);
	}

	if (SCHEME_PATTERN.test(value)) {
		if (!value.toLowerCase().startsWith("https://")) {
			return failure(
				"unsupported_protocol",
				"Only secure HTTPS external links are allowed.",
			);
		}

		if (!options.allowTypedHttpsProtocol || options.requireProtocolOmittedForExternal) {
			return failure(
				"disallowed_protocol",
				"Enter external links without protocol, for example example.com/path.",
			);
		}
	}

	const urlInput = value.toLowerCase().startsWith("https://")
		? value
		: `https://${value}`;

	try {
		const parsedUrl = new URL(urlInput);

		if (
			parsedUrl.protocol.toLowerCase() !== "https:" ||
			parsedUrl.username.length > 0 ||
			parsedUrl.password.length > 0 ||
			parsedUrl.port.length > 0
		) {
			return failure(
				"invalid_external_url",
				"External links must use HTTPS and cannot include credentials or custom ports.",
			);
		}

		const host = parsedUrl.hostname.toLowerCase().replace(/\.$/, "");
		if (!HOST_PATTERN.test(host)) {
			return failure(
				"invalid_external_url",
				"External link host must be a normalized domain.",
			);
		}

		const path = normalizeExternalPath(parsedUrl.pathname || "/");
		if (!path) {
			return failure(
				"invalid_external_url",
				"External link path contains an unsupported shape.",
			);
		}

		const suffix = `${parsedUrl.search}${parsedUrl.hash}`;
		const suffixError = validateSuffix(suffix, options);
		if (suffixError) {
			return suffixError;
		}

		const href = `https://${host}${path}${suffix}`;
		return {
			ok: true,
			kind: "external",
			href,
			validationInput: stripHttpsProtocol(href),
			basePath: path,
			suffix,
		};
	} catch {
		return failure(
			"invalid_external_url",
			"External link must be a valid domain and optional path.",
		);
	}
}

function normalizeLinkInput(
	value: unknown,
	options: LinkPolicyOptions,
): LinkPolicyResult {
	if (typeof value !== "string") {
		return failure("required", "Link target is required.");
	}

	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		return failure("required", "Link target is required.");
	}

	if (hasUnsafeCommonShape(trimmedValue)) {
		return failure(
			"unsafe_shape",
			"Links cannot include whitespace, backslashes, control characters, or unsafe punctuation.",
		);
	}

	if (looksLikeInternalLinkInput(trimmedValue)) {
		return normalizeInternalLink(trimmedValue, options);
	}

	return normalizeExternalLink(trimmedValue, options);
}

export function looksLikeInternalLinkInput(value: string): boolean {
	const trimmedValue = value.trim();
	return trimmedValue.startsWith("/") && !trimmedValue.startsWith("//");
}

export function stripHttpsProtocol(value: string): string {
	const trimmedValue = value.trim();
	return trimmedValue.toLowerCase().startsWith("https://")
		? trimmedValue.slice("https://".length)
		: trimmedValue;
}

export function normalizeRichTextLinkAuthorInput(value: unknown): LinkPolicyResult {
	return normalizeLinkInput(value, RICH_TEXT_AUTHOR_OPTIONS);
}

export function normalizeGeneralLinkAuthorInput(value: unknown): LinkPolicyResult {
	return normalizeLinkInput(value, GENERAL_AUTHOR_OPTIONS);
}

export function normalizeStoredRichTextLinkHref(value: unknown): LinkPolicyResult {
	return normalizeLinkInput(value, RENDER_OPTIONS);
}

export function isExternalLinkHref(value: unknown): boolean {
	const result = normalizeGeneralLinkAuthorInput(value);
	return result.ok && result.kind === "external";
}
