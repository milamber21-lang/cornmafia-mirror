//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/app/riseopedia/sections/page.tsx                                                       ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia sections index route with dynamic search and representative media.                        ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import type { Metadata } from "next";

import RiseopediaSectionsBrowser from "@/components/riseopedia/RiseopediaSectionsBrowser";
import {
	listRiseopediaSections,
	listRiseopediaSectionMediaSamples,
} from "@/lib/data/riseopedia-sections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Riseopedia Sections | Corn Mafia",
};

type SearchParamValue = string | string[] | undefined;

type PageProps = {
	searchParams: Promise<{
		q?: SearchParamValue;
	}>;
};

function firstParam(value: SearchParamValue): string | null {
	const raw = Array.isArray(value) ? value[0] : value;
	const normalized = raw?.trim();
	return normalized && normalized.length > 0 ? normalized : null;
}

export default async function RiseopediaSectionsPage({
	searchParams,
}: PageProps): Promise<JSX.Element> {
	const resolvedSearchParams = await searchParams;
	const [sections, sectionMediaSamples] = await Promise.all([
		listRiseopediaSections(),
		listRiseopediaSectionMediaSamples(),
	]);

	return (
		<RiseopediaSectionsBrowser
			sections={sections}
			sectionMediaSamples={sectionMediaSamples}
			search={firstParam(resolvedSearchParams.q)}
		/>
	);
}
