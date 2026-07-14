//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/editors/richtext/rich-text-link-targets.ts                                           ////
//// Language: TS                                                                                                 ////
//// Defines and normalizes durable typed targets for RichText text and image links.                              ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

export type RichTextInternalContentLinkTarget = {
	kind: "internal_content";
	contentId: string;
	href: string;
};

export type RichTextRiseopediaEntityLinkTarget = {
	kind: "riseopedia_entity";
	entityId: string;
	href: string;
};

export type RichTextExternalLinkTarget = {
	kind: "external";
	href: string;
	newTab: boolean;
};

export type RichTextLegacyLinkTarget = {
	kind: "legacy";
	href: string;
	newTab: boolean;
};

export type RichTextLinkTarget =
	| RichTextInternalContentLinkTarget
	| RichTextRiseopediaEntityLinkTarget
	| RichTextExternalLinkTarget
	| RichTextLegacyLinkTarget;

export type RichTextLinkTargetFallback = {
	href?: string | null;
	newTab?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalizedValue = value.trim();
	return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeIdentifier(value: unknown): string | null {
	if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
		return String(value);
	}

	const normalizedValue = normalizeString(value);
	if (!normalizedValue || !/^\d+$/.test(normalizedValue)) {
		return null;
	}

	return normalizedValue.replace(/^0+(?=\d)/, "");
}

export function createLegacyRichTextLinkTarget(
	href: string,
	newTab = false,
): RichTextLegacyLinkTarget | null {
	const normalizedHref = normalizeString(href);
	if (!normalizedHref) {
		return null;
	}

	return {
		kind: "legacy",
		href: normalizedHref,
		newTab,
	};
}

export function normalizeRichTextLinkTarget(
	value: unknown,
	fallback: RichTextLinkTargetFallback = {},
): RichTextLinkTarget | null {
	if (isRecord(value)) {
		const kind = normalizeString(value.kind);
		const href = normalizeString(value.href) ?? normalizeString(fallback.href);

		if (kind === "internal_content" && href) {
			const contentId = normalizeIdentifier(value.contentId);
			if (contentId) {
				return { kind, contentId, href };
			}
		}

		if (kind === "riseopedia_entity" && href) {
			const entityId = normalizeIdentifier(value.entityId);
			if (entityId) {
				return { kind, entityId, href };
			}
		}

		if ((kind === "external" || kind === "legacy") && href) {
			return {
				kind,
				href,
				newTab:
					typeof value.newTab === "boolean"
						? value.newTab
						: fallback.newTab === true,
			};
		}
	}

	const fallbackHref = normalizeString(fallback.href);
	return fallbackHref
		? createLegacyRichTextLinkTarget(fallbackHref, fallback.newTab === true)
		: null;
}

export function richTextLinkTargetHref(target: RichTextLinkTarget): string {
	return target.href;
}

export function richTextLinkTargetOpensNewTab(
	target: RichTextLinkTarget,
): boolean {
	return (
		(target.kind === "external" || target.kind === "legacy") &&
		target.newTab === true
	);
}

export function richTextLinkTargetsEqual(
	left: RichTextLinkTarget | null | undefined,
	right: RichTextLinkTarget | null | undefined,
): boolean {
	if (!left || !right) {
		return left === right;
	}

	if (left.kind !== right.kind || left.href !== right.href) {
		return false;
	}

	if (left.kind === "internal_content" && right.kind === "internal_content") {
		return left.contentId === right.contentId;
	}

	if (left.kind === "riseopedia_entity" && right.kind === "riseopedia_entity") {
		return left.entityId === right.entityId;
	}

	if (
		(left.kind === "external" || left.kind === "legacy") &&
		(right.kind === "external" || right.kind === "legacy")
	) {
		return left.newTab === right.newTab;
	}

	return false;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
