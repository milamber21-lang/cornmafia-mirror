//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/maps/[map]/page.tsx                                                                   ////
//// Language: TSX                                                                                                ////
//// Server page that loads map overlay data and renders the map viewer.                                          ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import "server-only";
import MapViewer from "@/components/maps/MapViewer";
import type { OverlaysResponse } from "@/components/maps/types";
import { cookies, headers } from "next/headers";
import { getOptionalEnv } from "@/lib/server/env";

async function fetchJSON<T>(url: string): Promise<T> {
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
	return (await res.json()) as T;
}

async function makeAbsolute(pathname: string): Promise<string> {
	const envBase = getOptionalEnv("NEXT_PUBLIC_BASE_URL");
	if (envBase && envBase.length > 0) {
		return `${envBase}${pathname}`;
	}
	const h = await headers();
	const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
	const proto = h.get("x-forwarded-proto") ?? "http";
	return `${proto}://${host}${pathname}`;
}

async function getRoles(): Promise<string[]> {
	const url = await makeAbsolute("/api/me/roles");
	const res = await fetch(url, {
		headers: { cookie: (await cookies()).toString() },
		cache: "no-store",
	});
	if (!res.ok) return [];
	const data = (await res.json()) as unknown;
	if (
		data &&
		typeof data === "object" &&
		"roles" in (data as Record<string, unknown>) &&
		Array.isArray((data as { roles?: unknown[] }).roles)
	) {
		const arr = (data as { roles?: unknown[] }).roles ?? [];
		return arr.filter((v): v is string => typeof v === "string");
	}
	return [];
}

export default async function Page({
	params,
}: {
	params: Promise<{ map: string }>;
}) {
	const { map: mapKey } = await params;

	const overlaysUrl = await makeAbsolute(
		`/api/maps/${encodeURIComponent(mapKey)}/overlays`,
	);

	const [overlays, roles] = await Promise.all([
		fetchJSON<OverlaysResponse>(overlaysUrl),
		getRoles(),
	]);

	return (
		<section className="card card--fill">
			<h1 className="map-page-title">Map: {overlays.manifest.key}</h1>
			<MapViewer
				manifest={overlays.manifest}
				features={overlays.features}
				roles={roles}
			/>
		</section>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
