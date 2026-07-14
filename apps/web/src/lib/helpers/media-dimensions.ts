//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/lib/helpers/media-dimensions.ts                                                           ////
//// Language: TS                                                                                                 ////
//// Image dimension detection helpers for DB-first admin media uploads                                            ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";

export type MediaImageDimensions = {
	width: number | null;
	height: number | null;
};

function readUInt16BE(buffer: Buffer, offset: number): number {
	return buffer.readUInt16BE(offset);
}

function readUInt16LE(buffer: Buffer, offset: number): number {
	return buffer.readUInt16LE(offset);
}

function readUInt24LE(buffer: Buffer, offset: number): number {
	return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function hasPngSignature(buffer: Buffer): boolean {
	if (buffer.length < 24) {
		return false;
	}

	return (
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

function getPngDimensions(buffer: Buffer): MediaImageDimensions {
	if (!hasPngSignature(buffer)) {
		return { width: null, height: null };
	}

	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
	};
}

function getGifDimensions(buffer: Buffer): MediaImageDimensions {
	if (buffer.length < 10) {
		return { width: null, height: null };
	}

	const header = buffer.subarray(0, 6).toString("ascii");
	if (header !== "GIF87a" && header !== "GIF89a") {
		return { width: null, height: null };
	}

	return {
		width: readUInt16LE(buffer, 6),
		height: readUInt16LE(buffer, 8),
	};
}

function isJpegMarker(marker: number): boolean {
	return (
		marker >= 0xc0 &&
		marker <= 0xcf &&
		marker !== 0xc4 &&
		marker !== 0xc8 &&
		marker !== 0xcc
	);
}

function getJpegDimensions(buffer: Buffer): MediaImageDimensions {
	if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
		return { width: null, height: null };
	}

	let offset = 2;
	while (offset + 9 < buffer.length) {
		while (offset < buffer.length && buffer[offset] !== 0xff) {
			offset += 1;
		}

		if (offset + 3 >= buffer.length) {
			break;
		}

		let markerOffset = offset;
		while (markerOffset < buffer.length && buffer[markerOffset] === 0xff) {
			markerOffset += 1;
		}

		if (markerOffset >= buffer.length) {
			break;
		}

		const marker = buffer[markerOffset];
		offset = markerOffset + 1;

		if (marker === 0xd9 || marker === 0xda) {
			break;
		}

		if (offset + 2 > buffer.length) {
			break;
		}

		const segmentLength = readUInt16BE(buffer, offset);
		if (segmentLength < 2 || offset + segmentLength > buffer.length) {
			break;
		}

		if (isJpegMarker(marker) && segmentLength >= 7) {
			return {
				height: readUInt16BE(buffer, offset + 3),
				width: readUInt16BE(buffer, offset + 5),
			};
		}

		offset += segmentLength;
	}

	return { width: null, height: null };
}

function getWebpDimensions(buffer: Buffer): MediaImageDimensions {
	if (buffer.length < 30) {
		return { width: null, height: null };
	}

	if (
		buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
		buffer.subarray(8, 12).toString("ascii") !== "WEBP"
	) {
		return { width: null, height: null };
	}

	const chunkType = buffer.subarray(12, 16).toString("ascii");

	if (chunkType === "VP8X" && buffer.length >= 30) {
		return {
			width: readUInt24LE(buffer, 24) + 1,
			height: readUInt24LE(buffer, 27) + 1,
		};
	}

	if (chunkType === "VP8 " && buffer.length >= 30) {
		return {
			width: readUInt16LE(buffer, 26) & 0x3fff,
			height: readUInt16LE(buffer, 28) & 0x3fff,
		};
	}

	if (chunkType === "VP8L" && buffer.length >= 25) {
		const value = buffer.readUInt32LE(21);
		return {
			width: (value & 0x3fff) + 1,
			height: ((value >> 14) & 0x3fff) + 1,
		};
	}

	return { width: null, height: null };
}

function parseSvgDimensionValue(value: string | null): number | null {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0 || trimmed.endsWith("%")) {
		return null;
	}

	const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)/);
	if (!match) {
		return null;
	}

	const numeric = Number(match[1]);
	if (!Number.isFinite(numeric) || numeric <= 0) {
		return null;
	}

	return Math.round(numeric);
}

function getSvgAttribute(tag: string, attributeName: string): string | null {
	const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = tag.match(
		new RegExp(`${escapedName}\\s*=\\s*(["'])(.*?)\\1`, "i"),
	);
	return match ? match[2] : null;
}

function getSvgDimensions(buffer: Buffer): MediaImageDimensions {
	const content = buffer.toString("utf8");
	const svgTagMatch = content.match(/<svg\b[^>]*>/i);
	if (!svgTagMatch) {
		return { width: null, height: null };
	}

	const svgTag = svgTagMatch[0];
	const width = parseSvgDimensionValue(getSvgAttribute(svgTag, "width"));
	const height = parseSvgDimensionValue(getSvgAttribute(svgTag, "height"));

	if (width !== null && height !== null) {
		return { width, height };
	}

	const viewBox = getSvgAttribute(svgTag, "viewBox");
	if (!viewBox) {
		return { width, height };
	}

	const parts = viewBox
		.trim()
		.split(/[\s,]+/g)
		.map((part) => Number(part));

	if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
		return { width, height };
	}

	const [, , boxWidth, boxHeight] = parts;
	return {
		width: width ?? (boxWidth > 0 ? Math.round(boxWidth) : null),
		height: height ?? (boxHeight > 0 ? Math.round(boxHeight) : null),
	};
}

export function getImageDimensionsFromBuffer(
	buffer: Buffer,
	mimeType: string,
): MediaImageDimensions {
	const normalizedMimeType = mimeType.trim().toLowerCase();

	if (normalizedMimeType === "image/png") {
		return getPngDimensions(buffer);
	}

	if (normalizedMimeType === "image/gif") {
		return getGifDimensions(buffer);
	}

	if (
		normalizedMimeType === "image/jpeg" ||
		normalizedMimeType === "image/jpg"
	) {
		return getJpegDimensions(buffer);
	}

	if (normalizedMimeType === "image/webp") {
		return getWebpDimensions(buffer);
	}

	if (
		normalizedMimeType === "image/svg+xml" ||
		normalizedMimeType === "image/svg" ||
		normalizedMimeType === "application/xml" ||
		normalizedMimeType === "text/xml"
	) {
		return getSvgDimensions(buffer);
	}

	return { width: null, height: null };
}

export async function getImageDimensionsFromFile(
	file: File,
	mimeType: string,
): Promise<MediaImageDimensions> {
	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		return getImageDimensionsFromBuffer(buffer, mimeType);
	} catch {
		return { width: null, height: null };
	}
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
