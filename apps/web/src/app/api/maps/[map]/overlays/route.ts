//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/api/maps/[map]/overlays/route.ts                                                    ////
//// Language: TS                                                                                               ////
//// Serves transitional map tile manifests and sample overlay features.                                         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import type {
	MapManifest,
	OverlayFeature,
	OverlaysResponse,
} from "@/components/maps/types";
import { getOptionalEnv } from "@/lib/server/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{
		map: string;
	}>;
};

const MAP_KEY_RE = /^[a-z0-9_-]+$/i;

const DEFAULT_PUBLIC_DIR_NAME = "public";
const DEFAULT_TILES_DIR_NAME = "tiles";

const SAMPLE_FEATURES: OverlayFeature[] = [
	{
		type: "point",
		id: "poi-hq",
		x: 8192,
		y: 8192,
		label: "HQ",
		gate: { allowRoles: ["officer", "admin"] },
	},
	{
		type: "rect",
		id: "claim-1",
		cx: 5000,
		cy: 6000,
		width: 800,
		height: 600,
		rotationDeg: 30,
		label: "Claim #1",
	},
	{
		type: "path",
		id: "route-alpha",
		points: [
			{ x: 1200, y: 1200 },
			{ x: 2400, y: 2100 },
			{ x: 4800, y: 1800 },
			{ x: 7200, y: 3600 },
		],
		label: "Route Alpha",
		gate: { denyRoles: ["guest"] },
	},
];

function runtimeJoin(...segments: string[]): string {
	return path.join(/* turbopackIgnore: true */ ...segments);
}

function runtimeResolve(value: string): string {
	return path.resolve(/* turbopackIgnore: true */ value);
}

function getTilesRoot(): string {
	const explicitTilesRoot = normalizePathEnv(getOptionalEnv("CM_TILES_ROOT"));
	if (explicitTilesRoot) {
		return explicitTilesRoot;
	}

	const explicitPublicRoot = normalizePathEnv(getOptionalEnv("CM_PUBLIC_ROOT"));
	if (explicitPublicRoot) {
		return runtimeJoin(explicitPublicRoot, DEFAULT_TILES_DIR_NAME);
	}

	return runtimeJoin(process.cwd(), DEFAULT_PUBLIC_DIR_NAME, DEFAULT_TILES_DIR_NAME);
}

function normalizePathEnv(value: string | null): string | null {
	const normalized = value?.trim();
	if (!normalized) {
		return null;
	}

	return runtimeResolve(normalized);
}

function normalizeMapKey(value: string): string | null {
	const normalized = value.trim();
	if (!MAP_KEY_RE.test(normalized)) {
		return null;
	}

	return normalized;
}

function isNumericDir(name: string): boolean {
	return /^[0-9]+$/.test(name);
}

async function pathIsDirectory(dirPath: string): Promise<boolean> {
	return fs.stat(dirPath)
		.then((stats) => stats.isDirectory())
		.catch(() => false);
}

async function pathIsFile(filePath: string): Promise<boolean> {
	return fs.stat(filePath)
		.then((stats) => stats.isFile())
		.catch(() => false);
}

async function readDirectory(dirPath: string): Promise<string[]> {
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

async function readPngFiles(dirPath: string): Promise<string[]> {
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	return entries
		.filter((entry) => entry.isFile() && entry.name.endsWith(".png"))
		.map((entry) => entry.name);
}

async function readPngWidth(filePath: string): Promise<number | null> {
	const handle = await fs.open(filePath, "r");

	try {
		const header = Buffer.alloc(32);
		const readResult = await handle.read(header, 0, 32, 0);
		if (readResult.bytesRead < 24) {
			return null;
		}

		const pngSignature = Buffer.from([
			0x89,
			0x50,
			0x4e,
			0x47,
			0x0d,
			0x0a,
			0x1a,
			0x0a,
		]);

		for (let index = 0; index < pngSignature.length; index += 1) {
			if (header[index] !== pngSignature[index]) {
				return null;
			}
		}

		const typeStart = 12;
		const isIhdr =
			header[typeStart] === 0x49 &&
			header[typeStart + 1] === 0x48 &&
			header[typeStart + 2] === 0x44 &&
			header[typeStart + 3] === 0x52;

		if (!isIhdr) {
			return null;
		}

		const width = header.readUInt32BE(16);
		return Number.isFinite(width) && width > 0 ? width : null;
	} catch {
		return null;
	} finally {
		await handle.close();
	}
}

async function detectTileSize(sampleTilePath: string | null): Promise<number> {
	if (!sampleTilePath) {
		return 256;
	}

	const pngWidth = await readPngWidth(sampleTilePath);
	return pngWidth && pngWidth > 0 ? pngWidth : 256;
}

async function findSampleTile(mapDir: string, zoomLevels: number[]): Promise<string | null> {
	const preferredSample = runtimeJoin(mapDir, "0", "0", "0.png");
	if (await pathIsFile(preferredSample)) {
		return preferredSample;
	}

	for (const zoomLevel of zoomLevels) {
		const zoomDir = runtimeJoin(mapDir, String(zoomLevel));
		const xDirectories = (await readDirectory(zoomDir)).filter(isNumericDir);

		for (const xDirectory of xDirectories) {
			const xDir = runtimeJoin(zoomDir, xDirectory);
			const pngFiles = await readPngFiles(xDir);
			if (pngFiles.length > 0) {
				return runtimeJoin(xDir, pngFiles[0]);
			}
		}
	}

	return null;
}

async function detectPyramid(mapKey: string): Promise<MapManifest | null> {
	const tilesRoot = getTilesRoot();
	const mapDir = runtimeJoin(tilesRoot, mapKey);

	if (!mapDir.startsWith(tilesRoot)) {
		return null;
	}

	if (!(await pathIsDirectory(mapDir))) {
		return null;
	}

	const zoomLevels = (await readDirectory(mapDir))
		.filter(isNumericDir)
		.map((entry) => Number(entry))
		.sort((a, b) => a - b);

	if (zoomLevels.length === 0) {
		return null;
	}

	const maxZoom = zoomLevels[zoomLevels.length - 1];
	const sampleTile = await findSampleTile(mapDir, zoomLevels);
	const tileSize = await detectTileSize(sampleTile);
	const diameter = tileSize * Math.pow(2, maxZoom);

	return {
		key: mapKey,
		tileUrl: `/tiles/${mapKey}/{z}/{x}/{y}.png`,
		minZoom: 0,
		maxZoom,
		tileSize,
		diameter,
		attribution: "CornMafia",
	};
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
	const params = await context.params;
	const mapKey = normalizeMapKey(params.map);

	if (!mapKey) {
		return NextResponse.json(
			{ error: "Invalid map key." },
			{ status: 400 },
		);
	}

	const manifest = await detectPyramid(mapKey);
	if (!manifest) {
		return NextResponse.json(
			{ error: `Tiles for '${mapKey}' were not found.` },
			{ status: 404 },
		);
	}

	const payload: OverlaysResponse = {
		manifest,
		features: SAMPLE_FEATURES,
	};

	return NextResponse.json(payload, {
		headers: { "Cache-Control": "no-store" },
	});
}
