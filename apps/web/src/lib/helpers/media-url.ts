//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-url.ts                                                                   ////
//// Language: TS                                                                                                  ////
//// Builds and normalizes app/admin media file and icon routes for DB-backed media serving                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type MediaRouteScope = "admin" | "app";

type InternalMediaRouteMatch = {
	isAbsolute: boolean;
	origin: string;
	search: string;
	hash: string;
	storageRelPath: string;
};

function normalizeStorageRelPathForUrl(storageRelPath: string): string {
	return storageRelPath
		.trim()
		.replace(/\\+/g, "/")
		.replace(/^\/+/, "")
		.split("/")
		.filter((segment) => segment.length > 0)
		.map((segment) => encodeURIComponent(segment))
		.join("/");
}

function decodeRouteStoragePath(encodedPath: string): string | null {
	const segments = encodedPath
		.split("/")
		.filter((segment) => segment.length > 0);

	try {
		return segments.map((segment) => decodeURIComponent(segment)).join("/");
	} catch {
		return null;
	}
}

function parseInternalMediaRoute(
	inputUrl: string,
): InternalMediaRouteMatch | null {
	const trimmed = inputUrl.trim();
	if (trimmed.length === 0) {
		return null;
	}

	const isAbsolute = /^https?:\/\//i.test(trimmed);

	let parsed: URL;
	try {
		parsed = isAbsolute
			? new URL(trimmed)
			: new URL(trimmed, "http://local.invalid");
	} catch {
		return null;
	}

	const prefixes = [
		"/api/media/file/",
		"/api/admin/web/media/file/",
		"/api/media/icon/",
		"/api/admin/web/media/icon/",
	] as const;
	const matchedPrefix = prefixes.find((prefix) =>
		parsed.pathname.startsWith(prefix),
	);
	if (!matchedPrefix) {
		return null;
	}

	const encodedPath = parsed.pathname.slice(matchedPrefix.length);
	const storageRelPath = decodeRouteStoragePath(encodedPath);
	if (!storageRelPath) {
		return null;
	}

	return {
		isAbsolute,
		origin: parsed.origin,
		search: parsed.search,
		hash: parsed.hash,
		storageRelPath,
	};
}

export function extractStorageRelPathFromMediaUrl(
	inputUrl: string,
): string | null {
	return parseInternalMediaRoute(inputUrl)?.storageRelPath ?? null;
}

export function buildMediaFileUrl(
	storageRelPath: string,
	routeScope: MediaRouteScope = "app",
): string {
	const normalizedPath = normalizeStorageRelPathForUrl(storageRelPath);
	const basePath =
		routeScope === "admin" ? "/api/admin/web/media/file" : "/api/media/file";
	return `${basePath}/${normalizedPath}`;
}

export function buildMediaIconUrl(args: {
	storageRelPath: string;
	routeScope?: MediaRouteScope;
	color?: string | null;
}): string {
	const normalizedPath = normalizeStorageRelPathForUrl(args.storageRelPath);
	const basePath =
		args.routeScope === "admin" ? "/api/admin/web/media/icon" : "/api/media/icon";
	const color = args.color?.trim() ?? "";
	const query = color.length > 0 ? `?color=${encodeURIComponent(color)}` : "";
	return `${basePath}/${normalizedPath}${query}`;
}

export function buildAdminMediaFileUrl(storageRelPath: string): string {
	return buildMediaFileUrl(storageRelPath, "admin");
}

export function buildAppMediaFileUrl(storageRelPath: string): string {
	return buildMediaFileUrl(storageRelPath, "app");
}

export function normalizeMediaUrlToRouteScope(
	inputUrl: string,
	routeScope: MediaRouteScope,
): string {
	const match = parseInternalMediaRoute(inputUrl);
	if (!match) {
		return inputUrl;
	}

	const scopedPath = buildMediaFileUrl(match.storageRelPath, routeScope);
	const nextUrl = `${scopedPath}${match.search}${match.hash}`;
	return match.isAbsolute ? `${match.origin}${nextUrl}` : nextUrl;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
