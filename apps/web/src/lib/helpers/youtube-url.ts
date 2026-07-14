//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/youtube-url.ts                                                               ////
//// Language: TS                                                                                                ////
//// Parses, validates, normalizes, and builds safe embed URLs for YouTube video fields.                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type ParsedYoutubeVideoUrl = {
	videoId: string;
	canonicalUrl: string;
	embedUrl: string;
};

export type YoutubeAuthorUrlResult =
	| {
			ok: true;
			videoId: string;
			canonicalUrl: string;
	  }
	| {
			ok: false;
			message: string;
	  };

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com"]);
const SHORT_YOUTUBE_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

function hasUnsafeUrlCharacter(value: string): boolean {
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (code <= 31 || code === 127 || /\s/u.test(character)) {
			return true;
		}
	}

	return false;
}

function cleanUrl(value: string): string | null {
	const trimmed = value.trim();
	if (trimmed.length === 0 || hasUnsafeUrlCharacter(trimmed)) {
		return null;
	}

	return trimmed;
}

function normalizeVideoId(value: string | null): string | null {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function firstPathSegment(pathname: string): string | null {
	const segment = pathname
		.split("/")
		.map((part) => part.trim())
		.find((part) => part.length > 0);

	return segment ?? null;
}

function buildParsedYoutubeVideoUrl(videoId: string): ParsedYoutubeVideoUrl {
	return {
		videoId,
		canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
		embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
	};
}

export function parseYoutubeVideoUrl(
	value: unknown,
): ParsedYoutubeVideoUrl | null {
	if (typeof value !== "string") {
		return null;
	}

	const cleaned = cleanUrl(value);
	if (!cleaned) {
		return null;
	}

	let parsed: URL;
	try {
		parsed = new URL(cleaned);
	} catch {
		return null;
	}

	if (parsed.protocol !== "https:") {
		return null;
	}

	const host = parsed.hostname.toLowerCase();

	if (SHORT_YOUTUBE_HOSTS.has(host)) {
		const videoId = normalizeVideoId(firstPathSegment(parsed.pathname));
		return videoId ? buildParsedYoutubeVideoUrl(videoId) : null;
	}

	if (!YOUTUBE_HOSTS.has(host)) {
		return null;
	}

	if (parsed.pathname === "/watch") {
		const videoId = normalizeVideoId(parsed.searchParams.get("v"));
		return videoId ? buildParsedYoutubeVideoUrl(videoId) : null;
	}

	if (parsed.pathname.startsWith("/shorts/")) {
		const videoId = normalizeVideoId(
			firstPathSegment(parsed.pathname.replace(/^\/shorts\/?/, "")),
		);
		return videoId ? buildParsedYoutubeVideoUrl(videoId) : null;
	}

	return null;
}

export function normalizeYoutubeAuthorUrl(
	value: unknown,
): YoutubeAuthorUrlResult {
	if (typeof value !== "string" || value.trim().length === 0) {
		return {
			ok: false,
			message: "Enter a YouTube video URL.",
		};
	}

	const parsed = parseYoutubeVideoUrl(value);
	if (!parsed) {
		return {
			ok: false,
			message:
				"Enter a valid YouTube video URL, youtu.be URL, or YouTube Shorts URL.",
		};
	}

	return {
		ok: true,
		videoId: parsed.videoId,
		canonicalUrl: parsed.canonicalUrl,
	};
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
