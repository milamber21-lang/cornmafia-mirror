//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/media/icon/[...path]/route.ts                                                     ////
//// Language: TS                                                                                                  ////
//// Streams sanitized colorized SVG icons after DB-backed media or enabled-icon resolution                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import { NextResponse } from "next/server";

import {
	findEnabledIconMediaFileByPath,
	findReadableMediaFileByPath,
} from "@/lib/data/media-file";
import { assertSafeMediaRelativePath } from "@/lib/helpers/media-files";
import {
	buildColorizedSvgIcon,
	buildSvgIconResponse,
	isSvgMediaIconFile,
} from "@/lib/helpers/svg-icon-response";
import { getCurrentActorDiscordId } from "@/lib/server/current-actor";

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
	try {
		const resolvedParams = await params;
		const rawSegments = Array.isArray(resolvedParams.path)
			? resolvedParams.path
			: [];
		const requestedRelativePath = assertSafeMediaRelativePath(
			rawSegments.join("/"),
		);
		const actorDiscordId = await getCurrentActorDiscordId();
		const mediaFile =
			(await findReadableMediaFileByPath({
				actorDiscordId,
				storageRelPath: requestedRelativePath,
			})) ??
			(await findEnabledIconMediaFileByPath({
				storageRelPath: requestedRelativePath,
			}));

		if (!mediaFile) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const safeResolvedPath = assertSafeMediaRelativePath(
			mediaFile.storageRelPath,
		);
		if (
			!isSvgMediaIconFile({
				mimeType: mediaFile.mimeType,
				storageRelPath: safeResolvedPath,
			})
		) {
			return NextResponse.json({ message: "Not Found" }, { status: 404 });
		}

		const icon = await buildColorizedSvgIcon({
			storageRelPath: safeResolvedPath,
			color: new URL(request.url).searchParams.get("color"),
		});

		return buildSvgIconResponse(icon);
	} catch (error: unknown) {
		const status = getStatusFromError(error);

		return NextResponse.json(
			{ message: status === 403 ? "Forbidden" : "Not Found" },
			{ status },
		);
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
