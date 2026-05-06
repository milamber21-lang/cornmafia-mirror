//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-upload-validation.ts                                                     ////
//// Language: TS                                                                                                  ////
//// Server-side media upload content validation based on verified bytes instead of browser MIME claims             ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import "server-only";

import { sanitizeSvg } from "@/lib/helpers/svg-sanitizer";

export type VerifiedMediaMimeType =
	| "image/jpeg"
	| "image/png"
	| "image/webp"
	| "image/gif"
	| "image/svg+xml"
	| "video/mp4"
	| "video/webm";

export type ValidatedUploadFile = {
	buffer: Buffer;
	mimeType: VerifiedMediaMimeType;
	extension: string;
	sizeBytes: number;
	declaredMimeType: string | null;
};

export class UploadValidationError extends Error {
	readonly status = 400;
	readonly code = "VALIDATION_REQUIRED";

	constructor(message: string) {
		super(message);
		this.name = "UploadValidationError";
	}
}

const MIME_EXTENSION_MAP: Record<VerifiedMediaMimeType, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/webp": ".webp",
	"image/gif": ".gif",
	"image/svg+xml": ".svg",
	"video/mp4": ".mp4",
	"video/webm": ".webm",
};

const DECLARED_MIME_ALIASES: Record<string, VerifiedMediaMimeType> = {
	"image/jpeg": "image/jpeg",
	"image/jpg": "image/jpeg",
	"image/pjpeg": "image/jpeg",
	"image/png": "image/png",
	"image/x-png": "image/png",
	"image/webp": "image/webp",
	"image/gif": "image/gif",
	"image/svg+xml": "image/svg+xml",
	"image/svg": "image/svg+xml",
	"application/svg+xml": "image/svg+xml",
	"application/xml": "image/svg+xml",
	"text/xml": "image/svg+xml",
	"video/mp4": "video/mp4",
	"video/webm": "video/webm",
};

const EMPTY_OR_GENERIC_DECLARED_TYPES = new Set<string>([
	"",
	"application/octet-stream",
	"binary/octet-stream",
]);

const MP4_BRANDS = new Set<string>([
	"avc1",
	"dash",
	"iso2",
	"iso3",
	"iso4",
	"iso5",
	"iso6",
	"isom",
	"m4v ",
	"mp41",
	"mp42",
	"mp4v",
]);

function ascii(buffer: Buffer, start: number, end: number): string {
	if (start < 0 || end > buffer.length || start >= end) {
		return "";
	}

	return buffer.subarray(start, end).toString("ascii");
}

function hasPngSignature(buffer: Buffer): boolean {
	return (
		buffer.length >= 8 &&
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	);
}

function hasJpegSignature(buffer: Buffer): boolean {
	return (
		buffer.length >= 4 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff
	);
}

function hasGifSignature(buffer: Buffer): boolean {
	if (buffer.length < 6) {
		return false;
	}

	const header = ascii(buffer, 0, 6);
	return header === "GIF87a" || header === "GIF89a";
}

function hasWebpSignature(buffer: Buffer): boolean {
	if (buffer.length < 16) {
		return false;
	}

	const riffType = ascii(buffer, 0, 4);
	const webpType = ascii(buffer, 8, 12);
	const chunkType = ascii(buffer, 12, 16);
	return (
		riffType === "RIFF" &&
		webpType === "WEBP" &&
		["VP8 ", "VP8L", "VP8X"].includes(chunkType)
	);
}

function hasMp4Signature(buffer: Buffer): boolean {
	if (buffer.length < 16 || ascii(buffer, 4, 8) !== "ftyp") {
		return false;
	}

	const scanEnd = Math.min(buffer.length, 80);
	for (let index = 8; index + 4 <= scanEnd; index += 4) {
		if (MP4_BRANDS.has(ascii(buffer, index, index + 4))) {
			return true;
		}
	}

	return false;
}

function hasWebmSignature(buffer: Buffer): boolean {
	if (
		buffer.length < 4 ||
		buffer[0] !== 0x1a ||
		buffer[1] !== 0x45 ||
		buffer[2] !== 0xdf ||
		buffer[3] !== 0xa3
	) {
		return false;
	}

	return ascii(buffer, 0, Math.min(buffer.length, 4096))
		.toLowerCase()
		.includes("webm");
}

