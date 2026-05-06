//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/maps/MapViewerLeaflet.tsx                                                      ////
//// Language: TSX                                                                                                ////
//// Leaflet map viewer implementation for gated map overlays.                                                    ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
"use client";

import * as React from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Polyline,
	Polygon,
	Tooltip,
} from "react-leaflet";
import L, { CRS, type LatLngExpression, type LatLng } from "leaflet";

import { passesGate, type MapManifest, type OverlayFeature } from "./types";

export type MapViewerLeafletProps = {
	manifest: MapManifest;
	features: OverlayFeature[];
	roles: string[];
};

/** Convert image pixel (x,y) to Leaflet latlng using CRS.Simple at maxZoom. */
function pxToLatLng(x: number, y: number, maxZoom: number): LatLng {
	return CRS.Simple.pointToLatLng(L.point(x, y), maxZoom);
}

function rectToPolygonLatLngs(
	cx: number,
	cy: number,
	width: number,
	height: number,
	rotationDeg: number,
	maxZoom: number,
): LatLngExpression[] {
	const hw = width / 2;
	const hh = height / 2;
	const base = [
		{ x: -hw, y: -hh },
		{ x: hw, y: -hh },
		{ x: hw, y: hh },
		{ x: -hw, y: hh },
	];
	const rad = (rotationDeg * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const rot = (p: { x: number; y: number }) => ({
		x: cx + p.x * cos - p.y * sin,
		y: cy + p.x * sin + p.y * cos,
	});
	const cornersPx = base.map(rot);
	return cornersPx.map((p) => {
		const ll = pxToLatLng(p.x, p.y, maxZoom);
		return [ll.lat, ll.lng];
	});
}

export default function MapViewerLeaflet({
	manifest,
	features,
	roles,
}: MapViewerLeafletProps) {
	const { diameter, minZoom, maxZoom, tileSize, tileUrl, attribution } =
		manifest;

	// Finite image bounds from pixel corners
	const southWest = pxToLatLng(0, diameter, maxZoom);
	const northEast = pxToLatLng(diameter, 0, maxZoom);
	const bounds = L.latLngBounds(southWest, northEast);

	const markerIcon = L.divIcon({ className: "cm-marker" });
	const centerLL = pxToLatLng(diameter / 2, diameter / 2, maxZoom);

	return (
		<div className="cm-map-wrap">
			<MapContainer
				className="cm-map"
				crs={CRS.Simple}
				bounds={bounds}
				maxBounds={bounds}
				maxBoundsViscosity={1.0}
				minZoom={minZoom}
				maxZoom={maxZoom}
				zoom={Math.max(minZoom, Math.min(2, maxZoom))}
				center={centerLL}
				scrollWheelZoom
				attributionControl={false}
			>
				<TileLayer
					url={tileUrl}
					tileSize={tileSize}
					noWrap
					bounds={bounds}
					minNativeZoom={0}
					maxNativeZoom={maxZoom}
					// XYZ pyramid (top-left origin). Do NOT set tms:true.
					attribution={attribution}
				/>

				{features.map((f) => {
					if (!passesGate(roles, f.gate)) return null;

					if (f.type === "point") {
						const ll = pxToLatLng(f.x, f.y, maxZoom);
						return (
							<Marker key={f.id} position={ll} icon={markerIcon}>
								{f.label ? <Tooltip>{f.label}</Tooltip> : null}
							</Marker>
						);
					}

					if (f.type === "path") {
						const latlngs: LatLngExpression[] = f.points.map((p) => {
							const ll = pxToLatLng(p.x, p.y, maxZoom);
							return [ll.lat, ll.lng];
						});
						return (
							<Polyline key={f.id} positions={latlngs}>
								{f.label ? <Tooltip sticky>{f.label}</Tooltip> : null}
							</Polyline>
						);
					}

					if (f.type === "rect") {
						const poly = rectToPolygonLatLngs(
							f.cx,
							f.cy,
							f.width,
							f.height,
							f.rotationDeg,
							maxZoom,
						);
						return (
							<Polygon key={f.id} positions={poly}>
								{f.label ? <Tooltip sticky>{f.label}</Tooltip> : null}
							</Polygon>
						);
					}

					return null;
				})}
			</MapContainer>
		</div>
	);
}