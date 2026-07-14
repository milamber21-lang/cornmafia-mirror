//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/server/mutation-origin.ts                                                           ////
//// Language: TS                                                                                               ////
//// Shared same-origin guard for API mutation requests before privileged business logic runs.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const TRUSTED_ORIGIN_ENV_NAMES = [
	"WEB_PUBLIC_URL",
	"NEXTAUTH_URL",
	"NEXT_PUBLIC_BASE_URL",
	"WEB_INTERNAL_URL",
] as const;
const EXEMPT_MUTATION_PATH_PREFIXES = ["/api/auth/"] as const;
const EXEMPT_MUTATION_PATHS = new Set(["/api/revalidate-tag"]);
const CROSS_SITE_SEC_FETCH_SITE_VALUES = new Set(["cross-site", "same-site"]);

function normalizeHeaderValue(value: string | null): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

function normalizeOrigin(value: string | null): string | null {
	const normalized = normalizeHeaderValue(value);
	if (!normalized || normalized.toLowerCase() === "null") {
		return null;
	}

	try {
		const parsed = new URL(normalized);
		return parsed.protocol === "http:" || parsed.protocol === "https:"
			? parsed.origin
			: null;
	} catch {
		return null;
	}
}

function readConfiguredOrigin(name: string): string | null {
	const value = process.env[name];
	return typeof value === "string" ? normalizeOrigin(value) : null;
}

function collectAllowedOrigins(request: Request): Set<string> {
	const allowedOrigins = new Set<string>();
	const requestOrigin = normalizeOrigin(request.url);
	if (requestOrigin) {
		allowedOrigins.add(requestOrigin);
	}

	for (const name of TRUSTED_ORIGIN_ENV_NAMES) {
		const configuredOrigin = readConfiguredOrigin(name);
		if (configuredOrigin) {
			allowedOrigins.add(configuredOrigin);
		}
	}

	return allowedOrigins;
}

function getRequestPathname(request: Request): string | null {
	try {
		return new URL(request.url).pathname;
	} catch {
		return null;
	}
}

function isExemptMutationPath(request: Request): boolean {
	const pathname = getRequestPathname(request);
	if (!pathname) {
		return false;
	}

	if (EXEMPT_MUTATION_PATHS.has(pathname)) {
		return true;
	}

	return EXEMPT_MUTATION_PATH_PREFIXES.some((prefix) =>
		pathname.startsWith(prefix),
	);
}

function readSecFetchSite(request: Request): string | null {
	return (
		normalizeHeaderValue(request.headers.get("sec-fetch-site"))?.toLowerCase() ??
		null
	);
}

function isExplicitlyCrossSite(secFetchSite: string | null): boolean {
	return (
		secFetchSite !== null && CROSS_SITE_SEC_FETCH_SITE_VALUES.has(secFetchSite)
	);
}

function buildForbiddenResponse(message: string): NextResponse {
	return NextResponse.json(
		{
			ok: false,
			code: "SAME_ORIGIN_REQUIRED",
			message,
		},
		{ status: 403 },
	);
}

export function isMutationMethod(method: string): boolean {
	return MUTATION_METHODS.has(method.trim().toUpperCase());
}

export function assertSameOriginMutation(
	request: Request,
): NextResponse | null {
	if (!isMutationMethod(request.method)) {
		return null;
	}

	if (isExemptMutationPath(request)) {
		return null;
	}

	const secFetchSite = readSecFetchSite(request);
	if (isExplicitlyCrossSite(secFetchSite)) {
		return buildForbiddenResponse("Mutation requests must be same-origin.");
	}

	const allowedOrigins = collectAllowedOrigins(request);
	const originHeader = request.headers.get("origin");
	const origin = normalizeOrigin(originHeader);
	if (originHeader !== null) {
		return origin && allowedOrigins.has(origin)
			? null
			: buildForbiddenResponse("Mutation origin is not allowed.");
	}

	const refererHeader = request.headers.get("referer");
	const refererOrigin = normalizeOrigin(refererHeader);
	if (refererHeader !== null) {
		return refererOrigin && allowedOrigins.has(refererOrigin)
			? null
			: buildForbiddenResponse("Mutation referrer is not allowed.");
	}

	if (secFetchSite === "same-origin") {
		return null;
	}

	return buildForbiddenResponse("Mutation requests require same-origin proof.");
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
