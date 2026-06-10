//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/mafiosopedia-media-files.ts                                                   ////
//// Language: TS                                                                                             ////
//// Safe filesystem and URL helpers for generated Mafiosopedia media files.                                      ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

	const existingCandidate = candidates.find((candidate) => existsSync(candidate));
	return existingCandidate ?? DEFAULT_GAME_DATA_PATCHES_ROOT;
}

function getGameDataPatchesRoot(): string {
	return getOptionalAbsolutePathEnv("GAME_DATA_PATCHES_ROOT") ?? getFallbackGameDataPatchesRoot();
}

export function assertSafeMafiosopediaPatchCode(value: string): string {
	const normalized = value.trim();
	if (!PATCH_CODE_PATTERN.test(normalized)) {
		throw new Error("Mafiosopedia patch code is not safe for filesystem resolution.");
	}

	return normalized;
}

export function assertSafeMafiosopediaMediaId(value: string): string {
	const normalized = value.trim();
	if (!MEDIA_ID_PATTERN.test(normalized)) {
		throw new Error("Mafiosopedia media ID is not safe for lookup.");
	}

	return normalized;
}

export function buildMafiosopediaMediaFileUrl(mediaId: string): string {
	const safeMediaId = assertSafeMafiosopediaMediaId(mediaId);
	return `/api/mafiosopedia/media/${encodeURIComponent(safeMediaId)}`;
}

export function resolveMafiosopediaMediaAbsolutePath(args: {
	lastSeenPatchCode: string;
	mediaRelPath: string;
}): string {
	const root = getGameDataPatchesRoot();
	const patchCode = assertSafeMafiosopediaPatchCode(args.lastSeenPatchCode);
	const safeRelativePath = assertSafeMediaRelativePath(args.mediaRelPath);
	const absolutePath = runtimeJoin(root, patchCode, ...safeRelativePath.split("/"));
	const normalizedRoot = path.normalize(root);
	const normalizedAbsolutePath = path.normalize(absolutePath);

	if (
		normalizedAbsolutePath !== normalizedRoot &&
		!normalizedAbsolutePath.startsWith(`${normalizedRoot}${path.sep}`)
	) {
		throw new Error("Resolved Mafiosopedia media path escaped GAME_DATA_PATCHES_ROOT.");
	}

	return normalizedAbsolutePath;
}
