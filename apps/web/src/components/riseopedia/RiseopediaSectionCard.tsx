//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaSectionCard.tsx                                        ////
//// Language: TSX                                                                                              ////
//// Compatibility section card rendered through the Riseopedia-owned classification card.                       ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import type { JSX } from "react";
import { Database } from "lucide-react";

import RiseopediaClassificationCard from "@/components/riseopedia/RiseopediaClassificationCard";
import type { RiseopediaHubDirectoryCardDoc } from "@/lib/data/riseopedia-hub";
import type {
	RiseopediaSectionDoc,
	RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";
import { buildRiseopediaInfoPath } from "@/lib/helpers/riseopedia-entity-links";

export type RiseopediaSectionCardProps = {
	section: RiseopediaSectionDoc;
	mediaSample: RiseopediaSectionMediaSample | null;
	basePath?: string;
};

function sectionCardDoc(args: RiseopediaSectionCardProps): RiseopediaHubDirectoryCardDoc {
	return {
		id: args.section.id,
		nodeTypeCode: "section",
		code: args.section.code,
		slug: args.section.slug,
		name: args.section.name,
		description: args.section.description,
		href: args.basePath
			? `${args.basePath}/${args.section.slug}`
			: buildRiseopediaInfoPath({ family: "sections", slug: args.section.slug }),
		itemCount: args.section.itemCount,
		assetCount: 0,
		recipeCount: 0,
		sectionCount: 1,
		sortOrder: args.section.sortOrder,
		updatedAt: args.section.updatedAt,
		sampleEntityTypeCode: args.mediaSample?.entityTypeCode ?? null,
		sampleEntityName: args.mediaSample?.entityName ?? null,
		sampleEntitySlug: args.mediaSample?.entitySlug ?? null,
		media: args.mediaSample
			? {
				mediaId: args.mediaSample.media.mediaId,
				url: args.mediaSample.media.url,
				width: args.mediaSample.media.width,
				height: args.mediaSample.media.height,
				mimeType: args.mediaSample.media.mimeType,
			}
			: null,
	};
}

export default function RiseopediaSectionCard({
	section,
	mediaSample,
	basePath,
}: RiseopediaSectionCardProps): JSX.Element {
	return (
		<RiseopediaClassificationCard
			card={sectionCardDoc({ section, mediaSample, basePath })}
			fallbackIcon={Database}
		/>
	);
}
