//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/public/PublicContentCard.tsx                                                    ////
//// Language: TSX                                                                                                 ////
//// Shared public content discovery card using the global browse-card and application-icon primitives.           ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE

import type { JSX, ReactNode } from "react";

import { BrowseResultCard, IconVisual } from "@/components/ui";
import type { PublicContentCardDoc } from "@/lib/data/public-content";
import { formatDisplayDate } from "@/lib/helpers/display-format";

function PublicCardMetadata({
	items,
}: {
	items: Array<ReactNode | null | undefined | false>;
}): JSX.Element {
	const visibleItems = items.filter(
		(item): item is ReactNode =>
			item !== null && item !== undefined && item !== false,
	);

	return (
		<span className="public-browse-card-meta">
			{visibleItems.map((item, index) => (
				<span className="public-browse-card-meta__item" key={index}>
					{index > 0 ? (
						<span className="public-browse-card-meta__separator" aria-hidden>
							|
						</span>
					) : null}
					{item}
				</span>
			))}
		</span>
	);
}

export default function PublicContentCard({
	card,
	context,
}: {
	card: PublicContentCardDoc;
	context?: ReactNode;
}): JSX.Element {
	const publishedLabel = formatDisplayDate(card.publishedAt);

	return (
		<BrowseResultCard
			href={card.publicHref}
			className="public-content-browse-card"
			density="standard"
			visual={
				<IconVisual
					iconKey={card.iconKey}
					iconColor={card.iconColor}
					fallback={{ lucideName: "FileText" }}
					mediaRouteScope="app"
					size="card"
					title={card.title}
				/>
			}
			eyebrow={
				<PublicCardMetadata
					items={[card.contentKindLabel, context, publishedLabel]}
				/>
			}
			title={card.title}
			summary={card.summary}
		/>
	);
}

// WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE
