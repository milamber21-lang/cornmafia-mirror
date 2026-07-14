//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/mafiosopedia-release.ts                                                        ////
//// Language: TS                                                                                               ////
//// Shared Mafiosopedia single-release-view normalization for server-side wiki read helpers.                   ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export const MAFIOSOPEDIA_RELEASE_FILTER_CODES = [
	"public",
	"patch",
	"evidence",
	"manual",
] as const;

export const MAFIOSOPEDIA_RELEASE_VIEW_CODES = [
	"all",
	...MAFIOSOPEDIA_RELEASE_FILTER_CODES,
] as const;

export type MafiosopediaReleaseFilterCode =
	(typeof MAFIOSOPEDIA_RELEASE_FILTER_CODES)[number];

export type MafiosopediaReleaseViewCode =
	(typeof MAFIOSOPEDIA_RELEASE_VIEW_CODES)[number];

export type MafiosopediaReleaseFilterFlags = {
	public: boolean;
	patch: boolean;
	evidence: boolean;
	manual: boolean;
};

const RELEASE_FILTER_CODE_SET = new Set<string>(
	MAFIOSOPEDIA_RELEASE_FILTER_CODES,
);
const RELEASE_VIEW_CODE_SET = new Set<string>(MAFIOSOPEDIA_RELEASE_VIEW_CODES);

export const DEFAULT_MAFIOSOPEDIA_RELEASE_VIEW: MafiosopediaReleaseViewCode =
	"all";

export function mafiosopediaReleaseFiltersForView(
	view: MafiosopediaReleaseViewCode,
): MafiosopediaReleaseFilterCode[] {
	return view === "all" ? [...MAFIOSOPEDIA_RELEASE_FILTER_CODES] : [view];
}

function normalizedReleaseViewCode(
	value: string | null | undefined,
): MafiosopediaReleaseViewCode | null {
	const normalized = value?.trim().toLowerCase();
	return normalized && RELEASE_VIEW_CODE_SET.has(normalized)
		? (normalized as MafiosopediaReleaseViewCode)
		: null;
}

export function parseMafiosopediaReleaseView(
	value: string | readonly string[] | null | undefined,
): MafiosopediaReleaseViewCode {
	const rawValue = Array.isArray(value) ? value[0] : value;
	const directMatch =
		typeof rawValue === "string" ? normalizedReleaseViewCode(rawValue) : null;

	if (directMatch) {
		return directMatch;
	}

	/* Accept legacy comma-separated links safely, but normalize them to one view. */
	const legacyFilters =
		typeof rawValue === "string"
			? rawValue
					.split(",")
					.map((entry) => entry.trim().toLowerCase())
					.filter((entry): entry is MafiosopediaReleaseFilterCode =>
						RELEASE_FILTER_CODE_SET.has(entry),
					)
			: [];

	if (legacyFilters.length === 1) {
		return legacyFilters[0];
	}

	return DEFAULT_MAFIOSOPEDIA_RELEASE_VIEW;
}

export function parseMafiosopediaReleaseFilters(
	value: string | readonly string[] | null | undefined,
): MafiosopediaReleaseFilterCode[] {
	return mafiosopediaReleaseFiltersForView(parseMafiosopediaReleaseView(value));
}

export function mafiosopediaReleaseViewFromFilters(
	filters: readonly MafiosopediaReleaseFilterCode[] | null | undefined,
): MafiosopediaReleaseViewCode {
	const normalized = Array.from(
		new Set(
			(filters ?? []).filter((filter): filter is MafiosopediaReleaseFilterCode =>
				RELEASE_FILTER_CODE_SET.has(filter),
			),
		),
	).sort();
	const allFilters = [...MAFIOSOPEDIA_RELEASE_FILTER_CODES].sort();

	if (
		normalized.length === allFilters.length &&
		normalized.every((filter, index) => filter === allFilters[index])
	) {
		return "all";
	}

	return normalized.length === 1
		? normalized[0]
		: DEFAULT_MAFIOSOPEDIA_RELEASE_VIEW;
}

export function mafiosopediaReleaseFilterFlags(
	filters: readonly MafiosopediaReleaseFilterCode[],
): MafiosopediaReleaseFilterFlags {
	const view = mafiosopediaReleaseViewFromFilters(filters);
	const effectiveFilters = mafiosopediaReleaseFiltersForView(view);

	return {
		public: effectiveFilters.includes("public"),
		patch: effectiveFilters.includes("patch"),
		evidence: effectiveFilters.includes("evidence"),
		manual: effectiveFilters.includes("manual"),
	};
}

export function hasNonDefaultMafiosopediaReleaseFilters(
	filters: readonly MafiosopediaReleaseFilterCode[],
): boolean {
	return (
		mafiosopediaReleaseViewFromFilters(filters) !==
		DEFAULT_MAFIOSOPEDIA_RELEASE_VIEW
	);
}

export function mafiosopediaReleaseSearchParam(
	filters: readonly MafiosopediaReleaseFilterCode[],
): MafiosopediaReleaseViewCode {
	return mafiosopediaReleaseViewFromFilters(filters);
}

export function appendMafiosopediaReleaseSearchParam(args: {
	href: string;
	filters: readonly MafiosopediaReleaseFilterCode[];
}): string {
	const separator = args.href.includes("?") ? "&" : "?";
	return `${args.href}${separator}release=${encodeURIComponent(
		mafiosopediaReleaseSearchParam(args.filters),
	)}`;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
