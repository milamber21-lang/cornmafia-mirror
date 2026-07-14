//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/riseopedia-media-files.ts                                                   ////
//// Language: TS                                                                                             ////
//// Safe filesystem and URL helpers for generated Riseopedia media files.                                     ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { existsSync } from "fs";
import path from "path";

import { assertSafeMediaRelativePath } from "@/lib/helpers/media-files";
import { getOptionalAbsolutePathEnv } from "@/lib/server/env";

const DEFAULT_GAME_DATA_PATCHES_ROOT = "/app/data/gamedata/patches";
const PATCH_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const MEDIA_ID_PATTERN = /^[1-9][0-9]{0,18}$/;

function runtimeJoin(...segments: string[]): string {
	return path.join(/* turbopackIgnore: true */ ...segments);
}

function runtimeResolve(...segments: string[]): string {
	return path.resolve(/* turbopackIgnore: true */ ...segments);
}

function getFallbackGameDataPatchesRoot(): string {
	const candidates = [
		DEFAULT_GAME_DATA_PATCHES_ROOT,
		runtimeResolve(process.cwd(), "data", "gamedata", "patches"),
		runtimeResolve(process.cwd(), "..", "..", "data", "gamedata", "patches"),
	];

	const existingCandidate = candidates.find((candidate) =>
		existsSync(candidate),
	);
	return existingCandidate ?? DEFAULT_GAME_DATA_PATCHES_ROOT;
}

function getGameDataPatchesRoot(): string {
	return (
		getOptionalAbsolutePathEnv("GAME_DATA_PATCHES_ROOT") ??
		getFallbackGameDataPatchesRoot()
	);
}

function normalizeRiseopediaMediaSourceRootCode(
	value: string | null | undefined,
): "patch" | "manual" {
	return value === "manual" ? "manual" : "patch";
}

function assertPathInsideGameDataPatchesRoot(args: {
	root: string;
	absolutePath: string;
}): void {
	const normalizedRoot = path.normalize(args.root);
	const normalizedAbsolutePath = path.normalize(args.absolutePath);

	if (
		normalizedAbsolutePath !== normalizedRoot &&
		!normalizedAbsolutePath.startsWith(`${normalizedRoot}${path.sep}`)
	) {
		throw new Error(
			"Resolved Riseopedia media path escaped GAME_DATA_PATCHES_ROOT.",
		);
	}
}

export function assertSafeRiseopediaPatchCode(value: string): string {
	const normalized = value.trim();
	if (!PATCH_CODE_PATTERN.test(normalized)) {
		throw new Error(
			"Riseopedia patch code is not safe for filesystem resolution.",
		);
	}

	return normalized;
}

export function assertSafeRiseopediaMediaId(value: string): string {
	const normalized = value.trim();
	if (!MEDIA_ID_PATTERN.test(normalized)) {
		throw new Error("Riseopedia media ID is not safe for lookup.");
	}

	return normalized;
}

export function buildRiseopediaMediaFileUrl(mediaId: string): string {
	const safeMediaId = assertSafeRiseopediaMediaId(mediaId);
	return `/api/riseopedia/media/${encodeURIComponent(safeMediaId)}`;
}

export function resolveRiseopediaMediaAbsolutePath(args: {
	lastSeenPatchCode: string;
	mediaRelPath: string;
	sourceRootCode?: string | null;
}): string {
	const root = getGameDataPatchesRoot();
	const sourceRootCode = normalizeRiseopediaMediaSourceRootCode(
		args.sourceRootCode,
	);
	const safeRelativePath = assertSafeMediaRelativePath(args.mediaRelPath);
	const rootFolder =
		sourceRootCode === "manual"
			? "Manual"
			: assertSafeRiseopediaPatchCode(args.lastSeenPatchCode);
	const absolutePath = runtimeJoin(
		root,
		rootFolder,
		...safeRelativePath.split("/"),
	);

	assertPathInsideGameDataPatchesRoot({ root, absolutePath });

	return absolutePath;
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
