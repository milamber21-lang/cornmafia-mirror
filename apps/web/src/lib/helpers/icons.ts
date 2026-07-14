//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/icons.ts                                                                      ////
//// Language: TS                                                                                                 ////
//// Shared icon helpers for DB-first admin and icon consumers                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import {
	buildMediaFileUrl,
	normalizeMediaUrlToRouteScope,
	type MediaRouteScope,
} from "@/lib/helpers/media-url";

export type IconSourceCode = "lucide" | "media";

export type IconMediaRef = {
	id: string;
	url?: string | null;
	filename?: string | null;
	originalFilename?: string | null;
	mimeType?: string | null;
	storageRelPath?: string | null;
	thumbnailURL?: string | null;
};

export type IconShape = {
	id: string;
	key: string | null;
	label: string | null;
	source: IconSourceCode;
	lucideName: string | null;
	iconMedia: IconMediaRef | null;
	enabled?: boolean;
};

export function normalizeIconSource(value: unknown): IconSourceCode {
	return value === "media" ? "media" : "lucide";
}

export function normalizeLucideName(input: string): string {
	const separated = input
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

	return separated
		.toLowerCase()
		.split(/[^a-z0-9]+/g)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

export function buildIconMediaUrl(
	media: Partial<IconMediaRef> | null | undefined,
	routeScope: MediaRouteScope = "app",
): string | null {
	if (!media) {
		return null;
	}

	if (typeof media.url === "string" && media.url.trim().length > 0) {
		return normalizeMediaUrlToRouteScope(media.url, routeScope);
	}

	if (
		typeof media.storageRelPath === "string" &&
		media.storageRelPath.trim().length > 0
	) {
		return buildMediaFileUrl(media.storageRelPath, routeScope);
	}

	if (typeof media.filename === "string" && media.filename.trim().length > 0) {
		const normalizedFilename = media.filename.trim().replace(/\\+/g, "/");
		if (normalizedFilename.includes("/")) {
			return buildMediaFileUrl(normalizedFilename, routeScope);
		}
	}

	return null;
}

export function isSvgMimeType(mimeType: string | null | undefined): boolean {
	if (typeof mimeType !== "string") {
		return false;
	}

	const normalized = mimeType.toLowerCase();
	return normalized === "image/svg+xml" || normalized.startsWith("image/svg");
}

export function isLikelySvgMedia(args: {
	media?: Partial<IconMediaRef> | null;
	url?: string | null;
}): boolean {
	const media = args.media ?? null;
	const candidateUrl = args.url ?? buildIconMediaUrl(media);

	if (isSvgMimeType(media?.mimeType)) {
		return true;
	}

	const filename = media?.filename ?? media?.originalFilename ?? null;
	if (typeof filename === "string" && /\.svg(?:$|[?#])/i.test(filename)) {
		return true;
	}

	return (
		typeof candidateUrl === "string" &&
		/(?:\.svg(?:$|[?#]))|(?:image\/svg\+xml)/i.test(candidateUrl)
	);
}

export function mapIconToRenderInput(
	icon: Partial<IconShape> | null | undefined,
): IconShape | null {
	if (!icon) {
		return null;
	}

	return {
		id:
			typeof icon.id === "string" && icon.id.trim().length > 0
				? icon.id
				: String(icon.id ?? ""),
		key: typeof icon.key === "string" ? icon.key : null,
		label: typeof icon.label === "string" ? icon.label : null,
		source: normalizeIconSource(icon.source),
		lucideName: typeof icon.lucideName === "string" ? icon.lucideName : null,
		iconMedia: icon.iconMedia
			? {
					id:
						typeof icon.iconMedia.id === "string" &&
						icon.iconMedia.id.trim().length > 0
							? icon.iconMedia.id
							: String(icon.iconMedia.id ?? ""),
					url: icon.iconMedia.url ?? null,
					filename: icon.iconMedia.filename ?? null,
					originalFilename: icon.iconMedia.originalFilename ?? null,
					mimeType: icon.iconMedia.mimeType ?? null,
					storageRelPath: icon.iconMedia.storageRelPath ?? null,
					thumbnailURL: icon.iconMedia.thumbnailURL ?? null,
				}
			: null,
		enabled: typeof icon.enabled === "boolean" ? icon.enabled : undefined,
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
