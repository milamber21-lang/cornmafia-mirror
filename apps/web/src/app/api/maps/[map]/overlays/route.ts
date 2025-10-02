// FILE: apps/web/src/app/api/maps/[map]/overlays/route.ts
// Language: TypeScript
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import type {
  OverlaysResponse,
  OverlayFeature,
  MapManifest,
} from "@/components/maps/types";

// Root for Next public files served at / (so /public/tiles => /tiles)
const PUBLIC_DIR = path.join(process.cwd(), "public");
const TILES_ROOT = path.join(PUBLIC_DIR, "tiles");

function isNumericDir(name: string): boolean {
  return /^[0-9]+$/.test(name);
}

// Try to detect tile size by reading a single PNG/JPG.
// Uses 'image-size' if available, otherwise returns 256.
async function detectTileSize(sampleTile: string): Promise<number> {
  try {
    // Lazy import so we don't hard-require the package
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { imageSize } = await import("image-size");
    const buf = await fs.promises.readFile(sampleTile);
    const dim = imageSize(buf as unknown as ArrayBuffer);
    const w = typeof dim.width === "number" ? dim.width : 256;
    return w || 256;
  } catch {
    return 256;
  }
}

async function detectPyramid(mapKey: string): Promise<MapManifest | null> {
  const mapDir = path.join(TILES_ROOT, mapKey);
  const exists = await fs.promises
    .stat(mapDir)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!exists) return null;

  const zDirs = (await fs.promises.readdir(mapDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && isNumericDir(d.name))
    .map((d) => Number(d.name))
    .sort((a, b) => a - b);

  if (zDirs.length === 0) return null;
  const maxZoom = zDirs[zDirs.length - 1];

  // Find a sample tile to detect size (prefer z=0/0/0.png; fallback to any)
  let sampleTile = path.join(mapDir, "0", "0", "0.png");
  const sampleExists = await fs.promises
    .stat(sampleTile)
    .then((s) => s.isFile())
    .catch(() => false);

  if (!sampleExists) {
    // brute-force look for first *.png
    outer: for (const z of zDirs) {
      const zDir = path.join(mapDir, String(z));
      const xDirs = (await fs.promises.readdir(zDir, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && isNumericDir(d.name));
      for (const x of xDirs) {
        const xDir = path.join(zDir, x.name);
        const yFiles = (await fs.promises.readdir(xDir, { withFileTypes: true }))
          .filter((f) => f.isFile() && f.name.endsWith(".png"));
        if (yFiles.length > 0) {
          sampleTile = path.join(xDir, yFiles[0].name);
          break outer;
        }
      }
    }
  }

  const tileSize = await detectTileSize(sampleTile);
  const diameter = tileSize * Math.pow(2, maxZoom);

  const manifest: MapManifest = {
    key: mapKey,
    tileUrl: `/tiles/${mapKey}/{z}/{x}/{y}.png`,
    minZoom: 0,
    maxZoom,
    tileSize,
    diameter,
    attribution: "© CornMafia",
  };
  return manifest;
}

// Sample overlays (replace with CMS-backed data when ready)
const SAMPLE_FEATURES: OverlayFeature[] = [
  { type: "point", id: "poi-hq", x: 8192, y: 8192, label: "HQ", gate: { allowRoles: ["officer", "admin"] } },
  { type: "rect", id: "claim-1", cx: 5000, cy: 6000, width: 800, height: 600, rotationDeg: 30, label: "Claim #1" },
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

// Runtime guard for ctx.params.map (no 'any')
function hasParamsMap(v: unknown): v is { params: { map: string } } {
  if (!v || typeof v !== "object") return false;
  const params = (v as Record<string, unknown>).params;
  if (!params || typeof params !== "object") return false;
  const map = (params as Record<string, unknown>).map;
  return typeof map === "string" && map.length > 0;
}

export async function GET(_req: Request, ctx: unknown) {
  if (!hasParamsMap(ctx)) {
    return NextResponse.json({ error: "Invalid route context: missing 'params.map'" }, { status: 400 });
  }
  const key = ctx.params.map;

  const manifest = await detectPyramid(key);
  if (!manifest) {
    return NextResponse.json({ error: `Tiles for '${key}' not found at /public/tiles/${key}` }, { status: 404 });
  }

  const payload: OverlaysResponse = { manifest, features: SAMPLE_FEATURES };
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
