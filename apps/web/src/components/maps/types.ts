// FILE: apps/web/src/components/maps/types.ts
// Language: TypeScript

export type RoleName = string;

export type PermissionGate = {
  allowRoles?: string[];
  denyRoles?: string[];
};

export type MapManifest = {
  key: string;
  tileUrl: string;   // e.g. "/tiles/map-a/{z}/{x}/{y}.png"
  minZoom: number;   // 0
  maxZoom: number;   // 6
  tileSize: number;  // 256
  diameter: number;  // your “map diameter” units
  attribution?: string;
};

export type PointFeature = {
  type: "point";
  id: string;
  x: number;
  y: number;
  label?: string;
  gate?: PermissionGate;
};

export type RectFeature = {
  type: "rect";
  id: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number; // clockwise
  label?: string;
  gate?: PermissionGate;
};

export type PathFeature = {
  type: "path";
  id: string;
  points: { x: number; y: number }[];
  label?: string;
  gate?: PermissionGate;
};

export type OverlayFeature = PointFeature | RectFeature | PathFeature;

export type OverlaysResponse = {
  manifest: MapManifest;
  features: OverlayFeature[];
};

export function passesGate(
  roles: string[],
  gate?: PermissionGate
): boolean {
  if (!gate) return true;
  if (Array.isArray(gate.denyRoles) && gate.denyRoles.some((r) => roles.includes(r))) {
    return false;
  }
  if (Array.isArray(gate.allowRoles) && gate.allowRoles.length > 0) {
    return gate.allowRoles.some((r) => roles.includes(r));
  }
  return true;
}
