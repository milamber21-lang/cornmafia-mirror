// FILE: apps/web/src/components/maps/MapViewer.tsx
// Language: TSX
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { MapManifest, OverlayFeature } from "./types";

const LeafletMap = dynamic(() => import("./MapViewerLeaflet"), { ssr: false });

export type MapViewerProps = {
  manifest: MapManifest;
  features: OverlayFeature[];
  roles: string[];
};

export default function MapViewer(props: MapViewerProps) {
  return <LeafletMap {...props} />;
}