function decodeUtf8Strict(buffer: Buffer): string | null {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
	} catch {
		return null;
	}
}

function normalizeDeclaredMimeType(value: string): VerifiedMediaMimeType | null {
	const normalizedValue = value.trim().toLowerCase().split(";")[0] ?? "";
	return DECLARED_MIME_ALIASES[normalizedValue] ?? null;
}

function getDeclaredMimeType(file: File): string | null {
	const rawValue = file.type.trim().toLowerCase();
	return rawValue.length > 0 ? rawValue : null;
}

function assertDeclaredMimeCompatible(args: {
	declaredMimeType: string | null;
	detectedMimeType: VerifiedMediaMimeType;
}): void {
	const declaredMimeType = args.declaredMimeType ?? "";
	if (EMPTY_OR_GENERIC_DECLARED_TYPES.has(declaredMimeType)) {
		return;
	}

	const normalizedDeclaredMimeType = normalizeDeclaredMimeType(declaredMimeType);
	if (!normalizedDeclaredMimeType) {
		throw new UploadValidationError(
			`Unsupported declared MIME type: ${declaredMimeType}.`,
		);
	}

	if (normalizedDeclaredMimeType !== args.detectedMimeType) {
		throw new UploadValidationError(
			"File content does not match the declared MIME type.",
		);
	}
}

function detectBinaryMimeType(buffer: Buffer): VerifiedMediaMimeType | null {
	if (hasPngSignature(buffer)) {
		return "image/png";
	}

	if (hasJpegSignature(buffer)) {
		return "image/jpeg";
	}

	if (hasGifSignature(buffer)) {
		return "image/gif";
	}

	if (hasWebpSignature(buffer)) {
		return "image/webp";
	}

	if (hasMp4Signature(buffer)) {
		return "video/mp4";
	}

	if (hasWebmSignature(buffer)) {
		return "video/webm";
	}

	return null;
}

function detectAndSanitizeSvg(buffer: Buffer): Buffer | null {
	const decoded = decodeUtf8Strict(buffer);
	if (!decoded) {
		return null;
	}

	const sanitized = sanitizeSvg(decoded, { colorMode: "keep" });
	if (!sanitized.trim().toLowerCase().startsWith("<svg")) {
		return null;
	}

	return Buffer.from(sanitized, "utf8");
}

async function readFileBuffer(file: File, maxBytes: number): Promise<Buffer> {
	if (file.size <= 0) {
		throw new UploadValidationError("Uploaded file is empty.");
	}

	if (file.size > maxBytes) {
		throw new UploadValidationError(`Max file size is ${maxBytes} bytes.`);
	}

	return Buffer.from(await file.arrayBuffer());
}

export async function validateUploadedMediaFile(args: {
	file: File;
	maxBytes: number;
	allowedMimeTypes: ReadonlySet<VerifiedMediaMimeType>;
}): Promise<ValidatedUploadFile> {
	const originalBuffer = await readFileBuffer(args.file, args.maxBytes);
	const binaryMimeType = detectBinaryMimeType(originalBuffer);
	const svgBuffer = binaryMimeType ? null : detectAndSanitizeSvg(originalBuffer);
	const detectedMimeType: VerifiedMediaMimeType | null =
		binaryMimeType ?? (svgBuffer ? "image/svg+xml" : null);

	if (!detectedMimeType) {
		throw new UploadValidationError("Unsupported or unrecognized file content.");
	}

	if (!args.allowedMimeTypes.has(detectedMimeType)) {
		throw new UploadValidationError(`Unsupported MIME type: ${detectedMimeType}.`);
	}

	const declaredMimeType = getDeclaredMimeType(args.file);
	assertDeclaredMimeCompatible({
		declaredMimeType,
		detectedMimeType,
	});

	const buffer = svgBuffer ?? originalBuffer;
	return {
		buffer,
		mimeType: detectedMimeType,
		extension: MIME_EXTENSION_MAP[detectedMimeType],
		sizeBytes: buffer.length,
		declaredMimeType,
	};
}
