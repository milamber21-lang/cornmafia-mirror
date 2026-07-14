//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-files.ts                                                                 ////
//// Language: TS                                                                                                  ////
//// Media filesystem helpers for DB-first web uploads                                                             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

import { buildAppMediaFileUrl } from "@/lib/helpers/media-url";
import {
	getSafeExtension,
	sanitizeDisplayFilename,
	sanitizeStorageSegment,
} from "@/lib/helpers/media-sanitize";
import { getOptionalEnv } from "@/lib/server/env";

const DEFAULT_MEDIA_ROOT = "/app/data/media";
const TRASH_DIR_SEGMENT = "_trash";

export function getRequiredMediaRoot(): string {
	const value = getOptionalEnv("WEB_MEDIA_ROOT");
	const root = value ?? DEFAULT_MEDIA_ROOT;
	if (!path.isAbsolute(root)) {
		throw new Error("WEB_MEDIA_ROOT must be an absolute in-container path.");
	}
	return root;
}

export function assertSafeMediaRelativePath(input: string): string {
	const decoded = decodeURIComponent(input).replace(/\\+/g, "/").trim();
	if (decoded.length === 0) {
		throw new Error("Media relative path is required.");
	}
	if (decoded.startsWith("/")) {
		throw new Error("Media relative path must not be absolute.");
	}

	const normalized = path.posix.normalize(decoded);
	if (
		normalized === "." ||
		normalized.startsWith("../") ||
		normalized.includes("/../")
	) {
		throw new Error("Media relative path must stay inside WEB_MEDIA_ROOT.");
	}
	return normalized;
}

export function resolveMediaAbsolutePath(storageRelPath: string): string {
	const root = getRequiredMediaRoot();
	const safeRelativePath = assertSafeMediaRelativePath(storageRelPath);
	const absolutePath = path.join(
		/*turbopackIgnore: true*/ root,
		...safeRelativePath.split("/"),
	);
	const normalizedRoot = path.normalize(root);
	const normalizedAbsolutePath = path.normalize(absolutePath);

	if (
		normalizedAbsolutePath !== normalizedRoot &&
		!normalizedAbsolutePath.startsWith(`${normalizedRoot}${path.sep}`)
	) {
		throw new Error("Resolved media path escaped WEB_MEDIA_ROOT.");
	}

	return normalizedAbsolutePath;
}

export function buildMediaDirectoryPrefix(args: {
	categorySlug: string | null;
	subcategorySlug: string | null;
	isShared: boolean;
	ownerDiscordId: string | null;
}): string {
	const categorySegment = sanitizeStorageSegment(
		args.categorySlug ?? "",
		"_uncat",
	);
	const subcategorySegment = sanitizeStorageSegment(
		args.subcategorySlug ?? "",
		"_unsub",
	);
	const ownerSegment = args.isShared
		? "_shared"
		: sanitizeStorageSegment(args.ownerDiscordId ?? "", "_owner");

	return path.posix.join(categorySegment, subcategorySegment, ownerSegment);
}

export function buildMediaStorageRelativePath(args: {
	categorySlug: string | null;
	subcategorySlug: string | null;
	isShared: boolean;
	ownerDiscordId: string | null;
	filename: string;
}): string {
	const prefix = buildMediaDirectoryPrefix({
		categorySlug: args.categorySlug,
		subcategorySlug: args.subcategorySlug,
		isShared: args.isShared,
		ownerDiscordId: args.ownerDiscordId,
	});
	const filename = sanitizeStorageSegment(
		args.filename,
		randomBytes(12).toString("hex"),
	);
	return path.posix.join(prefix, filename);
}

function normalizeStoredExtension(
	extension: string | null | undefined,
): string | null {
	if (!extension) {
		return null;
	}

	const normalized = extension.trim().toLowerCase();
	const value = normalized.startsWith(".") ? normalized : `.${normalized}`;
	return /^\.[a-z0-9]{1,10}$/.test(value) ? value : null;
}

export function createStoredFilename(
	originalFilename: string,
	contentExtension?: string | null,
): {
	filename: string;
	originalFilename: string;
} {
	const sanitizedOriginalFilename = sanitizeDisplayFilename(
		originalFilename,
		"file",
	);
	const extension =
		normalizeStoredExtension(contentExtension) ??
		getSafeExtension(sanitizedOriginalFilename);
	const generatedBase = randomBytes(12).toString("hex");
	return {
		filename: `${generatedBase}${extension}`,
		originalFilename: sanitizedOriginalFilename,
	};
}

export function getMediaFileUrl(storageRelPath: string): string {
	return buildAppMediaFileUrl(storageRelPath);
}

export async function ensureMediaParentDirectory(
	storageRelPath: string,
): Promise<void> {
	const absolutePath = resolveMediaAbsolutePath(storageRelPath);
	await fs.mkdir(path.dirname(absolutePath), { recursive: true });
}

export async function writeUploadedMediaFile(args: {
	storageRelPath: string;
	buffer: Buffer;
}): Promise<void> {
	await ensureMediaParentDirectory(args.storageRelPath);
	const absolutePath = resolveMediaAbsolutePath(args.storageRelPath);
	await fs.writeFile(absolutePath, args.buffer, { flag: "wx" });
}

export async function moveMediaFile(
	oldStorageRelPath: string,
	newStorageRelPath: string,
): Promise<void> {
	await ensureMediaParentDirectory(newStorageRelPath);
	const oldAbsolutePath = resolveMediaAbsolutePath(oldStorageRelPath);
	const newAbsolutePath = resolveMediaAbsolutePath(newStorageRelPath);
	await fs.rename(oldAbsolutePath, newAbsolutePath);
}

export async function stageDeleteMediaFile(
	storageRelPath: string,
): Promise<string> {
	const stagedRelativePath = path.posix.join(
		TRASH_DIR_SEGMENT,
		`${Date.now()}-${path.posix.basename(assertSafeMediaRelativePath(storageRelPath))}`,
	);
	await moveMediaFile(storageRelPath, stagedRelativePath);
	return stagedRelativePath;
}

export async function restoreStagedMediaFile(
	stagedRelativePath: string,
	destinationRelativePath: string,
): Promise<void> {
	await moveMediaFile(stagedRelativePath, destinationRelativePath);
}

export async function deleteMediaFileIfExists(
	storageRelPath: string,
): Promise<void> {
	const absolutePath = resolveMediaAbsolutePath(storageRelPath);
	try {
		await fs.unlink(absolutePath);
	} catch (error: unknown) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			(error as { code?: string }).code === "ENOENT"
		) {
			return;
		}
		throw error;
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
