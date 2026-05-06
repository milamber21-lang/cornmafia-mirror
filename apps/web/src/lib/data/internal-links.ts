//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/data/internal-links.ts                                                               ////
//// Language: TS                                                                                                ////
//// DB-first internal content-route link validation helper for editor workflows                                  ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "server-only";

import { query } from "@/lib/data/pg";

type InternalLinkValidationDbRow = {
	is_allowed: boolean | null;
	normalized_path: string | null;
	public_route_prefix: string | null;
	category_slug: string | null;
	subcategory_slug: string | null;
	content_slug: string | null;
	target_content_id: string | null;
	target_title: string | null;
	error_message: string | null;
};

export type InternalLinkValidationResult = {
	isAllowed: boolean;
	normalizedPath: string | null;
	publicRoutePrefix: string | null;
	categorySlug: string | null;
	subcategorySlug: string | null;
	contentSlug: string | null;
	targetContentId: string | null;
	targetTitle: string | null;
	errorMessage: string | null;
};

function mapInternalLinkValidationRow(
	row: InternalLinkValidationDbRow | undefined,
): InternalLinkValidationResult {
	return {
		isAllowed: row?.is_allowed === true,
		normalizedPath: row?.normalized_path ?? null,
		publicRoutePrefix: row?.public_route_prefix ?? null,
		categorySlug: row?.category_slug ?? null,
		subcategorySlug: row?.subcategory_slug ?? null,
		contentSlug: row?.content_slug ?? null,
		targetContentId: row?.target_content_id ?? null,
		targetTitle: row?.target_title ?? null,
		errorMessage: row?.error_message ?? null,
	};
}

export async function validateInternalLinkPath(args: {
	actorDiscordId: string;
	rawPath: string;
}): Promise<InternalLinkValidationResult> {
	const result = await query<InternalLinkValidationDbRow>(
		`
			SELECT is_allowed,
				   normalized_path,
				   public_route_prefix,
				   category_slug,
				   subcategory_slug,
				   content_slug,
				   target_content_id,
				   target_title,
				   error_message
			FROM web_api.web_internal_link_validate($1, $2)
		`,
		[args.actorDiscordId, args.rawPath],
	);

	return mapInternalLinkValidationRow(result.rows[0]);
}
