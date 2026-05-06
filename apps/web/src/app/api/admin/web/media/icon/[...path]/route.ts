//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/admin/web/media/icon/[...path]/route.ts                                            ////
//// Language: TS                                                                                                  ////
//// Streams sanitized colorized SVG icons for admin media previews                                                ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import {
	assertSafeMediaRelativePath,
} from "@/lib/helpers/media-files";
import {
	buildColorizedSvgIcon,
	buildSvgIconResponse,
	isSvgMediaIconFile,
} from "@/lib/helpers/svg-icon-response";
import { jsonError, requireAdminResponse } from "@/lib/server/admin-route";

function getStatusFromError(error: unknown): number {
	if (!(error instanceof Error)) {
		return 500;
	}

	if (
		error.message.includes("must not be absolute") ||
		error.message.includes("inside WEB_MEDIA_ROOT") ||
		error.message.includes("escaped WEB_MEDIA_ROOT")
	) {
		return 403;
	}

	return 404;
}

type MediaIconRouteContext = {
	params: Promise<{
		path?: string[];
	}>;
};

export async function GET(
	request: Request,
	{ params }: MediaIconRouteContext,
): Promise<Response> {
	const guardResponse = await requireAdminResponse();
	if (guardResponse) {
		return guardResponse;
	}

	try {
		const resolvedParams = await params;
		const rawSegments = Array.isArray(resolvedParams.path)
			? resolvedParams.path
			: [];
		const safeRelativePath = assertSafeMediaRelativePath(rawSegments.join("/"));
		if (
			!isSvgMediaIconFile({
				storageRelPath: safeRelativePath,
			})
		) {
			return jsonError("NOT_FOUND", "Not found.", 404);
		}

		const icon = await buildColorizedSvgIcon({
			storageRelPath: safeRelativePath,
			color: new URL(request.url).searchParams.get("color"),
		});

		return buildSvgIconResponse(icon);
	} catch (error: unknown) {
		const status = getStatusFromError(error);
		return status === 403
			? jsonError("PERMISSION_DENIED", "Forbidden", 403)
			: jsonError("NOT_FOUND", "Not found.", status === 404 ? 404 : 500);
	}
}
